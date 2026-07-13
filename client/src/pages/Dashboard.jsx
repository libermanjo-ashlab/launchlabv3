import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import useStore from "../lib/store";
import { C, FH, FB, btn, btnO, card, Logo } from "../components";
import { Check, MailCheck } from "lucide-react";

function EmailVerificationBanner({ user, token, setAuth }) {
  const [sent,    setSent]    = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified) return null;

  const resend = async () => {
    setSending(true);
    try {
      await api.auth.resendVerification();
      setSent(true);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  return (
    <div style={{ background:C.warnBg, border:`1px solid ${C.warn}30`, borderRadius:12, padding:"12px 18px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
      <span style={{ fontSize:13, color:C.warn, fontFamily:FB, lineHeight:1.5, fontWeight:500 }}>
        <MailCheck size={16} style={{display:"inline-block",verticalAlign:"middle",marginRight:6}} aria-hidden="true" />Please verify your email address to keep your account secure.
      </span>
      {sent ? (
        <span style={{ fontSize:12, color:C.ok, fontFamily:FB, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}><Check size={12} strokeWidth={2.5} aria-hidden="true" />Verification email sent!</span>
      ) : (
        <button onClick={resend} disabled={sending} style={{ background:C.warn, border:"none", color:"#fff", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FB, flexShrink:0, opacity:sending?0.7:1 }}>
          {sending ? "Sending…" : "Resend email"}
        </button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, token, setAuth, clearAuth, businesses, setBusinesses, setCurrentBusiness } = useStore();
  const [loading,  setLoading]  = useState(true);
  const [planInfo, setPlanInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(()=>{
    api.businesses.list().then(d=>setBusinesses(d.businesses)).catch(console.error).finally(()=>setLoading(false));
    api.subscriptions.me().then(setPlanInfo).catch(()=>{});
  },[]);

  const logout = () => { clearAuth(); navigate("/"); };

  const openPortal = async () => {
    try {
      const { url } = await api.subscriptions.portal();
      window.location.href = url;
    } catch(e) { console.error(e); }
  };

  const simulate = async (val) => {
    try {
      await api.auth.simulatePlan(val);
      const fresh = await api.subscriptions.me();
      setPlanInfo(fresh);
    } catch(e) { console.error(e); }
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FB }}>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, height:54, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <Logo size={26}/>
          <span style={{ fontFamily:FH, fontWeight:700, fontSize:17, letterSpacing:"-0.04em", background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>EarnedLab</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <span style={{ fontSize:13, color:C.muted }}>{user?.name}</span>
          {user?.age && <span style={{ fontSize:11, color:C.muted, background:C.bg, borderRadius:20, padding:"3px 10px", border:`1px solid ${C.border}` }}>Age {user.age}</span>}
          <button onClick={()=>navigate("/pricing")} style={{ ...btnO(C.muted,12), padding:"5px 12px" }}>Plans</button>
          <button onClick={logout} style={{ ...btnO(C.muted,12), padding:"5px 12px" }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"52px 24px" }}>
        <EmailVerificationBanner user={user} token={token} setAuth={setAuth} />
        {planInfo?.isAdmin && (
          <div style={{ ...card("16px 18px"), marginBottom:20, background:"#0F0F17", border:"1px solid #7C3AED40" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:FH, fontWeight:700, fontSize:14, color:"#fff" }}>Admin testing mode</span>
                <span style={{ background:"#7C3AED25", color:"#C4B5FD", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.04em" }}>
                  {planInfo.simulating ? `Previewing: ${planInfo.simulating.replace("_"," ")}` : "Full access"}
                </span>
              </div>
              <button onClick={()=>navigate("/admin")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#C4B5FD", fontFamily:FB, padding:0, textDecoration:"underline" }}>
                Admin panel →
              </button>
            </div>
            <p style={{ fontSize:12, color:"#9CA3AF", marginBottom:14, fontFamily:FB, lineHeight:1.6 }}>
              Switch your effective plan to preview exactly what each tier sees and how the paywall behaves. This only affects your account — no other user is impacted.
            </p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[["full","Full access"],["trial","Trial (active)"],["trial_expired","Trial (expired)"],["starter","Starter $39"],["pro","Pro $89"],["pro_autopilot","Pro Autopilot $199"]].map(([val,label])=>{
                const isActive = (val==="full" && !planInfo.simulating) || planInfo.simulating===val;
                return (
                  <button key={val} onClick={()=>simulate(val)} style={{ ...btn(isActive?"#7C3AED":"#27272A","#fff",11), padding:"6px 12px" }}>{label}</button>
                );
              })}
            </div>
          </div>
        )}

        {planInfo && (planInfo.isTrial || planInfo.locked) && (
          <div style={{ ...card("14px 18px"), marginBottom:24, background:planInfo.locked?"#FEF2F2":"#F8FAFC", border:`1px solid ${planInfo.locked?"#DC262625":C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:planInfo.locked?C.err:C.text, fontFamily:FB, marginBottom:2 }}>
                {planInfo.locked ? "Your free trial has ended" : `${planInfo.trialDaysLeft} day${planInfo.trialDaysLeft!==1?"s":""} left on your free trial`}
              </div>
              <div style={{ fontSize:12, color:C.muted, fontFamily:FB }}>
                {planInfo.locked ? "Choose a plan to keep using the marketing and management agents." : "Upgrade anytime to unlock unlimited agent runs."}
              </div>
            </div>
            <button onClick={()=>navigate("/pricing")} style={{ ...btn(planInfo.locked?C.err:C.dark,"#fff",12), flexShrink:0 }}>View plans</button>
          </div>
        )}

        {planInfo && !planInfo.isTrial && !planInfo.locked && !planInfo.isAdmin && (
          <div style={{ ...card("12px 18px"), marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:13, color:C.muted, fontFamily:FB }}>
              <span style={{ fontWeight:600, color:C.text }}>{planInfo.planInfo?.name || planInfo.plan}</span> plan · Renews monthly
            </div>
            <button onClick={openPortal} style={{ ...btnO(C.muted,12), padding:"5px 14px", flexShrink:0 }}>
              Manage billing
            </button>
          </div>
        )}

        <div style={{ fontFamily:FH, fontWeight:700, fontSize:28, letterSpacing:"-0.05em", marginBottom:4 }}>
          {user?.name ? `Welcome back, ${user.name}.` : "Welcome back."}
        </div>
        <p style={{ color:C.muted, fontSize:15, marginBottom:36 }}>What would you like to work on?</p>

        {/* New business CTA */}
        <div onClick={()=>navigate("/discovery")} style={{ ...card("28px"), background:C.dark, border:"none", cursor:"pointer", marginBottom:28, boxShadow:"0 8px 32px rgba(0,0,0,0.18)", transition:"transform 0.15s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:20, color:"#fff", marginBottom:6 }}>Start a new business</div>
            </div>
            <div style={{ fontSize:28, color:"rgba(255,255,255,0.5)" }}>+</div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:18 }}>
            {["AI idea matching","Automated setup","Marketing agent","Management agent"].map(t=>(
              <span key={t} style={{ background:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.85)", fontSize:11, fontWeight:500, padding:"4px 10px", borderRadius:20 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Businesses */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:C.muted }}>Loading...</div>
        ) : businesses.length > 0 && (
          <>
            <div style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:12 }}>Your businesses</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {businesses.map(b=>{
                const idea  = (()=>{try{return JSON.parse(b.ideaData);}catch{return {};}})();
                return (
                  <div key={b.id} onClick={()=>{setCurrentBusiness(b.id);navigate(b.status==="live"?`/hub/${b.id}`:`/creation/${b.id}`);}}
                    style={{ ...card(), cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"box-shadow 0.15s" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <span style={{ fontFamily:FH, fontWeight:600, fontSize:16 }}>{b.name}</span>
                        <span style={{ background:b.status==="live"?C.okBg:"#F4F4F5", color:b.status==="live"?C.ok:C.muted, fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.3px" }}>
                          {b.status==="live"?"Live":"Setup"}
                        </span>
                      </div>
                      <div style={{ fontSize:13, color:C.muted }}>{idea.name||b.name} &middot; {b.location}</div>
                    </div>
                    <span style={{ color:C.muted, fontSize:18 }}>&#8250;</span>
                  </div>
                );
              })}
            </div>
            {businesses.some(b=>b.status==="live") && (
              <div style={{ marginTop:16, textAlign:"center" }}>
                <button
                  onClick={()=>{
                    const live = businesses.filter(b=>b.status==="live");
                    live.forEach(b=>localStorage.removeItem(`earnedlab_toured_${b.id}`));
                    if (live.length===1) { setCurrentBusiness(live[0].id); navigate(`/hub/${live[0].id}`); }
                  }}
                  style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:C.muted, fontFamily:FB, textDecoration:"underline", padding:0 }}>
                  Replay onboarding tour
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
