import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import useStore from "../lib/store";
import { api } from "../lib/api";
import { C, FH, FB, btn, btnO, card, inp, lbl, GuidePanel, Logo } from "../components";
import AgentPanel from "./MarketingAgent";
import { generatePostImageBlob } from "../lib/postImageCanvas";

// ── GUIDED TOUR ───────────────────────────────────────────────────────────────

function GuidedTour({ business, user, onDone }) {
  const [step, setStep] = useState(0);
  const firstName = (user?.name||"").split(" ")[0] || "there";
  const bizName = business?.name || "your business";
  const idea = (() => { try { return JSON.parse(business?.ideaData||"{}"); } catch { return {}; } })();

  const steps = [
    {
      emoji: "👋",
      title: `Welcome to ${bizName}`,
      body: `Hey ${firstName} — this is your business command center. Everything runs from here. Let me walk you through it in about a minute.`,
    },
    {
      emoji: "✅",
      title: "Your Tasks",
      body: `Tasks are your business to-do list that actually does things. Some — like writing a business plan, 30-day content calendar, or website — can be generated instantly by your AI. Others, like registering your business name or getting a license, need your action. Either way, every completed task stores its output here permanently. You can add, remove, or customize any task.`,
      cta: "Open the Tasks tab to see yours →",
    },
    {
      emoji: "📊",
      title: "Marketing Agent",
      body: `Your Marketing Agent reads your real numbers — revenue, clients, social following${idea.name ? ` — all specific to ${idea.name}` : ""} — and surfaces the top opportunities ranked by impact. Run an analysis any time you want to know what to do next.`,
      cta: "Marketing Agent → Run analysis",
    },
    {
      emoji: "⚙️",
      title: "Management Agent",
      body: `The Management Agent makes those opportunities happen. It can update your live website, produce new content, and adjust your strategy — all based on the metrics you log. The more you track, the smarter it gets.`,
      cta: "Management Agent → Log your numbers",
    },
    {
      emoji: "🔗",
      title: "Your Hub",
      body: `The Hub is where you connect your tools and store your files. Add your Calendly booking link, Instagram handle, business domain, and more — the agents use this context to give better output. All generated files (website, business plan, content calendar) live in the Files Archive and are always accessible.`,
      cta: "Hub → Connect your first tool",
    },
    {
      emoji: "🤖",
      title: "Autopilot (Pro Autopilot plan)",
      body: `On the Pro Autopilot plan your agents run on their own schedule — no input needed. They check performance, find opportunities, and push improvements automatically. You stay in control but stop doing the daily work.`,
    },
    {
      emoji: "🚀",
      title: `You're ready, ${firstName}.`,
      body: `That's the full picture. Start by checking your tasks — several can be done right now with one click. Your agents are standing by whenever you're ready.`,
    },
  ];

  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:C.surface, borderRadius:20, padding:"32px 36px", maxWidth:500, width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,0.35)" }}>
        <div style={{ display:"flex", gap:4, marginBottom:28 }}>
          {steps.map((_,i) => (
            <div key={i} style={{ height:3, flex:1, borderRadius:2, background:i<=step?C.primary:"#E5E7EB", transition:"background 0.25s" }} />
          ))}
        </div>
        <div style={{ fontSize:38, marginBottom:14, lineHeight:1 }}>{s.emoji}</div>
        <div style={{ fontFamily:FH, fontWeight:700, fontSize:22, letterSpacing:"-0.04em", marginBottom:10 }}>{s.title}</div>
        <p style={{ fontSize:14, color:C.muted, lineHeight:1.8, fontFamily:FB, marginBottom:s.cta?16:28 }}>{s.body}</p>
        {s.cta && <div style={{ background:C.primaryBg, borderRadius:10, padding:"10px 14px", fontSize:12, color:C.primary, fontFamily:FB, fontWeight:600, marginBottom:28 }}>{s.cta}</div>}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <button onClick={() => step > 0 && setStep(p => p - 1)} style={{ ...btnO(C.muted, 13), opacity:step===0?0.3:1, cursor:step===0?"default":"pointer" }} disabled={step===0}>Back</button>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onDone} style={{ ...btnO(C.muted, 12) }}>Skip</button>
            <button onClick={() => isLast ? onDone() : setStep(p => p + 1)} style={{ ...btn(C.primary, "#fff", 13) }}>
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

