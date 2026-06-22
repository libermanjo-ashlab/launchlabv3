/**
 * /api/agents — Agent pipeline routes with plan-based gating and autopilot
 */
const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const { runMarketingAgent, runManagementAgent } = require("../services/agents");
const { createSite, deploySite } = require("../services/netlify");
const { runAutopilotIteration } = require("../services/autopilotLoop");
const { getEffectivePlan, canRunMarketing, canImplement, canUseAutopilot } = require("../services/plans");

const prisma = new PrismaClient();
const activityLog   = {};
const autopilotLoops = {}; // businessId -> interval handle

function logActivity(bizId, entry) {
  if (!activityLog[bizId]) activityLog[bizId] = [];
  activityLog[bizId].unshift({ ...entry, timestamp: new Date().toISOString() });
  activityLog[bizId] = activityLog[bizId].slice(0, 30);
}

async function getUsage(bizId) {
  const out = await prisma.businessOutput.findFirst({ where:{ businessId:bizId, type:"usage" } });
  if (!out) return { marketingRuns:0, managementImplements:0 };
  try { return JSON.parse(out.content); } catch { return { marketingRuns:0, managementImplements:0 }; }
}
async function bumpUsage(bizId, key) {
  const usage = await getUsage(bizId);
  usage[key] = (usage[key]||0) + 1;
  const existing = await prisma.businessOutput.findFirst({ where:{ businessId:bizId, type:"usage" } });
  const content = JSON.stringify(usage);
  if (existing) await prisma.businessOutput.update({ where:{ id:existing.id }, data:{ content } });
  else await prisma.businessOutput.create({ data:{ businessId:bizId, type:"usage", title:"Usage tracking", content } });
  return usage;
}

async function getUserMetrics(bizId) {
  const out = await prisma.businessOutput.findFirst({ where:{ businessId:bizId, type:"user_metrics" } });
  if (!out) return { revenue:{this_month:0,last_month:0,total:0}, clients:{active:0,total:0}, leads:{this_month:0,total:0}, social:{instagram:0,tiktok:0,facebook:0,google_reviews:0,google_rating:0}, bookings:{this_week:0,this_month:0} };
  try { return JSON.parse(out.content); } catch { return {}; }
}

async function loadUserAndPlan(userId) {
  const user = await prisma.user.findUnique({ where:{ id:userId } });
  return { user, effective: getEffectivePlan(user) };
}

router.get("/:businessId/activity", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    res.json({ activity: activityLog[req.params.businessId]||[] });
  } catch(e) { next(e); }
});

// GET plan + usage status for a business (used by frontend to show gates)
router.get("/:businessId/access", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    const { user, effective } = await loadUserAndPlan(req.userId);
    const usage = await getUsage(req.params.businessId);
    const marketing  = canRunMarketing(effective, usage);
    const management = canImplement(effective, usage);
    const autopilot   = canUseAutopilot(effective);
    res.json({ effective, usage, marketing, management, autopilot });
  } catch(e) { next(e); }
});

router.post("/:businessId/marketing/run", requireAuth, async (req, res, next) => {
  try {
    const { user, effective } = await loadUserAndPlan(req.userId);
    const usage = await getUsage(req.params.businessId);
    const check = canRunMarketing(effective, usage);
    if (!check.allowed) return res.status(402).json({ error: check.reason, upgradeRequired:true });

    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    let intake = {};
    try { intake = JSON.parse(biz.intakeData||"{}"); } catch {}
    const metrics = await getUserMetrics(req.params.businessId);

    logActivity(req.params.businessId,{ agent:"marketing", action:"Analysis started", detail:"Scanning your business metrics for growth opportunities" });
    const insights = await runMarketingAgent(biz, metrics, intake);
    if (effective.plan === "trial") await bumpUsage(req.params.businessId, "marketingRuns");
    logActivity(req.params.businessId,{ agent:"marketing", action:`Found ${insights.length} insights`, detail:`${insights.filter(i=>i.priority==="high").length} high priority actions identified` });

    res.json({ insights });
  } catch(e) { next(e); }
});

