import { useState } from "react";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
export const C = {
  bg:"#F4F3EF", surface:"#FFFFFF", dark:"#111318", border:"#DDD9D1",
  text:"#1A1A1A", muted:"#6B7280", subtle:"#9CA3AF",
  disc:"#4338CA", discBg:"#EEEEFF", crea:"#0369A1", creaBg:"#E0F2FE",
  mktg:"#92400E", mktgBg:"#FEF3C7", mgmt:"#166534", mgmtBg:"#F0FDF4",
  ok:"#059669", okBg:"#ECFDF5", warn:"#B45309", warnBg:"#FFFBEB",
  err:"#DC2626", errBg:"#FEF2F2",
};
export const FH = "var(--font-head)";
export const FB = "var(--font-body)";

// ── STYLE HELPERS ─────────────────────────────────────────────────────────────
export const card  = (p="20px 22px", extra={}) => ({ background:C.surface, borderRadius:12, border:`1px solid ${C.border}`, padding:p, ...extra });
export const btn   = (bg, fg="#fff", sz=14) => ({ background:bg, color:fg, border:"none", borderRadius:8, padding:"10px 20px", fontSize:sz, fontWeight:500, cursor:"pointer", fontFamily:FB, transition:"opacity 0.15s" });
export const btnO  = (clr, sz=13) => ({ background:"transparent", color:clr, border:`1.5px solid ${clr}35`, borderRadius:8, padding:"9px 18px", fontSize:sz, fontWeight:500, cursor:"pointer", fontFamily:FB });
export const inp   = (extra={}) => ({ width:"100%", padding:"10px 14px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:FB, color:C.text, background:C.surface, outline:"none", boxSizing:"border-box", ...extra });
export const badge = (clr, bg, sz=9) => ({ background:bg, color:clr, fontSize:sz, fontWeight:600, padding:"2px 8px", borderRadius:20, display:"inline-block", textTransform:"uppercase", letterSpacing:"0.3px", fontFamily:FB });
export const H1    = { fontFamily:FH, fontWeight:700, fontSize:26, color:C.text, letterSpacing:"-0.4px", lineHeight:1.2 };
export const H2    = { fontFamily:FH, fontWeight:700, fontSize:20, color:C.text, letterSpacing:"-0.3px" };
export const H3    = { fontFamily:FH, fontWeight:600, fontSize:15, color:C.text };
export const lbl   = { fontSize:13, fontWeight:500, display:"block", marginBottom:7, color:C.text, fontFamily:FB };
export const hint  = { fontSize:12, color:C.muted, marginTop:5, fontFamily:FB, lineHeight:1.5 };

// ── TAG INPUT ─────────────────────────────────────────────────────────────────
export function TagInput({ tags=[], onChange, placeholder="Type and press Enter", color=C.disc }) {
  const [val, setVal] = useState("");
  const add = () => { const v=val.trim(); if(v&&!tags.includes(v)) onChange([...tags,v]); setVal(""); };
  return (
    <div style={{ border:`1.5px solid ${C.border}`, borderRadius:8, padding:"10px 12px", background:C.surface, minHeight:50 }}>
      {tags.length>0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
          {tags.map(t => (
            <span key={t} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px 4px 12px", borderRadius:20, background:color+"18", color, fontSize:13, fontFamily:FB }}>
              {t}<span onClick={()=>onChange(tags.filter(x=>x!==t))} style={{ cursor:"pointer", fontSize:15, lineHeight:1, opacity:0.6, fontWeight:600 }}>&#215;</span>
            </span>
          ))}
        </div>
      )}
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"||e.key===","){e.preventDefault();add();}}} placeholder={placeholder}
          style={{ border:"none", outline:"none", flex:1, fontSize:14, fontFamily:FB, color:C.text, background:"transparent", padding:"2px 0" }} />
        {val.trim() && <button onClick={add} style={{ ...btn(color,"#fff",12), padding:"3px 10px", flexShrink:0 }}>Add</button>}
      </div>
    </div>
  );
}

// ── SCORE BAR ─────────────────────────────────────────────────────────────────
export function ScoreBar({ label, value, color=C.disc }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
        <span style={{ color:C.muted, fontFamily:FB }}>{label}</span>
        <span style={{ fontWeight:600, color:C.text, fontFamily:FB }}>{Number(value).toFixed(1)}/10</span>
      </div>
      <div style={{ height:5, borderRadius:3, background:C.border }}>
        <div style={{ height:"100%", width:`${Number(value)*10}%`, background:color, borderRadius:3, transition:"width 0.6s" }} />
      </div>
    </div>
  );
}

// ── SPINNER ───────────────────────────────────────────────────────────────────
export function Spinner({ color=C.disc, size=36 }) {
  return <div style={{ width:size, height:size, borderRadius:"50%", border:`3px solid ${color}`, borderTopColor:"transparent", animation:"spin 0.85s linear infinite" }} />;
}

