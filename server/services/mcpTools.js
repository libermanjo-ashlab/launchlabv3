/**
 * MCP tool implementations.
 * Read-only tools (7) call Claude; write tools (2) require auth and write to Prisma.
 */
const Anthropic     = require("@anthropic-ai/sdk");
const { PrismaClient } = require("@prisma/client");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const prisma = new PrismaClient();
const MODEL  = "claude-sonnet-4-6";

const SAFETY_FOOTER = `
Rules you must follow:
- Never promise income, revenue, profitability, or business success.
- Label all estimates and projections as estimates, not facts.
- Do not provide legal, tax, accounting, investment, or medical advice.
- Distinguish clearly: sourced facts / user-provided inputs / reasoned estimates / open assumptions.
`;

async function callClaude(prompt, max = 2000) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: max,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content[0].text;
}

// ── Tool: discover_business_opportunities ──────────────────────────────────

async function discoverBusinessOpportunities(args) {
  const {
    skills = "",
    experience = "",
    interests = "",
    budget = "unknown",
    hours_per_week = "unknown",
    location_constraints = "none specified",
    income_goal = "not specified",
    risk_tolerance = "moderate",
  } = args;

  const prompt = `You are EarnedLab's business discovery tool. Generate a shortlist of 3–4 realistic business directions for this specific person.

Person's profile:
- Skills: ${skills}
- Experience: ${experience}
- Interests: ${interests}
- Starting budget: ${budget}
- Hours available per week: ${hours_per_week}
- Location constraints: ${location_constraints}
- Income goal: ${income_goal}
- Risk tolerance: ${risk_tolerance}

For each direction, provide:
1. Business type and one-sentence description
2. Why this fits this specific person (reference their actual skills and constraints — no generic answers)
3. Key assumptions behind the recommendation (2–3 specific ones)
4. Top 3 risks for this person specifically
5. Suggested first validation experiment (small, cheap, fast)

After the shortlist, include:
- A clear comparison table of the options across: startup cost, time to first revenue, weekly hours, skill match
- A recommended starting point with reasoning

Format: structured markdown. Be specific and grounded. Generic answers are not useful.

${SAFETY_FOOTER}`;

  return await callClaude(prompt, 2500);
}

// ── Tool: validate_business_idea ───────────────────────────────────────────

async function validateBusinessIdea(args) {
  const {
    idea = "",
    target_customer = "",
    location = "",
    budget = "",
    constraints = "",
    known_evidence = "",
  } = args;

  const prompt = `You are EarnedLab's business validation tool. Provide a structured validation report for this business idea.

Idea: ${idea}
Target customer: ${target_customer}
Location: ${location}
Budget: ${budget}
Constraints: ${constraints}
Known evidence (what the person already knows): ${known_evidence}

Structure your report with these sections:

## Idea restatement
Restate the idea precisely and completely.

## Customer problem
What specific problem does this solve? How painful is it? Who exactly experiences it?

## Market demand
What does demand look like for this? (Label all estimates as estimates.)

## Competitive landscape
Who already solves this? How? At what price point? What gaps exist?

## Differentiation assessment
What would make this defensibly different? What are the real differentiation risks?

## Feasibility given constraints
Is this feasible with the stated budget, time, and location? What would have to be true?

## Critical assumptions
List the 3–5 assumptions that, if wrong, would kill the business. Rank by impact.

## Risk register
Key risks (operational, acquisition, financial, competitive) with likelihood and mitigation.

## Validation experiments
3 specific, small, cheap experiments to test the most critical assumptions. Each: what to test, how, what a pass/fail looks like, estimated cost and time.

${SAFETY_FOOTER}`;

  return await callClaude(prompt, 2800);
}

// ── Tool: analyze_market ───────────────────────────────────────────────────

async function analyzeMarket(args) {
  const {
    business_description = "",
    target_customer = "",
    geography = "",
    competitors = "",
    research_question = "",
  } = args;

  const prompt = `You are EarnedLab's market analysis tool. Produce a structured market and competitor analysis.

Business: ${business_description}
Target customer: ${target_customer}
Geography: ${geography}
Known competitors (if any): ${competitors}
Specific research question: ${research_question}

Structure your analysis:

## Market overview
What market does this compete in? What are the relevant size and growth indicators? (Label estimates as estimates.)

## Customer segments
Who are the distinct customer segments? What does each want? What do they currently do?

## Competitor matrix
For each significant competitor: name, positioning, pricing (if known), key strengths, key weaknesses, who they serve best.

## White space and opportunities
Where is the market underserved? What positioning gaps exist? What do competitors consistently fail at?

## Key risks and threats
Competitive, regulatory, market trend, and structural risks.

## Sources and assumptions
Clearly label: what came from the user's inputs, what is reasoned inference, what is an open assumption requiring verification.

${SAFETY_FOOTER}`;

  return await callClaude(prompt, 2500);
}

