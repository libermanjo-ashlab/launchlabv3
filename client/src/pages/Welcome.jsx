import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import useStore from "../lib/store";

const btn  = (bg,fg="#fff",sz=15) => ({ background:bg,color:fg,border:"none",borderRadius:10,padding:"13px 28px",fontSize:sz,fontWeight:600,cursor:"pointer",letterSpacing:"-0.02em" });
const inp  = (e={}) => ({ width:"100%",padding:"12px 16px",borderRadius:10,border:"1.5px solid var(--border)",fontSize:15,color:"var(--text)",background:"var(--surface)",outline:"none",boxSizing:"border-box",...e });

export default function Welcome() {
  const [mode,    setMode]    = useState("register");
  const [form,    setForm]    = useState({ name:"",email:"",password:"",goal:"" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useStore();
  const navigate = useNavigate();
  const up = (k,v) => setForm(p=>({...p,[k]:v}));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const { token, user } = await (mode==="login" ? api.auth.login(form) : api.auth.register(form));
      setAuth(token, user);
      navigate("/discovery");
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", fontFamily:"var(--font-body)", background:"#09090B", display:"flex", flexDirection:"column" }}>
      {/* Hero */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 24px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 40%, #7C3AED18, transparent 65%), radial-gradient(ellipse at 80% 80%, #0891B218, transparent 60%)" }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:640 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#ffffff08", border:"1px solid #ffffff15", borderRadius:20, padding:"6px 14px", marginBottom:32 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--disc)", animation:"pulse 2s infinite" }} />
            <span style={{ fontSize:12, color:"#ffffffaa", letterSpacing:"0.04em", textTransform:"uppercase" }}>No experience needed</span>
          </div>
          <div style={{ fontFamily:"var(--font-head)", fontSize:64, color:"#fff", lineHeight:1.0, letterSpacing:"-0.04em", marginBottom:20 }}>
            Your business.<br /><span style={{ background:"var(--grad)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>In 30 minutes.</span>
          </div>
          <p style={{ fontSize:18, color:"#ffffff70", lineHeight:1.7, marginBottom:48, maxWidth:480, margin:"0 auto 48px" }}>
            LaunchLab finds the right business for you, builds everything automatically, and gets you to your first dollar this week.
          </p>

          {/* Stats */}
          <div style={{ display:"flex", gap:32, justifyContent:"center", marginBottom:52 }}>
            {[["30 min","to launch"],["7 days","to first dollar"],["$0","to get started"]].map(([val,label])=>(
              <div key={label} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"var(--font-head)", fontSize:28, color:"#fff", letterSpacing:"-0.03em" }}>{val}</div>
                <div style={{ fontSize:11, color:"#ffffff50", textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Auth card */}
          <div style={{ background:"#ffffff08", backdropFilter:"blur(12px)", border:"1px solid #ffffff15", borderRadius:16, padding:"32px", maxWidth:420, margin:"0 auto", textAlign:"left" }}>
            {error && <div style={{ background:"#EF444415", border:"1px solid #EF444430", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#EF4444", marginBottom:16 }}>{error}</div>}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {mode==="register" && (
                <input value={form.name} onChange={e=>up("name",e.target.value)} placeholder="First name" style={{ ...inp(), background:"#ffffff08", border:"1.5px solid #ffffff15", color:"#fff" }} />
              )}
              <input type="email" value={form.email} onChange={e=>up("email",e.target.value)} placeholder="Email address" style={{ ...inp(), background:"#ffffff08", border:"1.5px solid #ffffff15", color:"#fff" }} onKeyDown={e=>e.key==="Enter"&&submit()} />
              <input type="password" value={form.password} onChange={e=>up("password",e.target.value)} placeholder="Password (8+ characters)" style={{ ...inp(), background:"#ffffff08", border:"1.5px solid #ffffff15", color:"#fff" }} onKeyDown={e=>e.key==="Enter"&&submit()} />
            </div>
            <button onClick={submit} disabled={loading} style={{ ...btn("var(--grad)"), width:"100%", padding:"14px", fontSize:16, borderRadius:10, marginTop:18, opacity:loading?0.7:1, background:loading?"#4B5563":"var(--grad)" }}>
              {loading ? "Setting up..." : mode==="register" ? "Start for free — no credit card" : "Sign in"}
            </button>
            <p style={{ textAlign:"center", fontSize:13, color:"#ffffff50", marginTop:14 }}>
              {mode==="register"?"Already have an account? ":"New here? "}
              <span onClick={()=>{setMode(m=>m==="login"?"register":"login");setError("");}} style={{ color:"var(--disc)", cursor:"pointer", fontWeight:500 }}>
                {mode==="register"?"Sign in":"Create account"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
