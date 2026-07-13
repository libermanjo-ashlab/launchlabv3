import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "../components";

const BG   = "#0A0A0F";
const CARD = "rgba(255,255,255,0.04)";
const BD   = "rgba(255,255,255,0.08)";
const TXT  = "#fff";
const MUT  = "rgba(255,255,255,0.5)";
const DIM  = "rgba(255,255,255,0.25)";
const FH   = "'DM Sans','Helvetica Neue',sans-serif";
const GRAD = "linear-gradient(135deg,#C855EA,#4558D6)";

const TEMPLATES = {
  consulting: {
    label:       "Consulting Business",
    headline:    "Launch a consulting business from your expertise.",
    description: "Turn what you already know into a client-ready practice — with a defined offer, real pricing, and a launch plan built around your market.",
    steps: [
      "Assess your expertise, ideal client, and market positioning",
      "Structure your offer, scope, and pricing model",
      "Identify your target market and key differentiators",
      "Build a launch plan with milestones and first-client tactics",
      "Generate your initial marketing content and outreach strategy",
    ],
  },
  "local-service": {
    label:       "Local Service Business",
    headline:    "Start a local service business with a clear plan.",
    description: "Build a service business in your area — cleaning, landscaping, repairs, care, or anything in between — with a realistic operating model from day one.",
    steps: [
      "Define your service offering and target neighborhood",
      "Analyze local demand and size up competitors",
      "Build your pricing model and operating workflow",
      "Create a launch plan with your first client acquisition steps",
      "Generate local marketing content and outreach materials",
    ],
  },
  agency: {
    label:       "Agency Business",
    headline:    "Build a focused agency around a service clients need.",
    description: "Start a marketing, design, development, or operations agency with a clear niche, a repeatable offer, and a client acquisition strategy that works.",
    steps: [
      "Define your niche, core service, and pricing structure",
      "Map ideal clients and assess competition in your space",
      "Build your positioning and points of differentiation",
      "Create a go-to-market plan with outreach and referral strategy",
      "Generate initial marketing content and proposal templates",
    ],
  },
  ecommerce: {
    label:       "Ecommerce Business",
    headline:    "Start an online store with a validated product and market.",
    description: "Build an ecommerce business around a real customer problem — with market validation, positioning, and a launch plan before you invest in inventory.",
    steps: [
      "Validate your product concept and target customer",
      "Analyze market demand and map competitors",
      "Define your offer, pricing, and sourcing model",
      "Build a launch timeline with acquisition and content strategy",
      "Generate product descriptions, social content, and email sequences",
    ],
  },
  creator: {
    label:       "Creator Business",
    headline:    "Build a creator business around an audience you can own.",
    description: "Turn your knowledge, perspective, or personality into a sustainable income — with a clear niche, a monetization model, and a content strategy that compounds.",
    steps: [
      "Define your niche, audience, and content angle",
      "Select a monetization model that fits your goals and capacity",
      "Build a content strategy across your highest-leverage channels",
      "Create a launch plan with early audience growth tactics",
      "Generate a content calendar and first-month post briefs",
    ],
  },
  freelance: {
    label:       "Freelance Practice",
    headline:    "Build a freelance practice that attracts the right clients.",
    description: "Structure your freelance work as a real business — with a defined offer, competitive positioning, a clear rate, and a reliable pipeline.",
    steps: [
      "Define your specialty, deliverables, and ideal client profile",
      "Set your pricing model and scope boundaries",
      "Build your market positioning and portfolio strategy",
      "Create a client acquisition plan with outreach and referral tactics",
      "Generate your proposal template, bio, and marketing content",
    ],
  },
  "online-education": {
    label:       "Online Education Business",
    headline:    "Teach what you know and build a real income from it.",
    description: "Turn your expertise into a course, cohort, or community — with market validation, a curriculum outline, and a launch strategy that attracts paying students.",
    steps: [
      "Validate your topic, format, and target student profile",
      "Define your pricing, delivery model, and course structure",
      "Build a pre-launch and launch strategy",
      "Create a marketing plan with content and community tactics",
      "Generate sales page copy, email sequence, and content calendar",
    ],
  },
  saas: {
    label:       "SaaS Business",
    headline:    "Build a software business around a problem worth solving.",
    description: "Go from idea to a validated SaaS concept — with customer research, competitive positioning, a pricing model, and a go-to-market plan before writing a line of code.",
    steps: [
      "Validate the customer problem and willingness to pay",
      "Map competitors and define your differentiation",
      "Structure your pricing tiers and core feature set",
      "Build a go-to-market plan focused on early adopters",
      "Generate your positioning copy and initial marketing content",
    ],
  },
  subscription: {
    label:       "Subscription Business",
    headline:    "Build recurring revenue around something people want every month.",
    description: "Design a subscription business with a clear value proposition, a retention-first operating model, and a launch strategy built for long-term customers.",
    steps: [
      "Define your subscription offer and ideal subscriber",
      "Validate demand and analyze comparable offers",
      "Build your pricing, billing model, and retention strategy",
      "Create a launch and acquisition plan",
      "Generate marketing content and onboarding materials",
    ],
  },
};

const DEFAULT = {
  label:       "",
  headline:    "Start and run your business from one place.",
  description: "EarnedLab helps you discover the right opportunity, validate the market, build a practical plan, create your marketing, and manage everything with coordinated AI agents.",
  steps: [
    "Discover business directions matched to your skills, time, and budget",
    "Validate your idea with market analysis and competitor research",
    "Build a launch plan with real milestones and actionable tasks",
    "Create a marketing strategy and content for your channels",
    "Manage and grow with AI agents working alongside you",
  ],
};

