import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useStore from "../lib/store";
import { api } from "../lib/api";
import { C, FH, FB, btn, btnO, card, inp, lbl, GuidePanel, DownloadBtn } from "../components";

const MODE_CYCLE = ["Manual","Guided","Full auto"];

function StatCard({ label, value, onChange, prefix="", suffix="" }) {
  const [editing, setEditing] = useState(false);
  const [local,   setLocal]   = useState(String(value||"0"));
  const save = () => { onChange(Number(local)||0); setEditing(false); };
  return (
    <div style={{ ...card("16px 18px"), position:"relative" }}>
      <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8, fontFamily:FB }}>{label}</div>
      {editing ? (
        <div style={{ display:"flex", gap:6 }}>
          <input value={local} onChange={e=>setLocal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} autoFocus style={{ ...inp(), flex:1, fontSize:20, padding:"6px 10px" }} />
          <button onClick={save} style={{ ...btn(C.primary,"#fff",12), padding:"6px 12px" }}>Save</button>
        </div>
      ) : (
        <div onClick={()=>{setLocal(String(value||"0"));setEditing(true);}} style={{ cursor:"pointer" }}>
          <span style={{ fontFamily:FH, fontWeight:700, fontSize:28, letterSpacing:"-0.04em", color:C.text }}>{prefix}{Number(value||0).toLocaleString()}{suffix}</span>
          <span style={{ fontSize:11, color:C.muted, marginLeft:8, fontFamily:FB }}>tap to edit</span>
        </div>
      )}
    </div>
  );
}

function UpgradeCard({ reason, navigate }) {
  return (
    <div style={{ ...card("16px 18px"), background:"#FFFBEB", border:"1px solid #D9770630", marginBottom:16 }}>
      <div style={{ fontFamily:FH, fontWeight:600, fontSize:14, marginBottom:6, color:"#92400E" }}>Upgrade needed</div>
      <p style={{ fontSize:13, color:"#92400E", lineHeight:1.6, marginBottom:12, fontFamily:FB }}>{reason}</p>
      <button onClick={()=>navigate("/pricing")} style={{ ...btn("#D97706","#fff",13) }}>View plans</button>
    </div>
  );
}

