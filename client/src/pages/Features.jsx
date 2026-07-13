import ContentLayout from "../components/ContentLayout";

const MUT  = "rgba(255,255,255,0.5)";
const DIM  = "rgba(255,255,255,0.25)";
const BD   = "rgba(255,255,255,0.08)";
const CARD = "rgba(255,255,255,0.04)";

const SECTIONS = [
  {
    label: "Intelligence",
    title: "Business discovery and idea matching",
    desc: "EarnedLab matches you with business opportunities based on your skills, time, budget, income goals, and location. Not a generic list — a ranked, fit-scored set of directions built for your specific situation.",
    features: [
      { name:"Skills-based matching", desc:"Maps your experience and strengths to business types with realistic demand." },
      { name:"Time and budget constraints", desc:"Filters out business models that don't fit your available hours or starting capital." },
      { name:"Fit scoring", desc:"Each direction gets a fit score, risk level, and expected time-to-revenue estimate." },
      { name:"Template shortcuts", desc:"Jump straight to a business type with the /start page — consulting, agency, freelance, creator, ecommerce, SaaS, and more." },
    ],
  },
  {
    label: "Research",
    title: "Market validation and competitive analysis",
    desc: "Before you invest time or money, validate the idea. EarnedLab runs a market analysis that surfaces the customer problem, competitive landscape, demand signals, and pricing benchmarks specific to your offer.",
    features: [
      { name:"Target customer profiling", desc:"Identifies who the customer is, what they want, and what they'll pay for it." },
      { name:"Competitor mapping", desc:"Names real competitors, their positioning, pricing, and how to differentiate from them." },
      { name:"Demand assessment", desc:"Evaluates market size and demand signals relevant to your business type and location." },
      { name:"Risk identification", desc:"Surfaces the top risks and mitigation strategies before you commit." },
    ],
  },
  {
    label: "Planning",
    title: "Business planning and launch roadmap",
    desc: "EarnedLab converts a validated idea into a structured plan: offer definition, pricing, brand basics, website structure, and a task list built around your actual time and budget.",
    features: [
      { name:"Offer definition", desc:"Structures your service, scope, deliverables, and pricing into a client-ready offer." },
      { name:"Brand positioning", desc:"Names your business, defines your positioning, and sets your target customer statement." },
      { name:"Website structure", desc:"Plans your website architecture and generates the initial content for each page." },
      { name:"Milestone-based task list", desc:"Breaks launch into specific, ordered tasks with a 30-day timeline." },
    ],
  },
  {
    label: "Marketing",
    title: "Marketing agent — insights and growth",
    desc: "The marketing agent continuously generates market analysis, growth opportunities, and channel-specific content recommendations based on your business profile and goals. Run it on request or let it run on a schedule.",
    features: [
      { name:"Market insights", desc:"Regular analysis of your competitive environment and growth opportunities." },
      { name:"Channel strategy", desc:"Recommends the right channels for your business type and target audience." },
      { name:"Content briefs", desc:"Generates ready-to-use content for social media, email, and your website." },
      { name:"Campaign planning", desc:"Builds campaign outlines with hooks, angles, and channel-specific formats." },
      { name:"Autopilot scheduling", desc:"On Pro Autopilot, runs marketing analysis automatically on a regular schedule." },
    ],
  },
  {
    label: "Execution",
    title: "Management agent — direct implementation",
    desc: "The management agent implements approved recommendations without you having to leave EarnedLab. It updates your website, posts to social channels, sends email campaigns, and updates your Google Business profile.",
    features: [
      { name:"Website updates", desc:"Adds and edits pages, updates copy, and publishes changes to your live Netlify site." },
      { name:"Social media posting", desc:"Posts to Instagram, Twitter/X, TikTok, Facebook, and LinkedIn via connected accounts." },
      { name:"Email campaigns", desc:"Sends campaigns through Resend, Mailchimp, or SendGrid with your approved content." },
      { name:"Google Business updates", desc:"Updates your Google Business Profile with posts, hours, and business information." },
      { name:"Approval workflow", desc:"Every action requires your approval on Pro. Autopilot handles approved action types automatically." },
    ],
  },
  {
    label: "Content",
    title: "Content lab — social, email, and web",
    desc: "Generate channel-specific content on demand. The content lab produces captions, image prompts, email sequences, and full campaign posts tailored to your brand voice and target audience.",
    features: [
      { name:"Social captions", desc:"Platform-optimized captions for Instagram, Twitter/X, LinkedIn, TikTok, and Facebook." },
      { name:"Image generation prompts", desc:"DALL-E–powered image creation alongside content briefs." },
      { name:"Email content", desc:"Full email drafts for campaigns, newsletters, and sequences." },
      { name:"Website copy", desc:"Landing page sections, about pages, service descriptions, and calls to action." },
      { name:"Campaign briefs", desc:"End-to-end campaign content from hook to call-to-action across multiple formats." },
    ],
  },
  {
    label: "Operations",
    title: "Intelligence assistant — business chat",
    desc: "A context-aware AI assistant that knows your business: your profile, goals, plan, and history. Ask it anything — positioning questions, content drafts, pricing advice, competitor analysis, or operational decisions.",
    features: [
      { name:"Full business context", desc:"Knows your offer, target customer, market, goals, and recent agent activity." },
      { name:"Ask anything", desc:"Marketing questions, content drafts, strategic advice, or operational guidance." },
      { name:"Session continuity", desc:"Context persists across conversations within your business workspace." },
      { name:"Action suggestions", desc:"Can recommend what to run next — which agent to use, what content to generate." },
    ],
  },
  {
    label: "Tracking",
    title: "Hub — the central workspace",
    desc: "The hub is your command center. Track leads and revenue, manage tasks, monitor integration status, and see your business health at a glance — all connected to the same workspace the agents use.",
    features: [
      { name:"Revenue and lead tracking", desc:"Log entries and see trends over time for both revenue and lead volume." },
      { name:"Task management", desc:"Add, prioritize, and check off tasks. Agent-generated tasks appear automatically." },
      { name:"Integration status", desc:"See which channels are connected and what the agents last did on each." },
      { name:"Business health view", desc:"A single-screen summary of what's working, what needs attention, and what's next." },
    ],
  },
];

