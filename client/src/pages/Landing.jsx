import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { C, FH, FB, btn, Logo } from "../components";
import { Check } from "lucide-react";

const dark = "#0A0A0F";
const surface = "rgba(255,255,255,0.04)";
const border  = "rgba(255,255,255,0.08)";
const muted   = "rgba(255,255,255,0.55)";
const subtle  = "rgba(255,255,255,0.3)";

const SUPPORT = "support@earnedlab.com";

// ── Nav ────────────────────────────────────────────────────────────────────
function Nav({ onCta }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", background:"rgba(10,10,15,0.85)", borderBottom:`1px solid ${border}`, height:58, display:"flex", alignItems:"center", padding:"0 28px" }}>
      <div style={{ maxWidth:1080, margin:"0 auto", width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Logo size={20}/>
          <span style={{ fontFamily:FH, fontWeight:700, fontSize:14, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.02em" }}>EARNEDLAB</span>
        </div>

        {/* Desktop nav links */}
        <div className="nav-desktop" style={{ display:"flex", alignItems:"center", gap:6 }}>
          <a href="#how-it-works" style={{ fontSize:13, color:muted, textDecoration:"none", padding:"6px 12px", fontFamily:FB }}>How it works</a>
          <a href="#pricing" style={{ fontSize:13, color:muted, textDecoration:"none", padding:"6px 12px", fontFamily:FB }}>Pricing</a>
          <a href="#faq" style={{ fontSize:13, color:muted, textDecoration:"none", padding:"6px 12px", fontFamily:FB, marginRight:8 }}>FAQ</a>
          <Link to="/signup" style={{ fontSize:13, color:"rgba(255,255,255,0.7)", textDecoration:"none", padding:"6px 16px", fontFamily:FB, fontWeight:500, border:`1px solid ${border}`, borderRadius:8 }}>Sign in</Link>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",13), padding:"8px 18px", borderRadius:8, letterSpacing:"-0.01em" }}>Start free →</button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-mobile"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          style={{ display:"none", background:"none", border:"none", cursor:"pointer", padding:6, color:"rgba(255,255,255,0.75)" }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen
              ? <><line x1="4" y1="4" x2="18" y2="18"/><line x1="18" y1="4" x2="4" y2="18"/></>
              : <><line x1="3" y1="7" x2="19" y2="7"/><line x1="3" y1="11" x2="19" y2="11"/><line x1="3" y1="15" x2="19" y2="15"/></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{ position:"absolute", top:58, left:0, right:0, background:"rgba(10,10,15,0.97)", borderBottom:`1px solid ${border}`, display:"flex", flexDirection:"column", padding:"8px 0 16px", zIndex:51 }}>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)} style={{ fontSize:15, color:muted, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>How it works</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)} style={{ fontSize:15, color:muted, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>Pricing</a>
          <a href="#faq" onClick={() => setMenuOpen(false)} style={{ fontSize:15, color:muted, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>FAQ</a>
          <div style={{ height:1, background:border, margin:"8px 28px" }} />
          <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ fontSize:15, color:"rgba(255,255,255,0.7)", textDecoration:"none", padding:"12px 28px", fontFamily:FB, fontWeight:500 }}>Sign in</Link>
          <div style={{ padding:"8px 28px 0" }}>
            <button onClick={() => { setMenuOpen(false); onCta(); }} style={{ ...btn(C.grad,"#fff",14), width:"100%", padding:"12px", borderRadius:10, letterSpacing:"-0.01em" }}>Start free →</button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .nav-desktop { display: none !important; }
          .nav-mobile  { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero({ onCta }) {
  return (
    <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"100px 24px 80px", position:"relative", overflow:"hidden", textAlign:"center" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 50% at 50% -10%, #7C3AED22, transparent)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 40% at 80% 60%, #0891B215, transparent)", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:680 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:surface, border:`1px solid ${border}`, borderRadius:24, padding:"6px 14px", marginBottom:32, backdropFilter:"blur(8px)" }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ADE80", boxShadow:"0 0 8px #4ADE8088", flexShrink:0 }} />
          <span style={{ fontSize:12, color:muted, fontFamily:FB, fontWeight:500, letterSpacing:"0.02em" }}>Automated sidehustle platform — now in early access</span>
        </div>

        <h1 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(42px,6vw,68px)", color:"#fff", lineHeight:1.05, letterSpacing:"-0.045em", margin:"0 0 20px" }}>
          Your side business,<br />
          <span style={{ background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>built in 30 minutes.</span>
        </h1>

        <p style={{ fontSize:"clamp(15px,2vw,18px)", color:muted, lineHeight:1.75, maxWidth:520, margin:"0 auto 40px", fontFamily:FB }}>
          EarnedLab's agentic platform finds the right business for your situation, builds everything automatically, and keeps it growing — while you focus on what matters.
        </p>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",16), padding:"15px 36px", borderRadius:12, letterSpacing:"-0.02em", boxShadow:"0 8px 32px rgba(124,58,237,0.35)" }}>
            Start your free trial →
          </button>
          <span style={{ fontSize:13, color:subtle, fontFamily:FB }}>7 days free · No credit card required · Cancel anytime</span>
        </div>

        <div style={{ display:"flex", justifyContent:"center", gap:"clamp(20px,5vw,48px)", marginTop:56, flexWrap:"wrap" }}>
          {[["30 min","to launch"],["7 days","to first dollar"],["$0","to get started"]].map(([big,small]) => (
            <div key={small}>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:26, color:"#fff", letterSpacing:"-0.04em" }}>{big}</div>
              <div style={{ fontSize:11, color:subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600, marginTop:3, fontFamily:FB }}>{small}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n:"01", title:"Tell us about yourself",
      body:"Answer a few questions about your skills, available time, budget, and goals. Takes about 5 minutes.",
      tag:"Discovery",
    },
    {
      n:"02", title:"Smart matching finds your best business",
      body:"We analyze hundreds of options and match you with the business type most likely to succeed given your specific situation.",
      tag:"Matching",
    },
    {
      n:"03", title:"Launch — and let it run",
      body:"Your marketing and management agents handle content, website updates, and growth optimization automatically. You watch the results.",
      tag:"Autopilot",
    },
  ];

  return (
    <section id="how-it-works" style={{ padding:"96px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:960, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:64 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.primary, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:14 }}>HOW IT WORKS</div>
          <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(28px,4vw,40px)", color:"#fff", letterSpacing:"-0.04em", margin:0 }}>From zero to launched in one afternoon.</h2>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:24 }}>
          {steps.map((s) => (
            <div key={s.n} style={{ background:surface, border:`1px solid ${border}`, borderRadius:16, padding:"28px 24px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:13, color:C.primary, letterSpacing:"0.04em" }}>{s.n}</div>
                <div style={{ height:1, flex:1, background:`linear-gradient(to right, ${C.primary}60, transparent)` }} />
                <span style={{ fontSize:10, fontWeight:700, color:C.primary, background:C.primary+"18", padding:"3px 10px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FB }}>{s.tag}</span>
              </div>
              <h3 style={{ fontFamily:FH, fontWeight:600, fontSize:18, color:"#fff", letterSpacing:"-0.03em", marginBottom:10 }}>{s.title}</h3>
              <p style={{ fontSize:13, color:muted, lineHeight:1.7 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Who is this for ───────────────────────────────────────────────────────
function WhoIsItFor() {
  const profiles = [
    { label:"First-time entrepreneurs", desc:"Never started a business before? EarnedLab guides you from zero — no jargon, no prior knowledge needed." },
    { label:"Side hustlers with a day job", desc:"Limited time? The agents run in the background. You check in when it suits you." },
    { label:"Freelancers going independent", desc:"Turn your existing skills into a real business with proper branding, a website, and a growth plan." },
    { label:"Parents & career-switchers", desc:"Looking for flexible income that works around your schedule? EarnedLab matches you to ideas that fit your reality." },
  ];

  return (
    <section style={{ padding:"96px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:960, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:64 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#4ADE80", textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:14 }}>WHO IT'S FOR</div>
          <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(28px,4vw,40px)", color:"#fff", letterSpacing:"-0.04em", margin:"0 0 14px" }}>Built for people starting from scratch.</h2>
          <p style={{ fontSize:15, color:muted, fontFamily:FB, maxWidth:520, margin:"0 auto" }}>You don't need a business degree, a network, or technical skills. You need an idea and 30 minutes.</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:20 }}>
          {profiles.map((p) => (
            <div key={p.label} style={{ background:surface, border:`1px solid ${border}`, borderRadius:16, padding:"24px 20px" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#4ADE80", marginBottom:16, boxShadow:"0 0 10px #4ADE8066" }} />
              <h3 style={{ fontFamily:FH, fontWeight:600, fontSize:16, color:"#fff", letterSpacing:"-0.02em", marginBottom:10 }}>{p.label}</h3>
              <p style={{ fontSize:13, color:muted, lineHeight:1.7, margin:0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Agents ────────────────────────────────────────────────────────────────
function Agents() {
  const agents = [
    {
      color: C.primary,
      name: "Marketing Agent",
      tagline: "Finds what's holding you back, tells you exactly what to fix.",
      capabilities: [
        "Monitors your revenue, leads, and social engagement",
        "Spots the specific metric that's limiting growth",
        "Recommends one clear, actionable change",
        "Tracks whether the change worked",
      ],
      example: { label:"Observation", text:"Instagram engagement is 2.3× the industry average, but only 8% of profile visitors click through to your website." },
    },
    {
      color: C.accent,
      name: "Management Agent",
      tagline: "Takes the recommendation and implements it — automatically.",
      capabilities: [
        "Rewrites your website copy and layout",
        "Deploys updates to your live site in under 30 seconds",
        "Logs every change it makes and why",
        "On Autopilot: runs both agents on a schedule, no input needed",
      ],
      example: { label:"Action taken", text:"Updated homepage hero with prominent booking CTA and deployed to yourbusiness.netlify.app", live:true },
    },
  ];

  return (
    <section style={{ padding:"96px 24px", background:"rgba(255,255,255,0.015)", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:1000, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:64 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:14 }}>THE AGENTS</div>
          <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(28px,4vw,40px)", color:"#fff", letterSpacing:"-0.04em", margin:0 }}>Two agents working together, 24/7.</h2>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:24 }}>
          {agents.map((a) => (
            <div key={a.name} style={{ background:surface, border:`1px solid ${a.color}25`, borderRadius:20, padding:"32px 28px" }}>
              <span style={{ fontSize:11, fontWeight:700, color:a.color, background:a.color+"18", padding:"4px 12px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FB }}>{a.name}</span>
              <h3 style={{ fontFamily:FH, fontWeight:600, fontSize:20, color:"#fff", letterSpacing:"-0.03em", margin:"16px 0 8px", lineHeight:1.3 }}>{a.tagline}</h3>
              <ul style={{ margin:"16px 0 24px", padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:10 }}>
                {a.capabilities.map((c) => (
                  <li key={c} style={{ display:"flex", alignItems:"flex-start", gap:10, fontSize:13, color:muted, lineHeight:1.6 }}>
                    <span style={{ color:a.color, fontWeight:700, flexShrink:0, marginTop:2 }}>+</span>{c}
                  </li>
                ))}
              </ul>
              <div style={{ background:`${a.color}10`, border:`1px solid ${a.color}20`, borderRadius:10, padding:"12px 14px" }}>
                <div style={{ fontSize:10, color:a.color, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6, fontFamily:FB }}>{a.example.label}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.6, fontFamily:FB, display:"flex", alignItems:"flex-start", gap:8 }}>
                  {a.example.live && <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ADE80", flexShrink:0, marginTop:4, boxShadow:"0 0 6px #4ADE8088" }} />}
                  {a.example.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────
function Pricing({ onCta }) {
  const tiers = [
    {
      id:"starter", name:"Starter", price:39, color:"#6366F1",
      tagline:"Insights, reports, and manual tracking.",
      features:["Marketing insights & analysis","Revenue & lead tracking","Business planning tools","Email support"],
      cta:"Start free trial",
    },
    {
      id:"pro", name:"Pro", price:89, color:C.primary, popular:true,
      tagline:"Agents act on your request.",
      features:["Everything in Starter","Management agent implements changes for you","Live website updates on demand","Marketing + Management working together","Priority support"],
      cta:"Start free trial",
    },
    {
      id:"pro_autopilot", name:"Pro Autopilot", price:199, color:"#DB2777",
      tagline:"Fully autonomous — just watch it run.",
      features:["Everything in Pro","Agents run automatically on a schedule","No manual input required","Dedicated support"],
      cta:"Start free trial",
    },
  ];

  return (
    <section id="pricing" style={{ padding:"96px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:1000, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:64 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#F59E0B", textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:14 }}>PRICING</div>
          <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(28px,4vw,40px)", color:"#fff", letterSpacing:"-0.04em", margin:"0 0 14px" }}>Start free. Upgrade when you're ready.</h2>
          <p style={{ fontSize:15, color:muted, fontFamily:FB }}>7-day free trial on all plans. No credit card required to start.</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20, alignItems:"start" }}>
          {tiers.map((t) => (
            <div key={t.id} style={{ background:surface, border:`1.5px solid ${t.popular ? t.color : border}`, borderRadius:20, padding:"28px 24px", position:"relative" }}>
              {t.popular && (
                <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:t.color, color:"#fff", fontSize:10, fontWeight:700, padding:"4px 14px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>Most popular</div>
              )}
              <div style={{ fontSize:11, fontWeight:700, color:t.color, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:10 }}>{t.name}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:8 }}>
                <span style={{ fontFamily:FH, fontWeight:700, fontSize:36, color:"#fff", letterSpacing:"-0.04em" }}>${t.price}</span>
                <span style={{ fontSize:13, color:subtle }}>/month</span>
              </div>
              <p style={{ fontSize:13, color:muted, lineHeight:1.6, marginBottom:24, fontFamily:FB }}>{t.tagline}</p>
              <ul style={{ margin:"0 0 28px", padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:10 }}>
                {t.features.map((f) => (
                  <li key={f} style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize:13, color:muted, lineHeight:1.5 }}>
                    <Check size={14} color={t.color} strokeWidth={2.5} style={{ flexShrink:0, marginTop:2 }} aria-hidden="true" />{f}
                  </li>
                ))}
              </ul>
              <button onClick={onCta} style={{ ...btn(t.popular ? t.color : "transparent","#fff",13), width:"100%", padding:"12px", border:t.popular?"none":`1px solid ${border}`, borderRadius:10 }}>
                {t.cta}
              </button>
            </div>
          ))}
        </div>

        <p style={{ textAlign:"center", fontSize:13, color:subtle, marginTop:32, fontFamily:FB }}>
          Questions about which plan is right for you? Email us at{" "}
          <a href={`mailto:${SUPPORT}`} style={{ color:C.primary, textDecoration:"none" }}>{SUPPORT}</a>
        </p>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────
function FAQ() {
  const faqs = [
    { q:"I'm a complete beginner — is EarnedLab right for me?", a:"Yes. EarnedLab is designed for people who have never started a business before. You don't need any technical skills, marketing knowledge, or prior experience. The platform guides you step by step and the AI agents handle the complex parts automatically." },
    { q:"How long does setup actually take?", a:"Most users finish the discovery questionnaire in about 5 minutes and have a live business in under 30. EarnedLab handles the research, idea selection, and initial setup automatically." },
    { q:"What type of side businesses can I start?", a:"Service businesses work best — freelancing, consulting, coaching, cleaning, photography, tutoring, bookkeeping, handyman services, and similar local or online service businesses. E-commerce and physical products are not currently supported." },
    { q:"How is EarnedLab different from just asking ChatGPT?", a:"ChatGPT gives you advice. EarnedLab actually builds and runs things. It creates your website, deploys it live, tracks your revenue and leads, generates marketing content, and implements changes automatically. It's an active platform, not a conversation." },
    { q:"How much money do I need to start?", a:"You can start for $0 in out-of-pocket costs beyond the EarnedLab subscription. EarnedLab builds your website on a free hosting tier. Most service businesses don't require inventory or equipment — just your time and skills." },
    { q:"Do I need any technical skills?", a:"None at all. EarnedLab handles everything from website creation to deployment. If you can send an email, you can use this." },
    { q:"What happens at the end of the trial?", a:"Your account moves to a read-only view. Your data and business are saved. Upgrade any time to resume the agents. We'll email you before the trial ends." },
    { q:"Can I cancel anytime?", a:"Yes, with one click from your billing settings. No calls, no forms, no questions. Your subscription ends at the current billing period." },
  ];

  return (
    <section id="faq" style={{ padding:"96px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:680, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:56 }}>
          <div style={{ fontSize:11, fontWeight:700, color:muted, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:14 }}>QUESTIONS</div>
          <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(26px,4vw,36px)", color:"#fff", letterSpacing:"-0.04em", margin:0 }}>Everything you need to know.</h2>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {faqs.map((f, i) => (
            <details key={i} style={{ borderTop:`1px solid ${border}`, padding:"22px 0", cursor:"pointer" }}>
              <summary style={{ fontFamily:FH, fontWeight:600, fontSize:16, color:"#fff", letterSpacing:"-0.02em", listStyle:"none", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, userSelect:"none" }}>
                {f.q}
                <span style={{ color:muted, fontSize:18, flexShrink:0 }}>+</span>
              </summary>
              <p style={{ fontSize:14, color:muted, lineHeight:1.75, margin:"14px 0 0", fontFamily:FB }}>{f.a}</p>
            </details>
          ))}
          <div style={{ borderTop:`1px solid ${border}` }} />
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────
function CTABanner({ onCta }) {
  return (
    <section style={{ padding:"96px 24px", background:"rgba(124,58,237,0.06)", borderTop:`1px solid ${border}`, borderBottom:`1px solid ${border}` }}>
      <div style={{ maxWidth:560, margin:"0 auto", textAlign:"center" }}>
        <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(28px,4vw,42px)", color:"#fff", letterSpacing:"-0.045em", margin:"0 0 16px", lineHeight:1.1 }}>
          Ready to start?
        </h2>
        <p style={{ fontSize:16, color:muted, lineHeight:1.7, marginBottom:36, fontFamily:FB }}>
          Join founders who launched their business this week. The first 7 days are completely free.
        </p>
        <button onClick={onCta} style={{ ...btn(C.grad,"#fff",16), padding:"15px 40px", borderRadius:12, letterSpacing:"-0.02em", boxShadow:"0 8px 32px rgba(124,58,237,0.3)" }}>
          Start your free trial →
        </button>
        <p style={{ fontSize:13, color:subtle, marginTop:16, fontFamily:FB }}>
          Questions? <a href={`mailto:${SUPPORT}`} style={{ color:muted, textDecoration:"underline" }}>{SUPPORT}</a>
        </p>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding:"36px 28px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:1080, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Logo size={18}/>
          <span style={{ fontFamily:FH, fontWeight:700, fontSize:13, color:subtle, letterSpacing:"-0.02em" }}>EarnedLab</span>
          <span style={{ fontSize:12, color:subtle, fontFamily:FB, marginLeft:8 }}>© {new Date().getFullYear()}</span>
        </div>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap", alignItems:"center" }}>
          {[["Terms","/terms"],["Privacy","/privacy"],["Disclaimer","/disclaimer"]].map(([l,p]) => (
            <Link key={p} to={p} style={{ fontSize:12, color:subtle, textDecoration:"none", fontFamily:FB }}>{l}</Link>
          ))}
          <a href={`mailto:${SUPPORT}`} style={{ fontSize:12, color:muted, textDecoration:"none", fontFamily:FB }}>{SUPPORT}</a>
        </div>
      </div>
    </footer>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const goSignup = () => navigate("/signup");

  return (
    <div style={{ background:dark, color:"#fff", fontFamily:FB, minHeight:"100vh" }}>
      <Nav onCta={goSignup} />
      <Hero onCta={goSignup} />
      <HowItWorks />
      <WhoIsItFor />
      <Agents />
      <Pricing onCta={goSignup} />
      <FAQ />
      <CTABanner onCta={goSignup} />
      <Footer />
    </div>
  );
}