router.post("/:businessId/management/implement", requireAuth, async (req, res, next) => {
  try {
    const { insight } = req.body;
    const { user, effective } = await loadUserAndPlan(req.userId);
    const usage = await getUsage(req.params.businessId);
    const check = canImplement(effective, usage);
    if (!check.allowed) return res.status(402).json({ error: check.reason, upgradeRequired:true });

    if (!process.env.NETLIFY_TOKEN) return res.status(503).json({ error:"NETLIFY_TOKEN not set — add it to your Railway environment variables to enable live website updates" });
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });

    logActivity(req.params.businessId,{ agent:"management", action:"Implementing insight", detail:insight.recommendation?.slice(0,80) });

    const websiteOut = await prisma.businessOutput.findFirst({ where:{ businessId:req.params.businessId, type:"website" } });
    if (!websiteOut) return res.status(400).json({ error:"Generate your website first in the Marketing Agent tab" });

    const { html } = await runManagementAgent(biz, insight, websiteOut.content);
    await prisma.businessOutput.update({ where:{ id:websiteOut.id }, data:{ content:html } });
    logActivity(req.params.businessId,{ agent:"management", action:"Website updated", detail:"New content generated and ready to deploy" });

    const token = process.env.NETLIFY_TOKEN;
    let netlifyIntg = await prisma.integration.findFirst({ where:{ businessId:req.params.businessId, provider:"netlify" } });
    let siteId, siteUrl;
    if (netlifyIntg?.status==="connected" && netlifyIntg.metadata) {
      ({ siteId, siteUrl } = JSON.parse(netlifyIntg.metadata));
    } else {
      logActivity(req.params.businessId,{ agent:"management", action:"Creating your live site", detail:"Provisioning Netlify URL for the first time" });
      const site = await createSite(token, biz.name);
      siteId = site.siteId; siteUrl = site.siteUrl;
      await prisma.integration.upsert({
        where:{ businessId_provider:{ businessId:req.params.businessId, provider:"netlify" } },
        update:{ status:"connected", metadata:JSON.stringify({ siteId, siteUrl }) },
        create:{ businessId:req.params.businessId, provider:"netlify", status:"connected", metadata:JSON.stringify({ siteId, siteUrl }) },
      });
    }

    logActivity(req.params.businessId,{ agent:"management", action:"Deploying to web", detail:`Pushing to ${siteUrl}` });
    const { liveUrl, deployId } = await deploySite(token, siteId, html);
    await prisma.integration.updateMany({ where:{ businessId:req.params.businessId, provider:"netlify" }, data:{ metadata:JSON.stringify({ siteId, siteUrl, liveUrl, deployId, lastDeployed:new Date().toISOString() }) } });
    logActivity(req.params.businessId,{ agent:"management", action:"Live", detail:`Site updated at ${liveUrl}` });

    if (effective.plan === "trial") await bumpUsage(req.params.businessId, "managementImplements");

    res.json({ success:true, liveUrl, deployId });
  } catch(e) { next(e); }
});

router.get("/:businessId/deploy-status", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    const intg = await prisma.integration.findFirst({ where:{ businessId:req.params.businessId, provider:"netlify" } });
    if (!intg||intg.status!=="connected") return res.json({ deployed:false });
    const meta = JSON.parse(intg.metadata||"{}");
    res.json({ deployed:true, ...meta });
  } catch(e) { next(e); }
});

// Admin-only: reset trial usage counters for a business, for repeated QA testing
router.delete("/:businessId/usage", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where:{ id:req.userId } });
    if (!user?.isAdmin) return res.status(403).json({ error:"Not authorized" });
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    await prisma.businessOutput.deleteMany({ where:{ businessId:biz.id, type:"usage" } });
    res.json({ reset:true });
  } catch(e) { next(e); }
});

// ── AUTOPILOT (Autopilot tier only) ───────────────────────────────────────────
const AUTOPILOT_INTERVAL_MS = 10 * 60 * 1000; // base interval — jitter added per business

