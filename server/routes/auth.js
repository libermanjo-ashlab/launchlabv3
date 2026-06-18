const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const requireAuth = require("../middleware/auth");
const { getEffectivePlan } = require("../services/plans");

const prisma = new PrismaClient();
const makeToken = userId => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
const TRIAL_DAYS = 7;

function publicUser(user) {
  const { password, ...safe } = user;
  return { ...safe, ...getEffectivePlan(user) };
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name, goal, age } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "email, password, and name are required" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ error: "An account with this email already exists" });
    const hashed = await bcrypt.hash(password, 12);
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS*24*60*60*1000);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashed, name, goal: goal||null, age: age ? parseInt(age) : null, plan:"trial", trialEndsAt },
    });
    res.status(201).json({ token: makeToken(user.id), user: publicUser(user) });
  } catch(e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ token: makeToken(user.id), user: publicUser(user) });
  } catch(e) { next(e); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: publicUser(user) });
  } catch(e) { next(e); }
});

router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const { name, goal, age } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, goal, ...(age!==undefined?{age:parseInt(age)}:{}) },
    });
    res.json({ user: publicUser(user) });
  } catch(e) { next(e); }
});

router.put("/admin/simulate", requireAuth, async (req, res, next) => {
  try {
    const me = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!me?.isAdmin) return res.status(403).json({ error: "Not authorized" });
    const { simulatedPlan } = req.body; // null/"full" | "trial" | "trial_expired" | "starter" | "active" | "autopilot"
    const updated = await prisma.user.update({
      where: { id: me.id },
      data: { simulatedPlan: (!simulatedPlan || simulatedPlan === "full") ? null : simulatedPlan },
    });
    res.json({ user: publicUser(updated) });
  } catch(e) { next(e); }
});

// Creates (or upgrades) a private admin testing account from env vars on server startup.
// The actual credentials never live in source code — set ADMIN_TEST_EMAIL and
// ADMIN_TEST_PASSWORD in Railway environment variables to enable this.
async function ensureAdminAccount() {
  const email    = process.env.ADMIN_TEST_EMAIL;
  const password = process.env.ADMIN_TEST_PASSWORD;
  if (!email || !password) return;
  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      if (!existing.isAdmin) await prisma.user.update({ where: { id: existing.id }, data: { isAdmin: true } });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashed, name: "Admin", isAdmin: true, plan: "admin" },
    });
    console.log("[Admin] Test admin account created from environment variables");
  } catch(e) { console.warn("[Admin] Bootstrap failed:", e.message); }
}

module.exports = router;
module.exports.ensureAdminAccount = ensureAdminAccount;
