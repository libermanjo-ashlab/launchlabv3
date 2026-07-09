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
  revenue:     { this_month:0, last_month:0, total:0, sources:[] },
  costs:       { this_month:0, last_month:0, total:0, causes:[] },
  investments: { total_initial:0, total_ongoing:0, initial:[], ongoing:[] },
  clients:     { active:0, total:0, lost_this_month:0 },
  leads:       { this_month:0, total:0, converted:0 },
  social:      { instagram:0, tiktok:0, facebook:0, google_reviews:0, google_rating:0 },
  bookings:    { this_week:0, this_month:0, cancelled:0 },
  activity:    [],
  lastUpdated: null,
};

async function getMetrics(businessId) {
  const out = await prisma.businessOutput.findFirst({
    where: { businessId, type:"user_metrics" },
  });
  if (!out) return { ...DEFAULT_METRICS };
  try {
    const stored = JSON.parse(out.content);
    return {
      ...DEFAULT_METRICS,
      ...stored,
      revenue:     { ...DEFAULT_METRICS.revenue,     ...stored.revenue },
      clients:     { ...DEFAULT_METRICS.clients,     ...stored.clients },
      leads:       { ...DEFAULT_METRICS.leads,       ...stored.leads },
      social:      { ...DEFAULT_METRICS.social,      ...stored.social },
      bookings:    { ...DEFAULT_METRICS.bookings,    ...stored.bookings },
      costs:       { ...DEFAULT_METRICS.costs,       ...stored.costs },
      investments: { ...DEFAULT_METRICS.investments, ...stored.investments },
    };
  } catch { return { ...DEFAULT_METRICS }; }
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
    let idea = {};
    try { idea = JSON.parse(biz.ideaData || "{}"); } catch {}
    const prefs = req.body.prefs || metrics.prefs || {};

    const audienceCtx = prefs.audience === "local"      ? `targeting a local audience near ${biz.location}`
      : prefs.audience === "national"                   ? "targeting a national audience — do not use location-specific phrases"
      : prefs.audience === "global"                     ? "targeting a global / online audience — never use city or location language"
      : prefs.audience === "niche"                      ? `targeting a niche community${prefs.targetMarket?" ("+prefs.targetMarket+")":""}`
      : prefs.targetMarket                              ? `targeting: ${prefs.targetMarket}`
      : `based in ${biz.location}`;

    const stageCtx = prefs.stage === "scaling"          ? "currently scaling up"
      : prefs.stage === "established"                   ? "an established business"
      : prefs.stage === "growing"                       ? "in a growth phase with early clients"
      : "just starting out";

    // If user mentions scaling/global/etc., detect and update prefs
    const q = req.body.question || "";
    const suggestedPrefsUpdate = {};
    if (/\bscal(e|ing)\b/i.test(q))     suggestedPrefsUpdate.stage    = "scaling";
    if (/\bgo(ing)? global\b/i.test(q)) suggestedPrefsUpdate.audience = "global";
    if (/\bnational\b/i.test(q))        suggestedPrefsUpdate.audience = "national";
    if (/\bestablish/i.test(q))         suggestedPrefsUpdate.stage    = "established";

    const msg = await ai.messages.create({
      model:"claude-sonnet-4-6", max_tokens:600,
      messages:[{ role:"user", content:`
You are the management agent for "${biz.name}" (${idea.name||"service business"}, ${stageCtx}, ${audienceCtx}).
Current metrics: revenue $${metrics.revenue?.this_month||0}/mo, ${metrics.clients?.active||0} active clients, ${metrics.leads?.this_month||0} leads this month, ${metrics.social?.instagram||0} Instagram followers.
${prefs.goals ? `Owner goal: ${prefs.goals}` : ""}

The user said: "${q||"What should I focus on this week?"}"

Give a specific, actionable answer in 2-3 sentences. Focus on the most impactful next step. Do not use location-specific phrases unless audience is local. No double quotes or apostrophes.
` }],
    });

    res.json({ suggestion: msg.content[0]?.text||"", prefsUpdate: Object.keys(suggestedPrefsUpdate).length ? suggestedPrefsUpdate : null });
  } catch(e) { next(e); }
});

