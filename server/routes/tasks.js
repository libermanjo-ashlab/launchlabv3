const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const { generateTaskOutput } = require("../services/generators");

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
  try {
    const task = await ownsTask(req.params.id, req.userId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.status === "done") return res.status(400).json({ error: "Task is already complete" });

    // Mark as running
    await prisma.task.update({ where: { id: task.id }, data: { status: "running" } });

    // Generate real output based on task type
    const business = await prisma.business.findUnique({ where: { id: task.businessId } });
    let intake = {}, idea = {};
    try { intake = JSON.parse(business.intakeData || "{}"); } catch {}
    try { idea   = JSON.parse(business.ideaData   || "{}"); } catch {}

    // ── Campaign tasks: channel-aware execution ──────────────────────────────────
    let outputData;
    if (task.category === "campaign") {
      const isInstagram = /instagram|ig post|post|social/i.test(task.name + " " + (task.description || ""));
      console.log(`[Campaign task] id=${task.id} mode=${task.mode} isInstagram=${isInstagram} name="${task.name}"`);

      if (isInstagram) {
        const ig   = require("../services/instagram");
        const imgGen = require("../services/imageGen");
        const intg = await prisma.integration.findFirst({ where:{ businessId:task.businessId, provider:"instagram" } });
        const meta = intg?.metadata ? JSON.parse(intg.metadata) : {};
        console.log(`[Campaign task] Instagram creds present: accessToken=${!!meta.accessToken} businessAccountId=${!!meta.businessAccountId}`);

        if (!meta.accessToken || !meta.businessAccountId) {
          outputData = { fields:[
            { label:"Status",    value:"Instagram not configured" },
            { label:"Next step", value:"Add your Access Token and Business Account ID in Hub → Instagram" },
          ]};
        } else {
          let prefs = {}; try { const mm=JSON.parse(business.userMetrics||"{}"); prefs=mm.prefs||{}; } catch {}
          const context = task.description || task.name;
          console.log(`[Campaign task] Generating caption + image for "${business.name}" context="${context.slice(0,60)}"`);
          const [captionResult, imageId] = await Promise.all([
            ig.generateCaption(business.name, idea.name, context, "authentic", prefs),
            imgGen.generatePostImage(business.name, context),
          ]);
          const appUrl = process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:3000";
          const imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
          console.log(`[Campaign task] Caption generated, imageUrl=${imageUrl}`);

          if (task.mode === "auto") {
            try {
              const post = await ig.createImagePost(meta.accessToken, meta.businessAccountId, imageUrl, captionResult.caption);
              console.log(`[Campaign task] Posted to Instagram mediaId=${post.mediaId}`);
              outputData = { fields:[
                { label:"Status",   value:"Posted to Instagram" },
                { label:"Caption",  value:captionResult.body },
                { label:"Hashtags", value:captionResult.hashtags },
                { label:"Media ID", value:post.mediaId },
              ], imageUrl, channel:"instagram", published:true };
            } catch(postErr) {
              console.error(`[Campaign task] Instagram post failed:`, postErr.message);
              outputData = { fields:[
                { label:"Status",   value:"Instagram post failed" },
                { label:"Error",    value:postErr.friendlyMessage || postErr.message },
                { label:"Caption",  value:captionResult.body },
                { label:"Image",    value:imageUrl },
                { label:"Next step",value:"Review and post manually from Hub → Marketing → Instagram" },
              ], imageUrl, channel:"instagram", published:false };
            }
          } else {
            outputData = { fields:[
              { label:"Status",   value:"Caption + image ready — review and post" },
              { label:"Caption",  value:captionResult.body },
              { label:"Hashtags", value:captionResult.hashtags },
              { label:"Image URL",value:imageUrl },
              { label:"Next step",value:"Go to Hub → Marketing → Instagram → Create Post to publish" },
            ], imageUrl, channel:"instagram", published:false };
          }
        }
      }
    }

    if (!outputData) outputData = await generateTaskOutput(task, business, idea, intake);

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

    res.json({ task: { ...updated, steps: JSON.parse(updated.steps || "[]"), outputData } });
  } catch (e) {
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