function Pill({ label }) {
  return (
    <span style={{ display:"inline-block", background:"rgba(200,85,234,0.12)", border:"1px solid rgba(200,85,234,0.25)", borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, color:"#C855EA", letterSpacing:"0.05em", marginBottom:14 }}>
      {label.toUpperCase()}
    </span>
  );
}

export default function Features() {
  return (
    <ContentLayout
      title="Features"
      description="Everything you need to start, grow, and manage a business — in one connected workspace."
    >
      {SECTIONS.map((s, i) => (
        <div
          key={s.label}
          style={{ marginBottom:64, paddingBottom:64, borderBottom: i < SECTIONS.length - 1 ? `1px solid ${BD}` : "none" }}
        >
          <Pill label={s.label} />
          <h2 style={{ fontSize:"clamp(20px,3vw,28px)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.2, marginBottom:12 }}>{s.title}</h2>
          <p style={{ fontSize:15, color:MUT, lineHeight:1.8, maxWidth:640, marginBottom:32 }}>{s.desc}</p>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16 }}>
            {s.features.map(f => (
              <div key={f.name} style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:12, padding:"18px 20px" }}>
                <h3 style={{ fontWeight:700, fontSize:14, letterSpacing:"-0.01em", marginBottom:8 }}>{f.name}</h3>
                <p style={{ fontSize:13, color:MUT, lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* integrations reference */}
      <div style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:14, padding:"28px 28px" }}>
        <h3 style={{ fontWeight:700, fontSize:18, letterSpacing:"-0.02em", marginBottom:12 }}>Supported integrations</h3>
        <p style={{ fontSize:15, color:MUT, lineHeight:1.7, marginBottom:20 }}>
          Connect the channels the management agent uses to implement recommendations.
        </p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
          {["Instagram","Twitter / X","TikTok","Facebook","LinkedIn","Google Business Profile","WordPress","Netlify","Resend","Mailchimp","SendGrid"].map(name => (
            <div key={name} style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${BD}`, borderRadius:8, padding:"6px 14px", fontSize:13, color:"rgba(255,255,255,0.75)", fontWeight:500 }}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </ContentLayout>
  );
}
