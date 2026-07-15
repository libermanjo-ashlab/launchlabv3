import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { C, FH, FB, btn, Logo } from "../components";
import { Check } from "lucide-react";

// ── Tokens ────────────────────────────────────────────────────────────────
const dark   = "#0A0A0F";
const border = "rgba(255,255,255,0.07)";
const dim    = "rgba(255,255,255,0.38)";
const subtle = "rgba(255,255,255,0.16)";
const SPRING = "cubic-bezier(0.16,1,0.3,1)";
const SUPPORT = "support@earnedlab.com";

// ── Global CSS ─────────────────────────────────────────────────────────────
const CSS = `
  html { scroll-behavior: smooth; }
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes floatIn  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes blockIn  { from{opacity:0;transform:translateY(40px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes flipIn   { from{transform:rotateY(90deg)} to{transform:rotateY(0deg)} }
  @keyframes pulse-dot{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
  @keyframes travel   { from{stroke-dashoffset:200} to{stroke-dashoffset:0} }
  @keyframes growLine { from{stroke-dashoffset:600} to{stroke-dashoffset:0} }
  @keyframes slideIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideOut { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-10px)} }
  @keyframes glow-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }

  .result-in  { animation: fadeUp 0.5s ${SPRING} both; }
  .block-in   { animation: blockIn 0.65s ${SPRING} both; }
  .flip-in    { animation: flipIn 0.45s ${SPRING} both; }
  .insight-in { animation: slideIn 0.5s ${SPRING} both; }
  .log-in     { animation: floatIn 0.45s ${SPRING} both; }

  .glow-card {
    transition: box-shadow 0.5s ease, border-color 0.5s ease, transform 0.4s ${SPRING};
  }
  .glow-card:hover {
    box-shadow: 0 0 28px rgba(37,99,235,0.12);
    border-color: rgba(37,99,235,0.3) !important;
    transform: translateY(-1px);
  }
  @media (max-width:640px){ .nav-desktop{display:none!important} .nav-mobile{display:flex!important} }
  @media (max-width:520px){ .stat-grid{grid-template-columns:repeat(2,1fr)!important} }
`;

// ── Data ──────────────────────────────────────────────────────────────────
const SEQUENCES = [
  { input:"Good at writing, 8 hrs/week, startup costs under $200",
    results:[
      {name:"Content Strategy Consulting",score:94,note:"Zero overhead — 2–3 retainer clients fit your timeline perfectly"},
      {name:"Email Newsletter Service",   score:89,note:"Recurring revenue, $0 to start, works in under 5 hrs/week"},
      {name:"Freelance Copywriting",      score:83,note:"You could sign your first client this week"},
    ]},
  { input:"Software background, full-time job, building nights and weekends",
    results:[
      {name:"Developer Micro-SaaS",       score:96,note:"Build once, sell repeatedly — ideal for async part-time founders"},
      {name:"Technical Consulting",       score:91,note:"Premium rates, fully async, no meetings required"},
      {name:"Code Review Service",        score:85,note:"Leverage exactly what you already know"},
    ]},
  { input:"Love working with people, want something I can run locally",
    results:[
      {name:"Business Coaching Practice", score:93,note:"High demand in every city — your network is your first 3 clients"},
      {name:"Local Marketing Agency",     score:88,note:"Small businesses everywhere are chronically underserved"},
      {name:"Personal Training Business", score:81,note:"Low overhead, loyal clients, flexible hours"},
    ]},
];

const BUILD_BLOCKS = [
  {label:"Business model selected",  color:"rgba(37,99,235,0.22)",  border:"rgba(37,99,235,0.4)"},
  {label:"Website and brand built",  color:"rgba(37,99,235,0.18)",  border:"rgba(37,99,235,0.32)"},
  {label:"Launch plan created",      color:"rgba(37,99,235,0.14)",  border:"rgba(37,99,235,0.26)"},
  {label:"Marketing agent connected",color:"rgba(8,145,178,0.16)",  border:"rgba(8,145,178,0.35)"},
  {label:"Management agent active",  color:"rgba(8,145,178,0.12)",  border:"rgba(8,145,178,0.28)"},
];

const CARDS = [
  { id:"caption",  label:"Caption",
    insight:"Tone matches your audience — 6.2% engagement forecast",
    outcome:"+340 profile visits projected this week",
  },
  { id:"calendar", label:"Content Calendar",
    insight:"12 posts scheduled — peak engagement windows set",
    outcome:"30-day coverage · zero content gaps",
  },
  { id:"hashtags", label:"Hashtags",
    insight:"3 clusters · combined reach 2.1M · 0 banned tags",
    outcome:"+2,100 estimated weekly reach",
  },
  { id:"image",    label:"Image Post",
    insight:"Visuals drive 3× engagement for your category",
    outcome:"+180 saves projected on this post",
  },
  { id:"video",    label:"Video / Reel",
    insight:"Reels reach 4× wider audience than static for your niche",
    outcome:"Est. 4,100 reach · 6.1% engagement rate",
  },
];

