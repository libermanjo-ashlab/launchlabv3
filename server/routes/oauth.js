const express = require("express");
const cors    = require("cors");
const crypto  = require("crypto");
const jwt     = require("jsonwebtoken");

const openCors = cors({ origin: "*" });

// In-memory stores — OAuth clients re-register on reconnect; codes are 10-min lived
const oauthClients = new Map(); // clientId → { clientSecret, name, redirectUris[] }
const authCodes    = new Map(); // code → { userId, clientId, redirectUri, codeChallenge, expiresAt }

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of authCodes) if (v.expiresAt < now) authCodes.delete(k);
}, 60_000);

const makeToken = userId =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ── Public router — mounted at /oauth ────────────────────────────────────────

const publicRouter = express.Router();

// Dynamic Client Registration (RFC 7591)
publicRouter.post("/register", openCors, async (req, res) => {
  try {
    const { client_name, redirect_uris = [], grant_types, response_types } = req.body || {};
    if (!Array.isArray(redirect_uris) || !redirect_uris.length) {
      return res.status(400).json({ error: "invalid_client_metadata", error_description: "redirect_uris required" });
    }
    const clientId     = crypto.randomBytes(16).toString("hex");
    const clientSecret = crypto.randomBytes(32).toString("hex");
    oauthClients.set(clientId, {
      clientSecret,
      name:         String(client_name || "Unknown").slice(0, 200),
      redirectUris: redirect_uris,
    });
    return res.status(201).json({
      client_id:            clientId,
      client_secret:        clientSecret,
      client_id_issued_at:  Math.floor(Date.now() / 1000),
      redirect_uris,
      grant_types:          grant_types    || ["authorization_code"],
      response_types:       response_types || ["code"],
    });
  } catch (err) {
    console.error("[OAuth] register error:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// Token Exchange
publicRouter.post("/token", openCors, async (req, res) => {
  try {
    const { grant_type, code, redirect_uri, client_id, client_secret, code_verifier } = req.body || {};
    if (grant_type !== "authorization_code") {
      return res.status(400).json({ error: "unsupported_grant_type" });
    }
    if (!code || !client_id || !redirect_uri) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const entry = authCodes.get(code);
    if (!entry || entry.expiresAt < Date.now()) {
      authCodes.delete(code);
      return res.status(400).json({ error: "invalid_grant", error_description: "Code not found or expired" });
    }
    if (entry.clientId  !== client_id)   return res.status(400).json({ error: "invalid_client" });
    if (entry.redirectUri !== redirect_uri) return res.status(400).json({ error: "invalid_grant", error_description: "redirect_uri mismatch" });

    // PKCE S256 verification
    if (entry.codeChallenge) {
      if (!code_verifier) return res.status(400).json({ error: "invalid_grant", error_description: "code_verifier required" });
      const digest = crypto.createHash("sha256").update(code_verifier).digest("base64url");
      if (digest !== entry.codeChallenge) return res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
    }

    const client = oauthClients.get(client_id);
    if (!client || client.clientSecret !== client_secret) {
      return res.status(401).json({ error: "invalid_client" });
    }

    authCodes.delete(code);
    return res.json({
      access_token: makeToken(entry.userId),
      token_type:   "Bearer",
      expires_in:   30 * 24 * 60 * 60,
      scope:        "read write",
    });
  } catch (err) {
    console.error("[OAuth] token error:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ── API router — mounted at /api/oauth ───────────────────────────────────────

const apiRouter = express.Router();

// Called by the frontend authorize page after the user approves
apiRouter.post("/approve", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!bearerToken) return res.status(401).json({ error: "Unauthorized" });

    let userId;
    try {
      ({ userId } = jwt.verify(bearerToken, process.env.JWT_SECRET));
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { client_id, redirect_uri, code_challenge, state } = req.body || {};
    if (!client_id || !redirect_uri) return res.status(400).json({ error: "missing params" });

    const client = oauthClients.get(client_id);
    if (!client) return res.status(400).json({ error: "Unknown client" });

    if (!client.redirectUris.includes(redirect_uri)) return res.status(400).json({ error: "redirect_uri not registered" });

    const code = crypto.randomBytes(24).toString("hex");
    authCodes.set(code, {
      userId,
      clientId:      client_id,
      redirectUri:   redirect_uri,
      codeChallenge: code_challenge || null,
      expiresAt:     Date.now() + 10 * 60 * 1000,
    });

    const url = new URL(redirect_uri);
    url.searchParams.set("code", code);
    if (state) url.searchParams.set("state", state);

    return res.json({ redirect: url.toString() });
  } catch (err) {
    console.error("[OAuth] approve error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Returns the app name for the consent screen
apiRouter.get("/client-info", openCors, (req, res) => {
  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: "client_id required" });
  const client = oauthClients.get(client_id);
  if (!client) return res.status(404).json({ error: "Not found" });
  return res.json({ name: client.name });
});

module.exports = { publicRouter, apiRouter };