// ── Tool: create_business_launch_plan ─────────────────────────────────────

async function createBusinessLaunchPlan(args) {
  const {
    business_direction = "",
    target_customer = "",
    offer = "",
    budget = "",
    launch_date = "",
    hours_per_week = "",
    constraints = "",
  } = args;

  const prompt = `You are EarnedLab's business planning tool. Create a staged launch plan for this specific business.

Business direction: ${business_direction}
Target customer: ${target_customer}
Offer: ${offer}
Budget: ${budget}
Target launch date: ${launch_date}
Available hours per week: ${hours_per_week}
Constraints: ${constraints}

Structure your plan:

## Offer definition
Precisely what the customer buys, what's included, what's not, and at what price.

## Launch phases
Break the path to first paid customer into 3–4 phases. For each phase:
- Name and timeframe
- Key milestone and what "done" looks like
- Specific tasks (numbered, actionable)
- Dependencies (what must be done first)
- Budget allocation for this phase

## Decision checkpoints
2–3 points in the plan where the person should reassess whether to continue, pivot, or stop. What signal would trigger each decision?

## First 30 days task list
Specific, ordered tasks for the first 30 days. Each task should be completable in a single session.

## Budget breakdown
Estimated cost by category. (Label as estimates. Actual costs vary.)

## What this plan does not cover
Be honest about gaps, assumptions, and what would need to be customized based on actual market feedback.

${SAFETY_FOOTER}`;

  return await callClaude(prompt, 2800);
}

// ── Tool: create_marketing_strategy ───────────────────────────────────────

async function createMarketingStrategy(args) {
  const {
    business_context = "",
    audience = "",
    offer = "",
    goals = "",
    budget = "",
    channels = "",
    brand_voice = "",
  } = args;

  const prompt = `You are EarnedLab's marketing strategy tool. Create a focused marketing strategy for this business.

Business context: ${business_context}
Audience: ${audience}
Offer: ${offer}
Marketing goals: ${goals}
Budget: ${budget}
Channels available or preferred: ${channels}
Brand voice: ${brand_voice}

Structure your strategy:

## Positioning statement
One clear, specific statement: for [target customer], [business name] is the [category] that [primary benefit] because [reason to believe].

## Message hierarchy
Primary message (lead with this), secondary messages (2–3), proof points for each.

## Channel plan
Prioritize 2–3 channels. For each: why this channel for this audience, what to post/send, what frequency, what a reasonable 90-day expectation looks like.
Do NOT recommend every channel. Focused beats fragmented.

## Campaign plan
One specific campaign to launch in the first 30 days: theme, hook, 3 content pieces, call to action, success metric.

## Content ideas
10 specific content ideas with formats for the prioritized channels.

## Metrics
What to track, what "working" looks like at 30 / 60 / 90 days for this specific business. (Label as targets, not guarantees.)

${SAFETY_FOOTER}`;

  return await callClaude(prompt, 2500);
}

// ── Tool: create_content_plan ──────────────────────────────────────────────

async function createContentPlan(args) {
  const {
    business_context = "",
    audience = "",
    offer = "",
    goals = "",
    brand_voice = "",
    channels = "",
    cadence = "",
  } = args;

  const prompt = `You are EarnedLab's content planning tool. Create a coordinated content strategy and calendar.

Business context: ${business_context}
Audience: ${audience}
Offer: ${offer}
Content goals: ${goals}
Brand voice: ${brand_voice}
Channels: ${channels}
Publishing cadence: ${cadence}

Structure your content plan:

## Content pillars
3–4 content pillars: each pillar name, why it matters for this audience, example topics (3–5 per pillar).

## Monthly calendar overview
Week-by-week content plan for one month across the specified channels. Each entry: channel, content type, topic, angle, call to action.

## Post briefs (first 4 posts)
For the first 4 pieces of content: full brief including headline/hook, key points to cover, call to action, format guidance, and any platform-specific notes.

## Repurposing plan
How to take one core piece and extend it across channels. Concrete examples, not theory.

## Voice and tone guidance
3–5 specific rules for this business's brand voice. What to do and what to avoid.

${SAFETY_FOOTER}`;

  return await callClaude(prompt, 2500);
}

// ── Tool: audit_business_operations ───────────────────────────────────────

