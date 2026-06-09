import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../lib/store";
import { api } from "../lib/api";

const btn  = (bg,fg="#fff",sz=15) => ({ background:bg,color:fg,border:"none",borderRadius:10,padding:"12px 24px",fontSize:sz,fontWeight:600,cursor:"pointer" });
const btnO = (c,sz=13) => ({ background:"transparent",color:c,border:`1.5px solid ${c}25`,borderRadius:10,padding:"10px 18px",fontSize:sz,fontWeight:500,cursor:"pointer" });
const inp  = (e={}) => ({ width:"100%",padding:"12px 16px",borderRadius:10,border:"1.5px solid var(--border)",fontSize:15,color:"var(--text)",background:"var(--surface)",outline:"none",boxSizing:"border-box",...e });

function TagInput({ tags=[], onChange, placeholder, color="#7C3AED" }) {
  const [val, setVal] = useState("");
  const add = () => { const v=val.trim(); if(v&&!tags.includes(v)) onChange([...tags,v]); setVal(""); };
  return (
    <div style={{ border:"1.5px solid var(--border)",borderRadius:10,padding:"12px",background:"var(--surface)",minHeight:52 }}>
      {tags.length>0&&<div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:8 }}>{tags.map(t=><span key={t} style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:20,background:color+"18",color,fontSize:13,fontWeight:500 }}>{t}<span onClick={()=>onChange(tags.filter(x=>x!==t))} style={{ cursor:"pointer",fontSize:15,opacity:0.5,fontWeight:700 }}>&#215;</span></span>)}</div>}
      <div style={{ display:"flex",gap:8 }}>
        <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();add();}}} placeholder={placeholder} style={{ border:"none",outline:"none",flex:1,fontSize:14,color:"var(--text)",background:"transparent" }} />
        {val.trim()&&<button onClick={add} style={{ ...btn(color,"#fff",12),padding:"4px 12px",flexShrink:0 }}>+</button>}
      </div>
    </div>
  );
}