// ── ERROR BOX ─────────────────────────────────────────────────────────────────
export function ErrorBox({ msg, onRetry }) {
  if (!msg) return null;
  return (
    <div style={{ ...card("14px 18px"), background:C.errBg, border:`1px solid ${C.err}25`, marginBottom:16 }}>
      <div style={{ fontSize:14, color:C.err, fontFamily:FB, marginBottom:onRetry?10:0 }}>{msg}</div>
      {onRetry && <button onClick={onRetry} style={btn(C.disc,"#fff",13)}>Try again</button>}
    </div>
  );
}

// ── WORKFLOW RAIL ─────────────────────────────────────────────────────────────
export function WorkflowRail({ currentStage, completedStages=[], businessName, userName, onNavigate }) {
  const stages = [
    { key:"discovery", label:"Discovery", subs:["Your situation","Skills & assets","Preferences","Your idea"] },
    { key:"creation",  label:"Creation" },
    { key:"hub",       label:"Dashboard" },
  ];
  const stageClr = { discovery:C.disc, creation:C.crea, hub:C.mgmt };

  return (
    <div style={{ width:220, background:C.dark, minHeight:"100vh", display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid #ffffff0f" }}>
        <div style={{ fontFamily:FH, fontWeight:700, fontSize:15, color:"#fff", letterSpacing:"-0.2px" }}>LaunchLab</div>
        {userName && <div style={{ fontSize:11, color:"#ffffff45", marginTop:3, fontFamily:FB }}>{userName}</div>}
      </div>
      <div style={{ flex:1, padding:"14px 10px" }}>
        {stages.map((stage, si) => {
          const active = stage.key === currentStage;
          const done   = completedStages.includes(stage.key);
          const locked = si > 0 && !completedStages.includes("discovery");
          return (
            <div key={stage.key} style={{ marginBottom:2 }}>
              <div onClick={()=>!locked && onNavigate?.(stage.key)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:8, background:active?"#ffffff12":"transparent", cursor:locked?"default":"pointer" }}>
                <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, fontFamily:FB, color:"#fff", background:done?C.ok:active?stageClr[stage.key]:"transparent", border:`1.5px solid ${done?C.ok:active?stageClr[stage.key]:"#ffffff20"}` }}>
                  {done?"+":si+1}
                </div>
                <span style={{ fontSize:13, fontWeight:active?500:400, color:locked?"#ffffff20":active?"#fff":"#ffffff65", fontFamily:FB }}>{stage.label}</span>
              </div>
            </div>
          );
        })}
      </div>
      {businessName && (
        <div style={{ padding:"12px 16px", borderTop:"1px solid #ffffff0f" }}>
          <div style={{ fontSize:10, color:"#ffffff25", textTransform:"uppercase", letterSpacing:"0.6px", fontFamily:FB, marginBottom:4 }}>Business</div>
          <div style={{ fontSize:13, color:"#ffffffcc", fontFamily:FB, lineHeight:1.4 }}>{businessName}</div>
        </div>
      )}
    </div>
  );
}

// ── GUIDE PANEL ───────────────────────────────────────────────────────────────
export function GuidePanel({ onClose, onSend, messages=[], businessId }) {
  const [input, setInput] = useState("");
  const send = () => { if(input.trim()) { onSend(input); setInput(""); }};
  return (
    <div style={{ position:"fixed", right:0, top:0, bottom:0, width:320, background:C.surface, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", zIndex:200, boxShadow:"-8px 0 32px #00000012" }}>
      <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:FH, fontWeight:600, fontSize:14 }}>Guide</span>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:18 }}>&#215;</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:10 }}>
        {messages.map((m,i) => (
          <div key={i} style={{ alignSelf:m.role==="user"?"flex-end":"flex-start", maxWidth:"85%", background:m.role==="user"?C.disc:C.bg, color:m.role==="user"?"#fff":C.text, padding:"10px 13px", borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px", fontSize:13, lineHeight:1.55, fontFamily:FB }}>
            {m.text}
          </div>
        ))}
      </div>
      <div style={{ padding:12, borderTop:`1px solid ${C.border}`, display:"flex", gap:8 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask anything..." style={{ ...inp(), flex:1, fontSize:13, padding:"9px 12px" }} />
        <button onClick={send} style={{ ...btn(C.disc,"#fff",13), padding:"9px 14px" }}>&#8594;</button>
      </div>
    </div>
  );
}

// ── DOWNLOAD BUTTON ───────────────────────────────────────────────────────────
export function DownloadBtn({ content, filename, label="Download", mimeType="text/html" }) {
  const download = () => {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };
  return <button onClick={download} style={btn(C.mgmt)}>{label}</button>;
}
