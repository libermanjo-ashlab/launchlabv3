import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import useStore from "../lib/store";
import { C, FH, FB, btn, btnO } from "../components";

export default function Pricing() {
  const { user, token } = useStore();
  const [plans,   setPlans]   = useState(null);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(null);
  const [error,   setError]   = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.subscriptions.plans().then(setPlans).catch(console.error);
    if (token) api.subscriptions.me().then(setCurrent).catch(()=>{});
  }, [token]);

  const choose = async planId => {
    if (!token) return navigate("/");
    setLoading(planId); setError("");
    try {
      const { url } = await api.subscriptions.checkout(planId);
      window.location.href = url;
    } catch(e) { setError(e.message); setLoading(null); }
  };

  const tierColor = { starter:C.primary, active:C.accent, autopilot:"#DB2777" };

  return (
    <div style={{ minHeight:"100vh", background:C.dark, fontFamily:FB, padding:"56px 24px 80px" }}>
      <div style={{ maxWidth:980, margin:"0 auto" }}>
        <div onClick={()=>navigate(token?"/dashboard":"/")} style={{ color:"#ffffff50", fontSize:13, cursor:"pointer", marginBottom:32, fontFamily:FB }}>&#8592; Back</div>

        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:36, color:"#fff", letterSpacing:"-0.04em", marginBottom:12 }}>Choose your plan</div>
          <p style={{ fontSize:15, color:"#ffffff60" }}>
            {current?.isTrial && !current.trialExpired
              ? `You have ${current.trialDaysLeft} day${current.trialDaysLeft!==1?"s":""} left on your free trial.`
              : current?.trialExpired
              ? "Your free trial has ended — choose a plan to keep building."
              : "7 days free to start. Cancel anytime."}
          </p>
        </div>

        {error && <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:10, padding:"12px 16px", fontSize:13, color:"#FCA5A5", marginBottom:24, maxWidth:600, margin:"0 auto 24px", textAlign:"center" }}>{error}</div>}

        {!plans ? (
          <div style={{ textAlign:"center", color:"#ffffff40", padding:60 }}>Loading plans...</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {plans.plans.map(p => {
              const isCurrent = current?.plan === p.id;
              const color = tierColor[p.id];
              const popular = p.id === "active";
              return (
                <div key={p.id} style={{ background:"rgba(255,255,255,0.04)", border:`1.5px solid ${popular?color:"rgba(255,255,255,0.1)"}`, borderRadius:18, padding:"28px 24px", position:"relative", display:"flex", flexDirection:"column" }}>
                  {popular && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:color, color:"#fff", fontSize:10, fontWeight:700, padding:"4px 14px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em" }}>Most popular</div>}
                  <div style={{ fontFamily:FH, fontWeight:700, fontSize:19, color:"#fff", marginBottom:6 }}>{p.name}</div>
                  <p style={{ fontSize:13, color:"#ffffff60", marginBottom:18, lineHeight:1.55 }}>{p.tagline}</p>
                  <div style={{ display:"flex", alignItems:"baseline", gap:5, marginBottom:24 }}>
                    <span style={{ fontFamily:FH, fontWeight:700, fontSize:38, color, letterSpacing:"-0.04em" }}>${p.price}</span>
                    <span style={{ fontSize:14, color:"#ffffff50" }}>/month</span>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28, flex:1 }}>
                    {p.features.map((f,i)=>(
                      <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                        <span style={{ color, fontSize:14, fontWeight:700, flexShrink:0, marginTop:1 }}>+</span>
                        <span style={{ fontSize:13, color:"#ffffffcc", lineHeight:1.55 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>choose(p.id)} disabled={loading===p.id||isCurrent}
                    style={{ ...btn(isCurrent?"rgba(255,255,255,0.1)":color,"#fff",14), width:"100%", padding:"12px", borderRadius:10, opacity:loading===p.id?0.7:1, cursor:isCurrent?"default":"pointer" }}>
                    {isCurrent?"Current plan":loading===p.id?"Redirecting...":`Choose ${p.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {plans && (
          <p style={{ textAlign:"center", fontSize:12, color:"#ffffff30", marginTop:32 }}>
            Free trial includes {plans.trial.marketingRuns} marketing analyses and {plans.trial.managementImplements} live implementation, for {plans.trial.days} days.
          </p>
        )}
      </div>
    </div>
  );
}