function AddTaskModal({ businessId, onAdd, onClose }) {
  const [tab, setTab]       = useState("templates");
  const [custom, setCustom] = useState({ name:"", description:"", category:"Operations", canAutomate:false });
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
            <button key={id} onClick={()=>setTab(id)} style={{ ...btn(tab===id?C.primary:"#F4F4F5", tab===id?"#fff":C.muted, 12), padding:"7px 14px" }}>{label}</button>
          ))}
        </div>

        {tab === "templates" && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Auto-generate these instantly</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
              {AUTO_TASK_TEMPLATES.map(t => (
                <div key={t.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg }}>
                  <div>
                    <div style={{ fontFamily:FB, fontWeight:600, fontSize:13 }}>{t.name}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{t.description}</div>
                  </div>
                  <button onClick={()=>add(t)} disabled={saving} style={{ ...btn(C.primary,"#fff",11), padding:"6px 12px", flexShrink:0, marginLeft:12 }}>Add</button>
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
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg }}>
              <input type="checkbox" id="canAutomate" checked={custom.canAutomate} onChange={e=>setCustom(p=>({...p,canAutomate:e.target.checked}))} style={{ width:16, height:16, cursor:"pointer" }} />
              <label htmlFor="canAutomate" style={{ fontFamily:FB, fontSize:13, cursor:"pointer" }}>Auto-generate a digital output for this task</label>
            </div>
            <button onClick={()=>custom.name.trim()&&add(custom)} disabled={!custom.name.trim()||saving} style={{ ...btn(C.primary,"#fff",13) }}>Add task</button>
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
            <button onClick={()=>setShowSource(false)} style={{ ...btnO(C.primary,10), padding:"3px 10px" }}>Show preview</button>
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

function TaskCard({ task, businessId, outputs, onUpdate, onDelete }) {
  const [expanded,  setExpanded]  = useState(false);
  const [running,   setRunning]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [viewOutput,setViewOutput]= useState(false);
  const [error,     setError]     = useState("");
  const fileRef = useRef();

  const outputData    = task.outputData;
  const hasOutput     = !!extractOutput(outputData);

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

  const markDone = async () => {
    if (!extractOutput(outputData)) return;
    await api.tasks.update(task.id, { status:"done" }).catch(()=>{});
    onUpdate({ ...task, status:"done" });
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

  const statusColor = { done:C.ok, running:C.primary, "in-progress":C.warn, pending:C.muted };
  const statusLabel = { done:"Done", running:"Generating…", "in-progress":"In progress", pending:"To do" };
  const status = task.status === "running" ? "running" : task.status;

  return (
    <div style={{ ...card("0"), overflow:"hidden", marginBottom:8 }}>
      <div style={{ padding:"14px 16px", display:"flex", gap:12, alignItems:"flex-start", cursor:"pointer" }} onClick={()=>setExpanded(p=>!p)}>
        <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${statusColor[status]||C.muted}`, background:status==="done"?statusColor[status]:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
          {status==="done"&&<span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>✓</span>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontFamily:FB, fontWeight:600, fontSize:13, textDecoration:status==="done"?"line-through":"none", color:status==="done"?C.muted:C.text }}>{task.name}</span>
            <span style={{ background:(statusColor[status]||C.muted)+"18", color:statusColor[status]||C.muted, fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FB }}>{statusLabel[status]||status}</span>
            {task.canAutomate && status!=="done" && <span style={{ background:C.primaryBg, color:C.primary, fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.04em", fontFamily:FB }}>Auto</span>}
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

          {/* Auto generate */}
          {task.canAutomate && status !== "done" && (
            <div style={{ marginBottom:14 }}>
              <button onClick={generate} disabled={running||status==="running"} style={{ ...btn(running||status==="running"?"#9CA3AF":C.grad,"#fff",12), display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                {(running||status==="running")&&<span style={{ width:11,height:11,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite" }}/>}
                {running||status==="running" ? "Generating…" : "Auto-generate"}
              </button>
              <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>or upload your own output below</div>
            </div>
          )}

          {/* Upload output */}
          {status !== "done" && (
            <div style={{ marginBottom:14 }}>
              <label style={{ ...lbl, marginBottom:6 }}>Upload output (file or paste text)</label>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <input ref={fileRef} type="file" style={{ display:"none" }} onChange={e=>e.target.files[0]&&saveFileOutput(e.target.files[0])} />
                <button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{ ...btnO(C.primary,12), padding:"8px 14px" }}>Upload file</button>
              </div>
              <textarea value={textInput} onChange={e=>setTextInput(e.target.value)} placeholder="Or paste text, notes, a link, or any output…" style={{ ...inp({ height:80, resize:"vertical" }) }} />
              {textInput.trim() && <button onClick={saveTextOutput} disabled={uploading} style={{ ...btn(C.primary,"#fff",12), marginTop:6 }}>Save text output</button>}
            </div>
          )}

          {/* View existing output */}
          {hasOutput && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <button onClick={()=>setViewOutput(p=>!p)} style={{ ...btnO(C.primary,12), padding:"7px 12px" }}>{viewOutput?"Hide output":"View output"}</button>
                <button onClick={downloadOutput} style={{ ...btnO(C.ok,12), padding:"7px 12px" }}>Download</button>
                {status === "done" && (
                  <button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{ ...btnO(C.muted,12), padding:"7px 12px" }}>Reupload</button>
                )}
              </div>
              {viewOutput && <OutputViewer outputData={outputData} taskName={task.name} />}
            </div>
          )}

          {/* Re-upload if done */}
          {status === "done" && (
            <div style={{ display:"flex", gap:8 }}>
              <textarea value={textInput} onChange={e=>setTextInput(e.target.value)} placeholder="Replace output with new text…" style={{ ...inp({ height:60, resize:"vertical", flex:1 }) }} />
              {textInput.trim() && <button onClick={saveTextOutput} disabled={uploading} style={{ ...btn(C.primary,"#fff",12), alignSelf:"flex-end" }}>Save</button>}
            </div>
          )}

          {/* Actions */}
          <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" }}>
            {status !== "done" && hasOutput && (
              <button onClick={markDone} style={{ ...btn(C.ok,"#fff",12), padding:"7px 14px" }}>Mark complete</button>
            )}
            {status === "done" && (
              <button onClick={markTodo} style={{ ...btnO(C.muted,12), padding:"7px 12px" }}>Reopen</button>
            )}
            <button onClick={()=>onDelete(task.id)} style={{ ...btnO(C.err,12), padding:"7px 12px" }}>Remove task</button>
          </div>
        </div>
      )}
    </div>
  );
}

const NOTE_BG_COLORS = ["#FEF9C3","#FCE7F3","#DBEAFE","#D1FAE5","#FEE2E2"];

function NotesGrid({ notes, onDelete }) {
  if (notes.length===0) return (
    <div style={{ ...card("28px"), textAlign:"center", color:C.muted }}>
      <div style={{ fontSize:24, marginBottom:8 }}>📝</div>
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
        {isDone && <span style={{ color:"#fff", fontSize:9, fontWeight:700 }}>✓</span>}
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
      <span style={{ flexShrink:0 }}>📌</span>
      <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{note.text}</span>
      <button onClick={e=>{e.stopPropagation();onUnstick();}} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:12, padding:0, flexShrink:0 }}>✕</button>
    </div>
  );
}

function TaskRowWrapper({ task, businessId, businessName, outputs, onUpdate, onDelete, selectable, selected, onToggleSelect, stickyNote, onAssignSticky, onUnstickNote }) {
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
      {dropOver && !stickyNote && <div style={{ height:2, background:C.primary, borderRadius:2, marginBottom:4 }} />}
      <div style={{ display:"flex", gap:8, alignItems:"flex-start", border:dropOver?`1px dashed ${C.primary}`:"1px solid transparent", borderRadius:8, padding:dropOver?"2px":"0" }}>
      {/* Checkbox for bulk select */}
      {selectable && (
        <div style={{ paddingTop:16, flexShrink:0 }}>
          <input type="checkbox" checked={selected} onChange={()=>onToggleSelect(task.id)}
            style={{ width:16, height:16, cursor:"pointer", accentColor:C.primary }} />
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
              <button onClick={saveEdit} disabled={saving||!eName.trim()} style={{ ...btn(C.primary,"#fff",12), padding:"6px 14px" }}>
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
            <TaskCard task={task} businessId={businessId} outputs={outputs} onUpdate={onUpdate} onDelete={onDelete} />
            {/* Edit pencil — top-right of card header */}
            <button onClick={e=>{e.stopPropagation();setEditing(true);}}
              title="Edit task"
              style={{ position:"absolute", top:10, right:36, background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:13, padding:"3px 5px", lineHeight:1, zIndex:2 }}>
              ✏️
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ── Campaign group accordion ──────────────────────────────────────────────────
function CampaignGroup({ title, tasks, businessId, businessName, outputs, onUpdate, onDelete, selectable, selected, onToggleSelect, hubNotes, stickyAssignments, onAssignSticky, onUnstickNote }) {
  const [open, setOpen] = useState(true);
  const done  = tasks.filter(t=>t.status==="done").length;
  return (
    <div style={{ marginBottom:12 }}>
      <div onClick={()=>setOpen(p=>!p)}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:C.primaryBg, borderRadius:8, cursor:"pointer", marginBottom:open?6:0, border:`1px solid ${C.primary}22` }}>
        <span style={{ fontSize:11 }}>{open?"▼":"▶"}</span>
        <span style={{ fontFamily:FH, fontWeight:600, fontSize:13, color:C.primary, flex:1 }}>{title}</span>
        <span style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{done}/{tasks.length} done</span>
      </div>
      {open && (
        <div style={{ paddingLeft:16, borderLeft:`2px solid ${C.primary}22` }}>
          {tasks.map(t=>{
            const assignment = stickyAssignments?.[t.id];
            const stickyNote = assignment ? hubNotes?.find(n=>n.id===assignment.noteId) : null;
            return (
              <TaskRowWrapper key={t.id} task={t} businessId={businessId} businessName={businessName} outputs={outputs}
                onUpdate={onUpdate} onDelete={onDelete}
                selectable={selectable} selected={selected.has(t.id)} onToggleSelect={onToggleSelect}
                stickyNote={stickyNote} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function TasksPanel({ businessId, businessName, businessOutputs, hubNotes, stickyAssignments, onAssignSticky, onUnstickNote, onTasksChanged }) {
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showAdd,    setShowAdd]    = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selected,   setSelected]   = useState(new Set());
  const [bulkBusy,   setBulkBusy]   = useState(false);

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
              style={{ ...btnO(selectMode?C.primary:C.muted,12), padding:"6px 12px" }}>
              {selectMode ? "Done selecting" : "Select"}
            </button>
          )}
          {!isNoteTab && <button onClick={()=>setShowAdd(true)} style={{ ...btn(C.primary,"#fff",13) }}>+ Add task</button>}
        </div>
      </div>

      {total > 0 && !isNoteTab && (
        <div style={{ marginBottom:10, height:4, borderRadius:2, background:C.border }}>
          <div style={{ height:"100%", width:`${total ? (done/total*100) : 0}%`, background:C.primary, borderRadius:2, transition:"width 0.3s" }} />
        </div>
      )}

      {/* Bulk action bar */}
      {selectMode && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:C.primaryBg, borderRadius:8, marginBottom:12, flexWrap:"wrap" }}>
          <input type="checkbox"
            checked={visibleIds.length>0 && visibleIds.every(id=>selected.has(id))}
            onChange={()=>toggleSelectAll(visibleIds)}
            style={{ width:16, height:16, cursor:"pointer", accentColor:C.primary }} />
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
              style={{ ...btn(filter===c?(c==="notes"?"#D97706":C.primary):"#F4F4F5", filter===c?"#fff":C.muted, 11), padding:"5px 12px", textTransform:"capitalize" }}>
              {c==="notes"?"📝 Notes":c}
              {c==="notes"&&noteTasks.length>0&&<span style={{ marginLeft:4, background:"rgba(255,255,255,0.3)", borderRadius:10, padding:"0 5px", fontSize:9 }}>{noteTasks.length}</span>}
            </button>
          ))}
          {campaignTasks.length > 0 && (
            <button onClick={()=>setFilter("campaign")}
              style={{ ...btn(filter==="campaign"?C.primary:"#F4F4F5", filter==="campaign"?"#fff":C.muted, 11), padding:"5px 12px" }}>
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
              hubNotes={hubNotes} stickyAssignments={stickyAssignments} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote} />
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
                  hubNotes={hubNotes} stickyAssignments={stickyAssignments} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote} />
              ))}
            </div>
          )}

          {/* Regular (non-campaign) tasks */}
          {visibleNonCampaign.length === 0 && campaignTasks.length === 0 && (
            <div style={{ ...card("28px"), textAlign:"center", color:C.muted }}>
              <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:16 }}>No tasks yet</div>
              <button onClick={()=>setShowAdd(true)} style={{ ...btn(C.primary,"#fff",13) }}>Add your first task</button>
            </div>
          )}

          {visibleNonCampaign.filter(t=>t.status!=="done").map(t=>{
            const assignment = stickyAssignments?.[t.id];
            const stickyNote = assignment ? hubNotes?.find(n=>n.id===assignment.noteId) : null;
            return (
              <TaskRowWrapper key={t.id} task={t} businessId={businessId} businessName={businessName} outputs={businessOutputs}
                onUpdate={onUpdate} onDelete={onDelete}
                selectable={selectMode} selected={selected.has(t.id)} onToggleSelect={toggleSelect}
                stickyNote={stickyNote} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote} />
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
                    stickyNote={stickyNote} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote} />
                );
              })}
            </>
          )}
        </>
      )}

      {showAdd && <AddTaskModal businessId={businessId} onAdd={onAdd} onClose={()=>setShowAdd(false)} />}
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
                    <span style={{ color:t.color, fontWeight:700, flexShrink:0 }}>✓</span>{f}
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
        {disabled && <span style={{ fontSize:10, color:"#2563EB", background:"#EFF6FF", border:"1px solid #BFDBFE", padding:"2px 8px", borderRadius:20, fontFamily:FB, fontWeight:600, marginLeft:"auto", cursor:"pointer" }}>Upgrade</span>}
      </div>
      {showPlans && <PlansModal highlightPlan="pro_autopilot" onClose={()=>setShowPlans(false)} />}
    </>
  );
}

function SetupGuide({ steps }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom:14, borderRadius:10, border:`1px solid ${C.primary}20`, overflow:"hidden" }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#EFF6FF", cursor:"pointer" }}>
        <span style={{ fontSize:12, fontWeight:700, color:C.primary, fontFamily:FB }}>Step-by-step setup guide</span>
        <span style={{ fontSize:13, color:C.primary, transform:open?"rotate(180deg)":"none", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
      </div>
      {open && (
        <div style={{ background:"#FDFCFF", padding:"12px 14px" }}>
          {steps.map((s,i)=>(
            <div key={i} style={{ display:"flex", gap:10, padding:"7px 0", borderBottom:i<steps.length-1?`1px solid ${C.primary}10`:"none" }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:C.primary, color:"#fff", fontSize:10, fontWeight:700, fontFamily:FB, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>{i+1}</div>
              <div style={{ fontSize:12.5, color:C.text, lineHeight:1.65, fontFamily:FB }}>
                {s.text}
                {s.link && <>{" "}<a href={s.link} target="_blank" rel="noopener noreferrer" style={{ color:C.primary, fontWeight:600, textDecoration:"none" }}>Open ↗</a></>}
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
            <div style={{ fontSize:12, color:hasSavedData?C.primary:C.muted, fontFamily:FB }}>{hasSavedData?"Details saved — tap to edit":desc}</div>
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
                    <button onClick={()=>fileRef.current?.click()} style={{ ...btnO(C.primary,12), padding:"8px 14px" }}>Upload {f.label.toLowerCase()}</button>
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
                  setTestMsg("✓ " + msg);
                } catch(e) {
                  setTestMsg("✗ " + e.message);
                }
                setTesting(false);
              }} disabled={testing} style={{ ...btnO(C.primary,12), padding:"8px 18px" }}>
                {testing ? "Testing…" : "Test connection"}
              </button>
              {testMsg && <div style={{ fontSize:11, fontFamily:FB, marginTop:6, color: testMsg.startsWith("✓") ? C.ok : C.err }}>{testMsg}</div>}
            </div>
          )}
          <button onClick={()=>save()} disabled={saving} style={{ ...btn(saved?C.ok:C.primary,"#fff",12), alignSelf:"flex-start", padding:"8px 18px" }}>
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

  const folderIcons = { "Business Info": "🏢", "Social Media": "📱", "Marketing": "📊", "Email": "✉️", "Other": "📁" };

  return (
    <div style={{ ...card("0"), overflow:"hidden", marginTop:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", cursor:"pointer" }} onClick={() => setOpen(p => !p)}>
        <div style={{ fontFamily:FH, fontWeight:600, fontSize:14 }}>
          Files Archive
          <span style={{ background:C.primaryBg, color:C.primary, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, marginLeft:6 }}>{totalFiles}</span>
        </div>
        <span style={{ color:C.muted, fontSize:14, transform:open?"rotate(180deg)":"none", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
      </div>
      {open && (
        <div style={{ borderTop:`1px solid ${C.border}` }}>
          {folderOrder.map((folderName, fi) => {
            const files = folderMap[folderName];
            const isFolderOpen = openFolders[folderName];
            return (
              <div key={folderName} style={{ borderBottom: fi < folderOrder.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 18px", cursor:"pointer", background:C.surface }}
                  onClick={() => toggleFolder(folderName)}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:14 }}>{folderIcons[folderName]}</span>
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
                        <button onClick={() => download(f)} style={{ ...btnO(C.primary, 11), padding:"5px 12px" }}>Download</button>
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

function HubPanel({ businessId, integs, onSaveFields, tasks, outputs, isMinor, isAutopilotPlan }) {
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

  return (
    <div>
      <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, letterSpacing:"-0.04em", marginBottom:4 }}>Hub</div>
      <p style={{ color:C.muted, fontSize:14, marginBottom:24, fontFamily:FB }}>Connect your tools and store your information. Everything saved here is used by your agents to give better results.</p>

      <div style={{ ...card(), marginBottom:0 }}>
        <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:4 }}>Integrations</div>
        <p style={{ fontSize:12, color:C.muted, marginBottom:4, fontFamily:FB }}>Expand each card to enter your details. Nothing is required — add what you have.</p>
        {integrationDefs.map(def => (
          <IntegrationCard
            key={def.provider}
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
        ))}
      </div>

      <FilesArchive businessId={businessId} outputs={outputs} tasks={tasks} />
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

// ── Instagram Panel ───────────────────────────────────────────────────────────

// ── Brand & Social Identity Panel ─────────────────────────────────────────────

const PILLAR_SUGGESTIONS = ["value tips", "social proof", "behind the scenes", "offers", "FAQs", "transformations", "client stories", "how-tos"];

function BrandIdentityPanel({ businessId }) {
  const [identity, setIdentity] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [populating, setPopulating] = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [expanded, setExpanded] = useState(false);
  const savedTimerRef = useRef(null);

  useEffect(() => {
    api.agents.getBrandIdentity(businessId)
      .then(d => setIdentity(d.identity))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => clearTimeout(savedTimerRef.current);
  }, [businessId]);

  const field = (key, label, placeholder, multiline) => {
    const val = identity?.[key] || "";
    return (
      <div key={key}>
        <label style={lbl}>{label}</label>
        {multiline
          ? <textarea style={{ ...inp(), minHeight:56, resize:"vertical" }} value={val}
              onChange={e => setIdentity(p => ({...p, [key]: e.target.value}))}
              placeholder={placeholder} />
          : <input style={inp()} value={val}
              onChange={e => setIdentity(p => ({...p, [key]: e.target.value}))}
              placeholder={placeholder} />
        }
      </div>
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const { identity: saved } = await api.agents.saveBrandIdentity(businessId, identity);
      setIdentity(saved); setSaved(true);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch(e) { alert(e.message); }
    setSaving(false);
  };

  const populate = async () => {
    setPopulating(true);
    try {
      const { identity: filled } = await api.agents.populateBrandIdentity(businessId);
      setIdentity(filled);
    } catch(e) { alert(e.message); }
    setPopulating(false);
  };

  const presence = identity?.channelPresence;
  const connectedChannels = presence?.channels || [];
  const STATUS_CLR = { active: C.ok, limited: C.warn, absent: C.muted };

  if (loading) return <div style={{ ...card(), marginBottom:20, color:C.muted, fontSize:13, fontFamily:FB }}>Loading brand identity…</div>;

  return (
    <div style={{ ...card("16px 18px"), marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:15 }}>Brand &amp; Identity</div>
          <div style={{ fontSize:12, color:C.muted, fontFamily:FB, marginTop:2 }}>
            {identity?.populatedBy === "market_analysis" ? "Auto-analyzed from your channels + market data"
             : identity?.populatedBy === "user" ? "User-defined"
             : "Auto-filled from your business idea"}
            {identity?.populatedAt ? ` · ${new Date(identity.populatedAt).toLocaleDateString()}` : ""}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={populate} disabled={populating}
            style={{ ...btnO(C.primary, 11), padding:"5px 12px", display:"flex", alignItems:"center", gap:5 }}>
            {populating && <span style={{ width:10, height:10, borderRadius:"50%", border:`1.5px solid ${C.primary}40`, borderTopColor:C.primary, animation:"spin 0.8s linear infinite", display:"inline-block" }} />}
            {populating ? "Analyzing…" : "Auto-fill"}
          </button>
          <button onClick={() => setExpanded(e => !e)} style={{ ...btnO(C.muted, 11), padding:"5px 12px" }}>
            {expanded ? "Collapse" : "Edit"}
          </button>
        </div>
      </div>

      {/* Channel presence summary — always visible */}
      {presence && (
        <div style={{ marginBottom: expanded ? 16 : 0 }}>
          <div style={{ fontSize:12, color:C.muted, fontFamily:FB, lineHeight:1.65, marginBottom:8 }}>{presence.summary}</div>
          {connectedChannels.length > 0 && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
              {connectedChannels.map(ch => (
                <div key={ch.name} style={{ display:"flex", alignItems:"center", gap:5, background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"3px 10px" }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:STATUS_CLR[ch.status] || C.muted, flexShrink:0 }} />
                  <span style={{ fontSize:11, fontFamily:FB, fontWeight:600 }}>{ch.name}</span>
                  <span style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{ch.strength}</span>
                </div>
              ))}
            </div>
          )}
          {presence.topOpportunity && (
            <div style={{ background:C.primaryBg, border:`1px solid ${C.primary}20`, borderRadius:8, padding:"6px 10px", fontSize:12, color:C.primary, fontFamily:FB }}>
              Opportunity: {presence.topOpportunity}
            </div>
          )}
        </div>
      )}

      {/* Editable fields — collapsed by default */}
      {expanded && (
        <div style={{ marginTop:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            {field("voice", "Brand voice", "e.g. educational, direct, no-fluff")}
            {field("tone", "Tone", "e.g. warm but professional, confidence-first")}
          </div>
          {field("targetAudience", "Target audience", "Who is your ideal customer? What's their main pain point?", true)}
          <div style={{ marginTop:12, marginBottom:4 }}>
            <label style={lbl}>Content pillars (select up to 4)</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:4 }}>
              {PILLAR_SUGGESTIONS.map(p => {
                const active = (identity?.contentPillars || []).includes(p);
                return (
                  <button key={p} onClick={() => {
                    const cur = identity?.contentPillars || [];
                    const next = active ? cur.filter(x=>x!==p) : cur.length<4 ? [...cur,p] : cur;
                    setIdentity(id => ({...id, contentPillars: next}));
                  }} style={{ ...( active ? btn(C.primary,"#fff",11) : btnO(C.muted,11) ), padding:"3px 10px" }}>{p}</button>
                );
              })}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12 }}>
            {field("colorPalette", "Color palette", "e.g. deep purple, warm gold, white")}
            {field("uniqueAngle", "Unique angle", "What makes your content different from competitors?")}
          </div>
          {field("visualStyle", "Visual style", "Describe the aesthetic — clean, bold, minimal, warm, dark…", true)}
          {field("competitorAccounts", "Competitor / inspiration accounts", "@handle1, @handle2 — accounts to study")}
          {field("postingRecommendation", "Posting recommendation", "e.g. 4x/week: 60% tips, 30% social proof, 10% offers")}

          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
            <button onClick={save} disabled={saving}
              style={{ ...btn(saving ? "#9CA3AF" : C.primary, "#fff", 13), padding:"8px 20px" }}>
              {saved ? "Saved ✓" : saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
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
                <button onClick={generateCaption} disabled={genLoading} style={{ ...btnO(C.primary,12) }}>{genLoading?"Generating…":"Generate caption + image"}</button>
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
              <div key={m.id} style={{ ...card("0"), overflow:"hidden", cursor:"pointer", border:activePost?.id===m.id?`2px solid ${C.primary}`:undefined }} onClick={()=>activePost?.id===m.id?setActivePost(null):loadComments(m)}>
                {(m.media_url||m.thumbnail_url) ? (
                  <img src={m.media_url||m.thumbnail_url} alt="" style={{ width:"100%", aspectRatio:"1", objectFit:"cover", display:"block" }} />
                ) : (
                  <div style={{ aspectRatio:"1", background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>{m.media_type}</span>
                  </div>
                )}
                <div style={{ padding:"6px 8px" }}>
                  <div style={{ display:"flex", gap:8, fontSize:11, color:C.muted, fontFamily:FB }}>
                    <span>♥ {m.like_count||0}</span>
                    <span>💬 {m.comments_count||0}</span>
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
        <div style={{ ...card("14px 16px"), marginBottom:16, border:`1px solid ${C.primary}20` }}>
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
                <div style={{ background:"#EFF6FF", borderRadius:8, padding:"8px 12px", marginTop:6 }}>
                  <div style={{ fontSize:11, color:C.primary, fontWeight:600, fontFamily:FB, marginBottom:4 }}>Suggested reply</div>
                  <div style={{ fontSize:12, fontFamily:FB, color:C.text, marginBottom:8 }}>{c.suggestedReply}</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>replyToComment(c.id, c.suggestedReply, i)} style={{ ...btn(C.primary,"#fff",11), padding:"4px 12px" }}>Post this reply</button>
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

function AutopilotCard({ businessId, planInfo, navigate }) {
  const [enabled, setEnabled] = useState(null);
  const [busy,    setBusy]    = useState(false);
  const isAutopilotPlan = planInfo?.plan === "pro_autopilot";

  useEffect(()=>{
    api.agents.getAutopilot(businessId).then(d=>setEnabled(!!d.autopilotEnabled)).catch(()=>setEnabled(false));
  },[businessId]);

  const toggle = async () => {
    if (!isAutopilotPlan) return navigate("/pricing");
    setBusy(true);
    try { const { autopilotEnabled } = await api.agents.setAutopilot(businessId, !enabled); setEnabled(autopilotEnabled); }
    catch {}
    setBusy(false);
  };

  return (
    <div style={{ ...card("16px 18px"), marginBottom:24, background:isAutopilotPlan?(enabled?C.okBg:C.surface):"#F4F4F5", border:`1px solid ${isAutopilotPlan&&enabled?C.ok+"30":C.border}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <div style={{ fontFamily:FH, fontWeight:600, fontSize:14 }}>Autopilot mode</div>
            {!isAutopilotPlan && <span style={{ background:"#F4F4F5", color:C.muted, fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.04em" }}>Pro Autopilot only</span>}
            {isAutopilotPlan && enabled && <span style={{ background:C.ok, color:"#fff", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.04em" }}>Running</span>}
          </div>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.6, fontFamily:FB }}>
            {isAutopilotPlan
              ? "When enabled, your agents run on their own schedule — analyzing and implementing automatically."
              : "Let your business run itself — agents check in and implement improvements without you. Available on the Pro Autopilot plan ($199/mo)."}
          </p>
        </div>
        <button onClick={toggle} disabled={busy||enabled===null} style={{ ...btn(isAutopilotPlan?(enabled?C.err:C.ok):"#D97706","#fff",12), flexShrink:0, marginLeft:16 }}>
          {!isAutopilotPlan ? "Upgrade" : busy ? "…" : enabled ? "Turn off" : "Turn on"}
        </button>
      </div>
    </div>
  );
}

// ── STRATEGY & CORRELATION ────────────────────────────────────────────────────

const LINK_FIELDS = [
  { id:"revenue",     label:"Revenue",        path:"revenue.this_month",        snapKey:"revenue",     prefix:"$" },
  { id:"costs",       label:"Costs",          path:"costs.this_month",          snapKey:"costs",       prefix:"$" },
  { id:"profit",      label:"Profit",         path:"",                          snapKey:"profit",      prefix:"$" },
  { id:"loss",        label:"Loss",           path:"",                          snapKey:"loss",        prefix:"$" },
  { id:"leads",       label:"Leads",          path:"leads.this_month",          snapKey:"leads",       prefix:""  },
  { id:"clients",     label:"Active Clients", path:"clients.active",            snapKey:"clients",     prefix:""  },
  { id:"bookings",    label:"Bookings",       path:"bookings.this_month",       snapKey:"bookings",    prefix:""  },
  { id:"reviews",     label:"Google Reviews", path:"social.google_reviews",     snapKey:"reviews",     prefix:""  },
  { id:"investments", label:"Investments",    path:"investments.total_ongoing", snapKey:"investments", prefix:"$" },
];

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

function MiniSparkline({ data, color="#7C3AED", w=130, h=44 }) {
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

function CorrelationPair({ link, metrics, snapshots, applied, onApplyToStrategy, onRemove }) {
  const aF=LINK_FIELDS.find(f=>f.id===link.a);
  const bF=LINK_FIELDS.find(f=>f.id===link.b);
  if(!aF||!bF) return null;

  const aVal=Number(_getFieldVal(metrics,aF.path)||0);
  const bVal=Number(_getFieldVal(metrics,bF.path)||0);
  const snapA=snapshots.map(s=>s[link.a]||0);
  const snapB=snapshots.map(s=>s[link.b]||0);
  const r=_pearson(snapA,snapB);
  const perUnit=aVal>0?(bVal/aVal).toFixed(2):null;

  const rLabel = r===null?"Not enough data yet":r>0.7?"Strong positive":r>0.3?"Moderate positive":r<-0.7?"Strong negative":r<-0.3?"Moderate negative":"Weak correlation";
  const rClr   = r===null?C.muted:r>0.3?"#22C55E":r<-0.3?"#EF4444":"#F59E0B";
  const summary = perUnit!==null
    ? `Each +1 ${aF.label} → ${bF.prefix||aF.prefix}${perUnit} ${bF.label}`
    : `${aF.label}: ${aF.prefix}${aVal.toLocaleString()} | ${bF.label}: ${bF.prefix}${bVal.toLocaleString()}`;

  return (
    <div style={{ background:C.surface, borderRadius:12, padding:"14px 16px", marginBottom:10, border:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:13 }}>{aF.label}</span>
            <span style={{ color:C.muted, fontSize:12 }}>→</span>
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:13 }}>{bF.label}</span>
            {r!==null&&<span style={{ fontSize:10, padding:"2px 7px", borderRadius:10, background:rClr+"18", color:rClr, fontFamily:FB, fontWeight:600 }}>{rLabel} (r={r})</span>}
          </div>
          <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{summary}</div>
        </div>
        <button onClick={onRemove} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:"0 4px", flexShrink:0 }}>×</button>
      </div>
      <div style={{ display:"flex", gap:16, marginBottom:12 }}>
        <div>
          <div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginBottom:4 }}>{aF.label} trend</div>
          <MiniSparkline data={snapA.length>=2?snapA:null} color="#3B82F6"/>
        </div>
        <div>
          <div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginBottom:4 }}>{bF.label} trend</div>
          <MiniSparkline data={snapB.length>=2?snapB:null} color={rClr===C.muted?"#7C3AED":rClr}/>
        </div>
        {snapA.length<2&&<div style={{ fontSize:10, color:C.muted, fontFamily:FB, alignSelf:"center" }}>Visit monthly to build trend data.</div>}
      </div>
      <button onClick={()=>onApplyToStrategy({ ...link, aLabel:aF.label, bLabel:bF.label, r, summary })}
        style={{ ...applied?btn("#22C55E","#fff",11):btnO(C.primary,11), padding:"5px 12px" }}>
        {applied?"✓ Applied to strategy":"Apply to strategy"}
      </button>
    </div>
  );
}