// POST /api/metrics/:businessId/strategy — generate structured business strategy with Claude
router.post("/:businessId/strategy", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });

    const metrics = await getMetrics(req.params.businessId);
    let idea = {}; try { idea = JSON.parse(biz.ideaData||"{}"); } catch {}
    const prefs = metrics.prefs || {};

    const { timeframe="3 months", correlations=[], snapshots=[] } = req.body;
    const revenueM = metrics.revenue?.this_month||0;
    const cost     = metrics.revenue?.cost||0;
    const profit   = metrics.revenue?.profit||(revenueM - cost);

    const corrText = correlations.length
      ? correlations.map(c=>`${c.aLabel} → ${c.bLabel}: ${c.summary}${c.r!=null?` (r=${c.r})`:""}`)
          .join("; ")
      : "none provided";

    const snapText = snapshots.slice(-4).map(s =>
      `${s.month}: rev=$${s.revenue}, cost=$${s.cost||0}, leads=${s.leads}, clients=${s.clients||0}`
    ).join(" | ") || "no history";

    const msg = await ai.messages.create({
      model:"claude-sonnet-4-6", max_tokens:2400,
      messages:[{ role:"user", content:`
You are the management agent for "${biz.name}" (${idea.name||"service business"}, stage: ${prefs.stage||"starting"}).
Current metrics: revenue $${revenueM}/mo, costs $${cost}/mo, profit $${profit}/mo, ${metrics.clients?.active||0} active clients, ${metrics.leads?.this_month||0} leads/month.
Goal: ${prefs.goals||"grow revenue and client base"}
Trend (last months): ${snapText}
Key correlations: ${corrText}
Strategy timeframe: ${timeframe}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "budget": { "monthly": <integer>, "total": <integer>, "rationale": "<1 sentence specific to this business>" },
  "outreach": { "monthlySpend": <integer>, "suggestions": ["<specific action 1>", "<specific action 2>", "<specific action 3>"] },
  "scaling": { "monthlySpend": <integer>, "suggestions": ["<specific action 1>", "<specific action 2>", "<specific action 3>"] },
  "conservation": { "monthlySavings": <integer>, "actions": ["<specific action 1>", "<specific action 2>", "<specific action 3>"] },
  "building": { "monthlySpend": <integer>, "suggestions": ["<specific action 1>", "<specific action 2>", "<specific action 3>"] },
  "taskSchedule": [
    { "period": "Week 1", "tasks": ["<task>", "<task>", "<task>"] },
    { "period": "Week 2", "tasks": ["<task>", "<task>", "<task>"] },
    { "period": "Week 3-4", "tasks": ["<task>", "<task>", "<task>"] },
    { "period": "Month 2", "tasks": ["<task>", "<task>", "<task>"] },
    { "period": "Month 3+", "tasks": ["<task>", "<task>", "<task>"] }
  ],
  "predictedOutcomes": ["<outcome 1>", "<outcome 2>", "<outcome 3>"]
}
All items must be specific to "${biz.name}" and "${idea.name||"this business type"}". No generic filler.
` }],
    });

    const raw = msg.content[0]?.text || "";
    let strategy;
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      strategy = JSON.parse(m?.[0] || raw);
    } catch {
      return res.status(500).json({ error:"Failed to parse strategy — try again" });
    }

    const content = JSON.stringify({ ...strategy, generatedAt:new Date().toISOString(), timeframe });
    const existing = await prisma.businessOutput.findFirst({ where:{ businessId:req.params.businessId, type:"management_strategy" } });
    if (existing) await prisma.businessOutput.update({ where:{ id:existing.id }, data:{ content } });
    else await prisma.businessOutput.create({ data:{ businessId:req.params.businessId, type:"management_strategy", title:"Business Strategy", content } });

    res.json({ strategy });
  } catch(e) { next(e); }
});

module.exports = router;
