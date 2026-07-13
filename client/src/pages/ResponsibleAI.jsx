import ContentLayout from "../components/ContentLayout";

const MUT  = "rgba(255,255,255,0.5)";
const DIM  = "rgba(255,255,255,0.25)";
const BD   = "rgba(255,255,255,0.08)";
const CARD = "rgba(255,255,255,0.04)";

const PRINCIPLES = [
  {
    title: "Human approval before action",
    body: "The management agent does not implement anything without your explicit approval. Every recommendation produces a plan you review before it goes live. On Autopilot, you define the categories of actions the agent is authorized to take — it operates within boundaries you set, not autonomously without constraint. This applies to website changes, social media posts, email campaigns, and any other external-facing action.",
  },
  {
    title: "Outputs are inputs to your judgment",
    body: "EarnedLab's agents produce analysis, recommendations, and content. They are inputs to your decision-making, not replacements for it. Market analysis identifies patterns in available information — it does not guarantee accuracy about specific markets. Business plans reflect the inputs you provided — they do not account for circumstances the system doesn't know about. You are the decision-maker. Treat agent outputs as you would advice from a capable analyst, not as ground truth.",
  },
  {
    title: "No guaranteed outcomes",
    body: "EarnedLab does not guarantee revenue, customers, business success, or any specific outcome. Business results depend on factors outside the platform's control: market conditions, competitive responses, your execution, timing, and circumstances specific to your situation. Nothing in the platform's outputs should be interpreted as a promise of financial return.",
  },
  {
    title: "Clear scope boundaries",
    body: "EarnedLab's agents are designed for business planning, marketing, content generation, and operations management. They are not replacements for legal, tax, accounting, medical, investment, or other regulated professional advice. When a question falls outside business operations — legal structure, tax implications, regulatory compliance — you should consult a qualified professional in that domain.",
  },
  {
    title: "Transparent AI involvement",
    body: "When an agent generates content — a marketing analysis, a website section, a social post — that output is AI-generated and reflects information and patterns in the model's training data, plus the inputs you provided. EarnedLab does not obscure this. Agent-generated content is labeled as such within the platform. If you publish that content externally, transparency about its origin is your responsibility.",
  },
  {
    title: "AI providers and training",
    body: "EarnedLab uses Anthropic's Claude and OpenAI's models via their enterprise APIs. Per their enterprise API terms, your data is not used to train their models. We do not have control over the underlying model behavior beyond our prompting and system design. AI model outputs can contain errors, outdated information, and cultural or factual biases — outputs should be reviewed before use.",
  },
];

const LIMITS = [
  "Market analysis may not reflect local conditions, very recent events, or niche market dynamics",
  "Generated content reflects the style and information in the model's training data — it may not match your brand voice without editing",
  "Business plans are templates built around your inputs, not research into your specific market participants",
  "Competitor analysis identifies publicly available signals, not private strategy or internal data",
  "Revenue and customer estimates are illustrative, not predictive",
  "Automated social media posts go out as generated — review before enabling Autopilot for public-facing channels",
];

function Pill({ label }) {
  return (
    <span style={{ display:"inline-block", background:"rgba(200,85,234,0.12)", border:"1px solid rgba(200,85,234,0.25)", borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600, color:"#C855EA", letterSpacing:"0.03em", marginBottom:16 }}>
      {label}
    </span>
  );
}

export default function ResponsibleAI() {
  return (
    <ContentLayout
      title="Responsible AI"
      description="How EarnedLab uses AI agents, where human judgment is required, and the limits of what agents can reliably do."
    >

      <div style={{ marginBottom:52 }}>
        <Pill label="Our approach" />
        <p style={{ fontSize:16, color:MUT, lineHeight:1.8, maxWidth:680 }}>
          EarnedLab is built on AI agents that generate analysis, content, and recommendations, and that can implement actions directly on connected channels. Using agents this way requires clear limits on when they act autonomously, where human judgment is required, and what they reliably cannot do.
        </p>
      </div>

      {/* principles */}
      <div style={{ marginBottom:64 }}>
        <h2 style={{ fontSize:"clamp(20px,3vw,28px)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:32 }}>
          Guiding principles
        </h2>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {PRINCIPLES.map(p => (
            <div key={p.title} style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:14, padding:"24px 26px" }}>
              <h3 style={{ fontWeight:700, fontSize:15, letterSpacing:"-0.02em", marginBottom:12 }}>{p.title}</h3>
              <p style={{ fontSize:14, color:MUT, lineHeight:1.8 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* known limits */}
      <div style={{ marginBottom:64, paddingBottom:64, borderBottom:`1px solid ${BD}` }}>
        <h2 style={{ fontSize:"clamp(20px,3vw,28px)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:16 }}>
          Known limitations
        </h2>
        <p style={{ fontSize:15, color:MUT, lineHeight:1.7, maxWidth:640, marginBottom:28 }}>
          These are things the agents are not reliably good at, by design or by the nature of generative AI. Review outputs with these in mind.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {LIMITS.map((l, i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14, background:CARD, border:`1px solid ${BD}`, borderRadius:10, padding:"14px 18px" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"rgba(200,85,234,0.6)", flexShrink:0, marginTop:6 }} />
              <span style={{ fontSize:14, color:"rgba(255,255,255,0.75)", lineHeight:1.6 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* when to use professional advice */}
      <div style={{ marginBottom:64, paddingBottom:64, borderBottom:`1px solid ${BD}` }}>
        <h2 style={{ fontSize:"clamp(20px,3vw,28px)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:16 }}>
          When to consult a professional
        </h2>
        <p style={{ fontSize:15, color:MUT, lineHeight:1.8, maxWidth:640, marginBottom:28 }}>
          EarnedLab does not replace domain-specific professional advice. Use qualified professionals for:
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14 }}>
          {[
            { domain:"Legal", desc:"Business structure, contracts, intellectual property, employment law, liability." },
            { domain:"Tax", desc:"Business taxes, deductions, entity elections, estimated payments." },
            { domain:"Accounting", desc:"Financial statements, bookkeeping, audit, and compliance." },
            { domain:"Investment", desc:"Funding decisions, equity, investor relations, valuation." },
            { domain:"Regulatory", desc:"Industry-specific licensing, permits, compliance requirements." },
            { domain:"Medical / Health", desc:"Anything involving health claims, medical decisions, or health-regulated industries." },
          ].map(item => (
            <div key={item.domain} style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:12, padding:"18px 20px" }}>
              <h3 style={{ fontWeight:700, fontSize:14, letterSpacing:"-0.01em", marginBottom:8 }}>{item.domain}</h3>
              <p style={{ fontSize:13, color:MUT, lineHeight:1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* contact */}
      <div style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:14, padding:"28px 28px" }}>
        <h3 style={{ fontWeight:700, fontSize:16, letterSpacing:"-0.02em", marginBottom:10 }}>Questions about AI use</h3>
        <p style={{ fontSize:15, color:MUT, lineHeight:1.7 }}>
          If you have a specific question about how an agent works, what data was used to generate an output, or a concern about AI behavior in the platform, contact us at{" "}
          <a href="mailto:support@earnedlab.com" style={{ color:"#C855EA", textDecoration:"none" }}>support@earnedlab.com</a>.
        </p>
      </div>

    </ContentLayout>
  );
}
