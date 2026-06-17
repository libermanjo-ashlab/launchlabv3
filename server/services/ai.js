const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL  = "claude-sonnet-4-20250514";

function safeJSON(text) {
  const m = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!m) throw new Error("No JSON in response");
  let s = m[0];
  try { return JSON.parse(s); } catch {
    s = s.replace(/,(\s*[}\]])/g,"$1");
    try { return JSON.parse(s); } catch(e) {
      const last = s.lastIndexOf("},");
      if (last > 0) try { return JSON.parse(s.slice(0,last+1)+"]"); } catch {}
      throw new Error("JSON parse failed: "+e.message);
    }
  }
}

async function chat(prompt, max=3000) {
  const msg = await client.messages.create({ model:MODEL, max_tokens:max, messages:[{role:"user",content:prompt}] });
  return msg.content.find(b=>b.type==="text")?.text||"";
}

function ageContext(age) {
  if (!age) return { group:"adult", note:"" };
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
  const text = await chat(`
Generate exactly 5 tailored business ideas for this person. Return ONLY a valid JSON array.

Profile:
Location: ${intake.location}
Age: ${intake.age||"not specified"}
Hours per week: ${intake.hours}
Budget: $${Number(intake.budget).toLocaleString()}
Skills: ${intake.skills?.join(", ")||"none listed"}
Assets: ${intake.assets?.join(", ")||"none listed"}
Risk tolerance: ${intake.risk||"medium"}
Income goal: ${intake.incomeGoal||"not specified"}
Experience: ${intake.businessExperience||"none"}
${intake.ownIdea?"Own idea to analyze first: "+intake.ownIdea:""}

${note}

RULES:
- Every idea must be specific to ${intake.location}
- Must be feasible within ${intake.hours} hrs/week and $${Number(intake.budget).toLocaleString()} budget
- Do NOT use double-quote or apostrophe characters inside string values
- Return ONLY the JSON array

[{"name":"Business Name","tagline":"Clear value proposition under 12 words","why":"2 sentences on why this fits their specific profile","revenue":"$X,XXX-$X,XXX/mo","timeToFirstRevenue":"X-Y weeks","startupCost":"$X-$X,XXX","biggestRisk":"One specific risk","scores":{"Fit":8.5,"Market":7.0,"Capital":9.0,"Time":8.0,"Risk":7.5,"Upside":8.0}}]
`, 3500);
  return safeJSON(text);
}

async function generateTasks(idea, intake) {
  const { group, note } = ageContext(intake.age);
  const isMinor = group === "minor";

  const text = await chat(`
Generate a business setup checklist for "${idea.name}" in ${intake.location}.
Budget: $${Number(intake.budget).toLocaleString()}. Age: ${intake.age||"adult"}.

${note}

${isMinor ? `
MINOR-SPECIFIC RULES:
- No LLC formation tasks
- No business bank accounts
- Payment setup: Venmo, PayPal.me, or cash only
- No formal business registration required
- Keep every task under 30 minutes
- Add a parent or guardian note where any agreement is involved
` : `
- All tasks must be completable independently
- ${group==="young_adult"?"Add helpful context for first-time entrepreneurs":"Keep instructions concise"}
`}

Return ONLY a JSON array. No double-quote or apostrophe characters inside strings.

[{"name":"Task name","category":"Legal or Financial or Digital or Operations or Marketing","description":"What to do and why it matters for this specific business","estimatedTime":"X minutes or X hours","estimatedCost":"$X or Free","canAutomate":true,"${isMinor?"parentNote":"tip"}":"${isMinor?"Note if parent involvement needed":"Optional helpful tip"}","steps":[{"text":"Step description","url":"https://direct-url.com or null"}]}]

Generate 8-12 tasks in logical order. Be specific to ${idea.name} in ${intake.location}.
`, 2500);
  return safeJSON(text);
}

