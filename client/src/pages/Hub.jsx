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
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>AI can generate these instantly</div>
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
              <label htmlFor="canAutomate" style={{ fontFamily:FB, fontSize:13, cursor:"pointer" }}>AI can generate a digital output for this task</label>
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
      No content generated. Use "Generate with AI" or upload your own output.
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
                {running||status==="running" ? "Generating…" : "Generate with AI"}
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

// ── Inline-editable task row wrapper ─────────────────────────────────────────
function TaskRowWrapper({ task, businessId, outputs, onUpdate, onDelete, selectable, selected, onToggleSelect }) {
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

  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:8 }}>
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
  );
}

// ── Campaign group accordion ──────────────────────────────────────────────────
function CampaignGroup({ title, tasks, businessId, outputs, onUpdate, onDelete, selectable, selected, onToggleSelect }) {
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
          {tasks.map(t=>(
            <TaskRowWrapper key={t.id} task={t} businessId={businessId} outputs={outputs}
              onUpdate={onUpdate} onDelete={onDelete}
              selectable={selectable} selected={selected.has(t.id)} onToggleSelect={onToggleSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function TasksPanel({ businessId, businessOutputs }) {
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showAdd,    setShowAdd]    = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selected,   setSelected]   = useState(new Set());
  const [bulkBusy,   setBulkBusy]   = useState(false);

  useEffect(() => {
    api.tasks.list(businessId).then(d => setTasks(d.tasks||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, [businessId]);

  const onAdd    = task  => setTasks(p => [...p, task]);
  const onUpdate = task  => setTasks(p => p.map(t => t.id===task.id ? task : t));
  const onDelete = async id => {
    await api.tasks.delete(id).catch(()=>{});
    setTasks(p => p.filter(t => t.id !== id));
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
      if (action === "delete") {
        setTasks(p => p.filter(t => !ids.includes(t.id)));
      } else if (action === "complete") {
        setTasks(p => p.map(t => ids.includes(t.id) ? { ...t, status:"done" } : t));
      } else if (action === "pending") {
        setTasks(p => p.map(t => ids.includes(t.id) ? { ...t, status:"pending" } : t));
      }
      setSelected(new Set());
    } catch (e) { alert(e.message); }
    setBulkBusy(false);
  };

  const regularTasks = tasks.filter(t => t.category !== "notes");
  const noteTasks    = tasks.filter(t => t.category === "notes");

  // Campaign tasks: group by campaign title (steps[0].label)
  const campaignTasks = regularTasks.filter(t => t.category === "campaign");
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
            <div style={{ fontSize:28, marginBottom:10 }}>📋</div>
            <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:6 }}>No campaign tasks yet</div>
            <p style={{ fontSize:13, lineHeight:1.65 }}>Campaign tasks are created when you start a campaign in the Marketing Agent.</p>
          </div>
        ) : (
          Object.entries(campaignGroups).map(([title, groupTasks]) => (
            <CampaignGroup key={title} title={title} tasks={groupTasks}
              businessId={businessId} outputs={businessOutputs}
              onUpdate={onUpdate} onDelete={onDelete}
              selectable={selectMode} selected={selected} onToggleSelect={toggleSelect} />
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
                  businessId={businessId} outputs={businessOutputs}
                  onUpdate={onUpdate} onDelete={onDelete}
                  selectable={selectMode} selected={selected} onToggleSelect={toggleSelect} />
              ))}
            </div>
          )}

          {/* Regular (non-campaign) tasks */}
          {visibleNonCampaign.length === 0 && campaignTasks.length === 0 && (
            <div style={{ ...card("28px"), textAlign:"center", color:C.muted }}>
              <div style={{ fontSize:28, marginBottom:10 }}>📋</div>
              <div style={{ fontFamily:FH, fontWeight:600, fontSize:15, marginBottom:6 }}>No tasks yet</div>
              <p style={{ fontSize:13, lineHeight:1.65, marginBottom:16 }}>Add tasks to track your progress and generate business assets with AI.</p>
              <button onClick={()=>setShowAdd(true)} style={{ ...btn(C.primary,"#fff",13) }}>Add your first task</button>
            </div>
          )}

          {visibleNonCampaign.filter(t=>t.status!=="done").map(t=>(
            <TaskRowWrapper key={t.id} task={t} businessId={businessId} outputs={businessOutputs}
              onUpdate={onUpdate} onDelete={onDelete}
              selectable={selectMode} selected={selected.has(t.id)} onToggleSelect={toggleSelect} />
          ))}

          {visibleNonCampaign.some(t=>t.status==="done") && (
            <>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", padding:"12px 0 8px", fontFamily:FB }}>Completed</div>
              {visibleNonCampaign.filter(t=>t.status==="done").map(t=>(
                <TaskRowWrapper key={t.id} task={t} businessId={businessId} outputs={businessOutputs}
                  onUpdate={onUpdate} onDelete={onDelete}
                  selectable={selectMode} selected={selected.has(t.id)} onToggleSelect={toggleSelect} />
              ))}
            </>
          )}
        </>
      )}

      {showAdd && <AddTaskModal businessId={businessId} onAdd={onAdd} onClose={()=>setShowAdd(false)} />}
    </div>
  );
}

