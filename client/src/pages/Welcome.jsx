import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import useStore from "../lib/store";
import { C, FH, FB, btn, inp } from "../components";

function RadioOption({ value, label, sub, selected, onClick }) {
  return (
    <div onClick={onClick} style={{ marginBottom:8,padding:"12px 16px",borderRadius:10,border:`1.5px solid ${selected?C.primary:C.border}`,background:selected?C.primaryBg:C.surface,cursor:"pointer",display:"flex",alignItems:"flex-start",gap:12,transition:"all 0.12s" }}>
      <div style={{ width:16,height:16,borderRadius:"50%",border:`2px solid ${selected?C.primary:C.border}`,background:selected?C.primary:"transparent",flexShrink:0,marginTop:2,transition:"all 0.12s" }} />
      <div>
        <div style={{ fontSize:14,fontWeight:selected?600:400,color:selected?C.primary:C.text,fontFamily:FB }}>{label}</div>
        {sub && <div style={{ fontSize:12,color:C.muted,fontFamily:FB,marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Welcome() {
  const [mode,    setMode]    = useState("register");
  const [form,    setForm]    = useState({ name:"", email:"", password:"", goal:"", age:"" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth, setIntake } = useStore();
  const navigate = useNavigate();
  const up = (k,v) => setForm(p=>({...p,[k]:v}));

  const ageNum = parseInt(form.age)||0;
  const ageGroup = ageNum > 0 ? (ageNum < 18 ? "under18" : ageNum < 25 ? "18to24" : "25plus") : null;

  const submit = async () => {
    if (mode==="register" && !form.name.trim()) return setError("Please enter your name");
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

  const ageNote = {
    under18: "Options will be tailored for your situation — no business license or bank account required to start.",
    "18to24": "You'll see the full setup path with clear explanations for each step.",
    "25plus":  "Full professional setup options including legal structure and financial accounts.",
  }[ageGroup] || "";

  return (
    <div style={{ minHeight:"100vh",display:"flex",fontFamily:FB,background:C.dark,position:"relative",overflow:"hidden" }}>
      {/* Background gradient */}
      <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at 20% 50%, #7C3AED15, transparent 60%), radial-gradient(ellipse at 85% 20%, #0891B215, transparent 55%)" }} />

      {/* Left — branding */}
      <div style={{ width:"48%",display:"flex",flexDirection:"column",justifyContent:"center",padding:"72px 56px",position:"relative",zIndex:1,flexShrink:0 }}>
        <div style={{ fontFamily:FH,fontWeight:700,fontSize:20,background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.03em",marginBottom:56 }}>LaunchLab</div>
        <div style={{ fontFamily:FH,fontWeight:700,fontSize:52,color:"#fff",lineHeight:1.0,letterSpacing:"-0.05em",marginBottom:20 }}>
          Start your<br/>business<br/><span style={{ background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>today.</span>
        </div>
        <p style={{ fontSize:16,color:"#ffffff65",lineHeight:1.8,marginBottom:48,maxWidth:360 }}>
          LaunchLab finds the right business for your life, builds it automatically, and runs the marketing and management so you can focus on what matters.
        </p>
        <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
          {[
            ["Discovery", "AI matches business ideas to your skills, schedule, and goals"],
            ["Setup",     "Builds your digital presence automatically — website, payments, bookings"],
            ["Marketing Agent", "Analyzes performance data and identifies what to change"],
            ["Management Agent", "Implements the marketing agent recommendations and tracks your growth"],
          ].map(([title,desc],i)=>(
            <div key={i} style={{ display:"flex",gap:14,alignItems:"flex-start" }}>
              <div style={{ width:24,height:24,borderRadius:6,background:i<2?`${C.primary}30`:`${C.accent}30`,border:`1px solid ${i<2?C.primary:C.accent}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:i<2?C.primary:C.accent,flexShrink:0,fontFamily:FB }}>
                {i+1}
              </div>
              <div>
                <div style={{ fontSize:13,fontWeight:600,color:"#ffffffcc",marginBottom:2,fontFamily:FH }}>{title}</div>
                <div style={{ fontSize:12,color:"#ffffff40",lineHeight:1.5,fontFamily:FB }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — auth form */}
      <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"56px 48px",position:"relative",zIndex:1 }}>
        <div style={{ width:"100%",maxWidth:400,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"36px 32px",backdropFilter:"blur(12px)" }}>
          <div style={{ fontFamily:FH,fontWeight:700,fontSize:22,color:"#fff",marginBottom:4,letterSpacing:"-0.04em" }}>
            {mode==="login"?"Welcome back":"Create your account"}
          </div>
          <p style={{ fontSize:13,color:"#ffffff50",marginBottom:24,fontFamily:FB }}>
            {mode==="login"?"Sign in to your LaunchLab account":"Free to start. No credit card required."}
          </p>

          {error && <div style={{ background:"rgba(220,38,38,0.15)",border:"1px solid rgba(220,38,38,0.3)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#FCA5A5",marginBottom:20,fontFamily:FB }}>{error}</div>}

          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            {mode==="register" && (
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:"#ffffff50",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:FB }}>Your name</label>
                <input value={form.name} onChange={e=>up("name",e.target.value)} placeholder="First name" style={{ ...inp(),background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",color:"#fff" }} />
              </div>
            )}
            <div>
              <label style={{ fontSize:12,fontWeight:600,color:"#ffffff50",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:FB }}>Email</label>
              <input type="email" value={form.email} onChange={e=>up("email",e.target.value)} placeholder="you@email.com" style={{ ...inp(),background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",color:"#fff" }} onKeyDown={e=>e.key==="Enter"&&submit()} />
            </div>
            <div>
              <label style={{ fontSize:12,fontWeight:600,color:"#ffffff50",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:FB }}>Password</label>
              <input type="password" value={form.password} onChange={e=>up("password",e.target.value)} placeholder={mode==="register"?"8+ characters":""} style={{ ...inp(),background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",color:"#fff" }} onKeyDown={e=>e.key==="Enter"&&submit()} />
            </div>
            {mode==="register" && (
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:"#ffffff50",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:FB }}>Your age</label>
                <input type="number" value={form.age} onChange={e=>up("age",e.target.value)} placeholder="e.g. 22" min="10" max="99" style={{ ...inp(),background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",color:"#fff",width:120 }} />
                {ageNote && (
                  <div style={{ marginTop:8,fontSize:12,color:ageGroup==="under18"?"#A78BFA":"#67E8F9",fontFamily:FB,lineHeight:1.55 }}>
                    {ageNote}
                  </div>
                )}
              </div>
            )}
            {mode==="register" && (
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:"#ffffff50",display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:FB }}>What brings you here?</label>
                {[
                  ["extra_income","Extra income on the side","Keep my job, earn more"],
                  ["replace_job","Replace my main income","Build something that pays the bills"],
                  ["first_business","Start my first business","Learn as I go"],
                  ["grow_fast","Grow something serious","Scale and build real value"],
                ].map(([val,label,sub])=>(
                  <div key={val} onClick={()=>up("goal",val)} style={{ marginBottom:6,padding:"10px 14px",borderRadius:10,border:`1.5px solid ${form.goal===val?"rgba(124,58,237,0.5)":"rgba(255,255,255,0.1)"}`,background:form.goal===val?"rgba(124,58,237,0.15)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all 0.12s" }}>
                    <div style={{ width:14,height:14,borderRadius:"50%",border:`2px solid ${form.goal===val?C.primary:"rgba(255,255,255,0.3)"}`,background:form.goal===val?C.primary:"transparent",flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:13,fontWeight:form.goal===val?600:400,color:form.goal===val?"#C4B5FD":"#ffffffcc",fontFamily:FB }}>{label}</div>
                      <div style={{ fontSize:11,color:"#ffffff40",fontFamily:FB }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={submit} disabled={loading} style={{ ...btn(C.grad),"background":loading?"rgba(255,255,255,0.15)":undefined,width:"100%",padding:"13px",fontSize:15,borderRadius:12,marginTop:24,opacity:loading?0.7:1 }}>
            {loading?"Please wait...":(mode==="login"?"Sign in":"Get started")}
          </button>

          <p style={{ textAlign:"center",fontSize:13,color:"#ffffff40",marginTop:16,fontFamily:FB }}>
            {mode==="login"?"No account? ":"Already have an account? "}
            <span onClick={()=>{setMode(m=>m==="login"?"register":"login");setError("");}} style={{ color:"#A78BFA",cursor:"pointer",fontWeight:500 }}>
              {mode==="login"?"Create one":"Sign in"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
