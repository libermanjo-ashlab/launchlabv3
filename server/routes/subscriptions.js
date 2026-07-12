/**
 * /api/subscriptions — Plan info, Stripe checkout, and webhook handling
 */
const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const { PLAN_INFO, TRIAL_LIMITS, getEffectivePlan } = require("../services/plans");
const { sendReceiptEmail } = require("../services/email");

const prisma = new PrismaClient();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw Object.assign(new Error("Payments are not configured yet — add STRIPE_SECRET_KEY to enable upgrades."),{status:503});
  return require("stripe")(process.env.STRIPE_SECRET_KEY);
}

const PRICE_ENV = { starter:"STRIPE_PRICE_STARTER", pro:"STRIPE_PRICE_PRO", pro_autopilot:"STRIPE_PRICE_PRO_AUTOPILOT" };

// GET /api/subscriptions/plans — public plan definitions for pricing page
router.get("/plans", (req, res) => {
  res.json({
    plans: [
      { id:"starter",       ...PLAN_INFO.starter,       features:["Marketing insights & analysis","Revenue & lead tracking","Business planning tools","Email support"] },
      { id:"pro",           ...PLAN_INFO.pro,           features:["Everything in Starter","Management agent implements changes for you","Live website updates on demand","Marketing + Management working together","Priority support"] },
      { id:"pro_autopilot", ...PLAN_INFO.pro_autopilot, features:["Everything in Pro","Agents run automatically on a schedule","No manual input required","Dedicated support"] },
    ],
    trial: { days:7, marketingRuns:TRIAL_LIMITS.marketingRuns, managementImplements:TRIAL_LIMITS.managementImplements },
  });
});

// GET /api/subscriptions/me — current user's plan status
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where:{ id:req.userId } });
    if (!user) return res.status(404).json({ error:"User not found" });
    const effective = getEffectivePlan(user);
    res.json({ ...effective, planInfo: PLAN_INFO[effective.plan]||PLAN_INFO.trial });
  } catch(e) { next(e); }
});

// POST /api/subscriptions/checkout — create a Stripe Checkout session
router.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!PRICE_ENV[planId]) return res.status(400).json({ error:"Invalid plan" });
    const priceId = process.env[PRICE_ENV[planId]];
    if (!priceId) return res.status(503).json({ error:`${PRICE_ENV[planId]} is not configured yet` });

    const stripe = getStripe();
    const user = await prisma.user.findUnique({ where:{ id:req.userId } });

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email:user.email, name:user.name, metadata:{ userId:user.id } });
      customerId = customer.id;
      await prisma.user.update({ where:{ id:user.id }, data:{ stripeCustomerId:customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price:priceId, quantity:1 }],
      success_url: `${process.env.CLIENT_URL}/dashboard?upgraded=1`,
      cancel_url:  `${process.env.CLIENT_URL}/pricing`,
      metadata: { userId:user.id, planId },
    });
    res.json({ url: session.url });
  } catch(e) { next(e); }
});

// POST /api/subscriptions/portal — Stripe billing portal (manage/cancel)
router.post("/portal", requireAuth, async (req, res, next) => {
  try {
    const stripe = getStripe();
    const user = await prisma.user.findUnique({ where:{ id:req.userId } });
    if (!user?.stripeCustomerId) return res.status(400).json({ error:"No billing account found yet" });
    const session = await stripe.billingPortal.sessions.create({ customer:user.stripeCustomerId, return_url:`${process.env.CLIENT_URL}/dashboard` });
    res.json({ url: session.url });
  } catch(e) { next(e); }
});

// POST /api/subscriptions/webhook — Stripe webhook (raw body required, mounted separately)
async function handleWebhook(req, res) {
  try {
    const stripe = getStripe();
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch(e) {
      console.error("[Stripe] Webhook signature verification failed:", e.message);
      return res.status(400).send("Invalid signature");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId  = session.metadata?.userId;
      const planId  = session.metadata?.planId;
      if (userId && planId) {
        const existing = await prisma.user.findUnique({ where:{ id:userId } });
        if (!existing) { console.warn(`[Stripe] checkout.session.completed: user ${userId} not found`); }
        else {
          const updated = await prisma.user.update({ where:{ id:userId }, data:{ plan:planId } });
          console.log(`[Stripe] User ${userId} upgraded to ${planId}`);
          sendReceiptEmail(updated.email, updated.name, planId).catch(e =>
            console.error("[Stripe] Receipt email failed:", e.message)
          );
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const user = await prisma.user.findFirst({ where:{ stripeCustomerId: sub.customer } });
      if (user) {
        // Set trialEndsAt to now so the account is immediately locked (expired trial),
        // but don't use epoch (new Date(0)) — that permanently breaks re-subscription flows.
        await prisma.user.update({ where:{ id:user.id }, data:{ plan:"trial", trialEndsAt: new Date() } });
        console.log(`[Stripe] User ${user.id} subscription cancelled — reverted to expired trial`);
      }
    }

    res.json({ received:true });
  } catch(e) {
    console.error("[Stripe] Webhook error:", e.message);
    res.status(500).json({ error:e.message });
  }
}

module.exports = { router, handleWebhook };
