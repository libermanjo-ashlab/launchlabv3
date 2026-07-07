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
const prisma = new PrismaClient();

const OUTPUT_TYPE = "brand_identity";

// ── CRUD ──────────────────────────────────────────────────────────────────────

async function getBrandIdentity(businessId) {
  const out = await prisma.businessOutput.findFirst({
    where: { businessId, type: OUTPUT_TYPE },
  });
  if (!out) return null;
  try { return JSON.parse(out.content); } catch { return null; }
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
    if (intg.provider === "instagram") {
      connectedChannels.push({ name: "Instagram", status: "active", strength: `${metrics.social?.instagram || 0} followers`, priority: "high" });
    } else if (intg.provider === "email") {
      connectedChannels.push({ name: "Email", status: "active", strength: `${meta.provider || "Email"} connected`, priority: "high" });
    } else if (intg.provider === "website" || intg.provider === "netlify") {
      connectedChannels.push({ name: "Website", status: "active", strength: "Live", priority: "medium" });
    } else if (intg.provider === "twitter") {
      connectedChannels.push({ name: "X/Twitter", status: "active", strength: "Connected", priority: "medium" });
    } else if (intg.provider === "google") {
      connectedChannels.push({ name: "Google Business", status: "active", strength: `${metrics.social?.google_reviews || 0} reviews`, priority: "medium" });
    } else if (intg.provider === "tiktok") {
      connectedChannels.push({ name: "TikTok", status: "active", strength: `${metrics.social?.tiktok || 0} followers`, priority: "high" });
    }
  }

  const topOpportunity = connectedChannels.length === 0
    ? "Connect Instagram to start building a social presence"
    : connectedChannels.find(c => c.priority === "high" && c.status !== "active")?.name
      ? `Activate your ${connectedChannels.find(c => c.priority === "high" && c.status !== "active").name} channel`
      : "Increase posting consistency across connected channels";

  return {
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
  const { populateBrandIdentityFromData } = require("./openaiService");
  const data = await populateBrandIdentityFromData(business, idea, integrations, metrics, marketReport);
  data.populatedBy  = "market_analysis";
  data.populatedAt  = new Date().toISOString();
  return saveBrandIdentity(businessId, data);
}

module.exports = { getBrandIdentity, saveBrandIdentity, bootstrapFromIdea, populateAndSave };
