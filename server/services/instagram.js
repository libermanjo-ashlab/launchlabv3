/**
 * Instagram Graph API v22.0 service layer
 *
 * All functions accept a long-lived User Access Token and an Instagram
 * Business Account ID (also called the IG User ID in the API).
 *
 * Required token permissions:
 *   instagram_basic, instagram_manage_insights,
 *   instagram_content_publish, instagram_manage_comments,
 *   pages_read_engagement
 *
 * Tokens expire in 60 days. The user must re-generate them in
 * Meta's Graph API Explorer and update the Hub.
 */

const IG_BASE = "https://graph.facebook.com/v22.0";

// ── Core fetch helper ─────────────────────────────────────────────────────────

async function igGet(path, params = {}) {
  const url = new URL(`${IG_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.error) {
    const msg = data.error.message || "Unknown error";
    const code = data.error.code || 0;
    const err  = new Error(`Instagram API error ${code}: ${msg}`);
    err.igCode = code;
    err.igType = data.error.type;
    // Permissions error
    if (code === 10 || code === 200 || code === 190) {
      err.permissionError = true;
      err.friendlyMessage = `Missing Instagram permission. Make sure your access token includes: instagram_manage_insights, instagram_content_publish, instagram_manage_comments. Regenerate your token in Meta's Graph API Explorer.`;
    }
    // Token expired
    if (code === 190) {
      err.tokenExpired = true;
      err.friendlyMessage = "Your Instagram access token has expired. Go to Hub → Instagram → Access Token and generate a new one from Graph API Explorer.";
    }
    throw err;
  }
  return data;
}

async function igPost(path, body = {}) {
  const url = new URL(`${IG_BASE}${path}`);
  // access_token must be in body for POST
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) {
    const msg = data.error.message || "Unknown error";
    const code = data.error.code || 0;
    const err  = new Error(`Instagram API error ${code}: ${msg}`);
    err.igCode = code;
    if (code === 10 || code === 200) {
      err.permissionError = true;
      err.friendlyMessage = `Missing Instagram permission for this action. Ensure your token has: instagram_content_publish, instagram_manage_comments.`;
    }
    if (code === 190) {
      err.tokenExpired = true;
      err.friendlyMessage = "Access token expired. Regenerate it in Hub → Instagram → Access Token.";
    }
    throw err;
  }
  return data;
}

// ── Profile ───────────────────────────────────────────────────────────────────

async function getProfile(accessToken, igUserId) {
  return igGet(`/${igUserId}`, {
    fields: "id,name,username,biography,followers_count,follows_count,media_count,profile_picture_url,website",
    access_token: accessToken,
  });
}

async function updateBio(accessToken, igUserId, biography) {
  // Note: bio update via API requires pages_manage_metadata permission on linked Page
  return igPost(`/${igUserId}`, { biography, access_token: accessToken });
}

// ── Account insights ─────────────────────────────────────────────────────────

async function getAccountInsights(accessToken, igUserId, daysBack = 30) {
  const until = Math.floor(Date.now() / 1000);
  const since = until - daysBack * 86400;

  const [reachResult, followerResult] = await Promise.allSettled([
    igGet(`/${igUserId}/insights`, {
      metric: "reach,impressions,profile_views",
      period: "day",
      since: String(since),
      until: String(until),
      access_token: accessToken,
    }),
    igGet(`/${igUserId}/insights`, {
      metric: "follower_count",
      period: "day",
      since: String(since),
      until: String(until),
      access_token: accessToken,
    }),
  ]);

  return {
    reach:         reachResult.status === "fulfilled"    ? reachResult.value.data    : [],
    followerTrend: followerResult.status === "fulfilled" ? followerResult.value.data : [],
    errors: [
      reachResult.status === "rejected"    ? reachResult.reason?.friendlyMessage    : null,
      followerResult.status === "rejected" ? followerResult.reason?.friendlyMessage : null,
    ].filter(Boolean),
  };
}

// ── Media / posts ─────────────────────────────────────────────────────────────

async function getRecentMedia(accessToken, igUserId, limit = 12) {
  const data = await igGet(`/${igUserId}/media`, {
    fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
    limit: String(limit),
    access_token: accessToken,
  });
  return data.data || [];
}

