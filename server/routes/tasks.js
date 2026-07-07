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
      const isInstagram = /instagram|ig post|post|social/i.test(task.name + " " + (task.description || ""));
      log.info("TASK", "Campaign task routing", {
        taskId: task.id,
        name: task.name,
        mode: task.mode,
        isInstagram,
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
          const appUrl = process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:3000";
          log.info("TASK", "Image generation starting", {
            taskId: task.id,
            appUrl,
            hasOpenAIKey: !!process.env.OPENAI_API_KEY,
            appUrlSource: process.env.APP_URL ? "APP_URL" : process.env.CLIENT_URL ? "CLIENT_URL" : "default localhost",
          });

          let imageUrl;
          let imageSource;
          if (process.env.OPENAI_API_KEY) {
            log.info("TASK", "Attempting DALL-E 3 image generation", { taskId: task.id });
            try {
              const imgBuf = await openaiSvc.generatePostImage(business.name, captionResult.body, brandId);
              const imageId = imgGen.storeImage(imgBuf);
              imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
              imageSource = "dalle3";
              log.info("TASK", "DALL-E 3 image generated and stored", {
                taskId: task.id, imageId, imageUrl, bytes: imgBuf.length,
              });
            } catch (imgErr) {
              log.error("TASK", "DALL-E 3 FAILED — falling back to SVG", {
                taskId: task.id,
                error: imgErr.message,
                status: imgErr.status,
              });
              const imageId = await imgGen.generatePostImage(business.name, context);
              imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
              imageSource = "svg_fallback";
              log.info("TASK", "SVG fallback image generated", { taskId: task.id, imageId, imageUrl });
            }
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

          // ── Post to Instagram (auto mode only) ──────────────────────────────
          if (task.mode === "auto") {
            log.info("TASK", "Auto mode — attempting Instagram post", {
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
                fields:[
                  { label:"Status",   value:"Posted to Instagram" },
                  { label:"Media ID", value:post.mediaId },
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
                fields:[
                  { label:"Status",   value:"Instagram post failed — review and post manually" },
                  { label:"Error",    value:postErr.friendlyMessage || postErr.message },
                ],
              };
            }
          } else {
            log.info("TASK", "Non-auto mode — returning caption + image for review", { taskId: task.id, taskMode: task.mode });
            outputData = {
              channel:"instagram", published:false, imageUrl, imageSource,
              caption: captionResult.caption, body: captionResult.body, hashtags: captionResult.hashtags,
              fields:[
                { label:"Status", value:"Caption + image ready — copy and post" },
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
