/**
 * OpenAI service — caption generation (GPT-4o) and image generation (DALL-E 3).
 *
 * All functions pull brand identity context so every piece of content is
 * tailored to the specific business's voice, audience, and channels.
 *
 * Env required: OPENAI_API_KEY
 */

const OpenAI = require("openai");
const log    = require("../lib/logger");

// ── Singleton client ──────────────────────────────────────────────────────────
let _client = null;
function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    log.error("OPENAI", "OPENAI_API_KEY is not set — all OpenAI calls will fail or fall back to Claude/SVG");
    throw new Error("OPENAI_API_KEY is not set — add it to your Railway environment variables");
  }
  if (!_client) {
    log.info("OPENAI", "Creating singleton OpenAI client");
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

// ── Caption generation ────────────────────────────────────────────────────────

/**
 * Generate a single Instagram caption using GPT-4o, informed by brand identity
 * and market analysis insights.
 */
async function generateInstagramCaption({ businessName, businessType, context, tone, brandIdentity, marketInsights }) {
  log.info("CAPTION", "generateInstagramCaption called", {
    businessName,
    businessType: businessType || "(none)",
    contextLen: context?.length || 0,
    contextSnippet: (context || "").slice(0, 80),
    hasBrandIdentity: !!brandIdentity,
    brandVoice: brandIdentity?.voice || "(none)",
    hasMarketInsights: !!(marketInsights?.length),
  });

  const client = getClient();

  const bi = brandIdentity || {};
  const voice    = bi.voice    || "confident, direct, educational";
  const biTone   = bi.tone     || "";
  const audience = bi.targetAudience || bi.targetMarket || "target audience";
  const pillars  = Array.isArray(bi.contentPillars) ? bi.contentPillars.join(", ") : (bi.contentPillars || "tips, social proof, behind the scenes");
  const unique   = bi.uniqueAngle || "";
  const effectiveTone = tone || biTone || "authentic, genuine";

  // Map context to post format — broad enough to catch real-world phrasing
  let postType = "value tip";
  if (context) {
    const c = context.toLowerCase();
    if (/tip|teach|learn|how.?to|guide|explain|breakdown|step/.test(c)) postType = "educational tip";
    else if (/proof|result|client|customer|testimonial|transf|win|success|case/.test(c)) postType = "social proof";
    else if (/behind|process|how we|day in|bts|workflow|making|inside/.test(c)) postType = "behind the scenes";
    else if (/offer|promo|deal|discount|book|sale|limit|announc|launch|new service/.test(c)) postType = "direct offer";
    else if (/story|journey|personal|share|experience|lesson/.test(c)) postType = "personal story";
    else if (/faq|question|ask|wonder|myth|common/.test(c)) postType = "FAQ / myth-bust";
  }
  log.debug("CAPTION", "Post type detected", { postType, context: (context || "").slice(0, 60) });

  const system = `You are an expert social media copywriter who writes captions that educate, build trust, and drive action. You write for the specific business — never generic.`;

  const user = `Write ONE Instagram caption for ${businessName}${businessType ? ` (${businessType})` : ""}.

BRAND VOICE: ${voice}
TONE: ${effectiveTone}
TARGET AUDIENCE: ${audience}
CONTENT PILLARS: ${pillars}
${unique ? `UNIQUE ANGLE (use this as the conceptual lens): ${unique}` : ""}
${context ? `POST ANGLE: ${context}` : ""}
POST FORMAT: ${postType}
${marketInsights ? `MARKET CONTEXT — incorporate these insights into the caption:\n${marketInsights}\n` : ""}

STRUCTURE (follow exactly):
1. HOOK (line 1): One sentence that stops the scroll. Bold claim, surprising fact, or relatable problem specific to ${businessName}'s work.
2. VALUE (lines 2-3): 1-2 sentences delivering on the hook. Be SPECIFIC — name the actual service, process, or outcome. Mention ${businessName}.
3. CTA (line 4): One action. Examples: "DM us [keyword]", "Book at link in bio", "Comment below if this resonates".
4. Blank line, then 10-12 tightly relevant hashtags on their own line.

NON-NEGOTIABLE RULES:
- No emojis
- No markdown formatting (no **, ##, bullet points)
- No generic phrases ("consistency is key", "stay authentic", "join us on this journey")
- No location phrases unless explicitly local
- One post only — no alternatives, no headers, no numbering
- Start directly with the hook — no intro text`;

  const t0 = Date.now();
  try {
    const msg = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 600,
      messages: [
        { role: "system", content: system },
        { role: "user",   content: user },
      ],
    });

    const full = msg.choices[0]?.message?.content?.trim() || "";
    log.info("CAPTION", "GPT-4o caption received", {
      ms: Date.now() - t0,
      fullLen: full.length,
      tokens: msg.usage?.total_tokens,
      snippet: full.slice(0, 100),
    });

    if (!full) {
      log.warn("CAPTION", "GPT-4o returned empty content", { usage: msg.usage });
    }

    // Split body from hashtag block: find last contiguous block of #hashtag lines
    const lines = full.split("\n");
    let hashtagStart = lines.length;
    for (let i = lines.length - 1; i >= 0; i--) {
      const trimmed = lines[i].trim();
      if (trimmed === "" || /^#\w/.test(trimmed)) continue;
      hashtagStart = i + 1;
      break;
    }
    const body     = lines.slice(0, hashtagStart).join("\n").trim();
    const hashtags = lines.slice(hashtagStart).join("\n").trim();

    log.info("CAPTION", "Caption split complete", {
      bodyLen: body.length,
      hashtagsLen: hashtags.length,
      hashtagCount: hashtags.split(/\s+/).filter(h => h.startsWith("#")).length,
    });

    return { caption: full, body, hashtags };
  } catch (err) {
    log.error("CAPTION", "GPT-4o caption FAILED", {
      ms: Date.now() - t0,
      error: err.message,
      status: err.status,
      businessName,
    });
    throw err;
  }
}

