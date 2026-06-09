import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useStore from "../lib/store";
import { api } from "../lib/api";

const D = {
  bg:"#FAFAF9", surface:"#FFFFFF", dark:"#09090B", border:"#E4E4E7",
  text:"#09090B", muted:"#71717A", subtle:"#A1A1AA",
  disc:"#7C3AED", discBg:"#F5F3FF",
  ok:"#059669", okBg:"#ECFDF5",
  warn:"#D97706", warnBg:"#FFFBEB",
  err:"#EF4444", errBg:"#FEF2F2",
  grad:"linear-gradient(135deg,#7C3AED,#0891B2)",
};
const FH = "'Space Grotesk','Helvetica Neue',sans-serif";
const FB = "'DM Sans','Helvetica Neue',sans-serif";
const btn   = (bg,fg="#fff",sz=14,rad=10) => ({background:bg,color:fg,border:"none",borderRadius:rad,padding:"11px 22px",fontSize:sz,fontWeight:600,cursor:"pointer",fontFamily:FB,transition:"opacity 0.15s"});
const btnO  = (c,sz=13) => ({background:"transparent",color:c,border:`1.5px solid ${c}25`,borderRadius:10,padding:"9px 18px",fontSize:sz,fontWeight:500,cursor:"pointer",fontFamily:FB});
const card  = (p="18px 20px",bg=D.surface) => ({background:bg,borderRadius:14,border:`1px solid ${D.border}`,padding:p});
const inp   = (e={}) => ({width:"100%",padding:"12px 16px",borderRadius:10,border:`1.5px solid ${D.border}`,fontSize:15,fontFamily:FB,color:D.text,background:D.surface,outline:"none",boxSizing:"border-box",...e});