const OTHER_TEMPLATES = [
  { id:"consulting",        label:"Consulting" },
  { id:"local-service",    label:"Local Service" },
  { id:"agency",           label:"Agency" },
  { id:"freelance",        label:"Freelance" },
  { id:"creator",          label:"Creator" },
  { id:"ecommerce",        label:"Ecommerce" },
  { id:"online-education", label:"Online Education" },
  { id:"saas",             label:"SaaS" },
  { id:"subscription",     label:"Subscription" },
];

export default function Start() {
  const navigate        = useNavigate();
  const [params]        = useSearchParams();
  const templateId      = params.get("template") || "";
  const source          = params.get("source")   || "";
  const tmpl            = TEMPLATES[templateId]  || DEFAULT;

  // Persist source attribution for signup page to pick up
  useEffect(() => {
    if (source) sessionStorage.setItem("el_source", source);
    if (templateId) sessionStorage.setItem("el_template", templateId);
  }, [source, templateId]);

  const goSignup = () => navigate("/signup");

  return (
    <div style={{ minHeight:"100vh", background:BG, fontFamily:FH, color:TXT, display:"flex", flexDirection:"column" }}>

      {/* header */}
      <header style={{ padding:"20px 32px", display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${BD}` }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
          <Logo size={24} />
          <span style={{ fontWeight:700, fontSize:15, color:TXT, letterSpacing:"-0.02em" }}>EarnedLab</span>
        </Link>
        {tmpl.label && (
          <>
            <span style={{ color:DIM, fontSize:14 }}>/</span>
            <span style={{ fontSize:13, color:MUT }}>{tmpl.label}</span>
          </>
        )}
      </header>

      {/* main */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 24px 80px" }}>
        <div style={{ maxWidth:580, width:"100%" }}>

          {/* badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(200,85,234,0.12)", border:"1px solid rgba(200,85,234,0.25)", borderRadius:20, padding:"5px 14px", marginBottom:28 }}>
            <Sparkles size={12} color="#C855EA" />
            <span style={{ fontSize:12, fontWeight:600, color:"#C855EA", letterSpacing:"0.03em" }}>
              {tmpl.label ? `${tmpl.label} template` : "AI Business Operating System"}
            </span>
          </div>

          {/* headline */}
          <h1 style={{ fontSize:"clamp(28px,5vw,42px)", fontWeight:800, letterSpacing:"-0.04em", lineHeight:1.1, marginBottom:16 }}>
            {tmpl.headline}
          </h1>

          {/* description */}
          <p style={{ fontSize:16, color:MUT, lineHeight:1.7, marginBottom:36 }}>
            {tmpl.description}
          </p>

          {/* steps */}
          <div style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:14, padding:"24px 28px", marginBottom:32 }}>
            <p style={{ fontSize:11, fontWeight:700, color:DIM, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:18 }}>
              What EarnedLab will do
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {tmpl.steps.map((step, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                  <div style={{ flexShrink:0, marginTop:1 }}>
                    <CheckCircle2 size={17} color="#C855EA" strokeWidth={2} />
                  </div>
                  <span style={{ fontSize:14, color:"rgba(255,255,255,0.8)", lineHeight:1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={goSignup}
            style={{ width:"100%", background:GRAD, color:"#fff", border:"none", borderRadius:12, padding:"16px 24px", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:FH, display:"flex", alignItems:"center", justifyContent:"center", gap:10, letterSpacing:"-0.02em", marginBottom:14 }}
          >
            Start building{tmpl.label ? ` your ${tmpl.label.toLowerCase()}` : " your business"}
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>

          {/* trust signals */}
          <p style={{ textAlign:"center", fontSize:13, color:DIM, marginBottom:40 }}>
            7-day free trial &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Cancel anytime
          </p>

          {/* other templates */}
          {templateId && (
            <div style={{ borderTop:`1px solid ${BD}`, paddingTop:28 }}>
              <p style={{ fontSize:12, color:DIM, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:14 }}>
                Other business templates
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {OTHER_TEMPLATES.filter(t => t.id !== templateId).map(t => (
                  <Link
                    key={t.id}
                    to={`/start?template=${t.id}${source ? `&source=${source}` : ""}`}
                    style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:8, padding:"6px 14px", fontSize:12, color:MUT, textDecoration:"none", fontWeight:500, transition:"border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(200,85,234,0.4)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = BD}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* no template: show all */}
          {!templateId && (
            <div style={{ borderTop:`1px solid ${BD}`, paddingTop:28 }}>
              <p style={{ fontSize:12, color:DIM, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:14 }}>
                Start with a template
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {OTHER_TEMPLATES.map(t => (
                  <Link
                    key={t.id}
                    to={`/start?template=${t.id}${source ? `&source=${source}` : ""}`}
                    style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:8, padding:"6px 14px", fontSize:12, color:MUT, textDecoration:"none", fontWeight:500, transition:"border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(200,85,234,0.4)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = BD}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* footer */}
      <footer style={{ padding:"20px 32px", borderTop:`1px solid ${BD}`, display:"flex", gap:20, alignItems:"center", justifyContent:"center", flexWrap:"wrap" }}>
        {[["Terms", "/terms"], ["Privacy", "/privacy"], ["Disclaimer", "/disclaimer"]].map(([label, href]) => (
          <Link key={href} to={href} style={{ fontSize:12, color:DIM, textDecoration:"none" }}
            onMouseEnter={e => e.currentTarget.style.color = MUT}
            onMouseLeave={e => e.currentTarget.style.color = DIM}
          >
            {label}
          </Link>
        ))}
        <span style={{ fontSize:12, color:DIM }}>© {new Date().getFullYear()} EarnedLab</span>
      </footer>
    </div>
  );
}