// ── HUB / INTEGRATIONS ────────────────────────────────────────────────────────

function AutopilotToggle({ on, onToggle, label, disabled }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:10, background:on?"#F0FDF4":"#F9F9F9", border:`1px solid ${on?C.ok+"40":C.border}`, cursor:disabled?"default":"pointer" }} onClick={disabled?undefined:onToggle}>
      <div style={{ width:32, height:18, borderRadius:9, background:on?C.ok:"#D1D5DB", position:"relative", flexShrink:0, transition:"background 0.2s" }}>
        <div style={{ position:"absolute", top:2, left:on?14:2, width:14, height:14, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
      <div>
        <div style={{ fontSize:12, fontWeight:600, fontFamily:FB, color:on?C.ok:C.muted }}>Autopilot {on?"ON":"OFF"}</div>
        {label && <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginTop:1 }}>{label}</div>}
      </div>
      {disabled && <span style={{ fontSize:10, color:C.muted, background:C.border, padding:"2px 8px", borderRadius:20, fontFamily:FB, marginLeft:"auto" }}>Coming soon</span>}
    </div>
  );
}

function SetupGuide({ steps }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom:14, borderRadius:10, border:`1px solid ${C.primary}20`, overflow:"hidden" }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#F5F3FF", cursor:"pointer" }}>
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
          <div onClick={toggleAutopilot} style={{ cursor:autopilotDisabled?"default":"pointer", display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:autopilotOn?"#DCFCE7":C.bg, border:`1px solid ${autopilotOn?C.ok+"50":C.border}` }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:autopilotOn?C.ok:"#D1D5DB" }} />
            <span style={{ fontSize:10, fontWeight:700, color:autopilotOn?C.ok:C.muted, fontFamily:FB, whiteSpace:"nowrap" }}>
              {autopilotDisabled ? "Soon" : autopilotOn ? "Auto ON" : "Auto OFF"}
            </span>
          </div>
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