/**
 * Generate a caption for a non-Instagram channel (email subject, tweet, etc.).
 */
async function generateChannelCaption({ businessName, channel, context, brandIdentity }) {
  log.info("CAPTION", "generateChannelCaption called", {
    businessName, channel,
    contextSnippet: (context || "").slice(0, 60),
    hasBrandIdentity: !!brandIdentity,
  });

  const client = getClient();
  const bi = brandIdentity || {};
  const voice    = bi.voice    || "confident, direct";
  const audience = bi.targetAudience || "";
  const unique   = bi.uniqueAngle   || "";

  const channelInstructions = {
    email:   "Write a short email subject line (max 60 chars) and a 2-3 sentence email preview/intro. Subject on line 1, blank line, then preview.",
    twitter: "Write ONE tweet (max 280 chars). No hashtags in the body — add 2-3 relevant hashtags on a new line after.",
    tiktok:  "Write a TikTok video hook (spoken words for first 3 seconds, max 15 words) and a short caption (max 150 chars). Hook on line 1, blank line, then caption.",
    website: "Write a concise website section update: a headline (max 10 words) and a 2-sentence supporting paragraph.",
    general: "Write a short, clear call-to-action message (2-3 sentences) suitable for any channel.",
  };

  const instructions = channelInstructions[channel] || channelInstructions.general;
  const t0 = Date.now();

  try {
    const msg = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 300,
      messages: [
        { role: "system", content: `You are a concise copywriter for ${businessName}. Voice: ${voice}. Write only the requested content — no explanations or labels.` },
        { role: "user",   content: `${instructions}\n\nBusiness: ${businessName}\nContext/angle: ${context || "general brand awareness"}\n${audience ? `Target audience: ${audience}` : ""}\n${unique ? `Unique angle: ${unique}` : ""}` },
      ],
    });

    const text = msg.choices[0]?.message?.content?.trim() || "";
    log.info("CAPTION", "Channel caption received", {
      channel, ms: Date.now() - t0, len: text.length, tokens: msg.usage?.total_tokens,
    });
    return text;
  } catch (err) {
    log.error("CAPTION", "Channel caption FAILED", {
      channel, ms: Date.now() - t0, error: err.message, status: err.status,
    });
    throw err;
  }
}

