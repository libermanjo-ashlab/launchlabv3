import TemplateDetail from "../TemplateDetail";

const OTHER = [
  { id:"consulting", label:"Consulting" },
  { id:"agency",     label:"Agency" },
  { id:"creator",    label:"Creator" },
  { id:"freelance",  label:"Freelance" },
];

export default function TemplateLocalService() {
  return (
    <TemplateDetail
      templateId="local-service"
      title="Local Service Business"
      tagline="Start a hands-on service business in your area — with a clear plan, realistic pricing, and a path to your first job."
      intro="Local service businesses are among the fastest paths to real revenue. Cleaning, landscaping, lawn care, handyman, pet services, delivery, moving help, pressure washing, mobile detailing — if people in your area need it done and you can do it, EarnedLab builds the business around it. No inventory, no storefront required."
      stats={[
        { label:"Starting capital",     value:"$0–$1,000" },
        { label:"Time to first job",    value:"1–4 weeks" },
        { label:"Weekly time commitment", value:"Flexible — scales with demand" },
        { label:"Business model",       value:"Per-job or recurring service" },
      ]}
      who={[
        "People comfortable with physical or hands-on work who want to run their own schedule",
        "Existing tradespeople, handypeople, or service workers going independent",
        "Anyone who wants to start earning quickly without a large upfront investment",
        "People targeting a specific neighborhood, zip code, or city",
        "Anyone who wants a business that scales by adding hours or hiring help later",
      ]}
      whatEarnedLabDoes={[
        { title:"Local market analysis", desc:"Maps demand, competitor density, and pricing benchmarks in your specific area — not generic national data." },
        { title:"Service and pricing model", desc:"Structures your services (one-time vs. recurring), defines what's included, and sets your rates against local competition." },
        { title:"Operational setup guide", desc:"Covers the tools, supplies, scheduling approach, and basic workflows you need before taking your first job." },
        { title:"Google Business Profile strategy", desc:"Sets up your local presence strategy — the single most important channel for local service discovery." },
        { title:"Business website", desc:"Generates and deploys a local service website with your services, pricing overview, service area, and booking contact." },
        { title:"First-client acquisition plan", desc:"Builds a concrete plan for getting your first 5 jobs: neighborhood targeting, local outreach, and referral activation." },
      ]}
      planOutline={[
        { milestone:"Define services and pricing",  detail:"Pick your core service (or 2–3 related services), set your rate structure, and decide on your service area." },
        { milestone:"Gather supplies and tools",    detail:"List the minimum equipment needed to start. EarnedLab identifies what you already have and what needs to be purchased." },
        { milestone:"Launch your website",          detail:"Review and approve your local service website. Include your service area, services, and how to book." },
        { milestone:"Set up Google Business",       detail:"Claim and set up your Google Business Profile. This is how local customers find you." },
        { milestone:"First-client outreach",        detail:"Use neighborhood apps, local Facebook groups, and direct-to-door flyers in your target area." },
        { milestone:"First 3 jobs",                 detail:"Complete your first jobs, collect feedback, and ask for a Google review from each satisfied customer." },
        { milestone:"Build recurring base",         detail:"Identify which clients want regular service. Convert one-time jobs to monthly or weekly recurring arrangements." },
      ]}
      sampleTasks={[
        "List every service you can offer and which you want to lead with",
        "Research 3 local competitors — note their prices and what they don't offer",
        "Define your service area (radius or specific neighborhoods)",
        "Review and go live with your local service website",
        "Claim your Google Business Profile and fill in all details",
        "Post in 2 local Facebook groups or neighborhood apps this week",
        "Ask 10 people in your network if they know anyone who needs your service",
      ]}
      marketingChannels={["Google Business Profile", "Nextdoor", "Facebook local groups", "Word of mouth", "Door hangers / flyers", "Yelp", "Neighborhood apps"]}
      otherTemplates={OTHER}
    />
  );
}