function FilesArchive({ businessId, outputs, tasks }) {
  const [open, setOpen] = useState(false);

  const files = [
    ...outputs.filter(o=>o.content).map(o=>({ name:o.title||o.type, type:o.type, content:o.content, source:"generated" })),
    ...tasks.filter(t=>t.status==="done"&&extractOutput(t.outputData)).map(t=>{ const ex=extractOutput(t.outputData); return { name:t.name, type:ex.type, content:ex.content||ex.fields?.map(f=>`${f.label}: ${f.value}`).join("\n")||"", filename:t.outputData?.filename, source:"task" }; }),
  ];

  if (!files.length) return (
    <div style={{ ...card("16px 18px"), marginTop:20, textAlign:"center" }}>
      <div style={{ fontSize:12, color:C.muted, fontFamily:FB }}>Generated files and completed task output will appear here.</div>
    </div>
  );

  const download = f => {
    const isHtml = f.type==="website"||f.type==="html"||f.type==="business_plan"||f.type==="pitch_deck"||(f.content&&f.content.trim().startsWith("<"));
    const ext  = isHtml?".html":f.type==="json"?".json":".txt";
    const mime = isHtml?"text/html":f.type==="json"?"application/json":"text/plain";
    const blob = new Blob([f.content],{type:mime});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href=url; a.download=f.filename||(f.name.toLowerCase().replace(/\s+/g,"-")+ext); a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ ...card("0"), overflow:"hidden", marginTop:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", cursor:"pointer" }} onClick={()=>setOpen(p=>!p)}>
        <div style={{ fontFamily:FH, fontWeight:600, fontSize:14 }}>Files Archive <span style={{ background:C.primaryBg, color:C.primary, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, marginLeft:6 }}>{files.length}</span></div>
        <span style={{ color:C.muted, fontSize:14, transform:open?"rotate(180deg)":"none", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
      </div>
      {open && (
        <div style={{ borderTop:`1px solid ${C.border}` }}>
          {files.map((f,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", borderBottom:i<files.length-1?`1px solid ${C.border}`:"none" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, fontFamily:FB }}>{f.name}</div>
                <div style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{f.source==="generated"?"AI generated":"Task output"} &middot; {f.type}</div>
              </div>
              <button onClick={()=>download(f)} style={{ ...btnO(C.primary,11), padding:"5px 12px" }}>Download</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HubPanel({ businessId, integs, onSaveFields, tasks, outputs, isMinor }) {
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
            autopilotDisabled={def.autopilotDisabled}
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
          <div style={{ fontFamily:FH, fontWeight:700, fontSize:15 }}>Brand &amp; Social Identity</div>
          <div style={{ fontSize:12, color:C.muted, fontFamily:FB, marginTop:2 }}>
            {identity?.populatedBy === "market_analysis" ? "AI-analyzed from your channels + market data"
             : identity?.populatedBy === "user" ? "User-defined"
             : "Auto-filled from your business idea"}
            {identity?.populatedAt ? ` · ${new Date(identity.populatedAt).toLocaleDateString()}` : ""}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={populate} disabled={populating}
            style={{ ...btnO(C.primary, 11), padding:"5px 12px", display:"flex", alignItems:"center", gap:5 }}>
            {populating && <span style={{ width:10, height:10, borderRadius:"50%", border:`1.5px solid ${C.primary}40`, borderTopColor:C.primary, animation:"spin 0.8s linear infinite", display:"inline-block" }} />}
            {populating ? "Analyzing…" : "AI Fill"}
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
      <div style={{ fontSize:11, color:C.muted, marginTop:10, fontFamily:FB }}>Preferences are saved automatically and used by all agents and the guide chat.</div>
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
                <button onClick={generateCaption} disabled={genLoading} style={{ ...btnO(C.primary,12) }}>{genLoading?"Generating…":"Generate caption + image with AI"}</button>
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
                <div style={{ background:"#F5F3FF", borderRadius:8, padding:"8px 12px", marginTop:6 }}>
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

// ── MAIN HUB ─────────────────────────────────────────────────────────────────

export default function Hub() {
  const { id: businessId } = useParams();
  const { user } = useStore();
  const [business,   setBusiness]   = useState(null);
  const [outputs,    setOutputs]    = useState([]);
  const [integs,     setIntegs]     = useState([]);
  const [tasks,      setTasks]      = useState([]);
  const [metrics,    setMetrics]    = useState({ revenue:{this_month:0,last_month:0,total:0}, clients:{active:0,total:0}, leads:{this_month:0,total:0}, social:{instagram:0,tiktok:0,facebook:0,google_reviews:0,google_rating:0}, bookings:{this_week:0,this_month:0} });
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
  const navigate = useNavigate();

  const age     = user?.age;
  const isMinor = age && age < 18;

  useEffect(()=>{
    const toured = localStorage.getItem(`earnedlab_toured_${businessId}`);
    if (!toured) setShowTour(true);
  },[businessId]);

  useEffect(()=>{ api.subscriptions.me().then(setPlanInfo).catch(()=>{}); },[]);

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

  const dismissTour = () => {
    localStorage.setItem(`earnedlab_toured_${businessId}`, "1");
    setShowTour(false);
  };

  const idea     = (()=>{ try{return JSON.parse(business?.ideaData||"{}");}catch{return {};} })();
  const getOutput= type => outputs.find(o=>o.type===type);
  const isConn   = p => integs.find(i=>i.provider===p)?.status==="connected";

  const saveM = async(path,v)=>{
    const parts=path.split("."); const u=JSON.parse(JSON.stringify(metrics)); let o=u;
    for(let i=0;i<parts.length-1;i++) o=o[parts[i]]; o[parts[parts.length-1]]=v;
    setMetrics(u); await api.metrics.save(businessId,u).catch(()=>{});
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

  const saveIntegFields = async (provider, vals) => {
    const intg = await api.integrations.saveFields(businessId, provider, vals);
    setIntegs(p => {
      const existing = p.find(i=>i.provider===provider);
      return existing ? p.map(i=>i.provider===provider?intg.integration:i) : [...p, intg.integration];
    });
  };

  if(loading) return (
    <div style={{ display:"flex", minHeight:"100vh", alignItems:"center", justifyContent:"center", background:C.bg }}>
      <div style={{ width:32, height:32, borderRadius:"50%", border:`3px solid ${C.primary}25`, borderTopColor:C.primary, animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  const navItems = [
    { id:"overview",   label:"Overview"         },
    { id:"tasks",      label:"Tasks"            },
    { id:"hub",        label:"Hub"              },
    { id:"marketing",  label:"Marketing Agent"  },
    { id:"management", label:"Management Agent" },
  ];

  const tasksDone  = tasks.filter(t=>t.status==="done").length;
  const tasksTotal = tasks.length;

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:FB }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {showTour && <GuidedTour business={business} user={user} onDone={dismissTour} />}

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
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:FB }}>{business?.location}</span>
          </div>
          {planInfo && (
            <div onClick={()=>navigate("/pricing")} style={{ cursor:"pointer", display:"inline-flex", alignItems:"center", gap:5, background:planInfo.locked?"rgba(220,38,38,0.15)":`${C.primary}20`, border:`1px solid ${planInfo.locked?"#DC262640":C.primary+"40"}`, borderRadius:6, padding:"3px 8px" }}>
              <span style={{ fontSize:10, color:planInfo.locked?"#FCA5A5":"#A78BFA", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", fontFamily:FB }}>
                {planInfo.isAdmin ? `Admin${planInfo.simulating?" — "+planInfo.simulating.replace("_"," "):""}` : planInfo.locked?"Trial expired":planInfo.isTrial?`Trial — ${planInfo.trialDaysLeft}d left`:planInfo.plan}
              </span>
            </div>
          )}
        </div>

        <nav style={{ padding:"12px 8px", flex:1 }}>
          {navItems.map(({id,label})=>(
            <div key={id} onClick={()=>setTab(id)} style={{ padding:"10px 14px", borderRadius:10, marginBottom:3, background:tab===id?`${C.primary}25`:"transparent", color:tab===id?"#fff":"rgba(255,255,255,0.45)", cursor:"pointer", fontSize:13, fontWeight:tab===id?600:400, fontFamily:FB, borderLeft:tab===id?`3px solid ${C.primary}`:"3px solid transparent", transition:"all 0.12s", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>{label}</span>
              {id==="tasks" && tasksTotal > 0 && (
                <span style={{ fontSize:10, background:tasksDone===tasksTotal?"#4ADE8030":"rgba(255,255,255,0.08)", color:tasksDone===tasksTotal?"#4ADE80":"rgba(255,255,255,0.4)", padding:"1px 7px", borderRadius:20, fontWeight:700 }}>{tasksDone}/{tasksTotal}</span>
              )}
            </div>
          ))}
        </nav>

        <div style={{ padding:"10px 8px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <div onClick={()=>setShowTour(true)} style={{ padding:"8px 12px", borderRadius:8, color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:12, fontFamily:FB }}>Replay tour</div>
          <div onClick={()=>navigate("/dashboard")} style={{ padding:"8px 12px", borderRadius:8, color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:12, fontFamily:FB }}>All businesses</div>
        </div>
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
          {tab==="tasks" && <TasksPanel businessId={businessId} businessOutputs={outputs} />}

          {/* HUB */}
          {tab==="hub" && (
            <HubPanel
              businessId={businessId}
              integs={integs}
              onSaveFields={saveIntegFields}
              tasks={tasks}
              outputs={outputs}
              isMinor={!!isMinor}
            />
          )}

          {/* MARKETING AGENT */}
          {tab==="marketing" && (
            <div>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, letterSpacing:"-0.04em", marginBottom:4 }}>Marketing Agent</div>
              <p style={{ color:C.muted, fontSize:14, marginBottom:24, fontFamily:FB }}>Analyzes your connected channels and metrics to surface the highest-impact opportunities. Works with any channel — add more in the Hub to broaden coverage.</p>
              {integs.some(i=>i.provider==="instagram") && (
                <InstagramPanel businessId={businessId} businessName={business?.name || ""} integs={integs} />
              )}
              <AgentPanel businessId={businessId} businessName={business?.name || ""} metrics={metrics} planInfo={planInfo} integs={integs} setTab={setTab}/>
            </div>
          )}

          {/* MANAGEMENT AGENT */}
          {tab==="management" && (
            <div>
              <div style={{ fontFamily:FH, fontWeight:700, fontSize:24, letterSpacing:"-0.04em", marginBottom:4 }}>Management Agent</div>
              <p style={{ color:C.muted, fontSize:14, marginBottom:24, fontFamily:FB }}>Track your metrics and preferences. The management agent adapts its advice as your business evolves.</p>

              <AutopilotCard businessId={businessId} planInfo={planInfo} navigate={navigate} />

              <div style={{ ...card("12px 16px"), marginBottom:16, background:C.surface, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:12, color:C.muted, fontFamily:FB }}>Business preferences and brand identity are now in <button onClick={()=>setTab("overview")} style={{ background:"none", border:"none", color:C.primary, cursor:"pointer", fontSize:12, fontFamily:FB, padding:0 }}>Overview →</button></div>
              </div>

              <div style={{ ...card("16px 18px"), marginBottom:24, background:C.primaryBg, border:`1px solid ${C.primary}15` }}>
                <div style={{ fontFamily:FH, fontWeight:600, fontSize:14, marginBottom:8 }}>Ask your management agent</div>
                <p style={{ fontSize:12, color:C.muted, marginBottom:10, fontFamily:FB }}>Ask anything about your business. Say "I'm scaling up" or "I want to go global" and those preferences will be updated automatically.</p>
                <div style={{ display:"flex", gap:8, marginBottom:mgmtAns?12:0 }}>
                  <input value={mgmtQ} onChange={e=>setMgmtQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askMgmt()} placeholder="What should I focus on this week? I want to go global." style={{ ...inp(), flex:1 }} />
                  <button onClick={askMgmt} disabled={hubLoading} style={{ ...btn(C.primary,"#fff",13), padding:"10px 16px", flexShrink:0 }}>{hubLoading?"…":"Ask"}</button>
                </div>
                {mgmtAns&&<div style={{ background:C.surface, borderRadius:10, padding:"12px 14px", fontSize:13, color:C.text, lineHeight:1.7, fontFamily:FB, border:`1px solid ${C.border}` }}>{mgmtAns}</div>}
              </div>

              <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, marginBottom:12 }}>Revenue</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
                <StatCard label="This month"  value={metrics.revenue.this_month}  prefix="$" onChange={v=>saveM("revenue.this_month",v)}/>
                <StatCard label="Last month"  value={metrics.revenue.last_month}  prefix="$" onChange={v=>saveM("revenue.last_month",v)}/>
                <StatCard label="All time"    value={metrics.revenue.total}       prefix="$" onChange={v=>saveM("revenue.total",v)}/>
              </div>

              <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, marginBottom:12 }}>Clients &amp; Leads</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
                <StatCard label="Active clients"   value={metrics.clients.active}   onChange={v=>saveM("clients.active",v)}/>
                <StatCard label="Total clients"    value={metrics.clients.total}    onChange={v=>saveM("clients.total",v)}/>
                <StatCard label="Leads this month" value={metrics.leads.this_month} onChange={v=>saveM("leads.this_month",v)}/>
              </div>

              <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, marginBottom:12 }}>Social Media</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
                <StatCard label="Instagram" value={metrics.social.instagram} onChange={v=>saveM("social.instagram",v)}/>
                <StatCard label="TikTok"    value={metrics.social.tiktok}    onChange={v=>saveM("social.tiktok",v)}/>
                <StatCard label="Facebook"  value={metrics.social.facebook}  onChange={v=>saveM("social.facebook",v)}/>
              </div>

              <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, marginBottom:12 }}>Bookings &amp; Reviews</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                <StatCard label="Bookings this week"  value={metrics.bookings.this_week}    onChange={v=>saveM("bookings.this_week",v)}/>
                <StatCard label="Bookings this month" value={metrics.bookings.this_month}   onChange={v=>saveM("bookings.this_month",v)}/>
                <StatCard label="Google reviews"      value={metrics.social.google_reviews} onChange={v=>saveM("social.google_reviews",v)}/>
                <StatCard label="Google rating"       value={metrics.social.google_rating}  onChange={v=>saveM("social.google_rating",v)}/>
              </div>
            </div>
          )}
        </div>
      </div>

      {chatOpen && <GuidePanel messages={chatMsgs} onClose={()=>setChatOpen(false)} onSend={sendChat} businessId={businessId}/>}
      <button onClick={()=>setChatOpen(o=>!o)} style={{ background:C.grad, color:"#fff", border:"none", borderRadius:24, padding:"10px 20px", fontSize:13, fontWeight:500, cursor:"pointer", position:"fixed", bottom:24, right:chatOpen?336:24, boxShadow:`0 4px 20px rgba(124,58,237,0.3)`, zIndex:100, transition:"right 0.25s", fontFamily:FB }}>
        Ask guide
      </button>
    </div>
  );
}
