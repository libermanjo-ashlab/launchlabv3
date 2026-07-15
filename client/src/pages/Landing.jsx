import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { C, FH, FB, btn, Logo } from "../components";
import { Check } from "lucide-react";

// ── Tokens ────────────────────────────────────────────────────────────────
const dark   = "#0A0A0F";
const border = "rgba(255,255,255,0.07)";
const dim    = "rgba(255,255,255,0.38)";
const subtle = "rgba(255,255,255,0.18)";
const SPRING = "cubic-bezier(0.16,1,0.3,1)";
const SUPPORT = "support@earnedlab.com";

// ── Data ──────────────────────────────────────────────────────────────────
const SEQUENCES = [
  {
    input: "Good at writing, about 8 hours a week, need to keep costs under $200",
    results: [
      { name:"Content Strategy Consulting", score:94, note:"Zero overhead — your timeline fits 2–3 retainer clients perfectly" },
      { name:"Email Newsletter Service",    score:89, note:"Recurring revenue, $0 to start, works in under 5 hrs/week" },
      { name:"Freelance Copywriting",       score:83, note:"You could sign your first client this week" },
    ],
  },
  {
    input: "Software background, full-time job, building nights and weekends",
    results: [
      { name:"Developer Micro-SaaS",        score:96, note:"Build once, sell repeatedly — ideal for async part-time founders" },
      { name:"Technical Consulting",        score:91, note:"Premium rates, fully async, no meetings required" },
      { name:"Code Review Service",         score:85, note:"Leverage exactly what you already know" },
    ],
  },
  {
    input: "Love working with people, want something I can run locally",
    results: [
      { name:"Business Coaching Practice",  score:93, note:"High demand in every city — your network is your first 3 clients" },
      { name:"Local Marketing Agency",      score:88, note:"Small businesses everywhere are chronically underserved" },
      { name:"Personal Training Business",  score:81, note:"Low overhead, loyal clients, flexible hours" },
    ],
  },
  {
    input: "Make handmade goods and want to turn this into a real business",
    results: [
      { name:"Ecommerce Brand",             score:95, note:"Your existing product is the hardest part — you're already past step one" },
      { name:"Wholesale to Boutiques",      score:87, note:"Bulk orders, predictable revenue, builds brand credibility fast" },
      { name:"Workshop & Teaching Studio",  score:80, note:"Monetize the craft — high perceived value, low supply cost" },
    ],
  },
];

const BUILD_STEPS = [
  { label:"Analyzing your profile",          ms:1000 },
  { label:"Selecting business model",        ms:1200 },
  { label:"Generating website and brand",    ms:1500 },
  { label:"Writing launch plan",             ms:900  },
  { label:"Activating marketing agent",      ms:700  },
  { label:"Activating management agent",     ms:600  },
];

const MARKETING_CAPTION =
  "Stop outsourcing your brand voice to someone who doesn't know your business.\n\nYour clients aren't looking for a vendor. They're looking for the person who gets it. Here's how to show them you do:";

const MARKETING_META = [
  "Reach estimate: 4,100",
  "Best time: Tomorrow 9:15 AM",
  "Engagement forecast: 6.2%",
  "3 hashtag clusters ready",
];

const MGMT_STATS = [
  { label:"Revenue",   target:8400, prefix:"$", suffix:"" },
  { label:"Clients",   target:7,    prefix:"",  suffix:""  },
  { label:"Completion",target:73,   prefix:"",  suffix:"%" },
  { label:"Health",    target:94,   prefix:"",  suffix:""  },
];

const MGMT_LOG = [
  "Updated homepage headline and booking CTA",
  "Scheduled Instagram content for next 7 days",
  "Sent weekly performance report to 7 clients",
  "Paused underperforming ad set — saved $43",
  "Refreshed email sequence for new leads",
];

// ── Hooks ─────────────────────────────────────────────────────────────────
function useInView(ref, threshold = 0.2) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setSeen(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return seen;
}

