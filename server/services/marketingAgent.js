/**
 * Enhanced Marketing Agent Service
 *
 * Generates a structured marketing intelligence report that includes:
 *  - Per-channel live stats (Instagram if credentials present)
 *  - General market analysis (industry trends, competitor landscape)
 *  - Specific, immediately-actionable campaign suggestions
 *  - Content previews for each suggestion (ready-to-post captions, etc.)
 *
 * Content style inspired by high-performing service-business social media:
 * tip cards, social proof, behind-the-scenes, value-first hooks.
 */

const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

async function chatStructured(prompt, schema, toolName, max = 3000) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: max,
    tools: [{ name: toolName, description: "Submit the structured output.", input_schema: schema }],
    tool_choice: { type: "tool", name: toolName },
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content.find(b => b.type === "tool_use");
  if (!block) throw new Error("No structured output returned");
  return block.input;
}

// ── Channel stat collection ───────────────────────────────────────────────────

async function collectInstagramStats(meta) {
  if (!meta.accessToken || !meta.businessAccountId) return null;
  try {
    const ig = require("./instagram");
    const [profile, media] = await Promise.allSettled([
      ig.getProfile(meta.accessToken, meta.businessAccountId),
      ig.getRecentMedia(meta.accessToken, meta.businessAccountId, 9),
    ]);
    const p = profile.status === "fulfilled" ? profile.value : {};
    const posts = media.status === "fulfilled" ? media.value : [];
    const now = Date.now();
    const lastPost = posts[0] ? Math.round((now - new Date(posts[0].timestamp).getTime()) / 86400000) : null;
    const avgLikes = posts.length
      ? Math.round(posts.reduce((s, p) => s + (p.like_count || 0), 0) / posts.length)
      : 0;
    return {
      followers: p.followers_count || 0,
      following: p.follows_count || 0,
      mediaCount: p.media_count || 0,
      lastPostDaysAgo: lastPost,
      recentPostCount: posts.length,
      avgLikes,
      username: p.username || meta.handle || "",
    };
  } catch {
    return null;
  }
}

// ── Report generation ─────────────────────────────────────────────────────────

