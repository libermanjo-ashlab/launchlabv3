const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const tt = require("../services/tiktok");

const prisma = new PrismaClient();

function getMeta(intg) {
  try { return JSON.parse(intg?.metadata || "{}"); } catch { return {}; }
}

async function getCredentials(businessId, userId) {
  const biz = await prisma.business.findFirst({ where: { id: businessId, userId } });
  if (!biz) throw Object.assign(new Error("Business not found"), { status: 404 });
  const intg = await prisma.integration.findFirst({ where: { businessId, provider: "tiktok" } });
  const meta = getMeta(intg);
  if (!meta.accessToken) {
    throw Object.assign(
      new Error("TikTok credentials incomplete — add Access Token and Open ID in Hub → TikTok"),
      { status: 400 }
    );
  }
  return { biz, intg, meta };
}

// GET /:businessId/profile
router.get("/:businessId/profile", requireAuth, async (req, res, next) => {
  try {
    const { meta } = await getCredentials(req.params.businessId, req.userId);
    const profile = await tt.getProfile(meta);
    res.json({ profile });
  } catch (e) { next(e); }
});

// GET /:businessId/videos
router.get("/:businessId/videos", requireAuth, async (req, res, next) => {
  try {
    const { meta } = await getCredentials(req.params.businessId, req.userId);
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const videos = await tt.getVideos(meta, limit);
    res.json({ videos });
  } catch (e) { next(e); }
});

// POST /:businessId/post — { imageUrls?, caption }
router.post("/:businessId/post", requireAuth, async (req, res, next) => {
  try {
    const { meta } = await getCredentials(req.params.businessId, req.userId);
    const { imageUrls, caption } = req.body;
    if (!caption?.trim()) return res.status(400).json({ error: "caption required" });
    if (!imageUrls?.length) return res.status(400).json({ error: "imageUrls required for TikTok photo post" });
    const result = await tt.postPhoto(meta, imageUrls, caption);
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
});

module.exports = router;