export default function Discovery() {
  const { intake, setIntake, user, setIdeas } = useStore();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const navigate = useNavigate();
  const up = (k,v) => setIntake({[k]:v});

  const steps = [
    { emoji:"⚡", label:"Your situation",  sub:"Takes 45 seconds" },
    { emoji:"🎯", label:"Your edge",       sub:"What you're good at" },
    { emoji:"💰", label:"Your goal",       sub:"What success looks like" },
    { emoji:"💡", label:"Your idea",       sub:"Optional but helpful" },
  ];

  const submit = async () => {
    setLoading(true); setError("");
    try {
      const { ideas } = await api.generate.ideas({ ...intake, businessExperience:"no" });
      setIdeas(ideas);
      navigate("/results");
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const canNext = [
    () => intake.location?.trim().length > 2,
    () => true,
    () => intake.incomeGoal?.trim().length > 0,
    () => true,
  ];

  const pct = Math.round((step / steps.length) * 100);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"var(--font-body)" }}>
      <div style={{ height:4, background:"var(--border)" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:"var(--grad)", transition:"width 0.4s ease", borderRadius:2 }} />
      </div>
      <div style={{ height:52, display:"flex", alignItems:"center", padding:"0 24px", justifyContent:"space-between" }}>
        <span style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:15, background:"var(--grad)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>LaunchLab</span>
        <span style={{ fontSize:12, color:"var(--muted)", background:"var(--disc-bg)", color:"var(--disc)", padding:"4px 10px", borderRadius:20, fontWeight:600 }}>Step {step+1}/{steps.length}</span>
      </div>

      <div style={{ maxWidth:500, margin:"0 auto", padding:"32px 24px 80px" }}>
        {/* Step indicator */}
        <div style={{ display:"flex", gap:8, marginBottom:36 }}>
          {steps.map((s,i) => (
            <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=step?"var(--disc)":"var(--border)", transition:"background 0.3s" }} />
          ))}
        </div>

        {/* Step content */}
        <div style={{ fontFamily:"var(--font-head)", fontSize:30, letterSpacing:"-0.04em", marginBottom:8, lineHeight:1.2 }}>
          {steps[step].label}
        </div>
        <p style={{ color:"var(--muted)", fontSize:15, marginBottom:32 }}>{steps[step].sub}</p>

        {step===0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Where are you?</label>
              <input value={intake.location||""} onChange={e=>up("location",e.target.value)} placeholder="City, State" style={inp()} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Hours you can work: <strong style={{ color:"var(--disc)" }}>{intake.hours} hrs/week</strong></label>
              <input type="range" min={1} max={40} value={intake.hours||15} onChange={e=>up("hours",+e.target.value)} style={{ width:"100%", accentColor:"var(--disc)" }} />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--muted)", marginTop:3 }}><span>1 hr (minimal)</span><span>40 hrs (all-in)</span></div>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Starting money: <strong style={{ color:"var(--disc)" }}>${Number(intake.budget||0).toLocaleString()}</strong></label>
              <input type="range" min={0} max={5000} step={50} value={intake.budget||0} onChange={e=>up("budget",+e.target.value)} style={{ width:"100%", accentColor:"var(--disc)" }} />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--muted)", marginTop:3 }}><span>$0 (bootstrapped)</span><span>$5,000</span></div>
            </div>
            <div style={{ background:"var(--disc-bg)", borderRadius:10, padding:"14px 16px", fontSize:13, color:"var(--disc)", lineHeight:1.6 }}>
              Most businesses in LaunchLab start with under $200. Your budget is not a bottleneck.
            </div>
          </div>
        )}

        {step===1 && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Skills & knowledge (anything)</label>
              <p style={{ fontSize:13, color:"var(--muted)", marginBottom:8 }}>Gaming counts. Social media counts. Speaking another language counts. Everything counts.</p>
              <TagInput tags={intake.skills||[]} onChange={v=>up("skills",v)} placeholder="e.g. Video editing, Spanish, Tutoring math..." color="var(--disc)" />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Stuff you own (optional)</label>
              <TagInput tags={intake.assets||[]} onChange={v=>up("assets",v)} placeholder="e.g. Good camera, Car, Gaming PC..." color="var(--disc)" />
            </div>
            <div style={{ background:"var(--ok-bg)", borderRadius:10, padding:"12px 16px", fontSize:13, color:"var(--ok)", lineHeight:1.6 }}>
              No experience needed. LaunchLab handles the business side — you just need to show up.
            </div>
          </div>
        )}

        {step===2 && (
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>What does winning look like?</label>
              <input value={intake.incomeGoal||""} onChange={e=>up("incomeGoal",e.target.value)} placeholder="e.g. $500/month for rent, $2k to pay off loans, replace my job" style={inp()} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Risk tolerance</label>
              {[["low","Safe — I need reliable income"],["medium","Balanced — some risk is fine"],["high","Bold — high ceiling is worth the risk"]].map(([val,label])=>(
                <div key={val} onClick={()=>up("risk",val)} style={{ marginBottom:8,padding:"12px 16px",borderRadius:10,border:`1.5px solid ${intake.risk===val?"var(--disc)":"var(--border)"}`,background:intake.risk===val?"var(--disc-bg)":"var(--surface)",cursor:"pointer",display:"flex",gap:12,alignItems:"center" }}>
                  <div style={{ width:16,height:16,borderRadius:"50%",border:`2px solid ${intake.risk===val?"var(--disc)":"var(--border)"}`,background:intake.risk===val?"var(--disc)":"transparent",flexShrink:0 }} />
                  <span style={{ fontSize:14,color:intake.risk===val?"var(--disc)":"var(--text)",fontWeight:intake.risk===val?600:400 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step===3 && (
          <div>
            <div style={{ background:"var(--disc-bg)", borderRadius:12, padding:"20px", marginBottom:24, border:"1px solid var(--disc)20" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--disc)", marginBottom:6 }}>We assume zero business experience.</div>
              <div style={{ fontSize:13, color:"var(--disc)", lineHeight:1.6, opacity:0.8 }}>Every task we give you is automatable or takes under 30 minutes. No LLC required to start making money.</div>
            </div>
            <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Got an idea already? (optional)</label>
            <textarea value={intake.ownIdea||""} onChange={e=>up("ownIdea",e.target.value)} placeholder="Tell us what you're thinking — we'll analyze it and add it to your results" rows={4} style={{ ...inp(), resize:"vertical", lineHeight:1.6 }} />
          </div>
        )}

        {error && <div style={{ marginTop:16,padding:"12px 16px",borderRadius:10,background:"var(--err-bg)",fontSize:13,color:"var(--err)" }}>{error}</div>}

        <div style={{ display:"flex", justifyContent:"space-between", marginTop:36 }}>
          <button onClick={()=>step>0?setStep(s=>s-1):navigate("/dashboard")} style={btnO("var(--muted)")}>Back</button>
          {step<3
            ? <button onClick={()=>canNext[step]()&&setStep(s=>s+1)} style={btn(canNext[step]()?"var(--disc)":"#CBD5E1")}>Continue &rarr;</button>
            : <button onClick={submit} disabled={loading} style={{ ...btn(loading?"#CBD5E1":"var(--disc)"), position:"relative" }}>
                {loading ? (
                  <span style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ width:16,height:16,borderRadius:"50%",border:"2px solid #ffffff50",borderTopColor:"#fff",animation:"spin 0.7s linear infinite",flexShrink:0 }} />
                    Finding your ROI...
                  </span>
                ) : "Show me the money \u2192"}
              </button>
          }
        </div>
      </div>
    </div>
  );
}
