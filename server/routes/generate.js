const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const ai = require("../services/ai");

const prisma = new PrismaClient();

async function getBizIntakeIdea(bizId, userId) {
  const biz = await prisma.business.findFirst({ where:{ id:bizId, userId } });
  if (!biz) throw Object.assign(new Error("Business not found"),{status:404});
  const idea   = JSON.parse(biz.ideaData   || "{}");
  const intake = JSON.parse(biz.intakeData  || "{}");
  return { biz, idea, intake };
}

async function upsertOutput(bizId, type, title, content) {
  const existing = await prisma.businessOutput.findFirst({ where:{ businessId:bizId, type } });
  const data = { type, title, content };
  return existing
    ? prisma.businessOutput.update({ where:{ id:existing.id }, data })
    : prisma.businessOutput.create({ data:{ businessId:bizId, ...data } });
}

router.post("/ideas", requireAuth, async (req, res, next) => {
  try {
    const { intake } = req.body;
    if (!intake?.location) return res.status(400).json({ error:"Location is required" });
    const ideas = await ai.generateIdeas(intake);
    res.json({ ideas });
  } catch(e) { next(e); }
});

router.post("/tasks", requireAuth, async (req, res, next) => {
  try {
    const { idea, intake, businessId } = req.body;
    if (!idea || !intake) return res.status(400).json({ error:"idea and intake are required" });
    const tasks = await ai.generateTasks(idea, intake);
    if (businessId) {
      const created = await Promise.all(tasks.map((t,i) =>
        prisma.task.create({ data:{
          businessId, name:t.name, category:t.category||"Operations",
          description:t.description, estimatedTime:t.estimatedTime||"",
          estimatedCost:t.estimatedCost||"Free", canAutomate:!!t.canAutomate,
          steps:JSON.stringify(t.steps||[]), mode:t.canAutomate?"auto":"guided",
          status:"pending", sortOrder:i,
          outputData: (t.parentNote||t.tip) ? JSON.stringify({ fields:[], parentNote:t.parentNote||t.tip||"" }) : null,
        }})
      ));
      return res.json({ tasks:created });
    }
    res.json({ tasks });
  } catch(e) { next(e); }
});

router.post("/website", requireAuth, async (req, res, next) => {
  try {
    const { businessId } = req.body;
    const { biz, idea, intake } = await getBizIntakeIdea(businessId, req.userId);
    const html   = await ai.generateWebsite(biz, idea, intake);
    const output = await upsertOutput(businessId, "website", biz.name+" — Website", html);
    res.json({ output });
  } catch(e) { next(e); }
});

router.post("/business-plan", requireAuth, async (req, res, next) => {
  try {
    const { businessId } = req.body;
    const { biz, idea, intake } = await getBizIntakeIdea(businessId, req.userId);
    const html   = await ai.generateBusinessPlan(biz, idea, intake);
    const output = await upsertOutput(businessId, "business_plan", biz.name+" — Business Plan", html);
    res.json({ output });
  } catch(e) { next(e); }
});

router.post("/social-content", requireAuth, async (req, res, next) => {
  try {
    const { businessId } = req.body;
    const { biz, idea, intake } = await getBizIntakeIdea(businessId, req.userId);
    const content = await ai.generateSocialContent(biz, idea, intake);
    const output  = await upsertOutput(businessId, "social_content", "30-Day Social Calendar", JSON.stringify(content, null, 2));
    res.json({ output });
  } catch(e) { next(e); }
});

router.post("/email-templates", requireAuth, async (req, res, next) => {
  try {
    const { businessId } = req.body;
    const { biz, idea }  = await getBizIntakeIdea(businessId, req.userId);
    const content = await ai.generateEmailTemplates(biz, idea);
    const output  = await upsertOutput(businessId, "email_templates", "Email Templates", JSON.stringify(content, null, 2));
    res.json({ output });
  } catch(e) { next(e); }
});

router.post("/chat", requireAuth, async (req, res, next) => {
  try {
    const { message, businessId } = req.body;
    if (!message) return res.status(400).json({ error:"message is required" });
    let context = { businessName:"your business" };
    if (businessId) {
      const biz = await prisma.business.findFirst({ where:{ id:businessId, userId:req.userId } });
      if (biz) {
        const idea   = JSON.parse(biz.ideaData   || "{}");
        const intake = JSON.parse(biz.intakeData  || "{}");
        const user   = await prisma.user.findUnique({ where:{ id:req.userId }, select:{ age:true } });
        context = { businessName:biz.name, businessType:idea.name, location:biz.location, age:user?.age };
      }
    }
    const reply = await ai.chatResponse(message, context);
    res.json({ reply });
  } catch(e) { next(e); }
});

module.exports = router;