const MGMT_INSIGHTS = [
  "Instagram reach +34% — TikTok expansion opportunity identified",
  "Facebook CPL down 12% — reallocating $200 to Instagram",
  "3 new client inquiries this week — +41% vs last week",
  "Email open rate 38% — above 22% industry benchmark",
  "Competitor running 8 active ads — breakdown ready",
  "Monthly revenue on track for $11,200 — +33% growth",
  "LinkedIn posts generating 2.3× more leads than average",
  "Best posting time: Tue/Thu 9–11am — calendar updated",
];

const GROWTH_PATHS = [
  "M0,82 C50,80 100,77 150,73 S240,68 300,65",
  "M0,82 C50,78 100,70 150,62 S240,53 300,46",
  "M0,82 C50,75 100,62 150,50 S240,38 300,30",
  "M0,82 C50,72 100,54 150,40 S240,25 300,17",
  "M0,82 C50,69 100,47 150,30 S240,16 300,8",
  "M0,82 C50,66 100,41 150,22 S240,10 300,4",
];

// ── Hooks ──────────────────────────────────────────────────────────────────
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

function useCounter(target, active, duration = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const tick = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target]);
  return val;
}

// ── Fade-up wrapper ────────────────────────────────────────────────────────
function A({ children, delay = 0, style = {} }) {
  const ref  = useRef(null);
  const seen = useInView(ref, 0.1);
  return (
    <div ref={ref} style={{
      opacity: seen ? 1 : 0, transform: seen ? "none" : "translateY(20px)",
      transition: `opacity 0.9s ${SPRING} ${delay}ms, transform 0.9s ${SPRING} ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

// ── Cursor glow ────────────────────────────────────────────────────────────
function CursorGlow() {
  const pos = useRef({ x: -9999, y: -9999 });
  const div = useRef(null);
  useEffect(() => {
    const move = e => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (div.current)
        div.current.style.background =
          `radial-gradient(700px circle at ${e.clientX}px ${e.clientY}px, rgba(37,99,235,0.07), transparent 55%)`;
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={div} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", transition:"background 0.08s linear" }} />;
}

// ── Animated input (hero) ──────────────────────────────────────────────────
function AnimatedInput({ onCta }) {
  const [text,      setText]      = useState("");
  const [results,   setResults]   = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [userMode,  setUserMode]  = useState(false);
  const cancel = useRef(false);

  useEffect(() => {
    if (userMode) return;
    cancel.current = false;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const dead  = ()  => cancel.current;
    const run = async () => {
      let si = 0;
      while (!dead()) {
        const seq = SEQUENCES[si++ % SEQUENCES.length];
        for (let i = 1; i <= seq.input.length; i++) {
          if (dead()) return;
          setText(seq.input.slice(0, i));
          const ch = seq.input[i - 1];
          await sleep(/[,.]/.test(ch) ? 210 : Math.random() * 30 + 34);
        }
        if (dead()) return;
        setAnalyzing(true);
        await sleep(950);
        if (dead()) return;
        setAnalyzing(false);
        for (let i = 0; i < seq.results.length; i++) {
          if (dead()) return;
          setResults(p => [...p, seq.results[i]]);
          await sleep(650);
        }
        await sleep(3800);
        if (dead()) return;
        setText(""); setResults([]);
        await sleep(700);
      }
    };
    run();
    return () => { cancel.current = true; };
  }, [userMode]);

  const handle = () => { cancel.current = true; setUserMode(true); setText(""); setResults([]); setAnalyzing(false); };

  return (
    <div style={{ width:"100%", maxWidth:680, margin:"0 auto" }}>
      <div onClick={handle} style={{
        display:"flex", alignItems:"center", gap:14,
        background:"rgba(255,255,255,0.035)",
        border:`1px solid ${analyzing ? "rgba(37,99,235,0.5)" : "rgba(255,255,255,0.1)"}`,
        borderRadius:18, padding:"22px 26px", cursor:"text",
        transition:"border-color 0.5s ease, box-shadow 0.5s ease",
        boxShadow: analyzing ? "0 0 0 4px rgba(37,99,235,0.1), 0 2px 40px rgba(0,0,0,0.3)" : "0 2px 40px rgba(0,0,0,0.25)",
      }}>
        <div style={{ flex:1, fontFamily:FB, fontSize:16, color:"rgba(255,255,255,0.8)", lineHeight:1.5, minHeight:24 }}>
          {userMode
            ? <span style={{ color:dim }}>Describe yourself — skills, time, goals…</span>
            : <>{text}{!analyzing && <span style={{ animation:"blink 1s step-end infinite", color:C.primary }}>|</span>}</>}
        </div>
        {analyzing
          ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, animation:"spin 0.8s linear infinite" }}>
              <circle cx="8" cy="8" r="6" stroke={border} strokeWidth="1.5"/>
              <path d="M8 2a6 6 0 0 1 6 6" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, opacity:0.22 }}>
              <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>}
      </div>

      {!userMode && results.length > 0 && (
        <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:8 }}>
          {results.map((r, i) => (
            <div key={i} className="result-in glow-card" style={{
              background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`,
              borderRadius:14, padding:"16px 22px", animationDelay:`${i*80}ms`,
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontFamily:FH, fontWeight:600, fontSize:14, color:"#fff", letterSpacing:"-0.025em" }}>{r.name}</span>
                <span style={{ fontFamily:FH, fontWeight:700, fontSize:13, color:dim }}>{r.score}%</span>
              </div>
              <div style={{ fontSize:12, color:dim, fontFamily:FB, lineHeight:1.55 }}>{r.note}</div>
            </div>
          ))}
        </div>
      )}

      {userMode && (
        <div style={{ marginTop:14, animation:"fadeUp 0.45s ease both" }}>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",15), padding:"15px", borderRadius:14,
            width:"100%", boxShadow:"0 8px 40px rgba(37,99,235,0.28)", letterSpacing:"-0.01em" }}>
            Create free account to analyze your profile →
          </button>
          <p style={{ fontSize:11, color:subtle, fontFamily:FB, textAlign:"center", margin:"10px 0 0" }}>7 days free · No credit card</p>
        </div>
      )}
    </div>
  );
}

