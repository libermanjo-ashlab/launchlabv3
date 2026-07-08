/**
 * WordPress REST API service
 * Auth: Application Password (Basic Auth with username:app_password)
 * Connection fields stored in integration.metadata: { siteUrl, wpUsername, wpAppPassword }
 */

function getAuthHeader(username, appPassword) {
  return `Basic ${Buffer.from(`${username}:${appPassword}`).toString("base64")}`;
}

function siteBase(siteUrl) {
  const url = siteUrl.replace(/\/$/, "");
  return `${url}/wp-json/wp/v2`;
}

async function testConnection(siteUrl, username, appPassword) {
  const res = await fetch(`${siteBase(siteUrl)}/users/me`, {
    headers: { Authorization: getAuthHeader(username, appPassword) },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `WordPress connection failed (${res.status})`);
  }
  return await res.json();
}

async function getSiteInfo(siteUrl) {
  const res = await fetch(`${siteUrl.replace(/\/$/, "")}/wp-json`);
  if (!res.ok) return null;
  const data = await res.json();
  return { name: data.name, description: data.description, url: data.url };
}

async function getPages(siteUrl, username, appPassword, perPage = 10) {
  const res = await fetch(`${siteBase(siteUrl)}/pages?per_page=${perPage}&status=publish&_fields=id,title,slug,link,modified`, {
    headers: { Authorization: getAuthHeader(username, appPassword) },
  });
  if (!res.ok) return [];
  return await res.json();
}

async function getPosts(siteUrl, username, appPassword, perPage = 10) {
  const res = await fetch(`${siteBase(siteUrl)}/posts?per_page=${perPage}&status=publish&_fields=id,title,date,link,comment_count`, {
    headers: { Authorization: getAuthHeader(username, appPassword) },
  });
  if (!res.ok) return [];
  return await res.json();
}

async function updatePage(siteUrl, username, appPassword, pageId, content) {
  const res = await fetch(`${siteBase(siteUrl)}/pages/${pageId}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(username, appPassword),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: { raw: content } }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "WordPress page update failed");
  }
  return await res.json();
}

async function createPost(siteUrl, username, appPassword, { title, content, status = "draft" }) {
  const res = await fetch(`${siteBase(siteUrl)}/posts`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(username, appPassword),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, content: { raw: content }, status }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "WordPress post creation failed");
  }
  return await res.json();
}

module.exports = { testConnection, getSiteInfo, getPages, getPosts, updatePage, createPost };
