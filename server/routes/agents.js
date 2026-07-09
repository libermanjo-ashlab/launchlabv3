/**
 * /api/agents — Agent pipeline routes with plan-based gating and autopilot
 */
const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const { runMarketingAgent, runManagementAgent } = require("../services/agents");
const { runEnhancedMarketingAgent, runBasicOverview, generateChannelContent } = require("../services/marketingAgent");
const { createSite, deploySite } = require("../services/netlify");
const { runAutopilotIteration } = require("../services/autopilotLoop");
const { getEffectivePlan, canRunMarketing, canImplement, canUseAutopilot } = require("../services/plans");
const { getBrandIdentity, saveBrandIdentity, bootstrapFromIdea, populateAndSave } = require("../services/brandIdentity");
const openaiSvc = require("../services/openaiService");
const log       = require("../lib/logger");

const prisma = new PrismaClient();
const activityLog   = {};
const autopilotLoops = {}; // businessId -> interval handle

function logActivity(bizId, entry) {
  if (!activityLog[bizId]) activityLog[bizId] = [];
  activityLog[bizId].unshift({ ...entry, timestamp: new Date().toISOString() });
  activityLog[bizId] = activityLog[bizId].slice(0, 30);
}

// ── Daily token budget ────────────────────────────────────────────────────────
const DAILY_TOKEN_LIMITS = { trial:20000, starter:20000, active:50000, autopilot:110000, pro:110000 };
// Conservative per-operation estimates (actual usage varies; estimates err high for safety)
const TOKEN_EST = { marketing_full:12000, marketing_basic:800, campaign_breakdown:2500, task_run:1500, implement:1800 };

function todayKey() { return `tok_${new Date().toISOString().slice(0,10)}`; }

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
async function getDailyTokens(bizId) {
  const usage = await getUsage(bizId);
  return usage[todayKey()] || 0;
}
async function addDailyTokens(bizId, estimate) {
  const key = todayKey();
  const usage = await getUsage(bizId);
  usage[key] = (usage[key] || 0) + estimate;
  // Purge stale daily keys (anything not today)
  Object.keys(usage).filter(k => k.startsWith("tok_") && k !== key).forEach(k => delete usage[k]);
  const existing = await prisma.businessOutput.findFirst({ where:{ businessId:bizId, type:"usage" } });
  const content = JSON.stringify(usage);
  if (existing) await prisma.businessOutput.update({ where:{ id:existing.id }, data:{ content } });
  else await prisma.businessOutput.create({ data:{ businessId:bizId, type:"usage", title:"Usage tracking", content } });
}
function tokenBudget(plan, used) {
  const limit = DAILY_TOKEN_LIMITS[plan] || DAILY_TOKEN_LIMITS.starter;
  return { used, limit, remaining: Math.max(0, limit - used), pct: Math.min(100, Math.round(used / limit * 100)) };
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
    const dailyUsed   = await getDailyTokens(req.params.businessId);
    res.json({ effective, usage, marketing, management, autopilot, tokenBudget: tokenBudget(effective.plan, dailyUsed) });
  } catch(e) { next(e); }
});

// GET saved marketing insights (persisted from last run)
router.get("/:businessId/marketing/insights", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    const out = await prisma.businessOutput.findFirst({ where:{ businessId:req.params.businessId, type:"marketing_insights" } });
    if (!out) return res.json({ insights:[], report:null, overview:null, ranAt:null, mode:null });
    try {
      const d = JSON.parse(out.content);
      return res.json({ insights: d.insights||[], report: d.report||null, overview: d.overview||null, ranAt: d.ranAt||null, mode: d.mode||null });
    }
    catch { return res.json({ insights:[], report:null, overview:null, ranAt:null, mode:null }); }
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

    const { mode } = req.body;

    // Token budget check
    const dailyUsed  = await getDailyTokens(req.params.businessId);
    const tokenLimit = DAILY_TOKEN_LIMITS[effective.plan] || DAILY_TOKEN_LIMITS.starter;
    const estimate   = mode === "manual" ? TOKEN_EST.marketing_basic : TOKEN_EST.marketing_full;
    if (dailyUsed + estimate > tokenLimit) {
      return res.status(429).json({
        error: `Daily insights limit reached on the ${effective.plan} plan. Resets at midnight UTC.`,
        tokenLimitReached: true,
        tokenBudget: tokenBudget(effective.plan, dailyUsed),
      });
    }

    let intake = {};
    try { intake = JSON.parse(biz.intakeData||"{}"); } catch {}
    const metrics = await getUserMetrics(req.params.businessId);
    const integrations = await prisma.integration.findMany({ where:{ businessId:req.params.businessId } });

    logActivity(req.params.businessId,{ agent:"marketing", action:"Analysis started", detail:"Scanning your business metrics and channels for growth opportunities" });

    let reportData;

    if (mode === "manual") {
      // Manual mode: basic overview only, no deep AI analysis
      const overview = await runBasicOverview(biz, metrics, integrations);
      reportData = { insights:[], overview, ranAt:new Date().toISOString(), mode:"manual" };
      await addDailyTokens(req.params.businessId, TOKEN_EST.marketing_basic);
      logActivity(req.params.businessId,{ agent:"marketing", action:"Basic overview generated", detail:"Channel stats and general tips ready" });
    } else {
      // Guided/Auto: full enhanced report
      const report = await runEnhancedMarketingAgent(biz, metrics, intake, integrations);
      const insights = (report.suggestions || []).map(s => ({
        id: s.id,
        type: s.channel,
        priority: s.priority,
        agentObservation: s.rationale,
        recommendation: s.title,
        expectedImpact: s.expectedImpact,
        implementationChannel: s.channel,
        managementAction: s.title,
        estimatedMinutes: s.estimatedMinutes,
        tasks: s.tasks,
        contentPreview: s.contentPreview,
      }));
      reportData = { insights, report, ranAt:new Date().toISOString(), mode: mode || "guided" };
      await addDailyTokens(req.params.businessId, TOKEN_EST.marketing_full);
      if (effective.plan === "trial") await bumpUsage(req.params.businessId, "marketingRuns");
      logActivity(req.params.businessId,{ agent:"marketing", action:`Found ${insights.length} insights`, detail:`${insights.filter(i=>i.priority==="high").length} high priority, market analysis ready` });
    }

    // Persist report so it survives page navigation
    const content = JSON.stringify(reportData);
    const existing = await prisma.businessOutput.findFirst({ where:{ businessId:req.params.businessId, type:"marketing_insights" } });
    if (existing) await prisma.businessOutput.update({ where:{ id:existing.id }, data:{ content } });
    else await prisma.businessOutput.create({ data:{ businessId:req.params.businessId, type:"marketing_insights", title:"Marketing Analysis", content } });

    // Auto-populate brand identity in guided/auto mode (non-blocking)
    // Reuse integrations and metrics already loaded above — no extra DB round trips
    if (mode !== "manual" && process.env.OPENAI_API_KEY) {
      populateAndSave(req.params.businessId, biz, JSON.parse(biz.ideaData||"{}"), integrations, metrics, reportData.report||null)
        .catch(() => {}); // non-blocking, best-effort
    }

    res.json(reportData);
  } catch(e) { next(e); }
});

