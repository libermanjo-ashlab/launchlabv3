import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { C, FH, FB, btn, Logo } from "../components";
import { Check } from "lucide-react";

const dark   = "#0A0A0F";
const border = "rgba(255,255,255,0.08)";
const muted  = "rgba(255,255,255,0.5)";
const subtle = "rgba(255,255,255,0.28)";
const SUPPORT = "support@earnedlab.com";

// ── Preset discovery sequences ─────────────────────────────────────────────
const SEQUENCES = [
  {
    input: "I'm good at writing, have about 8 hours a week, and need to keep startup costs under $200",
    results: [
      { name:"Content Strategy Consulting", score:94, reason:"High-margin, zero overhead — your timeline is ideal for 2–3 retainer clients" },
      { name:"Email Newsletter Service",    score:89, reason:"Recurring revenue, works in under 5 hrs/week, $0 to start" },
      { name:"Freelance Copywriting",       score:83, reason:"Fastest path to first dollar — you can sign a client this week" },
    ],
  },
  {
    input: "Software background, full-time job, want something I can build nights and weekends",
    results: [
      { name:"Developer Micro-SaaS",        score:96, reason:"Build once, sell repeatedly — perfect for async, part-time founders" },
      { name:"Technical Consulting",        score:91, reason:"Premium rates, no meetings required, fully async-friendly" },
      { name:"Code Review Service",         score:85, reason:"Leverage what you already know — set your own hours" },
    ],
  },
  {
    input: "I love working with people and want something I can run locally in my city",
    results: [
      { name:"Business Coaching Practice",  score:93, reason:"High demand in every market — your network is your first 3 clients" },
      { name:"Local Marketing Agency",      score:88, reason:"Small businesses everywhere are chronically underserved here" },
      { name:"Personal Training Business",  score:81, reason:"Low overhead, loyal clients, flexible schedule you control" },
    ],
  },
  {
    input: "I make handmade goods and want to turn it into a real business I can grow",
    results: [
      { name:"Ecommerce Brand",             score:95, reason:"Your existing product is the hardest part — you're already past step one" },
      { name:"Wholesale to Boutiques",      score:87, reason:"Bulk orders, predictable revenue, builds brand credibility fast" },
      { name:"Workshop & Teaching Studio",  score:80, reason:"Monetize the craft itself — high perceived value, low supply cost" },
    ],
  },
];

