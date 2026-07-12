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

function todayKey() { return `tok_${new Date().toISOString().slice(0,10).replace(/-/g,"")}`; }
async function addDailyTokens(bizId, estimate) {
  const key = todayKey();
  const out = await prisma.businessOutput.findFirst({ where:{ businessId:bizId, type:"usage" } });
  const usage = out ? (()=>{ try{ return JSON.parse(out.content); }catch{ return {}; } })() : {};
  usage[key] = (usage[key] || 0) + estimate;
  Object.keys(usage).filter(k => k.startsWith("tok_") && k !== key).forEach(k => delete usage[k]);
  const content = JSON.stringify(usage);
  if (out) await prisma.businessOutput.update({ where:{ id:out.id }, data:{ content } });
  else await prisma.businessOutput.create({ data:{ businessId:bizId, type:"usage", title:"Usage tracking", content } });
}

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

    // ── Accurate financials: sum actual item arrays ────────────────────────────
    const revSources  = metrics.revenue?.sources||[];
    const costCauses  = metrics.costs?.causes||[];
    const invInitial  = metrics.investments?.initial||[];
    const invOngoing  = metrics.investments?.ongoing||[];

    const totalRev  = revSources.reduce((s,x)=>s+(x.amount||0),0) || metrics.revenue?.this_month||0;
    const totalCost = [...costCauses,...invInitial,...invOngoing].reduce((s,x)=>s+(x.amount||0),0)
                      || (metrics.costs?.this_month||0)+(metrics.investments?.total_initial||0)+(metrics.investments?.total_ongoing||0);
    const totalInv  = [...invInitial,...invOngoing].reduce((s,x)=>s+(x.amount||0),0)
                      || (metrics.investments?.total_initial||0)+(metrics.investments?.total_ongoing||0);
    const profit    = totalRev - totalCost;

    const topRevSrcs = [...revSources].sort((a,b)=>(b.amount||0)-(a.amount||0))
      .slice(0,4).map(s=>`${s.name||s.label||"Source"}: $${s.amount||0}`);
    const topCosts   = [...costCauses,...invInitial,...invOngoing].sort((a,b)=>(b.amount||0)-(a.amount||0))
      .slice(0,4).map(c=>`${c.name||c.label||"Cost"}: $${c.amount||0}`);

    // ── Business profile ───────────────────────────────────────────────────────
    const bp      = metrics.businessProfile || {};
    const prods   = (bp.products||[]).slice(0,5).map(p=>`${p.name||""}${p.price?` ($${p.price})`:""}`).filter(Boolean);
    const social  = metrics.social||{};
    const bookings= metrics.bookings||{};

    // ── Stage / audience context ───────────────────────────────────────────────
    const stageCtx    = prefs.stage==="scaling"?"currently scaling up":prefs.stage==="established"?"an established business":prefs.stage==="growing"?"in a growth phase with early clients":"early-stage / just starting";
    const audienceCtx = prefs.audience==="local"?`local market (${biz.location})`:prefs.audience==="national"?"national audience":prefs.audience==="global"?"global / online audience":prefs.targetMarket||biz.location||"local market";

    // ── Connected integrations ─────────────────────────────────────────────────
    const integrations = await prisma.integration.findMany({ where:{ businessId:req.params.businessId, status:"connected" } });
    const connChans    = integrations.map(i=>{
      const f = typeof i.fields==="string"?(()=>{ try{return JSON.parse(i.fields);}catch{return {};} })():i.fields||{};
      return `${i.provider}${f.handle?` @${f.handle}`:f.address?` (${f.address})`:f.bookingUrl?` (${f.bookingUrl})`:""}`;
    });

    // ── Latest marketing analysis ──────────────────────────────────────────────
    const mktgOut  = await prisma.businessOutput.findFirst({ where:{ businessId:req.params.businessId, type:"marketing_insights" } });
    const mktgNote = await prisma.businessOutput.findFirst({ where:{ businessId:req.params.businessId, type:"marketing_notes" } });
    let mktgSummary = "none run yet";
    if (mktgOut?.content) {
      try {
        const md = JSON.parse(mktgOut.content);
        const topRecs = (md.insights||[]).slice(0,4).map(i=>i.title||i.recommendation||"").filter(Boolean).join("; ");
        const summary = md.report?.analysis?.summary || md.overview?.summary || "";
        mktgSummary = [summary, topRecs ? `Top recommendations: ${topRecs}` : ""].filter(Boolean).join(" ");
      } catch { mktgSummary = "available but unreadable"; }
    }
    // Include any management→marketing sync notes as additional context
    const noteContext = mktgNote?.content ? (() => {
      const lines = mktgNote.content.split("\n").filter(l => l.startsWith("[MANAGEMENT → MARKETING]") || l.startsWith("CHANNEL") || l.startsWith("•")).slice(0, 8);
      return lines.length ? lines.join(" | ") : "";
    })() : "";

    // ── Historical trend ───────────────────────────────────────────────────────
    const snapText = snapshots.slice(-4).map(s=>
      `${s.month}: rev=$${s.revenue||0}, costs=$${s.cost||0}, leads=${s.leads||0}, clients=${s.clients||0}`
    ).join(" | ") || "no prior history";

    // ── Correlation data ───────────────────────────────────────────────────────
    const corrText = correlations.length
      ? correlations.map(c=>`${c.aLabel} → ${c.bLabel}: ${c.summary||""}${c.r!=null?` (r=${c.r})`:""}`)
          .filter(Boolean).join("; ")
      : "none";

    // ── Build prompt ───────────────────────────────────────────────────────────
    const contextBlock = [
      `BUSINESS: ${biz.name} | ${idea.name||"service business"} | ${biz.location||""} | ${stageCtx} | audience: ${audienceCtx}`,
      bp.uniqueValueProp                ? `Value proposition: ${bp.uniqueValueProp}`                : "",
      bp.brandVoice                     ? `Brand voice: ${bp.brandVoice}`                           : "",
      prods.length                      ? `Products/services: ${prods.join(", ")}`                  : "",
      prefs.goals                       ? `Owner goal: ${prefs.goals}`                              : "",
      `FINANCIALS (${timeframe}): Revenue $${totalRev.toLocaleString()}, Costs $${totalCost.toLocaleString()}, Investments $${totalInv.toLocaleString()}, Profit ${profit>=0?"$"+profit.toLocaleString():"($"+Math.abs(profit).toLocaleString()+" loss)"}`,
      topRevSrcs.length                 ? `Top revenue sources: ${topRevSrcs.join(" | ")}`          : "",
      topCosts.length                   ? `Top cost items: ${topCosts.join(" | ")}`                 : "",
      `PIPELINE: ${metrics.leads?.total||0} total leads, ${metrics.clients?.active||0} active clients, ${bookings.this_month||0} bookings this month`,
      social.instagram||social.tiktok||social.twitter_followers
        ? `Social: ${[social.instagram?`Instagram ${social.instagram}`:social.instagram_followers?`Instagram ${social.instagram_followers}`:"",social.tiktok?`TikTok ${social.tiktok}`:social.tiktok_followers?`TikTok ${social.tiktok_followers}`:"",social.twitter_followers?`Twitter ${social.twitter_followers}`:""].filter(Boolean).join(", ")}`
        : "",
      connChans.length                  ? `Connected channels: ${connChans.join(", ")}`             : "Connected channels: none yet",
      `TREND (recent months): ${snapText}`,
      `CORRELATIONS: ${corrText}`,
      `MARKETING ANALYSIS: ${mktgSummary}`,
      noteContext                       ? `Prior strategy notes: ${noteContext}`                     : "",
    ].filter(Boolean).join("\n");

    const msg = await ai.messages.create({
      model:"claude-sonnet-4-6", max_tokens:2800,
      messages:[{ role:"user", content:`You are the management agent for "${biz.name}". Generate a ${timeframe} business strategy grounded entirely in the real data below. Every suggestion must reference the actual products, channels, numbers, and goals shown. No generic filler.

${contextBlock}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "budget": { "monthly": <integer>, "total": <integer>, "rationale": "<1 sentence citing actual revenue/cost figures>" },
  "outreach": { "monthlySpend": <integer>, "suggestions": ["<specific action citing a real channel or metric>", "<specific action>", "<specific action>"] },
  "scaling": { "monthlySpend": <integer>, "suggestions": ["<specific action citing products/services or current client base>", "<specific action>", "<specific action>"] },
  "conservation": { "monthlySavings": <integer>, "actions": ["<specific cost item to reduce or eliminate>", "<specific action>", "<specific action>"] },
  "building": { "monthlySpend": <integer>, "suggestions": ["<specific asset or system to build>", "<specific action>", "<specific action>"] },
  "taskSchedule": [
    { "period": "Week 1", "tasks": ["<specific task>", "<specific task>", "<specific task>"] },
    { "period": "Week 2", "tasks": ["<specific task>", "<specific task>", "<specific task>"] },
    { "period": "Week 3-4", "tasks": ["<specific task>", "<specific task>", "<specific task>"] },
    { "period": "Month 2", "tasks": ["<specific task>", "<specific task>", "<specific task>"] },
    { "period": "Month 3+", "tasks": ["<specific task>", "<specific task>", "<specific task>"] }
  ],
  "predictedOutcomes": ["<measurable outcome with a specific number>", "<outcome>", "<outcome>"]
}` }],
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

    await addDailyTokens(req.params.businessId, 4000);
    res.json({ strategy });
  } catch(e) { next(e); }
});

module.exports = router;
