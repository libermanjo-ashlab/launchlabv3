import TemplateDetail from "../TemplateDetail";

const OTHER = [
  { id:"consulting",   label:"Consulting" },
  { id:"local-service",label:"Local Service" },
  { id:"creator",      label:"Creator" },
  { id:"freelance",    label:"Freelance" },
];

export default function TemplateAgency() {
  return (
    <TemplateDetail
      templateId="agency"
      title="Agency Business"
      tagline="Package your skills as a focused agency offer that scales beyond one client at a time."
      intro="An agency packages a repeatable skill — marketing, design, development, content, paid media, SEO, operations — into a service businesses pay for on a retainer or project basis. Unlike freelancing, the goal is to build processes and, over time, a team. EarnedLab defines your niche, productizes your offer, and builds your client acquisition strategy from day one."
      stats={[
        { label:"Starting capital",       value:"$0–$2,000" },
        { label:"Time to first client",   value:"4–10 weeks" },
        { label:"Weekly time commitment", value:"15–30 hours to start" },
        { label:"Business model",         value:"Retainer or project-based" },
      ]}
      who={[
        "Freelancers who want to productize their service and stop trading hours for dollars",
        "Marketers, designers, developers, or operations professionals going independent",
        "People who can deliver a service repeatedly and are open to eventually delegating it",
        "Professionals who want to serve multiple clients simultaneously with a defined process",
        "Anyone who sees the same client problem over and over and wants to build a solution around it",
      ]}
      whatEarnedLabDoes={[
        { title:"Niche and offer definition", desc:"Identifies the specific service, client type, and outcome your agency delivers — narrow enough to be credible, clear enough to sell." },
        { title:"Productized service design", desc:"Structures your service as a defined package with a scope, deliverable, timeline, and price — not open-ended custom work." },
        { title:"Competitive positioning", desc:"Maps your competitive landscape and identifies how to position your agency against incumbents and generalists." },
        { title:"Pricing and engagement model", desc:"Benchmarks retainer and project rates in your niche. Recommends a pricing model that reflects value and scales with capacity." },
        { title:"Business website", desc:"Generates and deploys an agency website: positioning, services, process overview, credibility signals, and a clear call to action." },
        { title:"Client acquisition strategy", desc:"Builds a pipeline strategy using outbound outreach, referral activation, LinkedIn positioning, and partnership opportunities." },
      ]}
      planOutline={[
        { milestone:"Define the niche",           detail:"Choose one specific service for one specific type of client. Resist the urge to serve everyone." },
        { milestone:"Productize the offer",       detail:"Structure the engagement: what's included, what's not, the timeline, and the fixed price (or price range)." },
        { milestone:"Build the positioning",      detail:"Write your one-sentence positioning statement. Define why you, not a generalist or a larger agency." },
        { milestone:"Launch the website",         detail:"Review and approve your agency website. Make the offer clear above the fold." },
        { milestone:"LinkedIn positioning",       detail:"Rewrite your LinkedIn headline and summary to reflect your agency niche. Start posting 2–3 times per week." },
        { milestone:"Outbound outreach",          detail:"Identify 20 target clients. Send personalized outreach with a clear value proposition and a low-friction first step." },
        { milestone:"First discovery call",       detail:"Run a structured discovery call to qualify the client and present your productized offer." },
        { milestone:"First signed client",        detail:"Deliver the engagement. Document your process for future delegation. Ask for a referral or case study." },
      ]}
      sampleTasks={[
        "Write a one-sentence description of who you serve and what you do for them",
        "Define exactly what a client gets when they pay you (no vague deliverables)",
        "Research 5 comparable agencies — note their positioning and pricing",
        "Review and approve your agency website before going live",
        "Update your LinkedIn profile to reflect your agency positioning",
        "Identify 10 companies that match your ideal client profile",
        "Draft your first outreach message and send it to 3 prospects",
      ]}
      marketingChannels={["LinkedIn", "Direct outbound", "Referral network", "Cold email", "Industry communities", "Content marketing", "Partnerships"]}
      otherTemplates={OTHER}
    />
  );
}