function BusinessStrategySection({ businessId, metrics, snapshots }) {
  const LINKS_KEY = `earnedlab_links_${businessId}`;
  const STRAT_KEY = `earnedlab_strat_${businessId}`;

  const [links,  setLinks]  = useState(()=>{ try{return JSON.parse(localStorage.getItem(LINKS_KEY)||"[]");}catch{return [];} });
  const [linking, setLinking] = useState(false);
  const [linkA,   setLinkA]   = useState("");
  const [linkB,   setLinkB]   = useState("");
  const [applied,    setApplied]    = useState([]);
  const [timeframe,  setTimeframe]  = useState("3 months");
  const [generating, setGenerating] = useState(false);
  const [strategy,   setStrategy]   = useState(()=>{ try{const s=localStorage.getItem(STRAT_KEY);return s?JSON.parse(s):null;}catch{return null;} });
  const [stratTab,   setStratTab]   = useState("budget");
  const [stratErr,   setStratErr]   = useState("");
  const [expanded,   setExpanded]   = useState(true);

  const saveLinks = l=>{ setLinks(l); try{localStorage.setItem(LINKS_KEY,JSON.stringify(l));}catch{} };

  const addLink=()=>{
    if(!linkA||!linkB||linkA===linkB) return;
    if(!links.find(l=>l.a===linkA&&l.b===linkB)) saveLinks([...links,{ id:`lnk_${Date.now()}`, a:linkA, b:linkB }]);
    setLinking(false); setLinkA(""); setLinkB("");
  };
  const removeLink  = id=>{ saveLinks(links.filter(l=>l.id!==id)); setApplied(p=>p.filter(l=>l.id!==id)); };
  const toggleApply = corr=>setApplied(p=>p.find(l=>l.id===corr.id)?p.filter(l=>l.id!==corr.id):[...p,corr]);

  const generate = async()=>{
    setGenerating(true); setStratErr("");
    try{
      const{strategy:s}=await api.metrics.strategy(businessId,{ timeframe, correlations:applied, snapshots });
      setStrategy(s); try{localStorage.setItem(STRAT_KEY,JSON.stringify(s));}catch{}
      setStratTab("budget");
    }catch(e){ setStratErr(e.message||"Generation failed — try again"); }
    setGenerating(false);
  };

  const sendToMarketing=async()=>{
    if(!strategy) return;
    const text=`[Business Strategy — ${timeframe}]\nOutreach: ${(strategy.outreach?.suggestions||[]).join("; ")}\nScaling: ${(strategy.scaling?.suggestions||[]).join("; ")}\nPredictions: ${(strategy.predictedOutcomes||[]).join("; ")}`;
    try{ await api.agents.addNote(businessId,text,"#EFF6FF"); }catch{}
    try{ await api.generate.chat(`The management agent just generated a business strategy for ${timeframe}. Key outreach: ${(strategy.outreach?.suggestions||[]).slice(0,2).join(", ")}. Apply this to your next marketing analysis.`, businessId); }catch{}
    alert("Strategy sent to Marketing Agent — it will be referenced in your next marketing analysis.");
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

  const TABS=[
    {id:"budget","label":"Budget"},
    {id:"outreach","label":"Outreach"},
    {id:"scaling","label":"Scaling"},
    {id:"conservation","label":"Conservation"},
    {id:"building","label":"Building"},
    {id:"schedule","label":"Schedule"},
    {id:"outcomes","label":"Outcomes"},
  ];

  const renderTab=()=>{
    if(!strategy) return null;
    switch(stratTab){
      case "budget": return (
        <div>
          <div style={{ display:"flex", gap:12, marginBottom:12 }}>
            {[["Monthly budget",`$${(strategy.budget?.monthly||0).toLocaleString()}`],["Total ("+timeframe+")",`$${(strategy.budget?.total||0).toLocaleString()}`]].map(([l,v])=>(
              <div key={l} style={{ flex:1, background:C.surface, borderRadius:10, padding:"12px 14px" }}>
                <div style={{ fontSize:9, color:C.muted, fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{l}</div>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:26, color:C.text }}>{v}</div>
              </div>
            ))}
          </div>
          {strategy.budget?.rationale&&<div style={{ fontSize:13, color:C.muted, fontFamily:FB, lineHeight:1.7 }}>{strategy.budget.rationale}</div>}
        </div>
      );
      case "outreach": case "scaling": case "building": {
        const sec=strategy[stratTab]||{};
        const items=sec.suggestions||sec.actions||[];
        return (
          <div>
            {(sec.monthlySpend>0||sec.monthlySavings>0)&&(
              <div style={{ background:C.surface, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
                <div style={{ fontSize:9, color:C.muted, fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>{sec.monthlySavings>0?"Monthly savings":"Monthly spend"}</div>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:22, color:C.text }}>${(sec.monthlySpend||sec.monthlySavings||0).toLocaleString()}</div>
              </div>
            )}
            {items.map((s,i)=>(
              <div key={i} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:i<items.length-1?`1px solid ${C.border}`:"none" }}>
                <div style={{ width:22,height:22,borderRadius:"50%",background:C.primaryBg,color:C.primary,fontFamily:FH,fontWeight:700,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1, fontSize:13, color:C.text, fontFamily:FB, lineHeight:1.6, paddingTop:1 }}>{s}</div>
              </div>
            ))}
          </div>
        );
      }
      case "conservation": {
        const sec=strategy.conservation||{};
        return (
          <div>
            {sec.monthlySavings>0&&(
              <div style={{ background:"#F0FDF4", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
                <div style={{ fontSize:9, color:"#166534", fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>Monthly savings target</div>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:22, color:"#16A34A" }}>${(sec.monthlySavings||0).toLocaleString()}</div>
              </div>
            )}
            {(sec.actions||[]).map((s,i)=>(
              <div key={i} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:i<(sec.actions||[]).length-1?`1px solid ${C.border}`:"none" }}>
                <div style={{ width:22,height:22,borderRadius:"50%",background:"#F0FDF4",color:"#16A34A",fontFamily:FH,fontWeight:700,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1, fontSize:13, color:C.text, fontFamily:FB, lineHeight:1.6, paddingTop:1 }}>{s}</div>
              </div>
            ))}
          </div>
        );
      }
      case "schedule": return (
        <div>
          {(strategy.taskSchedule||[]).map((p,i)=>(
            <div key={i} style={{ marginBottom:16 }}>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:13, color:C.primary, marginBottom:8 }}>{p.period}</div>
              {(p.tasks||[]).map((t,j)=>(
                <div key={j} style={{ display:"flex", gap:8, padding:"5px 0", borderBottom:j<p.tasks.length-1?`1px solid ${C.border}`:"none", alignItems:"flex-start" }}>
                  <span style={{ width:5,height:5,borderRadius:"50%",background:C.primary,flexShrink:0,marginTop:7 }}/>
                  <div style={{ fontSize:12, fontFamily:FB, color:C.text, lineHeight:1.6 }}>{t}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
      case "outcomes": return (
        <div>
          {(strategy.predictedOutcomes||[]).map((o,i)=>(
            <div key={i} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:i<strategy.predictedOutcomes.length-1?`1px solid ${C.border}`:"none" }}>
              <span style={{ fontSize:16, flexShrink:0 }}>📈</span>
              <div style={{ fontSize:13, fontFamily:FB, color:C.text, lineHeight:1.6 }}>{o}</div>
            </div>
          ))}
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{ ...card("0"), overflow:"hidden", marginBottom:28 }}>
      <div style={{ background:"linear-gradient(135deg,#1E1B4B,#4338CA)", padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }} onClick={()=>setExpanded(p=>!p)}>
        <div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:16, color:"#fff", marginBottom:2 }}>🧭 Business Strategy</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", fontFamily:FB }}>Link revenue channels → run correlation analysis → generate data-driven strategy</div>
        </div>
        <span style={{ color:"rgba(255,255,255,0.5)", fontSize:14, transform:expanded?"rotate(180deg)":"none", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
      </div>

      {expanded&&(
        <div style={{ padding:"20px 22px" }}>
          {/* Correlations */}
          <div style={{ marginBottom:22 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:14 }}>Correlations</div>
                <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>Link two revenue channel fields to see how they influence each other</div>
              </div>
              <button onClick={()=>setLinking(p=>!p)} style={{ ...btnO(C.primary,12) }}>
                {linking?"Cancel":"+ Link fields"}
              </button>
            </div>

            {linking&&(
              <div style={{ background:C.surface, borderRadius:12, padding:"14px 16px", marginBottom:12, display:"flex", gap:8, alignItems:"flex-end", flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:130 }}>
                  <label style={lbl}>Field A (input / cause)</label>
                  <select value={linkA} onChange={e=>setLinkA(e.target.value)} style={{ ...inp(), fontSize:13 }}>
                    <option value="">Select…</option>
                    {LINK_FIELDS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
                <div style={{ fontSize:18, color:C.muted, paddingBottom:10, flexShrink:0 }}>→</div>
                <div style={{ flex:1, minWidth:130 }}>
                  <label style={lbl}>Field B (output / effect)</label>
                  <select value={linkB} onChange={e=>setLinkB(e.target.value)} style={{ ...inp(), fontSize:13 }}>
                    <option value="">Select…</option>
                    {LINK_FIELDS.filter(f=>f.id!==linkA).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
                <button onClick={addLink} disabled={!linkA||!linkB} style={{ ...btn(C.primary,"#fff",13), padding:"9px 16px", flexShrink:0 }}>Add</button>
              </div>
            )}

            {links.length===0&&!linking&&(
              <div style={{ background:C.surface, borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
                <div style={{ fontSize:12, color:C.muted, fontFamily:FB }}>No correlations yet. Example: link Leads → Revenue to see how lead volume affects revenue.</div>
              </div>
            )}

            {links.map(link=>(
              <CorrelationPair key={link.id} link={link} metrics={metrics} snapshots={snapshots}
                applied={!!applied.find(l=>l.id===link.id)}
                onApplyToStrategy={toggleApply}
                onRemove={()=>removeLink(link.id)}
              />
            ))}
          </div>

          {/* Strategy generator */}
          <div style={{ borderTop:`2px solid ${C.border}`, paddingTop:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:12, flexWrap:"wrap", gap:10 }}>
              <div>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:14, marginBottom:2 }}>Generate Strategy</div>
                <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>
                  {applied.length>0
                    ? `Using ${applied.length} correlation${applied.length>1?"s":""}: ${applied.map(l=>l.aLabel+"→"+l.bLabel).join(", ")}`
                    : "Using current metrics — apply correlations above for deeper analysis"}
                </div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <select value={timeframe} onChange={e=>setTimeframe(e.target.value)} style={{ ...inp(), fontSize:12, padding:"8px 10px" }}>
                  <option value="4 weeks">4 weeks</option>
                  <option value="3 months">3 months</option>
                  <option value="6 months">6 months</option>
                  <option value="1 year">1 year</option>
                </select>
                <button onClick={generate} disabled={generating} style={{ ...btn(C.primary,"#fff",13), padding:"9px 20px", flexShrink:0 }}>
                  {generating?"Generating…":"Generate Strategy"}
                </button>
              </div>
            </div>
            {stratErr&&<div style={{ fontSize:12, color:C.err, fontFamily:FB, marginBottom:12 }}>{stratErr}</div>}

            {strategy&&(
              <div style={{ marginTop:16 }}>
                <div style={{ display:"flex", gap:0, marginBottom:16, borderBottom:`1px solid ${C.border}`, overflowX:"auto" }}>
                  {TABS.map(t=>(
                    <button key={t.id} onClick={()=>setStratTab(t.id)} style={{ padding:"7px 13px", fontFamily:FB, fontSize:12, fontWeight:stratTab===t.id?700:400, color:stratTab===t.id?C.primary:C.muted, background:"none", border:"none", borderBottom:stratTab===t.id?`2px solid ${C.primary}`:"2px solid transparent", cursor:"pointer", whiteSpace:"nowrap", marginBottom:-1 }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <div style={{ minHeight:100 }}>{renderTab()}</div>
                <div style={{ display:"flex", gap:10, marginTop:18, paddingTop:16, borderTop:`1px solid ${C.border}`, flexWrap:"wrap" }}>
                  <button onClick={sendToMarketing} style={{ ...btn(C.primary,"#fff",13) }}>Send to Marketing Agent</button>
                  <button onClick={downloadStrategy} style={{ ...btnO(C.muted,12) }}>Download (.txt)</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

// ── MANAGEMENT CANVAS ──────────────────────────────────────────────────────────

const MGMT_META = {
  leads:       { label:"Leads",       icon:"", hdrBg:"#EFF6FF" },
  clients:     { label:"Clients",     icon:"", hdrBg:"#F0FDF4" },
  revenue:     { label:"Revenue",     icon:"", hdrBg:"#FFFBEB" },
  costs:       { label:"Costs",       icon:"", hdrBg:"#FFF1F2" },
  loss:        { label:"Loss",        icon:"", hdrBg:"#FFF1F2" },
  profit:      { label:"Profit",      icon:"", hdrBg:"#F0FDF4" },
  investments: { label:"Investments", icon:"", hdrBg:"#F5F3FF" },
  bookings:    { label:"Bookings",    icon:"", hdrBg:"#FFF7ED" },
  google:      { label:"Google",      icon:"", hdrBg:"#F5F3FF" },
  email:       { label:"Email",       icon:"", hdrBg:"#FFF1F2" },
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
          <button onClick={save} style={{ ...btn(C.primary,"#fff",11), padding:"4px 8px" }}>✓</button>
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
            <button key={s} onClick={()=>setFilter(s)} style={{ fontSize:10, padding:"3px 8px", borderRadius:12, border:`1px solid ${filter===s?C.primary:C.border}`, background:filter===s?C.primaryBg:"transparent", color:filter===s?C.primary:C.muted, cursor:"pointer", fontFamily:FB }}>
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
          <button onClick={addLead} style={{ ...btn(C.primary,"#fff",12), padding:"6px 12px" }}>Add</button>
          <button onClick={()=>setAdding(false)} style={{ ...btnO(C.muted,12), padding:"6px 10px" }}>Cancel</button>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} style={{ ...btnO(C.primary,11), marginTop:10, width:"100%", textAlign:"center" }}>+ Add lead</button>
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
          <button onClick={addClient} style={{ ...btn(C.primary,"#fff",12), padding:"6px 12px" }}>Add</button>
          <button onClick={()=>setAdding(false)} style={{ ...btnO(C.muted,12), padding:"6px 10px" }}>Cancel</button>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} style={{ ...btnO(C.primary,11), marginTop:10, width:"100%", textAlign:"center" }}>+ Add client</button>
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
      <div style={{ background:"#EFF6FF", borderRadius:8, padding:"3px 10px", fontSize:10, color:C.primary, fontFamily:FB, fontWeight:600 }}>{label}</div>
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
        style={{ borderRadius:6, border:`1px solid ${hover?C.primary:"transparent"}`, transition:"border-color 0.12s", background:hover?C.primaryBg+"44":"transparent" }}>
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
              <button key={c} onClick={()=>setFilter(c)} style={{ fontSize:10, padding:"3px 8px", borderRadius:12, border:`1px solid ${filter===c?C.primary:C.border}`, background:filter===c?C.primaryBg:"transparent", color:filter===c?C.primary:C.muted, cursor:"pointer", fontFamily:FB }}>
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
                    {s.name}{prefix&&<span style={{ fontWeight:700, color:C.primary, marginLeft:6 }}>{prefix}{Number(s.amount||0).toLocaleString()}</span>}
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
        {filtered.length===0&&<div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"10px 0", fontFamily:FB }}>No {filter!=="all"?filter+" ":""}items yet</div>}
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
          <button onClick={add} style={{ ...btn(C.primary,"#fff",12), padding:"6px 12px" }}>Add</button>
          <button onClick={()=>setAdding(false)} style={{ ...btnO(C.muted,12), padding:"6px 10px" }}>Cancel</button>
        </div>
      ):(
        <button onClick={()=>setAdding(true)} style={{ ...btnO(C.primary,11), marginTop:6, width:"100%", textAlign:"center" }}>+ Add</button>
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
          <div style={{ fontSize:10, color:"#7C3AED", fontFamily:FB, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>From Investments (read-only)</div>
          {investRows.map((x,i)=>(
            <div key={x.id||i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, fontFamily:FB, padding:"4px 6px", background:"#F5F3FF", borderRadius:6, marginBottom:3 }}>
              <span style={{ color:"#7C3AED" }}>{x._label}{x.name?` — ${x.name}`:""}</span>
              <span style={{ color:"#7C3AED", fontWeight:600 }}>${(x.amount||0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LossContent({ metrics, globalRange=null, globalCStart="", globalCEnd="" }) {
  const [rangeMode, setRangeMode] = useState("month");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const sources = metrics.revenue?.sources || [];
  const causes  = metrics.costs?.causes   || [];
  const investOngoing = metrics.investments?.total_ongoing||0;
  const effectiveMode = globalRange || rangeMode;
  const effectiveCStart = globalRange==="custom"?globalCStart:cStart;
  const effectiveCEnd   = globalRange==="custom"?globalCEnd:cEnd;
  const rev  = filterDateRange(sources, effectiveMode, effectiveCStart, effectiveCEnd).reduce((a,x)=>a+(x.amount||0),0);
  const cost = filterDateRange(causes,  effectiveMode, effectiveCStart, effectiveCEnd).reduce((a,x)=>a+(x.amount||0),0) + investOngoing;
  const loss = Math.max(0, cost - rev);
  const label = effectiveMode==="day"?"Today":effectiveMode==="week"?"This Week":effectiveMode==="month"?"This Month":effectiveMode==="year"?"This Year":effectiveMode==="all"?"All Time":(cStart&&cEnd)?`${cStart} – ${cEnd}`:"Custom";
  return (
    <div>
      {globalRange ? <GlobalRangeLabel mode={globalRange} count={loss} prefix={loss>0?"-$":""} /> : <RangeDropdown mode={rangeMode} setMode={setRangeMode} cStart={cStart} setCStart={setCStart} cEnd={cEnd} setCEnd={setCEnd} count={loss} prefix={loss>0?"-$":""} />}
      <div style={{ background:loss>0?"#FFF1F2":C.surface, borderRadius:12, padding:"12px 14px", border:`1px solid ${loss>0?"#FECDD3":C.border}` }}>
        <div style={{ fontSize:9, color:loss>0?"#EF4444":C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", fontFamily:FB, marginBottom:4 }}>Loss — {label}</div>
        <div style={{ fontFamily:FH, fontWeight:700, fontSize:28, color:loss>0?"#EF4444":C.muted }}>{loss>0?`-$${loss.toLocaleString()}`:"$0"}</div>
        {loss===0&&<div style={{ fontSize:11, color:"#22C55E", fontFamily:FB, marginTop:4 }}>No loss — profitable ✓</div>}
      </div>
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <div style={{ flex:1, background:C.surface, borderRadius:8, padding:"8px 10px" }}>
          <div style={{ fontSize:9, color:C.muted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Revenue</div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:16, color:C.text }}>${rev.toLocaleString()}</div>
        </div>
        <div style={{ flex:1, background:C.surface, borderRadius:8, padding:"8px 10px" }}>
          <div style={{ fontSize:9, color:C.muted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Costs</div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:16, color:C.text }}>${cost.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function ProfitContent({ metrics, globalRange=null, globalCStart="", globalCEnd="" }) {
  const [rangeMode, setRangeMode] = useState("month");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const sources = metrics.revenue?.sources || [];
  const causes  = metrics.costs?.causes   || [];
  const investOngoing = metrics.investments?.total_ongoing||0;
  const effectiveMode = globalRange || rangeMode;
  const effectiveCStart = globalRange==="custom"?globalCStart:cStart;
  const effectiveCEnd   = globalRange==="custom"?globalCEnd:cEnd;
  const rev    = filterDateRange(sources, effectiveMode, effectiveCStart, effectiveCEnd).reduce((a,x)=>a+(x.amount||0),0);
  const cost   = filterDateRange(causes,  effectiveMode, effectiveCStart, effectiveCEnd).reduce((a,x)=>a+(x.amount||0),0) + investOngoing;
  const profit = Math.max(0, rev - cost);
  const label  = effectiveMode==="day"?"Today":effectiveMode==="week"?"This Week":effectiveMode==="month"?"This Month":effectiveMode==="year"?"This Year":effectiveMode==="all"?"All Time":(cStart&&cEnd)?`${cStart} – ${cEnd}`:"Custom";
  return (
    <div>
      {globalRange ? <GlobalRangeLabel mode={globalRange} count={profit} prefix={profit>0?"+$":""} /> : <RangeDropdown mode={rangeMode} setMode={setRangeMode} cStart={cStart} setCStart={setCStart} cEnd={cEnd} setCEnd={setCEnd} count={profit} prefix={profit>0?"+$":""} />}
      <div style={{ background:profit>0?"#F0FDF4":C.surface, borderRadius:12, padding:"12px 14px", border:`1px solid ${profit>0?"#BBF7D0":C.border}` }}>
        <div style={{ fontSize:9, color:profit>0?"#16A34A":C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", fontFamily:FB, marginBottom:4 }}>Profit — {label}</div>
        <div style={{ fontFamily:FH, fontWeight:700, fontSize:28, color:profit>0?"#16A34A":C.muted }}>{profit>0?`+$${profit.toLocaleString()}`:"$0"}</div>
        {profit===0&&<div style={{ fontSize:11, color:"#EF4444", fontFamily:FB, marginTop:4 }}>At a loss or break-even</div>}
      </div>
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <div style={{ flex:1, background:C.surface, borderRadius:8, padding:"8px 10px" }}>
          <div style={{ fontSize:9, color:C.muted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Revenue</div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:16, color:C.text }}>${rev.toLocaleString()}</div>
        </div>
        <div style={{ flex:1, background:C.surface, borderRadius:8, padding:"8px 10px" }}>
          <div style={{ fontSize:9, color:C.muted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Costs</div>
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:16, color:C.text }}>${cost.toLocaleString()}</div>
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
      <div style={{ fontSize:10, color:"#7C3AED", fontFamily:FB, marginBottom:10 }}>Counts toward Costs · Ongoing: ${totalOngoing.toLocaleString()}/mo</div>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, color:C.text, fontFamily:FB, fontWeight:700, marginBottom:6 }}>Initial (One-Time) — ${totalInitial.toLocaleString()}</div>
        <SourceList items={initial} onAdd={addInitial} onRemove={removeInitial} onUpdateCategory={updateInitialCat} prefix="$"
          cardId={`${cardId}:initial`} {...noteProps} />
      </div>
      <div>
        <div style={{ fontSize:11, color:C.text, fontFamily:FB, fontWeight:700, marginBottom:6 }}>Ongoing (Recurring/Mo) — ${totalOngoing.toLocaleString()}</div>
        <SourceList items={ongoing} onAdd={addOngoing} onRemove={removeOngoing} onUpdateCategory={updateOngoingCat} prefix="$"
          cardId={`${cardId}:ongoing`} {...noteProps} />
      </div>
    </div>
  );
}

function BookingsContent({ metrics, saveM, integs }) {
  const meta = (()=>{ try{const i=integs.find(x=>x.provider==="calendly");return i?.metadata?JSON.parse(i.metadata):{};}catch{return {};} })();
  const hasLink = !!meta.bookingUrl;
  return (
    <div>
      {hasLink ? (
        <div style={{ background:C.surface, borderRadius:10, padding:"8px 12px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:11, color:C.muted, fontFamily:FB }}>📅 Calendly linked</span>
          <a href={`https://${(meta.bookingUrl||"").replace(/^https?:\/\//,"")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:C.primary, fontFamily:FB, textDecoration:"none" }}>View page →</a>
        </div>
      ) : (
        <div style={{ background:"#FFFBEB", borderRadius:10, padding:"8px 12px", marginBottom:12, fontSize:11, color:"#92400E", fontFamily:FB }}>
          Connect Calendly in Hub → Integrations for auto-sync, or log counts below.
        </div>
      )}
      <div style={{ display:"flex", gap:8 }}>
        <MCell label="This week"  value={metrics.bookings.this_week}  onChange={v=>saveM("bookings.this_week",v)} />
        <MCell label="This month" value={metrics.bookings.this_month} onChange={v=>saveM("bookings.this_month",v)} />
      </div>
    </div>
  );
}

function GoogleContent({ metrics, saveM, integs }) {
  const meta = (()=>{ try{const i=integs.find(x=>x.provider==="google");return i?.metadata?JSON.parse(i.metadata):{};}catch{return {};} })();
  const isConn = integs.find(i=>i.provider==="google")?.status==="connected";
  const viewable = meta._viewableStatus==="viewable";
  const statusLabel = isConn?"Connected":viewable?"Viewable":"Not connected";
  const statusClr   = isConn?"#22C55E":viewable?"#3B82F6":C.muted;
  const rating = metrics.social.google_rating||0;
  const stars  = Math.round(rating);
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:12, background:statusClr+"18", color:statusClr, fontFamily:FB, fontWeight:600 }}>{statusLabel}</span>
        {(isConn||viewable)&&meta.profileUrl&&(
          <a href={meta.profileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:C.primary, fontFamily:FB, textDecoration:"none" }}>View listing →</a>
        )}
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:stars>0?10:0 }}>
        <MCell label="Reviews" value={metrics.social.google_reviews} onChange={v=>saveM("social.google_reviews",v)} />
        <MCell label="Rating"  value={metrics.social.google_rating}  onChange={v=>saveM("social.google_rating",v)} />
      </div>
      {stars>0&&(
        <div style={{ display:"flex", gap:2, alignItems:"center" }}>
          {[1,2,3,4,5].map(s=><span key={s} style={{ fontSize:18, color:s<=stars?"#F59E0B":"#D1D5DB" }}>★</span>)}
          <span style={{ fontSize:11, color:C.muted, marginLeft:6, fontFamily:FB }}>{rating}/5</span>
        </div>
      )}
      {!isConn&&!viewable&&(
        <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginTop:8 }}>Log review count and rating above, or connect Google in Hub → Integrations.</div>
      )}
    </div>
  );
}

function EmailContent({ integs, businessId }) {
  const KEY = `earnedlab_email_${businessId}`;
  const emailInteg = integs.find(x=>x.provider==="email");
  const meta = (()=>{ try{return emailInteg?.metadata?JSON.parse(emailInteg.metadata):{};}catch{return {};} })();
  const isConnected = emailInteg?.status==="connected";
  const isViewable  = !!meta.address;
  const [counts, setCounts] = useState(()=>{ try{return JSON.parse(localStorage.getItem(KEY)||"null")||{ inbox:0,starred:0,saved:0,archive:0 };}catch{return { inbox:0,starred:0,saved:0,archive:0 };} });
  const updateCount = (field,val)=>{
    const next={ ...counts,[field]:Number(val)||0 };
    setCounts(next); try{localStorage.setItem(KEY,JSON.stringify(next));}catch{}
  };
  const SECTIONS=[
    { label:"Inbox",   field:"inbox",   icon:"📥" },
    { label:"Starred", field:"starred", icon:"⭐" },
    { label:"Saved",   field:"saved",   icon:"🔖" },
    { label:"Archive", field:"archive", icon:"📦" },
  ];
  if(!isViewable) return (
    <div style={{ textAlign:"center", padding:"12px 0" }}>
      <div style={{ fontSize:12, color:C.muted, fontFamily:FB }}>Add your email address in Hub → Integrations to track inbox stats here.</div>
    </div>
  );
  const statusLabel = isConnected?"Connected":"Viewable";
  const statusClr   = isConnected?"#22C55E":"#3B82F6";
  const statusBg    = isConnected?"#F0FDF4":"#EFF6FF";
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:12, background:statusBg, color:statusClr, fontFamily:FB, fontWeight:600 }}>{statusLabel}</span>
        <span style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{meta.address}</span>
        {!isConnected&&<span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>(Connect API key for full access)</span>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {SECTIONS.map(s=>(
          <div key={s.field} style={{ background:C.surface, borderRadius:10, padding:"8px 10px" }}>
            <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginBottom:4 }}>{s.icon} {s.label}</div>
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
        border:`${isHover?"2":"1"}px solid ${widgetHover?"#7C3AED":isHover?C.primary:C.border}`,
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
          {widgetHover && <span style={{ fontSize:10, color:"#7C3AED", fontFamily:FB }}>Drop visual ↓</span>}
          {dropHover && !widgetHover && <span style={{ fontSize:10, color:C.primary, fontFamily:FB }}>Drop note ↓</span>}
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
  graph: { label:"Line Graph",   icon:"", desc:"Metric over time" },
  pie:   { label:"Pie Chart",    icon:"", desc:"Sources breakdown" },
  draw:  { label:"Drawing",      icon:"", desc:"Freehand sketch" },
  corr:  { label:"Correlation",  icon:"", desc:"Compare two metrics" },
  field: { label:"Custom Field", icon:"", desc:"Equation of values" },
  eq:    { label:"Equation",     icon:"", desc:"Link channel values" },
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
      <select value={cfg.fieldId||""} onChange={e=>setCfg(p=>({...p,fieldId:e.target.value}))} style={s}><option value="">-- Metric --</option>{fldOpts}</select>
      <div style={{ display:"flex", gap:4 }}><button onClick={saveConfig} disabled={!cfg.fieldId} style={{ ...btn(C.primary,"#fff",10), padding:"4px 10px" }}>Save</button><button onClick={onRemove} style={{ ...btnO(C.muted,10), padding:"4px 8px" }}>Remove</button></div>
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
      <div style={{ display:"flex", gap:4 }}><button onClick={saveConfig} disabled={!cfg.source} style={{ ...btn(C.primary,"#fff",10), padding:"4px 10px" }}>Save</button><button onClick={onRemove} style={{ ...btnO(C.muted,10), padding:"4px 8px" }}>Remove</button></div>
    </div>);
    if(widget.type==="corr") return(<div>
      <select value={cfg.fieldA||""} onChange={e=>setCfg(p=>({...p,fieldA:e.target.value}))} style={s}><option value="">-- Field A --</option>{fldOpts}</select>
      <select value={cfg.fieldB||""} onChange={e=>setCfg(p=>({...p,fieldB:e.target.value}))} style={s}><option value="">-- Field B --</option>{LINK_FIELDS.filter(f=>f.id!==cfg.fieldA).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
      <div style={{ display:"flex", gap:4 }}><button onClick={saveConfig} disabled={!cfg.fieldA||!cfg.fieldB} style={{ ...btn(C.primary,"#fff",10), padding:"4px 10px" }}>Save</button><button onClick={onRemove} style={{ ...btnO(C.muted,10), padding:"4px 8px" }}>Remove</button></div>
    </div>);
    if(widget.type==="field") return(<div>
      <input value={cfg.title||""} onChange={e=>setCfg(p=>({...p,title:e.target.value}))} placeholder="Field name" style={s}/>
      <select value={(cfg.formula||[])[0]?.value||""} onChange={e=>setCfg(p=>({...p,formula:[{type:"field",value:e.target.value},...(p.formula||[]).slice(1)]}))} style={s}><option value="">-- Field A --</option>{fldOpts}</select>
      <select value={(cfg.formula||[null,{}])[1]?.value||""} onChange={e=>setCfg(p=>({...p,formula:[(p.formula||[{}])[0],{type:"op",value:e.target.value},(p.formula||[{},{},{}])[2]||{}]}))} style={s}><option value="">-- Operator --</option>{["+","-","×","÷"].map(op=><option key={op} value={op}>{op}</option>)}</select>
      <select value={(cfg.formula||[null,null,{}])[2]?.value||""} onChange={e=>setCfg(p=>({...p,formula:[(p.formula||[{}])[0],(p.formula||[{},{}])[1],{type:"field",value:e.target.value}]}))} style={s}><option value="">-- Field B --</option>{LINK_FIELDS.filter(f=>f.id!==((cfg.formula||[])[0]?.value)).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
      <div style={{ display:"flex", gap:4 }}><button onClick={saveConfig} disabled={!cfg.title} style={{ ...btn(C.primary,"#fff",10), padding:"4px 10px" }}>Save</button><button onClick={onRemove} style={{ ...btnO(C.muted,10), padding:"4px 8px" }}>Remove</button></div>
    </div>);
    if(widget.type==="eq") return(<div>
      <select value={cfg.source||""} onChange={e=>setCfg(p=>({...p,source:e.target.value}))} style={s}><option value="">-- Source --</option>{fldOpts}</select>
      <select value={cfg.target||""} onChange={e=>setCfg(p=>({...p,target:e.target.value}))} style={s}><option value="">-- Target --</option>{LINK_FIELDS.filter(f=>f.id!==cfg.source).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
      <div style={{ display:"flex", gap:4 }}><button onClick={saveConfig} disabled={!cfg.source||!cfg.target} style={{ ...btn(C.primary,"#fff",10), padding:"4px 10px" }}>Save</button><button onClick={onRemove} style={{ ...btnO(C.muted,10), padding:"4px 8px" }}>Remove</button></div>
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
          {!editing&&widget.type!=="draw"&&<button onClick={()=>setEditing(true)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:5, cursor:"pointer", color:C.muted, fontSize:11, padding:"1px 6px" }}>cfg</button>}
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
          {widget.type==="corr"&&<IntraCorrelWidget config={cfg} snapshots={snapshots||[]} metrics={metrics}/>}
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

function LineChart({data=[],color=C.primary,yPrefix="",w=290,h=130}){
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
  const color = field.id==="profit"?"#22C55E":field.id==="loss"?"#EF4444":C.primary;
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
      {!items.length&&<div style={{ fontSize:11, color:C.muted, fontFamily:FB, textAlign:"center" }}>Add items to see breakdown.</div>}
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

function IntraCorrelWidget({ config, snapshots, metrics }) {
  const aF=LINK_FIELDS.find(f=>f.id===config.fieldA);
  const bF=LINK_FIELDS.find(f=>f.id===config.fieldB);
  if(!aF||!bF) return <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>Select two fields in sidebar.</div>;
  const snapA=snapshots.map(s=>s[aF.snapKey||aF.id]||0);
  const snapB=snapshots.map(s=>s[bF.snapKey||bF.id]||0);
  const r=_pearson(snapA,snapB);
  const rLabel=r===null?"Not enough data":r>0.7?"Strong positive":r>0.3?"Moderate positive":r<-0.7?"Strong negative":r<-0.3?"Moderate negative":"Weak";
  const rClr=r===null?C.muted:r>0.3?"#22C55E":r<-0.3?"#EF4444":"#F59E0B";
  const aVal=_getFieldVal(metrics,aF.path)||0;
  const bVal=_getFieldVal(metrics,bF.path)||0;
  const perUnit=aVal>0?(bVal/aVal).toFixed(2):null;
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:8 }}>
        <span style={{ fontFamily:FH, fontWeight:700, fontSize:13 }}>{aF.label}</span>
        <span style={{ color:C.muted }}>vs</span>
        <span style={{ fontFamily:FH, fontWeight:700, fontSize:13 }}>{bF.label}</span>
        {r!==null&&<span style={{ fontSize:10, padding:"2px 7px", borderRadius:10, background:rClr+"18", color:rClr, fontFamily:FB, fontWeight:600 }}>{rLabel} (r={r})</span>}
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:8 }}>
        <div><div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginBottom:3 }}>{aF.label}</div><MiniSparkline data={snapA.length>=2?snapA:null} color="#3B82F6" w={120} h={50}/></div>
        <div><div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginBottom:3 }}>{bF.label}</div><MiniSparkline data={snapB.length>=2?snapB:null} color={rClr===C.muted?"#7C3AED":rClr} w={120} h={50}/></div>
      </div>
      {perUnit&&<div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>Each +1 {aF.label} → {bF.prefix||""}{perUnit} {bF.label}</div>}
      {snapA.length<2&&<div style={{ fontSize:10, color:C.muted, fontFamily:FB }}>Visit monthly to build trend data.</div>}
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
  if(!srcF||!tgtF) return <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>Configure channel equation in sidebar.</div>;
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
      <button onClick={sync} style={{ ...btn(C.primary,"#fff",11), padding:"5px 14px", width:"100%" }}>Sync {srcF.label} → {tgtF.label}</button>
    </div>
  );
}

// ── MANAGEMENT SIDEBAR ────────────────────────────────────────────
function MgmtSidebar({ open, onToggle, hubNotes, setHubNotes, businessId, mgmtNoteAssignments, onAssignNote, onUnstickNote, deleteNote, onAddWidget }) {
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
      <div style={{ fontSize:11, fontFamily:FB, fontWeight:700, color:C.text, marginBottom:8 }}>Line Graph — select metric</div>
      <select value={cfg.fieldId||""} onChange={e=>setCfg(p=>({...p,fieldId:e.target.value}))} style={s}><option value="">-- field --</option>{fldOpts}</select>
      <div style={{ display:"flex", gap:6 }}><button onClick={confirmTool} disabled={!cfg.fieldId} style={{ ...btn(C.primary,"#fff",11), padding:"5px 14px" }}>Add</button><button onClick={cancelTool} style={{ ...btnO(C.muted,11), padding:"5px 10px" }}>Cancel</button></div>
    </div>);
    if(activeTool==="pie") return (<div>
      <div style={{ fontSize:11, fontFamily:FB, fontWeight:700, color:C.text, marginBottom:8 }}>Pie Chart — select source list</div>
      <select value={cfg.source||""} onChange={e=>setCfg(p=>({...p,source:e.target.value}))} style={s}>
        <option value="">-- source --</option>
        <option value="revenue">Revenue Sources</option>
        <option value="costs">Cost Causes</option>
        <option value="investments.initial">Initial Investments</option>
        <option value="investments.ongoing">Ongoing Investments</option>
        <option value="leads">Leads (by status)</option>
        <option value="clients">Clients (by type)</option>
      </select>
      <div style={{ display:"flex", gap:6 }}><button onClick={confirmTool} disabled={!cfg.source} style={{ ...btn(C.primary,"#fff",11), padding:"5px 14px" }}>Add</button><button onClick={cancelTool} style={{ ...btnO(C.muted,11), padding:"5px 10px" }}>Cancel</button></div>
    </div>);
    if(activeTool==="corr") return (<div>
      <div style={{ fontSize:11, fontFamily:FB, fontWeight:700, color:C.text, marginBottom:8 }}>Correlation — compare two metrics</div>
      <select value={cfg.fieldA||""} onChange={e=>setCfg(p=>({...p,fieldA:e.target.value}))} style={s}><option value="">-- Field A --</option>{fldOpts}</select>
      <select value={cfg.fieldB||""} onChange={e=>setCfg(p=>({...p,fieldB:e.target.value}))} style={s}><option value="">-- Field B --</option>{LINK_FIELDS.filter(f=>f.id!==cfg.fieldA).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
      <div style={{ display:"flex", gap:6 }}><button onClick={confirmTool} disabled={!cfg.fieldA||!cfg.fieldB} style={{ ...btn(C.primary,"#fff",11), padding:"5px 14px" }}>Add</button><button onClick={cancelTool} style={{ ...btnO(C.muted,11), padding:"5px 10px" }}>Cancel</button></div>
    </div>);
    if(activeTool==="field") return (<div>
      <div style={{ fontSize:11, fontFamily:FB, fontWeight:700, color:C.text, marginBottom:8 }}>Custom Field — equation</div>
      <input value={cfg.title||""} onChange={e=>setCfg(p=>({...p,title:e.target.value}))} placeholder="Field name" style={s}/>
      <select value={(cfg.formula||[])[0]?.value||""} onChange={e=>setCfg(p=>({...p,formula:[{type:"field",value:e.target.value},...(p.formula||[]).slice(1)]}))} style={s}><option value="">-- Field A --</option>{fldOpts}</select>
      <select value={(cfg.formula||[null,{}])[1]?.value||""} onChange={e=>setCfg(p=>({...p,formula:[(p.formula||[{}])[0],{type:"op",value:e.target.value},(p.formula||[{},{},{}])[2]||{}]}))} style={s}>
        <option value="">-- Operator --</option>{["+","-","×","÷"].map(op=><option key={op} value={op}>{op}</option>)}
      </select>
      <select value={(cfg.formula||[null,null,{}])[2]?.value||""} onChange={e=>setCfg(p=>({...p,formula:[(p.formula||[{}])[0],(p.formula||[{},{}])[1],{type:"field",value:e.target.value}]}))} style={s}><option value="">-- Field B --</option>{LINK_FIELDS.filter(f=>f.id!==((cfg.formula||[])[0]?.value)).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
      <input value={cfg.prefix||""} onChange={e=>setCfg(p=>({...p,prefix:e.target.value}))} placeholder="Prefix ($, %, ...)" style={{...s,width:100}}/>
      <div style={{ display:"flex", gap:6 }}><button onClick={confirmTool} disabled={!cfg.title} style={{ ...btn(C.primary,"#fff",11), padding:"5px 14px" }}>Add</button><button onClick={cancelTool} style={{ ...btnO(C.muted,11), padding:"5px 10px" }}>Cancel</button></div>
    </div>);
    if(activeTool==="eq") return (<div>
      <div style={{ fontSize:11, fontFamily:FB, fontWeight:700, color:C.text, marginBottom:8 }}>Equation — link channels</div>
      <div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginBottom:6 }}>Source value syncs to target on button click.</div>
      <select value={cfg.source||""} onChange={e=>setCfg(p=>({...p,source:e.target.value}))} style={s}><option value="">-- Source field --</option>{fldOpts}</select>
      <select value={cfg.target||""} onChange={e=>setCfg(p=>({...p,target:e.target.value}))} style={s}><option value="">-- Target field --</option>{LINK_FIELDS.filter(f=>f.id!==cfg.source).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
      <input value={cfg.label||""} onChange={e=>setCfg(p=>({...p,label:e.target.value}))} placeholder="Label (optional)" style={s}/>
      <div style={{ display:"flex", gap:6 }}><button onClick={confirmTool} disabled={!cfg.source||!cfg.target} style={{ ...btn(C.primary,"#fff",11), padding:"5px 14px" }}>Add</button><button onClick={cancelTool} style={{ ...btnO(C.muted,11), padding:"5px 10px" }}>Cancel</button></div>
    </div>);
    return null;
  };

  return (
    <>
      {/* Toggle button */}
      <div style={{ position:"fixed", right:open?290:0, top:"50%", transform:"translateY(-50%)", zIndex:302, transition:"right 0.25s ease" }}>
        <button onClick={onToggle} style={{ background:open?C.surface:C.primary, color:open?C.primary:"#fff", border:`1px solid ${open?C.border:C.primary}`, borderRadius:"8px 0 0 8px", padding:"14px 7px", cursor:"pointer", fontSize:11, fontFamily:FB, fontWeight:700, letterSpacing:"0.05em", writingMode:"vertical-rl", textOrientation:"mixed", boxShadow:open?"none":"-4px 0 16px rgba(124,58,237,0.2)", lineHeight:1.2 }}>
          {open?"▶ Close":"◀ Tools"}
        </button>
      </div>

      {/* Panel */}
      {open && (
        <div style={{ position:"fixed", right:0, top:0, bottom:0, width:290, background:C.bg, borderLeft:`1px solid ${C.border}`, zIndex:300, display:"flex", flexDirection:"column", boxShadow:"-8px 0 32px rgba(0,0,0,0.09)" }}>
          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, flexShrink:0, paddingTop:8 }}>
            {[["notes","Notes"],["visuals","Visuals"],["analysis","Analysis"]].map(([k,l])=>(
              <button key={k} onClick={()=>{ setSection(k); setActiveTool(null); }} style={{ flex:1, padding:"8px 4px", fontSize:10, fontFamily:FB, fontWeight:600, background:"transparent", color:section===k?C.primary:C.muted, border:"none", borderBottom:section===k?`2px solid ${C.primary}`:"2px solid transparent", cursor:"pointer", letterSpacing:"0.03em" }}>{l}</button>
            ))}
          </div>

          {/* Scrollable content */}
          <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>
            {/* Notes */}
            {section==="notes" && (<>
              <div style={{ fontSize:10, color:C.muted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Drag to a canvas card to pin</div>
              {hubNotes.length===0&&<div style={{ fontSize:11, color:C.muted, fontFamily:FB, textAlign:"center", padding:"16px 0" }}>No notes yet.</div>}
              {hubNotes.map(n=>{
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
                        <button onClick={()=>onUnstickNote(n.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#D1D5DB", fontSize:10, padding:0 }}>✕</button>
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
                  <div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginBottom:6 }}>Drag onto a card — or click to add to canvas</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {["graph","pie","draw"].map(t=>{const d=WIDGET_DEFS[t];return(
                      <div key={t} draggable onDragStart={e=>{e.dataTransfer.setData("text/widgetType",t);}}
                        onClick={()=>startTool(t)}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, cursor:"grab", userSelect:"none" }}>
                        <div style={{ flex:1 }}><div style={{ fontSize:12, fontFamily:FB, fontWeight:700, color:C.text }}>{d.label}</div><div style={{ fontSize:10, color:C.muted, fontFamily:FB }}>{d.desc}</div></div>
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
                <>
                  <div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginBottom:6 }}>Drag onto a card — or click to add to canvas</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {["corr","field","eq"].map(t=>{const d=WIDGET_DEFS[t];return(
                      <div key={t} draggable onDragStart={e=>{e.dataTransfer.setData("text/widgetType",t);}}
                        onClick={()=>startTool(t)}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, cursor:"grab", userSelect:"none" }}>
                        <div style={{ flex:1 }}><div style={{ fontSize:12, fontFamily:FB, fontWeight:700, color:C.text }}>{d.label}</div><div style={{ fontSize:10, color:C.muted, fontFamily:FB }}>{d.desc}</div></div>
                        <span style={{ fontSize:10, color:C.subtle, fontFamily:FB }}>⠿</span>
                      </div>
                    );})}
                  </div>
                </>
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
                <button onClick={addNote} disabled={adding||!noteText.trim()} style={{ ...btn(C.primary,"#fff",11), padding:"6px 12px", flexShrink:0 }}>{adding?"…":"Add"}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ManagementCanvas({ businessId, metrics, saveM, integs, hubNotes, setHubNotes, stickyAssignments, assignSticky, unstickNote, mgmtNoteAssignments, mgmtAssignNote, mgmtUnstickNote, sidebarOpen, setSidebarOpen, deleteNote }) {
  const POS_KEY     = `earnedlab_mgmt_pos_${businessId}`;
  const CARDS_KEY   = `earnedlab_mgmt_cards_${businessId}`;
  const SNAP_KEY    = `earnedlab_snaps_${businessId}`;
  const WIDGETS_KEY = `earnedlab_widgets_${businessId}`;

  // Monthly snapshots for correlation trend data
  const [snapshots, setSnapshots] = useState(()=>{ try{return JSON.parse(localStorage.getItem(SNAP_KEY)||"[]");}catch{return [];} });
  useEffect(()=>{
    if(!metrics||!metrics.revenue) return;
    const monthKey=new Date().toISOString().slice(0,7);
    const snapRev  = metrics.revenue?.this_month||0;
    const snapCost = (metrics.costs?.this_month||0)+(metrics.investments?.total_ongoing||0);
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
      investments:metrics.investments?.total_ongoing||0,
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
      case "bookings":    return <BookingsContent    metrics={metrics} saveM={saveM} integs={integs}/>;
      case "google":      return <GoogleContent      metrics={metrics} saveM={saveM} integs={integs}/>;
      case "email":       return <EmailContent       integs={integs} businessId={businessId}/>;
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
      <BusinessStrategySection businessId={businessId} metrics={metrics} snapshots={snapshots} />

      {/* Global time range bar */}
      <div style={{ padding:"10px 22px", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", background:C.surface, borderBottom:`1px solid ${C.border}`, marginBottom:16 }}>
        <span style={{ fontSize:11, color:C.muted, fontFamily:FB, fontWeight:600 }}>Time range (all cards):</span>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {[[null,"Per-card"],["day","Day"],["week","Week"],["month","Month"],["year","Year"],["all","All Time"],["custom","Custom"]].map(([v,l])=>(
            <button key={String(v)} onClick={()=>setGlobalRange(v)} style={{ fontSize:10, padding:"3px 10px", borderRadius:20, border:`1px solid ${globalRange===v?C.primary:C.border}`, background:globalRange===v?C.primaryBg:"transparent", color:globalRange===v?C.primary:C.muted, fontFamily:FB, fontWeight:600, cursor:"pointer" }}>{l}</button>
          ))}
        </div>
        {globalRange==="custom"&&(
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <input type="date" value={globalCStart} onChange={e=>setGlobalCStart(e.target.value)} style={{ ...inp(), fontSize:11, padding:"3px 8px", width:"auto" }}/>
            <span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>–</span>
            <input type="date" value={globalCEnd} onChange={e=>setGlobalCEnd(e.target.value)} style={{ ...inp(), fontSize:11, padding:"3px 8px", width:"auto" }}/>
          </div>
        )}
        {globalRange&&globalRange!=="custom"&&<span style={{ fontSize:10, color:C.primary, fontFamily:FB }}>← Applied to all cards</span>}
      </div>

      <div style={{ position:"relative", minHeight:canvasH, marginBottom:64 }}
        onDragOver={e=>{ if(e.dataTransfer.types.includes("text/widgetType")) e.preventDefault(); }}
        onDrop={e=>{
          const wt=e.dataTransfer.getData("text/widgetType"); if(!wt) return;
          e.preventDefault();
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
              <button key={id} onClick={()=>addCard(id)} style={{ ...btnO(C.primary,12) }}>
                + {MGMT_META[id].label}
              </button>
            ))}
            {addable.length===0&&<span style={{ fontSize:11, color:C.muted, fontFamily:FB }}>All channel cards on canvas</span>}
            <div style={{ width:1, alignSelf:"stretch", background:C.border, margin:"0 4px" }}/>
            {["corr","field","eq"].map(t=>(
              <button key={t} onClick={()=>{ addWidget(t,{},WIDGET_DEFS[t]?.label||t); setToolbar(false); }} style={{ ...btnO("#7C3AED",11) }}>
                + {WIDGET_DEFS[t].label}
              </button>
            ))}
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
      />
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
  const [showTour,   setShowTour]   = useState(false);
  const [genLoading, setGenLoading] = useState({});
  const [genError,   setGenError]   = useState("");
  const [prefs,      setPrefs]      = useState({ audience:"local", stage:"starting", goals:"", targetMarket:"" });
  const [hubQ,       setHubQ]       = useState("");
  const [hubAns,     setHubAns]     = useState("");
  const [hubLoading, setHubLoading] = useState(false);
  const [mgmtQ,      setMgmtQ]     = useState("");
  const [mgmtAns,    setMgmtAns]   = useState("");
  const [chatOpen,   setChatOpen]   = useState(false);
  const [chatMsgs,   setChatMsgs]   = useState([{ role:"ai", text:"I'm here to help. Ask about setup steps, strategy, or anything about your business." }]);
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
  const navigate = useNavigate();

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

  const dismissTour = () => {
    localStorage.setItem(`earnedlab_toured_${businessId}`, "1");
    setShowTour(false);
  };

  const idea     = (()=>{ try{return JSON.parse(business?.ideaData||"{}");}catch{return {};} })();
  const getOutput= type => outputs.find(o=>o.type===type);
  const isConn   = p => integs.find(i=>i.provider===p)?.status==="connected";

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

  const askHub  = async()=>{ if(!hubQ.trim())return; setHubLoading(true); setHubAns(""); try{const{suggestion}=await api.metrics.suggest(businessId,hubQ,prefs);setHubAns(suggestion);}catch(e){setHubAns("Error: "+e.message);} setHubLoading(false); };
  const askMgmt = async()=>{ if(!mgmtQ.trim())return; setHubLoading(true); try{const{suggestion}=await api.metrics.suggest(businessId,mgmtQ,prefs);setMgmtAns(suggestion);}catch(e){setMgmtAns("Error: "+e.message);} setHubLoading(false); setMgmtQ(""); };
  const sendChat = async msg=>{ setChatMsgs(p=>[...p,{role:"user",text:msg}]); try{const{reply}=await api.generate.chat(msg,businessId);setChatMsgs(p=>[...p,{role:"ai",text:reply}]);}catch{setChatMsgs(p=>[...p,{role:"ai",text:"Sorry, couldn't process that."}]);} };

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
      <div style={{ width:32, height:32, borderRadius:"50%", border:`3px solid ${C.primary}25`, borderTopColor:C.primary, animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  const navItems = [
    { id:"overview",   label:"Overview"         },
    { id:"hub",        label:"Hub"              },
    { id:"marketing",  label:"Marketing Agent"  },
    { id:"management", label:"Management Agent" },
    { id:"tasks",      label:"Tasks"            },
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
            <div style={{ fontSize:36, marginBottom:12 }}>🔒</div>
            <div style={{ fontFamily:FH, fontWeight:700, fontSize:20, marginBottom:8, color:"#111" }}>Your trial has ended</div>
            <p style={{ fontSize:13, color:"#6B7280", fontFamily:FB, lineHeight:1.6, marginBottom:20 }}>
              Your data is safe. Upgrade to a paid plan to continue using all features — your history, tasks, and settings will all be here waiting.
            </p>
            <button onClick={()=>navigate("/pricing")} style={{ ...btn(C.primary,"#fff",14), padding:"10px 28px", width:"100%", marginBottom:8 }}>
              View Plans & Pricing
            </button>
            <button onClick={()=>setShowTrialExpiredModal(false)} style={{ ...btnO(C.muted,12), padding:"7px 20px", width:"100%" }}>
              Keep browsing (view only)
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width:220, background:C.dark, display:"flex", flexDirection:"column", flexShrink:0, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, width:120, height:120, background:`radial-gradient(ellipse,${C.primary}18,transparent 70%)`, pointerEvents:"none" }} />
        <div style={{ padding:"22px 18px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <Logo size={24}/>
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:16, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.03em" }}>EarnedLab</span>
          </div>
          <div style={{ fontFamily:FH, fontWeight:600, fontSize:14, color:"#fff", marginBottom:4, lineHeight:1.3 }}>{business?.name}</div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:"#4ADE80" }} />
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.65)", fontFamily:FB }}>{business?.location}</span>
          </div>
          {planInfo && (
            <div onClick={()=>navigate("/pricing")} style={{ cursor:"pointer", display:"inline-flex", alignItems:"center", gap:5, background:planInfo.locked?"rgba(220,38,38,0.15)":`${C.primary}25`, border:`1px solid ${planInfo.locked?"#DC262650":C.primary+"50"}`, borderRadius:6, padding:"3px 8px" }}>
              <span style={{ fontSize:10, color:planInfo.locked?"#FCA5A5":"#93C5FD", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", fontFamily:FB }}>
                {planInfo.isAdmin ? `Admin${planInfo.simulating?" — "+planInfo.simulating.replace("_"," "):""}` : planInfo.locked?"Trial expired":planInfo.isTrial?`Trial — ${planInfo.trialDaysLeft}d left`:planInfo.plan}
              </span>
            </div>
          )}
        </div>

        <nav style={{ padding:"12px 8px" }}>
          {navItems.map(({id,label})=>(
            <div key={id} onClick={()=>setTab(id)} style={{ padding:"10px 14px", borderRadius:10, marginBottom:3, background:tab===id?`${C.primary}30`:"transparent", color:tab===id?"#fff":"rgba(255,255,255,0.7)", cursor:"pointer", fontSize:13, fontWeight:tab===id?600:400, fontFamily:FB, borderLeft:tab===id?`3px solid ${C.primary}`:"3px solid transparent", transition:"all 0.12s", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>{label}</span>
              {id==="tasks" && tasksTotal > 0 && (
                <span style={{ fontSize:10, background:tasksDone===tasksTotal?"#4ADE8030":"rgba(255,255,255,0.12)", color:tasksDone===tasksTotal?"#4ADE80":"rgba(255,255,255,0.65)", padding:"1px 7px", borderRadius:20, fontWeight:700 }}>{tasksDone}/{tasksTotal}</span>
              )}
            </div>
          ))}

          {/* Daily Insights — directly below nav items */}
          {(()=>{
            const plan = planInfo?.plan;
            const rawLimit = insightsBudget?.limit || (plan==="pro_autopilot"?110000:plan==="pro"?50000:20000);
            const rawUsed  = insightsBudget?.used  || 0;
            const usedIns  = Math.round(rawUsed  / 1.5);
            const limitIns = Math.round(rawLimit / 1.5);
            const pct      = Math.min(100, rawLimit > 0 ? Math.round(rawUsed / rawLimit * 100) : 0);
            const barColor = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#4ADE80";
            return (
              <div style={{ padding:"8px 6px", marginTop:16, borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.6)", fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.05em" }}>Daily Insights</span>
                  <span style={{ fontSize:9, color:pct>=90?"#EF4444":pct>=70?"#F59E0B":"rgba(255,255,255,0.6)", fontFamily:FB }}>
                    {usedIns.toLocaleString()}/{limitIns.toLocaleString()}
                  </span>
                </div>
                <div style={{ height:3, borderRadius:2, background:"rgba(255,255,255,0.12)" }}>
                  <div style={{ height:"100%", width:`${pct}%`, borderRadius:2, background:barColor, transition:"width 0.5s" }} />
                </div>
              </div>
            );
          })()}

          {/* All businesses + Replay tour — spaced below Daily Insights */}
          <div onClick={()=>navigate("/dashboard")} style={{ padding:"8px 12px", borderRadius:8, color:"rgba(255,255,255,0.45)", cursor:"pointer", fontSize:12, fontFamily:FB, marginTop:16 }}>All businesses</div>
          <div onClick={()=>setShowTour(true)} style={{ padding:"8px 12px", borderRadius:8, color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:12, fontFamily:FB, marginTop:10 }}>Replay tour</div>
        </nav>
      </div>

      {/* Main content */}
      <div style={{ flex:1, overflowY:"auto", background:C.bg }}>
        <div style={{ padding:"28px 32px 80px", maxWidth:1100 }}>

          {/* OVERVIEW */}
          {tab==="overview" && (
            <div>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, letterSpacing:"-0.04em", marginBottom:4 }}>{business?.name}</div>
              <p style={{ color:C.muted, fontSize:14, marginBottom:24, fontFamily:FB }}>{idea.name} &middot; {business?.location}</p>

              {/* Tasks progress card */}
              {tasksTotal > 0 && (
                <div onClick={()=>setTab("tasks")} style={{ ...card("16px 20px"), marginBottom:20, border:`1px solid ${C.primary}15`, background:C.primaryBg, cursor:"pointer" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ fontFamily:FH, fontWeight:700, fontSize:14 }}>Tasks — {tasksDone} of {tasksTotal} done</div>
                    <span style={{ fontSize:12, color:C.primary, fontFamily:FB }}>View all →</span>
                  </div>
                  <div style={{ height:5, borderRadius:3, background:"rgba(124,58,237,0.15)", marginBottom:12 }}>
                    <div style={{ height:"100%", width:`${tasksTotal?(tasksDone/tasksTotal*100):0}%`, background:C.primary, borderRadius:3, transition:"width 0.3s" }} />
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {tasks.filter(t=>t.status!=="done").slice(0,4).map(t=>(
                      <span key={t.id} style={{ fontSize:11, background:"rgba(124,58,237,0.08)", color:C.primary, padding:"3px 10px", borderRadius:20, fontFamily:FB }}>
                        {t.canAutomate && "⚡ "}{t.name}
                      </span>
                    ))}
                    {tasks.filter(t=>t.status!=="done").length > 4 && <span style={{ fontSize:11, color:C.muted, fontFamily:FB, padding:"3px 6px" }}>+{tasks.filter(t=>t.status!=="done").length-4} more</span>}
                  </div>
                </div>
              )}

              {/* KPI row */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                {[
                  { label:"Revenue / month", value:`$${Number(metrics.revenue.this_month).toLocaleString()}`, sub:metrics.revenue.last_month>0?`$${Number(metrics.revenue.last_month).toLocaleString()} last month`:"Track in Management" },
                  { label:"Active clients",  value:String(metrics.clients.active),                            sub:`${metrics.clients.total} total` },
                  { label:"Leads / month",   value:String(metrics.leads.this_month),                          sub:`${metrics.leads.total} all time` },
                  { label:"Followers",       value:Number(metrics.social.instagram).toLocaleString(),          sub:metrics.social.google_rating>0?`${metrics.social.google_rating} Google rating`:"Track in Management" },
                ].map(({label,value,sub})=>(
                  <div key={label} style={card("14px 16px")}>
                    <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6, fontFamily:FB }}>{label}</div>
                    <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, letterSpacing:"-0.04em", marginBottom:3 }}>{value}</div>
                    <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Brand & Social Identity */}
              <BrandIdentityPanel businessId={businessId} />

              {/* Business preferences */}
              <BusinessPrefsCard prefs={prefs} onSave={savePrefs} compact />

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
                    ["TikTok",              Number(metrics.social.tiktok).toLocaleString()||"0"],
                    ["Facebook",            Number(metrics.social.facebook).toLocaleString()||"0"],
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

          {/* TASKS */}
          {tab==="tasks" && <TasksPanel businessId={businessId} businessName={business?.name||""} businessOutputs={outputs} hubNotes={hubNotes} stickyAssignments={stickyAssignments} onAssignSticky={assignSticky} onUnstickNote={unstickNote} onTasksChanged={refreshTasks}/>}

          {/* HUB */}
          {tab==="hub" && (
            <HubPanel
              businessId={businessId}
              integs={integs}
              onSaveFields={saveIntegFields}
              tasks={tasks}
              outputs={outputs}
              isMinor={!!isMinor}
              isAutopilotPlan={planInfo?.plan === "pro_autopilot"}
            />
          )}

          {/* MARKETING AGENT */}
          {tab==="marketing" && (
            <div>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, letterSpacing:"-0.04em", marginBottom:4 }}>Marketing Agent</div>
              <AgentPanel businessId={businessId} businessName={business?.name || ""} metrics={metrics} planInfo={planInfo} integs={integs} setTab={setTab} refreshTasks={refreshTasks} hubNotes={hubNotes} stickyAssignments={stickyAssignments} onAssignSticky={assignSticky} onUnstickNote={unstickNote}/>
            </div>
          )}

          {/* MANAGEMENT AGENT */}
          {tab==="management" && (
            <div>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, letterSpacing:"-0.04em", marginBottom:4 }}>Management Agent</div>
              <p style={{ color:C.muted, fontSize:14, marginBottom:20, fontFamily:FB }}>Your revenue channels and business dashboard. Drag cards to organize — pin notes, add fields, and track what matters.</p>

              <AutopilotCard businessId={businessId} planInfo={planInfo} navigate={navigate} />

              <div style={{ ...card("16px 18px"), marginBottom:24, background:C.primaryBg, border:`1px solid ${C.primary}15` }}>
                <div style={{ fontFamily:FH, fontWeight:600, fontSize:14, marginBottom:8 }}>Ask your management agent</div>
                <p style={{ fontSize:12, color:C.muted, marginBottom:10, fontFamily:FB }}>Ask anything about revenue, clients, or business strategy. Say "I'm scaling up" and preferences update automatically.</p>
                <div style={{ display:"flex", gap:8, marginBottom:mgmtAns?12:0 }}>
                  <input value={mgmtQ} onChange={e=>setMgmtQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askMgmt()} placeholder="What should I focus on this week?" style={{ ...inp(), flex:1 }} />
                  <button onClick={askMgmt} disabled={hubLoading} style={{ ...btn(C.primary,"#fff",13), padding:"10px 16px", flexShrink:0 }}>{hubLoading?"…":"Ask"}</button>
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
              />
            </div>
          )}
        </div>
      </div>

      {chatOpen && <GuidePanel messages={chatMsgs} onClose={()=>setChatOpen(false)} onSend={sendChat} businessId={businessId}/>}

      {/* Floating Notes Panel */}
      {notesOpen && (
        <div style={{ position:"fixed", bottom:120, right:chatOpen?360:24, zIndex:200, width:310, background:"#fff", borderRadius:14, boxShadow:"0 8px 40px rgba(0,0,0,0.15)", border:"1px solid #E5E7EB", overflow:"hidden" }}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid #F3F4F6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:13, color:"#111827" }}>
              Notes {hubNotes.length>0 && <span style={{ background:C.primary, color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10, marginLeft:4 }}>{hubNotes.length}</span>}
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:10, color:"#9CA3AF", fontFamily:FB }}>Drag to stick</span>
              <button onClick={()=>setNotesOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:18, lineHeight:1, padding:0 }}>×</button>
            </div>
          </div>
          <div style={{ maxHeight:260, overflowY:"auto", padding:"10px 12px" }}>
            {hubNotes.length===0 && <div style={{ fontSize:12, color:"#9CA3AF", textAlign:"center", padding:"12px 0", fontFamily:FB }}>No notes yet. Add one below.</div>}
            {hubNotes.map(n=>{
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
                        <span style={{ fontSize:10, color:"#6B7280", fontFamily:FB }}>📌 {stuckTo[1].targetLabel || "Item"}</span>
                        <button onClick={()=>unstickNote(stuckTo[0])} style={{ background:"none", border:"none", cursor:"pointer", color:"#D1D5DB", fontSize:10, padding:0 }}>✕</button>
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
              <button onClick={addHubNote} disabled={noteAdding||!noteText.trim()} style={{ ...btn(C.primary,"#fff",11), padding:"6px 12px", flexShrink:0 }}>
                {noteAdding?"…":"Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={()=>setNotesOpen(o=>!o)} style={{ background:notesOpen?"#F3F4F6":"#fff", color:notesOpen?C.primary:"#6B7280", border:`1px solid ${notesOpen?C.primary:"#E5E7EB"}`, borderRadius:24, padding:"10px 16px", fontSize:13, fontWeight:500, cursor:"pointer", position:"fixed", bottom:72, right:chatOpen?336:24, boxShadow:"0 2px 10px rgba(0,0,0,0.08)", zIndex:99, transition:"right 0.25s", fontFamily:FB, display:"flex", alignItems:"center", gap:6 }}>
        Notes{hubNotes.length>0 && <span style={{ background:C.primary, color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10 }}>{hubNotes.length}</span>}
      </button>

      <button onClick={()=>setChatOpen(o=>!o)} style={{ background:C.grad, color:"#fff", border:"none", borderRadius:24, padding:"10px 20px", fontSize:13, fontWeight:500, cursor:"pointer", position:"fixed", bottom:24, right:chatOpen?336:24, boxShadow:`0 4px 20px rgba(124,58,237,0.3)`, zIndex:100, transition:"right 0.25s", fontFamily:FB }}>
        Ask guide
      </button>
    </div>
  );
}
