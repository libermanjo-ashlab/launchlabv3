require("dotenv").config();
// ── ENV DEFAULTS (must come before any require that reads env vars) ─────────────
// Railway: add DATABASE_URL=file:./prod.db in your Variables tab.
// This fallback prevents crash-loops if the variable is accidentally missing.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./prod.db";
  console.log("[Config] DATABASE_URL not set — using default: file:./prod.db");
}
// ────────────────────────────────────────────────────────────────────────────────

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
const deployRoutes  = require("./routes/deploy");
const agentRoutes   = require("./routes/agents");
const metricsRoutes = require("./routes/metrics");

// Version-specific routes (loaded if file exists)
let subscriptionRoutes;
try { subscriptionRoutes = require("./routes/subscriptions"); } catch {}

const app    = express();
const prisma = new PrismaClient();
const PORT   = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

app.use(cors({ origin: isProd ? process.env.CLIENT_URL : "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));

const aiLimiter = rateLimit({ windowMs: 60_000, max: 30, message: { error: "Too many requests. Please wait." } });

app.use("/api/auth",         authRoutes);
app.use("/api/businesses",   businessRoutes);
app.use("/api/tasks",        taskRoutes);
app.use("/api/generate",     aiLimiter, generateRoutes);
app.use("/api/integrations", integRoutes);
app.use("/api/deploy",   deployRoutes);
app.use("/api/agents",   agentRoutes);
app.use("/api/metrics",  metricsRoutes);
if (subscriptionRoutes) app.use("/api/subscriptions", subscriptionRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Serve React build in production
if (isProd) {
  const dist = path.join(__dirname, "../client/dist");
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.use((err, req, res, next) => {
  console.error("[Error]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

async function start() {
  await prisma.$connect();
  // Auto-run migrations in production
  if (isProd) {
    const { execSync } = require("child_process");
    try { execSync("npx prisma db push --accept-data-loss", { cwd: __dirname, stdio: "inherit" }); } catch {}
  }
  app.listen(PORT, () => console.log(`LaunchLab running on port ${PORT}`));
}

start().catch(e => { console.error(e); process.exit(1); });
module.exports = { app, prisma };
