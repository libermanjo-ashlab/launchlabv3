/**
 * Marketing Agent — complete UI
 *
 * Exports: AgentPanel
 *
 * Three operating modes:
 *   manual   — basic overview from user-inputted stats, general tips, user-built campaigns
 *   guided   — user-triggered AI analysis, step-by-step content, user confirms each task
 *   auto     — fully autonomous: analysis runs every 12h, campaigns auto-execute
 *
 * Campaign lifecycle: planned → active → monitoring → archived
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { C, FH, FB, btn, btnO, card, inp, lbl } from "../components";
import { generatePostImageBlob } from "../lib/postImageCanvas";

// ── Design helpers ────────────────────────────────────────────────────────────

const CH_LABELS = {
  instagram:"Instagram", email:"Email", website:"Website",
  google:"Google Business", calendly:"Calendly", twitter:"X / Twitter",
  tiktok:"TikTok", general:"General",
};
const PRI_CLR  = { high:"#EF4444", medium:C.warn, low:C.muted };
const STAT_CLR = { planned:C.primary, active:C.warn, monitoring:"#8B5CF6", archived:C.ok };
const NOTE_COLORS = ["#FEF9C3","#FCE7F3","#DBEAFE","#D1FAE5","#FEE2E2"];
const CH_OPTIONS  = ["instagram","email","website","google","twitter","tiktok","general"];

function spin() {
  return { width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.35)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite", flexShrink:0 };
}

// ── Mode Toggle ───────────────────────────────────────────────────────────────

function ModeToggle({ mode, onChange }) {
  const opts = [
    { value:"manual",  label:"Manual",    desc:"Track your own work with general tips" },
    { value:"guided",  label:"Guided",    desc:"AI generates content, you implement manually" },
    { value:"auto",    label:"Autopilot", desc:"Full automation — runs every 12h, executes campaigns" },
  ];
  return (
    <div style={{ display:"flex", background:"#F1F0EF", borderRadius:12, padding:3, gap:2, marginBottom:18 }}>
      {opts.map(o=>(
        <button key={o.value} title={o.desc} onClick={()=>onChange(o.value)}
          style={{ flex:1, padding:"8px 10px", borderRadius:9, border:"none", cursor:"pointer",
            fontFamily:FB, fontWeight:600, fontSize:12, transition:"all 0.15s",
            background: mode===o.value ? (o.value==="auto"?C.primary:o.value==="guided"?"#4F46E5":"#374151") : "transparent",
            color: mode===o.value ? "#fff" : C.muted,
            boxShadow: mode===o.value ? "0 1px 5px rgba(0,0,0,0.18)" : "none" }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Sticky Notes Panel ────────────────────────────────────────────────────────

function StickyNotesPanel({ businessId }) {
  const [open,    setOpen]    = useState(false);
  const [notes,   setNotes]   = useState([]);
  const [newText, setNewText] = useState("");
  const [newColor,setNewColor]= useState(NOTE_COLORS[0]);
  const [adding,  setAdding]  = useState(false);

  useEffect(()=>{
    api.agents.notes(businessId).then(d=>setNotes(d.notes||[])).catch(()=>{});
  },[businessId]);

  const addNote = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    try {
      const { note } = await api.agents.addNote(businessId, newText.trim(), newColor);
      setNotes(p=>[note,...p]);
      setNewText("");
    } catch {}
    setAdding(false);
  };

  const deleteNote = async (id) => {
    setNotes(p=>p.filter(n=>n.id!==id));
    api.agents.deleteNote(businessId, id).catch(()=>{});
  };

  return (
    <div style={{ position:"relative" }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ ...btnO(open?C.primary:"#9CA3AF",11), padding:"5px 10px", display:"flex", alignItems:"center", gap:5 }}>
        📝 Notes {notes.length>0 && <span style={{ background:C.primary, color:"#fff", borderRadius:10, padding:"0 5px", fontSize:10 }}>{notes.length}</span>}
      </button>

      {open && (
        <div style={{ position:"absolute", top:36, right:0, zIndex:100, width:300, ...card("14px"), border:`1px solid ${C.border}`, boxShadow:"0 8px 30px rgba(0,0,0,0.12)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:13 }}>Sticky Notes</span>
            <button onClick={()=>setOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:16, lineHeight:1 }}>×</button>
          </div>

          <div style={{ maxHeight:280, overflowY:"auto", marginBottom:10 }}>
            {notes.length===0 && <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"12px 0" }}>No notes yet. Add one below.</div>}
            {notes.map(n=>(
              <div key={n.id} style={{ background:n.color||NOTE_COLORS[0], borderRadius:8, padding:"8px 10px", marginBottom:6, position:"relative", display:"flex", gap:6 }}>
                <div style={{ flex:1, fontSize:12, color:"#374151", fontFamily:FB, lineHeight:1.5, wordBreak:"break-word" }}>{n.text}</div>
                <button onClick={()=>deleteNote(n.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:14, padding:0, flexShrink:0, alignSelf:"flex-start" }}>×</button>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:4, marginBottom:6 }}>
            {NOTE_COLORS.map(clr=>(
              <div key={clr} onClick={()=>setNewColor(clr)}
                style={{ width:20, height:20, borderRadius:"50%", background:clr, cursor:"pointer", border: newColor===clr ? "2px solid #374151" : "2px solid transparent" }} />
            ))}
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <input value={newText} onChange={e=>setNewText(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addNote()}
              placeholder="Add a note…"
              style={{ ...inp({ fontSize:12, padding:"6px 10px" }), flex:1 }} />
            <button onClick={addNote} disabled={adding||!newText.trim()}
              style={{ ...btn(C.primary,"#fff",11), padding:"6px 12px", flexShrink:0 }}>
              {adding?"…":"Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Channel stat chips ────────────────────────────────────────────────────────

function ChannelStatCard({ stat }) {
  const [open, setOpen] = useState(false);
  const scoreColor = stat.score >= 70 ? C.ok : stat.score >= 40 ? C.warn : "#EF4444";
  return (
    <div style={{ ...card("10px 12px"), border:`1px solid ${C.border}`, marginBottom:6, cursor:"pointer" }} onClick={()=>setOpen(o=>!o)}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:scoreColor, flexShrink:0 }} />
        <span style={{ fontFamily:FB, fontWeight:600, fontSize:13, flex:1 }}>{stat.label || CH_LABELS[stat.channel] || stat.channel}</span>
        <div style={{ background: scoreColor+"18", color:scoreColor, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20, fontFamily:FB }}>{stat.score}/100</div>
        <span style={{ fontSize:11, color:C.muted }}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
          {stat.highlights?.map((h,i)=>(
            <div key={i} style={{ fontSize:12, color:C.text, fontFamily:FB, marginBottom:3, display:"flex", gap:6 }}>
              <span style={{ color:C.ok, flexShrink:0 }}>✓</span>{h}
            </div>
          ))}
          {stat.alerts?.map((a,i)=>(
            <div key={i} style={{ fontSize:12, color:"#EF4444", fontFamily:FB, marginBottom:3, display:"flex", gap:6 }}>
              <span style={{ flexShrink:0 }}>!</span>{a}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Market analysis section ───────────────────────────────────────────────────

function MarketAnalysisSection({ analysis }) {
  const [open, setOpen] = useState(false);
  if (!analysis) return null;
  return (
    <div style={{ ...card("12px 14px"), border:`1px solid ${C.border}`, marginBottom:10 }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex", justifyContent:"space-between", cursor:"pointer", alignItems:"center" }}>
        <span style={{ fontFamily:FB, fontWeight:600, fontSize:13 }}>Market Analysis</span>
        <span style={{ fontSize:11, color:C.muted }}>{open?"▲":"▼"}</span>
      </div>
      {!open && <p style={{ fontSize:12, color:C.muted, fontFamily:FB, marginTop:6, lineHeight:1.5 }}>{analysis.summary}</p>}
      {open && (
        <div style={{ marginTop:10 }}>
          <p style={{ fontSize:12, color:C.text, fontFamily:FB, lineHeight:1.6, marginBottom:8 }}>{analysis.summary}</p>
          <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4, fontFamily:FB }}>Competitor activity</p>
          <p style={{ fontSize:12, color:C.text, fontFamily:FB, lineHeight:1.5, marginBottom:8 }}>{analysis.competitorBehavior}</p>
          {analysis.opportunities?.length > 0 && (
            <>
              <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4, fontFamily:FB }}>Opportunities</p>
              {analysis.opportunities.map((o,i)=>(
                <div key={i} style={{ fontSize:12, color:C.text, fontFamily:FB, marginBottom:4, display:"flex", gap:6 }}>
                  <span style={{ color:C.primary, flexShrink:0 }}>→</span>{o}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Content preview block ─────────────────────────────────────────────────────

function ContentPreviewBlock({ content, channel, mode }) {
  const [copied, setCopied] = useState(false);
  if (!content) return null;

  const copyText = (t) => { navigator.clipboard.writeText(t).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),1500); }); };

  if (content.type === "manual_tip") {
    return (
      <div style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 12px", marginTop:8 }}>
        <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6, fontFamily:FB }}>Tips for {CH_LABELS[channel]||channel}</p>
        {content.tips?.map((t,i)=>(
          <div key={i} style={{ fontSize:12, color:C.text, fontFamily:FB, marginBottom:4, display:"flex", gap:6 }}>
            <span style={{ color:C.warn, flexShrink:0 }}>{i+1}.</span>{t}
          </div>
        ))}
      </div>
    );
  }

  // OpenAI Instagram caption output: { caption, body, hashtags, imageUrl }
  if (content.caption || content.body) {
    return (
      <div style={{ background:"#F0FDF4", border:`1px solid ${C.ok}20`, borderRadius:8, padding:"10px 12px", marginTop:8 }}>
        <p style={{ fontSize:11, fontWeight:700, color:C.ok, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6, fontFamily:FB }}>
          {mode==="auto"?"Auto-generated post":"Generated post — copy and use"}
        </p>
        {content.imageUrl && <img src={content.imageUrl} alt="Post" style={{ width:"100%", borderRadius:6, marginBottom:8, maxHeight:200, objectFit:"cover" }} />}
        <p style={{ fontSize:13, color:"#374151", fontFamily:FB, lineHeight:1.6, marginBottom:6 }}>{content.body || content.caption}</p>
        {content.hashtags && <p style={{ fontSize:11, color:C.muted, fontFamily:FB, marginBottom:8 }}>{content.hashtags}</p>}
        <button onClick={()=>copyText(content.caption||"")} style={{ ...btnO(C.ok,10), padding:"3px 8px" }}>{copied?"Copied!":"Copy caption"}</button>
      </div>
    );
  }

  return (
    <div style={{ background:"#F0FDF4", border:`1px solid ${C.ok}20`, borderRadius:8, padding:"10px 12px", marginTop:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <p style={{ fontSize:11, fontWeight:700, color:C.ok, textTransform:"uppercase", letterSpacing:"0.05em", fontFamily:FB }}>
          {mode==="auto"?"Auto-generated content":"Generated content — copy and use"}
        </p>
        <button onClick={()=>copyText(content.content||"")}
          style={{ ...btnO(C.ok,10), padding:"3px 8px" }}>{copied?"Copied!":"Copy all"}</button>
      </div>
      <pre style={{ fontSize:12, color:"#374151", fontFamily:"'DM Mono', monospace", lineHeight:1.6, whiteSpace:"pre-wrap", wordBreak:"break-word", margin:0 }}>
        {content.content}
      </pre>
    </div>
  );
}

// ── Suggestion Card (analysis insights) ──────────────────────────────────────

function SuggestionCard({ suggestion:s, mode, onAddToCampaign, onImplement, implementing, implemented, access, navigate }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const isImplemented = implemented?.[s.id];
  const isImplementing = implementing === s.id;

  const getPreview = () => {
    if (!s.contentPreview) return null;
    if (mode==="manual") return s.contentPreview.manual || null;
    const ch = s.channel;
    return s.contentPreview?.[ch] || s.contentPreview?.manual || null;
  };

  const preview = getPreview();

  return (
    <div style={{ ...card("12px 14px"), marginBottom:10, border:`1px solid ${s.priority==="high"?"#EF444422":C.border}`, background: s.priority==="high" ? "#FFF5F5" : "#FFFFFF" }}>
      <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ background:PRI_CLR[s.priority]+"18", color:PRI_CLR[s.priority], fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FB }}>{s.priority}</span>
        <span style={{ background:C.primaryBg, color:C.primary, fontSize:9, fontWeight:600, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.04em", fontFamily:FB }}>{CH_LABELS[s.channel]||s.channel}</span>
        {s.estimatedMinutes && <span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>~{s.estimatedMinutes} min</span>}
        <span style={{ fontSize:10, color:C.ok, fontFamily:FB, marginLeft:"auto" }}>{s.expectedImpact}</span>
      </div>

      <p style={{ fontSize:14, fontWeight:600, color:C.text, lineHeight:1.4, marginBottom:6, fontFamily:FH }}>{s.title || s.recommendation}</p>
      <p style={{ fontSize:13, color:C.muted, lineHeight:1.55, marginBottom:10, fontFamily:FB }}>{s.rationale || s.agentObservation}</p>

      {preview && mode !== "auto" && (
        <div style={{ marginBottom:10 }}>
          <button onClick={()=>setPreviewOpen(o=>!o)} style={{ ...btnO("#9CA3AF",10), padding:"3px 8px" }}>
            {previewOpen?"Hide content preview":"Preview content"}
          </button>
          {previewOpen && <ContentPreviewBlock content={
            typeof preview === "object" && preview.caption
              ? { type:"instagram_content", content: `CAPTION:\n${preview.caption}\n\nHASHTAGS:\n${preview.hashtags||""}` }
              : preview
          } channel={s.channel} mode={mode} />}
        </div>
      )}

      {mode === "auto" && s.contentPreview?.[s.channel] && (
        <div style={{ background:"#F0FDF4", borderRadius:7, padding:"7px 10px", marginBottom:10, fontSize:11, color:C.ok, fontFamily:FB }}>
          Content will be auto-generated and published when this runs
        </div>
      )}

      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {mode !== "manual" && (
          <button onClick={()=>onAddToCampaign(s)} style={{ ...btnO(C.primary,11), flex:1, textAlign:"center", padding:"5px 10px" }}>
            + Add to campaigns
          </button>
        )}
        {mode === "auto" && (
          <button onClick={()=>onAddToCampaign({...s, autoStart:true})}
            style={{ ...btn(C.primary,"#fff",11), flex:1, textAlign:"center", padding:"5px 10px" }}>
            ▶ Auto-run now
          </button>
        )}
        {mode === "guided" && access?.management?.allowed && !isImplemented && (
          <button onClick={()=>onImplement(s)} disabled={!!implementing}
            style={{ ...btn(isImplementing?"#9CA3AF":C.dark,"#fff",11), flex:1, padding:"5px 10px", display:"flex", alignItems:"center", justifyContent:"center", gap:6, opacity:implementing&&!isImplementing?0.5:1 }}>
            {isImplementing&&<span style={spin()}/>}
            {isImplementing?"Running…":"Implement now"}
          </button>
        )}
        {mode === "manual" && (
          <button onClick={()=>onAddToCampaign(s)} style={{ ...btnO(C.muted,11), flex:1, textAlign:"center", padding:"5px 10px" }}>
            Note this tip
          </button>
        )}
      </div>
    </div>
  );
}

// ── Campaign task row ─────────────────────────────────────────────────────────

function CampaignTaskRow({ task:t, mode, channel, businessId, businessName, onComplete, onSkip, autoRun, isAutoRunning }) {
  const [running,   setRunning]   = useState(false);
  const [content,   setContent]   = useState(null);
  const [showContent, setShowContent] = useState(false);
  const [error,     setError]     = useState("");

  const isDone = t.status === "completed" || t.status === "done";

  const runTask = async () => {
    console.log(`[TASK:runTask] Starting — taskId=${t.id} taskName="${t.name}" mode=${mode} channel=${channel}`);
    setRunning(true); setError("");
    try {
      const result = await api.tasks.run(t.id);
      const output = result.task?.outputData;
      console.log(`[TASK:runTask] Server response — channel=${output?.channel} imageSource=${output?.imageSource} published=${output?.published} hasImageUrl=${!!output?.imageUrl} imageUrl=${output?.imageUrl || "none"} captionLen=${output?.caption?.length || 0}`);
      if (output?.imageUrl || output?.channel) setContent(output);
      else if (output?.fields) setContent({ type:"fields", fields:output.fields });
      setShowContent(true);
      onComplete(t.id);
    } catch(e) {
      console.error(`[TASK:runTask] FAILED — taskId=${t.id} error="${e.message}"`);
      setError(e.message);
    }
    setRunning(false);
  };

  const getContent = async () => {
    if (content) { setShowContent(s=>!s); return; }
    console.log(`[TASK:getContent] Starting — taskName="${t.name}" channel=${channel} mode=${mode} businessId=${businessId}`);
    setRunning(true);
    try {
      const res = await api.agents.taskContent(businessId, t, channel, mode);
      let c = res.content;
      console.log(`[TASK:getContent] Server response — channel=${c?.channel} imageSource=${c?.imageSource} hasImageUrl=${!!c?.imageUrl} captionLen=${c?.caption?.length || 0}`);

      // For Instagram tasks, replace server-generated image with Canvas-rendered one
      if (c?.caption && (channel === "instagram" || /instagram/i.test(t.name))) {
        console.log(`[TASK:getContent] Generating Canvas image — businessName="${businessName || "Business"}" captionLen=${(c.body || c.caption)?.length}`);
        try {
          const blob = await generatePostImageBlob(businessName || "Business", c.body || c.caption);
          console.log(`[TASK:getContent] Canvas blob generated — size=${blob.size} type=${blob.type}`);
          const { imageUrl } = await api.instagram.uploadImage(blob);
          console.log(`[TASK:getContent] Canvas image uploaded — imageUrl=${imageUrl}`);
          c = { ...c, imageUrl, imageSource: "canvas" };
        } catch(imgErr) {
          console.error(`[TASK:getContent] Canvas image FAILED — ${imgErr.message}. Keeping server image: ${c.imageUrl || "none"}`);
        }
      }
      setContent(c);
      setShowContent(true);
    } catch(e) {
      console.error(`[TASK:getContent] FAILED — taskName="${t.name}" error="${e.message}"`);
      setError(e.message);
    }
    setRunning(false);
  };

  return (
    <div style={{ padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${isDone?C.ok:C.border}`, background:isDone?C.ok:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {isDone && <span style={{ color:"#fff", fontSize:9, fontWeight:700 }}>✓</span>}
        </div>
        <span style={{ flex:1, fontSize:12, fontFamily:FB, color:isDone?C.muted:C.text, textDecoration:isDone?"line-through":"none" }}>{t.name}</span>
        {t.estimatedTime && !isDone && <span style={{ fontSize:10, color:C.muted, fontFamily:FB, flexShrink:0 }}>{t.estimatedTime}</span>}

        {!isDone && (
          <div style={{ display:"flex", gap:4, flexShrink:0 }}>
            {mode==="auto" && t.id && (
              <button onClick={runTask} disabled={running||isAutoRunning}
                style={{ ...btn(running?"#9CA3AF":C.primary,"#fff",10), padding:"3px 8px", display:"flex", alignItems:"center", gap:4 }}>
                {running&&<span style={{ ...spin(), width:10, height:10, borderWidth:1.5 }}/>}
                {running?"Running…":"Run"}
              </button>
            )}
            {mode==="guided" && t.id && (
              <>
                <button onClick={getContent} disabled={running}
                  style={{ ...btnO(C.primary,10), padding:"3px 8px" }}>
                  {running?"…":content?"Content":"Get content"}
                </button>
                <button onClick={runTask} disabled={running}
                  style={{ ...btn(C.warn,"#fff",10), padding:"3px 8px" }}>
                  {running?"Running…":"Run"}
                </button>
              </>
            )}
            {mode==="manual" && (
              <>
                <button onClick={getContent} disabled={running}
                  style={{ ...btnO(C.muted,10), padding:"3px 8px" }}>
                  {running?"…":showContent?"Hide tips":"Show tips"}
                </button>
                <button onClick={()=>onComplete(t.id)}
                  style={{ ...btn(C.ok,"#fff",10), padding:"3px 8px" }}>
                  Done
                </button>
              </>
            )}
            <button onClick={()=>onSkip(t.id)} style={{ ...btnO("#9CA3AF",10), padding:"3px 6px" }}>Skip</button>
          </div>
        )}
      </div>

      {error && <div style={{ fontSize:11, color:C.err, fontFamily:FB, marginTop:4 }}>{error}</div>}

      {showContent && content && (
        <div style={{ marginTop:6, marginLeft:22 }}>
          {content.type==="fields" ? (
            <div style={{ background:"#F9FAFB", borderRadius:7, padding:"8px 10px" }}>
              {(content.fields||[]).map((f,i)=>(
                <div key={i} style={{ display:"flex", gap:6, fontSize:12, fontFamily:FB, marginBottom:3 }}>
                  <span style={{ color:C.muted, flexShrink:0, minWidth:80 }}>{f.label}:</span>
                  <span style={{ color:C.text }}>{f.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <ContentPreviewBlock content={content} channel={channel} mode={mode} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign:c, onUpdate, onDelete, businessId, businessName, setTab }) {
  const [expanded,    setExpanded]    = useState(c.status==="active");
  const [starting,    setStarting]    = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const abortRef = useRef(false);

  const tasks     = c.tasks || [];
  const completed = tasks.filter(t=>t.status==="completed"||t.status==="done").length;
  const total     = tasks.length;
  const pct       = total > 0 ? Math.round(completed/total*100) : (c.progressTarget > 0 ? Math.min(100,Math.round((c.progressCurrent||0)/c.progressTarget*100)) : 0);
  const mode      = c.mode || "guided";
  const statusColor = STAT_CLR[c.status] || C.muted;

  const startCampaign = async () => {
    console.log(`[CAMPAIGN:startCampaign] Starting — campaignId=${c.id} title="${c.title}" channel=${c.channel} mode=${mode}`);
    setStarting(true);
    try {
      const res = await api.agents.campaignBreakdown(businessId, {...c, status:"active"});
      console.log(`[CAMPAIGN:startCampaign] Breakdown complete — taskCount=${res.tasks?.length} taskIds=${JSON.stringify(res.taskIds?.slice(0,3))} progressTarget=${res.progressTarget} progressUnit=${res.progressUnit}`);
      if (!res.tasks?.length) {
        console.warn(`[CAMPAIGN:startCampaign] WARNING — breakdown returned 0 tasks! campaign="${c.title}"`);
      }
      const updated = { ...c, status:"active", tasks:res.tasks, taskIds:res.taskIds, progressTarget:res.progressTarget, progressUnit:res.progressUnit, startedAt:new Date().toISOString() };
      onUpdate(updated);
      if (mode==="auto") {
        console.log(`[CAMPAIGN:startCampaign] Auto mode — scheduling runTasksAuto in 300ms`);
        setTimeout(()=>runTasksAuto(updated), 300);
      }
    } catch(e) {
      console.error(`[CAMPAIGN:startCampaign] FAILED — campaignId=${c.id} error="${e.message}"`);
      alert("Could not start campaign: "+e.message);
    }
    setStarting(false);
  };

  const runTasksAuto = async (camp) => {
    abortRef.current = false;
    setAutoRunning(true);
    const taskList = camp.tasks || [];
    console.log(`[AUTOPILOT:runTasksAuto] Starting — campaignId=${camp.id} title="${camp.title}" taskCount=${taskList.length} mode=${mode}`);

    if (taskList.length === 0) {
      console.warn(`[AUTOPILOT:runTasksAuto] No tasks found in campaign — did campaignBreakdown return tasks? campaignId=${camp.id}`);
    }

    for (const task of taskList) {
      if (abortRef.current) {
        console.log(`[AUTOPILOT:runTasksAuto] Aborted before task taskId=${task.id}`);
        break;
      }
      if (task.status==="completed"||task.status==="done") {
        console.log(`[AUTOPILOT:runTasksAuto] Skipping already-done task — taskId=${task.id} name="${task.name}"`);
        continue;
      }
      console.log(`[AUTOPILOT:runTasksAuto] Running task — taskId=${task.id} name="${task.name}"`);
      try {
        const result = await api.tasks.run(task.id);
        const output = result.task?.outputData;
        console.log(`[AUTOPILOT:runTasksAuto] Task complete — taskId=${task.id} channel=${output?.channel} published=${output?.published} imageSource=${output?.imageSource} imageUrl=${output?.imageUrl || "none"}`);
        onUpdate(prev => prev.id===camp.id ? {
          ...prev,
          tasks: (prev.tasks||[]).map(t=>t.id===task.id?{...t,status:"completed",outputData:output}:t),
          progressCurrent: (prev.progressCurrent||0)+1,
        } : prev);
        await new Promise(r=>setTimeout(r,400));
      } catch(taskErr) {
        console.error(`[AUTOPILOT:runTasksAuto] Task FAILED — taskId=${task.id} name="${task.name}" error="${taskErr.message}"`);
      }
    }
    setAutoRunning(false);
    // Move to monitoring after auto-run
    if (!abortRef.current) {
      console.log(`[AUTOPILOT:runTasksAuto] All tasks processed — moving campaign to monitoring. campaignId=${camp.id}`);
      onUpdate(prev => prev.id===camp.id ? {...prev, status:"monitoring"} : prev);
    }
  };

  const completeTask = (taskId) => {
    onUpdate({ ...c, tasks:tasks.map(t=>t.id===taskId?{...t,status:"completed"}:t), progressCurrent:(c.progressCurrent||0)+1 });
  };
  const skipTask = (taskId) => {
    onUpdate({ ...c, tasks:tasks.map(t=>t.id===taskId?{...t,status:"skipped"}:t) });
  };

  const markDone = () => onUpdate({ ...c, status:"monitoring", completedAt:new Date().toISOString() });
  const archive  = () => onUpdate({ ...c, status:"archived", archivedAt:new Date().toISOString() });
  const pause    = () => { abortRef.current=true; setAutoRunning(false); };

  const activeTasks = tasks.filter(t=>t.status!=="completed"&&t.status!=="done"&&t.status!=="skipped");
  const allDone = tasks.length > 0 && activeTasks.length === 0;

  return (
    <div style={{ ...card("12px 14px"), marginBottom:10, border:`1px solid ${statusColor}25`, background: c.status==="archived"?"#F9F9F9":"#fff" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
        <div style={{ flex:1, paddingRight:8 }}>
          <div style={{ display:"flex", gap:6, marginBottom:4, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:9, fontWeight:700, fontFamily:FB, padding:"2px 7px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.05em", background:statusColor+"18", color:statusColor }}>{c.status}</span>
            {c.channel && <span style={{ fontSize:9, fontWeight:600, fontFamily:FB, padding:"2px 7px", borderRadius:20, background:C.primaryBg, color:C.primary, textTransform:"uppercase", letterSpacing:"0.04em" }}>{CH_LABELS[c.channel]||c.channel}</span>}
            <span style={{ fontSize:9, fontWeight:600, fontFamily:FB, padding:"2px 7px", borderRadius:20, background:"#F4F4F5", color:C.muted, textTransform:"uppercase", letterSpacing:"0.04em" }}>{mode}</span>
          </div>
          <div style={{ fontSize:13, fontWeight:600, fontFamily:FH, lineHeight:1.4 }}>{c.title}</div>
        </div>
        <button onClick={()=>onDelete(c.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:16, padding:0, flexShrink:0 }}>×</button>
      </div>

      {c.rationale && <p style={{ fontSize:12, color:C.muted, fontFamily:FB, lineHeight:1.5, marginBottom:8 }}>{c.rationale}</p>}
      {c.expectedImpact && <div style={{ background:C.okBg, borderRadius:6, padding:"4px 8px", fontSize:11, color:C.ok, fontFamily:FB, marginBottom:8 }}>Goal: {c.expectedImpact}</div>}

      {/* Progress bar */}
      {(total>0 || (c.progressTarget||0)>0) && c.status !== "planned" && (
        <div style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.muted, fontFamily:FB, marginBottom:4 }}>
            <span>{(c.progressTarget||0)>0 ? `${c.progressCurrent||0}/${c.progressTarget} ${c.progressUnit||"actions"}` : `${completed}/${total} tasks`}</span>
            <span>{pct}%</span>
          </div>
          <div style={{ height:5, borderRadius:3, background:C.border }}>
            <div style={{ height:"100%", width:`${pct}%`, borderRadius:3, background:pct>=100?C.ok:statusColor, transition:"width 0.4s" }} />
          </div>
        </div>
      )}

      {/* Task list */}
      {c.status !== "planned" && total > 0 && (
        <div style={{ marginBottom:8 }}>
          <button onClick={()=>setExpanded(o=>!o)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:12, fontFamily:FB, padding:"2px 0", marginBottom:expanded?8:0 }}>
            {expanded?"▲":"▼"} {total} tasks ({completed} done{autoRunning?", running…":""})
          </button>
          {expanded && (
            <div>
              {tasks.map((t,ti)=>(
                <CampaignTaskRow key={t.id||ti} task={t} mode={mode} channel={c.channel}
                  businessId={businessId} businessName={businessName} onComplete={completeTask} onSkip={skipTask}
                  autoRun={autoRunning} isAutoRunning={autoRunning} />
              ))}
              {tasks.length > 0 && <button onClick={()=>setTab("tasks")} style={{ ...btnO(C.muted,10), padding:"3px 8px", marginTop:6 }}>All tasks ↗</button>}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {c.status==="planned" && (
          <button onClick={startCampaign} disabled={starting}
            style={{ ...btn(mode==="auto"?C.primary:C.warn,"#fff",11), padding:"5px 12px", display:"flex", gap:4, alignItems:"center" }}>
            {starting&&<span style={spin()}/>}
            {starting?"Setting up…":mode==="auto"?"▶ Auto-run campaign":"Start campaign"}
          </button>
        )}
        {c.status==="active" && mode==="auto" && !autoRunning && activeTasks.length>0 && (
          <button onClick={()=>runTasksAuto(c)} style={{ ...btn(C.primary,"#fff",11), padding:"5px 12px" }}>▶ Resume auto-run</button>
        )}
        {autoRunning && (
          <button onClick={pause} style={{ ...btn(C.err,"#fff",11), padding:"5px 12px" }}>⏸ Pause</button>
        )}
        {c.status==="active" && (allDone || mode!=="auto") && (
          <button onClick={markDone} style={{ ...btn(C.ok,"#fff",11), padding:"5px 12px" }}>✓ Mark done</button>
        )}
        {c.status==="monitoring" && (
          <button onClick={archive} style={{ ...btnO(C.ok,11), padding:"5px 12px" }}>Archive (goal reached)</button>
        )}
        {c.status==="active" && (
          <button onClick={()=>onUpdate({...c,status:"monitoring",completedAt:new Date().toISOString()})}
            style={{ ...btnO(C.muted,11), padding:"5px 10px" }}>Skip to monitoring</button>
        )}
      </div>
    </div>
  );
}

// ── Add Campaign Form ─────────────────────────────────────────────────────────

function AddCampaignForm({ mode, onAdd }) {
  const [open,      setOpen]      = useState(false);
  const [title,     setTitle]     = useState("");
  const [channel,   setChannel]   = useState("general");
  const [target,    setTarget]    = useState("");
  const [goal,      setGoal]      = useState("");
  const [timeframe, setTimeframe] = useState("7 days");
  const [campaignMode, setCampaignMode] = useState(mode || "guided");

  const add = () => {
    if (!title.trim()) return;
    onAdd({ id:Date.now().toString(), title:title.trim(), channel, expectedImpact:target.trim()||undefined,
      rationale:"", goal:goal.trim(), timeframe, status:"planned", mode:campaignMode,
      createdAt:new Date().toISOString() });
    setTitle(""); setTarget(""); setGoal(""); setOpen(false);
  };

  if (!open) return (
    <button onClick={()=>setOpen(true)} style={{ ...btnO(C.primary,12), width:"100%", textAlign:"center", marginBottom:10 }}>+ Add campaign manually</button>
  );

  return (
    <div style={{ ...card("14px 16px"), marginBottom:12, border:`1px solid ${C.primary}20` }}>
      <div style={{ fontFamily:FH, fontWeight:600, fontSize:13, marginBottom:10, display:"flex", justifyContent:"space-between" }}>
        New Campaign
        <button onClick={()=>setOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:16 }}>×</button>
      </div>

      <div style={{ marginBottom:8 }}>
        <label style={lbl}>Campaign name *</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Post on Instagram this week"
          style={{ ...inp() }} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
        <div>
          <label style={lbl}>Channel</label>
          <select value={channel} onChange={e=>setChannel(e.target.value)} style={{ ...inp({ fontSize:13 }), width:"100%" }}>
            {CH_OPTIONS.map(c=><option key={c} value={c}>{CH_LABELS[c]||c}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Mode</label>
          <select value={campaignMode} onChange={e=>setCampaignMode(e.target.value)} style={{ ...inp({ fontSize:13 }), width:"100%" }}>
            <option value="auto">Auto</option>
            <option value="guided">Guided</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom:8 }}>
        <label style={lbl}>Expected impact / goal</label>
        <input value={target} onChange={e=>setTarget(e.target.value)} placeholder="e.g. +50 followers, $500 revenue"
          style={{ ...inp() }} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
        <div>
          <label style={lbl}>Success metric</label>
          <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="e.g. 3 posts published"
            style={{ ...inp() }} />
        </div>
        <div>
          <label style={lbl}>Timeframe</label>
          <select value={timeframe} onChange={e=>setTimeframe(e.target.value)} style={{ ...inp({ fontSize:13 }), width:"100%" }}>
            {["1 day","3 days","7 days","14 days","30 days","90 days"].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={add} disabled={!title.trim()} style={{ ...btn(C.primary,"#fff",13), flex:1 }}>Add campaign</button>
        <button onClick={()=>setOpen(false)} style={{ ...btnO(C.muted,13), padding:"8px 16px" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Implement Result (inline post-implement display) ─────────────────────────

function ImplementResult({ result, businessId, businessName }) {
  const [publishing,  setPublishing]  = useState(false);
  const [published,   setPublished]   = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [localImgUrl, setLocalImgUrl] = useState(null);

  // Generate image client-side when a caption arrives (browser fonts always available)
  useEffect(() => {
    if (!result?.caption) return;
    let cancelled = false;
    const effectiveName = businessName || "Business";
    console.log(`[IMPLEMENT:canvas] Starting Canvas image generation — businessName="${effectiveName}" captionLen=${(result.body || result.caption)?.length} serverImageSource=${result.imageSource || "unknown"} serverImageUrl=${result.imageUrl || "none"}`);
    (async () => {
      try {
        const blob = await generatePostImageBlob(effectiveName, result.body || result.caption);
        console.log(`[IMPLEMENT:canvas] Blob generated — size=${blob.size} type=${blob.type}`);
        const { imageUrl } = await api.instagram.uploadImage(blob);
        console.log(`[IMPLEMENT:canvas] Upload complete — imageUrl=${imageUrl}`);
        if (!cancelled) setLocalImgUrl(imageUrl);
      } catch(imgErr) {
        console.error(`[IMPLEMENT:canvas] Canvas/upload FAILED — "${imgErr.message}". Will display server image: ${result.imageUrl || "none"}`);
      }
    })();
    return () => { cancelled = true; };
  }, [result?.caption, businessName]);

  if (!result) return null;

  const displayImageUrl = localImgUrl || result.imageUrl;

  const copy = (t) => { navigator.clipboard.writeText(t||"").then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),1500); }); };

  const publishNow = async () => {
    if (!result.caption) return;
    setPublishing(true);
    try {
      await api.instagram.createPost(businessId, displayImageUrl || undefined, result.caption);
      setPublished(true);
    } catch(e) { alert(e.message); }
    setPublishing(false);
  };

  if (result.published || published) {
    return (
      <div style={{ background:C.okBg, borderRadius:8, padding:"8px 12px", marginTop:8, fontSize:12, color:C.ok, fontFamily:FB, display:"flex", gap:8, alignItems:"center" }}>
        <span>✓</span>
        <span>Published to Instagram{result.permalink ? <a href={result.permalink} target="_blank" rel="noopener noreferrer" style={{ color:C.ok, marginLeft:6 }}> View post ↗</a> : ""}</span>
      </div>
    );
  }

  if (result.liveUrl) {
    return (
      <div style={{ background:C.okBg, borderRadius:8, padding:"8px 12px", marginTop:8 }}>
        <div style={{ fontSize:12, color:C.ok, fontFamily:FB, marginBottom:4 }}>✓ Website deployed</div>
        <a href={result.liveUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:C.primary }}>{result.liveUrl} ↗</a>
      </div>
    );
  }

  if (result.caption) {
    return (
      <div style={{ marginTop:8, background:"#F9FAFB", borderRadius:8, padding:"10px 12px" }}>
        <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6, fontFamily:FB }}>Generated content</p>
        {displayImageUrl && <img src={displayImageUrl} alt="Generated" style={{ width:"100%", borderRadius:6, marginBottom:8, maxHeight:180, objectFit:"cover" }} />}
        <p style={{ fontSize:13, color:C.text, fontFamily:FB, lineHeight:1.6, marginBottom:8 }}>{result.body || result.caption}</p>
        {result.hashtags && <p style={{ fontSize:11, color:C.muted, fontFamily:FB, marginBottom:10 }}>{result.hashtags}</p>}
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={()=>copy(result.caption)} style={{ ...btnO(C.primary,11), flex:1, padding:"5px 10px" }}>{copied?"Copied!":"Copy caption"}</button>
          {result.caption && <button onClick={publishNow} disabled={publishing} style={{ ...btn(C.primary,"#fff",11), flex:1, padding:"5px 10px" }}>{publishing?"Publishing…":"Publish now"}</button>}
        </div>
      </div>
    );
  }

  if (result.actionPlan) {
    return (
      <div style={{ marginTop:8, background:"#F9FAFB", borderRadius:8, padding:"10px 12px" }}>
        <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6, fontFamily:FB }}>Action plan</p>
        <p style={{ fontSize:13, color:C.text, fontFamily:FB, lineHeight:1.6 }}>{result.actionPlan}</p>
        <button onClick={()=>copy(result.actionPlan)} style={{ ...btnO(C.primary,10), padding:"3px 8px", marginTop:8 }}>{copied?"Copied!":"Copy plan"}</button>
      </div>
    );
  }

  return null;
}

