const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const { runMarketingAgent, runManagementAgent } = require("../services/agents");
const { createSite, deploySite } = require("../services/netlify");

const prisma = new PrismaClient();
const activityLog = {};

function logActivity(bizId, entry) {
  if (!activityLog[bizId]) activityLog[bizId] = [];
  activityLog[bizId].unshift({ ...entry, timestamp: new Date().toISOString() });
  activityLog[bizId] = activityLog[bizId].slice(0,20);
}

async function getUserMetrics(bizId) {
  const out = await prisma.businessOutput.findFirst({ where:{ businessId:bizId, type:"user_metrics" } });
  if (!out) return { revenue:{this_month:0,last_month:0,total:0}, clients:{active:0,total:0}, leads:{this_month:0,total:0}, social:{instagram:0,tiktok:0,facebook:0,google_reviews:0,google_rating:0}, bookings:{this_week:0,this_month:0} };
  try { return JSON.parse(out.content); } catch { return {}; }
}

router.get("/:businessId/activity", requireAuth, (req, res) => {
  res.json({ activity: activityLog[req.params.businessId]||[] });
});

router.post("/:businessId/marketing/run", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    const intake  = JSON.parse(biz.intakeData||"{}");
    const metrics = await getUserMetrics(req.params.businessId);
    logActivity(req.params.businessId,{ agent:"marketing", action:"Analysis started", detail:"Scanning your business metrics for growth opportunities" });
    const insights = await runMarketingAgent(biz, metrics, intake);
    logActivity(req.params.businessId,{ agent:"marketing", action:`Found ${insights.length} insights`, detail:`${insights.filter(i=>i.priority==="high").length} high priority actions identified` });
    res.json({ insights });
  } catch(e) { next(e); }
});

router.post("/:businessId/management/implement", requireAuth, async (req, res, next) => {
  try {
    const { insight } = req.body;
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

    res.json({ success:true, liveUrl, deployId });
  } catch(e) { next(e); }
});

router.get("/:businessId/deploy-status", requireAuth, async (req, res, next) => {
  try {
    const intg = await prisma.integration.findFirst({ where:{ businessId:req.params.businessId, provider:"netlify" } });
    if (!intg||intg.status!=="connected") return res.json({ deployed:false });
    const meta = JSON.parse(intg.metadata||"{}");
    res.json({ deployed:true, ...meta });
  } catch(e) { next(e); }
});

module.exports = router;