router.post("/:businessId/management/implement", requireAuth, async (req, res, next) => {
  try {
    const { insight, mode } = req.body;
    const { user, effective } = await loadUserAndPlan(req.userId);
    const usage = await getUsage(req.params.businessId);
    const check = canImplement(effective, usage);
    if (!check.allowed) return res.status(402).json({ error: check.reason, upgradeRequired:true });

    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });

    logActivity(req.params.businessId,{ agent:"management", action:"Implementing insight", detail:insight.recommendation?.slice(0,80) });

    const isWebsiteInsight = insight.type === "website" || insight.implementationChannel === "website";

    if (isWebsiteInsight) {
      // Website deploy path — requires Netlify token and a generated website
      if (!process.env.NETLIFY_TOKEN) return res.status(503).json({ error:"NETLIFY_TOKEN not configured — add it to Railway environment variables to deploy website changes" });
      const websiteOut = await prisma.businessOutput.findFirst({ where:{ businessId:req.params.businessId, type:"website" } });
      if (!websiteOut) return res.status(400).json({ error:"Generate your website in the Tasks tab first, then implement this insight." });

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
      logActivity(req.params.businessId,{ agent:"management", action:"Site live", detail:`Updated at ${liveUrl}` });

      if (effective.plan === "trial") await bumpUsage(req.params.businessId, "managementImplements");
      return res.json({ success:true, liveUrl, deployId });
    }

    // Non-website channels — route to channel-specific handlers
    const channelLabel = insight.implementationChannel || insight.type || "channel";
    logActivity(req.params.businessId,{ agent:"management", action:`${channelLabel} action starting`, detail: insight.recommendation?.slice(0,100) });

    if (channelLabel === "instagram") {
      const ig = require("../services/instagram");
      const intg = await prisma.integration.findFirst({ where:{ businessId:req.params.businessId, provider:"instagram" } });
      const meta = intg?.metadata ? JSON.parse(intg.metadata) : {};

      log.info("IMPLEMENT", "Instagram implement route entered", {
        businessId: req.params.businessId,
        businessName: biz.name,
        hasAccessToken: !!meta.accessToken,
        hasBusinessAccountId: !!meta.businessAccountId,
        mode,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      });

      if (!meta.accessToken || !meta.businessAccountId) {
        log.warn("IMPLEMENT", "Instagram not configured — returning setup message", { businessId: req.params.businessId });
        logActivity(req.params.businessId,{ agent:"management", action:"Instagram not configured", detail:"Add Access Token and Business Account ID in Hub → Instagram" });
        return res.json({ success:true, channel:"instagram", actionPlan: insight.recommendation, needsSetup:true, message:"Instagram credentials not set. Add your Access Token and Business Account ID in Hub → Instagram to enable automatic posting." });
      }

      // Use agent mode from request; fall back to integration's autopilot flag
      const igAutopilot = mode === "auto" || (mode !== "guided" && mode !== "manual" && !!(meta.autopilot));
      log.info("IMPLEMENT", "Autopilot mode resolved", { mode, igAutopilot, metaAutopilot: !!meta.autopilot });

      // Load brand identity + business context
      let idea2 = {}; try { idea2 = JSON.parse(biz.ideaData||"{}"); } catch {}
      const brandId2  = await getBrandIdentity(req.params.businessId);
      log.info("IMPLEMENT", "Brand identity loaded", {
        businessId: req.params.businessId,
        found: !!brandId2,
        populatedBy: brandId2?.populatedBy || "none",
        hasVoice: !!brandId2?.voice,
        hasPalette: !!brandId2?.colorPalette,
        businessType: brandId2?.businessType || "(missing)",
      });

      const marketOut2= await prisma.businessOutput.findFirst({ where:{ businessId:req.params.businessId, type:"marketing_insights" } });
      let marketInsights2 = ""; try { const md=JSON.parse(marketOut2?.content||"{}"); marketInsights2=(md.report?.marketAnalysis?.summary||md.overview?.summary||""); } catch {}
      log.info("IMPLEMENT", "Market insights loaded", {
        found: !!marketOut2,
        insightsLen: marketInsights2.length,
      });

      const context2 = insight.recommendation || insight.agentObservation;

      // Caption via OpenAI (GPT-4o), fallback to Claude
      let captionResult;
      if (process.env.OPENAI_API_KEY) {
        log.info("IMPLEMENT", "Generating caption via OpenAI", { contextSnippet: context2?.slice(0, 80) });
        try {
          captionResult = await openaiSvc.generateInstagramCaption({ businessName:biz.name, businessType:idea2.name, context:context2, brandIdentity:brandId2, marketInsights:marketInsights2 });
          log.info("IMPLEMENT", "OpenAI caption ready", { bodyLen: captionResult.body?.length });
        } catch (captionErr) {
          log.error("IMPLEMENT", "OpenAI caption FAILED — falling back to Claude", { error: captionErr.message });
          captionResult = await ig.generateCaption(biz.name, idea2.name, context2, "authentic", {});
          log.info("IMPLEMENT", "Claude fallback caption generated");
        }
      } else {
        log.warn("IMPLEMENT", "OPENAI_API_KEY not set — using Claude for caption");
        captionResult = await ig.generateCaption(biz.name, idea2.name, context2, "authentic", {});
        log.info("IMPLEMENT", "Claude caption generated");
      }
      logActivity(req.params.businessId,{ agent:"management", action:"Caption generated", detail:captionResult.body?.slice(0,80) });

      // Image via DALL-E 3 (fallback to SVG if no OpenAI key)
      const imgGen = require("../services/imageGen");
      const appUrl = log.getAppUrl();
      log.info("IMPLEMENT", "Image generation starting", {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        appUrl,
        appUrlSource: process.env.APP_URL ? "APP_URL" : process.env.CLIENT_URL ? "CLIENT_URL" : "default localhost",
      });

      let generatedImageUrl;
      let imageSource;
      if (process.env.OPENAI_API_KEY) {
        try {
          const { buf: imgBuf, model: imgModel } = await openaiSvc.generatePostImage(biz.name, captionResult.body, brandId2);
          const imageId = imgGen.storeImage(imgBuf);
          generatedImageUrl = `${appUrl}/api/instagram/images/${imageId}`;
          imageSource = imgModel;
          log.info("IMPLEMENT", "Image generated and stored", { model: imgModel, imageId, generatedImageUrl });
        } catch (imgErr) {
          log.error("IMPLEMENT", "Image generation failed — using SVG fallback", { error: imgErr.message, status: imgErr.status });
          const imageId = await imgGen.generatePostImage(biz.name, context2);
          generatedImageUrl = `${appUrl}/api/instagram/images/${imageId}`;
          imageSource = "svg_fallback";
          log.info("IMPLEMENT", "SVG fallback image stored", { imageId, generatedImageUrl });
        }
      } else {
        log.warn("IMPLEMENT", "No OPENAI_API_KEY — SVG background only (no text)");
        const imageId = await imgGen.generatePostImage(biz.name, context2);
        generatedImageUrl = `${appUrl}/api/instagram/images/${imageId}`;
        imageSource = "svg_no_openai";
        log.info("IMPLEMENT", "SVG image stored", { imageId, generatedImageUrl });
      }

      const igResult = {
        success:true, channel:"instagram",
        caption:captionResult.caption, body:captionResult.body, hashtags:captionResult.hashtags,
        imageUrl:generatedImageUrl, imageSource, autopilot:igAutopilot,
      };

      if (igAutopilot) {
        log.info("IMPLEMENT", "Autopilot ON — posting to Instagram", { generatedImageUrl });
        try {
          const postResult = await ig.createImagePost(meta.accessToken, meta.businessAccountId, generatedImageUrl, captionResult.caption);
          igResult.published = true;
          igResult.mediaId = postResult.mediaId;
          igResult.permalink = `https://www.instagram.com/p/${postResult.mediaId}/`;
          log.info("IMPLEMENT", "Instagram post PUBLISHED", { mediaId: postResult.mediaId });
          logActivity(req.params.businessId,{ agent:"management", action:"Posted to Instagram", detail:`Published: ${captionResult.body?.slice(0,60)}` });
        } catch(postErr) {
          igResult.published = false;
          igResult.postError = postErr.friendlyMessage || postErr.message;
          log.error("IMPLEMENT", "Instagram post FAILED", {
            error: postErr.friendlyMessage || postErr.message,
            igCode: postErr.igCode,
            permissionError: postErr.permissionError,
            tokenExpired: postErr.tokenExpired,
          });
          logActivity(req.params.businessId,{ agent:"management", action:"Instagram post failed", detail: postErr.friendlyMessage||postErr.message });
        }
      } else {
        igResult.message = "Caption and image generated. Review and publish when ready.";
        log.info("IMPLEMENT", "Non-autopilot — returning content for review", { imageSource, captionLen: captionResult.caption?.length });
      }

      if (effective.plan === "trial") await bumpUsage(req.params.businessId, "managementImplements");
      return res.json(igResult);
    }

    // ── Twitter/X ────────────────────────────────────────────────────────────
    if (channelLabel === "twitter") {
      const twIntg = await prisma.integration.findFirst({ where:{ businessId:req.params.businessId, provider:"twitter" } });
      const twMeta = twIntg?.metadata ? JSON.parse(twIntg.metadata) : {};
      if (!twMeta.accessToken || !twMeta.apiKey) {
        return res.json({ success:true, channel:"twitter", actionPlan: insight.recommendation, needsSetup:true,
          message:"X / Twitter not connected. Add your API Key, API Key Secret, Access Token, and Access Token Secret in Hub → X / Twitter." });
      }
      const brandId = await getBrandIdentity(req.params.businessId);
      const tweetText = await openaiSvc.generateChannelCaption({
        businessName: biz.name, channel: "twitter", context: insight.recommendation, brandIdentity: brandId,
      });
      // Generate visual for Twitter post
      let twitterImageUrl = null, twitterImageSource = null;
      if (process.env.OPENAI_API_KEY) {
        try {
          const imgGen = require("../services/imageGen");
          const appUrl = log.getAppUrl();
          const { buf: imgBuf, model: imgModel } = await openaiSvc.generatePostImage(biz.name, tweetText, brandId);
          twitterImageUrl = `${appUrl}/api/instagram/images/${imgGen.storeImage(imgBuf)}`;
          twitterImageSource = imgModel;
        } catch(imgErr) {
          log.warn("IMPLEMENT", "Twitter image gen failed", { error: imgErr.message });
        }
      }
      const tw = require("../services/twitter");
      const tweet = await tw.postTweet(twMeta, tweetText.slice(0, 280));
      logActivity(req.params.businessId,{ agent:"management", action:"Tweet posted", detail:`@${twMeta.username}: "${tweetText.slice(0,60)}…"` });
      return res.json({ success:true, channel:"twitter", caption:tweetText, body:tweetText, published:true,
        imageUrl: twitterImageUrl, imageSource: twitterImageSource,
        permalink:`https://x.com/i/web/status/${tweet.id}` });
    }

    // ── TikTok ───────────────────────────────────────────────────────────────
    if (channelLabel === "tiktok") {
      const ttIntg = await prisma.integration.findFirst({ where:{ businessId:req.params.businessId, provider:"tiktok" } });
      const ttMeta = ttIntg?.metadata ? JSON.parse(ttIntg.metadata) : {};
      const brandId = await getBrandIdentity(req.params.businessId);
      const tiktokText = await openaiSvc.generateChannelCaption({
        businessName: biz.name, channel: "tiktok", context: insight.recommendation, brandIdentity: brandId,
      });
      // Generate visual for TikTok (slideshow image)
      let tiktokImageUrl = null, tiktokImageSource = null;
      if (process.env.OPENAI_API_KEY) {
        try {
          const imgGen = require("../services/imageGen");
          const appUrl = log.getAppUrl();
          const { buf: imgBuf, model: imgModel } = await openaiSvc.generatePostImage(biz.name, tiktokText, brandId);
          tiktokImageUrl = `${appUrl}/api/instagram/images/${imgGen.storeImage(imgBuf)}`;
          tiktokImageSource = imgModel;
        } catch(imgErr) {
          log.warn("IMPLEMENT", "TikTok image gen failed", { error: imgErr.message });
        }
      }
      if (!ttMeta.accessToken) {
        return res.json({ success:true, channel:"tiktok", caption:tiktokText, body:tiktokText,
          imageUrl: tiktokImageUrl, imageSource: tiktokImageSource, needsSetup:true,
          message:"TikTok not connected. Connect in Hub → TikTok. Content generated below — download and post in TikTok app." });
      }
      // TikTok photo post via API
      const tt = require("../services/tiktok");
      if (tiktokImageUrl) {
        try {
          await tt.postPhoto(ttMeta, [tiktokImageUrl], tiktokText);
          return res.json({ success:true, channel:"tiktok", caption:tiktokText, body:tiktokText,
            imageUrl: tiktokImageUrl, imageSource: tiktokImageSource, published:true });
        } catch(ttErr) {
          log.warn("IMPLEMENT", "TikTok post failed — returning content only", { error: ttErr.message });
        }
      }
      return res.json({ success:true, channel:"tiktok", caption:tiktokText, body:tiktokText,
        imageUrl: tiktokImageUrl, imageSource: tiktokImageSource,
        actionPlan:"Use the Content Lab slideshow builder to create your TikTok video, then post via the TikTok app." });
    }

    // ── Email ────────────────────────────────────────────────────────────────
    if (channelLabel === "email") {
      const emIntg = await prisma.integration.findFirst({ where:{ businessId:req.params.businessId, provider:"email" } });
      const emMeta = emIntg?.metadata ? JSON.parse(emIntg.metadata) : {};
      const brandId = await getBrandIdentity(req.params.businessId);
      const emailText = await openaiSvc.generateChannelCaption({
        businessName: biz.name, channel: "email", context: insight.recommendation, brandIdentity: brandId,
      });
      const lines = emailText.split("\n").filter(l => l.trim());
      const subjectLine = lines.find(l => /^subject:/i.test(l));
      const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i,"").trim() : `${biz.name} — Newsletter`;
      const body = lines.filter(l => !/^subject:/i.test(l)).join("\n").trim();

      if (emMeta.apiKey && emMeta.provider && mode === "auto") {
        const { sendEmail } = require("../services/emailChannel");
        const sendResult = await sendEmail({
          provider: emMeta.provider, apiKey: emMeta.apiKey,
          fromEmail: emMeta.address, fromName: biz.name,
          to: emMeta.address, subject, body,
        });
        if (sendResult.sent) {
          logActivity(req.params.businessId,{ agent:"management", action:"Email sent", detail:`Subject: ${subject}` });
          return res.json({ success:true, channel:"email", caption:emailText, body, subject, published:true });
        }
      }
      return res.json({ success:true, channel:"email", caption:emailText, body, subject,
        actionPlan:`Email draft ready. Subject: "${subject}" — copy and send via ${emMeta.provider || "your email provider"}.` });
    }

    // ── Website (WordPress) ──────────────────────────────────────────────────
    if (channelLabel === "website" || channelLabel === "web") {
      const webIntg = await prisma.integration.findFirst({ where:{ businessId:req.params.businessId, provider:"website" } });
      const webMeta = webIntg?.metadata ? JSON.parse(webIntg.metadata) : {};
      const brandId = await getBrandIdentity(req.params.businessId);
      const webText = await openaiSvc.generateChannelCaption({
        businessName: biz.name, channel: "website", context: insight.recommendation, brandIdentity: brandId,
      });
      if (webMeta.siteUrl && webMeta.wpUsername && webMeta.wpAppPassword) {
        const wp = require("../services/wordpress");
        const post = await wp.createPost(webMeta.siteUrl, webMeta.wpUsername, webMeta.wpAppPassword, {
          title: insight.title || `${biz.name} Update`,
          content: `<p>${webText}</p>`,
          status: mode === "auto" ? "publish" : "draft",
        });
        const postUrl = post.link || webMeta.siteUrl;
        logActivity(req.params.businessId,{ agent:"management", action:"WordPress post created", detail:postUrl });
        return res.json({ success:true, channel:"website", caption:webText, body:webText,
          published: mode === "auto", liveUrl: mode === "auto" ? postUrl : undefined,
          actionPlan: mode !== "auto" ? `Draft created in WordPress — review and publish at ${webMeta.siteUrl}` : undefined });
      }
      return res.json({ success:true, channel:"website", caption:webText, body:webText,
        actionPlan:`Website content ready. Copy and update your site at ${webMeta.siteUrl || webMeta.liveUrl || "your website"}.` });
    }

    // ── Visual channels (LinkedIn, Google, Facebook, general) — generate image + caption
    const VISUAL_FALLBACK = new Set(["linkedin","google","facebook","general"]);
    if (VISUAL_FALLBACK.has(channelLabel)) {
      const brandId = await getBrandIdentity(req.params.businessId);
      const captionText = await openaiSvc.generateChannelCaption({
        businessName: biz.name, channel: channelLabel, context: insight.recommendation, brandIdentity: brandId,
      });
      let visImageUrl = null, visImageSource = null;
      if (process.env.OPENAI_API_KEY) {
        try {
          const imgGen = require("../services/imageGen");
          const appUrl = log.getAppUrl();
          const { buf: imgBuf, model: imgModel } = await openaiSvc.generatePostImage(biz.name, captionText, brandId);
          visImageUrl = `${appUrl}/api/instagram/images/${imgGen.storeImage(imgBuf)}`;
          visImageSource = imgModel;
        } catch(imgErr) {
          log.warn("IMPLEMENT", `${channelLabel} image gen failed`, { error: imgErr.message });
        }
      }
      logActivity(req.params.businessId,{ agent:"management", action:`${channelLabel} content ready`, detail:captionText.slice(0,80) });
      if (effective.plan === "trial") await bumpUsage(req.params.businessId, "managementImplements");
      return res.json({ success:true, channel: channelLabel, caption: captionText, body: captionText,
        imageUrl: visImageUrl, imageSource: visImageSource,
        actionPlan: insight.managementAction || `Content ready — copy and post on ${channelLabel}.` });
    }

    logActivity(req.params.businessId,{ agent:"management", action:"Ready to act", detail:`Apply the recommendation on your ${channelLabel} channel` });
    if (effective.plan === "trial") await bumpUsage(req.params.businessId, "managementImplements");
    return res.json({ success:true, channel: channelLabel, actionPlan: insight.managementAction || insight.recommendation });
  } catch(e) { next(e); }
});

