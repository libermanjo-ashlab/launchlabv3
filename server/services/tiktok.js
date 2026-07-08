/**
 * TikTok Content Posting API v2 service — API key based (like Instagram)
 *
 * Credentials stored in integration.metadata by the user:
 *   clientKey    — from developers.tiktok.com App → App details
 *   clientSecret — from developers.tiktok.com App → App details
 *   accessToken  — generated from TikTok developer sandbox or production via:
 *                  developers.tiktok.com → your App → Sandbox → generate token
 *   openId       — your TikTok Open ID (shown alongside the access token)
 *
 * Note: TikTok production posting requires app review approval.
 * The sandbox environment works immediately for testing.
 */

const BASE = "https://open.tiktokapis.com";

async function apiFetch(path, method = "GET", body = null, accessToken) {
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
    throw new Error(data.error.message || `TikTok error: ${data.error.code}`);
  }
  return data;
}

async function getProfile(meta) {
  if (!meta.accessToken) throw new Error("TikTok access token not set");
  const data = await apiFetch(
    "/v2/user/info/?fields=open_id,display_name,bio_description,follower_count,following_count,likes_count,video_count",
    "GET", null, meta.accessToken
  );
  return data.data?.user || {};
}

async function getVideos(meta, maxCount = 10) {
  if (!meta.accessToken) return [];
  try {
    const data = await apiFetch(
      "/v2/video/list/?fields=id,title,create_time,view_count,like_count,comment_count,share_count",
      "POST", { max_count: maxCount }, meta.accessToken
    );
    return data.data?.videos || [];
  } catch {
    return [];
  }
}

// Photo / carousel post — image must be a publicly accessible URL
async function postPhoto(meta, imageUrls, caption) {
  if (!meta.accessToken) throw new Error("TikTok access token not set");
  const data = await apiFetch("/v2/post/publish/content/init/", "POST", {
    post_info: {
      title: (caption || "").slice(0, 150),
      privacy_level: "PUBLIC_TO_EVERYONE",
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
    },
    source_info: {
      source: "PULL_FROM_URL",
      photo_images: imageUrls,
      photo_cover_index: 0,
      post_mode: "DIRECT_POST",
      media_type: "PHOTO",
    },
  }, meta.accessToken);
  return data.data || {};
}

module.exports = { getProfile, getVideos, postPhoto };