async function runAutopilotCycle(businessId) {
  try {
    const biz = await prisma.business.findUnique({ where: { id: businessId } });
    if (!biz || !biz.autopilotEnabled) { stopAutopilot(businessId); return; }

    // Re-check plan on every cycle so cancelled subscribers stop immediately
    const { effective } = await loadUserAndPlan(biz.userId);
    if (!canUseAutopilot(effective).allowed) {
      console.log(`[Autopilot] Stopping for business ${businessId} — owner no longer on pro_autopilot plan`);
      await prisma.business.update({ where:{ id:businessId }, data:{ autopilotEnabled:false } });
      stopAutopilot(businessId);
      return;
    }

    logActivity(businessId, { agent: "marketing", action: "Autopilot — observing", detail: "Scheduled check-in: reading metrics and deciding next action" });

    const result = await runAutopilotIteration(biz);

    // Surface the outcome in the activity feed
    const acted = result.results.filter(r => r.status === "done");
    const failed = result.results.filter(r => r.status === "failed");
    if (acted.length === 0 && failed.length === 0) {
      logActivity(businessId, { agent: "management", action: "Autopilot — no action needed", detail: result.assessment });
    } else {
      for (const r of acted)  logActivity(businessId, { agent: "management", action: `Autopilot — updated ${r.channel}`, detail: r.detail });
      for (const r of failed) logActivity(businessId, { agent: "management", action: `Autopilot — skipped ${r.channel}`, detail: r.detail });
    }
  } catch(e) {
    console.error("[Autopilot] cycle error for", businessId, e.message);
    logActivity(businessId, { agent: "management", action: "Autopilot — error", detail: e.message });
  }
}

function startAutopilot(businessId) {
  if (autopilotLoops[businessId]) return;
  // Add up to 60 s of random jitter so all businesses don't slam the Claude API
  // simultaneously when many autopilot accounts are active.
  const jitter = Math.floor(Math.random() * 60_000);
  runAutopilotCycle(businessId); // run once immediately
  autopilotLoops[businessId] = setInterval(() => runAutopilotCycle(businessId), AUTOPILOT_INTERVAL_MS + jitter);
  console.log(`[Autopilot] Started for business ${businessId} (interval ${Math.round((AUTOPILOT_INTERVAL_MS + jitter)/1000)}s)`);
}
function stopAutopilot(businessId) {
  if (autopilotLoops[businessId]) { clearInterval(autopilotLoops[businessId]); delete autopilotLoops[businessId]; console.log(`[Autopilot] Stopped for business ${businessId}`); }
}

router.post("/:businessId/autopilot", requireAuth, async (req, res, next) => {
  try {
    const { enabled } = req.body;
    const { effective } = await loadUserAndPlan(req.userId);
    const check = canUseAutopilot(effective);
    if (enabled && !check.allowed) return res.status(402).json({ error: check.reason, upgradeRequired:true });

    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });

    await prisma.business.update({ where:{ id:biz.id }, data:{ autopilotEnabled: !!enabled } });
    if (enabled) startAutopilot(biz.id); else stopAutopilot(biz.id);

    logActivity(biz.id,{ agent:"management", action: enabled?"Autopilot enabled":"Autopilot disabled", detail: enabled?"Agents will now run automatically on a schedule":"Agents will only run when you trigger them" });
    res.json({ autopilotEnabled: !!enabled });
  } catch(e) { next(e); }
});

router.get("/:businessId/autopilot", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    res.json({ autopilotEnabled: !!biz.autopilotEnabled });
  } catch(e) { next(e); }
});

// Called once at server startup to resume autopilot for any businesses left enabled
async function resumeAllAutopilots() {
  try {
    const businesses = await prisma.business.findMany({ where:{ autopilotEnabled:true } });
    businesses.forEach(b => startAutopilot(b.id));
    if (businesses.length) console.log(`[Autopilot] Resumed ${businesses.length} business(es) on startup`);
  } catch(e) { console.warn("[Autopilot] Resume failed:", e.message); }
}

module.exports = router;
module.exports.resumeAllAutopilots = resumeAllAutopilots;