/**
 * POST /:businessId/campaigns/breakdown
 * Break a marketing campaign into concrete sub-tasks and save them to the
 * Tasks table so they appear on the Tasks page.
 * Body: { campaign: { id, title, channel, rationale, mode } }
 */
router.post("/:businessId/campaigns/breakdown", requireAuth, async (req, res, next) => {
  try {
    const { campaign, activeCampaignCount = 0 } = req.body;
    if (!campaign?.title) return res.status(400).json({ error: "campaign.title is required" });

    // Enforce max-3-active-campaigns at the API level
    if (activeCampaignCount >= 3) {
      return res.status(429).json({ error: "You can only run 3 campaigns at once. Complete or archive one before starting another.", campaignLimitReached: true });
    }

    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });

    // Channel-specific task templates — no AI needed
    const ch = (campaign.channel || "general").toLowerCase();
    const isVisualSocial = ["instagram", "tiktok", "linkedin", "facebook", "twitter"].includes(ch);
    const isContentChannel = ["blog", "email", "website", "newsletter"].includes(ch);
    const campMode = campaign.mode || "guided";

    let templateTasks;
    if (isVisualSocial) {
      templateTasks = [
        { name: "Generate caption", description: `Write a compelling caption for this ${ch} campaign: "${campaign.title}"`, estimatedTime: "10 min", canAutomate: true, isVideoTask: false, isEngagementTask: false, shouldPublish: false },
        { name: `Generate ${ch === "tiktok" ? "video" : "image"} content`, description: `Create the visual or video content for this campaign post.`, estimatedTime: "15 min", canAutomate: ch !== "tiktok", isVideoTask: ch === "tiktok", isEngagementTask: false, shouldPublish: false },
        { name: "Preview and post", description: `Review the caption and image, then publish to ${ch}.`, estimatedTime: "5 min", canAutomate: true, isVideoTask: false, isEngagementTask: false, shouldPublish: ch === "instagram" },
      ];
    } else if (isContentChannel) {
      templateTasks = [
        { name: "Generate content", description: `Draft the ${ch} content for: "${campaign.title}"`, estimatedTime: "15 min", canAutomate: true, isVideoTask: false, isEngagementTask: false, shouldPublish: false },
        { name: `Post / upload content`, description: `Publish the generated content to your ${ch}.`, estimatedTime: "10 min", canAutomate: false, isVideoTask: false, isEngagementTask: false, shouldPublish: false },
      ];
    } else {
      templateTasks = [
        { name: "Generate content", description: `Create the content for this campaign: "${campaign.title}"`, estimatedTime: "15 min", canAutomate: true, isVideoTask: false, isEngagementTask: false, shouldPublish: false },
        { name: "Review and publish", description: "Review the generated content and publish or share it.", estimatedTime: "10 min", canAutomate: false, isVideoTask: false, isEngagementTask: false, shouldPublish: false },
      ];
    }

    // Save tasks to the Tasks table
    const savedTasks = [];
    for (let i = 0; i < templateTasks.length; i++) {
      const t = templateTasks[i];
      const isManualTask = t.isVideoTask || t.isEngagementTask;
      const taskMode = isManualTask ? "manual"
        : campMode === "auto" ? "auto"
        : campMode === "guided" ? "guided"
        : "manual";

      const task = await prisma.task.create({
        data: {
          businessId: req.params.businessId,
          name:          t.name,
          category:      "campaign",
          description:   t.description,
          status:        "pending",
          mode:          taskMode,
          estimatedTime: t.estimatedTime,
          canAutomate:   !!t.canAutomate && !isManualTask,
          steps:         JSON.stringify([{
            label:            campaign.title,
            detail:           t.description,
            channel:          campaign.channel || "general",
            isVideoTask:      t.isVideoTask,
            isEngagementTask: t.isEngagementTask,
            shouldPublish:    t.shouldPublish,
          }]),
          sortOrder: i,
        },
      });
      savedTasks.push(task);
    }

    logActivity(req.params.businessId, {
      agent: "marketing",
      action: "Campaign broken into tasks",
      detail: `"${campaign.title}" → ${savedTasks.length} tasks created`,
    });

    res.json({
      success: true,
      tasks: savedTasks,
      taskIds: savedTasks.map(t => t.id),
      progressTarget: null,
      progressUnit:   null,
    });
  } catch(e) { next(e); }
});

