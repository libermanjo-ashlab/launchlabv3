/**
 * /api/instagram — Instagram Graph API integration
 *
 * All routes require a stored access token + businessAccountId in the
 * "instagram" integration record for the business.
 *
 * GET  /:businessId/profile              — account profile + follower count
 * GET  /:businessId/insights             — account-level metrics (30d default)
 * GET  /:businessId/media                — recent posts with engagement data
 * GET  /:businessId/media/:mediaId/comments — comments on a specific post
 * POST /:businessId/comments/:commentId/reply — reply to a comment
 * POST /:businessId/post                 — create and publish a new feed post
 * POST /:businessId/generate-caption     — AI-generate a caption for a post
 * POST /:businessId/act                  — act on a marketing insight (autopilot or plan)
 */

const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const multer      = require("multer");
const sharp       = require("sharp");
const { PrismaClient } = require("@prisma/client");
const ig         = require("../services/instagram");
const imgGen     = require("../services/imageGen");
const openaiSvc  = require("../services/openaiService");
const { getBrandIdentity } = require("../services/brandIdentity");
const log    = require("../lib/logger");

const prisma  = new PrismaClient();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── Public image serving (no auth — Instagram's CDN fetches this) ─────────────
router.get("/images/:id", (req, res) => {
  const buf = imgGen.getImage(req.params.id);
  if (!buf) return res.status(404).json({ error: "Image not found or expired" });
  res.set("Content-Type", "image/png");
  res.set("Cache-Control", "public, max-age=7200");
  res.set("Access-Control-Allow-Origin", "*"); // allow canvas crossOrigin load from any origin
  res.send(buf);
});

// ── Image upload — authenticated user uploads their own image ─────────────────
// Accepts multipart/form-data with field "image". Stores in memory, returns
// a self-hosted URL the client can pass as imageUrl for Instagram posts.
router.post("/images/upload", requireAuth, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    // Normalise to PNG, max 1080×1080
    const buf = await sharp(req.file.buffer)
      .resize(1080, 1080, { fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 8 })
      .toBuffer();
    const id = imgGen.storeImage(buf);
    const appUrl = require("../lib/logger").getAppUrl();
    res.json({ imageUrl: `${appUrl}/api/instagram/images/${id}`, imageId: id });
  } catch(e) { next(e); }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getIgCreds(businessId, userId) {
  const biz = await prisma.business.findFirst({ where: { id: businessId, userId } });
  if (!biz) throw Object.assign(new Error("Business not found"), { status: 404 });

  const intg = await prisma.integration.findFirst({ where: { businessId, provider: "instagram" } });
  const meta = intg?.metadata ? JSON.parse(intg.metadata) : {};

  if (!meta.accessToken)       throw Object.assign(new Error("Instagram Access Token not set. Open Hub → Instagram → expand the card → enter your Access Token (see the Setup Guide inside the card)."), { status: 400, missingField: "accessToken" });
  if (!meta.businessAccountId) throw Object.assign(new Error("Instagram Business Account ID not set. Open Hub → Instagram → expand the card → enter your Business Account ID."), { status: 400, missingField: "businessAccountId" });

  return { biz, meta };
}

function igErrorResponse(res, err) {
  const status = err.status || (err.permissionError ? 403 : err.tokenExpired ? 401 : 500);
  return res.status(status).json({
    error: err.friendlyMessage || err.message,
    igCode: err.igCode,
    permissionError: err.permissionError || false,
    tokenExpired:    err.tokenExpired    || false,
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/instagram/:businessId/profile
router.get("/:businessId/profile", requireAuth, async (req, res, next) => {
  try {
    const { meta } = await getIgCreds(req.params.businessId, req.userId);
    const profile = await ig.getProfile(meta.accessToken, meta.businessAccountId);
    res.json({ profile });
  } catch(e) { if (e.igCode) return igErrorResponse(res, e); next(e); }
});

// GET /api/instagram/:businessId/insights?days=30
router.get("/:businessId/insights", requireAuth, async (req, res, next) => {
  try {
    const { meta } = await getIgCreds(req.params.businessId, req.userId);
    const days = Math.min(parseInt(req.query.days || "30"), 90);
    const insights = await ig.getAccountInsights(meta.accessToken, meta.businessAccountId, days);
    res.json({ insights });
  } catch(e) { if (e.igCode) return igErrorResponse(res, e); next(e); }
});

// GET /api/instagram/:businessId/media?limit=12
router.get("/:businessId/media", requireAuth, async (req, res, next) => {
  try {
    const { meta } = await getIgCreds(req.params.businessId, req.userId);
    const limit = Math.min(parseInt(req.query.limit || "12"), 30);
    const media = await ig.getRecentMedia(meta.accessToken, meta.businessAccountId, limit);

    // Fetch per-post insights in parallel (fail gracefully per post)
    const enriched = await Promise.all(media.map(async (m) => {
      try {
        const postInsights = await ig.getMediaInsights(meta.accessToken, m.id, m.media_type);
        return { ...m, postInsights };
      } catch { return m; }
    }));

    res.json({ media: enriched });
  } catch(e) { if (e.igCode) return igErrorResponse(res, e); next(e); }
});

// GET /api/instagram/:businessId/media/:mediaId/comments
router.get("/:businessId/media/:mediaId/comments", requireAuth, async (req, res, next) => {
  try {
    const { meta } = await getIgCreds(req.params.businessId, req.userId);
    const comments = await ig.getComments(meta.accessToken, req.params.mediaId);
    res.json({ comments });
  } catch(e) { if (e.igCode) return igErrorResponse(res, e); next(e); }
});

// POST /api/instagram/:businessId/comments/:commentId/reply
router.post("/:businessId/comments/:commentId/reply", requireAuth, async (req, res, next) => {
  try {
    const { meta } = await getIgCreds(req.params.businessId, req.userId);
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "message is required" });
    const result = await ig.replyToComment(meta.accessToken, req.params.commentId, message);
    res.json({ success: true, result });
  } catch(e) { if (e.igCode) return igErrorResponse(res, e); next(e); }
});

// POST /api/instagram/:businessId/comments/:commentId/hide
router.post("/:businessId/comments/:commentId/hide", requireAuth, async (req, res, next) => {
  try {
    const { meta } = await getIgCreds(req.params.businessId, req.userId);
    const hide = req.body.hide !== false;
    const result = await ig.hideComment(meta.accessToken, req.params.commentId, hide);
    res.json({ success: true, result });
  } catch(e) { if (e.igCode) return igErrorResponse(res, e); next(e); }
});

// POST /api/instagram/:businessId/post
// Body: { caption, imageUrl? }
// If imageUrl is omitted, a branded post image is generated automatically.
router.post("/:businessId/post", requireAuth, async (req, res, next) => {
  const t0 = Date.now();
  try {
    const { biz, meta } = await getIgCreds(req.params.businessId, req.userId);
    let { imageUrl, caption } = req.body;

    log.info("IMAGE", "POST /:businessId/post — entry", {
      businessId: req.params.businessId,
      hasCaption: !!caption?.trim(),
      hasImageUrl: !!imageUrl?.trim(),
      captionLen: caption?.length,
    });

    if (!caption?.trim()) return res.status(400).json({ error: "caption is required" });

    // Auto-generate image if none provided
    if (!imageUrl?.trim()) {
      const appUrl    = log.getAppUrl();
      const brandId   = await getBrandIdentity(req.params.businessId);
      // Extract body by scanning from the tail for the trailing hashtag block
      const captionLines = caption.split("\n");
      let captionHashStart = captionLines.length;
      for (let i = captionLines.length - 1; i >= 0; i--) {
        const t = captionLines[i].trim();
        if (t === "" || /^#\w/.test(t)) continue;
        captionHashStart = i + 1;
        break;
      }
      const captionBody = captionLines.slice(0, captionHashStart).join("\n").trim().slice(0, 300);
      if (process.env.OPENAI_API_KEY) {
        try {
          log.info("IMAGE", "Attempting DALL-E 3 for post route", { businessName: biz.name });
          const imgBuf  = await openaiSvc.generatePostImage(biz.name, captionBody, brandId);
          const imageId = imgGen.storeImage(imgBuf);
          imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
          log.info("IMAGE", "DALL-E 3 image ready for post route", { imageId, imageUrl });
        } catch(imgErr) {
          log.warn("IMAGE", "DALL-E 3 FAILED for post route — SVG fallback", { error: imgErr.message });
          const imageId = await imgGen.generatePostImage(biz.name, captionBody);
          imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
        }
      } else {
        log.warn("IMAGE", "No OPENAI_API_KEY — SVG fallback for post route", { businessName: biz.name });
        const imageId = await imgGen.generatePostImage(biz.name, captionBody);
        imageUrl = `${appUrl}/api/instagram/images/${imageId}`;
      }
    }

    log.info("IMAGE", "Calling ig.createImagePost", {
      imageUrl: imageUrl?.slice(0, 100),
      captionLen: caption?.length,
      businessAccountId: meta.businessAccountId?.slice(0, 8) + "...",
    });

    const result = await ig.createImagePost(meta.accessToken, meta.businessAccountId, imageUrl.trim(), caption.trim());

    log.info("IMAGE", "Instagram post published", { mediaId: result.mediaId, ms: Date.now() - t0 });

    res.json({
      success: true,
      mediaId: result.mediaId,
      permalink: `https://www.instagram.com/p/${result.mediaId}/`,
    });
  } catch(e) {
    log.error("IMAGE", "POST /:businessId/post FAILED", {
      error: e.message,
      igCode: e.igCode,
      stack: e.stack?.split("\n")[1],
      ms: Date.now() - t0,
    });
    if (e.igCode) return igErrorResponse(res, e);
    next(e);
  }
});

// POST /api/instagram/:businessId/generate-caption
// Body: { context, tone }
// Returns caption. Image is generated client-side (browser Canvas) for correct font rendering.
router.post("/:businessId/generate-caption", requireAuth, async (req, res, next) => {
  try {
    const { biz } = await getIgCreds(req.params.businessId, req.userId);
    let idea = {}; try { idea = JSON.parse(biz.ideaData || "{}"); } catch {}

    const { context, tone } = req.body;
    const brandId    = await getBrandIdentity(req.params.businessId);
    const marketOut  = await prisma.businessOutput.findFirst({ where: { businessId: req.params.businessId, type: "marketing_insights" } });
    let marketInsights = "";
    try { const md = JSON.parse(marketOut?.content || "{}"); marketInsights = md.report?.marketAnalysis?.summary || ""; } catch {}

    let captionResult;
    if (process.env.OPENAI_API_KEY) {
      captionResult = await openaiSvc.generateInstagramCaption({
        businessName: biz.name, businessType: idea.name, context, tone,
        brandIdentity: brandId, marketInsights,
      });
    } else {
      const metricsOut = await prisma.businessOutput.findFirst({ where: { businessId: req.params.businessId, type: "user_metrics" } });
      let prefs = {}; try { const m = JSON.parse(metricsOut?.content || "{}"); prefs = m.prefs || {}; } catch {}
      captionResult = await ig.generateCaption(biz.name, idea.name, context, tone, prefs);
    }

    // Return caption only — client generates image via Canvas API (no server-side font issues)
    res.json({ ...captionResult });
  } catch(e) { if (e.igCode) return igErrorResponse(res, e); next(e); }
});

// POST /api/instagram/:businessId/generate-reply
// Body: { commentText, postContext }
router.post("/:businessId/generate-reply", requireAuth, async (req, res, next) => {
  try {
    const { biz } = await getIgCreds(req.params.businessId, req.userId);
    const { commentText, postContext } = req.body;
    if (!commentText?.trim()) return res.status(400).json({ error: "commentText is required" });
    const reply = await ig.generateCommentReply(biz.name, commentText, postContext);
    res.json({ reply });
  } catch(e) { if (e.igCode) return igErrorResponse(res, e); next(e); }
});

/**
 * POST /api/instagram/:businessId/act
 * Acts on a marketing insight using the Instagram API.
 *
 * If autopilot is ON:  executes actions that don't require an image (comment
 *   replies, bio updates); for post creation generates caption and returns it
 *   with a "needs image URL" flag.
 * If autopilot is OFF: returns a detailed manual action plan.
 *
 * Body: { insight, autopilot: boolean, imageUrl?: string }
 */
router.post("/:businessId/act", requireAuth, async (req, res, next) => {
  try {
    const { biz, meta } = await getIgCreds(req.params.businessId, req.userId);
    const { insight, autopilot, imageUrl } = req.body;
    if (!insight) return res.status(400).json({ error: "insight is required" });

    let idea = {}; try { idea = JSON.parse(biz.ideaData || "{}"); } catch {}
    const metricsOut = await prisma.businessOutput.findFirst({ where: { businessId: req.params.businessId, type: "user_metrics" } });
    let prefs = {}; try { const m = JSON.parse(metricsOut?.content || "{}"); prefs = m.prefs || {}; } catch {}

    const actions = [];

    // ── Determine action type from insight ──────────────────────────────────
    const rec = (insight.recommendation || "").toLowerCase();
    const obs = (insight.agentObservation || "").toLowerCase();
    const combined = rec + " " + obs;

    const wantsPost     = /post|publish|share|content|caption|reel|story/i.test(combined);
    const wantsComments = /comment|reply|respond|engage/i.test(combined);
    const wantsBio      = /bio|profile|description|about/i.test(combined);

    // ── Generate caption + image for post actions ───────────────────────────
    if (wantsPost) {
      const appUrl = require("../lib/logger").getAppUrl();
      const context = insight.recommendation || insight.agentObservation;

      const [captionResult, imageId] = await Promise.all([
        ig.generateCaption(biz.name, idea.name, context, "authentic, on-brand", prefs),
        imgGen.generatePostImage(biz.name, context),
      ]);

      const generatedImageUrl = imageUrl || `${appUrl}/api/instagram/images/${imageId}`;

      if (autopilot) {
        try {
          const postResult = await ig.createImagePost(
            meta.accessToken, meta.businessAccountId, generatedImageUrl, captionResult.caption
          );
          actions.push({
            type: "post_published",
            caption: captionResult.caption,
            imageUrl: generatedImageUrl,
            mediaId: postResult.mediaId,
            permalink: `https://www.instagram.com/p/${postResult.mediaId}/`,
          });
        } catch(postErr) {
          actions.push({
            type: "post_failed",
            caption: captionResult.caption,
            imageUrl: generatedImageUrl,
            error: postErr.friendlyMessage || postErr.message,
          });
        }
      } else {
        actions.push({
          type: "caption_ready",
          caption: captionResult.caption,
          body: captionResult.body,
          hashtags: captionResult.hashtags,
          imageUrl: generatedImageUrl,
          imageId,
          message: "Caption and post image generated. Review and publish when ready.",
        });
      }
    }

    // ── Reply to unanswered comments ─────────────────────────────────────────
    if (wantsComments) {
      try {
        // Get recent media first
        const media = await ig.getRecentMedia(meta.accessToken, meta.businessAccountId, 5);
        const commentResults = [];

        for (const post of media.slice(0, 3)) {
          const comments = await ig.getComments(meta.accessToken, post.id);
          for (const comment of comments.slice(0, 3)) {
            const suggestedReply = await ig.generateCommentReply(biz.name, comment.text, post.caption?.slice(0, 100));

            if (autopilot) {
              try {
                await ig.replyToComment(meta.accessToken, comment.id, suggestedReply);
                commentResults.push({ commentId: comment.id, username: comment.username, text: comment.text, replied: suggestedReply, published: true });
              } catch(replyErr) {
                commentResults.push({ commentId: comment.id, username: comment.username, text: comment.text, replied: suggestedReply, published: false, error: replyErr.message });
              }
            } else {
              commentResults.push({ commentId: comment.id, username: comment.username, text: comment.text, suggested: suggestedReply, published: false });
            }
          }
        }

        actions.push({ type: autopilot ? "comments_replied" : "comment_suggestions", comments: commentResults });
      } catch(commentErr) {
        actions.push({ type: "comments_error", error: commentErr.friendlyMessage || commentErr.message });
      }
    }

    // ── Bio / profile update ─────────────────────────────────────────────────
    if (wantsBio && !wantsPost && !wantsComments) {
      const Anthropic = require("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6", max_tokens: 200,
        messages: [{ role: "user", content: `Write an optimized Instagram bio for "${biz.name}" (${idea.name || "business"}). Context: ${insight.recommendation}. Max 150 characters. No hashtags. No quotes.` }],
      });
      const newBio = msg.content[0]?.text?.trim() || "";
      actions.push({ type: "bio_suggestion", bio: newBio, note: "Profile bio update via API requires Facebook Page admin access. Copy and paste this bio into your Instagram profile manually if it doesn't apply automatically." });
    }

    // ── Fallback: return action plan ─────────────────────────────────────────
    if (actions.length === 0) {
      actions.push({
        type: "action_plan",
        steps: [
          `Insight: ${insight.agentObservation}`,
          `Action: ${insight.recommendation}`,
          `How to do it manually: Log into your Instagram account, go to your profile, and apply the recommendation above.`,
        ],
      });
    }

    res.json({ success: true, autopilot: !!autopilot, actions });
  } catch(e) {
    if (e.igCode || e.status === 400) return igErrorResponse(res, e);
    next(e);
  }
});

module.exports = router;
