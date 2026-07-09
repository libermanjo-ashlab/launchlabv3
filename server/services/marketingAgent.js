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

// ── Channel status rules ──────────────────────────────────────────────────────
// Defines which fields indicate viewable (public identifier) vs connected (API credentials)

const CHANNEL_STATUS_RULES = {
  instagram: { viewableField:"handle",     connectedFields:["accessToken","businessAccountId"] },
  tiktok:    { viewableField:"handle",     connectedFields:["accessToken","clientKey"] },
  twitter:   { viewableField:"handle",     connectedFields:["apiKey","accessToken"] },
  google:    { viewableField:"profileUrl", connectedFields:[] },
  website:   { viewableField:"siteUrl",    connectedFields:["wpAppPassword","analyticsId"] },
  calendly:  { viewableField:"bookingUrl", connectedFields:[] },
  email:     { viewableField:"address",    connectedFields:["apiKey"] },
  facebook:  { viewableField:"handle",     connectedFields:["accessToken"] },
  linkedin:  { viewableField:"handle",     connectedFields:["accessToken"] },
};

// Returns "connected" | "viewable" | "not_connected"
function determineChannelStatus(provider, meta) {
  const rule = CHANNEL_STATUS_RULES[provider];
  if (!rule) return "not_connected";
  // API credentials present → connected
  if (rule.connectedFields.some(f => typeof meta[f] === "string" && meta[f].length > 4)) return "connected";
  // Stored check result (from Hub check-viewable call)
  if (meta._viewableStatus === "viewable") return "viewable";
  if (meta._viewableStatus === "not_connected") return "not_connected";
  // Infer from field presence (before any check has run)
  if (typeof meta[rule.viewableField] === "string" && meta[rule.viewableField].length > 2) return "viewable";
  return "not_connected";
}

// Exposed for reuse in routes
module.exports.determineChannelStatus = determineChannelStatus;

// ── Channel stat collection ───────────────────────────────────────────────────

async function collectTwitterStats(meta) {
  if (!meta.accessToken || !meta.apiKey) return null;
  try {
    const tw = require("./twitter");
    const profile = await tw.getProfile(meta);
    const pm = profile.public_metrics || {};
    const tweets = await tw.getRecentTweets(meta, profile.id, 10);
    const now = Date.now();
    const lastTweet = tweets[0] ? Math.round((now - new Date(tweets[0].created_at).getTime()) / 86400000) : null;
    const avgLikes = tweets.length
      ? Math.round(tweets.reduce((s, t) => s + (t.public_metrics?.like_count || 0), 0) / tweets.length)
      : 0;
    return {
      username: profile.username,
      followers: pm.followers_count || 0,
      following: pm.following_count || 0,
      tweetCount: pm.tweet_count || 0,
      lastTweetDaysAgo: lastTweet,
      avgLikes,
    };
  } catch {
    return null;
  }
}

async function collectTikTokStats(meta) {
  if (!meta.accessToken) return null;
  try {
    const tt = require("./tiktok");
    const profile = await tt.getProfile(meta);
    const videos = await tt.getVideos(meta, 10);
    const avgViews = videos.length
      ? Math.round(videos.reduce((s, v) => s + (v.view_count || 0), 0) / videos.length)
      : 0;
    return {
      username: profile.display_name || profile.open_id,
      followers: profile.follower_count || 0,
      following: profile.following_count || 0,
      videoCount: profile.video_count || 0,
      likes: profile.likes_count || 0,
      avgViews,
    };
  } catch {
    return null;
  }
}

async function collectEmailStats(meta) {
  if (!meta.address && !meta.apiKey) return null;
  const { getEmailStats } = require("./emailChannel");
  return await getEmailStats(meta);
}

async function collectWordPressStats(meta) {
  if (!meta.siteUrl || !meta.wpUsername || !meta.wpAppPassword) return null;
  try {
    const wp = require("./wordpress");
    const [pages, posts] = await Promise.allSettled([
      wp.getPages(meta.siteUrl, meta.wpUsername, meta.wpAppPassword, 5),
      wp.getPosts(meta.siteUrl, meta.wpUsername, meta.wpAppPassword, 5),
    ]);
    return {
      siteUrl: meta.siteUrl,
      pageCount: pages.status === "fulfilled" ? pages.value.length : 0,
      recentPosts: posts.status === "fulfilled" ? posts.value.length : 0,
      latestPost: posts.status === "fulfilled" && posts.value[0] ? posts.value[0].title?.rendered : null,
    };
  } catch {
    return null;
  }
}

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

