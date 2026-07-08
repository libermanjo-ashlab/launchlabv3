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
  if (!meta.accessToken) throw Object.assign(new Error("TikTok not connected — connect in Hub → TikTok"), { status: 400 });
  return { biz, intg, meta };
}

async function withTokenRefresh(meta, intg, fn) {
  try {
    return await fn(meta.accessToken);
  } catch (e) {
    if (e.message?.includes("access_token_invalid") || e.message?.includes("10005")) {
      if (!meta.refreshToken) throw e;
      const tokens = await tt.refreshAccessToken(meta.refreshToken);
      const newMeta = { ...meta, accessToken: tokens.access_token, refreshToken: tokens.refresh_token || meta.refreshToken };
      await prisma.integration.update({
        where: { id: intg.id },
        data: { metadata: JSON.stringify(newMeta) },
      });
      return await fn(tokens.access_token);
    }
    throw e;
  }
}

// GET /:businessId/profile
router.get("/:businessId/profile", requireAuth, async (req, res, next) => {
  try {
    const { intg, meta } = await getCredentials(req.params.businessId, req.userId);
    const profile = await withTokenRefresh(meta, intg, t => tt.getProfile(t));
    res.json({ profile });
  } catch (e) { next(e); }
});

// GET /:businessId/videos
router.get("/:businessId/videos", requireAuth, async (req, res, next) => {
  try {
    const { intg, meta } = await getCredentials(req.params.businessId, req.userId);
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const videos = await withTokenRefresh(meta, intg, t => tt.getVideos(t, limit));
    res.json({ videos });
  } catch (e) { next(e); }
});

// POST /:businessId/post — { imageUrls?, caption }
router.post("/:businessId/post", requireAuth, async (req, res, next) => {
  try {
    const { intg, meta } = await getCredentials(req.params.businessId, req.userId);
    const { imageUrls, caption } = req.body;
    if (!caption?.trim()) return res.status(400).json({ error: "caption required" });

    let result;
    if (imageUrls?.length > 0) {
      result = await withTokenRefresh(meta, intg, t => tt.postPhoto(t, imageUrls, caption));
    } else {
      result = await withTokenRefresh(meta, intg, t => tt.postCaption(t, caption));
    }
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
});

module.exports = router;
