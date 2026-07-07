/**
 * OpenAI service — caption generation (GPT-4o) and image generation (DALL-E 3).
 *
 * All functions pull brand identity context so every piece of content is
 * tailored to the specific business's voice, audience, and channels.
 *
 * Env required: OPENAI_API_KEY
 */

const OpenAI = require("openai");

function getClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set — add it to your .env file");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── Caption generation ────────────────────────────────────────────────────────

/**
 * Generate a single Instagram caption using GPT-4o, informed by brand identity
 * and market analysis insights.
 *
 * @param {object} opts
 * @param {string} opts.businessName
 * @param {string} [opts.businessType]
 * @param {string} [opts.context]      — optional angle / topic
 * @param {string} [opts.tone]         — override tone (defaults to brand identity tone)
 * @param {object} [opts.brandIdentity] — from BusinessOutput type="brand_identity"
 * @param {string} [opts.marketInsights] — summary from latest marketing report
 * @returns {{ caption:string, body:string, hashtags:string }}
 */
async function generateInstagramCaption({ businessName, businessType, context, tone, brandIdentity, marketInsights }) {
  const client = getClient();

  const bi = brandIdentity || {};
  const voice    = bi.voice   || "confident, direct, educational";
  const audience = bi.targetAudience || bi.targetMarket || "target audience";
  const pillars  = Array.isArray(bi.contentPillars) ? bi.contentPillars.join(", ") : (bi.contentPillars || "tips, social proof, behind the scenes");
  const unique   = bi.uniqueAngle || "";

  // Determine post type from context
  const postType = context
    ? (/tip|teach|learn|how to/i.test(context)         ? "value tip"
     : /proof|result|client|customer|testimonial/i.test(context) ? "social proof"
     : /behind|process|how we|day in/i.test(context)   ? "behind the scenes"
     : /offer|promo|deal|discount|book/i.test(context) ? "direct offer"
     : "value tip")
    : "value tip";

  const system = `You are an expert social media copywriter specializing in service businesses. You write captions that educate, build trust, and drive action. You ALWAYS write for the specific business — never generic advice.`;

  const user = `Write ONE Instagram caption for ${businessName}${businessType ? ` (${businessType})` : ""}.

BRAND VOICE: ${voice}${tone ? `, ${tone}` : ""}
TARGET AUDIENCE: ${audience}
CONTENT PILLARS: ${pillars}
${unique ? `UNIQUE ANGLE: ${unique}` : ""}
${context ? `POST ANGLE: ${context}` : ""}
POST FORMAT: ${postType}
${marketInsights ? `MARKET CONTEXT:\n${marketInsights}` : ""}

STRUCTURE (follow exactly):
1. HOOK (line 1): One sentence that stops the scroll. Bold claim, surprising fact, or relatable problem specific to ${businessName}'s work.
2. VALUE (lines 2-3): 1-2 sentences delivering on the hook. Be SPECIFIC — name the actual service, process, or outcome. Mention ${businessName}.
3. CTA (line 4): One action. Examples: "DM us [keyword]", "Book at link in bio", "Comment below if this resonates".
4. Blank line, then 10-12 tightly relevant hashtags.

NON-NEGOTIABLE RULES:
- No emojis
- No markdown formatting (no **, ##, bullet points)
- No generic phrases ("consistency is key", "stay authentic", "join us on this journey")
- No location phrases unless explicitly local
- One post only — no alternatives, no headers, no numbering
- Start directly with the hook — no intro text`;

  const msg = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 600,
    messages: [
      { role: "system", content: system },
      { role: "user",   content: user },
    ],
  });

  const full = msg.choices[0]?.message?.content?.trim() || "";
  const parts = full.split(/\n(?=#)/);
  const body     = parts[0]?.trim() || full;
  const hashtags = parts.slice(1).join("\n").trim();
  return { caption: full, body, hashtags };
}

/**
 * Generate a caption for a non-Instagram channel (email subject, tweet, etc.).
 */
async function generateChannelCaption({ businessName, channel, context, brandIdentity }) {
  const client = getClient();
  const bi = brandIdentity || {};
  const voice = bi.voice || "confident, direct";

  const channelInstructions = {
    email:   "Write a short email subject line (max 60 chars) and a 2-3 sentence email preview/intro. Subject on line 1, blank line, then preview.",
    twitter: "Write ONE tweet (max 280 chars). No hashtags in the tweet body — add 2-3 at the end on a new line.",
    tiktok:  "Write a TikTok video hook (spoken words for first 3 seconds) and a short caption (max 150 chars).",
    website: "Write a concise website section update: a headline (max 10 words) and a 2-sentence supporting paragraph.",
    general: "Write a short, clear call-to-action message (2-3 sentences) suitable for any channel.",
  };

  const instructions = channelInstructions[channel] || channelInstructions.general;

  const msg = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 300,
    messages: [
      { role: "system", content: `You are a concise copywriter for ${businessName}. Voice: ${voice}. Write only the requested content — no explanations.` },
      { role: "user",   content: `${instructions}\n\nBusiness: ${businessName}\nContext: ${context || "general brand awareness"}\n${bi.targetAudience ? `Audience: ${bi.targetAudience}` : ""}` },
    ],
  });

  return msg.choices[0]?.message?.content?.trim() || "";
}