// ── Image generation ──────────────────────────────────────────────────────────

/**
 * Build a rich, brand-specific DALL-E 3 prompt from brand identity and caption.
 */
function buildImagePrompt(businessName, captionBody, brandIdentity) {
  const bi          = brandIdentity || {};
  const palette     = bi.colorPalette || "deep purple and navy";
  const voice       = bi.voice        || "professional";
  const bizType     = bi.businessType || bi.businessCategory || "service business";
  const visualStyle = bi.visualStyle  || "clean, modern, professional";

  const moodMap = {
    educational: "informative, trustworthy",
    bold:        "striking, high-contrast",
    warm:        "inviting, soft-lit",
    minimal:     "refined, airy",
    professional:"polished, executive",
    creative:    "artistic, dynamic",
    direct:      "bold, clear",
  };
  const mood = voice.toLowerCase().split(/[,\s]+/).map(w => moodMap[w]).filter(Boolean)[0] || "polished, professional";

  const concept = (captionBody || "").split(/[.!?\n]/)[0]?.replace(/#\w+/g, "").trim().slice(0, 80) || "";

  return `Abstract background image for an Instagram post. Color palette: ${palette}. Style: ${visualStyle}, ${mood}. \
Business type: ${bizType}.${concept ? ` Theme: ${concept}.` : ""} \
1:1 square, 1024×1024. Abstract gradient, geometric shapes, or texture pattern. \
NO text, NO words, NO typography. NO people, NO logos, NO stock photography. \
Soft and uncluttered — designed as a background that will have text overlaid on top.`;
}

/**
 * Try one image model. Returns { buf, model } on success, throws on failure.
 * gpt-image-* returns base64 directly; dall-e-* returns a URL we must download.
 */
async function tryImageModel(client, model, prompt) {
  const isGptImage = model.startsWith("gpt-image");
  const safePrompt = model === "dall-e-2" ? prompt.slice(0, 950) : prompt;

  let params;
  if (model === "gpt-image-2") {
    params = { model, prompt: safePrompt, size: "1024x1024", quality: "low", n: 1 };
  } else if (isGptImage) {
    params = { model, prompt: safePrompt, size: "1024x1024", quality: "medium", n: 1 };
  } else if (model === "dall-e-3") {
    params = { model, prompt: safePrompt, size: "1024x1024", quality: "standard", n: 1 };
  } else {
    params = { model, prompt: safePrompt, size: "1024x1024", n: 1 };
  }

  const t0 = Date.now();
  const response = await client.images.generate(params);
  const item = response.data[0];

  if (isGptImage) {
    const b64 = item?.b64_json;
    if (!b64) throw new Error(`${model} returned no image data`);
    const buf = Buffer.from(b64, "base64");
    log.info("IMAGE", `${model} generation complete`, { ms: Date.now() - t0, bytes: buf.length });
    return { buf, model };
  } else {
    const url = item?.url;
    if (!url) throw new Error(`${model} returned no image URL`);
    log.info("IMAGE", `${model} generation complete`, { ms: Date.now() - t0, urlPrefix: url.slice(0, 60) });
    const imgRes = await fetch(url);
    if (!imgRes.ok) throw new Error(`Failed to download ${model} image (HTTP ${imgRes.status})`);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    log.info("IMAGE", `${model} image downloaded`, { bytes: buf.length });
    return { buf, model };
  }
}

/**
 * Generate a social post image.
 * Tries gpt-image-2 (highest quality) first, then falls back through gpt-image-1,
 * dall-e-3, and dall-e-2. Returns { buf, model }.
 */
async function generatePostImage(businessName, captionBody, brandIdentity) {
  log.info("IMAGE", "generatePostImage called", {
    businessName,
    captionSnippet: (captionBody || "").slice(0, 80),
    hasBrandIdentity: !!brandIdentity,
  });

  const client = getClient();
  const prompt = buildImagePrompt(businessName, captionBody, brandIdentity);
  log.debug("IMAGE", "prompt built", { promptLen: prompt.length });

  const modelsToTry = ["gpt-image-2", "gpt-image-1", "dall-e-3", "dall-e-2"];
  const errors = [];

  for (const model of modelsToTry) {
    try {
      return await tryImageModel(client, model, prompt);
    } catch (err) {
      log.warn("IMAGE", `${model} failed`, { error: err.message, status: err.status });
      errors.push(`${model}: ${err.message}`);
    }
  }

  throw new Error(errors.join(" | "));
}

// ── Brand identity population ─────────────────────────────────────────────────

/**
 * Build a shared channel list string used by both population and bootstrap.
 */
function buildChannelLines(integrations, metrics) {
  const lines = [];
  const intgs = integrations || [];
  for (const intg of intgs) {
    let meta = {};
    try { meta = JSON.parse(intg.metadata || "{}"); } catch {}
    if (intg.provider === "instagram") {
      lines.push(`Instagram: ${meta.handle ? `@${meta.handle}` : "connected"}, ${metrics.social?.instagram || 0} followers`);
    } else if (intg.provider === "email") {
      lines.push(`Email: ${meta.provider || "email provider"} connected, ${meta.listSize || 0} subscribers, ${meta.openRate || "unknown"} open rate`);
    } else if (intg.provider === "website" || intg.provider === "netlify") {
      lines.push(`Website: ${meta.liveUrl || meta.url || "connected"}`);
    } else if (intg.provider === "twitter") {
      lines.push(`X/Twitter: ${meta.handle ? `@${meta.handle}` : "connected"}`);
    } else if (intg.provider === "google") {
      lines.push(`Google Business Profile: connected, ${metrics.social?.google_reviews || 0} reviews (${metrics.social?.google_rating || 0}★)`);
    } else if (intg.provider === "tiktok") {
      lines.push(`TikTok: ${meta.handle ? `@${meta.handle}` : "connected"}, ${metrics.social?.tiktok || 0} followers`);
    } else {
      lines.push(`${intg.provider}: connected`);
    }
  }
  // Metrics-only channels
  if (!intgs.find(i => i.provider === "instagram") && (metrics.social?.instagram || 0) > 0) {
    lines.push(`Instagram (metrics only): ${metrics.social.instagram} followers`);
  }
  if (!intgs.find(i => i.provider === "tiktok") && (metrics.social?.tiktok || 0) > 0) {
    lines.push(`TikTok (metrics only): ${metrics.social.tiktok} followers`);
  }
  return lines;
}

/**
 * Use GPT-4o to synthesize brand identity and multi-channel presence assessment
 * from all available business data (integrations, metrics, market report, idea).
 */
async function populateBrandIdentityFromData(business, idea, integrations, metrics, marketReport) {
  log.info("BRAND", "populateBrandIdentityFromData called", {
    businessName: business.name,
    ideaName: idea.name || "(none)",
    integrationCount: (integrations || []).length,
    integrationProviders: (integrations || []).map(i => i.provider).join(","),
    hasMarketReport: !!marketReport,
  });

  const client = getClient();
  const intgs  = integrations || [];

  const channelLines   = buildChannelLines(intgs, metrics);
  const reportSummary  = marketReport?.marketAnalysis?.summary || marketReport?.overview?.summary || "";
  const competitorBehavior = marketReport?.marketAnalysis?.competitorBehavior || "";
  const opportunities  = (marketReport?.marketAnalysis?.opportunities || []).slice(0, 3).join("; ");

  const prompt = `Analyze this business and generate a precise, highly tailored brand identity + social media presence assessment.

BUSINESS: ${business.name}
TYPE: ${idea.name || "service business"}
DESCRIPTION: ${idea.why || idea.description || ""}
LOCATION: ${business.location || "online"}
TARGET MARKET: ${idea.targetMarket || "general consumers"}

CONNECTED CHANNELS & LIVE METRICS:
${channelLines.length ? channelLines.join("\n") : "No channels connected yet"}

BUSINESS METRICS:
- Revenue: $${metrics.revenue?.this_month || 0}/month
- Active clients: ${metrics.clients?.active || 0}
- Leads/month: ${metrics.leads?.this_month || 0}

${reportSummary ? `LATEST MARKET ANALYSIS:\n${reportSummary}` : ""}
${competitorBehavior ? `WHAT COMPETITORS ARE DOING:\n${competitorBehavior}` : ""}
${opportunities ? `TOP OPPORTUNITIES IDENTIFIED:\n${opportunities}` : ""}

Generate a complete, specific brand identity profile. Every field must be tailored to THIS business — not a template.
Return valid JSON with EXACTLY these fields (no extras, no markdown):
{
  "businessType": "specific business category (e.g. 'fitness coaching', 'web design agency', 'legal consulting')",
  "voice": "2-4 descriptors that define how this brand speaks (e.g. 'educational, no-fluff, data-driven')",
  "tone": "2-4 descriptors for emotional register (e.g. 'warm but authoritative, confidence-first')",
  "targetAudience": "2-3 sentences: who they are, what they struggle with, what outcome they want",
  "contentPillars": ["pillar 1", "pillar 2", "pillar 3"],
  "visualStyle": "2-3 sentences: aesthetic direction, imagery type, layout feel that fits this brand",
  "colorPalette": "2-3 specific colors fitting the brand personality (e.g. 'deep teal, warm ivory, charcoal')",
  "uniqueAngle": "1 sentence: what makes this brand's content genuinely different from generic competitors",
  "channelPresence": {
    "summary": "2-3 sentences: honest overall assessment of current presence strength across all connected channels",
    "channels": [
      { "name": "channel name", "status": "active|limited|absent", "strength": "specific 1-sentence assessment", "priority": "high|medium|low" }
    ],
    "topOpportunity": "the single highest-leverage untapped channel or tactic for this business right now"
  },
  "competitorAccounts": "3-5 Instagram or social handles in this niche worth studying — use real, known accounts if possible",
  "postingRecommendation": "specific cadence + content mix (e.g. '4x/week: 50% educational tips, 30% client results, 20% direct offers')"
}`;

  const t0 = Date.now();
  try {
    const msg = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1500,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const raw = msg.choices[0]?.message?.content || "{}";
    log.info("BRAND", "Brand identity GPT-4o response received", {
      ms: Date.now() - t0,
      tokens: msg.usage?.total_tokens,
      rawLen: raw.length,
    });

    try {
      const parsed = JSON.parse(raw);
      log.info("BRAND", "Brand identity parsed successfully", {
        fields: Object.keys(parsed).join(","),
        businessType: parsed.businessType || "(missing)",
        voice: parsed.voice || "(missing)",
      });
      return parsed;
    } catch (parseErr) {
      log.error("BRAND", "Brand identity JSON parse failed", { error: parseErr.message, raw: raw.slice(0, 200) });
      return {};
    }
  } catch (err) {
    log.error("BRAND", "Brand identity GPT-4o FAILED", {
      ms: Date.now() - t0,
      error: err.message,
      status: err.status,
      businessName: business.name,
    });
    throw err;
  }
}

/**
 * Generate slide content for a video slideshow (TikTok/Reels/video tasks).
 * Returns { slides: [{ headline, subtext }], captionBody, hashtags }
 * Slides follow the Hook → Problem → Solution → Proof → CTA structure.
 */
async function generateSlideContent({ businessName, context, brandIdentity, channel }) {
  const client = getClient();
  const bi       = brandIdentity || {};
  const voice    = bi.voice    || "confident, direct";
  const bizType  = bi.businessType || bi.businessCategory || "service business";
  const audience = bi.targetAudience || "potential customers";

  const t0 = Date.now();
  try {
    const msg = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a social video copywriter for ${businessName}, a ${bizType}. Voice: ${voice}. Target: ${audience}. Write punchy, scroll-stopping slide text. Respond with JSON only.`,
        },
        {
          role: "user",
          content: `Create a ${channel || "TikTok"} slideshow for: "${context}"

Return JSON with:
- "slides": array of exactly 5 slides, each { "headline": "max 8 words, ALL CAPS ok", "subtext": "optional 1 sentence detail or empty string" }
  Structure: [Hook, Problem/Insight, Solution, Social Proof/Example, CTA]
- "captionBody": 1-2 sentence caption for the post description
- "hashtags": 5-8 relevant hashtags as a single string

Keep headlines punchy — these are the words appearing on screen.`,
        },
      ],
    });
    const parsed = JSON.parse(msg.choices[0]?.message?.content || "{}");
    log.info("SLIDES", "Slide content generated", { context: context?.slice(0, 60), ms: Date.now() - t0, slideCount: parsed.slides?.length });
    return {
      slides:      Array.isArray(parsed.slides) ? parsed.slides.slice(0, 5) : [],
      captionBody: parsed.captionBody || "",
      hashtags:    parsed.hashtags    || "",
    };
  } catch (err) {
    log.error("SLIDES", "generateSlideContent failed", { error: err.message });
    throw err;
  }
}

/**
 * Generate step-by-step guidance for tasks that can't be automated via API
 * (engagement, follow/DM, video production). Returns { why, steps, tips }.
 */
async function generateTaskGuidance({ businessName, taskName, taskDescription, channel, brandIdentity }) {
  const client = getClient();
  const bi = brandIdentity || {};
  const bizType  = bi.businessType || bi.businessCategory || "service business";
  const audience = bi.targetAudience || "potential customers";

  const t0 = Date.now();
  try {
    const msg = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a practical marketing advisor for ${businessName}, a ${bizType}. Give specific, actionable guidance — not generic advice. Respond with valid JSON only.`,
        },
        {
          role: "user",
          content: `Task: "${taskName}"${taskDescription ? ` — ${taskDescription}` : ""}
Channel: ${channel || "social media"}. Target audience: ${audience}.

Return JSON with:
- "why": 1 sentence explaining why this task matters for growth
- "steps": array of 4–6 specific, numbered action steps the user should take
- "tips": array of 1–2 tips specific to ${businessName} and their audience`,
        },
      ],
    });
    const parsed = JSON.parse(msg.choices[0]?.message?.content || "{}");
    log.info("GUIDANCE", "Task guidance generated", { taskName, ms: Date.now() - t0 });
    return {
      why:   parsed.why   || "",
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      tips:  Array.isArray(parsed.tips)  ? parsed.tips  : [],
    };
  } catch (err) {
    log.error("GUIDANCE", "generateTaskGuidance failed", { error: err.message });
    return {
      why: "",
      steps: ["Research your target accounts in this niche", "Engage authentically with relevant content", "Follow up consistently and track your results"],
      tips: [],
    };
  }
}

module.exports = {
  generateInstagramCaption,
  generateChannelCaption,
  generateSlideContent,
  generateTaskGuidance,
  generatePostImage,
  populateBrandIdentityFromData,
  buildImagePrompt,
  buildChannelLines,
};
