import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import useStore from "../lib/store";
import { C, FH, FB, btn, inp, Logo } from "../components";
import { MailCheck, X } from "lucide-react";

const SUPPORT = "support@earnedlab.com";

function ForgotModal({ onClose }) {
  const [email,  setEmail]  = useState("");
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  const submit = async () => {
    if (!email.trim()) return setErrMsg("Please enter your email address");
    setStatus("loading"); setErrMsg("");
    try { await api.auth.forgotPassword(email.trim()); setStatus("sent"); }
    catch (e) { setErrMsg(e.message); setStatus("idle"); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:24 }}>
      <div style={{ background:"#16161F", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"32px 28px", width:"100%", maxWidth:420, position:"relative" }}>
        <button onClick={onClose} aria-label="Close" style={{ position:"absolute", top:16, right:16, background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", display:"flex" }}><X size={16} aria-hidden="true" /></button>

        {status === "sent" ? (
          <>
            <div style={{ fontSize:32, marginBottom:12, color:"rgba(255,255,255,0.8)" }}><MailCheck size={32} aria-hidden="true" /></div>
            <div style={{ fontFamily:FH, fontWeight:700, fontSize:20, color:"#fff", marginBottom:10, letterSpacing:"-0.03em" }}>Check your inbox</div>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.7, marginBottom:20 }}>
              If an account exists for <strong style={{ color:"#fff" }}>{email}</strong>, we've sent a reset link. It expires in 1 hour.
            </p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", lineHeight:1.6 }}>Didn't get it? Check spam or email <a href={`mailto:${SUPPORT}`} style={{ color:C.primary }}>{SUPPORT}</a>.</p>
            <button onClick={onClose} style={{ ...btn(C.grad,"#fff",14), padding:"12px", borderRadius:10, width:"100%", marginTop:20 }}>Done</button>
          </>
        ) : (
          <>
            <div style={{ fontFamily:FH, fontWeight:700, fontSize:20, color:"#fff", marginBottom:8, letterSpacing:"-0.03em" }}>Reset password</div>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.6, marginBottom:20 }}>We'll send a reset link to your email.</p>
            {errMsg && <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#FCA5A5", marginBottom:14 }}>{errMsg}</div>}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter" && submit()} placeholder="Email address"
              style={{ ...inp(), background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.12)", color:"#fff", padding:"13px 16px", marginBottom:14 }} />
            <button onClick={submit} disabled={status==="loading"} style={{ ...btn(C.grad,"#fff",14), padding:"13px", borderRadius:10, width:"100%", opacity:status==="loading"?0.7:1 }}>
              {status==="loading" ? "Sending…" : "Send reset link"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Signup() {
  const [mode,       setMode]       = useState("register");
  const [form,       setForm]       = useState({ name:"", email:"", password:"", age:"" });
  const [agreed,     setAgreed]     = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { setAuth, setIntake } = useStore();
  const navigate = useNavigate();
  const up = (k, v) => setForm(p => ({ ...p, [k]:v }));

  const submit = async () => {
    if (mode==="register" && !form.name.trim()) return setError("Please enter your first name");
    if (!form.email.trim()) return setError("Please enter your email");
    if (!form.password) return setError("Please enter a password");
    if (mode==="register" && form.password.length < 8) return setError("Password must be at least 8 characters");
    if (mode==="register" && !agreed) return setError("Please confirm you are 18 or older and agree to the Terms, Privacy Policy, and Disclaimer");
    setError(""); setLoading(true);
    try {
      const fn = mode==="login" ? api.auth.login : api.auth.register;
      const ageNum = form.age ? parseInt(form.age) : null;
      const { token, user } = await fn({ ...form, age: ageNum || null });
      setAuth(token, user);
      if (user.age) setIntake({ age: user.age });
      navigate("/dashboard");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0A0A0F", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 24px", fontFamily:FB, position:"relative" }}>
      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 40% at 50% 0%, #7C3AED18, transparent)", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:440 }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:36, textDecoration:"none" }}>
          <Logo size={22}/>
          <span style={{ fontFamily:FH, fontWeight:700, fontSize:14, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.02em" }}>EARNEDLAB</span>
        </Link>

        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:20, padding:"32px 28px", backdropFilter:"blur(12px)" }}>
          <h1 style={{ fontFamily:FH, fontWeight:700, fontSize:22, color:"#fff", letterSpacing:"-0.03em", margin:"0 0 6px" }}>
            {mode==="login" ? "Welcome back" : "Start your free trial"}
          </h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.45)", margin:"0 0 24px", fontFamily:FB }}>
            {mode==="login" ? "Sign in to your EarnedLab account" : "7 days free · No credit card required"}
          </p>

          {error && (
            <div style={{ background:"rgba(220,38,38,0.12)", border:"1px solid rgba(220,38,38,0.25)", borderRadius:9, padding:"10px 14px", fontSize:13, color:"#FCA5A5", marginBottom:18, lineHeight:1.5 }}>
              {error}
              {(error.includes("server") || error.includes("went wrong")) && (
                <div style={{ marginTop:6, fontSize:12, color:"rgba(252,165,165,0.7)" }}>
                  If this keeps happening, email <a href={`mailto:${SUPPORT}`} style={{ color:"#FCA5A5" }}>{SUPPORT}</a>
                </div>
              )}
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {mode==="register" && (
              <input value={form.name} onChange={e=>up("name",e.target.value)} placeholder="First name"
                style={{ ...inp(), background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.1)", color:"#fff", padding:"13px 16px" }} />
            )}
            <input type={mode==="login"?"text":"email"} value={form.email} onChange={e=>up("email",e.target.value)} placeholder="Email address" onKeyDown={e=>e.key==="Enter"&&submit()}
              style={{ ...inp(), background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.1)", color:"#fff", padding:"13px 16px" }} />
            <input type="password" value={form.password} onChange={e=>up("password",e.target.value)} placeholder={mode==="register"?"Password (8+ characters)":"Password"} onKeyDown={e=>e.key==="Enter"&&submit()}
              style={{ ...inp(), background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.1)", color:"#fff", padding:"13px 16px" }} />
            {mode==="register" && (
              <>
                <input type="number" value={form.age} onChange={e=>up("age",e.target.value)} placeholder="Your age" min="18" max="99"
                  style={{ ...inp(), background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.1)", color:"#fff", padding:"13px 16px" }} />
                <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer", marginTop:4 }}>
                  <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}
                    style={{ marginTop:3, flexShrink:0, accentColor:C.primary, width:15, height:15 }} />
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.6 }}>
                    I'm 18 or older and agree to the{" "}
                    <Link to="/terms" target="_blank" style={{ color:"#A78BFA", textDecoration:"underline" }}>Terms</Link>,{" "}
                    <Link to="/privacy" target="_blank" style={{ color:"#A78BFA", textDecoration:"underline" }}>Privacy Policy</Link>, and{" "}
                    <Link to="/disclaimer" target="_blank" style={{ color:"#A78BFA", textDecoration:"underline" }}>Disclaimer</Link>
                  </span>
                </label>
              </>
            )}
          </div>

          <button onClick={submit} disabled={loading} style={{ background:loading?"#3F3F46":"#fff", color:"#0A0A0F", border:"none", borderRadius:12, padding:"14px", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:FB, width:"100%", marginTop:20, opacity:loading?0.7:1, letterSpacing:"-0.01em" }}>
            {loading ? "Please wait…" : (mode==="login" ? "Sign in" : "Create account — it's free")}
          </button>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16 }}>
            <span style={{ fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:FB }}>
              {mode==="login" ? "No account? " : "Already have one? "}
              <span onClick={() => { setMode(m => m==="login"?"register":"login"); setError(""); }}
                style={{ color:"#A78BFA", cursor:"pointer", fontWeight:600 }}>
                {mode==="login" ? "Create one" : "Sign in"}
              </span>
            </span>
            {mode==="login" && (
              <span onClick={() => setShowForgot(true)} style={{ fontSize:13, color:"#A78BFA", cursor:"pointer", fontWeight:500 }}>
                Forgot password?
              </span>
            )}
          </div>
        </div>

        <p style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.2)", marginTop:24, lineHeight:1.6, fontFamily:FB }}>
          Need help? <a href={`mailto:${SUPPORT}`} style={{ color:"rgba(255,255,255,0.35)", textDecoration:"underline" }}>{SUPPORT}</a>
        </p>
      </div>
    </div>
  );
}
