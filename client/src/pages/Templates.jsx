import { Link } from "react-router-dom";
import ContentLayout from "../components/ContentLayout";
import { ArrowRight } from "lucide-react";

const MUT  = "rgba(255,255,255,0.5)";
const DIM  = "rgba(255,255,255,0.25)";
const BD   = "rgba(255,255,255,0.08)";
const CARD = "rgba(255,255,255,0.04)";
const GRAD = "linear-gradient(135deg,#C855EA,#4558D6)";

const TEMPLATES = [
  {
    id:       "consulting",
    title:    "Consulting Business",
    tagline:  "Turn your expertise into a client-ready practice.",
    desc:     "For professionals who want to offer their skills as a service. EarnedLab structures your offer, pricing, and market positioning — then builds your site and marketing around it.",
    good_for: ["Former employees going independent", "Specialists with deep domain knowledge", "People with a proven process others would pay for"],
    time:     "Part-time (10–20 hrs/week)",
    capital:  "Low ($0–$500 to start)",
    revenue:  "3–8 weeks to first client",
  },
  {
    id:       "local-service",
    title:    "Local Service Business",
    tagline:  "Build a service business in your area from day one.",
    desc:     "For hands-on service providers — cleaning, landscaping, repairs, care, delivery, and similar. EarnedLab maps the local market, sets your pricing, and handles your local marketing.",
    good_for: ["People comfortable doing physical work", "Existing handypeople, cleaners, or tradespeople going independent", "Anyone targeting a specific neighborhood or city"],
    time:     "Part-time or full-time",
    capital:  "Low ($0–$1,000 depending on equipment)",
    revenue:  "1–4 weeks to first job",
  },
  {
    id:       "agency",
    title:    "Agency Business",
    tagline:  "Build a focused agency around a service clients need.",
    desc:     "For marketing, design, development, ops, or creative professionals who want to package their skills as a repeatable agency service. EarnedLab defines your niche, your offer structure, and your client acquisition strategy.",
    good_for: ["Freelancers who want to productize their service", "People with skills that can scale beyond one client at a time", "Professionals who can subcontract or partner with others"],
    time:     "Part-time to start, grows with clients",
    capital:  "Low to medium ($0–$2,000)",
    revenue:  "4–10 weeks to first paying client",
  },
  {
    id:       "creator",
    title:    "Creator Business",
    tagline:  "Build an audience you own and a business around it.",
    desc:     "For writers, educators, commentators, and creatives who want to monetize their knowledge or perspective. EarnedLab helps you define your niche, pick a monetization model, and build a content strategy that compounds over time.",
    good_for: ["People with a specific viewpoint or area of knowledge", "Writers, podcasters, video creators, or educators", "Anyone building a long-term audience-first income"],
    time:     "Part-time (5–15 hrs/week to start)",
    capital:  "Very low ($0–$200)",
    revenue:  "8–24 weeks to first monetization",
  },
  {
    id:       "freelance",
    title:    "Freelance Practice",
    tagline:  "Build a freelance practice that attracts the right clients.",
    desc:     "For skilled individuals — writers, designers, developers, marketers, bookkeepers — who want to work independently. EarnedLab structures your offer, positions you against competitors, and builds your client pipeline strategy.",
    good_for: ["Professionals with a portable, in-demand skill", "People leaving traditional employment", "Side hustlers who want their first paying client quickly"],
    time:     "Part-time (as few as 5 hrs/week)",
    capital:  "Very low ($0–$100)",
    revenue:  "1–6 weeks to first client",
  },
];

export default function Templates() {
  return (
    <ContentLayout
      title="Business templates"
      description="Five proven business models — with detailed plans, market context, and everything set up for you to launch."
    >
      <p style={{ fontSize:16, color:MUT, lineHeight:1.8, maxWidth:640, marginBottom:48 }}>
        Each template is a complete starting point for a specific type of business. EarnedLab uses the template to configure your discovery, validation, plan, website, and marketing — so you're not starting from a blank slate.
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
        {TEMPLATES.map(t => (
          <div key={t.id} style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:16, padding:"28px 28px", display:"grid", gridTemplateColumns:"1fr auto", gap:24, alignItems:"start" }} className="tmpl-row">
            <div style={{ flex:1 }}>
              <h2 style={{ fontSize:"clamp(18px,2.5vw,24px)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:6 }}>{t.title}</h2>
              <p style={{ fontSize:14, fontWeight:600, color:"rgba(200,85,234,0.9)", marginBottom:12 }}>{t.tagline}</p>
              <p style={{ fontSize:14, color:MUT, lineHeight:1.7, marginBottom:20, maxWidth:560 }}>{t.desc}</p>

              <div style={{ display:"flex", flexWrap:"wrap", gap:24, marginBottom:20 }}>
                {[["Time", t.time], ["Capital", t.capital], ["First revenue", t.revenue]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize:11, fontWeight:700, color:DIM, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{k}</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", fontWeight:500 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {t.good_for.map(g => (
                  <span key={g} style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${BD}`, borderRadius:6, padding:"4px 10px", fontSize:12, color:MUT }}>
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:10, flexShrink:0 }}>
              <Link
                to={`/templates/${t.id}`}
                style={{ display:"flex", alignItems:"center", gap:6, background:CARD, border:`1px solid ${BD}`, borderRadius:10, padding:"10px 18px", fontSize:13, color:"rgba(255,255,255,0.8)", textDecoration:"none", fontWeight:600, whiteSpace:"nowrap" }}
              >
                Learn more
              </Link>
              <Link
                to={`/start?template=${t.id}`}
                style={{ display:"flex", alignItems:"center", gap:6, background:GRAD, borderRadius:10, padding:"10px 18px", fontSize:13, color:"#fff", textDecoration:"none", fontWeight:600, whiteSpace:"nowrap" }}
              >
                Start with this <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:48, padding:"28px", background:"rgba(200,85,234,0.05)", border:"1px solid rgba(200,85,234,0.15)", borderRadius:14, textAlign:"center" }}>
        <p style={{ fontSize:15, color:MUT, lineHeight:1.7, marginBottom:20 }}>
          Not sure which template fits? Answer a few questions and EarnedLab will match you to the right business type automatically.
        </p>
        <Link to="/signup" style={{ display:"inline-flex", alignItems:"center", gap:8, background:GRAD, color:"#fff", textDecoration:"none", padding:"12px 28px", borderRadius:10, fontSize:14, fontWeight:700 }}>
          Start free — find your business type →
        </Link>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .tmpl-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </ContentLayout>
  );
}