async function getMediaInsights(accessToken, mediaId, mediaType = "IMAGE") {
  const metrics = mediaType === "VIDEO" || mediaType === "REELS"
    ? "impressions,reach,likes,comments,shares,saved,video_views,plays"
    : "impressions,reach,likes,comments,shares,saved";
  const data = await igGet(`/${mediaId}/insights`, { metric: metrics, access_token: accessToken });
  // Convert array to object for easier consumption
  const obj = {};
  for (const item of (data.data || [])) obj[item.name] = item.values?.[0]?.value ?? item.value ?? 0;
  return obj;
}

// ── Comments ──────────────────────────────────────────────────────────────────

async function getComments(accessToken, mediaId) {
  const data = await igGet(`/${mediaId}/comments`, {
    fields: "id,text,username,timestamp,like_count,replies{id,text,username,timestamp}",
    access_token: accessToken,
  });
  return data.data || [];
}

async function replyToComment(accessToken, commentId, message) {
  return igPost(`/${commentId}/replies`, { message, access_token: accessToken });
}

async function likeComment(accessToken, commentId) {
  return igPost(`/${commentId}/likes`, { access_token: accessToken });
}

async function hideComment(accessToken, commentId, hide = true) {
  return igPost(`/${commentId}`, { hide: String(hide), access_token: accessToken });
}

// ── Post creation ─────────────────────────────────────────────────────────────

/**
 * Publish a single-image feed post.
 * imageUrl must be a publicly accessible HTTPS URL (JPEG, PNG).
 * Returns { mediaId, containerId }
 */
async function createImagePost(accessToken, igUserId, imageUrl, caption) {
  // Step 1: Create the media container
  const container = await igPost(`/${igUserId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });

  // Step 2: Publish it
  const published = await igPost(`/${igUserId}/media_publish`, {
    creation_id: container.id,
    access_token: accessToken,
  });

  return { mediaId: published.id, containerId: container.id };
}

/**
 * Check publishing status of a container (useful before publish step).
 * Status can be: EXPIRED, ERROR, FINISHED, IN_PROGRESS, PUBLISHED
 */
async function getContainerStatus(accessToken, containerId) {
  return igGet(`/${containerId}`, {
    fields: "status_code,status",
    access_token: accessToken,
  });
}

// ── Caption generation (AI) ───────────────────────────────────────────────────

const Anthropic = require("@anthropic-ai/sdk");

async function generateCaption(businessName, businessType, context, tone, prefs) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const audienceCtx = prefs?.audience === "global"   ? "Write for a global online audience — no location references."
    : prefs?.audience === "national" ? "Write for a national audience."
    : prefs?.targetMarket            ? `Target audience: ${prefs.targetMarket}.`
    : "";

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 350,
    messages: [{ role: "user", content: `
Write ONE single Instagram caption for a single post for "${businessName}" (${businessType || "service business"}).
${context ? `Topic / inspiration: ${context}` : ""}
${tone   ? `Tone: ${tone}`   : "Tone: authentic, conversational, relatable"}
${audienceCtx}

CRITICAL rules:
- Output ONE caption only — do NOT write multiple captions or a plan
- If the topic mentions multiple post types, choose the FIRST one and write for that
- 2-4 sentences, punchy opener
- End with a call to action (question or directive)
- Hashtags on a new line, 8-12 relevant tags
- No markdown headers, no "---" dividers, no bold formatting
- No quotation marks around the caption
- No location-specific phrases unless the business is explicitly local
` }],
  });

  const full = msg.content[0]?.text?.trim() || "";
  // Split caption body from hashtags
  const parts = full.split(/\n(?=#)/);
  const body     = parts[0]?.trim() || full;
  const hashtags = parts.slice(1).join("\n").trim();
  return { caption: full, body, hashtags };
}

/**
 * Generate AI-suggested reply for a comment.
 */
async function generateCommentReply(businessName, commentText, context) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 150,
    messages: [{ role: "user", content: `
Write a brief, warm, professional Instagram reply for "${businessName}" responding to this comment: "${commentText}"
${context ? `Post context: ${context}` : ""}
Rules:
- 1-2 sentences max
- Friendly and on-brand
- No hashtags
- No quotes around the reply
` }],
  });
  return msg.content[0]?.text?.trim() || "";
}

module.exports = {
  getProfile,
  updateBio,
  getAccountInsights,
  getRecentMedia,
  getMediaInsights,
  getComments,
  replyToComment,
  likeComment,
  hideComment,
  createImagePost,
  getContainerStatus,
  generateCaption,
  generateCommentReply,
};
