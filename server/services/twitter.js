/**
 * Twitter/X API v2 service
 * Auth: OAuth 2.0 Authorization Code (server-side)
 * Credentials (Railway env): TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_REDIRECT_URI
 * Per-user tokens stored in integration.metadata: { accessToken, refreshToken, userId, username }
 */

const BASE = "https://api.twitter.com";

async function apiFetch(path, method = "GET", body = null, accessToken) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.detail || (data.errors?.[0]?.message) || data.title || "Twitter API error";
    throw new Error(msg);
  }
  return data;
}

async function getProfile(accessToken) {
  const data = await apiFetch(
    "/2/users/me?user.fields=public_metrics,profile_image_url,description,url,created_at",
    "GET", null, accessToken
  );
  return data.data || {};
}

async function getRecentTweets(accessToken, userId, maxResults = 10) {
  try {
    const data = await apiFetch(
      `/2/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=public_metrics,created_at&expansions=attachments.media_keys`,
      "GET", null, accessToken
    );
    return data.data || [];
  } catch {
    return [];
  }
}

async function postTweet(accessToken, text) {
  const data = await apiFetch("/2/tweets", "POST", { text }, accessToken);
  return data.data || {};
}

async function refreshAccessToken(refreshToken) {
  if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
    throw new Error("Twitter app credentials not configured — add TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET to environment variables");
  }
  const creds = Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${BASE}/2/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${creds}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.TWITTER_CLIENT_ID,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || "Twitter token refresh failed");
  return data;
}

// Build the OAuth authorize URL
function buildAuthUrl(state) {
  if (!process.env.TWITTER_CLIENT_ID) throw new Error("TWITTER_CLIENT_ID not set");
  const url = new URL("https://twitter.com/i/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", process.env.TWITTER_CLIENT_ID);
  url.searchParams.set("redirect_uri", process.env.TWITTER_REDIRECT_URI || `${process.env.SERVER_URL || ""}/api/integrations/twitter/callback`);
  url.searchParams.set("scope", "tweet.read tweet.write users.read offline.access");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", "challenge");
  url.searchParams.set("code_challenge_method", "plain");
  return url.toString();
}

// Exchange auth code for tokens
async function exchangeCode(code) {
  if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
    throw new Error("Twitter app credentials not configured");
  }
  const redirectUri = process.env.TWITTER_REDIRECT_URI || `${process.env.SERVER_URL || ""}/api/integrations/twitter/callback`;
  const creds = Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${BASE}/2/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${creds}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.TWITTER_CLIENT_ID,
      code_verifier: "challenge",
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || "Twitter token exchange failed");
  return data;
}

module.exports = { getProfile, getRecentTweets, postTweet, refreshAccessToken, buildAuthUrl, exchangeCode };
