const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const crypto  = require("crypto");
const rateLimit = require("express-rate-limit");
const { PrismaClient } = require("@prisma/client");
const requireAuth = require("../middleware/auth");
const { getEffectivePlan } = require("../services/plans");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../services/email");

const prisma = new PrismaClient();
const makeToken = userId => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
const TRIAL_DAYS = 7;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: "Too many login attempts — please wait 15 minutes." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many accounts created from this IP — please try again later." },
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Too many reset requests — please wait an hour before trying again." },
});

function publicUser(user) {
  const { password, emailVerificationToken, emailVerificationExpires, passwordResetToken, passwordResetExpires, ...safe } = user;
  return { ...safe, ...getEffectivePlan(user) };
}

function makeSecureToken() {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/register", registerLimiter, async (req, res, next) => {
  try {
    const { email, password, name, goal, age } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "email, password, and name are required" });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    if (name.trim().length < 2) return res.status(400).json({ error: "Name must be at least 2 characters" });

    let parsedAge = null;
    if (age !== undefined && age !== null && age !== "") {
      parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
        return res.status(400).json({ error: "You must be 18 or older to use EarnedLab" });
      }
    }

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ error: "An account with this email already exists" });

    const hashed = await bcrypt.hash(password, 12);
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const verificationToken = makeSecureToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashed,
        name: name.trim(),
        goal: goal || null,
        age: parsedAge,
        plan: "trial",
        trialEndsAt,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Send verification email non-blocking — don't fail signup if email fails
    sendVerificationEmail(user.email, user.name, verificationToken).catch(e =>
      console.error("[Auth] Verification email failed:", e.message)
    );

    res.status(201).json({ token: makeToken(user.id), user: publicUser(user) });
  } catch (e) { next(e); }
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ token: makeToken(user.id), user: publicUser(user) });
  } catch (e) { next(e); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});

router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const { name, goal, age } = req.body;
    let parsedAge;
    if (age !== undefined && age !== null && age !== "") {
      parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
        return res.status(400).json({ error: "Age must be 18 or older" });
      }
    }
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, goal, ...(parsedAge !== undefined ? { age: parsedAge } : {}) },
    });
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});

// GET /api/auth/verify-email?token=xxx
router.get("/verify-email", async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Verification token is required" });

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() },
      },
    });
    if (!user) return res.status(400).json({ error: "This verification link has expired or is invalid" });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null, emailVerificationExpires: null },
    });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/auth/resend-verification
router.post("/resend-verification", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.emailVerified) return res.status(400).json({ error: "Email is already verified" });

    const token = makeSecureToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: token, emailVerificationExpires: expires },
    });

    sendVerificationEmail(user.email, user.name, token).catch(e =>
      console.error("[Auth] Resend verification failed:", e.message)
    );

    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", forgotLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });

    // Always return 200 to avoid leaking whether an account exists
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      const token = makeSecureToken();
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: token, passwordResetExpires: expires },
      });
      sendPasswordResetEmail(user.email, user.name, token).catch(e =>
        console.error("[Auth] Password reset email failed:", e.message)
      );
    }

    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/auth/reset-password
router.post("/reset-password", forgotLimiter, async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "token and password are required" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });
    if (!user) return res.status(400).json({ error: "This reset link has expired or is invalid" });

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, passwordResetToken: null, passwordResetExpires: null },
    });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

// PUT /api/auth/admin/simulate — admin-only plan simulation
router.put("/admin/simulate", requireAuth, async (req, res, next) => {
  try {
    const me = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!me?.isAdmin) return res.status(403).json({ error: "Not authorized" });
    const { simulatedPlan } = req.body;
    const updated = await prisma.user.update({
      where: { id: me.id },
      data: { simulatedPlan: (!simulatedPlan || simulatedPlan === "full") ? null : simulatedPlan },
    });
    res.json({ user: publicUser(updated) });
  } catch (e) { next(e); }
});

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
      data: { email: email.toLowerCase(), password: hashed, name: "Admin", isAdmin: true, plan: "admin", emailVerified: true },
    });
    console.log("[Admin] Test admin account created from environment variables");
  } catch (e) { console.warn("[Admin] Bootstrap failed:", e.message); }
}

module.exports = router;
module.exports.ensureAdminAccount = ensureAdminAccount;
