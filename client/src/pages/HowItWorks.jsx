import ContentLayout from "../components/ContentLayout";

const MUT  = "rgba(255,255,255,0.5)";
const DIM  = "rgba(255,255,255,0.25)";
const BD   = "rgba(255,255,255,0.08)";
const CARD = "rgba(255,255,255,0.04)";
const GRAD = "linear-gradient(135deg,#C855EA,#4558D6)";

const STAGES = [
  {
    num: "01",
    title: "Discovery",
    subtitle: "Find business directions matched to your situation.",
    body: "Answer a short questionnaire: your skills and experience, available hours per week, starting budget, income goals, and location constraints. EarnedLab's AI uses your answers to generate ranked business directions that match your actual situation — not a generic list of \"best businesses for 2025.\" Each direction includes estimated startup cost, time-to-first-revenue, and a realistic skill match.",
    details: ["Takes 5–8 minutes to complete", "Generates 3–5 matched business directions", "Each direction shows fit score, risk level, and expected timelines", "You choose which direction to develop further"],
  },
  {
    num: "02",
    title: "Validation",
    subtitle: "Understand the market before you commit.",
    body: "Once you've selected a direction, the marketing agent runs a full market analysis: target customer profile, competitive landscape, demand signals, pricing benchmarks, and key risks. This isn't generic industry data — it's analysis specific to your offer, location, and constraints. You get a clear picture of whether the idea is viable before investing time or money.",
    details: ["Customer segmentation and pain point analysis", "Competitor identification and positioning map", "Demand assessment and pricing benchmarks", "Risk factors and mitigation strategies"],
  },
  {
    num: "03",
    title: "Planning",
    subtitle: "Turn your validated idea into a real plan.",
    body: "EarnedLab converts the validated business direction into a structured launch plan: your offer, pricing model, brand positioning, website structure, and the first 30 days of tasks. The plan is built around your available time and budget — not an aspirational version that assumes a full-time commitment. Tasks are actionable and broken into small, completable steps.",
    details: ["Offer definition with scope and pricing", "Brand basics: name, positioning, target customer", "Website structure and initial content", "30-day task list with milestones"],
  },
  {
    num: "04",
    title: "Launch",
    subtitle: "Build your presence and go live.",
    body: "EarnedLab generates and deploys your business website — a real, live site on a Netlify-hosted domain. You review and approve the content before it goes live. Once live, the website is connected to the management agent, which can update it automatically as your business evolves. You can also connect your own domain.",
    details: ["AI-generated website content based on your business profile", "Live deployment to a Netlify-hosted URL", "Review and approval before anything goes live", "Connect your own domain at any time"],
  },
  {
    num: "05",
    title: "Marketing",
    subtitle: "Get a marketing strategy and content that actually fits your business.",
    body: "The marketing agent continuously generates marketing insights, growth opportunities, and channel-specific content recommendations based on your business profile, goals, and current performance. On Starter and above, you can run the marketing agent to get a full analysis and content plan. On Pro Autopilot, it runs on a schedule automatically.",
    details: ["Market opportunity analysis and competitor tracking", "Channel strategy for social media, email, and local", "Content briefs and ready-to-use posts", "Campaign planning and performance recommendations"],
  },
  {
    num: "06",
    title: "Management",
    subtitle: "Implement recommendations without leaving the platform.",
    body: "The management agent takes approved recommendations and implements them directly — updating your website copy, posting to connected social channels, sending email campaigns, and updating your Google Business profile. On Pro, you approve each action. On Pro Autopilot, the agent runs on a schedule. Every action is logged and reversible.",
    details: ["Website content updates and page additions", "Social media posting across connected channels", "Email campaign sending via connected platforms", "Google Business Profile updates"],
  },
  {
    num: "07",
    title: "Operations",
    subtitle: "Run your business from the hub.",
    body: "The hub is your central workspace: task management, revenue and lead tracking, business health metrics, integration status, and the intelligence assistant. The intelligence assistant is a context-aware AI chat that knows your business profile, goals, and history — ask it anything from positioning questions to draft copy to operational decisions.",
    details: ["Task tracking with status and priority", "Revenue and lead entry and trend tracking", "Business health snapshot at a glance", "Intelligence assistant with full business context"],
  },
];

function Pill({ label }) {
  return (
    <span style={{ display:"inline-block", background:"rgba(200,85,234,0.12)", border:"1px solid rgba(200,85,234,0.25)", borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600, color:"#C855EA", letterSpacing:"0.03em", marginBottom:16 }}>
      {label}
    </span>
  );
}

export default function HowItWorks() {
  return (
    <ContentLayout
      title="How EarnedLab works"
      description="Seven stages from idea to operating business — and the AI agents that work alongside you at each step."
    >
      {STAGES.map((s, i) => (
        <div
          key={s.num}
          style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, marginBottom:72, paddingBottom:72, borderBottom: i < STAGES.length - 1 ? `1px solid ${BD}` : "none", alignItems:"start" }}
          className="hiw-row"
        >
          {/* left */}
          <div>
            <div style={{ fontWeight:800, fontSize:13, color:"rgba(200,85,234,0.6)", letterSpacing:"0.1em", marginBottom:12 }}>{s.num}</div>
            <h2 style={{ fontSize:"clamp(22px,3vw,30px)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.2, marginBottom:10 }}>{s.title}</h2>
            <p style={{ fontSize:16, fontWeight:600, color:"rgba(255,255,255,0.75)", lineHeight:1.5, marginBottom:20 }}>{s.subtitle}</p>
            <p style={{ fontSize:15, color:"rgba(255,255,255,0.5)", lineHeight:1.8 }}>{s.body}</p>
          </div>

          {/* right */}
          <div style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:14, padding:"24px 24px 28px", marginTop:8 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:18 }}>
              What you get
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {s.details.map((d, j) => (
                <div key={j} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:2 }}>
                    <circle cx="8" cy="8" r="7.5" stroke="url(#g-check)" strokeWidth="1" />
                    <defs>
                      <linearGradient id="g-check" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#C855EA" />
                        <stop offset="100%" stopColor="#4558D6" />
                      </linearGradient>
                    </defs>
                    <path d="M5 8l2 2 4-4" stroke="url(#g-check2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <defs>
                        <linearGradient id="g-check2" x1="5" y1="8" x2="11" y2="8" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#C855EA" />
                          <stop offset="100%" stopColor="#4558D6" />
                        </linearGradient>
                      </defs>
                    </path>
                  </svg>
                  <span style={{ fontSize:14, color:"rgba(255,255,255,0.75)", lineHeight:1.5 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* cta */}
      <div style={{ textAlign:"center", paddingTop:16 }}>
        <Pill label="Ready to start?" />
        <h2 style={{ fontSize:"clamp(24px,4vw,36px)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:16 }}>
          Your business starts with a 7-day free trial.
        </h2>
        <p style={{ fontSize:16, color:MUT, marginBottom:32 }}>No credit card required. Full access to discovery, validation, and planning.</p>
        <a href="/signup" style={{ display:"inline-flex", alignItems:"center", gap:8, background:GRAD, color:"#fff", textDecoration:"none", padding:"14px 32px", borderRadius:12, fontSize:16, fontWeight:700, letterSpacing:"-0.02em" }}>
          Start for free →
        </a>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .hiw-row { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </ContentLayout>
  );
}
