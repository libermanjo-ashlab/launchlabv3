const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const { sendEmail, getEmailStats } = require("../services/emailChannel");
const openaiSvc = require("../services/openaiService");

const prisma = new PrismaClient();

function getMeta(intg) {
  try { return JSON.parse(intg?.metadata || "{}"); } catch { return {}; }
}

async function getIntegration(businessId, userId) {
  const biz = await prisma.business.findFirst({ where: { id: businessId, userId } });
  if (!biz) throw Object.assign(new Error("Business not found"), { status: 404 });
  const intg = await prisma.integration.findFirst({ where: { businessId, provider: "email" } });
  return { biz, intg, meta: getMeta(intg) };
}

// GET /:businessId/stats
router.get("/:businessId/stats", requireAuth, async (req, res, next) => {
  try {
    const { meta } = await getIntegration(req.params.businessId, req.userId);
    const stats = await getEmailStats(meta);
    res.json({ stats, address: meta.address, provider: meta.provider });
  } catch (e) { next(e); }
});

// POST /:businessId/send — { to, subject, body, html? }
router.post("/:businessId/send", requireAuth, async (req, res, next) => {
  try {
    const { meta, biz } = await getIntegration(req.params.businessId, req.userId);
    const { to, subject, body, html } = req.body;
    if (!to || !subject || !body) return res.status(400).json({ error: "to, subject, and body required" });

    const result = await sendEmail({
      provider: meta.provider,
      apiKey: meta.apiKey,
      fromEmail: meta.address,
      fromName: biz.name,
      to, subject, body, html,
    });

    if (result.sent) {
      // Bump sent counter in metadata
      const newMeta = { ...meta, emailsSent: (meta.emailsSent || 0) + 1 };
      await prisma.integration.upsert({
        where: { businessId_provider: { businessId: req.params.businessId, provider: "email" } },
        update: { metadata: JSON.stringify(newMeta), status: "connected" },
        create: { businessId: req.params.businessId, provider: "email", status: "connected", metadata: JSON.stringify(newMeta) },
      });
    }

    res.json(result);
  } catch (e) { next(e); }
});

// POST /:businessId/generate — { context, type? } — generate email copy without sending
router.post("/:businessId/generate", requireAuth, async (req, res, next) => {
  try {
    const { biz, meta } = await getIntegration(req.params.businessId, req.userId);
    const { context, type = "newsletter" } = req.body;
    if (!context) return res.status(400).json({ error: "context required" });

    const brandId = await getBrandIdentity(req.params.businessId);
    const text = await openaiSvc.generateChannelCaption({
      businessName: biz.name,
      channel: "email",
      context: `${type}: ${context}`,
      brandIdentity: brandId,
    });

    // Parse out subject and body (model returns them formatted)
    const lines = text.split("\n").filter(l => l.trim());
    const subjectLine = lines.find(l => /^subject:/i.test(l));
    const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, "").trim() : `${biz.name} — ${context.slice(0, 50)}`;
    const body = lines.filter(l => !(/^subject:/i.test(l))).join("\n").trim();

    res.json({ subject, body, from: meta.address || biz.name });
  } catch (e) { next(e); }
});

async function getBrandIdentity(businessId) {
  try {
    const out = await prisma.businessOutput.findFirst({ where: { businessId, type: "brand_identity" } });
    if (out?.content) return JSON.parse(out.content);
  } catch {}
  return {};
}

module.exports = router;