async function generateWebsite(business, idea, intake) {
  const text = await chat(`
Create a complete, mobile-responsive single-page website. Output ONLY the raw HTML file — no markdown, no explanation.

Business: ${business.name}
Type: ${idea.name}
Location: ${business.location}
Tagline: ${business.tagline||idea.tagline||"Professional services"}
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
  return text.replace(/^```html?\s*/i,"").replace(/\s*```\s*$/i,"").trim();
}

async function generateBusinessPlan(business, idea, intake) {
  const { note } = ageContext(intake.age);
  const text = await chat(`
Write a practical, realistic business plan for ${business.name} (${idea.name}).
Format as clean HTML with inline styles.

Data: Budget $${business.budget.toLocaleString()} | Revenue target ${idea.revenue} | Location: ${business.location} | Hours/week: ${business.hoursPerWeek}
Skills: ${intake.skills?.join(", ")||"general"} | Age context: ${note||"adult"}

Sections: Executive Summary, Business Overview, Market Opportunity, Revenue Model and Pricing, Startup Costs, 30-60-90 Day Plan, Financial Projection (monthly for 12 months), Key Risks and How to Manage Them.

Write clearly. Avoid jargon. Use the actual numbers provided. Make it actionable.
`, 6000);
  return text.replace(/^```html?\s*/i,"").replace(/\s*```\s*$/i,"").trim();
}

async function generateSocialContent(business, idea, intake) {
  const text = await chat(`
Create a 30-day social media content calendar for "${business.name}" (${idea.name} in ${business.location}).
Return ONLY a valid JSON object. No double-quote or apostrophe characters inside string values.

{"posts":[{"day":1,"platform":"Instagram","type":"Launch announcement","caption":"Caption text here","hashtags":["tag1","tag2"]},...],
"bio":{"instagram":"Instagram bio under 150 characters","tiktok":"TikTok bio","facebook":"Facebook page description","google":"Google Business description"}}

Generate 30 posts alternating Instagram and TikTok. Tone: authentic, clear, appropriate for a local service business.
`, 4000);
  return safeJSON(text);
}

async function generateEmailTemplates(business, idea) {
  const text = await chat(`
Create 8 professional email templates for "${business.name}" (${idea.name}).
Return ONLY a valid JSON object. No double-quote or apostrophe characters inside string values.

{"templates":[{"name":"Template name","subject":"Subject line","body":"Email body with [FIRST_NAME] placeholders — under 100 words","purpose":"When to send this"},...]}

Templates: Welcome, Booking Confirmation, Appointment Reminder, Post-Service Follow-Up, Review Request, Referral Offer, Re-Engagement, Promotion.
`, 3000);
  return safeJSON(text);
}

async function runMarketingAgent(business, metrics, intake) {
  const idea = JSON.parse(business.ideaData||"{}");
  const text = await chat(`
You are the marketing agent for "${business.name}" (${idea.name} in ${business.location}).

Current metrics:
- Revenue: $${metrics.revenue?.this_month||0}/month
- Active clients: ${metrics.clients?.active||0}
- Leads this month: ${metrics.leads?.this_month||0}
- Instagram followers: ${metrics.social?.instagram||0}
- Bookings this week: ${metrics.bookings?.this_week||0}

Generate 4 specific, data-backed marketing insights. One must target the website (type: website).
Keep all string values under 20 words. No double-quote or apostrophe characters inside string values.

Return ONLY a JSON array:
[{"id":"1","type":"website","priority":"high","agentObservation":"Specific observation from the data","recommendation":"Specific actionable change","expectedImpact":"Projected outcome","implementationChannel":"Website homepage","managementAction":"What to update on the website"}]
`, 2000);
  return safeJSON(text);
}

async function runManagementAgent(business, insight, currentHtml) {
  const idea = JSON.parse(business.ideaData||"{}");
  const text = await chat(`
You are the management agent for "${business.name}" (${idea.name}).

Implement this marketing recommendation on the website:
Observation: ${insight.agentObservation}
Action: ${insight.managementAction}
Expected result: ${insight.expectedImpact}

Update the website to apply this change prominently. Keep the overall design intact.
Return ONLY the complete updated HTML starting with <!DOCTYPE html>.

Current website:
${currentHtml.slice(0,8000)}
`, 8000);
  return { html: text.replace(/^```html?\s*/i,"").replace(/\s*```\s*$/i,"").trim() };
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
