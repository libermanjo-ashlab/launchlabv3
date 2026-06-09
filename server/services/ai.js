const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL  = "claude-sonnet-4-20250514";

function parseJSON(text) {
  const m = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!m) throw new Error("No JSON in response");
  let s = m[0];
  try { return JSON.parse(s); } catch {
    s = s.replace(/,(\s*[}\]])/g, "$1");
    try { return JSON.parse(s); } catch(e) { throw new Error("Parse failed: "+e.message); }
  }
}

async function chat(prompt, max=3000) {
  const msg = await client.messages.create({ model:MODEL, max_tokens:max, messages:[{ role:"user", content:prompt }] });
  return msg.content.find(b=>b.type==="text")?.text || "";
}

async function generateIdeas(intake) {
  const text = await chat(`
You are an energetic startup advisor for college students and young entrepreneurs. Generate exactly 5 high-ROI business ideas. Return ONLY a JSON array.

Profile:
Location: ${intake.location}
Hours available: ${intake.hours} hrs/week
Startup capital: $${Number(intake.budget).toLocaleString()}
Skills: ${intake.skills?.join(", ")||"none yet"}
Assets: ${intake.assets?.join(", ")||"just a laptop and phone"}
Risk tolerance: ${intake.risk||"medium-high"}
Goal: ${intake.incomeGoal||"make money fast"}
${intake.ownIdea?"Idea to analyze first: "+intake.ownIdea:""}

STUDENT-SPECIFIC RULES:
- Zero or minimal startup costs preferred
- First revenue within 1-2 weeks maximum
- Can be run entirely from a phone/laptop
- No LLC, business registration, or complex legal setup required to start
- High ROI on time invested (think $25-$100/hr effective rate)
- Scalable — can grow without proportional time investment
- Buzzword-worthy: marketable on LinkedIn and resume-building
Do NOT use double-quote characters inside string values. Return ONLY the JSON array.

[{"name":"Business Name","tagline":"Catchy positioning under 10 words","why":"Why this is perfect for their situation — use ROI and impact language","revenue":"$X-$X,XXX/mo","timeToFirstRevenue":"X-Y days","hourlyRate":"$X-$Y/hr effective","startupCost":"$0-$XXX","scalabilityScore":"High|Medium","buzzFactor":"LinkedIn headline this becomes","daysToFirstDollar":7,"scores":{"Fit":8.5,"Market":7.0,"Capital":9.0,"Time":8.0,"Risk":7.5,"Upside":8.0}}]
`, 3500);
  return parseJSON(text);
}

async function generateTasks(idea, intake) {
  const text = await chat(`
Generate a "first 30 minutes" setup plan for "${idea.name}" in ${intake.location}. Target: complete and ready to make money in under 30 minutes.

Student profile: ${intake.hours} hrs/week | Budget: $${Number(intake.budget).toLocaleString()} | No business experience assumed.

STRICT RULES:
- EVERY task must be completable in under 30 minutes
- If a task takes longer, break it into sub-tasks each under 30 min
- canAutomate = true for the vast majority of tasks (students hate manual work)
- NO LLC formation, no business registration, no complex legal setup — those come later if at all
- First 3 tasks must result in being able to accept money
- Use student-friendly language: ROI, hustle, scale, optimize, launch
- Sort: fastest path to first dollar first
- Return ONLY JSON. No double-quote characters inside string values.

[{"name":"Task name","category":"Digital|Marketing|Operations|Financial|Legal","description":"Why this task = money in your pocket faster. What specifically to do.","estimatedTime":"X minutes","estimatedCost":"$X or Free","canAutomate":true,"minutesToComplete":15,"roiImpact":"Directly unlocks revenue|Builds credibility|Grows reach","stepNumber":1,"steps":[{"text":"Exactly what to click/do","url":"https://direct-link.com or null"}]}]
`, 3000);
  return parseJSON(text);
}

