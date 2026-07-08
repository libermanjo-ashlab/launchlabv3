const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const { generateTaskOutput } = require("../services/generators");
const openaiSvc   = require("../services/openaiService");
const { getBrandIdentity } = require("../services/brandIdentity");
const log         = require("../lib/logger");

const prisma = new PrismaClient();

async function ownsTask(taskId, userId) {
  const task = await prisma.task.findFirst({ where: { id: taskId }, include: { business: true } });
  if (!task || task.business.userId !== userId) return null;
  return task;
}

// GET /api/tasks/business/:businessId
router.get("/business/:businessId", requireAuth, async (req, res, next) => {
  try {
    const business = await prisma.business.findFirst({ where: { id: req.params.businessId, userId: req.userId } });
    if (!business) return res.status(404).json({ error: "Business not found" });

    // Auto-reset any task that has been stuck in "running" for more than 5 minutes.
    // This happens when the server crashed or the AI call timed out without a catch.
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);
    await prisma.task.updateMany({
      where: { businessId: req.params.businessId, status: "running", updatedAt: { lt: staleThreshold } },
      data:  { status: "pending" },
    }).catch(() => {}); // non-fatal

    const tasks = await prisma.task.findMany({ where: { businessId: req.params.businessId }, orderBy: { sortOrder: "asc" } });
    res.json({ tasks: tasks.map(t => ({ ...t, steps: JSON.parse(t.steps || "[]"), outputData: t.outputData ? JSON.parse(t.outputData) : null })) });
  } catch (e) { next(e); }
});

// POST /api/tasks/business/:businessId — create task
router.post("/business/:businessId", requireAuth, async (req, res, next) => {
  try {
    const business = await prisma.business.findFirst({ where: { id: req.params.businessId, userId: req.userId } });
    if (!business) return res.status(404).json({ error: "Business not found" });

    const { name, category, description, estimatedTime, estimatedCost, canAutomate, steps, mode, sortOrder } = req.body;
    const task = await prisma.task.create({
      data: {
        businessId: req.params.businessId,
        name, category: category || "Operations",
        description: description || "",
        estimatedTime: estimatedTime || "—",
        estimatedCost: estimatedCost || "—",
        canAutomate: !!canAutomate,
        steps: JSON.stringify(steps || []),
        mode: mode || "manual",
        sortOrder: sortOrder ?? 99,
      },
    });
    res.status(201).json({ task: { ...task, steps: JSON.parse(task.steps), outputData: null } });
  } catch (e) { next(e); }
});

// PUT /api/tasks/:id — update task (mode, status, outputData, etc.)
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const task = await ownsTask(req.params.id, req.userId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const { name, description, mode, status, outputData, steps, sortOrder } = req.body;
    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(name        !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(mode        !== undefined && { mode }),
        ...(status      !== undefined && { status }),
        ...(outputData  !== undefined && { outputData: JSON.stringify(outputData) }),
        ...(steps       !== undefined && { steps: JSON.stringify(steps) }),
        ...(sortOrder   !== undefined && { sortOrder }),
      },
    });
    res.json({ task: { ...updated, steps: JSON.parse(updated.steps || "[]"), outputData: updated.outputData ? JSON.parse(updated.outputData) : null } });
  } catch (e) { next(e); }
});

