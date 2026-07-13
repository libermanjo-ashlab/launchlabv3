import TemplateDetail from "../TemplateDetail";

const OTHER = [
  { id:"consulting",    label:"Consulting" },
  { id:"local-service", label:"Local Service" },
  { id:"agency",        label:"Agency" },
  { id:"freelance",     label:"Freelance" },
];

export default function TemplateCreator() {
  return (
    <TemplateDetail
      templateId="creator"
      title="Creator Business"
      tagline="Build an audience you own and a sustainable income around your knowledge or perspective."
      intro="A creator business is built on a consistent point of view. Whether you teach a skill, share a perspective, document a process, or entertain a niche audience — the business is built around trust with a specific group of people. EarnedLab helps you find the right niche, pick a monetization model that fits your goals, and build a content strategy that compounds rather than burns you out."
      stats={[
        { label:"Starting capital",       value:"$0–$200" },
        { label:"Time to first revenue",  value:"8–24 weeks" },
        { label:"Weekly time commitment", value:"5–15 hours" },
        { label:"Business model",         value:"Audience-first, then monetization" },
      ]}
      who={[
        "People with a specific area of knowledge or a perspective others want to follow",
        "Writers, podcasters, video creators, or educators who want to own their income",
        "Professionals who want to build a public profile alongside their career",
        "Anyone willing to publish consistently for 6–12 months before expecting significant income",
        "People who want a business that compounds — audience and income growing together over time",
      ]}
      whatEarnedLabDoes={[
        { title:"Niche identification", desc:"Helps you find the overlap between your knowledge, your genuine interest, and where an audience actually exists." },
        { title:"Monetization model selection", desc:"Maps out the right model for your goals and capacity: newsletter, paid community, sponsorships, courses, consulting, or products." },
        { title:"Content strategy", desc:"Builds a channel-specific content strategy with posting cadence, content pillars, and a first-month content calendar." },
        { title:"Platform selection", desc:"Recommends the right platforms for your format and audience based on where your niche is actually concentrated." },
        { title:"Business website", desc:"Generates and deploys a creator site with your positioning, email signup, and links to your active channels." },
        { title:"Launch plan", desc:"Structures a 30-day launch: early audience seeding, first content pieces, and the initial monetization timeline." },
      ]}
      planOutline={[
        { milestone:"Define the niche",          detail:"Identify the specific topic and audience. Narrow enough to be distinctive, broad enough to sustain ongoing content." },
        { milestone:"Choose primary platform",   detail:"Select one primary platform to build on first (newsletter, YouTube, podcast, or social). Add secondary platforms later." },
        { milestone:"Set monetization timeline", detail:"Pick the monetization model and set a realistic timeline. Most creator businesses monetize at 3–12 months." },
        { milestone:"Publish first 5 pieces",    detail:"Create and publish your first 5 pieces of content. This establishes your voice and gives early visitors something to explore." },
        { milestone:"Build email list",          detail:"Launch an email signup early — email subscribers are the most durable part of a creator audience." },
        { milestone:"Seed the audience",         detail:"Share content in 3–5 relevant communities where your target audience is active. Don't just post and hope." },
        { milestone:"First monetization step",   detail:"Make an offer to your audience — a paid community, a product, a consultation slot, or a sponsorship inquiry." },
      ]}
      sampleTasks={[
        "Write a one-paragraph description of your niche and the specific person it's for",
        "List 10 content topics you could publish on this week without research",
        "Choose your primary platform and set up your profile",
        "Review and approve your creator website (email capture is the most important element)",
        "Publish your first piece of content and share it in 2 relevant communities",
        "Set up a simple email list (Resend, ConvertKit, or Mailchimp)",
        "Write 4 more content pieces this week to build your initial library",
      ]}
      marketingChannels={["Newsletter / email list", "LinkedIn", "Twitter / X", "YouTube", "Podcast", "TikTok", "Instagram", "Reddit / niche communities"]}
      otherTemplates={OTHER}
    />
  );
}