// ── Animated discovery input ───────────────────────────────────────────────
function AnimatedInput({ onCta }) {
  const [inputText,  setInputText]  = useState("");
  const [results,    setResults]    = useState([]);
  const [analyzing,  setAnalyzing]  = useState(false);
  const [userMode,   setUserMode]   = useState(false);
  const [showCta,    setShowCta]    = useState(false);
  const cancelRef = useRef(false);

  // Typewriter animation loop
  useEffect(() => {
    if (userMode) return;
    cancelRef.current = false;

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const cancelled = () => cancelRef.current;

    const run = async () => {
      let si = 0;
      while (!cancelled()) {
        const seq = SEQUENCES[si % SEQUENCES.length];
        si++;

        // Type input char by char with natural variance
        for (let i = 1; i <= seq.input.length; i++) {
          if (cancelled()) return;
          setInputText(seq.input.slice(0, i));
          const pause = /[,.]/.test(seq.input[i - 1]) ? 160 : Math.random() * 22 + 18;
          await sleep(pause);
        }

        if (cancelled()) return;
        setAnalyzing(true);
        await sleep(750);

        if (cancelled()) return;
        setAnalyzing(false);

        // Stream results in
        for (let i = 0; i < seq.results.length; i++) {
          if (cancelled()) return;
          setResults(prev => [...prev, seq.results[i]]);
          await sleep(480);
        }

        if (cancelled()) return;
        setShowCta(true);
        await sleep(3200);

        if (cancelled()) return;
        setInputText("");
        setResults([]);
        setShowCta(false);
        await sleep(500);
      }
    };

    run();
    return () => { cancelRef.current = true; };
  }, [userMode]);

  const handleFocus = () => {
    cancelRef.current = true;
    setUserMode(true);
    setInputText("");
    setResults([]);
    setAnalyzing(false);
    setShowCta(false);
  };

  return (
    <div style={{ width:"100%", maxWidth:640, margin:"0 auto" }}>
      <style>{`
        @keyframes fadeUp   { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse    { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0)} 50%{box-shadow:0 0 0 4px rgba(37,99,235,0.18)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        .result-card        { animation: fadeUp 0.35s ease both; }
      `}</style>

      {/* Input bar */}
      <div
        onClick={handleFocus}
        style={{
          display:"flex", alignItems:"center", gap:12,
          background:"rgba(255,255,255,0.04)",
          border:`1px solid ${analyzing ? "rgba(37,99,235,0.5)" : "rgba(255,255,255,0.12)"}`,
          borderRadius:14, padding:"16px 20px", cursor:"text",
          transition:"border-color 0.3s",
          animation: analyzing ? "pulse 1.4s ease infinite" : "none",
          boxShadow: analyzing ? "0 0 0 3px rgba(37,99,235,0.1)" : "0 0 0 0 transparent",
        }}>
        <div style={{ flex:1, fontFamily:FB, fontSize:15, color:"rgba(255,255,255,0.85)", lineHeight:1.5, minHeight:22 }}>
          {userMode
            ? <span style={{ color:muted }}>Describe yourself — your skills, time, goals…</span>
            : <>
                {inputText}
                {!analyzing && <span style={{ animation:"blink 1s step-end infinite", color:C.primary }}>|</span>}
              </>
          }
        </div>
        {analyzing
          ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, animation:"spin 0.9s linear infinite" }}>
              <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.12)" strokeWidth="2"/>
              <path d="M8 2a6 6 0 0 1 6 6" stroke={C.primary} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, opacity:0.3 }}>
              <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        }
      </div>

      {/* Results */}
      {!userMode && results.length > 0 && (
        <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:8 }}>
          {results.map((r, i) => (
            <div key={i} className="result-card" style={{
              background:"rgba(255,255,255,0.035)", border:`1px solid ${border}`,
              borderRadius:12, padding:"14px 18px",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <span style={{ fontFamily:FH, fontWeight:600, fontSize:14, color:"#fff", letterSpacing:"-0.025em" }}>{r.name}</span>
                <span style={{ fontFamily:FH, fontWeight:700, fontSize:13, color:"#4ADE80", letterSpacing:"-0.02em" }}>{r.score}%</span>
              </div>
              <div style={{ fontSize:12, color:muted, fontFamily:FB, lineHeight:1.5 }}>{r.reason}</div>
            </div>
          ))}
        </div>
      )}

      {/* Animated CTA */}
      {!userMode && showCta && (
        <div style={{ marginTop:14, animation:"fadeUp 0.4s ease both", textAlign:"center" }}>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",13), padding:"10px 22px", borderRadius:10, boxShadow:"0 4px 20px rgba(124,58,237,0.28)" }}>
            Analyze my actual profile →
          </button>
        </div>
      )}

      {/* User mode CTA */}
      {userMode && (
        <div style={{ marginTop:14, animation:"fadeUp 0.35s ease both" }}>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",14), padding:"13px", borderRadius:10, width:"100%", boxShadow:"0 4px 20px rgba(124,58,237,0.28)" }}>
            Create free account to analyze your profile →
          </button>
          <p style={{ fontSize:11, color:subtle, fontFamily:FB, textAlign:"center", marginTop:10, marginBottom:0 }}>7 days free · No credit card</p>
        </div>
      )}
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────
function Nav({ onCta }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, height:54, display:"flex", alignItems:"center", padding:"0 28px", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", background:"rgba(10,10,15,0.8)", borderBottom:`1px solid ${border}` }}>
      <div style={{ maxWidth:1000, margin:"0 auto", width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Logo size={18}/>
          <span style={{ fontFamily:FH, fontWeight:700, fontSize:13, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.02em" }}>EARNEDLAB</span>
        </div>
        <div className="nav-desktop" style={{ display:"flex", alignItems:"center", gap:4 }}>
          <a href="#how-it-works" style={{ fontSize:13, color:muted, textDecoration:"none", padding:"6px 12px", fontFamily:FB }}>How it works</a>
          <a href="#pricing"      style={{ fontSize:13, color:muted, textDecoration:"none", padding:"6px 12px", fontFamily:FB }}>Pricing</a>
          <Link to="/signup" style={{ fontSize:13, color:"rgba(255,255,255,0.6)", textDecoration:"none", padding:"6px 14px", fontFamily:FB, border:`1px solid ${border}`, borderRadius:8, marginLeft:8, marginRight:4 }}>Sign in</Link>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",12), padding:"7px 16px", borderRadius:8 }}>Start free →</button>
        </div>
        <button className="nav-mobile" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu"
          style={{ display:"none", background:"none", border:"none", cursor:"pointer", padding:6, color:"rgba(255,255,255,0.7)" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? <><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></> : <><line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/></>}
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div style={{ position:"absolute", top:54, left:0, right:0, background:"rgba(10,10,15,0.97)", borderBottom:`1px solid ${border}`, padding:"8px 0 16px" }}>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)} style={{ display:"block", fontSize:15, color:muted, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>How it works</a>
          <a href="#pricing"      onClick={() => setMenuOpen(false)} style={{ display:"block", fontSize:15, color:muted, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>Pricing</a>
          <div style={{ height:1, background:border, margin:"8px 28px" }} />
          <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ display:"block", fontSize:15, color:muted, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>Sign in</Link>
          <div style={{ padding:"8px 28px 0" }}>
            <button onClick={() => { setMenuOpen(false); onCta(); }} style={{ ...btn(C.grad,"#fff",14), width:"100%", padding:"12px", borderRadius:10 }}>Start free →</button>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width:640px) { .nav-desktop{display:none!important} .nav-mobile{display:flex!important} }
      `}</style>
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero({ onCta }) {
  return (
    <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"100px 24px 80px", position:"relative", overflow:"hidden", textAlign:"center" }}>
      {/* Atmospheric gradient */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 55% at 50% -5%, rgba(124,58,237,0.18), transparent)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 50% 40% at 75% 70%, rgba(8,145,178,0.08), transparent)", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:700 }}>
        <h1 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(36px,5.5vw,62px)", color:"#fff", lineHeight:1.08, letterSpacing:"-0.045em", margin:"0 0 18px" }}>
          Build the business<br/>
          <span style={{ background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>you've been putting off.</span>
        </h1>

        <p style={{ fontSize:"clamp(14px,1.8vw,16px)", color:muted, lineHeight:1.8, margin:"0 auto 40px", maxWidth:420, fontFamily:FB }}>
          Tell EarnedLab about yourself. We find the right fit, build everything, and run it with AI agents.
        </p>

        <AnimatedInput onCta={onCta} />

        <p style={{ fontSize:12, color:subtle, fontFamily:FB, marginTop:28 }}>
          Results above are live examples. Sign up to analyze your own profile.
        </p>
      </div>
    </section>
  );
}

// ── Process ────────────────────────────────────────────────────────────────
function Process() {
  const steps = [
    { n:"01", title:"Tell us about yourself.", body:"Skills, time, budget, location, goals. Five minutes." },
    { n:"02", title:"Your business is built.",  body:"Website, positioning, launch plan — all generated. You go live." },
    { n:"03", title:"Agents run it.",           body:"Marketing and management agents handle growth. Automatically." },
  ];

  return (
    <section id="how-it-works" style={{ padding:"112px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:740, margin:"0 auto" }}>
        <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(24px,4vw,36px)", color:"#fff", letterSpacing:"-0.04em", margin:"0 0 72px" }}>
          From idea to running business<br/>in one afternoon.
        </h2>
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ display:"grid", gridTemplateColumns:"56px 1fr", paddingBottom: i < steps.length - 1 ? 52 : 0, position:"relative" }}>
              {i < steps.length - 1 && (
                <div style={{ position:"absolute", left:20, top:26, bottom:0, width:1, background:`linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)` }} />
              )}
              <span style={{ fontFamily:FH, fontWeight:700, fontSize:12, color:C.primary, letterSpacing:"0.06em", paddingTop:3 }}>{s.n}</span>
              <div>
                <div style={{ fontFamily:FH, fontWeight:600, fontSize:18, color:"#fff", letterSpacing:"-0.03em", marginBottom:6 }}>{s.title}</div>
                <div style={{ fontSize:14, color:muted, lineHeight:1.7, fontFamily:FB }}>{s.body}</div>
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
    <section style={{ padding:"112px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:740, margin:"0 auto" }}>
        <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(24px,4vw,36px)", color:"#fff", letterSpacing:"-0.04em", margin:"0 0 16px" }}>
          Two agents.<br/>One working business.
        </h2>
        <p style={{ fontSize:15, color:muted, fontFamily:FB, lineHeight:1.7, margin:"0 0 56px", maxWidth:380 }}>They share context, compound results, and run together — on demand or on autopilot.</p>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
          {[
            {
              color: C.primary,
              label: "Marketing Agent",
              title: "Finds what's limiting you. Recommends one change.",
              body:  "Monitors revenue, leads, and engagement across channels. Surfaces the single metric holding you back and tells you exactly what to do about it.",
              exLabel: "Observation",
              exText:  "Instagram engagement is 2.3× industry average, but only 8% of visitors click through to your site. Fix the bio link and CTA.",
            },
            {
              color: C.accent,
              label: "Management Agent",
              title: "Takes the recommendation and implements it.",
              body:  "Rewrites copy, updates your live website, deploys in seconds. Logs every change and why. On Autopilot, it runs on a schedule — no input from you.",
              exLabel: "Action taken",
              exText:  "Updated homepage hero with prominent booking CTA — deployed to your live site.",
              live: true,
            },
          ].map(a => (
            <div key={a.label} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`, borderRadius:16, padding:"26px 24px" }}>
              <div style={{ fontSize:10, fontWeight:700, color:a.color, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:14 }}>{a.label}</div>
              <div style={{ fontFamily:FH, fontWeight:600, fontSize:17, color:"#fff", letterSpacing:"-0.03em", lineHeight:1.35, marginBottom:10 }}>{a.title}</div>
              <p style={{ fontSize:13, color:muted, lineHeight:1.75, margin:"0 0 22px", fontFamily:FB }}>{a.body}</p>
              <div style={{ background:`${a.color}0C`, border:`1px solid ${a.color}1A`, borderRadius:10, padding:"12px 14px" }}>
                <div style={{ fontSize:10, color:a.color, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, fontFamily:FB }}>{a.exLabel}</div>
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:12, color:"rgba(255,255,255,0.75)", lineHeight:1.6, fontFamily:FB }}>
                  {a.live && <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ADE80", flexShrink:0, marginTop:4, boxShadow:"0 0 6px #4ADE8080" }} />}
                  {a.exText}
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
    { id:"starter",   name:"Starter",       price:39,  color:subtle,    tagline:"Insights and planning tools.", popular:false,
      features:["Marketing insights & analysis","Revenue & lead tracking","Business planning tools","Email support"] },
    { id:"pro",       name:"Pro",           price:89,  color:C.primary, tagline:"Agents act on your behalf.",   popular:true,
      features:["Everything in Starter","Management agent implements changes","Live website updates on demand","Priority support"] },
    { id:"autopilot", name:"Pro Autopilot", price:199, color:subtle,    tagline:"Fully autonomous.",            popular:false,
      features:["Everything in Pro","Agents run automatically on schedule","No manual input required","Dedicated support"] },
  ];

  return (
    <section id="pricing" style={{ padding:"112px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:860, margin:"0 auto" }}>
        <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(24px,4vw,36px)", color:"#fff", letterSpacing:"-0.04em", margin:"0 0 12px" }}>
          Start free.<br/>Upgrade when you're ready.
        </h2>
        <p style={{ fontSize:15, color:muted, fontFamily:FB, margin:"0 0 56px" }}>7-day free trial on all plans. No credit card required.</p>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14, alignItems:"start" }}>
          {tiers.map(t => (
            <div key={t.id} style={{ background: t.popular ? "rgba(37,99,235,0.05)" : "rgba(255,255,255,0.025)", border:`1.5px solid ${t.popular ? "rgba(37,99,235,0.4)" : border}`, borderRadius:16, padding:"24px 20px", position:"relative" }}>
              {t.popular && (
                <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:C.primary, color:"#fff", fontSize:10, fontWeight:700, padding:"3px 12px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap", fontFamily:FB }}>Most popular</div>
              )}
              <div style={{ fontSize:10, fontWeight:700, color: t.popular ? C.primary : subtle, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:8 }}>{t.name}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:3, marginBottom:5 }}>
                <span style={{ fontFamily:FH, fontWeight:700, fontSize:32, color:"#fff", letterSpacing:"-0.04em" }}>${t.price}</span>
                <span style={{ fontSize:12, color:subtle }}>/mo</span>
              </div>
              <p style={{ fontSize:13, color:muted, margin:"0 0 20px", fontFamily:FB, lineHeight:1.5 }}>{t.tagline}</p>
              <ul style={{ margin:"0 0 24px", padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:8 }}>
                {t.features.map(f => (
                  <li key={f} style={{ display:"flex", gap:9, alignItems:"flex-start", fontSize:12, color:muted, lineHeight:1.5 }}>
                    <Check size={12} color={t.popular ? C.primary : subtle} strokeWidth={2.5} style={{ flexShrink:0, marginTop:2 }}/>{f}
                  </li>
                ))}
              </ul>
              <button onClick={onCta} style={{ ...btn(t.popular ? C.primary : "transparent","#fff",12), width:"100%", padding:"10px", border: t.popular ? "none" : `1px solid ${border}`, borderRadius:9, fontFamily:FB, fontWeight:500 }}>
                Start free trial
              </button>
            </div>
          ))}
        </div>
        <p style={{ fontSize:12, color:subtle, marginTop:24, fontFamily:FB }}>
          Questions? <a href={`mailto:${SUPPORT}`} style={{ color:muted, textDecoration:"underline", textUnderlineOffset:2 }}>Email us</a> — we'll help you pick.
        </p>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────
