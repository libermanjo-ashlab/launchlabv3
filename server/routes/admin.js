const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const { getEffectivePlan } = require("../services/plans");
const { DAILY_TOKEN_LIMITS } = require("../services/dailyBudget");

const prisma = new PrismaClient();

function todayKey() { return `tok_${new Date().toISOString().slice(0, 10)}`; }

async function requireAdmin(req, res, next) {
  const user = await prisma.user.findUnique({ where:{ id:req.userId } });
  if (!user?.isAdmin) return res.status(403).json({ error:"Not authorized" });
  next();
}

// GET /api/admin/users — all users with plan, usage, and business data
router.get("/users", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const key = todayKey();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        trialEndsAt: true,
        createdAt: true,
        emailVerified: true,
        isAdmin: true,
        stripeCustomerId: true,
        businesses: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            outputs: {
              where: { type: "usage" },
              select: { content: true, updatedAt: true },
            },
          },
        },
      },
    });

    const summary = {
      total: 0,
      byPlan: { trial: 0, starter: 0, pro: 0, pro_autopilot: 0 },
      activeToday: 0,
      totalBusinesses: 0,
    };

    const result = users.map(u => {
      const effective = getEffectivePlan(u);

      let todayTokens = 0;
      let totalMarketingRuns = 0;
      let totalImplementations = 0;
      let lastActiveAt = null;

      for (const biz of u.businesses) {
        for (const out of biz.outputs) {
          try {
            const data = JSON.parse(out.content || "{}");
            todayTokens        += data[key] || 0;
            totalMarketingRuns += data.marketingRuns || 0;
            totalImplementations += data.managementImplements || 0;
            if (!lastActiveAt || new Date(out.updatedAt) > new Date(lastActiveAt)) {
              lastActiveAt = out.updatedAt;
            }
          } catch {}
        }
      }

      const planKey = effective.plan;
      summary.total++;
      summary.byPlan[planKey] = (summary.byPlan[planKey] || 0) + 1;
      if (todayTokens > 0) summary.activeToday++;
      summary.totalBusinesses += u.businesses.length;

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        plan: effective.plan,
        isTrial: effective.isTrial,
        locked: effective.locked,
        isAdmin: u.isAdmin,
        trialEndsAt: u.trialEndsAt,
        createdAt: u.createdAt,
        emailVerified: u.emailVerified,
        hasStripe: !!u.stripeCustomerId,
        businessCount: u.businesses.length,
        businesses: u.businesses.map(b => b.name),
        todayTokens,
        tokenLimit: DAILY_TOKEN_LIMITS[effective.plan] || DAILY_TOKEN_LIMITS.starter,
        totalMarketingRuns,
        totalImplementations,
        lastActiveAt,
      };
    });

    res.json({ users: result, summary });
  } catch (e) { next(e); }
});

module.exports = router;
