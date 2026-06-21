import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import useStore from "../lib/store";
import { C, FH, FB, btn, inp, Logo } from "../components";

// ── AGENT DEMO SCROLL SECTION ──────────────────────────────────────────────
function AgentDemoSection() {
  const steps = [
    {
      tag: "Marketing Agent", tagColor: C.primary,
      title: "Spots the opportunity",
      body: "Analyzes your real numbers — revenue, leads, engagement — and finds what's actually holding growth back.",
      mock: { kind:"insight", label:"Observation", text:"Instagram engagement is 2.3x the industry average, but only 8% of profile visitors click through to your website." },
    },
    {
      tag: "Marketing Agent", tagColor: C.primary,
      title: "Recommends the fix",
      body: "Turns the observation into one specific, actionable change — not generic advice.",
      mock: { kind:"insight", label:"Recommendation", text:"Add a clear booking link in your Instagram bio and feature it in the next 3 posts." },
    },
    {
      tag: "Management Agent", tagColor: C.accent,
      title: "Implements it automatically",
      body: "Takes the recommendation and rewrites your website to match — no manual editing required.",
      mock: { kind:"action", label:"Action taken", text:"Updated homepage hero with prominent booking CTA. Regenerating content..." },
    },
    {
      tag: "Management Agent", tagColor: C.accent,
      title: "Pushes it live",
      body: "Deploys the update to your real website in under 30 seconds. You can watch it happen.",
      mock: { kind:"live", label:"Status", text:"yourbusiness.netlify.app — updated and live" },
    },
  ];

  return (
    <div style={{ padding:"72px 24px", background:"#0D0D14" }}>
      <div style={{ maxWidth:880, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:56 }}>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:32, color:"#fff", letterSpacing:"-0.04em", marginBottom:12 }}>
            Two agents. Working together.
          </div>
          <p style={{ fontSize:15, color:"#ffffff70", maxWidth:520, margin:"0 auto", lineHeight:1.7 }}>
            This is what runs in the background once your business is live — here's a real example from start to finish.
          </p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {steps.map((s,i) => (
            <div key={i} style={{ display:"flex", gap:24, alignItems:"flex-start", position:"relative" }}>
              {/* Timeline */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, width:32 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:s.tagColor, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FH, fontWeight:700, fontSize:13, flexShrink:0 }}>{i+1}</div>
                {i<steps.length-1 && <div style={{ width:2, flex:1, background:"#ffffff15", minHeight:48, marginTop:4 }} />}
              </div>

              {/* Content */}
              <div style={{ flex:1, paddingBottom:i<steps.length-1?40:0 }}>
                <span style={{ background:s.tagColor+"20", color:s.tagColor, fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FB }}>{s.tag}</span>
                <div style={{ fontFamily:FH, fontWeight:600, fontSize:18, color:"#fff", marginTop:10, marginBottom:6 }}>{s.title}</div>
                <p style={{ fontSize:13, color:"#ffffff60", lineHeight:1.65, marginBottom:16, maxWidth:480 }}>{s.body}</p>

                {/* Mock card */}
                <div style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${s.tagColor}25`, borderRadius:10, padding:"12px 16px", maxWidth:480 }}>
                  <div style={{ fontSize:10, color:s.tagColor, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6, fontFamily:FB }}>{s.mock.label}</div>
                  <div style={{ fontSize:13, color:"#ffffffdd", lineHeight:1.6, fontFamily:FB, display:"flex", alignItems:"center", gap:8 }}>
                    {s.mock.kind==="live" && <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ADE80", flexShrink:0, boxShadow:"0 0 6px #4ADE8088" }} />}
                    {s.mock.text}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PRICING TEASER ────────────────────────────────────────────────────────
function PricingTeaser({ onSelect }) {
  const tiers = [
    { id:"starter",   name:"Starter",   price:29,  desc:"Insights & reports, manual tracking", color:C.primary },
    { id:"active",    name:"Active",    price:65,  desc:"Agents act on your request", color:C.accent, popular:true },
    { id:"autopilot", name:"Autopilot", price:102, desc:"Fully autonomous — just watch it run", color:"#DB2777" },
  ];
  return (
    <div style={{ padding:"72px 24px", background:C.dark }}>
      <div style={{ maxWidth:880, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:32, color:"#fff", letterSpacing:"-0.04em", marginBottom:10 }}>Start free. Upgrade when ready.</div>
          <p style={{ fontSize:15, color:"#ffffff60" }}>7 days free, no credit card required.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {tiers.map(t=>(
            <div key={t.id} style={{ background:"rgba(255,255,255,0.04)", border:`1.5px solid ${t.popular?t.color:"rgba(255,255,255,0.1)"}`, borderRadius:14, padding:"24px 20px", position:"relative" }}>
              {t.popular && <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:t.color, color:"#fff", fontSize:10, fontWeight:700, padding:"3px 12px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em" }}>Most popular</div>}
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:17, color:"#fff", marginBottom:6 }}>{t.name}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:10 }}>
                <span style={{ fontFamily:FH, fontWeight:700, fontSize:30, color:t.color, letterSpacing:"-0.04em" }}>${t.price}</span>
                <span style={{ fontSize:13, color:"#ffffff50" }}>/mo</span>
              </div>
              <p style={{ fontSize:13, color:"#ffffff70", lineHeight:1.6 }}>{t.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign:"center", marginTop:32 }}>
          <button onClick={onSelect} style={{ ...btn(C.grad,"#fff",15), padding:"13px 32px", borderRadius:12 }}>Start your free trial</button>
        </div>
      </div>
    </div>
  );
}

export default function Welcome() {
  const [mode,    setMode]    = useState("register");
  const [form,    setForm]    = useState({ name:"", email:"", password:"", age:"" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth, setIntake } = useStore();
  const navigate = useNavigate();
  const up = (k,v) => setForm(p=>({...p,[k]:v}));

  const ageNum   = parseInt(form.age)||0;
  const ageGroup = ageNum > 0 ? (ageNum < 18 ? "under18" : ageNum < 25 ? "18to24" : "25plus") : null;
  const ageNote  = {
    under18: "No business license or bank account needed — we'll guide you accordingly.",
    "18to24": "We'll explain each step clearly along the way.",
    "25plus":  "Full setup options including legal structure and accounts.",
  }[ageGroup] || "";

  const scrollToForm = () => document.getElementById("signup-form")?.scrollIntoView({ behavior:"smooth", block:"center" });

  const submit = async () => {
    if (mode==="register" && !form.name.trim()) return setError("Please enter your first name");
    if (!form.email.trim()) return setError("Please enter your email");
    if (!form.password) return setError("Please enter a password");
    if (mode==="register" && form.password.length < 8) return setError("Password must be at least 8 characters");
    setError(""); setLoading(true);
    try {
      const fn = mode==="login" ? api.auth.login : api.auth.register;
      const { token, user } = await fn({ ...form, age: ageNum||null });
      setAuth(token, user);
      if (user.age) setIntake({ age: user.age });
      navigate("/dashboard");
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily:FB, background:C.dark }}>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"64px 24px 80px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 0%, #7C3AED18, transparent 60%)", pointerEvents:"none" }} />

        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:520, textAlign:"center" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:28 }}>
            <Logo size={22}/>
            <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.02em" }}>EARNEDLAB</div>
          </div>

          <div style={{ fontFamily:FH, fontWeight:700, fontSize:48, color:"#fff", lineHeight:1.05, letterSpacing:"-0.045em", marginBottom:6 }}>
            Your business.
          </div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:48, lineHeight:1.05, letterSpacing:"-0.045em", marginBottom:24, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            In 30 minutes.
          </div>

          <p style={{ fontSize:16, color:"#ffffff70", lineHeight:1.7, marginBottom:36, maxWidth:420, marginLeft:"auto", marginRight:"auto" }}>
            EarnedLab finds the right business for you, builds everything automatically, and gets you to your first dollar this week.
          </p>

          <div style={{ display:"flex", justifyContent:"center", gap:40, marginBottom:48 }}>
            {[["30 min","TO LAUNCH"],["7 days","TO FIRST DOLLAR"],["$0","TO GET STARTED"]].map(([big,small])=>(
              <div key={small}>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, color:"#fff", letterSpacing:"-0.03em" }}>{big}</div>
                <div style={{ fontSize:10, color:"#ffffff45", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginTop:4 }}>{small}</div>
              </div>
            ))}
          </div>

          {/* Form card */}
          <div id="signup-form" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"30px 28px", backdropFilter:"blur(12px)", textAlign:"left" }}>
            {error && <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#FCA5A5", marginBottom:18, fontFamily:FB }}>{error}</div>}

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {mode==="register" && (
                <input value={form.name} onChange={e=>up("name",e.target.value)} placeholder="First name"
                  style={{ ...inp(), background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.12)", color:"#fff", padding:"13px 16px" }} />
              )}
              <input type={mode==="login"?"text":"email"} value={form.email} onChange={e=>up("email",e.target.value)} placeholder="Email address" onKeyDown={e=>e.key==="Enter"&&submit()}
                style={{ ...inp(), background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.12)", color:"#fff", padding:"13px 16px" }} />
              <input type="password" value={form.password} onChange={e=>up("password",e.target.value)} placeholder={mode==="register"?"Password (8+ characters)":"Password"} onKeyDown={e=>e.key==="Enter"&&submit()}
                style={{ ...inp(), background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.12)", color:"#fff", padding:"13px 16px" }} />
              {mode==="register" && (
                <div>
                  <input type="number" value={form.age} onChange={e=>up("age",e.target.value)} placeholder="Your age" min="10" max="99"
                    style={{ ...inp(), background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.12)", color:"#fff", padding:"13px 16px" }} />
                  {ageNote && <p style={{ fontSize:12, color:"#A78BFA", marginTop:8, lineHeight:1.5, fontFamily:FB }}>{ageNote}</p>}
                </div>
              )}
            </div>

            <button onClick={submit} disabled={loading} style={{ background:loading?"#6B7280":"#fff", color:C.dark, border:"none", borderRadius:12, padding:"14px", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:FB, width:"100%", marginTop:20, opacity:loading?0.8:1, letterSpacing:"-0.01em" }}>
              {loading?"Please wait...":(mode==="login"?"Sign in":"Start free trial — 7 days")}
            </button>

            <p style={{ textAlign:"center", fontSize:13, color:"#ffffff40", marginTop:16, fontFamily:FB }}>
              {mode==="login"?"No account? ":"Already have an account? "}
              <span onClick={()=>{setMode(m=>m==="login"?"register":"login");setError("");}} style={{ color:"#A78BFA", cursor:"pointer", fontWeight:600 }}>
                {mode==="login"?"Create one":"Sign in"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── AGENT DEMO ───────────────────────────────────────────────────── */}
      <AgentDemoSection />

      {/* ── PRICING TEASER ──────────────────────────────────────────────── */}
      <PricingTeaser onSelect={scrollToForm} />

      {/* Footer */}
      <div style={{ padding:"32px 24px", textAlign:"center", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize:12, color:"#ffffff30", fontFamily:FB }}>EarnedLab — built for people who want to start, not just plan.</span>
      </div>
    </div>
  );
}