function AgentPanel({ businessId, metrics, age, planInfo }) {
  const [insights,     setInsights]     = useState([]);
  const [running,      setRunning]      = useState(false);
  const [implementing, setImplementing] = useState(null);
  const [liveUrl,      setLiveUrl]      = useState(null);
  const [activity,     setActivity]     = useState([]);
  const [error,        setError]        = useState("");
  const [access,       setAccess]       = useState(null);
  const navigate = useNavigate();

  const refreshAccess = () => api.agents.access(businessId).then(setAccess).catch(()=>{});

  useEffect(()=>{
    api.agents.activity(businessId).then(d=>setActivity(d.activity||[])).catch(()=>{});
    api.agents.deployStatus(businessId).then(d=>{ if(d.liveUrl) setLiveUrl(d.liveUrl); }).catch(()=>{});
    refreshAccess();
  },[businessId]);

  const runAnalysis = async () => {
    setRunning(true); setError(""); setInsights([]);
    try {
      const {insights:data} = await api.agents.runMarketing(businessId);
      setInsights(Array.isArray(data) ? data : []);
      api.agents.activity(businessId).then(d=>setActivity(d.activity||[])).catch(()=>{});
      refreshAccess();
    } catch(e){ setError(e.message); }
    setRunning(false);
  };

  const implement = async insight => {
    setImplementing(insight.id); setError("");
    try {
      const result = await api.agents.implement(businessId,insight);
      setLiveUrl(result.liveUrl);
      api.agents.activity(businessId).then(d=>setActivity(d.activity||[])).catch(()=>{});
      refreshAccess();
    } catch(e){ setError(e.message); }
    setImplementing(null);
  };

  const priorityClr = { high:"#EF4444", medium:C.warn, low:C.muted };
  const typeLabel    = { website:"Website", social:"Social Media", pricing:"Pricing", outreach:"Outreach" };

  return (
    <div>
      {error && (
        <div style={{ ...card("12px 16px"), background:C.errBg, border:`1px solid #DC262625`, marginBottom:16, fontSize:13, color:C.err, fontFamily:FB }}>
          {error}
          {error.includes("NETLIFY_TOKEN") && <div style={{ marginTop:8, lineHeight:1.7 }}>Add <code style={{ background:"#fee2e2", padding:"1px 5px", borderRadius:4 }}>NETLIFY_TOKEN</code> to Railway environment variables. Get it at <a href="https://app.netlify.com/user/applications" target="_blank" rel="noopener noreferrer" style={{ color:C.err }}>app.netlify.com/user/applications</a>.</div>}
          {error.includes("Generate your website") && <div style={{ marginTop:6 }}>Generate your website in the Marketing Agent tab first.</div>}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>
        {/* Marketing Agent */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:C.primary }} />
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:15 }}>Marketing Agent</span>
            <span style={{ marginLeft:"auto", background:C.primaryBg, color:C.primary, fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.04em" }}>Full auto</span>
          </div>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.65, marginBottom:14, fontFamily:FB }}>
            Analyzes your business data and finds the highest-impact changes. Each insight is specific to your numbers.
          </p>
          {access?.effective?.isTrial && !access.effective.trialExpired && !access.effective.locked && (
            <div style={{ fontSize:11, color:C.muted, marginBottom:10, fontFamily:FB, display:"flex", alignItems:"center", gap:10 }}>
              <span>Free trial: {Math.max(0,3-(access.usage?.marketingRuns||0))} marketing analyses left</span>
              {planInfo?.isAdmin && (
                <button onClick={async()=>{ await api.agents.resetUsage(businessId).catch(()=>{}); refreshAccess(); }} style={{ ...btnO("#9333EA",10), padding:"2px 8px" }}>Reset usage (admin)</button>
              )}
            </div>
          )}
          {access && !access.marketing.allowed && <UpgradeCard reason={access.marketing.reason} navigate={navigate} />}
          <button onClick={runAnalysis} disabled={running || (access && !access.marketing.allowed)} style={{ ...btn(running?"#9CA3AF":(access&&!access.marketing.allowed)?"#D1D5DB":C.grad), width:"100%", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"center", gap:10, cursor:(access&&!access.marketing.allowed)?"not-allowed":"pointer" }}>
            {running && <span style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite", flexShrink:0 }}/>}
            {running?"Analyzing your business...":(access&&!access.marketing.allowed)?"Upgrade to run analysis":"Run marketing analysis"}
          </button>

          {running && (
            <div style={{ ...card("14px"), marginBottom:12, background:C.primaryBg, border:`1px solid ${C.primary}20` }}>
              {["Reviewing revenue and client trends","Checking engagement and conversion rates","Finding the highest-impact opportunities","Building your prioritized action list"].map((s,i)=>(
                <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"5px 0", opacity:0.6+i*0.1 }}>
                  <div style={{ width:4, height:4, borderRadius:"50%", background:C.primary, flexShrink:0 }} />
                  <span style={{ fontSize:12, color:C.primary, fontFamily:FB }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {insights.map((insight,i)=>(
            <div key={i} style={{ ...card("14px 16px"), marginBottom:10, border:`1px solid ${insight.priority==="high"?"#EF444425":C.border}` }}>
              <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
                <span style={{ background:priorityClr[insight.priority]+"18", color:priorityClr[insight.priority], fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FB }}>{insight.priority}</span>
                <span style={{ background:C.primaryBg, color:C.primary, fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.04em", fontFamily:FB }}>{typeLabel[insight.type]||insight.type}</span>
              </div>
              <p style={{ fontSize:12, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:3, fontFamily:FB }}>What the agent noticed</p>
              <p style={{ fontSize:13, color:C.text, lineHeight:1.6, marginBottom:8, fontFamily:FB }}>{insight.agentObservation}</p>
              <p style={{ fontSize:12, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:3, fontFamily:FB }}>Recommended action</p>
              <p style={{ fontSize:13, color:C.text, lineHeight:1.6, marginBottom:8, fontFamily:FB }}>{insight.recommendation}</p>
              <div style={{ background:C.okBg, borderRadius:6, padding:"6px 10px", marginBottom:10, fontSize:12, color:C.ok, fontFamily:FB }}>Expected: {insight.expectedImpact}</div>
              {access && !access.management.allowed ? (
                <button onClick={()=>navigate("/pricing")} style={{ ...btn("#D97706","#fff",12), width:"100%" }}>Upgrade to implement this</button>
              ) : (
                <button onClick={()=>implement(insight)} disabled={!!implementing} style={{ ...btn(implementing===insight.id?"#9CA3AF":C.dark,"#fff",12), width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:implementing&&implementing!==insight.id?0.5:1 }}>
                  {implementing===insight.id&&<span style={{ width:12, height:12, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/>}
                  {implementing===insight.id?"Management agent implementing...":"Hand off to management agent"}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Management Agent panel */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:C.ok }} />
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:15 }}>Management Agent</span>
          </div>

          {/* Live site */}
          <div style={{ ...card("16px 18px"), marginBottom:12, background:C.dark, border:`1px solid ${liveUrl?"#4ADE8030":"rgba(255,255,255,0.06)"}` }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:6 }}>Live website</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:liveUrl?"#4ADE80":"rgba(255,255,255,0.2)", boxShadow:liveUrl?"0 0 6px #4ADE8088":undefined }} />
              <span style={{ fontSize:14, fontFamily:FH, fontWeight:600, color:liveUrl?"#4ADE80":"rgba(255,255,255,0.4)" }}>{liveUrl?"Live":"Not deployed yet"}</span>
            </div>
            {liveUrl&&<a href={liveUrl} target="_blank" rel="noopener noreferrer" style={{ display:"block", fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:6, fontFamily:FB, wordBreak:"break-all", textDecoration:"none" }}>{liveUrl} &#8599;</a>}
            {!liveUrl&&<p style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:4, fontFamily:FB }}>Created automatically when you implement your first insight</p>}
          </div>

          {/* Other channels note */}
          <div style={{ ...card("14px 16px"), marginBottom:12 }}>
            <p style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10, fontFamily:FB }}>Other implementation channels</p>
            {[["Social Media","Post updated content"],["Email campaign","Reach your contact list"],["Booking availability","Adjust your schedule"],["Google Business","Update your listing"]].map(([n,d],i,a)=>(
              <div key={n} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:i<a.length-1?`1px solid ${C.border}`:"none" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, fontFamily:FB }}>{n}</div>
                  <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{d}</div>
                </div>
                <span style={{ background:C.okBg, color:C.ok, fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.04em" }}>Ready</span>
              </div>
            ))}
          </div>

          {/* Activity log */}
          {activity.length>0&&(
            <div style={{ ...card("14px 16px"), background:C.dark }}>
              <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10, fontFamily:FB }}>Agent log</p>
              {activity.slice(0,6).map((e,i)=>(
                <div key={i} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:i<5?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:e.agent==="marketing"?C.primary:"#4ADE80", flexShrink:0, marginTop:5 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", fontFamily:FB, fontWeight:500 }}>{e.action}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:FB }}>{e.detail}</div>
                  </div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", fontFamily:FB, flexShrink:0 }}>{new Date(e.timestamp).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AutopilotCard({ businessId, planInfo, navigate }) {
  const [enabled, setEnabled] = useState(null);
  const [busy,    setBusy]    = useState(false);
  const isAutopilotPlan = planInfo?.plan === "autopilot";

  useEffect(()=>{
    api.agents.getAutopilot(businessId).then(d=>setEnabled(!!d.autopilotEnabled)).catch(()=>setEnabled(false));
  },[businessId]);

  const toggle = async () => {
    if (!isAutopilotPlan) return navigate("/pricing");
    setBusy(true);
    try {
      const { autopilotEnabled } = await api.agents.setAutopilot(businessId, !enabled);
      setEnabled(autopilotEnabled);
    } catch(e) { /* silently fail, access already gated by plan check above */ }
    setBusy(false);
  };

  return (
    <div style={{ ...card("16px 18px"), marginBottom:24, background:isAutopilotPlan?(enabled?C.okBg:C.surface):"#F4F4F5", border:`1px solid ${isAutopilotPlan&&enabled?C.ok+"30":C.border}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <div style={{ fontFamily:FH, fontWeight:600, fontSize:14 }}>Autopilot mode</div>
            {!isAutopilotPlan && <span style={{ background:"#F4F4F5", color:C.muted, fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.04em" }}>Autopilot plan only</span>}
            {isAutopilotPlan && enabled && <span style={{ background:C.ok, color:"#fff", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.04em" }}>Running</span>}
          </div>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.6, fontFamily:FB }}>
            {isAutopilotPlan
              ? "When enabled, your agents run on their own schedule — analyzing performance and implementing changes automatically, with no input from you."
              : "Let your business run itself — agents check in automatically and implement improvements without you doing anything. Available on the Autopilot plan ($102/mo)."}
          </p>
        </div>
        <button onClick={toggle} disabled={busy||enabled===null} style={{ ...btn(isAutopilotPlan?(enabled?C.err:C.ok):"#D97706","#fff",12), flexShrink:0, marginLeft:16 }}>
          {!isAutopilotPlan ? "Upgrade" : busy ? "..." : enabled ? "Turn off" : "Turn on"}
        </button>
      </div>
    </div>
  );
}

export default function Hub() {
  const { id: businessId } = useParams();
  const { user, hubModes, setHubMode } = useStore();
  const [business,    setBusiness]   = useState(null);
  const [outputs,     setOutputs]    = useState([]);
  const [integs,      setIntegs]     = useState([]);
  const [metrics,     setMetrics]    = useState({ revenue:{this_month:0,last_month:0,total:0}, clients:{active:0,total:0}, leads:{this_month:0,total:0}, social:{instagram:0,tiktok:0,facebook:0,google_reviews:0,google_rating:0}, bookings:{this_week:0,this_month:0} });
  const [loading,     setLoading]    = useState(true);
  const [tab,         setTab]        = useState("overview");
  const [genLoading,  setGenLoading] = useState({});
  const [genError,    setGenError]   = useState("");
  const [hubQ,        setHubQ]       = useState("");
  const [hubAns,      setHubAns]     = useState("");
  const [hubLoading,  setHubLoading] = useState(false);
  const [mgmtQ,       setMgmtQ]     = useState("");
  const [mgmtAns,     setMgmtAns]   = useState("");
  const [chatOpen,    setChatOpen]   = useState(false);
  const [chatMsgs,    setChatMsgs]   = useState([{ role:"ai", text:"I am here to help. Ask me about your business, setup steps, or growth strategy." }]);
  const [planInfo,    setPlanInfo]   = useState(null);
  const navigate = useNavigate();

  const modes   = hubModes[businessId]||{ marketing:"Full auto", management:"Manual" };
  const age     = user?.age;
  const isMinor = age && age < 18;
  const isYoung = age && age >= 18 && age < 25;

  useEffect(()=>{
    api.subscriptions.me().then(setPlanInfo).catch(()=>{});
  },[]);

  useEffect(()=>{
    Promise.all([
      api.businesses.get(businessId),
      api.businesses.outputs(businessId),
      api.integrations.list(businessId),
      api.metrics.get(businessId),
    ]).then(([{business:b},{outputs:o},{integrations:ig},{metrics:m}])=>{
      setBusiness(b); setOutputs(o); setIntegs(ig);
      if(m) setMetrics(m);
    }).catch(console.error).finally(()=>setLoading(false));
  },[businessId]);

  const idea     = (()=>{try{return JSON.parse(business?.ideaData||"{}");}catch{return {};}})();
  const getOutput= type=>outputs.find(o=>o.type===type);
  const isConn   = p=>integs.find(i=>i.provider===p)?.status==="connected";
  const cycleMode= stage=>{const cur=modes[stage]||"Manual";setHubMode(businessId,stage,MODE_CYCLE[(MODE_CYCLE.indexOf(cur)+1)%MODE_CYCLE.length]);};
  const saveM    = async(path,v)=>{const parts=path.split(".");const u=JSON.parse(JSON.stringify(metrics));let o=u;for(let i=0;i<parts.length-1;i++)o=o[parts[i]];o[parts[parts.length-1]]=v;setMetrics(u);await api.metrics.save(businessId,u).catch(()=>{});};
  const generate = async(type,apiCall)=>{setGenLoading(p=>({...p,[type]:true}));setGenError("");try{const{output}=await apiCall(businessId);setOutputs(p=>{const ex=p.find(o=>o.type===type);return ex?p.map(o=>o.type===type?output:o):[...p,output];});}catch(e){setGenError(e.message);}finally{setGenLoading(p=>({...p,[type]:false}));}};
  const askHub   = async()=>{if(!hubQ.trim())return;setHubLoading(true);setHubAns("");try{const{suggestion}=await api.metrics.suggest(businessId,hubQ);setHubAns(suggestion);}catch(e){setHubAns("Error: "+e.message);}setHubLoading(false);};
  const askMgmt  = async()=>{if(!mgmtQ.trim())return;setHubLoading(true);try{const{suggestion}=await api.metrics.suggest(businessId,mgmtQ);setMgmtAns(suggestion);}catch(e){setMgmtAns("Error: "+e.message);}setHubLoading(false);setMgmtQ("");};
  const sendChat = async msg=>{setChatMsgs(p=>[...p,{role:"user",text:msg}]);try{const{reply}=await api.generate.chat(msg,businessId);setChatMsgs(p=>[...p,{role:"ai",text:reply}]);}catch{setChatMsgs(p=>[...p,{role:"ai",text:"Sorry, could not process that."}]);}};

  if(loading) return (
    <div style={{ display:"flex", minHeight:"100vh", alignItems:"center", justifyContent:"center", background:C.bg }}>
      <div style={{ width:32, height:32, borderRadius:"50%", border:`3px solid ${C.primary}25`, borderTopColor:C.primary, animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  const navItems = [
    { id:"overview",   label:"Overview"        },
    { id:"hub",        label:"Hub"             },
    { id:"marketing",  label:"Marketing Agent" },
    { id:"management", label:"Management Agent"},
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:FB }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Sidebar */}
      <div style={{ width:220, background:C.dark, display:"flex", flexDirection:"column", flexShrink:0, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, width:120, height:120, background:`radial-gradient(ellipse,${C.primary}18,transparent 70%)`, pointerEvents:"none" }} />
        <div style={{ padding:"22px 18px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", position:"relative" }}>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:16, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.03em", marginBottom:6 }}>LaunchLab</div>
          <div style={{ fontFamily:FH, fontWeight:600, fontSize:14, color:"#fff", marginBottom:4, lineHeight:1.3 }}>{business?.name}</div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:"#4ADE80" }} />
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:FB }}>{business?.location}</span>
          </div>
          {planInfo && (
            <div onClick={()=>navigate("/pricing")} style={{ cursor:"pointer", display:"inline-flex", alignItems:"center", gap:5, background:planInfo.locked?"rgba(220,38,38,0.15)":`${C.primary}20`, border:`1px solid ${planInfo.locked?"#DC262640":C.primary+"40"}`, borderRadius:6, padding:"3px 8px" }}>
              <span style={{ fontSize:10, color:planInfo.locked?"#FCA5A5":"#A78BFA", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", fontFamily:FB }}>
                {planInfo.isAdmin
                  ? `Admin — ${planInfo.simulating ? "previewing "+planInfo.simulating.replace("_"," ") : "full access"}`
                  : planInfo.locked ? "Trial expired" : planInfo.isTrial ? `Trial — ${planInfo.trialDaysLeft}d left` : planInfo.plan}
              </span>
            </div>
          )}
        </div>
        <nav style={{ padding:"12px 8px", flex:1 }}>
          {navItems.map(({id,label})=>(
            <div key={id} onClick={()=>setTab(id)} style={{ padding:"10px 14px", borderRadius:10, marginBottom:3, background:tab===id?`${C.primary}25`:"transparent", color:tab===id?"#fff":"rgba(255,255,255,0.45)", cursor:"pointer", fontSize:13, fontWeight:tab===id?600:400, fontFamily:FB, borderLeft:tab===id?`3px solid ${C.primary}`:"3px solid transparent", transition:"all 0.12s" }}>
              {label}
            </div>
          ))}
        </nav>
        <div style={{ padding:"10px 8px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <div onClick={()=>navigate(`/creation/${businessId}`)} style={{ padding:"8px 12px", borderRadius:8, color:"rgba(255,255,255,0.25)", cursor:"pointer", fontSize:12, fontFamily:FB }}>Edit setup tasks</div>
          <div onClick={()=>navigate("/dashboard")} style={{ padding:"8px 12px", borderRadius:8, color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:12, fontFamily:FB }}>All businesses</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, overflowY:"auto", background:C.bg }}>
        <div style={{ padding:"28px 32px 80px", maxWidth:1100 }}>

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {tab==="overview" && (
            <div>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, letterSpacing:"-0.04em", marginBottom:4 }}>{business?.name}</div>
              <p style={{ color:C.muted, fontSize:14, marginBottom:24, fontFamily:FB }}>{idea.name} &middot; {business?.location}</p>

              {/* Quick wins checklist */}
              <div style={{ ...card("16px 20px"), marginBottom:20, border:`1px solid ${C.primary}15`, background:C.primaryBg }}>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:14, marginBottom:12 }}>Getting started</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { done:!!getOutput("website"),           label:"Generate your website",          tab:"marketing" },
                    { done:isConn("stripe"),                 label:`Connect ${isMinor?"PayPal/Venmo":"Stripe"}`, tab:"hub" },
                    { done:isConn("google"),                 label:"Set up Google Business",         tab:"hub" },
                    { done:metrics.clients.active>0,         label:"Log your first client",          tab:"management" },
                    { done:metrics.revenue.this_month>0,     label:"Log your first revenue",         tab:"management" },
                    { done:isConn("netlify"),                label:"Deploy your live website",       tab:"marketing" },
                  ].filter(item=>!(isMinor&&item.label.includes("Stripe"))).map((item,i)=>(
                    <div key={i} onClick={()=>setTab(item.tab)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:8, cursor:"pointer", background:item.done?"#F0FDF4":"rgba(124,58,237,0.04)", border:`1px solid ${item.done?C.ok+"25":C.primary+"15"}`, transition:"all 0.12s" }}>
                      <div style={{ width:16, height:16, borderRadius:"50%", background:item.done?C.ok:"transparent", border:`2px solid ${item.done?C.ok:C.primary}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff", fontWeight:700, flexShrink:0 }}>{item.done?"+":" "}</div>
                      <span style={{ fontSize:12, fontFamily:FB, color:item.done?C.ok:C.primary, fontWeight:500, textDecoration:item.done?"line-through":"none" }}>{item.label}</span>
                      {!item.done&&<span style={{ marginLeft:"auto", fontSize:11, color:C.primary }}>&#8594;</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI row */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                {[
                  { label:"Revenue / month", value:`$${Number(metrics.revenue.this_month).toLocaleString()}`,  sub:metrics.revenue.last_month>0?`$${Number(metrics.revenue.last_month).toLocaleString()} last month`:"Track in Management Agent" },
                  { label:"Active clients",  value:String(metrics.clients.active),                             sub:`${metrics.clients.total} total served` },
                  { label:"Leads / month",   value:String(metrics.leads.this_month),                           sub:`${metrics.leads.total} all time` },
                  { label:"Followers",       value:Number(metrics.social.instagram).toLocaleString(),           sub:metrics.social.google_rating>0?`${metrics.social.google_rating} Google rating`:"Track in Management Agent" },
                ].map(({label,value,sub})=>(
                  <div key={label} style={card("14px 16px")}>
                    <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6, fontFamily:FB }}>{label}</div>
                    <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, letterSpacing:"-0.04em", marginBottom:3 }}>{value}</div>
                    <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Business summary */}
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14 }}>
                <div style={card()}>
                  <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:10 }}>Business summary</div>
                  <p style={{ fontSize:13, color:C.muted, lineHeight:1.75, marginBottom:16, fontFamily:FB }}>{idea.why||"Your business overview will appear here."}</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {[["Revenue target",idea.revenue||"—"],["Time to first revenue",idea.timeToFirstRevenue||"—"],["Startup cost",idea.startupCost||"—"],["Risk level",idea.biggestRisk?.slice(0,40)||"—"]].map(([l,v])=>(
                      <div key={l}>
                        <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:3, fontFamily:FB }}>{l}</div>
                        <div style={{ fontSize:13, color:C.text, fontFamily:FB, lineHeight:1.4 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={card()}>
                  <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:12 }}>All stats</div>
                  {[
                    ["Bookings this week",  metrics.bookings.this_week],
                    ["Bookings this month", metrics.bookings.this_month],
                    ["Google reviews",      metrics.social.google_reviews],
                    ["Google rating",       metrics.social.google_rating>0?metrics.social.google_rating+"":"—"],
                    ["TikTok followers",    Number(metrics.social.tiktok).toLocaleString()||"0"],
                    ["Facebook followers",  Number(metrics.social.facebook).toLocaleString()||"0"],
                  ].map(([l,v])=>(
                    <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                      <span style={{ fontSize:12, color:C.muted, fontFamily:FB }}>{l}</span>
                      <span style={{ fontSize:12, fontWeight:600, fontFamily:FB }}>{v||"0"}</span>
                    </div>
                  ))}
                  <button onClick={()=>setTab("management")} style={{ ...btnO(C.primary,11), width:"100%", textAlign:"center", marginTop:10 }}>Update stats</button>
                </div>
              </div>
            </div>
          )}

          {/* ── HUB ──────────────────────────────────────────────────────── */}
          {tab==="hub" && (
            <div>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, letterSpacing:"-0.04em", marginBottom:4 }}>Hub</div>
              <p style={{ color:C.muted, fontSize:14, marginBottom:24, fontFamily:FB }}>Connect your tools and get advice from your AI assistant.</p>

              {/* AI assistant */}
              <div style={{ ...card("18px 20px"), marginBottom:20, border:`1px solid ${C.primary}15`, background:C.primaryBg }}>
                <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:6 }}>Ask your AI assistant</div>
                <p style={{ fontSize:13, color:C.muted, marginBottom:14, lineHeight:1.65, fontFamily:FB }}>Ask how to set up an integration, what to do next, or how to handle a specific challenge with your business.</p>
                <div style={{ display:"flex", gap:8, marginBottom:hubAns?12:0 }}>
                  <input value={hubQ} onChange={e=>setHubQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askHub()} placeholder={isMinor?"How do I get my first customer?":"How should I set up Stripe for my business?"} style={{ ...inp(), flex:1 }} />
                  <button onClick={askHub} disabled={hubLoading} style={{ ...btn(C.primary,"#fff",13), padding:"10px 18px", flexShrink:0 }}>{hubLoading?"...":"Ask"}</button>
                </div>
                {hubAns && <div style={{ background:C.surface, borderRadius:10, padding:"12px 14px", fontSize:13, color:C.text, lineHeight:1.7, fontFamily:FB, border:`1px solid ${C.border}` }}>{hubAns}</div>}
              </div>

              {/* Integrations */}
              <div style={card()}>
                <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:18 }}>Integrations</div>
                {[
                  ...(isMinor ? [
                    { provider:"paypal",  label:"PayPal.me",             desc:"Accept payments online — free to set up, works for any age",        url:"https://paypal.me",                    guide:"Go to paypal.me → create a link → share it with customers to get paid instantly" },
                    { provider:"venmo",   label:"Venmo",                  desc:"Fast, simple payments — popular with customers your age",            url:"https://venmo.com",                    guide:"Download Venmo → create a business profile → share your handle with customers" },
                    { provider:"google",  label:"Google Business Profile", desc:"Show up when people search locally",                                url:"https://business.google.com",          guide:"Go to business.google.com → claim your business → verify to appear in Maps" },
                    { provider:"netlify", label:"Live Website",            desc:"Your AI-generated website goes live here",                          url:"https://app.netlify.com",              guide:"Add NETLIFY_TOKEN to Railway environment variables — then run the marketing agent" },
                    { provider:"calendly",label:"Calendly",               desc:"Let people book you without back-and-forth",                        url:"https://calendly.com/signup",          guide:"Create a free Calendly account → set your availability → share your booking link" },
                    { provider:"instagram",label:"Instagram Business",    desc:"Grow your audience and attract customers",                          url:"https://business.instagram.com",       guide:"Switch your Instagram to a Business account → connect it to a Facebook Page" },
                  ] : [
                    { provider:"stripe",  label:"Stripe",                 desc:"Accept card payments — required before you can charge customers",    url:"https://stripe.com/register",          guide:"Go to stripe.com/register → create your account → add your bank details → you can start charging immediately" },
                    { provider:"google",  label:"Google Business Profile", desc:"Appear in local search and on Google Maps",                         url:"https://business.google.com",          guide:"Go to business.google.com → claim your business → verify by postcard (5-7 days) → you appear in Maps" },
                    { provider:"netlify", label:"Live Website",            desc:"Your AI-generated website, deployed and live",                      url:"https://app.netlify.com",              guide:"Add NETLIFY_TOKEN to Railway environment variables (from app.netlify.com/user/applications) — then run the marketing agent" },
                    { provider:"calendly",label:"Calendly",               desc:"Let clients book appointments without back-and-forth",               url:"https://calendly.com/signup",          guide:"Sign up at calendly.com → set your availability → share your link on your website and in your bio" },
                    { provider:"instagram",label:"Instagram Business",    desc:"Post content, run ads, and grow your local audience",               url:"https://business.instagram.com",       guide:"Switch your Instagram to a Business account → connect to Facebook Page → you can now run ads and see analytics" },
                  ]),
                ].map(({provider,label,desc,url,guide},i,arr)=>{
                  const connected = isConn(provider);
                  return (
                    <div key={provider} style={{ padding:"16px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:connected?0:10 }}>
                        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                          {connected&&<div style={{ width:7, height:7, borderRadius:"50%", background:C.ok }}/>}
                          <div>
                            <div style={{ fontSize:14, fontWeight:600, fontFamily:FB }}>{label}</div>
                            <div style={{ fontSize:12, color:connected?C.ok:C.muted, fontFamily:FB }}>{connected?"Connected":desc}</div>
                          </div>
                        </div>
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...btn(connected?"#F4F4F5":C.dark,connected?C.text:"#fff",12), padding:"7px 14px", textDecoration:"none" }}>
                          {connected?"Manage &#8599;":"Set up &#8599;"}
                        </a>
                      </div>
                      {!connected && <div style={{ background:"#FAFAF9", borderRadius:10, padding:"10px 14px", fontSize:12, color:C.muted, lineHeight:1.65, fontFamily:FB, border:`1px solid ${C.border}` }}>{guide}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── MARKETING AGENT ───────────────────────────────────────────── */}
          {tab==="marketing" && (
            <div>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, letterSpacing:"-0.04em", marginBottom:4 }}>Marketing Agent</div>
              <p style={{ color:C.muted, fontSize:14, marginBottom:24, fontFamily:FB }}>The marketing agent analyzes your metrics and finds the best opportunities. The management agent implements them — including updating your live website.</p>

              {/* Generate assets */}
              <div style={{ ...card("18px 20px"), marginBottom:24 }}>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, marginBottom:14 }}>Generate your content</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    { type:"website",        label:"Business Website",       apiCall:api.generate.website,        desc:"Deploy-ready, mobile-friendly" },
                    { type:"business_plan",  label:"Business Plan",          apiCall:api.generate.businessPlan,   desc:"With financial projections" },
                    { type:"social_content", label:"30-Day Social Calendar", apiCall:api.generate.socialContent,  desc:"Captions and hashtags included" },
                    { type:"email_templates",label:"Email Templates",        apiCall:api.generate.emailTemplates, desc:"8 ready-to-use templates" },
                  ].map(({type,label,apiCall,desc})=>{
                    const out=getOutput(type); const loading=!!genLoading[type];
                    return (
                      <div key={type} style={{ ...card("12px 14px"), border:`1px solid ${out?C.ok+"30":C.border}`, background:out?"#F0FDF4":C.surface }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, fontFamily:FB }}>{label}</div>
                            <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{desc}</div>
                          </div>
                          {out&&<span style={{ background:C.okBg, color:C.ok, fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:20, textTransform:"uppercase" }}>Ready</span>}
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          {out&&<button onClick={()=>{const b=new Blob([out.content],{type:"text/html"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`${type}.html`;a.click();URL.revokeObjectURL(u);}} style={{ ...btnO(C.primary,11), flex:1, textAlign:"center" }}>Download</button>}
                          <button onClick={()=>generate(type,apiCall)} disabled={loading} style={{ ...btn(loading?"#9CA3AF":out?C.muted:C.primary,"#fff",12), flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                            {loading&&<span style={{ width:11, height:11, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/>}
                            {loading?"Generating...":(out?"Regenerate":"Generate")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {genError&&<div style={{ marginTop:12, background:C.errBg, borderRadius:8, padding:"10px 14px", fontSize:13, color:C.err, fontFamily:FB }}>{genError}</div>}
              </div>

              <AgentPanel businessId={businessId} metrics={metrics} age={age} planInfo={planInfo}/>
            </div>
          )}

          {/* ── MANAGEMENT AGENT ──────────────────────────────────────────── */}
          {tab==="management" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, letterSpacing:"-0.04em" }}>Management Agent</div>
                <button onClick={()=>cycleMode("management")} style={{ background:modes.management==="Full auto"?C.okBg:modes.management==="Guided"?C.primaryBg:"#F4F4F5", color:modes.management==="Full auto"?C.ok:modes.management==="Guided"?C.primary:C.muted, border:"none", borderRadius:20, padding:"6px 14px", fontSize:11, fontWeight:700, cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FB }}>
                  {modes.management||"Manual"} &mdash; tap to change
                </button>
              </div>
              <p style={{ color:C.muted, fontSize:14, marginBottom:6, fontFamily:FB }}>Track your business numbers here. The management agent uses this data to give better recommendations.</p>
              <div style={{ fontSize:12, color:C.muted, fontFamily:FB, marginBottom:28, background:C.primaryBg, borderRadius:10, padding:"10px 14px", lineHeight:1.65, border:`1px solid ${C.primary}15` }}>
                {modes.management==="Manual"&&"Manual mode — tap any number to update it yourself."}
                {modes.management==="Guided"&&"Guided mode — your AI will prompt you with questions to keep your numbers current."}
                {modes.management==="Full auto"&&"Full auto mode — connect integrations and the agent tracks everything automatically."}
              </div>

              <AutopilotCard businessId={businessId} planInfo={planInfo} navigate={navigate} />

              {/* AI question box */}
              <div style={{ ...card("16px 18px"), marginBottom:24, background:C.primaryBg, border:`1px solid ${C.primary}15` }}>
                <div style={{ fontFamily:FH, fontWeight:600, fontSize:14, marginBottom:8 }}>Ask your management agent</div>
                <div style={{ display:"flex", gap:8, marginBottom:mgmtAns?12:0 }}>
                  <input value={mgmtQ} onChange={e=>setMgmtQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askMgmt()} placeholder="What should I focus on this week? How do I get my next client?" style={{ ...inp(), flex:1 }} />
                  <button onClick={askMgmt} disabled={hubLoading} style={{ ...btn(C.primary,"#fff",13), padding:"10px 16px", flexShrink:0 }}>{hubLoading?"...":"Ask"}</button>
                </div>
                {mgmtAns&&<div style={{ background:C.surface, borderRadius:10, padding:"12px 14px", fontSize:13, color:C.text, lineHeight:1.7, fontFamily:FB, border:`1px solid ${C.border}` }}>{mgmtAns}</div>}
              </div>

              {/* Metric cards */}
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, marginBottom:12 }}>Revenue</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
                <StatCard label="This month"  value={metrics.revenue.this_month}  prefix="$" onChange={v=>saveM("revenue.this_month",v)}/>
                <StatCard label="Last month"  value={metrics.revenue.last_month}  prefix="$" onChange={v=>saveM("revenue.last_month",v)}/>
                <StatCard label="All time"    value={metrics.revenue.total}       prefix="$" onChange={v=>saveM("revenue.total",v)}/>
              </div>

              <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, marginBottom:12 }}>Clients & Leads</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
                <StatCard label="Active clients"   value={metrics.clients.active}      onChange={v=>saveM("clients.active",v)}/>
                <StatCard label="Total clients"    value={metrics.clients.total}       onChange={v=>saveM("clients.total",v)}/>
                <StatCard label="Leads this month" value={metrics.leads.this_month}    onChange={v=>saveM("leads.this_month",v)}/>
              </div>

              <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, marginBottom:12 }}>Social Media</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
                <StatCard label="Instagram"      value={metrics.social.instagram}      onChange={v=>saveM("social.instagram",v)}/>
                <StatCard label="TikTok"         value={metrics.social.tiktok}         onChange={v=>saveM("social.tiktok",v)}/>
                <StatCard label="Facebook"       value={metrics.social.facebook}       onChange={v=>saveM("social.facebook",v)}/>
              </div>

              <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, marginBottom:12 }}>Bookings & Reviews</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                <StatCard label="Bookings this week"  value={metrics.bookings.this_week}    onChange={v=>saveM("bookings.this_week",v)}/>
                <StatCard label="Bookings this month" value={metrics.bookings.this_month}   onChange={v=>saveM("bookings.this_month",v)}/>
                <StatCard label="Google reviews"      value={metrics.social.google_reviews} onChange={v=>saveM("social.google_reviews",v)}/>
                <StatCard label="Google rating"       value={metrics.social.google_rating}  onChange={v=>saveM("social.google_rating",v)} suffix="" />
              </div>
            </div>
          )}
        </div>
      </div>

      {chatOpen&&<GuidePanel messages={chatMsgs} onClose={()=>setChatOpen(false)} onSend={sendChat} businessId={businessId}/>}
      <button onClick={()=>setChatOpen(o=>!o)} style={{ background:C.grad, color:"#fff", border:"none", borderRadius:24, padding:"10px 20px", fontSize:13, fontWeight:500, cursor:"pointer", position:"fixed", bottom:24, right:chatOpen?336:24, boxShadow:`0 4px 20px rgba(124,58,237,0.3)`, zIndex:100, transition:"right 0.25s", fontFamily:FB }}>
        Ask guide
      </button>
    </div>
  );
}