// ── Brand Identity ────────────────────────────────────────────────────────────

/** GET /:businessId/brand-identity — fetch saved brand identity */
router.get("/:businessId/brand-identity", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    let identity = await getBrandIdentity(req.params.businessId);
    // Bootstrap from idea if nothing saved yet
    if (!identity) {
      let idea = {}; try { idea = JSON.parse(biz.ideaData||"{}"); } catch {}
      const integrations = await prisma.integration.findMany({ where:{ businessId:req.params.businessId } });
      const metricsOut   = await prisma.businessOutput.findFirst({ where:{ businessId:req.params.businessId, type:"user_metrics" } });
      let metrics = {}; try { metrics = JSON.parse(metricsOut?.content||"{}"); } catch {}
      identity = bootstrapFromIdea(biz, idea, integrations, metrics);
    }
    res.json({ identity });
  } catch(e) { next(e); }
});

/** PUT /:businessId/brand-identity — user saves manual edits */
router.put("/:businessId/brand-identity", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    const updates = req.body.identity || req.body;
    const saved = await saveBrandIdentity(req.params.businessId, { ...updates, populatedBy:"user" });
    res.json({ identity: saved });
  } catch(e) { next(e); }
});

/** POST /:businessId/brand-identity/populate — AI-populate from all channel data */
router.post("/:businessId/brand-identity/populate", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    let idea = {}; try { idea = JSON.parse(biz.ideaData||"{}"); } catch {}
    const integrations = await prisma.integration.findMany({ where:{ businessId:req.params.businessId } });
    const metricsOut   = await prisma.businessOutput.findFirst({ where:{ businessId:req.params.businessId, type:"user_metrics" } });
    let metrics = {}; try { metrics = JSON.parse(metricsOut?.content||"{}"); } catch {}
    const marketOut    = await prisma.businessOutput.findFirst({ where:{ businessId:req.params.businessId, type:"marketing_insights" } });
    let marketReport = null; try { const md = JSON.parse(marketOut?.content||"{}"); marketReport = md.report || md; } catch {}
    if (!process.env.OPENAI_API_KEY) {
      // Fall back to discovery bootstrap if OpenAI not configured
      const identity = bootstrapFromIdea(biz, idea, integrations, metrics);
      await saveBrandIdentity(req.params.businessId, identity);
      return res.json({ identity });
    }
    const identity = await populateAndSave(req.params.businessId, biz, idea, integrations, metrics, marketReport);
    logActivity(req.params.businessId, { agent:"marketing", action:"Brand identity updated", detail:"AI-analyzed all connected channels and market data" });
    res.json({ identity });
  } catch(e) { next(e); }
});

