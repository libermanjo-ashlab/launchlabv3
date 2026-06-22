/**
 * Plan definitions and access control logic.
 *
 * Tiers (in order):
 *   trial        — 7 days from signup. Discovery + Creation full access.
 *                  Marketing agent: 3 analysis runs total. Management agent: 1 implement total.
 *   starter      — $39/mo. Marketing agent insights/reports unlimited + manual metric tracking.
 *                  Management agent does NOT implement — insights only.
 *   pro          — $89/mo. Marketing + Management agents work together on request,
 *                  unlimited both.
 *   pro_autopilot — $199/mo. Same as pro, plus a background loop that runs both agents
 *                  automatically without the user doing anything.
 */

const TIERS = ["trial", "starter", "pro", "pro_autopilot"];

const PLAN_INFO = {
  trial:         { name:"Free Trial",      price:0,   tagline:"7 days, full discovery & setup, limited agent runs" },
  starter:       { name:"Starter",         price:39,  tagline:"Automated insights & manual tracking" },
  pro:           { name:"Pro",             price:89,  tagline:"Agents act on your request" },
  pro_autopilot: { name:"Pro Autopilot",   price:199, tagline:"Fully autonomous — just watch it run" },
};

const TRIAL_LIMITS = { marketingRuns: 3, managementImplements: 1 };

function tierIndex(plan) { return TIERS.indexOf(plan); }

function getEffectivePlan(user) {
  const now = new Date();

  if (user.isAdmin) {
    const sim = user.simulatedPlan || null;
    if (!sim || sim === "full") {
      return { plan:"pro_autopilot", isTrial:false, trialExpired:false, trialDaysLeft:0, locked:false, isAdmin:true, simulating:null };
    }
    if (sim === "trial") {
      return { plan:"trial", isTrial:true, trialExpired:false, trialDaysLeft:7, locked:false, isAdmin:true, simulating:"trial" };
    }
    if (sim === "trial_expired") {
      return { plan:"trial", isTrial:true, trialExpired:true, trialDaysLeft:0, locked:true, isAdmin:true, simulating:"trial_expired" };
    }
    if (["starter","pro","pro_autopilot"].includes(sim)) {
      return { plan:sim, isTrial:false, trialExpired:false, trialDaysLeft:0, locked:false, isAdmin:true, simulating:sim };
    }
  }

  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const trialExpired = !trialEndsAt || now > trialEndsAt;
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt - now) / 86400000)) : 0;

  if (user.plan && user.plan !== "trial") {
    // Tolerate old plan IDs from before the rename
    const normalized = user.plan === "active" ? "pro" : user.plan === "autopilot" ? "pro_autopilot" : user.plan;
    return { plan: normalized, isTrial: false, trialExpired: false, trialDaysLeft: 0, locked: false, isAdmin:false };
  }

  if (!trialExpired) {
    return { plan: "trial", isTrial: true, trialExpired: false, trialDaysLeft, locked: false, isAdmin:false };
  }

  return { plan: "trial", isTrial: true, trialExpired: true, trialDaysLeft: 0, locked: true, isAdmin:false };
}

function canRunMarketing(effectivePlan, usage) {
  if (effectivePlan.locked) return { allowed:false, reason:"Your free trial has ended. Upgrade to keep using the marketing agent." };
  if (effectivePlan.plan === "trial") {
    const used = usage.marketingRuns || 0;
    if (used >= TRIAL_LIMITS.marketingRuns) return { allowed:false, reason:`You've used all ${TRIAL_LIMITS.marketingRuns} marketing analyses included in your free trial. Upgrade to continue.` };
    return { allowed:true, remaining: TRIAL_LIMITS.marketingRuns - used - 1 };
  }
  return { allowed:true };
}

function canImplement(effectivePlan, usage) {
  if (effectivePlan.locked) return { allowed:false, reason:"Your free trial has ended. Upgrade to keep using the management agent." };
  if (effectivePlan.plan === "trial") {
    const used = usage.managementImplements || 0;
    if (used >= TRIAL_LIMITS.managementImplements) return { allowed:false, reason:"You've used your free trial implementation. Upgrade to the Pro plan ($89/mo) or higher." };
    return { allowed:true };
  }
  if (effectivePlan.plan === "starter") {
    return { allowed:false, reason:"The Starter plan includes insights and reports, but implementation requires the Pro plan ($89/mo) or higher." };
  }
  return { allowed:true };
}

function canUseAutopilot(effectivePlan) {
  if (effectivePlan.plan !== "pro_autopilot") return { allowed:false, reason:"Autopilot mode requires the Pro Autopilot plan ($199/mo)." };
  return { allowed:true };
}

module.exports = { TIERS, PLAN_INFO, TRIAL_LIMITS, tierIndex, getEffectivePlan, canRunMarketing, canImplement, canUseAutopilot };
