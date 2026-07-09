/**
 * Brand Identity service — CRUD and auto-population for brand identity + social presence data.
 *
 * Stored as BusinessOutput with type="brand_identity".
 * Populated three ways:
 *   1. User edits fields manually (any mode)
 *   2. Auto/Guided mode: synthesized from live channel data + market analysis
 *   3. No data yet: pre-populated from discovery agent's business idea
 */

const { PrismaClient } = require("@prisma/client");
const log    = require("../lib/logger");
const prisma = new PrismaClient();

const OUTPUT_TYPE = "brand_identity";

// ── CRUD ──────────────────────────────────────────────────────────────────────

async function getBrandIdentity(businessId) {
  const out = await prisma.businessOutput.findFirst({
    where: { businessId, type: OUTPUT_TYPE },
  });
  if (!out) {
    log.warn("BRAND", "No brand identity found in DB — caller should bootstrap", { businessId });
    return null;
  }
  try {
    const data = JSON.parse(out.content);
    log.info("BRAND", "Brand identity loaded from DB", {
      businessId,
      populatedBy: data.populatedBy || "unknown",
      populatedAt: data.populatedAt || "unknown",
      hasVoice: !!data.voice,
      hasPalette: !!data.colorPalette,
      hasBusinessType: !!data.businessType,
    });
    return data;
  } catch (err) {
    log.error("BRAND", "Brand identity JSON parse failed", { businessId, error: err.message });
    return null;
  }
}

async function saveBrandIdentity(businessId, data) {
  const content = JSON.stringify({ ...data, updatedAt: new Date().toISOString() });
  const existing = await prisma.businessOutput.findFirst({ where: { businessId, type: OUTPUT_TYPE } });
  if (existing) {
    await prisma.businessOutput.update({ where: { id: existing.id }, data: { content } });
  } else {
    await prisma.businessOutput.create({
      data: { businessId, type: OUTPUT_TYPE, title: "Brand Identity", content },
    });
  }
  return JSON.parse(content);
}

// ── Discovery-based bootstrap ─────────────────────────────────────────────────

/**
 * Generate a minimal brand identity from business idea data alone (no AI call).
 * Used when no market analysis has run yet and no user input exists.
 */
function bootstrapFromIdea(business, idea, integrations, metrics) {
  const businessType = idea.name || "service business";
  const target       = idea.targetMarket || "";
  const why          = idea.why || idea.description || "";

  // Infer voice from business type
  const serviceKeywords = /coach|consult|therapy|fitness|health|wellness|education|tutor/i.test(businessType);
  const creativeKeywords = /design|art|photo|video|content|creative|brand/i.test(businessType);
  const techKeywords     = /tech|dev|software|digital|app|web/i.test(businessType);

  const voice = serviceKeywords ? "warm, encouraging, expert"
    : creativeKeywords ? "creative, bold, visual"
    : techKeywords     ? "clear, precise, modern"
    : "professional, approachable, direct";

  // Build channel presence from integrations + metrics
  const connectedChannels = [];
  for (const intg of (integrations || [])) {
    let meta = {};
    try { meta = JSON.parse(intg.metadata || "{}"); } catch {}
    const igFollowers = metrics.social?.instagram || 0;
    const ttFollowers = metrics.social?.tiktok || 0;
    if (intg.provider === "instagram") {
      const status = igFollowers >= 100 ? "active" : igFollowers > 0 ? "limited" : "limited";
      connectedChannels.push({ name: "Instagram", status, strength: `${igFollowers} followers`, priority: "high" });
    } else if (intg.provider === "email") {
      const listSize = meta.listSize || 0;
      const status = listSize >= 50 ? "active" : listSize > 0 ? "limited" : "limited";
      connectedChannels.push({ name: "Email", status, strength: `${meta.provider || "Email"} — ${listSize} subscribers`, priority: "high" });
    } else if (intg.provider === "website" || intg.provider === "netlify") {
      connectedChannels.push({ name: "Website", status: "active", strength: "Live", priority: "medium" });
    } else if (intg.provider === "twitter") {
      connectedChannels.push({ name: "X/Twitter", status: "limited", strength: "Connected", priority: "medium" });
    } else if (intg.provider === "google") {
      const reviews = metrics.social?.google_reviews || 0;
      connectedChannels.push({ name: "Google Business", status: reviews > 0 ? "active" : "limited", strength: `${reviews} reviews`, priority: "medium" });
    } else if (intg.provider === "tiktok") {
      const status = ttFollowers >= 100 ? "active" : "limited";
      connectedChannels.push({ name: "TikTok", status, strength: `${ttFollowers} followers`, priority: "high" });
    }
  }

  const limitedHighPri = connectedChannels.find(c => c.priority === "high" && c.status === "limited");
  const topOpportunity = connectedChannels.length === 0
    ? "Connect Instagram to start building a social presence"
    : limitedHighPri
      ? `Grow your ${limitedHighPri.name} — it's connected but needs more consistent activity`
      : "Increase posting consistency and engagement across connected channels";

  return {
    businessType,
    voice,
    tone: "confident, genuine, helpful",
    targetAudience: target || `People looking for ${businessType} services`,
    contentPillars: ["value tips", "social proof", "behind the scenes"],
    visualStyle: "Clean, modern design with bold typography. Professional feel without being corporate.",
    colorPalette: "deep purple, white, warm neutrals",
    uniqueAngle: `${business.name} focuses on ${why.slice(0, 80) || "delivering real results"}.`,
    channelPresence: {
      summary: connectedChannels.length > 0
        ? `${business.name} has ${connectedChannels.length} channel(s) connected. Focus on consistency and quality over quantity.`
        : `${business.name} has no channels connected yet. Start with Instagram or email for the fastest impact.`,
      channels: connectedChannels,
      topOpportunity,
    },
    competitorAccounts: "",
    postingRecommendation: "3-4x/week: 50% tips, 30% social proof, 20% offers or announcements",
    populatedBy: "discovery",
    populatedAt: new Date().toISOString(),
  };
}

// ── AI-powered population ─────────────────────────────────────────────────────

/**
 * Fully populate brand identity using GPT-4o, then save.
 */
async function populateAndSave(businessId, business, idea, integrations, metrics, marketReport) {
  log.info("BRAND", "populateAndSave triggered — running GPT-4o brand identity synthesis", {
    businessId, businessName: business.name,
  });
  const { populateBrandIdentityFromData } = require("./openaiService");
  const data = await populateBrandIdentityFromData(business, idea, integrations, metrics, marketReport);
  data.populatedBy  = "market_analysis";
  data.populatedAt  = new Date().toISOString();
  const saved = await saveBrandIdentity(businessId, data);
  log.info("BRAND", "Brand identity saved", {
    businessId, businessName: business.name,
    businessType: saved.businessType || "(missing)",
    voice: saved.voice || "(missing)",
    palette: saved.colorPalette || "(missing)",
  });
  return saved;
}

module.exports = { getBrandIdentity, saveBrandIdentity, bootstrapFromIdea, populateAndSave };
