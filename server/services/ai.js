const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL  = "claude-sonnet-4-6";

// Plain text call — used for HTML outputs (website, business plan) and chat.
async function chat(prompt, max = 3000) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: max,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content.find(b => b.type === "text")?.text || "";
}

// Structured output call — uses tool_choice to force the model to return valid
// JSON matching the given schema. Eliminates JSON parsing errors entirely.
async function chatStructured(prompt, schema, toolName, max = 3000) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: max,
    tools: [{ name: toolName, description: "Submit the structured output.", input_schema: schema }],
    tool_choice: { type: "tool", name: toolName },
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content.find(b => b.type === "tool_use");
  if (!block) throw new Error("No structured output returned by model");
  return block.input;
}

function ageContext(age) {
  if (!age) return { group: "adult", note: "" };
  if (age < 18) return {
    group: "minor",
    note: `Person is ${age} years old (under 18). IMPORTANT: Do NOT suggest LLC formation, business bank accounts, formal contracts, or Stripe business accounts. Focus on sole proprietor or informal arrangements. Payment via Venmo, PayPal.me, or cash. Parent or guardian involvement may be needed for any formal agreements. Business types should be age-appropriate: tutoring, content creation, reselling, pet care, lawn care, photography, social media help, handmade goods.`,
  };
  if (age < 25) return {
    group: "young_adult",
    note: `Person is ${age} years old. Can do everything but may be starting their first business. Explain steps clearly. LLC is available but mark it as optional at first. Prioritize getting to first revenue quickly.`,
  };
  return {
    group: "adult",
    note: `Person is ${age} years old. Treat as an experienced adult. Show all business setup options including legal formation, professional accounts, and full financial infrastructure.`,
  };
}

async function generateIdeas(intake) {
  const { note } = ageContext(intake.age);
  const result = await chatStructured(`
Generate exactly 5 tailored side-hustle business ideas for this person.

Profile:
Location: ${intake.location}
Age: ${intake.age || "not specified"}
Hours per week: ${intake.hours}
Budget: $${Number(intake.budget).toLocaleString()}
Skills: ${intake.skills?.join(", ") || "none listed"}
Assets: ${intake.assets?.join(", ") || "none listed"}
Risk tolerance: ${intake.risk || "medium"}
Income goal: ${intake.incomeGoal || "not specified"}
Experience: ${intake.businessExperience || "none"}
${intake.ownIdea ? "Own idea to analyze first: " + intake.ownIdea : ""}

${note}

Rules:
- Every idea must be specific to ${intake.location}
- Must be feasible within ${intake.hours} hrs/week and $${Number(intake.budget).toLocaleString()} budget
- Use $ for all dollar amounts (e.g. $80, $150)
- why: one sentence under 25 words explaining the fit
- biggestRisk: under 12 words
- All scores between 0 and 10
`, {
    type: "object",
    properties: {
      ideas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name:               { type: "string" },
            tagline:            { type: "string" },
            why:                { type: "string" },
            revenue:            { type: "string" },
            timeToFirstRevenue: { type: "string" },
            startupCost:        { type: "string" },
            biggestRisk:        { type: "string" },
            scores: {
              type: "object",
              properties: {
                Fit:    { type: "number" },
                Market: { type: "number" },
                Capital:{ type: "number" },
                Time:   { type: "number" },
                Risk:   { type: "number" },
                Upside: { type: "number" },
              },
              required: ["Fit", "Market", "Capital", "Time", "Risk", "Upside"],
            },
          },
          required: ["name","tagline","why","revenue","timeToFirstRevenue","startupCost","biggestRisk","scores"],
        },
      },
    },
    required: ["ideas"],
  }, "submit_ideas", 4000);
  return result.ideas;
}

async function generateTasks(idea, intake) {
  const { group, note } = ageContext(intake.age);
  const isMinor = group === "minor";
  const result = await chatStructured(`
Generate a business setup checklist for "${idea.name}" in ${intake.location}.
Budget: $${Number(intake.budget).toLocaleString()}. Age: ${intake.age || "adult"}.

${note}

${isMinor ? `
Minor-specific rules:
- No LLC formation tasks
- No business bank accounts
- Payment setup: Venmo, PayPal.me, or cash only
- No formal business registration required
- Keep every task under 30 minutes
- Add a parentNote where any agreement or signup is involved
` : `
- All tasks must be completable independently
- ${group === "young_adult" ? "Add helpful context for first-time entrepreneurs" : "Keep instructions concise"}
`}

Generate 8-12 tasks in logical order, specific to ${idea.name} in ${intake.location}.
Use $ for all dollar amounts.
`, {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name:          { type: "string" },
            category:      { type: "string", enum: ["Legal","Financial","Digital","Operations","Marketing"] },
            description:   { type: "string" },
            estimatedTime: { type: "string" },
            estimatedCost: { type: "string" },
            canAutomate:   { type: "boolean" },
            tip:           { type: "string" },
            parentNote:    { type: "string" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  url:  { type: "string" },
                },
                required: ["text"],
              },
            },
          },
          required: ["name","category","description","estimatedTime","estimatedCost","canAutomate","steps"],
        },
      },
    },
    required: ["tasks"],
  }, "submit_tasks", 3000);
  return result.tasks;
}

