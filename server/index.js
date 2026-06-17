require("dotenv").config();
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

const app    = express();
const prisma = new PrismaClient();
const PORT   = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

app.use(cors({ origin: isProd ? process.env.CLIENT_URL : "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));

const aiLimiter = rateLimit({ windowMs: 60_000, max: 30, message: { error: "Too many requests — please wait a moment." } });

app.use("/api/auth",         authRoutes);
app.use("/api/businesses",   businessRoutes);
app.use("/api/tasks",        taskRoutes);
app.use("/api/generate",     aiLimiter, generateRoutes);
app.use("/api/integrations", integRoutes);
app.use("/api/deploy",       deployRoutes);
app.use("/api/agents",       agentRoutes);
app.use("/api/metrics",      metricsRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true, version: "1.0.0" }));

if (isProd) {
  const dist = path.join(__dirname, "../client/dist");
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.use((err, req, res, next) => {
  console.error("[Error]", err.message);
  res.status(err.status||500).json({ error: err.message||"Internal server error" });
});

async function start() {
  await prisma.$connect();
  if (isProd) {
    const { execSync } = require("child_process");
    try { execSync("npx prisma db push --accept-data-loss", { cwd: __dirname, stdio: "inherit" }); } catch(e) { console.warn("[DB] Migration warning:", e.message); }
  }
  app.listen(PORT, () => console.log(`LaunchLab running on port ${PORT} [${isProd?"production":"development"}]`));
}

start().catch(e => { console.error("Startup failed:", e); process.exit(1); });
module.exports = { app, prisma };