function useCounter(target, active, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [active, target, duration]);
  return val;
}

// ── AnimateOnView ─────────────────────────────────────────────────────────
function A({ children, delay = 0, style = {}, as: Tag = "div" }) {
  const ref = useRef(null);
  const seen = useInView(ref, 0.1);
  return (
    <Tag ref={ref} style={{
      opacity: seen ? 1 : 0,
      transform: seen ? "translateY(0)" : "translateY(22px)",
      transition: `opacity 0.9s ${SPRING} ${delay}ms, transform 0.9s ${SPRING} ${delay}ms`,
      ...style,
    }}>
      {children}
    </Tag>
  );
}

// ── Global CSS ────────────────────────────────────────────────────────────
const CSS = `
  html { scroll-behavior: smooth; }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dash    { to{stroke-dashoffset:0} }
  @keyframes glow    { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0)} 50%{box-shadow:0 0 0 6px rgba(37,99,235,0.12)} }
  @keyframes floatIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes countIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .result-in  { animation: fadeUp 0.55s ${SPRING} both; }
  .log-in     { animation: floatIn 0.5s ${SPRING} both; }
  .count-in   { animation: countIn 0.6s ${SPRING} both; }
  @media (max-width:640px){ .nav-desktop{display:none!important} .nav-mobile{display:flex!important} }
`;