function Footer({ onCta }) {
  return (
    <footer style={{ borderTop:`1px solid ${border}` }}>
      <div style={{ padding:"96px 24px 80px", textAlign:"center" }}>
        <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(24px,4vw,40px)", color:"#fff", letterSpacing:"-0.045em", margin:"0 0 12px", lineHeight:1.1 }}>Ready to build?</h2>
        <p style={{ fontSize:15, color:muted, fontFamily:FB, margin:"0 auto 32px", maxWidth:340, lineHeight:1.7 }}>The first 7 days are free. No credit card, no commitment.</p>
        <button onClick={onCta} style={{ ...btn(C.grad,"#fff",14), padding:"13px 34px", borderRadius:12, boxShadow:"0 8px 28px rgba(124,58,237,0.22)" }}>
          Start your free trial →
        </button>
      </div>
      <div style={{ padding:"20px 28px 24px", borderTop:`1px solid ${border}` }}>
        <div style={{ maxWidth:1000, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Logo size={15}/><span style={{ fontFamily:FH, fontWeight:700, fontSize:12, color:subtle, letterSpacing:"-0.02em" }}>EarnedLab</span>
            <span style={{ fontSize:11, color:subtle, fontFamily:FB, marginLeft:4 }}>© {new Date().getFullYear()}</span>
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

// ── Main ──────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const goSignup = () => navigate("/signup");

  return (
    <div style={{ background:dark, color:"#fff", fontFamily:FB, minHeight:"100vh" }}>
      <Nav onCta={goSignup} />
      <Hero onCta={goSignup} />
      <Process />
      <Agents />
      <Pricing onCta={goSignup} />
      <Footer onCta={goSignup} />
    </div>
  );
}