// ── Brand Identity Q&A (manual mode prompts) ─────────────────────────────────

const BRAND_QA = [
  { key:"voice",          q:"What is your brand voice?",              ph:"e.g. educational, direct, no-fluff" },
  { key:"targetAudience", q:"Who is your target customer?",           ph:"e.g. freelancers aged 25-35 who struggle with pricing" },
  { key:"contentPillars", q:"What topics do you post about?",         ph:"e.g. tips, client wins, behind the scenes", isArray:true },
  { key:"uniqueAngle",    q:"What makes your content different?",     ph:"e.g. we show real revenue numbers, not vague results" },
];

function BrandQAPanel({ businessId }) {
  const [identity, setIdentity] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    api.agents.getBrandIdentity(businessId)
      .then(d => setIdentity(d.identity))
      .catch(() => setIdentity({})); // fallback so panel renders even if fetch fails
  }, [businessId]);

  const update = (key, val) => setIdentity(p => ({ ...p, [key]: val }));

  const save = async () => {
    if (!identity) return;
    setSaving(true);
    try {
      const { identity: saved } = await api.agents.saveBrandIdentity(businessId, identity);
      setIdentity(saved); setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  if (!identity) return null;

  return (
    <div style={{ ...card("12px 14px"), marginBottom:12, border:`1px solid ${C.border}` }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10, fontFamily:FB }}>Brand prompts</div>
      {BRAND_QA.map(({ key, q, ph, isArray }) => (
        <div key={key} style={{ marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:600, color:C.text, fontFamily:FB, marginBottom:3 }}>{q}</div>
          <input
            style={{ width:"100%", padding:"6px 10px", fontSize:12, fontFamily:FB, borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, color:C.text, boxSizing:"border-box", outline:"none" }}
            value={isArray ? (Array.isArray(identity[key]) ? identity[key].join(", ") : identity[key] || "") : (identity[key] || "")}
            onChange={e => update(key, isArray ? e.target.value.split(",").map(s => s.trim()).filter(Boolean) : e.target.value)}
            placeholder={ph}
            onBlur={save}
          />
        </div>
      ))}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button onClick={save} disabled={saving} style={{ ...btnO(C.primary,11), padding:"3px 10px" }}>
          {saved ? "Saved ✓" : saving ? "Saving…" : "Save answers"}
        </button>
      </div>
    </div>
  );
}