// ── Build section (stacking blocks) ───────────────────────────────────────
function BuildSection() {
  const ref  = useRef(null);
  const seen = useInView(ref, 0.2);
  const [done, setDone] = useState(-1); // index of last completed block

  useEffect(() => {
    if (!seen) return;
    let alive = true;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const run = async () => {
      await sleep(300);
      for (let i = 0; i < BUILD_BLOCKS.length; i++) {
        if (!alive) return;
        await sleep(800);
        setDone(i);
      }
    };
    run();
    return () => { alive = false; };
  }, [seen]);

  return (
    <section ref={ref} style={{ padding:"130px 24px", borderTop:`1px solid ${border}`, position:"relative" }}
      onMouseEnter={e => e.currentTarget.style.background="rgba(37,99,235,0.015)"}
      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <A><h2 style={H2}>Built while<br/>you watch.</h2></A>

        {/* Stacking blocks */}
        <div style={{ marginTop:60, display:"flex", flexDirection:"column", gap:0, position:"relative" }}>
          {BUILD_BLOCKS.map((b, i) => {
            const visible   = seen && i <= done + 1;
            const completed = i <= done;
            const active    = i === done + 1 && seen;
            return (
              <div key={i} className={visible ? "block-in" : ""} style={{
                animationDelay:`${i * 80}ms`,
                opacity: visible ? 1 : 0,
                marginBottom: i < BUILD_BLOCKS.length - 1 ? 3 : 0,
              }}>
                <div style={{
                  display:"flex", alignItems:"center", gap:16,
                  background: completed ? b.color : active ? "rgba(37,99,235,0.06)" : "rgba(255,255,255,0.02)",
                  border:`1.5px solid ${completed ? b.border : active ? "rgba(37,99,235,0.25)" : border}`,
                  borderRadius: i === 0 ? "12px 12px 4px 4px"
                              : i === BUILD_BLOCKS.length - 1 ? "4px 4px 12px 12px"
                              : "4px",
                  padding:"16px 20px",
                  transition:`all 0.7s ${SPRING}`,
                  boxShadow: completed ? `0 2px 16px ${b.border.replace("0.4","0.12")}` : "none",
                }}>
                  {/* Block number */}
                  <span style={{ fontFamily:FH, fontWeight:700, fontSize:11,
                    color: completed ? "rgba(255,255,255,0.5)" : active ? C.primary : subtle,
                    letterSpacing:"0.06em", width:18, flexShrink:0, transition:`color 0.5s ease` }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Label */}
                  <span style={{ fontFamily: completed ? FB : FH, fontWeight: completed ? 400 : 600,
                    fontSize:14, color: completed ? dim : active ? "#fff" : subtle,
                    letterSpacing: active ? "-0.02em" : "normal", flex:1,
                    transition:`all 0.5s ${SPRING}` }}>
                    {b.label}
                  </span>

                  {/* State indicator */}
                  <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                    border: `1.5px solid ${completed ? "rgba(255,255,255,0.25)" : active ? C.primary : border}`,
                    background: completed ? "rgba(255,255,255,0.08)" : "transparent",
                    transition:`all 0.5s ${SPRING}` }}>
                    {active && !completed && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ animation:"spin 0.85s linear infinite" }}>
                        <circle cx="5.5" cy="5.5" r="4" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5"/>
                        <path d="M5.5 1.5a4 4 0 0 1 4 4" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                    {completed && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5l2 2L7.5 2" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Card content visuals ───────────────────────────────────────────────────
function CaptionCardContent() {
  return (
    <div style={{ padding:"18px 16px 14px" }}>
      <div style={{ fontSize:10, color:dim, fontFamily:FB, marginBottom:12 }}>@yourbusiness · Instagram</div>
      <div style={{ fontSize:12.5, color:"rgba(255,255,255,0.78)", fontFamily:FB, lineHeight:1.75 }}>
        Stop outsourcing your brand voice to someone who doesn't know your business.{"\n\n"}
        Your clients aren't looking for a vendor. They're looking for the person who gets it.
      </div>
    </div>
  );
}

function CalendarCardContent() {
  const days = ["M","T","W","T","F","S","S"];
  const posted = new Set([1,3,5,8,10,12,15,17,19,22,24,26]);
  return (
    <div style={{ padding:"16px" }}>
      <div style={{ fontSize:10, color:dim, fontFamily:FB, marginBottom:12 }}>Content Calendar · July</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
        {days.map(d => (
          <div key={d} style={{ textAlign:"center", fontSize:9, color:subtle, fontFamily:FB, paddingBottom:4 }}>{d}</div>
        ))}
        {Array.from({length:31},(_,i)=>i+1).map(d => (
          <div key={d} style={{
            height:22, borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center",
            background: posted.has(d) ? "rgba(37,99,235,0.35)" : "rgba(255,255,255,0.04)",
            border: posted.has(d) ? "1px solid rgba(37,99,235,0.5)" : `1px solid ${border}`,
            fontSize:9, color: posted.has(d) ? "rgba(255,255,255,0.8)" : dim, fontFamily:FB,
          }}>{d}</div>
        ))}
      </div>
    </div>
  );
}

function HashtagCardContent() {
  const tags = ["#yourbusiness","#freelance","#smallbiz","#entrepreneur","#contentcreator","#growthmindset","#startuplife","#marketing","#digitalmarketing","#brandstrategy"];
  const colors = ["rgba(37,99,235,0.3)","rgba(8,145,178,0.25)","rgba(100,60,220,0.25)"];
  return (
    <div style={{ padding:"16px" }}>
      <div style={{ fontSize:10, color:dim, fontFamily:FB, marginBottom:12 }}>Hashtag Clusters · 3 groups</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {tags.map((t,i) => (
          <span key={t} style={{ fontSize:11, fontFamily:FB, color:"rgba(255,255,255,0.75)", padding:"4px 9px",
            borderRadius:20, background:colors[i % colors.length], border:`1px solid rgba(255,255,255,0.1)` }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function ImageCardContent() {
  return (
    <div style={{ padding:"14px 16px" }}>
      <div style={{ fontSize:10, color:dim, fontFamily:FB, marginBottom:10 }}>Image Post · Instagram</div>
      <div style={{ height:110, borderRadius:10, background:"linear-gradient(135deg,rgba(37,99,235,0.35),rgba(8,145,178,0.25),rgba(100,60,220,0.2))", border:`1px solid rgba(255,255,255,0.08)`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="2" y="2" width="24" height="24" rx="4" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/><path d="M2 18l7-7 5 5 3-3 9 9" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="20" cy="8" r="2.5" fill="rgba(255,255,255,0.25)"/></svg>
      </div>
      <div style={{ fontSize:11, color:dim, fontFamily:FB }}>Generated from your brand guidelines</div>
    </div>
  );
}

function VideoCardContent() {
  return (
    <div style={{ padding:"14px 16px" }}>
      <div style={{ fontSize:10, color:dim, fontFamily:FB, marginBottom:10 }}>Video / Reel · Instagram</div>
      <div style={{ height:110, borderRadius:10, background:"linear-gradient(160deg,rgba(100,60,220,0.3),rgba(37,99,235,0.25),rgba(8,145,178,0.2))", border:`1px solid rgba(255,255,255,0.08)`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", marginBottom:10, overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent 40%,rgba(10,10,15,0.5))", borderRadius:10 }}/>
        <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", border:"1.5px solid rgba(255,255,255,0.2)" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l7 4-7 4V3z" fill="rgba(255,255,255,0.8)"/></svg>
        </div>
        <div style={{ position:"absolute", bottom:8, left:10, right:10, height:2, borderRadius:2, background:"rgba(255,255,255,0.1)" }}>
          <div style={{ width:"32%", height:"100%", borderRadius:2, background:C.primary }}/>
        </div>
      </div>
      <div style={{ fontSize:11, color:dim, fontFamily:FB }}>Script + voiceover generated · 30s format</div>
    </div>
  );
}

const CARD_BODIES = {
  caption:  <CaptionCardContent/>,
  calendar: <CalendarCardContent/>,
  hashtags: <HashtagCardContent/>,
  image:    <ImageCardContent/>,
  video:    <VideoCardContent/>,
};

// ── Marketing section ──────────────────────────────────────────────────────
function MarketingSection({ onFlip, flipCount }) {
  const ref  = useRef(null);
  const seen = useInView(ref, 0.2);

  const [cardIdx,  setCardIdx]  = useState(0);
  const [phase,    setPhase]    = useState("idle");
  const [insight,  setInsight]  = useState(null);
  const [showPost, setShowPost] = useState(false);
  const nextRef = useRef(1);
  const timerRef = useRef(null);

  const doFlip = useCallback(() => {
    if (phase !== "idle") return;
    const next = (cardIdx + 1) % CARDS.length;
    nextRef.current = next;
    setPhase("out");
    setTimeout(() => {
      setCardIdx(next);
      setPhase("in");
      setInsight(null);
      onFlip(next);
      setTimeout(() => {
        setPhase("idle");
        setInsight(CARDS[next]);
        if (next === CARDS.length - 1) setShowPost(true);
      }, 450);
    }, 320);
  }, [phase, cardIdx, onFlip]);

  useEffect(() => {
    if (!seen) return;
    setTimeout(() => setInsight(CARDS[0]), 600);
    timerRef.current = setInterval(doFlip, 3600);
    return () => clearInterval(timerRef.current);
  }, [seen, doFlip]);

  const card = CARDS[cardIdx];

  return (
    <section ref={ref} style={{ padding:"130px 24px 80px", borderTop:`1px solid ${border}`, position:"relative" }}
      onMouseEnter={e => e.currentTarget.style.background="rgba(8,145,178,0.015)"}
      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <A><h2 style={H2}>Content created.<br/>Strategy set.</h2></A>

        <div style={{ marginTop:56, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {/* Card deck */}
          <div>
            <div style={{ fontSize:10, color:dim, fontFamily:FB, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
              {card.label}
            </div>
            <div style={{ perspective:1200 }}>
              <div
                className={phase === "in" ? "flip-in" : ""}
                style={{
                  background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`, borderRadius:16,
                  minHeight:220, overflow:"hidden",
                  transform: phase === "out" ? "rotateY(-90deg)" : "rotateY(0deg)",
                  transition: phase === "out" ? `transform 0.32s ease-in` : "none",
                  transformOrigin:"50% 50%",
                  boxShadow:"0 4px 30px rgba(0,0,0,0.25)",
                }}>
                {CARD_BODIES[card.id]}
              </div>
            </div>

            {/* Deck dots */}
            <div style={{ display:"flex", gap:6, marginTop:12, justifyContent:"center" }}>
              {CARDS.map((_,i) => (
                <div key={i} style={{ width: i===cardIdx ? 14 : 5, height:5, borderRadius:3,
                  background: i===cardIdx ? C.primary : border,
                  transition:`all 0.4s ${SPRING}` }}/>
              ))}
            </div>

            {/* Post button */}
            {showPost && (
              <div style={{ marginTop:14, animation:"fadeUp 0.5s ease both" }}>
                <button style={{ width:"100%", padding:"10px", borderRadius:10, border:`1px solid rgba(37,99,235,0.35)`,
                  background:"rgba(37,99,235,0.08)", color:"rgba(255,255,255,0.8)", fontFamily:FB, fontSize:12, cursor:"pointer",
                  transition:`all 0.3s ${SPRING}` }}
                  onMouseEnter={e => { e.target.style.background="rgba(37,99,235,0.18)"; e.target.style.color="#fff"; }}
                  onMouseLeave={e => { e.target.style.background="rgba(37,99,235,0.08)"; e.target.style.color="rgba(255,255,255,0.8)"; }}>
                  Post all content →
                </button>
              </div>
            )}
          </div>

          {/* Insights */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {insight && (
              <>
                <div className="insight-in" key={`insight-${cardIdx}`} style={{
                  background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`, borderRadius:12, padding:"14px 16px",
                }}>
                  <div style={{ fontSize:10, color:C.primary, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:6 }}>Market insight</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.72)", fontFamily:FB, lineHeight:1.6 }}>{insight.insight}</div>
                </div>
                <div className="insight-in" key={`outcome-${cardIdx}`} style={{
                  background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`, borderRadius:12, padding:"14px 16px",
                  animationDelay:"120ms",
                }}>
                  <div style={{ fontSize:10, color:dim, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:6 }}>Expected outcome</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.72)", fontFamily:FB, lineHeight:1.6 }}>{insight.outcome}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Connection pulse (between sections) ────────────────────────────────────
function ConnectionPulse({ active }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"0 0 0", gap:0 }}>
      <svg width="2" height="64" viewBox="0 0 2 64" fill="none" style={{ overflow:"visible" }}>
        <line x1="1" y1="0" x2="1" y2="64" stroke={border} strokeWidth="1.5" strokeDasharray="4 3"/>
        {active && (
          <circle r="4" fill={C.primary} style={{ filter:"drop-shadow(0 0 6px rgba(37,99,235,0.8))" }}>
            <animateMotion dur="1.2s" repeatCount="indefinite" path="M1,0 L1,64"/>
          </circle>
        )}
      </svg>
    </div>
  );
}

// ── Growth chart ───────────────────────────────────────────────────────────
function GrowthChart({ flipCount, active }) {
  const pathIdx = Math.min(flipCount, GROWTH_PATHS.length - 1);
  const areaId  = "areaGrad";

  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${border}`, borderRadius:14, padding:"16px", marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <span style={{ fontSize:10, color:dim, fontFamily:FB, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>Revenue trend</span>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.6)", fontFamily:FH, fontWeight:700, letterSpacing:"-0.02em" }}>
          ${(6000 + flipCount * 400).toLocaleString()}/mo
        </span>
      </div>
      <svg viewBox="0 0 300 90" width="100%" height="80" preserveAspectRatio="none" style={{ overflow:"visible" }}>
        <defs>
          <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.primary} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={C.primary} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path
          d={`${GROWTH_PATHS[pathIdx]} L300,90 L0,90 Z`}
          fill={`url(#${areaId})`}
          style={{ transition: active ? "d 1.2s cubic-bezier(0.16,1,0.3,1)" : "none" }}
        />
        {/* Line */}
        <path
          d={GROWTH_PATHS[pathIdx]}
          fill="none"
          stroke={C.primary}
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ transition: active ? "d 1.2s cubic-bezier(0.16,1,0.3,1)" : "none" }}
        />
      </svg>
    </div>
  );
}

// ── Management insights feed ───────────────────────────────────────────────
function InsightsFeed({ active }) {
  const [items, setItems] = useState([]);
  const idx = useRef(0);

  useEffect(() => {
    if (!active) return;
    const add = () => {
      const item = { id: Date.now(), text: MGMT_INSIGHTS[idx.current % MGMT_INSIGHTS.length] };
      idx.current++;
      setItems(p => [item, ...p].slice(0, 4));
    };
    add();
    const t = setInterval(add, 2600);
    return () => clearInterval(t);
  }, [active]);

  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${border}`, borderRadius:14, overflow:"hidden" }}>
      <div style={{ padding:"10px 16px", borderBottom:`1px solid ${border}`, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ADE80", boxShadow:"0 0 8px #4ADE8080", flexShrink:0, animation:"pulse-dot 2s ease infinite" }}/>
        <span style={{ fontSize:10, color:dim, fontFamily:FB, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>Live insights</span>
      </div>
      <div style={{ padding:"4px 0", minHeight:120 }}>
        {items.map((item, i) => (
          <div key={item.id} className="log-in" style={{
            display:"flex", gap:10, alignItems:"flex-start", padding:"10px 16px",
            borderBottom: i < items.length - 1 ? `1px solid ${border}` : "none",
            opacity: i === 0 ? 1 : 1 - i * 0.18,
            transition:`opacity 0.5s ease`,
            animationDelay:`${i * 40}ms`,
          }}>
            <svg width="5" height="5" viewBox="0 0 5 5" fill="none" style={{ flexShrink:0, marginTop:5 }}>
              <circle cx="2.5" cy="2.5" r="2.5" fill={dim}/>
            </svg>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontFamily:FB, lineHeight:1.55 }}>{item.text}</span>
          </div>
        ))}
        {items.length === 0 && <div style={{ padding:"14px 16px", color:subtle, fontSize:12, fontFamily:FB }}>Initializing…</div>}
      </div>
    </div>
  );
}

// ── Return flow (management → marketing) ──────────────────────────────────
function ReturnFlow({ active }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:"rgba(255,255,255,0.02)", border:`1px solid ${border}`, borderRadius:12, marginTop:12 }}>
      <svg width="24" height="12" viewBox="0 0 24 12" fill="none" style={{ flexShrink:0 }}>
        <path d="M22 6H2M8 2L2 6l6 4" stroke={active ? C.primary : border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition:`stroke 0.5s ease` }}/>
      </svg>
      <span style={{ fontSize:11, color: active ? dim : subtle, fontFamily:FB, transition:`color 0.5s ease` }}>
        Insights sent back to marketing agent
      </span>
      {active && <span style={{ marginLeft:"auto", fontSize:10, color:C.primary, fontFamily:FB, animation:"glow-pulse 2s ease infinite" }}>live</span>}
    </div>
  );
}

// ── Management section ─────────────────────────────────────────────────────
function ManagementSection({ flipCount }) {
  const ref    = useRef(null);
  const seen   = useInView(ref, 0.2);
  const active = seen;

  const rev  = useCounter(8400 + flipCount * 400, active);
  const cli  = useCounter(7, active, 1200);
  const comp = useCounter(73, active, 1400);
  const hlth = useCounter(94, active, 1600);

  return (
    <section ref={ref} style={{ padding:"80px 24px 130px", borderTop:`1px solid ${border}`, position:"relative" }}
      onMouseEnter={e => e.currentTarget.style.background="rgba(37,99,235,0.015)"}
      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <A><h2 style={H2}>Running while<br/>you sleep.</h2></A>

        {/* Stat tiles */}
        <div className="stat-grid" style={{ marginTop:56, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
          {[
            { label:"Revenue",    val:`$${rev.toLocaleString()}` },
            { label:"Clients",    val:cli },
            { label:"Completion", val:`${comp}%` },
            { label:"Health",     val:`${hlth}` },
          ].map((s,i) => (
            <A key={s.label} delay={i*80}>
              <div className="glow-card" style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`, borderRadius:12, padding:"16px 14px" }}>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:22, color:"#fff", letterSpacing:"-0.04em", marginBottom:4 }}>{s.val}</div>
                <div style={{ fontSize:10, color:dim, fontFamily:FB }}>{s.label}</div>
              </div>
            </A>
          ))}
        </div>

        <GrowthChart flipCount={flipCount} active={active} />
        <InsightsFeed active={active} />
        <ReturnFlow active={active && flipCount > 0} />
      </div>
    </section>
  );
}

// ── Heading style ──────────────────────────────────────────────────────────
const H2 = {
  fontFamily: FH, fontWeight:700,
  fontSize:"clamp(32px,5vw,52px)",
  color:"#fff", letterSpacing:"-0.045em",
  lineHeight:1.06, margin:0,
};

// ── Nav ────────────────────────────────────────────────────────────────────
function Nav({ onCta }) {
  const [open, setOpen] = useState(false);
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, height:54, display:"flex", alignItems:"center", padding:"0 28px", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", background:"rgba(10,10,15,0.8)", borderBottom:`1px solid ${border}` }}>
      <div style={{ maxWidth:980, margin:"0 auto", width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Logo size={18}/>
          <span style={{ fontFamily:FH, fontWeight:700, fontSize:13, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.02em" }}>EARNEDLAB</span>
        </div>
        <div className="nav-desktop" style={{ display:"flex", alignItems:"center", gap:4 }}>
          <a href="#process"  style={{ fontSize:13, color:dim, textDecoration:"none", padding:"6px 12px", fontFamily:FB, transition:"color 0.3s ease" }} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color=dim}>How it works</a>
          <a href="#pricing"  style={{ fontSize:13, color:dim, textDecoration:"none", padding:"6px 12px", fontFamily:FB, transition:"color 0.3s ease" }} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color=dim}>Pricing</a>
          <Link to="/signup"  style={{ fontSize:13, color:dim, textDecoration:"none", padding:"6px 14px", fontFamily:FB, border:`1px solid ${border}`, borderRadius:8, marginLeft:8, marginRight:4, transition:"color 0.3s ease, border-color 0.3s ease" }}
            onMouseEnter={e=>{e.target.style.color="#fff";e.target.style.borderColor="rgba(255,255,255,0.2)"}}
            onMouseLeave={e=>{e.target.style.color=dim;e.target.style.borderColor=border}}>Sign in</Link>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",12), padding:"7px 16px", borderRadius:8, transition:`box-shadow 0.3s ease` }}
            onMouseEnter={e=>e.target.style.boxShadow="0 4px 20px rgba(37,99,235,0.4)"}
            onMouseLeave={e=>e.target.style.boxShadow="none"}>Start free →</button>
        </div>
        <button className="nav-mobile" onClick={() => setOpen(o=>!o)} aria-label="Menu"
          style={{ display:"none", background:"none", border:"none", cursor:"pointer", padding:6, color:"rgba(255,255,255,0.7)" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open?<><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></>:<><line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/></>}
          </svg>
        </button>
      </div>
      {open && (
        <div style={{ position:"absolute", top:54, left:0, right:0, background:"rgba(10,10,15,0.97)", borderBottom:`1px solid ${border}`, padding:"8px 0 16px" }}>
          <a href="#process" onClick={()=>setOpen(false)} style={{ display:"block", fontSize:15, color:dim, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>How it works</a>
          <a href="#pricing"  onClick={()=>setOpen(false)} style={{ display:"block", fontSize:15, color:dim, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>Pricing</a>
          <div style={{ height:1, background:border, margin:"8px 28px" }}/>
          <Link to="/signup" onClick={()=>setOpen(false)} style={{ display:"block", fontSize:15, color:dim, textDecoration:"none", padding:"12px 28px", fontFamily:FB }}>Sign in</Link>
          <div style={{ padding:"8px 28px 0" }}>
            <button onClick={()=>{setOpen(false);onCta();}} style={{ ...btn(C.grad,"#fff",14), width:"100%", padding:"12px", borderRadius:10 }}>Start free →</button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero({ onCta }) {
  return (
    <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"110px 24px 90px", position:"relative", overflow:"hidden", textAlign:"center" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 55% at 50% -5%, rgba(100,60,220,0.18), transparent)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 45% 35% at 80% 80%, rgba(8,145,178,0.07), transparent)", pointerEvents:"none" }}/>
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:700 }}>
        <div style={{ animation:"fadeUp 1s ease both" }}>
          <h1 style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(40px,6vw,66px)", color:"#fff", lineHeight:1.06, letterSpacing:"-0.048em", margin:"0 0 52px" }}>
            Build the business<br/>
            <span style={{ background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>you've been putting off.</span>
          </h1>
        </div>
        <div style={{ animation:"fadeUp 1s ease 180ms both" }}>
          <AnimatedInput onCta={onCta}/>
        </div>
      </div>
    </section>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────
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
        <A delay={80}><p style={{ fontFamily:FB, fontSize:14, color:dim, margin:"12px 0 60px" }}>7-day free trial on all plans. No credit card required.</p></A>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14, alignItems:"start" }}>
          {tiers.map((t,i) => (
            <A key={t.id} delay={i*80}>
              <div className="glow-card" style={{ height:"100%", background: t.popular?"rgba(37,99,235,0.05)":"rgba(255,255,255,0.02)", border:`1.5px solid ${t.popular?"rgba(37,99,235,0.35)":border}`, borderRadius:16, padding:"24px 20px", position:"relative" }}>
                {t.popular && <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:C.primary, color:"#fff", fontSize:10, fontWeight:700, padding:"3px 12px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap", fontFamily:FB }}>Most popular</div>}
                <div style={{ fontSize:10, fontWeight:700, color:t.popular?C.primary:subtle, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:8 }}>{t.name}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:3, marginBottom:6 }}>
                  <span style={{ fontFamily:FH, fontWeight:700, fontSize:32, color:"#fff", letterSpacing:"-0.04em" }}>${t.price}</span>
                  <span style={{ fontSize:12, color:subtle }}>/mo</span>
                </div>
                <p style={{ fontSize:13, color:dim, margin:"0 0 20px", fontFamily:FB, lineHeight:1.5 }}>{t.tagline}</p>
                <ul style={{ margin:"0 0 24px", padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:8 }}>
                  {t.features.map(f=>(
                    <li key={f} style={{ display:"flex", gap:9, alignItems:"flex-start", fontSize:12, color:dim, lineHeight:1.5 }}>
                      <Check size={12} color={t.popular?C.primary:subtle} strokeWidth={2.5} style={{ flexShrink:0, marginTop:2 }}/>{f}
                    </li>
                  ))}
                </ul>
                <button onClick={onCta} style={{ ...btn(t.popular?C.primary:"transparent","#fff",12), width:"100%", padding:"10px", border:t.popular?"none":`1px solid ${border}`, borderRadius:9, fontFamily:FB, fontWeight:500, transition:`all 0.3s ${SPRING}` }}
                  onMouseEnter={e=>{ if(!t.popular){e.target.style.borderColor="rgba(255,255,255,0.2)"; e.target.style.color="#fff";}}}
                  onMouseLeave={e=>{ if(!t.popular){e.target.style.borderColor=border; e.target.style.color=dim;}}}>
                  Start free trial
                </button>
              </div>
            </A>
          ))}
        </div>
        <A delay={200}><p style={{ fontSize:12, color:subtle, marginTop:24, fontFamily:FB }}>
          Questions? <a href={`mailto:${SUPPORT}`} style={{ color:dim, textDecoration:"underline", textUnderlineOffset:2 }}>{SUPPORT}</a>
        </p></A>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer({ onCta }) {
  return (
    <footer style={{ borderTop:`1px solid ${border}` }}>
      <div style={{ padding:"110px 24px 90px", textAlign:"center" }}>
        <A><h2 style={{ ...H2, fontSize:"clamp(36px,6vw,64px)", marginBottom:32 }}>Ready.</h2></A>
        <A delay={100}>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",15), padding:"14px 36px", borderRadius:13, boxShadow:"0 8px 40px rgba(37,99,235,0.2)", letterSpacing:"-0.01em", transition:`box-shadow 0.3s ease` }}
            onMouseEnter={e=>e.target.style.boxShadow="0 12px 50px rgba(37,99,235,0.35)"}
            onMouseLeave={e=>e.target.style.boxShadow="0 8px 40px rgba(37,99,235,0.2)"}>
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
            {[["Terms","/terms"],["Privacy","/privacy"],["Disclaimer","/disclaimer"]].map(([l,p])=>(
              <Link key={p} to={p} style={{ fontSize:12, color:subtle, textDecoration:"none", fontFamily:FB, transition:"color 0.3s ease" }}
                onMouseEnter={e=>e.target.style.color=dim} onMouseLeave={e=>e.target.style.color=subtle}>{l}</Link>
            ))}
            <a href={`mailto:${SUPPORT}`} style={{ fontSize:12, color:dim, textDecoration:"none", fontFamily:FB }}>{SUPPORT}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate   = useNavigate();
  const go         = () => navigate("/signup");
  const [flipCount, setFlipCount] = useState(0);
  const onFlip     = useCallback(() => setFlipCount(n => n + 1), []);

  return (
    <div style={{ background:dark, color:"#fff", fontFamily:FB, minHeight:"100vh", position:"relative" }}>
      <style>{CSS}</style>
      <CursorGlow/>
      <Nav onCta={go}/>
      <Hero onCta={go}/>
      <div id="process">
        <BuildSection/>
        <MarketingSection onFlip={onFlip} flipCount={flipCount}/>
        <div style={{ display:"flex", justifyContent:"center", padding:"0 0 0" }}>
          <ConnectionPulse active={flipCount > 0}/>
        </div>
        <ManagementSection flipCount={flipCount}/>
      </div>
      <Pricing onCta={go}/>
      <Footer onCta={go}/>
    </div>
  );
}
