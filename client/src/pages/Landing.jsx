import { useNavigate, Link } from "react-router-dom";
import { C, FH, FB, btn, Logo } from "../components";

const dark = "#0A0A0F";
const surface = "rgba(255,255,255,0.04)";
const border  = "rgba(255,255,255,0.08)";
const muted   = "rgba(255,255,255,0.55)";
const subtle  = "rgba(255,255,255,0.3)";

const SUPPORT = "support@earnedlab.com";

// ── Nav ────────────────────────────────────────────────────────────────────
function Nav({ onCta }) {
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", background:"rgba(10,10,15,0.85)", borderBottom:`1px solid ${border}`, height:58, display:"flex", alignItems:"center", padding:"0 28px" }}>
      <div style={{ maxWidth:1080, margin:"0 auto", width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Logo size={20}/>
          <span style={{ fontFamily:FH, fontWeight:700, fontSize:14, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.02em" }}>EARNEDLAB</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <a href="#how-it-works" style={{ fontSize:13, color:muted, textDecoration:"none", padding:"6px 12px", fontFamily:FB }}>How it works</a>
          <a href="#pricing" style={{ fontSize:13, color:muted, textDecoration:"none", padding:"6px 12px", fontFamily:FB }}>Pricing</a>
          <a href="#faq" style={{ fontSize:13, color:muted, textDecoration:"none", padding:"6px 12px", fontFamily:FB, marginRight:8 }}>FAQ</a>
          <Link to="/signup" style={{ fontSize:13, color:"rgba(255,255,255,0.7)", textDecoration:"none", padding:"6px 16px", fontFamily:FB, fontWeight:500, border:`1px solid ${border}`, borderRadius:8 }}>Sign in</Link>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",13), padding:"8px 18px", borderRadius:8, letterSpacing:"-0.01em" }}>Start free →</button>
        </div>
      </div>
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
          <span style={{ fontSize:12, color:muted, fontFamily:FB, fontWeight:500, letterSpacing:"0.02em" }}>AI-powered sidehustle platform — now in early access</span>
        </div>

        <h1 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(42px,6vw,68px)", color:"#fff", lineHeight:1.05, letterSpacing:"-0.045em", margin:"0 0 20px" }}>
          Your side business,<br />
          <span style={{ background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>built in 30 minutes.</span>
        </h1>

        <p style={{ fontSize:"clamp(15px,2vw,18px)", color:muted, lineHeight:1.75, maxWidth:520, margin:"0 auto 40px", fontFamily:FB }}>
          EarnedLab's AI agents find the right business for your situation, build everything automatically, and keep it growing — while you focus on what matters.
        </p>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",16), padding:"15px 36px", borderRadius:12, letterSpacing:"-0.02em", boxShadow:"0 8px 32px rgba(124,58,237,0.35)" }}>
            Start your free trial →
          </button>
          <span style={{ fontSize:13, color:subtle, fontFamily:FB }}>7 days free · No credit card required · Cancel anytime</span>
        </div>

        <div style={{ display:"flex", justifyContent:"center", gap:48, marginTop:56 }}>
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
      n:"02", title:"AI finds your best business",
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
      features:["Unlimited marketing insights","Revenue & lead tracking","Business planning tools","Email support"],
      cta:"Start free trial",
    },
    {
      id:"pro", name:"Pro", price:89, color:C.primary, popular:true,
      tagline:"Agents act on your request.",
      features:["Everything in Starter","Management agent implements changes","Live website updates on demand","Marketing + Management agents work together","Priority support"],
      cta:"Start free trial",
    },
    {
      id:"pro_autopilot", name:"Pro Autopilot", price:199, color:"#DB2777",
      tagline:"Fully autonomous — just watch it run.",
      features:["Everything in Pro","Agents run on their own schedule","Zero manual input required","White-glove onboarding","Dedicated support"],
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
                  <li key={f} style={{ display:"flex", gap:10, fontSize:13, color:muted, lineHeight:1.5 }}>
                    <span style={{ color:t.color, fontWeight:700, flexShrink:0 }}>✓</span>{f}
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
    { q:"How long does setup actually take?", a:"Most users finish the discovery questionnaire in about 5 minutes and have a live business in under 30. The AI handles the research, idea selection, and initial setup automatically." },
    { q:"Do I need any technical skills?", a:"None at all. EarnedLab handles everything from website creation to deployment. If you can send an email, you can use this." },
    { q:"What kind of businesses does EarnedLab work for?", a:"Service businesses, freelancing, and local businesses work best — consulting, coaching, cleaning, photography, tutoring, and similar. We're not the right fit for e-commerce or physical products yet." },
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
      <Agents />
      <Pricing onCta={goSignup} />
      <FAQ />
      <CTABanner onCta={goSignup} />
      <Footer />
    </div>
  );
}
