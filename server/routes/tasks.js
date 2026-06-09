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
    const intake   = JSON.parse(business.intakeData || "{}");
    const idea     = JSON.parse(business.ideaData   || "{}");

    const outputData = await generateTaskOutput(task, business, idea, intake);

    // If this is a website generation task, also save to BusinessOutput
    if (/website|web page|landing page/i.test(task.name) && outputData.websiteHtml) {
      await prisma.businessOutput.upsert({
        where: { id: `website-${business.id}` },
        update: { content: outputData.websiteHtml, updatedAt: new Date() },
        create: { id: `website-${business.id}`, businessId: business.id, type: "website", title: "Business Website", content: outputData.websiteHtml },
      }).catch(async () => {
        // If upsert fails due to missing id, just create
        await prisma.businessOutput.create({ data: { businessId: business.id, type: "website", title: "Business Website", content: outputData.websiteHtml } });
      });
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
