import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useStore from "../lib/store";
import { api } from "../lib/api";
import { C, FH, FB, btn, btnO, inp, lbl, card, WorkflowRail, ErrorBox, DownloadBtn, Spinner } from "../components";

const CAT_CLR = { Legal:C.primary, Financial:"#059669", Digital:C.accent, Operations:"#D97706", Marketing:"#DB2777" };

export default function Creation() {
  const { id: businessId } = useParams();
  const { user, tasks:allTasks, setTasks, updateTask, addTask, removeTask, businesses } = useStore();
  const [business,     setBusiness]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [taskError,    setTaskError]    = useState("");
  const [openTaskId,   setOpenTaskId]   = useState(null);
  const [runningIds,   setRunningIds]   = useState(new Set());
  const [editingOut,   setEditingOut]   = useState(null);
  const [addingTask,   setAddingTask]   = useState(false);
  const [newTaskForm,  setNewTaskForm]  = useState({ name:"", category:"Operations", description:"" });
  const [outputs,      setOutputs]      = useState({});
  const navigate = useNavigate();

  const tasks    = allTasks[businessId]||[];
  const done     = tasks.filter(t=>t.status==="done").length;
  const pct      = tasks.length ? Math.round(done/tasks.length*100) : 0;
  const age      = user?.age;
  const isMinor  = age && age < 18;

  useEffect(()=>{
    Promise.all([
      api.businesses.get(businessId),
      api.tasks.list(businessId),
    ]).then(([{business:b},{tasks:t}])=>{
      setBusiness(b);
      setTasks(businessId,t);
      const outs={};
      t.forEach(task=>{ if(task.outputData) outs[task.id]=task.outputData; });
      setOutputs(outs);
    }).catch(e=>setTaskError(e.message)).finally(()=>setLoading(false));
  },[businessId]);

  const runTask = async taskId => {
    setRunningIds(p=>new Set([...p,taskId])); setTaskError("");
    try {
      const {task} = await api.tasks.run(taskId);
      updateTask(businessId,taskId,{status:"done",outputData:task.outputData});
      if(task.outputData) setOutputs(p=>({...p,[taskId]:task.outputData}));
    } catch(e) {
      setTaskError(e.message);
      updateTask(businessId,taskId,{status:"pending"});
    } finally { setRunningIds(p=>{const n=new Set(p);n.delete(taskId);return n;}); }
  };

  const setMode = async (taskId,mode) => {
    updateTask(businessId,taskId,{mode});
    await api.tasks.update(taskId,{mode}).catch(()=>{});
  };

  const advanceGuided = async (taskId,task) => {
    const cur=(task.guidedStep||0);
    const len=(task.steps?.length||0);
    if(cur>=len-1){ updateTask(businessId,taskId,{status:"done"}); await api.tasks.update(taskId,{status:"done"}).catch(()=>{}); }
    else { updateTask(businessId,taskId,{guidedStep:cur+1}); }
  };

  const undoTask = async taskId => {
    updateTask(businessId,taskId,{status:"pending",guidedStep:0});
    setOutputs(p=>{const n={...p};delete n[taskId];return n;});
    await api.tasks.update(taskId,{status:"pending",outputData:null}).catch(()=>{});
  };

  const deleteTask = async taskId => {
    removeTask(businessId,taskId);
    if(openTaskId===taskId) setOpenTaskId(null);
    await api.tasks.delete(taskId).catch(()=>{});
  };

  const addCustomTask = async () => {
    if(!newTaskForm.name.trim()) return;
    const {task} = await api.tasks.create(businessId,{...newTaskForm,canAutomate:false,steps:[],mode:"manual"});
    addTask(businessId,task);
    setNewTaskForm({name:"",category:"Operations",description:""});
    setAddingTask(false);
  };

  const saveOutput = async (taskId,fields) => {
    const updated={...outputs[taskId],fields};
    setOutputs(p=>({...p,[taskId]:updated}));
    await api.tasks.update(taskId,{outputData:updated}).catch(()=>{});
    setEditingOut(null);
  };


  const goLive = async () => {
    await api.businesses.update(businessId,{status:"live"}).catch(()=>{});
    navigate(`/hub/${businessId}`);
  };

  if(loading) return (
    <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}><Spinner/><p style={{color:C.muted,marginTop:16,fontFamily:FB}}>Building your setup plan...</p></div>
    </div>
  );

  const idea = (()=>{try{return JSON.parse(business?.ideaData||"{}");}catch{return {};}})();

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:FB}}>
      <WorkflowRail currentStage="creation" completedStages={["discovery"]} userName={user?.name} businessName={business?.name}
        onNavigate={k=>{if(k==="discovery")navigate("/results");else if(k==="hub")navigate(`/hub/${businessId}`);}} />

      <div style={{flex:1,background:C.bg,display:"flex",flexDirection:"column"}}>
        <div style={{height:52,background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",flexShrink:0}}>
          <span style={{fontFamily:FH,fontWeight:600,fontSize:15}}>{business?.name||"Setup"}</span>
          <button onClick={goLive} style={btn(pct===100?C.ok:C.primary)}>{pct===100?"Open dashboard":"Go to dashboard"}</button>
        </div>

        {isMinor && (
          <div style={{background:`${C.accent}12`,borderBottom:`1px solid ${C.accent}20`,padding:"10px 28px",fontSize:12,color:C.accent,fontFamily:FB}}>
            Tasks have been selected for your situation. Legal registration steps are marked as optional — you can start earning without them.
          </div>
        )}

        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto",padding:"28px 28px 100px"}}>
            <ErrorBox msg={taskError} onRetry={()=>setTaskError("")}/>

            {/* Progress */}
            <div style={{...card("14px 20px"),marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:13,fontWeight:500}}>{done} of {tasks.length} tasks complete</span>
                <span style={{fontFamily:FH,fontWeight:700,fontSize:18,color:C.primary}}>{pct}%</span>
              </div>
              <div style={{height:6,borderRadius:4,background:C.border}}>
                <div style={{height:"100%",width:`${pct}%`,background:C.grad,borderRadius:4,transition:"width 0.5s"}}/>
              </div>
              {pct<100 && <p style={{fontSize:12,color:C.muted,marginTop:8,fontFamily:FB}}>You can open the dashboard at any time — setup tasks can be completed as you go.</p>}
            </div>

            {/* Tasks */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {tasks.map(task=>{
                const isOpen    = openTaskId===task.id;
                const isRunning = runningIds.has(task.id);
                const cc        = CAT_CLR[task.category]??C.muted;
                const out       = outputs[task.id];
                const guidedStep= task.guidedStep||0;
                const statusClr = task.status==="done"?C.ok:isRunning?C.primary:C.muted;
                const statusBg  = task.status==="done"?C.okBg:isRunning?C.primaryBg:C.bg;
                // Hide LLC/bank for minors unless they want to expand
                const isLegalTask = /llc|incorporat|register|legal entity|business bank|checking account/i.test(task.name);
                const showMinorNote = isMinor && isLegalTask;

                return (
                  <div key={task.id} style={{...card(),border:`1px solid ${isOpen?C.primary:C.border}`,padding:"14px 18px",transition:"border-color 0.15s",opacity:showMinorNote?0.7:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div onClick={()=>setOpenTaskId(isOpen?null:task.id)} style={{width:32,height:32,borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:statusBg,border:`1.5px solid ${statusClr}40`,color:statusClr,fontSize:14,fontWeight:700,cursor:"pointer"}}>
                        {task.status==="done"?"+":isRunning?"...":""}
                      </div>
                      <div onClick={()=>setOpenTaskId(isOpen?null:task.id)} style={{flex:1,minWidth:0,cursor:"pointer"}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:3}}>
                          <span style={{fontSize:14,fontWeight:500,color:task.status==="done"?C.muted:C.text,textDecoration:task.status==="done"?"line-through":"none"}}>{task.name}</span>
                          <span style={{background:cc+"18",color:cc,fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.04em"}}>{task.category}</span>
                          {showMinorNote && <span style={{background:"#FEF3C7",color:"#92400E",fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.04em"}}>Optional for now</span>}
                        </div>
                        <div style={{fontSize:11,color:C.muted}}>{task.estimatedTime} &middot; {task.estimatedCost}</div>
                      </div>
                      <span style={{background:task.mode==="auto"?C.okBg:task.mode==="guided"?C.primaryBg:C.bg,color:task.mode==="auto"?C.ok:task.mode==="guided"?C.primary:C.muted,fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.04em"}}>{task.mode}</span>
                      <span style={{background:statusBg,color:statusClr,fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.04em"}}>{task.status==="done"?"done":isRunning?"running":"pending"}</span>
                      <button onClick={()=>setOpenTaskId(isOpen?null:task.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:12,fontFamily:FB}}>{isOpen?"v":">"}</button>
                      <button onClick={()=>deleteTask(task.id)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,cursor:"pointer",color:C.muted,fontSize:13,padding:"2px 7px"}} title="Remove task">&#215;</button>
                    </div>

                    {isOpen && (
                      <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
                        <p style={{fontSize:13,color:C.muted,lineHeight:1.75,marginBottom:18,fontFamily:FB}}>{task.description}</p>
                        {task.parentNote && <div style={{background:"#FEF3C7",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#92400E",marginBottom:16,lineHeight:1.6,fontFamily:FB}}>{task.parentNote}</div>}

                        {task.status!=="done" && (
                          <div style={{marginBottom:18}}>
                            <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>How to handle this task</div>
                            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                              {["auto","guided","manual"].map(m=>{
                                const active=task.mode===m;
                                const mClr=m==="auto"?C.ok:m==="guided"?C.primary:C.muted;
                                const mBg =m==="auto"?C.okBg:m==="guided"?C.primaryBg:C.bg;
                                return (
                                  <button key={m} onClick={()=>setMode(task.id,m)} style={{background:active?mBg:"transparent",color:active?mClr:C.muted,border:`1.5px solid ${active?mClr:C.border}`,borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:active?500:400,cursor:"pointer",fontFamily:FB,transition:"all 0.12s"}}>
                                    {m==="auto"?"Automatic":m==="guided"?"Step-by-step":"I will handle it"}
                                  </button>
                                );
                              })}
                            </div>
                            <p style={{fontSize:12,color:C.muted,marginTop:8,lineHeight:1.6,fontFamily:FB}}>
                              {task.mode==="auto"?"EarnedLab completes this automatically and shows you the output to review."
                              :task.mode==="guided"?"Each step opens the relevant page directly. You stay in control of what happens."
                              :"Complete this yourself and mark it done when finished."}
                            </p>
                          </div>
                        )}

                        {/* Guided steps */}
                        {task.mode==="guided" && task.steps?.length>0 && task.status!=="done" && (
                          <div style={{...card("14px 16px"),background:C.primaryBg,border:`1px solid ${C.primary}15`,marginBottom:16}}>
                            <div style={{fontSize:11,fontWeight:600,color:C.primary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:12}}>Steps</div>
                            {task.steps.map((s,si)=>{
                              const stepText=typeof s==="string"?s:(s?.text||"");
                              const stepUrl =typeof s==="object"&&s?.url?s.url:null;
                              const isDone=si<guidedStep; const isActive=si===guidedStep;
                              return (
                                <div key={si} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12,opacity:si>guidedStep?0.35:1}}>
                                  <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:isDone?C.ok:isActive?C.primary:"transparent",border:`2px solid ${isDone?C.ok:isActive?C.primary:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700,marginTop:1}}>
                                    {isDone?"+":si+1}
                                  </div>
                                  <div style={{flex:1}}>
                                    <div style={{fontSize:13,color:C.text,lineHeight:1.55}}>{stepText}</div>
                                    {stepUrl&&isActive&&(
                                      <a href={stepUrl} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:6,fontSize:12,color:C.primary,fontWeight:500,textDecoration:"none",background:C.primaryBg,border:`1px solid ${C.primary}25`,borderRadius:6,padding:"4px 10px"}}>Open page &#8599;</a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Action buttons */}
                        {task.status!=="done" && (
                          <div style={{display:"flex",gap:10}}>
                            {task.mode==="auto"&&<button onClick={()=>runTask(task.id)} disabled={isRunning} style={btn(isRunning?"#9CA3AF":C.accent)}>{isRunning?"Running — this may take a moment...":"Run automatically"}</button>}
                            {task.mode==="guided"&&<button onClick={()=>task.steps?.length>0?advanceGuided(task.id,task):updateTask(businessId,task.id,{status:"done"})} style={btn(C.primary)}>{!task.steps?.length?"Mark as done":guidedStep===0?"Start":guidedStep>=(task.steps?.length??1)-1?"Mark as done":"Next step"}</button>}
                            {task.mode==="manual"&&<button onClick={async()=>{updateTask(businessId,task.id,{status:"done"});await api.tasks.update(task.id,{status:"done"}).catch(()=>{});}} style={btn(C.ok)}>Mark as done</button>}
                          </div>
                        )}

                        {/* Output panel */}
                        {task.status==="done"&&out&&(
                          <div style={{...card("14px 16px"),background:C.okBg,border:`1px solid ${C.ok}20`,marginTop:16}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                              <div style={{fontSize:11,fontWeight:600,color:C.ok,textTransform:"uppercase",letterSpacing:"0.5px"}}>Output</div>
                              <div style={{display:"flex",gap:8}}>
                                {out.downloadAvailable&&out.content&&<DownloadBtn content={out.content} filename={`${business?.name?.replace(/\s+/g,"-").toLowerCase()||"output"}-${out.type||"document"}.html`} label="Download"/>}
                                <button onClick={()=>setEditingOut(editingOut===task.id?null:task.id)} style={{...btnO(editingOut===task.id?C.primary:C.muted,11),padding:"4px 10px"}}>{editingOut===task.id?"Save":"Edit"}</button>
                              </div>
                            </div>
                            {(out.fields||[]).map((field,fi)=>(
                              <div key={fi} style={{marginBottom:10}}>
                                <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:4}}>{field.label}</div>
                                {editingOut===task.id
                                  ?<input value={field.value} onChange={e=>{const v=e.target.value;setOutputs(p=>({...p,[task.id]:{...p[task.id],fields:p[task.id].fields.map((f,i)=>i===fi?{...f,value:v}:f)}}));}} style={{...inp(),fontSize:13,padding:"7px 10px"}}/>
                                  :<div style={{fontSize:13,color:C.text,fontWeight:500,lineHeight:1.5}}>
                                    {field.value?.startsWith?.("http")?<a href={field.value} target="_blank" rel="noopener noreferrer" style={{color:C.primary}}>{field.value} &#8599;</a>:field.value}
                                  </div>
                                }
                              </div>
                            ))}
                            {editingOut===task.id&&<button onClick={()=>saveOutput(task.id,outputs[task.id].fields)} style={{...btn(C.primary,"#fff",12),marginTop:8}}>Save changes</button>}
                          </div>
                        )}

                        {task.status==="done"&&(
                          <div style={{display:"flex",alignItems:"center",gap:12,marginTop:out?8:0}}>
                            <span style={{fontSize:13,color:C.ok,fontWeight:500}}>Completed</span>
                            <button onClick={()=>undoTask(task.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:13,textDecoration:"underline"}}>Undo</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add task */}
            {addingTask?(
              <div style={{...card(),border:`2px dashed ${C.border}`,marginTop:10}}>
                <div style={{fontFamily:FH,fontWeight:600,fontSize:14,marginBottom:14}}>Add a task</div>
                <div style={{marginBottom:12}}><label style={lbl}>Task name</label><input value={newTaskForm.name} onChange={e=>setNewTaskForm(p=>({...p,name:e.target.value}))} placeholder="What needs to be done?" style={inp()}/></div>
                <div style={{marginBottom:12}}>
                  <label style={lbl}>Category</label>
                  <select value={newTaskForm.category} onChange={e=>setNewTaskForm(p=>({...p,category:e.target.value}))} style={{...inp(),appearance:"none"}}>
                    {["Legal","Financial","Digital","Operations","Marketing"].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:16}}><label style={lbl}>Description (optional)</label><textarea value={newTaskForm.description} onChange={e=>setNewTaskForm(p=>({...p,description:e.target.value}))} rows={2} style={{...inp(),resize:"vertical",lineHeight:1.55}}/></div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={addCustomTask} disabled={!newTaskForm.name.trim()} style={btn(newTaskForm.name.trim()?C.primary:"#CBD5E1")}>Add task</button>
                  <button onClick={()=>setAddingTask(false)} style={btnO(C.muted)}>Cancel</button>
                </div>
              </div>
            ):(
              <button onClick={()=>setAddingTask(true)} style={{...btnO(C.muted,13),marginTop:10,width:"100%",textAlign:"center",borderStyle:"dashed"}}>+ Add custom task</button>
            )}
          </div>

          {/* Sidebar */}
          <div style={{width:240,background:C.surface,borderLeft:`1px solid ${C.border}`,padding:"22px 18px",overflowY:"auto",flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:18}}>Your business</div>
            {business&&(
              <>
                <div style={{fontFamily:FH,fontWeight:700,fontSize:16,color:C.text,marginBottom:6,lineHeight:1.3}}>{business.name}</div>
                <div style={{fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6}}>{idea.tagline}</div>
                {[["Revenue target",idea.revenue],["Startup cost",idea.startupCost],["First revenue",idea.timeToFirstRevenue],["Location",business.location]].map(([label,val])=>(
                  <div key={label} style={{marginBottom:14}}>
                    <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:3}}>{label}</div>
                    <div style={{fontSize:13,color:C.text}}>{val}</div>
                  </div>
                ))}
              </>
            )}
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:4,display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={()=>navigate("/results")} style={{...btnO(C.primary,12),width:"100%",textAlign:"center"}}>Change idea</button>
              <button onClick={goLive} style={{...btn(pct===100?C.ok:C.primary,"#fff",12),width:"100%",textAlign:"center"}}>{pct===100?"Open dashboard":"Go to dashboard"}</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
