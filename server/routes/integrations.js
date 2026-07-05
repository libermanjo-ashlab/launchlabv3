const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const jwt         = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// GET /api/integrations/:businessId — list integration status
router.get("/:businessId", requireAuth, async (req, res, next) => {
  try {
    const business = await prisma.business.findFirst({ where: { id: req.params.businessId, userId: req.userId } });
    if (!business) return res.status(404).json({ error: "Business not found" });
    const integrations = await prisma.integration.findMany({ where: { businessId: req.params.businessId } });
    res.json({ integrations });
  } catch (e) { next(e); }
});

// POST /api/integrations/:businessId/stripe — initiate Stripe Connect
router.post("/:businessId/stripe", requireAuth, async (req, res, next) => {
  try {
    const business = await prisma.business.findFirst({ where: { id: req.params.businessId, userId: req.userId } });
    if (!business) return res.status(404).json({ error: "Business not found" });

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: "Stripe not configured. Add STRIPE_SECRET_KEY to .env" });
    }
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const account = await stripe.accounts.create({ type: "express" });

    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.CLIENT_URL}/hub/${req.params.businessId}?tab=settings`,
      return_url:  `${process.env.CLIENT_URL}/hub/${req.params.businessId}?tab=settings&stripe=connected`,
      type: "account_onboarding",
    });

    await prisma.integration.upsert({
      where: { businessId_provider: { businessId: req.params.businessId, provider: "stripe" } },
      update: { metadata: JSON.stringify({ accountId: account.id }), status: "pending" },
      create: { businessId: req.params.businessId, provider: "stripe", status: "pending", metadata: JSON.stringify({ accountId: account.id }) },
    });

    res.json({ url: link.url });
  } catch (e) { next(e); }
});

// PUT /api/integrations/:businessId/:provider — save user-provided metadata fields
router.put("/:businessId/:provider", requireAuth, async (req, res, next) => {
  try {
    const business = await prisma.business.findFirst({ where: { id: req.params.businessId, userId: req.userId } });
    if (!business) return res.status(404).json({ error: "Business not found" });
    const { fields } = req.body;
    const existing = await prisma.integration.findFirst({ where: { businessId: req.params.businessId, provider: req.params.provider } });
    const meta = { ...(existing?.metadata ? JSON.parse(existing.metadata) : {}), ...fields };
    const intg = await prisma.integration.upsert({
      where: { businessId_provider: { businessId: req.params.businessId, provider: req.params.provider } },
      update: { metadata: JSON.stringify(meta) },
      create: { businessId: req.params.businessId, provider: req.params.provider, status: "manual", metadata: JSON.stringify(meta) },
    });
    res.json({ integration: intg });
  } catch (e) { next(e); }
});

// POST /api/integrations/:businessId/:provider/disconnect
router.post("/:businessId/:provider/disconnect", requireAuth, async (req, res, next) => {
  try {
    const business = await prisma.business.findFirst({ where: { id: req.params.businessId, userId: req.userId } });
    if (!business) return res.status(404).json({ error: "Business not found" });

    await prisma.integration.updateMany({
      where: { businessId: req.params.businessId, provider: req.params.provider },
      data: { status: "disconnected", accessToken: null, refreshToken: null },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── GOOGLE OAUTH ──────────────────────────────────────────────────────────────
// GET /api/integrations/google/auth?businessId=xxx
// Signs a short-lived JWT containing userId+businessId as the OAuth state
// parameter so the callback can verify ownership without needing a session.
router.get("/google/auth", requireAuth, (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: "Google OAuth not configured. Add GOOGLE_CLIENT_ID to .env" });
  }
  const businessId = req.query.businessId || "";
  // Sign state with JWT_SECRET — expires in 10 min (longer than any real OAuth flow)
  const state = jwt.sign({ userId: req.userId, businessId }, process.env.JWT_SECRET, { expiresIn: "10m" });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id",     process.env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri",  process.env.GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope",         "https://www.googleapis.com/auth/business.manage email profile");
  url.searchParams.set("state",         state);
  res.json({ url: url.toString() });
});

// GET /api/integrations/google/callback
// Verifies the signed state before writing tokens — prevents a forged state
// from writing someone else's Google tokens onto a victim's business.
router.get("/google/callback", async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.redirect(`${process.env.CLIENT_URL}?error=google_auth_failed`);

    // Verify the signed state and extract userId + businessId
    let userId, businessId;
    try {
      const payload = jwt.verify(state, process.env.JWT_SECRET);
      userId     = payload.userId;
      businessId = payload.businessId;
    } catch {
      return res.redirect(`${process.env.CLIENT_URL}?error=invalid_oauth_state`);
    }

    // Confirm the business still belongs to this user
    const biz = await prisma.business.findFirst({ where: { id: businessId, userId } });
    if (!biz) return res.redirect(`${process.env.CLIENT_URL}?error=business_not_found`);

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI, grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error_description || "Google token exchange failed");

    await prisma.integration.upsert({
      where:  { businessId_provider: { businessId, provider: "google" } },
      update: { status: "connected", accessToken: tokens.access_token, refreshToken: tokens.refresh_token || null },
      create: { businessId, provider: "google", status: "connected", accessToken: tokens.access_token, refreshToken: tokens.refresh_token || null },
    });

    res.redirect(`${process.env.CLIENT_URL}/hub/${businessId}?tab=settings&google=connected`);
  } catch (e) { next(e); }
});

module.exports = router;
