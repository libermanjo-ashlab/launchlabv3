import TemplateDetail from "../TemplateDetail";

const OTHER = [
  { id:"consulting",    label:"Consulting" },
  { id:"local-service", label:"Local Service" },
  { id:"agency",        label:"Agency" },
  { id:"creator",       label:"Creator" },
];

export default function TemplateFreelance() {
  return (
    <TemplateDetail
      templateId="freelance"
      title="Freelance Practice"
      tagline="Structure your skills as a real business and build a reliable pipeline of paying clients."
      intro="Freelancing works when you treat it like a business. That means a defined offer, a clear rate, a way to find clients consistently, and a system that doesn't require you to start from zero every time a project ends. EarnedLab structures all of that from the beginning — so your freelance practice runs like a business from your first client, not your fifth."
      stats={[
        { label:"Starting capital",       value:"$0–$100" },
        { label:"Time to first client",   value:"1–6 weeks" },
        { label:"Weekly time commitment", value:"As few as 5 hours" },
        { label:"Business model",         value:"Project-based or retainer" },
      ]}
      who={[
        "Writers, designers, developers, marketers, editors, or bookkeepers with a portable skill",
        "Professionals leaving traditional employment who want to work on their own terms",
        "Side hustlers who want to earn from their skills outside their primary job",
        "Anyone who wants to get their first paying client quickly with low startup cost",
        "People who want flexibility over income maximization in the short term",
      ]}
      whatEarnedLabDoes={[
        { title:"Offer definition", desc:"Converts your skill into a specific, scoped freelance offer: what you do, what's included, and what the client receives." },
        { title:"Rate setting", desc:"Benchmarks your rate against the market for your skill and experience level. Recommends hourly, project, and retainer structures." },
        { title:"Market positioning", desc:"Identifies the ideal client for your specific skill and experience, and how to position against competing freelancers." },
        { title:"Portfolio strategy", desc:"Outlines the minimum portfolio you need to start — including how to handle the common 'no experience' problem." },
        { title:"Business website", desc:"Generates and deploys a professional freelance site with your services, rates (or rate range), samples, and contact form." },
        { title:"Pipeline building plan", desc:"Creates a multi-channel client acquisition plan: job boards, direct outreach, referrals, and passive inbound through content." },
      ]}
      planOutline={[
        { milestone:"Define the offer",          detail:"Write exactly what you do, what's included, the turnaround time, and the price (or price range)." },
        { milestone:"Set your rate",             detail:"Research comparable freelancers and set a rate you can defend. Don't start too low — it's harder to raise rates later." },
        { milestone:"Gather portfolio samples",  detail:"Collect 3–5 examples of relevant work. Use personal or spec projects if you don't have paid work yet." },
        { milestone:"Launch the website",        detail:"Review and approve your freelance site. A live URL with your offer and samples is your most important first asset." },
        { milestone:"Activate referral network", detail:"Tell your professional contacts you're available. Most first clients come from someone who already knows your work." },
        { milestone:"Apply to 3 platforms",      detail:"Identify the 2–3 job boards or platforms most relevant to your skill and submit strong profiles." },
        { milestone:"Direct outreach",           detail:"Identify 10 businesses that need your skill and send a targeted, personalized pitch." },
        { milestone:"First project",             detail:"Deliver beyond expectations. Ask for a testimonial and a referral after the project ends." },
      ]}
      sampleTasks={[
        "Write your one-sentence offer (skill + client + outcome)",
        "List every skill you could sell — then pick the one to lead with",
        "Research 5 freelancers with your skill — note their rates and positioning",
        "Gather 3 portfolio samples (spec work is fine if you don't have paid work)",
        "Review and go live with your freelance website",
        "Message 5 people in your network who might know someone who needs your service",
        "Create profiles on the top 2 platforms for your skill",
      ]}
      marketingChannels={["LinkedIn", "Referral network", "Direct outreach", "Upwork / Fiverr / relevant job boards", "Twitter / X", "Niche communities", "Content marketing"]}
      otherTemplates={OTHER}
    />
  );
}
