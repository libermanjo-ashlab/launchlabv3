/**
 * TikTok Content Posting API v2 service
 * Auth: TikTok Login Kit OAuth 2.0
 * Credentials (Railway env): TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI
 * Per-user tokens in integration.metadata: { accessToken, refreshToken, openId, username }
 *
 * Note: TikTok Content Posting API requires app review for production.
 * During development / sandbox: use sandbox mode.
 */

const BASE = "https://open.tiktokapis.com";
const AUTH_BASE = "https://www.tiktok.com";

async function apiFetch(path, method = "POST", body = null, accessToken) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (data.error && data.error.code !== "ok") {
    throw new Error(data.error.message || `TikTok API error: ${data.error.code}`);
  }
  return data;
}

async function getProfile(accessToken) {
  const data = await apiFetch(
    "/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,follower_count,following_count,likes_count,video_count",
    "GET", null, accessToken
  );
  return data.data?.user || {};
}

async function getVideos(accessToken, maxCount = 10) {
  try {
    const data = await apiFetch("/v2/video/list/?fields=id,title,create_time,share_url,view_count,like_count,comment_count,share_count", "POST", {
      max_count: maxCount,
    }, accessToken);
    return data.data?.videos || [];
  } catch {
    return [];
  }
}

// Photo/carousel post (no video upload needed — uses image URL)
async function postPhoto(accessToken, imageUrls, caption) {
  const data = await apiFetch("/v2/post/publish/content/init/", "POST", {
    post_info: {
      title: caption?.slice(0, 150) || "",
      privacy_level: "PUBLIC_TO_EVERYONE",
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
    },
    source_info: {
      source: "PULL_FROM_URL",
      photo_images: (imageUrls || []).map(url => url),
      photo_cover_index: 0,
      post_mode: "DIRECT_POST",
      media_type: "PHOTO",
    },
  }, accessToken);
  return data.data || {};
}

// Text-only post (caption without media — TikTok doesn't support pure text posts, so this returns the content for manual posting)
async function postCaption(accessToken, text) {
  return { message: "Caption ready — TikTok requires video or image content. Download your slideshow and post manually or via TikTok app.", caption: text };
}

async function refreshAccessToken(refreshToken) {
  if (!process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET) {
    throw new Error("TikTok app credentials not configured — add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET to environment variables");
  }
  const res = await fetch(`${BASE}/v2/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || "TikTok token refresh failed");
  return data;
}

function buildAuthUrl(state) {
  if (!process.env.TIKTOK_CLIENT_KEY) throw new Error("TIKTOK_CLIENT_KEY not set");
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${process.env.SERVER_URL || ""}/api/integrations/tiktok/callback`;
  const url = new URL(`${AUTH_BASE}/v2/auth/authorize/`);
  url.searchParams.set("client_key", process.env.TIKTOK_CLIENT_KEY);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "user.info.basic,user.info.stats,video.list,video.publish,video.upload");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

async function exchangeCode(code) {
  if (!process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET) {
    throw new Error("TikTok app credentials not configured");
  }
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${process.env.SERVER_URL || ""}/api/integrations/tiktok/callback`;
  const res = await fetch(`${BASE}/v2/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || `TikTok auth error: ${data.error}`);
  return data;
}

module.exports = { getProfile, getVideos, postPhoto, postCaption, refreshAccessToken, buildAuthUrl, exchangeCode };
