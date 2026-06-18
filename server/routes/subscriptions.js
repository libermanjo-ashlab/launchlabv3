/**
 * /api/subscriptions — Plan info, Stripe checkout, and webhook handling
 */
const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const { PLAN_INFO, TRIAL_LIMITS, getEffectivePlan } = require("../services/plans");

const prisma = new PrismaClient();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw Object.assign(new Error("Payments are not configured yet — add STRIPE_SECRET_KEY to enable upgrades."),{status:503});
  return require("stripe")(process.env.STRIPE_SECRET_KEY);
}

const PRICE_ENV = { starter:"STRIPE_PRICE_STARTER", active:"STRIPE_PRICE_ACTIVE", autopilot:"STRIPE_PRICE_AUTOPILOT" };

// GET /api/subscriptions/plans — public plan definitions for pricing page
router.get("/plans", (req, res) => {
  res.json({
    plans: [
      { id:"starter",   ...PLAN_INFO.starter,   features:["Marketing agent insights & reports","Manual stat tracking and analysis","Unlimited insight generation","Email support"] },
      { id:"active",    ...PLAN_INFO.active,    features:["Everything in Starter","Management agent implements changes","Live website updates on request","Marketing + Management work together","Priority support"] },
      { id:"autopilot", ...PLAN_INFO.autopilot, features:["Everything in Active","Fully autonomous operation","Agents run on their own schedule","No manual input required","White-glove support"] },
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
        await prisma.user.update({ where:{ id:userId }, data:{ plan:planId } });
        console.log(`[Stripe] User ${userId} upgraded to ${planId}`);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const user = await prisma.user.findFirst({ where:{ stripeCustomerId: sub.customer } });
      if (user) {
        await prisma.user.update({ where:{ id:user.id }, data:{ plan:"trial", trialEndsAt:new Date(0) } });
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
