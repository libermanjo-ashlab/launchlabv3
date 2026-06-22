import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import useStore from "../lib/store";
import { C, FH, FB, Logo } from "../components";

export default function VerifyEmail() {
  const [searchParams]  = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [errMsg, setErrMsg] = useState("");
  const { setAuth, token, user } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = searchParams.get("token");
    if (!verifyToken) { setStatus("error"); setErrMsg("No verification token found in this link."); return; }

    api.auth.verifyEmail(verifyToken)
      .then(() => {
        // Refresh user in store so emailVerified flips immediately
        if (token) {
          api.auth.me().then(({ user: u }) => setAuth(token, u)).catch(() => {});
        }
        setStatus("success");
      })
      .catch(e => { setStatus("error"); setErrMsg(e.message); });
  }, []);

  const card = (content) => (
    <div style={{ minHeight:"100vh", background:C.dark, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:FB }}>
      <div style={{ width:"100%", maxWidth:420, textAlign:"center" }}>
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

  if (status === "loading") return card(
    <p style={{ color:"rgba(255,255,255,0.5)", fontSize:15 }}>Verifying your email…</p>
  );

  if (status === "success") return card(
    <>
      <div style={{ fontSize:40, marginBottom:16 }}>✅</div>
      <div style={{ fontFamily:FH, fontWeight:700, fontSize:22, color:"#fff", marginBottom:12, letterSpacing:"-0.03em" }}>Email verified!</div>
      <p style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.7, marginBottom:24 }}>Your email address has been confirmed. You're all set.</p>
      <button onClick={() => navigate(token ? "/dashboard" : "/")} style={{ background:"#fff", color:C.dark, border:"none", borderRadius:12, padding:"13px 28px", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:FB, letterSpacing:"-0.01em" }}>
        {token ? "Go to dashboard" : "Sign in"}
      </button>
    </>
  );

  return card(
    <>
      <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
      <div style={{ fontFamily:FH, fontWeight:700, fontSize:22, color:"#fff", marginBottom:12, letterSpacing:"-0.03em" }}>Link expired or invalid</div>
      <p style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.7, marginBottom:24 }}>{errMsg || "This verification link has expired or already been used."}</p>
      <button onClick={() => navigate("/")} style={{ background:"rgba(255,255,255,0.1)", color:"#fff", border:"none", borderRadius:12, padding:"13px 28px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:FB }}>
        Back to home
      </button>
    </>
  );
}