async function generateWebsite(business, idea, intake) {
  const text = await chat(`
Create a modern, Gen-Z-friendly single-page website for this student business. Output ONLY complete HTML with embedded CSS.

Business: ${business.name} | ${idea.name} | ${business.location}
Vibe: ${business.tagline||idea.tagline}
Pricing: ${idea.revenue}

Design requirements:
- Bold, modern design — vibrant gradient hero, clean sans-serif fonts
- Mobile-first (students check on phones)
- Sections: Hero (bold value prop + "Book Now" CTA), What I Do, Pricing (clear and simple), Social Proof placeholders, Get Started form
- Minimalist — no fluff, fast to read
- Accent colors: vibrant (purple, teal, or coral gradient)
- Contact form with smooth submit animation (JS, no backend)
- Google Fonts: Inter or Plus Jakarta Sans
`, 6000);
  return text.replace(/^```html?\s*/i,"").replace(/\s*```\s*$/,"").trim();
}

async function generateBusinessPlan(business, idea, intake) {
  const text = await chat(`
Write a simple, actionable business plan for ${business.name}. Format as clean HTML. Write like you're explaining to a smart friend, not an MBA class.

Numbers: Budget $${business.budget.toLocaleString()} | Revenue target ${idea.revenue} | Time: ${business.hoursPerWeek} hrs/week

Sections: The one-sentence pitch, Who pays you and why, Your pricing model, 7-day launch checklist, 30-60-90 day revenue goals, How to scale it, What could go wrong and how to handle it.

Use language like: ROI, conversion rate, revenue stream, scalable, optimize, leverage.
Keep it punchy. Students don't read long documents.
`, 4000);
  return text.replace(/^```html?\s*/i,"").replace(/\s*```\s*$/,"").trim();
}

async function generateSocialContent(business, idea, intake) {
  const text = await chat(`
Create a 30-day social media calendar for "${business.name}" (${idea.name}). Return ONLY JSON. No double-quote characters inside string values.

Platforms: TikTok/Instagram Reels (short-form video ideas), Instagram Posts, Twitter/X.
Tone: Authentic, relatable, educational-entertainment. Document the journey. Use trends.

{"posts":[{"day":1,"platform":"Instagram","type":"Launch","caption":"...","hashtags":["tag1"],"videoIdea":"Optional TikTok/Reels concept for this post"},...],
"bio":{"instagram":"Bio under 150 chars with emoji strategy","tiktok":"TikTok bio","twitter":"Twitter bio"}}
`, 4000);
  return parseJSON(text);
}

async function generateEmailTemplates(business, idea) {
  const text = await chat(`
Create 6 short, punchy email templates for "${business.name}" (${idea.name}).
Return ONLY JSON. No double-quote characters inside string values. Keep emails SHORT — students write short emails.

{"templates":[{"name":"Template name","subject":"Short subject with emoji if appropriate","body":"Short email body — max 5 sentences","sendWhen":"Trigger for sending"},...]}

Templates: First inquiry reply, Booking confirmed, Quick reminder day before, Post-service thanks + review ask, Referral offer, Coming back? win-back.
`, 2500);
  return parseJSON(text);
}

async function generatePitchDeck(business, idea, intake) {
  const text = await chat(`
Create a startup-style pitch deck for "${business.name}" as bold, modern HTML. Output ONLY HTML.

Business: ${idea.name} | Revenue: ${idea.revenue} | Location: ${business.location}

7 slides: Elevator pitch (one sentence), The problem, Your solution, Market size, Revenue model, Traction plan (30-60-90 days), Why you.

Modern design — dark background, bold typography, minimal text per slide. Use numbers prominently.
`, 4000);
  return text.replace(/^```html?\s*/i,"").replace(/\s*```\s*$/,"").trim();
}

async function chatResponse(message, context) {
  const text = await chat(`
You are an energetic startup mentor for college students. Direct, encouraging, practical.
Business: ${JSON.stringify(context)}
Question: ${message}
Answer in 2-3 sentences max. Use specific numbers. Be encouraging but honest.
`, 400);
  return text.trim();
}

module.exports = { generateIdeas, generateTasks, generateWebsite, generateBusinessPlan, generateSocialContent, generateEmailTemplates, generatePitchDeck, chatResponse };
