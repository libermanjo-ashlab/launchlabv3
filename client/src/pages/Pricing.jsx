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

  const isPaid = current && !current.isTrial && !current.locked;

  const choose = async planId => {
    if (!token) return navigate("/signup");
    setLoading(planId); setError("");
    try {
      const { url } = await api.subscriptions.checkout(planId);
      window.location.href = url;
    } catch(e) { setError(e.message); setLoading(null); }
  };

  const openPortal = async () => {
    setLoading("portal"); setError("");
    try {
      const { url } = await api.subscriptions.portal();
      window.location.href = url;
    } catch(e) { setError(e.message); setLoading(null); }
  };

  const tierColor = { starter:"#6366F1", pro:C.primary, pro_autopilot:"#DB2777" };
  const popularId = "pro";

  return (
    <div style={{ minHeight:"100vh", background:C.dark, fontFamily:FB, padding:"56px 24px 80px" }}>
      <div style={{ maxWidth:980, margin:"0 auto" }}>
        <div onClick={()=>navigate(token?"/dashboard":"/")} style={{ color:"#ffffff50", fontSize:13, cursor:"pointer", marginBottom:32, fontFamily:FB }}>&#8592; Back</div>

        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:36, color:"#fff", letterSpacing:"-0.04em" }}>Choose your plan</div>
        </div>

        {error && <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:10, padding:"12px 16px", fontSize:13, color:"#FCA5A5", marginBottom:24, maxWidth:600, margin:"0 auto 24px", textAlign:"center" }}>{error}</div>}

        {!plans ? (
          <div style={{ textAlign:"center", color:"#ffffff40", padding:60 }}>Loading plans...</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {plans.plans.map(p => {
              const isCurrent = current?.plan === p.id;
              const color = tierColor[p.id] || C.primary;
              const popular = p.id === popularId;
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
                  {isCurrent ? (
                    <button disabled style={{ ...btn("rgba(255,255,255,0.1)","#fff",14), width:"100%", padding:"12px", borderRadius:10, cursor:"default", opacity:0.7 }}>
                      Current plan
                    </button>
                  ) : isPaid ? (
                    <button onClick={openPortal} disabled={loading==="portal"}
                      style={{ ...btn(color,"#fff",14), width:"100%", padding:"12px", borderRadius:10, opacity:loading==="portal"?0.7:1 }}>
                      {loading==="portal" ? "Redirecting…" : `Switch to ${p.name}`}
                    </button>
                  ) : (
                    <button onClick={()=>choose(p.id)} disabled={loading===p.id}
                      style={{ ...btn(color,"#fff",14), width:"100%", padding:"12px", borderRadius:10, opacity:loading===p.id?0.7:1 }}>
                      {loading===p.id ? "Redirecting…" : `Choose ${p.name}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {plans && (
          <div style={{ textAlign:"center", marginTop:32 }}>
            {isPaid && (
              <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"20px 24px", maxWidth:480, margin:"0 auto 28px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"#fff", fontFamily:FH }}>Manage your subscription</div>
                  <div style={{ fontSize:12, color:"#ffffff50", marginTop:3 }}>Upgrade, downgrade, or cancel — handled by our secure billing portal.</div>
                </div>
                <button onClick={openPortal} disabled={loading==="portal"}
                  style={{ ...btnO("rgba(255,255,255,0.5)", 13), padding:"9px 20px", opacity:loading==="portal"?0.6:1, whiteSpace:"nowrap" }}>
                  {loading==="portal" ? "Redirecting…" : "Billing portal →"}
                </button>
              </div>
            )}
            <p style={{ fontSize:12, color:"#ffffff30", marginTop:8 }}>
              Questions? Email <a href="mailto:support@earnedlab.com" style={{ color:"#ffffff50", textDecoration:"underline" }}>support@earnedlab.com</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
