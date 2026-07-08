const router    = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const tw = require("../services/twitter");

const prisma = new PrismaClient();

function getMeta(intg) {
  try { return JSON.parse(intg?.metadata || "{}"); } catch { return {}; }
}

async function getCredentials(businessId, userId) {
  const biz = await prisma.business.findFirst({ where: { id: businessId, userId } });
  if (!biz) throw Object.assign(new Error("Business not found"), { status: 404 });
  const intg = await prisma.integration.findFirst({ where: { businessId, provider: "twitter" } });
  const meta = getMeta(intg);
  if (!meta.accessToken) throw Object.assign(new Error("Twitter not connected — connect in Hub → X / Twitter"), { status: 400 });
  return { biz, intg, meta };
}

async function withTokenRefresh(meta, intg, fn) {
  try {
    return await fn(meta.accessToken);
  } catch (e) {
    if (e.message?.includes("401") || e.message?.includes("expired")) {
      if (!meta.refreshToken) throw e;
      const tokens = await tw.refreshAccessToken(meta.refreshToken);
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
    const profile = await withTokenRefresh(meta, intg, t => tw.getProfile(t));
    res.json({ profile });
  } catch (e) { next(e); }
});

// GET /:businessId/tweets
router.get("/:businessId/tweets", requireAuth, async (req, res, next) => {
  try {
    const { intg, meta } = await getCredentials(req.params.businessId, req.userId);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const tweets = await withTokenRefresh(meta, intg, t => tw.getRecentTweets(t, meta.userId, limit));
    res.json({ tweets });
  } catch (e) { next(e); }
});

// POST /:businessId/post — { text }
router.post("/:businessId/post", requireAuth, async (req, res, next) => {
  try {
    const { intg, meta } = await getCredentials(req.params.businessId, req.userId);
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "text required" });
    const tweet = await withTokenRefresh(meta, intg, t => tw.postTweet(t, text.trim()));
    res.json({ success: true, tweet, tweetUrl: `https://x.com/i/web/status/${tweet.id}` });
  } catch (e) { next(e); }
});

module.exports = router;
