import TemplateDetail from "../TemplateDetail";

const OTHER = [
  { id:"local-service", label:"Local Service" },
  { id:"agency",        label:"Agency" },
  { id:"creator",       label:"Creator" },
  { id:"freelance",     label:"Freelance" },
];

export default function TemplateConsulting() {
  return (
    <TemplateDetail
      templateId="consulting"
      title="Consulting Business"
      tagline="Turn your professional expertise into a structured, client-ready consulting practice."
      intro="A consulting business is built on what you already know. If you have domain expertise — in operations, finance, HR, technology, marketing, strategy, or a specialized industry — EarnedLab converts that knowledge into a defined offer, a target market, and a working plan to land your first paying client."
      stats={[
        { label:"Starting capital",    value:"$0–$500" },
        { label:"Time to first client", value:"3–8 weeks" },
        { label:"Weekly time commitment", value:"10–20 hours" },
        { label:"Business model",      value:"Project-based or retainer" },
      ]}
      who={[
        "Professionals with 5+ years of experience in a specific domain who want to go independent",
        "Former employees with a proven process, framework, or methodology clients would pay for",
        "Subject-matter experts who want to offer advisory services alongside their primary work",
        "People who have already been asked informally for advice in their area of expertise",
        "Anyone with specialized knowledge that solves a business problem organizations face",
      ]}
      whatEarnedLabDoes={[
        { title:"Expertise-to-offer translation", desc:"Converts your background into a specific, scoped consulting offer with clear deliverables and a pricing model." },
        { title:"Market positioning", desc:"Identifies your ideal client profile, the problem you solve, and how to position against alternatives." },
        { title:"Competitive analysis", desc:"Maps the consulting landscape in your niche — who the competition is and what makes you different." },
        { title:"Pricing structure", desc:"Benchmarks rates for your specialty and recommends a rate structure (hourly, project, retainer, or hybrid)." },
        { title:"Business website", desc:"Generates and deploys a professional consulting website with your offer, process, credibility signals, and contact form." },
        { title:"Client acquisition plan", desc:"Builds an outreach strategy for your first clients: referral network activation, LinkedIn positioning, and direct outreach templates." },
      ]}
      planOutline={[
        { milestone:"Define the offer",     detail:"Document your niche, the specific problem you solve, your process, and what clients receive at the end." },
        { milestone:"Set pricing",          detail:"Benchmark your rate against comparable consultants and define your engagement structures." },
        { milestone:"Build credibility",    detail:"Gather 2–3 case studies or testimonials (even informal) and organize them as proof points." },
        { milestone:"Launch the website",   detail:"Review and approve the generated consulting website. Go live with your offer, process, and contact information." },
        { milestone:"Activate referral network", detail:"Reach out to 10–15 professional contacts. Let them know you're consulting independently and what you do." },
        { milestone:"Direct outreach",      detail:"Identify 5–10 target clients and send personalized outreach using EarnedLab's generated templates." },
        { milestone:"First discovery call", detail:"Run a scoped discovery conversation with the structured template EarnedLab provides." },
      ]}
      sampleTasks={[
        "Draft your consulting offer statement (one sentence, no jargon)",
        "List 3 specific outcomes a client achieves by working with you",
        "Identify 10 former colleagues or managers who know your work",
        "Review and approve your consulting website before it goes live",
        "Write 3 LinkedIn posts that demonstrate expertise in your niche",
        "Send personalized outreach to 5 target prospects this week",
      ]}
      marketingChannels={["LinkedIn", "Referral network", "Direct outreach", "Email newsletter", "Speaking or guest appearances", "Thought leadership content"]}
      otherTemplates={OTHER}
    />
  );
}