// ── Marketing Notes (sticky notes) ───────────────────────────────────────────

async function getNotesRecord(bizId) {
  const out = await prisma.businessOutput.findFirst({ where:{ businessId:bizId, type:"marketing_notes" } });
  if (!out) return { id:null, notes:[] };
  try { return { id:out.id, notes:JSON.parse(out.content)||[] }; } catch { return { id:out.id, notes:[] }; }
}

async function saveNotesRecord(bizId, notes, existingId) {
  const content = JSON.stringify(notes);
  if (existingId) {
    await prisma.businessOutput.update({ where:{ id:existingId }, data:{ content } });
  } else {
    await prisma.businessOutput.create({ data:{ businessId:bizId, type:"marketing_notes", title:"Marketing Notes", content } });
  }
}

router.get("/:businessId/marketing/notes", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    const { notes } = await getNotesRecord(req.params.businessId);
    res.json({ notes });
  } catch(e) { next(e); }
});

router.post("/:businessId/marketing/notes", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    const { text, color } = req.body;
    if (!text?.trim()) return res.status(400).json({ error:"Note text required" });
    const { id, notes } = await getNotesRecord(req.params.businessId);
    const note = { id: require("crypto").randomUUID(), text:text.trim(), color:color||"#FEF9C3", createdAt:new Date().toISOString() };
    notes.unshift(note);
    await saveNotesRecord(req.params.businessId, notes, id);

    // Also create a task with category "note" so it shows in Tasks page
    await prisma.task.create({
      data: {
        businessId: req.params.businessId,
        name: text.trim().slice(0, 80),
        category: "notes",
        description: text.trim(),
        status: "pending",
        mode: "manual",
        canAutomate: false,
        steps: JSON.stringify([{ label:"Note", detail:text.trim() }]),
        sortOrder: 9999,
      },
    });

    res.json({ note });
  } catch(e) { next(e); }
});