// POST /api/tasks/:id/run — actually run an auto task (generates real output)
router.post("/:id/run", requireAuth, async (req, res, next) => {
  const routeT0 = Date.now();
  try {
    const task = await ownsTask(req.params.id, req.userId);
    if (!task) {
      log.warn("TASK", "Task not found or not owned by user", { taskId: req.params.id, userId: req.userId });
      return res.status(404).json({ error: "Task not found" });
    }
    if (task.status === "done") {
      log.warn("TASK", "Task already done — skipping run", { taskId: task.id, name: task.name });
      return res.status(400).json({ error: "Task is already complete" });
    }

    log.info("TASK", "Task run started", {
      taskId: task.id,
      name: task.name,
      category: task.category,
      mode: task.mode,
      status: task.status,
      businessId: task.businessId,
    });

    // Mark as running
    await prisma.task.update({ where: { id: task.id }, data: { status: "running" } });

    // Generate real output based on task type
    const business = await prisma.business.findUnique({ where: { id: task.businessId } });
    let intake = {}, idea = {};
    try { intake = JSON.parse(business.intakeData || "{}"); } catch {}
    try { idea   = JSON.parse(business.ideaData   || "{}"); } catch {}

    log.info("TASK", "Business loaded for task run", {
      taskId: task.id,
      businessName: business.name,
      ideaName: idea.name || "(none)",
    });

    // ── Campaign tasks: channel-aware execution ──────────────────────────────────
    let outputData;
    if (task.category === "campaign") {
      // Read channel + shouldPublish from task steps (stored at breakdown time)
      let stepsData = [];
      try { stepsData = JSON.parse(task.steps || "[]"); } catch {}
      const taskChannel = stepsData[0]?.channel || "";
      const isInstagram = taskChannel === "instagram" || /instagram|ig post|reel|social post/i.test(task.name + " " + (task.description || ""));
      // Only actually post for the "Publish" step — prep tasks generate content only
      const shouldPublish = stepsData[0]?.shouldPublish !== undefined
        ? stepsData[0].shouldPublish
        : /\bpublish\b|\bpost\s+(to|on)\s+instagram\b|\bgo\s+live\b|\bpublish\s+the\s+post\b/i.test(task.name + " " + (task.description || ""));
      log.info("TASK", "Campaign task routing", {
        taskId: task.id,
        name: task.name,
        mode: task.mode,
        taskChannel: taskChannel || "(none)",
        isInstagram,
        shouldPublish,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      });

      if (isInstagram) {
        const ig     = require("../services/instagram");
        const imgGen = require("../services/imageGen");
        const intg   = await prisma.integration.findFirst({ where:{ businessId:task.businessId, provider:"instagram" } });
        const meta   = intg?.metadata ? JSON.parse(intg.metadata) : {};

        log.info("TASK", "Instagram integration check", {
          taskId: task.id,
          integrationFound: !!intg,
          hasAccessToken: !!meta.accessToken,
          hasBusinessAccountId: !!meta.businessAccountId,
          autopilot: !!meta.autopilot,
        });

        if (!meta.accessToken || !meta.businessAccountId) {
          log.warn("TASK", "Instagram not configured — outputting setup instructions", { taskId: task.id });
          outputData = { fields:[
            { label:"Status",    value:"Instagram not configured" },
            { label:"Next step", value:"Add your Access Token and Business Account ID in Hub → Instagram" },
          ]};
        } else {
          const context   = task.description || task.name;
          log.info("TASK", "Loading brand identity and market insights", { taskId: task.id, businessId: task.businessId });

          const brandId   = await getBrandIdentity(task.businessId);
          log.info("TASK", "Brand identity for task", {
            taskId: task.id,
            brandFound: !!brandId,
            populatedBy: brandId?.populatedBy || "none",
            hasVoice: !!brandId?.voice,
            hasPalette: !!brandId?.colorPalette,
            hasBusinessType: !!brandId?.businessType,
          });

          const marketOut = await prisma.businessOutput.findFirst({ where:{ businessId:task.businessId, type:"marketing_insights" } });
          let marketInsights = "";
          try { const md=JSON.parse(marketOut?.content||"{}"); marketInsights=md.report?.marketAnalysis?.summary||""; } catch {}
          log.info("TASK", "Market insights loaded", {
            taskId: task.id,
            hasMarketInsights: !!marketInsights,
            insightsLen: marketInsights.length,
          });

          // ── Caption generation ──────────────────────────────────────────────
          let captionResult;
          if (process.env.OPENAI_API_KEY) {
            log.info("TASK", "Generating caption via OpenAI GPT-4o", {
              taskId: task.id,
              contextSnippet: context.slice(0, 80),
            });
            try {
              captionResult = await openaiSvc.generateInstagramCaption({
                businessName:business.name, businessType:idea.name, context, brandIdentity:brandId, marketInsights,
              });
              log.info("TASK", "OpenAI caption generated", {
                taskId: task.id,
                bodyLen: captionResult.body?.length,
                hashtagsLen: captionResult.hashtags?.length,
                captionSnippet: captionResult.body?.slice(0, 80),
              });
            } catch (captionErr) {
              log.error("TASK", "OpenAI caption FAILED — falling back to Claude", {
                taskId: task.id,
                error: captionErr.message,
              });
              let prefs = {}; try { const mm=JSON.parse(business.userMetrics||"{}"); prefs=mm.prefs||{}; } catch {}
              captionResult = await ig.generateCaption(business.name, idea.name, context, "authentic", prefs);
              log.info("TASK", "Claude fallback caption generated", { taskId: task.id });
            }
          } else {
            log.warn("TASK", "OPENAI_API_KEY not set — using Claude for caption (no brand identity context)", {
              taskId: task.id,
              hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
            });
            let prefs = {}; try { const mm=JSON.parse(business.userMetrics||"{}"); prefs=mm.prefs||{}; } catch {}
            captionResult = await ig.generateCaption(business.name, idea.name, context, "authentic", prefs);
            log.info("TASK", "Claude caption generated", { taskId: task.id });
          }

          // ── Image generation ────────────────────────────────────────────────
          // Priority order: DALL-E 3 → clientImageUrl (canvas pre-upload) → SVG.
          // clientImageUrl is kept as a fallback so publish tasks still get a
          // text-overlay image when DALL-E is unavailable.
          const clientImageUrl = req.body?.imageUrl;
          const appUrl = log.getAppUrl();

          let imageUrl;
          let imageSource;
          let dalleError = null;

          if (process.env.OPENAI_API_KEY) {
            log.info("TASK", "Attempting DALL-E image generation", { taskId: task.id, appUrl, keyPrefix: process.env.OPENAI_API_KEY.slice(0, 7) });
            try {
              const { buf: imgBuf, model: imgModel } = await openaiSvc.generatePostImage(business.name, captionResult.body, brandId);
              const imageId = imgGen.storeImage(imgBuf);
              imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
              imageSource = imgModel;
              log.info("TASK", "Image generated and stored", {
                taskId: task.id, model: imgModel, imageId, imageUrl, bytes: imgBuf.length,
              });
            } catch (imgErr) {
              dalleError = imgErr.message || String(imgErr);
              log.error("TASK", "Image generation failed", {
                taskId: task.id,
                error: dalleError,
                status: imgErr.status,
                code: imgErr.code,
              });
              // Fall back to canvas pre-upload if client provided one, else SVG
              if (clientImageUrl) {
                imageUrl    = clientImageUrl;
                imageSource = "canvas";
                log.info("TASK", "Using client canvas as DALL-E fallback", { taskId: task.id, imageUrl });
              } else {
                const imageId = await imgGen.generatePostImage(business.name, context);
                imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
                imageSource = "svg_fallback";
                log.info("TASK", "SVG fallback image generated", { taskId: task.id, imageId, imageUrl });
              }
            }
          } else if (clientImageUrl) {
            imageUrl    = clientImageUrl;
            imageSource = "canvas";
            log.info("TASK", "OPENAI_API_KEY not set — using client Canvas imageUrl", { taskId: task.id, imageUrl });
          } else {
            log.warn("TASK", "OPENAI_API_KEY not set — using SVG background image (no text)", { taskId: task.id });
            const imageId = await imgGen.generatePostImage(business.name, context);
            imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
            imageSource = "svg_no_openai";
            log.info("TASK", "SVG image generated (no OpenAI)", { taskId: task.id, imageId, imageUrl });
          }

          log.info("TASK", "Caption + image ready", {
            taskId: task.id,
            taskMode: task.mode,
            imageSource,
            imageUrl,
            captionLen: captionResult.caption?.length,
          });

          // ── Post to Instagram (auto mode + shouldPublish tasks only) ──────────
          log.info("TASK", "Post gate check", { taskId: task.id, taskMode: task.mode, shouldPublish, imageSource });

          if (task.mode === "auto" && shouldPublish) {
            log.info("TASK", "Auto + shouldPublish — attempting Instagram post", {
              taskId: task.id,
              imageUrl,
              captionSnippet: captionResult.body?.slice(0, 60),
            });
            try {
              const post = await ig.createImagePost(meta.accessToken, meta.businessAccountId, imageUrl, captionResult.caption);
              log.info("TASK", "Instagram post PUBLISHED", {
                taskId: task.id, mediaId: post.mediaId,
                permalink: `https://www.instagram.com/p/${post.mediaId}/`,
              });
              outputData = {
                channel:"instagram", published:true, imageUrl, imageSource,
                caption: captionResult.caption, body: captionResult.body, hashtags: captionResult.hashtags,
                dalleError,
                fields:[
                  { label:"Status",   value:"Posted to Instagram" },
                  { label:"Media ID", value:post.mediaId },
                  ...(dalleError ? [{ label:"Image error", value:`DALL-E failed: ${dalleError}` }] : []),
                ],
              };
            } catch(postErr) {
              log.error("TASK", "Instagram post FAILED", {
                taskId: task.id,
                error: postErr.friendlyMessage || postErr.message,
                igCode: postErr.igCode,
                permissionError: postErr.permissionError,
                tokenExpired: postErr.tokenExpired,
              });
              outputData = {
                channel:"instagram", published:false, imageUrl, imageSource,
                caption: captionResult.caption, body: captionResult.body, hashtags: captionResult.hashtags,
                dalleError,
                fields:[
                  { label:"Status",   value:"Instagram post failed — review and post manually" },
                  { label:"Error",    value:postErr.friendlyMessage || postErr.message },
                  ...(dalleError ? [{ label:"Image error", value:`DALL-E failed: ${dalleError}` }] : []),
                ],
              };
            }
          } else {
            // Prep tasks (define concept, write caption, create visual) or guided/manual mode
            // If task name looks like a publish step but shouldPublish=false, surface diagnostic
            const looksLikePublish = /\bpublish\b|\bpost\s+(to|on)\s+instagram\b|\bgo\s+live\b/i.test(task.name);
            const statusLabel = task.mode === "auto" && looksLikePublish && !shouldPublish
              ? `Publish gate blocked — shouldPublish=${shouldPublish} taskMode=${task.mode} stepsHasShouldPublish=${stepsData[0]?.shouldPublish}`
              : task.mode === "auto"
              ? "Content ready (prep step — publish task will post)"
              : "Caption + image ready — copy and post";
            log.info("TASK", "Non-publish task — returning caption + image for review", {
              taskId: task.id, taskMode: task.mode, shouldPublish,
              stepsData: JSON.stringify(stepsData[0]?.shouldPublish),
            });
            outputData = {
              channel:"instagram", published:false, imageUrl, imageSource,
              caption: captionResult.caption, body: captionResult.body, hashtags: captionResult.hashtags,
              dalleError,
              fields:[
                { label:"Status",  value:statusLabel },
                ...(dalleError ? [{ label:"Image error", value:`DALL-E failed: ${dalleError}` }] : []),
              ],
            };
          }
        }
      } else {
        log.info("TASK", "Campaign task is not Instagram — routing to generateTaskOutput", {
          taskId: task.id, name: task.name,
        });
      }
    }

    if (!outputData) {
      log.info("TASK", "Using generic generateTaskOutput", { taskId: task.id, category: task.category });
      outputData = await generateTaskOutput(task, business, idea, intake);
    }

    // If this is a website generation task, also save to BusinessOutput.
    // Use findFirst → update/create (not a hard-coded ID upsert) so we always
    // update the existing record regardless of how its cuid was generated.
    if (/website|web page|landing page/i.test(task.name) && outputData.websiteHtml) {
      const existingWebsite = await prisma.businessOutput.findFirst({
        where: { businessId: business.id, type: "website" },
      });
      if (existingWebsite) {
        await prisma.businessOutput.update({ where: { id: existingWebsite.id }, data: { content: outputData.websiteHtml } });
      } else {
        await prisma.businessOutput.create({ data: { businessId: business.id, type: "website", title: "Business Website", content: outputData.websiteHtml } });
      }
      delete outputData.websiteHtml;
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { status: "done", outputData: JSON.stringify(outputData) },
    });

    log.info("TASK", "Task run complete", {
      taskId: task.id,
      ms: Date.now() - routeT0,
      channel: outputData.channel || "generic",
      published: outputData.published || false,
      hasImageUrl: !!outputData.imageUrl,
      imageSource: outputData.imageSource || "none",
    });

    // Track token usage for campaign/auto tasks (best-effort — don't fail the task run)
    try {
      const { getEffectivePlan } = require("../services/plans");
      const { PrismaClient: P2 } = require("@prisma/client");
      const p2 = new P2();
      const userRow = await p2.user.findFirst({ include: { businesses: { where: { id: task.businessId } } } });
      if (userRow) {
        const plan = getEffectivePlan(userRow).plan;
        const limit = { trial:20000, starter:20000, active:50000, autopilot:110000, pro:110000 }[plan] || 20000;
        const today = `tok_${new Date().toISOString().slice(0,10)}`;
        const out = await p2.businessOutput.findFirst({ where:{ businessId:task.businessId, type:"usage" } });
        const usage = out ? (JSON.parse(out.content||"{}")) : {};
        usage[today] = (usage[today]||0) + 1500; // 1500-token estimate per task run
        Object.keys(usage).filter(k=>k.startsWith("tok_")&&k!==today).forEach(k=>delete usage[k]);
        if (out) await p2.businessOutput.update({ where:{ id:out.id }, data:{ content:JSON.stringify(usage) } });
        else await p2.businessOutput.create({ data:{ businessId:task.businessId, type:"usage", title:"Usage tracking", content:JSON.stringify(usage) } });
        await p2.$disconnect();
      }
    } catch {}

    res.json({ task: { ...updated, steps: JSON.parse(updated.steps || "[]"), outputData } });
  } catch (e) {
    log.error("TASK", "Task run threw unhandled error", {
      taskId: req.params.id,
      ms: Date.now() - routeT0,
      error: e.message,
      stack: e.stack?.split("\n").slice(0, 4).join(" | "),
    });
    // If AI call fails, don't leave task stuck in "running"
    await prisma.task.update({ where: { id: req.params.id }, data: { status: "pending" } }).catch(() => {});
    next(e);
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const task = await ownsTask(req.params.id, req.userId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/tasks/business/:businessId/bulk-action — bulk delete or status update
router.post("/business/:businessId/bulk-action", requireAuth, async (req, res, next) => {
  try {
    const business = await prisma.business.findFirst({ where: { id: req.params.businessId, userId: req.userId } });
    if (!business) return res.status(404).json({ error: "Business not found" });
    const { action, ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: "ids required" });
    const where = { id: { in: ids }, businessId: req.params.businessId };
    if (action === "delete") {
      await prisma.task.deleteMany({ where });
    } else if (action === "complete") {
      await prisma.task.updateMany({ where, data: { status: "done" } });
    } else if (action === "pending") {
      await prisma.task.updateMany({ where, data: { status: "pending" } });
    } else {
      return res.status(400).json({ error: "action must be delete, complete, or pending" });
    }
    res.json({ ok: true, count: ids.length });
  } catch (e) { next(e); }
});

// POST /api/tasks/business/:businessId/bulk — replace all tasks (from AI generation)
router.post("/business/:businessId/bulk", requireAuth, async (req, res, next) => {
  try {
    const business = await prisma.business.findFirst({ where: { id: req.params.businessId, userId: req.userId } });
    if (!business) return res.status(404).json({ error: "Business not found" });

    const { tasks } = req.body;
    if (!Array.isArray(tasks)) return res.status(400).json({ error: "tasks must be an array" });

    await prisma.task.deleteMany({ where: { businessId: req.params.businessId } });

    const created = await Promise.all(tasks.map((t, i) => prisma.task.create({
      data: {
        businessId: req.params.businessId,
        name:          t.name,
        category:      t.category || "Operations",
        description:   t.description || "",
        estimatedTime: t.estimatedTime || "—",
        estimatedCost: t.estimatedCost || "—",
        canAutomate:   !!t.canAutomate,
        steps:         JSON.stringify(t.steps || []),
        mode:          t.canAutomate ? "auto" : "guided",
        sortOrder:     i,
      },
    })));

    res.json({ tasks: created.map(t => ({ ...t, steps: JSON.parse(t.steps || "[]"), outputData: null })) });
  } catch (e) { next(e); }
});

module.exports = router;
