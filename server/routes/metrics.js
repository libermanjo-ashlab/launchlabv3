/**
 * /api/metrics — User-entered business metrics (management agent data layer)
 * GET  /api/metrics/:businessId        — fetch current metrics
 * PUT  /api/metrics/:businessId        — save updated metrics
 * POST /api/metrics/:businessId/suggest — AI suggests metric updates based on context
 */
const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const Anthropic   = require("@anthropic-ai/sdk");

const prisma = new PrismaClient();
const ai     = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DEFAULT_METRICS = {
  revenue:   { this_month:0, last_month:0, total:0 },
  clients:   { active:0, total:0, lost_this_month:0 },
  leads:     { this_month:0, total:0, converted:0 },
  social:    { instagram:0, tiktok:0, facebook:0, google_reviews:0, google_rating:0 },
  bookings:  { this_week:0, this_month:0, cancelled:0 },
  activity:  [],
  lastUpdated: null,
};

async function getMetrics(businessId) {
  const out = await prisma.businessOutput.findFirst({
    where: { businessId, type:"user_metrics" },
  });
  if (!out) return { ...DEFAULT_METRICS };
  try { return JSON.parse(out.content); } catch { return { ...DEFAULT_METRICS }; }
}

router.get("/:businessId", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    res.json({ metrics: await getMetrics(req.params.businessId) });
  } catch(e) { next(e); }
});

router.put("/:businessId", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });

    const current = await getMetrics(req.params.businessId);
    const updated = { ...current, ...req.body, lastUpdated: new Date().toISOString() };

    const existing = await prisma.businessOutput.findFirst({ where:{ businessId:req.params.businessId, type:"user_metrics" } });
    const content  = JSON.stringify(updated);
    if (existing) await prisma.businessOutput.update({ where:{ id:existing.id }, data:{ content } });
    else           await prisma.businessOutput.create({ data:{ businessId:req.params.businessId, type:"user_metrics", title:"Business Metrics", content } });

    res.json({ metrics: updated });
  } catch(e) { next(e); }
});

router.post("/:businessId/suggest", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });

    const metrics = await getMetrics(req.params.businessId);
    const idea    = JSON.parse(biz.ideaData||"{}");

    const msg = await ai.messages.create({
      model:"claude-sonnet-4-6", max_tokens:600,
      messages:[{ role:"user", content:`
You are the management agent for "${biz.name}" (${idea.name||"service business"} in ${biz.location}).
Current metrics: revenue $${metrics.revenue.this_month}/mo, ${metrics.clients.active} active clients, ${metrics.leads.this_month} leads this month, ${metrics.social.instagram} Instagram followers.

The user asked: "${req.body.question||"What should I focus on this week?"}"

Give a specific, actionable answer in 2-3 sentences. Focus on the most impactful next step. No double quotes or apostrophes.
` }],
    });

    res.json({ suggestion: msg.content[0]?.text||"" });
  } catch(e) { next(e); }
});

module.exports = router;
