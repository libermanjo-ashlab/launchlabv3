import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { C, FH, FB, btn, Logo } from "../components";
import { Check } from "lucide-react";

const dark   = "#0A0A0F";
const surface= "rgba(255,255,255,0.04)";
const border = "rgba(255,255,255,0.08)";
const muted  = "rgba(255,255,255,0.55)";
const subtle = "rgba(255,255,255,0.3)";

const SUPPORT = "support@earnedlab.com";

// ── Nav ────────────────────────────────────────────────────────────────────
function Nav({ onCta }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", background:"rgba(10,10,15,0.85)", borderBottom:`1px solid ${border}`, height:56, display:"flex", alignItems:"center", padding:"0 28px" }}>
      <div style={{ maxWidth:1000, margin:"0 auto", width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Logo size={20}/>
          <span style={{ fontFamily:FH, fontWeight:700, fontSize:14, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.02em" }}>EARNEDLAB</span>
        </div>

        <div className="nav-desktop" style={{ display:"flex", alignItems:"center", gap:4 }}>
          <a href="#how-it-works" style={{ fontSize:13, color:muted, textDecoration:"none", padding:"6px 12px", fontFamily:FB }}>How it works</a>
          <a href="#pricing"      style={{ fontSize:13, color:muted, textDecoration:"none", padding:"6px 12px", fontFamily:FB }}>Pricing</a>
          <a href="#faq"          style={{ fontSize:13, color:muted, textDecoration:"none", padding:"6px 12px", fontFamily:FB, marginRight:12 }}>FAQ</a>
          <Link to="/signup" style={{ fontSize:13, color:"rgba(255,255,255,0.65)", textDecoration:"none", padding:"6px 14px", fontFamily:FB, fontWeight:500, border:`1px solid ${border}`, borderRadius:8, marginRight:6 }}>Sign in</Link>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",13), padding:"8px 18px", borderRadius:8 }}>Start free →</button>
        </div>

        <button className="nav-mobile" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu"
          style={{ display:"none", background:"none", border:"none", cursor:"pointer", padding:6, color:"rgba(255,255,255,0.75)" }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen
              ? <><line x1="4" y1="4" x2="18" y2="18"/><line x1="18" y1="4" x2="4" y2="18"/></>
              : <><line x1="3" y1="7" x2="19" y2="7"/><line x1="3" y1="11" x2="19" y2="11"/><line x1="3" y1="15" x2="19" y2="15"/></>}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div style={{ position:"absolute", top:56, left:0, right:0, background:"rgba(10,10,15,0.97)", borderBottom:`1px solid ${border}`, display:"flex", flexDirection:"column", padding:"8px 0 16px", zIndex:51 }}>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)} style={{ fontSize:15, color:muted, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>How it works</a>
          <a href="#pricing"      onClick={() => setMenuOpen(false)} style={{ fontSize:15, color:muted, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>Pricing</a>
          <a href="#faq"          onClick={() => setMenuOpen(false)} style={{ fontSize:15, color:muted, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>FAQ</a>
          <div style={{ height:1, background:border, margin:"8px 28px" }} />
          <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ fontSize:15, color:muted, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>Sign in</Link>
          <div style={{ padding:"8px 28px 0" }}>
            <button onClick={() => { setMenuOpen(false); onCta(); }} style={{ ...btn(C.grad,"#fff",14), width:"100%", padding:"12px", borderRadius:10 }}>Start free →</button>
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
    <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"120px 24px 100px", position:"relative", overflow:"hidden", textAlign:"center" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,0.14), transparent)", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:620 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:surface, border:`1px solid ${border}`, borderRadius:24, padding:"5px 14px", marginBottom:36 }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ADE80", boxShadow:"0 0 8px #4ADE8080", flexShrink:0 }} />
          <span style={{ fontSize:11, color:muted, fontFamily:FB, fontWeight:500, letterSpacing:"0.03em" }}>Now in early access</span>
        </div>

        <h1 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(40px,6vw,66px)", color:"#fff", lineHeight:1.05, letterSpacing:"-0.045em", margin:"0 0 22px" }}>
          Your side business,<br />
          <span style={{ background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>built in 30 minutes.</span>
        </h1>

        <p style={{ fontSize:"clamp(15px,2vw,17px)", color:muted, lineHeight:1.8, maxWidth:460, margin:"0 auto 44px", fontFamily:FB }}>
          EarnedLab finds the right business for your situation, builds everything automatically, and keeps it growing with AI agents.
        </p>

        <button onClick={onCta} style={{ ...btn(C.grad,"#fff",15), padding:"14px 34px", borderRadius:12, letterSpacing:"-0.01em", boxShadow:"0 8px 32px rgba(124,58,237,0.3)" }}>
          Start your free trial →
        </button>

        <div style={{ marginTop:16, display:"flex", alignItems:"center", justifyContent:"center", gap:16, flexWrap:"wrap" }}>
          {["7 days free","No credit card","Cancel anytime"].map((t) => (
            <span key={t} style={{ fontSize:12, color:subtle, fontFamily:FB, display:"flex", alignItems:"center", gap:5 }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2"/><path d="M3 5l1.5 1.5L7 3.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Discovery Preview ─────────────────────────────────────────────────────
const MATCHES = {
  design:   { name:"Brand & Design Studio",          score:94 },
  writing:  { name:"Content Strategy Practice",      score:93 },
  tech:     { name:"Software Development Agency",    score:91 },
  teaching: { name:"Coaching & Training Business",   score:96 },
  sales:    { name:"B2B Sales Consulting",           score:89 },
  ops:      { name:"Operations Consulting Practice", score:88 },
};

function DiscoveryPreview({ onCta }) {
  const [phase,    setPhase]   = useState("quiz");   // quiz | loading | result
  const [answers,  setAnswers] = useState({});

  const pick = (key, id) => setAnswers(a => ({ ...a, [key]: id }));
  const allDone = answers.skill && answers.time && answers.goal;
  const result  = MATCHES[answers.skill] || { name:"Consulting Practice", score:90 };

  const submit = () => {
    setPhase("loading");
    setTimeout(() => setPhase("result"), 1800);
  };

  const chipStyle = (active) => ({
    padding:"9px 16px", borderRadius:8, cursor:"pointer", fontFamily:FB, fontSize:13,
    fontWeight: active ? 600 : 400, border:`1.5px solid ${active ? C.primary : border}`,
    background: active ? `${C.primary}18` : "transparent",
    color: active ? "#fff" : muted, transition:"all 0.12s",
  });

  const groups = [
    { key:"skill", label:"What's your strongest skill?", opts:[
      { id:"design",   label:"Design & Creative" },
      { id:"writing",  label:"Writing & Content"  },
      { id:"tech",     label:"Tech & Software"    },
      { id:"teaching", label:"Teaching & Coaching"},
      { id:"sales",    label:"Sales & Marketing"  },
      { id:"ops",      label:"Operations & Admin" },
    ]},
    { key:"time", label:"Hours per week you can commit?", opts:[
      { id:"lt5",   label:"Under 5 hrs" },
      { id:"5to15", label:"5 – 15 hrs"  },
      { id:"15to30",label:"15 – 30 hrs" },
      { id:"full",  label:"Full time"   },
    ]},
    { key:"goal", label:"What matters most to you?", opts:[
      { id:"cost",     label:"Low startup cost"  },
      { id:"fast",     label:"Fast first dollar" },
      { id:"flexible", label:"Flexible schedule" },
      { id:"growth",   label:"Long-term growth"  },
    ]},
  ];

  return (
    <section style={{ padding:"0 24px 104px" }}>
      <div style={{ maxWidth:760, margin:"0 auto" }}>
        <div style={{ background:surface, border:`1px solid ${border}`, borderRadius:20, overflow:"hidden" }}>

          {/* Header */}
          <div style={{ padding:"28px 32px 24px", borderBottom:`1px solid ${border}` }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.primary, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:8 }}>Try the discovery quiz</div>
            <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(18px,3vw,24px)", color:"#fff", letterSpacing:"-0.04em", margin:"0 0 4px" }}>
              See what business fits your life.
            </h2>
            <p style={{ fontSize:13, color:muted, fontFamily:FB, margin:0 }}>3 questions. No account needed to see your match.</p>
          </div>

          {/* Quiz */}
          {phase === "quiz" && (
            <div style={{ padding:"28px 32px 32px" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
                {groups.map(g => (
                  <div key={g.key}>
                    <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.75)", fontFamily:FB, marginBottom:12 }}>{g.label}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {g.opts.map(o => (
                        <button key={o.id} onClick={() => pick(g.key, o.id)} style={chipStyle(answers[g.key] === o.id)}>{o.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop:32 }}>
                <button
                  onClick={submit}
                  disabled={!allDone}
                  style={{ ...btn(allDone ? C.grad : "rgba(255,255,255,0.06)","#fff",14), padding:"13px 28px", borderRadius:10, opacity: allDone ? 1 : 0.5, cursor: allDone ? "pointer" : "default", boxShadow: allDone ? "0 4px 20px rgba(124,58,237,0.3)" : "none" }}>
                  See my match →
                </button>
                {!allDone && <span style={{ fontSize:12, color:subtle, fontFamily:FB, marginLeft:14 }}>Answer all 3 to continue</span>}
              </div>
            </div>
          )}

          {/* Loading */}
          {phase === "loading" && (
            <div style={{ padding:"64px 32px", textAlign:"center" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:12, color:muted, fontFamily:FB, fontSize:14 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation:"spin 0.9s linear infinite" }}>
                  <circle cx="9" cy="9" r="7" stroke={border} strokeWidth="2"/>
                  <path d="M9 2a7 7 0 0 1 7 7" stroke={C.primary} strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Analyzing your profile…
              </div>
              <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Result */}
          {phase === "result" && (
            <div style={{ padding:"28px 32px 32px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:6 }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:"#4ADE80", textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:8 }}>Your top match</div>
                  <h3 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(20px,3vw,26px)", color:"#fff", letterSpacing:"-0.04em", margin:0 }}>{result.name}</h3>
                </div>
                <span style={{ fontFamily:FH, fontWeight:700, fontSize:32, color:"#4ADE80", letterSpacing:"-0.04em" }}>{result.score}%</span>
              </div>

              {/* Match bar */}
              <div style={{ height:3, background:border, borderRadius:2, margin:"16px 0 24px" }}>
                <div style={{ width:`${result.score}%`, height:"100%", background:"linear-gradient(to right,#2563EB,#4ADE80)", borderRadius:2 }} />
              </div>

              {/* Blurred insights */}
              <div style={{ position:"relative", marginBottom:28 }}>
                <div style={{ filter:"blur(5px)", pointerEvents:"none", userSelect:"none" }}>
                  {[
                    "Why this business fits your exact skill set",
                    "Your fastest realistic path to first revenue",
                    "3 specific competitors to study before you launch",
                    "Estimated startup cost and time to first dollar",
                  ].map((t, i) => (
                    <div key={i} style={{ display:"flex", gap:10, alignItems:"center", padding:"10px 0", borderTop:`1px solid ${border}`, fontSize:13, color:"rgba(255,255,255,0.7)", fontFamily:FB }}>
                      <span style={{ color:C.primary, fontWeight:700, flexShrink:0 }}>+</span>{t}
                    </div>
                  ))}
                  <div style={{ borderTop:`1px solid ${border}` }} />
                </div>
                {/* Lock overlay */}
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ background:"rgba(10,10,15,0.88)", border:`1px solid ${border}`, borderRadius:12, padding:"12px 20px", textAlign:"center", backdropFilter:"blur(8px)" }}>
                    <div style={{ fontSize:13, color:"#fff", fontFamily:FH, fontWeight:600, marginBottom:2 }}>Full analysis ready</div>
                    <div style={{ fontSize:11, color:muted, fontFamily:FB }}>Create a free account to unlock</div>
                  </div>
                </div>
              </div>

              <button onClick={onCta} style={{ ...btn(C.grad,"#fff",14), padding:"13px", borderRadius:10, boxShadow:"0 4px 20px rgba(124,58,237,0.3)", width:"100%" }}>
                Create free account to unlock your full match →
              </button>
              <p style={{ fontSize:11, color:subtle, fontFamily:FB, textAlign:"center", marginTop:10, marginBottom:0 }}>No credit card · 7 days free</p>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n:"01", title:"Tell us about yourself", body:"Skills, time, budget, goals — a 5-minute intake. EarnedLab uses this to match you with the business most likely to work for your specific situation." },
    { n:"02", title:"Your business is built", body:"Website, positioning, and launch plan are generated automatically. You review, approve, and go live — no technical setup needed." },
    { n:"03", title:"Agents take it from here", body:"Marketing and management agents monitor performance, surface what to fix, and implement changes — on demand or on autopilot." },
  ];

  return (
    <section id="how-it-works" style={{ padding:"104px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:860, margin:"0 auto" }}>
        <div style={{ marginBottom:72 }}>
          <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(26px,4vw,38px)", color:"#fff", letterSpacing:"-0.04em", margin:"0 0 12px" }}>From zero to launched<br />in one afternoon.</h2>
          <p style={{ fontSize:15, color:muted, fontFamily:FB, maxWidth:400, lineHeight:1.7, margin:0 }}>No experience required. No technical skills. Just your answers.</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ display:"grid", gridTemplateColumns:"80px 1fr", gap:"0 32px", paddingBottom: i < steps.length - 1 ? 48 : 0, position:"relative" }}>
              {i < steps.length - 1 && (
                <div style={{ position:"absolute", left:38, top:28, bottom:0, width:1, background:`linear-gradient(to bottom, ${border}, transparent)` }} />
              )}
              <div style={{ paddingTop:4 }}>
                <span style={{ fontFamily:FH, fontWeight:700, fontSize:13, color:C.primary, letterSpacing:"0.06em" }}>{s.n}</span>
              </div>
              <div>
                <h3 style={{ fontFamily:FH, fontWeight:600, fontSize:18, color:"#fff", letterSpacing:"-0.03em", margin:"0 0 10px" }}>{s.title}</h3>
                <p style={{ fontSize:14, color:muted, lineHeight:1.75, margin:0, maxWidth:500, fontFamily:FB }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Agents ────────────────────────────────────────────────────────────────
function Agents() {
  return (
    <section style={{ padding:"104px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:860, margin:"0 auto" }}>
        <div style={{ marginBottom:64 }}>
          <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(26px,4vw,38px)", color:"#fff", letterSpacing:"-0.04em", margin:"0 0 12px" }}>Two agents.<br />One working business.</h2>
          <p style={{ fontSize:15, color:muted, fontFamily:FB, maxWidth:400, lineHeight:1.7, margin:0 }}>They run together, share context, and compound results over time.</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20 }}>
          {/* Marketing Agent */}
          <div style={{ background:surface, border:`1px solid ${border}`, borderRadius:16, padding:"28px 26px" }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.primary, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:14 }}>Marketing Agent</div>
            <h3 style={{ fontFamily:FH, fontWeight:600, fontSize:19, color:"#fff", letterSpacing:"-0.03em", margin:"0 0 10px", lineHeight:1.3 }}>Finds what's holding you back. Tells you exactly what to fix.</h3>
            <p style={{ fontSize:13, color:muted, lineHeight:1.75, margin:"0 0 24px", fontFamily:FB }}>Monitors revenue, leads, and engagement. Surfaces the one metric limiting your growth and recommends a clear action.</p>
            <div style={{ background:`${C.primary}0D`, border:`1px solid ${C.primary}22`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:10, color:C.primary, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:7, fontFamily:FB }}>Example observation</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", lineHeight:1.6, fontFamily:FB }}>Instagram engagement is 2.3× the industry average, but only 8% of visitors click through to your site.</div>
            </div>
          </div>

          {/* Management Agent */}
          <div style={{ background:surface, border:`1px solid ${border}`, borderRadius:16, padding:"28px 26px" }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:14 }}>Management Agent</div>
            <h3 style={{ fontFamily:FH, fontWeight:600, fontSize:19, color:"#fff", letterSpacing:"-0.03em", margin:"0 0 10px", lineHeight:1.3 }}>Takes the recommendation and implements it — automatically.</h3>
            <p style={{ fontSize:13, color:muted, lineHeight:1.75, margin:"0 0 24px", fontFamily:FB }}>Rewrites copy, updates your website, deploys changes live. Logs everything it does and why. On Autopilot, it runs on a schedule with no input from you.</p>
            <div style={{ background:`${C.accent}0D`, border:`1px solid ${C.accent}22`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:10, color:C.accent, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:7, fontFamily:FB }}>Example action</div>
              <div style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:"rgba(255,255,255,0.8)", lineHeight:1.6, fontFamily:FB }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ADE80", flexShrink:0, marginTop:4, boxShadow:"0 0 6px #4ADE8080" }} />
                Updated homepage hero with prominent booking CTA and deployed to your live site.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────
function Pricing({ onCta }) {
  const tiers = [
    {
      id:"starter", name:"Starter", price:39, color:"rgba(255,255,255,0.5)",
      tagline:"For founders who want insights without automation.",
      features:["Marketing insights & analysis","Revenue & lead tracking","Business planning tools","Email support"],
    },
    {
      id:"pro", name:"Pro", price:89, color:C.primary, popular:true,
      tagline:"Agents act on your behalf when you ask.",
      features:["Everything in Starter","Management agent implements changes","Live website updates on demand","Marketing + Management working together","Priority support"],
    },
    {
      id:"autopilot", name:"Pro Autopilot", price:199, color:"rgba(255,255,255,0.5)",
      tagline:"Fully autonomous — agents run on a schedule.",
      features:["Everything in Pro","Agents run automatically","No manual input required","Dedicated support"],
    },
  ];

  return (
    <section id="pricing" style={{ padding:"104px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        <div style={{ marginBottom:64 }}>
          <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(26px,4vw,38px)", color:"#fff", letterSpacing:"-0.04em", margin:"0 0 12px" }}>Start free.<br />Upgrade when you're ready.</h2>
          <p style={{ fontSize:15, color:muted, fontFamily:FB, lineHeight:1.7, margin:0 }}>7-day free trial on all plans. No credit card required.</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16, alignItems:"start" }}>
          {tiers.map((t) => (
            <div key={t.id} style={{ background: t.popular ? "rgba(37,99,235,0.06)" : surface, border:`1.5px solid ${t.popular ? C.primary+"55" : border}`, borderRadius:16, padding:"26px 22px", position:"relative" }}>
              {t.popular && (
                <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:C.primary, color:"#fff", fontSize:10, fontWeight:700, padding:"3px 14px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap", fontFamily:FB }}>Most popular</div>
              )}
              <div style={{ fontSize:11, fontWeight:700, color: t.popular ? C.primary : subtle, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:8 }}>{t.name}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:6 }}>
                <span style={{ fontFamily:FH, fontWeight:700, fontSize:34, color:"#fff", letterSpacing:"-0.04em" }}>${t.price}</span>
                <span style={{ fontSize:13, color:subtle }}>/month</span>
              </div>
              <p style={{ fontSize:13, color:muted, lineHeight:1.6, marginBottom:22, fontFamily:FB }}>{t.tagline}</p>
              <ul style={{ margin:"0 0 26px", padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:9 }}>
                {t.features.map((f) => (
                  <li key={f} style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize:13, color:muted, lineHeight:1.5 }}>
                    <Check size={13} color={t.popular ? C.primary : subtle} strokeWidth={2.5} style={{ flexShrink:0, marginTop:2 }} />{f}
                  </li>
                ))}
              </ul>
              <button onClick={onCta} style={{ ...btn(t.popular ? C.primary : "transparent","#fff",13), width:"100%", padding:"11px", border: t.popular ? "none" : `1px solid ${border}`, borderRadius:10, fontFamily:FB }}>
                Start free trial
              </button>
            </div>
          ))}
        </div>

        <p style={{ fontSize:13, color:subtle, marginTop:28, fontFamily:FB }}>
          Not sure which plan? <a href={`mailto:${SUPPORT}`} style={{ color:muted, textDecoration:"underline", textUnderlineOffset:2 }}>Email us</a> — we'll point you in the right direction.
        </p>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────
function FAQ() {
  const faqs = [
    { q:"Do I need any experience or technical skills?", a:"No. EarnedLab is designed for people who have never started a business before. The platform guides you step by step and the AI agents handle the complex parts automatically. If you can send an email, you can use this." },
    { q:"What type of businesses can I start?", a:"EarnedLab works for service businesses, freelance practices, consulting, agencies, ecommerce, and physical product businesses. You choose your business type during setup and the platform tailors everything — marketing, operations, and planning — to your model." },
    { q:"How is this different from asking ChatGPT?", a:"ChatGPT gives you advice you have to act on yourself. EarnedLab builds and runs things — your website is live, your marketing agent is running, your tasks are tracked. It's a platform that does work, not a conversation you have to manage." },
    { q:"What happens at the end of the trial?", a:"Your account moves to a read-only view. Your data and business are saved. Upgrade any time to resume the agents. We'll email you before the trial ends." },
  ];

  return (
    <section id="faq" style={{ padding:"104px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:640, margin:"0 auto" }}>
        <div style={{ marginBottom:56 }}>
          <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(26px,4vw,36px)", color:"#fff", letterSpacing:"-0.04em", margin:0 }}>Common questions.</h2>
        </div>

        <div style={{ display:"flex", flexDirection:"column" }}>
          {faqs.map((f, i) => (
            <details key={i} style={{ borderTop:`1px solid ${border}`, padding:"22px 0", cursor:"pointer" }}>
              <summary style={{ fontFamily:FH, fontWeight:600, fontSize:15, color:"#fff", letterSpacing:"-0.02em", listStyle:"none", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, userSelect:"none" }}>
                {f.q}
                <span style={{ color:subtle, fontSize:18, flexShrink:0, lineHeight:1 }}>+</span>
              </summary>
              <p style={{ fontSize:14, color:muted, lineHeight:1.8, margin:"14px 0 0", fontFamily:FB }}>{f.a}</p>
            </details>
          ))}
          <div style={{ borderTop:`1px solid ${border}` }} />
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────
function Footer({ onCta }) {
  return (
    <footer style={{ borderTop:`1px solid ${border}` }}>
      {/* Final CTA */}
      <div style={{ padding:"96px 24px 80px", textAlign:"center" }}>
        <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(26px,4vw,42px)", color:"#fff", letterSpacing:"-0.045em", margin:"0 0 14px", lineHeight:1.1 }}>
          Ready to build?
        </h2>
        <p style={{ fontSize:15, color:muted, lineHeight:1.7, marginBottom:32, fontFamily:FB, maxWidth:380, margin:"0 auto 32px" }}>
          The first 7 days are completely free. No credit card, no commitment.
        </p>
        <button onClick={onCta} style={{ ...btn(C.grad,"#fff",15), padding:"14px 36px", borderRadius:12, boxShadow:"0 8px 32px rgba(124,58,237,0.25)" }}>
          Start your free trial →
        </button>
      </div>

      {/* Links */}
      <div style={{ padding:"24px 28px 28px", borderTop:`1px solid ${border}` }}>
        <div style={{ maxWidth:1000, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Logo size={16}/>
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:13, color:subtle, letterSpacing:"-0.02em" }}>EarnedLab</span>
            <span style={{ fontSize:12, color:subtle, fontFamily:FB, marginLeft:6 }}>© {new Date().getFullYear()}</span>
          </div>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap", alignItems:"center" }}>
            {[["Terms","/terms"],["Privacy","/privacy"],["Disclaimer","/disclaimer"]].map(([l,p]) => (
              <Link key={p} to={p} style={{ fontSize:12, color:subtle, textDecoration:"none", fontFamily:FB }}>{l}</Link>
            ))}
            <a href={`mailto:${SUPPORT}`} style={{ fontSize:12, color:muted, textDecoration:"none", fontFamily:FB }}>{SUPPORT}</a>
          </div>
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
      <DiscoveryPreview onCta={goSignup} />
      <HowItWorks />
      <Agents />
      <Pricing onCta={goSignup} />
      <FAQ />
      <Footer onCta={goSignup} />
    </div>
  );
}
