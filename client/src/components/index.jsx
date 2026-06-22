import { useState, Component } from "react";
import * as Sentry from "@sentry/react";

const SUPPORT = "support@earnedlab.com";

export const C = {
  bg:"#F8F7F5", surface:"#FFFFFF", dark:"#0A0A0F", border:"#E2E0DB",
  text:"#18181B", muted:"#71717A", subtle:"#A1A1AA",
  primary:"#7C3AED", primaryBg:"#F5F3FF",
  accent:"#0891B2",  accentBg:"#ECFEFF",
  ok:"#059669", okBg:"#ECFDF5", warn:"#D97706", warnBg:"#FFFBEB",
  err:"#DC2626", errBg:"#FEF2F2",
  grad:"linear-gradient(135deg,#7C3AED,#0891B2)",
};
export const FH = "'Space Grotesk','Helvetica Neue',sans-serif";
export const FB = "'DM Sans','Helvetica Neue',sans-serif";

export const card  = (p="18px 20px",e={}) => ({ background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:p,boxShadow:"0 1px 3px rgba(0,0,0,0.05)",...e });
export const btn   = (bg,fg="#fff",sz=14) => ({ background:bg,color:fg,border:"none",borderRadius:10,padding:"11px 22px",fontSize:sz,fontWeight:600,cursor:"pointer",fontFamily:FB,transition:"opacity 0.15s",letterSpacing:"-0.01em" });
export const btnO  = (clr,sz=13) => ({ background:"transparent",color:clr,border:`1.5px solid ${clr}30`,borderRadius:10,padding:"9px 18px",fontSize:sz,fontWeight:500,cursor:"pointer",fontFamily:FB });
export const inp   = (e={}) => ({ width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:14,fontFamily:FB,color:C.text,background:C.surface,outline:"none",boxSizing:"border-box",...e });
export const lbl   = { fontSize:12,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:7,fontFamily:FB };
export const hint  = { fontSize:12,color:C.muted,marginTop:5,fontFamily:FB,lineHeight:1.55 };

// EarnedLab logo mark — mirrors the provided brand asset (large square + 4 bars)
export function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0"  width="29" height="23" rx="2" fill="#9980C8"/>
      <rect x="0" y="27" width="5"  height="29" rx="1.5" fill="#8B6AC8"/>
      <rect x="9" y="27" width="7"  height="29" rx="1.5" fill="#7655C0"/>
      <rect x="21" y="27" width="13" height="29" rx="1.5" fill="#6468B8"/>
      <rect x="38" y="27" width="18" height="29" rx="1.5" fill="#5060B0"/>
    </svg>
  );
}

export function Spinner({ color=C.primary, size=32 }) {
  return <div style={{ width:size,height:size,borderRadius:"50%",border:`3px solid ${color}25`,borderTopColor:color,animation:"spin 0.8s linear infinite",flexShrink:0 }} />;
}

export function ScoreBar({ label, value, color=C.primary }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}>
        <span style={{ color:C.muted,fontFamily:FB }}>{label}</span>
        <span style={{ fontWeight:600,color:C.text,fontFamily:FB }}>{Number(value).toFixed(1)}/10</span>
      </div>
      <div style={{ height:5,borderRadius:3,background:C.border }}>
        <div style={{ height:"100%",width:`${Number(value)*10}%`,background:color,borderRadius:3,transition:"width 0.5s" }} />
      </div>
    </div>
  );
}

