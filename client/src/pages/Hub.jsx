import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import useStore from "../lib/store";
import { api } from "../lib/api";
import { C, FH, FB, btn, btnO, card, badge, GuidePanel, DownloadBtn, Spinner, ErrorBox } from "../components";

const MODE_CYCLE = ["Manual","Approve & proceed","Full auto"];

export default function Hub() {
  const { id: businessId } = useParams();
  const [searchParams]  = useSearchParams();
  const { user, hubModes, setHubMode } = useStore();
  const [business,   setBusiness]   = useState(null);
  const [outputs,    setOutputs]    = useState([]);
  const [integs,     setIntegs]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [genLoading, setGenLoading] = useState({});
  const [genError,   setGenError]   = useState("");
  const [hubTab,     setHubTab]     = useState(searchParams.get("tab") || "overview");
  const [chatOpen,   setChatOpen]   = useState(false);
  const [chatMsgs,   setChatMsgs]   = useState([{ role:"ai", text:"Your business is live. Ask me anything about next steps, marketing, or operations." }]);
  const navigate = useNavigate();

  const modes = hubModes[businessId] || { discovery:"Manual", creation:"Approve & proceed", marketing:"Full auto", management:"Full auto" };

  useEffect(() => {
    Promise.all([
      api.businesses.get(businessId),
      api.businesses.outputs(businessId),
      api.integrations.list(businessId),
    ]).then(([{ business: b }, { outputs: o }, { integrations: ig }]) => {
      setBusiness(b); setOutputs(o); setIntegs(ig);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [businessId]);

  const idea   = (() => { try { return JSON.parse(business?.ideaData  ||"{}"); } catch { return {}; } })();
  const intake = (() => { try { return JSON.parse(business?.intakeData||"{}"); } catch { return {}; } })();

  const generate = async (type, apiCall) => {
    setGenLoading(p=>({...p,[type]:true})); setGenError("");
    try {
      const result = await apiCall(businessId);
      const { output } = result;
      setOutputs(p => { const exists=p.find(o=>o.type===type); return exists?p.map(o=>o.type===type?output:o):[...p,output]; });
    } catch (e) { setGenError(e.message); }
    finally { setGenLoading(p=>({...p,[type]:false})); }
  };

  const connectStripe = async () => {
    try { const { url } = await api.integrations.stripe(businessId); window.open(url, "_blank"); }
    catch (e) { setGenError(e.message); }
  };

  const connectGoogle = async () => {
    try { const { url } = await api.integrations.googleAuth(businessId); window.open(url, "_blank"); }
    catch (e) { setGenError(e.message); }
  };

  const disconnect = async (provider) => {
    await api.integrations.disconnect(businessId, provider).catch(()=>{});
    setIntegs(p => p.map(i=>i.provider===provider?{...i,status:"disconnected",accessToken:null}:i));
  };

  const cycleMode = (stage) => {
    const cur = modes[stage] || "Manual";
    const next = MODE_CYCLE[(MODE_CYCLE.indexOf(cur)+1)%MODE_CYCLE.length];
    setHubMode(businessId, stage, next);
  };

  const sendChat = async (msg) => {
    setChatMsgs(p=>[...p,{role:"user",text:msg}]);
    try {
      const { reply } = await api.generate.chat(msg, businessId);
      setChatMsgs(p=>[...p,{role:"ai",text:reply}]);
    } catch { setChatMsgs(p=>[...p,{role:"ai",text:"Sorry, couldn't process that. Try again."}]); }
  };

  const getOutput = (type) => outputs.find(o=>o.type===type);
  const isIntegConnected = (provider) => integs.find(i=>i.provider===provider)?.status==="connected";

  if (loading) return (
    <div style={{ display:"flex", minHeight:"100vh", alignItems:"center", justifyContent:"center" }}>
      <Spinner />
    </div>
  );

  const navItems = [
    { id:"overview",   label:"Overview"    },
    { id:"content",    label:"Generated Content" },
    { id:"integrations",label:"Integrations"},
    { id:"settings",   label:"Settings"    },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:FB }}>
      {/* Hub sidebar */}
      <div style={{ width:220, background:C.dark, display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"20px 20px 18px", borderBottom:"1px solid #ffffff10" }}>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, color:"#fff" }}>LaunchLab</div>
          {user?.name && <div style={{ fontSize:11, color:"#ffffff45", marginTop:2 }}>{user.name}</div>}
        </div>
        <div style={{ padding:"16px 10px", borderBottom:"1px solid #ffffff10" }}>
          <div style={{ fontFamily:FH, fontWeight:600, fontSize:13, color:"#fff", marginBottom:4, padding:"0 10px" }}>{business?.name}</div>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"0 10px" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:C.ok }} />
            <span style={{ fontSize:11, color:"#ffffff55" }}>{business?.location}</span>
          </div>
        </div>
        <nav style={{ padding:"10px 8px", flex:1 }}>
          {navItems.map(({ id, label }) => (
            <div key={id} onClick={()=>setHubTab(id)} style={{ padding:"9px 10px", borderRadius:7, marginBottom:2, background:hubTab===id?"#ffffff15":"transparent", color:hubTab===id?"#fff":"#ffffff65", cursor:"pointer", fontSize:13, fontWeight:hubTab===id?500:400 }}>
              {label}
            </div>
          ))}
        </nav>
        <div style={{ padding:"10px 8px", borderTop:"1px solid #ffffff10" }}>
          <div onClick={()=>navigate(`/creation/${businessId}`)} style={{ padding:"9px 10px", borderRadius:7, color:"#ffffff45", cursor:"pointer", fontSize:12 }}>Edit setup tasks</div>
          <div onClick={()=>navigate("/dashboard")} style={{ padding:"9px 10px", borderRadius:7, color:"#ffffff30", cursor:"pointer", fontSize:12 }}>All businesses</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, background:C.bg, overflowY:"auto" }}>
        <div style={{ padding:"32px 32px 80px" }}>
          <ErrorBox msg={genError} onRetry={()=>setGenError("")} />

          {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
          {hubTab==="overview" && (
            <div>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, marginBottom:4 }}>{business?.name}</div>
              <p style={{ color:C.muted, fontSize:14, marginBottom:28 }}>{idea.name} &middot; {business?.location}</p>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
                {[
                  { label:"Revenue target",  value:idea.revenue||"—" },
                  { label:"Startup budget",  value:`$${Number(business?.budget||0).toLocaleString()}` },
                  { label:"Time to revenue", value:idea.timeToFirstRevenue||"—" },
                ].map(({ label, value }) => (
                  <div key={label} style={card()}>
                    <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:8 }}>{label}</div>
                    <div style={{ fontFamily:FH, fontWeight:700, fontSize:22, color:C.text }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ ...card("20px"), marginBottom:16 }}>
                <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:14 }}>Business summary</div>
                <p style={{ fontSize:14, color:C.muted, lineHeight:1.75 }}>{idea.why}</p>
                <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}`, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  {[["Biggest risk",idea.biggestRisk],["Startup cost",idea.startupCost],["Hours/week",`${business?.hoursPerWeek} hrs`],["Location",business?.location]].map(([l,v])=>(
                    v && <div key={l}><div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:3 }}>{l}</div><div style={{ fontSize:13, color:C.text }}>{v}</div></div>
                  ))}
                </div>
              </div>

              <div style={{ ...card("16px 20px"), background:C.discBg, border:`1px solid ${C.disc}15` }}>
                <div style={{ fontFamily:FH, fontWeight:600, fontSize:14, marginBottom:10 }}>Next steps</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    { done:!!getOutput("website"),        label:"Generate your website",      action:()=>setHubTab("content") },
                    { done:!!getOutput("business_plan"),  label:"Generate business plan",     action:()=>setHubTab("content") },
                    { done:!!getOutput("social_content"), label:"Generate social media content",action:()=>setHubTab("content") },
                    { done:isIntegConnected("stripe"),    label:"Connect Stripe for payments",action:()=>setHubTab("integrations") },
                    { done:isIntegConnected("google"),    label:"Connect Google Business",    action:()=>setHubTab("integrations") },
                  ].map((item,i) => (
                    <div key={i} onClick={item.done?null:item.action} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", cursor:item.done?"default":"pointer" }}>
                      <div style={{ width:18, height:18, borderRadius:"50%", background:item.done?C.ok:"transparent", border:`2px solid ${item.done?C.ok:C.disc}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", fontWeight:700, flexShrink:0 }}>
                        {item.done?"+":""}
                      </div>
                      <span style={{ fontSize:13, color:item.done?C.muted:C.disc, textDecoration:item.done?"line-through":"none", fontWeight:item.done?400:500 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── GENERATED CONTENT ────────────────────────────────────────────── */}
          {hubTab==="content" && (
            <div>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, marginBottom:4 }}>Generated Content</div>
              <p style={{ color:C.muted, fontSize:14, marginBottom:28 }}>AI-generated assets ready to use or customize.</p>

              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  { type:"website",        label:"Business Website",       desc:"Complete, mobile-responsive single-page site ready to deploy to Netlify or Vercel.", apiCall:api.generate.website, ext:".html", mime:"text/html" },
                  { type:"business_plan",  label:"Business Plan",          desc:"Full business plan with market analysis, financial projections, and 90-day action plan.", apiCall:api.generate.businessPlan, ext:".html", mime:"text/html" },
                  { type:"social_content", label:"30-Day Social Calendar", desc:"30 posts for Instagram and Facebook with captions, hashtags, and platform bios.", apiCall:api.generate.socialContent, ext:".json", mime:"application/json" },
                  { type:"email_templates",label:"Email Templates",        desc:"8 professional email templates: welcome, booking, reminders, follow-ups, and more.", apiCall:api.generate.emailTemplates, ext:".json", mime:"application/json" },
                ].map(({ type, label, desc, apiCall, ext, mime }) => {
                  const out     = getOutput(type);
                  const isLoading = !!genLoading[type];
                  return (
                    <div key={type} style={card()}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                            <span style={{ fontFamily:FH, fontWeight:600, fontSize:15 }}>{label}</span>
                            {out && <span style={badge(C.ok,C.okBg)}>Generated</span>}
                          </div>
                          <p style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>{desc}</p>
                          {out && <p style={{ fontSize:11, color:C.muted, marginTop:6 }}>Last updated: {new Date(out.updatedAt||out.createdAt).toLocaleDateString()}</p>}
                        </div>
                        <div style={{ display:"flex", gap:8, flexShrink:0, marginLeft:16 }}>
                          {out && <DownloadBtn content={out.content} filename={`${business?.name?.replace(/\s+/g,"-").toLowerCase()||"content"}-${type}${ext}`} label="Download" mimeType={mime} />}
                          <button onClick={()=>generate(type, apiCall)} disabled={isLoading} style={btn(out?C.disc:C.crea,"#fff",13)}>
                            {isLoading?"Generating...":(out?"Regenerate":"Generate")}
                          </button>
                        </div>
                      </div>
                      {type==="website" && out && (
                        <div style={{ marginTop:14, padding:"12px 14px", background:C.mgmtBg, borderRadius:8, border:`1px solid ${C.mgmt}20`, fontSize:13, color:C.mgmt, lineHeight:1.6 }}>
                          <strong>To deploy:</strong> Download the HTML file, go to <a href="https://netlify.com/drop" target="_blank" rel="noopener noreferrer" style={{ color:C.mgmt }}>netlify.com/drop</a>, and drag the file into the browser. Your site goes live instantly with a free URL.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── INTEGRATIONS ─────────────────────────────────────────────────── */}
          {hubTab==="integrations" && (
            <div style={{ maxWidth:600 }}>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, marginBottom:4 }}>Integrations</div>
              <p style={{ color:C.muted, fontSize:14, marginBottom:28 }}>Connect your tools to automate payments, bookings, listings, and more.</p>

              <div style={card()}>
                {[
                  { provider:"stripe",  label:"Stripe", desc:"Accept payments online. Required before you can charge customers.", action:connectStripe, setupLabel:"Connect Stripe" },
                  { provider:"google",  label:"Google Business Profile", desc:"Appear in Google Maps and local search results.", action:connectGoogle, setupLabel:"Connect Google" },
                  { provider:"calendly",label:"Calendly", desc:"Let customers book appointments without back-and-forth.", action:()=>window.open("https://calendly.com/signup","_blank"), setupLabel:"Set up Calendly" },
                  { provider:"namecheap",label:"Domain Registration", desc:"Register a custom domain name for your website.", action:()=>window.open("https://namecheap.com","_blank"), setupLabel:"Register domain" },
                ].map(({ provider, label, desc, action, setupLabel }, i, arr) => {
                  const connected = isIntegConnected(provider);
                  return (
                    <div key={provider} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        {connected && <div style={{ width:8, height:8, borderRadius:"50%", background:C.ok, flexShrink:0 }} />}
                        <div>
                          <div style={{ fontSize:14, fontWeight:500, color:C.text }}>{label}</div>
                          <div style={{ fontSize:12, color:connected?C.ok:C.muted }}>{connected?"Connected":desc}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        {connected && <button onClick={()=>disconnect(provider)} style={{ ...btnO(C.muted,12), padding:"6px 12px" }}>Disconnect</button>}
                        <button onClick={action} style={{ ...btn(connected?C.border:C.disc, connected?C.text:"#fff", 12), padding:"7px 14px", background:connected?"#F3F4F6":C.disc }}>
                          {connected?"Reconnect":setupLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ ...card("16px 20px"), marginTop:14, background:C.warnBg, border:`1px solid ${C.warn}20` }}>
                <div style={{ fontFamily:FH, fontWeight:600, fontSize:13, marginBottom:6 }}>Setup instructions</div>
                <p style={{ fontSize:13, color:C.muted, lineHeight:1.65 }}>
                  Stripe and Google require you to create accounts at their sites. After connecting, OAuth tokens are stored securely in your database.
                  Calendly and domain registration open their setup pages directly. Add your API keys to the server <code>.env</code> file to enable full OAuth flows.
                </p>
              </div>
            </div>
          )}

          {/* ── SETTINGS ─────────────────────────────────────────────────────── */}
          {hubTab==="settings" && (
            <div style={{ maxWidth:560 }}>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, marginBottom:4 }}>Settings</div>
              <p style={{ color:C.muted, fontSize:14, marginBottom:28 }}>Automation modes and business configuration.</p>

              <div style={{ ...card(), marginBottom:14 }}>
                <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:18 }}>Automation modes</div>
                <p style={{ fontSize:13, color:C.muted, lineHeight:1.6, marginBottom:16 }}>
                  Full auto: agents act immediately. Approve & proceed: agents propose, you confirm. Manual: you handle it.
                </p>
                {[["discovery","Discovery"],["creation","Creation"],["marketing","Marketing"],["management","Management"]].map(([key,label],i,arr)=>(
                  <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none" }}>
                    <span style={{ fontSize:14, color:C.text }}>{label} agent</span>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={badge(modes[key]==="Full auto"?C.mgmt:modes[key]==="Approve & proceed"?C.disc:C.muted, modes[key]==="Full auto"?C.mgmtBg:modes[key]==="Approve & proceed"?"#EEEEFF":C.bg)}>
                        {modes[key]||"Manual"}
                      </span>
                      <button onClick={()=>cycleMode(key)} style={{ ...btnO(C.disc,12), padding:"5px 10px" }}>Change</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={card()}>
                <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:18 }}>Business details</div>
                {business && [["Name",business.name],["Location",business.location],["Budget",`$${Number(business.budget).toLocaleString()}`],["Hours/week",business.hoursPerWeek],["Status",business.status]].map(([label,value])=>(
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:13, color:C.muted }}>{label}</span>
                    <span style={{ fontSize:13, color:C.text, fontWeight:500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {chatOpen && <GuidePanel messages={chatMsgs} onClose={()=>setChatOpen(false)} onSend={sendChat} businessId={businessId} />}
      <button onClick={()=>setChatOpen(o=>!o)} style={{ ...btn(C.mgmt), position:"fixed", bottom:24, right:chatOpen?336:24, fontSize:13, borderRadius:24, boxShadow:"0 4px 20px #00000018", zIndex:100, transition:"right 0.25s" }}>Ask guide</button>
    </div>
  );
}