router.delete("/:businessId/marketing/notes/:noteId", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });
    const { id, notes } = await getNotesRecord(req.params.businessId);
    await saveNotesRecord(req.params.businessId, notes.filter(n=>n.id!==req.params.noteId), id);
    res.json({ ok:true });
  } catch(e) { next(e); }
});

// ── Campaign task content generation ─────────────────────────────────────────

router.post("/:businessId/campaigns/task-content", requireAuth, async (req, res, next) => {
  const t0 = Date.now();
  try {
    const { task, channel, mode } = req.body;
    if (!task) return res.status(400).json({ error:"task required" });
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });

    const ch = channel || task.channel || "general";

    log.info("CONTENT", "task-content route entered", {
      businessId: req.params.businessId,
      businessName: biz.name,
      taskName: task.name,
      channel: ch,
      mode,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    });

    const brandId = await getBrandIdentity(req.params.businessId);
    let idea = {}; try { idea = JSON.parse(biz.ideaData||"{}"); } catch {}

    const marketOut = await prisma.businessOutput.findFirst({ where:{ businessId:req.params.businessId, type:"marketing_insights" } });
    let marketInsights = ""; try { const md=JSON.parse(marketOut?.content||"{}"); marketInsights=md.report?.marketAnalysis?.summary||""; } catch {}

    // ── 0. Manual mode: return static tips immediately — no OpenAI calls ────────
    const CHANNEL_TIP_MAP = {
      instagram: ["Post consistently at 7-9am or 6-9pm for best reach", "Use 5-8 relevant hashtags — avoid generic ones with 10M+ posts", "Stories and Reels get 2x the organic reach of static posts", "Reply to every comment in the first hour — it boosts the algorithm", "Use a clear CTA: 'Save this', 'DM me', or 'Link in bio'"],
      twitter:   ["Threads get 3-5x more engagement than single tweets", "Reply to trending posts in your niche to gain visibility", "Tweet at 8am, 12pm, or 5-6pm EST for peak engagement", "Use 1-2 hashtags max — more can reduce reach on X", "Pin your best-performing tweet to attract new followers"],
      tiktok:    ["Hook viewers in the first 2 seconds — start with movement or a question", "Use trending sounds from the Discover tab even for text-based content", "Post 3-5 times per week minimum to stay in the algorithm", "Stitch or duet relevant creators to ride their audience", "Add text overlays — 80% of TikTok is watched without sound"],
      linkedin:  ["Start posts with a bold first line — it shows before 'see more'", "Personal stories outperform promotional posts 3-1 on LinkedIn", "Tag up to 5 relevant connections to extend organic reach", "Post on Tue-Thu mornings for professional audiences", "End every post with a question to drive comments"],
      google:    ["Respond to every Google review within 24h — it signals activity", "Add new photos weekly to keep your listing fresh", "Use Google Posts to share offers and events directly in search", "Ask happy clients to leave reviews immediately after service", "Keep your business hours updated — incorrect hours hurt ranking"],
      facebook:  ["Facebook Groups outperform Pages — post in relevant local groups", "Video content gets 5x the reach of image posts on Facebook", "Boost posts for $5-10 to test before committing larger budgets", "Post in the evening (7-9pm) when your audience is most active", "Use Facebook Events to drive local engagement for promotions"],
      general:   ["Consistency beats perfection — publish on schedule", "Repurpose each piece of content across 3+ channels", "Engage with 5-10 accounts in your niche every day", "Track which posts drive actual inquiries, not just likes", "Use direct outreach alongside content for faster growth"],
    };
    if (mode === "manual") {
      const tips = CHANNEL_TIP_MAP[ch] || CHANNEL_TIP_MAP.general;
      return res.json({ content: { channel: ch, type: "manual_tip", tips } });
    }

    // ── 1. Guided task detection (engagement, follow/DM, video) ─────────────
    const taskText = (task.name || "") + " " + (task.description || "");
    let stepsData = [];
    try { stepsData = typeof task.steps === "string" ? JSON.parse(task.steps) : (Array.isArray(task.steps) ? task.steps : []); } catch {}

    const isVideoTask      = stepsData[0]?.isVideoTask      || /\bfilm\b|\brecord\b|\bshoot\b|\bedit\s+(and|the)\b|\bvoiceover\b|\bscreencast\b|\bslideshow\b/i.test(taskText);
    const isEngagementTask = stepsData[0]?.isEngagementTask || /\bengage\s+with\b|\bfollow\s+(\d+|targeted|accounts)\b|\blike\s+\d+\b|\bcomment\s+on\b|\bdm\b|\bdirect\s+message\b|\bmanually\s+(engage|follow|like)\b/i.test(taskText);

    // TikTok video tasks → generate actual slide content for the slideshow builder
    const VIDEO_SLIDE_CHANNELS = new Set(["tiktok"]);
    if (isVideoTask && VIDEO_SLIDE_CHANNELS.has(ch) && process.env.OPENAI_API_KEY) {
      log.info("CONTENT", "TikTok video task — generating slides", { taskName: task.name });
      try {
        const imgGen = require("../services/imageGen");
        const appUrl = log.getAppUrl();
        const { slides, captionBody, hashtags } = await openaiSvc.generateSlideContent({
          businessName: biz.name, context: task.name, brandIdentity: brandId, channel: ch,
        });
        let imageUrl = null, imageSource = null, dalleError = null;
        try {
          const { buf, model } = await openaiSvc.generatePostImage(biz.name, task.name, brandId);
          const imageId = imgGen.storeImage(buf);
          imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
          imageSource = model;
        } catch(imgErr) {
          dalleError = imgErr.message;
        }
        return res.json({ content: {
          channel: ch, isVideo: true,
          slides, body: captionBody, caption: captionBody, hashtags,
          imageUrl, imageSource, dalleError,
        }});
      } catch(slideErr) {
        log.error("CONTENT", "Slide generation failed — falling back to guidance", { error: slideErr.message });
      }
    }

    if (isVideoTask || isEngagementTask) {
      log.info("CONTENT", "Guided task detected — generating strategy", { taskName: task.name, isVideoTask, isEngagementTask });
      const guidance = process.env.OPENAI_API_KEY
        ? await openaiSvc.generateTaskGuidance({ businessName: biz.name, taskName: task.name, taskDescription: task.description, channel: ch, brandIdentity: brandId })
        : { why: "", steps: ["Plan your approach step by step", "Research what's working in your niche", "Execute consistently and track results"], tips: [] };
      return res.json({ content: {
        channel: ch,
        isGuided: true,
        type: isVideoTask ? "video" : "engagement",
        guidanceTitle: task.name,
        guidanceWhy:   guidance.why,
        guidanceSteps: guidance.steps,
        guidanceTips:  guidance.tips,
      }});
    }

    // ── 2. Visual channels: caption + background image ───────────────────────
    const VISUAL_CHANNELS = new Set(["instagram","twitter","tiktok","linkedin","google","facebook","general"]);
    const isVisual = VISUAL_CHANNELS.has(ch);

    if (isVisual) {
      // Use campaign title (stepsData[0].label) as context so image/caption match the campaign
      const taskContext = stepsData[0]?.label || task.description || task.name;

      // Caption
      let captionResult, dalleError = null;
      try {
        if (ch === "instagram") {
          captionResult = await openaiSvc.generateInstagramCaption({
            businessName: biz.name, businessType: idea.name,
            context: taskContext, brandIdentity: brandId, marketInsights,
          });
        } else if (process.env.OPENAI_API_KEY) {
          const text = await openaiSvc.generateChannelCaption({ businessName: biz.name, channel: ch, context: taskContext, brandIdentity: brandId });
          captionResult = { caption: text, body: text, hashtags: null };
        } else {
          const ig = require("../services/instagram");
          captionResult = await ig.generateCaption(biz.name, idea.name, taskContext, "authentic", {});
        }
      } catch (captionErr) {
        log.error("CONTENT", "Caption generation failed", { error: captionErr.message, channel: ch });
        throw captionErr;
      }

      // Background image — stored raw; text is composited client-side via browser canvas
      let imageUrl = null, imageSource = null;
      if (mode !== "manual" && process.env.OPENAI_API_KEY) {
        const imgGen = require("../services/imageGen");
        const appUrl = log.getAppUrl();
        try {
          const { buf: imgBuf, model: imgModel } = await openaiSvc.generatePostImage(biz.name, captionResult.body, brandId);
          const imageId = imgGen.storeImage(imgBuf);
          imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
          imageSource = imgModel;
          log.info("CONTENT", "Background image generated", { model: imgModel, channel: ch, ms: Date.now() - t0 });
        } catch (imgErr) {
          dalleError = imgErr.message || String(imgErr);
          log.error("CONTENT", "Image generation failed", { error: dalleError, channel: ch });
          imageSource = "image_failed";
        }
      } else if (mode === "manual") {
        imageSource = null;
      } else {
        imageSource = "no_openai_key";
      }

      return res.json({ content: {
        channel: ch,
        caption: captionResult.caption,
        body:    captionResult.body,
        hashtags: captionResult.hashtags || null,
        imageUrl, imageSource, dalleError,
      }});
    }

    // ── 3. Text-only channels (email, website) ───────────────────────────────
    if (process.env.OPENAI_API_KEY) {
      const text = await openaiSvc.generateChannelCaption({ businessName: biz.name, channel: ch, context: task.name, brandIdentity: brandId });
      return res.json({ content: { channel: ch, caption: text, body: text } });
    }

    // ── 4. Claude fallback ────────────────────────────────────────────────────
    log.info("CONTENT", "Falling back to Claude generateChannelContent", { channel: ch, mode });
    const content = await generateChannelContent(biz, task, ch, mode || "guided");
    log.info("CONTENT", "Claude channel content ready", { type: content.type, ms: Date.now() - t0 });
    res.json({ content });
  } catch(e) {
    log.error("CONTENT", "task-content route threw", { error: e.message, ms: Date.now() - t0 });
    next(e);
  }
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