export function TagInput({ tags=[], onChange, placeholder="Type and press Enter", color=C.primary }) {
  const [val,setVal] = useState("");
  const add = () => { const v=val.trim(); if(v&&!tags.includes(v)) onChange([...tags,v]); setVal(""); };
  return (
    <div style={{ border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",background:C.surface,minHeight:48 }}>
      {tags.length>0 && (
        <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:8 }}>
          {tags.map(t=>(
            <span key={t} style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px 4px 12px",borderRadius:20,background:color+"18",color,fontSize:13,fontFamily:FB }}>
              {t}<span onClick={()=>onChange(tags.filter(x=>x!==t))} style={{ cursor:"pointer",fontSize:14,lineHeight:1,opacity:0.5,fontWeight:600 }}>&#215;</span>
            </span>
          ))}
        </div>
      )}
      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
        <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();add();}}} placeholder={placeholder}
          style={{ border:"none",outline:"none",flex:1,fontSize:14,fontFamily:FB,color:C.text,background:"transparent",padding:"2px 0" }} />
        {val.trim() && <button onClick={add} style={{ ...btn(color,"#fff",12),padding:"4px 12px",flexShrink:0 }}>Add</button>}
      </div>
    </div>
  );
}

export function ErrorBox({ msg, onRetry }) {
  if (!msg) return null;
  const isServerErr = msg.includes("went wrong") || msg.includes("500") || msg.includes("server");
  return (
    <div style={{ ...card("12px 16px"),background:C.errBg,border:`1px solid ${C.err}25`,marginBottom:16 }}>
      <div style={{ fontSize:13,color:C.err,fontFamily:FB,marginBottom:(onRetry||isServerErr)?8:0,lineHeight:1.5 }}>{msg}</div>
      {isServerErr && (
        <div style={{ fontSize:12,color:C.err,opacity:0.7,fontFamily:FB,marginBottom:onRetry?8:0 }}>
          If this keeps happening, email{" "}
          <a href={`mailto:${SUPPORT}`} style={{ color:C.err,textDecoration:"underline" }}>{SUPPORT}</a>
        </div>
      )}
      {onRetry && <button onClick={onRetry} style={btn(C.err,"#fff",12)}>Try again</button>}
    </div>
  );
}

// Full-page error boundary — wraps the entire app via Sentry.ErrorBoundary
export function AppErrorBoundary({ children }) {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return <NativeErrorBoundary>{children}</NativeErrorBoundary>;
  }
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      {children}
    </Sentry.ErrorBoundary>
  );
}

class NativeErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("[ErrorBoundary]", error, info); }
  render() {
    if (this.state.hasError) return <ErrorFallback error={this.state.error} resetError={() => this.setState({ hasError:false, error:null })} />;
    return this.props.children;
  }
}

