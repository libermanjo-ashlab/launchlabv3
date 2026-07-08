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

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { C, FH, FB, btn, btnO, card, inp, lbl } from "../components";
import { generatePostImageBlob } from "../lib/postImageCanvas";
import { generateSlideshowBlob } from "../lib/slideshowVideo";

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

const PLAN_TIERS_MA = [
  { id:"starter", name:"Starter", price:39, color:"#6366F1", tagline:"Insights, reports, and manual tracking.", features:["Unlimited marketing insights","Revenue & lead tracking","Business planning tools","Email support"] },
  { id:"pro", name:"Pro", price:89, color:"#7C3AED", popular:true, tagline:"Agents act on your request.", features:["Everything in Starter","Management agent implements changes","Live website updates on demand","Marketing + Management agents work together","Priority support"] },
  { id:"pro_autopilot", name:"Pro Autopilot", price:199, color:"#DB2777", tagline:"Fully autonomous — just watch it run.", features:["Everything in Pro","Agents run on their own schedule","Zero manual input required","White-glove onboarding","Dedicated support"] },
];

function PlansModalMA({ onClose, highlightPlan }) {
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
          {PLAN_TIERS_MA.map(t=>(
            <div key={t.id} style={{ background:"rgba(255,255,255,0.04)", border:`1.5px solid ${(highlightPlan===t.id||t.popular)?t.color+"60":"rgba(255,255,255,0.1)"}`, borderRadius:16, padding:"24px 20px", position:"relative" }}>
              {t.popular && <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:t.color, color:"#fff", fontSize:9, fontWeight:700, padding:"3px 12px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>Most popular</div>}
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
              <button onClick={()=>{ onClose(); navigate("/pricing"); }} style={{ background:t.popular?t.color:"transparent", color:"#fff", border:t.popular?"none":"1px solid rgba(255,255,255,0.15)", borderRadius:10, width:"100%", padding:"10px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FB }}>
                Get started
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange, allowedModes }) {
  const [showPlans, setShowPlans] = useState(false);
  const [highlightPlan, setHighlightPlan] = useState("pro");
  const opts = [
    { value:"manual",  label:"Manual",    desc:"Track your own work with general tips" },
    { value:"guided",  label:"Guided",    desc:"Data-driven content, you implement manually", minPlan:"pro" },
    { value:"auto",    label:"Autopilot", desc:"Fully agentic — runs every 12h, executes campaigns", minPlan:"pro_autopilot" },
  ];
  const allowed = allowedModes || ["manual","guided","auto"];
  return (
    <>
      <div>
        <div style={{ display:"flex", background:"#F1F0EF", borderRadius:12, padding:3, gap:2, marginBottom:4 }}>
          {opts.map(o=>{
            const locked = !allowed.includes(o.value);
            return (
              <button key={o.value}
                onClick={()=>{
                  if (locked) { setHighlightPlan(o.minPlan||"pro"); setShowPlans(true); }
                  else onChange(o.value);
                }}
                style={{ flex:1, padding:"8px 10px", borderRadius:9, border:"none", cursor:"pointer",
                  fontFamily:FB, fontWeight:600, fontSize:12, transition:"all 0.15s",
                  background: mode===o.value ? (o.value==="auto"?C.primary:o.value==="guided"?"#1D4ED8":"#374151") : "transparent",
                  color: locked ? "#9CA3AF" : mode===o.value ? "#fff" : C.muted,
                  boxShadow: mode===o.value ? "0 1px 5px rgba(0,0,0,0.18)" : "none",
                  position:"relative" }}>
                {o.label}
                {locked && <span style={{ position:"absolute", top:-6, right:-4, fontSize:8, background:"#2563EB", color:"#fff", borderRadius:8, padding:"1px 4px", fontWeight:700 }}>PRO</span>}
              </button>
            );
          })}
        </div>
      </div>
      {showPlans && <PlansModalMA highlightPlan={highlightPlan} onClose={()=>setShowPlans(false)} />}
    </>
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

function MarketSubSection({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:8, marginBottom:6, overflow:"hidden" }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", cursor:"pointer", background:"#FAFAFA" }}>
        <span style={{ fontFamily:FB, fontWeight:600, fontSize:12 }}>{title}</span>
        <span style={{ fontSize:10, color:C.muted }}>{open?"▲":"▼"}</span>
      </div>
      {open && <div style={{ padding:"10px 12px", borderTop:`1px solid ${C.border}` }}>{children}</div>}
    </div>
  );
}

function MarketAnalysisSection({ analysis }) {
  if (!analysis) return null;
  return (
    <div style={{ ...card("12px 14px"), border:`1px solid ${C.border}`, marginBottom:10 }}>
      <div style={{ fontFamily:FB, fontWeight:600, fontSize:13, marginBottom:10 }}>Market Analysis</div>
      <MarketSubSection title="Overview">
        <p style={{ fontSize:12, color:C.text, fontFamily:FB, lineHeight:1.6, margin:0 }}>{analysis.summary}</p>
      </MarketSubSection>
      <MarketSubSection title="Competitor Activity">
        <p style={{ fontSize:12, color:C.text, fontFamily:FB, lineHeight:1.5, margin:0 }}>{analysis.competitorBehavior}</p>
      </MarketSubSection>
      {analysis.opportunities?.length > 0 && (
        <MarketSubSection title="Opportunities">
          {analysis.opportunities.map((o,i)=>(
            <div key={i} style={{ fontSize:12, color:C.text, fontFamily:FB, marginBottom:4, display:"flex", gap:6 }}>
              <span style={{ color:C.primary, flexShrink:0 }}>→</span>{o}
            </div>
          ))}
        </MarketSubSection>
      )}
    </div>
  );
}

// ── Guidance block (for non-automatable tasks: engagement, follow/DM, video) ──

function GuidanceBlock({ content }) {
  const isVideo = content.type === "video";
  return (
    <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"12px 14px", marginTop:8 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#92400E", fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>
        {isVideo ? "📹 Video task — do manually" : "📋 Action guide — do manually"}
      </div>
      {content.guidanceWhy && (
        <p style={{ fontSize:12, color:"#78350F", fontFamily:FB, marginBottom:8, fontStyle:"italic", lineHeight:1.5 }}>
          {content.guidanceWhy}
        </p>
      )}
      <ol style={{ margin:0, paddingLeft:18 }}>
        {(content.guidanceSteps || []).map((step, i) => (
          <li key={i} style={{ fontSize:12, color:"#374151", fontFamily:FB, marginBottom:5, lineHeight:1.55 }}>{step}</li>
        ))}
      </ol>
      {content.guidanceTips?.length > 0 && (
        <div style={{ marginTop:10, paddingTop:8, borderTop:"1px solid #FDE68A20" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#92400E", fontFamily:FB, marginBottom:5 }}>Pro tips</div>
          {content.guidanceTips.map((tip, i) => (
            <div key={i} style={{ fontSize:11, color:"#78350F", fontFamily:FB, marginBottom:3, display:"flex", gap:6 }}>
              <span>💡</span><span>{tip}</span>
            </div>
          ))}
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

  // OpenAI Instagram caption output: { caption, body, hashtags, imageUrl, dalleError }
  if (content.caption || content.body) {
    return (
      <div style={{ background:"#F0FDF4", border:`1px solid ${C.ok}20`, borderRadius:8, padding:"10px 12px", marginTop:8 }}>
        <p style={{ fontSize:11, fontWeight:700, color:C.ok, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6, fontFamily:FB }}>
          {mode==="auto"?"Auto-generated post":"Generated post — copy and use"}
        </p>
        {content.dalleError && (
          <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:6, padding:"6px 10px", marginBottom:8, fontSize:11, color:C.err, fontFamily:FB }}>
            <strong>Image error:</strong> {content.dalleError}
          </div>
        )}
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

// ── Video slideshow block for task cards ─────────────────────────────────────

function VideoSlideTaskBlock({ content, businessName, backgroundUrl }) {
  const [videoBlob,    setVideoBlob]    = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [error,        setError]        = useState("");

  const videoUrl = useMemo(() => videoBlob ? URL.createObjectURL(videoBlob) : null, [videoBlob]);
  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

  const create = async () => {
    setVideoLoading(true); setError("");
    try {
      const bgUrl = content.imageSource?.startsWith("gpt-image") ? (backgroundUrl || content.imageUrl) : null;
      const blob  = await generateSlideshowBlob(content.slides, bgUrl, businessName || "Business");
      setVideoBlob(blob);
    } catch(e) {
      setError(e.message);
    }
    setVideoLoading(false);
  };

  const download = () => {
    if (!videoBlob) return;
    const url = URL.createObjectURL(videoBlob);
    const a   = document.createElement("a");
    a.href    = url;
    a.download = `${(businessName || "post").replace(/\s+/g, "-").toLowerCase()}-reel.webm`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyCaption = async () => {
    const parts = [content.body || content.caption, content.hashtags].filter(Boolean);
    try { await navigator.clipboard.writeText(parts.join("\n\n")); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background:"#EFF6FF", border:`1px solid ${C.primary}30`, borderRadius:8, padding:"10px 12px", marginTop:8 }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.primary, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8, fontFamily:FB }}>
        Video Reel — {content.slides?.length || 0} slides
      </div>
      {/* Slide preview */}
      <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:10 }}>
        {(content.slides || []).map((sl, i) => (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", fontSize:11, fontFamily:FB }}>
            <span style={{ color:C.primary, fontWeight:700, minWidth:16 }}>{i+1}</span>
            <div>
              <span style={{ fontWeight:600, color:C.text }}>{sl.headline}</span>
              {sl.subtext && <span style={{ color:C.muted }}> — {sl.subtext}</span>}
            </div>
          </div>
        ))}
      </div>
      {/* Caption */}
      {(content.body || content.caption) && (
        <div style={{ background:"rgba(255,255,255,0.7)", borderRadius:6, padding:"6px 8px", marginBottom:10 }}>
          <p style={{ fontSize:12, color:"#374151", fontFamily:FB, lineHeight:1.6, marginBottom: content.hashtags ? 4 : 0 }}>
            {content.body || content.caption}
          </p>
          {content.hashtags && <p style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{content.hashtags}</p>}
        </div>
      )}
      {error && <div style={{ fontSize:11, color:C.err, fontFamily:FB, marginBottom:6 }}>{error}</div>}
      <div style={{ display:"flex", gap:6 }}>
        {videoUrl ? (
          <button onClick={download} style={{ ...btn(C.ok,"#fff",11), padding:"4px 12px" }}>
            ↓ Download Video
          </button>
        ) : (
          <button onClick={create} disabled={videoLoading}
            style={{ ...btn(videoLoading ? "#9CA3AF" : C.primary,"#fff",11), padding:"4px 12px",
              display:"inline-flex", alignItems:"center", gap:5 }}>
            {videoLoading && <span style={{ ...spin(), width:10, height:10, borderWidth:1.5 }} />}
            {videoLoading ? "Rendering…" : "Create Video"}
          </button>
        )}
        <button onClick={copyCaption} style={{ ...btnO(C.ok,11), padding:"4px 10px" }}>
          {copied ? "✓ Copied" : "Copy caption"}
        </button>
      </div>
      {videoBlob && (
        <video src={videoUrl} controls style={{ width:"100%", borderRadius:6, marginTop:8, maxHeight:220 }} />
      )}
    </div>
  );
}

// ── Suggestion Card (analysis insights) ──────────────────────────────────────

function SuggestionCard({ suggestion:s, mode, onAddToCampaign }) {
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

      <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
        {mode === "guided" && (
          <button onClick={()=>onAddToCampaign(s)} style={{ ...btnO(C.primary,11), flex:1, textAlign:"center", padding:"5px 10px" }}>
            + Add to campaigns
          </button>
        )}
        {mode === "auto" && (
          <>
            <span style={{ fontSize:10, color:C.ok, fontFamily:FB, background:C.okBg, padding:"3px 8px", borderRadius:20 }}>
              ✓ Auto-queued
            </span>
            <button onClick={()=>onAddToCampaign({...s, autoStart:true})}
              style={{ ...btnO(C.primary,11), padding:"5px 10px" }}>
              ▶ Run now
            </button>
          </>
        )}
        {mode === "manual" && (
          <span style={{ fontSize:11, color:C.muted, fontFamily:FB, fontStyle:"italic" }}>
            → Create a campaign below to act on this
          </span>
        )}
      </div>
    </div>
  );
}

// ── Campaign task row ─────────────────────────────────────────────────────────

function CampaignTaskRow({ task:t, mode, channel, businessId, businessName, onComplete, onSkip, onRemove, autoRun, isAutoRunning }) {
  const [running,       setRunning]       = useState(false);
  const [content,       setContent]       = useState(null);
  const [showContent,   setShowContent]   = useState(false);
  const [error,         setError]         = useState("");
  const [posting,       setPosting]       = useState(false);
  const [postMsg,       setPostMsg]       = useState("");
  const [extraChannels, setExtraChannels] = useState({});  // { channelKey: contentObj }
  const [loadingCh,     setLoadingCh]     = useState(null); // which extra channel is loading
  const [showExtra,     setShowExtra]     = useState(false);

  const isDone     = t.status === "completed" || t.status === "done";
  const isFailed   = t.status === "failed";
  const isSkipped  = t.status === "skipped";
  const isVideoTask = t.steps?.[0]?.isVideoTask || /\bfilm\b|\brecord\b|\bshoot\b/i.test(t.name);
  const isEngagementTask = t.steps?.[0]?.isEngagementTask || /\bengage\s+with\b|\bfollow\s+(\d+|targeted|accounts)\b|\bcomment\s+on\b|\blike\s+\d+\b/i.test(t.name);
  const isManualTask = isVideoTask || isEngagementTask;
  // Extract error detail from task outputData (set by server when IG post fails)
  const taskErrMsg = t.outputData?.fields?.find(f => f.label === "Error")?.value || "";

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
      if (c?.dalleError) console.error(`[TASK:getContent] DALL-E error: ${c.dalleError}`);

      // For visual channel tasks with an image (but not video/slideshow), composite canvas text
      const taskChannel = channel || c?.channel || "general";
      if (!c?.isGuided && !c?.isVideo && c?.imageUrl && VISUAL_CHANNEL_SET.has(taskChannel)) {
        console.log(`[TASK:getContent] Canvas composite — channel=${taskChannel} imageSource=${c?.imageSource}`);
        try {
          let bgUrl = null;
          if (c?.imageSource?.startsWith("gpt-image")) {
            const imgResp = await fetch(c.imageUrl);
            const imgBlob = await imgResp.blob();
            bgUrl = URL.createObjectURL(imgBlob);
          }
          const blob = await generatePostImageBlob(businessName || "Business", c.body || c.caption, bgUrl);
          if (bgUrl) URL.revokeObjectURL(bgUrl);
          c = { ...c, imageUrl: URL.createObjectURL(blob), imageSource: "canvas" };
        } catch(imgErr) {
          console.error(`[TASK:getContent] Canvas failed — ${imgErr.message}. Keeping server image.`);
        }
      }
      setContent(c);
      setShowContent(true);
      setExtraChannels({});
    } catch(e) {
      console.error(`[TASK:getContent] FAILED — taskName="${t.name}" error="${e.message}"`);
      setError(e.message);
    }
    setRunning(false);
  };

  return (
    <div style={{ padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${isFailed?C.err:isDone?C.ok:isSkipped?"#F59E0B":C.border}`, background:isFailed?C.err:isDone?C.ok:isSkipped?"#F59E0B":"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {isDone && <span style={{ color:"#fff", fontSize:9, fontWeight:700 }}>✓</span>}
          {isFailed && <span style={{ color:"#fff", fontSize:9, fontWeight:700 }}>✗</span>}
          {isSkipped && <span style={{ color:"#fff", fontSize:9, fontWeight:700 }}>!</span>}
        </div>
        <span style={{ flex:1, fontSize:12, fontFamily:FB, color:isFailed?C.err:isDone?C.muted:isSkipped?C.warn:C.text, textDecoration:isDone?"line-through":"none" }}>{t.name}</span>
        {t.estimatedTime && !isDone && !isFailed && !isSkipped && <span style={{ fontSize:10, color:C.muted, fontFamily:FB, flexShrink:0 }}>{t.estimatedTime}</span>}
        {isFailed && <span style={{ fontSize:10, color:C.err, fontFamily:FB, flexShrink:0 }}>failed</span>}
        {isSkipped && isManualTask && <span style={{ fontSize:10, color:C.warn, fontFamily:FB, flexShrink:0 }}>do manually</span>}

        {isFailed && (
          <button onClick={runTask} disabled={running}
            style={{ ...btn(running?"#9CA3AF":C.err,"#fff",10), padding:"3px 8px", flexShrink:0 }}>
            {running?"Retrying…":"Retry"}
          </button>
        )}

        {isSkipped && isManualTask && (
          <button onClick={()=>onComplete(t.id)}
            style={{ ...btn(C.ok,"#fff",10), padding:"3px 8px", flexShrink:0 }}>
            Mark done
          </button>
        )}

        {!isDone && !isFailed && !isSkipped && (
          <div style={{ display:"flex", gap:4, flexShrink:0 }}>
            {mode==="auto" && t.id && (
              <button onClick={runTask} disabled={running||isAutoRunning}
                style={{ ...btn(running?"#9CA3AF":C.primary,"#fff",10), padding:"3px 8px", display:"flex", alignItems:"center", gap:4 }}>
                {running&&<span style={{ ...spin(), width:10, height:10, borderWidth:1.5 }}/>}
                {running?"Running…":"Run"}
              </button>
            )}
            {mode==="guided" && t.id && (
              <button onClick={getContent} disabled={running}
                style={{ ...btnO(C.primary,10), padding:"3px 8px" }}>
                {running?"…":content?"Content":"Get content"}
              </button>
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
            {onRemove && <button onClick={()=>onRemove(t.id)} style={{ ...btnO(C.err,10), padding:"3px 6px" }}>Remove</button>}
          </div>
        )}
      </div>

      {error && <div style={{ fontSize:11, color:C.err, fontFamily:FB, marginTop:4 }}>{error}</div>}
      {isFailed && taskErrMsg && (
        <div style={{ fontSize:11, color:C.err, fontFamily:FB, marginTop:4, marginLeft:22 }}>
          Post failed: {taskErrMsg}
        </div>
      )}

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
          ) : content?.isGuided ? (
            <GuidanceBlock content={content} />
          ) : content?.isVideo && content?.slides ? (
            <VideoSlideTaskBlock content={content} businessName={businessName} backgroundUrl={content.imageUrl} />
          ) : (
            <ContentPreviewBlock content={content} channel={channel} mode={mode} />
          )}
          {/* Guided mode: Post to Instagram button after content generated */}
          {mode === "guided" && channel === "instagram" && !content?.isGuided && (content?.caption || content?.body) && content?.imageUrl && !content?.published && (
            <div style={{ marginTop:8 }}>
              <button onClick={async () => {
                setPosting(true); setPostMsg("");
                try {
                  const res = await api.instagram.createPost(businessId, content.imageUrl, content.caption || content.body);
                  if (res.success) {
                    setPostMsg(`✓ Posted! ${res.permalink || ""}`);
                    setContent(p => ({ ...p, published: true }));
                    onComplete(t.id);
                  } else {
                    setPostMsg("Post failed — check Instagram connection");
                  }
                } catch(postErr) {
                  setPostMsg(`Error: ${postErr.message}`);
                }
                setPosting(false);
              }} disabled={posting}
                style={{ ...btn(posting?"#9CA3AF":C.primary,"#fff",11), padding:"5px 12px", display:"flex", alignItems:"center", gap:6 }}>
                {posting && <span style={{ ...spin(), width:10, height:10, borderWidth:1.5 }}/>}
                {posting ? "Posting…" : "Post to Instagram"}
              </button>
              {postMsg && <div style={{ fontSize:11, color:postMsg.startsWith("✓")?C.ok:C.err, fontFamily:FB, marginTop:4 }}>{postMsg}</div>}
            </div>
          )}

          {/* Multi-channel content: repurpose across other channels */}
          {mode === "guided" && !content?.isGuided && (content?.caption || content?.body) && (
            <div style={{ marginTop:10, borderTop:`1px solid ${C.border}`, paddingTop:8 }}>
              <button onClick={()=>setShowExtra(o=>!o)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:11, fontFamily:FB, padding:"2px 0" }}>
                {showExtra?"▲":"▼"} Repurpose for other channels
              </button>
              {showExtra && (
                <div style={{ marginTop:8 }}>
                  <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginBottom:8 }}>
                    Generate this content for additional channels:
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {["twitter","linkedin","email","tiktok","google"].filter(ch=>ch!==channel).map(ch=>(
                      <div key={ch} style={{ flex:1, minWidth:140 }}>
                        {extraChannels[ch] ? (
                          <div style={{ background:"#F9FAFB", borderRadius:7, padding:"8px 10px" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:C.primary, fontFamily:FB, textTransform:"uppercase", marginBottom:4 }}>
                              {CH_LABELS[ch]||ch}
                            </div>
                            <p style={{ fontSize:11, color:C.text, fontFamily:FB, lineHeight:1.5, marginBottom:4 }}>
                              {extraChannels[ch].body || extraChannels[ch].caption}
                            </p>
                            {extraChannels[ch].hashtags && (
                              <p style={{ fontSize:10, color:C.muted, fontFamily:FB }}>{extraChannels[ch].hashtags}</p>
                            )}
                            <button onClick={()=>{
                              const txt = [extraChannels[ch].body||extraChannels[ch].caption, extraChannels[ch].hashtags].filter(Boolean).join("\n\n");
                              navigator.clipboard.writeText(txt).catch(()=>{});
                            }} style={{ ...btnO(C.ok,9), padding:"2px 6px", marginTop:4 }}>Copy</button>
                          </div>
                        ) : (
                          <button onClick={async()=>{
                            setLoadingCh(ch);
                            try {
                              const res = await api.agents.taskContent(businessId, t, ch, mode);
                              setExtraChannels(p=>({...p,[ch]:res.content}));
                            } catch {}
                            setLoadingCh(null);
                          }} disabled={loadingCh===ch}
                            style={{ ...btnO(C.muted,10), width:"100%", padding:"5px 8px", display:"flex", alignItems:"center", gap:4 }}>
                            {loadingCh===ch && <span style={{ ...spin(), width:9, height:9, borderWidth:1.5, borderTopColor:C.muted, borderColor:"rgba(0,0,0,0.1)" }}/>}
                            {loadingCh===ch ? "…" : `+ ${CH_LABELS[ch]||ch}`}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign:c, onUpdate, onDelete, businessId, businessName, setTab, activeCampaignCount=0, refreshTasks, stickyNote, onAssignSticky, onUnstickNote }) {
  const [expanded,    setExpanded]    = useState(c.status==="active");
  const [starting,    setStarting]    = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [dropOver,    setDropOver]    = useState(false);
  const hasAutoStartedRef = useRef(false);
  const abortRef = useRef(false);

  const tasks     = c.tasks || [];
  const completed = tasks.filter(t=>t.status==="completed"||t.status==="done").length;
  const total     = tasks.length;
  const pct       = total > 0 ? Math.round(completed/total*100) : (c.progressTarget > 0 ? Math.min(100,Math.round((c.progressCurrent||0)/c.progressTarget*100)) : 0);
  const mode      = c.mode || "guided";
  const statusColor = STAT_CLR[c.status] || C.muted;

  const startCampaign = async (activeCampaignCount = 0) => {
    if (activeCampaignCount >= 3) {
      alert("You can only run 3 campaigns at once. Complete or archive an active campaign before starting another.");
      return;
    }
    console.log(`[CAMPAIGN:startCampaign] Starting — campaignId=${c.id} title="${c.title}" channel=${c.channel} mode=${mode}`);
    setStarting(true);
    try {
      const res = await api.agents.campaignBreakdown(businessId, { campaign:{...c, mode, status:"active"}, activeCampaignCount });
      if (res.campaignLimitReached) {
        alert("You can only run 3 campaigns at once. Complete or archive an active campaign first.");
        setStarting(false);
        return;
      }
      console.log(`[CAMPAIGN:startCampaign] Breakdown complete — taskCount=${res.tasks?.length} taskIds=${JSON.stringify(res.taskIds?.slice(0,3))}`);
      if (!res.tasks?.length) {
        console.warn(`[CAMPAIGN:startCampaign] WARNING — breakdown returned 0 tasks! campaign="${c.title}"`);
      }
      const updated = { ...c, status:"active", tasks:res.tasks, taskIds:res.taskIds, progressTarget:res.progressTarget, progressUnit:res.progressUnit, startedAt:new Date().toISOString() };
      onUpdate(updated);
    } catch(e) {
      console.error(`[CAMPAIGN:startCampaign] FAILED — campaignId=${c.id} error="${e.message}"`);
      alert(e.message.includes("token") ? e.message : "Could not start campaign: "+e.message);
    }
    setStarting(false);
  };

  const runTasksAuto = async (camp) => {
    abortRef.current = false;
    setAutoRunning(true);
    const taskList = camp.tasks || [];
    const campChannel = camp.channel || "general";
    console.log(`[AUTOPILOT:runTasksAuto] Starting — campaignId=${camp.id} title="${camp.title}" taskCount=${taskList.length} mode=${mode} channel=${campChannel}`);

    if (taskList.length === 0) {
      console.warn(`[AUTOPILOT:runTasksAuto] No tasks found in campaign — did campaignBreakdown return tasks? campaignId=${camp.id}`);
    }

    let lastCaption = null; // carry caption from prep tasks to publish task

    for (const task of taskList) {
      if (abortRef.current) {
        console.log(`[AUTOPILOT:runTasksAuto] Aborted before task taskId=${task.id}`);
        break;
      }
      if (task.status==="completed"||task.status==="done") {
        console.log(`[AUTOPILOT:runTasksAuto] Skipping already-done task — taskId=${task.id} name="${task.name}"`);
        continue;
      }
      // Manual tasks (video/film steps) require human action — skip in autopilot
      if (task.mode === "manual") {
        console.log(`[AUTOPILOT:runTasksAuto] Skipping manual task (requires human action) — taskId=${task.id} name="${task.name}"`);
        onUpdate(prev => prev.id===camp.id ? {
          ...prev,
          tasks: (prev.tasks||[]).map(t=>t.id===task.id?{...t,status:"skipped",outputData:{ fields:[{label:"Note",value:"This step requires you to do it manually. Mark done when complete."}] }}:t),
        } : prev);
        continue;
      }
      console.log(`[AUTOPILOT:runTasksAuto] Running task — taskId=${task.id} name="${task.name}"`);
      try {
        // For Instagram publish tasks: pre-generate Canvas image so the post has real text
        let runBody = {};
        const isPublishTask = campChannel === "instagram" && /\bpublish\b|\bpost\s+(to|on)\s+instagram\b|\bpost\s+the\b|\bgo\s+live\b/i.test(task.name);
        if (isPublishTask && lastCaption) {
          console.log(`[AUTOPILOT:runTasksAuto] Pre-generating Canvas image for publish task — caption="${lastCaption.slice(0, 60)}"`);
          try {
            const blob = await generatePostImageBlob(businessName || "Business", lastCaption);
            const { imageUrl: uploadedUrl } = await api.instagram.uploadImage(blob);
            runBody.imageUrl = uploadedUrl;
            console.log(`[AUTOPILOT:runTasksAuto] Canvas image pre-uploaded — imageUrl=${uploadedUrl}`);
          } catch(canvasErr) {
            console.warn(`[AUTOPILOT:runTasksAuto] Canvas pre-upload failed — ${canvasErr.message}. Server will use SVG.`);
          }
        }

        const result = await api.tasks.run(task.id, runBody);
        let output = result.task?.outputData;

        // Track caption for subsequent tasks
        if (output?.caption || output?.body) {
          lastCaption = output.body || output.caption;
        }

        // For visual channel prep tasks: composite canvas for non-AI images only
        // gpt-image sources are displayed directly — skip canvas to preserve the AI image
        if (VISUAL_CHANNEL_SET.has(campChannel) && (output?.caption || output?.body) && !output?.isGuided && !runBody.imageUrl && !output?.imageSource?.startsWith("gpt-image")) {
          try {
            const blob = await generatePostImageBlob(businessName || "Business", output.body || output.caption, null);
            const { imageUrl: canvasUrl } = await api.instagram.uploadImage(blob);
            output = { ...output, imageUrl: canvasUrl, imageSource: "canvas" };
            console.log(`[AUTOPILOT:runTasksAuto] Canvas display image for "${task.name}"`);
          } catch(displayErr) {
            console.warn(`[AUTOPILOT:runTasksAuto] Canvas display failed for "${task.name}" — ${displayErr.message}`);
          }
        }

        const igFailed = output?.channel === "instagram" && output?.published === false;
        const errField = output?.fields?.find(f => f.label === "Error");
        console.log(`[AUTOPILOT:runTasksAuto] Task complete — taskId=${task.id} channel=${output?.channel} published=${output?.published} imageSource=${output?.imageSource} imageUrl=${output?.imageUrl || "none"}`);
        if (igFailed && errField) {
          console.error(`[AUTOPILOT:runTasksAuto] Instagram post FAILED for task "${task.name}" — error="${errField.value}"`);
        }
        // Mark as "failed" when IG post was attempted but returned published:false with an error
        const taskStatus = igFailed && errField ? "failed" : "completed";
        onUpdate(prev => prev.id===camp.id ? {
          ...prev,
          tasks: (prev.tasks||[]).map(t=>t.id===task.id?{...t,status:taskStatus,outputData:output}:t),
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
    api.tasks.update(taskId, { status:"done" }).then(()=>refreshTasks?.()).catch(()=>{});
  };
  const skipTask = (taskId) => {
    onUpdate({ ...c, tasks:tasks.map(t=>t.id===taskId?{...t,status:"skipped"}:t) });
    api.tasks.update(taskId, { status:"done" }).then(()=>refreshTasks?.()).catch(()=>{});
  };
  const removeTask = (taskId) => {
    onUpdate({ ...c, tasks:tasks.filter(t=>t.id!==taskId) });
    api.tasks.delete(taskId).then(()=>refreshTasks?.()).catch(()=>{});
  };

  const markDone = () => {
    onUpdate({ ...c, status:"monitoring", completedAt:new Date().toISOString() });
    // Delete all campaign tasks from DB when campaign is marked done
    const ids = (c.taskIds||tasks.map(t=>t.id)).filter(Boolean);
    if (ids.length) api.tasks.bulkAction(businessId, "delete", ids).then(()=>refreshTasks?.()).catch(()=>{});
  };
  const archive  = () => onUpdate({ ...c, status:"archived", archivedAt:new Date().toISOString() });
  const pause    = () => { abortRef.current=true; setAutoRunning(false); };

  const activeTasks = tasks.filter(t=>t.status!=="completed"&&t.status!=="done"&&t.status!=="skipped");
  const allDone = tasks.length > 0 && activeTasks.length === 0;

  return (
    <div
      onDragOver={e=>{ e.preventDefault(); setDropOver(true); }}
      onDragLeave={()=>setDropOver(false)}
      onDrop={e=>{ e.preventDefault(); setDropOver(false); const noteId=e.dataTransfer.getData("text/noteId"); if(noteId&&onAssignSticky) onAssignSticky(noteId, c.id, c.title); }}
      style={{ ...card("12px 14px"), marginBottom:10, border:`1px solid ${dropOver?C.primary:statusColor+"25"}`, background: c.status==="archived"?"#F9F9F9":"#fff", transition:"border-color 0.15s" }}>
      {/* Sticky note */}
      {stickyNote && (
        <div style={{ display:"flex", alignItems:"center", gap:5, background:stickyNote.color||"#FEF9C3", borderRadius:6, padding:"4px 8px", marginBottom:8, fontSize:11, color:"#374151", fontFamily:FB }}>
          <span>📌</span>
          <span style={{ flex:1, wordBreak:"break-word" }}>{stickyNote.text}</span>
          <button onClick={()=>onUnstickNote?.(c.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:12, padding:0 }}>✕</button>
        </div>
      )}
      {dropOver && !stickyNote && <div style={{ height:2, background:C.primary, borderRadius:2, marginBottom:6 }} />}
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
        <button onClick={()=>onDelete(c.id)} title="Remove campaign" style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:16, padding:0, flexShrink:0 }}>×</button>
      </div>

      {c.rationale && <p style={{ fontSize:12, color:C.muted, fontFamily:FB, lineHeight:1.5, marginBottom:8 }}>{c.rationale}</p>}
      {c.expectedImpact && <div style={{ background:C.okBg, borderRadius:6, padding:"4px 8px", fontSize:11, color:C.ok, fontFamily:FB, marginBottom:8 }}>Goal: {c.expectedImpact}</div>}

      {/* 15-min warning */}
      {c.estimatedMinutes > 15 && c.status === "planned" && (
        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:6, padding:"5px 10px", fontSize:11, color:"#92400E", fontFamily:FB, marginBottom:8 }}>
          This campaign may take ~{c.estimatedMinutes} min. Consider running it in two sessions.
        </div>
      )}

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
          {c.status==="monitoring" && (
            <div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginTop:4 }}>
              Progress updates each time you re-run marketing analysis
            </div>
          )}
        </div>
      )}

      {/* Queued — shows in both guided and auto */}
      {c.status==="planned" && (
        <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginBottom:8 }}>
          Click <strong>Start campaign</strong> to break this into tasks and begin execution.
          {mode==="auto" && " (Max 3 campaigns can run at once.)"}
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
                  businessId={businessId} businessName={businessName} onComplete={completeTask} onSkip={skipTask} onRemove={removeTask}
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
          <button onClick={()=>startCampaign(activeCampaignCount)} disabled={starting}
            style={{ ...btn(starting?"#9CA3AF":C.warn,"#fff",11), padding:"5px 12px", display:"flex", gap:4, alignItems:"center" }}>
            {starting&&<span style={spin()}/>}
            {starting?"Setting up…":"Start campaign"}
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
            style={{ ...btnO(C.muted,11), padding:"5px 10px" }}>Move to Run Campaigns</button>
        )}
        {/* Remove campaign — available in all non-auto states */}
        {mode !== "auto" && (
          <button onClick={()=>onDelete(c.id)} style={{ ...btnO(C.err,11), padding:"5px 10px", marginLeft:"auto" }}>Remove</button>
        )}
        {/* Auto mode: only Pause is allowed during run; Remove always available */}
        {mode === "auto" && !autoRunning && (
          <button onClick={()=>onDelete(c.id)} style={{ ...btnO(C.err,11), padding:"5px 10px", marginLeft:"auto" }}>Remove</button>
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
  const [action,    setAction]    = useState("");
  const [target,    setTarget]    = useState("");
  const [goal,      setGoal]      = useState("");
  const [timeframe, setTimeframe] = useState("7 days");
  const [campaignMode, setCampaignMode] = useState(mode || "guided");

  const add = () => {
    if (!title.trim()) return;
    onAdd({ id:Date.now().toString(), title:title.trim(), channel,
      rationale: action.trim() || undefined,
      expectedImpact:target.trim()||undefined,
      goal:goal.trim(), timeframe, status:"planned", mode:campaignMode,
      createdAt:new Date().toISOString() });
    setTitle(""); setAction(""); setTarget(""); setGoal(""); setOpen(false);
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
        <label style={lbl}>Action — what specifically will you do?</label>
        <input value={action} onChange={e=>setAction(e.target.value)} placeholder="e.g. Write and publish 3 Instagram posts with product photos"
          style={{ ...inp() }} />
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
    if (result.isGuided) return;
    // gpt-image sources can't be loaded into canvas (CORS) — display directly
    if (result.imageSource?.startsWith("gpt-image")) {
      if (!cancelled) setLocalImgUrl(result.imageUrl || null);
      return;
    }
    (async () => {
      try {
        const blob = await generatePostImageBlob(effectiveName, result.body || result.caption, null);
        const { imageUrl } = await api.instagram.uploadImage(blob);
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
          <button onClick={()=>copy(result.body||result.caption)} style={{ ...btnO(C.primary,11), flex:1, padding:"5px 10px" }}>{copied?"Copied!":"Copy text"}</button>
          {result.channel==="instagram" && <button onClick={publishNow} disabled={publishing} style={{ ...btn(C.primary,"#fff",11), flex:1, padding:"5px 10px" }}>{publishing?"Publishing…":"Publish to Instagram"}</button>}
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

// ── Content Lab (debug / test content generation) ────────────────────────────

const CHANNEL_OPTS = [
  { value:"instagram", label:"Instagram",        hasImage:true  },
  { value:"twitter",   label:"X / Twitter",      hasImage:true  },
  { value:"linkedin",  label:"LinkedIn",          hasImage:true  },
  { value:"tiktok",    label:"TikTok",            hasImage:true  },
  { value:"google",    label:"Google Business",   hasImage:true  },
  { value:"facebook",  label:"Facebook",          hasImage:true  },
  { value:"email",     label:"Email",             hasImage:false },
  { value:"website",   label:"Website",           hasImage:false },
  { value:"general",   label:"General",           hasImage:true  },
];
const TONE_OPTS = ["professional","educational","bold","casual","inspirational","direct"];
const VISUAL_CHANNEL_SET = new Set(["instagram","twitter","tiktok","linkedin","google","facebook","general"]);
const SRC_BADGE = {
  "gpt-image-1":"GPT Image 1", "gpt-image-1.5":"GPT Image 1.5", "gpt-image-1-mini":"GPT Image 1 Mini",
  "gpt-image-2":"GPT Image 2", "chatgpt-image-latest":"GPT Image (latest)",
  "dalle3":"DALL-E 3", "dall-e-3":"DALL-E 3", "dalle2":"DALL-E 2", "dall-e-2":"DALL-E 2",
  canvas:"Canvas", svg_fallback:"SVG (image failed)", svg_no_openai:"SVG (no key)",
  image_failed:"Image failed", dalle3_failed:"Image failed", null:"—",
};
const SRC_CLR = {
  "gpt-image-1":C.ok, "gpt-image-1.5":C.ok, "gpt-image-1-mini":C.ok,
  "gpt-image-2":C.ok, "chatgpt-image-latest":C.ok,
  "dalle3":C.ok, "dall-e-3":C.ok, "dalle2":C.ok, "dall-e-2":C.ok,
  canvas:C.warn, svg_fallback:C.err, svg_no_openai:C.muted, image_failed:C.err, dalle3_failed:C.err,
};

function ContentLab({ businessId, businessName, plan }) {
  const [open,           setOpen]           = useState(false);
  const [showPlans,      setShowPlans]      = useState(false);
  const [channel,        setChannel]        = useState("instagram");
  const [context,        setContext]        = useState("");
  const [tone,           setTone]           = useState("professional");
  const [loading,        setLoading]        = useState(false);
  const [result,         setResult]         = useState(null);
  const [composedBlob,   setComposedBlob]   = useState(null);
  const [videoBlob,      setVideoBlob]      = useState(null);
  const [videoLoading,   setVideoLoading]   = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [error,          setError]          = useState("");
  const [posting,        setPosting]        = useState(false);
  const [postResult,     setPostResult]     = useState(null);

  const isStarter      = plan === "starter" || plan === "trial";
  const isAutopilot    = plan === "pro_autopilot";

  const channelOpt = CHANNEL_OPTS.find(o => o.value === channel);
  const hasImage   = channelOpt?.hasImage;

  // Stable object URLs — revoked when blob changes
  const composedUrl = useMemo(() => composedBlob ? URL.createObjectURL(composedBlob) : null, [composedBlob]);
  useEffect(() => () => { if (composedUrl) URL.revokeObjectURL(composedUrl); }, [composedUrl]);
  const videoUrl = useMemo(() => videoBlob ? URL.createObjectURL(videoBlob) : null, [videoBlob]);
  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

  const generate = async () => {
    if (!context.trim()) return;
    setLoading(true); setError(""); setResult(null); setComposedBlob(null); setVideoBlob(null);
    try {
      const data = await api.agents.contentLab(businessId, { channel, context: context.trim(), tone });
      setResult(data);
      // For visual channels, composite canvas text overlay over image
      // For gpt-image, fetch as blob first to avoid CORS when loading into canvas
      if (hasImage && data.imageUrl && !data.isVideo) {
        try {
          let bgUrl = null;
          if (data.imageSource?.startsWith("gpt-image")) {
            const imgResp = await fetch(data.imageUrl);
            const imgBlob = await imgResp.blob();
            bgUrl = URL.createObjectURL(imgBlob);
          }
          const blob = await generatePostImageBlob(businessName || "Business", data.body || data.caption, bgUrl);
          setComposedBlob(blob);
          if (bgUrl) URL.revokeObjectURL(bgUrl);
        } catch(canvasErr) {
          console.error("[ContentLab] Canvas composition failed:", canvasErr.message);
        }
      }
    } catch(e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const createVideo = async () => {
    if (!result?.slides) return;
    setVideoLoading(true);
    try {
      let bgUrl = null;
      if (result.imageSource?.startsWith("gpt-image") && result.imageUrl) {
        try {
          const imgResp = await fetch(result.imageUrl);
          const imgBlob = await imgResp.blob();
          bgUrl = URL.createObjectURL(imgBlob);
        } catch { /* fall through — slideshow will use gradient */ }
      }
      const blob  = await generateSlideshowBlob(result.slides, bgUrl, businessName || "Business");
      if (bgUrl) URL.revokeObjectURL(bgUrl);
      setVideoBlob(blob);
    } catch(e) {
      console.error("[ContentLab] Slideshow generation failed:", e.message);
    }
    setVideoLoading(false);
  };

  const downloadImage = () => {
    if (!composedBlob) return;
    const url = URL.createObjectURL(composedBlob);
    const a   = document.createElement("a");
    a.href    = url;
    a.download = `${(businessName || "post").replace(/\s+/g, "-").toLowerCase()}-${channel}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadVideo = () => {
    if (!videoBlob) return;
    const url = URL.createObjectURL(videoBlob);
    const a   = document.createElement("a");
    a.href    = url;
    a.download = `${(businessName || "post").replace(/\s+/g, "-").toLowerCase()}-${channel}.webm`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyText = async () => {
    if (!result) return;
    const parts = [result.body || result.caption, result.hashtags].filter(Boolean);
    try { await navigator.clipboard.writeText(parts.join("\n\n")); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
    {showPlans && <PlansModalMA highlightPlan="pro" onClose={()=>setShowPlans(false)} />}
    <div style={{ ...card("0"), marginBottom:20, overflow:"hidden", border:`1px solid ${C.primary}20`, borderRadius:12 }}>
      {/* Header */}
      <button onClick={() => isStarter ? setShowPlans(true) : setOpen(o => !o)} style={{
        width:"100%", border:"none", cursor:"pointer",
        background: open ? "#FAFAFA" : "linear-gradient(135deg,#EFF6FF 0%,#F0F9FF 100%)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 18px", borderBottom: open ? `1px solid ${C.border}` : "none",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, color:C.text }}>Content Lab</div>
            <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginTop:1 }}>
              {isStarter ? "Pro feature" : "Branded content for any channel"}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {isStarter && <span style={{ fontSize:9, fontWeight:700, background:"#2563EB", color:"#fff", borderRadius:8, padding:"2px 8px", fontFamily:FB }}>PRO</span>}
          {!isStarter && <span style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{open ? "▲" : "▼"}</span>}
        </div>
      </button>

      {open && !isStarter && (
        <div style={{ padding:"16px 18px" }}>
          {/* Controls */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr auto", gap:10, marginBottom:14, alignItems:"end" }}>
            <div>
              <div style={{ ...lbl, fontSize:10, marginBottom:4 }}>Channel</div>
              <select value={channel} onChange={e => { setChannel(e.target.value); setResult(null); setComposedBlob(null); }}
                style={{ ...inp({ fontSize:12 }), width:"100%" }}>
                {CHANNEL_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ ...lbl, fontSize:10, marginBottom:4 }}>Tone</div>
              <select value={tone} onChange={e => setTone(e.target.value)} style={{ ...inp({ fontSize:12 }), width:"100%" }}>
                {TONE_OPTS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <div style={{ ...lbl, fontSize:10, marginBottom:4 }}>Topic / context</div>
              <input value={context} onChange={e => setContext(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && context.trim() && generate()}
                placeholder="e.g. 'How we helped a client save 10 hours a week with automation'"
                style={{ ...inp({ fontSize:12 }), width:"100%" }} />
            </div>
            <button onClick={generate} disabled={loading || !context.trim()}
              style={{ ...btn(loading ? "#9CA3AF" : C.primary, "#fff", 12), padding:"8px 18px",
                display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}>
              {loading && <div style={spin()} />}
              {loading ? "Generating…" : "Generate"}
            </button>
          </div>

          {error && (
            <div style={{ ...card("8px 12px"), background:C.errBg, border:`1px solid #DC262630`, marginBottom:12, fontSize:12, color:C.err, fontFamily:FB }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* ── Video slideshow result ── */}
              {result.isVideo && result.slides && (
                <div style={{ display:"grid", gridTemplateColumns: videoUrl ? "260px 1fr" : "1fr", gap:16, alignItems:"start" }}>
                  {/* Preview / create button */}
                  <div>
                    {videoUrl ? (
                      <>
                        <video src={videoUrl} controls style={{ width:"100%", borderRadius:8, display:"block", marginBottom:8 }} />
                        <button onClick={downloadVideo}
                          style={{ ...btn(C.ok,"#fff",11), padding:"5px 0", width:"100%", textAlign:"center" }}>
                          ↓ Download Video (.webm)
                        </button>
                      </>
                    ) : (
                      <div style={{ ...card("18px 12px"), background:"#EFF6FF", border:`1px solid ${C.primary}30`, borderRadius:8, textAlign:"center" }}>
                        <div style={{ fontSize:28, marginBottom:8 }}>🎬</div>
                        <div style={{ fontSize:12, color:C.text, fontFamily:FB, marginBottom:12, lineHeight:1.5 }}>
                          {result.slides.length} slides ready<br/>
                          <span style={{ fontSize:11, color:C.muted }}>~{result.slides.length * 4}s video</span>
                        </div>
                        <button onClick={createVideo} disabled={videoLoading}
                          style={{ ...btn(videoLoading ? "#9CA3AF" : C.primary,"#fff",12), padding:"7px 18px",
                            display:"inline-flex", alignItems:"center", gap:6 }}>
                          {videoLoading && <div style={spin()} />}
                          {videoLoading ? "Rendering…" : "Create Video"}
                        </button>
                        {videoLoading && (
                          <div style={{ fontSize:10, color:C.muted, fontFamily:FB, marginTop:8 }}>
                            Rendering {result.slides.length * 4}s of canvas frames…
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Slides + caption */}
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {/* Slide list */}
                    <div style={{ ...card("10px 12px"), background:"#FAFAFA", border:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:10, fontWeight:700, color:C.muted, fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>
                        Slides
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {result.slides.map((sl, i) => (
                          <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                            <span style={{ fontSize:10, fontWeight:700, color:C.primary, fontFamily:FB, minWidth:18, paddingTop:1 }}>{i + 1}</span>
                            <div>
                              <div style={{ fontSize:12, fontWeight:600, color:C.text, fontFamily:FH }}>{sl.headline}</div>
                              {sl.subtext && <div style={{ fontSize:11, color:C.muted, fontFamily:FB, marginTop:1 }}>{sl.subtext}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Caption */}
                    <div style={{ ...card("10px 12px"), background:"#F0FDF4", border:`1px solid ${C.ok}25` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <span style={{ fontSize:10, fontWeight:700, color:C.ok, fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.05em" }}>Caption</span>
                        <button onClick={copyText} style={{ ...btn(copied ? C.ok : "#6B7280","#fff",10), padding:"3px 10px" }}>
                          {copied ? "✓ Copied" : "Copy text"}
                        </button>
                      </div>
                      <p style={{ fontSize:12, color:"#374151", fontFamily:FB, lineHeight:1.6, marginBottom: result.hashtags ? 4 : 0 }}>
                        {result.body || result.caption}
                      </p>
                      {result.hashtags && <p style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{result.hashtags}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Static image result ── */}
              {!result.isVideo && (
                <div style={{ display:"grid", gridTemplateColumns: (hasImage && (composedUrl || result.imageUrl)) ? "260px 1fr" : "1fr", gap:16, alignItems:"start" }}>
                  {/* Image column */}
                  {hasImage && (
                    <div>
                      {(() => {
                        const displayUrl = composedUrl || (result.imageSource?.startsWith("gpt-image") ? result.imageUrl : null);
                        if (displayUrl) return (
                          <>
                            <img src={displayUrl} alt="Generated post" style={{ width:"100%", borderRadius:8, display:"block", marginBottom:8 }} />
                            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                              {composedUrl && (
                                <button onClick={downloadImage}
                                  style={{ ...btn(C.ok,"#fff",11), padding:"5px 0", flex:1, textAlign:"center" }}>
                                  ↓ Download PNG
                                </button>
                              )}
                              <span style={{
                                fontSize:9, fontWeight:700, fontFamily:FB, padding:"5px 8px", borderRadius:6,
                                background: (SRC_CLR[result.imageSource] || C.muted) + "20",
                                color: SRC_CLR[result.imageSource] || C.muted,
                                textTransform:"uppercase", letterSpacing:"0.04em",
                              }}>
                                {SRC_BADGE[result.imageSource] || result.imageSource}
                              </span>
                            </div>
                          </>
                        );
                        if (result.imageUrl && !result.imageSource?.startsWith("gpt-image")) return (
                          <div style={{ ...card("12px"), background:"#F3F4F6", textAlign:"center", color:C.muted, fontSize:12, fontFamily:FB, borderRadius:8 }}>
                            Compositing…
                          </div>
                        );
                        return null;
                      })()}
                      {result.dalleError ? (
                        <div style={{ ...card("10px 12px"), background:"#FEF2F2", border:"1px solid #FECACA", fontSize:11, color:C.err, fontFamily:FB, borderRadius:8 }}>
                          <strong>Image failed:</strong> {result.dalleError}
                          <div style={{ fontSize:10, color:"#9CA3AF", marginTop:4 }}>
                            Check OpenAI Project settings → enable image generation
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Text column */}
                  <div>
                    {result.captionError && (
                      <div style={{ fontSize:11, color:"#92400E", fontFamily:FB, marginBottom:8, background:"#FFFBEB", padding:"6px 10px", borderRadius:6 }}>
                        OpenAI failed — Claude fallback used
                      </div>
                    )}
                    <div style={{ ...card("12px 14px"), background:"#F0FDF4", border:`1px solid ${C.ok}25` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <span style={{ fontSize:10, fontWeight:700, color:C.ok, fontFamily:FB, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                          {channelOpt?.label || channel} copy
                        </span>
                        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                          <span style={{ fontSize:9, color:C.muted, fontFamily:FB }}>{result.captionSource}</span>
                          <button onClick={copyText}
                            style={{ ...btn(copied ? C.ok : "#6B7280","#fff",10), padding:"3px 10px" }}>
                            {copied ? "✓ Copied" : "Copy text"}
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize:13, color:"#374151", fontFamily:FB, lineHeight:1.65, marginBottom: result.hashtags ? 6 : 0, whiteSpace:"pre-wrap" }}>
                        {result.body || result.caption}
                      </p>
                      {result.hashtags && (
                        <p style={{ fontSize:11, color:C.muted, fontFamily:FB }}>{result.hashtags}</p>
                      )}
                    </div>

                    {/* Post to channel — pro_autopilot only */}
                    {isAutopilot && (result.body || result.caption) && (
                      <div style={{ marginTop:10 }}>
                        <button
                          disabled={posting || postResult?.success}
                          onClick={async () => {
                            setPosting(true); setPostResult(null);
                            try {
                              const text = [result.body||result.caption, result.hashtags].filter(Boolean).join("\n\n");
                              const imgUrl = result.imageSource?.startsWith("gpt-image") ? result.imageUrl : null;
                              let res;
                              if (channel === "instagram") res = await api.instagram.createPost(businessId, imgUrl||result.imageUrl, text);
                              else if (channel === "twitter") res = await api.twitter.post(businessId, text);
                              else if (channel === "tiktok") res = await api.tiktok.post(businessId, text, imgUrl ? [imgUrl] : []);
                              else { setPostResult({ success:false, msg:`Auto-posting to ${channelOpt?.label||channel} not yet available.`}); setPosting(false); return; }
                              setPostResult({ success: res.success||!!res.id, msg: res.success||res.id ? `Posted to ${channelOpt?.label||channel}!` : "Post failed — check channel connection." });
                            } catch(e) {
                              setPostResult({ success:false, msg: e.message||"Post failed" });
                            }
                            setPosting(false);
                          }}
                          style={{ ...btn(postResult?.success ? C.ok : posting ? "#9CA3AF" : C.primary,"#fff",11), padding:"5px 14px", display:"flex", alignItems:"center", gap:6 }}>
                          {posting && <span style={{ ...spin(), width:10, height:10, borderWidth:1.5 }}/>}
                          {postResult?.success ? "Posted!" : posting ? "Posting…" : `Post to ${channelOpt?.label||channel}`}
                        </button>
                        {postResult?.msg && !postResult.success && (
                          <div style={{ fontSize:11, color:C.err, fontFamily:FB, marginTop:4 }}>{postResult.msg}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}

// ── MAIN AGENT PANEL ──────────────────────────────────────────────────────────

export default function AgentPanel({ businessId, businessName, metrics, planInfo, integs, setTab, refreshTasks, hubNotes, stickyAssignments, onAssignSticky, onUnstickNote }) {
  const navigate = useNavigate();

  // Mode — sessionStorage so it resets on browser close / logout
  const [agentMode, setAgentMode] = useState(() => {
    try { return sessionStorage.getItem(`earnedlab_agentmode_${businessId}`) || "guided"; } catch { return "guided"; }
  });
  const saveAgentMode = (m) => {
    setAgentMode(m);
    try { sessionStorage.setItem(`earnedlab_agentmode_${businessId}`, m); } catch {}
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
    // Note: autopilot mode is session-only — resets to guided on login
  },[businessId]);

  // Enforce plan-based mode restrictions when access data loads
  useEffect(()=>{
    if (!access) return;
    const plan = access.effective?.plan;
    if ((plan === "starter" || plan === "trial") && agentMode !== "manual") {
      saveAgentMode("manual");
    } else if (plan === "pro" && agentMode === "auto") {
      saveAgentMode("guided");
    }
  },[access]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-run analysis every 12h in auto mode — never fires immediately on mount/tab-switch
  useEffect(()=>{
    clearTimeout(autoTimerRef.current);
    if (agentMode!=="auto") return;
    // Schedule next run for the remaining time from the last run (or 12h from now if never run)
    const elapsed   = ranAt ? (Date.now() - new Date(ranAt).getTime()) : 0;
    const remaining = Math.max(60_000, 12*3600*1000 - elapsed); // at least 60s
    autoTimerRef.current = setTimeout(()=>{
      if (!running) runAnalysis();
    }, remaining);
    return ()=>clearTimeout(autoTimerRef.current);
  },[agentMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const autoQueueRef = useRef(null); // holds setTimeout for staged auto-queuing

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

      // Update monitoring campaign progress based on new analysis
      if (data.insights?.length) updateMonitoringProgress(data.insights);

      // Auto mode: slowly queue high-priority suggestions as campaigns, one at a time,
      // with a 45-second delay between each. User has time to delete before it becomes "planned".
      if (agentMode==="auto" && data.insights?.length) {
        const highPri = data.insights.filter(i=>i.priority==="high");
        if (highPri.length) {
          const existingTitles = new Set(campaigns.map(c=>c.title));
          const toQueue = highPri.filter(i=>!existingTitles.has(i.title||i.recommendation));
          toQueue.forEach((ins, idx) => {
            autoQueueRef.current = setTimeout(()=>{
              saveCampaigns(prev => {
                // Re-check dedup inside the timeout (user may have added one manually)
                const titles = new Set(prev.map(c=>c.title));
                const t = ins.title||ins.recommendation;
                if (titles.has(t)) return prev;
                const newC = {
                  id: `${Date.now()}${idx}${Math.random().toString(36).slice(2,6)}`,
                  title: t,
                  rationale: ins.rationale||ins.agentObservation,
                  channel: ins.channel||ins.implementationChannel,
                  expectedImpact: ins.expectedImpact,
                  contentPreview: ins.contentPreview,
                  estimatedMinutes: ins.estimatedMinutes,
                  status:"planned", mode:"auto",
                  createdAt: new Date().toISOString(),
                };
                return [newC, ...prev];
              });
            }, (idx + 1) * 45_000); // 45s between each campaign suggestion
          });
        }
      }

      // Re-schedule next auto-run timer from the fresh ranAt
      if (agentMode === "auto") {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = setTimeout(()=>{ runAnalysis(); }, 12*3600*1000);
      }
    } catch(e) {
      console.error(`[AGENT:runAnalysis] FAILED — error="${e.message}"`);
      setError(e.message||"Analysis failed. Check your available insights in the footer.");
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
    if (typeof updated === "function") {
      // runTasksAuto passes a functional updater: fn(campaign) => campaign
      saveCampaigns(p => p.map(c => updated(c)));
    } else {
      saveCampaigns(p => p.map(c => c.id===updated.id ? updated : c));
    }
  };
  const deleteCampaign = (id) => saveCampaigns(p=>p.filter(c=>c.id!==id));

  // Campaign buckets
  const plannedCampaigns    = campaigns.filter(c=>c.status==="planned");
  const activeCampaigns     = campaigns.filter(c=>c.status==="active");
  const monitoringCampaigns = campaigns.filter(c=>c.status==="monitoring");
  const archivedCampaigns   = campaigns.filter(c=>c.status==="archived");
  const [showArchived, setShowArchived] = useState(false);

  const nextRunIn = ranAt ? Math.max(0, Math.round((12*3600*1000-(Date.now()-new Date(ranAt).getTime()))/3600000)) : null;
  const is12hOverdue = ranAt && (Date.now() - new Date(ranAt).getTime()) > 12*3600*1000;

  const connectedChannels = (integs||[]).filter(i=>{
    try { const m=JSON.parse(i.metadata||"{}"); return Object.values(m).some(v=>typeof v==="string"&&v.length>3); } catch { return false; }
  }).map(i=>i.provider);

  // When analysis runs in auto mode, update monitoring campaign progress based on new insights
  const updateMonitoringProgress = useCallback((newInsights) => {
    if (!monitoringCampaigns.length || !newInsights.length) return;
    saveCampaigns(prev => prev.map(c => {
      if (c.status !== "monitoring") return c;
      // Bump progress if the campaign's channel has new positive insights
      const positiveInsight = newInsights.find(i =>
        (i.channel === c.channel || i.implementationChannel === c.channel) && i.priority !== "high"
      );
      if (positiveInsight && c.progressTarget > 0) {
        const bump = Math.max(1, Math.floor(c.progressTarget * 0.15));
        const newCurrent = Math.min(c.progressTarget, (c.progressCurrent||0) + bump);
        return { ...c, progressCurrent: newCurrent };
      }
      return c;
    }));
  }, [monitoringCampaigns, saveCampaigns]);

  return (
    <div>
      {/* ── Content Lab — top-level standalone feature ── */}
      <ContentLab businessId={businessId} businessName={businessName} plan={access?.effective?.plan} />

      {/* Mode toggle */}
      {(()=>{
        const plan = access?.effective?.plan;
        let allowedModes;
        if (plan === "starter" || plan === "trial") {
          allowedModes = ["manual"];
        } else if (plan === "pro") {
          allowedModes = ["manual","guided"];
        } else {
          allowedModes = ["manual","guided","auto"];
        }
        return <ModeToggle mode={agentMode} onChange={saveAgentMode} allowedModes={allowedModes} />;
      })()}

      {/* 12h guided mode notification */}
      {agentMode==="guided" && is12hOverdue && !running && (
        <div style={{ display:"flex", alignItems:"center", gap:10, background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
          <span style={{ fontSize:16 }}>⏰</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#92400E", fontFamily:FH }}>Time to re-run your marketing analysis</div>
            <div style={{ fontSize:11, color:"#B45309", fontFamily:FB }}>It's been over 12 hours since your last run — fresh insights may be available.</div>
          </div>
          <button onClick={runAnalysis} disabled={running||(access&&!access.marketing.allowed)}
            style={{ ...btn("#D97706","#fff",11), padding:"6px 14px", flexShrink:0 }}>
            Run now
          </button>
        </div>
      )}

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
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", fontFamily:FB }}>
                      {agentMode==="auto" ? "Analysis — suggestions being queued →" : "Suggested campaigns"}
                    </p>
                    {agentMode==="guided" && (
                      <span style={{ fontSize:10, color:C.muted, fontFamily:FB }}>Click "Add to campaigns" to move →</span>
                    )}
                  </div>
                  {insights.map((s,i)=>(
                    <div key={i}>
                      <SuggestionCard suggestion={s} mode={agentMode}
                        onAddToCampaign={addToCampaigns} />
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
                Queued — ready to start ({plannedCampaigns.length})
              </p>
              {plannedCampaigns.map(c=>(
                <CampaignCard key={c.id} campaign={c} onUpdate={updateCampaign} onDelete={deleteCampaign} businessId={businessId} businessName={businessName} setTab={setTab} activeCampaignCount={activeCampaigns.length} refreshTasks={refreshTasks} stickyNote={stickyAssignments?.[c.id] ? hubNotes?.find(n=>n.id===stickyAssignments[c.id]?.noteId) : null} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote} />
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
                <CampaignCard key={c.id} campaign={c} onUpdate={updateCampaign} onDelete={deleteCampaign} businessId={businessId} businessName={businessName} setTab={setTab} activeCampaignCount={activeCampaigns.length} refreshTasks={refreshTasks} stickyNote={stickyAssignments?.[c.id] ? hubNotes?.find(n=>n.id===stickyAssignments[c.id]?.noteId) : null} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote} />
              ))}
            </div>
          )}

          {/* Run Campaigns (monitoring) — tracks goal progress via future analysis */}
          {monitoringCampaigns.length>0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"#8B5CF6", textTransform:"uppercase", letterSpacing:"0.07em", fontFamily:FB }}>
                  Run Campaigns — tracking goal ({monitoringCampaigns.length})
                </p>
                {agentMode!=="manual" && (
                  <button onClick={runAnalysis} disabled={running}
                    style={{ ...btnO("#8B5CF6",10), padding:"3px 8px" }}>
                    {running?"Checking…":"Re-check progress"}
                  </button>
                )}
              </div>
              {monitoringCampaigns.map(c=>(
                <CampaignCard key={c.id} campaign={c} onUpdate={updateCampaign} onDelete={deleteCampaign} businessId={businessId} businessName={businessName} setTab={setTab} activeCampaignCount={activeCampaigns.length} refreshTasks={refreshTasks} stickyNote={stickyAssignments?.[c.id] ? hubNotes?.find(n=>n.id===stickyAssignments[c.id]?.noteId) : null} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {campaigns.length===0 && (
            <div style={{ ...card("16px"), textAlign:"center", border:"1px dashed "+C.border, marginBottom:14 }}>
              <div style={{ fontSize:12, color:C.muted, fontFamily:FB, lineHeight:1.6 }}>
                {agentMode==="auto"
                  ? "Run an analysis to get suggestions. High-priority ones will be queued here automatically (45s apart) — you can delete any before it starts."
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
                <CampaignCard key={c.id} campaign={c} onUpdate={updateCampaign} onDelete={deleteCampaign} businessId={businessId} businessName={businessName} setTab={setTab} activeCampaignCount={activeCampaigns.length} refreshTasks={refreshTasks} stickyNote={stickyAssignments?.[c.id] ? hubNotes?.find(n=>n.id===stickyAssignments[c.id]?.noteId) : null} onAssignSticky={onAssignSticky} onUnstickNote={onUnstickNote} />
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