// ── Upgrade prompt ────────────────────────────────────────────────────────────

function UpgradeCard({ reason, navigate }) {
  return (
    <div style={{ ...card("12px 14px"), background:"#FFFBEB", border:`1px solid ${C.warn}25`, marginBottom:12 }}>
      <p style={{ fontSize:13, color:C.warn, fontFamily:FB, marginBottom:8 }}>{reason}</p>
      <button onClick={()=>navigate("/pricing")} style={{ ...btn(C.warn,"#fff",12), padding:"6px 14px" }}>Upgrade plan</button>
    </div>
  );
}

// ── MAIN AGENT PANEL ──────────────────────────────────────────────────────────

export default function AgentPanel({ businessId, businessName, metrics, planInfo, integs, setTab }) {
  const navigate = useNavigate();

  // Mode
  const [agentMode, setAgentMode] = useState(() => {
    try { return localStorage.getItem(`earnedlab_agentmode_${businessId}`) || "guided"; } catch { return "guided"; }
  });
  const saveAgentMode = (m) => {
    setAgentMode(m);
    try { localStorage.setItem(`earnedlab_agentmode_${businessId}`, m); } catch {}
  };

  // Analysis state
  const [running,      setRunning]      = useState(false);
  const [report,       setReport]       = useState(null);
  const [overview,     setOverview]     = useState(null);
  const [insights,     setInsights]     = useState([]);
  const [ranAt,        setRanAt]        = useState(null);
  const [error,        setError]        = useState("");

  // Implement state
  const [implementing, setImplementing] = useState(null);
  const [implemented,  setImplemented]  = useState({});

  // Access
  const [access, setAccess] = useState(null);
  const refreshAccess = () => api.agents.access(businessId).then(setAccess).catch(()=>{});

  // Campaigns
  const [campaigns, setCampaigns] = useState(()=>{
    try { return JSON.parse(localStorage.getItem(`earnedlab_campaigns_${businessId}`)||"[]"); } catch { return []; }
  });
  const saveCampaigns = (next) => {
    const val = typeof next === "function" ? next(campaigns) : next;
    setCampaigns(val);
    try { localStorage.setItem(`earnedlab_campaigns_${businessId}`, JSON.stringify(val)); } catch {}
  };

  // Activity
  const [activity, setActivity] = useState([]);
  const [logOpen,  setLogOpen]  = useState(false);

  // 12h autopilot scheduler
  const autoTimerRef = useRef(null);

  useEffect(()=>{
    refreshAccess();
    api.agents.activity(businessId).then(d=>setActivity(d.activity||[])).catch(()=>{});
    api.agents.savedInsights(businessId).then(d=>{
      if (d.insights?.length || d.overview || d.report) {
        setInsights(d.insights||[]);
        setReport(d.report||null);
        setOverview(d.overview||null);
        setRanAt(d.ranAt||null);
        // Restore mode from saved report
        if (d.mode && !localStorage.getItem(`earnedlab_agentmode_${businessId}`)) saveAgentMode(d.mode);
      }
    }).catch(()=>{});
    api.agents.getAutopilot(businessId).then(d=>{ if(d.autopilotEnabled) saveAgentMode("auto"); }).catch(()=>{});
  },[businessId]);

  // Auto-run analysis every 12h in auto mode
  useEffect(()=>{
    if (agentMode!=="auto") { clearInterval(autoTimerRef.current); return; }
    const shouldRun = !ranAt || (Date.now()-new Date(ranAt).getTime())>12*3600*1000;
    if (shouldRun && !running) runAnalysis();
    autoTimerRef.current = setInterval(()=>{
      if (!running) runAnalysis();
    }, 12*3600*1000);
    return ()=>clearInterval(autoTimerRef.current);
  },[agentMode]);

  const runAnalysis = async () => {
    console.log(`[AGENT:runAnalysis] Starting — businessId=${businessId} agentMode=${agentMode}`);
    setRunning(true); setError("");
    try {
      const data = await api.agents.runMarketing(businessId, agentMode);
      console.log(`[AGENT:runAnalysis] Complete — insightCount=${data.insights?.length || 0} hasReport=${!!data.report} hasOverview=${!!data.overview} mode=${data.mode}`);
      setInsights(data.insights||[]);
      setReport(data.report||null);
      setOverview(data.overview||null);
      setRanAt(data.ranAt||new Date().toISOString());
      api.agents.activity(businessId).then(d=>setActivity(d.activity||[])).catch(()=>{});
      refreshAccess();

      // In auto mode: auto-add high-priority suggestions as campaigns
      if (agentMode==="auto" && data.insights?.length) {
        const highPri = data.insights.filter(i=>i.priority==="high");
        if (highPri.length) {
          const existingTitles = campaigns.map(c=>c.title);
          const newCampaigns = highPri
            .filter(i=>!existingTitles.includes(i.title||i.recommendation))
            .map(i=>({
              id: Date.now().toString()+Math.random(),
              title: i.title||i.recommendation,
              rationale: i.rationale||i.agentObservation,
              channel: i.channel||i.implementationChannel,
              expectedImpact: i.expectedImpact,
              contentPreview: i.contentPreview,
              estimatedMinutes: i.estimatedMinutes,
              status:"planned", mode:"auto",
              createdAt:new Date().toISOString(),
            }));
          if (newCampaigns.length) saveCampaigns(p=>[...newCampaigns,...p]);
        }
      }
    } catch(e) {
      console.error(`[AGENT:runAnalysis] FAILED — error="${e.message}"`);
      setError(e.message);
    }
    setRunning(false);
  };

  const implement = async (insight) => {
    console.log(`[AGENT:implement] Starting — insightId=${insight.id} channel=${insight.implementationChannel||insight.type} title="${(insight.title||insight.recommendation||"").slice(0,60)}" agentMode=${agentMode}`);
    setImplementing(insight.id); setError("");
    try {
      const result = await api.agents.implement(businessId, insight, agentMode);
      console.log(`[AGENT:implement] Complete — channel=${result.channel} published=${result.published} imageSource=${result.imageSource} hasImageUrl=${!!result.imageUrl} imageUrl=${result.imageUrl || "none"} captionLen=${result.caption?.length || 0}`);
      setImplemented(p=>({...p,[insight.id]:result}));
      api.agents.activity(businessId).then(d=>setActivity(d.activity||[])).catch(()=>{});
      refreshAccess();
    } catch(e) {
      console.error(`[AGENT:implement] FAILED — insightId=${insight.id} error="${e.message}"`);
      setError(e.message);
    }
    setImplementing(null);
  };

  const addToCampaigns = (suggestion) => {
    const c = {
      id: Date.now().toString(),
      title: suggestion.title||suggestion.recommendation,
      rationale: suggestion.rationale||suggestion.agentObservation,
      channel: suggestion.channel||suggestion.implementationChannel,
      expectedImpact: suggestion.expectedImpact,
      contentPreview: suggestion.contentPreview,
      estimatedMinutes: suggestion.estimatedMinutes,
      status: "planned",
      mode: agentMode==="auto"?"auto":agentMode==="manual"?"manual":"guided",
      createdAt: new Date().toISOString(),
    };
    saveCampaigns(p=>[c,...p]);
  };

  const updateCampaign = (updated) => {
    saveCampaigns(p => p.map(c => c.id===updated.id ? updated : c));
  };
  const deleteCampaign = (id) => saveCampaigns(p=>p.filter(c=>c.id!==id));

  // Campaign buckets
  const plannedCampaigns    = campaigns.filter(c=>c.status==="planned");
  const activeCampaigns     = campaigns.filter(c=>c.status==="active");
  const monitoringCampaigns = campaigns.filter(c=>c.status==="monitoring");
  const archivedCampaigns   = campaigns.filter(c=>c.status==="archived");
  const [showArchived, setShowArchived] = useState(false);

  const nextRunIn = ranAt ? Math.max(0, Math.round((12*3600*1000-(Date.now()-new Date(ranAt).getTime()))/3600000)) : null;

  const connectedChannels = (integs||[]).filter(i=>{
    try { const m=JSON.parse(i.metadata||"{}"); return Object.values(m).some(v=>typeof v==="string"&&v.length>3); } catch { return false; }
  }).map(i=>i.provider);

  return (
    <div>
      {/* Mode toggle */}
      <ModeToggle mode={agentMode} onChange={saveAgentMode} />

      {/* Error */}
      {error && (
        <div style={{ ...card("10px 14px"), background:C.errBg, border:`1px solid #DC262625`, marginBottom:14, fontSize:13, color:C.err, fontFamily:FB }}>
          {error}
        </div>
      )}

      {/* Main layout */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"start" }}>

        {/* ── LEFT — Analysis ─────────────────────────────────────────────── */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:16 }}>
              {agentMode==="manual" ? "Marketing Overview" : "Marketing Analysis"}
            </span>
            <StickyNotesPanel businessId={businessId} />
          </div>

          {/* Trial/access */}
          {access?.effective?.isTrial && !access.effective.locked && (
            <div style={{ fontSize:11, color:C.muted, marginBottom:10, fontFamily:FB, display:"flex", alignItems:"center", gap:10 }}>
              <span>Trial: {Math.max(0,3-(access.usage?.marketingRuns||0))} analyses left</span>
              {planInfo?.isAdmin && (
                <button onClick={async()=>{ await api.agents.resetUsage(businessId).catch(()=>{}); refreshAccess(); }} style={{ ...btnO("#9333EA",10), padding:"2px 8px" }}>Reset (admin)</button>
              )}
            </div>
          )}
          {access && !access.marketing.allowed && <UpgradeCard reason={access.marketing.reason} navigate={navigate} />}

          {/* Connected channels */}
          {connectedChannels.length>0 && (
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
              {connectedChannels.map(ch=>(
                <span key={ch} style={{ fontSize:10, fontWeight:600, fontFamily:FB, padding:"3px 9px", borderRadius:20, background:C.primaryBg, color:C.primary }}>{CH_LABELS[ch]||ch} ✓</span>
              ))}
            </div>
          )}

          {/* ── MANUAL MODE ── */}
          {agentMode==="manual" && (
            <>
              {/* Brand prompts replace AI analysis in manual mode */}
              <BrandQAPanel businessId={businessId} />
              {overview ? (
                <div>
                  <div style={{ ...card("12px 14px"), background:C.primaryBg, border:`1px solid ${C.primary}20`, marginBottom:12 }}>
                    <p style={{ fontSize:14, fontWeight:600, fontFamily:FH, marginBottom:4 }}>{overview.headline}</p>
                    <p style={{ fontSize:13, color:C.muted, fontFamily:FB, lineHeight:1.6 }}>{overview.summary}</p>
                  </div>
                  {overview.channelNotes?.map((n,i)=>(
                    <div key={i} style={{ ...card("10px 12px"), marginBottom:6, border:`1px solid ${C.border}` }}>
                      <span style={{ fontSize:11, fontWeight:700, color:C.primary, fontFamily:FB }}>{CH_LABELS[n.channel]||n.channel}: </span>
                      <span style={{ fontSize:12, color:C.text, fontFamily:FB }}>{n.note}</span>
                    </div>
                  ))}
                  {overview.generalTips?.length>0 && (
                    <div style={{ ...card("12px 14px"), marginBottom:8, marginTop:8 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8, fontFamily:FB }}>General tips</p>
                      {overview.generalTips.map((t,i)=>(
                        <div key={i} style={{ fontSize:12, color:C.text, fontFamily:FB, marginBottom:5, display:"flex", gap:6, lineHeight:1.5 }}>
                          <span style={{ color:C.warn }}>→</span>{t}
                        </div>
                      ))}
                    </div>
                  )}
                  {overview.missingChannels?.length>0 && (
                    <div style={{ ...card("10px 12px"), background:"#FFFBEB", border:`1px solid ${C.warn}20`, marginBottom:8 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:C.warn, fontFamily:FB, marginBottom:4 }}>Missing channels:</p>
                      <p style={{ fontSize:12, color:C.muted, fontFamily:FB }}>{overview.missingChannels.join(", ")}</p>
                    </div>
                  )}
                  <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginTop:4, padding:"8px 0", borderTop:`1px solid ${C.border}` }}>
                    Full AI analysis available in <strong>Guided</strong> or <strong>Autopilot</strong> mode.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ ...card("14px"), textAlign:"center", border:"1px dashed "+C.border, marginBottom:12 }}>
                    <div style={{ fontSize:13, color:C.muted, fontFamily:FB, lineHeight:1.6 }}>
                      Generate a basic overview of your current marketing performance from your inputted stats.
                    </div>
                  </div>
                  <button onClick={runAnalysis} disabled={running||(access&&!access.marketing.allowed)}
                    style={{ ...btn(running?"#9CA3AF":(access&&!access.marketing.allowed)?"#D1D5DB":C.dark), width:"100%", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                    {running&&<span style={spin()}/>}
                    {running?"Generating overview…":"Generate basic overview"}
                  </button>
                </>
              )}
              {overview && (
                <button onClick={runAnalysis} disabled={running}
                  style={{ ...btnO(C.muted,11), width:"100%", marginBottom:10 }}>
                  {running?"Refreshing…":"Refresh overview"}
                </button>
              )}
            </>
          )}

          {/* ── GUIDED/AUTO MODE ── */}
          {agentMode!=="manual" && (
            <>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
                <button onClick={runAnalysis} disabled={running||(access&&!access.marketing.allowed)}
                  style={{ ...btn(running?"#9CA3AF":(access&&!access.marketing.allowed)?"#D1D5DB":C.grad), flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {running&&<span style={spin()}/>}
                  {running?"Analyzing…":(access&&!access.marketing.allowed)?"Upgrade to analyze":insights.length?"Re-run analysis":"Run marketing analysis"}
                </button>
                {agentMode==="auto" && nextRunIn!==null && !running && (
                  <div style={{ fontSize:11, color:C.muted, fontFamily:FB, flexShrink:0, textAlign:"right" }}>
                    Auto-runs in {nextRunIn}h
                  </div>
                )}
              </div>

              {ranAt && !running && (
                <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginBottom:12, textAlign:"center" }}>
                  Last run {new Date(ranAt).toLocaleDateString(undefined,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                  {agentMode==="guided" && <span style={{ color:C.warn, marginLeft:8 }}>• Notification in ~{Math.max(0,12-Math.floor((Date.now()-new Date(ranAt).getTime())/3600000))}h</span>}
                </div>
              )}

              {running && (
                <div style={{ ...card("12px"), marginBottom:12, background:C.primaryBg, border:`1px solid ${C.primary}15` }}>
                  {["Collecting channel data","Running market analysis","Generating campaign suggestions","Preparing content previews"].map((s,i)=>(
                    <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"4px 0", opacity:0.55+i*0.12 }}>
                      <div style={{ width:4, height:4, borderRadius:"50%", background:C.primary, flexShrink:0 }} />
                      <span style={{ fontSize:12, color:C.primary, fontFamily:FB }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Channel stats */}
              {report?.channelStats?.length>0 && (
                <div style={{ marginBottom:12 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6, fontFamily:FB }}>Channel health</p>
                  {report.channelStats.map((s,i)=><ChannelStatCard key={i} stat={s} />)}
                </div>
              )}

              {/* Market analysis */}
              {report?.marketAnalysis && <MarketAnalysisSection analysis={report.marketAnalysis} />}

              {/* Suggestions */}
              {insights.length===0 && !running && (
                <div style={{ ...card("16px"), textAlign:"center", border:"1px dashed "+C.border }}>
                  <div style={{ fontSize:13, color:C.muted, fontFamily:FB, lineHeight:1.6 }}>
                    No analysis yet. Run one above to get specific, data-backed recommendations.
                  </div>
                </div>
              )}

              {insights.length>0 && (
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8, fontFamily:FB }}>
                    {agentMode==="auto" ? "Auto-queued campaigns" : "Suggested campaigns"}
                  </p>
                  {insights.map((s,i)=>(
                    <div key={i}>
                      <SuggestionCard suggestion={s} mode={agentMode}
                        onAddToCampaign={addToCampaigns} onImplement={implement}
                        implementing={implementing} implemented={implemented}
                        access={access} navigate={navigate} />
                      <ImplementResult result={implemented[s.id]} businessId={businessId} businessName={businessName} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── RIGHT — Campaign Manager ──────────────────────────────────── */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <span style={{ fontFamily:FH, fontWeight:700, fontSize:16 }}>Campaign Manager</span>
            {campaigns.length>0 && (
              <span style={{ fontSize:11, color:C.muted, fontFamily:FB }}>
                {activeCampaigns.length} active · {monitoringCampaigns.length} monitoring
              </span>
            )}
          </div>

          {/* Planned */}
          {plannedCampaigns.length>0 && (
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6, fontFamily:FB }}>
                {agentMode==="auto"?"Auto-queued":"Planned"} ({plannedCampaigns.length})
              </p>
              {plannedCampaigns.map(c=>(
                <CampaignCard key={c.id} campaign={c} onUpdate={updateCampaign} onDelete={deleteCampaign} businessId={businessId} businessName={businessName} setTab={setTab} />
              ))}
            </div>
          )}

          {/* Active */}
          {activeCampaigns.length>0 && (
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:11, fontWeight:700, color:C.warn, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6, fontFamily:FB }}>
                Active ({activeCampaigns.length})
              </p>
              {activeCampaigns.map(c=>(
                <CampaignCard key={c.id} campaign={c} onUpdate={updateCampaign} onDelete={deleteCampaign} businessId={businessId} businessName={businessName} setTab={setTab} />
              ))}
            </div>
          )}

          {/* Run Campaigns (monitoring) */}
          {monitoringCampaigns.length>0 && (
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"#8B5CF6", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6, fontFamily:FB }}>
                Run Campaigns — tracking to goal ({monitoringCampaigns.length})
              </p>
              {monitoringCampaigns.map(c=>(
                <CampaignCard key={c.id} campaign={c} onUpdate={updateCampaign} onDelete={deleteCampaign} businessId={businessId} businessName={businessName} setTab={setTab} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {campaigns.length===0 && (
            <div style={{ ...card("16px"), textAlign:"center", border:"1px dashed "+C.border, marginBottom:14 }}>
              <div style={{ fontSize:12, color:C.muted, fontFamily:FB, lineHeight:1.6 }}>
                {agentMode==="auto"
                  ? "When analysis runs, high-priority campaigns will appear here automatically."
                  : agentMode==="guided"
                  ? "Run an analysis, then hit \"Add to campaigns\" on any suggestion. Or add a campaign manually below."
                  : "Create a campaign manually below to start tracking your marketing work."}
              </div>
            </div>
          )}

          <AddCampaignForm mode={agentMode} onAdd={c=>saveCampaigns(p=>[c,...p])} />

          {/* Archived campaigns */}
          {archivedCampaigns.length>0 && (
            <div style={{ marginTop:8 }}>
              <button onClick={()=>setShowArchived(o=>!o)}
                style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:12, fontFamily:FB, padding:"4px 0", marginBottom:showArchived?8:0 }}>
                {showArchived?"▲":"▼"} Archived Campaigns ({archivedCampaigns.length})
              </button>
              {showArchived && archivedCampaigns.map(c=>(
                <CampaignCard key={c.id} campaign={c} onUpdate={updateCampaign} onDelete={deleteCampaign} businessId={businessId} businessName={businessName} setTab={setTab} />
              ))}
            </div>
          )}

          {/* Agent log */}
          {activity.length>0 && (
            <div style={{ marginTop:14 }}>
              <button onClick={()=>setLogOpen(o=>!o)}
                style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:11, fontFamily:FB, padding:"4px 0", marginBottom:logOpen?6:0 }}>
                {logOpen?"▲":"▼"} Agent log ({activity.length} entries)
              </button>
              {logOpen && (
                <div style={{ ...card("12px 14px"), background:C.dark }}>
                  {activity.slice(0,8).map((e,i)=>(
                    <div key={i} style={{ display:"flex", gap:8, padding:"4px 0", borderBottom:i<7?"1px solid rgba(255,255,255,0.05)":"none" }}>
                      <div style={{ width:5,height:5,borderRadius:"50%",background:e.agent==="marketing"?C.primary:"#4ADE80",flexShrink:0,marginTop:5 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11,color:"rgba(255,255,255,0.8)",fontFamily:FB,fontWeight:500 }}>{e.action}</div>
                        <div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:FB }}>{e.detail}</div>
                      </div>
                      <div style={{ fontSize:9,color:"rgba(255,255,255,0.2)",fontFamily:FB,flexShrink:0 }}>{new Date(e.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