// Editable big-number card for student
function StatCard({ label, value, onChange, prefix="", suffix="", color=D.disc, emoji="" }) {
  const [editing, setEditing] = useState(false);
  const [local,   setLocal]   = useState(String(value||"0"));
  const save = () => { onChange(Number(local)||0); setEditing(false); };
  return (
    <div style={{...card("20px"),textAlign:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:`${color}08`,borderRadius:14}}/>
      <div style={{position:"relative",zIndex:1}}>
        {emoji && <div style={{fontSize:24,marginBottom:8}}>{emoji}</div>}
        <div style={{fontSize:11,fontWeight:600,color:D.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,fontFamily:FB}}>{label}</div>
        {editing ? (
          <div style={{display:"flex",gap:8,justifyContent:"center"}}>
            <input value={local} onChange={e=>setLocal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} autoFocus style={{...inp(),width:120,textAlign:"center",fontSize:20}} />
            <button onClick={save} style={{...btn(color,"#fff",13),padding:"8px 14px"}}>✓</button>
          </div>
        ) : (
          <div onClick={()=>{setLocal(String(value||"0"));setEditing(true);}} style={{cursor:"pointer"}}>
            <div style={{fontFamily:FH,fontWeight:700,fontSize:32,letterSpacing:"-0.04em",color,lineHeight:1}}>{prefix}{Number(value||0).toLocaleString()}{suffix}</div>
            <div style={{fontSize:11,color:D.muted,marginTop:6,fontFamily:FB}}>tap to update</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Agent panel for student — streamlined
function AgentPanel({ businessId, metrics }) {
  const [insights,    setInsights]    = useState([]);
  const [running,     setRunning]     = useState(false);
  const [implementing,setImplementing]= useState(null);
  const [liveUrl,     setLiveUrl]     = useState(null);
  const [activity,    setActivity]    = useState([]);
  const [error,       setError]       = useState("");

  useEffect(()=>{
    api.agents.activity(businessId).then(d=>setActivity(d.activity||[])).catch(()=>{});
    api.agents.deployStatus(businessId).then(d=>{ if(d.liveUrl) setLiveUrl(d.liveUrl); }).catch(()=>{});
  },[businessId]);

  const run = async () => {
    setRunning(true); setError(""); setInsights([]);
    try {
      const {insights:data} = await api.agents.runMarketing(businessId);
      setInsights(data);
      api.agents.activity(businessId).then(d=>setActivity(d.activity||[])).catch(()=>{});
    } catch(e) { setError(e.message); }
    setRunning(false);
  };

  const implement = async (insight) => {
    setImplementing(insight.id); setError("");
    try {
      const result = await api.agents.implement(businessId, insight);
      setLiveUrl(result.liveUrl);
      api.agents.activity(businessId).then(d=>setActivity(d.activity||[])).catch(()=>{});
    } catch(e) { setError(e.message); }
    setImplementing(null);
  };

  return (
    <div>
      {error && (
        <div style={{...card("12px 16px"),background:D.errBg,border:`1px solid ${D.err}25`,marginBottom:16,fontSize:13,color:D.err,fontFamily:FB}}>
          {error}
          {error.includes("NETLIFY_TOKEN") && <div style={{marginTop:8}}>Add <code style={{background:"#fee2e2",padding:"1px 5px",borderRadius:4}}>NETLIFY_TOKEN</code> to Railway. Get it at <a href="https://app.netlify.com/user/applications" target="_blank" rel="noopener noreferrer" style={{color:D.err}}>app.netlify.com</a></div>}
          {error.includes("Generate your website") && <div style={{marginTop:6}}>Generate your website first in the Marketing Agent tab.</div>}
        </div>
      )}

      {/* Live site status — prominent */}
      <div style={{background:D.dark,borderRadius:14,padding:"20px 22px",marginBottom:20,border:`2px solid ${liveUrl?"#4ADE8030":"#ffffff08"}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,color:"#ffffff40",textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:FB,marginBottom:6}}>Your live website</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:liveUrl?"#4ADE80":"#ffffff20",boxShadow:liveUrl?"0 0 8px #4ADE80aa":undefined}}/>
              <span style={{fontFamily:FH,fontWeight:700,fontSize:18,color:liveUrl?"#4ADE80":"#ffffff50"}}>{liveUrl?"Live":"Not deployed yet"}</span>
            </div>
            {liveUrl && <a href={liveUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:"#ffffff60",fontFamily:FB,textDecoration:"none",marginTop:4,display:"block"}}>{liveUrl} ↗</a>}
          </div>
          {!liveUrl && <div style={{fontSize:12,color:"#ffffff30",fontFamily:FB,maxWidth:180,textAlign:"right",lineHeight:1.5}}>Runs automatically when you implement your first insight</div>}
        </div>
      </div>

      {/* Marketing Analysis */}
      <div style={{...card("18px 20px"),marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontFamily:FH,fontWeight:700,fontSize:16}}>Marketing Agent</div>
            <div style={{fontSize:12,color:D.muted,fontFamily:FB}}>Analyzes your data → finds opportunities → management agent implements</div>
          </div>
          <span style={{background:D.discBg,color:D.disc,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:FB}}>Full auto</span>
        </div>
        <button onClick={run} disabled={running} style={{...btn(running?"#6B7280":D.grad),width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"13px"}}>
          {running && <span style={{width:15,height:15,borderRadius:"50%",border:"2.5px solid #ffffff50",borderTopColor:"#fff",animation:"spin 0.7s linear infinite",flexShrink:0}}/>}
          {running?"AI analyzing your business...":"Run analysis now"}
        </button>
      </div>

      {insights.length>0 && (
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {insights.map((ins,i)=>(
            <div key={i} style={{...card("16px 18px"),border:`1px solid ${ins.priority==="high"?"#EF444425":D.border}`}}>
              <div style={{display:"flex",gap:6,marginBottom:10}}>
                <span style={{background:ins.priority==="high"?"#FEF2F2":ins.priority==="medium"?"#FFFBEB":"#F3F4F6",color:ins.priority==="high"?"#EF4444":ins.priority==="medium"?"#D97706":D.muted,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:FB}}>{ins.priority}</span>
                <span style={{background:D.discBg,color:D.disc,fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.04em",fontFamily:FB}}>{ins.type}</span>
              </div>
              <p style={{fontSize:13,color:D.text,lineHeight:1.65,marginBottom:6,fontFamily:FB}}><strong>Insight:</strong> {ins.agentObservation}</p>
              <p style={{fontSize:13,color:D.text,lineHeight:1.65,marginBottom:10,fontFamily:FB}}><strong>Action:</strong> {ins.recommendation}</p>
              <div style={{background:D.okBg,borderRadius:8,padding:"6px 12px",fontSize:12,color:D.ok,fontFamily:FB,marginBottom:12}}>Expected ROI: {ins.expectedImpact}</div>
              <button onClick={()=>implement(ins)} disabled={!!implementing} style={{...btn(implementing===ins.id?"#6B7280":D.disc,"#fff",13),width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {implementing===ins.id && <span style={{width:13,height:13,borderRadius:"50%",border:"2px solid #ffffff50",borderTopColor:"#fff",animation:"spin 0.7s linear infinite"}}/>}
                {implementing===ins.id?"Management agent implementing...":"Implement this →"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Activity */}
      {activity.length>0 && (
        <div style={{...card("14px 16px"),background:D.dark}}>
          <div style={{fontSize:10,color:"#ffffff40",textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:FB,marginBottom:10}}>Agent log</div>
          {activity.slice(0,5).map((e,i)=>(
            <div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:i<4?"1px solid #ffffff08":"none"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:e.agent==="marketing"?D.disc:"#4ADE80",flexShrink:0,marginTop:4}}/>
              <div>
                <div style={{fontSize:12,color:"#ffffffcc",fontFamily:FB,fontWeight:500}}>{e.action}</div>
                <div style={{fontSize:11,color:"#ffffff40",fontFamily:FB}}>{e.detail}</div>
              </div>
              <div style={{fontSize:10,color:"#ffffff25",fontFamily:FB,marginLeft:"auto"}}>{new Date(e.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN HUB ──────────────────────────────────────────────────────────────────
export default function Hub() {
  const { id: businessId } = useParams();
  const { hubModes, setHubMode } = useStore();
  const [business,   setBusiness]  = useState(null);
  const [outputs,    setOutputs]   = useState([]);
  const [integs,     setIntegs]    = useState([]);
  const [metrics,    setMetrics]   = useState({revenue:{this_month:0,last_month:0,total:0},clients:{active:0,total:0},leads:{this_month:0,total:0},social:{instagram:0,tiktok:0,facebook:0,google_reviews:0,google_rating:0},bookings:{this_week:0,this_month:0}});
  const [loading,    setLoading]   = useState(true);
  const [tab,        setTab]       = useState("overview");
  const [genLoading, setGenLoading]= useState({});
  const [genError,   setGenError]  = useState("");
  const [hubQ,       setHubQ]      = useState("");
  const [hubAns,     setHubAns]    = useState("");
  const [hubLoading, setHubLoading]= useState(false);
  const [mgmtQ,      setMgmtQ]    = useState("");
  const [mgmtAns,    setMgmtAns]  = useState("");
  const navigate = useNavigate();

  const MODE_CYCLE = ["Manual","Guided","Full auto"];
  const modes = hubModes[businessId]||{marketing:"Full auto",management:"Manual"};

  useEffect(()=>{
    Promise.all([
      api.businesses.get(businessId),
      api.businesses.outputs(businessId),
      api.integrations.list(businessId),
      api.metrics.get(businessId),
    ]).then(([{business:b},{outputs:o},{integrations:ig},{metrics:m}])=>{
      setBusiness(b); setOutputs(o); setIntegs(ig);
      if (m) setMetrics(m);
    }).catch(console.error).finally(()=>setLoading(false));
  },[businessId]);

  const idea     = (()=>{try{return JSON.parse(business?.ideaData||"{}");}catch{return {};}})();
  const isConn   = p=>integs.find(i=>i.provider===p)?.status==="connected";
  const getOut   = t=>outputs.find(o=>o.type===t);
  const cycleMode= stage=>{const cur=modes[stage]||"Manual";setHubMode(businessId,stage,MODE_CYCLE[(MODE_CYCLE.indexOf(cur)+1)%MODE_CYCLE.length]);};
  const saveM    = async (path,v)=>{const parts=path.split(".");const u=JSON.parse(JSON.stringify(metrics));let o=u;for(let i=0;i<parts.length-1;i++)o=o[parts[i]];o[parts[parts.length-1]]=v;setMetrics(u);await api.metrics.save(businessId,u).catch(()=>{});};
  const generate = async (type,apiCall)=>{setGenLoading(p=>({...p,[type]:true}));setGenError("");try{const{output}=await apiCall(businessId);setOutputs(p=>{const ex=p.find(o=>o.type===type);return ex?p.map(o=>o.type===type?output:o):[...p,output];});}catch(e){setGenError(e.message);}finally{setGenLoading(p=>({...p,[type]:false}));}};

  const askHub = async () => { setHubLoading(true);setHubAns("");try{const{suggestion}=await api.metrics.suggest(businessId,hubQ);setHubAns(suggestion);}catch(e){setHubAns("Error: "+e.message);}setHubLoading(false); };
  const askMgmt= async () => { setHubLoading(true);try{const{suggestion}=await api.metrics.suggest(businessId,mgmtQ);setMgmtAns(suggestion);}catch(e){setMgmtAns("Error: "+e.message);}setHubLoading(false);setMgmtQ(""); };

  if (loading) return (
    <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:D.bg}}>
      <div style={{width:36,height:36,borderRadius:"50%",border:"3px solid transparent",backgroundImage:"linear-gradient(white,white), "+D.grad,backgroundOrigin:"border-box",backgroundClip:"padding-box, border-box",animation:"spin 0.8s linear infinite"}}/>
    </div>
  );

  const navItems=[{id:"overview",label:"Overview"},{id:"hub",label:"Hub"},{id:"marketing",label:"Marketing Agent"},{id:"management",label:"Management Agent"}];

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:FB,background:D.bg}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Sidebar */}
      <div style={{width:220,background:D.dark,display:"flex",flexDirection:"column",flexShrink:0,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,right:0,width:150,height:150,background:"radial-gradient(ellipse,#7C3AED18,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{padding:"22px 18px 16px",borderBottom:"1px solid #ffffff08",position:"relative"}}>
          <div style={{fontFamily:FH,fontWeight:700,fontSize:16,background:D.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4,letterSpacing:"-0.03em"}}>LaunchLab</div>
          <div style={{fontFamily:FH,fontWeight:700,fontSize:14,color:"#fff",marginBottom:4,lineHeight:1.3}}>{business?.name}</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"#4ADE80",animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:11,color:"#ffffff40",fontFamily:FB}}>{business?.location}</span>
          </div>
        </div>
        <nav style={{padding:"12px 8px",flex:1}}>
          {navItems.map(({id,label})=>(
            <div key={id} onClick={()=>setTab(id)} style={{padding:"10px 14px",borderRadius:10,marginBottom:3,background:tab===id?"linear-gradient(135deg,#7C3AED20,#0891B215)":"transparent",color:tab===id?"#fff":"#ffffff50",cursor:"pointer",fontSize:13,fontWeight:tab===id?600:400,fontFamily:FB,border:tab===id?"1px solid #7C3AED30":"1px solid transparent",transition:"all 0.12s"}}>
              {label}
            </div>
          ))}
        </nav>
        <div style={{padding:"10px 8px",borderTop:"1px solid #ffffff08"}}>
          <div onClick={()=>navigate(`/creation/${businessId}`)} style={{padding:"8px 12px",borderRadius:8,color:"#ffffff30",cursor:"pointer",fontSize:12,fontFamily:FB}}>Setup tasks</div>
          <div onClick={()=>navigate("/dashboard")} style={{padding:"8px 12px",borderRadius:8,color:"#ffffff25",cursor:"pointer",fontSize:12,fontFamily:FB}}>All businesses</div>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{padding:"28px 32px 80px",maxWidth:1000}}>

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {tab==="overview" && (
            <div>
              <div style={{fontFamily:FH,fontWeight:700,fontSize:26,letterSpacing:"-0.04em",marginBottom:4}}>{business?.name}</div>
              <p style={{color:D.muted,fontSize:14,marginBottom:28,fontFamily:FB}}>{idea.tagline||idea.name} · Update your stats in Management Agent</p>

              {/* Big stat cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
                <StatCard label="Revenue / month" value={metrics.revenue.this_month} prefix="$" onChange={v=>saveM("revenue.this_month",v)} color={D.disc} emoji="💰"/>
                <StatCard label="Active clients"  value={metrics.clients.active}      onChange={v=>saveM("clients.active",v)}      color="#0891B2" emoji="🤝"/>
                <StatCard label="Leads / month"   value={metrics.leads.this_month}    onChange={v=>saveM("leads.this_month",v)}    color="#DB2777" emoji="📈"/>
                <StatCard label="Followers"        value={metrics.social.instagram}    onChange={v=>saveM("social.instagram",v)}   color="#7C3AED" emoji="📱"/>
              </div>

              {/* Business info */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div style={card()}>
                  <div style={{fontFamily:FH,fontWeight:700,fontSize:16,marginBottom:12}}>Your business</div>
                  <p style={{fontSize:13,color:D.muted,lineHeight:1.7,marginBottom:16,fontFamily:FB}}>{idea.why||"Set up complete. Use the marketing agent to start growing."}</p>
                  {[["Revenue target",idea.revenue||"—"],["Time to first revenue",idea.timeToFirstRevenue||"—"],["Startup cost",idea.startupCost||"—"]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${D.border}`}}>
                      <span style={{fontSize:13,color:D.muted,fontFamily:FB}}>{l}</span>
                      <span style={{fontSize:13,fontWeight:600,fontFamily:FB}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={card()}>
                  <div style={{fontFamily:FH,fontWeight:700,fontSize:16,marginBottom:12}}>Quick wins</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {[
                      {done:!!getOut("website"),       label:"Generate your website",     tab:"marketing"},
                      {done:isConn("stripe"),           label:"Connect Stripe — get paid", tab:"hub"},
                      {done:isConn("google"),           label:"Set up Google Business",    tab:"hub"},
                      {done:metrics.clients.active>0,  label:"Log your first client",     tab:"management"},
                      {done:metrics.revenue.this_month>0,label:"Log your first revenue",  tab:"management"},
                    ].map((item,i)=>(
                      <div key={i} onClick={()=>setTab(item.tab)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,cursor:"pointer",background:item.done?"#F0FDF4":"#FAFAF9",border:`1px solid ${item.done?"#059669":"#E4E4E7"}30`,transition:"all 0.12s"}}>
                        <div style={{width:18,height:18,borderRadius:"50%",background:item.done?"#059669":"transparent",border:`2px solid ${item.done?"#059669":"#A1A1AA"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700,flexShrink:0}}>
                          {item.done?"✓":""}
                        </div>
                        <span style={{fontSize:13,fontFamily:FB,color:item.done?D.ok:D.text,fontWeight:item.done?500:400,textDecoration:item.done?"line-through":"none"}}>{item.label}</span>
                        {!item.done && <span style={{marginLeft:"auto",fontSize:11,color:D.disc,fontFamily:FB}}>→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── HUB ──────────────────────────────────────────────────────── */}
          {tab==="hub" && (
            <div>
              <div style={{fontFamily:FH,fontWeight:700,fontSize:26,letterSpacing:"-0.04em",marginBottom:4}}>Hub</div>
              <p style={{color:D.muted,fontSize:14,marginBottom:24,fontFamily:FB}}>Connect your tools. Everything goes live through this Hub.</p>

              {/* AI prompt */}
              <div style={{...card("18px 20px","#F5F3FF"),marginBottom:20,border:`1px solid ${D.disc}20`}}>
                <div style={{fontFamily:FH,fontWeight:700,fontSize:15,marginBottom:6}}>Ask your AI assistant</div>
                <div style={{display:"flex",gap:8,marginBottom:hubAns?12:0}}>
                  <input value={hubQ} onChange={e=>setHubQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askHub()} placeholder="How do I connect Stripe? What should I set up first?" style={{...inp(),flex:1}} />
                  <button onClick={askHub} disabled={hubLoading} style={{...btn(D.disc,"#fff",13),padding:"10px 18px",flexShrink:0}}>{hubLoading?"...":"Ask"}</button>
                </div>
                {hubAns && <div style={{background:"#fff",borderRadius:10,padding:"12px 16px",fontSize:13,color:D.text,lineHeight:1.7,fontFamily:FB,border:`1px solid ${D.border}`}}>{hubAns}</div>}
              </div>

              {/* Integrations */}
              <div style={card()}>
                <div style={{fontFamily:FH,fontWeight:700,fontSize:16,marginBottom:18}}>Integrations</div>
                {[
                  {provider:"stripe",   label:"Stripe",                  desc:"Get paid online — takes 5 minutes to set up",               url:"https://stripe.com/register", guide:"Go to stripe.com/register → create your account → add your bank details → you can start charging immediately"},
                  {provider:"google",   label:"Google Business",          desc:"Show up in local search when people look for you",           url:"https://business.google.com", guide:"Go to business.google.com → claim your business → verify (Google sends a postcard) → you start appearing in Maps"},
                  {provider:"netlify",  label:"Live Website",             desc:"Your AI-generated website goes live here",                   url:"https://app.netlify.com",     guide:"Add NETLIFY_TOKEN to Railway environment variables (from app.netlify.com/user/applications) — then run the marketing agent"},
                  {provider:"calendly", label:"Calendly — Booking",       desc:"Let people book you without any back-and-forth",             url:"https://calendly.com/signup", guide:"Sign up at calendly.com → set your availability → share your booking link on your website and in your bio"},
                  {provider:"instagram",label:"Instagram Business",       desc:"Post content and grow your audience",                        url:"https://business.instagram.com", guide:"Switch your Instagram to a Business account → connect to a Facebook Page → you can now run ads and see analytics"},
                ].map(({provider,label,desc,url,guide},i,arr)=>{
                  const connected = isConn(provider);
                  return (
                    <div key={provider} style={{padding:"18px 0",borderBottom:i<arr.length-1?`1px solid ${D.border}`:"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:connected?0:10}}>
                        <div style={{display:"flex",gap:10,alignItems:"center"}}>
                          {connected && <div style={{width:8,height:8,borderRadius:"50%",background:D.ok}}/>}
                          <div>
                            <div style={{fontSize:14,fontWeight:600,fontFamily:FB}}>{label}</div>
                            <div style={{fontSize:12,color:connected?D.ok:D.muted,fontFamily:FB}}>{connected?"Connected":desc}</div>
                          </div>
                        </div>
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{...btn(connected?"#F4F4F5":D.disc,connected?D.text:"#fff",12),padding:"8px 16px",textDecoration:"none"}}>
                          {connected?"Manage ↗":"Set up ↗"}
                        </a>
                      </div>
                      {!connected && (
                        <div style={{background:"#FAFAF9",borderRadius:10,padding:"10px 14px",fontSize:12,color:D.muted,lineHeight:1.65,fontFamily:FB,border:`1px solid ${D.border}`}}>
                          {guide}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── MARKETING AGENT ───────────────────────────────────────────── */}
          {tab==="marketing" && (
            <div>
              <div style={{fontFamily:FH,fontWeight:700,fontSize:26,letterSpacing:"-0.04em",marginBottom:4}}>Marketing Agent</div>
              <p style={{color:D.muted,fontSize:14,marginBottom:24,fontFamily:FB}}>The AI finds the best opportunities for your business and the management agent implements them. Your website updates live.</p>

              {/* Generate content */}
              <div style={{...card("18px 20px"),marginBottom:20}}>
                <div style={{fontFamily:FH,fontWeight:700,fontSize:16,marginBottom:14}}>Generate your assets</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                  {[
                    {type:"website",        label:"Business Website",       apiCall:api.generate.website,        tag:"Deploy-ready"},
                    {type:"business_plan",  label:"Business Plan",          apiCall:api.generate.businessPlan,   tag:"With financials"},
                    {type:"social_content", label:"30-Day Social Calendar", apiCall:api.generate.socialContent,  tag:"Captions included"},
                    {type:"email_templates",label:"Email Templates",        apiCall:api.generate.emailTemplates, tag:"8 templates"},
                  ].map(({type,label,apiCall,tag})=>{
                    const out = getOut(type);
                    const loading = !!genLoading[type];
                    return (
                      <div key={type} style={{...card("14px 16px"),border:`1px solid ${out?"#059669":"#E4E4E7"}30`,background:out?"#F0FDF4":D.surface}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                          <div>
                            <div style={{fontSize:14,fontWeight:600,fontFamily:FB}}>{label}</div>
                            <div style={{fontSize:11,color:D.muted,fontFamily:FB}}>{tag}</div>
                          </div>
                          {out && <span style={{background:D.okBg,color:D.ok,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,textTransform:"uppercase"}}>✓</span>}
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          {out && <button onClick={()=>{const b=new Blob([out.content],{type:"text/html"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`${type}.html`;a.click();URL.revokeObjectURL(u);}} style={{...btnO(D.disc,12),flex:1,textAlign:"center"}}>Download</button>}
                          <button onClick={()=>generate(type,apiCall)} disabled={loading} style={{...btn(loading?"#6B7280":out?"#6B7280":D.disc,"#fff",12),flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                            {loading&&<span style={{width:12,height:12,borderRadius:"50%",border:"2px solid #ffffff50",borderTopColor:"#fff",animation:"spin 0.7s linear infinite"}}/>}
                            {loading?"Generating...":(out?"Regenerate":"Generate")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {genError && <div style={{marginTop:12,background:D.errBg,borderRadius:8,padding:"10px 14px",fontSize:13,color:D.err,fontFamily:FB}}>{genError}</div>}
              </div>

              <AgentPanel businessId={businessId} metrics={metrics}/>
            </div>
          )}

          {/* ── MANAGEMENT AGENT ──────────────────────────────────────────── */}
          {tab==="management" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <div style={{fontFamily:FH,fontWeight:700,fontSize:26,letterSpacing:"-0.04em"}}>Management Agent</div>
                <button onClick={()=>cycleMode("management")} style={{background:modes.management==="Full auto"?D.okBg:modes.management==="Guided"?D.discBg:"#F4F4F5",color:modes.management==="Full auto"?D.ok:modes.management==="Guided"?D.disc:D.muted,border:"none",borderRadius:20,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:FB}}>
                  {modes.management||"Manual"} — tap to change
                </button>
              </div>
              <p style={{color:D.muted,fontSize:14,marginBottom:6,fontFamily:FB}}>Track your business. Every number you enter makes the marketing agent smarter.</p>
              <div style={{fontSize:12,color:D.muted,fontFamily:FB,marginBottom:28,background:D.discBg,borderRadius:10,padding:"10px 14px",lineHeight:1.65,border:`1px solid ${D.disc}15`}}>
                {modes.management==="Manual"&&"Manual mode — tap any number to update it yourself."}
                {modes.management==="Guided"&&"Guided mode — your AI will prompt you to update key metrics and explain what they mean for your growth."}
                {modes.management==="Full auto"&&"Full auto mode — connect your integrations and the agent tracks everything automatically."}
              </div>

              {/* Ask management agent */}
              <div style={{...card("16px 18px","#F5F3FF"),marginBottom:24,border:`1px solid ${D.disc}20`}}>
                <div style={{fontFamily:FH,fontWeight:600,fontSize:14,marginBottom:8}}>Ask your management agent</div>
                <div style={{display:"flex",gap:8,marginBottom:mgmtAns?12:0}}>
                  <input value={mgmtQ} onChange={e=>setMgmtQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askMgmt()} placeholder="What should I focus on this week? How do I get my next client?" style={{...inp(),flex:1}} />
                  <button onClick={askMgmt} disabled={hubLoading} style={{...btn(D.disc,"#fff",13),padding:"10px 16px",flexShrink:0}}>{hubLoading?"...":"Ask"}</button>
                </div>
                {mgmtAns && <div style={{background:"#fff",borderRadius:10,padding:"12px 14px",fontSize:13,color:D.text,lineHeight:1.7,fontFamily:FB,border:`1px solid ${D.border}`}}>{mgmtAns}</div>}
              </div>

              {/* Revenue */}
              <div style={{fontFamily:FH,fontWeight:700,fontSize:16,marginBottom:12}}>Revenue</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
                <StatCard label="This month" value={metrics.revenue.this_month} prefix="$" onChange={v=>saveM("revenue.this_month",v)} color={D.disc}/>
                <StatCard label="Last month"  value={metrics.revenue.last_month} prefix="$" onChange={v=>saveM("revenue.last_month",v)} color={D.disc}/>
                <StatCard label="All time"    value={metrics.revenue.total}      prefix="$" onChange={v=>saveM("revenue.total",v)}      color={D.disc}/>
              </div>

              {/* Clients & Leads */}
              <div style={{fontFamily:FH,fontWeight:700,fontSize:16,marginBottom:12}}>Clients & Leads</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
                <StatCard label="Active clients"    value={metrics.clients.active}      onChange={v=>saveM("clients.active",v)}      color="#0891B2"/>
                <StatCard label="Total clients"     value={metrics.clients.total}       onChange={v=>saveM("clients.total",v)}       color="#0891B2"/>
                <StatCard label="Leads this month"  value={metrics.leads.this_month}    onChange={v=>saveM("leads.this_month",v)}    color="#DB2777"/>
              </div>

              {/* Social */}
              <div style={{fontFamily:FH,fontWeight:700,fontSize:16,marginBottom:12}}>Social & Bookings</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                <StatCard label="Instagram"         value={metrics.social.instagram}      onChange={v=>saveM("social.instagram",v)}      color="#7C3AED"/>
                <StatCard label="TikTok"            value={metrics.social.tiktok}         onChange={v=>saveM("social.tiktok",v)}         color="#7C3AED"/>
                <StatCard label="Bookings/week"     value={metrics.bookings.this_week}    onChange={v=>saveM("bookings.this_week",v)}    color={D.ok}/>
                <StatCard label="Google reviews"    value={metrics.social.google_reviews} onChange={v=>saveM("social.google_reviews",v)} color={D.ok}/>
                <StatCard label="Google rating"     value={metrics.social.google_rating}  onChange={v=>saveM("social.google_rating",v)}  color={D.ok} suffix="★"/>
                <StatCard label="Bookings/month"    value={metrics.bookings.this_month}   onChange={v=>saveM("bookings.this_month",v)}   color={D.ok}/>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