// ── Animated input (hero) ─────────────────────────────────────────────────
function AnimatedInput({ onCta }) {
  const [inputText,  setInputText]  = useState("");
  const [results,    setResults]    = useState([]);
  const [analyzing,  setAnalyzing]  = useState(false);
  const [userMode,   setUserMode]   = useState(false);
  const cancel = useRef(false);

  useEffect(() => {
    if (userMode) return;
    cancel.current = false;
    const sleep  = ms => new Promise(r => setTimeout(r, ms));
    const dead   = () => cancel.current;

    const run = async () => {
      let si = 0;
      while (!dead()) {
        const seq = SEQUENCES[si++ % SEQUENCES.length];
        for (let i = 1; i <= seq.input.length; i++) {
          if (dead()) return;
          setInputText(seq.input.slice(0, i));
          const ch = seq.input[i - 1];
          await sleep(/[,.]/.test(ch) ? 200 : Math.random() * 28 + 32);
        }
        if (dead()) return;
        setAnalyzing(true);
        await sleep(900);
        if (dead()) return;
        setAnalyzing(false);
        for (let i = 0; i < seq.results.length; i++) {
          if (dead()) return;
          setResults(p => [...p, seq.results[i]]);
          await sleep(600);
        }
        await sleep(3600);
        if (dead()) return;
        setInputText("");
        setResults([]);
        await sleep(600);
      }
    };
    run();
    return () => { cancel.current = true; };
  }, [userMode]);

  const handleClick = () => {
    cancel.current = true;
    setUserMode(true);
    setInputText("");
    setResults([]);
    setAnalyzing(false);
  };

  return (
    <div style={{ width:"100%", maxWidth:660, margin:"0 auto" }}>
      {/* Input bar */}
      <div onClick={handleClick} style={{
        display:"flex", alignItems:"center", gap:14,
        background:"rgba(255,255,255,0.04)",
        border:`1px solid ${analyzing ? "rgba(37,99,235,0.45)" : "rgba(255,255,255,0.1)"}`,
        borderRadius:16, padding:"20px 24px", cursor:"text",
        transition:`border-color 0.5s ease, box-shadow 0.5s ease`,
        animation: analyzing ? "glow 1.6s ease infinite" : "none",
        boxShadow:"0 1px 40px rgba(0,0,0,0.3)",
      }}>
        <div style={{ flex:1, fontFamily:FB, fontSize:16, color:"rgba(255,255,255,0.82)", lineHeight:1.5, minHeight:22 }}>
          {userMode
            ? <span style={{ color:dim }}>Describe yourself — your skills, time, goals…</span>
            : <>
                {inputText}
                {!analyzing && <span style={{ animation:"blink 1s step-end infinite", color:C.primary }}>|</span>}
              </>
          }
        </div>
        {analyzing
          ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, animation:"spin 0.8s linear infinite" }}>
              <circle cx="8" cy="8" r="6" stroke={border} strokeWidth="1.5"/>
              <path d="M8 2a6 6 0 0 1 6 6" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, opacity:0.25 }}>
              <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        }
      </div>

      {/* Results */}
      {!userMode && results.length > 0 && (
        <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:8 }}>
          {results.map((r, i) => (
            <div key={i} className="result-in" style={{
              background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`,
              borderRadius:13, padding:"15px 20px",
              animationDelay: `${i * 80}ms`,
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <span style={{ fontFamily:FH, fontWeight:600, fontSize:14, color:"#fff", letterSpacing:"-0.025em" }}>{r.name}</span>
                <span style={{ fontFamily:FH, fontWeight:700, fontSize:13, color:"rgba(255,255,255,0.7)", letterSpacing:"-0.02em" }}>{r.score}%</span>
              </div>
              <div style={{ fontSize:12, color:dim, fontFamily:FB, lineHeight:1.55 }}>{r.note}</div>
            </div>
          ))}
        </div>
      )}

      {/* User CTA */}
      {userMode && (
        <div style={{ marginTop:14, animation:"fadeUp 0.5s ease both" }}>
          <button onClick={onCta} style={{
            ...btn(C.grad,"#fff",15), padding:"15px", borderRadius:13,
            width:"100%", boxShadow:"0 8px 40px rgba(37,99,235,0.3)", letterSpacing:"-0.01em",
          }}>
            Create free account to analyze your profile →
          </button>
          <p style={{ fontSize:11, color:subtle, fontFamily:FB, textAlign:"center", margin:"10px 0 0" }}>7 days free · No credit card</p>
        </div>
      )}
    </div>
  );
}

// ── Build section ─────────────────────────────────────────────────────────
function BuildSection() {
  const ref  = useRef(null);
  const seen = useInView(ref, 0.2);
  const [states, setStates] = useState(BUILD_STEPS.map(() => "pending"));

  useEffect(() => {
    if (!seen) return;
    let alive = true;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const run = async () => {
      await sleep(400);
      for (let i = 0; i < BUILD_STEPS.length; i++) {
        if (!alive) return;
        setStates(p => p.map((s, idx) => idx === i ? "loading" : s));
        await sleep(BUILD_STEPS[i].ms);
        if (!alive) return;
        setStates(p => p.map((s, idx) => idx === i ? "done" : s));
        await sleep(220);
      }
    };
    run();
    return () => { alive = false; };
  }, [seen]);

  return (
    <section ref={ref} style={{ padding:"130px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <A><h2 style={H2}>Built while you watch.</h2></A>
        <div style={{ marginTop:56, display:"flex", flexDirection:"column", gap:0 }}>
          {BUILD_STEPS.map((s, i) => {
            const st = states[i];
            return (
              <div key={i} style={{
                display:"flex", alignItems:"center", gap:18,
                padding:"16px 0", borderBottom: i < BUILD_STEPS.length - 1 ? `1px solid ${border}` : "none",
                opacity: st === "pending" ? 0.28 : 1,
                transition:`opacity 0.6s ${SPRING}`,
              }}>
                {/* Indicator */}
                <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                  border: st === "done" ? "1.5px solid rgba(255,255,255,0.3)" : `1.5px solid ${st === "loading" ? C.primary : border}`,
                  background: st === "done" ? "rgba(255,255,255,0.06)" : "transparent",
                  transition:`all 0.5s ${SPRING}`,
                }}>
                  {st === "loading" && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation:"spin 0.8s linear infinite" }}>
                      <circle cx="6" cy="6" r="4.5" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5"/>
                      <path d="M6 1.5a4.5 4.5 0 0 1 4.5 4.5" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                  {st === "done" && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5l2 2L8 3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{
                  fontFamily: st === "loading" ? FH : FB,
                  fontWeight: st === "loading" ? 600 : 400,
                  fontSize:15, color: st === "done" ? dim : st === "loading" ? "#fff" : dim,
                  letterSpacing: st === "loading" ? "-0.025em" : "normal",
                  transition:`all 0.5s ${SPRING}`,
                }}>{s.label}</span>
                {st === "loading" && (
                  <span style={{ fontSize:11, color:C.primary, fontFamily:FB, marginLeft:"auto", animation:"blink 1.4s ease infinite" }}>in progress</span>
                )}
                {st === "done" && (
                  <span style={{ fontSize:11, color:dim, fontFamily:FB, marginLeft:"auto" }}>done</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Marketing section ─────────────────────────────────────────────────────
function MarketingSection() {
  const ref  = useRef(null);
  const seen = useInView(ref, 0.2);
  const [captionText, setCaptionText] = useState("");
  const [metaItems,   setMetaItems]   = useState([]);
  const cancel = useRef(false);

  useEffect(() => {
    if (!seen) return;
    cancel.current = false;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const dead  = () => cancel.current;

    const run = async () => {
      await sleep(500);
      for (let i = 1; i <= MARKETING_CAPTION.length; i++) {
        if (dead()) return;
        setCaptionText(MARKETING_CAPTION.slice(0, i));
        await sleep(/[\n]/.test(MARKETING_CAPTION[i - 1]) ? 180 : 11);
      }
      await sleep(600);
      for (let i = 0; i < MARKETING_META.length; i++) {
        if (dead()) return;
        setMetaItems(p => [...p, MARKETING_META[i]]);
        await sleep(350);
      }
    };
    run();
    return () => { cancel.current = true; };
  }, [seen]);

  return (
    <section ref={ref} style={{ padding:"130px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <A><h2 style={H2}>Content created.<br/>Strategy set.</h2></A>

        <div style={{ marginTop:56, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:14 }}>
          {/* Post card */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`, borderRadius:16, padding:"22px 20px", minHeight:220 }}>
            <div style={{ display:"flex", align:"center", justifyContent:"space-between", marginBottom:16 }}>
              <span style={{ fontSize:10, fontWeight:700, color:dim, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB }}>Instagram · Caption</span>
              <span style={{ width:6, height:6, borderRadius:"50%", background: captionText.length > 0 ? C.primary : subtle, display:"inline-block", transition:`background 0.4s ease`, boxShadow: captionText.length > 0 ? `0 0 8px ${C.primary}88` : "none" }} />
            </div>
            <p style={{ fontFamily:FB, fontSize:13, color:"rgba(255,255,255,0.78)", lineHeight:1.75, whiteSpace:"pre-line", minHeight:100, margin:"0 0 14px" }}>
              {captionText}
              {seen && captionText.length < MARKETING_CAPTION.length && (
                <span style={{ animation:"blink 0.9s step-end infinite", color:C.primary }}>|</span>
              )}
            </p>
          </div>

          {/* Meta / insights */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {metaItems.map((m, i) => (
              <div key={i} className="log-in" style={{
                background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`,
                borderRadius:12, padding:"14px 18px", display:"flex", alignItems:"center", gap:12,
                animationDelay:`${i * 80}ms`,
              }}>
                <svg width="6" height="6" viewBox="0 0 6 6" fill="none" style={{ flexShrink:0 }}>
                  <circle cx="3" cy="3" r="3" fill={C.primary} opacity="0.7"/>
                </svg>
                <span style={{ fontFamily:FB, fontSize:13, color:"rgba(255,255,255,0.72)" }}>{m}</span>
              </div>
            ))}
            {seen && metaItems.length === 0 && (
              <div style={{ padding:"14px 18px", color:subtle, fontFamily:FB, fontSize:13 }}>Analyzing performance…</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Management section ────────────────────────────────────────────────────
function ManagementSection() {
  const ref  = useRef(null);
  const seen = useInView(ref, 0.2);
  const [logItems, setLogItems] = useState([]);

  useEffect(() => {
    if (!seen) return;
    let alive = true;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const run = async () => {
      await sleep(1200);
      for (let i = 0; i < MGMT_LOG.length; i++) {
        if (!alive) return;
        setLogItems(p => [...p, MGMT_LOG[i]]);
        await sleep(500);
      }
    };
    run();
    return () => { alive = false; };
  }, [seen]);

  return (
    <section ref={ref} style={{ padding:"130px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <A><h2 style={H2}>Running while<br/>you sleep.</h2></A>

        {/* Stat tiles */}
        <div style={{ marginTop:56, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
          {MGMT_STATS.map((s, i) => (
            <StatTile key={s.label} stat={s} active={seen} delay={i * 120} />
          ))}
        </div>

        {/* Activity log */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"12px 18px", borderBottom:`1px solid ${border}`, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ADE80", boxShadow:"0 0 8px #4ADE8080", flexShrink:0 }} />
            <span style={{ fontSize:11, color:dim, fontFamily:FB, fontWeight:500 }}>Management agent · live</span>
          </div>
          <div style={{ padding:"4px 0" }}>
            {logItems.length === 0 && seen && (
              <div style={{ padding:"14px 18px", color:subtle, fontSize:12, fontFamily:FB }}>Initializing…</div>
            )}
            {logItems.map((item, i) => (
              <div key={i} className="log-in" style={{
                display:"flex", alignItems:"center", gap:12, padding:"12px 18px",
                borderBottom: i < logItems.length - 1 ? `1px solid ${border}` : "none",
                animationDelay:`${i * 60}ms`,
              }}>
                <svg width="5" height="5" viewBox="0 0 5 5" fill="none" style={{ flexShrink:0 }}>
                  <circle cx="2.5" cy="2.5" r="2.5" fill={dim}/>
                </svg>
                <span style={{ fontSize:13, color:"rgba(255,255,255,0.65)", fontFamily:FB, flex:1 }}>{item}</span>
                <span style={{ fontSize:11, color:subtle, fontFamily:FB, flexShrink:0 }}>just now</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatTile({ stat, active, delay }) {
  const val = useCounter(stat.target, active, 1800);
  return (
    <div className={active ? "count-in" : ""} style={{
      background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`,
      borderRadius:12, padding:"16px 14px",
      animationDelay:`${delay}ms`,
    }}>
      <div style={{ fontFamily:FH, fontWeight:700, fontSize:22, color:"#fff", letterSpacing:"-0.04em", marginBottom:4 }}>
        {stat.prefix}{val.toLocaleString()}{stat.suffix}
      </div>
      <div style={{ fontSize:11, color:dim, fontFamily:FB }}>{stat.label}</div>
    </div>
  );
}

// ── Heading style ─────────────────────────────────────────────────────────
const H2 = {
  fontFamily: FH,
  fontWeight: 700,
  fontSize: "clamp(32px,5vw,52px)",
  color: "#fff",
  letterSpacing: "-0.045em",
  lineHeight: 1.06,
  margin: 0,
};

// ── Nav ────────────────────────────────────────────────────────────────────
function Nav({ onCta }) {
  const [open, setOpen] = useState(false);
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, height:54, display:"flex", alignItems:"center", padding:"0 28px", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", background:"rgba(10,10,15,0.75)", borderBottom:`1px solid ${border}` }}>
      <div style={{ maxWidth:980, margin:"0 auto", width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Logo size={18}/>
          <span style={{ fontFamily:FH, fontWeight:700, fontSize:13, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.02em" }}>EARNEDLAB</span>
        </div>
        <div className="nav-desktop" style={{ display:"flex", alignItems:"center", gap:4 }}>
          <a href="#process"  style={NAV_LINK}>How it works</a>
          <a href="#pricing"  style={NAV_LINK}>Pricing</a>
          <Link to="/signup"  style={{ ...NAV_LINK, border:`1px solid ${border}`, borderRadius:8, marginLeft:8, marginRight:4 }}>Sign in</Link>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",12), padding:"7px 16px", borderRadius:8 }}>Start free →</button>
        </div>
        <button className="nav-mobile" onClick={() => setOpen(o=>!o)} aria-label="Menu"
          style={{ display:"none", background:"none", border:"none", cursor:"pointer", padding:6, color:"rgba(255,255,255,0.7)" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></> : <><line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/></>}
          </svg>
        </button>
      </div>
      {open && (
        <div style={{ position:"absolute", top:54, left:0, right:0, background:"rgba(10,10,15,0.97)", borderBottom:`1px solid ${border}`, padding:"8px 0 16px" }}>
          <a href="#process" onClick={() => setOpen(false)} style={{ display:"block", fontSize:15, color:dim, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>How it works</a>
          <a href="#pricing"  onClick={() => setOpen(false)} style={{ display:"block", fontSize:15, color:dim, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>Pricing</a>
          <div style={{ height:1, background:border, margin:"8px 28px" }} />
          <Link to="/signup" onClick={() => setOpen(false)} style={{ display:"block", fontSize:15, color:dim, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>Sign in</Link>
          <div style={{ padding:"8px 28px 0" }}>
            <button onClick={() => { setOpen(false); onCta(); }} style={{ ...btn(C.grad,"#fff",14), width:"100%", padding:"12px", borderRadius:10 }}>Start free →</button>
          </div>
        </div>
      )}
    </nav>
  );
}

const NAV_LINK = { fontSize:13, color:dim, textDecoration:"none", padding:"6px 12px", fontFamily:FB };

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero({ onCta }) {
  return (
    <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"110px 24px 90px", position:"relative", overflow:"hidden", textAlign:"center" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 75% 55% at 50% -5%, rgba(100,60,220,0.2), transparent)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 45% 35% at 80% 75%, rgba(8,145,178,0.07), transparent)", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:700 }}>
        <div style={{ animation:"fadeUp 1s ease both" }}>
          <h1 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(40px,6vw,66px)", color:"#fff", lineHeight:1.06, letterSpacing:"-0.048em", margin:"0 0 52px" }}>
            Build the business<br/>
            <span style={{ background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>you've been putting off.</span>
          </h1>
        </div>
        <div style={{ animation:"fadeUp 1s ease 200ms both" }}>
          <AnimatedInput onCta={onCta} />
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────
function Pricing({ onCta }) {
  const tiers = [
    { id:"starter",   name:"Starter",       price:39,  popular:false, tagline:"Insights and planning.",
      features:["Marketing insights & analysis","Revenue & lead tracking","Business planning tools","Email support"] },
    { id:"pro",       name:"Pro",           price:89,  popular:true,  tagline:"Agents act on your behalf.",
      features:["Everything in Starter","Management agent implements changes","Live website updates on demand","Priority support"] },
    { id:"autopilot", name:"Pro Autopilot", price:199, popular:false, tagline:"Fully autonomous.",
      features:["Everything in Pro","Agents run on a schedule","No manual input required","Dedicated support"] },
  ];

  return (
    <section id="pricing" style={{ padding:"130px 24px", borderTop:`1px solid ${border}` }}>
      <div style={{ maxWidth:860, margin:"0 auto" }}>
        <A><h2 style={H2}>Start free.</h2></A>
        <A delay={80}><p style={{ fontFamily:FB, fontSize:14, color:dim, margin:"14px 0 64px" }}>7-day free trial on all plans. No credit card required.</p></A>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14, alignItems:"start" }}>
          {tiers.map((t, i) => (
            <A key={t.id} delay={i * 80}>
              <div style={{ background: t.popular ? "rgba(37,99,235,0.05)" : "rgba(255,255,255,0.02)", border:`1.5px solid ${t.popular ? "rgba(37,99,235,0.35)" : border}`, borderRadius:16, padding:"24px 20px", position:"relative", height:"100%" }}>
                {t.popular && <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:C.primary, color:"#fff", fontSize:10, fontWeight:700, padding:"3px 12px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap", fontFamily:FB }}>Most popular</div>}
                <div style={{ fontSize:10, fontWeight:700, color: t.popular ? C.primary : subtle, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:8 }}>{t.name}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:3, marginBottom:6 }}>
                  <span style={{ fontFamily:FH, fontWeight:700, fontSize:32, color:"#fff", letterSpacing:"-0.04em" }}>${t.price}</span>
                  <span style={{ fontSize:12, color:subtle }}>/mo</span>
                </div>
                <p style={{ fontSize:13, color:dim, margin:"0 0 20px", fontFamily:FB, lineHeight:1.5 }}>{t.tagline}</p>
                <ul style={{ margin:"0 0 24px", padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:8 }}>
                  {t.features.map(f => (
                    <li key={f} style={{ display:"flex", gap:9, alignItems:"flex-start", fontSize:12, color:dim, lineHeight:1.5 }}>
                      <Check size={12} color={t.popular ? C.primary : subtle} strokeWidth={2.5} style={{ flexShrink:0, marginTop:2 }}/>{f}
                    </li>
                  ))}
                </ul>
                <button onClick={onCta} style={{ ...btn(t.popular ? C.primary : "transparent","#fff",12), width:"100%", padding:"10px", border: t.popular ? "none" : `1px solid ${border}`, borderRadius:9, fontFamily:FB, fontWeight:500, transition:`all 0.3s ${SPRING}` }}>
                  Start free trial
                </button>
              </div>
            </A>
          ))}
        </div>

        <A delay={200}><p style={{ fontSize:12, color:subtle, marginTop:24, fontFamily:FB }}>
          Questions? <a href={`mailto:${SUPPORT}`} style={{ color:dim, textDecoration:"underline", textUnderlineOffset:2 }}>Email us</a>.
        </p></A>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────
function Footer({ onCta }) {
  return (
    <footer style={{ borderTop:`1px solid ${border}` }}>
      <div style={{ padding:"110px 24px 90px", textAlign:"center" }}>
        <A><h2 style={{ ...H2, fontSize:"clamp(36px,6vw,64px)", marginBottom:32 }}>Ready.</h2></A>
        <A delay={100}>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",15), padding:"14px 36px", borderRadius:13, boxShadow:"0 8px 40px rgba(37,99,235,0.2)", letterSpacing:"-0.01em" }}>
            Start your free trial →
          </button>
        </A>
      </div>
      <div style={{ padding:"20px 28px 28px", borderTop:`1px solid ${border}` }}>
        <div style={{ maxWidth:980, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <Logo size={14}/>
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:12, color:subtle, letterSpacing:"-0.02em" }}>EarnedLab</span>
            <span style={{ fontSize:11, color:subtle, fontFamily:FB, marginLeft:4 }}>© {new Date().getFullYear()}</span>
          </div>
          <div style={{ display:"flex", gap:18, flexWrap:"wrap", alignItems:"center" }}>
            {[["Terms","/terms"],["Privacy","/privacy"],["Disclaimer","/disclaimer"]].map(([l,p]) => (
              <Link key={p} to={p} style={{ fontSize:12, color:subtle, textDecoration:"none", fontFamily:FB }}>{l}</Link>
            ))}
            <a href={`mailto:${SUPPORT}`} style={{ fontSize:12, color:dim, textDecoration:"none", fontFamily:FB }}>{SUPPORT}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const go = () => navigate("/signup");

  return (
    <div style={{ background:dark, color:"#fff", fontFamily:FB, minHeight:"100vh" }}>
      <style>{CSS}</style>
      <Nav onCta={go} />
      <Hero onCta={go} />
      <div id="process">
        <BuildSection />
        <MarketingSection />
        <ManagementSection />
      </div>
      <Pricing onCta={go} />
      <Footer onCta={go} />
    </div>
  );
}
