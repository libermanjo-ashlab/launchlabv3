const Anthropic = require("@anthropic-ai/sdk");
const client    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL     = "claude-sonnet-4-20250514";

function safeJSON(text) {
  const m = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!m) throw new Error("No JSON in response");
  let s = m[0];
  try { return JSON.parse(s); } catch {
    s = s.replace(/,(\s*[}\]])/g,"$1");
    try { return JSON.parse(s); } catch(e) {
      const last = s.lastIndexOf("},");
      if (last>0) try { return JSON.parse(s.slice(0,last+1)+"]"); } catch {}
      throw new Error("Parse failed: "+e.message);
    }
  }
}

async function chat(prompt, max=2000) {
  const msg = await client.messages.create({ model:MODEL, max_tokens:max, messages:[{role:"user",content:prompt}] });
  return msg.content.find(b=>b.type==="text")?.text||"";
}

async function runMarketingAgent(business, metrics, intake) {
  const idea = JSON.parse(business.ideaData||"{}");
  const text = await chat(`
You are the marketing AI for "${business.name}" — a student-run ${idea.name} in ${business.location}.

Current performance:
- Revenue: $${metrics.revenue.this_month}/mo
- Clients/customers: ${metrics.clients.active}
- Instagram followers: ${metrics.social.instagram}
- Leads this month: ${metrics.leads.this_month}

Generate 4 high-ROI marketing insights for a student entrepreneur. Use modern language — ROI, conversion rate, growth hacking, leverage, scale. Focus on zero-cost or near-zero-cost actions with maximum impact.
Include one insight targeting the website (type: website). No double quotes or apostrophes inside string values. Keep all fields under 20 words.

Return ONLY a JSON array:
[{"id":"1","type":"website","priority":"high","agentObservation":"What the data shows","recommendation":"Specific high-ROI action","expectedImpact":"Projected outcome in numbers","implementationChannel":"Website","managementAction":"What changes on the website"}]
`, 2000);
  return safeJSON(text);
}

async function runManagementAgent(business, insight, currentHtml) {
  const idea = JSON.parse(business.ideaData||"{}");
  const text = await chat(`
You are the management AI for "${business.name}" (${idea.name}).

Implementing: ${insight.recommendation}
Action: ${insight.managementAction}

Update the website with this change. Make it bold, modern, and conversion-optimized. Speak directly to young customers.
Return ONLY the complete updated HTML starting with <!DOCTYPE html>.

Current site:
${currentHtml.slice(0,8000)}
`, 8000);
  return { html: text.replace(/^```html?\s*/i,"").replace(/\s*```\s*$/i,"").trim() };
}

module.exports = { runMarketingAgent, runManagementAgent };
