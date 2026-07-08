/**
 * Twitter/X API v2 service — API key based (like Instagram)
 *
 * Credentials stored in integration.metadata by the user:
 *   apiKey            — Twitter Developer Portal "API Key" (Consumer Key)
 *   apiSecret         — Twitter Developer Portal "API Key Secret" (Consumer Secret)
 *   accessToken       — Twitter Developer Portal "Access Token"
 *   accessTokenSecret — Twitter Developer Portal "Access Token Secret"
 *
 * Posting uses OAuth 1.0a (required for user-context write operations).
 * Reading public profile data uses Bearer Token derived from apiKey + apiSecret.
 */

const crypto = require("crypto");

const BASE = "https://api.twitter.com";

// ── OAuth 1.0a helpers ────────────────────────────────────────────────────────

function percentEncode(s) {
  return encodeURIComponent(String(s))
    .replace(/!/g, "%21").replace(/'/g, "%27").replace(/\(/g, "%28")
    .replace(/\)/g, "%29").replace(/\*/g, "%2A");
}

function buildOAuth1Header(method, url, bodyParams, { apiKey, apiSecret, accessToken, accessTokenSecret }) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce     = crypto.randomBytes(16).toString("hex");

  const oauthParams = {
    oauth_consumer_key:     apiKey,
    oauth_nonce:            nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp:        timestamp,
    oauth_token:            accessToken,
    oauth_version:          "1.0",
  };

  // Combine all parameters (oauth + body) for the base string
  const allParams = { ...bodyParams, ...oauthParams };
  const sortedParamStr = Object.keys(allParams)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join("&");

  const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(sortedParamStr)].join("&");
  const signingKey = `${percentEncode(apiSecret)}&${percentEncode(accessTokenSecret)}`;
  const signature  = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  oauthParams.oauth_signature = signature;

  return "OAuth " + Object.keys(oauthParams)
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");
}

async function getBearerToken(apiKey, apiSecret) {
  const creds = Buffer.from(`${percentEncode(apiKey)}:${percentEncode(apiSecret)}`).toString("base64");
  const res = await fetch(`${BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (data.errors || !data.access_token) throw new Error(data.errors?.[0]?.message || "Could not obtain bearer token");
  return data.access_token;
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function getProfile(meta) {
  // Read profile with bearer token (app-only, sufficient for public stats)
  const bearer = await getBearerToken(meta.apiKey, meta.apiSecret);
  const res = await fetch(
    `${BASE}/2/users/me?user.fields=public_metrics,profile_image_url,description`,
    { headers: { Authorization: `Bearer ${bearer}` } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.title || "Twitter profile fetch failed");
  return data.data || {};
}

async function getRecentTweets(meta, userId, maxResults = 10) {
  try {
    const bearer = await getBearerToken(meta.apiKey, meta.apiSecret);
    const res = await fetch(
      `${BASE}/2/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=public_metrics,created_at`,
      { headers: { Authorization: `Bearer ${bearer}` } }
    );
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function postTweet(meta, text) {
  const url = `${BASE}/2/tweets`;
  const body = { text };
  const authHeader = buildOAuth1Header("POST", url, {}, meta);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.detail || data.errors?.[0]?.message || data.title || "Tweet failed";
    throw new Error(msg);
  }
  return data.data || {};
}

module.exports = { getProfile, getRecentTweets, postTweet };
