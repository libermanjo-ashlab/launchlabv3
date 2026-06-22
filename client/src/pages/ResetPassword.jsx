import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { C, FH, FB, inp, btn, Logo } from "../components";

export default function ResetPassword() {
  const [searchParams]   = useSearchParams();
  const [password,   setPassword]   = useState("");
  const [password2,  setPassword2]  = useState("");
  const [status,     setStatus]     = useState("idle"); // idle | loading | success | error
  const [errMsg,     setErrMsg]     = useState("");
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const submit = async () => {
    if (!password) return setErrMsg("Please enter a new password");
    if (password.length < 8) return setErrMsg("Password must be at least 8 characters");
    if (password !== password2) return setErrMsg("Passwords do not match");
    if (!token) return setErrMsg("Invalid reset link — no token found");
    setStatus("loading"); setErrMsg("");
    try {
      await api.auth.resetPassword(token, password);
      setStatus("success");
    } catch (e) {
      setErrMsg(e.message);
      setStatus("error");
    }
  };

  const card = (content) => (
    <div style={{ minHeight:"100vh", background:C.dark, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:FB }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:32 }}>
          <Logo size={22}/>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.02em" }}>EARNEDLAB</div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"36px 32px" }}>
          {content}
        </div>
      </div>
    </div>
  );

  if (status === "success") return card(
    <>
      <div style={{ fontSize:40, marginBottom:16, textAlign:"center" }}>🔐</div>
      <div style={{ fontFamily:FH, fontWeight:700, fontSize:22, color:"#fff", marginBottom:12, letterSpacing:"-0.03em", textAlign:"center" }}>Password updated!</div>
      <p style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.7, marginBottom:24, textAlign:"center" }}>Your password has been changed. You can now sign in with your new password.</p>
      <button onClick={() => navigate("/")} style={{ ...btn(C.grad,"#fff",14), padding:"13px", borderRadius:12, width:"100%" }}>Sign in</button>
    </>
  );

  if (!token) return card(
    <>
      <div style={{ fontFamily:FH, fontWeight:700, fontSize:20, color:"#fff", marginBottom:12, letterSpacing:"-0.03em" }}>Invalid link</div>
      <p style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.7, marginBottom:20 }}>This reset link is missing a token. Please use the link from your email exactly as sent.</p>
      <button onClick={() => navigate("/")} style={{ background:"rgba(255,255,255,0.1)", color:"#fff", border:"none", borderRadius:12, padding:"12px 24px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:FB }}>Back to home</button>
    </>
  );

  return card(
    <>
      <div style={{ fontFamily:FH, fontWeight:700, fontSize:22, color:"#fff", marginBottom:8, letterSpacing:"-0.03em" }}>Choose a new password</div>
      <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.6, marginBottom:24 }}>Must be at least 8 characters.</p>

      {errMsg && <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#FCA5A5", marginBottom:16 }}>{errMsg}</div>}

      <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="New password (8+ characters)"
          style={{ ...inp(), background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.12)", color:"#fff", padding:"13px 16px" }}
        />
        <input
          type="password" value={password2} onChange={e => setPassword2(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Confirm new password"
          style={{ ...inp(), background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(255,255,255,0.12)", color:"#fff", padding:"13px 16px" }}
        />
      </div>

      <button onClick={submit} disabled={status === "loading"} style={{ ...btn(C.grad,"#fff",14), padding:"13px", borderRadius:12, width:"100%", opacity:status==="loading"?0.7:1 }}>
        {status === "loading" ? "Updating password…" : "Set new password"}
      </button>
    </>
  );
}
