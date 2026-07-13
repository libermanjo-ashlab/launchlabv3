require("dotenv").config();

// ── Sentry must init before any other requires so it can instrument them ──
const Sentry = require("@sentry/node");
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });
  console.log("[Sentry] Error tracking enabled");
}

const REQUIRED_ENV = ["JWT_SECRET", "ANTHROPIC_API_KEY"];
if (process.env.NODE_ENV === "production" && !process.env.CLIENT_URL) {
  console.error("[Startup] CLIENT_URL is required in production — CORS would be open to all origins without it");
  process.exit(1);
}
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[Startup] Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) { process.env.DATABASE_URL = "file:./prod.db"; console.log("[Config] DATABASE_URL defaulted to file:./prod.db"); }

const express   = require("express");
const cors      = require("cors");
const path      = require("path");
const rateLimit = require("express-rate-limit");
const { PrismaClient } = require("@prisma/client");

const authRoutes     = require("./routes/auth");
const businessRoutes = require("./routes/business");
const taskRoutes     = require("./routes/tasks");
const generateRoutes = require("./routes/generate");
const integRoutes    = require("./routes/integrations");
const deployRoutes   = require("./routes/deploy");
const agentRoutes    = require("./routes/agents");
const metricsRoutes  = require("./routes/metrics");
const igRoutes       = require("./routes/instagram");
const twRoutes       = require("./routes/twitter");
const ttRoutes       = require("./routes/tiktok");
const emailChRoutes  = require("./routes/emailChannel");
const { router: subscriptionRoutes, handleWebhook } = require("./routes/subscriptions");
const adminRoutes    = require("./routes/admin");
const mcpRoutes      = require("./routes/mcp");
const { publicRouter: oauthPublicRouter, apiRouter: oauthApiRouter } = require("./routes/oauth");
const { startBackupSchedule } = require("./services/backup");

const app    = express();
const prisma = new PrismaClient();
const PORT   = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

app.use(cors({ origin: isProd ? process.env.CLIENT_URL : "http://localhost:5173", credentials: true }));

// Stripe webhook needs the raw body BEFORE express.json() parses it
app.post("/api/subscriptions/webhook", express.raw({ type: "application/json" }), handleWebhook);

app.use(express.json({ limit: "10mb" }));

const aiLimiter = rateLimit({ windowMs: 60_000, max: 30, message: { error: "Too many requests — please wait a moment." } });

app.use("/api/auth",          authRoutes);
app.use("/api/businesses",    businessRoutes);
app.use("/api/tasks",         taskRoutes);
app.use("/api/generate",      aiLimiter, generateRoutes);
app.use("/api/integrations",  integRoutes);
app.use("/api/deploy",        deployRoutes);
app.use("/api/agents",        agentRoutes);
app.use("/api/metrics",       metricsRoutes);
app.use("/api/instagram",     igRoutes);
app.use("/api/twitter",       twRoutes);
app.use("/api/tiktok",        ttRoutes);
app.use("/api/email",         emailChRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin",        adminRoutes);
// MCP server — open to any origin so AI assistants can connect
app.use("/api/mcp", cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }), aiLimiter, mcpRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true, version: "1.2.0" }));

// OAuth 2.0 — open CORS so Anthropic and other AI clients can reach these
const oauthMeta = {
  issuer:                                "https://www.earnedlab.com",
  authorization_endpoint:               "https://www.earnedlab.com/oauth/authorize",
  token_endpoint:                        "https://www.earnedlab.com/oauth/token",
  registration_endpoint:                 "https://www.earnedlab.com/oauth/register",
  response_types_supported:              ["code"],
  grant_types_supported:                 ["authorization_code"],
  code_challenge_methods_supported:      ["S256"],
  token_endpoint_auth_methods_supported: ["client_secret_post"],
  scopes_supported:                      ["read", "write"],
};
// Primary path-based discovery (MCP spec §2.3 — derived from /api/mcp)
app.get("/.well-known/oauth-authorization-server/api/mcp", cors({ origin: "*" }), (_, res) => res.json(oauthMeta));
// Root fallback (clients try this when path-based lookup returns non-2xx)
app.get("/.well-known/oauth-authorization-server", cors({ origin: "*" }), (_, res) => res.json(oauthMeta));
// OAuth endpoints
app.use("/oauth",     cors({ origin: "*" }), oauthPublicRouter);
app.use("/api/oauth", oauthApiRouter);

if (isProd) {
  const dist = path.join(__dirname, "../client/dist");
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}

// Sentry Express error handler must be BEFORE the generic error handler
if (process.env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) {
    console.error("[Error]", err.message, err.stack);
    if (process.env.SENTRY_DSN) Sentry.captureException(err);
  }
  res.status(status).json({
    error: status >= 500 ? "Something went wrong on our end. If this continues, email support@earnedlab.com" : (err.message || "Request failed"),
  });
});

async function start() {
  await prisma.$connect();
  if (isProd) {
    const { execSync } = require("child_process");
    try { execSync("npx prisma db push --accept-data-loss", { cwd: __dirname, stdio: "inherit" }); } catch(e) { console.warn("[DB] Migration warning:", e.message); }
  }
  await authRoutes.ensureAdminAccount().catch(e => console.warn("[Admin] Setup warning:", e.message));
  startBackupSchedule();
  app.listen(PORT, async () => {
    console.log(`EarnedLab running on port ${PORT} [${isProd?"production":"development"}]`);
    await agentRoutes.resumeAllAutopilots();
  });
}

start().catch(e => { console.error("Startup failed:", e); process.exit(1); });
module.exports = { app, prisma };
