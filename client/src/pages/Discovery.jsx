import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../lib/store";
import { api } from "../lib/api";
import { C, FH, FB, btn, btnO, inp, lbl, hint, TagInput, WorkflowRail, ErrorBox } from "../components";

export default function Discovery() {
  const { intake, setIntake, user, setIdeas } = useStore();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const navigate = useNavigate();
  const up = (k,v) => setIntake({ [k]:v });

  const age     = user?.age || intake.age;
  const isMinor = age && age < 18;
  const isYoung = age && age >= 18 && age < 25;

  const canNext = [
    () => intake.location.trim().length > 2,
    () => true,
    () => !!intake.risk && intake.incomeGoal.trim().length > 0,
    () => true,
  ];

  const submit = async () => {
    setLoading(true); setError("");
    try {
      const { ideas } = await api.generate.ideas({ ...intake, age: age||null });
      setIdeas(ideas);
      navigate("/results");
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const stepLabels = ["Your situation","Skills & assets","Your goals","Your idea"];
  const maxBudget  = isMinor ? 500 : isYoung ? 5000 : 25000;

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:FB }}>
      <WorkflowRail currentStage="discovery" completedStages={[]} userName={user?.name}
        onNavigate={k => k==="hub"?null:navigate("/dashboard")} />

      <div style={{ flex:1, background:C.bg, display:"flex", flexDirection:"column" }}>
        {/* Progress */}
        <div style={{ height:52, background:C.surface, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", padding:"0 28px", gap:20, flexShrink:0 }}>
          <div style={{ flex:1, display:"flex", gap:5 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ flex:1, height:4, borderRadius:2, background:i<step?C.ok:i===step?C.primary:C.border, transition:"background 0.3s" }} />
            ))}
          </div>
          <span style={{ fontSize:12, color:C.muted, flexShrink:0, fontFamily:FB }}>Step {step+1} of 4 — {stepLabels[step]}</span>
        </div>

        {/* Age context banner for minors */}
        {isMinor && (
          <div style={{ background:`${C.primary}10`, borderBottom:`1px solid ${C.primary}20`, padding:"10px 28px", fontSize:12, color:C.primary, fontFamily:FB }}>
            Setup is tailored for your situation — no LLC or business bank account required. You can start making money without any of that.
          </div>
        )}

        <div style={{ flex:1, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"48px 24px 80px" }}>
          <div style={{ width:"100%", maxWidth:540 }}>

            {step===0 && (
              <>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:26, letterSpacing:"-0.04em", marginBottom:10 }}>Tell us about your situation</div>
                <p style={{ color:C.muted, fontSize:15, marginBottom:36, lineHeight:1.7 }}>
                  This determines which businesses actually fit your life. The more specific you are, the better the suggestions.
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
                  <div>
                    <label style={lbl}>Where are you located?</label>
                    <input value={intake.location} onChange={e=>up("location",e.target.value)} placeholder="City, State — e.g. Austin, TX" style={inp()} />
                    <p style={hint}>Used to find local demand, nearby competition, and area-specific opportunities.</p>
                  </div>
                  <div>
                    <label style={lbl}>Hours available per week: <strong style={{ color:C.primary }}>{intake.hours} hrs</strong></label>
                    <input type="range" min={2} max={40} value={intake.hours} onChange={e=>up("hours",+e.target.value)} style={{ width:"100%", accentColor:C.primary }} />
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.muted, marginTop:4 }}>
                      <span>2 hrs (minimal)</span><span>40 hrs (full commitment)</span>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Starting budget: <strong style={{ color:C.primary }}>${Number(intake.budget).toLocaleString()}</strong></label>
                    <input type="range" min={0} max={maxBudget} step={isMinor?10:100} value={Math.min(intake.budget,maxBudget)} onChange={e=>up("budget",+e.target.value)} style={{ width:"100%", accentColor:C.primary }} />
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.muted, marginTop:4 }}>
                      <span>$0</span><span>${maxBudget.toLocaleString()}</span>
                    </div>
                    {isMinor && <p style={hint}>Most businesses for your age group start with under $100. Budget is not a barrier.</p>}
                  </div>
                </div>
              </>
            )}

            {step===1 && (
              <>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:26, letterSpacing:"-0.04em", marginBottom:10 }}>What do you bring to the table?</div>
                <p style={{ color:C.muted, fontSize:15, marginBottom:36, lineHeight:1.7 }}>
                  {isMinor
                    ? "List anything you're good at — gaming, drawing, school subjects, languages, music, sports, social media. Everything counts."
                    : "Be specific — years of experience, certifications, and physical assets you own all directly affect which businesses make sense."}
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
                  <div>
                    <label style={lbl}>Skills, experience, and knowledge</label>
                    <p style={hint}>Press Enter after each one to add it.</p>
                    <div style={{ marginTop:8 }}>
                      <TagInput tags={intake.skills} onChange={v=>up("skills",v)}
                        placeholder={isMinor?"e.g. Math tutoring, Video editing, Spanish...":"e.g. Licensed electrician, 8 years in sales, Fluent Mandarin..."}
                        color={C.primary} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Things you already own {isMinor?"(phone, laptop, equipment)":"(equipment, vehicles, tools)"}</label>
                    <p style={hint}>Anything that lowers your startup costs or gives you an advantage. Press Enter after each.</p>
                    <div style={{ marginTop:8 }}>
                      <TagInput tags={intake.assets} onChange={v=>up("assets",v)}
                        placeholder={isMinor?"e.g. iPhone, Laptop, Ring light...":"e.g. Cargo van, Power tools, Commercial kitchen access..."}
                        color={C.primary} />
                    </div>
                  </div>
                  {!isMinor && (
                    <div>
                      <label style={lbl}>Business experience</label>
                      {[
                        ["yes","I have run or operated a business before"],
                        ["some","I have done freelance or consulting work"],
                        ["no","This would be my first time"],
                      ].map(([val,label]) => (
                        <div key={val} onClick={()=>up("businessExperience",val)} style={{ marginBottom:8, padding:"12px 16px", borderRadius:10, border:`1.5px solid ${intake.businessExperience===val?C.primary:C.border}`, background:intake.businessExperience===val?C.primaryBg:C.surface, cursor:"pointer", display:"flex", gap:12, alignItems:"center", transition:"all 0.12s" }}>
                          <div style={{ width:15, height:15, borderRadius:"50%", border:`2px solid ${intake.businessExperience===val?C.primary:C.border}`, background:intake.businessExperience===val?C.primary:"transparent", flexShrink:0 }} />
                          <span style={{ fontSize:14, color:intake.businessExperience===val?C.primary:C.text, fontWeight:intake.businessExperience===val?500:400, fontFamily:FB }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {step===2 && (
              <>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:26, letterSpacing:"-0.04em", marginBottom:10 }}>What does success look like?</div>
                <p style={{ color:C.muted, fontSize:15, marginBottom:36, lineHeight:1.7 }}>
                  Being specific about your goal helps us find businesses that can realistically get you there.
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
                  <div>
                    <label style={lbl}>Risk tolerance</label>
                    {[
                      ["low", "Low — I want stable, predictable income"],
                      ["medium", "Medium — some uncertainty is fine if the potential is real"],
                      ["high", "High — I will take on more risk for a higher ceiling"],
                    ].map(([val,label]) => (
                      <div key={val} onClick={()=>up("risk",val)} style={{ marginBottom:8, padding:"12px 16px", borderRadius:10, border:`1.5px solid ${intake.risk===val?C.primary:C.border}`, background:intake.risk===val?C.primaryBg:C.surface, cursor:"pointer", display:"flex", gap:12, alignItems:"center", transition:"all 0.12s" }}>
                        <div style={{ width:15, height:15, borderRadius:"50%", border:`2px solid ${intake.risk===val?C.primary:C.border}`, background:intake.risk===val?C.primary:"transparent", flexShrink:0 }} />
                        <span style={{ fontSize:14, color:intake.risk===val?C.primary:C.text, fontWeight:intake.risk===val?500:400, fontFamily:FB }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label style={lbl}>Income goal — be as specific as you want</label>
                    <input value={intake.incomeGoal} onChange={e=>up("incomeGoal",e.target.value)}
                      placeholder={isMinor?"e.g. $200/month for spending money":"e.g. $3,000/month within 6 months, or replace my $60k salary"}
                      style={inp()} />
                  </div>
                </div>
              </>
            )}

            {step===3 && (
              <>
                <div style={{ fontFamily:FH, fontWeight:700, fontSize:26, letterSpacing:"-0.04em", marginBottom:10 }}>Do you already have an idea?</div>
                <p style={{ color:C.muted, fontSize:15, marginBottom:36, lineHeight:1.7 }}>
                  Completely optional. If you have something in mind, we will analyze it alongside our suggestions. If not, we generate five options from your profile.
                </p>
                <div>
                  <label style={lbl}>Your idea (optional)</label>
                  <textarea value={intake.ownIdea} onChange={e=>up("ownIdea",e.target.value)}
                    placeholder="Describe the business you are thinking about. The more detail you give, the more accurate our analysis will be."
                    rows={5} style={{ ...inp(), resize:"vertical", lineHeight:1.65, padding:"12px 14px" }} />
                </div>
              </>
            )}

            {error && <ErrorBox msg={error} />}

            <div style={{ display:"flex", justifyContent:"space-between", marginTop:40 }}>
              <button onClick={()=>step>0?setStep(s=>s-1):navigate("/dashboard")} style={btnO(C.muted)}>Back</button>
              {step<3
                ? <button onClick={()=>canNext[step]()&&setStep(s=>s+1)} style={btn(canNext[step]()?C.primary:"#CBD5E1")}>Continue</button>
                : <button onClick={submit} disabled={loading} style={btn(loading?"#9CA3AF":C.primary)}>
                    {loading?"Generating ideas...":"Find my business"}
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