// ── Image generation ──────────────────────────────────────────────────────────

/**
 * Build a DALL-E 3 image prompt from brand identity and caption context.
 */
function buildImagePrompt(businessName, captionBody, brandIdentity) {
  const bi = brandIdentity || {};
  const visualStyle = bi.visualStyle || "clean, modern, professional";
  const palette     = bi.colorPalette || "purple and deep navy";
  const audience    = bi.targetAudience || "professionals";

  // Extract the core concept from caption (first sentence)
  const concept = (captionBody || "").split(/[.!?\n]/)[0]?.trim() || "";

  return `A professional social media post image for "${businessName}", a ${bi.businessType || "service business"}.

Visual style: ${visualStyle}
Color palette: ${palette}
Audience: ${audience}
${concept ? `Core concept: ${concept}` : ""}

Design requirements:
- 1:1 square format, suitable for Instagram
- Bold typography area with a frosted/translucent text card in the center
- Clean gradient background (${palette})
- Geometric accent shapes (circles, lines) for visual interest
- Professional and brand-consistent
- NO stock-photo people, NO clichéd office photos
- Modern flat design with depth
- The design should convey: ${concept || "brand expertise and trustworthiness"}

Style reference: minimalist information card with strong visual hierarchy, similar to premium brand content.`;
}

/**
 * Generate a social post image using DALL-E 3.
 * Downloads the image and returns a Buffer (so it can be stored in our memory store).
 *
 * @param {string} businessName
 * @param {string} [captionBody]    — caption text (first sentence used for concept)
 * @param {object} [brandIdentity]  — brand identity fields
 * @returns {Promise<Buffer>}       PNG image buffer
 */