async function runEnhancedMarketingAgent(business, metrics, intake, integrations) {
  let idea = {};
  try { idea = JSON.parse(business.ideaData || "{}"); } catch {}
  const prefs = metrics.prefs || {};
  const today = new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" });

  // Build per-channel context
  const channelLines = [];
  const liveStats = {};

  for (const intg of (integrations || [])) {
    let meta = {};
    try { meta = JSON.parse(intg.metadata || "{}"); } catch {}
    const hasCredentials = meta.accessToken || meta.apiKey || meta.handle || meta.spreadsheetId;
    if (!hasCredentials && intg.status !== "connected") continue;

    if (intg.provider === "instagram") {
      const stats = await collectInstagramStats(meta);
      if (stats) {
        liveStats.instagram = stats;
        const postAlert = stats.lastPostDaysAgo === null
          ? "No posts found"
          : stats.lastPostDaysAgo === 0 ? "Posted today"
          : stats.lastPostDaysAgo === 1 ? "Posted yesterday"
          : `Last post was ${stats.lastPostDaysAgo} days ago`;
        channelLines.push(
          `INSTAGRAM (@${stats.username || "account"}): ${stats.followers.toLocaleString()} followers, ` +
          `${stats.mediaCount} total posts, ${postAlert}, avg ${stats.avgLikes} likes/post`
        );
      } else {
        channelLines.push(`INSTAGRAM: Connected (credentials set) — could not fetch live stats`);
      }
    } else if (intg.provider === "email") {
      channelLines.push(`EMAIL: Connected — ${meta.emailsSent || 0} sent, ${meta.openRate || 0}% open rate`);
    } else if (intg.provider === "website" || intg.provider === "netlify") {
      channelLines.push(`WEBSITE: Live at ${meta.liveUrl || "unknown URL"}`);
    } else if (intg.provider === "google") {
      channelLines.push(`GOOGLE BUSINESS: Connected — ${metrics.social?.google_reviews || 0} reviews, ${metrics.social?.google_rating || 0}★ rating`);
    } else {
      channelLines.push(`${intg.provider.toUpperCase()}: Connected`);
    }
  }

  const channelSection = channelLines.length > 0
    ? channelLines.join("\n")
    : "No channels connected — provide general advice and suggest connecting channels for richer insights";

  const audienceNote = prefs.audience === "local"
    ? `Local business serving ${business.location}`
    : prefs.audience === "global" ? "Global/online business — no location-specific language"
    : prefs.audience === "national" ? "National audience"
    : prefs.targetMarket ? `Niche audience: ${prefs.targetMarket}` : "General audience";

  const stageNote = {
    starting: "Just starting — focus on first clients, brand visibility, quick wins",
    growing: "Growing — focus on consistency, reviews, referrals",
    scaling: "Scaling — focus on efficiency, content volume, paid acquisition",
    established: "Established — focus on retention, upsells, new revenue streams",
  }[prefs.stage] || "Early stage";

  const prompt = `
You are the senior marketing strategist for "${business.name}" (${idea.name || business.name}).
Today: ${today}
${audienceNote}
Stage: ${stageNote}
${prefs.goals ? `Owner's current goal: ${prefs.goals}` : ""}

CONNECTED CHANNELS (live data):
${channelSection}

BUSINESS METRICS:
- Revenue: $${metrics.revenue?.this_month || 0}/month (last month: $${metrics.revenue?.last_month || 0})
- Active clients: ${metrics.clients?.active || 0} (total ever: ${metrics.clients?.total || 0})
- Leads this month: ${metrics.leads?.this_month || 0}
- Bookings this week: ${metrics.bookings?.this_week || 0}
- Instagram followers: ${metrics.social?.instagram || liveStats.instagram?.followers || 0}

Generate a high-quality marketing intelligence report. Be SPECIFIC — reference actual numbers above.
Suggestions should be immediately actionable TODAY, not vague long-term advice.

CONTENT STYLE RULES for Instagram captions:
- Write like a successful service business that educates its audience
- Hook first (one punchy sentence), value second (1-2 sentences), CTA third (1 sentence)
- No emojis, no markdown formatting
- Mention the business name or its specific service
- Make it feel authentic, not corporate
- Hashtags: 10-12 tightly relevant tags on their own line

SUGGESTION RULES:
- Title must be SPECIFIC: "Post today on Instagram" not "Increase social presence"
- Cite the data: "You haven't posted in 4 days" not "Post more often"
- Max 15 minutes to complete each campaign
- If a channel has no posts/content: suggest creating the first piece
- If posting was recent: suggest the next content type (tips, testimonial, offer, etc.)

Return JSON matching the schema exactly.
`;

  const schema = {
    type: "object",
    properties: {
      channelStats: {
        type: "array",
        items: {
          type: "object",
          properties: {
            channel:    { type: "string" },
            label:      { type: "string" },
            connected:  { type: "boolean" },
            score:      { type: "number" },
            highlights: { type: "array", items: { type: "string" } },
            alerts:     { type: "array", items: { type: "string" } },
          },
          required: ["channel","label","connected","score","highlights","alerts"],
        },
      },
      marketAnalysis: {
        type: "object",
        properties: {
          summary:             { type: "string" },
          competitorBehavior:  { type: "string" },
          opportunities:       { type: "array", items: { type: "string" } },
        },
        required: ["summary","competitorBehavior","opportunities"],
      },
      suggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id:               { type: "string" },
            title:            { type: "string" },
            rationale:        { type: "string" },
            channel:          { type: "string" },
            priority:         { type: "string", enum: ["high","medium","low"] },
            estimatedMinutes: { type: "number" },
            expectedImpact:   { type: "string" },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name:          { type: "string" },
                  description:   { type: "string" },
                  estimatedTime: { type: "string" },
                  canAutomate:   { type: "boolean" },
                },
                required: ["name","description","estimatedTime","canAutomate"],
              },
            },
            contentPreview: {
              type: "object",
              properties: {
                instagram: {
                  type: "object",
                  properties: {
                    postType:   { type: "string" },
                    caption:    { type: "string" },
                    hashtags:   { type: "string" },
                    imageNote:  { type: "string" },
                  },
                },
                website: {
                  type: "object",
                  properties: {
                    section:   { type: "string" },
                    changeType:{ type: "string" },
                    newContent: { type: "string" },
                  },
                },
                email: {
                  type: "object",
                  properties: {
                    subject:  { type: "string" },
                    preheader:{ type: "string" },
                    bodyHook: { type: "string" },
                    cta:      { type: "string" },
                  },
                },
                tiktok: {
                  type: "object",
                  properties: {
                    concept: { type: "string" },
                    hook:    { type: "string" },
                    caption: { type: "string" },
                  },
                },
                twitter: {
                  type: "object",
                  properties: {
                    tweet:   { type: "string" },
                    thread1: { type: "string" },
                  },
                },
                manual: {
                  type: "object",
                  properties: {
                    tip:   { type: "string" },
                    steps: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          required: ["id","title","rationale","channel","priority","estimatedMinutes","expectedImpact","tasks","contentPreview"],
        },
      },
    },
    required: ["channelStats","marketAnalysis","suggestions"],
  };

  const result = await chatStructured(prompt, schema, "submit_marketing_report", 4000);
  return { ...result, liveStats, generatedAt: new Date().toISOString() };
}

// ── Manual mode — basic overview from user-inputted stats ─────────────────────

async function runBasicOverview(business, metrics, integrations) {
  let idea = {};
  try { idea = JSON.parse(business.ideaData || "{}"); } catch {}

  const connectedChannels = (integrations || [])
    .filter(i => {
      try { const m = JSON.parse(i.metadata || "{}"); return Object.values(m).some(v => typeof v === "string" && v.length > 3); } catch { return false; }
    })
    .map(i => i.provider);

  const prompt = `
You are a marketing advisor giving basic guidance for "${business.name}" (${idea.name || "service business"}).

Connected channels: ${connectedChannels.join(", ") || "none"}
Metrics: revenue $${metrics.revenue?.this_month || 0}/mo, clients ${metrics.clients?.active || 0} active, leads ${metrics.leads?.this_month || 0}/mo, Instagram ${metrics.social?.instagram || 0} followers

Provide a basic marketing overview with general tips. Be concise and practical.
Do NOT do a deep AI analysis — just surface-level observations and general best practices.
Note that full AI analysis is available in Guided and Autopilot modes.
`;

  const schema = {
    type: "object",
    properties: {
      overview: {
        type: "object",
        properties: {
          headline: { type: "string" },
          summary:  { type: "string" },
          channelNotes: { type: "array", items: { type: "object", properties: { channel: { type: "string" }, note: { type: "string" } }, required: ["channel","note"] } },
          generalTips:  { type: "array", items: { type: "string" } },
          missingChannels: { type: "array", items: { type: "string" } },
        },
        required: ["headline","summary","channelNotes","generalTips","missingChannels"],
      },
    },
    required: ["overview"],
  };

  const result = await chatStructured(prompt, schema, "submit_basic_overview", 1500);
  return result.overview;
}

// ── Content generation per channel ───────────────────────────────────────────

async function generateChannelContent(business, task, channel, mode) {
  let idea = {};
  try { idea = JSON.parse(business.ideaData || "{}"); } catch {}

  const businessContext = `${business.name} (${idea.name || "service business"})`;
  const contentPrompt = task.description || task.name;

  if (channel === "instagram" || /instagram|social|post/i.test(task.name)) {
    return generateInstagramContent(businessContext, contentPrompt, mode);
  }
  if (channel === "email" || /email|newsletter/i.test(task.name)) {
    return generateEmailContent(businessContext, contentPrompt, mode);
  }
  if (channel === "website" || /website|web page|landing/i.test(task.name)) {
    return generateWebsiteContent(businessContext, contentPrompt, mode);
  }
  if (channel === "tiktok" || /tiktok|video/i.test(task.name)) {
    return generateTikTokContent(businessContext, contentPrompt, mode);
  }
  if (channel === "twitter" || /twitter|tweet|x\.com/i.test(task.name)) {
    return generateTwitterContent(businessContext, contentPrompt, mode);
  }
  return null;
}

async function generateInstagramContent(businessContext, angle, mode) {
  if (mode === "manual") {
    return {
      type: "manual_tip",
      tips: [
        "Post a tip relevant to your target audience — what do they need to know?",
        "Use your first sentence as a hook — make it impossible to scroll past",
        "Share a behind-the-scenes moment to build authenticity",
        "Include 10-12 relevant hashtags on a separate line",
        "Post between 9am–11am or 7pm–9pm for best reach",
      ],
    };
  }

  const isGuided = mode === "guided";
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [{ role: "user", content: `
Write ${isGuided ? "a concrete plan and ready-to-post content" : "a ready-to-post Instagram post"} for ${businessContext}.
Post angle: ${angle}

${isGuided ? `Return:
1. CONTENT BRIEF: What to photograph/create for the image
2. CAPTION: The full caption (2-3 sentences, no emojis, no markdown)
3. HASHTAGS: 10-12 relevant tags
4. BEST TIME TO POST: Day + time recommendation` : `Return ONLY:
CAPTION: [the full caption text]
HASHTAGS: [the hashtags on one line]`}

Rules: No emojis. Write specifically for ${businessContext}. Hook first, value second, CTA third.
` }],
  });
  return { type: "instagram_content", content: msg.content[0]?.text?.trim() || "" };
}

async function generateEmailContent(businessContext, angle, mode) {
  if (mode === "manual") {
    return {
      type: "manual_tip",
      tips: [
        "Subject line: keep under 50 characters, create curiosity or urgency",
        "Open with a personal hook or relevant question",
        "One clear call-to-action per email — don't ask for multiple things",
        "Send Tuesday–Thursday, 9am–11am for highest open rates",
        "Personalize with first name if you have it",
      ],
    };
  }
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: `
Write ${mode === "guided" ? "an email plan and draft" : "a complete email"} for ${businessContext}.
Purpose: ${angle}

Return:
SUBJECT: [subject line]
PREHEADER: [30-word preview text]
BODY: [full email body, plain text, 150-200 words]
CTA: [call to action button text]
` }],
  });
  return { type: "email_content", content: msg.content[0]?.text?.trim() || "" };
}

async function generateWebsiteContent(businessContext, angle, mode) {
  if (mode === "manual") {
    return {
      type: "manual_tip",
      tips: [
        "Identify the specific section to change (hero, services, testimonials, CTA)",
        "Use customer language — write how your clients describe their problems",
        "Every section needs a clear next action (button, form, or link)",
        "Add social proof near your main CTA for maximum conversion",
        "Check mobile view after any change",
      ],
    };
  }
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [{ role: "user", content: `
Write website copy update for ${businessContext}.
Change: ${angle}

Return:
SECTION: [which section on the website]
HEADLINE: [new headline text]
SUBTEXT: [supporting text, 1-2 sentences]
CTA BUTTON: [button label]
NOTES: [1-2 implementation tips]
` }],
  });
  return { type: "website_content", content: msg.content[0]?.text?.trim() || "" };
}

async function generateTikTokContent(businessContext, angle, mode) {
  if (mode === "manual") {
    return {
      type: "manual_tip",
      tips: [
        "Hook in the first 1-2 seconds — show or say something that stops the scroll",
        "Use trending audio or sounds for discoverability",
        "Show don't tell — demonstration and transformation videos perform best",
        "Reply to comments with new videos to multiply reach",
        "Post consistently — 1-2x per day for growth phase",
      ],
    };
  }
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [{ role: "user", content: `
Write a TikTok video concept for ${businessContext}.
Angle: ${angle}

Return:
HOOK (0-2s): [opening line or action]
CONCEPT: [what to film, 2-3 sentences]
KEY POINTS: [3 bullet points for the video]
CAPTION: [TikTok caption, max 150 chars]
HASHTAGS: [5-8 TikTok-specific tags]
` }],
  });
  return { type: "tiktok_content", content: msg.content[0]?.text?.trim() || "" };
}

async function generateTwitterContent(businessContext, angle, mode) {
  if (mode === "manual") {
    return {
      type: "manual_tip",
      tips: [
        "Thread format (5-10 tweets) consistently outperforms single tweets",
        "Start with a bold claim or question to drive replies",
        "Share opinions — neutral content is ignored, takes get engagement",
        "Engage with 3-5 relevant accounts before posting for algorithmic boost",
        "Post during business hours in your target timezone",
      ],
    };
  }
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [{ role: "user", content: `
Write a tweet and thread starter for ${businessContext}.
Topic: ${angle}

Return:
TWEET: [single tweet, max 280 chars]
THREAD 1/3: [thread opener]
THREAD 2/3: [main value tweet]
THREAD 3/3: [CTA tweet]
` }],
  });
  return { type: "twitter_content", content: msg.content[0]?.text?.trim() || "" };
}

module.exports = {
  runEnhancedMarketingAgent,
  runBasicOverview,
  generateChannelContent,
};
