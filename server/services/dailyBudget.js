/**
 * Shared daily token budget helpers.
 * Used by agents.js (marketing/management runs) and generate.js (chat/insight agent).
 * Token limits are estimates; actual LLM usage varies but estimates err conservative.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DAILY_TOKEN_LIMITS = {
  trial:         20_000,
  starter:       20_000,
  pro:          110_000,
  pro_autopilot:110_000,
};

// Conservative per-operation estimates (tokens)
const TOKEN_EST = {
  marketing_full:    12000,
  marketing_basic:     800,
  campaign_breakdown: 2500,
  task_run:           1500,
  implement:          1800,
  chat:               2000,
};

function todayKey() { return `tok_${new Date().toISOString().slice(0, 10)}`; }

async function getUsage(bizId) {
  const out = await prisma.businessOutput.findFirst({ where: { businessId: bizId, type: "usage" } });
  if (!out) return { marketingRuns: 0, managementImplements: 0 };
  try { return JSON.parse(out.content); } catch { return { marketingRuns: 0, managementImplements: 0 }; }
}

async function getDailyTokens(bizId) {
  const usage = await getUsage(bizId);
  return usage[todayKey()] || 0;
}

async function addDailyTokens(bizId, estimate) {
  const key = todayKey();
  const usage = await getUsage(bizId);
  usage[key] = (usage[key] || 0) + estimate;
  // Purge stale daily keys (anything not today)
  Object.keys(usage).filter(k => k.startsWith("tok_") && k !== key).forEach(k => delete usage[k]);
  const existing = await prisma.businessOutput.findFirst({ where: { businessId: bizId, type: "usage" } });
  const content = JSON.stringify(usage);
  if (existing) await prisma.businessOutput.update({ where: { id: existing.id }, data: { content } });
  else await prisma.businessOutput.create({ data: { businessId: bizId, type: "usage", title: "Usage tracking", content } });
}

function tokenBudget(plan, used) {
  const limit = DAILY_TOKEN_LIMITS[plan] || DAILY_TOKEN_LIMITS.starter;
  return { used, limit, remaining: Math.max(0, limit - used), pct: Math.min(100, Math.round(used / limit * 100)) };
}

module.exports = { DAILY_TOKEN_LIMITS, TOKEN_EST, getDailyTokens, addDailyTokens, tokenBudget, getUsage };