async function auditBusinessOperations(args) {
  const {
    business_context = "",
    team = "",
    workflows = "",
    tools = "",
    pain_points = "",
    constraints = "",
  } = args;

  const prompt = `You are EarnedLab's operations audit tool. Identify operational improvements for this business.

Business context: ${business_context}
Team: ${team}
Current workflows: ${workflows}
Tools in use: ${tools}
Known pain points: ${pain_points}
Constraints: ${constraints}

Structure your audit:

## Operations map
What are the core workflows? Who does what? What are the inputs and outputs of each?

## Bottlenecks
Where does work slow down, pile up, or get dropped? Be specific — generic "communication problems" answers are not useful.

## Duplication and rework
What gets done twice? What gets redone because it was done wrong the first time?

## Missing ownership
What falls through the cracks because no one owns it? What decisions are unclear?

## Automation opportunities
What repetitive, rule-based tasks could be automated responsibly? For each:
- Task description
- Automation approach
- Estimated time saved
- Risk of automation (what could go wrong)
- Recommended tool or method

## Priority actions
Top 5 improvements ranked by: impact vs. effort. For each: what to do, how, expected outcome.

## Implementation risks
What could go wrong with these changes? Who needs to be involved? What should be piloted before full rollout?

${SAFETY_FOOTER}`;

  return await callClaude(prompt, 2500);
}

// ── Tool: create_earnedlab_workspace (write, requires auth) ────────────────

async function createEarnedlabWorkspace(args, userId) {
  const {
    approved_business_context = {},
    selected_plan = {},
    workspace_name = "My Business",
  } = args;

  const ctx = typeof approved_business_context === "string"
    ? { summary: approved_business_context }
    : approved_business_context;

  const plan = typeof selected_plan === "string"
    ? { summary: selected_plan }
    : selected_plan;

  const business = await prisma.business.create({
    data: {
      userId,
      name:        workspace_name,
      tagline:     ctx.tagline || ctx.positioning || null,
      location:    ctx.location || "Remote",
      budget:      parseFloat(ctx.budget) || 0,
      hoursPerWeek: parseInt(ctx.hours_per_week || ctx.hoursPerWeek) || 10,
      status:      "setup",
      ideaData:    JSON.stringify(ctx),
      intakeData:  JSON.stringify(plan),
    },
  });

  return {
    workspace_id:  business.id,
    workspace_url: `https://earnedlab.com/hub/${business.id}`,
    created_sections: ["Business profile", "Business plan", "Task list"],
    next_actions: [
      "Open your workspace at the link above",
      "Review and edit your business profile",
      "Run the marketing agent for your first insights",
      "Connect your first integration",
    ],
  };
}

// ── Tool: update_business_workspace (write, requires auth) ─────────────────

async function updateBusinessWorkspace(args, userId) {
  const {
    workspace_id = "",
    approved_changes = {},
    target_sections = [],
  } = args;

  if (!workspace_id) throw new Error("workspace_id is required");

  const biz = await prisma.business.findFirst({
    where: { id: workspace_id, userId },
  });
  if (!biz) throw new Error("Workspace not found or not authorized");

  const changes = typeof approved_changes === "string"
    ? { summary: approved_changes }
    : approved_changes;

  // Store as a BusinessOutput record so nothing is silently overwritten
  await prisma.businessOutput.create({
    data: {
      businessId: workspace_id,
      type:       "mcp-update",
      title:      `MCP update — ${new Date().toISOString().slice(0, 10)}`,
      content:    JSON.stringify({ changes, target_sections }),
    },
  });

  return {
    workspace_id,
    updated_sections: Array.isArray(target_sections) ? target_sections : ["General"],
    change_summary:   "Changes saved to workspace as a review item. Open EarnedLab to apply them.",
    workspace_url:    `https://earnedlab.com/hub/${workspace_id}`,
  };
}

// ── Dispatcher ─────────────────────────────────────────────────────────────

const READ_TOOLS = {
  discover_business_opportunities: discoverBusinessOpportunities,
  validate_business_idea:          validateBusinessIdea,
  analyze_market:                  analyzeMarket,
  create_business_launch_plan:     createBusinessLaunchPlan,
  create_marketing_strategy:       createMarketingStrategy,
  create_content_plan:             createContentPlan,
  audit_business_operations:       auditBusinessOperations,
};

const WRITE_TOOLS = {
  create_earnedlab_workspace: createEarnedlabWorkspace,
  update_business_workspace:  updateBusinessWorkspace,
};

async function executeTool(name, args, userId = null) {
  if (READ_TOOLS[name]) {
    return { text: await READ_TOOLS[name](args), isError: false };
  }
  if (WRITE_TOOLS[name]) {
    if (!userId) throw Object.assign(new Error("Authentication required for this tool"), { code: 401 });
    const result = await WRITE_TOOLS[name](args, userId);
    return { text: JSON.stringify(result, null, 2), isError: false };
  }
  const err = new Error(`Unknown tool: ${name}`);
  err.code = 404;
  throw err;
}

module.exports = { executeTool, READ_TOOLS: Object.keys(READ_TOOLS), WRITE_TOOLS: Object.keys(WRITE_TOOLS) };