function ErrorFallback({ error, resetError }) {
  return (
    <div style={{ minHeight:"100vh", background:"#0A0A0F", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:FB }}>
      <div style={{ maxWidth:480, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:20 }}>⚠️</div>
        <h1 style={{ fontFamily:FH, fontWeight:700, fontSize:24, color:"#fff", letterSpacing:"-0.03em", marginBottom:12 }}>Something went wrong</h1>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:1.75, marginBottom:28 }}>
          EarnedLab hit an unexpected error. We've been notified and are looking into it.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"center" }}>
          {resetError && (
            <button onClick={resetError} style={{ background:"#fff", color:"#0A0A0F", border:"none", borderRadius:10, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:FB }}>
              Try again
            </button>
          )}
          <a href="/dashboard" style={{ fontSize:13, color:"rgba(255,255,255,0.4)", fontFamily:FB, textDecoration:"underline" }}>Go to dashboard</a>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.25)", marginTop:8, lineHeight:1.6 }}>
            Still stuck? Email us at{" "}
            <a href={`mailto:${SUPPORT}`} style={{ color:"rgba(255,255,255,0.4)", textDecoration:"underline" }}>{SUPPORT}</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export function WorkflowRail({ currentStage, completedStages=[], businessName, userName, onNavigate }) {
  const stages = [
    { key:"discovery", label:"Discovery", subs:["Your situation","Skills & assets","Goals","Your idea"] },
    { key:"creation",  label:"Setup" },
    { key:"hub",       label:"Dashboard" },
  ];
  const stageColor = { discovery:C.primary, creation:C.accent, hub:C.ok };
  return (
    <div style={{ width:220,background:C.dark,minHeight:"100vh",display:"flex",flexDirection:"column",flexShrink:0 }}>
      <div style={{ padding:"22px 20px 16px",borderBottom:"1px solid #ffffff0a" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
          <Logo size={26}/>
          <span style={{ fontFamily:FH,fontWeight:700,fontSize:16,background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.03em" }}>EarnedLab</span>
        </div>
        {userName && <div style={{ fontSize:11,color:"#ffffff40",fontFamily:FB }}>{userName}</div>}
      </div>
      <div style={{ flex:1,padding:"14px 10px" }}>
        {stages.map((stage,si)=>{
          const active = stage.key===currentStage;
          const done   = completedStages.includes(stage.key);
          const locked = si>0 && !completedStages.includes("discovery");
          return (
            <div key={stage.key} style={{ marginBottom:2 }}>
              <div onClick={()=>!locked&&onNavigate?.(stage.key)}
                style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,background:active?"#ffffff12":"transparent",cursor:locked?"default":"pointer",borderLeft:active?`3px solid ${stageColor[stage.key]}`:"3px solid transparent",transition:"all 0.12s" }}>
                <div style={{ width:22,height:22,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,fontFamily:FB,color:"#fff",background:done?C.ok:active?stageColor[stage.key]:"transparent",border:`1.5px solid ${done?C.ok:active?stageColor[stage.key]:"#ffffff20"}` }}>
                  {done?"+":(si+1)}
                </div>
                <span style={{ fontSize:13,fontWeight:active?600:400,color:locked?"#ffffff30":active?"#fff":"#ffffffa0",fontFamily:FB }}>{stage.label}</span>
              </div>
              {active && stage.subs && ["discovery"].includes(currentStage) && (
                <div style={{ marginLeft:35,marginTop:2,marginBottom:4 }}>
                  {stage.subs.map((sub,si2)=>(
                    <div key={si2} style={{ display:"flex",alignItems:"center",gap:8,padding:"4px 8px",borderRadius:6 }}>
                      <div style={{ width:4,height:4,borderRadius:"50%",background:"#ffffff60",flexShrink:0 }}/>
                      <span style={{ fontSize:11,color:"#ffffffb0",fontFamily:FB }}>{sub}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {businessName && (
        <div style={{ padding:"12px 16px",borderTop:"1px solid #ffffff0a" }}>
          <div style={{ fontSize:10,color:"#ffffff25",textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:FB,marginBottom:3 }}>Active business</div>
          <div style={{ fontSize:13,color:"#ffffffcc",fontFamily:FB,lineHeight:1.4 }}>{businessName}</div>
        </div>
      )}
    </div>
  );
}

export function GuidePanel({ messages=[], onClose, onSend, businessId }) {
  const [input,setInput] = useState("");
  const send = () => { if(input.trim()){onSend(input);setInput("");} };
  return (
    <div style={{ position:"fixed",right:0,top:0,bottom:0,width:320,background:C.surface,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",zIndex:200,boxShadow:"-8px 0 32px rgba(0,0,0,0.08)" }}>
      <div style={{ padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontFamily:FH,fontWeight:600,fontSize:14 }}>Guide</span>
        <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:18 }}>&#215;</button>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10 }}>
        {messages.map((m,i)=>(
          <div key={i} style={{ alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"85%",background:m.role==="user"?C.primary:C.bg,color:m.role==="user"?"#fff":C.text,padding:"10px 13px",borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",fontSize:13,lineHeight:1.55,fontFamily:FB }}>
            {m.text}
          </div>
        ))}
      </div>
      <div style={{ padding:12,borderTop:`1px solid ${C.border}`,display:"flex",gap:8 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask anything..." style={{ ...inp(),flex:1,fontSize:13,padding:"9px 12px" }} />
        <button onClick={send} style={{ ...btn(C.primary,"#fff",13),padding:"9px 14px" }}>&#8594;</button>
      </div>
    </div>
  );
}

export function DownloadBtn({ content, filename, label="Download", mimeType="text/html" }) {
  const dl = () => {
    const blob = new Blob([content],{type:mimeType});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
  };
  return <button onClick={dl} style={btn(C.ok)}>{label}</button>;
}
