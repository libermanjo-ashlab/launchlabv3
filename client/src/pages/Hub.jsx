import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import useStore from "../lib/store";
import { api } from "../lib/api";
import { C, FH, FB, btn, btnO, card, inp, lbl, GuidePanel, Logo } from "../components";
import {
  Building2, ChartNoAxesCombined, Check, CircleCheck, CircleCheckBig, CircleX,
  Clapperboard, ClipboardList, Folder, Heart, KeyRound, LayoutDashboard,
  Lightbulb, LockKeyhole, Mail, MailCheck, Menu, MessageCircle, NotebookPen,
  Pencil, Pin, Plug, Settings2, Share2, Sparkles, TriangleAlert, Video, X, Zap,
} from "lucide-react";
import AgentPanel from "./MarketingAgent";
import { generatePostImageBlob } from "../lib/postImageCanvas";

// ── GUIDED TOUR ───────────────────────────────────────────────────────────────

function GuidedTour({ business, user, onDone }) {
  const [step, setStep] = useState(0);
  const firstName = (user?.name||"").split(" ")[0] || "there";
  const bizName = business?.name || "your business";

  const steps = [
    {
      Icon: Sparkles,
      title: `Welcome to ${bizName}`,
      body: `Hey ${firstName} — your business is live. This is your command center. Everything you need to run, grow, and manage ${bizName} is here. This takes about 90 seconds.`,
    },
    {
      Icon: LayoutDashboard,
      title: "Business Canvas",
      body: `The canvas is where you log your numbers — Revenue, Costs, Leads, Clients, Bookings, Investments. Each card tracks actual entries with dates. The more you log, the smarter your agents become. Start by adding a revenue entry or a lead.`,
      cta: "Canvas → Add your first metric →",
    },
    {
      Icon: CircleCheck,
      title: "Tasks",
      body: `Tasks are your business to-do list — and many of them execute themselves. Generate a full business plan, 30-day content calendar, or a live website with one click. Others (like registering your business) need your action. Every completed task stores its output permanently in Files.`,
      cta: "Tasks tab → click any AI task to run it →",
    },
    {
      Icon: ChartNoAxesCombined,
      title: "Marketing Agent",
      body: `Your Marketing Agent reads your canvas metrics, connected integrations, and business profile to rank your best growth opportunities by impact. Run a marketing analysis to get a prioritised channel plan — outreach, social, content, ads — tailored to your actual numbers.`,
      cta: "Marketing Agent tab → Run analysis →",
    },
    {
      Icon: Settings2,
      title: "Management Agent",
      body: `The Management Agent has three modes. Correlation Analysis lets you compare any two metrics statistically to find what drives growth. Business Insights generates an AI strategy report you review and approve. Operations Autopilot runs the strategy cycle automatically each week and syncs directly to your Marketing Agent.`,
      cta: "Management Agent tab → choose a mode →",
    },
    {
      Icon: Plug,
      title: "Integrations & Files",
      body: `Connect your tools under Integrations — Calendly, Instagram, your website, payment processors — and the agents use that live context in every analysis. All generated documents (business plans, content calendars, websites) are saved permanently in Files and can be re-opened any time.`,
      cta: "Hub tab → Integrations → connect one tool →",
    },
    {
      Icon: CircleCheckBig,
      title: `You're set, ${firstName}.`,
      body: `Start with Tasks — several AI tasks can run right now with one click. Then log a few canvas metrics and run your first Marketing analysis. The more data you give your agents, the more specific and useful their output becomes.`,
    },
  ];

  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:C.surface, borderRadius:20, padding:"32px 36px", maxWidth:500, width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,0.35)" }}>
        <div style={{ display:"flex", gap:4, marginBottom:28 }}>
          {steps.map((_,i) => (
            <div key={i} style={{ height:3, flex:1, borderRadius:2, background:i<=step?C.dark:"#E5E7EB", transition:"background 0.25s" }} />
          ))}
        </div>
        <div style={{ marginBottom:14, lineHeight:1, color:C.text }}><s.Icon size={24} strokeWidth={1.5} aria-hidden="true" /></div>
        <div style={{ fontFamily:FH, fontWeight:700, fontSize:22, letterSpacing:"-0.04em", marginBottom:10 }}>{s.title}</div>
        <p style={{ fontSize:14, color:C.muted, lineHeight:1.8, fontFamily:FB, marginBottom:s.cta?16:28 }}>{s.body}</p>
        {s.cta && <div style={{ background:"#F1F5F9", borderRadius:10, padding:"10px 14px", fontSize:12, color:C.text, fontFamily:FB, fontWeight:600, marginBottom:28 }}>{s.cta}</div>}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <button onClick={() => step > 0 && setStep(p => p - 1)} style={{ ...btnO(C.muted, 13), opacity:step===0?0.3:1, cursor:step===0?"default":"pointer" }} disabled={step===0}>Back</button>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onDone} style={{ ...btnO(C.muted, 12) }}>Skip</button>
            <button onClick={() => isLast ? onDone() : setStep(p => p + 1)} style={{ ...btn(C.dark, "#fff", 13) }}>
              {isLast ? "Let's go" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TASKS ─────────────────────────────────────────────────────────────────────

const AUTO_TASK_TEMPLATES = [
  { name:"Business Plan",              category:"Strategy",  description:"Full business plan with financial projections and market analysis", canAutomate:true },
  { name:"30-Day Marketing Calendar",  category:"Marketing", description:"Content ideas, captions, and hashtags for a full month",           canAutomate:true },
  { name:"Business Website",           category:"Marketing", description:"Deploy-ready website with your business info and services",         canAutomate:true },
  { name:"Email Templates",            category:"Marketing", description:"8 email templates for client outreach, follow-up, and receipts",    canAutomate:true },
  { name:"Investor Pitch Deck",        category:"Strategy",  description:"Slide-ready pitch covering market, product, traction, and financials", canAutomate:true },
  { name:"Competitor Analysis Report", category:"Strategy",  description:"AI review of your top 3 competitors: gaps, pricing, positioning",  canAutomate:true },
  { name:"Pricing Strategy Document",  category:"Strategy",  description:"AI-recommended pricing tiers and positioning based on your market", canAutomate:true },
  { name:"Marketing Budget Plan",      category:"Marketing", description:"Monthly budget allocation across channels with ROI targets",        canAutomate:true },
];
const MANUAL_TASK_TEMPLATES = [
  { name:"Register Business Name",     category:"Legal",     description:"File a DBA or register your LLC/sole proprietorship",              canAutomate:false },
  { name:"Get Business License",       category:"Legal",     description:"Apply for required local or state operating licenses",             canAutomate:false },
  { name:"Open Business Bank Account", category:"Finance",   description:"Separate personal and business finances",                          canAutomate:false },
  { name:"Purchase Domain Name",       category:"Marketing", description:"Buy your domain through Namecheap, GoDaddy, or Google Domains",    canAutomate:false },
  { name:"Set Up Business Email",      category:"Operations",description:"Create a professional email address (e.g. yourname@yourdomain.com)",canAutomate:false },
  { name:"Take Product/Service Photos",category:"Marketing", description:"High-quality photos for your website and social media",            canAutomate:false },
  { name:"Create Social Media Accounts",category:"Marketing",description:"Set up Instagram, TikTok, and Facebook business profiles",        canAutomate:false },
];

function AddTaskModal({ businessId, onAdd, onClose, isStarterPlan }) {
  const [tab, setTab]       = useState("templates");
  const [custom, setCustom] = useState({ name:"", description:"", category:"Operations" });
  const [saving, setSaving] = useState(false);

  const add = async (template) => {
    setSaving(true);
    try {
      const { task } = await api.tasks.create(businessId, template);
      onAdd(task);
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.surface, borderRadius:16, padding:"28px 32px", maxWidth:580, width:"100%", maxHeight:"80vh", overflow:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:18, letterSpacing:"-0.03em" }}>Add a task</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted, lineHeight:1, padding:4 }}>×</button>
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:20 }}>
          {[["templates","From templates"],["custom","Custom task"]].map(([id,label]) => (
            <button key={id} onClick={()=>setTab(id)} style={{ ...btn(tab===id?C.dark:"#F4F4F5", tab===id?"#fff":C.muted, 12), padding:"7px 14px" }}>{label}</button>
          ))}
        </div>

        {tab === "templates" && (
          <div>
            {!isStarterPlan && <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Auto-generate these instantly</div>}
            {isStarterPlan && <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Output templates — complete manually</div>}
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
              {AUTO_TASK_TEMPLATES.map(t => (
                <div key={t.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg }}>
                  <div>
                    <div style={{ fontFamily:FB, fontWeight:600, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{t.description}</div>
                  </div>
                  <button onClick={()=>add(t)} disabled={saving} style={{ ...btn(C.dark,"#fff",11), padding:"6px 12px", flexShrink:0, marginLeft:12 }}>Add</button>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Manual — requires your action</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {MANUAL_TASK_TEMPLATES.map(t => (
                <div key={t.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg }}>
                  <div>
                    <div style={{ fontFamily:FB, fontWeight:600, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{t.description}</div>
                  </div>
                  <button onClick={()=>add(t)} disabled={saving} style={{ ...btn("#6B7280","#fff",11), padding:"6px 12px", flexShrink:0, marginLeft:12 }}>Add</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "custom" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={lbl}>Task name *</label>
              <input style={inp()} value={custom.name} onChange={e=>setCustom(p=>({...p,name:e.target.value}))} placeholder="e.g. Create a referral program" />
            </div>
            <div>
              <label style={lbl}>Description</label>
              <input style={inp()} value={custom.description} onChange={e=>setCustom(p=>({...p,description:e.target.value}))} placeholder="What needs to happen?" />
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select style={{ ...inp(), appearance:"none" }} value={custom.category} onChange={e=>setCustom(p=>({...p,category:e.target.value}))}>
                {["Strategy","Marketing","Legal","Finance","Operations","Other"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={()=>custom.name.trim()&&add(custom)} disabled={!custom.name.trim()||saving} style={{ ...btn(C.dark,"#fff",13) }}>Add task</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── OUTPUT VIEWER ─────────────────────────────────────────────────────────────

function extractOutput(outputData) {
  if (!outputData) return null;
  const content = outputData.content;
  const fields  = Array.isArray(outputData.fields) && outputData.fields.length > 0 ? outputData.fields : null;
  if (!content && !fields) return null;

  if (content) {
    const trimmed = content.trim();
    const isHtml = trimmed.startsWith("<") || /<!doctype|<html|<div|<body/i.test(trimmed.slice(0, 200));
    if (isHtml) return { type:"html", content, fields };
    try {
      const parsed = JSON.parse(content);
      return { type:"json", content, parsed, fields };
    } catch {}
    return { type:"text", content, fields };
  }
  return { type:"fields", fields };
}

function OutputViewer({ outputData, taskName }) {
  const [showSource, setShowSource] = useState(false);
  const extracted = extractOutput(outputData);

  if (!extracted) return (
    <div style={{ background:C.surface, borderRadius:8, border:`1px solid ${C.border}`, padding:"16px", fontSize:13, color:C.muted, fontFamily:FB, textAlign:"center" }}>
      No content generated. Use "Auto-generate" or upload your own output.
    </div>
  );

  const { type, content, parsed, fields } = extracted;

  return (
    <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${C.border}` }}>
      {/* HTML: sandboxed iframe */}
      {type === "html" && !showSource && (
        <div>
          <div style={{ background:"#F4F4F5", padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, color:C.muted, fontFamily:FB, fontWeight:600 }}>Preview</span>
            <button onClick={()=>setShowSource(true)} style={{ ...btnO(C.muted,10), padding:"3px 10px" }}>View source</button>
          </div>
          <iframe
            srcDoc={content}
            sandbox="allow-same-origin allow-scripts"
            style={{ width:"100%", height:420, border:"none", display:"block", background:"#fff" }}
            title={taskName}
          />
        </div>
      )}

      {/* HTML source toggle */}
      {type === "html" && showSource && (
        <div>
          <div style={{ background:"#F4F4F5", padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, color:C.muted, fontFamily:FB, fontWeight:600 }}>Source</span>
            <button onClick={()=>setShowSource(false)} style={{ ...btnO("#475569",10), padding:"3px 10px" }}>Show preview</button>
          </div>
          <pre style={{ margin:0, padding:"12px 14px", fontSize:11, fontFamily:"monospace", color:C.text, lineHeight:1.6, maxHeight:300, overflowY:"auto", background:C.surface, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
            {content.slice(0, 5000)}{content.length > 5000 ? "\n…(truncated)" : ""}
          </pre>
        </div>
      )}

      {/* JSON: structured view */}
      {type === "json" && (
        <div style={{ padding:"14px 16px", background:C.surface, maxHeight:400, overflowY:"auto" }}>
          {parsed && typeof parsed === "object" && !Array.isArray(parsed) && (
            Object.entries(parsed).map(([key, val]) => {
              const label = key.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
              if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
                return (
                  <div key={key} style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8, fontFamily:FB }}>{label} ({val.length})</div>
                    {val.slice(0,5).map((item,i)=>(
                      <div key={i} style={{ background:C.bg, borderRadius:8, padding:"10px 12px", marginBottom:6, border:`1px solid ${C.border}` }}>
                        {Object.entries(item).filter(([,v])=>typeof v === "string" && v.length < 400).map(([k,v])=>(
                          <div key={k} style={{ marginBottom:4 }}>
                            <span style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", fontFamily:FB }}>{k.replace(/_/g," ")}: </span>
                            <span style={{ fontSize:12, color:C.text, fontFamily:FB }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {val.length > 5 && <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>+{val.length-5} more items in download</div>}
                  </div>
                );
              }
              if (typeof val === "string" || typeof val === "number") {
                return (
                  <div key={key} style={{ display:"flex", gap:8, padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:11, fontWeight:600, color:C.muted, minWidth:140, fontFamily:FB }}>{label}</span>
                    <span style={{ fontSize:12, color:C.text, fontFamily:FB, lineHeight:1.6 }}>{String(val)}</span>
                  </div>
                );
              }
              return null;
            })
          )}
        </div>
      )}

      {/* Plain text */}
      {type === "text" && (
        <pre style={{ margin:0, padding:"14px 16px", fontSize:12, fontFamily:"monospace", color:C.text, lineHeight:1.7, maxHeight:320, overflowY:"auto", background:C.surface, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
          {content.slice(0, 5000)}{content.length > 5000 ? "\n…(truncated)" : ""}
        </pre>
      )}

      {/* Fields-only (server-side generateTaskOutput result) */}
      {type === "fields" && (
        <div style={{ background:C.surface, padding:"14px 16px" }}>
          {fields.map((f,i) => (
            <div key={i} style={{ display:"flex", gap:8, padding:"8px 0", borderBottom:i<fields.length-1?`1px solid ${C.border}`:"none" }}>
              <span style={{ fontSize:11, fontWeight:600, color:C.muted, minWidth:160, flexShrink:0, fontFamily:FB }}>{f.label}</span>
              <span style={{ fontSize:12, color:C.text, fontFamily:FB, lineHeight:1.6, wordBreak:"break-word" }}>{f.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Supplemental fields for html/json/text outputs (server adds these) */}
      {type !== "fields" && fields && (
        <div style={{ borderTop:`1px solid ${C.border}`, background:C.bg, padding:"10px 14px" }}>
          {fields.map((f,i) => (
            <div key={i} style={{ display:"flex", gap:8, padding:"5px 0" }}>
              <span style={{ fontSize:10, fontWeight:600, color:C.muted, minWidth:140, flexShrink:0, fontFamily:FB }}>{f.label}</span>
              <span style={{ fontSize:11, color:C.text, fontFamily:FB }}>{f.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, businessId, outputs, onUpdate, onDelete, isStarterPlan }) {
  const [expanded,     setExpanded]     = useState(false);
  const [running,      setRunning]      = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [textInput,    setTextInput]    = useState("");
  const [viewOutput,   setViewOutput]   = useState(false);
  const [error,        setError]        = useState("");
  const [steps,        setSteps]        = useState(null);
  const [stepsLoading, setStepsLoading] = useState(false);
  const fileRef = useRef();

  const outputData = task.outputData;
  const hasOutput  = !!extractOutput(outputData);
  const canAuto    = task.canAutomate && !isStarterPlan;

  const generate = async () => {
    setRunning(true); setError("");
    try {
      let result;
      if (task.name.toLowerCase().includes("website") || task.name.toLowerCase().includes("web page")) {
        result = await api.generate.website(businessId);
        await api.tasks.update(task.id, { status:"done", outputData:{ type:"website", content:result.output?.content||"", title:result.output?.title||task.name, generatedAt:new Date().toISOString() } });
        onUpdate({ ...task, status:"done", outputData:{ type:"website", content:result.output?.content||"", title:result.output?.title||task.name, generatedAt:new Date().toISOString() } });
      } else if (task.name.toLowerCase().includes("business plan")) {
        result = await api.generate.businessPlan(businessId);
        await api.tasks.update(task.id, { status:"done", outputData:{ type:"document", content:result.output?.content||"", title:result.output?.title||task.name, generatedAt:new Date().toISOString() } });
        onUpdate({ ...task, status:"done", outputData:{ type:"document", content:result.output?.content||"", title:result.output?.title||task.name, generatedAt:new Date().toISOString() } });
      } else if (task.name.toLowerCase().includes("social") || task.name.toLowerCase().includes("marketing calendar") || task.name.toLowerCase().includes("content")) {
        result = await api.generate.socialContent(businessId);
        await api.tasks.update(task.id, { status:"done", outputData:{ type:"document", content:result.output?.content||"", title:result.output?.title||task.name, generatedAt:new Date().toISOString() } });
        onUpdate({ ...task, status:"done", outputData:{ type:"document", content:result.output?.content||"", title:result.output?.title||task.name, generatedAt:new Date().toISOString() } });
      } else if (task.name.toLowerCase().includes("email template")) {
        result = await api.generate.emailTemplates(businessId);
        await api.tasks.update(task.id, { status:"done", outputData:{ type:"document", content:result.output?.content||"", title:result.output?.title||task.name, generatedAt:new Date().toISOString() } });
        onUpdate({ ...task, status:"done", outputData:{ type:"document", content:result.output?.content||"", title:result.output?.title||task.name, generatedAt:new Date().toISOString() } });
      } else {
        const { task:updated } = await api.tasks.run(task.id);
        onUpdate(updated);
      }
    } catch(e) { setError(e.message); }
    setRunning(false);
  };

  const saveTextOutput = async () => {
    if (!textInput.trim()) return;
    setUploading(true);
    try {
      const od = { type:"text", content:textInput.trim(), uploadedAt:new Date().toISOString() };
      await api.tasks.update(task.id, { outputData:od });
      onUpdate({ ...task, outputData:od });
      setTextInput("");
    } catch(e) { setError(e.message); }
    setUploading(false);
  };

  const saveFileOutput = async (file) => {
    setUploading(true);
    try {
      const content = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsText(file); }).catch(()=>
        new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsDataURL(file); })
      );
      const od = { type:"file", content, filename:file.name, uploadedAt:new Date().toISOString() };
      await api.tasks.update(task.id, { outputData:od });
      onUpdate({ ...task, outputData:od });
    } catch(e) { setError(e.message); }
    setUploading(false);
  };

  const getSteps = async () => {
    setStepsLoading(true);
    try {
      const q = `Give 4-5 concise numbered action steps to complete this task for a small business: "${task.name}"${task.description ? ` — ${task.description}` : ""}. Be specific and practical.`;
      const { suggestion } = await api.metrics.suggest(businessId, q, {});
      setSteps(suggestion || "No guidance available.");
    } catch { setSteps("Unable to load guidance — check your connection."); }
    setStepsLoading(false);
  };

  const markDone = async () => {
    await api.tasks.update(task.id, { status:"done" }).catch(()=>{});
    onUpdate({ ...task, status:"done" });
  };

  const saveOutputAndComplete = async () => {
    if (!textInput.trim()) { await markDone(); return; }
    setUploading(true);
    try {
      const od = { type:"text", content:textInput.trim(), uploadedAt:new Date().toISOString() };
      await api.tasks.update(task.id, { outputData:od, status:"done" });
      onUpdate({ ...task, outputData:od, status:"done" });
      setTextInput("");
    } catch(e) { setError(e.message); }
    setUploading(false);
  };

  const markTodo = async () => {
    await api.tasks.update(task.id, { status:"pending" }).catch(()=>{});
    onUpdate({ ...task, status:"pending" });
  };

  const downloadOutput = () => {
    const ex = extractOutput(outputData);
    if (!ex) return;
    const slug = task.name.toLowerCase().replace(/\s+/g,"-");
    if (ex.type === "html") {
      const blob = new Blob([ex.content], { type:"text/html" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a"); a.href=url; a.download=`${slug}.html`; a.click(); URL.revokeObjectURL(url);
    } else if (ex.type === "json") {
      const blob = new Blob([ex.content], { type:"application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a"); a.href=url; a.download=`${slug}.json`; a.click(); URL.revokeObjectURL(url);
    } else if (ex.type === "fields") {
      const txt = ex.fields.map(f=>`${f.label}: ${f.value}`).join("\n");
      const blob = new Blob([txt], { type:"text/plain" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a"); a.href=url; a.download=`${slug}.txt`; a.click(); URL.revokeObjectURL(url);
    } else {
      const fname = outputData.filename || `${slug}.txt`;
      const blob  = new Blob([ex.content], { type:"text/plain" });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement("a"); a.href=url; a.download=fname; a.click(); URL.revokeObjectURL(url);
    }
  };

  const statusColor = { done:C.ok, running:C.muted, "in-progress":C.warn, pending:C.muted };
  const statusLabel = { done:"Done", running:"Generating…", "in-progress":"In progress", pending:"To do" };
  const status = task.status === "running" ? "running" : task.status;

  return (
    <div style={{ ...card("0"), overflow:"hidden", marginBottom:8 }}>
      <div style={{ padding:"14px 16px", display:"flex", gap:12, alignItems:"flex-start", cursor:"pointer" }} onClick={()=>setExpanded(p=>!p)}>
        <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${statusColor[status]||C.muted}`, background:status==="done"?statusColor[status]:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
          {status==="done"&&<Check size={10} color="#fff" strokeWidth={2.5} aria-hidden="true" />}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontFamily:FB, fontWeight:600, fontSize:13, textDecoration:status==="done"?"line-through":"none", color:status==="done"?C.muted:C.text }}>{task.name}</span>
            <span style={{ background:(statusColor[status]||C.muted)+"18", color:statusColor[status]||C.muted, fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FB }}>{statusLabel[status]||status}</span>
            {canAuto && status!=="done" && <span style={{ background:"#F1F5F9", color:C.muted, fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.04em", fontFamily:FB }}>Auto</span>}
            <span style={{ fontSize:9, fontWeight:600, color:C.subtle, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FB, background:C.bg, padding:"2px 7px", borderRadius:20 }}>{task.category}</span>
          </div>
          {task.description && <div style={{ fontSize:12, color:C.muted, marginTop:3, fontFamily:FB }}>{task.description}</div>}
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          {hasOutput && <span style={{ fontSize:10, color:C.ok, fontWeight:600, fontFamily:FB }}>Has output</span>}
          <span style={{ color:C.muted, fontSize:14, transform:expanded?"rotate(180deg)":"none", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:"14px 16px", background:C.bg }}>
          {error && <div style={{ background:C.errBg, border:`1px solid ${C.err}25`, borderRadius:8, padding:"8px 12px", fontSize:12, color:C.err, fontFamily:FB, marginBottom:12 }}>{error}</div>}
          <input ref={fileRef} type="file" style={{ display:"none" }} onChange={e=>e.target.files[0]&&saveFileOutput(e.target.files[0])} />

          {/* ── AUTO mode (template tasks on non-starter plans) ── */}
          {canAuto && status !== "done" && (
            <div style={{ marginBottom:14 }}>
              <button onClick={generate} disabled={running||status==="running"} style={{ ...btn(running||status==="running"?"#9CA3AF":C.dark,"#fff",12), display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                {(running||status==="running")&&<span style={{ width:11,height:11,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite" }}/>}
                {running||status==="running" ? "Generating…" : "Auto-generate"}
              </button>
              <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>or upload your own output below</div>
            </div>
          )}

          {/* ── MANUAL mode: guidance steps + output ── */}
          {!canAuto && status !== "done" && (
            <>
              {/* Action steps */}
              <div style={{ marginBottom:14 }}>
                <button onClick={getSteps} disabled={stepsLoading} style={{ ...btnO("#475569",12), padding:"7px 14px", marginBottom: steps ? 10 : 0 }}>
                  {stepsLoading ? "Loading…" : steps ? "Refresh steps" : "Get action steps"}
                </button>
                {steps && (
                  <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"12px 14px", marginTop:8 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#92400E", fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>How to complete this task</div>
                    <div style={{ fontSize:12, color:"#374151", fontFamily:FB, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{steps}</div>
                  </div>
                )}
              </div>

              {/* Output input */}
              <div style={{ marginBottom:12 }}>
                <label style={{ ...lbl, marginBottom:6 }}>Record output (optional — saves to Hub/Files)</label>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{ ...btnO("#475569",12), padding:"7px 14px" }}>Upload file</button>
                </div>
                <textarea value={textInput} onChange={e=>setTextInput(e.target.value)} placeholder="Paste notes, a link, or any output to save to Hub/Files…" style={{ ...inp({ height:70, resize:"vertical" }) }} />
              </div>

              {/* Complete actions */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                <button onClick={saveOutputAndComplete} disabled={uploading} style={{ ...btn(C.ok,"#fff",12), padding:"7px 16px" }}>
                  {textInput.trim() ? "Save output & mark done" : "Mark done"}
                </button>
                <button onClick={()=>onDelete(task.id)} style={{ ...btnO(C.err,12), padding:"7px 12px" }}>Remove</button>
                {textInput.trim() && <span style={{ fontSize:11, color:C.muted, fontFamily:FB }}>Output saved to Hub/Files</span>}
              </div>
            </>
          )}

          {/* ── AUTO: upload section (when canAuto) ── */}
          {canAuto && status !== "done" && (
            <div style={{ marginBottom:14 }}>
              <label style={{ ...lbl, marginBottom:6 }}>Upload output (file or paste text)</label>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{ ...btnO("#475569",12), padding:"8px 14px" }}>Upload file</button>
              </div>
              <textarea value={textInput} onChange={e=>setTextInput(e.target.value)} placeholder="Or paste text, notes, a link, or any output…" style={{ ...inp({ height:80, resize:"vertical" }) }} />
              {textInput.trim() && <button onClick={saveTextOutput} disabled={uploading} style={{ ...btn(C.dark,"#fff",12), marginTop:6 }}>Save text output</button>}
            </div>
          )}

          {/* View existing output (all modes) */}
          {hasOutput && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <button onClick={()=>setViewOutput(p=>!p)} style={{ ...btnO("#475569",12), padding:"7px 12px" }}>{viewOutput?"Hide output":"View output"}</button>
                <button onClick={downloadOutput} style={{ ...btnO(C.ok,12), padding:"7px 12px" }}>Download</button>
              </div>
              {viewOutput && <OutputViewer outputData={outputData} taskName={task.name} />}
            </div>
          )}

          {/* AUTO: mark complete (requires output) */}
          {canAuto && status !== "done" && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {hasOutput && <button onClick={markDone} style={{ ...btn(C.ok,"#fff",12), padding:"7px 14px" }}>Mark complete</button>}
              <button onClick={()=>onDelete(task.id)} style={{ ...btnO(C.err,12), padding:"7px 12px" }}>Remove task</button>
            </div>
          )}

          {/* Done state (all modes) */}
          {status === "done" && (
            <>
              <div style={{ marginBottom:10 }}>
                <textarea value={textInput} onChange={e=>setTextInput(e.target.value)} placeholder="Add or replace output…" style={{ ...inp({ height:60, resize:"vertical" }) }} />
                {textInput.trim() && <button onClick={saveTextOutput} disabled={uploading} style={{ ...btn(C.dark,"#fff",12), marginTop:6 }}>Save to Hub/Files</button>}
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <button onClick={markTodo} style={{ ...btnO(C.muted,12), padding:"7px 12px" }}>Reopen</button>
                <button onClick={()=>onDelete(task.id)} style={{ ...btnO(C.err,12), padding:"7px 12px" }}>Remove task</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const NOTE_BG_COLORS = ["#FEF9C3","#FCE7F3","#DBEAFE","#D1FAE5","#FEE2E2"];

function NotesGrid({ notes, onDelete }) {
  if (notes.length===0) return (
    <div style={{ ...card("28px"), textAlign:"center", color:C.muted }}>
      <div style={{ marginBottom:8, color:C.muted }}><NotebookPen size={24} aria-hidden="true" /></div>
      <div style={{ fontFamily:FH, fontWeight:600, fontSize:14, marginBottom:4 }}>No notes yet</div>
      <p style={{ fontSize:12, lineHeight:1.6 }}>Add sticky notes in the Marketing Agent tab and they'll appear here.</p>
    </div>
  );
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12, marginTop:4 }}>
      {notes.map((n,i)=>(
        <div key={n.id} style={{ background:NOTE_BG_COLORS[i%NOTE_BG_COLORS.length], borderRadius:10, padding:"14px 16px", boxShadow:"0 2px 6px rgba(0,0,0,0.07)", position:"relative", minHeight:90 }}>
          <p style={{ fontSize:13, color:"#374151", fontFamily:FB, lineHeight:1.65, wordBreak:"break-word", paddingRight:20 }}>{n.description||n.name}</p>
          <div style={{ fontSize:10, color:"#9CA3AF", fontFamily:FB, marginTop:8 }}>
            {n.createdAt ? new Date(n.createdAt).toLocaleDateString(undefined,{month:"short",day:"numeric"}) : ""}
          </div>
          <button onClick={()=>onDelete(n.id)}
            style={{ position:"absolute", top:8, right:8, background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:16, padding:0, lineHeight:1 }}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Campaign task — read-only status view (actions only available in Marketing Agent) ──
function CampaignTaskCard({ task }) {
  const isDone    = task.status === "done" || task.status === "completed";
  const isSkipped = task.status === "skipped";
  const dotColor  = isDone ? C.ok : isSkipped ? "#F59E0B" : C.border;
  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
      <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${dotColor}`, background:isDone?C.ok:"transparent", flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {isDone && <Check size={9} color="#fff" strokeWidth={2.5} aria-hidden="true" />}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <span style={{ fontSize:12, fontFamily:FB, fontWeight:600, color:isDone||isSkipped?C.muted:C.text, textDecoration:isDone||isSkipped?"line-through":"none" }}>{task.name}</span>
        {task.estimatedTime && !isDone && <span style={{ fontSize:10, color:C.muted, fontFamily:FB, marginLeft:8 }}>{task.estimatedTime}</span>}
        {task.description && !isDone && <p style={{ fontSize:11, color:C.muted, fontFamily:FB, lineHeight:1.5, marginTop:2, marginBottom:0 }}>{task.description}</p>}
      </div>
      <span style={{ fontSize:9, fontFamily:FB, fontWeight:700, color:C.muted, textTransform:"uppercase", flexShrink:0, marginTop:2 }}>
        {isDone?"done":isSkipped?"skipped":task.mode||"guided"}
      </span>
    </div>
  );
}

// ── Inline-editable task row wrapper ─────────────────────────────────────────
function StickyNoteChip({ note, onUnstick }) {
  if (!note) return null;
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:note.color||"#FEF9C3", borderRadius:6, padding:"3px 8px", marginBottom:4, fontSize:11, color:"#374151", fontFamily:FB, maxWidth:"100%", overflow:"hidden" }}>
      <Pin size={12} style={{ flexShrink:0, color:"#9CA3AF" }} aria-hidden="true" />
      <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{note.text}</span>
      <button onClick={e=>{e.stopPropagation();onUnstick();}} aria-label="Unpin note" style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", padding:0, flexShrink:0, display:"flex" }}><X size={10} aria-hidden="true" /></button>
    </div>
  );
}

function TaskRowWrapper({ task, businessId, businessName, outputs, onUpdate, onDelete, selectable, selected, onToggleSelect, stickyNote, onAssignSticky, onUnstickNote, isStarterPlan }) {
  const [editing,  setEditing]  = useState(false);
  const [eName,    setEName]    = useState(task.name);
  const [eDesc,    setEDesc]    = useState(task.description || "");
  const [saving,   setSaving]   = useState(false);

  const saveEdit = async () => {
    if (!eName.trim()) return;
    setSaving(true);
    try {
      const updated = await api.tasks.update(task.id, { name: eName.trim(), description: eDesc.trim() });
      onUpdate({ ...task, name: eName.trim(), description: eDesc.trim() });
    } catch {}
    setSaving(false);
    setEditing(false);
  };

  const [dropOver, setDropOver] = useState(false);
  return (
    <div
      style={{ marginBottom:8 }}
      onDragOver={e=>{ e.preventDefault(); setDropOver(true); }}
      onDragLeave={()=>setDropOver(false)}
      onDrop={e=>{ e.preventDefault(); setDropOver(false); const noteId=e.dataTransfer.getData("text/noteId"); if(noteId&&onAssignSticky) onAssignSticky(noteId, task.id, task.name); }}>
      {stickyNote && <StickyNoteChip note={stickyNote} onUnstick={()=>onUnstickNote(task.id)} />}
      {dropOver && !stickyNote && <div style={{ height:2, background:C.border, borderRadius:2, marginBottom:4 }} />}
      <div style={{ display:"flex", gap:8, alignItems:"flex-start", border:dropOver?`1px dashed ${C.border}`:"1px solid transparent", borderRadius:8, padding:dropOver?"2px":"0" }}>
      {/* Checkbox for bulk select */}
      {selectable && (
        <div style={{ paddingTop:16, flexShrink:0 }}>
          <input type="checkbox" checked={selected} onChange={()=>onToggleSelect(task.id)}
            style={{ width:16, height:16, cursor:"pointer", accentColor:C.dark }} />
        </div>
      )}

      <div style={{ flex:1, minWidth:0 }}>
        {editing ? (
          <div style={{ ...card("12px 14px"), marginBottom:0 }}>
            <div style={{ fontFamily:FB, fontWeight:600, fontSize:12, color:C.muted, marginBottom:6 }}>Edit task</div>
            <input value={eName} onChange={e=>setEName(e.target.value)}
              style={{ ...inp({ marginBottom:8 }), fontWeight:600 }} placeholder="Task name" />
            <textarea value={eDesc} onChange={e=>setEDesc(e.target.value)}
              style={{ ...inp({ height:60, resize:"vertical", marginBottom:8 }) }} placeholder="Description (optional)" />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={saveEdit} disabled={saving||!eName.trim()} style={{ ...btn(C.dark,"#fff",12), padding:"6px 14px" }}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={()=>{ setEditing(false); setEName(task.name); setEDesc(task.description||""); }}
                style={{ ...btnO(C.muted,12), padding:"6px 12px" }}>Cancel</button>
            </div>
          </div>
        ) : task.category === "campaign" ? (
          <CampaignTaskCard task={task} />
        ) : (
          <div style={{ position:"relative" }}>
            <TaskCard task={task} businessId={businessId} outputs={outputs} onUpdate={onUpdate} onDelete={onDelete} isStarterPlan={isStarterPlan} />
            {/* Edit pencil — top-right of card header */}
            <button onClick={e=>{e.stopPropagation();setEditing(true);}}
              title="Edit task"
              style={{ position:"absolute", top:10, right:36, background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:13, padding:"3px 5px", lineHeight:1, zIndex:2 }}>
              <Pencil size={13} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ── Campaign group accordion ──────────────────────────────────────────────────
function CampaignGroup({ title, tasks, businessId, businessName, outputs, onUpdate, onDelete, selectable, selected, onToggleSelect, hubNotes, stickyAssignments, onAssignSticky, onUnstickNote, isStarterPlan }) {
  const [open, setOpen] = useState(true);
  const done  = tasks.filter(t=>t.status==="done").length;
  return (
    <div style={{ marginBottom:12 }}>
      <div onClick={()=>setOpen(p=>!p)}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"#F8FAFC", borderRadius:8, cursor:"pointer", marginBottom:open?6:0, border:`1px solid ${C.border}` }}>
        <span style={{ fontSize:11 }}>{open?"▼":"▶"}</span>
        <span style={{ fontFamily:FH, fontWeight:600, fontSize:13, color:C.text, flex:1 }}>{title}</span>
        <span style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{done}/{tasks.length} done</span>
      </div>
      {open && (
        <div style={{ paddingLeft:16, borderLeft:`2px solid ${C.border}` }}>
          {tasks.map(t=>{
            const assignment = stickyAssignments?.[t.id];
            const stickyNote = assignment ? hubNotes?.find(n=>n.id===assignment.noteId) : null;
            return (
              <TaskRowWrapper key={t.id} task={t} businessId={businessId} businessName={businessName} outputs={outputs}
                onUpdate={onUpdate} onDelete={onDelete}
                selectable={selectable} selected={selected.has(t.id)} onToggleSelect={onToggleSelect}
                stickyNote={stickyNote} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote}
                isStarterPlan={isStarterPlan} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function TasksPanel({ businessId, businessName, businessOutputs, hubNotes, stickyAssignments, onAssignSticky, onUnstickNote, onTasksChanged, planInfo }) {
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showAdd,    setShowAdd]    = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selected,   setSelected]   = useState(new Set());
  const [bulkBusy,   setBulkBusy]   = useState(false);

  const _effPlan = (planInfo?.isAdmin && !planInfo?.simulating) ? "pro_autopilot" : (planInfo?.simulating || planInfo?.plan);
  const isStarterPlan = _effPlan !== "pro" && _effPlan !== "pro_autopilot";

  useEffect(() => {
    api.tasks.list(businessId).then(d => { const t = d.tasks||[]; setTasks(t); onTasksChanged?.(t); }).catch(()=>{}).finally(()=>setLoading(false));
  }, [businessId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onAdd = task => {
    setTasks(p => { const n = [...p, task]; onTasksChanged?.(n); return n; });
  };
  const onUpdate = task => {
    setTasks(p => { const n = p.map(t => t.id===task.id ? task : t); onTasksChanged?.(n); return n; });
  };
  const onDelete = async id => {
    await api.tasks.delete(id).catch(()=>{});
    setTasks(p => { const n = p.filter(t => t.id !== id); onTasksChanged?.(n); return n; });
    setSelected(p => { const n=new Set(p); n.delete(id); return n; });
  };

  const toggleSelect = id => setSelected(p => {
    const n = new Set(p);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const toggleSelectAll = (ids) => {
    if (ids.every(id=>selected.has(id))) {
      setSelected(p => { const n=new Set(p); ids.forEach(id=>n.delete(id)); return n; });
    } else {
      setSelected(p => { const n=new Set(p); ids.forEach(id=>n.add(id)); return n; });
    }
  };

  const bulkAction = async (action) => {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      await api.tasks.bulkAction(businessId, action, ids);
      setTasks(p => {
        let n;
        if (action === "delete") n = p.filter(t => !ids.includes(t.id));
        else if (action === "complete") n = p.map(t => ids.includes(t.id) ? { ...t, status:"done" } : t);
        else if (action === "pending") n = p.map(t => ids.includes(t.id) ? { ...t, status:"pending" } : t);
        else n = p;
        onTasksChanged?.(n);
        return n;
      });
      setSelected(new Set());
    } catch (e) { alert(e.message); }
    setBulkBusy(false);
  };

  const regularTasks = tasks.filter(t => t.category !== "notes");
  const noteTasks    = tasks.filter(t => t.category === "notes");

  // Campaign tasks: only show pending/active ones — done/skipped/deleted ones disappear (managed in Marketing Agent)
  const campaignTasks    = regularTasks.filter(t => t.category === "campaign" && t.status !== "done" && t.status !== "completed" && t.status !== "skipped");
  const nonCampaignTasks = regularTasks.filter(t => t.category !== "campaign");

  // Build category list (excluding "campaign" — those are grouped separately)
  const nonCampaignCats = ["all", ...new Set(nonCampaignTasks.map(t => t.category).filter(Boolean))];
  const categories = noteTasks.length > 0 ? [...nonCampaignCats, "notes"] : nonCampaignCats;

  const isNoteTab     = filter === "notes";
  const isCampaignTab = filter === "campaign";
  const visibleNonCampaign = filter==="all" ? nonCampaignTasks
    : nonCampaignTasks.filter(t=>t.category===filter);

  // Group campaign tasks by campaign title
  const campaignGroups = campaignTasks.reduce((acc, t) => {
    const title = (t.steps||[])[0]?.label || "Campaign";
    if (!acc[title]) acc[title] = [];
    acc[title].push(t);
    return acc;
  }, {});

  const done  = regularTasks.filter(t => t.status === "done").length;
  const total = regularTasks.length;

  if (loading) return <div style={{ padding:"40px 0", textAlign:"center", color:C.muted }}>Loading tasks…</div>;

  // All visible task IDs for select-all
  const visibleIds = isCampaignTab
    ? campaignTasks.map(t=>t.id)
    : filter==="all"
      ? [...nonCampaignTasks.map(t=>t.id), ...campaignTasks.map(t=>t.id)]
      : visibleNonCampaign.map(t=>t.id);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
        <div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, letterSpacing:"-0.04em" }}>Tasks</div>
          <p style={{ color:C.muted, fontSize:13, marginTop:4, fontFamily:FB }}>{done} of {total} complete</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {!isNoteTab && (
            <button onClick={()=>{ setSelectMode(p=>!p); setSelected(new Set()); }}
              style={{ ...btnO(selectMode?C.text:C.muted,12), padding:"6px 12px" }}>
              {selectMode ? "Done selecting" : "Select"}
            </button>
          )}
          {!isNoteTab && <button onClick={()=>setShowAdd(true)} style={{ ...btn(C.dark,"#fff",13) }}>+ Add task</button>}
        </div>
      </div>

      {total > 0 && !isNoteTab && (
        <div style={{ marginBottom:10, height:4, borderRadius:2, background:C.border }}>
          <div style={{ height:"100%", width:`${total ? (done/total*100) : 0}%`, background:C.dark, borderRadius:2, transition:"width 0.3s" }} />
        </div>
      )}

      {/* Bulk action bar */}
      {selectMode && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"#F8FAFC", borderRadius:8, marginBottom:12, flexWrap:"wrap", border:`1px solid ${C.border}` }}>
          <input type="checkbox"
            checked={visibleIds.length>0 && visibleIds.every(id=>selected.has(id))}
            onChange={()=>toggleSelectAll(visibleIds)}
            style={{ width:16, height:16, cursor:"pointer", accentColor:C.dark }} />
          <span style={{ fontSize:12, color:C.muted, fontFamily:FB }}>
            {selected.size > 0 ? `${selected.size} selected` : "Select all"}
          </span>
          {selected.size > 0 && (
            <>
              <button onClick={()=>bulkAction("complete")} disabled={bulkBusy}
                style={{ ...btn(C.ok,"#fff",12), padding:"6px 14px" }}>
                Mark complete ({selected.size})
              </button>
              <button onClick={()=>bulkAction("pending")} disabled={bulkBusy}
                style={{ ...btnO(C.muted,12), padding:"6px 12px" }}>
                Reopen ({selected.size})
              </button>
              <button onClick={()=>{ if(window.confirm(`Delete ${selected.size} task${selected.size>1?"s":""}?`)) bulkAction("delete"); }}
                disabled={bulkBusy}
                style={{ ...btn(C.err,"#fff",12), padding:"6px 14px" }}>
                Delete ({selected.size})
              </button>
            </>
          )}
        </div>
      )}

      {/* Category filter tabs */}
      {(categories.length > 2 || campaignTasks.length > 0) && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
          {categories.map(c => (
            <button key={c} onClick={()=>setFilter(c)}
              style={{ ...btn(filter===c?(c==="notes"?"#D97706":C.dark):"#F4F4F5", filter===c?"#fff":C.muted, 11), padding:"5px 12px", textTransform:"capitalize" }}>
              {c==="notes"?<><NotebookPen size={14} style={{display:"inline-block",verticalAlign:"middle",marginRight:4}} aria-hidden="true" />Notes</>:c}
              {c==="notes"&&noteTasks.length>0&&<span style={{ marginLeft:4, background:"rgba(255,255,255,0.3)", borderRadius:10, padding:"0 5px", fontSize:9 }}>{noteTasks.length}</span>}
            </button>
          ))}
          {campaignTasks.length > 0 && (
            <button onClick={()=>setFilter("campaign")}
              style={{ ...btn(filter==="campaign"?C.dark:"#F4F4F5", filter==="campaign"?"#fff":C.muted, 11), padding:"5px 12px" }}>
              Campaigns
              <span style={{ marginLeft:4, background:"rgba(255,255,255,0.3)", borderRadius:10, padding:"0 5px", fontSize:9 }}>{campaignTasks.length}</span>
            </button>
          )}
        </div>
      )}

      {isNoteTab ? (
        <NotesGrid notes={noteTasks} onDelete={onDelete} />
      ) : isCampaignTab ? (
        // Campaign tab: show grouped campaign tasks
        campaignTasks.length === 0 ? (
          <div style={{ ...card("28px"), textAlign:"center", color:C.muted }}>
            <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:6 }}>No campaign tasks yet</div>
            <p style={{ fontSize:13, lineHeight:1.65 }}>Campaign tasks are created when you start a campaign in the Marketing Agent.</p>
          </div>
        ) : (
          Object.entries(campaignGroups).map(([title, groupTasks]) => (
            <CampaignGroup key={title} title={title} tasks={groupTasks}
              businessId={businessId} businessName={businessName} outputs={businessOutputs}
              onUpdate={onUpdate} onDelete={onDelete}
              selectable={selectMode} selected={selected} onToggleSelect={toggleSelect}
              hubNotes={hubNotes} stickyAssignments={stickyAssignments} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote}
              isStarterPlan={isStarterPlan} />
          ))
        )
      ) : (
        <>
          {/* Campaign groups shown inline in "all" view */}
          {filter === "all" && campaignTasks.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", padding:"4px 0 8px", fontFamily:FB }}>
                Campaigns ({campaignTasks.length} tasks)
              </div>
              {Object.entries(campaignGroups).map(([title, groupTasks]) => (
                <CampaignGroup key={title} title={title} tasks={groupTasks}
                  businessId={businessId} businessName={businessName} outputs={businessOutputs}
                  onUpdate={onUpdate} onDelete={onDelete}
                  selectable={selectMode} selected={selected} onToggleSelect={toggleSelect}
                  hubNotes={hubNotes} stickyAssignments={stickyAssignments} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote}
                  isStarterPlan={isStarterPlan} />
              ))}
            </div>
          )}

          {/* Regular (non-campaign) tasks */}
          {visibleNonCampaign.length === 0 && campaignTasks.length === 0 && (
            <div style={{ ...card("28px"), textAlign:"center", color:C.muted }}>
              <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:16 }}>No tasks yet</div>
              <button onClick={()=>setShowAdd(true)} style={{ ...btn(C.dark,"#fff",13) }}>Add your first task</button>
            </div>
          )}

          {visibleNonCampaign.filter(t=>t.status!=="done").map(t=>{
            const assignment = stickyAssignments?.[t.id];
            const stickyNote = assignment ? hubNotes?.find(n=>n.id===assignment.noteId) : null;
            return (
              <TaskRowWrapper key={t.id} task={t} businessId={businessId} businessName={businessName} outputs={businessOutputs}
                onUpdate={onUpdate} onDelete={onDelete}
                selectable={selectMode} selected={selected.has(t.id)} onToggleSelect={toggleSelect}
                stickyNote={stickyNote} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote}
                isStarterPlan={isStarterPlan} />
            );
          })}

          {visibleNonCampaign.some(t=>t.status==="done") && (
            <>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", padding:"12px 0 8px", fontFamily:FB }}>Completed</div>
              {visibleNonCampaign.filter(t=>t.status==="done").map(t=>{
                const assignment = stickyAssignments?.[t.id];
                const stickyNote = assignment ? hubNotes?.find(n=>n.id===assignment.noteId) : null;
                return (
                  <TaskRowWrapper key={t.id} task={t} businessId={businessId} businessName={businessName} outputs={businessOutputs}
                    onUpdate={onUpdate} onDelete={onDelete}
                    selectable={selectMode} selected={selected.has(t.id)} onToggleSelect={toggleSelect}
                    stickyNote={stickyNote} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote}
                    isStarterPlan={isStarterPlan} />
                );
              })}
            </>
          )}
        </>
      )}

      {showAdd && <AddTaskModal businessId={businessId} onAdd={onAdd} onClose={()=>setShowAdd(false)} isStarterPlan={isStarterPlan} />}
    </div>
  );
}

// ── HUB / INTEGRATIONS ────────────────────────────────────────────────────────

// ── Inline plans upgrade modal ────────────────────────────────────────────────
const PLAN_TIERS = [
  {
    id:"starter", name:"Starter", price:39, color:"#6366F1",
    tagline:"Insights, reports, and manual tracking.",
    features:["Unlimited marketing insights","Revenue & lead tracking","Business planning tools","Email support"],
  },
  {
    id:"pro", name:"Pro", price:89, color:"#7C3AED", popular:true,
    tagline:"Agents act on your request.",
    features:["Everything in Starter","Management agent implements changes","Live website updates on demand","Marketing + Management agents work together","Priority support"],
  },
  {
    id:"pro_autopilot", name:"Pro Autopilot", price:199, color:"#DB2777",
    tagline:"Fully autonomous — just watch it run.",
    features:["Everything in Pro","Agents run on their own schedule","Zero manual input required","White-glove onboarding","Dedicated support"],
  },
];

function PlansModal({ onClose, highlightPlan }) {
  const navigate = useNavigate();
  return (
    <div style={{ position:"fixed", inset:0, zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.65)", padding:16 }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#0F0E17", borderRadius:20, maxWidth:960, width:"100%", maxHeight:"90vh", overflowY:"auto", padding:"36px 28px", boxShadow:"0 24px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#F59E0B", textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:FB, marginBottom:8 }}>PLANS</div>
            <div style={{ fontFamily:FH, fontWeight:700, fontSize:"clamp(22px,3vw,32px)", color:"#fff", letterSpacing:"-0.04em" }}>Start free. Upgrade when you're ready.</div>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.45)", fontFamily:FB, marginTop:6 }}>7-day free trial on all plans. No credit card required to start.</p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"rgba(255,255,255,0.5)", fontSize:20, cursor:"pointer", borderRadius:8, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginLeft:16 }}>×</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16 }}>
          {PLAN_TIERS.map(t=>(
            <div key={t.id} style={{ background:"rgba(255,255,255,0.04)", border:`1.5px solid ${(highlightPlan===t.id||t.popular)?t.color+"60":"rgba(255,255,255,0.1)"}`, borderRadius:16, padding:"24px 20px", position:"relative" }}>
              {t.popular && (
                <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:t.color, color:"#fff", fontSize:9, fontWeight:700, padding:"3px 12px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>Most popular</div>
              )}
              <div style={{ fontSize:10, fontWeight:700, color:t.color, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:FB, marginBottom:8 }}>{t.name}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:6 }}>
                <span style={{ fontFamily:FH, fontWeight:700, fontSize:32, color:"#fff", letterSpacing:"-0.04em" }}>${t.price}</span>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontFamily:FB }}>/month</span>
              </div>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.6, marginBottom:20, fontFamily:FB }}>{t.tagline}</p>
              <ul style={{ margin:"0 0 24px", padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:8 }}>
                {t.features.map(f=>(
                  <li key={f} style={{ display:"flex", gap:8, fontSize:12, color:"rgba(255,255,255,0.55)", lineHeight:1.5, fontFamily:FB }}>
                    <Check size={12} color={t.color} strokeWidth={2.5} style={{ flexShrink:0 }} aria-hidden="true" />{f}
                  </li>
                ))}
              </ul>
              <button onClick={()=>{ onClose(); navigate("/pricing"); }} style={{ ...btn(t.popular?t.color:"transparent","#fff",12), width:"100%", padding:"10px", border:t.popular?"none":`1px solid rgba(255,255,255,0.15)`, borderRadius:10 }}>
                Get started
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProGate({ isPro, children, label="Pro" }) {
  const [showPlans, setShowPlans] = useState(false);
  if (isPro) return <>{children}</>;
  return (
    <div style={{ position:"relative" }}>
      <div style={{ filter:"blur(2px)", pointerEvents:"none", userSelect:"none", opacity:0.45 }}>{children}</div>
      <div onClick={()=>setShowPlans(true)}
        style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", background:"rgba(255,255,255,0.6)", borderRadius:12 }}>
        <span style={{ background:C.dark, color:"#fff", fontSize:9, fontWeight:700, padding:"3px 12px", borderRadius:20, letterSpacing:"0.08em", fontFamily:FB, textTransform:"uppercase" }}>Pro</span>
        <span style={{ fontSize:12, color:C.text, fontFamily:FB, fontWeight:700 }}>{label}</span>
      </div>
      {showPlans && <PlansModal highlightPlan="pro" onClose={()=>setShowPlans(false)} />}
    </div>
  );
}

// ── Auto-task notification toasts ─────────────────────────────────────────────
function AutoNotifications({ notifications, onDismiss }) {
  if (!notifications.length) return null;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:600, display:"flex", flexDirection:"column", gap:8, maxWidth:360, pointerEvents:"none" }}>
      {notifications.map(n=>(
        <div key={n.id} style={{
          background:"#FFFFFF",
          border:`1px solid ${n.status==="done"?"#D1FAE5":n.status==="in-progress"?"#E2E8F0":"#E2E8F0"}`,
          borderRadius:12, padding:"10px 14px", boxShadow:"0 4px 24px rgba(0,0,0,0.08)",
          display:"flex", alignItems:"center", gap:10, fontFamily:FB, pointerEvents:"all"
        }}>
          {n.status==="in-progress"&&<span style={{ width:13,height:13,borderRadius:"50%",border:"2px solid #D97706",borderTopColor:"transparent",animation:"spin 0.8s linear infinite",display:"inline-block",flexShrink:0 }}/>}
          {n.status==="done"&&<Check size={14} color="#16A34A" strokeWidth={2.5} style={{ flexShrink:0 }} aria-hidden="true" />}
          {n.status==="active"&&<span style={{ width:7,height:7,borderRadius:"50%",background:"#3B82F6",flexShrink:0,display:"inline-block" }}/>}
          <span style={{ fontSize:12,color:"#374151",flex:1,lineHeight:1.4 }}>{n.message}</span>
          {n.status==="done"&&n.onUndo&&(
            <button onClick={n.onUndo} style={{ background:"none",border:"1px solid #BBF7D0",borderRadius:6,padding:"2px 8px",fontSize:11,color:"#16A34A",cursor:"pointer",fontFamily:FB,flexShrink:0 }}>Undo</button>
          )}
          <button onClick={()=>onDismiss(n.id)} style={{ background:"none",border:"none",color:"#9CA3AF",cursor:"pointer",fontSize:15,padding:"0 2px",flexShrink:0 }}>×</button>
        </div>
      ))}
    </div>
  );
}

// ── Insight card constants & helpers ──────────────────────────────────────────
const INSIGHT_CATS = {
  profile:      { label:"Profile Update", color:"#64748B", bg:"#F8FAFC" },
  marketing:    { label:"Marketing",      color:"#64748B", bg:"#F8FAFC" },
  tasks:        { label:"Tasks",          color:"#64748B", bg:"#F8FAFC" },
  outreach:     { label:"Outreach",       color:"#64748B", bg:"#F8FAFC" },
  scaling:      { label:"Scaling",        color:"#059669", bg:"#F0FDF4" },
  conservation: { label:"Conservation",   color:"#DC2626", bg:"#FEF2F2" },
  building:     { label:"Building",       color:"#64748B", bg:"#F8FAFC" },
  outcomes:     { label:"Outcomes",       color:"#059669", bg:"#F0FDF4" },
  budget:       { label:"Budget",         color:"#64748B", bg:"#F8FAFC" },
  schedule:     { label:"Schedule",       color:"#64748B", bg:"#F8FAFC" },
};

function buildInsightCards(strategy, timeframe) {
  const ts = Date.now();
  const ref = `strat_${ts}`;
  const mk = (id, title, description, category, autoComplete, priority) => ({
    id:`ic_${ref}_${id}`, title, description, category, autoComplete, priority,
    status:"pending", strategyRef:ref, createdAt:new Date().toISOString(),
  });
  const cards = [];

  if(strategy.budget?.rationale)
    cards.push(mk("budget", `Budget: $${strategy.budget.monthly||0}/mo for ${timeframe}`, strategy.budget.rationale, "budget", false, "high"));

  const outSugg = strategy.outreach?.suggestions||[];
  outSugg.slice(0,3).forEach((s,i)=>cards.push(mk(`out${i}`,s,"",  "outreach", false, i===0?"high":"medium")));
  if(outSugg.length>0)
    cards.push(mk("mkt","Send outreach insights to Marketing Agent",`${outSugg.length} outreach suggestions queued for marketing strategy`,"marketing",true,"high"));

  (strategy.scaling?.suggestions||[]).slice(0,3).forEach((s,i)=>cards.push(mk(`sc${i}`,s,"","scaling",false,"medium")));
  (strategy.conservation?.actions||[]).slice(0,3).forEach((s,i)=>cards.push(mk(`con${i}`,s,"","conservation",false,i===0?"high":"medium")));
  (strategy.building?.suggestions||[]).slice(0,2).forEach((s,i)=>cards.push(mk(`bld${i}`,s,"","building",false,"low")));
  (strategy.taskSchedule||[]).flatMap(p=>p.tasks||[]).slice(0,2).forEach((t,i)=>cards.push(mk(`sched${i}`,t,`Schedule task`,"schedule",true,"medium")));
  (strategy.predictedOutcomes||[]).slice(0,3).forEach((o,i)=>cards.push(mk(`out_${i}`,o,"Set as a trackable goal","outcomes",true,"medium")));

  return cards;
}

// ── InsightCardsSection ───────────────────────────────────────────────────────
function InsightCardsSection({ cards, onUpdate, onArchive, onPromoteToTask, isAutopilot, onAutoComplete, onRunAll, insightsBudget }) {
  const [showDone, setShowDone] = useState(false);
  const pending = cards.filter(c=>c.status==="pending");
  const done    = cards.filter(c=>c.status==="done");
  if(cards.length===0) return null;

  const PRIORITY = {high:0,medium:1,low:2};
  const sorted = [...pending].sort((a,b)=>(PRIORITY[a.priority]??1)-(PRIORITY[b.priority]??1));
  const autoPending = sorted.filter(c=>c.autoComplete);

  const rawLimit = insightsBudget?.limit || 110000;
  const rawUsed  = insightsBudget?.used  || 0;
  const budgetPct = rawLimit > 0 ? Math.round(rawUsed/rawLimit*100) : 0;
  const budgetNearLimit = budgetPct >= 90;

  return (
    <div style={{ marginTop:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:14 }}>Insights</div>
          {pending.length>0&&<span style={{ background:C.dark,color:"#fff",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,fontFamily:FB }}>{pending.length}</span>}
          {isAutopilot&&autoPending.length>0&&(
            <span style={{ fontSize:9,color:C.muted,fontFamily:FB }}>
              {autoPending.length} auto · sorted by priority
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {done.length>0&&<button onClick={()=>setShowDone(p=>!p)} style={{ ...btnO(C.muted,10), padding:"3px 10px" }}>{showDone?"Hide done":"Show done ("+done.length+")"}</button>}
          {isAutopilot&&autoPending.length>0&&(
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
              <button
                onClick={()=>onRunAll ? onRunAll(autoPending) : autoPending.forEach(c=>onAutoComplete(c))}
                disabled={budgetNearLimit}
                title={budgetNearLimit?"Daily budget near limit — auto tasks paused":"Run all auto tasks in priority order"}
                style={{ ...btn(budgetNearLimit?"#9CA3AF":C.dark,"#fff",11), padding:"5px 12px" }}>
                {budgetNearLimit?"Budget limit":"Run all auto ("+autoPending.length+")"}
              </button>
              {budgetNearLimit&&<span style={{ fontSize:9,color:"#EF4444",fontFamily:FB }}>Daily budget at {budgetPct}%</span>}
            </div>
          )}
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {sorted.map(c=>{
          const cat=INSIGHT_CATS[c.category]||INSIGHT_CATS.building;
          return (
            <div key={c.id} style={{ background:cat.bg+"88", borderRadius:10, border:`1px solid ${cat.color}28`, padding:"10px 14px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:4 }}>
                    <span style={{ fontSize:9,fontWeight:700,color:cat.color,background:cat.bg,padding:"1px 8px",borderRadius:20,fontFamily:FB,border:`1px solid ${cat.color}28` }}>{cat.label}</span>
                    {c.autoComplete&&<span style={{ fontSize:9,fontWeight:700,color:C.muted,background:"#F1F5F9",padding:"1px 8px",borderRadius:20,fontFamily:FB,border:`1px solid ${C.border}` }}>Auto</span>}
                    {c.priority==="high"&&<span style={{ fontSize:9,fontWeight:700,color:"#DC2626",background:"#FEF2F2",padding:"1px 8px",borderRadius:20,fontFamily:FB }}>High priority</span>}
                  </div>
                  <div style={{ fontSize:13,fontFamily:FB,fontWeight:600,color:C.text,marginBottom:c.description?3:0 }}>{c.title}</div>
                  {c.description&&<div style={{ fontSize:12,color:C.muted,fontFamily:FB,lineHeight:1.5 }}>{c.description}</div>}
                </div>
                <div style={{ display:"flex", gap:4, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end", marginTop:2 }}>
                  {c.autoComplete&&isAutopilot
                    ? <button onClick={()=>onAutoComplete(c)} style={{ ...btn(C.dark,"#fff",10), padding:"4px 10px" }}>Auto</button>
                    : <button onClick={()=>onUpdate(c.id,{status:"done"})} style={{ ...btnO(C.muted,10), padding:"4px 10px" }}>Done</button>
                  }
                  <button onClick={()=>onPromoteToTask(c)} style={{ ...btnO("#475569",10), padding:"4px 10px" }}>+ Task</button>
                  <button onClick={()=>onArchive(c.id)} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,padding:"2px 4px" }}>×</button>
                </div>
              </div>
            </div>
          );
        })}
        {showDone&&done.map(c=>{
          const cat=INSIGHT_CATS[c.category]||INSIGHT_CATS.building;
          return (
            <div key={c.id} style={{ background:C.surface, borderRadius:10, border:`1px solid ${C.border}`, padding:"8px 14px", opacity:0.55, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:9,fontWeight:700,color:cat.color,background:cat.bg,padding:"1px 8px",borderRadius:20,fontFamily:FB }}>{cat.label}</span>
              <span style={{ fontSize:12,fontFamily:FB,color:C.muted,flex:1 }}>{c.title}</span>
              <span style={{ fontSize:11,color:"#16A34A",fontFamily:FB,display:"flex",alignItems:"center",gap:3 }}>Done <Check size={11} strokeWidth={2.5} aria-hidden="true" /></span>
              <button onClick={()=>onUpdate(c.id,{status:"pending"})} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:11,fontFamily:FB }}>Reopen</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AutopilotToggle({ on, onToggle, label, disabled }) {
  const [showPlans, setShowPlans] = useState(false);
  return (
    <>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:10, background:on?"#F0FDF4":"#F9F9F9", border:`1px solid ${on?C.ok+"40":C.border}`, cursor:"pointer" }}
        onClick={disabled ? ()=>setShowPlans(true) : onToggle}>
        <div style={{ width:32, height:18, borderRadius:9, background:disabled?"#E5E7EB":on?C.ok:"#D1D5DB", position:"relative", flexShrink:0, transition:"background 0.2s" }}>
          <div style={{ position:"absolute", top:2, left:on&&!disabled?14:2, width:14, height:14, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:600, fontFamily:FB, color:disabled?C.muted:on?C.ok:C.muted }}>Autopilot {disabled?"— Pro Autopilot":on?"ON":"OFF"}</div>
          {label && <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginTop:1 }}>{label}</div>}
        </div>
        {disabled && <span style={{ fontSize:10, color:C.muted, background:"#F4F4F5", border:`1px solid ${C.border}`, padding:"2px 8px", borderRadius:20, fontFamily:FB, fontWeight:600, marginLeft:"auto", cursor:"pointer" }}>Upgrade</span>}
      </div>
      {showPlans && <PlansModal highlightPlan="pro_autopilot" onClose={()=>setShowPlans(false)} />}
    </>
  );
}

function SetupGuide({ steps }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom:14, borderRadius:10, border:`1px solid ${C.border}`, overflow:"hidden" }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#F8FAFC", cursor:"pointer" }}>
        <span style={{ fontSize:12, fontWeight:700, color:C.muted, fontFamily:FB }}>Step-by-step setup guide</span>
        <span style={{ fontSize:13, color:C.muted, transform:open?"rotate(180deg)":"none", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
      </div>
      {open && (
        <div style={{ background:"#FDFCFF", padding:"12px 14px" }}>
          {steps.map((s,i)=>(
            <div key={i} style={{ display:"flex", gap:10, padding:"7px 0", borderBottom:i<steps.length-1?`1px solid ${C.border}`:"none" }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:C.dark, color:"#fff", fontSize:10, fontWeight:700, fontFamily:FB, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>{i+1}</div>
              <div style={{ fontSize:12.5, color:C.text, lineHeight:1.65, fontFamily:FB }}>
                {s.text}
                {s.link && <>{" "}<a href={s.link} target="_blank" rel="noopener noreferrer" style={{ color:C.text, fontWeight:600, textDecoration:"underline" }}>Open ↗</a></>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IntegrationCard({ provider, label, desc, fields, savedMeta, onSave, isConn, autopilotLabel, autopilotDisabled, setupGuide, onTestConnection }) {
  const [open,       setOpen]       = useState(false);
  const [vals,       setVals]       = useState(savedMeta||{});
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [testMsg,    setTestMsg]    = useState("");
  const fileRef = useRef();

  const autopilotOn = !!(vals.autopilot || savedMeta?.autopilot);

  const save = async (overrideVals) => {
    const v = overrideVals || vals;
    setSaving(true);
    try { await onSave(v); setSaved(true); setTimeout(()=>setSaved(false),2500); }
    catch(e) { console.error(e); }
    setSaving(false);
  };

  const toggleAutopilot = async () => {
    if (autopilotDisabled) return;
    const next = { ...vals, autopilot: !autopilotOn };
    setVals(next);
    await onSave(next);
  };

  const handleFile = (fieldKey, file) => {
    const reader = new FileReader();
    reader.onload = e => setVals(p=>({...p,[fieldKey]:e.target.result}));
    reader.readAsDataURL(file);
  };

  const hasSavedData = Object.entries(savedMeta||{}).some(([k,v])=>k!=="autopilot"&&!!v);

  return (
    <div style={{ borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 0" }}>
        <div style={{ display:"flex", gap:10, alignItems:"center", flex:1, cursor:"pointer", minWidth:0 }} onClick={()=>setOpen(p=>!p)}>
          {(isConn||autopilotOn) && <div style={{ width:7, height:7, borderRadius:"50%", background:autopilotOn?C.ok:"#94A3B8", flexShrink:0 }} />}
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:600, fontFamily:FB }}>{label}</div>
            <div style={{ fontSize:12, color:hasSavedData?C.text:C.muted, fontFamily:FB }}>{hasSavedData?"Details saved — tap to edit":desc}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0, marginLeft:12 }}>
          {!autopilotDisabled && (
            <div onClick={toggleAutopilot}
              style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:autopilotOn?"#DCFCE7":C.bg, border:`1px solid ${autopilotOn?C.ok+"50":C.border}` }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:autopilotOn?C.ok:"#D1D5DB" }} />
              <span style={{ fontSize:10, fontWeight:700, color:autopilotOn?C.ok:C.muted, fontFamily:FB, whiteSpace:"nowrap" }}>
                {autopilotOn ? "Auto ON" : "Auto OFF"}
              </span>
            </div>
          )}
          <span style={{ color:C.muted, fontSize:14, transform:open?"rotate(180deg)":"none", transition:"transform 0.15s", display:"inline-block", cursor:"pointer" }} onClick={()=>setOpen(p=>!p)}>▾</span>
        </div>
      </div>

      {open && (
        <div style={{ paddingBottom:18, display:"flex", flexDirection:"column", gap:12 }}>
          <AutopilotToggle on={autopilotOn} onToggle={toggleAutopilot} label={autopilotLabel} disabled={autopilotDisabled} />


          {setupGuide && <SetupGuide steps={setupGuide} />}
          {fields.map(f => (
            <div key={f.key}>
              <label style={lbl}>{f.label}</label>
              {f.type === "file" ? (
                <div>
                  <input ref={fileRef} type="file" style={{ display:"none" }} onChange={e=>e.target.files[0]&&handleFile(f.key,e.target.files[0])} />
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <button onClick={()=>fileRef.current?.click()} style={{ ...btnO("#475569",12), padding:"8px 14px" }}>Upload {f.label.toLowerCase()}</button>
                    {vals[f.key] && <span style={{ fontSize:11, color:C.ok, fontFamily:FB }}>Uploaded</span>}
                  </div>
                </div>
              ) : f.type === "select" ? (
                <select style={{ ...inp(), appearance:"none" }} value={vals[f.key]||""} onChange={e=>setVals(p=>({...p,[f.key]:e.target.value}))}>
                  <option value="">Select…</option>
                  {f.options.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  style={inp({ fontFamily:f.mono?"monospace":FB, fontSize:f.mono?12:14 })}
                  value={vals[f.key]||""}
                  onChange={e=>setVals(p=>({...p,[f.key]:e.target.value}))}
                  placeholder={f.placeholder||""}
                  type={f.inputType||"text"}
                />
              )}
              {f.hint && <div style={{ fontSize:11, color:C.muted, marginTop:5, fontFamily:FB, lineHeight:1.55 }}>{f.hint}</div>}
            </div>
          ))}
          {onTestConnection && (
            <div>
              <button onClick={async()=>{
                setTesting(true); setTestMsg("");
                try {
                  const msg = await onTestConnection(vals);
                  setTestMsg("ok:" + msg);
                } catch(e) {
                  setTestMsg("err:" + e.message);
                }
                setTesting(false);
              }} disabled={testing} style={{ ...btnO("#475569",12), padding:"8px 18px" }}>
                {testing ? "Testing…" : "Test connection"}
              </button>
              {testMsg && <div style={{ fontSize:11, fontFamily:FB, marginTop:6, color: testMsg.startsWith("ok:") ? C.ok : C.err, display:"flex", alignItems:"center", gap:4 }}>
                {testMsg.startsWith("ok:") ? <Check size={11} strokeWidth={2.5} aria-hidden="true" /> : <CircleX size={11} aria-hidden="true" />}
                {testMsg.slice(3)}
              </div>}
            </div>
          )}
          <button onClick={()=>save()} disabled={saving} style={{ ...btn(saved?C.ok:C.dark,"#fff",12), alignSelf:"flex-start", padding:"8px 18px" }}>
            {saved ? "Saved!" : saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

const ARCHIVE_EXCLUDED = ["usage", "user_metrics"];
const ARCHIVE_FOLDERS = {
  "Business Info":  { types: ["website", "business_plan", "pitch_deck", "brand_identity", "management_strategy"], taskMatch: /website|business plan|pitch/i },
  "Social Media":   { types: ["social_content", "content_calendar", "social_post"], taskMatch: /social|instagram|tiktok|twitter|post|caption/i },
  "Marketing":      { types: ["marketing_insights", "marketing_notes"], taskMatch: /marketing|campaign|insight|strategy/i },
  "Email":          { types: ["email_templates"], taskMatch: /email/i },
};

function _archiveFolder(f) {
  for (const [folder, cfg] of Object.entries(ARCHIVE_FOLDERS)) {
    if (cfg.types.includes(f.outputType)) return folder;
    if (f.source === "task" && cfg.taskMatch.test(f.name)) return folder;
  }
  return "Other";
}

function FilesArchive({ businessId, outputs, tasks }) {
  const [open, setOpen] = useState(false);
  const [openFolders, setOpenFolders] = useState({});

  const allFiles = [
    ...outputs
      .filter(o => o.content && !ARCHIVE_EXCLUDED.includes(o.type))
      .map(o => ({ name: o.title || o.type.replace(/_/g, " "), outputType: o.type, content: o.content, source: "generated" })),
    ...tasks
      .filter(t => t.status === "done" && extractOutput(t.outputData))
      .map(t => {
        const ex = extractOutput(t.outputData);
        return {
          name: t.name,
          outputType: ex.type,
          content: ex.content || ex.fields?.map(f => `${f.label}: ${f.value}`).join("\n") || "",
          filename: t.outputData?.filename,
          source: "task",
        };
      }),
  ];

  const folderMap = {};
  for (const f of allFiles) {
    const folder = _archiveFolder(f);
    if (!folderMap[folder]) folderMap[folder] = [];
    folderMap[folder].push(f);
  }
  const folderOrder = [...Object.keys(ARCHIVE_FOLDERS), "Other"].filter(k => folderMap[k]?.length);
  const totalFiles = allFiles.length;

  const toggleFolder = name => setOpenFolders(p => ({ ...p, [name]: !p[name] }));

  if (!totalFiles) return (
    <div style={{ ...card("16px 18px"), marginTop:20, textAlign:"center" }}>
      <div style={{ fontSize:12, color:C.muted, fontFamily:FB }}>Generated files and completed task output will appear here.</div>
    </div>
  );

  const download = f => {
    const isHtml = f.outputType === "website" || f.outputType === "html" || f.outputType === "business_plan" || f.outputType === "pitch_deck" || (f.content && f.content.trim().startsWith("<"));
    const ext  = isHtml ? ".html" : f.outputType === "json" ? ".json" : ".txt";
    const mime = isHtml ? "text/html" : f.outputType === "json" ? "application/json" : "text/plain";
    const blob = new Blob([f.content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = f.filename || (f.name.toLowerCase().replace(/\s+/g, "-") + ext); a.click();
    URL.revokeObjectURL(url);
  };

  const folderIcons = { "Business Info": Building2, "Social Media": Share2, "Marketing": ChartNoAxesCombined, "Email": Mail, "Other": Folder };

  return (
    <div style={{ ...card("0"), overflow:"hidden", marginTop:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", cursor:"pointer" }} onClick={() => setOpen(p => !p)}>
        <div style={{ fontFamily:FH, fontWeight:600, fontSize:14 }}>
          Files Archive
          <span style={{ background:"#F1F5F9", color:C.muted, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, marginLeft:6 }}>{totalFiles}</span>
        </div>
        <span style={{ color:C.muted, fontSize:14, transform:open?"rotate(180deg)":"none", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
      </div>
      {open && (
        <div style={{ borderTop:`1px solid ${C.border}` }}>
          {folderOrder.map((folderName, fi) => {
            const files = folderMap[folderName];
            const isFolderOpen = openFolders[folderName];
            const FolderIcon = folderIcons[folderName];
            return (
              <div key={folderName} style={{ borderBottom: fi < folderOrder.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 18px", cursor:"pointer", background:C.surface }}
                  onClick={() => toggleFolder(folderName)}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {FolderIcon && <FolderIcon size={18} style={{ flexShrink:0, color:C.muted }} aria-hidden="true" />}
                    <span style={{ fontSize:13, fontWeight:600, fontFamily:FH }}>{folderName}</span>
                    <span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>{files.length} file{files.length !== 1 ? "s" : ""}</span>
                  </div>
                  <span style={{ color:C.muted, fontSize:12, transform:isFolderOpen?"rotate(180deg)":"none", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
                </div>
                {isFolderOpen && (
                  <div style={{ borderTop:`1px solid ${C.border}` }}>
                    {files.map((f, i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 18px 10px 42px", borderBottom: i < files.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:500, fontFamily:FB }}>{f.name}</div>
                          <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{f.source === "generated" ? "Auto-generated" : "Task output"} · {f.outputType}</div>
                        </div>
                        <button onClick={() => download(f)} style={{ ...btnO("#475569", 11), padding:"5px 12px" }}>Download</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HubPanel({ businessId, integs, onSaveFields, tasks, outputs, isMinor, isAutopilotPlan, notesByTarget, onDropNote, onUnstickNote }) {
  const navigate = useNavigate();
  const getMeta = provider => {
    const intg = integs.find(i=>i.provider===provider);
    try { return intg?.metadata ? JSON.parse(intg.metadata) : {}; } catch { return {}; }
  };
  const isConn = provider => integs.find(i=>i.provider===provider)?.status==="connected";

  const G_INSTAGRAM = [
    { text:'Make sure your Instagram is set to a Professional account. Open Instagram → tap your profile photo → Edit profile → "Switch to professional account" (if not already done).', link:"https://www.instagram.com/accounts/convert_to_professional_account/" },
    { text:'Connect your Instagram to a Facebook Page (required by Meta). In Instagram: Settings → Accounts Center → tap "Add accounts" → add your Facebook account and link a Page.' },
    { text:'Create a free Meta Developer account using your Facebook login.', link:"https://developers.facebook.com/" },
    { text:'In the developer portal, click "My Apps" → "Create App" → select "Business" → give it any name (e.g., "My Business App") → click Create.' },
    { text:'Inside your new app, click "+ Add Products" → find "Instagram Graph API" → click Set up.' },
    { text:'Open the Graph API Explorer tool.', link:"https://developers.facebook.com/tools/explorer/" },
    { text:'Select your app from the top-right "Meta App" dropdown → click "Generate Access Token" → log in with Facebook and grant all permissions shown (instagram_basic, instagram_manage_insights, instagram_content_publish).' },
    { text:'Copy the long token string that appears and paste it into the Access Token field above.' },
    { text:'To get your Business Account ID: in the Explorer query box, type me/accounts?fields=instagram_business_account → click Submit → find the "instagram_business_account" object → copy the "id" number and paste it above.' },
    { text:'Note: access tokens expire in about 60 days. Return here and repeat steps 6–8 to refresh when needed.' },
  ];
  const G_EMAIL = [
    { text:'Enter your business email address in the field above. This is what the agent will send FROM.' },
    { text:'Select your email provider from the dropdown.' },
    { text:'For Resend (recommended for automated sending): create a free account at resend.com, verify your domain, then go to API Keys → Create API Key and paste it below.', link:"https://resend.com" },
    { text:'For Mailchimp: log in → click your profile icon (bottom-left) → Account & Billing → Extras → API Keys → Create A Key.', link:"https://mailchimp.com" },
    { text:'For Klaviyo: Account → Settings → API Keys → Create Private API Key.', link:"https://www.klaviyo.com/account#api-keys-tab" },
    { text:'For ConvertKit: Settings → Advanced → API → copy your API Key. The agent will create broadcast drafts to your subscriber list.', link:"https://app.convertkit.com/account_settings/advanced_settings" },
    { text:'For SendGrid: Settings → API Keys → Create API Key → Full Access → copy the key.', link:"https://app.sendgrid.com/settings/api_keys" },
    { text:'If using Gmail or Outlook without an API key: the agent generates email content for you to copy and send manually.' },
  ];
  const G_WEBSITE = [
    { text:'Enter your website URL exactly as shown in your browser (e.g., https://yourbusiness.com).' },
    { text:'For WordPress sites: the agent can update pages and create posts automatically. Enter your site URL, WordPress username, and an Application Password (see steps below).' },
    { text:'To create a WordPress Application Password: log in to your WP Admin → Users → click your username → scroll to "Application Passwords" → enter a name (e.g., "EarnedLab") → click "Add New Application Password" → copy the generated password and paste it below.', link:"https://wordpress.org/documentation/article/application-passwords/" },
    { text:'For Squarespace, Wix, Webflow, or other platforms: enter your URL and host name. The agent generates content for you to copy and paste — it cannot edit these platforms automatically.' },
    { text:'Optional: get your Google Analytics Measurement ID. Go to analytics.google.com → Admin → Data Streams → click your stream → copy the Measurement ID (starts with G-).', link:"https://analytics.google.com/" },
  ];
  const G_TIKTOK = [
    { text:'Go to developers.tiktok.com and sign in. Click "Manage apps" → "Create app".', link:"https://developers.tiktok.com/apps/" },
    { text:'In your app settings find "App details". Copy the Client Key and Client Secret and paste them above.' },
    { text:'For a sandbox access token: in your app, go to "Sandbox" → "Generate token". Copy the Access Token and Open ID shown.' },
    { text:'For production posting, your app must pass TikTok content API review. Sandbox lets you test with your own account immediately.' },
    { text:'The agent generates slide content + captions. For best results, download the slideshow from Content Lab and post via TikTok app alongside any API post.' },
    { text:'To access TikTok Creator Studio for scheduling: go to studio.tiktok.com.', link:"https://studio.tiktok.com" },
  ];
  const G_GOOGLE = [
    { text:'Go to business.google.com and sign in with your Google account.', link:"https://business.google.com/" },
    { text:'Click "Add your business to Google" → enter your business name → select a category that describes what you do.' },
    { text:'Choose whether customers come to your location or you serve them remotely. Fill in your phone number and website.' },
    { text:'Verify your business. Google will mail a postcard with a 5-digit code to your address. It arrives in 5–7 business days.' },
    { text:'After verification, search your business name in Google Maps → click "Share" (the chain-link icon) → copy the link and paste it into the Profile URL field above.' },
  ];
  const G_STRIPE = [
    { text:'Go to stripe.com and click "Start now" to create a free account.', link:"https://stripe.com/register" },
    { text:'Complete your business profile: legal name, address, business type, and bank account for payouts (Settings → Bank accounts).' },
    { text:'Once your account is active, go to Developers → API Keys in the left sidebar.' },
    { text:'Copy your Publishable key (starts with pk_live_) and paste it into the field above. Never share your Secret key (sk_live_).' },
  ];
  const G_CALENDLY = [
    { text:'Go to calendly.com and create a free account.', link:"https://calendly.com/signup" },
    { text:'Click "New Event Type" → set your event name (e.g., "30-Minute Consultation"), duration, and availability hours.' },
    { text:'Your booking link is shown at the top of the dashboard (e.g., calendly.com/yourname/30min). Copy it and paste it above.' },
    { text:'Optional: connect Stripe inside Calendly (Integrations → Stripe) so clients pay when they book.' },
  ];
  const G_PAYPAL = [
    { text:'Log in to paypal.com with your personal PayPal account.', link:"https://paypal.com" },
    { text:'Go to paypal.me in your browser. If you have not claimed your link yet, follow the prompts to set it up (it takes 2 minutes).', link:"https://www.paypal.com/paypalme/my/landing" },
    { text:'Your link will look like paypal.me/yourname. Copy it and paste it above.' },
    { text:'When a client needs to pay you, just send them your PayPal.me link — they can pay with any card or PayPal balance.' },
  ];
  const G_VENMO = [
    { text:'Open the Venmo app on your phone and tap your profile photo at the bottom right.' },
    { text:'Your @username is shown at the top of your profile page (e.g., @john-smith).' },
    { text:'Paste it into the field above (include the @).' },
    { text:'To receive payment, tell clients to search your @username in Venmo and send money. You can also share your Venmo QR code.' },
  ];
  const G_TWITTER = [
    { text:'Go to developer.x.com and sign in with your X / Twitter account. Click "Projects & Apps" → "Overview" → "Create App".', link:"https://developer.x.com/en/portal/projects-and-apps" },
    { text:'In your app, go to "Keys and tokens". Under "Consumer Keys" copy the API Key and API Key Secret.' },
    { text:'Under "Authentication Tokens" click "Generate" to create an Access Token and Access Token Secret. Paste all four values above.' },
    { text:'Make sure your app has "Read and Write" permissions (Edit → App permissions). Without Write permission, posting tweets will fail.' },
    { text:'The agent reads your follower count and recent tweet performance, then drafts and posts tweets on your behalf.' },
  ];

  const integrationDefs = isMinor ? [
    { provider:"paypal",   label:"PayPal.me",              desc:"Accept payments — free for any age",
      autopilotLabel:"Agent includes payment link in outreach",
      setupGuide:G_PAYPAL, fields:[
      { key:"link", label:"Your PayPal.me link", placeholder:"paypal.me/yourusername" },
    ]},
    { provider:"venmo",    label:"Venmo",                  desc:"Fast peer-to-peer payments",
      autopilotLabel:"Agent references Venmo in client communications",
      setupGuide:G_VENMO, fields:[
      { key:"handle", label:"@Venmo handle", placeholder:"@yourhandle" },
    ]},
    { provider:"google",   label:"Google Business Profile", desc:"Appear in local search",
      autopilotLabel:"Agent monitors reviews",
      setupGuide:G_GOOGLE, fields:[
      { key:"profileUrl", label:"Profile URL", placeholder:"maps.app.goo.gl/..." },
      { key:"status",     label:"Verification status", placeholder:"Pending / Verified" },
    ]},
    { provider:"website",  label:"Your Website",           desc:"Agent generates content and updates WordPress sites",
      autopilotLabel:"Agent updates your site and creates blog posts automatically",
      setupGuide:G_WEBSITE, wpTest:true, fields:[
      { key:"siteUrl",         label:"Website URL", placeholder:"https://yourbusiness.com" },
      { key:"host",            label:"Hosting platform", placeholder:"WordPress / Squarespace / Wix / other" },
      { key:"wpUsername",      label:"WordPress username (optional)", placeholder:"admin", hint:"Only for WordPress sites — leave blank for other hosts." },
      { key:"wpAppPassword",   label:"WordPress App Password (optional)", placeholder:"xxxx xxxx xxxx xxxx xxxx xxxx", inputType:"password", mono:true, hint:"WordPress Admin → Users → your user → Application Passwords." },
      { key:"analyticsId",     label:"Google Analytics ID (optional)", placeholder:"G-XXXXXXXXXX" },
    ]},
    { provider:"calendly", label:"Calendly",               desc:"Let clients book without back-and-forth",
      autopilotLabel:"Agent promotes booking link in posts and emails",
      setupGuide:G_CALENDLY, fields:[
      { key:"bookingUrl", label:"Booking link", placeholder:"calendly.com/yourname/event" },
    ]},
    { provider:"instagram",label:"Instagram",              desc:"Agent analyzes insights, creates posts, and plans ads",
      autopilotLabel:"Agent analyzes insights, suggests posts, and plans ads",
      setupGuide:G_INSTAGRAM, fields:[
      { key:"handle",            label:"@Instagram handle", placeholder:"@yourbusiness" },
      { key:"accessToken",       label:"Access Token", placeholder:"EAAxxxxxxx...", inputType:"password", mono:true },
      { key:"businessAccountId", label:"Business Account ID", placeholder:"17841400000000000", mono:true },
    ]},
    { provider:"tiktok",   label:"TikTok",                 desc:"Agent generates video content and analyzes performance",
      autopilotLabel:"Agent creates TikTok slide videos and posts automatically",
      setupGuide:G_TIKTOK, fields:[
      { key:"handle",       label:"@TikTok handle", placeholder:"@yourbusiness" },
      { key:"clientKey",    label:"Client Key", placeholder:"From developers.tiktok.com", mono:true },
      { key:"clientSecret", label:"Client Secret", placeholder:"From developers.tiktok.com", inputType:"password", mono:true },
      { key:"accessToken",  label:"Access Token", placeholder:"Sandbox or production token", inputType:"password", mono:true },
      { key:"openId",       label:"Open ID", placeholder:"Your TikTok Open ID", mono:true },
    ]},
    { provider:"email",    label:"Email / Newsletter",     desc:"Agent generates and sends email campaigns",
      autopilotLabel:"Agent sends follow-ups, newsletters, and re-engagement emails",
      setupGuide:G_EMAIL, fields:[
      { key:"address",    label:"Business email address (send FROM)", placeholder:"hello@yourbusiness.com" },
      { key:"provider",   label:"Email provider", type:"select", options:["Resend","Gmail","Outlook","Mailchimp","Klaviyo","ConvertKit","SendGrid","Other"] },
      { key:"apiKey",     label:"API key", placeholder:"Resend / Mailchimp / SendGrid key", inputType:"password", mono:true, hint:"Required for automated sending. Leave blank to get content only (copy & paste to send)." },
      { key:"openRate",   label:"Current open rate %", placeholder:"e.g. 28" },
      { key:"emailsSent", label:"Emails sent (total)", placeholder:"e.g. 450" },
    ]},
    { provider:"twitter",  label:"X / Twitter",            desc:"Agent posts tweets and analyzes your audience",
      autopilotLabel:"Agent posts daily updates and engages your audience",
      setupGuide:G_TWITTER, fields:[
      { key:"handle",            label:"@X handle", placeholder:"@yourbusiness" },
      { key:"apiKey",            label:"API Key (Consumer Key)", placeholder:"From developer.x.com", mono:true },
      { key:"apiSecret",         label:"API Key Secret (Consumer Secret)", placeholder:"From developer.x.com", inputType:"password", mono:true },
      { key:"accessToken",       label:"Access Token", placeholder:"From developer.x.com", inputType:"password", mono:true },
      { key:"accessTokenSecret", label:"Access Token Secret", placeholder:"From developer.x.com", inputType:"password", mono:true },
    ]},
  ] : [
    { provider:"stripe",   label:"Stripe",                 desc:"Accept card payments",
      autopilotLabel:"Agent monitors revenue and flags payment issues",
      setupGuide:G_STRIPE, fields:[
      { key:"dashboardUrl", label:"Stripe dashboard URL", placeholder:"dashboard.stripe.com" },
      { key:"publicKey",    label:"Publishable key (optional)", placeholder:"pk_live_...", mono:true, hint:"Never paste your secret key (sk_live_) here." },
    ]},
    { provider:"google",   label:"Google Business Profile", desc:"Appear in local search and on Google Maps",
      autopilotLabel:"Agent monitors reviews and updates your listing",
      setupGuide:G_GOOGLE, fields:[
      { key:"profileUrl", label:"Profile URL", placeholder:"maps.app.goo.gl/..." },
      { key:"status",     label:"Verification status", placeholder:"Pending / Verified" },
    ]},
    { provider:"website",  label:"Your Website",           desc:"Agent generates content and updates WordPress sites",
      autopilotLabel:"Agent updates your site and creates blog posts automatically",
      setupGuide:G_WEBSITE, wpTest:true, fields:[
      { key:"siteUrl",       label:"Website URL", placeholder:"https://yourbusiness.com" },
      { key:"host",          label:"Hosting platform", placeholder:"WordPress / Squarespace / Wix / Netlify / other" },
      { key:"wpUsername",    label:"WordPress username (optional)", placeholder:"admin", hint:"Only for WordPress sites — leave blank for other hosts." },
      { key:"wpAppPassword", label:"WordPress App Password (optional)", placeholder:"xxxx xxxx xxxx xxxx xxxx xxxx", inputType:"password", mono:true, hint:"WordPress Admin → Users → your user → Application Passwords." },
      { key:"analyticsId",   label:"Google Analytics ID (optional)", placeholder:"G-XXXXXXXXXX" },
    ]},
    { provider:"calendly", label:"Calendly",               desc:"Let clients book without back-and-forth",
      autopilotLabel:"Agent promotes booking link in posts and emails",
      setupGuide:G_CALENDLY, fields:[
      { key:"bookingUrl", label:"Booking link", placeholder:"calendly.com/yourname/event" },
    ]},
    { provider:"instagram",label:"Instagram",              desc:"Agent analyzes insights, creates posts, and plans ads",
      autopilotLabel:"Agent analyzes insights, suggests posts, and plans ads",
      setupGuide:G_INSTAGRAM, fields:[
      { key:"handle",            label:"@Instagram handle", placeholder:"@yourbusiness" },
      { key:"accessToken",       label:"Access Token", placeholder:"EAAxxxxxxx...", inputType:"password", mono:true },
      { key:"businessAccountId", label:"Business Account ID", placeholder:"17841400000000000", mono:true },
      { key:"pageId",            label:"Facebook Page ID (optional)", placeholder:"123456789", mono:true, hint:"Required to run Facebook Ads. Found in your Facebook Page settings → Page Info." },
    ]},
    { provider:"tiktok",   label:"TikTok",                 desc:"Agent generates video content and analyzes performance",
      autopilotLabel:"Agent creates TikTok slide videos and posts automatically",
      setupGuide:G_TIKTOK, fields:[
      { key:"handle",       label:"@TikTok handle", placeholder:"@yourbusiness" },
      { key:"clientKey",    label:"Client Key", placeholder:"From developers.tiktok.com", mono:true },
      { key:"clientSecret", label:"Client Secret", placeholder:"From developers.tiktok.com", inputType:"password", mono:true },
      { key:"accessToken",  label:"Access Token", placeholder:"Sandbox or production token", inputType:"password", mono:true },
      { key:"openId",       label:"Open ID", placeholder:"Your TikTok Open ID", mono:true },
    ]},
    { provider:"email",    label:"Email / Newsletter",     desc:"Agent generates and sends email campaigns",
      autopilotLabel:"Agent sends follow-ups, newsletters, and re-engagement emails",
      setupGuide:G_EMAIL, fields:[
      { key:"address",    label:"Business email address (send FROM)", placeholder:"hello@yourbusiness.com" },
      { key:"provider",   label:"Email provider", type:"select", options:["Resend","Gmail","Outlook","Mailchimp","Klaviyo","ConvertKit","SendGrid","Other"] },
      { key:"apiKey",     label:"API key", placeholder:"Resend / Mailchimp / SendGrid key", inputType:"password", mono:true, hint:"Required for automated sending. Leave blank to get content only (copy & paste to send)." },
      { key:"openRate",   label:"Current open rate %", placeholder:"e.g. 28" },
      { key:"emailsSent", label:"Emails sent (total)", placeholder:"e.g. 450" },
    ]},
    { provider:"twitter",  label:"X / Twitter",            desc:"Agent posts tweets and analyzes your audience",
      autopilotLabel:"Agent posts daily updates and engages your audience",
      setupGuide:G_TWITTER, fields:[
      { key:"handle",            label:"@X handle", placeholder:"@yourbusiness" },
      { key:"apiKey",            label:"API Key (Consumer Key)", placeholder:"From developer.x.com", mono:true },
      { key:"apiSecret",         label:"API Key Secret (Consumer Secret)", placeholder:"From developer.x.com", inputType:"password", mono:true },
      { key:"accessToken",       label:"Access Token", placeholder:"From developer.x.com", inputType:"password", mono:true },
      { key:"accessTokenSecret", label:"Access Token Secret", placeholder:"From developer.x.com", inputType:"password", mono:true },
    ]},
  ];

  const noteP = { notesByTarget, onDropNote, onUnstickNote };
  return (
    <div>
      <p style={{ color:C.muted, fontSize:13, marginBottom:20, fontFamily:FB }}>Connect your tools and store your information. Everything saved here is used by your agents to give better results.</p>

      <NoteDropItem targetId="hub_integrations" {...noteP}>
        <div style={{ ...card(), marginBottom:0 }}>
          <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:4 }}>Integrations</div>
          <p style={{ fontSize:12, color:C.muted, marginBottom:4, fontFamily:FB }}>Expand each card to enter your details. Nothing is required — add what you have.</p>
          {integrationDefs.map(def => (
            <NoteDropItem key={def.provider} targetId={`hub_integ_${def.provider}`} {...noteP}>
              <IntegrationCard
                provider={def.provider}
                label={def.label}
                desc={def.desc}
                fields={def.fields}
                savedMeta={getMeta(def.provider)}
                isConn={isConn(def.provider)}
                onSave={vals => onSaveFields(def.provider, vals)}
                autopilotLabel={def.autopilotLabel}
                autopilotDisabled={!isAutopilotPlan}
                setupGuide={def.setupGuide}
                onTestConnection={def.wpTest ? async (vals) => {
                  if (!vals.siteUrl || !vals.wpUsername || !vals.wpAppPassword) throw new Error("Enter site URL, username, and app password first");
                  const r = await api.integrations.testWordPress(businessId, vals);
                  return `Connected as ${r.username} at ${r.url}`;
                } : undefined}
              />
            </NoteDropItem>
          ))}
        </div>
      </NoteDropItem>

      <NoteDropItem targetId="hub_files" {...noteP}>
        <FilesArchive businessId={businessId} outputs={outputs} tasks={tasks} />
      </NoteDropItem>
    </div>
  );
}

// ── AGENTS (marketing + management) ──────────────────────────────────────────

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
          <button onClick={save} style={{ ...btn(C.dark,"#fff",12), padding:"6px 12px" }}>Save</button>
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

// ── Instagram Panel ───────────────────────────────────────────────────────────

// ── Social Media Presence Panel ───────────────────────────────────────────────

function BrandIdentityPanel({ businessId, onGoToMarketing }) {
  const [identity, setIdentity] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const savedTimerRef = useRef(null);

  useEffect(()=>{
    api.agents.getBrandIdentity(businessId)
      .then(d=>setIdentity(d.identity)).catch(()=>{}).finally(()=>setLoading(false));
    return ()=>clearTimeout(savedTimerRef.current);
  },[businessId]);

  const setField=(key,val)=>setIdentity(p=>({...p,[key]:val}));

  const save=async()=>{
    setSaving(true);
    try{
      const{identity:s}=await api.agents.saveBrandIdentity(businessId,identity);
      setIdentity(s); setSaved(true);
      savedTimerRef.current=setTimeout(()=>setSaved(false),2000);
    }catch{}
    setSaving(false);
  };

  const F=(key,label,placeholder,type="text")=>(
    <div key={key}>
      <label style={lbl}>{label}</label>
      {type==="textarea"
        ?<textarea style={{...inp(),minHeight:60,resize:"vertical"}} value={identity?.[key]||""} onChange={e=>setField(key,e.target.value)} placeholder={placeholder}/>
        :type==="select"
          ?<select style={{...inp(),appearance:"none"}} value={identity?.[key]||""} onChange={e=>setField(key,e.target.value)}>
            <option value="">Select visual style…</option>
            <option value="abstract">Abstract</option>
            <option value="colorful">Colorful</option>
            <option value="busy">Busy</option>
            <option value="minimalistic">Minimalistic</option>
          </select>
          :<input style={inp()} value={identity?.[key]||""} onChange={e=>setField(key,e.target.value)} placeholder={placeholder}/>
      }
    </div>
  );

  if(loading) return <div style={{...card(),marginBottom:20,color:C.muted,fontSize:13,fontFamily:FB}}>Loading…</div>;

  return (
    <div style={{...card("16px 18px"),marginBottom:20}}>
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:FH,fontWeight:700,fontSize:15}}>Social Media Presence</div>
        <div style={{fontSize:12,color:C.muted,fontFamily:FB,marginTop:2}}>Define how your brand shows up across channels</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        {F("voice","Brand Voice","e.g. educational, direct, no-fluff")}
        {F("tone","Tone","e.g. warm but professional, confidence-first")}
      </div>
      {F("targetAudience","Target Audience","Who is your ideal customer? What's their main pain point?","textarea")}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
        {F("colorPalette","Color Palette","e.g. deep purple, warm gold, white")}
        {F("visualStyle","Visual Style","","select")}
      </div>
      <div style={{marginTop:12}}>
        {F("uniqueAngle","Unique Angle","What makes your content stand out from competitors?")}
      </div>
      <div style={{marginTop:12}}>
        {F("competitorAccounts","Competitor / Inspiration Accounts","@handle1, @handle2 — accounts to study and learn from")}
      </div>
      <div style={{marginTop:12}}>
        <label style={lbl}>Marketing Strategy</label>
        <textarea
          style={{...inp(),minHeight:90,resize:"vertical"}}
          value={identity?.postingRecommendation||""}
          onChange={e=>setField("postingRecommendation",e.target.value)}
          placeholder="Overview of channels in use, posting frequency and times, content mix."
        />
        <div onClick={onGoToMarketing} style={{fontSize:11,color:C.muted,fontFamily:FB,marginTop:4,cursor:onGoToMarketing?"pointer":"default",display:"inline-block",textDecoration:onGoToMarketing?"underline":"none"}}>
          View full analysis in Marketing Agent →
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",marginTop:18}}>
        <button onClick={save} disabled={saving} style={{...btn(saving?"#9CA3AF":C.dark,"#fff",13),padding:"8px 20px"}}>
          {saved?<>Saved <Check size={13} style={{display:"inline-block",verticalAlign:"middle"}} aria-hidden="true"/></>:saving?"Saving…":"Save changes"}
        </button>
      </div>
    </div>
  );
}

// ── Business Preferences (reused in Overview + Management) ────────────────────

function BusinessPrefsCard({ prefs, onSave, compact }) {
  return (
    <div style={{ ...card("16px 18px"), marginBottom:24 }}>
      <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:4 }}>Business preferences</div>
      <p style={{ fontSize:12, color:C.muted, marginBottom:16, fontFamily:FB }}>
        {compact ? "Shapes all agent advice and output." : "Tell the agent who you are targeting and where you are in your journey. This shapes all advice and output."}
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <div>
          <label style={lbl}>Target audience</label>
          <select style={{ ...inp(), appearance:"none" }} value={prefs.audience} onChange={e=>onSave({...prefs,audience:e.target.value})}>
            <option value="local">Local (city / region)</option>
            <option value="national">National</option>
            <option value="global">Global / online</option>
            <option value="niche">Niche community</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Business stage</label>
          <select style={{ ...inp(), appearance:"none" }} value={prefs.stage} onChange={e=>onSave({...prefs,stage:e.target.value})}>
            <option value="starting">Just starting out</option>
            <option value="growing">Growing — have first clients</option>
            <option value="scaling">Scaling up</option>
            <option value="established">Established</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom:12 }}>
        <label style={lbl}>Target market description (optional)</label>
        <input style={inp()} value={prefs.targetMarket||""} onChange={e=>onSave({...prefs,targetMarket:e.target.value})} placeholder="e.g. small business owners in the US, college students, fitness enthusiasts" />
      </div>
      <div>
        <label style={lbl}>Current goals (optional)</label>
        <input style={inp()} value={prefs.goals||""} onChange={e=>onSave({...prefs,goals:e.target.value})} placeholder="e.g. reach 100 clients by Q3, expand to a second city, launch a course" />
      </div>
    </div>
  );
}

// ── Business Profile Section (expanded prefs) ────────────────────────────────
function BusinessProfileSection({ prefs, savePrefs, metrics, saveM, business }) {
  const [expanded, setExpanded] = useState(true);
  const profile = metrics.businessProfile || {};
  const idea = business?.idea || {};
  const saveProfile = patch => saveM("businessProfile", { ...profile, ...patch });

  return (
    <div style={{ ...card("16px 18px"), marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", marginBottom:expanded?16:0 }} onClick={()=>setExpanded(e=>!e)}>
        <div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:15 }}>Business Profile</div>
          <div style={{ fontSize:12, color:C.muted, fontFamily:FB, marginTop:2 }}>Core context used by all agents for accurate advice and output</div>
        </div>
        <span style={{ color:C.muted, fontSize:14, transform:expanded?"rotate(180deg)":"none", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
      </div>
      {expanded && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Target audience</label>
              <select style={{ ...inp(), appearance:"none" }} value={prefs.audience} onChange={e=>savePrefs({...prefs,audience:e.target.value})}>
                <option value="local">Local (city / region)</option>
                <option value="national">National</option>
                <option value="global">Global / online</option>
                <option value="niche">Niche community</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Business stage</label>
              <select style={{ ...inp(), appearance:"none" }} value={prefs.stage} onChange={e=>savePrefs({...prefs,stage:e.target.value})}>
                <option value="starting">Just starting out</option>
                <option value="growing">Growing — have first clients</option>
                <option value="scaling">Scaling up</option>
                <option value="established">Established</option>
              </select>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Pricing model</label>
              <select style={{ ...inp(), appearance:"none" }} value={profile.pricingModel||""} onChange={e=>saveProfile({pricingModel:e.target.value})}>
                <option value="">Select…</option>
                <option value="hourly">Hourly</option>
                <option value="project">Per project</option>
                <option value="subscription">Subscription / recurring</option>
                <option value="product">Product sales</option>
                <option value="service">Service packages</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Monthly revenue target ($)</label>
              <input type="number" style={inp()} value={profile.revenueTarget||idea.revenue||""} onChange={e=>saveProfile({revenueTarget:Number(e.target.value)})} placeholder="e.g. 5000" />
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Ideal customer / target market</label>
            <input style={inp()} value={prefs.targetMarket||""} onChange={e=>savePrefs({...prefs,targetMarket:e.target.value})} placeholder="e.g. small business owners in the US, fitness enthusiasts aged 25–40" />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Unique value proposition</label>
            <input style={inp()} value={profile.uniqueValueProp||""} onChange={e=>saveProfile({uniqueValueProp:e.target.value})} placeholder="What makes your business different or better than alternatives?" />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Current goals</label>
            <input style={inp()} value={prefs.goals||""} onChange={e=>savePrefs({...prefs,goals:e.target.value})} placeholder="e.g. reach 100 clients by Q3, launch a course, expand to second city" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Main competitors</label>
              <input style={inp()} value={profile.competitors||""} onChange={e=>saveProfile({competitors:e.target.value})} placeholder="e.g. Competitor A, Competitor B" />
            </div>
            <div>
              <label style={lbl}>Top challenges</label>
              <input style={inp()} value={profile.challenges||idea.biggestRisk||""} onChange={e=>saveProfile({challenges:e.target.value})} placeholder="e.g. getting consistent leads, pricing competitively" />
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Available monthly growth budget ($)</label>
              <input type="number" style={inp()} value={profile.monthlyGrowthBudget||""} onChange={e=>saveProfile({monthlyGrowthBudget:Number(e.target.value)})} placeholder="Budget for ads, tools, services" />
            </div>
            <div>
              <label style={lbl}>Startup / initial investment ($)</label>
              <input type="number" style={inp()} value={profile.startupCost||idea.startupCost||""} onChange={e=>saveProfile({startupCost:Number(e.target.value)})} placeholder="e.g. 2000" />
            </div>
          </div>
          <div>
            <label style={lbl}>Business summary</label>
            <textarea style={{ ...inp(), minHeight:80, resize:"vertical" }} value={profile.summary||idea.why||""} onChange={e=>saveProfile({summary:e.target.value})} placeholder="Describe your business, what you offer, and why you started it…" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Products & Services Section ───────────────────────────────────────────────
const PRODUCT_TYPE_OPTS = [
  { v:"digital",  label:"Digital",  bg:"#F1F5F9", fg:"#475569" },
  { v:"physical", label:"Physical", bg:"#F1F5F9", fg:"#475569" },
  { v:"service",  label:"Service",  bg:"#F1F5F9", fg:"#475569" },
];
const PRODUCT_STATUS_OPTS = [
  { v:"idea",         label:"Idea",           bg:"#F8FAFC", fg:"#94A3B8" },
  { v:"development",  label:"In Development", bg:"#FFFBEB", fg:"#D97706" },
  { v:"active",       label:"Active / Live",  bg:"#F0FDF4", fg:"#059669" },
  { v:"discontinued", label:"Discontinued",   bg:"#FEF2F2", fg:"#DC2626" },
];

function ProductsSection({ metrics, saveM }) {
  const [expanded, setExpanded]   = useState(true);
  const [editingId, setEditingId] = useState(null);
  const products = metrics.products || [];
  const saveProducts = next => saveM("products", next);

  const addProduct = () => {
    const p = { id:`prod_${Date.now()}`, name:"", type:"digital", description:"", price:"", status:"active", features:"", url:"", notes:"" };
    saveProducts([...products, p]);
    setEditingId(p.id);
  };
  const updateProduct = (id, patch) => saveProducts(products.map(p=>p.id===id?{...p,...patch}:p));
  const removeProduct = id => { saveProducts(products.filter(p=>p.id!==id)); if(editingId===id) setEditingId(null); };

  const activeCount = products.filter(p=>p.status==="active").length;

  return (
    <div style={{ ...card("16px 18px"), marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", marginBottom:expanded?16:0 }} onClick={()=>setExpanded(e=>!e)}>
        <div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:15 }}>Products &amp; Services</div>
          <div style={{ fontSize:12, color:C.muted, fontFamily:FB, marginTop:2 }}>
            {products.length===0 ? "Add your products or services — agents use this for strategy and content" : `${products.length} product${products.length!==1?"s":""}${activeCount>0?` · ${activeCount} active`:""}`}
          </div>
        </div>
        <span style={{ color:C.muted, fontSize:14, transform:expanded?"rotate(180deg)":"none", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
      </div>

      {expanded && (
        <div>
          {products.length===0 && (
            <div style={{ textAlign:"center", padding:"16px 0 8px", color:C.muted, fontSize:13, fontFamily:FB }}>
              No products yet.
            </div>
          )}
          {products.map(p=>{
            const tOpt = PRODUCT_TYPE_OPTS.find(t=>t.v===p.type)||PRODUCT_TYPE_OPTS[0];
            const sOpt = PRODUCT_STATUS_OPTS.find(s=>s.v===p.status)||PRODUCT_STATUS_OPTS[0];
            return (
              <div key={p.id} style={{ background:C.surface, borderRadius:12, border:`1px solid ${C.border}`, marginBottom:10, overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"center", padding:"10px 14px", cursor:"pointer", gap:10 }} onClick={()=>setEditingId(editingId===p.id?null:p.id)}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:FB, fontWeight:700, fontSize:13, color:C.text }}>{p.name||"Unnamed"}</div>
                    <div style={{ display:"flex", gap:6, marginTop:3, flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, background:tOpt.bg, color:tOpt.fg, padding:"1px 8px", borderRadius:20, fontFamily:FB, fontWeight:600 }}>{tOpt.label}</span>
                      <span style={{ fontSize:10, background:sOpt.bg, color:sOpt.fg, padding:"1px 8px", borderRadius:20, fontFamily:FB, fontWeight:600 }}>{sOpt.label}</span>
                      {p.price&&<span style={{ fontSize:10, color:C.muted, fontFamily:FB, padding:"1px 4px" }}>${p.price}</span>}
                    </div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();removeProduct(p.id);}} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16, padding:"2px 6px", flexShrink:0 }}>×</button>
                  <span style={{ color:C.muted, fontSize:11, flexShrink:0 }}>{editingId===p.id?"▴":"▾"}</span>
                </div>
                {editingId===p.id && (
                  <div style={{ padding:"14px 16px", borderTop:`1px solid ${C.border}` }}>
                    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:10, marginBottom:10 }}>
                      <div>
                        <label style={lbl}>Name</label>
                        <input style={inp()} value={p.name} onChange={e=>updateProduct(p.id,{name:e.target.value})} placeholder="Product or service name" />
                      </div>
                      <div>
                        <label style={lbl}>Price / rate</label>
                        <input style={inp()} value={p.price} onChange={e=>updateProduct(p.id,{price:e.target.value})} placeholder="e.g. 49, 149/mo" />
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                      <div>
                        <label style={lbl}>Type</label>
                        <select style={{ ...inp(), appearance:"none" }} value={p.type} onChange={e=>updateProduct(p.id,{type:e.target.value})}>
                          {PRODUCT_TYPE_OPTS.map(t=><option key={t.v} value={t.v}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Status</label>
                        <select style={{ ...inp(), appearance:"none" }} value={p.status} onChange={e=>updateProduct(p.id,{status:e.target.value})}>
                          {PRODUCT_STATUS_OPTS.map(s=><option key={s.v} value={s.v}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom:10 }}>
                      <label style={lbl}>Description</label>
                      <textarea style={{ ...inp(), minHeight:60, resize:"vertical" }} value={p.description} onChange={e=>updateProduct(p.id,{description:e.target.value})} placeholder="What does this offer? Who is it for? What problem does it solve?" />
                    </div>
                    <div style={{ marginBottom:10 }}>
                      <label style={lbl}>Key features / deliverables</label>
                      <textarea style={{ ...inp(), minHeight:52, resize:"vertical" }} value={p.features} onChange={e=>updateProduct(p.id,{features:e.target.value})} placeholder="List main features or what's included, one per line" />
                    </div>
                    {p.type==="digital" && (
                      <div style={{ marginBottom:10 }}>
                        <label style={lbl}>URL (if live)</label>
                        <input style={inp()} value={p.url||""} onChange={e=>updateProduct(p.id,{url:e.target.value})} placeholder="https://…" />
                      </div>
                    )}
                    <div>
                      <label style={lbl}>Notes for agents</label>
                      <input style={inp()} value={p.notes||""} onChange={e=>updateProduct(p.id,{notes:e.target.value})} placeholder="Context that should influence marketing or management strategy" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={addProduct} style={{ ...btnO("#475569",12), width:"100%", textAlign:"center", marginTop:products.length>0?4:0 }}>+ Add product or service</button>
        </div>
      )}
    </div>
  );
}

// ── Business Info Panel (new tab) ─────────────────────────────────────────────
function BusinessInfoPanel({ businessId, metrics, saveM, prefs, savePrefs, business, onGoToMarketing, notesByTarget, onDropNote, onUnstickNote }) {
  const noteProps = { notesByTarget, onDropNote, onUnstickNote };
  return (
    <div>
      <div style={{ fontFamily:FH, fontWeight:700, fontSize:26, letterSpacing:"-0.04em", marginBottom:24 }}>{business?.name}</div>
      <NoteDropItem targetId="biz_profile_card" {...noteProps}>
        <BusinessProfileSection prefs={prefs} savePrefs={savePrefs} metrics={metrics} saveM={saveM} business={business} />
      </NoteDropItem>
      <NoteDropItem targetId="biz_products_card" {...noteProps}>
        <ProductsSection metrics={metrics} saveM={saveM} />
      </NoteDropItem>
      <NoteDropItem targetId="biz_brand_card" {...noteProps}>
        <BrandIdentityPanel businessId={businessId} onGoToMarketing={onGoToMarketing} />
      </NoteDropItem>
    </div>
  );
}

function InstagramPanel({ businessId, businessName, integs }) {
  const igMeta = (() => { try { const i=integs.find(x=>x.provider==="instagram"); return i?.metadata?JSON.parse(i.metadata):{};} catch{return {};} })();
  const hasToken = !!(igMeta.accessToken && igMeta.businessAccountId);

  const [profile,    setProfile]    = useState(null);
  const [insights,   setInsights]   = useState(null);
  const [media,      setMedia]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [activePost, setActivePost] = useState(null); // for comment management
  const [comments,   setComments]   = useState([]);
  const [cmtLoading, setCmtLoading] = useState(false);
  const [postOpen,   setPostOpen]   = useState(false);
  const [postCaption,setPostCaption]= useState("");
  const [postImg,    setPostImg]    = useState(""); // server-hosted URL for the image
  const [uploading,  setUploading]  = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [posting,    setPosting]    = useState(false);
  const [postResult, setPostResult] = useState(null);

  const igAutopilot = !!igMeta.autopilot;

  useEffect(()=>{
    if (!hasToken) return;
    loadData();
  },[businessId, hasToken]);

  const loadData = async () => {
    setLoading(true); setError("");
    try {
      const [pRes, iRes, mRes] = await Promise.allSettled([
        api.instagram.profile(businessId),
        api.instagram.insights(businessId, 30),
        api.instagram.media(businessId, 9),
      ]);
      if (pRes.status==="fulfilled") setProfile(pRes.value.profile);
      if (iRes.status==="fulfilled") setInsights(iRes.value.insights);
      if (mRes.status==="fulfilled") setMedia(mRes.value.media||[]);
      const firstErr = [pRes,iRes,mRes].find(r=>r.status==="rejected");
      if (firstErr) setError(firstErr.reason?.message || "Failed to load Instagram data");
    } catch(e){ setError(e.message); }
    setLoading(false);
  };

  const loadComments = async (post) => {
    setActivePost(post); setCmtLoading(true); setComments([]);
    try {
      const { comments:c } = await api.instagram.comments(businessId, post.id);
      // Pre-generate AI reply suggestions
      const withSuggestions = await Promise.all((c||[]).map(async cmt => {
        try {
          const { reply } = await api.instagram.generateReply(businessId, cmt.text, post.caption?.slice(0,80));
          return { ...cmt, suggestedReply: reply };
        } catch { return cmt; }
      }));
      setComments(withSuggestions);
    } catch(e){ setError(e.message); }
    setCmtLoading(false);
  };

  const replyToComment = async (commentId, message, idx) => {
    try {
      await api.instagram.replyComment(businessId, commentId, message);
      setComments(p=>p.map((c,i)=>i===idx?{...c,replied:true,repliedWith:message}:c));
    } catch(e){ alert(e.message); }
  };

  const generateCaption = async () => {
    setGenLoading(true);
    try {
      const res = await api.instagram.generateCaption(businessId, "", "authentic");
      setPostCaption(res.caption);
      // Generate image client-side (browser fonts always available — no boxes)
      try {
        const blob = await generatePostImageBlob(businessName || "Business", res.body || res.caption);
        const { imageUrl } = await api.instagram.uploadImage(blob);
        setPostImg(imageUrl);
      } catch(imgErr) {
        // Non-fatal — caption succeeded; user can upload their own image
        console.warn("Canvas image generation failed:", imgErr.message);
      }
    } catch(e){ alert(e.message); }
    setGenLoading(false);
  };

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const { imageUrl } = await api.instagram.uploadImage(file);
      setPostImg(imageUrl);
    } catch(e){ alert(e.message); }
    setUploading(false);
  };

  const publishPost = async () => {
    setPosting(true);
    try {
      // postImg is a server-hosted URL (uploaded or AI-generated); server auto-generates if omitted
      const result = await api.instagram.createPost(businessId, postImg || undefined, postCaption);
      setPostResult(result);
    } catch(e){ alert(e.message); }
    setPosting(false);
  };

  if (!hasToken) return (
    <div style={{ ...card("16px"), marginTop:16, borderStyle:"dashed" }}>
      <div style={{ fontSize:13, fontWeight:600, fontFamily:FB, marginBottom:6 }}>Instagram not connected</div>
      <div style={{ fontSize:12, color:C.muted, fontFamily:FB, lineHeight:1.6 }}>Add your Access Token and Business Account ID in Hub → Instagram. Expand the card and follow the Setup Guide.</div>
    </div>
  );

  // Summarise reach data
  const totalReach = insights?.reach?.reduce((sum,item)=>{
    const vals = item.values||[]; return sum+(vals.reduce((s,v)=>s+(v.value||0),0));
  },0)||0;
  const avgReach = insights?.reach?.length ? Math.round(totalReach / (insights.reach.length||1)) : 0;

  const statPill = (label, value) => (
    <div key={label} style={{ background:C.surface, borderRadius:10, border:`1px solid ${C.border}`, padding:"10px 14px", minWidth:90, textAlign:"center" }}>
      <div style={{ fontFamily:FH, fontWeight:700, fontSize:20, letterSpacing:"-0.03em" }}>{value}</div>
      <div style={{ fontSize:10, color:C.muted, fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.05em", marginTop:2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ marginTop:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#E1306C" }} />
          <span style={{ fontFamily:FH, fontWeight:700, fontSize:15 }}>Instagram</span>
          {igAutopilot && <span style={{ fontSize:10, fontWeight:700, fontFamily:FB, padding:"2px 8px", borderRadius:20, background:"#DCFCE7", color:C.ok }}>Autopilot ON</span>}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={loadData} disabled={loading} style={{ ...btnO(C.muted,11), padding:"5px 12px" }}>{loading?"Loading…":"Refresh"}</button>
          <button onClick={()=>{ setPostOpen(o=>!o); setPostResult(null); }} style={{ ...btn("#E1306C","#fff",12), padding:"6px 14px" }}>+ New post</button>
        </div>
      </div>

      {error && <div style={{ background:C.errBg, borderRadius:8, padding:"10px 14px", fontSize:13, color:C.err, fontFamily:FB, marginBottom:12 }}>{error}</div>}

      {/* Profile row */}
      {profile && (
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, ...card("12px 14px") }}>
          {profile.profile_picture_url && <img src={profile.profile_picture_url} alt="profile" style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover" }} />}
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontFamily:FB, fontSize:14 }}>@{profile.username}</div>
            <div style={{ fontSize:12, color:C.muted, fontFamily:FB, marginTop:2, lineHeight:1.4 }}>{profile.biography?.slice(0,100)}</div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {statPill("Followers", (profile.followers_count||0).toLocaleString())}
            {statPill("Posts", (profile.media_count||0).toLocaleString())}
            {avgReach > 0 && statPill("Avg Reach/day", avgReach.toLocaleString())}
          </div>
        </div>
      )}

      {/* Create post panel */}
      {postOpen && (
        <div style={{ ...card("16px"), marginBottom:16, border:`1px solid #E1306C30` }}>
          <div style={{ fontFamily:FH, fontWeight:600, fontSize:14, marginBottom:10 }}>Create post</div>
          {postResult ? (
            <div style={{ background:C.okBg, borderRadius:8, padding:"12px 14px", fontSize:13, color:C.ok, fontFamily:FB }}>
              Published! <a href={postResult.permalink} target="_blank" rel="noopener noreferrer" style={{ color:C.ok, fontWeight:700 }}>View on Instagram ↗</a>
            </div>
          ) : (
            <>
              <div style={{ marginBottom:10 }}>
                <label style={lbl}>Caption</label>
                <textarea value={postCaption} onChange={e=>setPostCaption(e.target.value)} rows={5} style={{ ...inp({ height:110, resize:"vertical" }), fontFamily:FB, fontSize:13 }} placeholder="Write your caption here, or generate one below…" />
              </div>
              <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
                <button onClick={generateCaption} disabled={genLoading} style={{ ...btnO("#475569",12) }}>{genLoading?"Generating…":"Generate caption + image"}</button>
                <label style={{ ...btnO(C.muted,12), cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                  {uploading?"Uploading…":"Upload your own image"}
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) uploadImage(e.target.files[0]); }} disabled={uploading} />
                </label>
              </div>
              {postImg && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
                    Post image
                    <button onClick={()=>setPostImg("")} style={{ fontSize:10, color:C.err, background:"none", border:"none", cursor:"pointer", fontFamily:FB }}>Remove</button>
                  </div>
                  <img src={postImg} alt="Post preview" style={{ width:180, height:180, borderRadius:10, objectFit:"cover", border:`1px solid ${C.border}` }} />
                </div>
              )}
              <button onClick={publishPost} disabled={posting||!postCaption.trim()} style={{ ...btn("#E1306C","#fff",13), display:"flex", gap:8, alignItems:"center" }}>
                {posting&&<span style={{ width:12,height:12,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite" }}/>}
                {posting?"Publishing…":"Publish to Instagram"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Recent posts grid */}
      {media.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10, fontFamily:FB }}>Recent posts</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {media.map(m=>(
              <div key={m.id} style={{ ...card("0"), overflow:"hidden", cursor:"pointer", border:activePost?.id===m.id?`2px solid ${C.border}`:undefined }} onClick={()=>activePost?.id===m.id?setActivePost(null):loadComments(m)}>
                {(m.media_url||m.thumbnail_url) ? (
                  <img src={m.media_url||m.thumbnail_url} alt="" style={{ width:"100%", aspectRatio:"1", objectFit:"cover", display:"block" }} />
                ) : (
                  <div style={{ aspectRatio:"1", background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>{m.media_type}</span>
                  </div>
                )}
                <div style={{ padding:"6px 8px" }}>
                  <div style={{ display:"flex", gap:8, fontSize:11, color:C.muted, fontFamily:FB }}>
                    <span style={{ display:"flex",alignItems:"center",gap:3 }}><Heart size={12} aria-hidden="true" /> {m.like_count||0}</span>
                    <span style={{ display:"flex",alignItems:"center",gap:3 }}><MessageCircle size={12} aria-hidden="true" /> {m.comments_count||0}</span>
                    {m.postInsights?.impressions > 0 && <span>{m.postInsights.impressions.toLocaleString()} views</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment management panel */}
      {activePost && (
        <div style={{ ...card("14px 16px"), marginBottom:16, border:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontFamily:FH, fontWeight:600, fontSize:14 }}>Comments</div>
            <button onClick={()=>setActivePost(null)} style={{ fontSize:12, color:C.muted, background:"none", border:"none", cursor:"pointer", fontFamily:FB }}>Close</button>
          </div>
          <div style={{ fontSize:12, color:C.muted, fontFamily:FB, marginBottom:10 }}>{activePost.caption?.slice(0,80)}{activePost.caption?.length>80?"…":""}</div>

          {cmtLoading && <div style={{ fontSize:12, color:C.muted, fontFamily:FB }}>Loading comments and generating replies…</div>}

          {comments.length === 0 && !cmtLoading && <div style={{ fontSize:12, color:C.muted, fontFamily:FB }}>No comments on this post.</div>}

          {comments.map((c,i)=>(
            <div key={c.id} style={{ borderBottom:`1px solid ${C.border}`, padding:"10px 0" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:700, fontFamily:FB }}>@{c.username}</span>
                  <span style={{ fontSize:12, color:C.muted, fontFamily:FB, marginLeft:8 }}>{c.text}</span>
                </div>
                {c.replied && <span style={{ fontSize:10, color:C.ok, fontFamily:FB }}>Replied</span>}
              </div>
              {!c.replied && c.suggestedReply && (
                <div style={{ background:"#F8FAFC", borderRadius:8, padding:"8px 12px", marginTop:6 }}>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:600, fontFamily:FB, marginBottom:4 }}>Suggested reply</div>
                  <div style={{ fontSize:12, fontFamily:FB, color:C.text, marginBottom:8 }}>{c.suggestedReply}</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>replyToComment(c.id, c.suggestedReply, i)} style={{ ...btn(C.dark,"#fff",11), padding:"4px 12px" }}>Post this reply</button>
                    <button onClick={async()=>{try{const{reply}=await api.instagram.generateReply(businessId,c.text,"");setComments(p=>p.map((cm,ci)=>ci===i?{...cm,suggestedReply:reply}:cm));}catch{}}} style={{ ...btnO(C.muted,11), padding:"4px 10px" }}>Regenerate</button>
                    <button onClick={()=>api.instagram.hideComment(businessId,c.id,true)} style={{ ...btnO(C.err,11), padding:"4px 10px" }}>Hide</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && !profile && <div style={{ fontSize:12, color:C.muted, fontFamily:FB, padding:"20px 0", textAlign:"center" }}>Loading Instagram data…</div>}
    </div>
  );
}

const CHANNEL_OPTIONS = ["instagram","email","website","google","calendly","twitter","general"];

// ── Marketing Agent components → see MarketingAgent.jsx (imported above as AgentPanel) ──

function MgmtModeToggle({ mode, onChange, allowedModes }) {
  const [showPlans,    setShowPlans]    = useState(false);
  const [highlightPlan, setHighlightPlan] = useState("pro");

  const opts = [
    { value:"correlation", label:"Correlation Analysis", desc:"", minPlan:null },
    { value:"insights",    label:"Business Insights",    desc:"", minPlan:"pro",          minPlanBadge:"Pro" },
    { value:"autopilot",   label:"Operations Autopilot", desc:"", minPlan:"pro_autopilot", minPlanBadge:"Autopilot" },
  ];

  return (
    <>
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex", background:"#F1F0EF", borderRadius:12, padding:3, gap:2, marginBottom:6 }}>
          {opts.map(o => {
            const locked = !allowedModes.includes(o.value);
            const isActive = mode === o.value;
            return (
              <button key={o.value}
                onClick={()=>{
                  if (locked) { setHighlightPlan(o.minPlan||"pro"); setShowPlans(true); }
                  else onChange(o.value);
                }}
                style={{
                  flex:1, padding:"8px 10px", borderRadius:9, border:"none", cursor:"pointer",
                  fontFamily:FB, fontWeight:600, fontSize:12, transition:"all 0.15s",
                  background: isActive ? C.dark : "transparent",
                  color: locked ? "#9CA3AF" : isActive ? "#fff" : C.muted,
                  boxShadow: isActive ? "0 1px 5px rgba(0,0,0,0.18)" : "none",
                  position:"relative",
                }}>
                {o.label}
                {locked && <span style={{ position:"absolute", top:-7, right:-3, fontSize:8, background:C.dark, color:"#fff", borderRadius:8, padding:"1px 5px", fontWeight:700, letterSpacing:"0.04em" }}>{o.minPlanBadge}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>
          {opts.find(o=>o.value===mode)?.desc}
        </div>
      </div>
      {showPlans && <PlansModal highlightPlan={highlightPlan} onClose={()=>setShowPlans(false)} />}
    </>
  );
}

// ── STRATEGY & CORRELATION ────────────────────────────────────────────────────

// getValue mirrors how each canvas card aggregates its displayed total so that
// correlation values always match what the user sees on the canvas.
// sentiment: "positive" = going up is good; "negative" = going up is bad.
const LINK_FIELDS = [
  { id:"revenue",     label:"Revenue",        sentiment:"positive",
    getValue: m => m?.revenue?.this_month||0,
    path:"revenue.this_month",        snapKey:"revenue",     prefix:"$" },
  { id:"costs",       label:"Costs",          sentiment:"negative",
    getValue: m => (m?.costs?.this_month||0)+(m?.investments?.total_initial||0)+(m?.investments?.total_ongoing||0),
    path:"costs.this_month",          snapKey:"costs",       prefix:"$" },
  { id:"profit",      label:"Profit",         sentiment:"positive",
    getValue: m => { const r=m?.revenue?.this_month||0; const c=(m?.costs?.this_month||0)+(m?.investments?.total_initial||0)+(m?.investments?.total_ongoing||0); return Math.max(0,r-c); },
    path:"",                          snapKey:"profit",      prefix:"$" },
  { id:"loss",        label:"Loss",           sentiment:"negative",
    getValue: m => { const r=m?.revenue?.this_month||0; const c=(m?.costs?.this_month||0)+(m?.investments?.total_initial||0)+(m?.investments?.total_ongoing||0); return Math.max(0,c-r); },
    path:"",                          snapKey:"loss",        prefix:"$" },
  { id:"leads",       label:"Leads",          sentiment:"positive",
    getValue: m => m?.leads?.this_month||0,
    path:"leads.this_month",          snapKey:"leads",       prefix:""  },
  { id:"clients",     label:"Active Clients", sentiment:"positive",
    getValue: m => m?.clients?.active||0,
    path:"clients.active",            snapKey:"clients",     prefix:""  },
  { id:"bookings",    label:"Bookings",       sentiment:"positive",
    getValue: m => m?.bookings?.this_month||0,
    path:"bookings.this_month",       snapKey:"bookings",    prefix:""  },
  { id:"investments", label:"Investments",    sentiment:"negative",
    getValue: m => (m?.investments?.total_initial||0)+(m?.investments?.total_ongoing||0),
    path:"investments.total_ongoing", snapKey:"investments", prefix:"$" },
];

// Semantic colour: green when metric moves in a "good" direction, red when "bad"
function _semanticClr(sentiment, series) {
  if (!series||series.length<2) return C.text;
  const delta = series[series.length-1] - series[0];
  if (Math.abs(delta)<0.001) return C.muted;
  return (sentiment==="positive") === (delta>0) ? "#22C55E" : "#EF4444";
}

function _getFieldVal(metrics, path) {
  return path.split(".").reduce((o,k)=>o?.[k], metrics)||0;
}

function _pearson(xs, ys) {
  const n=xs.length; if(n<2) return null;
  const mx=xs.reduce((a,b)=>a+b,0)/n, my=ys.reduce((a,b)=>a+b,0)/n;
  const num=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0);
  const dx=Math.sqrt(xs.reduce((s,x)=>s+(x-mx)**2,0));
  const dy=Math.sqrt(ys.reduce((s,y)=>s+(y-my)**2,0));
  return dx*dy===0?null:+(num/(dx*dy)).toFixed(2);
}

// Raw item arrays for each field — same sources the canvas cards read
function _fieldItems(metrics, businessId, fieldId) {
  if (fieldId==="revenue")     return metrics?.revenue?.sources||[];
  if (fieldId==="costs")       return [...(metrics?.costs?.causes||[]),...(metrics?.investments?.initial||[]),...(metrics?.investments?.ongoing||[])];
  if (fieldId==="investments") return [...(metrics?.investments?.initial||[]),...(metrics?.investments?.ongoing||[])];
  if (fieldId==="leads")   { try{ return JSON.parse(localStorage.getItem(`earnedlab_leads_${businessId}`)||"[]"); }catch{ return []; } }
  if (fieldId==="clients") { try{ return JSON.parse(localStorage.getItem(`earnedlab_clients_${businessId}`)||"[]"); }catch{ return []; } }
  return null; // profit/loss = derived; bookings/reviews = scalar
}

// Compute a field's value for a date range using actual item arrays (mirrors canvas card logic)
function _fieldRangeVal(fieldId, metrics, businessId, mode, cStart, cEnd) {
  if (fieldId==="bookings") return mode==="week"?(metrics?.bookings?.this_week||0):(metrics?.bookings?.this_month||0);
  if (fieldId==="reviews")  return metrics?.social?.google_reviews||0;
  if (fieldId==="profit"||fieldId==="loss") {
    const rev  = filterDateRange(metrics?.revenue?.sources||[], mode, cStart, cEnd).reduce((a,x)=>a+(x.amount||0),0);
    const cost = filterDateRange([...(metrics?.costs?.causes||[]),...(metrics?.investments?.initial||[]),...(metrics?.investments?.ongoing||[])], mode, cStart, cEnd).reduce((a,x)=>a+(x.amount||0),0);
    return fieldId==="profit"?Math.max(0,rev-cost):Math.max(0,cost-rev);
  }
  const items = _fieldItems(metrics, businessId, fieldId);
  if (!items) return 0;
  const filtered = filterDateRange(items, mode, cStart, cEnd);
  return (fieldId==="leads"||fieldId==="clients") ? filtered.length : filtered.reduce((a,x)=>a+(x.amount||0),0);
}

// Generate sub-period time series for sparklines and Pearson r
function _fieldTimeSeries(fieldId, metrics, businessId, mode, cStart, cEnd) {
  if (fieldId==="bookings"||fieldId==="reviews") return null; // scalar — no time series
  const now=new Date(); let buckets=[];
  if (mode==="week") {
    for (let i=6;i>=0;i--) { const d=new Date(now.getTime()-i*86400000).toISOString().slice(0,10); buckets.push({s:d,e:d}); }
  } else if (mode==="month") {
    const first=new Date(now.getFullYear(),now.getMonth(),1);
    const last =new Date(now.getFullYear(),now.getMonth()+1,0);
    for (let d=new Date(first);d<=last;d.setDate(d.getDate()+7)) {
      const s=d.toISOString().slice(0,10);
      const e=new Date(Math.min(d.getTime()+6*86400000,last.getTime())).toISOString().slice(0,10);
      buckets.push({s,e});
    }
  } else if (mode==="year") {
    for (let m=0;m<=now.getMonth();m++) {
      const s=`${now.getFullYear()}-${String(m+1).padStart(2,"0")}-01`;
      const e=new Date(now.getFullYear(),m+1,0).toISOString().slice(0,10);
      buckets.push({s,e});
    }
  } else if (mode==="all") {
    for (let i=11;i>=0;i--) {
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      const s=d.toISOString().slice(0,7)+"-01";
      const e=new Date(d.getFullYear(),d.getMonth()+1,0).toISOString().slice(0,10);
      buckets.push({s,e});
    }
  } else if (mode==="custom"&&cStart&&cEnd) {
    const days=(new Date(cEnd)-new Date(cStart))/86400000;
    if (days<=1) return null;
    if (days<=21) {
      for (let d=new Date(cStart);d.toISOString().slice(0,10)<=cEnd;d.setDate(d.getDate()+1)) { const s=d.toISOString().slice(0,10); buckets.push({s,e:s}); }
    } else if (days<=90) {
      for (let d=new Date(cStart);d.toISOString().slice(0,10)<=cEnd;d.setDate(d.getDate()+7)) {
        const s=d.toISOString().slice(0,10);
        const e=new Date(Math.min(d.getTime()+6*86400000,new Date(cEnd).getTime())).toISOString().slice(0,10);
        buckets.push({s,e});
      }
    } else {
      for (let d=new Date(new Date(cStart).getFullYear(),new Date(cStart).getMonth(),1);d.toISOString().slice(0,10)<=cEnd;d.setMonth(d.getMonth()+1)) {
        const s=d.toISOString().slice(0,7)+"-01";
        const e=new Date(d.getFullYear(),d.getMonth()+1,0).toISOString().slice(0,10);
        buckets.push({s,e:e<=cEnd?e:cEnd});
      }
    }
  }
  if (buckets.length<2) return null;
  return buckets.map(b=>_fieldRangeVal(fieldId,metrics,businessId,"custom",b.s,b.e));
}

function MiniSparkline({ data, color=C.muted, w=130, h=44 }) {
  if(!data||data.length<2) return <div style={{ fontSize:10, color:C.muted, fontFamily:FB }}>No trend yet</div>;
  const max=Math.max(...data), min=Math.min(...data), rng=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*(w-6)+3},${h-4-(v-min)/rng*(h-10)}`).join(" ");
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((v,i)=>(
        <circle key={i} cx={(i/(data.length-1))*(w-6)+3} cy={h-4-(v-min)/rng*(h-10)} r={3} fill={color}/>
      ))}
    </svg>
  );
}

// Dual-line chart: both series normalised independently on the same canvas
function DualLineChart({ seriesA, seriesB, labelA, labelB, colorA="#3B82F6", colorB="#F59E0B", h=150 }) {
  if (!seriesA||!seriesB||seriesA.length<2) return null;
  const n   = Math.min(seriesA.length, seriesB.length);
  const sA  = seriesA.slice(0,n), sB = seriesB.slice(0,n);
  const pad = { t:16, b:18, l:6, r:6 };
  // each series gets its own y-scale so both fill the chart height
  const scaleY = (arr) => { const mn=Math.min(...arr), mx=Math.max(...arr), rng=mx-mn||1; return v=>pad.t+(h-pad.t-pad.b)*(1-(v-mn)/rng); };
  const yA = scaleY(sA), yB = scaleY(sB);
  const xOf = i => pad.l + (n>1 ? i/(n-1) : 0.5) * (400-pad.l-pad.r); // logical coords; SVG viewBox handles width
  const polyA = sA.map((v,i)=>`${xOf(i)},${yA(v)}`).join(" ");
  const polyB = sB.map((v,i)=>`${xOf(i)},${yB(v)}`).join(" ");
  const areaA = `M${xOf(0)},${h-pad.b} `+sA.map((v,i)=>`L${xOf(i)},${yA(v)}`).join(" ")+` L${xOf(n-1)},${h-pad.b} Z`;
  const areaB = `M${xOf(0)},${h-pad.b} `+sB.map((v,i)=>`L${xOf(i)},${yB(v)}`).join(" ")+` L${xOf(n-1)},${h-pad.b} Z`;
  return (
    <div style={{ marginBottom:12 }}>
      {/* Legend */}
      <div style={{ display:"flex", gap:14, marginBottom:6 }}>
        {[{lbl:labelA,clr:colorA},{lbl:labelB,clr:colorB}].map(({lbl,clr})=>(
          <div key={lbl} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <svg width={18} height={4}><rect y={1} width={18} height={2} rx={1} fill={clr}/></svg>
            <span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>{lbl}</span>
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 400 ${h}`} style={{ width:"100%", display:"block", overflow:"visible" }}>
        {/* Grid lines */}
        {[0.25,0.5,0.75].map(f=>(
          <line key={f} x1={pad.l} y1={pad.t+(h-pad.t-pad.b)*f} x2={400-pad.r} y2={pad.t+(h-pad.t-pad.b)*f}
            stroke="#E2E8F0" strokeWidth={0.8} strokeDasharray="4,4"/>
        ))}
        {/* Area fills */}
        <path d={areaA} fill={colorA} fillOpacity={0.07}/>
        <path d={areaB} fill={colorB} fillOpacity={0.07}/>
        {/* Lines */}
        <polyline points={polyA} fill="none" stroke={colorA} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points={polyB} fill="none" stroke={colorB} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/>
        {/* Dots */}
        {sA.map((v,i)=><circle key={`a${i}`} cx={xOf(i)} cy={yA(v)} r={3} fill={colorA}/>)}
        {sB.map((v,i)=><circle key={`b${i}`} cx={xOf(i)} cy={yB(v)} r={3} fill={colorB}/>)}
        {/* End-point value labels */}
        <text x={xOf(n-1)+6} y={yA(sA[n-1])+4} fontSize={9} fill={colorA} fontFamily="sans-serif">{sA[n-1].toLocaleString()}</text>
        <text x={xOf(n-1)+6} y={yB(sB[n-1])+4} fontSize={9} fill={colorB} fontFamily="sans-serif">{sB[n-1].toLocaleString()}</text>
      </svg>
    </div>
  );
}

// Statistical insights computed from the two time series
function _corrStats(seriesA, seriesB, aF, bF) {
  if (!seriesA||!seriesB||seriesA.length<2) return [];
  const n  = Math.min(seriesA.length, seriesB.length);
  const sA = seriesA.slice(0,n), sB = seriesB.slice(0,n);
  const mean = a => a.reduce((s,v)=>s+v,0)/a.length;
  const std  = a => { const m=mean(a); return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/a.length); };
  const chg  = a => a[0]===0 ? null : +((a[n-1]-a[0])/Math.abs(a[0])*100).toFixed(1);
  const r    = _pearson(sA,sB);
  const insights = [];

  // 1. R² explained variance
  if (r!==null) {
    const r2 = +(r*r*100).toFixed(1);
    insights.push({ label:"Explained Variance (R²)", value:`${r2}%`,
      desc: r2>50?`${aF.label} accounts for ${r2}% of the variation in ${bF.label} — strong predictive link`
          : r2>20?`${aF.label} accounts for ${r2}% of ${bF.label} variation — moderate relationship`
          :`Only ${r2}% of ${bF.label} variation is explained by ${aF.label}`,
      clr: r2>50?"#22C55E":r2>20?"#F59E0B":C.muted });
  }

  // 2. Trend direction — A (semantic: positive-sentiment up = good, negative-sentiment up = bad)
  const cA = chg(sA);
  if (cA!==null) {
    const goodA = aF.sentiment==="positive" ? cA>0 : cA<0;
    insights.push({ label:`${aF.label} Trend`, value:`${cA>0?"+":""}${cA}%`,
      desc: cA>0?`${aF.label} grew ${cA}% over this period`:cA<0?`${aF.label} fell ${Math.abs(cA)}% over this period`:`${aF.label} was flat`,
      clr: cA===0?C.muted:goodA?"#22C55E":"#EF4444" });
  }

  // 3. Trend direction — B (semantic)
  const cB = chg(sB);
  if (cB!==null) {
    const goodB = bF.sentiment==="positive" ? cB>0 : cB<0;
    insights.push({ label:`${bF.label} Trend`, value:`${cB>0?"+":""}${cB}%`,
      desc: cB>0?`${bF.label} grew ${cB}% over this period`:cB<0?`${bF.label} fell ${Math.abs(cB)}% over this period`:`${bF.label} was flat`,
      clr: cB===0?C.muted:goodB?"#22C55E":"#EF4444" });
  }

  // 4. Volatility — A (coefficient of variation)
  const mA=mean(sA); if (mA>0) {
    const cv=+(std(sA)/mA*100).toFixed(1);
    insights.push({ label:`${aF.label} Volatility`, value:`CV ${cv}%`,
      desc: cv>50?`${aF.label} is highly erratic (${cv}% CV) — results are unpredictable period-to-period`
          : cv>20?`${aF.label} shows moderate fluctuation (${cv}% CV)`:`${aF.label} is consistent (${cv}% CV)`,
      clr: cv>50?"#EF4444":cv>20?"#F59E0B":"#22C55E" });
  }

  // 5. Volatility — B
  const mB=mean(sB); if (mB>0) {
    const cv=+(std(sB)/mB*100).toFixed(1);
    insights.push({ label:`${bF.label} Volatility`, value:`CV ${cv}%`,
      desc: cv>50?`${bF.label} is highly erratic (${cv}% CV)`
          : cv>20?`${bF.label} shows moderate fluctuation (${cv}% CV)`:`${bF.label} is consistent (${cv}% CV)`,
      clr: cv>50?"#EF4444":cv>20?"#F59E0B":"#22C55E" });
  }

  // 6. Lag correlation — does A lead B by 1 period?
  if (n>2 && r!==null) {
    const rLag=_pearson(sA.slice(0,-1),sB.slice(1));
    if (rLag!==null) {
      const stronger=Math.abs(rLag)>Math.abs(r)+0.05;
      insights.push({ label:"Leading Indicator", value:stronger?`${aF.label} leads`:"Concurrent",
        desc: stronger?`${aF.label} predicts ${bF.label} 1 period ahead (lag r=${rLag} vs concurrent r=${r})`
            :`${aF.label} and ${bF.label} move together — neither leads the other`,
        clr: stronger?"#8B5CF6":C.muted });
    }
  }

  // 7. B-per-A ratio trend (semantic: good if B-sentiment says growing is good)
  const ratios=sA.map((a,i)=>a>0?sB[i]/a:null).filter(x=>x!==null);
  if (ratios.length>=2) {
    const rt=ratios[ratios.length-1]>ratios[0]+0.01?"increasing":ratios[ratios.length-1]<ratios[0]-0.01?"decreasing":"stable";
    const px=bF.prefix||"";
    const ratioGood = rt==="stable" ? null : (bF.sentiment==="positive") === (rt==="increasing");
    insights.push({ label:`${px}${bF.label} per ${aF.label} ratio`,
      value:rt==="increasing"?"Growing ↑":rt==="decreasing"?"Shrinking ↓":"Stable →",
      desc:`For every unit of ${aF.label}, ${bF.label} is ${rt} over this period (${px}${ratios[0].toFixed(2)} → ${px}${ratios[ratios.length-1].toFixed(2)})`,
      clr:ratioGood===null?C.muted:ratioGood?"#22C55E":"#EF4444" });
  }

  // 8. Peak period
  const pkA=sA.indexOf(Math.max(...sA)), pkB=sB.indexOf(Math.max(...sB));
  insights.push({ label:"Peak Periods", value:`Period ${pkA+1} / ${pkB+1}`,
    desc:`${aF.label} peaked at period ${pkA+1} (${sA[pkA].toLocaleString()}); ${bF.label} peaked at period ${pkB+1} (${sB[pkB].toLocaleString()})`,
    clr:C.muted });

  return insights;
}

function CorrelationPair({ link, metrics, businessId, applied, onApplyToStrategy, onRemove, corrMode="all", corrStart="", corrEnd="" }) {
  const [overrideMode, setOverrideMode] = useState(null);
  const [ovStart, setOvStart] = useState("");
  const [ovEnd,   setOvEnd]   = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const aF=LINK_FIELDS.find(f=>f.id===link.a);
  const bF=LINK_FIELDS.find(f=>f.id===link.b);
  if(!aF||!bF) return null;

  const mode   = overrideMode || corrMode;
  const cStart = overrideMode ? ovStart : corrStart;
  const cEnd   = overrideMode ? ovEnd   : corrEnd;

  const aVal    = _fieldRangeVal(link.a, metrics, businessId, mode, cStart, cEnd);
  const bVal    = _fieldRangeVal(link.b, metrics, businessId, mode, cStart, cEnd);
  const seriesA = _fieldTimeSeries(link.a, metrics, businessId, mode, cStart, cEnd);
  const seriesB = _fieldTimeSeries(link.b, metrics, businessId, mode, cStart, cEnd);
  const r       = (seriesA&&seriesB) ? _pearson(seriesA, seriesB) : null;
  const perUnit = aVal>0 ? (bVal/aVal).toFixed(2) : null;
  const stats   = _corrStats(seriesA, seriesB, aF, bF);

  const sClrA      = _semanticClr(aF.sentiment, seriesA);
  const sClrB      = _semanticClr(bF.sentiment, seriesB);
  const tileClrA   = (sClrA===C.text||sClrA===C.muted) ? "#3B82F6" : sClrA;
  const tileClrB   = (sClrB===C.text||sClrB===C.muted) ? "#64748B" : sClrB;
  const rangeLabel = mode==="day"?"Today":mode==="week"?"This Week":mode==="month"?"This Month":mode==="year"?"This Year":mode==="all"?"All Time":(cStart&&cEnd)?`${cStart} – ${cEnd}`:"All Time";
  const rLabel     = r===null?"Need more periods":r>0.7?"Strong positive":r>0.3?"Moderate positive":r<-0.7?"Strong negative":r<-0.3?"Moderate negative":"Weak correlation";
  const rClr       = r===null?C.muted:r>0.3?"#22C55E":r<-0.3?"#EF4444":"#F59E0B";
  const summary    = perUnit!==null
    ? `Each +1 ${aF.label} → ${bF.prefix||aF.prefix||""}${perUnit} ${bF.label}`
    : `${aF.label}: ${aF.prefix||""}${aVal.toLocaleString()} | ${bF.label}: ${bF.prefix||""}${bVal.toLocaleString()}`;

  return (
    <div style={{ background:C.surface, borderRadius:12, padding:"16px 18px", marginBottom:12, border:`1px solid ${C.border}` }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:13 }}>{aF.label}</span>
            <span style={{ color:C.muted, fontSize:12 }}>→</span>
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:13 }}>{bF.label}</span>
            {r!==null&&<span style={{ fontSize:10, padding:"2px 7px", borderRadius:10, background:rClr+"18", color:rClr, fontFamily:FB, fontWeight:600 }}>{rLabel} (r={r})</span>}
          </div>
          <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{summary}</div>
        </div>
        <button onClick={onRemove} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:"0 4px", flexShrink:0, marginLeft:6 }}>×</button>
      </div>

      {/* Value tiles */}
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        {[{f:aF,v:aVal,clr:tileClrA},{f:bF,v:bVal,clr:tileClrB}].map(({f,v,clr})=>(
          <div key={f.id} style={{ flex:1, background:"#F8FAFC", borderRadius:8, padding:"9px 12px", border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginBottom:2 }}>{f.label}</div>
            <div style={{ fontFamily:FH, fontWeight:700, fontSize:22, color:clr, letterSpacing:"-0.02em", lineHeight:1 }}>{f.prefix||""}{v.toLocaleString()}</div>
            <div style={{ fontSize:9, color:C.muted, fontFamily:FB, marginTop:3 }}>{rangeLabel}</div>
          </div>
        ))}
      </div>

      {/* Dual-line chart */}
      {seriesA&&seriesB&&seriesA.length>=2&&(
        <DualLineChart
          seriesA={seriesA} seriesB={seriesB}
          labelA={aF.label}  labelB={bF.label}
          colorA={tileClrA}  colorB={tileClrB}
          h={150}
        />
      )}
      {(!seriesA||seriesA.length<2)&&(
        <div style={{ fontSize:11, color:C.muted, fontFamily:FB, textAlign:"center", padding:"14px 0", marginBottom:10, background:"#F8FAFC", borderRadius:8, border:`1px dashed ${C.border}` }}>
          Add more data across different periods to see trend lines
        </div>
      )}

      {/* Statistical insights */}
      {stats.length>0&&(
        <div style={{ marginBottom:12 }}>
          <button onClick={()=>setShowStats(p=>!p)}
            style={{ fontSize:10, fontWeight:600, color:C.muted, background:"none", border:"none", cursor:"pointer", fontFamily:FB, padding:"0 0 6px 0", display:"flex", alignItems:"center", gap:4 }}>
            Statistical Insights ({stats.length}) {showStats?"▴":"▾"}
          </button>
          {showStats&&(
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              {stats.map((s,i)=>(
                <div key={i} style={{ background:"#F8FAFC", borderRadius:8, padding:"8px 10px", border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:9, color:C.muted, fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:2 }}>{s.label}</div>
                  <div style={{ fontFamily:FH, fontWeight:700, fontSize:13, color:s.clr, marginBottom:2 }}>{s.value}</div>
                  <div style={{ fontSize:10, color:C.muted, fontFamily:FB, lineHeight:1.4 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Per-pair range override */}
      <div style={{ marginBottom:10 }}>
        <button onClick={()=>setShowOverride(p=>!p)} style={{ fontSize:10, color:overrideMode?C.primary:C.muted, background:"none", border:"none", cursor:"pointer", fontFamily:FB, padding:0 }}>
          {overrideMode?`Range: ${rangeLabel} (override)`:"Override date range"} {showOverride?"▴":"▾"}
        </button>
        {showOverride&&(
          <div style={{ marginTop:6, display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            <select value={overrideMode||""} onChange={e=>setOverrideMode(e.target.value||null)}
              style={{ fontSize:11, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:8, background:C.surface, color:C.text, fontFamily:FB }}>
              <option value="">Use global range</option>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
              <option value="custom">Custom</option>
            </select>
            {overrideMode==="custom"&&<>
              <input type="date" value={ovStart} onChange={e=>setOvStart(e.target.value)} style={{ ...inp(), fontSize:11, padding:"4px 8px", flex:1, minWidth:100 }}/>
              <span style={{ color:C.muted, fontSize:11 }}>–</span>
              <input type="date" value={ovEnd}   onChange={e=>setOvEnd(e.target.value)}   style={{ ...inp(), fontSize:11, padding:"4px 8px", flex:1, minWidth:100 }}/>
            </>}
          </div>
        )}
      </div>

      {onApplyToStrategy&&(
        <button onClick={()=>onApplyToStrategy({ ...link, aLabel:aF.label, bLabel:bF.label, r, summary })}
          style={{ ...applied?btn("#22C55E","#fff",11):btnO("#475569",11), padding:"5px 12px" }}>
          {applied?<><Check size={14} style={{display:"inline-block",verticalAlign:"middle",marginRight:4}} aria-hidden="true"/>Applied to strategy</>:"Apply to strategy"}
        </button>
      )}
    </div>
  );
}

function buildMarketingPayload(strategy, timeframe, metrics) {
  const date = new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  const biz   = metrics?.businessProfile||{};
  const lines = [
    `[MANAGEMENT → MARKETING] Strategy Sync`,
    `Timeframe: ${timeframe}  |  Generated: ${date}`,
    biz.uniqueValueProp ? `Business: ${biz.uniqueValueProp}` : "",
    ``,
  ].filter(l=>l!==undefined);

  const outreachItems = strategy.outreach?.suggestions||[];
  if(outreachItems.length){
    lines.push(`CHANNEL PRIORITIES`);
    outreachItems.slice(0,4).forEach(s=>lines.push(`• ${s}`));
    if((strategy.outreach?.monthlySpend||0)>0) lines.push(`Budget: $${strategy.outreach.monthlySpend.toLocaleString()}/mo`);
    lines.push(``);
  }

  const scalingItems = strategy.scaling?.suggestions||[];
  if(scalingItems.length){
    lines.push(`AUDIENCE EXPANSION`);
    scalingItems.slice(0,3).forEach(s=>lines.push(`• ${s}`));
    lines.push(``);
  }

  const buildingItems = strategy.building?.suggestions||[];
  if(buildingItems.length){
    lines.push(`CONTENT & ASSETS`);
    buildingItems.slice(0,3).forEach(s=>lines.push(`• ${s}`));
    lines.push(``);
  }

  const conservItems = strategy.conservation?.actions||[];
  if(conservItems.length){
    lines.push(`SPEND CONSERVATION`);
    conservItems.slice(0,2).forEach(s=>lines.push(`• ${s}`));
    lines.push(``);
  }

  if((strategy.budget?.monthly||0)>0){
    lines.push(`BUDGET`);
    lines.push(`• Monthly: $${strategy.budget.monthly.toLocaleString()}/mo`);
    if(strategy.budget?.rationale) lines.push(`• ${strategy.budget.rationale}`);
    lines.push(``);
  }

  const outcomes = strategy.predictedOutcomes||[];
  if(outcomes.length){
    lines.push(`GROWTH TARGETS`);
    outcomes.slice(0,3).forEach(o=>lines.push(`• ${o}`));
    lines.push(``);
  }

  const week1 = (strategy.taskSchedule||[]).find(p=>/week\s*1|w1/i.test(p.period));
  if(week1?.tasks?.length){
    lines.push(`THIS WEEK`);
    week1.tasks.slice(0,3).forEach(t=>lines.push(`• ${t}`));
  }

  return lines.join("\n").trim();
}

function StatStrategyInsights({ links, metrics, businessId, corrMode, corrStart, corrEnd }) {
  if (!links||links.length===0) return (
    <div style={{ background:"#F8FAFC", borderRadius:10, padding:"16px 18px", border:`1px solid ${C.border}` }}>
      <div style={{ fontSize:12, color:C.muted, fontFamily:FB, lineHeight:1.6 }}>
        Add at least one metric pair above to see statistical business insights.
      </div>
    </div>
  );

  const pairs = links.map(link=>{
    const aF=LINK_FIELDS.find(f=>f.id===link.a);
    const bF=LINK_FIELDS.find(f=>f.id===link.b);
    if(!aF||!bF) return null;
    const aVal=_fieldRangeVal(link.a,metrics,businessId,corrMode,corrStart,corrEnd);
    const bVal=_fieldRangeVal(link.b,metrics,businessId,corrMode,corrStart,corrEnd);
    const sA=_fieldTimeSeries(link.a,metrics,businessId,corrMode,corrStart,corrEnd);
    const sB=_fieldTimeSeries(link.b,metrics,businessId,corrMode,corrStart,corrEnd);
    const r=(sA&&sB)?_pearson(sA,sB):null;
    const n=sA&&sB?Math.min(sA.length,sB.length):0;
    const chgA=sA&&sA.length>=2&&sA[0]!==0?+((sA[n-1]-sA[0])/Math.abs(sA[0])*100).toFixed(1):null;
    const chgB=sB&&sB.length>=2&&sB[0]!==0?+((sB[n-1]-sB[0])/Math.abs(sB[0])*100).toFixed(1):null;
    return {aF,bF,aVal,bVal,sA,sB,r,chgA,chgB};
  }).filter(Boolean);

  const insights = [];
  const seen = new Set();
  const add = (ins) => { if(!seen.has(ins.title)){seen.add(ins.title);insights.push(ins);} };

  pairs.forEach(({aF,bF,r,aVal,bVal,chgA,chgB})=>{
    // Strong / moderate correlations
    if(r!==null){
      const abs=Math.abs(r);
      const dir=r>0?"positive":"negative";
      if(abs>0.7){
        let text;
        if(r>0&&aF.sentiment==="positive"&&bF.sentiment==="positive")
          text=`${aF.label} and ${bF.label} grow together (r=${r}). Doubling down on ${aF.label} acquisition is likely to lift ${bF.label}.`;
        else if(r>0&&aF.sentiment==="negative"&&bF.sentiment==="negative")
          text=`Both ${aF.label} and ${bF.label} rise together. This compounding cost pressure warrants a cost structure review.`;
        else if(r>0&&aF.sentiment==="positive"&&bF.sentiment==="negative")
          text=`As ${aF.label} grows, ${bF.label} also rises (r=${r}). Strong growth is driving up costs — evaluate whether the margin holds.`;
        else if(r<0&&aF.sentiment==="positive"&&bF.sentiment==="negative")
          text=`Rising ${aF.label} correlates with falling ${bF.label} (r=${r}). This is an efficiency win — scaling ${aF.label} appears to reduce ${bF.label}.`;
        else
          text=`${aF.label} and ${bF.label} have a strong ${dir} relationship (r=${r}). Monitor this pair closely as they move predictably together.`;
        add({icon:"◆",clr:"#22C55E",title:`${aF.label} ↔ ${bF.label}: Strong ${dir} correlation (r=${r})`,text});
      } else if(abs>0.3){
        add({icon:"◇",clr:"#F59E0B",
          title:`${aF.label} ↔ ${bF.label}: Moderate correlation (r=${r})`,
          text:`${aF.label} and ${bF.label} show a directional relationship but results aren't fully predictable. More data periods will clarify the signal.`});
      } else if(abs<=0.3&&r!==null){
        add({icon:"○",clr:C.muted,
          title:`${aF.label} ↔ ${bF.label}: Weak correlation (r=${r})`,
          text:`These two metrics move independently. Optimising one will likely not move the other.`});
      }
    }
    // Trend warnings: negative-sentiment metric rising
    if(aF.sentiment==="negative"&&chgA!==null&&chgA>10)
      add({icon:"▲",clr:"#EF4444",
        title:`${aF.label} up ${chgA}% this period`,
        text:`${aF.label} has grown ${chgA}% over the selected range. Review whether this increase is planned investment or uncontrolled overhead.`});
    if(bF.sentiment==="negative"&&chgB!==null&&chgB>10)
      add({icon:"▲",clr:"#EF4444",
        title:`${bF.label} up ${chgB}% this period`,
        text:`${bF.label} has grown ${chgB}% over the selected range. Identify the largest contributors and evaluate whether the spend is generating returns.`});
    // Growth signals: positive-sentiment metric rising
    if(aF.sentiment==="positive"&&chgA!==null&&chgA>5)
      add({icon:"↑",clr:"#22C55E",
        title:`${aF.label} growing ${chgA}%`,
        text:`${aF.label} is trending upward by ${chgA}%. Identify which specific actions or channels drove this and reinforce them.`});
    if(bF.sentiment==="positive"&&chgB!==null&&chgB>5)
      add({icon:"↑",clr:"#22C55E",
        title:`${bF.label} growing ${chgB}%`,
        text:`${bF.label} is on a ${chgB}% upward trend. This is a positive signal — analyse what's working and scale it.`});
    // Specific conversion insight: leads → revenue
    const isLeadRev = (aF.id==="leads"&&bF.id==="revenue")||(aF.id==="revenue"&&bF.id==="leads");
    if(isLeadRev&&aVal>0&&bVal>0){
      const leads=aF.id==="leads"?aVal:bVal;
      const rev  =aF.id==="revenue"?aVal:bVal;
      const rpl  =(rev/leads).toFixed(2);
      add({icon:"→",clr:"#8B5CF6",
        title:`Revenue per Lead: $${rpl}`,
        text:`Each lead is currently generating $${rpl} in revenue on average. Improving lead quality or conversion rate would directly lift this.`});
    }
    // Specific margin insight: revenue + costs or profit
    const isRevCost = (aF.id==="revenue"&&bF.id==="costs")||(aF.id==="costs"&&bF.id==="revenue");
    if(isRevCost&&aVal>0&&bVal>0){
      const rev  =aF.id==="revenue"?aVal:bVal;
      const cost =aF.id==="costs"?aVal:bVal;
      const margin=((rev-cost)/rev*100).toFixed(1);
      const marginNum=parseFloat(margin);
      add({icon:"%",clr:marginNum>30?"#22C55E":marginNum>0?"#F59E0B":"#EF4444",
        title:`Margin: ${margin}%`,
        text:marginNum>30?`Healthy ${margin}% margin. Focus on scaling revenue while keeping cost growth proportional.`
            :marginNum>0?`Thin ${margin}% margin. A 10% cost reduction or revenue increase would have outsized profitability impact.`
            :`Negative margin (${margin}%). Costs exceed revenue — prioritise revenue growth or an immediate cost audit.`});
    }
  });

  if(insights.length===0) return (
    <div style={{ background:"#F8FAFC", borderRadius:10, padding:"16px 18px", border:`1px solid ${C.border}` }}>
      <div style={{ fontSize:12, color:C.muted, fontFamily:FB, lineHeight:1.6 }}>
        Add more data across multiple time periods to generate statistical business insights.
      </div>
    </div>
  );

  return (
    <div>
      {insights.map((ins,i)=>(
        <div key={i} style={{ background:"#F8FAFC", borderRadius:10, padding:"12px 14px", marginBottom:8,
          border:`1px solid ${ins.clr}20`, borderLeft:`3px solid ${ins.clr}` }}>
          <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
            <span style={{ fontSize:13, color:ins.clr, flexShrink:0, lineHeight:1.5, fontWeight:700 }}>{ins.icon}</span>
            <div>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:12, color:C.text, marginBottom:3 }}>{ins.title}</div>
              <div style={{ fontSize:11, color:C.muted, fontFamily:FB, lineHeight:1.5 }}>{ins.text}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BusinessStrategySection({ businessId, metrics, snapshots, isPro, isStarter=false, mgmtMode="correlation", saveM, isAutopilot=false, onNotify, refreshTasks, insightsBudget, refreshBudget }) {
  // Derived from mode selection + plan capability
  const showStrategy    = isPro && (mgmtMode === "insights" || mgmtMode === "autopilot");
  const activeAutopilot = isAutopilot && mgmtMode === "autopilot";
  const LINKS_KEY         = `earnedlab_links_${businessId}`;
  const STRAT_KEY         = `earnedlab_strat_${businessId}`;
  const STRAT_AUTORUN_KEY = `earnedlab_strat_autorun_${businessId}`;
  const STRAT_HISTORY_KEY = `earnedlab_strat_history_${businessId}`;

  const [links,  setLinks]  = useState(()=>{ try{return JSON.parse(localStorage.getItem(LINKS_KEY)||"[]");}catch{return [];} });
  const [linking, setLinking] = useState(false);
  const [linkA,   setLinkA]   = useState("");
  const [linkB,   setLinkB]   = useState("");
  // Global date range for all correlation pairs (each pair can also override individually)
  const [corrMode,  setCorrMode]  = useState("all");
  const [corrStart, setCorrStart] = useState("");
  const [corrEnd,   setCorrEnd]   = useState("");
  const [applied,    setApplied]    = useState([]);
  const [timeframe,  setTimeframe]  = useState("3 months");
  const [generating, setGenerating] = useState(false);
  const [strategy,   setStrategy]   = useState(()=>{ try{const s=localStorage.getItem(STRAT_KEY);return s?JSON.parse(s):null;}catch{return null;} });
  const [stratTab,   setStratTab]   = useState("budget");
  const [stratErr,   setStratErr]   = useState("");
  const [expanded,      setExpanded]      = useState(true);
  const [syncing,       setSyncing]       = useState(false);
  const [showMktgPrev,  setShowMktgPrev]  = useState(false);
  const [syncedAt,      setSyncedAt]      = useState(()=>{ try{return localStorage.getItem(`earnedlab_strat_mktgsync_${businessId}`);}catch{return null;} });
  const autoRunTimerRef = useRef(null);
  const MKTG_SYNC_KEY = `earnedlab_strat_mktgsync_${businessId}`;

  const saveLinks = l=>{ setLinks(l); try{localStorage.setItem(LINKS_KEY,JSON.stringify(l));}catch{} };

  const insightCards = metrics?.insightCards || [];
  const saveInsightCards = cards => saveM?.("insightCards", cards);

  const addLink=()=>{
    if(!linkA||!linkB||linkA===linkB) return;
    if(!links.find(l=>l.a===linkA&&l.b===linkB)) saveLinks([...links,{ id:`lnk_${Date.now()}`, a:linkA, b:linkB }]);
    setLinking(false); setLinkA(""); setLinkB("");
  };
  const removeLink  = id=>{ saveLinks(links.filter(l=>l.id!==id)); setApplied(p=>p.filter(l=>l.id!==id)); };
  const toggleApply = corr=>setApplied(p=>p.find(l=>l.id===corr.id)?p.filter(l=>l.id!==corr.id):[...p,corr]);

  const syncToMarketing = async (s, tf) => {
    if(!s) return;
    const useTf = tf || timeframe;
    setSyncing(true);
    try{
      const payload = buildMarketingPayload(s, useTf, metrics);
      await api.agents.addNote(businessId, payload, "#F1F5F9");
      const now = new Date().toISOString();
      setSyncedAt(now);
      try{ localStorage.setItem(MKTG_SYNC_KEY, now); }catch{}
      onNotify?.({ id:`mktg_sync_${Date.now()}`, status:"done", message:"Strategy synced to Marketing Agent" });
    }catch(e){
      onNotify?.({ id:`mktg_sync_${Date.now()}`, status:"done", message:`Marketing sync failed: ${e.message}` });
    }
    setSyncing(false);
  };

  const generate = async(opts={})=>{
    const runTimeframe = opts.timeframe ?? timeframe;
    const runCorrs     = opts.correlations ?? applied;
    setGenerating(true); setStratErr("");
    try{
      // Compute accurate all-time financials using the same filterDateRange logic as the canvas cards.
      // Passing these from the frontend avoids server-side re-derivation bugs and localStorage inaccessibility.
      const _rv = _fieldRangeVal("revenue",     metrics, businessId, "all", "", "");
      const _co = _fieldRangeVal("costs",       metrics, businessId, "all", "", "");
      const _iv = _fieldRangeVal("investments", metrics, businessId, "all", "", "");
      const _pr = _fieldRangeVal("profit",      metrics, businessId, "all", "", "");
      const _ls = _fieldRangeVal("loss",        metrics, businessId, "all", "", "");
      const _ld = _fieldRangeVal("leads",       metrics, businessId, "all", "", "");
      const _cl = _fieldRangeVal("clients",     metrics, businessId, "all", "", "");
      const _bk = metrics?.bookings?.this_month || 0;
      const topRevSrcs = [...(metrics?.revenue?.sources||[])].sort((a,b)=>(b.amount||0)-(a.amount||0)).slice(0,4)
                          .map(s=>`${s.name||"Source"}: $${s.amount||0}`);
      const topCostItems = [...(metrics?.costs?.causes||[]),...(metrics?.investments?.initial||[]),...(metrics?.investments?.ongoing||[])]
                          .sort((a,b)=>(b.amount||0)-(a.amount||0)).slice(0,4)
                          .map(c=>`${c.name||"Cost"}: $${c.amount||0}`);
      const financials = { revenue:_rv, costs:_co, investments:_iv, profit:_pr, loss:_ls,
                           leads:_ld, activeClients:_cl, bookingsThisMonth:_bk,
                           topRevSources:topRevSrcs, topCostItems };
      const{strategy:s}=await api.metrics.strategy(businessId,{ timeframe:runTimeframe, correlations:runCorrs, snapshots, financials });
      setStrategy(s); try{localStorage.setItem(STRAT_KEY,JSON.stringify(s));}catch{}
      setStratTab("budget");
      const ranAt = new Date().toISOString();
      try{
        const hist=JSON.parse(localStorage.getItem(STRAT_HISTORY_KEY)||"[]");
        localStorage.setItem(STRAT_HISTORY_KEY,JSON.stringify([{strategy:s,ranAt,timeframe:runTimeframe},...hist].slice(0,4)));
      }catch{}
      if(opts.isAutoRun){ try{localStorage.setItem(STRAT_AUTORUN_KEY,ranAt);}catch{} }
      if(saveM){
        const newCards = buildInsightCards(s, runTimeframe);
        const existing = (metrics?.insightCards||[]).filter(c=>c.status!=="pending"||c.strategyRef!==newCards[0]?.strategyRef);
        saveInsightCards([...newCards, ...existing]);
      }
      // Auto-sync to Marketing Agent for Autopilot users in autopilot mode
      if(activeAutopilot){ syncToMarketing(s, runTimeframe).catch(()=>{}); }
      refreshBudget?.();
      return s;
    }catch(e){ setStratErr(e.message||"Generation failed — try again"); }
    finally{ setGenerating(false); }
  };

  // Weekly auto-run — only fires when plan is Pro Autopilot AND mode is Operations Autopilot
  useEffect(()=>{
    if(!isAutopilot || mgmtMode!=="autopilot") return;
    const WEEK_MS = 7*24*3600*1000;
    const lastRanStr = localStorage.getItem(STRAT_AUTORUN_KEY);
    const lastRan = lastRanStr ? new Date(lastRanStr).getTime() : 0;
    const elapsed = Date.now()-lastRan;
    const allCorrs = LINK_FIELDS.flatMap((a,i)=>LINK_FIELDS.slice(i+1).map(b=>({id:`auto_${a.id}_${b.id}`,a:a.id,b:b.id})));
    const doAutoRun = async()=>{
      const nid = `auto_strat_${Date.now()}`;
      onNotify?.({id:nid,status:"in-progress",message:"Running weekly business strategy..."});
      const s = await generate({timeframe:"4 weeks",correlations:allCorrs,isAutoRun:true});
      if(s){
        const cnt = buildInsightCards(s,"4 weeks").length;
        onNotify?.({id:nid,status:"done",message:`Weekly strategy updated — ${cnt} new insights`});
      }
    };
    if(elapsed>=WEEK_MS){
      const t=setTimeout(doAutoRun,2000);
      return ()=>clearTimeout(t);
    }
    const remaining=Math.max(60_000,WEEK_MS-elapsed);
    autoRunTimerRef.current=setTimeout(doAutoRun,remaining);
    return ()=>clearTimeout(autoRunTimerRef.current);
  },[isAutopilot, mgmtMode]); // eslint-disable-line react-hooks/exhaustive-deps


  const updateInsightCard = (id, patch) => saveInsightCards(insightCards.map(c=>c.id===id?{...c,...patch}:c));
  const archiveInsightCard = id => saveInsightCards(insightCards.filter(c=>c.id!==id));

  const promoteToTask = async (card) => {
    try {
      await api.tasks.create(businessId, { name:card.title, description:card.description||"", category:"Strategy", canAutomate:false, status:"pending" });
      updateInsightCard(card.id, { status:"done" });
      refreshTasks?.();
      onNotify?.({ id:`task_${card.id}`, status:"done", message:`Task created: ${card.title}` });
    } catch(e) { onNotify?.({ id:`task_${card.id}`, status:"done", message:`Failed to create task: ${e.message}` }); }
  };

  const autoComplete = async (card) => {
    if(!activeAutopilot) return;
    const nid = `auto_${card.id}_${Date.now()}`;
    onNotify?.({ id:nid, status:"active", message:card.title });
    await new Promise(r=>setTimeout(r,600));
    onNotify?.({ id:nid, status:"in-progress", message:card.title });
    try {
      if(card.category==="marketing") {
        const text=`[Strategy Insight — ${timeframe}]\n${card.title}\n${card.description||""}`;
        await api.agents.addNote(businessId, text, "#F1F5F9");
      } else if(card.category==="tasks"||card.category==="outcomes"||card.category==="schedule") {
        await api.tasks.create(businessId, { name:card.title, description:card.description||"", category:"Strategy", canAutomate:false, status:"pending" });
        refreshTasks?.();
      }
      const snapshot = [...insightCards];
      updateInsightCard(card.id, { status:"done" });
      await new Promise(r=>setTimeout(r,300));
      onNotify?.({ id:nid, status:"done", message:`Completed: ${card.title}`,
        onUndo: ()=>saveInsightCards(snapshot.map(c=>c.id===card.id?{...c,status:"pending"}:c))
      });
    } catch(e) {
      onNotify?.({ id:nid, status:"done", message:`Error: ${e.message}` });
    }
  };

  const runAllAutoCards = async (cards) => {
    if(!activeAutopilot || !cards.length) return;
    const PRIORITY = { high:0, medium:1, low:2 };
    const sorted = [...cards].sort((a,b)=>(PRIORITY[a.priority]??1)-(PRIORITY[b.priority]??1));
    const qnid = `autoq_${Date.now()}`;
    onNotify?.({id:qnid, status:"in-progress", message:`Starting ${sorted.length} auto task${sorted.length!==1?"s":""}…`});

    let currentBudget = insightsBudget;
    let completed = 0;
    let budgetBlocked = false;

    for(const card of sorted){
      // Re-fetch budget before any AI-consuming card
      if(card.category==="marketing"){
        try{
          const d = await api.agents.access(businessId);
          if(d.tokenBudget){ currentBudget = d.tokenBudget; refreshBudget?.(); }
        }catch{}
        const rawLimit = currentBudget?.limit || 110000;
        const rawUsed  = currentBudget?.used  || 0;
        if(rawUsed >= rawLimit * 0.92){
          budgetBlocked = true;
          onNotify?.({id:`budget_cap_${Date.now()}`, status:"done", message:`Daily budget near limit — ${sorted.length-completed} task${sorted.length-completed!==1?"s":""} skipped`});
          break;
        }
      }

      onNotify?.({id:qnid, status:"in-progress", message:`${completed+1}/${sorted.length}: ${card.title.length>42?card.title.slice(0,39)+"…":card.title}`});
      await autoComplete(card);
      completed++;

      if(card.category==="marketing") refreshBudget?.();
      if(completed < sorted.length) await new Promise(r=>setTimeout(r,2500));
    }

    onNotify?.({id:qnid, status:"done", message:`${completed} auto task${completed!==1?"s":""} complete${budgetBlocked?" (budget limit reached)":""}`});
  };

  const downloadStrategy=()=>{
    if(!strategy) return;
    const lines=[
      `BUSINESS STRATEGY — ${timeframe.toUpperCase()}`,`Generated: ${new Date().toLocaleDateString()}`,``,
      `BUDGET`, `Monthly: $${strategy.budget?.monthly||0}`, `Total: $${strategy.budget?.total||0}`, strategy.budget?.rationale||"", ``,
      `OUTREACH ($${strategy.outreach?.monthlySpend||0}/mo)`, ...(strategy.outreach?.suggestions||[]).map(s=>`• ${s}`), ``,
      `SCALING ($${strategy.scaling?.monthlySpend||0}/mo)`, ...(strategy.scaling?.suggestions||[]).map(s=>`• ${s}`), ``,
      `CONSERVATION (save $${strategy.conservation?.monthlySavings||0}/mo)`, ...(strategy.conservation?.actions||[]).map(s=>`• ${s}`), ``,
      `BUILDING ($${strategy.building?.monthlySpend||0}/mo)`, ...(strategy.building?.suggestions||[]).map(s=>`• ${s}`), ``,
      `TASK SCHEDULE`, ...(strategy.taskSchedule||[]).flatMap(p=>[p.period+":",...(p.tasks||[]).map(t=>`  - ${t}`),""]),
      `PREDICTED OUTCOMES`, ...(strategy.predictedOutcomes||[]).map(o=>`• ${o}`),
    ];
    const blob=new Blob([lines.join("\n")],{type:"text/plain"});
    const u=URL.createObjectURL(blob); const a=document.createElement("a");
    a.href=u; a.download="business-strategy.txt"; a.click(); URL.revokeObjectURL(u);
  };

  // Plan activation conditions — derived from real metrics
  const _revAT   = metrics?.revenue?.all_time||0;
  const _costAT  = metrics?.costs?.all_time||0;
  const _profitAT = Math.max(0, _revAT - _costAT);
  const _lossAT   = Math.max(0, _costAT - _revAT);
  const _leadsNow  = metrics?.leads?.this_month||0;
  const _leadsLast = metrics?.leads?.last_month||1;
  const _isNewBiz  = !_revAT || metrics?.businessProfile?.stage === "new";
  const _hasDigital = (metrics?.products||[]).some(p=>p.type==="digital");
  const _hasUndeveloped = (metrics?.products||[]).some(p=>p.status==="idea"||p.status==="development");

  const PLAN_ACTIVATION = {
    budget:       { active:true,          desc:"Always active" },
    outreach:     { active:_isNewBiz||_leadsNow<_leadsLast, desc:"Leads declining or business is new" },
    scaling:      { active:_profitAT>0,   desc:`Profit > $0 — business is profitable` },
    conservation: { active:_lossAT>0,     desc:"Loss present — costs exceed revenue" },
    building:     { active:_isNewBiz||_hasUndeveloped, desc:"New business or undeveloped assets" },
    schedule:     { active:true,          desc:"Always active" },
    outcomes:     { active:true,          desc:"Always active" },
  };

  const PLAN_STYLE = {
    budget:       { accent:"#64748B", accentBg:"#F8FAFC" },
    outreach:     { accent:"#64748B", accentBg:"#F8FAFC" },
    scaling:      { accent:"#059669", accentBg:"#F0FDF4" },
    conservation: { accent:"#DC2626", accentBg:"#FEF2F2" },
    building:     { accent:"#64748B", accentBg:"#F8FAFC" },
    schedule:     { accent:"#64748B", accentBg:"#F8FAFC" },
    outcomes:     { accent:"#059669", accentBg:"#F0FDF4" },
  };

  const TABS=[
    {id:"budget",       label:"Budget"},
    {id:"outreach",     label:"Outreach"},
    {id:"scaling",      label:"Scaling"},
    {id:"conservation", label:"Conservation"},
    {id:"building",     label:"Building"},
    {id:"schedule",     label:"Schedule"},
    {id:"outcomes",     label:"Outcomes"},
  ];

  const createPlanTasks = async (planId, items) => {
    if(!items.length||!refreshTasks) return;
    const nid = `plan_tasks_${planId}_${Date.now()}`;
    onNotify?.({id:nid, status:"in-progress", message:`Creating ${planId} plan tasks…`});
    try {
      for (const item of items) {
        await api.tasks.create(businessId, {
          name: item.text.length>80 ? item.text.slice(0,77)+"…" : item.text,
          description: item.text,
          category: planId.charAt(0).toUpperCase()+planId.slice(1),
          canAutomate: item.mode==="auto",
          status: "pending",
        });
        await new Promise(r=>setTimeout(r,150));
      }
      refreshTasks();
      onNotify?.({id:nid, status:"done", message:`${items.length} ${planId} task${items.length!==1?"s":""} created`});
    } catch(e) {
      onNotify?.({id:nid, status:"done", message:`Failed to create tasks: ${e.message}`});
    }
  };

  const renderTab=()=>{
    if(!strategy) return null;
    const { accent, accentBg } = PLAN_STYLE[stratTab]||PLAN_STYLE.budget;
    const { active, desc } = PLAN_ACTIVATION[stratTab]||{ active:true, desc:"" };

    // Build typed item lists per plan
    let items = [];
    let metric = null;

    switch(stratTab) {
      case "budget":
        metric = { label:"Monthly", value:`$${(strategy.budget?.monthly||0).toLocaleString()}`, sub:`$${(strategy.budget?.total||0).toLocaleString()} total (${timeframe})` };
        if(strategy.budget?.rationale) items.push({ text:strategy.budget.rationale, mode:"guided" });
        items.push({ text:`Allocate $${strategy.budget?.monthly||0}/mo as monthly strategy budget`, mode:"auto" });
        break;
      case "outreach":
        if((strategy.outreach?.monthlySpend||0)>0) metric = { label:"Monthly spend", value:`$${strategy.outreach.monthlySpend.toLocaleString()}` };
        items = (strategy.outreach?.suggestions||[]).map(text=>({ text, mode:"guided" }));
        break;
      case "scaling":
        if((strategy.scaling?.monthlySpend||0)>0) metric = { label:"Monthly invest", value:`$${strategy.scaling.monthlySpend.toLocaleString()}` };
        (strategy.scaling?.suggestions||[]).forEach((text,i)=>items.push({ text, mode:i<2?"auto":"guided" }));
        break;
      case "conservation":
        if((strategy.conservation?.monthlySavings||0)>0) metric = { label:"Savings target", value:`$${strategy.conservation.monthlySavings.toLocaleString()}/mo` };
        items = (strategy.conservation?.actions||[]).map(text=>({ text, mode:"guided" }));
        break;
      case "building":
        if((strategy.building?.monthlySpend||0)>0) metric = { label:"Monthly invest", value:`$${strategy.building.monthlySpend.toLocaleString()}` };
        items = (strategy.building?.suggestions||[]).map(text=>({ text, mode:_hasDigital?"auto":"guided" }));
        break;
      case "schedule":
        items = (strategy.taskSchedule||[]).flatMap(p=>(p.tasks||[]).map(t=>({ text:`${p.period}: ${t}`, mode:"auto" })));
        break;
      case "outcomes":
        items = (strategy.predictedOutcomes||[]).map(text=>({ text, mode:"auto" }));
        break;
      default: return null;
    }

    const autoItems   = items.filter(i=>i.mode==="auto");
    const guidedItems = items.filter(i=>i.mode==="guided");

    const itemRow = (item, idx, arr, rowAccent, rowBg) => (
      <div key={idx} style={{ display:"flex", gap:10, padding:"9px 0", borderBottom:idx<arr.length-1?`1px solid ${C.border}`:"none", alignItems:"flex-start" }}>
        <div style={{ width:20,height:20,borderRadius:"50%",background:rowBg,color:rowAccent,fontFamily:FH,fontWeight:700,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1 }}>{idx+1}</div>
        <div style={{ flex:1, fontSize:13, color:C.text, fontFamily:FB, lineHeight:1.6 }}>{item.text}</div>
        <span style={{ fontSize:9, color:rowAccent, background:rowBg, padding:"2px 7px", borderRadius:10, fontFamily:FB, fontWeight:700, flexShrink:0, textTransform:"uppercase", letterSpacing:"0.05em", marginTop:2 }}>
          {item.mode==="auto"?"Auto":"Guide"}
        </span>
      </div>
    );

    return (
      <div>
        {/* Activation + metric banner */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderRadius:10, background:active?accentBg:C.surface, marginBottom:16, border:`1px solid ${active?accent+"30":C.border}` }}>
          <div style={{ width:8,height:8,borderRadius:"50%",background:active?accent:C.muted,flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontFamily:FB, fontWeight:700, color:active?accent:C.muted }}>{active?"Plan Active":"Conditions Not Met"}</div>
            <div style={{ fontSize:10, fontFamily:FB, color:C.muted, marginTop:1 }}>{desc}</div>
          </div>
          {metric&&(
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:20, color:accent, lineHeight:1.1 }}>{metric.value}</div>
              {metric.sub&&<div style={{ fontSize:9, color:C.muted, fontFamily:FB, marginTop:1 }}>{metric.sub}</div>}
              <div style={{ fontSize:9, color:C.muted, fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.05em" }}>{metric.label}</div>
            </div>
          )}
        </div>

        {/* Auto tasks section */}
        {autoItems.length>0&&(
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              <span style={{ fontSize:9, fontFamily:FB, fontWeight:700, color:C.muted, background:"#F1F5F9", padding:"2px 9px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", display:"flex", alignItems:"center", gap:3 }}><Zap size={9} aria-hidden="true" /> Auto</span>
              {!isAutopilot&&<span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>Pro Autopilot handles these</span>}
            </div>
            {autoItems.map((item,i)=>itemRow(item,i,autoItems,C.dark,"#F1F5F9"))}
          </div>
        )}

        {/* Guided tasks section */}
        {guidedItems.length>0&&(
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              <span style={{ fontSize:9, fontFamily:FB, fontWeight:700, color:"#374151", background:C.surface, padding:"2px 9px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", border:`1px solid ${C.border}` }}>Guided</span>
              <span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>Your action required</span>
            </div>
            {guidedItems.map((item,i)=>itemRow(item,i,guidedItems,accent,accentBg))}
          </div>
        )}

        {items.length===0&&(
          <div style={{ textAlign:"center", padding:"24px 0", color:C.muted, fontSize:12, fontFamily:FB }}>
            No {stratTab} items in this strategy — regenerate with more data.
          </div>
        )}

        {/* Create plan tasks footer */}
        {items.length>0&&refreshTasks&&(
          <div style={{ marginTop:10, paddingTop:12, borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
            <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>
              {autoItems.length>0&&`${autoItems.length} auto`}{autoItems.length>0&&guidedItems.length>0&&" · "}{guidedItems.length>0&&`${guidedItems.length} guided`}
            </div>
            <button onClick={()=>createPlanTasks(stratTab,items)} style={{ ...btn(accent,"#fff",12), padding:"7px 16px" }}>
              Create {items.length} Plan Task{items.length!==1?"s":""}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ ...card("0"), overflow:"hidden", marginBottom:28 }}>
      {/* Header */}
      <div style={{ background:C.dark, padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }} onClick={()=>setExpanded(p=>!p)}>
        <div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:16, color:"#fff", marginBottom:2 }}>
            {mgmtMode === "correlation" ? "Correlation Analysis" : "Business Strategy"}
          </div>
          {activeAutopilot && (
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontFamily:FB }}>Auto-runs weekly</div>
          )}
        </div>
        <span style={{ color:"rgba(255,255,255,0.5)", fontSize:14, transform:expanded?"rotate(180deg)":"none", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
      </div>

      {expanded&&(
        <div style={{ padding:"20px 22px" }}>

          {/* ── Correlation Analysis — Correlation mode only ── */}
          {mgmtMode==="correlation"&&(
          <div style={{ marginBottom: isPro ? 0 : 0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:14, marginBottom:2 }}>Metric Correlations</div>
              </div>
              <button onClick={()=>setLinking(l=>!l)} style={{ ...btnO(C.muted,11), padding:"5px 12px", flexShrink:0 }}>
                {linking?"Cancel":"+ Add Pair"}
              </button>
            </div>

            {linking&&(
              <div style={{ display:"flex", gap:8, alignItems:"flex-end", marginBottom:12, flexWrap:"wrap", background:"#F8FAFC", borderRadius:10, padding:"12px 14px", border:`1px solid ${C.border}` }}>
                <div style={{ flex:1, minWidth:130 }}>
                  <div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginBottom:3 }}>Field A</div>
                  <select value={linkA} onChange={e=>setLinkA(e.target.value)} style={{ ...inp(), fontSize:12, padding:"7px 10px" }}>
                    <option value="">— select —</option>
                    {LINK_FIELDS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
                <span style={{ color:C.muted, fontSize:14, paddingBottom:8, flexShrink:0 }}>→</span>
                <div style={{ flex:1, minWidth:130 }}>
                  <div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginBottom:3 }}>Field B</div>
                  <select value={linkB} onChange={e=>setLinkB(e.target.value)} style={{ ...inp(), fontSize:12, padding:"7px 10px" }}>
                    <option value="">— select —</option>
                    {LINK_FIELDS.filter(f=>f.id!==linkA).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
                <button onClick={addLink} disabled={!linkA||!linkB||linkA===linkB} style={{ ...btn(C.dark,"#fff",12), padding:"8px 16px", flexShrink:0 }}>Add</button>
              </div>
            )}

            {links.length===0&&!linking&&(
              <div style={{ textAlign:"center", padding:"28px 0", color:C.muted, fontSize:12, fontFamily:FB, border:`1px dashed ${C.border}`, borderRadius:10, marginBottom:16 }}>
                Add metric pairs to start tracking correlations
              </div>
            )}

            {/* Global date range for all correlation pairs */}
            {links.length>0&&(
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12, flexWrap:"wrap" }}>
                <span style={{ fontSize:11, color:C.muted, fontFamily:FB, fontWeight:600 }}>Date range:</span>
                {["all","month","year","custom"].map(m=>(
                  <button key={m} onClick={()=>setCorrMode(m)}
                    style={{ fontSize:10, padding:"3px 10px", borderRadius:20, border:`1px solid ${corrMode===m?C.text:C.border}`, background:corrMode===m?C.dark:"transparent", color:corrMode===m?"#fff":C.muted, cursor:"pointer", fontFamily:FB, fontWeight:corrMode===m?600:400 }}>
                    {m==="all"?"All Time":m==="month"?"This Month":m==="year"?"This Year":"Custom"}
                  </button>
                ))}
                {corrMode==="custom"&&(
                  <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                    <input type="date" value={corrStart} onChange={e=>setCorrStart(e.target.value)} style={{ ...inp(), fontSize:11, padding:"3px 7px" }}/>
                    <span style={{ color:C.muted, fontSize:11 }}>–</span>
                    <input type="date" value={corrEnd}   onChange={e=>setCorrEnd(e.target.value)}   style={{ ...inp(), fontSize:11, padding:"3px 7px" }}/>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: links.length>0 ? 16 : 0 }}>
              {links.map(link=>(
                <CorrelationPair
                  key={link.id}
                  link={link}
                  metrics={metrics}
                  businessId={businessId}
                  applied={!!applied.find(l=>l.id===link.id)}
                  onApplyToStrategy={showStrategy ? (corr)=>toggleApply(corr) : null}
                  onRemove={()=>removeLink(link.id)}
                  corrMode={corrMode}
                  corrStart={corrStart}
                  corrEnd={corrEnd}
                />
              ))}
            </div>
          </div>
          )}

          {/* ── AI Strategy Generator — Business Insights and Autopilot modes only ── */}
          {showStrategy ? (
            <div style={{ borderTop:`2px solid ${C.border}`, paddingTop:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:12, flexWrap:"wrap", gap:10 }}>
                <div>
                  <div style={{ fontFamily:FH, fontWeight:700, fontSize:14, marginBottom:2 }}>Suggested Strategy</div>
                  <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>
                    {activeAutopilot ? "Manually regenerate, or let autopilot handle weekly updates" : "Generate and review — all actions require your approval"}
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <select value={timeframe} onChange={e=>setTimeframe(e.target.value)} style={{ ...inp(), fontSize:12, padding:"8px 10px" }}>
                    <option value="4 weeks">4 weeks</option>
                    <option value="3 months">3 months</option>
                    <option value="6 months">6 months</option>
                    <option value="1 year">1 year</option>
                  </select>
                  <button onClick={generate} disabled={generating} style={{ ...btn(C.dark,"#fff",13), padding:"9px 20px", flexShrink:0 }}>
                    {generating?"Generating…":"Generate Strategy"}
                  </button>
                </div>
              </div>
              {stratErr&&<div style={{ fontSize:12, color:C.err, fontFamily:FB, marginBottom:12 }}>{stratErr}</div>}

              {strategy&&(
                <div style={{ marginTop:16 }}>
                  <div style={{ display:"flex", gap:0, marginBottom:16, borderBottom:`1px solid ${C.border}`, overflowX:"auto" }}>
                    {TABS.map(t=>{
                      const ps=PLAN_STYLE[t.id]||PLAN_STYLE.budget;
                      const pa=PLAN_ACTIVATION[t.id]||{active:true};
                      const isActive=stratTab===t.id;
                      return (
                        <button key={t.id} onClick={()=>setStratTab(t.id)} style={{ padding:"7px 13px", fontFamily:FB, fontSize:12, fontWeight:isActive?700:400, color:isActive?C.text:C.muted, background:"none", border:"none", borderBottom:isActive?`2px solid ${C.text}`:"2px solid transparent", cursor:"pointer", whiteSpace:"nowrap", marginBottom:-1, display:"flex", alignItems:"center", gap:5 }}>
                          {pa.active&&<span style={{ width:5,height:5,borderRadius:"50%",background:ps.accent,flexShrink:0,opacity:isActive?1:0.6 }}/>}
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ minHeight:100 }}>{renderTab()}</div>
                  <div style={{ marginTop:18, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                      <button onClick={()=>syncToMarketing(strategy)} disabled={syncing||!strategy} style={{ ...btn(C.dark,"#fff",13) }}>
                        {syncing?"Syncing…":"Sync to Marketing Agent"}
                      </button>
                      {strategy&&(
                        <button onClick={()=>setShowMktgPrev(p=>!p)} style={{ ...btnO("#475569",12) }}>
                          {showMktgPrev?"Hide Preview":"Preview"}
                        </button>
                      )}
                      <button onClick={downloadStrategy} style={{ ...btnO(C.muted,12) }}>Download (.txt)</button>
                      {activeAutopilot&&<span style={{ fontSize:10, color:C.muted, fontFamily:FB, marginLeft:2 }}>Auto-syncs on generate</span>}
                    </div>
                    {syncedAt&&(
                      <div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginTop:5 }}>
                        Last synced: {new Date(syncedAt).toLocaleString()}
                      </div>
                    )}
                    {showMktgPrev&&strategy&&(
                      <pre style={{ fontSize:11, fontFamily:"'Courier New',monospace", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", marginTop:10, overflowX:"auto", color:C.text, lineHeight:1.65, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                        {buildMarketingPayload(strategy, timeframe, metrics)}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* Insight cards */}
              {insightCards.length>0&&(
                <div style={{ borderTop:`1px solid ${C.border}`, marginTop:20, paddingTop:20 }}>
                  <InsightCardsSection
                    cards={insightCards}
                    onUpdate={updateInsightCard}
                    onArchive={archiveInsightCard}
                    onPromoteToTask={promoteToTask}
                    isAutopilot={activeAutopilot}
                    onAutoComplete={autoComplete}
                    onRunAll={activeAutopilot ? runAllAutoCards : undefined}
                    insightsBudget={insightsBudget}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Not showing AI strategy */
            <div style={{ borderTop:`1px solid ${C.border}`, marginTop: links.length>0 ? 4 : 0, paddingTop:16 }}>
              {mgmtMode==="correlation" ? (
                /* Correlation mode: pure stat-based insights, no AI */
                <div>
                  <div style={{ fontFamily:FH, fontWeight:700, fontSize:13, marginBottom:12, color:C.text }}>Statistical Business Insights</div>
                  <StatStrategyInsights
                    links={links} metrics={metrics} businessId={businessId}
                    corrMode={corrMode} corrStart={corrStart} corrEnd={corrEnd}
                  />
                </div>
              ) : (
                /* Insights / Autopilot mode not active — upgrade prompt */
                <div style={{ background:"#F8FAFC", borderRadius:10, padding:"16px 18px", border:`1px solid ${C.border}` }}>
                  <div style={{ fontFamily:FH, fontWeight:600, fontSize:13, marginBottom:4, color:C.text }}>AI Business Strategy</div>
                  <div style={{ fontSize:12, color:C.muted, fontFamily:FB, marginBottom:10, lineHeight:1.6 }}>
                    {!isPro
                      ? "Upgrade to Business Insights (Pro plan) to generate AI-powered strategy reports using your correlation data."
                      : "Switch to Business Insights or Operations Autopilot mode to generate AI-powered strategy."}
                  </div>
                  {!isPro && (
                    <ProGate isPro={false} label="Upgrade to Business Insights">
                      <div style={{ height:48 }}/>
                    </ProGate>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ── MANAGEMENT CANVAS ──────────────────────────────────────────────────────────

const MGMT_META = {
  leads:       { label:"Leads",       icon:"", hdrBg:"#F8FAFC" },
  clients:     { label:"Clients",     icon:"", hdrBg:"#F8FAFC" },
  revenue:     { label:"Revenue",     icon:"", hdrBg:"#F8FAFC" },
  costs:       { label:"Costs",       icon:"", hdrBg:"#F8FAFC" },
  loss:        { label:"Loss",        icon:"", hdrBg:"#FEF2F2" },
  profit:      { label:"Profit",      icon:"", hdrBg:"#F0FDF4" },
  investments: { label:"Investments", icon:"", hdrBg:"#F8FAFC" },
  bookings:    { label:"Bookings",    icon:"", hdrBg:"#F8FAFC" },
  google:      { label:"Google",      icon:"", hdrBg:"#F8FAFC" },
  email:       { label:"Email",       icon:"", hdrBg:"#F8FAFC" },
};

const MGMT_DEFAULTS = {
  leads:       { x:0,   y:0,   w:340 },
  clients:     { x:360, y:0,   w:340 },
  revenue:     { x:0,   y:360, w:340 },
  costs:       { x:360, y:360, w:340 },
  profit:      { x:720, y:360, w:340 },
  loss:        { x:720, y:670, w:340 },
  investments: { x:0,   y:670, w:340 },
  bookings:    { x:360, y:670, w:340 },
  google:      { x:0,   y:980, w:340 },
  email:       { x:360, y:980, w:340 },
};

function MCell({ label, value, onChange, prefix="" }) {
  const [ed, setEd] = useState(false);
  const [v,  setV]  = useState(String(value||0));
  useEffect(()=>{ if(!ed) setV(String(value||0)); },[value,ed]);
  const save = ()=>{ onChange(Number(v)||0); setEd(false); };
  return (
    <div style={{ flex:1, background:C.surface, borderRadius:10, padding:"10px 12px", minWidth:0 }}>
      <div style={{ fontSize:9, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", fontFamily:FB, marginBottom:4 }}>{label}</div>
      {ed ? (
        <div style={{ display:"flex", gap:4 }}>
          <input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} autoFocus style={{ flex:1, fontSize:16, padding:"3px 8px", border:`1px solid ${C.border}`, borderRadius:6, fontFamily:FH, outline:"none", color:C.text, background:C.bg }} />
          <button onClick={save} aria-label="Save" style={{ ...btn(C.dark,"#fff",11), padding:"4px 8px", display:"flex", alignItems:"center" }}><Check size={11} aria-hidden="true" /></button>
        </div>
      ) : (
        <div onClick={()=>setEd(true)} style={{ cursor:"pointer", display:"flex", alignItems:"baseline", gap:4 }}>
          <span style={{ fontFamily:FH, fontWeight:700, fontSize:22, color:C.text }}>{prefix}{Number(value||0).toLocaleString()}</span>
          <span style={{ fontSize:9, color:C.muted, fontFamily:FB }}>edit</span>
        </div>
      )}
    </div>
  );
}

function LeadsContent({ metrics, saveM, businessId, globalRange=null, globalCStart="", globalCEnd="", notesByTarget, onDropNote, onUnstickNote }) {
  const KEY = `earnedlab_leads_${businessId}`;
  const [leads, setLeads] = useState(()=>{ try{return JSON.parse(localStorage.getItem(KEY)||"[]");}catch{return [];} });
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newDate, setNewDate] = useState(()=>new Date().toISOString().slice(0,10));
  const [filter, setFilter] = useState("all");
  const [rangeMode, setRangeMode] = useState("month");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const STATUS = ["new","contacted","qualified","proposal","won","lost"];
  const STATUS_CLR = { new:"#3B82F6", contacted:"#8B5CF6", qualified:"#10B981", proposal:"#F59E0B", won:"#22C55E", lost:"#9CA3AF" };

  const saveLeads = l=>{ setLeads(l); try{localStorage.setItem(KEY,JSON.stringify(l));}catch{} };
  const addLead = ()=>{
    if(!newName.trim()) return;
    const today = new Date().toISOString().slice(0,10);
    const l={ id:Date.now().toString(), name:newName.trim(), source:newSource.trim(), status:"new", date:newDate||today };
    saveLeads([l,...leads]);
    saveM("leads.this_month",(metrics.leads.this_month||0)+1);
    saveM("leads.total",(metrics.leads.total||0)+1);
    setNewName(""); setNewSource(""); setNewDate(today); setAdding(false);
  };
  const updateStatus = (id,status)=>saveLeads(leads.map(l=>l.id===id?{...l,status}:l));
  const deleteLead   = id=>saveLeads(leads.filter(l=>l.id!==id));

  const effectiveMode = globalRange || rangeMode;
  const effectiveCStart = globalRange==="custom"?globalCStart:cStart;
  const effectiveCEnd   = globalRange==="custom"?globalCEnd:cEnd;
  const rangedCount = filterDateRange(leads, effectiveMode, effectiveCStart, effectiveCEnd).length;
  const filtered    = filter==="all"?leads:leads.filter(l=>l.status===filter);

  return (
    <div>
      {globalRange ? <GlobalRangeLabel mode={globalRange} count={rangedCount} /> : <RangeDropdown mode={rangeMode} setMode={setRangeMode} cStart={cStart} setCStart={setCStart} cEnd={cEnd} setCEnd={setCEnd} count={rangedCount} />}
      <div style={{ display:"flex", gap:5, marginBottom:10, flexWrap:"wrap" }}>
        {["all",...STATUS].map(s=>{
          const cnt = s==="all"?leads.length:leads.filter(l=>l.status===s).length;
          return (
            <button key={s} onClick={()=>setFilter(s)} style={{ fontSize:10, padding:"3px 8px", borderRadius:12, border:`1px solid ${filter===s?C.text:C.border}`, background:filter===s?"#F1F5F9":"transparent", color:filter===s?C.text:C.muted, cursor:"pointer", fontFamily:FB }}>
              {s==="all"?"All":s.charAt(0).toUpperCase()+s.slice(1)} ({cnt})
            </button>
          );
        })}
      </div>
      <div style={{ maxHeight:180, overflowY:"auto" }}>
        {filtered.map(l=>(
          <NoteDropItem key={l.id} targetId={`leads:item:${l.id}`} notesByTarget={notesByTarget} onDropNote={onDropNote} onUnstickNote={onUnstickNote} style={{ marginBottom:2 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 4px", borderBottom:`1px solid ${C.border}` }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:STATUS_CLR[l.status]||C.muted, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:500, fontFamily:FB, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.name}</div>
                <div style={{ display:"flex", gap:6 }}>
                  {l.source&&<span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>{l.source}</span>}
                  {l.date&&<span style={{ fontSize:9, color:C.subtle, fontFamily:FB }}>{normDate(l.date)}</span>}
                </div>
              </div>
              <select value={l.status} onChange={e=>updateStatus(l.id,e.target.value)} style={{ fontSize:10, padding:"2px 4px", border:`1px solid ${C.border}`, borderRadius:6, background:C.surface, color:C.text, fontFamily:FB }}>
                {STATUS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={()=>deleteLead(l.id)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:13, padding:0, flexShrink:0 }}>×</button>
            </div>
          </NoteDropItem>
        ))}
        {filtered.length===0&&<div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"12px 0", fontFamily:FB }}>No leads{filter!=="all"?` — status: ${filter}`:""}</div>}
      </div>
      {adding ? (
        <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Lead name" onKeyDown={e=>e.key==="Enter"&&addLead()} autoFocus style={{ ...inp(), flex:"2 1 120px", fontSize:12, padding:"6px 10px" }} />
          <input value={newSource} onChange={e=>setNewSource(e.target.value)} placeholder="Source (optional)" style={{ ...inp(), flex:"1 1 90px", fontSize:12, padding:"6px 10px" }} />
          <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={{ ...inp(), flex:"1 1 120px", fontSize:12, padding:"6px 10px" }} />
          <button onClick={addLead} style={{ ...btn(C.dark,"#fff",12), padding:"6px 12px" }}>Add</button>
          <button onClick={()=>setAdding(false)} style={{ ...btnO(C.muted,12), padding:"6px 10px" }}>Cancel</button>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} style={{ ...btnO("#475569",11), marginTop:10, width:"100%", textAlign:"center" }}>+ Add lead</button>
      )}
    </div>
  );
}

function ClientsContent({ metrics, saveM, businessId, globalRange=null, globalCStart="", globalCEnd="", notesByTarget, onDropNote, onUnstickNote }) {
  const KEY = `earnedlab_clients_${businessId}`;
  const [clients, setClients] = useState(()=>{ try{return JSON.parse(localStorage.getItem(KEY)||"[]");}catch{return [];} });
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newType, setNewType] = useState("current");
  const [newDate, setNewDate] = useState(()=>new Date().toISOString().slice(0,10));
  const [tab, setTab] = useState("current");
  const [rangeMode, setRangeMode] = useState("month");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const TABS = ["current","past","potential"];
  const TAB_CLR = { current:"#22C55E", past:"#9CA3AF", potential:"#3B82F6" };

  const saveClients = c=>{ setClients(c); try{localStorage.setItem(KEY,JSON.stringify(c));}catch{} };
  const addClient = ()=>{
    if(!newName.trim()) return;
    const today = new Date().toISOString().slice(0,10);
    const c={ id:Date.now().toString(), name:newName.trim(), source:newSource.trim(), type:newType, date:newDate||today };
    saveClients([c,...clients]);
    if(newType==="current") saveM("clients.active",(metrics.clients.active||0)+1);
    saveM("clients.total",(metrics.clients.total||0)+1);
    setNewName(""); setNewSource(""); setNewDate(today); setAdding(false);
  };
  const moveClient = (id,type)=>{
    const prev=clients.find(c=>c.id===id);
    saveClients(clients.map(c=>c.id===id?{...c,type}:c));
    if(prev?.type==="current"&&type!=="current") saveM("clients.active",Math.max(0,(metrics.clients.active||0)-1));
    if(type==="current"&&prev?.type!=="current") saveM("clients.active",(metrics.clients.active||0)+1);
  };
  const deleteClient = id=>{
    const c=clients.find(x=>x.id===id);
    saveClients(clients.filter(x=>x.id!==id));
    if(c?.type==="current") saveM("clients.active",Math.max(0,(metrics.clients.active||0)-1));
    saveM("clients.total",Math.max(0,(metrics.clients.total||0)-1));
  };

  const effectiveMode = globalRange || rangeMode;
  const effectiveCStart = globalRange==="custom"?globalCStart:cStart;
  const effectiveCEnd   = globalRange==="custom"?globalCEnd:cEnd;
  const rangedCount = filterDateRange(clients, effectiveMode, effectiveCStart, effectiveCEnd).length;
  const filtered    = clients.filter(c=>c.type===tab);

  return (
    <div>
      {globalRange ? <GlobalRangeLabel mode={globalRange} count={rangedCount} /> : <RangeDropdown mode={rangeMode} setMode={setRangeMode} cStart={cStart} setCStart={setCStart} cEnd={cEnd} setCEnd={setCEnd} count={rangedCount} />}
      <div style={{ display:"flex", gap:4, marginBottom:10 }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, fontSize:11, padding:"5px 4px", borderRadius:10, border:`1px solid ${tab===t?TAB_CLR[t]:C.border}`, background:tab===t?TAB_CLR[t]+"18":"transparent", color:tab===t?TAB_CLR[t]:C.muted, cursor:"pointer", fontFamily:FB, fontWeight:tab===t?600:400 }}>
            {t.charAt(0).toUpperCase()+t.slice(1)} ({clients.filter(c=>c.type===t).length})
          </button>
        ))}
      </div>
      <div style={{ maxHeight:160, overflowY:"auto" }}>
        {filtered.map(c=>(
          <NoteDropItem key={c.id} targetId={`clients:item:${c.id}`} notesByTarget={notesByTarget} onDropNote={onDropNote} onUnstickNote={onUnstickNote} style={{ marginBottom:2 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 4px", borderBottom:`1px solid ${C.border}` }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:TAB_CLR[c.type], flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:500, fontFamily:FB, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</div>
                <div style={{ display:"flex", gap:6 }}>
                  {c.source&&<span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>{c.source}</span>}
                  {c.date&&<span style={{ fontSize:9, color:C.subtle, fontFamily:FB }}>{normDate(c.date)}</span>}
                </div>
              </div>
              <select value={c.type} onChange={e=>moveClient(c.id,e.target.value)} style={{ fontSize:10, padding:"2px 4px", border:`1px solid ${C.border}`, borderRadius:6, background:C.surface, color:C.text, fontFamily:FB }}>
                {TABS.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={()=>deleteClient(c.id)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:13, padding:0, flexShrink:0 }}>×</button>
            </div>
          </NoteDropItem>
        ))}
        {filtered.length===0&&<div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"12px 0", fontFamily:FB }}>No {tab} clients</div>}
      </div>
      {adding ? (
        <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Client name" onKeyDown={e=>e.key==="Enter"&&addClient()} autoFocus style={{ ...inp(), flex:"2 1 120px", fontSize:12, padding:"6px 10px" }} />
          <input value={newSource} onChange={e=>setNewSource(e.target.value)} placeholder="Source (optional)" style={{ ...inp(), flex:"1 1 90px", fontSize:12, padding:"6px 10px" }} />
          <select value={newType} onChange={e=>setNewType(e.target.value)} style={{ ...inp(), flex:"1 1 90px", fontSize:12, padding:"6px 8px" }}>
            {TABS.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={{ ...inp(), flex:"1 1 120px", fontSize:12, padding:"6px 10px" }} />
          <button onClick={addClient} style={{ ...btn(C.dark,"#fff",12), padding:"6px 12px" }}>Add</button>
          <button onClick={()=>setAdding(false)} style={{ ...btnO(C.muted,12), padding:"6px 10px" }}>Cancel</button>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} style={{ ...btnO("#475569",11), marginTop:10, width:"100%", textAlign:"center" }}>+ Add client</button>
      )}
    </div>
  );
}

const normDate = d=>(typeof d==="string"&&d.length>10?d.slice(0,10):d)||"";
function filterDateRange(items, mode, cStart="", cEnd="") {
  const now=new Date(); const today=now.toISOString().slice(0,10);
  if(mode==="day") return items.filter(x=>normDate(x.date)===today);
  if(mode==="week"){
    const dow=now.getDay(); const ms=(dow===0?6:dow-1)*86400000;
    const mon=new Date(now.getTime()-ms).toISOString().slice(0,10);
    return items.filter(x=>{const d=normDate(x.date);return d>=mon&&d<=today;});
  }
  if(mode==="month"){ const m=today.slice(0,7); return items.filter(x=>normDate(x.date).startsWith(m)); }
  if(mode==="year"){ const y=today.slice(0,4); return items.filter(x=>normDate(x.date).startsWith(y)); }
  if(mode==="all") return items;
  if(mode==="custom"&&cStart&&cEnd) return items.filter(x=>{const d=normDate(x.date);return d&&d>=cStart&&d<=cEnd;});
  return items;
}

function GlobalRangeLabel({ mode, count=0, prefix="" }) {
  const label = mode==="day"?"Today":mode==="week"?"This Week":mode==="month"?"This Month":mode==="year"?"This Year":mode==="all"?"All Time":mode==="custom"?"Custom Range":mode||"All Time";
  return (
    <div style={{ marginBottom:10, display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ background:"#F1F5F9", borderRadius:8, padding:"3px 10px", fontSize:10, color:C.muted, fontFamily:FB, fontWeight:600 }}>{label}</div>
      <div>
        <div style={{ fontFamily:FH, fontWeight:700, fontSize:28, color:C.text, letterSpacing:"-0.03em" }}>{prefix}{Number(count||0).toLocaleString()}</div>
        <div style={{ fontSize:10, color:C.muted, fontFamily:FB }}>{label}</div>
      </div>
    </div>
  );
}

function RangeDropdown({ mode, setMode, cStart="", setCStart, cEnd="", setCEnd, count=0, prefix="" }) {
  const label = mode==="day"?"Today":mode==="week"?"This Week":mode==="month"?"This Month":mode==="year"?"This Year":mode==="all"?"All Time":(cStart&&cEnd)?`${cStart} – ${cEnd}`:"Custom Range";
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:mode==="custom"?6:0 }}>
        <select value={mode} onChange={e=>setMode(e.target.value)}
          style={{ fontSize:11, padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:8, background:C.surface, color:C.text, fontFamily:FB, fontWeight:600, cursor:"pointer", flexShrink:0 }}>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
          <option value="all">All Time</option>
          <option value="custom">Custom Range</option>
        </select>
        <div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:28, color:C.text, lineHeight:1 }}>{prefix}{Number(count||0).toLocaleString()}</div>
          <div style={{ fontSize:10, color:C.muted, fontFamily:FB }}>{label}</div>
        </div>
      </div>
      {mode==="custom"&&(
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <input type="date" value={cStart} onChange={e=>setCStart(e.target.value)} style={{ ...inp(), flex:1, fontSize:11, padding:"4px 8px" }}/>
          <span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>–</span>
          <input type="date" value={cEnd} onChange={e=>setCEnd(e.target.value)} style={{ ...inp(), flex:1, fontSize:11, padding:"4px 8px" }}/>
        </div>
      )}
    </div>
  );
}

function NoteDropItem({ targetId, notesByTarget, onDropNote, onUnstickNote, children, style={} }) {
  const [hover, setHover] = useState(false);
  const note = notesByTarget?.[targetId];
  const handleDragOver = e=>{ if(e.dataTransfer.types.includes("text/widgettype")) return; e.preventDefault(); e.stopPropagation(); setHover(true); };
  const handleDragLeave = e=>{ if(!e.currentTarget.contains(e.relatedTarget)) setHover(false); };
  const handleDrop = e=>{ if(e.dataTransfer.types.includes("text/widgettype")) return; e.preventDefault(); e.stopPropagation(); const id=e.dataTransfer.getData("text/noteId"); if(id&&onDropNote) onDropNote(id,targetId,""); setHover(false); };
  return (
    <div style={{ position:"relative", ...style }}>
      <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        style={{ borderRadius:6, border:`1px solid ${hover?C.border:"transparent"}`, transition:"border-color 0.12s", background:hover?"#F8FAFC":"transparent" }}>
        {children}
      </div>
      {note&&(
        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2, marginLeft:4 }}>
          <span style={{ fontSize:9, background:note.color||"#FEF3C7", borderRadius:6, padding:"1px 6px", color:"#374151", fontFamily:FB }}>{note.text}</span>
          <button onClick={()=>onUnstickNote?.(note.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:10, padding:0, lineHeight:1 }}>×</button>
        </div>
      )}
    </div>
  );
}

const SOURCE_CATEGORIES = {
  revenue:                ["Service","Product","Recurring","One-Time","Referral","Other"],
  costs:                  ["Marketing","Tools","Labor","Rent","Subscriptions","Other"],
  "investments:initial":  ["Equipment","Software","Marketing","Legal","Training","Other"],
  "investments:ongoing":  ["Software","Subscriptions","Labor","Marketing","Other"],
};
const CAT_CLR = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#EC4899"];
const catColor = (cats, cat) => CAT_CLR[cats.indexOf(cat) % CAT_CLR.length] || C.muted;

function SourceList({ items, onAdd, onRemove, onUpdateCategory, prefix="$", notesByTarget, onDropNote, onUnstickNote, cardId="" }) {
  const today = new Date().toISOString().slice(0,10);
  const [name,setName]=useState(""); const [amt,setAmt]=useState(""); const [date,setDate]=useState(today);
  const [source,setSource]=useState(""); const [category,setCategory]=useState("");
  const [filter,setFilter]=useState("all"); const [adding,setAdding]=useState(false);

  const cats = SOURCE_CATEGORIES[cardId] || [];
  const usedCats = cats.filter(c=>items.some(x=>x.category===c));
  const filtered = filter==="all"?items:items.filter(x=>x.category===filter);

  const add = () => {
    if(!name.trim()) return;
    onAdd({ id:Date.now().toString(), name:name.trim(), amount:Number(amt)||0, date:date||today, source:source.trim(), category });
    setName(""); setAmt(""); setDate(today); setSource(""); setCategory(""); setAdding(false);
  };

  return (
    <div style={{ marginTop:8 }}>
      {usedCats.length>0&&(
        <div style={{ display:"flex", gap:5, marginBottom:10, flexWrap:"wrap" }}>
          {["all",...usedCats].map(c=>{
            const cnt=c==="all"?items.length:items.filter(x=>x.category===c).length;
            return (
              <button key={c} onClick={()=>setFilter(c)} style={{ fontSize:10, padding:"3px 8px", borderRadius:12, border:`1px solid ${filter===c?C.text:C.border}`, background:filter===c?"#F1F5F9":"transparent", color:filter===c?C.text:C.muted, cursor:"pointer", fontFamily:FB }}>
                {c==="all"?"All":c} ({cnt})
              </button>
            );
          })}
        </div>
      )}
      <div style={{ maxHeight:180, overflowY:"auto" }}>
        {filtered.map(s=>{
          const tid=`${cardId}:src:${s.id}`;
          const clr = s.category?catColor(cats,s.category):C.muted;
          return (
            <NoteDropItem key={s.id} targetId={tid} notesByTarget={notesByTarget} onDropNote={onDropNote} onUnstickNote={onUnstickNote} style={{ marginBottom:2 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 4px", borderBottom:`1px solid ${C.border}` }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:clr, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, fontFamily:FB, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {s.name}{prefix&&<span style={{ fontWeight:700, color:C.text, marginLeft:6 }}>{prefix}{Number(s.amount||0).toLocaleString()}</span>}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {s.source&&<span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>{s.source}</span>}
                    {s.date&&<span style={{ fontSize:9, color:C.subtle, fontFamily:FB }}>{normDate(s.date)}</span>}
                  </div>
                </div>
                {cats.length>0&&(
                  <select value={s.category||""} onChange={e=>onUpdateCategory?.(s.id,e.target.value)} style={{ fontSize:10, padding:"2px 4px", border:`1px solid ${C.border}`, borderRadius:6, background:C.surface, color:C.text, fontFamily:FB, flexShrink:0 }}>
                    <option value="">—</option>
                    {cats.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                )}
                <button onClick={()=>onRemove(s.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:13, padding:0, flexShrink:0 }}>×</button>
              </div>
            </NoteDropItem>
          );
        })}
        {filtered.length===0&&<div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"10px 0", fontFamily:FB }}></div>}
      </div>
      {adding?(
        <div style={{ marginTop:8, display:"flex", gap:5, flexWrap:"wrap" }}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" onKeyDown={e=>e.key==="Enter"&&add()} autoFocus style={{ ...inp(), flex:"2 1 100px", fontSize:12, padding:"6px 10px" }}/>
          <input value={amt} onChange={e=>setAmt(e.target.value)} placeholder="Amount" type="number" min="0" style={{ ...inp(), flex:"1 1 70px", fontSize:12, padding:"6px 10px" }}/>
          {cats.length>0&&(
            <select value={category} onChange={e=>setCategory(e.target.value)} style={{ ...inp(), flex:"1 1 100px", fontSize:12, padding:"6px 8px" }}>
              <option value="">Category</option>
              {cats.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <input value={source} onChange={e=>setSource(e.target.value)} placeholder="Source (opt.)" style={{ ...inp(), flex:"1 1 90px", fontSize:12, padding:"6px 10px" }}/>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ ...inp(), flex:"1 1 120px", fontSize:12, padding:"6px 10px" }}/>
          <button onClick={add} style={{ ...btn(C.dark,"#fff",12), padding:"6px 12px" }}>Add</button>
          <button onClick={()=>setAdding(false)} style={{ ...btnO(C.muted,12), padding:"6px 10px" }}>Cancel</button>
        </div>
      ):(
        <button onClick={()=>setAdding(true)} style={{ ...btnO("#475569",11), marginTop:6, width:"100%", textAlign:"center" }}>+ Add</button>
      )}
    </div>
  );
}

function RevenueContent({ metrics, saveM, cardId="revenue", globalRange=null, globalCStart="", globalCEnd="", notesByTarget, onDropNote, onUnstickNote }) {
  const [rangeMode, setRangeMode] = useState("month");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const sources = metrics.revenue?.sources || [];
  const effectiveMode = globalRange || rangeMode;
  const effectiveCStart = globalRange==="custom"?globalCStart:cStart;
  const effectiveCEnd   = globalRange==="custom"?globalCEnd:cEnd;
  const rangedAmt = filterDateRange(sources, effectiveMode, effectiveCStart, effectiveCEnd).reduce((a,x)=>a+(x.amount||0),0);
  const saveSources = next => { saveM("revenue.sources",next); saveM("revenue.this_month",next.reduce((a,x)=>a+(x.amount||0),0)); };
  const addSource    = s  => saveSources([...sources,s]);
  const removeSource = id => saveSources(sources.filter(s=>s.id!==id));
  const updateSourceCat = (id,cat) => saveSources(sources.map(s=>s.id===id?{...s,category:cat}:s));
  return (
    <div>
      {globalRange ? <GlobalRangeLabel mode={globalRange} count={rangedAmt} prefix="$" /> : <RangeDropdown mode={rangeMode} setMode={setRangeMode} cStart={cStart} setCStart={setCStart} cEnd={cEnd} setCEnd={setCEnd} count={rangedAmt} prefix="$" />}
      <SourceList items={sources} onAdd={addSource} onRemove={removeSource} onUpdateCategory={updateSourceCat} prefix="$"
        notesByTarget={notesByTarget} onDropNote={onDropNote} onUnstickNote={onUnstickNote} cardId={cardId} />
    </div>
  );
}

function CostsContent({ metrics, saveM, cardId="costs", globalRange=null, globalCStart="", globalCEnd="", notesByTarget, onDropNote, onUnstickNote }) {
  const [rangeMode, setRangeMode] = useState("month");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const causes = metrics.costs?.causes || [];
  const invest = metrics.investments || {};
  const investInitial = invest.initial || [];
  const investOngoing = invest.ongoing || [];
  const investOngoingTotal = invest.total_ongoing||0;

  // Auto-derive investment items as read-only cost rows
  const investRows = [
    ...investInitial.map(x=>({...x, _label:`Initial — ${x.category||"General"} Investment`, _readonly:true})),
    ...investOngoing.map(x=>({...x, _label:`Ongoing — ${x.category||"General"} Investment`, _readonly:true})),
  ];

  const effectiveMode = globalRange || rangeMode;
  const effectiveCStart = globalRange==="custom"?globalCStart:cStart;
  const effectiveCEnd   = globalRange==="custom"?globalCEnd:cEnd;
  const rangedCauses = filterDateRange(causes, effectiveMode, effectiveCStart, effectiveCEnd);
  const rangedInvest = filterDateRange(investRows, effectiveMode, effectiveCStart, effectiveCEnd);
  const rangedAmt = rangedCauses.reduce((a,x)=>a+(x.amount||0),0) + rangedInvest.reduce((a,x)=>a+(x.amount||0),0);
  const saveCauses   = next => { saveM("costs.causes",next); saveM("costs.this_month",next.reduce((a,x)=>a+(x.amount||0),0)); };
  const addCause     = s  => saveCauses([...causes,s]);
  const removeCause  = id => saveCauses(causes.filter(s=>s.id!==id));
  const updateCauseCat = (id,cat) => saveCauses(causes.map(c=>c.id===id?{...c,category:cat}:c));
  return (
    <div>
      {globalRange ? <GlobalRangeLabel mode={globalRange} count={rangedAmt} prefix="$" /> : <RangeDropdown mode={rangeMode} setMode={setRangeMode} cStart={cStart} setCStart={setCStart} cEnd={cEnd} setCEnd={setCEnd} count={rangedAmt} prefix="$" />}
      <SourceList items={causes} onAdd={addCause} onRemove={removeCause} onUpdateCategory={updateCauseCat} prefix="$"
        notesByTarget={notesByTarget} onDropNote={onDropNote} onUnstickNote={onUnstickNote} cardId={cardId} />
      {investRows.length>0&&(
        <div style={{ marginTop:8 }}>
          <div style={{ fontSize:10, color:C.muted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>From Investments</div>
          {investRows.map((x,i)=>(
            <div key={x.id||i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, fontFamily:FB, padding:"4px 6px", background:"#F1F5F9", borderRadius:6, marginBottom:3 }}>
              <span style={{ color:C.muted }}>{x._label}{x.name?` — ${x.name}`:""}</span>
              <span style={{ color:C.muted, fontWeight:600 }}>${(x.amount||0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LossContent({ metrics, globalRange=null, globalCStart="", globalCEnd="" }) {
  const [rangeMode, setRangeMode] = useState("all");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const sources = metrics.revenue?.sources || [];
  const causes      = metrics.costs?.causes || [];
  const investItems = [...(metrics.investments?.initial||[]), ...(metrics.investments?.ongoing||[])];
  const effectiveMode = globalRange || rangeMode;
  const effectiveCStart = globalRange==="custom"?globalCStart:cStart;
  const effectiveCEnd   = globalRange==="custom"?globalCEnd:cEnd;
  const rev  = filterDateRange(sources, effectiveMode, effectiveCStart, effectiveCEnd).reduce((a,x)=>a+(x.amount||0),0);
  const cost = filterDateRange([...causes, ...investItems], effectiveMode, effectiveCStart, effectiveCEnd).reduce((a,x)=>a+(x.amount||0),0);
  const loss = Math.max(0, cost - rev);
  const totalRev  = sources.reduce((a,x)=>a+(x.amount||0),0);
  const totalCost = [...causes, ...investItems].reduce((a,x)=>a+(x.amount||0),0);
  const label = effectiveMode==="day"?"Today":effectiveMode==="week"?"This Week":effectiveMode==="month"?"This Month":effectiveMode==="year"?"This Year":effectiveMode==="all"?"All Time":(cStart&&cEnd)?`${cStart} – ${cEnd}`:"Custom";
  return (
    <div>
      {globalRange ? <GlobalRangeLabel mode={globalRange} count={loss} prefix={loss>0?"-$":""} /> : <RangeDropdown mode={rangeMode} setMode={setRangeMode} cStart={cStart} setCStart={setCStart} cEnd={cEnd} setCEnd={setCEnd} count={loss} prefix={loss>0?"-$":""} />}
      <div style={{ background:loss>0?"#FFF1F2":C.surface, borderRadius:12, padding:"12px 14px", border:`1px solid ${loss>0?"#FECDD3":C.border}` }}>
        <div style={{ fontSize:9, color:loss>0?"#EF4444":C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", fontFamily:FB, marginBottom:4 }}>Loss — {label}</div>
        <div style={{ fontFamily:FH, fontWeight:700, fontSize:28, color:loss>0?"#EF4444":C.muted }}>{loss>0?`-$${loss.toLocaleString()}`:"$0"}</div>
        {loss===0&&<div style={{ fontSize:11, color:"#22C55E", fontFamily:FB, marginTop:4 }}>$0</div>}
      </div>
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <div style={{ flex:1, background:C.surface, borderRadius:8, padding:"8px 10px" }}>
          <div style={{ fontSize:9, color:C.muted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Revenue</div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:16, color:C.text }}>${totalRev.toLocaleString()}</div>
        </div>
        <div style={{ flex:1, background:C.surface, borderRadius:8, padding:"8px 10px" }}>
          <div style={{ fontSize:9, color:C.muted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Costs</div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:16, color:C.text }}>${totalCost.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function ProfitContent({ metrics, globalRange=null, globalCStart="", globalCEnd="" }) {
  const [rangeMode, setRangeMode] = useState("all");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const sources = metrics.revenue?.sources || [];
  const causes      = metrics.costs?.causes || [];
  const investItems = [...(metrics.investments?.initial||[]), ...(metrics.investments?.ongoing||[])];
  const effectiveMode = globalRange || rangeMode;
  const effectiveCStart = globalRange==="custom"?globalCStart:cStart;
  const effectiveCEnd   = globalRange==="custom"?globalCEnd:cEnd;
  const rev    = filterDateRange(sources, effectiveMode, effectiveCStart, effectiveCEnd).reduce((a,x)=>a+(x.amount||0),0);
  const cost   = filterDateRange([...causes, ...investItems], effectiveMode, effectiveCStart, effectiveCEnd).reduce((a,x)=>a+(x.amount||0),0);
  const profit = Math.max(0, rev - cost);
  const totalRev  = sources.reduce((a,x)=>a+(x.amount||0),0);
  const totalCost = [...causes, ...investItems].reduce((a,x)=>a+(x.amount||0),0);
  const label  = effectiveMode==="day"?"Today":effectiveMode==="week"?"This Week":effectiveMode==="month"?"This Month":effectiveMode==="year"?"This Year":effectiveMode==="all"?"All Time":(cStart&&cEnd)?`${cStart} – ${cEnd}`:"Custom";
  return (
    <div>
      {globalRange ? <GlobalRangeLabel mode={globalRange} count={profit} prefix={profit>0?"+$":""} /> : <RangeDropdown mode={rangeMode} setMode={setRangeMode} cStart={cStart} setCStart={setCStart} cEnd={cEnd} setCEnd={setCEnd} count={profit} prefix={profit>0?"+$":""} />}
      <div style={{ background:profit>0?"#F0FDF4":C.surface, borderRadius:12, padding:"12px 14px", border:`1px solid ${profit>0?"#BBF7D0":C.border}` }}>
        <div style={{ fontSize:9, color:profit>0?"#16A34A":C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", fontFamily:FB, marginBottom:4 }}>Profit — {label}</div>
        <div style={{ fontFamily:FH, fontWeight:700, fontSize:28, color:profit>0?"#16A34A":C.muted }}>{profit>0?`+$${profit.toLocaleString()}`:"$0"}</div>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <div style={{ flex:1, background:C.surface, borderRadius:8, padding:"8px 10px" }}>
          <div style={{ fontSize:9, color:C.muted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Revenue</div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:16, color:C.text }}>${totalRev.toLocaleString()}</div>
        </div>
        <div style={{ flex:1, background:C.surface, borderRadius:8, padding:"8px 10px" }}>
          <div style={{ fontSize:9, color:C.muted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Costs</div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:16, color:C.text }}>${totalCost.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function InvestmentsContent({ metrics, saveM, cardId="investments", globalRange=null, globalCStart="", globalCEnd="", notesByTarget, onDropNote, onUnstickNote }) {
  const [rangeMode, setRangeMode] = useState("month");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const invest = metrics.investments || {};
  const initial = invest.initial || [];
  const ongoing = invest.ongoing || [];
  const totalInitial = initial.reduce((a,x)=>a+(x.amount||0),0);
  const totalOngoing = ongoing.reduce((a,x)=>a+(x.amount||0),0);
  const effectiveMode = globalRange || rangeMode;
  const effectiveCStart = globalRange==="custom"?globalCStart:cStart;
  const effectiveCEnd   = globalRange==="custom"?globalCEnd:cEnd;
  const rangedInitial = filterDateRange(initial, effectiveMode, effectiveCStart, effectiveCEnd).reduce((a,x)=>a+(x.amount||0),0);
  const displayAmt = rangedInitial + totalOngoing;

  const saveInvestments = (next)=>{
    const ti=next.initial.reduce((a,x)=>a+(x.amount||0),0);
    const to=next.ongoing.reduce((a,x)=>a+(x.amount||0),0);
    saveM("investments.initial",next.initial);
    saveM("investments.ongoing",next.ongoing);
    saveM("investments.total_initial",ti);
    saveM("investments.total_ongoing",to);
  };
  const addInitial      = s  => saveInvestments({ initial:[...initial,s], ongoing });
  const removeInitial   = id => saveInvestments({ initial:initial.filter(x=>x.id!==id), ongoing });
  const updateInitialCat = (id,cat) => saveInvestments({ initial:initial.map(x=>x.id===id?{...x,category:cat}:x), ongoing });
  const addOngoing      = s  => saveInvestments({ initial, ongoing:[...ongoing,s] });
  const removeOngoing   = id => saveInvestments({ initial, ongoing:ongoing.filter(x=>x.id!==id) });
  const updateOngoingCat = (id,cat) => saveInvestments({ initial, ongoing:ongoing.map(x=>x.id===id?{...x,category:cat}:x) });
  const noteProps = { notesByTarget, onDropNote, onUnstickNote };

  return (
    <div>
      {globalRange ? <GlobalRangeLabel mode={globalRange} count={displayAmt} prefix="$" /> : <RangeDropdown mode={rangeMode} setMode={setRangeMode} cStart={cStart} setCStart={setCStart} cEnd={cEnd} setCEnd={setCEnd} count={displayAmt} prefix="$" />}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, color:C.text, fontFamily:FB, fontWeight:700, marginBottom:6 }}>Initial — ${totalInitial.toLocaleString()}</div>
        <SourceList items={initial} onAdd={addInitial} onRemove={removeInitial} onUpdateCategory={updateInitialCat} prefix="$"
          cardId={`${cardId}:initial`} {...noteProps} />
      </div>
      <div>
        <div style={{ fontSize:11, color:C.text, fontFamily:FB, fontWeight:700, marginBottom:6 }}>Ongoing — ${totalOngoing.toLocaleString()}</div>
        <SourceList items={ongoing} onAdd={addOngoing} onRemove={removeOngoing} onUpdateCategory={updateOngoingCat} prefix="$"
          cardId={`${cardId}:ongoing`} {...noteProps} />
      </div>
    </div>
  );
}

function BookingsContent({ metrics, saveM, integs, globalRange=null, globalCStart="", globalCEnd="" }) {
  const meta = (()=>{ try{const i=integs.find(x=>x.provider==="calendly");return i?.metadata?JSON.parse(i.metadata):{};}catch{return {};} })();
  const hasLink = !!meta.bookingUrl;
  const isConn = integs.find(i=>i.provider==="calendly")?.status==="connected";
  const [rangeMode, setRangeMode] = useState("month");
  const [cStart, setCStart] = useState(""); const [cEnd, setCEnd] = useState("");
  const effectiveMode = globalRange || rangeMode;
  const effectiveCStart = globalRange==="custom"?globalCStart:cStart;
  const effectiveCEnd   = globalRange==="custom"?globalCEnd:cEnd;
  const val = effectiveMode==="week"?metrics.bookings?.this_week||0:metrics.bookings?.this_month||0;
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:12, background:isConn?"#F0FDF4":"#F1F5F9", color:isConn?"#22C55E":C.muted, fontFamily:FB, fontWeight:600 }}>{isConn?"Connected":hasLink?"Linked":"Not connected"}</span>
        {hasLink&&<a href={`https://${(meta.bookingUrl||"").replace(/^https?:\/\//,"")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:C.muted, fontFamily:FB, textDecoration:"underline" }}>View page →</a>}
      </div>
      {globalRange ? <GlobalRangeLabel mode={globalRange} count={val} /> : <RangeDropdown mode={rangeMode} setMode={setRangeMode} cStart={cStart} setCStart={setCStart} cEnd={cEnd} setCEnd={setCEnd} count={val} />}
      <div style={{ display:"flex", gap:8 }}>
        <MCell label="This week"  value={metrics.bookings?.this_week||0}  onChange={v=>saveM("bookings.this_week",v)} />
        <MCell label="This month" value={metrics.bookings?.this_month||0} onChange={v=>saveM("bookings.this_month",v)} />
      </div>
    </div>
  );
}

function GoogleContent({ metrics, saveM, integs, globalRange=null, globalCStart="", globalCEnd="" }) {
  const meta = (()=>{ try{const i=integs.find(x=>x.provider==="google");return i?.metadata?JSON.parse(i.metadata):{};}catch{return {};} })();
  const isConn = integs.find(i=>i.provider==="google")?.status==="connected";
  const viewable = meta._viewableStatus==="viewable";
  const statusLabel = isConn?"Connected":viewable?"Viewable":"Not connected";
  const statusClr   = isConn?"#22C55E":viewable?"#3B82F6":C.muted;
  const [rangeMode, setRangeMode] = useState("month");
  const [cStart, setCStart] = useState(""); const [cEnd, setCEnd] = useState("");
  const effectiveMode = globalRange || rangeMode;
  const effectiveCStart = globalRange==="custom"?globalCStart:cStart;
  const effectiveCEnd   = globalRange==="custom"?globalCEnd:cEnd;
  const reviewCount = metrics.social?.google_reviews||0;
  const rating = metrics.social?.google_rating||0;
  const stars  = Math.round(rating);
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:12, background:statusClr+"18", color:statusClr, fontFamily:FB, fontWeight:600 }}>{statusLabel}</span>
        {(isConn||viewable)&&meta.profileUrl&&(
          <a href={meta.profileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:C.muted, fontFamily:FB, textDecoration:"underline" }}>View listing →</a>
        )}
      </div>
      {globalRange ? <GlobalRangeLabel mode={globalRange} count={reviewCount} /> : <RangeDropdown mode={rangeMode} setMode={setRangeMode} cStart={cStart} setCStart={setCStart} cEnd={cEnd} setCEnd={setCEnd} count={reviewCount} />}
      <div style={{ display:"flex", gap:8, marginBottom:stars>0?10:0 }}>
        <MCell label="Reviews" value={metrics.social?.google_reviews||0} onChange={v=>saveM("social.google_reviews",v)} />
        <MCell label="Rating"  value={metrics.social?.google_rating||0}  onChange={v=>saveM("social.google_rating",v)} />
      </div>
      {stars>0&&(
        <div style={{ display:"flex", gap:2, alignItems:"center" }}>
          {[1,2,3,4,5].map(s=><span key={s} style={{ fontSize:18, color:s<=stars?"#F59E0B":"#D1D5DB" }}>★</span>)}
          <span style={{ fontSize:11, color:C.muted, marginLeft:6, fontFamily:FB }}>{rating}/5</span>
        </div>
      )}
    </div>
  );
}

function EmailContent({ integs, businessId, globalRange=null, globalCStart="", globalCEnd="" }) {
  const KEY = `earnedlab_email_${businessId}`;
  const emailInteg = integs.find(x=>x.provider==="email");
  const meta = (()=>{ try{return emailInteg?.metadata?JSON.parse(emailInteg.metadata):{};}catch{return {};} })();
  const isConnected = emailInteg?.status==="connected";
  const isViewable  = !!meta.address;
  const [rangeMode, setRangeMode] = useState("month");
  const [cStart, setCStart] = useState(""); const [cEnd, setCEnd] = useState("");
  const effectiveMode = globalRange || rangeMode;
  const [counts, setCounts] = useState(()=>{ try{return JSON.parse(localStorage.getItem(KEY)||"null")||{ inbox:0,starred:0,saved:0,archive:0 };}catch{return { inbox:0,starred:0,saved:0,archive:0 };} });
  const updateCount = (field,val)=>{
    const next={ ...counts,[field]:Number(val)||0 };
    setCounts(next); try{localStorage.setItem(KEY,JSON.stringify(next));}catch{}
  };
  const SECTIONS=[
    { label:"Inbox",   field:"inbox" },
    { label:"Starred", field:"starred" },
    { label:"Saved",   field:"saved" },
    { label:"Archive", field:"archive" },
  ];
  const statusLabel = isConnected?"Connected":isViewable?"Viewable":"Not connected";
  const statusClr   = isConnected?"#22C55E":isViewable?"#3B82F6":C.muted;
  const total = counts.inbox||0;
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:12, background:statusClr+"18", color:statusClr, fontFamily:FB, fontWeight:600 }}>{statusLabel}</span>
        {isViewable&&<span style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{meta.address}</span>}
      </div>
      {globalRange ? <GlobalRangeLabel mode={globalRange} count={total} /> : <RangeDropdown mode={rangeMode} setMode={setRangeMode} cStart={cStart} setCStart={setCStart} cEnd={cEnd} setCEnd={setCEnd} count={total} />}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {SECTIONS.map(s=>(
          <div key={s.field} style={{ background:C.surface, borderRadius:10, padding:"8px 10px" }}>
            <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginBottom:4 }}>{s.label}</div>
            <input type="number" value={counts[s.field]||0} onChange={e=>updateCount(s.field,e.target.value)} style={{ width:"100%", fontSize:20, fontFamily:FH, fontWeight:700, padding:"2px 4px", border:"none", background:"transparent", color:C.text, outline:"none" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ id, pos, meta, notes=[], isDragging, onDragStart, onRemove, onDropNote, onDropWidget, embeddedWidgets=[], onRemoveEmbeddedWidget, onUpdateWidgetConfig, metrics, snapshots, saveM, businessId, globalRange, globalCStart, globalCEnd, children }) {
  const [dropHover, setDropHover] = useState(false);
  const [widgetHover, setWidgetHover] = useState(false);

  const handleDragOver = e => {
    e.preventDefault();
    const isWidget = e.dataTransfer.types.includes("text/widgettype");
    if(isWidget) setWidgetHover(true); else setDropHover(true);
  };
  const handleDragLeave = e => {
    if(!e.currentTarget.contains(e.relatedTarget)) { setDropHover(false); setWidgetHover(false); }
  };
  const handleDrop = e => {
    e.preventDefault();
    const noteId     = e.dataTransfer.getData("text/noteId");
    const widgetType = e.dataTransfer.getData("text/widgetType");
    if(noteId && onDropNote)           onDropNote(noteId, id, meta?.label||id);
    else if(widgetType && onDropWidget) onDropWidget(widgetType);
    setDropHover(false); setWidgetHover(false);
  };
  const isHover = dropHover || widgetHover;

  return (
    <div
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      style={{
        position:"absolute", left:pos.x, top:pos.y, width:pos.w||340,
        background:C.bg, borderRadius:16,
        border:`${isHover?"2":"1"}px solid ${widgetHover?C.text:isHover?C.text:C.border}`,
        boxShadow: isDragging?"0 16px 48px rgba(0,0,0,0.18)":"0 4px 20px rgba(0,0,0,0.07)",
        overflow:"visible", userSelect:isDragging?"none":"auto",
        zIndex:isDragging?100:2, transition:isDragging?"none":"box-shadow 0.2s, border-color 0.15s",
      }}>
      {/* Pinned notes badges */}
      {notes.map((note,i)=>(
        <div key={note.id} style={{ position:"absolute", top:(-16-i*26), right:14, background:note.color||"#FEF3C7", borderRadius:8, padding:"3px 10px", fontSize:11, color:"#374151", fontFamily:FB, boxShadow:"0 2px 8px rgba(0,0,0,0.10)", display:"flex", alignItems:"center", gap:5, zIndex:10+i, maxWidth:260 }}>
          <span style={{ fontSize:9, color:"#6B7280" }}>pin</span>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{note.text}</span>
          <button onClick={()=>onDropNote(null, null, null, note.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:11, padding:0, lineHeight:1 }}>×</button>
        </div>
      ))}
      {/* Header */}
      <div
        onMouseDown={e=>{ e.preventDefault(); onDragStart(e,id); }}
        style={{ background:meta?.hdrBg||C.surface, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:isDragging?"grabbing":"grab", borderRadius:"16px 16px 0 0", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:C.muted, fontSize:12, letterSpacing:3 }}>⠿⠿</span>
          <span style={{ fontFamily:FH, fontWeight:700, fontSize:14 }}>{meta?.label||id}</span>
        </div>
        <div style={{ display:"flex", gap:4, alignItems:"center" }} onMouseDown={e=>e.stopPropagation()}>
          {widgetHover && <span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>Drop visual ↓</span>}
          {dropHover && !widgetHover && <span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>Drop note ↓</span>}
          <button title="Remove card" onClick={onRemove} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:16, padding:"2px 6px", lineHeight:1 }}>×</button>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding:"14px 16px" }} onMouseDown={e=>e.stopPropagation()}>
        {children}
        {embeddedWidgets.length>0&&(
          <div style={{ marginTop:12, borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
            {embeddedWidgets.map(w=>(
              <EmbeddedWidget key={w.id} widget={w}
                onUpdateConfig={cfg=>onUpdateWidgetConfig?.(w.id,cfg)}
                onRemove={()=>onRemoveEmbeddedWidget?.(w.id)}
                metrics={metrics} snapshots={snapshots} saveM={saveM}
                businessId={businessId} globalRange={globalRange} globalCStart={globalCStart} globalCEnd={globalCEnd} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── WIDGET TYPES ──────────────────────────────────────────────────
const WIDGET_DEFS = {
  graph: { label:"Line Graph",   icon:"", desc:"" },
  pie:   { label:"Pie Chart",    icon:"", desc:"" },
  draw:  { label:"Drawing",      icon:"", desc:"" },
  corr:  { label:"Correlation",  icon:"", desc:"" },
  field: { label:"Custom Field", icon:"", desc:"" },
  eq:    { label:"Equation",     icon:"", desc:"" },
};

function EmbeddedWidget({ widget, onUpdateConfig, onRemove, metrics, snapshots, saveM, businessId, globalRange=null, globalCStart="", globalCEnd="", standalone=false }) {
  const needsCfg = { graph:c=>!c.fieldId, pie:c=>!c.source, draw:()=>false, corr:c=>!c.fieldA||!c.fieldB, field:c=>!c.title, eq:c=>!c.source||!c.target };
  const [editing, setEditing] = useState(()=>needsCfg[widget.type]?.(widget.config||{})||false);
  const [cfg, setCfg] = useState(widget.config||{});
  const [ownMode, setOwnMode] = useState("month");
  const [ownCStart, setOwnCStart] = useState("");
  const [ownCEnd, setOwnCEnd] = useState("");
  const fldOpts = LINK_FIELDS.map(f=><option key={f.id} value={f.id}>{f.label}</option>);
  const s = { ...inp(), fontSize:11, marginBottom:5 };
  const saveConfig = ()=>{ onUpdateConfig(cfg); setEditing(false); };
  const def = WIDGET_DEFS[widget.type]||{};
  const cardRange = globalRange
    ? {mode:globalRange,cStart:globalCStart,cEnd:globalCEnd}
    : {mode:ownMode,cStart:ownCStart,cEnd:ownCEnd};

  const ConfigForm = ()=>{
    if(widget.type==="graph") return(<div>
      <select value={cfg.fieldId||""} onChange={e=>setCfg(p=>({...p,fieldId:e.target.value}))} style={s}><option value="">-- Select metric --</option>{fldOpts}</select>
      <div style={{ display:"flex", gap:4 }}><button onClick={saveConfig} disabled={!cfg.fieldId} style={{ ...btn(C.dark,"#fff",10), padding:"4px 10px" }}>Save</button><button onClick={onRemove} style={{ ...btnO(C.muted,10), padding:"4px 8px" }}>Remove</button></div>
    </div>);
    if(widget.type==="pie") return(<div>
      <select value={cfg.source||""} onChange={e=>setCfg(p=>({...p,source:e.target.value}))} style={s}>
        <option value="">-- Source --</option>
        <option value="revenue">Revenue Sources</option>
        <option value="costs">Cost Causes</option>
        <option value="investments.initial">Initial Investments</option>
        <option value="investments.ongoing">Ongoing Investments</option>
        <option value="leads">Leads (by status)</option>
        <option value="clients">Clients (by type)</option>
      </select>
      <div style={{ display:"flex", gap:4 }}><button onClick={saveConfig} disabled={!cfg.source} style={{ ...btn(C.dark,"#fff",10), padding:"4px 10px" }}>Save</button><button onClick={onRemove} style={{ ...btnO(C.muted,10), padding:"4px 8px" }}>Remove</button></div>
    </div>);
    if(widget.type==="corr") return(<div>
      <select value={cfg.fieldA||""} onChange={e=>setCfg(p=>({...p,fieldA:e.target.value}))} style={s}><option value="">-- Field A --</option>{fldOpts}</select>
      <select value={cfg.fieldB||""} onChange={e=>setCfg(p=>({...p,fieldB:e.target.value}))} style={s}><option value="">-- Field B --</option>{LINK_FIELDS.filter(f=>f.id!==cfg.fieldA).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
      <div style={{ display:"flex", gap:4 }}><button onClick={saveConfig} disabled={!cfg.fieldA||!cfg.fieldB} style={{ ...btn(C.dark,"#fff",10), padding:"4px 10px" }}>Save</button><button onClick={onRemove} style={{ ...btnO(C.muted,10), padding:"4px 8px" }}>Remove</button></div>
    </div>);
    if(widget.type==="field") return(<div>
      <input value={cfg.title||""} onChange={e=>setCfg(p=>({...p,title:e.target.value}))} placeholder="Field name" style={s}/>
      <select value={(cfg.formula||[])[0]?.value||""} onChange={e=>setCfg(p=>({...p,formula:[{type:"field",value:e.target.value},...(p.formula||[]).slice(1)]}))} style={s}><option value="">-- Field A --</option>{fldOpts}</select>
      <select value={(cfg.formula||[null,{}])[1]?.value||""} onChange={e=>setCfg(p=>({...p,formula:[(p.formula||[{}])[0],{type:"op",value:e.target.value},(p.formula||[{},{},{}])[2]||{}]}))} style={s}><option value="">-- Operator --</option>{["+","-","×","÷"].map(op=><option key={op} value={op}>{op}</option>)}</select>
      <select value={(cfg.formula||[null,null,{}])[2]?.value||""} onChange={e=>setCfg(p=>({...p,formula:[(p.formula||[{}])[0],(p.formula||[{},{}])[1],{type:"field",value:e.target.value}]}))} style={s}><option value="">-- Field B --</option>{LINK_FIELDS.filter(f=>f.id!==((cfg.formula||[])[0]?.value)).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
      <div style={{ display:"flex", gap:4 }}><button onClick={saveConfig} disabled={!cfg.title} style={{ ...btn(C.dark,"#fff",10), padding:"4px 10px" }}>Save</button><button onClick={onRemove} style={{ ...btnO(C.muted,10), padding:"4px 8px" }}>Remove</button></div>
    </div>);
    if(widget.type==="eq") return(<div>
      <select value={cfg.source||""} onChange={e=>setCfg(p=>({...p,source:e.target.value}))} style={s}><option value="">-- Source --</option>{fldOpts}</select>
      <select value={cfg.target||""} onChange={e=>setCfg(p=>({...p,target:e.target.value}))} style={s}><option value="">-- Target --</option>{LINK_FIELDS.filter(f=>f.id!==cfg.source).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
      <div style={{ display:"flex", gap:4 }}><button onClick={saveConfig} disabled={!cfg.source||!cfg.target} style={{ ...btn(C.dark,"#fff",10), padding:"4px 10px" }}>Save</button><button onClick={onRemove} style={{ ...btnO(C.muted,10), padding:"4px 8px" }}>Remove</button></div>
    </div>);
    return null;
  };

  const showRange = !globalRange && !editing && (widget.type==="graph"||widget.type==="pie");
  return (
    <div style={{ marginTop:standalone?0:8, paddingTop:standalone?0:8, borderTop:standalone?"none":`1px solid ${C.border}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        {!standalone&&<span style={{ fontSize:10, fontFamily:FB, fontWeight:700, color:C.muted }}>{widget.title||def.label}</span>}
        {standalone&&<span style={{ fontSize:11, fontFamily:FB, fontWeight:700, color:C.text }}>{widget.title||def.label}</span>}
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          {showRange&&(
            <select value={ownMode} onChange={e=>{setOwnMode(e.target.value);if(e.target.value!=="custom"){setOwnCStart("");setOwnCEnd("");}}}
              style={{ fontSize:9, padding:"1px 4px", border:`1px solid ${C.border}`, borderRadius:4, background:C.surface, color:C.muted, fontFamily:FB, cursor:"pointer" }}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="all">All Time</option>
              <option value="custom">Custom</option>
            </select>
          )}
          {!editing&&widget.type!=="draw"&&<button onClick={()=>setEditing(true)} title="Configure widget" aria-label="Configure widget" style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:5, cursor:"pointer", color:C.muted, padding:"0px 5px", lineHeight:"18px", display:"flex", alignItems:"center" }}><Settings2 size={13} aria-hidden="true" /></button>}
          {!standalone&&<button onClick={onRemove} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:13, padding:0, lineHeight:1 }}>×</button>}
        </div>
      </div>
      {showRange&&ownMode==="custom"&&(
        <div style={{ display:"flex", gap:4, marginBottom:4 }}>
          <input type="date" value={ownCStart} onChange={e=>setOwnCStart(e.target.value)} style={{ ...inp(), fontSize:10, padding:"2px 6px", flex:1 }}/>
          <span style={{ fontSize:10, color:C.muted }}>–</span>
          <input type="date" value={ownCEnd} onChange={e=>setOwnCEnd(e.target.value)} style={{ ...inp(), fontSize:10, padding:"2px 6px", flex:1 }}/>
        </div>
      )}
      {editing?<ConfigForm/>:(
        <>
          {widget.type==="graph"&&<GraphWidget config={cfg} snapshots={snapshots||[]} metrics={metrics} businessId={businessId} cardRange={cardRange}/>}
          {widget.type==="pie"&&<PieWidget config={cfg} metrics={metrics} businessId={businessId} cardRange={cardRange}/>}
          {widget.type==="draw"&&<DrawingWidget widgetId={widget.id}/>}
          {widget.type==="corr"&&<IntraCorrelWidget config={cfg} metrics={metrics} businessId={businessId}/>}
          {widget.type==="field"&&<CustomFieldWidget config={cfg} metrics={metrics}/>}
          {widget.type==="eq"&&<EquationWidget config={cfg} metrics={metrics} saveM={saveM}/>}
        </>
      )}
    </div>
  );
}

function buildTimeSeries(items, mode, cStart="", cEnd="", aggregation="sum") {
  const agg = b => aggregation==="count" ? b.length : b.reduce((a,x)=>a+(x.amount||0),0);
  const now=new Date(); const today=now.toISOString().slice(0,10);
  if(mode==="day"){
    const b=items.filter(x=>normDate(x.date)===today);
    return [{label:today.slice(5),value:agg(b)}];
  }
  if(mode==="week"){
    const DLABELS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const dow=now.getDay(); const mon=new Date(now.getTime()-(dow===0?6:dow-1)*86400000);
    return Array.from({length:7},(_,i)=>{
      const d=new Date(mon.getTime()+i*86400000); if(d>now) return null;
      const ds=d.toISOString().slice(0,10);
      return {label:DLABELS[i],value:agg(items.filter(x=>normDate(x.date)===ds))};
    }).filter(Boolean);
  }
  if(mode==="month"){
    const m=today.slice(0,7); const days=now.getDate();
    return Array.from({length:days},(_,i)=>{
      const dt=`${m}-${String(i+1).padStart(2,"0")}`;
      return {label:String(i+1),value:agg(items.filter(x=>normDate(x.date)===dt))};
    });
  }
  if(mode==="year"){
    const yr=today.slice(0,4); const curM=now.getMonth();
    const ML=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return Array.from({length:curM+1},(_,i)=>{
      const ms=`${yr}-${String(i+1).padStart(2,"0")}`;
      return {label:ML[i],value:agg(items.filter(x=>normDate(x.date).startsWith(ms)))};
    });
  }
  if(mode==="all"){
    const mm={};
    items.forEach(x=>{ const m=normDate(x.date).slice(0,7); if(!m) return; if(!mm[m]) mm[m]=[]; mm[m].push(x); });
    const sorted=Object.entries(mm).sort(([a],[b])=>a<b?-1:1);
    if(!sorted.length) return [];
    const ML=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return sorted.map(([m,b])=>{const[yr,mo]=m.split("-");return{label:`${ML[parseInt(mo)-1]} ${yr.slice(2)}`,value:agg(b)};});
  }
  if(mode==="custom"&&cStart&&cEnd){
    const s=new Date(cStart), e=new Date(cEnd);
    const diff=Math.round((e-s)/86400000)+1;
    if(diff<=62){
      return Array.from({length:diff},(_,i)=>{
        const dt=new Date(s.getTime()+i*86400000).toISOString().slice(0,10);
        return {label:dt.slice(5),value:agg(items.filter(x=>normDate(x.date)===dt))};
      });
    }
    const mm={};
    items.forEach(x=>{ const d=normDate(x.date); if(!d||d<cStart||d>cEnd) return; const m=d.slice(0,7); if(!mm[m]) mm[m]=[]; mm[m].push(x); });
    return Object.entries(mm).sort(([a],[b])=>a<b?-1:1).map(([m,b])=>({label:m.slice(5),value:agg(b)}));
  }
  return [{label:today.slice(5),value:0}];
}

function LineChart({data=[],color=C.dark,yPrefix="",w=290,h=130}){
  const canvasRef=useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const dpr=window.devicePixelRatio||1;
    canvas.width=w*dpr; canvas.height=h*dpr;
    canvas.style.width=w+"px"; canvas.style.height=h+"px";
    const ctx=canvas.getContext("2d");
    ctx.scale(dpr,dpr);
    const W=w, H=h;
    const pad={top:12,right:8,bottom:30,left:46};
    const cw=W-pad.left-pad.right, ch=H-pad.top-pad.bottom;
    ctx.clearRect(0,0,W,H);
    const vals=data.map(d=>d.value);
    const maxV=vals.length?Math.max(...vals,1):10;
    for(let i=0;i<=4;i++){
      const y=pad.top+ch-(i/4)*ch;
      ctx.strokeStyle="#E2E8F0"; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(pad.left+cw,y); ctx.stroke();
      const val=(i/4)*maxV;
      const valStr=val>=1000?`${yPrefix}${(val/1000).toFixed(val%1000===0?0:1)}k`:`${yPrefix}${Math.round(val)}`;
      ctx.fillStyle="#94A3B8"; ctx.font="9px system-ui,sans-serif"; ctx.textAlign="right";
      ctx.fillText(valStr,pad.left-3,y+3);
    }
    ctx.strokeStyle="#CBD5E1"; ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.moveTo(pad.left,pad.top+ch); ctx.lineTo(pad.left+cw,pad.top+ch); ctx.stroke();
    if(!data.length) return;
    const maxLabels=7;
    const step=data.length<=maxLabels?1:Math.ceil(data.length/maxLabels);
    ctx.fillStyle="#94A3B8"; ctx.font="8px system-ui,sans-serif"; ctx.textAlign="center";
    data.forEach((d,i)=>{
      const isFirst=i===0, isLast=i===data.length-1;
      if(!isFirst&&!isLast&&i%step!==0) return;
      const x=data.length===1?pad.left+cw/2:pad.left+(i/(data.length-1))*cw;
      ctx.fillText(d.label,x,pad.top+ch+14);
    });
    if(data.length===1){
      const bw=Math.min(20,cw*0.4); const bh=Math.max(data[0].value/maxV*ch,2);
      ctx.fillStyle=color+"90";
      ctx.fillRect(pad.left+cw/2-bw/2,pad.top+ch-bh,bw,bh);
      return;
    }
    ctx.beginPath();
    data.forEach((d,i)=>{
      const x=pad.left+(i/(data.length-1))*cw;
      const y=pad.top+ch-Math.max(d.value/maxV,0)*ch;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.lineJoin="round"; ctx.stroke();
    ctx.lineTo(pad.left+cw,pad.top+ch); ctx.lineTo(pad.left,pad.top+ch); ctx.closePath();
    ctx.fillStyle=color+"18"; ctx.fill();
    const dotR=data.length>30?0:data.length>15?1.5:2.5;
    if(dotR>0) data.forEach((d,i)=>{
      const x=pad.left+(i/(data.length-1))*cw;
      const y=pad.top+ch-Math.max(d.value/maxV,0)*ch;
      ctx.beginPath(); ctx.arc(x,y,dotR,0,Math.PI*2);
      ctx.fillStyle=color; ctx.fill();
      ctx.strokeStyle="#fff"; ctx.lineWidth=1; ctx.stroke();
    });
  },[data,color,yPrefix,w,h]); // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={canvasRef} style={{display:"block",width:w+"px",height:h+"px"}}/>;
}

function GraphWidget({ config, snapshots, metrics, businessId, cardRange }) {
  const field = LINK_FIELDS.find(f=>f.id===config.fieldId)||LINK_FIELDS[0];
  const {mode="month",cStart="",cEnd=""}=cardRange||{};

  let data, aggregation="sum";

  if(field.id==="loss"||field.id==="profit"){
    const revItems = metrics?.revenue?.sources||[];
    const costItems = [
      ...(metrics?.costs?.causes||[]),
      ...(metrics?.investments?.initial||[]),
      ...(metrics?.investments?.ongoing||[]),
    ];
    const revSeries  = buildTimeSeries(revItems,  mode, cStart, cEnd, "sum");
    const costSeries = buildTimeSeries(costItems, mode, cStart, cEnd, "sum");
    const allLabels  = [...new Set([...revSeries.map(x=>x.label),...costSeries.map(x=>x.label)])].sort();
    data = allLabels.map(label=>{
      const rev  = revSeries.find(x=>x.label===label)?.value||0;
      const cost = costSeries.find(x=>x.label===label)?.value||0;
      return {label, value: field.id==="profit"?Math.max(0,rev-cost):Math.max(0,cost-rev)};
    });
  } else {
    let items=null;
    if(field.id==="revenue")     items=metrics?.revenue?.sources||[];
    else if(field.id==="costs")  items=[
      ...(metrics?.costs?.causes||[]),
      ...(metrics?.investments?.initial||[]),
      ...(metrics?.investments?.ongoing||[]),
    ];
    else if(field.id==="investments") items=metrics?.investments?.initial||[];
    else if(field.id==="leads"){
      try{ items=JSON.parse(localStorage.getItem(`earnedlab_leads_${businessId}`)||"[]"); }catch{ items=[]; }
      aggregation="count";
    } else if(field.id==="clients"){
      try{ items=JSON.parse(localStorage.getItem(`earnedlab_clients_${businessId}`)||"[]"); }catch{ items=[]; }
      aggregation="count";
    }
    data = items!==null
      ? buildTimeSeries(items, mode, cStart, cEnd, aggregation)
      : snapshots.map(s=>({label:s.month||"",value:s[field.snapKey||field.id]||0}));
  }

  const total = data.reduce((a,x)=>a+x.value,0);
  const yP = aggregation==="count"?"":field.prefix;
  const color = field.id==="profit"?"#22C55E":field.id==="loss"?"#EF4444":C.dark;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4 }}>
        <div style={{ fontSize:10, color:C.muted, fontFamily:FB }}>{field.label}</div>
        <div style={{ fontFamily:FH, fontWeight:700, fontSize:16, color }}>{field.prefix}{total.toLocaleString()}</div>
      </div>
      <LineChart data={data} color={color} yPrefix={yP} w={290} h={130}/>
    </div>
  );
}

function PieWidget({ config, metrics, businessId, cardRange }) {
  const src = config.source||"revenue";
  const {mode="month",cStart="",cEnd=""}=cardRange||{};

  let rawItems=[], groupBy="category", isCount=false;
  if(src==="revenue")            rawItems=metrics?.revenue?.sources||[];
  else if(src==="costs"){
    const causes=metrics?.costs?.causes||[];
    const ii=(metrics?.investments?.initial||[]).map(x=>({...x,category:`Initial: ${x.category||"General"}`}));
    const io=(metrics?.investments?.ongoing||[]).map(x=>({...x,category:`Ongoing: ${x.category||"General"}`}));
    rawItems=[...causes,...ii,...io];
  }
  else if(src==="investments.initial") rawItems=metrics?.investments?.initial||[];
  else if(src==="investments.ongoing") rawItems=metrics?.investments?.ongoing||[];
  else if(src==="leads"){
    try{ rawItems=JSON.parse(localStorage.getItem(`earnedlab_leads_${businessId}`)||"[]"); }catch{ rawItems=[]; }
    groupBy="status"; isCount=true;
  } else if(src==="clients"){
    try{ rawItems=JSON.parse(localStorage.getItem(`earnedlab_clients_${businessId}`)||"[]"); }catch{ rawItems=[]; }
    groupBy="type"; isCount=true;
  }

  const filtered = mode==="all"?rawItems:filterDateRange(rawItems, mode, cStart, cEnd);
  const catMap={};
  filtered.forEach(item=>{
    const key = groupBy==="status"?(item.status||"Unknown")
              : groupBy==="type"?(item.type||item.category||"Unknown")
              : (item.category||item.name||"Other");
    catMap[key]=(catMap[key]||0)+(isCount?1:(item.amount||0));
  });
  const items=Object.entries(catMap).map(([name,value])=>({name,value}));
  const total=items.reduce((a,x)=>a+x.value,0);

  const COLORS=["#7C3AED","#3B82F6","#22C55E","#F59E0B","#EF4444","#EC4899","#14B8A6","#F97316"];
  const PIE_W=200, PIE_H=140;
  const canvasRef=useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const dpr=window.devicePixelRatio||1;
    canvas.width=PIE_W*dpr; canvas.height=PIE_H*dpr;
    canvas.style.width=PIE_W+"px"; canvas.style.height=PIE_H+"px";
    const ctx=canvas.getContext("2d"); ctx.scale(dpr,dpr);
    const cx=PIE_W/2, cy=PIE_H/2, r=Math.min(cx,cy)-8;
    ctx.clearRect(0,0,PIE_W,PIE_H);
    if(!items.length){ ctx.fillStyle=C.border; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill(); return; }
    let angle=-Math.PI/2;
    items.forEach((item,i)=>{
      const slice=total>0?item.value/total*Math.PI*2:Math.PI*2/items.length;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,angle,angle+slice); ctx.closePath();
      ctx.fillStyle=COLORS[i%COLORS.length]; ctx.fill();
      angle+=slice;
    });
    ctx.beginPath(); ctx.arc(cx,cy,r*0.48,0,Math.PI*2); ctx.fillStyle="#ffffff"; ctx.fill();
  },[items,total]); // eslint-disable-line react-hooks/exhaustive-deps

  const valFmt = v => isCount?v.toLocaleString():("$"+v.toLocaleString());
  return (
    <div>
      <canvas ref={canvasRef} style={{ display:"block", margin:"0 auto 6px", width:PIE_W+"px", height:PIE_H+"px" }}/>
      {!items.length&&<div style={{ fontSize:11, color:C.muted, fontFamily:FB, textAlign:"center" }}></div>}
      <div style={{ maxHeight:90, overflowY:"auto" }}>
        {items.map((item,i)=>(
          <div key={item.name} style={{ display:"flex", justifyContent:"space-between", fontSize:11, fontFamily:FB, padding:"2px 0" }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:COLORS[i%COLORS.length] }}/>
              <span style={{ color:C.text }}>{item.name}</span>
            </div>
            <span style={{ color:C.muted }}>{valFmt(item.value)} {total>0?`(${Math.round(item.value/total*100)}%)`:""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DrawingWidget({ widgetId }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);
  const KEY = `earnedlab_draw_${widgetId}`;
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const saved=localStorage.getItem(KEY);
    if(saved){ const img=new Image(); img.onload=()=>canvasRef.current?.getContext("2d").drawImage(img,0,0); img.src=saved; }
  },[]); // eslint-disable-line react-hooks/exhaustive-deps
  const getXY=(e,canvas)=>{ const r=canvas.getBoundingClientRect(); const s=e.touches?e.touches[0]:e; return [s.clientX-r.left,s.clientY-r.top]; };
  const startDraw=e=>{ e.preventDefault(); e.stopPropagation(); drawing.current=true; const [x,y]=getXY(e,canvasRef.current); lastPos.current=[x,y]; };
  const doDraw=e=>{ if(!drawing.current) return; e.preventDefault(); const canvas=canvasRef.current; if(!canvas) return; const ctx=canvas.getContext("2d"); const [x,y]=getXY(e,canvas); ctx.beginPath(); ctx.moveTo(lastPos.current[0],lastPos.current[1]); ctx.lineTo(x,y); ctx.strokeStyle="#374151"; ctx.lineWidth=2; ctx.lineCap="round"; ctx.stroke(); lastPos.current=[x,y]; };
  const stopDraw=()=>{ if(!drawing.current) return; drawing.current=false; lastPos.current=null; try{localStorage.setItem(KEY,canvasRef.current.toDataURL());}catch{}};
  const clearDraw=()=>{ const canvas=canvasRef.current; if(!canvas) return; canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height); try{localStorage.removeItem(KEY);}catch{}};
  return (
    <div>
      <canvas ref={canvasRef} width={300} height={200}
        style={{ background:"#FAFAFA", borderRadius:8, border:`1px solid ${C.border}`, cursor:"crosshair", touchAction:"none", display:"block" }}
        onMouseDown={startDraw} onMouseMove={doDraw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={doDraw} onTouchEnd={stopDraw}/>
      <button onClick={clearDraw} style={{ ...btnO(C.muted,10), marginTop:6, padding:"3px 10px" }}>Clear</button>
    </div>
  );
}

function IntraCorrelWidget({ config, metrics, businessId }) {
  const aF=LINK_FIELDS.find(f=>f.id===config.fieldA);
  const bF=LINK_FIELDS.find(f=>f.id===config.fieldB);
  if(!aF||!bF) return <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>Configure fields above.</div>;
  const [wMode,  setWMode]  = useState("all");
  const [wStart, setWStart] = useState("");
  const [wEnd,   setWEnd]   = useState("");
  const bid = businessId || config.businessId || "";
  const aVal    = _fieldRangeVal(aF.id, metrics, bid, wMode, wStart, wEnd);
  const bVal    = _fieldRangeVal(bF.id, metrics, bid, wMode, wStart, wEnd);
  const seriesA = _fieldTimeSeries(aF.id, metrics, bid, wMode, wStart, wEnd);
  const seriesB = _fieldTimeSeries(bF.id, metrics, bid, wMode, wStart, wEnd);
  const r       = (seriesA&&seriesB)?_pearson(seriesA,seriesB):null;
  const rLabel  = r===null?"Need more periods":r>0.7?"Strong positive":r>0.3?"Moderate positive":r<-0.7?"Strong negative":r<-0.3?"Moderate negative":"Weak";
  const rClr    = r===null?C.muted:r>0.3?"#22C55E":r<-0.3?"#EF4444":"#F59E0B";
  const perUnit = aVal>0?(bVal/aVal).toFixed(2):null;
  const rangeLabel = wMode==="day"?"Today":wMode==="week"?"This Week":wMode==="month"?"This Month":wMode==="year"?"This Year":wMode==="all"?"All Time":(wStart&&wEnd)?`${wStart}–${wEnd}`:"All Time";
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:8 }}>
        <span style={{ fontFamily:FH, fontWeight:700, fontSize:13 }}>{aF.label}</span>
        <span style={{ color:C.muted }}>vs</span>
        <span style={{ fontFamily:FH, fontWeight:700, fontSize:13 }}>{bF.label}</span>
        {r!==null&&<span style={{ fontSize:10, padding:"2px 7px", borderRadius:10, background:rClr+"18", color:rClr, fontFamily:FB, fontWeight:600 }}>{rLabel} (r={r})</span>}
      </div>
      {/* Range selector */}
      <div style={{ display:"flex", gap:4, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
        {["all","month","year","custom"].map(m=>(
          <button key={m} onClick={()=>setWMode(m)} style={{ fontSize:9, padding:"2px 7px", borderRadius:12, border:`1px solid ${wMode===m?C.text:C.border}`, background:wMode===m?C.dark:"transparent", color:wMode===m?"#fff":C.muted, cursor:"pointer", fontFamily:FB }}>
            {m==="all"?"All Time":m==="month"?"Month":m==="year"?"Year":"Custom"}
          </button>
        ))}
      </div>
      {wMode==="custom"&&(
        <div style={{ display:"flex", gap:4, marginBottom:8 }}>
          <input type="date" value={wStart} onChange={e=>setWStart(e.target.value)} style={{ ...inp(), fontSize:10, padding:"3px 6px", flex:1 }}/>
          <span style={{ color:C.muted, fontSize:10, alignSelf:"center" }}>–</span>
          <input type="date" value={wEnd}   onChange={e=>setWEnd(e.target.value)}   style={{ ...inp(), fontSize:10, padding:"3px 6px", flex:1 }}/>
        </div>
      )}
      {/* Value tiles */}
      <div style={{ display:"flex", gap:6, marginBottom:8 }}>
        {[{f:aF,v:aVal,c:"#3B82F6"},{f:bF,v:bVal,c:rClr===C.muted?"#64748B":rClr}].map(({f,v,c})=>(
          <div key={f.id} style={{ flex:1, background:"#F8FAFC", borderRadius:6, padding:"6px 8px", border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:9, color:C.muted, fontFamily:FB }}>{f.label}</div>
            <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, color:c }}>{f.prefix||""}{v.toLocaleString()}</div>
            <div style={{ fontSize:8, color:C.muted, fontFamily:FB }}>{rangeLabel}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:6 }}>
        {seriesA&&<div><div style={{ fontSize:9, color:C.muted, fontFamily:FB, marginBottom:2 }}>{aF.label}</div><MiniSparkline data={seriesA.length>=2?seriesA:null} color="#3B82F6" w={110} h={44}/></div>}
        {seriesB&&<div><div style={{ fontSize:9, color:C.muted, fontFamily:FB, marginBottom:2 }}>{bF.label}</div><MiniSparkline data={seriesB.length>=2?seriesB:null} color={rClr===C.muted?"#64748B":rClr} w={110} h={44}/></div>}
      </div>
      {perUnit&&<div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>Each +1 {aF.label} → {bF.prefix||""}{perUnit} {bF.label}</div>}
    </div>
  );
}

function CustomFieldWidget({ config, metrics }) {
  const formula = config.formula||[];
  let result=null;
  try{
    if(formula.length>=3){
      const a=_getFieldVal(metrics,LINK_FIELDS.find(f=>f.id===formula[0]?.value)?.path||"")||0;
      const b=_getFieldVal(metrics,LINK_FIELDS.find(f=>f.id===formula[2]?.value)?.path||"")||0;
      const op=formula[1]?.value;
      result=op==="+"?a+b:op==="-"?a-b:op==="×"?a*b:(op==="÷"&&b!==0)?+(a/b).toFixed(2):0;
    } else if(formula.length===1){
      result=_getFieldVal(metrics,LINK_FIELDS.find(f=>f.id===formula[0]?.value)?.path||"")||0;
    }
  }catch{}
  const formulaLabel=formula.map(o=>o.type==="field"?(LINK_FIELDS.find(f=>f.id===o.value)?.label||o.value):o.value).join(" ");
  return (
    <div>
      <div style={{ fontFamily:FH, fontWeight:700, fontSize:30, color:C.text }}>
        {config.prefix||""}{result!==null?Number(result).toLocaleString(undefined,{maximumFractionDigits:2}):"—"}
      </div>
      <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginTop:4 }}>{formulaLabel||"Configure formula in sidebar"}</div>
    </div>
  );
}

function EquationWidget({ config, metrics, saveM }) {
  const srcF=LINK_FIELDS.find(f=>f.id===config.source);
  const tgtF=LINK_FIELDS.find(f=>f.id===config.target);
  if(!srcF||!tgtF) return <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>Configure fields above.</div>;
  const srcVal=_getFieldVal(metrics,srcF.path)||0;
  const tgtVal=_getFieldVal(metrics,tgtF.path)||0;
  const sync=()=>saveM(tgtF.path,srcVal);
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ flex:1, background:C.surface, borderRadius:8, padding:"10px 12px", textAlign:"center" }}>
          <div style={{ fontSize:9, color:C.muted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>{srcF.label}</div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:22 }}>{srcF.prefix}{srcVal.toLocaleString()}</div>
        </div>
        <span style={{ fontSize:18, color:C.muted }}>→</span>
        <div style={{ flex:1, background:C.surface, borderRadius:8, padding:"10px 12px", textAlign:"center" }}>
          <div style={{ fontSize:9, color:C.muted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>{tgtF.label}</div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:22 }}>{tgtF.prefix}{tgtVal.toLocaleString()}</div>
        </div>
      </div>
      {config.label&&<div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginBottom:8 }}>{config.label}</div>}
      <button onClick={sync} style={{ ...btn(C.dark,"#fff",11), padding:"5px 14px", width:"100%" }}>Sync {srcF.label} → {tgtF.label}</button>
    </div>
  );
}

// ── MANAGEMENT SIDEBAR ────────────────────────────────────────────
function MgmtSidebar({ open, onToggle, hubNotes, setHubNotes, businessId, mgmtNoteAssignments, onAssignNote, onUnstickNote, deleteNote, onAddWidget, isPro }) {
  const [section, setSection] = useState("notes");
  const [activeTool, setActiveTool] = useState(null);
  const [cfg, setCfg] = useState({});
  const [noteText, setNoteText] = useState("");
  const [noteColor, setNoteColor] = useState(NOTE_BG_COLORS[0]);
  const [adding, setAdding] = useState(false);
  const [localDrag, setLocalDrag] = useState(null);

  const addNote = async()=>{
    if(!noteText.trim()) return; setAdding(true);
    try{ const {note}=await api.agents.addNote(businessId,noteText.trim(),noteColor); setHubNotes(p=>[note,...p]); setNoteText(""); }catch{}
    setAdding(false);
  };

  const startTool=(t)=>{ setActiveTool(t); setCfg({}); if(t==="draw"){ onAddWidget("draw",{},"Drawing"); setActiveTool(null); } };
  const cancelTool=()=>{ setActiveTool(null); setCfg({}); };
  const confirmTool=()=>{
    const titles={graph:"Line Chart",pie:"Pie Chart",corr:"Correlation",field:"Custom Field",eq:"Equation"};
    onAddWidget(activeTool,cfg,cfg.title||titles[activeTool]||activeTool);
    setActiveTool(null); setCfg({});
  };

  const configForm=()=>{
    const s={ ...inp(), fontSize:12, marginBottom:6 };
    const fldOpts=LINK_FIELDS.map(f=><option key={f.id} value={f.id}>{f.label}</option>);
    if(activeTool==="graph") return (<div>
      <select value={cfg.fieldId||""} onChange={e=>setCfg(p=>({...p,fieldId:e.target.value}))} style={s}><option value="">-- Select metric --</option>{fldOpts}</select>
      <div style={{ display:"flex", gap:6 }}><button onClick={confirmTool} disabled={!cfg.fieldId} style={{ ...btn(C.dark,"#fff",11), padding:"5px 14px" }}>Add</button><button onClick={cancelTool} style={{ ...btnO(C.muted,11), padding:"5px 10px" }}>Cancel</button></div>
    </div>);
    if(activeTool==="pie") return (<div>
      <select value={cfg.source||""} onChange={e=>setCfg(p=>({...p,source:e.target.value}))} style={s}>
        <option value="">-- source --</option>
        <option value="revenue">Revenue Sources</option>
        <option value="costs">Cost Causes</option>
        <option value="investments.initial">Initial Investments</option>
        <option value="investments.ongoing">Ongoing Investments</option>
        <option value="leads">Leads (by status)</option>
        <option value="clients">Clients (by type)</option>
      </select>
      <div style={{ display:"flex", gap:6 }}><button onClick={confirmTool} disabled={!cfg.source} style={{ ...btn(C.dark,"#fff",11), padding:"5px 14px" }}>Add</button><button onClick={cancelTool} style={{ ...btnO(C.muted,11), padding:"5px 10px" }}>Cancel</button></div>
    </div>);
    if(activeTool==="corr") return (<div>
      <select value={cfg.fieldA||""} onChange={e=>setCfg(p=>({...p,fieldA:e.target.value}))} style={s}><option value="">-- Field A --</option>{fldOpts}</select>
      <select value={cfg.fieldB||""} onChange={e=>setCfg(p=>({...p,fieldB:e.target.value}))} style={s}><option value="">-- Field B --</option>{LINK_FIELDS.filter(f=>f.id!==cfg.fieldA).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
      <div style={{ display:"flex", gap:6 }}><button onClick={confirmTool} disabled={!cfg.fieldA||!cfg.fieldB} style={{ ...btn(C.dark,"#fff",11), padding:"5px 14px" }}>Add</button><button onClick={cancelTool} style={{ ...btnO(C.muted,11), padding:"5px 10px" }}>Cancel</button></div>
    </div>);
    if(activeTool==="field") return (<div>
      <input value={cfg.title||""} onChange={e=>setCfg(p=>({...p,title:e.target.value}))} placeholder="Field name" style={s}/>
      <select value={(cfg.formula||[])[0]?.value||""} onChange={e=>setCfg(p=>({...p,formula:[{type:"field",value:e.target.value},...(p.formula||[]).slice(1)]}))} style={s}><option value="">-- Field A --</option>{fldOpts}</select>
      <select value={(cfg.formula||[null,{}])[1]?.value||""} onChange={e=>setCfg(p=>({...p,formula:[(p.formula||[{}])[0],{type:"op",value:e.target.value},(p.formula||[{},{},{}])[2]||{}]}))} style={s}>
        <option value="">-- Operator --</option>{["+","-","×","÷"].map(op=><option key={op} value={op}>{op}</option>)}
      </select>
      <select value={(cfg.formula||[null,null,{}])[2]?.value||""} onChange={e=>setCfg(p=>({...p,formula:[(p.formula||[{}])[0],(p.formula||[{},{}])[1],{type:"field",value:e.target.value}]}))} style={s}><option value="">-- Field B --</option>{LINK_FIELDS.filter(f=>f.id!==((cfg.formula||[])[0]?.value)).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
      <input value={cfg.prefix||""} onChange={e=>setCfg(p=>({...p,prefix:e.target.value}))} placeholder="Prefix ($, %, ...)" style={{...s,width:100}}/>
      <div style={{ display:"flex", gap:6 }}><button onClick={confirmTool} disabled={!cfg.title} style={{ ...btn(C.dark,"#fff",11), padding:"5px 14px" }}>Add</button><button onClick={cancelTool} style={{ ...btnO(C.muted,11), padding:"5px 10px" }}>Cancel</button></div>
    </div>);
    if(activeTool==="eq") return (<div>
      <select value={cfg.source||""} onChange={e=>setCfg(p=>({...p,source:e.target.value}))} style={s}><option value="">-- Source field --</option>{fldOpts}</select>
      <select value={cfg.target||""} onChange={e=>setCfg(p=>({...p,target:e.target.value}))} style={s}><option value="">-- Target field --</option>{LINK_FIELDS.filter(f=>f.id!==cfg.source).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
      <input value={cfg.label||""} onChange={e=>setCfg(p=>({...p,label:e.target.value}))} placeholder="Label (optional)" style={s}/>
      <div style={{ display:"flex", gap:6 }}><button onClick={confirmTool} disabled={!cfg.source||!cfg.target} style={{ ...btn(C.dark,"#fff",11), padding:"5px 14px" }}>Add</button><button onClick={cancelTool} style={{ ...btnO(C.muted,11), padding:"5px 10px" }}>Cancel</button></div>
    </div>);
    return null;
  };

  return (
    <>
      {/* Toggle button */}
      <div style={{ position:"fixed", right:open?290:0, top:"50%", transform:"translateY(-50%)", zIndex:302, transition:"right 0.25s ease" }}>
        <button onClick={onToggle} style={{ background:open?C.surface:C.dark, color:open?C.text:"#fff", border:`1px solid ${open?C.border:C.dark}`, borderRadius:"8px 0 0 8px", padding:"14px 7px", cursor:"pointer", fontSize:11, fontFamily:FB, fontWeight:700, letterSpacing:"0.05em", writingMode:"vertical-rl", textOrientation:"mixed", boxShadow:open?"none":"-4px 0 16px rgba(0,0,0,0.12)", lineHeight:1.2 }}>
          {open?"▶ Close":"◀ Tools"}
        </button>
      </div>

      {/* Panel */}
      {open && (
        <div style={{ position:"fixed", right:0, top:0, bottom:0, width:290, background:C.bg, borderLeft:`1px solid ${C.border}`, zIndex:300, display:"flex", flexDirection:"column", boxShadow:"-8px 0 32px rgba(0,0,0,0.09)" }}>
          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, flexShrink:0, paddingTop:8 }}>
            {[["notes","Notes"],["visuals","Visuals"],["analysis","Analysis"]].map(([k,l])=>(
              <button key={k} onClick={()=>{ setSection(k); setActiveTool(null); }} style={{ flex:1, padding:"8px 4px", fontSize:10, fontFamily:FB, fontWeight:600, background:"transparent", color:section===k?C.text:C.muted, border:"none", borderBottom:section===k?`2px solid ${C.text}`:"2px solid transparent", cursor:"pointer", letterSpacing:"0.03em" }}>{l}</button>
            ))}
          </div>

          {/* Scrollable content */}
          <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>
            {/* Notes */}
            {section==="notes" && (<>
              {hubNotes.length===0&&<div style={{ fontSize:11, color:C.muted, fontFamily:FB, textAlign:"center", padding:"16px 0" }}>No notes yet.</div>}
              {hubNotes.filter(n=>!(n.text||"").startsWith("[MANAGEMENT → MARKETING]")).map(n=>{
                const asgn=mgmtNoteAssignments[n.id];
                return (
                  <div key={n.id} draggable
                    onDragStart={e=>{e.dataTransfer.setData("text/noteId",n.id);setLocalDrag(n.id);}}
                    onDragEnd={()=>setLocalDrag(null)}
                    style={{ background:n.color||NOTE_BG_COLORS[0], borderRadius:8, padding:"8px 10px", marginBottom:6, display:"flex", gap:6, cursor:"grab", opacity:localDrag===n.id?0.4:1 }}>
                    <div style={{ fontSize:14, color:"rgba(0,0,0,0.25)", flexShrink:0, userSelect:"none", lineHeight:1.4 }}>⠿</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, color:"#374151", fontFamily:FB, lineHeight:1.5, wordBreak:"break-word" }}>{n.text}</div>
                      {asgn&&(<div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3 }}>
                        <span style={{ fontSize:10, color:"#6B7280", fontFamily:FB }}>pinned: {asgn.targetLabel||"Card"}</span>
                        <button onClick={()=>onUnstickNote(n.id)} aria-label="Unpin note" style={{ background:"none", border:"none", cursor:"pointer", color:"#D1D5DB", padding:0, display:"flex" }}><X size={10} aria-hidden="true" /></button>
                      </div>)}
                    </div>
                    <button onClick={()=>deleteNote(n.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:14, padding:0, flexShrink:0, alignSelf:"flex-start" }}>×</button>
                  </div>
                );
              })}
            </>)}

            {/* Visuals */}
            {section==="visuals" && (<>
              {activeTool?configForm():(
                <>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {["graph","pie","draw"].map(t=>{const d=WIDGET_DEFS[t];return(
                      <div key={t} draggable onDragStart={e=>{e.dataTransfer.setData("text/widgetType",t);}}
                        onClick={()=>startTool(t)}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, cursor:"grab", userSelect:"none" }}>
                        <div style={{ flex:1 }}><div style={{ fontSize:12, fontFamily:FB, fontWeight:700, color:C.text }}>{d.label}</div></div>
                        <span style={{ fontSize:10, color:C.subtle, fontFamily:FB }}>⠿</span>
                      </div>
                    );})}
                  </div>
                </>
              )}
            </>)}

            {/* Analysis */}
            {section==="analysis" && (<>
              {activeTool?configForm():(
                <ProGate isPro={isPro} label="Upgrade to Pro">
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {["corr","field","eq"].map(t=>{const d=WIDGET_DEFS[t];return(
                      <div key={t} draggable onDragStart={e=>{e.dataTransfer.setData("text/widgetType",t);}}
                        onClick={()=>startTool(t)}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, cursor:"grab", userSelect:"none" }}>
                        <div style={{ flex:1 }}><div style={{ fontSize:12, fontFamily:FB, fontWeight:700, color:C.text }}>{d.label}</div></div>
                        <span style={{ fontSize:10, color:C.subtle, fontFamily:FB }}>⠿</span>
                      </div>
                    );})}
                  </div>
                </ProGate>
              )}
            </>)}
          </div>

          {/* Note adder (shown when notes tab) */}
          {section==="notes" && (
            <div style={{ padding:"10px 12px", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
              <div style={{ display:"flex", gap:4, marginBottom:6 }}>
                {NOTE_BG_COLORS.map(clr=>(
                  <div key={clr} onClick={()=>setNoteColor(clr)} style={{ width:18, height:18, borderRadius:"50%", background:clr, cursor:"pointer", border:noteColor===clr?"2.5px solid #374151":"2.5px solid transparent", flexShrink:0 }}/>
                ))}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <input value={noteText} onChange={e=>setNoteText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNote()} placeholder="Add a note…" style={{ flex:1, fontSize:12, padding:"6px 10px", border:`1px solid ${C.border}`, borderRadius:8, fontFamily:FB, outline:"none", background:C.bg, color:C.text }}/>
                <button onClick={addNote} disabled={adding||!noteText.trim()} style={{ ...btn(C.dark,"#fff",11), padding:"6px 12px", flexShrink:0 }}>{adding?"…":"Add"}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ManagementCanvas({ businessId, metrics, saveM, integs, hubNotes, setHubNotes, stickyAssignments, assignSticky, unstickNote, mgmtNoteAssignments, mgmtAssignNote, mgmtUnstickNote, sidebarOpen, setSidebarOpen, deleteNote, isPro, isStarter, isAutopilot, onNotify, refreshTasks, insightsBudget, refreshBudget }) {
  const POS_KEY      = `earnedlab_mgmt_pos_${businessId}`;
  const CARDS_KEY    = `earnedlab_mgmt_cards_${businessId}`;
  const SNAP_KEY     = `earnedlab_snaps_${businessId}`;
  const WIDGETS_KEY  = `earnedlab_widgets_${businessId}`;
  const MODE_KEY     = `earnedlab_mgmt_mode_${businessId}`;

  const allowedModes = isAutopilot ? ["correlation","insights","autopilot"]
                     : isPro       ? ["correlation","insights"]
                     :               ["correlation"];
  const defaultMode  = isAutopilot ? "autopilot" : isPro ? "insights" : "correlation";
  // Read saved mode without validating against allowedModes — plan props may still be false
  // (planInfo not yet loaded). Validation/restore happens in the effect below.
  const [mgmtMode, setMgmtMode] = useState(()=>{
    try { const s=localStorage.getItem(MODE_KEY); if(s) return s; } catch {}
    return "correlation";
  });
  const saveMode = (m) => { setMgmtMode(m); try{localStorage.setItem(MODE_KEY,m);}catch{} };
  // When plan props resolve (planInfo loads), restore saved mode if now allowed,
  // or clamp down if the current mode exceeds the plan.
  useEffect(()=>{
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved && allowedModes.includes(saved)) { if (saved !== mgmtMode) setMgmtMode(saved); return; }
    } catch {}
    if (!allowedModes.includes(mgmtMode)) saveMode(defaultMode);
  },[isAutopilot, isPro]); // eslint-disable-line react-hooks/exhaustive-deps

  // Monthly snapshots for correlation trend data
  const [snapshots, setSnapshots] = useState(()=>{ try{return JSON.parse(localStorage.getItem(SNAP_KEY)||"[]");}catch{return [];} });
  useEffect(()=>{
    if(!metrics||!metrics.revenue) return;
    const monthKey=new Date().toISOString().slice(0,7);
    const snapRev  = metrics.revenue?.this_month||0;
    const snapCost = (metrics.costs?.this_month||0)+(metrics.investments?.total_initial||0)+(metrics.investments?.total_ongoing||0);
    const snap={
      month:monthKey,
      revenue:snapRev,
      costs:snapCost,
      profit:Math.max(0,snapRev-snapCost),
      loss:Math.max(0,snapCost-snapRev),
      leads:metrics.leads?.this_month||0,
      clients:metrics.clients?.active||0,
      bookings:metrics.bookings?.this_month||0,
      reviews:metrics.social?.google_reviews||0,
      investments:(metrics.investments?.total_initial||0)+(metrics.investments?.total_ongoing||0),
    };
    setSnapshots(prev=>{
      const next=[...prev.filter(s=>s.month!==monthKey),snap].slice(-12);
      try{localStorage.setItem(SNAP_KEY,JSON.stringify(next));}catch{}
      return next;
    });
  },[metrics]); // eslint-disable-line react-hooks/exhaustive-deps

  const [positions, setPositions] = useState(()=>{
    try{ const s=localStorage.getItem(POS_KEY); return s?JSON.parse(s):{...MGMT_DEFAULTS}; }catch{ return {...MGMT_DEFAULTS}; }
  });
  const [visible, setVisible] = useState(()=>{
    try{
      const s=localStorage.getItem(CARDS_KEY);
      if(s){
        const v=JSON.parse(s);
        // migrate: replace old "revenue" with split cards if user hasn't seen new ones yet
        if(v.includes("revenue")&&!v.some(x=>["costs","profit","loss","investments"].includes(x))){
          return [...v,"costs","profit"];
        }
        return v;
      }
      return ["leads","clients","revenue","costs","profit"];
    }catch{ return ["leads","clients","revenue","costs","profit"]; }
  });
  const [widgets, setWidgets] = useState(()=>{ try{return JSON.parse(localStorage.getItem(WIDGETS_KEY)||"[]");}catch{return [];} });
  const CARD_WIDGETS_KEY = `earnedlab_card_widgets_${businessId}`;
  const [cardWidgets, setCardWidgets] = useState(()=>{ try{return JSON.parse(localStorage.getItem(CARD_WIDGETS_KEY)||"{}");}catch{return {};} });
  const [globalRange, setGlobalRange] = useState(null);
  const [globalCStart, setGlobalCStart] = useState("");
  const [globalCEnd, setGlobalCEnd] = useState("");
  const [toolbar, setToolbar] = useState(false);
  const [dragActive, setDragActive] = useState(null);
  const [showProGate, setShowProGate] = useState(false);
  const dragging = useRef(null);

  const savePos     = p=>{ setPositions(p); try{localStorage.setItem(POS_KEY,JSON.stringify(p));}catch{} };
  const saveVisible = v=>{ setVisible(v);   try{localStorage.setItem(CARDS_KEY,JSON.stringify(v));}catch{} };

  const startDrag = (e,cardId)=>{
    const pos=positions[cardId]||MGMT_DEFAULTS[cardId]||{x:0,y:0};
    dragging.current={ cardId, mx0:e.clientX, my0:e.clientY, cx0:pos.x, cy0:pos.y, _pos:null };
    setDragActive(cardId);
  };

  useEffect(()=>{
    const posKey = POS_KEY;
    const onMove = e=>{
      if(!dragging.current) return;
      const{cardId,mx0,my0,cx0,cy0}=dragging.current;
      const nx=Math.max(0,cx0+e.clientX-mx0);
      const ny=Math.max(0,cy0+e.clientY-my0);
      setPositions(p=>{
        const up={...p,[cardId]:{...p[cardId],x:nx,y:ny}};
        dragging.current._pos=up;
        return up;
      });
    };
    const onUp = ()=>{
      if(!dragging.current) return;
      if(dragging.current._pos){ try{localStorage.setItem(posKey,JSON.stringify(dragging.current._pos));}catch{} }
      dragging.current=null; setDragActive(null);
    };
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mouseup",onUp);
    return()=>{ document.removeEventListener("mousemove",onMove); document.removeEventListener("mouseup",onUp); };
  },[POS_KEY]); // eslint-disable-line react-hooks/exhaustive-deps

  const addCard = id=>{
    const pos=MGMT_DEFAULTS[id]||{x:20,y:20,w:340};
    savePos({...positions,[id]:positions[id]||pos});
    saveVisible([...visible,id]);
    setToolbar(false);
  };
  const removeCard = id=>saveVisible(visible.filter(c=>c!==id));
  const resetLayout = ()=>{ savePos({...MGMT_DEFAULTS}); saveVisible(["leads","clients","revenue","costs","profit"]); };

  const addWidget = (type, config, title, pos) => {
    const id = `w_${Date.now()}`;
    const w = { id, type, config, title };
    const defaultPos = pos||{ x: 20, y: 20, w: type==="draw"?340:300 };
    setWidgets(p=>{ const n=[...p,w]; try{localStorage.setItem(WIDGETS_KEY,JSON.stringify(n));}catch{} return n; });
    setPositions(p=>{ const n={...p,[id]:defaultPos}; try{localStorage.setItem(POS_KEY,JSON.stringify(n));}catch{} return n; });
    return id;
  };
  const removeWidget = (id) => {
    setWidgets(p=>{ const n=p.filter(w=>w.id!==id); try{localStorage.setItem(WIDGETS_KEY,JSON.stringify(n));}catch{} return n; });
  };

  const CARD_AUTO_CFG = {
    revenue:     { graph:{ fieldId:"revenue" },     pie:{ source:"revenue" },             corr:{ fieldA:"revenue" } },
    costs:       { graph:{ fieldId:"costs"   },     pie:{ source:"costs"   },             corr:{ fieldA:"costs"   } },
    loss:        { graph:{ fieldId:"loss"    },     pie:{ source:"costs"   },             corr:{ fieldA:"loss"    } },
    profit:      { graph:{ fieldId:"profit"  },     pie:{ source:"revenue" },             corr:{ fieldA:"profit"  } },
    leads:       { graph:{ fieldId:"leads"   },     pie:{ source:"leads"   },             corr:{ fieldA:"leads"   } },
    clients:     { graph:{ fieldId:"clients" },     pie:{ source:"clients" },             corr:{ fieldA:"clients" } },
    bookings:    { graph:{ fieldId:"bookings"},                                           corr:{ fieldA:"bookings"} },
    investments: { graph:{ fieldId:"investments" }, pie:{ source:"investments.initial" }, corr:{ fieldA:"investments" } },
  };
  const addCardWidget = (cardId, type) => {
    const autoCfg = CARD_AUTO_CFG[cardId]?.[type] || {};
    const w = { id:`cw_${Date.now()}`, type, config:autoCfg, title:WIDGET_DEFS[type]?.label||type };
    setCardWidgets(prev=>{ const next={...prev,[cardId]:[...(prev[cardId]||[]),w]}; try{localStorage.setItem(CARD_WIDGETS_KEY,JSON.stringify(next));}catch{} return next; });
  };
  const updateCardWidgetConfig = (cardId, widgetId, config) => {
    setCardWidgets(prev=>{ const next={...prev,[cardId]:(prev[cardId]||[]).map(w=>w.id===widgetId?{...w,config}:w)}; try{localStorage.setItem(CARD_WIDGETS_KEY,JSON.stringify(next));}catch{} return next; });
  };
  const removeCardWidget = (cardId, widgetId) => {
    setCardWidgets(prev=>{ const next={...prev,[cardId]:(prev[cardId]||[]).filter(w=>w.id!==widgetId)}; try{localStorage.setItem(CARD_WIDGETS_KEY,JSON.stringify(next));}catch{} return next; });
  };

  const getNotesForCard = (cardId) =>
    Object.entries(mgmtNoteAssignments)
      .filter(([,{targetId}])=>targetId===cardId)
      .map(([nid])=>hubNotes.find(n=>n.id===nid))
      .filter(Boolean);

  const onDropNote = (noteId, cardId, label, unstickNoteId) => {
    if(unstickNoteId) { mgmtUnstickNote(unstickNoteId); return; }
    if(noteId && cardId) mgmtAssignNote(noteId, cardId, label||cardId);
  };

  const allIds = [...visible, ...widgets.map(w=>w.id)];
  const canvasH = Math.max(700, ...allIds.map(id=>{
    const p = positions[id]||MGMT_DEFAULTS[id]||{y:0};
    return (p.y||0)+480;
  }));

  const ALL=["leads","clients","revenue","costs","profit","loss","investments","bookings","google","email"];
  const addable=ALL.filter(id=>!visible.includes(id));

  const notesByTargetMap = Object.fromEntries(
    Object.entries(mgmtNoteAssignments)
      .map(([nid,{targetId}])=>[targetId, hubNotes.find(n=>n.id===nid)])
      .filter(([,note])=>!!note)
  );
  const noteProps = { notesByTarget:notesByTargetMap, onDropNote, onUnstickNote:mgmtUnstickNote };

  const cardContent = id=>{
    const gr = globalRange; const gc = [globalCStart, globalCEnd];
    switch(id){
      case "leads":       return <LeadsContent       metrics={metrics} saveM={saveM} businessId={businessId} globalRange={gr} globalCStart={gc[0]} globalCEnd={gc[1]} {...noteProps}/>;
      case "clients":     return <ClientsContent     metrics={metrics} saveM={saveM} businessId={businessId} globalRange={gr} globalCStart={gc[0]} globalCEnd={gc[1]} {...noteProps}/>;
      case "revenue":     return <RevenueContent     metrics={metrics} saveM={saveM} cardId="revenue" globalRange={gr} globalCStart={gc[0]} globalCEnd={gc[1]} {...noteProps}/>;
      case "costs":       return <CostsContent       metrics={metrics} saveM={saveM} cardId="costs"   globalRange={gr} globalCStart={gc[0]} globalCEnd={gc[1]} {...noteProps}/>;
      case "loss":        return <LossContent        metrics={metrics} globalRange={gr} globalCStart={gc[0]} globalCEnd={gc[1]}/>;
      case "profit":      return <ProfitContent      metrics={metrics} globalRange={gr} globalCStart={gc[0]} globalCEnd={gc[1]}/>;
      case "investments": return <InvestmentsContent metrics={metrics} saveM={saveM} cardId="investments" globalRange={gr} globalCStart={gc[0]} globalCEnd={gc[1]} {...noteProps}/>;
      case "bookings":    return <BookingsContent    metrics={metrics} saveM={saveM} integs={integs} globalRange={gr} globalCStart={gc[0]} globalCEnd={gc[1]}/>;
      case "google":      return <GoogleContent      metrics={metrics} saveM={saveM} integs={integs} globalRange={gr} globalCStart={gc[0]} globalCEnd={gc[1]}/>;
      case "email":       return <EmailContent       integs={integs} businessId={businessId} globalRange={gr} globalCStart={gc[0]} globalCEnd={gc[1]}/>;
      default:            return null;
    }
  };

  const updateStandaloneWidgetConfig = (wid, cfg) => {
    setWidgets(prev=>{
      const next=prev.map(x=>x.id===wid?{...x,config:cfg}:x);
      try{localStorage.setItem(WIDGETS_KEY,JSON.stringify(next));}catch{}
      return next;
    });
  };

  const widgetContent = (w) => (
    <EmbeddedWidget widget={w}
      onUpdateConfig={cfg=>updateStandaloneWidgetConfig(w.id,cfg)}
      onRemove={()=>removeWidget(w.id)}
      metrics={metrics} snapshots={snapshots} saveM={saveM}
      businessId={businessId} globalRange={globalRange} globalCStart={globalCStart} globalCEnd={globalCEnd}
      standalone={true}/>
  );

  return (
    <div style={{ paddingRight: sidebarOpen?300:0, transition:"padding-right 0.25s ease" }}>
      {showProGate && <PlansModal highlightPlan="pro" onClose={()=>setShowProGate(false)} />}
      <MgmtModeToggle mode={mgmtMode} onChange={saveMode} allowedModes={allowedModes} />
      <BusinessStrategySection businessId={businessId} metrics={metrics} snapshots={snapshots} isPro={isPro} isStarter={isStarter} mgmtMode={mgmtMode} saveM={saveM} isAutopilot={isAutopilot} onNotify={onNotify} refreshTasks={refreshTasks} insightsBudget={insightsBudget} refreshBudget={refreshBudget} />

      {/* Global time range bar */}
      <div style={{ padding:"10px 22px", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", background:C.surface, borderBottom:`1px solid ${C.border}`, marginBottom:16 }}>
        <span style={{ fontSize:11, color:C.muted, fontFamily:FB, fontWeight:600 }}>Time range:</span>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {[[null,"Per-card"],["day","Day"],["week","Week"],["month","Month"],["year","Year"],["all","All Time"],["custom","Custom"]].map(([v,l])=>(
            <button key={String(v)} onClick={()=>setGlobalRange(v)} style={{ fontSize:10, padding:"3px 10px", borderRadius:20, border:`1px solid ${globalRange===v?C.text:C.border}`, background:globalRange===v?"#F1F5F9":"transparent", color:globalRange===v?C.text:C.muted, fontFamily:FB, fontWeight:600, cursor:"pointer" }}>{l}</button>
          ))}
        </div>
        {globalRange==="custom"&&(
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <input type="date" value={globalCStart} onChange={e=>setGlobalCStart(e.target.value)} style={{ ...inp(), fontSize:11, padding:"3px 8px", width:"auto" }}/>
            <span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>–</span>
            <input type="date" value={globalCEnd} onChange={e=>setGlobalCEnd(e.target.value)} style={{ ...inp(), fontSize:11, padding:"3px 8px", width:"auto" }}/>
          </div>
        )}
      </div>

      <div style={{ position:"relative", minHeight:canvasH, marginBottom:64 }}
        onDragOver={e=>{ if(e.dataTransfer.types.includes("text/widgetType")) e.preventDefault(); }}
        onDrop={e=>{
          const wt=e.dataTransfer.getData("text/widgetType"); if(!wt) return;
          e.preventDefault();
          if(!isPro && ["corr","field","eq"].includes(wt)) { setShowProGate(true); return; }
          const rect=e.currentTarget.getBoundingClientRect();
          const x=Math.max(0,e.clientX-rect.left-150);
          const y=Math.max(0,e.clientY-rect.top-20);
          addWidget(wt,{},WIDGET_DEFS[wt]?.label||wt,{x,y,w:wt==="draw"?340:300});
        }}>
        {/* Regular channel cards */}
        {visible.map(id=>{
          const pos=positions[id]||MGMT_DEFAULTS[id]||{x:0,y:0,w:340};
          const notes=getNotesForCard(id);
          return (
            <DraggableCard key={id} id={id} pos={pos} meta={MGMT_META[id]} notes={notes}
              isDragging={dragActive===id} onDragStart={startDrag}
              onRemove={()=>removeCard(id)} onDropNote={onDropNote}
              onDropWidget={type=>addCardWidget(id,type)}
              embeddedWidgets={cardWidgets[id]||[]}
              onRemoveEmbeddedWidget={wid=>removeCardWidget(id,wid)}
              onUpdateWidgetConfig={(wid,cfg)=>updateCardWidgetConfig(id,wid,cfg)}
              metrics={metrics} snapshots={snapshots} saveM={saveM}
              businessId={businessId} globalRange={globalRange} globalCStart={globalCStart} globalCEnd={globalCEnd}>
              {cardContent(id)}
            </DraggableCard>
          );
        })}
        {/* Widget cards */}
        {widgets.map(w=>{
          const pos=positions[w.id]||{x:20,y:20,w:300};
          const notes=getNotesForCard(w.id);
          const wmeta={ label:w.title, icon:"", hdrBg:C.surface };
          return (
            <DraggableCard key={w.id} id={w.id} pos={pos} meta={wmeta} notes={notes}
              isDragging={dragActive===w.id} onDragStart={startDrag}
              onRemove={()=>removeWidget(w.id)} onDropNote={onDropNote}
              onDropWidget={type=>addCardWidget(w.id,type)}
              embeddedWidgets={cardWidgets[w.id]||[]}
              onRemoveEmbeddedWidget={wid=>removeCardWidget(w.id,wid)}
              onUpdateWidgetConfig={(wid,cfg)=>updateCardWidgetConfig(w.id,wid,cfg)}
              metrics={metrics} snapshots={snapshots} saveM={saveM}
              businessId={businessId} globalRange={globalRange} globalCStart={globalCStart} globalCEnd={globalCEnd}>
              {widgetContent(w)}
            </DraggableCard>
          );
        })}
      </div>

      <div style={{ display:"flex", justifyContent:"center" }}>
        {toolbar ? (
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:16, padding:"10px 14px", boxShadow:"0 8px 32px rgba(0,0,0,0.10)", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", maxWidth:640 }}>
            {addable.map(id=>(
              <button key={id} onClick={()=>addCard(id)} style={{ ...btnO("#475569",12) }}>
                + {MGMT_META[id].label}
              </button>
            ))}
            {addable.length===0&&<span style={{ fontSize:11, color:C.muted, fontFamily:FB }}>All channel cards on canvas</span>}
            <div style={{ width:1, alignSelf:"stretch", background:C.border, margin:"0 4px" }}/>
            <ProGate isPro={isPro} label="Upgrade to Pro">
              <div style={{ display:"flex", gap:8 }}>
                {["corr","field","eq"].map(t=>(
                  <button key={t} onClick={()=>{ addWidget(t,{},WIDGET_DEFS[t]?.label||t); setToolbar(false); }} style={{ ...btnO(C.muted,11) }}>
                    + {WIDGET_DEFS[t].label}
                  </button>
                ))}
              </div>
            </ProGate>
            <div style={{ width:1, alignSelf:"stretch", background:C.border, margin:"0 4px" }}/>
            <button onClick={resetLayout} style={{ ...btnO(C.muted,11) }}>Reset layout</button>
            <button onClick={()=>setToolbar(false)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16, padding:"0 4px" }}>×</button>
          </div>
        ) : (
          <button onClick={()=>setToolbar(true)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:20, padding:"8px 18px", fontSize:13, color:C.text, cursor:"pointer", boxShadow:"0 2px 12px rgba(0,0,0,0.07)", fontFamily:FB, display:"flex", alignItems:"center", gap:8 }}>
            + Add to canvas
          </button>
        )}
      </div>

      <MgmtSidebar
        open={sidebarOpen} onToggle={()=>setSidebarOpen(p=>!p)}
        hubNotes={hubNotes} setHubNotes={setHubNotes}
        businessId={businessId}
        mgmtNoteAssignments={mgmtNoteAssignments}
        onAssignNote={mgmtAssignNote}
        onUnstickNote={mgmtUnstickNote}
        deleteNote={deleteNote}
        onAddWidget={addWidget}
        isPro={isPro}
      />
    </div>
  );
}

// ── Missing Fields Bar ────────────────────────────────────────────────────────

function MissingFieldsBar({ prefs, metrics, onGo, agent }) {
  const bp = metrics?.businessProfile || {};
  const missing = [];

  if(!prefs?.targetMarket?.trim())    missing.push("target market");
  if(!bp.uniqueValueProp?.trim())     missing.push("unique value proposition");
  if(agent==="management"&&!bp.revenueTarget) missing.push("revenue target");

  if(!missing.length) return null;

  const fieldList = missing.length === 1
    ? missing[0]
    : missing.slice(0,-1).join(", ") + " and " + missing[missing.length-1];

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"9px 14px", marginBottom:20 }}>
      <div style={{ fontSize:12, color:"#92400E", fontFamily:FB, lineHeight:1.5 }}>
        <strong>Tip:</strong> Fill in your <strong>{fieldList}</strong> in Business Info for more accurate {agent==="marketing"?"marketing analysis":"business strategy"}.
      </div>
      <button onClick={onGo} style={{ ...btn("#D97706","#fff",11), padding:"5px 12px", flexShrink:0 }}>
        Business Info →
      </button>
    </div>
  );
}

// ── MAIN HUB ─────────────────────────────────────────────────────────────────

export default function Hub() {
  const { id: businessId } = useParams();
  const { user } = useStore();
  const [business,   setBusiness]   = useState(null);
  const [outputs,    setOutputs]    = useState([]);
  const [integs,     setIntegs]     = useState([]);
  const [tasks,      setTasks]      = useState([]);
  const [metrics,    setMetrics]    = useState({ revenue:{this_month:0,last_month:0,total:0,sources:[]}, costs:{this_month:0,last_month:0,total:0,causes:[]}, investments:{total_initial:0,total_ongoing:0,initial:[],ongoing:[]}, clients:{active:0,total:0}, leads:{this_month:0,total:0}, social:{instagram:0,tiktok:0,facebook:0,google_reviews:0,google_rating:0}, bookings:{this_week:0,this_month:0} });
  const [loading,    setLoading]    = useState(true);
  const [searchParams] = useSearchParams();
  const [tab,        setTab]        = useState(searchParams.get("tab") || "overview");
  const [planInfo,   setPlanInfo]   = useState(null);
  // Admins without an active simulation get full access; admins who are simulating a plan
  // are treated exactly as that plan so barriers render correctly during testing.
  const effPlan = (planInfo?.isAdmin && !planInfo?.simulating)
    ? "pro_autopilot"
    : (planInfo?.simulating || planInfo?.plan);
  const effIsPro      = effPlan === "pro" || effPlan === "pro_autopilot";
  const effIsAutopilot = effPlan === "pro_autopilot";
  const effIsStarter   = !effIsPro;
  const [showTour,   setShowTour]   = useState(false);
  const [genLoading, setGenLoading] = useState({});
  const [genError,   setGenError]   = useState("");
  const [prefs,      setPrefs]      = useState({ audience:"local", stage:"starting", goals:"", targetMarket:"" });
  const [hubQ,       setHubQ]       = useState("");
  const [hubAns,     setHubAns]     = useState("");
  const [hubLoading, setHubLoading] = useState(false);
  const [mgmtQ,      setMgmtQ]     = useState("");
  const [mgmtAns,    setMgmtAns]   = useState("");
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const [insightsBudget, setInsightsBudget] = useState(null);
  const [notesOpen,  setNotesOpen]  = useState(false);
  const [hubNotes,   setHubNotes]   = useState([]);
  const [noteText,   setNoteText]   = useState("");
  const [noteColor,  setNoteColor]  = useState(NOTE_BG_COLORS[0]);
  const [noteAdding, setNoteAdding] = useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState(null);
  const [mgmtNoteAssignments, setMgmtNoteAssignments] = useState(()=>{
    try { return JSON.parse(localStorage.getItem(`earnedlab_mgmt_sticky_${businessId}`)||"{}"); } catch { return {}; }
  });
  const [mgmtSidebarOpen, setMgmtSidebarOpen] = useState(false);
  const [stickyAssignments, setStickyAssignments] = useState(()=>{
    try { return JSON.parse(localStorage.getItem(`earnedlab_sticky_${businessId}`)||"{}"); } catch { return {}; }
  });
  const [autoNotifs, setAutoNotifs] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [agentNames, setAgentNames] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem(`el_agent_names_${businessId}`)||"{}"); }catch{ return {}; }
  });
  const [overviewBrief, setOverviewBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [overviewQ, setOverviewQ] = useState("");
  const [overviewBriefRan, setOverviewBriefRan] = useState(false);
  const navigate = useNavigate();

  const pushNotif = useCallback((n)=>{
    setAutoNotifs(prev=>{
      const without = prev.filter(x=>x.id!==n.id);
      return [...without, n].slice(-5);
    });
    if(n.status==="done") setTimeout(()=>setAutoNotifs(p=>p.filter(x=>x.id!==n.id)), 6000);
  }, []);
  const dismissNotif = id => setAutoNotifs(p=>p.filter(x=>x.id!==id));
  const refreshBudget = useCallback(()=>{
    if(!businessId) return;
    api.agents.access(businessId).then(d=>{ if(d.tokenBudget) setInsightsBudget(d.tokenBudget); }).catch(()=>{});
  },[businessId]);

  const age     = user?.age;
  const isMinor = age && age < 18;

  useEffect(()=>{
    const toured = localStorage.getItem(`earnedlab_toured_${businessId}`);
    if (!toured) setShowTour(true);
  },[businessId]);

  useEffect(()=>{ api.subscriptions.me().then(setPlanInfo).catch(()=>{}); },[]);
  useEffect(()=>{
    if (!businessId) return;
    api.agents.access(businessId).then(d=>{ if(d.tokenBudget) setInsightsBudget(d.tokenBudget); }).catch(()=>{});
  },[businessId]);

  useEffect(()=>{
    if (!businessId) return;
    api.agents.notes(businessId).then(d=>setHubNotes(d.notes||[])).catch(()=>{});
  },[businessId]);

  // Intercept interactive clicks when trial is expired — data stays visible
  useEffect(() => {
    if (!planInfo?.locked) return;
    const handler = (e) => {
      const el = e.target;
      if (el.closest(".trial-expired-modal")) return;
      const interactive = el.tagName==="BUTTON" || el.tagName==="INPUT" || el.tagName==="SELECT" || el.tagName==="TEXTAREA" || el.closest("button") || el.getAttribute("role")==="button";
      if (interactive) {
        e.preventDefault();
        e.stopPropagation();
        setShowTrialExpiredModal(true);
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [planInfo?.locked]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const addHubNote = async () => {
    if (!noteText.trim()) return;
    setNoteAdding(true);
    try {
      const { note } = await api.agents.addNote(businessId, noteText.trim(), noteColor);
      setHubNotes(p=>[note,...p]);
      setNoteText("");
    } catch {}
    setNoteAdding(false);
  };

  const deleteHubNote = (id) => {
    setHubNotes(p=>p.filter(n=>n.id!==id));
    api.agents.deleteNote(businessId, id).catch(()=>{});
    // Also remove any sticky assignment for this note
    setStickyAssignments(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (next[k]?.noteId === id) delete next[k]; });
      try { localStorage.setItem(`earnedlab_sticky_${businessId}`, JSON.stringify(next)); } catch {}
      return next;
    });
    setMgmtNoteAssignments(prev => {
      const next = { ...prev };
      delete next[id];
      try { localStorage.setItem(`earnedlab_mgmt_sticky_${businessId}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const assignSticky = (noteId, targetId, targetLabel) => {
    setStickyAssignments(prev => {
      // Remove any existing assignment for this noteId
      const next = Object.fromEntries(Object.entries(prev).filter(([,v])=>v.noteId!==noteId));
      next[targetId] = { noteId, targetLabel };
      try { localStorage.setItem(`earnedlab_sticky_${businessId}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const unstickNote = (targetId) => {
    setStickyAssignments(prev => {
      const next = { ...prev };
      delete next[targetId];
      try { localStorage.setItem(`earnedlab_sticky_${businessId}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const mgmtAssignNote = (noteId, targetId, targetLabel) => {
    setMgmtNoteAssignments(prev => {
      const next = { ...prev, [noteId]: { targetId, targetLabel } };
      try { localStorage.setItem(`earnedlab_mgmt_sticky_${businessId}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const mgmtUnstickNote = (noteId) => {
    setMgmtNoteAssignments(prev => {
      const next = { ...prev };
      delete next[noteId];
      try { localStorage.setItem(`earnedlab_mgmt_sticky_${businessId}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  useEffect(()=>{
    Promise.all([
      api.businesses.get(businessId),
      api.businesses.outputs(businessId),
      api.integrations.list(businessId),
      api.metrics.get(businessId),
      api.tasks.list(businessId),
    ]).then(([{business:b},{outputs:o},{integrations:ig},{metrics:m},{tasks:t}])=>{
      setBusiness(b); setOutputs(o); setIntegs(ig); setTasks(t||[]);
      if(m) { const { prefs:p, ...rest } = m; setMetrics(rest); if(p) setPrefs(p); }
    }).catch(console.error).finally(()=>setLoading(false));
  },[businessId]);

  const refreshTasks = (updatedTasks) => {
    if (updatedTasks) { setTasks(updatedTasks); return; }
    api.tasks.list(businessId).then(d => setTasks(d.tasks||[])).catch(()=>{});
  };

  // Re-fetch tasks when switching to tasks tab to keep count current
  useEffect(()=>{ if (tab==="tasks") refreshTasks(); },[tab]); // eslint-disable-line react-hooks/exhaustive-deps


  const idea     = (()=>{ try{return JSON.parse(business?.ideaData||"{}");}catch{return {};} })();
  const getOutput= type => outputs.find(o=>o.type===type);
  const isConn   = p => integs.find(i=>i.provider===p)?.status==="connected";

  const marketingName  = agentNames.marketing  || "Your Market Analyst";
  const managementName = agentNames.management || "Your Operations Manager";
  const hubAgentName   = agentNames.hub        || "Your Intelligence Agent";

  const dismissTour = () => {
    localStorage.setItem(`earnedlab_toured_${businessId}`, "1");
    setShowTour(false);
  };

  const runOverviewBrief = async (question) => {
    setBriefLoading(true); setOverviewBrief("");

    // ── financials: use same _fieldRangeVal logic as canvas cards ─────────────
    const totalRev  = _fieldRangeVal("revenue",     metrics, businessId, "all", "", "");
    const totalCosts= _fieldRangeVal("costs",       metrics, businessId, "all", "", "");
    const totalInv  = _fieldRangeVal("investments", metrics, businessId, "all", "", "");
    const profit    = _fieldRangeVal("profit",      metrics, businessId, "all", "", "");
    const loss      = _fieldRangeVal("loss",        metrics, businessId, "all", "", "");
    const leadCount = _fieldRangeVal("leads",       metrics, businessId, "all", "", "");
    const clientCnt = _fieldRangeVal("clients",     metrics, businessId, "all", "", "");

    const topRevSrcs = [...(metrics?.revenue?.sources||[])]
      .sort((a,b)=>(b.amount||0)-(a.amount||0)).slice(0,3)
      .map(s=>`${s.name||"Source"}: $${s.amount||0}`);
    const topCostItems = [...(metrics?.costs?.causes||[]),...(metrics?.investments?.initial||[]),...(metrics?.investments?.ongoing||[])]
      .sort((a,b)=>(b.amount||0)-(a.amount||0)).slice(0,3)
      .map(c=>`${c.name||"Cost"}: $${c.amount||0}`);

    // ── tasks ─────────────────────────────────────────────────────────────────
    const allTasks  = tasks.filter(t=>t.category!=="notes");
    const doneTasks = allTasks.filter(t=>t.status==="done");
    const pendTasks = allTasks.filter(t=>t.status!=="done"&&t.category!=="campaign");

    // ── integrations, social, bookings ────────────────────────────────────────
    const social   = metrics?.social||{};
    const bookings = metrics?.bookings||{};
    const connChs  = integs.filter(i=>i.status==="connected").map(i=>{
      const f = typeof i.fields==="string"?(()=>{ try{ return JSON.parse(i.fields); }catch{ return {}; } })():i.fields||{};
      return `${i.provider}${f.handle?` @${f.handle}`:f.address?` (${f.address})`:f.bookingUrl?` (${f.bookingUrl})`:""}`;
    });

    // ── business profile ──────────────────────────────────────────────────────
    const bp    = metrics?.businessProfile||{};
    const prods = (bp.products||[]).slice(0,4).map(p=>`${p.name||""}${p.price?` ($${p.price})`:""}`).filter(Boolean);

    // ── marketing agent output ────────────────────────────────────────────────
    const mktgOut = getOutput("marketing_insights") || getOutput("marketing_notes");
    let mktgData  = null;
    try { if(mktgOut?.content) mktgData = JSON.parse(mktgOut.content); } catch {}

    // ── latest generated strategy ─────────────────────────────────────────────
    const lastStrat = (()=>{ try{ const s=localStorage.getItem(`earnedlab_strat_${businessId}`); return s?JSON.parse(s):null; }catch{ return null; } })();

    // ── context block ─────────────────────────────────────────────────────────
    const ctx = [
      `Business: ${business?.name||"—"} | ${idea?.name||""} | ${business?.location||""}`,
      bp.uniqueValueProp ? `Value proposition: ${bp.uniqueValueProp}` : "",
      prods.length       ? `Products/services: ${prods.join(", ")}` : "",
      prefs?.goals       ? `Owner goal: ${prefs.goals}` : "",
      `Financials: Revenue $${totalRev.toLocaleString()}, Costs $${totalCosts.toLocaleString()}, Investments $${totalInv.toLocaleString()}, Profit $${profit.toLocaleString()}${loss>0?`, Loss $${loss.toLocaleString()}`:""}`,
      topRevSrcs.length    ? `Top revenue sources: ${topRevSrcs.join(" | ")}` : "",
      topCostItems.length  ? `Top cost items: ${topCostItems.join(" | ")}` : "",
      `Pipeline: ${leadCount} leads, ${clientCnt} active clients, ${bookings.this_month||0} bookings this month / ${bookings.this_week||0} this week`,
      social.instagram||social.instagram_followers||social.tiktok||social.tiktok_followers
        ? `Social: ${[
            (social.instagram||social.instagram_followers)?`Instagram ${social.instagram||social.instagram_followers}`:"",
            (social.tiktok||social.tiktok_followers)?`TikTok ${social.tiktok||social.tiktok_followers}`:"",
            social.twitter_followers?`Twitter ${social.twitter_followers}`:"",
          ].filter(Boolean).join(", ")}`
        : "",
      connChs.length ? `Connected channels: ${connChs.join(", ")}` : "Connected channels: none",
      `Tasks: ${doneTasks.length}/${allTasks.length} done. Completed: ${doneTasks.slice(-6).map(t=>t.name).join(", ")||"none"}. Pending: ${pendTasks.slice(0,6).map(t=>t.name).join(", ")||"none"}`,
      mktgData
        ? `Marketing analysis (${mktgData.ranAt?new Date(mktgData.ranAt).toLocaleDateString():"recent"}): ${mktgData.report?.analysis?.summary||mktgData.overview?.summary||""}. Top recommendations: ${(mktgData.insights||[]).slice(0,4).map(i=>i.title||i.recommendation).filter(Boolean).join("; ")||"none"}`
        : "Marketing analysis: not run yet",
      lastStrat
        ? `Business strategy (${lastStrat.timeframe||""}): Budget $${lastStrat.budget?.monthly||0}/mo. Outreach: ${(lastStrat.outreach?.suggestions||[]).slice(0,2).join("; ")||"none"}. Targets: ${(lastStrat.predictedOutcomes||[]).slice(0,2).join("; ")||"none"}`
        : "Business strategy: not generated yet",
    ].filter(Boolean).join("\n");

    const format = "Plain text only. No markdown, no asterisks, no bullet points, no bold, no headers. Short clear sentences. Cite exact numbers from the data.";
    const q = question
      ? `${format}\n\nBUSINESS DATA:\n${ctx}\n\nUser question: "${question}"\n\nAnswer using only the real data above. Be specific.`
      : `${format}\n\nBUSINESS DATA:\n${ctx}\n\nGive a 3-sentence briefing: overall financial health with specific numbers, the single most important action right now, and one insight from the data.`;

    try{
      const { suggestion } = await api.metrics.suggest(businessId, q, prefs);
      const clean = (suggestion||"").replace(/\*\*/g,"").replace(/\*/g,"").replace(/^#{1,3}\s/gm,"").replace(/^-\s/gm,"");
      setOverviewBrief(clean);
    }catch(e){ setOverviewBrief("Unable to load briefing — check your connection."); }
    setBriefLoading(false);
    setOverviewBriefRan(true);
  };

  const saveM = async(path,v)=>{
    const parts=path.split(".");
    let updated;
    setMetrics(prev=>{
      const u=JSON.parse(JSON.stringify(prev)); let o=u;
      for(let i=0;i<parts.length-1;i++){ if(o[parts[i]]==null) o[parts[i]]={}; o=o[parts[i]]; }
      o[parts[parts.length-1]]=v; updated=u; return u;
    });
    await api.metrics.save(businessId,updated).catch(()=>{});
  };

  const generate = async(type,apiCall)=>{
    setGenLoading(p=>({...p,[type]:true})); setGenError("");
    try {
      const{output}=await apiCall(businessId);
      setOutputs(p=>{ const ex=p.find(o=>o.type===type); return ex?p.map(o=>o.type===type?output:o):[...p,output]; });
    } catch(e){ setGenError(e.message); }
    finally{ setGenLoading(p=>({...p,[type]:false})); }
  };

  const savePrefs = async(next) => {
    setPrefs(next);
    await api.metrics.save(businessId, { ...metrics, prefs: next }).catch(()=>{});
  };

  const saveAgentName = (key, val) => {
    const next = { ...agentNames, [key]: val };
    setAgentNames(next);
    try{ localStorage.setItem(`el_agent_names_${businessId}`, JSON.stringify(next)); }catch{}
  };

  const askHub  = async()=>{ if(!hubQ.trim())return; setHubLoading(true); setHubAns(""); try{const{suggestion}=await api.metrics.suggest(businessId,hubQ,prefs);setHubAns(suggestion);}catch(e){setHubAns("Error: "+e.message);} setHubLoading(false); };
  const askMgmt = async()=>{ if(!mgmtQ.trim())return; setHubLoading(true); try{const{suggestion}=await api.metrics.suggest(businessId,mgmtQ,prefs);setMgmtAns(suggestion);}catch(e){setMgmtAns("Error: "+e.message);} setHubLoading(false); setMgmtQ(""); };
  const VIEWABLE_FIELDS = {
    instagram:"handle", tiktok:"handle", twitter:"handle",
    facebook:"handle",  linkedin:"handle",
    google:"profileUrl", website:"siteUrl", calendly:"bookingUrl", email:"address",
  };
  const saveIntegFields = async (provider, vals) => {
    const intg = await api.integrations.saveFields(businessId, provider, vals);
    setIntegs(p => {
      const existing = p.find(i=>i.provider===provider);
      return existing ? p.map(i=>i.provider===provider?intg.integration:i) : [...p, intg.integration];
    });
    const vf = VIEWABLE_FIELDS[provider];
    if (vf && vals[vf] !== undefined) {
      try {
        const checked = await api.integrations.checkViewable(businessId, provider);
        setIntegs(p => p.map(i=>i.provider===provider?checked.integration:i));
      } catch { /* silent — viewable check is best-effort */ }
    }
  };

  if(loading) return (
    <div style={{ display:"flex", minHeight:"100vh", alignItems:"center", justifyContent:"center", background:C.bg }}>
      <div style={{ width:32, height:32, borderRadius:"50%", border:`3px solid ${C.dark}20`, borderTopColor:C.dark, animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  // Shared note-drop system for all non-management tabs
  const sharedNotesByTarget = Object.fromEntries(
    Object.entries(stickyAssignments)
      .map(([targetId, {noteId}])=>{
        const note = hubNotes.find(n=>n.id===noteId);
        return [targetId, note ? {id:noteId, text:note.text||note.description, color:note.color} : null];
      })
      .filter(([,v])=>v)
  );
  const sharedDropNote = (noteId, targetId, label) => assignSticky(noteId, targetId, label||targetId);
  const sharedUnstickNote = (targetId) => unstickNote(targetId);

  const navItems = [
    { id:"overview",      label:"Overview"       },
    { id:"business_info", label:"Business Info"  },
    { id:"hub",           label:hubAgentName     },
    { id:"marketing",     label:marketingName    },
    { id:"management",    label:managementName   },
    { id:"tasks",         label:"Tasks"          },
  ];

  const regularTasks = tasks.filter(t => t.category !== "notes");
  const tasksDone  = regularTasks.filter(t=>t.status==="done").length;
  const tasksTotal = regularTasks.length;

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:FB }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {showTour && <GuidedTour business={business} user={user} onDone={dismissTour} />}

      {/* Expired trial: intercept interactive clicks; data remains fully visible/scrollable */}
      {showTrialExpiredModal && (
        <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.55)" }}
          onClick={() => setShowTrialExpiredModal(false)}>
          <div className="trial-expired-modal" onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:16, padding:"32px 36px", maxWidth:400, width:"90%", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ marginBottom:12, display:"flex", justifyContent:"center", color:C.muted }}><LockKeyhole size={36} aria-hidden="true" /></div>
            <div style={{ fontFamily:FH, fontWeight:700, fontSize:20, marginBottom:8, color:"#111" }}>Your trial has ended</div>
            <p style={{ fontSize:13, color:"#6B7280", fontFamily:FB, lineHeight:1.6, marginBottom:20 }}>
              Your data is safe. Upgrade to a paid plan to continue using all features — your history, tasks, and settings will all be here waiting.
            </p>
            <button onClick={()=>navigate("/pricing")} style={{ ...btn(C.dark,"#fff",14), padding:"10px 28px", width:"100%", marginBottom:8 }}>
              View Plans & Pricing
            </button>
            <button onClick={()=>setShowTrialExpiredModal(false)} style={{ ...btnO(C.muted,12), padding:"7px 20px", width:"100%" }}>
              Keep browsing (view only)
            </button>
          </div>
        </div>
      )}

      {/* Mobile top bar */}
      {isMobile && (
        <div style={{ position:"fixed", top:0, left:0, right:0, height:52, background:C.dark, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", zIndex:120, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => setMobileSidebarOpen(o => !o)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.7)", padding:6, display:"flex", alignItems:"center", justifyContent:"center", minHeight:44, minWidth:44 }} aria-label="Open menu">
            <Menu size={20} aria-hidden="true" />
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <Logo size={18}/>
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:13, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.03em" }}>EarnedLab</span>
          </div>
          <div style={{ width:44 }} />
        </div>
      )}

      {/* Mobile sidebar overlay backdrop */}
      {isMobile && mobileSidebarOpen && (
        <div onClick={() => setMobileSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:129 }} />
      )}

      {/* Sidebar */}
      <div style={{ width: isMobile ? 230 : (sidebarCollapsed ? 52 : 230), background:C.dark, display:"flex", flexDirection:"column", flexShrink:0, position: isMobile ? "fixed" : "relative", top: isMobile ? 0 : undefined, left: isMobile ? (mobileSidebarOpen ? 0 : -230) : undefined, bottom: isMobile ? 0 : undefined, overflow:"hidden", transition: isMobile ? "left 0.25s ease" : "width 0.2s ease", zIndex: isMobile ? 130 : undefined }}>
        {/* Collapse toggle */}
        <button
          onClick={()=>setSidebarCollapsed(p=>!p)}
          title={sidebarCollapsed?"Expand sidebar":"Collapse sidebar"}
          style={{ position:"absolute", top:16, right:8, zIndex:10, background:"rgba(255,255,255,0.07)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.45)", fontSize:13, flexShrink:0 }}>
          {sidebarCollapsed ? "›" : "‹"}
        </button>

        {sidebarCollapsed ? (
          /* Collapsed: just logo + nav icons */
          <nav style={{ padding:"14px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
            <div style={{ marginBottom:10, cursor:"pointer" }} onClick={()=>setSidebarCollapsed(false)}>
              <Logo size={22}/>
            </div>
            {navItems.map(({id,label})=>(
              <div key={id} onClick={()=>{ setTab(id); if(isMobile) setMobileSidebarOpen(false); }} title={label}
                style={{ width:36, height:36, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", background:tab===id?"rgba(255,255,255,0.12)":"transparent", marginBottom:2 }}>
                <span style={{ fontSize:13, color:tab===id?"#fff":"rgba(255,255,255,0.45)", fontWeight:tab===id?700:400, fontFamily:FB }}>
                  {label.slice(0,2)}
                </span>
              </div>
            ))}
          </nav>
        ) : (
          <>
            <div style={{ padding:"20px 16px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", position:"relative" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, paddingRight:28 }}>
                <Logo size={22}/>
                <span style={{ fontFamily:FH, fontWeight:700, fontSize:15, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.03em" }}>EarnedLab</span>
              </div>
              <div style={{ fontFamily:FH, fontWeight:600, fontSize:13, color:"#fff", marginBottom:3, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{business?.name}</div>
              <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8 }}>
                <div style={{ width:4, height:4, borderRadius:"50%", background:"rgba(255,255,255,0.4)" }} />
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontFamily:FB, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{business?.location}</span>
              </div>
              {planInfo && (
                <div onClick={()=>navigate("/pricing")} style={{ cursor:"pointer", display:"inline-flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, padding:"3px 8px" }}>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.55)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", fontFamily:FB }}>
                    {planInfo.isAdmin ? `Admin${planInfo.simulating?" — "+planInfo.simulating.replace("_"," "):""}` : planInfo.locked?"Trial expired":planInfo.isTrial?`Trial — ${planInfo.trialDaysLeft}d left`:planInfo.plan}
                  </span>
                </div>
              )}
            </div>

            <nav style={{ padding:"10px 6px", flex:1 }}>
              {navItems.map(({id,label})=>(
                <div key={id} onClick={()=>{ setTab(id); if(isMobile) setMobileSidebarOpen(false); }} style={{ padding:"9px 12px", borderRadius:8, marginBottom:2, background:tab===id?"rgba(255,255,255,0.1)":"transparent", color:tab===id?"#fff":"rgba(255,255,255,0.55)", cursor:"pointer", fontSize:12, fontWeight:tab===id?600:400, fontFamily:FB, borderLeft:tab===id?"2px solid rgba(255,255,255,0.4)":"2px solid transparent", transition:"all 0.12s", display:"flex", justifyContent:"space-between", alignItems:"center", overflow:"hidden", minHeight:44 }}>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, minWidth:0 }}>{label}</span>
                  {id==="tasks" && tasksTotal > 0 && (
                    <span style={{ fontSize:9, background:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", padding:"1px 6px", borderRadius:20, fontWeight:700, flexShrink:0, marginLeft:4 }}>{tasksDone}/{tasksTotal}</span>
                  )}
                </div>
              ))}

              {/* Daily AI budget */}
              {(()=>{
                const rawLimit = insightsBudget?.limit || (effPlan==="pro_autopilot"?110000:effPlan==="pro"?110000:20000);
                const rawUsed  = insightsBudget?.used  || 0;
                const pct      = Math.min(100, rawLimit > 0 ? Math.round(rawUsed / rawLimit * 100) : 0);
                const barColor = pct >= 90 ? "#DC2626" : pct >= 70 ? "#D97706" : "rgba(255,255,255,0.35)";
                const fmtK = n => n >= 1000 ? `${(n/1000).toFixed(0)}k` : String(n);
                return (
                  <div style={{ padding:"6px 6px", marginTop:14, borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.35)", fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.05em" }}>Daily AI budget</span>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.35)", fontFamily:FB }}>
                        {fmtK(rawUsed)}/{fmtK(rawLimit)}
                      </span>
                    </div>
                    <div style={{ height:2, borderRadius:2, background:"rgba(255,255,255,0.08)" }}>
                      <div style={{ height:"100%", width:`${pct}%`, borderRadius:2, background:barColor, transition:"width 0.5s" }} />
                    </div>
                  </div>
                );
              })()}

              <div onClick={()=>{ navigate("/dashboard"); if(isMobile) setMobileSidebarOpen(false); }} style={{ padding:"7px 10px", borderRadius:7, color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:11, fontFamily:FB, marginTop:14, minHeight:44, display:"flex", alignItems:"center" }}>All businesses</div>
            </nav>
          </>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex:1, overflowY:"auto", background:C.bg, paddingTop: isMobile ? 52 : 0 }}>
        <div style={{ padding: isMobile ? "16px 16px 80px" : "28px 32px 80px", maxWidth:1100 }}>

          {/* OVERVIEW */}
          {tab==="overview" && (()=>{
            const lastStrat = (()=>{ try{ const s=localStorage.getItem(`earnedlab_strat_${businessId}`); return s?JSON.parse(s):null; }catch{ return null; } })();
            const mktgOutput = getOutput("marketing_insights") || getOutput("marketing_notes");
            const lastMktgNote = hubNotes.find(n=>(n.text||n.description||"").startsWith("[MANAGEMENT → MARKETING]"));
            return (
              <div>
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontFamily:FH, fontWeight:700, fontSize:26, letterSpacing:"-0.04em", color:C.text }}>{business?.name}</div>
                  <div style={{ fontSize:13, color:C.muted, fontFamily:FB, marginTop:2 }}>{business?.location}{idea.name?" · "+idea.name:""}</div>
                </div>

                {/* Intelligence Agent briefing card */}
                <div style={{ ...card("18px 20px"), marginBottom:20, borderLeft:`3px solid ${C.dark}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:overviewBrief||briefLoading?12:0 }}>
                    <div>
                      <div style={{ fontFamily:FH, fontWeight:700, fontSize:14 }}>{hubAgentName}</div>
                      <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginTop:1 }}>Your intelligence agent</div>
                    </div>
                    <button
                      onClick={()=>runOverviewBrief("")}
                      disabled={briefLoading}
                      style={{ ...btn(briefLoading?"#94A3B8":C.dark,"#fff",11), padding:"7px 14px", flexShrink:0 }}>
                      {briefLoading ? "Thinking…" : overviewBriefRan ? "Refresh" : "Brief me"}
                    </button>
                  </div>

                  {briefLoading && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 0", color:C.muted, fontSize:12, fontFamily:FB }}>
                      <span style={{ width:12, height:12, borderRadius:"50%", border:`2px solid ${C.muted}30`, borderTopColor:C.muted, animation:"spin 0.7s linear infinite", display:"inline-block", flexShrink:0 }}/>
                      Analyzing your business…
                    </div>
                  )}

                  {overviewBrief && !briefLoading && (
                    <div style={{ fontSize:13, color:C.text, fontFamily:FB, lineHeight:1.75, background:"#F8FAFC", borderRadius:8, padding:"12px 14px", marginBottom:12 }}>
                      {overviewBrief.replace(/\*\*/g,"").replace(/\*/g,"").replace(/^#{1,3}\s/gm,"").replace(/^-\s/gm,"")}
                    </div>
                  )}

                  {/* Follow-up Q&A */}
                  <div style={{ display:"flex", gap:8, marginTop:overviewBrief?0:4 }}>
                    <input
                      value={overviewQ}
                      onChange={e=>setOverviewQ(e.target.value)}
                      onKeyDown={e=>e.key==="Enter"&&overviewQ.trim()&&runOverviewBrief(overviewQ)}
                      placeholder="Ask anything about your business…"
                      style={{ ...inp(), fontSize:12, padding:"8px 12px", flex:1 }}
                    />
                    <button
                      onClick={()=>overviewQ.trim()&&runOverviewBrief(overviewQ)}
                      disabled={briefLoading||!overviewQ.trim()}
                      style={{ ...btn(briefLoading||!overviewQ.trim()?"#94A3B8":C.dark,"#fff",12), padding:"8px 16px", flexShrink:0 }}>
                      Ask
                    </button>
                  </div>
                </div>

                {/* Two-column summary cards */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
                  {/* Strategy summary */}
                  <div style={card("16px 18px")}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                      <div style={{ fontFamily:FH, fontWeight:700, fontSize:13 }}>Business Strategy</div>
                      <button onClick={()=>setTab("management")} style={{ fontSize:10, color:C.muted, background:"none", border:"none", cursor:"pointer", fontFamily:FB }}>View →</button>
                    </div>
                    {lastStrat ? (
                      <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                        {[
                          ["Budget", `$${(lastStrat.budget?.monthly||0).toLocaleString()}/mo`],
                          ["Outreach", `$${(lastStrat.outreach?.monthlySpend||0).toLocaleString()}/mo`],
                        ].map(([label, val])=>(
                          <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${C.border}` }}>
                            <span style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{label}</span>
                            <span style={{ fontSize:11, fontWeight:600, fontFamily:FB }}>{val}</span>
                          </div>
                        ))}
                        {(lastStrat.predictedOutcomes||[]).slice(0,2).map((o,i)=>(
                          <div key={i} style={{ fontSize:11, color:C.muted, fontFamily:FB, lineHeight:1.5, padding:"5px 0", borderBottom:`1px solid ${C.border}` }}>
                            {o}
                          </div>
                        ))}
                        {(lastStrat.outreach?.suggestions||[]).slice(0,1).map((s,i)=>(
                          <div key={i} style={{ fontSize:11, color:C.text, fontFamily:FB, lineHeight:1.5, paddingTop:5 }}>
                            {s}
                          </div>
                        ))}
                        {lastStrat.ranAt && <div style={{ fontSize:10, color:C.subtle, fontFamily:FB, marginTop:8 }}>Run {new Date(lastStrat.ranAt||Date.now()).toLocaleDateString()}</div>}
                      </div>
                    ) : (
                      <div style={{ fontSize:12, color:C.muted, fontFamily:FB, lineHeight:1.6 }}>
                        No strategy report yet.{" "}
                        <span onClick={()=>setTab("management")} style={{ color:C.text, textDecoration:"underline", cursor:"pointer" }}>Run one in {managementName} →</span>
                      </div>
                    )}
                  </div>

                  {/* Market analysis summary */}
                  <div style={card("16px 18px")}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                      <div style={{ fontFamily:FH, fontWeight:700, fontSize:13 }}>Market Analysis</div>
                      <button onClick={()=>setTab("marketing")} style={{ fontSize:10, color:C.muted, background:"none", border:"none", cursor:"pointer", fontFamily:FB }}>View →</button>
                    </div>
                    {mktgOutput?.content ? (()=>{
                      let parsed = null;
                      try { parsed = JSON.parse(mktgOutput.content); } catch {}
                      if (parsed) {
                        const summary = parsed.report?.analysis?.summary || parsed.overview?.summary || "";
                        const insights = (parsed.insights||[]).filter(i=>i.title).slice(0,3);
                        return (
                          <div>
                            {summary && (
                              <div style={{ fontSize:11, color:C.muted, fontFamily:FB, lineHeight:1.6, marginBottom:insights.length?10:0 }}>
                                {summary.length>160?summary.slice(0,157)+"…":summary}
                              </div>
                            )}
                            {insights.map((ins,i)=>(
                              <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"4px 0", borderTop:`1px solid ${C.border}` }}>
                                <span style={{ width:5, height:5, borderRadius:"50%", background:ins.priority==="high"?C.err:C.muted, flexShrink:0, marginTop:5 }}/>
                                <span style={{ fontSize:11, color:C.text, fontFamily:FB, lineHeight:1.4, flex:1 }}>{ins.title}</span>
                              </div>
                            ))}
                            {parsed.ranAt && <div style={{ fontSize:10, color:C.subtle, fontFamily:FB, marginTop:8 }}>Run {new Date(parsed.ranAt).toLocaleDateString()}</div>}
                          </div>
                        );
                      }
                      const text = mktgOutput.content;
                      return <div style={{ fontSize:11, color:C.text, fontFamily:FB, lineHeight:1.65 }}>{text.slice(0,200)}{text.length>200?"…":""}</div>;
                    })() : lastMktgNote ? (
                      <div>
                        <div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Latest sync</div>
                        {(lastMktgNote.text||lastMktgNote.description||"").split("\n").slice(2,7).filter(Boolean).map((l,i)=>(
                          <div key={i} style={{ fontSize:11, color:C.text, fontFamily:FB, lineHeight:1.5, padding:"4px 0", borderBottom:`1px solid ${C.border}` }}>{l}</div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize:12, color:C.muted, fontFamily:FB, lineHeight:1.6 }}>
                        No market analysis yet.{" "}
                        <span onClick={()=>setTab("marketing")} style={{ color:C.text, textDecoration:"underline", cursor:"pointer" }}>Run one in {marketingName} →</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tasks progress card */}
                {tasksTotal > 0 && (
                  <div onClick={()=>setTab("tasks")} style={{ ...card("14px 18px"), marginBottom:16, cursor:"pointer" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div style={{ fontFamily:FH, fontWeight:600, fontSize:13 }}>Tasks — {tasksDone} of {tasksTotal} done</div>
                      <span style={{ fontSize:11, color:C.muted, fontFamily:FB }}>View all →</span>
                    </div>
                    <div style={{ height:3, borderRadius:2, background:C.border, marginBottom:10 }}>
                      <div style={{ height:"100%", width:`${tasksTotal?(tasksDone/tasksTotal*100):0}%`, background:C.dark, borderRadius:2, transition:"width 0.3s" }} />
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {tasks.filter(t=>t.status!=="done"&&t.category!=="campaign"&&t.category!=="notes").slice(0,4).map(t=>(
                        <span key={t.id} style={{ fontSize:11, background:"#F8FAFC", color:C.muted, padding:"3px 10px", borderRadius:20, fontFamily:FB, border:`1px solid ${C.border}` }}>
                          {t.name}
                        </span>
                      ))}
                      {tasks.filter(t=>t.status!=="done"&&t.category!=="campaign"&&t.category!=="notes").length > 4 && (
                        <span style={{ fontSize:11, color:C.muted, fontFamily:FB, padding:"3px 6px" }}>+{tasks.filter(t=>t.status!=="done"&&t.category!=="campaign"&&t.category!=="notes").length-4} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick links */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:tasksTotal>0?0:16 }}>
                  {[
                    { label:"Business Info", tab:"business_info", sub:"Profile, products & presence" },
                    { label:hubAgentName, tab:"hub", sub:"Integrations & files" },
                    { label:"Tasks", tab:"tasks", sub:`${tasksDone}/${tasksTotal} complete` },
                  ].map(({label,tab:t,sub})=>(
                    <div key={t} onClick={()=>setTab(t)} style={{ ...card("12px 14px"), cursor:"pointer" }}>
                      <div style={{ fontFamily:FH, fontWeight:600, fontSize:12, marginBottom:3 }}>{label}</div>
                      <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* BUSINESS INFO */}
          {tab==="business_info" && (
            <BusinessInfoPanel
              businessId={businessId}
              metrics={metrics}
              saveM={saveM}
              prefs={prefs}
              savePrefs={savePrefs}
              business={business}
              onGoToMarketing={()=>setTab("marketing")}
              notesByTarget={sharedNotesByTarget}
              onDropNote={sharedDropNote}
              onUnstickNote={sharedUnstickNote}
            />
          )}

          {/* TASKS */}
          {tab==="tasks" && <TasksPanel businessId={businessId} businessName={business?.name||""} businessOutputs={outputs} hubNotes={hubNotes} stickyAssignments={stickyAssignments} onAssignSticky={assignSticky} onUnstickNote={unstickNote} onTasksChanged={refreshTasks} planInfo={planInfo}/>}

          {/* HUB / INTELLIGENCE AGENT */}
          {tab==="hub" && (
            <div>
              <div style={{ marginBottom:18 }}>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:26, letterSpacing:"-0.04em", marginBottom:2 }}>{hubAgentName}</div>
                <div style={{ fontSize:12, color:C.muted, fontFamily:FB, marginBottom:14 }}>Your intelligence agent</div>
                <div style={{ ...card("10px 14px"), display:"flex", alignItems:"center", gap:10, marginBottom:0 }}>
                  <label style={{ ...lbl, margin:0, whiteSpace:"nowrap", fontSize:10 }}>Agent name</label>
                  <input
                    value={agentNames.hub||""}
                    onChange={e=>saveAgentName("hub",e.target.value)}
                    placeholder="Your Intelligence Agent"
                    style={{ ...inp(), fontSize:12, padding:"6px 10px" }}
                  />
                </div>
              </div>
              <HubPanel
                businessId={businessId}
                integs={integs}
                onSaveFields={saveIntegFields}
                tasks={tasks}
                outputs={outputs}
                isMinor={!!isMinor}
                isAutopilotPlan={effIsAutopilot}
                notesByTarget={sharedNotesByTarget}
                onDropNote={sharedDropNote}
                onUnstickNote={sharedUnstickNote}
              />
            </div>
          )}

          {/* MARKETING AGENT */}
          {tab==="marketing" && (
            <div>
              <div style={{ marginBottom:18 }}>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:26, letterSpacing:"-0.04em", marginBottom:2 }}>{marketingName}</div>
                <div style={{ fontSize:12, color:C.muted, fontFamily:FB, marginBottom:14 }}>Your market analyst</div>
                <div style={{ ...card("10px 14px"), display:"flex", alignItems:"center", gap:10, marginBottom:0 }}>
                  <label style={{ ...lbl, margin:0, whiteSpace:"nowrap", fontSize:10 }}>Agent name</label>
                  <input
                    value={agentNames.marketing||""}
                    onChange={e=>saveAgentName("marketing",e.target.value)}
                    placeholder="Your Market Analyst"
                    style={{ ...inp(), fontSize:12, padding:"6px 10px" }}
                  />
                </div>
              </div>
              <MissingFieldsBar prefs={prefs} metrics={metrics} onGo={()=>setTab("business_info")} agent="marketing" />
              <AgentPanel businessId={businessId} businessName={business?.name || ""} metrics={metrics} planInfo={planInfo} integs={integs} setTab={setTab} refreshTasks={refreshTasks} hubNotes={hubNotes} stickyAssignments={stickyAssignments} onAssignSticky={assignSticky} onUnstickNote={unstickNote} refreshBudget={refreshBudget}/>
            </div>
          )}

          {/* MANAGEMENT AGENT */}
          {tab==="management" && (
            <div>
              <div style={{ marginBottom:18 }}>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:26, letterSpacing:"-0.04em", marginBottom:2 }}>{managementName}</div>
                <div style={{ fontSize:12, color:C.muted, fontFamily:FB, marginBottom:14 }}>Your operations manager</div>
                <div style={{ ...card("10px 14px"), display:"flex", alignItems:"center", gap:10, marginBottom:0 }}>
                  <label style={{ ...lbl, margin:0, whiteSpace:"nowrap", fontSize:10 }}>Agent name</label>
                  <input
                    value={agentNames.management||""}
                    onChange={e=>saveAgentName("management",e.target.value)}
                    placeholder="Your Operations Manager"
                    style={{ ...inp(), fontSize:12, padding:"6px 10px" }}
                  />
                </div>
              </div>
              <MissingFieldsBar prefs={prefs} metrics={metrics} onGo={()=>setTab("business_info")} agent="management" />

              <div style={{ ...card("16px 18px"), marginBottom:24, background:"#F8FAFC", border:`1px solid ${C.border}` }}>
                <div style={{ fontFamily:FH, fontWeight:600, fontSize:14, marginBottom:8 }}>Ask your management agent</div>
                <div style={{ display:"flex", gap:8, marginBottom:mgmtAns?12:0 }}>
                  <input value={mgmtQ} onChange={e=>setMgmtQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askMgmt()} placeholder="What should I focus on this week?" style={{ ...inp(), flex:1 }} />
                  <button onClick={askMgmt} disabled={hubLoading} style={{ ...btn(C.dark,"#fff",13), padding:"10px 16px", flexShrink:0 }}>{hubLoading?"…":"Ask"}</button>
                </div>
                {mgmtAns&&<div style={{ background:C.surface, borderRadius:10, padding:"12px 14px", fontSize:13, color:C.text, lineHeight:1.7, fontFamily:FB, border:`1px solid ${C.border}` }}>{mgmtAns}</div>}
              </div>

              <ManagementCanvas
                businessId={businessId}
                metrics={metrics}
                saveM={saveM}
                integs={integs}
                hubNotes={hubNotes}
                setHubNotes={setHubNotes}
                stickyAssignments={stickyAssignments}
                assignSticky={assignSticky}
                unstickNote={unstickNote}
                mgmtNoteAssignments={mgmtNoteAssignments}
                mgmtAssignNote={mgmtAssignNote}
                mgmtUnstickNote={mgmtUnstickNote}
                sidebarOpen={mgmtSidebarOpen}
                setSidebarOpen={setMgmtSidebarOpen}
                deleteNote={deleteHubNote}
                isPro={effIsPro}
                isStarter={effIsStarter}
                isAutopilot={effIsAutopilot}
                onNotify={pushNotif}
                refreshTasks={refreshTasks}
                insightsBudget={insightsBudget}
                refreshBudget={refreshBudget}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Notes Panel */}
      {notesOpen && (
        <div style={{ position:"fixed", bottom:120, right:24, zIndex:200, width:310, background:"#fff", borderRadius:14, boxShadow:"0 8px 40px rgba(0,0,0,0.15)", border:"1px solid #E5E7EB", overflow:"hidden" }}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid #F3F4F6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:13, color:"#111827" }}>
              Notes {hubNotes.length>0 && <span style={{ background:C.dark, color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10, marginLeft:4 }}>{hubNotes.length}</span>}
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:10, color:"#9CA3AF", fontFamily:FB }}>Drag to stick</span>
              <button onClick={()=>setNotesOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:18, lineHeight:1, padding:0 }}>×</button>
            </div>
          </div>
          <div style={{ maxHeight:260, overflowY:"auto", padding:"10px 12px" }}>
            {hubNotes.length===0 && <div style={{ fontSize:12, color:"#9CA3AF", textAlign:"center", padding:"12px 0", fontFamily:FB }}>No notes yet. Add one below.</div>}
            {hubNotes.filter(n=>!(n.text||"").startsWith("[MANAGEMENT → MARKETING]")).map(n=>{
              const stuckTo = Object.entries(stickyAssignments).find(([,v])=>v.noteId===n.id);
              return (
                <div key={n.id}
                  draggable
                  onDragStart={e=>{ e.dataTransfer.setData("text/noteId", n.id); setDraggedNoteId(n.id); }}
                  onDragEnd={()=>setDraggedNoteId(null)}
                  style={{ background:n.color||NOTE_BG_COLORS[0], borderRadius:8, padding:"8px 10px", marginBottom:6, display:"flex", gap:6, cursor:"grab", opacity:draggedNoteId===n.id?0.5:1 }}>
                  <div style={{ fontSize:14, color:"#9CA3AF", flexShrink:0, lineHeight:1.3, userSelect:"none" }}>⠿</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, color:"#374151", fontFamily:FB, lineHeight:1.5, wordBreak:"break-word" }}>{n.text}</div>
                    {stuckTo && (
                      <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
                        <span style={{ fontSize:10, color:"#6B7280", fontFamily:FB, display:"flex", alignItems:"center", gap:3 }}><Pin size={10} aria-hidden="true" /> {stuckTo[1].targetLabel || "Item"}</span>
                        <button onClick={()=>unstickNote(stuckTo[0])} aria-label="Unpin note" style={{ background:"none", border:"none", cursor:"pointer", color:"#D1D5DB", padding:0, display:"flex" }}><X size={10} aria-hidden="true" /></button>
                      </div>
                    )}
                  </div>
                  <button onClick={()=>deleteHubNote(n.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:14, padding:0, flexShrink:0, alignSelf:"flex-start" }}>×</button>
                </div>
              );
            })}
          </div>
          <div style={{ padding:"8px 12px", borderTop:"1px solid #F3F4F6" }}>
            <div style={{ display:"flex", gap:4, marginBottom:6 }}>
              {NOTE_BG_COLORS.map(clr=>(
                <div key={clr} onClick={()=>setNoteColor(clr)} style={{ width:18, height:18, borderRadius:"50%", background:clr, cursor:"pointer", border:noteColor===clr?"2px solid #374151":"2px solid transparent" }} />
              ))}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <input value={noteText} onChange={e=>setNoteText(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addHubNote()}
                placeholder="Add a note…"
                style={{ flex:1, fontSize:12, padding:"6px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontFamily:FB, outline:"none" }}
              />
              <button onClick={addHubNote} disabled={noteAdding||!noteText.trim()} style={{ ...btn(C.dark,"#fff",11), padding:"6px 12px", flexShrink:0 }}>
                {noteAdding?"…":"Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={()=>setNotesOpen(o=>!o)} style={{ background:notesOpen?"#F3F4F6":"#fff", color:notesOpen?C.text:"#6B7280", border:`1px solid ${notesOpen?C.border:"#E5E7EB"}`, borderRadius:24, padding:"10px 16px", fontSize:13, fontWeight:500, cursor:"pointer", position:"fixed", bottom:24, right:24, boxShadow:"0 2px 10px rgba(0,0,0,0.08)", zIndex:99, fontFamily:FB, display:"flex", alignItems:"center", gap:6 }}>
        Notes{hubNotes.length>0 && <span style={{ background:C.dark, color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10 }}>{hubNotes.length}</span>}
      </button>

      <AutoNotifications notifications={autoNotifs} onDismiss={dismissNotif} />
    </div>
  );
}