async function generateWebsite(business, idea, intake) {
  const text = await chat(`
Create a complete, mobile-responsive single-page website. Output ONLY the raw HTML file — no markdown, no explanation.

Business: ${business.name}
Type: ${idea.name}
Location: ${business.location}
Tagline: ${business.tagline || idea.tagline || "Professional services"}
Revenue range: ${idea.revenue}

Design requirements:
- Complete standalone HTML with all CSS in a style tag
- Modern, clean design — primary color: #7C3AED (purple), accent: #0891B2 (teal)
- Gradient hero section
- Sections: Hero, Services, Pricing, Social proof, Contact form
- Mobile responsive media queries
- Contact form shows thank-you message on submit via JS — no backend required
- No external dependencies except Google Fonts (Space Grotesk)
- Fast loading, professional, builds trust
`, 7000);
  return text.replace(/^```html?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

async function generateBusinessPlan(business, idea, intake) {
  const { note } = ageContext(intake.age);
  const text = await chat(`
Write a practical, realistic business plan for ${business.name} (${idea.name}).
Format as clean HTML with inline styles.

Data: Budget $${business.budget.toLocaleString()} | Revenue target ${idea.revenue} | Location: ${business.location} | Hours/week: ${business.hoursPerWeek}
Skills: ${intake.skills?.join(", ") || "general"} | Age context: ${note || "adult"}

Sections: Executive Summary, Business Overview, Market Opportunity, Revenue Model and Pricing, Startup Costs, 30-60-90 Day Plan, Financial Projection (monthly for 12 months), Key Risks and How to Manage Them.

Write clearly. Avoid jargon. Use the actual numbers provided. Make it actionable.
`, 6000);
  return text.replace(/^```html?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

async function generateSocialContent(business, idea, intake) {
  const result = await chatStructured(`
Create a 30-day social media content calendar for "${business.name}" (${idea.name} in ${business.location}).
Generate 30 posts alternating Instagram and TikTok.
Tone: authentic, clear, appropriate for a local service business.
Use $ for all dollar amounts.
`, {
    type: "object",
    properties: {
      posts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day:      { type: "number" },
            platform: { type: "string" },
            type:     { type: "string" },
            caption:  { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
          },
          required: ["day","platform","type","caption","hashtags"],
        },
      },
      bio: {
        type: "object",
        properties: {
          instagram: { type: "string" },
          tiktok:    { type: "string" },
          facebook:  { type: "string" },
          google:    { type: "string" },
        },
        required: ["instagram","tiktok","facebook","google"],
      },
    },
    required: ["posts","bio"],
  }, "submit_social_content", 4000);
  return result;
}

async function generateEmailTemplates(business, idea) {
  const result = await chatStructured(`
Create 8 professional email templates for "${business.name}" (${idea.name}).
Templates: Welcome, Booking Confirmation, Appointment Reminder, Post-Service Follow-Up, Review Request, Referral Offer, Re-Engagement, Promotion.
Use [FIRST_NAME] placeholders. Body under 100 words each. Use $ for dollar amounts.
`, {
    type: "object",
    properties: {
      templates: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name:    { type: "string" },
            subject: { type: "string" },
            body:    { type: "string" },
            purpose: { type: "string" },
          },
          required: ["name","subject","body","purpose"],
        },
      },
    },
    required: ["templates"],
  }, "submit_email_templates", 3000);
  return result;
}

async function runMarketingAgent(business, metrics, intake) {
  let idea = {};
  try { idea = JSON.parse(business.ideaData || "{}"); } catch {}
  const result = await chatStructured(`
You are the marketing agent for "${business.name}" (${idea.name || "business"} in ${business.location}).

Current metrics:
- Revenue: $${metrics.revenue?.this_month || 0}/month
- Active clients: ${metrics.clients?.active || 0}
- Leads this month: ${metrics.leads?.this_month || 0}
- Instagram followers: ${metrics.social?.instagram || 0}
- Bookings this week: ${metrics.bookings?.this_week || 0}

Generate 4 specific, data-backed marketing insights. At least one must target the website (type: "website").
Keep each string field under 20 words.
`, {
    type: "object",
    properties: {
      insights: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id:                    { type: "string" },
            type:                  { type: "string" },
            priority:              { type: "string", enum: ["high","medium","low"] },
            agentObservation:      { type: "string" },
            recommendation:        { type: "string" },
            expectedImpact:        { type: "string" },
            implementationChannel: { type: "string" },
            managementAction:      { type: "string" },
          },
          required: ["id","type","priority","agentObservation","recommendation","expectedImpact","implementationChannel","managementAction"],
        },
      },
    },
    required: ["insights"],
  }, "submit_insights", 2000);
  return result.insights;
}

async function runManagementAgent(business, insight, currentHtml) {
  let idea = {};
  try { idea = JSON.parse(business.ideaData || "{}"); } catch {}
  const text = await chat(`
You are the management agent for "${business.name}" (${idea.name || "business"}).

Implement this marketing recommendation on the website:
Observation: ${insight.agentObservation}
Action: ${insight.managementAction}
Expected result: ${insight.expectedImpact}

Update the website to apply this change prominently. Keep the overall design intact.
Return ONLY the complete updated HTML starting with <!DOCTYPE html>.

Current website:
${currentHtml.slice(0, 8000)}
`, 8000);
  return { html: text.replace(/^```html?\s*/i, "").replace(/\s*```\s*$/i, "").trim() };
}

async function chatResponse(message, context) {
  const { note } = ageContext(context.age);
  const text = await chat(`
You are a helpful business advisor. Context: ${JSON.stringify(context)}. ${note}
Question: ${message}
Answer in 2-3 sentences. Be specific and practical.
`, 500);
  return text.trim();
}

module.exports = { generateIdeas, generateTasks, generateWebsite, generateBusinessPlan, generateSocialContent, generateEmailTemplates, runMarketingAgent, runManagementAgent, chatResponse };