async function generatePostImage(businessName, captionBody, brandIdentity) {
  const client = getClient();
  const prompt = buildImagePrompt(businessName, captionBody, brandIdentity);

  const response = await client.images.generate({
    model:   "dall-e-3",
    prompt,
    size:    "1024x1024",
    quality: "standard",
    n:       1,
  });

  const imageUrl = response.data[0]?.url;
  if (!imageUrl) throw new Error("DALL-E 3 returned no image URL");

  // Download the image to a buffer (DALL-E URLs expire after ~1 hour)
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to download DALL-E image: ${imgRes.status}`);
  const arrayBuf = await imgRes.arrayBuffer();
  return Buffer.from(arrayBuf);
}

// ── Brand identity population ─────────────────────────────────────────────────

/**
 * Use GPT-4o to synthesize brand identity and multi-channel presence assessment
 * from all available business data (integrations, metrics, market report, idea).
 *
 * @param {object} business      — Prisma Business record
 * @param {object} idea          — parsed ideaData
 * @param {object[]} integrations — Prisma Integration records
 * @param {object} metrics       — user metrics (revenue, social, etc.)
 * @param {object|null} marketReport — latest marketing analysis report
 * @returns {object}             brand identity fields
 */
async function populateBrandIdentityFromData(business, idea, integrations, metrics, marketReport) {
  const client = getClient();

  // Build channel presence from integrations
  const channelData = [];
  for (const intg of (integrations || [])) {
    let meta = {};
    try { meta = JSON.parse(intg.metadata || "{}"); } catch {}
    if (intg.provider === "instagram") {
      channelData.push(`Instagram: ${meta.handle ? `@${meta.handle}` : "connected"}, ${metrics.social?.instagram || 0} followers`);
    } else if (intg.provider === "email") {
      channelData.push(`Email: ${meta.provider || "email provider"} connected, ${meta.listSize || 0} subscribers, ${meta.openRate || "unknown"} open rate`);
    } else if (intg.provider === "website" || intg.provider === "netlify") {
      channelData.push(`Website: ${meta.liveUrl || meta.url || "connected"}`);
    } else if (intg.provider === "twitter") {
      channelData.push(`X/Twitter: ${meta.handle ? `@${meta.handle}` : "connected"}`);
    } else if (intg.provider === "google") {
      channelData.push(`Google Business Profile: connected, ${metrics.social?.google_reviews || 0} reviews (${metrics.social?.google_rating || 0}★)`);
    } else if (intg.provider === "tiktok") {
      channelData.push(`TikTok: ${meta.handle ? `@${meta.handle}` : "connected"}, ${metrics.social?.tiktok || 0} followers`);
    } else {
      channelData.push(`${intg.provider}: connected`);
    }
  }
  // Add metrics-only channels (no integration but tracked in metrics)
  if (!integrations.find(i => i.provider === "instagram") && metrics.social?.instagram > 0) {
    channelData.push(`Instagram (metrics only): ${metrics.social.instagram} followers`);
  }
  if (!integrations.find(i => i.provider === "tiktok") && metrics.social?.tiktok > 0) {
    channelData.push(`TikTok (metrics only): ${metrics.social.tiktok} followers`);
  }

  const reportSummary = marketReport?.marketAnalysis?.summary || marketReport?.overview?.summary || "";
  const competitorBehavior = marketReport?.marketAnalysis?.competitorBehavior || "";

  const prompt = `Analyze this business and generate a brand identity + social presence assessment.

BUSINESS: ${business.name}
TYPE: ${idea.name || "service business"}
DESCRIPTION: ${idea.why || idea.description || ""}
LOCATION: ${business.location || "online"}
TARGET MARKET: ${idea.targetMarket || "general consumers"}

CONNECTED CHANNELS & METRICS:
${channelData.length ? channelData.join("\n") : "No channels connected yet"}

BUSINESS METRICS:
- Revenue: $${metrics.revenue?.this_month || 0}/month
- Active clients: ${metrics.clients?.active || 0}
- Leads/month: ${metrics.leads?.this_month || 0}

${reportSummary ? `MARKET ANALYSIS SUMMARY:\n${reportSummary}` : ""}
${competitorBehavior ? `COMPETITOR BEHAVIOR:\n${competitorBehavior}` : ""}

Generate a complete brand identity profile. Be specific to this business — not generic.
Return valid JSON with EXACTLY these fields:
{
  "voice": "2-4 word brand voice descriptors (e.g. 'educational, direct, no-fluff')",
  "tone": "2-4 word tone descriptors (e.g. 'warm but professional, confidence-first')",
  "targetAudience": "1-2 sentences describing the ideal customer — who they are, their pain points",
  "contentPillars": ["pillar 1", "pillar 2", "pillar 3"],
  "visualStyle": "2-3 sentences describing visual aesthetic — colors, imagery, layout feel",
  "colorPalette": "2-3 colors that fit the brand (e.g. 'deep purple, warm gold, white')",
  "uniqueAngle": "1 sentence: what makes this business different in its content vs competitors",
  "channelPresence": {
    "summary": "2-3 sentence overall assessment of current social/digital presence strength",
    "channels": [
      { "name": "channel name", "status": "active|limited|absent", "strength": "brief assessment", "priority": "high|medium|low" }
    ],
    "topOpportunity": "the single biggest untapped channel opportunity for this business"
  },
  "competitorAccounts": "3-5 Instagram/social handles the business should study (real accounts in the niche, if known)",
  "postingRecommendation": "how often + what mix (e.g. '4x/week Instagram: 60% tips, 30% social proof, 10% offers')"
}

Return ONLY valid JSON, no markdown, no explanation.`;

  const msg = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.choices[0]?.message?.content || "{}";
  try { return JSON.parse(raw); } catch { return {}; }
}

module.exports = {
  generateInstagramCaption,
  generateChannelCaption,
  generatePostImage,
  populateBrandIdentityFromData,
  buildImagePrompt,
};