/**
 * POST /:businessId/content-lab
 * Test content generation (caption + image) for any channel without running a
 * full campaign. Surfaces the exact DALL-E error so it can be diagnosed in the UI.
 */
router.post("/:businessId/content-lab", requireAuth, async (req, res, next) => {
  try {
    const biz = await prisma.business.findFirst({ where:{ id:req.params.businessId, userId:req.userId } });
    if (!biz) return res.status(404).json({ error:"Business not found" });

    const { channel = "instagram", context = "value tip post", tone = "professional" } = req.body;
    const VIDEO_CHANNELS = new Set(["tiktok"]);
    const isVideo = VIDEO_CHANNELS.has(channel);
    let idea = {}; try { idea = JSON.parse(biz.ideaData||"{}"); } catch {}
    const brandId = await getBrandIdentity(req.params.businessId);
    const imgGen = require("../services/imageGen");
    const appUrl = log.getAppUrl();

    // ── Background image ──────────────────────────────────────────────────────
    // Text overlay is composited client-side via browser canvas (system fonts always available).
    // Server stores the raw AI image; the client loads it with crossOrigin="anonymous" (CORS
    // header set on the images endpoint) and draws the caption text on top via Canvas API.
    let imageUrl = null, imageSource = null, dalleError = null;
    const needsImage = ["instagram","twitter","linkedin","tiktok","google","facebook","general"].includes(channel);
    if (needsImage && process.env.OPENAI_API_KEY) {
      try {
        const { buf: imgBuf, model: imgModel } = await openaiSvc.generatePostImage(biz.name, context, brandId);
        const imageId = imgGen.storeImage(imgBuf);
        imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
        imageSource = imgModel;
        log.info("CONTENT-LAB", "Background image generated", { model: imgModel, channel });
      } catch(e) {
        dalleError = e.message || String(e);
        log.error("CONTENT-LAB", "Image generation failed", { error: dalleError });
        const imageId = await imgGen.generatePostImage(biz.name, context);
        imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
        imageSource = "svg_fallback";
      }
    } else if (needsImage) {
      dalleError = "OPENAI_API_KEY is not set";
      const imageId = await imgGen.generatePostImage(biz.name, context);
      imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
      imageSource = "svg_no_openai";
    }

    // ── Video (TikTok etc.): generate slides ──────────────────────────────────
    if (isVideo && process.env.OPENAI_API_KEY) {
      // imageUrl already stored above — use as slideshow background
      try {
        const { slides, captionBody, hashtags } = await openaiSvc.generateSlideContent({
          businessName: biz.name, context, brandIdentity: brandId, channel,
        });
        return res.json({
          channel, isVideo: true,
          slides, body: captionBody, caption: captionBody, hashtags,
          imageUrl, imageSource, dalleError,
          hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        });
      } catch(slideErr) {
        log.error("CONTENT-LAB", "generateSlideContent failed — falling back to caption", { error: slideErr.message });
      }
    }

    // ── Caption (channel-appropriate) ─────────────────────────────────────────
    const ig = require("../services/instagram");
    let captionResult = null, captionError = null, captionSource = "claude";
    if (process.env.OPENAI_API_KEY) {
      try {
        if (channel === "instagram") {
          captionResult = await openaiSvc.generateInstagramCaption({
            businessName: biz.name, businessType: idea.name,
            context, brandIdentity: brandId, marketInsights: "",
          });
        } else {
          const text = await openaiSvc.generateChannelCaption({ businessName: biz.name, channel, context, brandIdentity: brandId });
          captionResult = { caption: text, body: text, hashtags: null };
        }
        captionSource = "gpt4o";
      } catch(e) {
        captionError = e.message;
        captionResult = await ig.generateCaption(biz.name, idea.name, context, tone, {});
      }
    } else {
      captionResult = await ig.generateCaption(biz.name, idea.name, context, tone, {});
    }

    return res.json({
      channel,
      caption:  captionResult?.caption || null,
      body:     captionResult?.body    || null,
      hashtags: captionResult?.hashtags || null,
      imageUrl, imageSource, dalleError, captionError, captionSource,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    });
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
