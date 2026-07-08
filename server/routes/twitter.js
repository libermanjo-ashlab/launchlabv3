const router      = require("express").Router();
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
  if (!meta.apiKey || !meta.apiSecret || !meta.accessToken || !meta.accessTokenSecret) {
    throw Object.assign(
      new Error("Twitter credentials incomplete — add API Key, API Key Secret, Access Token, and Access Token Secret in Hub → X / Twitter"),
      { status: 400 }
    );
  }
  return { biz, intg, meta };
}

// GET /:businessId/profile
router.get("/:businessId/profile", requireAuth, async (req, res, next) => {
  try {
    const { meta } = await getCredentials(req.params.businessId, req.userId);
    const profile = await tw.getProfile(meta);
    // Save userId for future tweet lookups
    if (profile.id) {
      const existing = await prisma.integration.findFirst({ where: { businessId: req.params.businessId, provider: "twitter" } });
      if (existing) {
        const m = getMeta(existing);
        await prisma.integration.update({
          where: { id: existing.id },
          data: { metadata: JSON.stringify({ ...m, userId: profile.id, username: profile.username }) },
        });
      }
    }
    res.json({ profile });
  } catch (e) { next(e); }
});

// GET /:businessId/tweets
router.get("/:businessId/tweets", requireAuth, async (req, res, next) => {
  try {
    const { meta } = await getCredentials(req.params.businessId, req.userId);
    const userId = meta.userId;
    if (!userId) return res.json({ tweets: [] });
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const tweets = await tw.getRecentTweets(meta, userId, limit);
    res.json({ tweets });
  } catch (e) { next(e); }
});

// POST /:businessId/post — { text }
router.post("/:businessId/post", requireAuth, async (req, res, next) => {
  try {
    const { meta } = await getCredentials(req.params.businessId, req.userId);
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "text required" });
    const tweet = await tw.postTweet(meta, text.trim().slice(0, 280));
    res.json({ success: true, tweet, tweetUrl: tweet.id ? `https://x.com/i/web/status/${tweet.id}` : null });
  } catch (e) { next(e); }
});

module.exports = router;