// Predicted token cost per content type when user clicks "Generate now"
const CONTENT_TOKEN_COSTS = {
  post: 2500, update: 600, article: 1500, newsletter: 1000, schedule: 4000, manual: 0,
};

// Max suggested content per run based on plan (daily_limit/2 divided by avg cost ~1200)
const MAX_SUGGESTIONS_PER_RUN = { trial: 2, starter: 2, pro: 4, pro_autopilot: 6 };

async function runEnhancedMarketingAgent(business, metrics, intake, integrations, opts = {}) {
  const { brandIdentity = {}, previousAnalysis = null, plan = "starter" } = opts;
  let idea = {};
  try { idea = JSON.parse(business.ideaData || "{}"); } catch {}
  const prefs = metrics.prefs || {};
  const today = new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" });

  // ── Determine channel status and collect live data ──────────────────────────
  const channelLines  = [];
  const viewableLines = [];
  const liveStats     = {};
  const channelStatuses = {}; // provider → "connected" | "viewable" | "not_connected"

  for (const intg of (integrations || [])) {
    let meta = {};
    try { meta = JSON.parse(intg.metadata || "{}"); } catch {}
    const status = determineChannelStatus(intg.provider, meta);
    channelStatuses[intg.provider] = status;
    if (status === "not_connected") continue;

    if (intg.provider === "instagram") {
      if (status === "connected") {
        const stats = await collectInstagramStats(meta);
        if (stats) {
          liveStats.instagram = stats;
          const postAlert = stats.lastPostDaysAgo === null ? "no posts yet"
            : stats.lastPostDaysAgo === 0 ? "posted today"
            : stats.lastPostDaysAgo === 1 ? "posted yesterday"
            : `last post ${stats.lastPostDaysAgo} days ago`;
          channelLines.push(
            `INSTAGRAM (@${stats.username || meta.handle || "account"}) [CONNECTED]: ` +
            `${stats.followers.toLocaleString()} followers, ${stats.mediaCount} posts, ${postAlert}, avg ${stats.avgLikes} likes/post`
          );
        } else {
          const reason = !meta.businessAccountId ? "Business Account ID not configured" : "API fetch failed";
          channelLines.push(
            `INSTAGRAM (@${meta.handle || "account"}) [CONNECTED — STATS UNAVAILABLE: ${reason}]: ` +
            `Credentials present but live data could not be retrieved. DO NOT estimate or reference follower counts, post counts, or engagement numbers. Provide general content strategy only.`
          );
        }
      } else {
        viewableLines.push(`INSTAGRAM (@${meta.handle?.replace("@","") || "handle"}) [VIEWABLE]: public profile set — general best-practice insights apply`);
      }
    } else if (intg.provider === "twitter") {
      if (status === "connected") {
        const stats = await collectTwitterStats(meta);
        if (stats) {
          liveStats.twitter = stats;
          const alert = stats.lastTweetDaysAgo === null ? "no tweets" : `last tweet ${stats.lastTweetDaysAgo} days ago`;
          channelLines.push(
            `X / TWITTER (@${stats.username}) [CONNECTED]: ${stats.followers.toLocaleString()} followers, ${stats.tweetCount} tweets, ${alert}, avg ${stats.avgLikes} likes/tweet`
          );
        } else {
          channelLines.push(
            `X / TWITTER (@${meta.handle?.replace("@","") || "handle"}) [CONNECTED — STATS UNAVAILABLE]: ` +
            `Credentials present but live data could not be retrieved. DO NOT estimate or reference specific numbers.`
          );
        }
      } else {
        viewableLines.push(`X / TWITTER (@${meta.handle?.replace("@","") || "handle"}) [VIEWABLE]: handle set`);
      }
    } else if (intg.provider === "tiktok") {
      if (status === "connected") {
        const stats = await collectTikTokStats(meta);
        if (stats) {
          liveStats.tiktok = stats;
          channelLines.push(
            `TIKTOK (@${stats.username}) [CONNECTED]: ${stats.followers.toLocaleString()} followers, ${stats.videoCount} videos, avg ${stats.avgViews} views/video`
          );
        } else {
          channelLines.push(
            `TIKTOK (@${meta.handle?.replace("@","") || "handle"}) [CONNECTED — STATS UNAVAILABLE]: ` +
            `Credentials present but live data could not be retrieved. DO NOT estimate or reference specific numbers.`
          );
        }
      } else {
        viewableLines.push(`TIKTOK (@${meta.handle?.replace("@","") || "handle"}) [VIEWABLE]: handle set`);
      }
    } else if (intg.provider === "email") {
      if (status === "connected") {
        const stats = await collectEmailStats(meta);
        if (stats) {
          liveStats.email = stats;
          const detail = stats.subscribers
            ? `${stats.subscribers.toLocaleString()} subscribers, ${stats.openRate || 0}% open rate`
            : `${stats.emailsSent || meta.emailsSent || 0} sent, ${stats.openRate || meta.openRate || 0}% open rate`;
          channelLines.push(`EMAIL [CONNECTED] (${stats.provider || meta.provider || "email"}): ${meta.address} — ${detail}`);
        } else {
          channelLines.push(`EMAIL [CONNECTED]: ${meta.address} — ${meta.emailsSent || 0} sent`);
        }
      } else {
        viewableLines.push(`EMAIL [VIEWABLE]: ${meta.address} — address set, no API connected`);
      }
    } else if (intg.provider === "website") {
      if (status === "connected") {
        const stats = await collectWordPressStats(meta);
        if (stats) {
          liveStats.website = stats;
          channelLines.push(
            `WEBSITE [CONNECTED] (WordPress): ${stats.siteUrl}, ${stats.pageCount} pages, ${stats.recentPosts} recent posts` +
            (stats.latestPost ? `, latest: "${stats.latestPost}"` : "")
          );
        } else {
          channelLines.push(`WEBSITE [CONNECTED]: ${meta.siteUrl || meta.liveUrl} (${meta.host || "custom host"})`);
        }
      } else {
        viewableLines.push(`WEBSITE [VIEWABLE]: ${meta.siteUrl || meta.liveUrl || "URL set"} (${meta.host || "custom host"})`);
      }
    } else if (intg.provider === "netlify") {
      if (meta.liveUrl) viewableLines.push(`WEBSITE (Netlify) [VIEWABLE]: live at ${meta.liveUrl}`);
    } else if (intg.provider === "google") {
      if (status === "connected" || meta.profileUrl) {
        viewableLines.push(`GOOGLE BUSINESS [${status.toUpperCase()}]: profile URL set`);
      }
    } else if (intg.provider === "calendly" && meta.bookingUrl) {
      viewableLines.push(`CALENDLY [VIEWABLE]: booking link set — ${meta.bookingUrl}`);
    }
  }

  const allChannelLines = [
    ...(channelLines.length  ? ["── CONNECTED (private analytics available) ──", ...channelLines]  : []),
    ...(viewableLines.length ? ["── VIEWABLE (public info only) ──",              ...viewableLines] : []),
  ];
  const channelSection = allChannelLines.length > 0
    ? allChannelLines.join("\n")
    : "No marketing channels set up yet — provide general strategy advice and suggest which channels to start with";

  // ── Brand identity context ──────────────────────────────────────────────────
  const brandSection = [
    brandIdentity.productDescription && `Product/Service: ${brandIdentity.productDescription}`,
    brandIdentity.targetAudience     && `Target audience: ${brandIdentity.targetAudience}`,
    brandIdentity.voice              && `Brand voice: ${brandIdentity.voice}`,
    brandIdentity.visualStyle        && `Visual style: ${brandIdentity.visualStyle}`,
    brandIdentity.colorPalette       && `Color palette: ${brandIdentity.colorPalette}`,
    brandIdentity.contentPillars?.length && `Content pillars: ${Array.isArray(brandIdentity.contentPillars) ? brandIdentity.contentPillars.join(", ") : brandIdentity.contentPillars}`,
    brandIdentity.competitorAccounts && `Competitor/inspiration accounts: ${brandIdentity.competitorAccounts}`,
    brandIdentity.postingRecommendation && `Current posting strategy: ${brandIdentity.postingRecommendation}`,
  ].filter(Boolean).join("\n");

  // ── Previous analysis for change comparison ─────────────────────────────────
  // Only pass previous channel STATS (not the AI-generated summary which may contain non-marketing noise)
  const prevSection = (() => {
    if (!previousAnalysis?.ranAt) return "";
    const prevLive = previousAnalysis.liveStats || previousAnalysis.report?.liveStats || {};
    const lines = Object.entries(prevLive).map(([ch, s]) => {
      if (!s) return null;
      if (ch === "instagram") return `Instagram: ${s.followers ?? "?"} followers, ${s.mediaCount ?? "?"} posts, avg ${s.avgLikes ?? "?"} likes`;
      if (ch === "twitter")   return `X/Twitter: ${s.followers ?? "?"} followers, ${s.tweetCount ?? "?"} tweets`;
      if (ch === "tiktok")    return `TikTok: ${s.followers ?? "?"} followers, ${s.videoCount ?? "?"} videos`;
      if (ch === "email")     return `Email: ${s.subscribers ?? 0} subscribers, ${s.openRate ?? 0}% open rate`;
      return null;
    }).filter(Boolean);
    if (!lines.length) return "";
    return `PREVIOUS CHANNEL STATS (${new Date(previousAnalysis.ranAt).toLocaleDateString()}):
${lines.join("\n")}
Compare these stats to the current data above. Note improvements (+), regressions (-), or stagnation (=) per channel. Only reference channel metrics.`;
  })();

  const audienceNote = prefs.audience === "local"
    ? `Local business serving ${business.location}`
    : prefs.audience === "global" ? "Global/online business"
    : prefs.targetMarket ? `Target market: ${prefs.targetMarket}` : "";

  const stageNote = {
    starting: "Just starting — focus on first clients, brand visibility, quick wins",
    growing:  "Growing — focus on consistency, reviews, referrals",
    scaling:  "Scaling — focus on efficiency, content volume, paid acquisition",
    established: "Established — focus on retention, upsells, new revenue streams",
  }[prefs.stage] || "";

  const maxSuggestions = MAX_SUGGESTIONS_PER_RUN[plan] || 2;

  const prompt = `You are the senior marketing strategist for "${business.name}" (${idea.name || business.name}).
Today: ${today}
${audienceNote}
${stageNote}
${prefs.goals ? `Business context (do NOT reference in channel analysis): ${prefs.goals}` : ""}

MARKETING CHANNELS:
${channelSection}

BRAND IDENTITY:
${brandSection || "(not yet configured — infer from business type)"}

${prevSection}

STRICT RULES — VIOLATIONS ARE ERRORS:
1. NEVER mention leads, revenue, clients, bookings, sales figures, or business pipeline in any section. This is marketing channel analysis ONLY.
2. When a channel is marked STATS UNAVAILABLE, provide strategy advice only. NEVER invent or estimate follower counts, post counts, or engagement numbers. NEVER reference "0 followers" or "0 posts" unless confirmed by actual data above.
3. Do not repeat content from previous analyses verbatim — assess whether the situation has changed.

ANALYSIS RULES:
- Focus ONLY on marketing channel performance and content strategy
- For CONNECTED channels with live stats: cite the actual numbers provided above
- For CONNECTED channels with STATS UNAVAILABLE: note credentials are set, recommend fixing the connection, give general strategy
- For VIEWABLE channels: note public-facing signals (handle set, profile live, booking link active)
- Compare to previous channel stats if provided — call out improvements, regressions, or stagnation per channel

COMPETITOR ACTIVITY:
For the competitorBehavior field, describe SPECIFICALLY:
- What content formats competitors use (carousel, Reels, single image, Story, short video, long-form, etc.)
- Visual aesthetic: colors, design style, filter/editing style
- Caption approach: short punchy hooks, long storytelling, bullet lists, CTA-heavy, question-based, etc.
- Estimated posting frequency based on niche norms
- Type of engagement they typically drive (comments, saves, shares, follows)
Name specific accounts from the brand identity if available. Be concrete and actionable.

BRAND IDENTITY UPDATES:
Analyze the connected/viewable channels and update brand identity fields where you can observe them:
- colorPalette: dominant colors seen in posts/branding (if observable)
- visualStyle: content style observed (photography, graphics, video, etc.)
- voice: tone of captions/copy observed
- competitorAccounts: accounts in the same space worth tracking (comma-separated handles)
- postingRecommendation: optimal posting schedule based on what you see working

SUGGESTED CONTENT:
Generate exactly ${maxSuggestions} high-priority content suggestions based on the opportunities section.
Order by priority (high first). Include: the specific channel, a tone descriptor, and a specific topic/context prompt.
- tone: adjective phrase matching the brand voice (e.g. "bold, direct" or "educational, value-driven")
- topic: SPECIFIC prompt that will go directly into the content generator: e.g. "Introduce EarnedLab with a single bold value-prop graphic and DM CTA" — not generic like "post about your business"
- Only suggest channels that are CONNECTED or VIEWABLE (not not_connected)
- Map to types: post=Instagram/TikTok/Facebook visual, update=Twitter/Website/Google short text, article=LinkedIn long-form, newsletter=Email, schedule=content calendar

Return JSON matching the schema exactly.`;

  const schema = {
    type: "object",
    properties: {
      marketAnalysis: {
        type: "object",
        properties: {
          summary:            { type: "string" },
          competitorBehavior: { type: "string" },
          opportunities:      { type: "array", items: { type: "string" } },
          changesSinceLast:   { type: "string" },
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
            contentPreview: {
              type: "object",
              properties: {
                instagram: { type: "object", properties: { postType:{type:"string"}, caption:{type:"string"}, hashtags:{type:"string"} } },
                website:   { type: "object", properties: { section:{type:"string"}, newContent:{type:"string"} } },
                email:     { type: "object", properties: { subject:{type:"string"}, bodyHook:{type:"string"}, cta:{type:"string"} } },
                tiktok:    { type: "object", properties: { concept:{type:"string"}, hook:{type:"string"}, caption:{type:"string"} } },
                twitter:   { type: "object", properties: { tweet:{type:"string"} } },
                manual:    { type: "object", properties: { tip:{type:"string"}, steps:{type:"array",items:{type:"string"}} } },
              },
            },
          },
          required: ["id","title","rationale","channel","priority","estimatedMinutes","expectedImpact","contentPreview"],
        },
      },
      suggestedContent: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type:      { type: "string", enum: ["post","update","article","newsletter","schedule","manual"] },
            channel:   { type: "string" },
            tone:      { type: "string" },
            topic:     { type: "string" },
            rationale: { type: "string" },
            priority:  { type: "string", enum: ["high","medium","low"] },
          },
          required: ["type","channel","tone","topic","rationale","priority"],
        },
      },
      brandIdentityUpdates: {
        type: "object",
        properties: {
          colorPalette:        { type: "string" },
          visualStyle:         { type: "string" },
          voice:               { type: "string" },
          competitorAccounts:  { type: "string" },
          postingRecommendation: { type: "string" },
          productDescription:  { type: "string" },
        },
      },
    },
    required: ["marketAnalysis","suggestions","suggestedContent","brandIdentityUpdates"],
  };

  const result = await chatStructured(prompt, schema, "submit_marketing_report", 5000);
  return { ...result, liveStats, channelStatuses, generatedAt: new Date().toISOString() };
}

// ── Manual mode — basic overview from user-inputted stats ─────────────────────

async function runBasicOverview(business, metrics, integrations) {
  let idea = {};
  try { idea = JSON.parse(business.ideaData || "{}"); } catch {}

  const channelSummary = (integrations || []).map(i => {
    let meta = {};
    try { meta = JSON.parse(i.metadata || "{}"); } catch {}
    const status = determineChannelStatus(i.provider, meta);
    if (status === "not_connected") return null;
    return `${i.provider} (${status})`;
  }).filter(Boolean);

  const prompt = `You are a marketing advisor giving basic guidance for "${business.name}" (${idea.name || "service business"}).

Marketing channels: ${channelSummary.join(", ") || "none set up yet"}

Provide a basic marketing overview with general tips focused on the connected channels.
Be concise and practical. Focus on channel activity and content strategy, not business metrics.
Note that full AI analysis with channel data is available in Guided and Autopilot modes.
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
  determineChannelStatus,
  CONTENT_TOKEN_COSTS,
};
