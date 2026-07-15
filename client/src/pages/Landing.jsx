import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { C, FH, FB, btn, Logo } from "../components";
import { Check } from "lucide-react";

// ── Tokens ─────────────────────────────────────────────────────────────────
const dark   = "#0A0A0F";
const border = "rgba(255,255,255,0.07)";
const dim    = "rgba(255,255,255,0.38)";
const subtle = "rgba(255,255,255,0.16)";
const SPRING = "cubic-bezier(0.16,1,0.3,1)";
const SUPPORT = "support@earnedlab.com";

// ── Global CSS ──────────────────────────────────────────────────────────────
const CSS = `
  html { scroll-behavior: smooth; }
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes floatIn   { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes blockIn   { from{opacity:0;transform:translateY(36px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes flipIn    { from{transform:rotateY(90deg)} to{transform:rotateY(0deg)} }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
  @keyframes slideIn   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow-pulse{ 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes shimmer   { 0%{opacity:0.4} 50%{opacity:1} 100%{opacity:0.4} }
  @keyframes plan-glow { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0)} 50%{box-shadow:0 0 28px 4px rgba(37,99,235,0.22)} }

  .result-in  { animation: fadeUp 0.6s ${SPRING} both; }
  .block-in   { animation: blockIn 0.75s ${SPRING} both; }
  .flip-in    { animation: flipIn 0.5s ${SPRING} both; }
  .insight-in { animation: slideIn 0.6s ${SPRING} both; }
  .log-in     { animation: floatIn 0.5s ${SPRING} both; }

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

// ── Data ───────────────────────────────────────────────────────────────────
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
  {label:"Business model selected",   color:"rgba(37,99,235,0.22)", borderCol:"rgba(37,99,235,0.45)"},
  {label:"Website and brand built",   color:"rgba(37,99,235,0.18)", borderCol:"rgba(37,99,235,0.35)"},
  {label:"Launch plan created",       color:"rgba(37,99,235,0.14)", borderCol:"rgba(37,99,235,0.28)"},
  {label:"Marketing agent connected", color:"rgba(8,145,178,0.16)", borderCol:"rgba(8,145,178,0.38)"},
  {label:"Management agent active",   color:"rgba(8,145,178,0.12)", borderCol:"rgba(8,145,178,0.30)"},
];

const CARDS = [
  { id:"caption",  label:"Caption",
    insight:"Tone matches your audience — 6.2% engagement forecast",
    outcome:"+340 profile visits projected this week" },
  { id:"calendar", label:"Content Calendar",
    insight:"12 posts scheduled — peak engagement windows set",
    outcome:"30-day coverage · zero content gaps" },
  { id:"hashtags", label:"Hashtags",
    insight:"3 clusters · combined reach 2.1M · 0 banned tags",
    outcome:"+2,100 estimated weekly reach" },
  { id:"image",    label:"Image Post",
    insight:"Visuals drive 3× engagement for your category",
    outcome:"+180 saves projected on this post" },
  { id:"video",    label:"Video / Reel",
    insight:"Reels reach 4× wider audience than static for your niche",
    outcome:"Est. 4,100 reach · 6.1% engagement rate" },
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

// ── Hooks ───────────────────────────────────────────────────────────────────
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

// Continuously ticking live stat
function useLiveStat(base, tickAmount, tickMs, active) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setVal(v => v + tickAmount), tickMs);
    return () => clearInterval(t);
  }, [active, tickAmount, tickMs]);
  return val;
}

// ── Fade-up wrapper ─────────────────────────────────────────────────────────
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

// ── Cursor glow ─────────────────────────────────────────────────────────────
function CursorGlow() {
  const div = useRef(null);
  useEffect(() => {
    const move = e => {
      if (div.current)
        div.current.style.background =
          `radial-gradient(700px circle at ${e.clientX}px ${e.clientY}px, rgba(37,99,235,0.07), transparent 55%)`;
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={div} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", transition:"background 0.08s linear" }} />;
}

// ── Animated input (hero) ───────────────────────────────────────────────────
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
          // Much slower, more deliberate typing
          const delay = /[,.]/.test(ch) ? Math.random() * 130 + 340   // 340–470ms after punctuation
                      : ch === " "      ? Math.random() * 20  + 65    // slightly faster on spaces
                      :                   Math.random() * 40  + 62;   // 62–102ms normal
          await sleep(delay);
        }
        if (dead()) return;
        setAnalyzing(true);
        await sleep(1500);   // longer thinking pause
        if (dead()) return;
        setAnalyzing(false);
        for (let i = 0; i < seq.results.length; i++) {
          if (dead()) return;
          setResults(p => [...p, seq.results[i]]);
          await sleep(900);  // slower result reveal
        }
        await sleep(5200);   // long display time
        if (dead()) return;
        setText(""); setResults([]);
        await sleep(900);
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
        background:"rgba(255,255,255,0.03)",
        border:`1px solid ${analyzing ? "rgba(37,99,235,0.5)" : "rgba(255,255,255,0.09)"}`,
        borderRadius:20, padding:"24px 28px", cursor:"text",
        transition:"border-color 0.8s ease, box-shadow 0.8s ease",
        boxShadow: analyzing
          ? "0 0 0 4px rgba(37,99,235,0.09), 0 4px 50px rgba(0,0,0,0.35)"
          : "0 4px 50px rgba(0,0,0,0.28)",
      }}>
        <div style={{ flex:1, fontFamily:FB, fontSize:17, color:"rgba(255,255,255,0.82)", lineHeight:1.5, minHeight:26 }}>
          {userMode
            ? <span style={{ color:dim }}>Describe yourself — skills, time, goals…</span>
            : <>{text}{!analyzing && <span style={{ animation:"blink 1.1s step-end infinite", color:C.primary, marginLeft:1 }}>|</span>}</>}
        </div>
        {analyzing
          ? <svg width="17" height="17" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, animation:"spin 1.1s linear infinite" }}>
              <circle cx="8" cy="8" r="6" stroke={border} strokeWidth="1.5"/>
              <path d="M8 2a6 6 0 0 1 6 6" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, opacity:0.18 }}>
              <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>}
      </div>

      {!userMode && results.length > 0 && (
        <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:9 }}>
          {results.map((r, i) => (
            <div key={i} className="result-in glow-card" style={{
              background:"rgba(255,255,255,0.025)", border:`1px solid ${border}`,
              borderRadius:16, padding:"17px 22px", animationDelay:`${i * 100}ms`,
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontFamily:FH, fontWeight:600, fontSize:14, color:"#fff", letterSpacing:"-0.025em" }}>{r.name}</span>
                <span style={{ fontFamily:FH, fontWeight:700, fontSize:13, color:dim }}>{r.score}%</span>
              </div>
              <div style={{ fontSize:12, color:dim, fontFamily:FB, lineHeight:1.6 }}>{r.note}</div>
            </div>
          ))}
        </div>
      )}

      {userMode && (
        <div style={{ marginTop:14, animation:"fadeUp 0.55s ease both" }}>
          <button onClick={onCta} style={{ ...btn(C.grad,"#fff",15), padding:"15px", borderRadius:16,
            width:"100%", boxShadow:"0 8px 40px rgba(37,99,235,0.28)", letterSpacing:"-0.01em" }}>
            Create free account to analyze your profile →
          </button>
          <p style={{ fontSize:11, color:subtle, fontFamily:FB, textAlign:"center", margin:"10px 0 0" }}>7 days free · No credit card</p>
        </div>
      )}
    </div>
  );
}

// ── Business plan doc graphic ───────────────────────────────────────────────
function PlanDoc({ glowing }) {
  return (
    <div style={{
      background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`,
      borderRadius:16, padding:"20px 18px", width:"100%",
      transition:`box-shadow 0.6s ease, border-color 0.6s ease`,
      boxShadow: glowing ? "0 0 30px rgba(37,99,235,0.25), 0 0 60px rgba(37,99,235,0.1)" : "none",
      borderColor: glowing ? "rgba(37,99,235,0.4)" : border,
    }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#fff", fontFamily:FH, marginBottom:14, letterSpacing:"-0.025em" }}>Your Business</div>
      {/* Simulated document lines */}
      {[88,72,94,null,66,80,58,75,50].map((w, i) =>
        w === null
          ? <div key={i} style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"12px 0" }}/>
          : <div key={i} style={{ height:6, width:`${w}%`, background:"rgba(255,255,255,0.08)", borderRadius:3, marginBottom:6 }}/>
      )}
      {/* Mini chart */}
      <div style={{ height:32, background:"rgba(37,99,235,0.08)", borderRadius:8, marginTop:12, overflow:"hidden", position:"relative" }}>
        <svg width="100%" height="32" viewBox="0 0 120 32" preserveAspectRatio="none">
          <polyline points="0,28 18,22 35,24 52,14 68,16 85,8 102,11 120,5"
            fill="none" stroke={C.primary} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.7"/>
        </svg>
      </div>
      <div style={{ marginTop:12, display:"flex", gap:6, flexWrap:"wrap" }}>
        {["Revenue model","Go-to-market","30-day tasks"].map(t=>(
          <span key={t} style={{ fontSize:10, fontFamily:FB, color:dim, background:"rgba(255,255,255,0.05)", padding:"3px 8px", borderRadius:20, border:`1px solid ${border}` }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ── Build section — pyramid + plan reveal + glow loop ───────────────────────
function BuildSection() {
  const ref  = useRef(null);
  const seen = useInView(ref, 0.25);

  const [done,      setDone]      = useState(-1);   // -1 to 4
  const [showLabel, setShowLabel] = useState(false); // "Business plan generated"
  const [showPlan,  setShowPlan]  = useState(false); // doc visible
  const [looping,   setLooping]   = useState(false);
  const [glowIdx,   setGlowIdx]   = useState(-1);   // 0-4 = block, 5 = doc

  // Initial build sequence — only starts when scrolled into view
  useEffect(() => {
    if (!seen) return;
    let alive = true;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const run = async () => {
      await sleep(400);
      for (let i = 0; i < BUILD_BLOCKS.length; i++) {
        if (!alive) return;
        await sleep(850);
        setDone(i);
      }
      if (!alive) return;
      await sleep(700);
      setShowLabel(true);
      await sleep(800);
      if (!alive) return;
      setShowPlan(true);
      await sleep(1100);
      if (!alive) return;
      setLooping(true);
    };
    run();
    return () => { alive = false; };
  }, [seen]);

  // Glow loop — cycles through blocks then doc
  useEffect(() => {
    if (!looping) return;
    let g = 0;
    const t = setInterval(() => {
      setGlowIdx(g);
      g = (g + 1) % (BUILD_BLOCKS.length + 1);
    }, 820);
    return () => clearInterval(t);
  }, [looping]);

  // Pyramid: block 0 = widest (bottom), block 4 = narrowest (top)
  // Render reversed (4→0 top-to-bottom) so widest is visually at the bottom
  const reversedBlocks = [...BUILD_BLOCKS].map((b, i) => ({ ...b, origIdx: i })).reverse();

  return (
    <section ref={ref} style={{ padding:"130px 24px", borderTop:`1px solid ${border}`, position:"relative" }}
      onMouseEnter={e => e.currentTarget.style.background="rgba(37,99,235,0.015)"}
      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <A><h2 style={H2}>Built while<br/>you watch.</h2></A>

        {showLabel && (
          <div style={{ marginTop:28, marginBottom:8, animation:"fadeUp 0.6s ease both" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(37,99,235,0.1)",
              border:`1px solid rgba(37,99,235,0.25)`, borderRadius:20, padding:"6px 14px" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" fill={C.primary} opacity="0.6"/>
                <circle cx="5" cy="5" r="2" fill={C.primary}/>
              </svg>
              <span style={{ fontSize:11, fontWeight:600, color:C.primary, fontFamily:FB, letterSpacing:"0.04em", textTransform:"uppercase" }}>Business plan generated</span>
            </div>
          </div>
        )}

        <div style={{ marginTop: showLabel ? 16 : 60 }}>
          {/* Two-column layout: pyramid + plan doc */}
          <div style={{ display:"flex", gap:18, alignItems:"flex-start" }}>
            {/* Pyramid column */}
            <div style={{
              flex: showPlan ? "0 0 52%" : "0 0 100%",
              transition: `flex 0.95s ${SPRING}`,
              overflow:"hidden",
            }}>
              <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                {reversedBlocks.map(({ label, color, borderCol, origIdx }) => {
                  const visible   = seen && origIdx <= done;
                  const completed = origIdx <= done;
                  const active    = origIdx === done + 1 && seen && done < BUILD_BLOCKS.length - 1;
                  const glowing   = looping && glowIdx === origIdx;
                  // Pyramid widths: block 0 = 100%, block 4 = 56%
                  const pct = `${100 - origIdx * 10}%`;
                  return (
                    <div key={origIdx}
                      className={visible ? "block-in" : ""}
                      style={{ animationDelay:`${origIdx * 60}ms`, opacity: visible ? 1 : 0 }}>
                      <div style={{
                        display:"flex", alignItems:"center", gap:14,
                        background: completed ? color : active ? "rgba(37,99,235,0.06)" : "rgba(255,255,255,0.02)",
                        border: `1.5px solid ${glowing ? "rgba(37,99,235,0.7)" : completed ? borderCol : active ? "rgba(37,99,235,0.25)" : border}`,
                        borderRadius: origIdx === 0 ? "4px 4px 12px 12px"
                                    : origIdx === BUILD_BLOCKS.length - 1 ? "12px 12px 4px 4px"
                                    : "4px",
                        padding:"14px 18px",
                        width: pct, margin:"0 auto",
                        transition:`all 0.8s ${SPRING}`,
                        boxShadow: glowing
                          ? "0 0 20px rgba(37,99,235,0.25), 0 0 40px rgba(37,99,235,0.1)"
                          : completed ? `0 2px 12px rgba(37,99,235,0.08)` : "none",
                      }}>
                        <span style={{ fontFamily:FH, fontWeight:700, fontSize:11,
                          color: glowing ? "#fff" : completed ? "rgba(255,255,255,0.45)" : active ? C.primary : subtle,
                          letterSpacing:"0.07em", width:16, flexShrink:0, transition:`color 0.5s ease` }}>
                          {String(origIdx + 1).padStart(2, "0")}
                        </span>
                        <span style={{ fontFamily:FB, fontSize:13,
                          color: glowing ? "#fff" : completed ? dim : active ? "#fff" : subtle,
                          flex:1, transition:`color 0.5s ease` }}>
                          {label}
                        </span>
                        <div style={{ width:18, height:18, borderRadius:"50%", flexShrink:0,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          border:`1.5px solid ${glowing ? C.primary : completed ? "rgba(255,255,255,0.22)" : active ? C.primary : border}`,
                          background: completed ? "rgba(255,255,255,0.07)" : "transparent",
                          transition:`all 0.5s ${SPRING}` }}>
                          {active && !completed && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ animation:"spin 0.9s linear infinite" }}>
                              <circle cx="5" cy="5" r="3.5" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5"/>
                              <path d="M5 1.5a3.5 3.5 0 0 1 3.5 3.5" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          )}
                          {completed && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1 4l2 2L7 2" stroke={glowing ? C.primary : "rgba(255,255,255,0.5)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Business plan doc */}
            <div style={{
              flex: showPlan ? "0 0 44%" : "0 0 0%",
              opacity: showPlan ? 1 : 0,
              transform: showPlan ? "translateX(0)" : "translateX(24px)",
              overflow:"hidden",
              transition: `flex 0.95s ${SPRING}, opacity 0.8s ease 0.15s, transform 0.95s ${SPRING} 0.1s`,
            }}>
              <PlanDoc glowing={looping && glowIdx === BUILD_BLOCKS.length} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Card content visuals ────────────────────────────────────────────────────
function CaptionCardContent() {
  return (
    <div style={{ padding:"18px 16px 14px" }}>
      <div style={{ fontSize:10, color:dim, fontFamily:FB, marginBottom:12 }}>@yourbusiness · Instagram</div>
      <div style={{ fontSize:12.5, color:"rgba(255,255,255,0.78)", fontFamily:FB, lineHeight:1.8 }}>
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

// ── Marketing section ───────────────────────────────────────────────────────
function MarketingSection({ onFlip, flipCount }) {
  const ref  = useRef(null);
  const seen = useInView(ref, 0.2);
  const nav  = useNavigate();

  const [cardIdx,  setCardIdx]  = useState(0);
  const [phase,    setPhase]    = useState("idle");
  const [insight,  setInsight]  = useState(null);
  const [showPost, setShowPost] = useState(false);
  const nextRef  = useRef(1);
  const timerRef = useRef(null);
  const phaseRef = useRef("idle");
  const cardRef  = useRef(0);

  const doFlip = useCallback(() => {
    if (phaseRef.current !== "idle") return;
    const next = (cardRef.current + 1) % CARDS.length;
    nextRef.current = next;
    phaseRef.current = "out";
    setPhase("out");
    setTimeout(() => {
      cardRef.current = next;
      setCardIdx(next);
      phaseRef.current = "in";
      setPhase("in");
      setInsight(null);
      onFlip(next);
      setTimeout(() => {
        phaseRef.current = "idle";
        setPhase("idle");
        setInsight(CARDS[next]);
        if (next === CARDS.length - 1) setShowPost(true);
      }, 520);
    }, 360);
  }, [onFlip]);

  useEffect(() => {
    if (!seen) return;
    setTimeout(() => setInsight(CARDS[0]), 800);
    timerRef.current = setInterval(doFlip, 5500); // slower flip interval
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
            <div style={{ fontSize:10, color:dim, fontFamily:FB, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10, transition:"opacity 0.4s ease" }}>
              {card.label}
            </div>
            <div style={{ perspective:1400 }}>
              <div
                className={phase === "in" ? "flip-in" : ""}
                style={{
                  background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`, borderRadius:16,
                  minHeight:224, overflow:"hidden",
                  transform: phase === "out" ? "rotateY(-90deg)" : "rotateY(0deg)",
                  transition: phase === "out" ? `transform 0.36s ease-in` : "none",
                  transformOrigin:"50% 50%",
                  boxShadow:"0 4px 32px rgba(0,0,0,0.28)",
                }}>
                {CARD_BODIES[card.id]}
              </div>
            </div>

            {/* Deck dots */}
            <div style={{ display:"flex", gap:6, marginTop:14, justifyContent:"center" }}>
              {CARDS.map((_,i) => (
                <div key={i} style={{ width: i===cardIdx ? 16 : 5, height:5, borderRadius:3,
                  background: i===cardIdx ? C.primary : border,
                  transition:`all 0.5s ${SPRING}` }}/>
              ))}
            </div>

            {/* Post button — goes to signup */}
            {showPost && (
              <div style={{ marginTop:14, animation:"fadeUp 0.6s ease both" }}>
                <button
                  onClick={() => nav("/signup")}
                  style={{ width:"100%", padding:"11px", borderRadius:11, border:`1px solid rgba(37,99,235,0.4)`,
                    background:"rgba(37,99,235,0.1)", color:"rgba(255,255,255,0.85)", fontFamily:FB, fontSize:12,
                    cursor:"pointer", transition:`all 0.4s ${SPRING}`, letterSpacing:"0.01em" }}
                  onMouseEnter={e => { e.target.style.background="rgba(37,99,235,0.2)"; e.target.style.color="#fff"; e.target.style.boxShadow="0 4px 20px rgba(37,99,235,0.2)"; }}
                  onMouseLeave={e => { e.target.style.background="rgba(37,99,235,0.1)"; e.target.style.color="rgba(255,255,255,0.85)"; e.target.style.boxShadow="none"; }}>
                  Post all content →
                </button>
              </div>
            )}
          </div>

          {/* Insights panel */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {insight && (
              <>
                <div className="insight-in" key={`ins-${cardIdx}`} style={{
                  background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`, borderRadius:12, padding:"15px 16px",
                }}>
                  <div style={{ fontSize:10, color:C.primary, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:7 }}>Market insight</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.72)", fontFamily:FB, lineHeight:1.65 }}>{insight.insight}</div>
                </div>
                <div className="insight-in" key={`out-${cardIdx}`} style={{
                  background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`, borderRadius:12, padding:"15px 16px",
                  animationDelay:"140ms",
                }}>
                  <div style={{ fontSize:10, color:dim, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:7 }}>Expected outcome</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.72)", fontFamily:FB, lineHeight:1.65 }}>{insight.outcome}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Data flow connector — large, glowing ─────────────────────────────────────
function DataConnector({ active, direction = "down", label }) {
  const isDown = direction === "down";
  const color  = isDown ? C.primary : "#0891B2";
  const col2   = isDown ? "#0891B2" : C.primary;
  // Motion paths: cx=20, so the dot travels along x=20 in the SVG
  const motionPath = isDown ? "M0,0 L0,130" : "M0,130 L0,0";
  const arrowPts   = isDown ? "M12,115 L20,130 L28,115" : "M12,15 L20,0 L28,15";

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"8px 0", gap:6 }}>
      {label && (
        <div style={{ fontSize:10, color:dim, fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.07em",
          opacity: active ? 1 : 0.4, transition:"opacity 0.6s ease" }}>{label}</div>
      )}
      <svg width="40" height="134" viewBox="0 0 40 134" fill="none" style={{ overflow:"visible" }}>
        <defs>
          <linearGradient id={`dg-${direction}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDown ? color : col2} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={isDown ? col2 : color} stopOpacity="0.85"/>
          </linearGradient>
          <filter id={`df-${direction}`} x="-400%" y="-10%" width="900%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Dashed track */}
        <line x1="20" y1="2" x2="20" y2="132" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" strokeDasharray="5 4"/>
        {/* Glowing active line */}
        <line x1="20" y1="2" x2="20" y2="132"
          stroke={`url(#dg-${direction})`} strokeWidth="3"
          filter={active ? `url(#df-${direction})` : undefined}
          opacity={active ? 0.75 : 0.15}
          style={{ transition:"opacity 0.8s ease" }}/>
        {/* Arrow tip */}
        <path d={arrowPts} stroke={active ? color : "rgba(255,255,255,0.08)"}
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
          filter={active ? `url(#df-${direction})` : undefined}
          style={{ transition:"stroke 0.6s ease" }}/>
        {/* Traveling dots — 3 staggered */}
        {active && [0,1,2].map(i => (
          <circle key={i} cx="20" cy="0" r="6" fill={i === 0 ? color : col2}
            filter={`url(#df-${direction})`} opacity={i === 0 ? 1 : 0.6}>
            <animateMotion dur="2.2s" begin={`${i * 0.73}s`} repeatCount="indefinite" path={motionPath}/>
          </circle>
        ))}
      </svg>
    </div>
  );
}

// ── Live canvas growth chart ─────────────────────────────────────────────────
function LiveChart({ active }) {
  const canvasRef = useRef(null);
  const dataRef   = useRef([]);
  const animRef   = useRef(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio  = window.devicePixelRatio || 1;
    const LW = 280, LH = 80;
    canvas.width  = LW * ratio;
    canvas.height = LH * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);

    const STEP    = 4;     // px per point
    const MAX_PTS = Math.ceil(LW / STEP) + 4;
    let t = 0;

    const tick = () => {
      t++;
      // Add a new point every 10 frames (~6 pts/sec at 60fps)
      if (t % 10 === 0) {
        const last   = dataRef.current[dataRef.current.length - 1] ?? 68;
        const wave   = Math.sin(t * 0.22) * 4.5;  // zigzag
        const drift  = -(t / 400);                 // slow upward drift (lower y = higher on canvas)
        const noise  = (Math.random() - 0.45) * 3;
        const newY   = Math.max(7, Math.min(LH - 8, last + wave + drift + noise));
        dataRef.current.push(newY);
        if (dataRef.current.length > MAX_PTS) dataRef.current.shift();
      }

      ctx.clearRect(0, 0, LW, LH);

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth   = 0.5;
      for (let y = 0; y < LH; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(LW, y); ctx.stroke();
      }

      const pts = dataRef.current;
      if (pts.length < 2) { animRef.current = requestAnimationFrame(tick); return; }

      // X positions: newest point at right edge
      const positions = pts.map((y, i) => ({
        x: LW - 2 - (pts.length - 1 - i) * STEP,
        y,
      })).filter(p => p.x >= 0);

      if (positions.length < 2) { animRef.current = requestAnimationFrame(tick); return; }

      const first = positions[0], last2 = positions[positions.length - 1];

      // Area fill
      const areaGrad = ctx.createLinearGradient(0, 0, 0, LH);
      areaGrad.addColorStop(0, "rgba(37,99,235,0.18)");
      areaGrad.addColorStop(1, "rgba(37,99,235,0)");
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      positions.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
      ctx.lineTo(last2.x, LH);
      ctx.lineTo(first.x, LH);
      ctx.closePath();
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // Line with gradient
      const lineGrad = ctx.createLinearGradient(first.x, 0, last2.x, 0);
      lineGrad.addColorStop(0, "rgba(37,99,235,0.22)");
      lineGrad.addColorStop(1, "rgba(8,145,178,1)");
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      positions.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth   = 1.8;
      ctx.lineJoin    = "round";
      ctx.stroke();

      // Endpoint glow dot
      const lx = last2.x, ly = last2.y;
      ctx.beginPath(); ctx.arc(lx, ly, 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(8,145,178,0.18)"; ctx.fill();
      ctx.beginPath(); ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#0891B2"; ctx.fill();

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animRef.current); };
  }, [active]);

  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${border}`, borderRadius:14, padding:"14px 16px", marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontSize:10, color:dim, fontFamily:FB, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>Revenue trend</span>
        <span style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ADE80", boxShadow:"0 0 8px #4ADE8080", animation:"pulse-dot 2s ease infinite", display:"inline-block" }}/>
          <span style={{ fontSize:10, color:dim, fontFamily:FB }}>live</span>
        </span>
      </div>
      <canvas ref={canvasRef} style={{ width:"100%", height:80, display:"block", borderRadius:6 }}/>
    </div>
  );
}

// ── Management insights feed ────────────────────────────────────────────────
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
    const t = setInterval(add, 2800);
    return () => clearInterval(t);
  }, [active]);

  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${border}`, borderRadius:14, overflow:"hidden", marginBottom:0 }}>
      <div style={{ padding:"10px 16px", borderBottom:`1px solid ${border}`, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ADE80", boxShadow:"0 0 8px #4ADE8080", flexShrink:0, animation:"pulse-dot 2s ease infinite" }}/>
        <span style={{ fontSize:10, color:dim, fontFamily:FB, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>Live insights</span>
      </div>
      <div style={{ padding:"4px 0", minHeight:110 }}>
        {items.map((item, i) => (
          <div key={item.id} className="log-in" style={{
            display:"flex", gap:10, alignItems:"flex-start", padding:"9px 16px",
            borderBottom: i < items.length - 1 ? `1px solid ${border}` : "none",
            opacity: 1 - i * 0.17, transition:"opacity 0.5s ease",
          }}>
            <span style={{ width:4, height:4, borderRadius:"50%", background:dim, flexShrink:0, marginTop:6 }}/>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontFamily:FB, lineHeight:1.55 }}>{item.text}</span>
          </div>
        ))}
        {items.length === 0 && <div style={{ padding:"14px 16px", color:subtle, fontSize:12, fontFamily:FB }}>Initializing…</div>}
      </div>
    </div>
  );
}

// ── Management section ──────────────────────────────────────────────────────
function ManagementSection({ flipCount }) {
  const ref    = useRef(null);
  const seen   = useInView(ref, 0.2);
  const active = seen;

  // Live-ticking stats — all continuously increase at different rates
  const rev  = useLiveStat(6400,  1,   170, active);   // +$1 every 170ms ≈ very slow ticker
  const cli  = useLiveStat(7,     1,  11000, active);  // +1 client every 11s
  const comp = useLiveStat(73,    1,   8000, active);  // +1% every 8s
  const hlth = useLiveStat(94,    1,  14000, active);  // +1 every 14s

  return (
    <section ref={ref} style={{ padding:"60px 24px 130px", borderTop:`1px solid ${border}`, position:"relative" }}
      onMouseEnter={e => e.currentTarget.style.background="rgba(37,99,235,0.015)"}
      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <A><h2 style={H2}>Running while<br/>you sleep.</h2></A>

        {/* Stat tiles */}
        <div className="stat-grid" style={{ marginTop:52, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
          {[
            { label:"Revenue",    val:`$${rev.toLocaleString()}` },
            { label:"Clients",    val:cli },
            { label:"Completion", val:`${comp}%` },
            { label:"Health",     val:`${hlth}` },
          ].map((s,i) => (
            <A key={s.label} delay={i * 80}>
              <div className="glow-card" style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${border}`, borderRadius:12, padding:"16px 14px" }}>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:22, color:"#fff", letterSpacing:"-0.04em", marginBottom:4, fontVariantNumeric:"tabular-nums" }}>{s.val}</div>
                <div style={{ fontSize:10, color:dim, fontFamily:FB }}>{s.label}</div>
              </div>
            </A>
          ))}
        </div>

        <LiveChart active={active} />
        <InsightsFeed active={active} />

        {/* Return connector — management → marketing */}
        <div style={{ display:"flex", justifyContent:"center", marginTop:28 }}>
          <DataConnector active={active && flipCount > 0} direction="up" label="Insights → Marketing agent"/>
        </div>
      </div>
    </section>
  );
}

// ── Heading style ───────────────────────────────────────────────────────────
const H2 = {
  fontFamily: FH, fontWeight:700,
  fontSize:"clamp(32px,5vw,52px)",
  color:"#fff", letterSpacing:"-0.045em",
  lineHeight:1.06, margin:0,
};

// ── Nav ─────────────────────────────────────────────────────────────────────
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
          <a href="#process" style={{ fontSize:13, color:dim, textDecoration:"none", padding:"6px 12px", fontFamily:FB, transition:"color 0.3s ease" }} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color=dim}>How it works</a>
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

// ── Hero ────────────────────────────────────────────────────────────────────
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

// ── Pricing ─────────────────────────────────────────────────────────────────
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
            <A key={t.id} delay={i * 80}>
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

// ── Footer ───────────────────────────────────────────────────────────────────
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

// ── Root ────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate  = useNavigate();
  const go        = () => navigate("/signup");
  const [flipCount, setFlipCount] = useState(0);
  const onFlip    = useCallback(() => setFlipCount(n => n + 1), []);

  return (
    <div style={{ background:dark, color:"#fff", fontFamily:FB, minHeight:"100vh", position:"relative" }}>
      <style>{CSS}</style>
      <CursorGlow/>
      <Nav onCta={go}/>
      <Hero onCta={go}/>
      <div id="process">
        <BuildSection/>
        <MarketingSection onFlip={onFlip} flipCount={flipCount}/>
        {/* Marketing → Management connector */}
        <div style={{ display:"flex", justifyContent:"center", padding:"4px 0" }}>
          <DataConnector active={flipCount > 0} direction="down" label="Data → Management agent"/>
        </div>
        <ManagementSection flipCount={flipCount}/>
      </div>
      <Pricing onCta={go}/>
      <Footer onCta={go}/>
    </div>
  );
}
