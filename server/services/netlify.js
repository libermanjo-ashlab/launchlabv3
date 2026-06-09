/**
 * Netlify Live Deploy Service
 * 
 * Uses Netlify's Files API — no zip required.
 * Flow: hash content → create deploy → upload files → site is live.
 * 
 * Setup (one time):
 *   1. Go to app.netlify.com/user/applications → Personal access tokens → New token
 *   2. Add NETLIFY_TOKEN=your-token to Railway environment variables
 *   3. First deploy auto-creates the site. NETLIFY_SITE_ID is saved in the DB.
 */

const crypto = require("crypto");

const BASE = "https://api.netlify.com/api/v1";

async function netlifyFetch(method, path, body, token, contentType = "application/json") {
  const isText = contentType === "text/html" || contentType === "text/plain";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
      ...(isText ? { "Content-Length": Buffer.byteLength(body).toString() } : {}),
    },
    body: isText ? body : (body ? JSON.stringify(body) : undefined),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.status);
    throw new Error(`Netlify API error ${res.status}: ${err}`);
  }
  // Some endpoints return empty body
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

/**
 * Create a new Netlify site. Returns { siteId, siteUrl }.
 * Called once per business — siteId saved to DB after.
 */
async function createSite(token, businessName) {
  // Slugify the name for the subdomain
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  const name = `${slug}-${Date.now()}`;

  const site = await netlifyFetch("POST", "/sites", { name, custom_domain: null }, token);
  return {
    siteId:  site.id,
    siteUrl: `https://${site.subdomain}.netlify.app`,
  };
}

/**
 * Deploy HTML content to an existing Netlify site.
 * Returns the live URL when done.
 */
async function deploySite(token, siteId, htmlContent) {
  const sha1 = crypto.createHash("sha1").update(htmlContent).digest("hex");

  // Step 1: create a deploy with the file manifest
  const deploy = await netlifyFetch("POST", `/sites/${siteId}/deploys`, {
    files: { "/index.html": sha1 },
    async: false,
  }, token);

  // Step 2: upload any files Netlify doesn't already have cached
  if (deploy.required && deploy.required.length > 0) {
    await netlifyFetch("PUT", `/deploys/${deploy.id}/files/index.html`,
      htmlContent, token, "text/html");
  }

  // Step 3: wait for deploy to go live (poll up to 30s)
  const liveUrl = await waitForDeploy(token, deploy.id);
  return { deployId: deploy.id, liveUrl };
}

async function waitForDeploy(token, deployId) {
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const d = await netlifyFetch("GET", `/deploys/${deployId}`, null, token);
    if (d.state === "ready") {
      return `https://${d.ssl_url || d.url}`.replace(/^https:\/\/https:\/\//, "https://");
    }
    if (d.state === "error") throw new Error("Netlify deploy failed: " + d.error_message);
  }
  throw new Error("Deploy timed out — check Netlify dashboard");
}

/**
 * Get current site info (URL, last deploy state).
 */
async function getSiteInfo(token, siteId) {
  return netlifyFetch("GET", `/sites/${siteId}`, null, token);
}

module.exports = { createSite, deploySite, getSiteInfo };
