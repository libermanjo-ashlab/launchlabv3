import ContentLayout from "../components/ContentLayout";

const MUT  = "rgba(255,255,255,0.5)";
const DIM  = "rgba(255,255,255,0.25)";
const BD   = "rgba(255,255,255,0.08)";
const CARD = "rgba(255,255,255,0.04)";
const FH   = "'DM Sans','Helvetica Neue',sans-serif";
const GRAD = "linear-gradient(135deg,#C855EA,#4558D6)";

const PILLARS = [
  { title:"Coordinated agents", body:"Most tools give you one capability at a time — a chatbot, a content generator, a planner. EarnedLab connects them: the marketing agent's insights inform the management agent's actions, and both share context with the intelligence assistant. The platform works as a system, not a collection of tabs." },
  { title:"Built for founders, not operators", body:"Enterprise software assumes you have departments. EarnedLab assumes you don't. It handles research, planning, content, and operations in a single workspace — so a solo founder or small team can stay focused on building rather than managing tools." },
  { title:"Evidence first", body:"Agents explain what they found and why they're recommending it. You review before anything goes live. The management agent never implements without your approval. No black boxes." },
  { title:"Honest scope", body:"EarnedLab is built for small and solo businesses — consulting, services, agencies, freelancing, content, and education. It is not a CRM, an ERP, or a payroll system. We built it to do one category of work extremely well." },
];

const TIMELINE = [
  { year:"Discovery", desc:"Answer questions about your skills, time, and budget. EarnedLab matches you with business directions that fit your real constraints, not a generic list." },
  { year:"Validation", desc:"Run market analysis on your chosen direction. Understand the customer problem, competition, and realistic demand before committing." },
  { year:"Planning", desc:"Convert your validated idea into a launch plan: offer, pricing, milestones, and the first concrete tasks." },
  { year:"Marketing", desc:"The marketing agent generates insights, growth opportunities, and channel-specific content — on request or automatically." },
  { year:"Management", desc:"The management agent implements approved recommendations: updating your website, posting to social channels, and sending campaigns." },
  { year:"Operations", desc:"Track leads, revenue, tasks, and business health from a unified hub. Ask the intelligence assistant anything about your business." },
];

function Section({ children, style = {} }) {
  return <div style={{ marginBottom:64, ...style }}>{children}</div>;
}

function Pill({ label }) {
  return (
    <span style={{ display:"inline-block", background:"rgba(200,85,234,0.12)", border:"1px solid rgba(200,85,234,0.25)", borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600, color:"#C855EA", letterSpacing:"0.03em", marginBottom:16 }}>
      {label}
    </span>
  );
}

function H2({ children }) {
  return <h2 style={{ fontSize:"clamp(22px,3.5vw,32px)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.2, marginBottom:14 }}>{children}</h2>;
}

export default function About() {
  return (
    <ContentLayout
      title="About EarnedLab"
      description="An AI business operating system for entrepreneurs, solo founders, and small-business owners."
    >

      {/* mission */}
      <Section>
        <Pill label="Why we built this" />
        <H2>Business tools weren't built for people building businesses alone.</H2>
        <p style={{ fontSize:16, color:MUT, lineHeight:1.8, maxWidth:680, marginBottom:24 }}>
          Starting and running a small business means wearing every hat: strategy, marketing, content, operations, and customer development. Most available software is either built for enterprises with full departments, or it handles one narrow job and leaves everything else to you.
        </p>
        <p style={{ fontSize:16, color:MUT, lineHeight:1.8, maxWidth:680 }}>
          EarnedLab is designed for the person doing everything. It connects the workflows that are otherwise fragmented — idea discovery, validation, planning, marketing, content, and operations — and keeps them in sync through coordinated AI agents that share context and work together.
        </p>
      </Section>

      {/* pillars */}
      <Section>
        <Pill label="What makes it different" />
        <H2>Four things we got right from the start.</H2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20, marginTop:32 }}>
          {PILLARS.map(p => (
            <div key={p.title} style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:14, padding:"24px 24px 28px" }}>
              <h3 style={{ fontWeight:700, fontSize:15, letterSpacing:"-0.02em", marginBottom:12 }}>{p.title}</h3>
              <p style={{ fontSize:14, color:MUT, lineHeight:1.7 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* how it works overview */}
      <Section>
        <Pill label="The workflow" />
        <H2>From idea to operating business — in one place.</H2>
        <p style={{ fontSize:16, color:MUT, lineHeight:1.8, maxWidth:680, marginBottom:36 }}>
          EarnedLab walks you through each stage of building a business, connecting each step to the next so context isn't lost.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {TIMELINE.map((t, i) => (
            <div key={t.year} style={{ display:"flex", gap:24, paddingBottom:32, position:"relative" }}>
              <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:GRAD, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>
                  {i + 1}
                </div>
                {i < TIMELINE.length - 1 && (
                  <div style={{ width:1, flex:1, background:BD, marginTop:8 }} />
                )}
              </div>
              <div style={{ paddingTop:6, paddingBottom: i < TIMELINE.length - 1 ? 0 : 0 }}>
                <h3 style={{ fontWeight:700, fontSize:15, letterSpacing:"-0.02em", marginBottom:6 }}>{t.year}</h3>
                <p style={{ fontSize:14, color:MUT, lineHeight:1.7 }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* who it's for */}
      <Section>
        <Pill label="Who it's for" />
        <H2>Built for people building things on their own.</H2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12, marginTop:24 }}>
          {["Solo founders", "Freelancers", "Consultants", "Coaches", "Agency owners", "Service businesses", "Content creators", "Online educators"].map(w => (
            <div key={w} style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:10, padding:"14px 18px", fontSize:14, fontWeight:500, color:"rgba(255,255,255,0.8)" }}>
              {w}
            </div>
          ))}
        </div>
        <p style={{ marginTop:20, fontSize:14, color:DIM, lineHeight:1.6, maxWidth:560 }}>
          EarnedLab is not designed for enterprises, large teams, or businesses that require complex payroll, regulated accounting, or large-scale inventory management. It does one category of work — helping small and solo business operators start, grow, and manage — and does it well.
        </p>
      </Section>

      {/* contact */}
      <Section>
        <div style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:14, padding:"32px 32px" }}>
          <h3 style={{ fontWeight:700, fontSize:18, letterSpacing:"-0.02em", marginBottom:10 }}>Get in touch</h3>
          <p style={{ fontSize:15, color:MUT, lineHeight:1.7, marginBottom:20 }}>
            Questions about the platform, feedback, or partnership inquiries — reach us at{" "}
            <a href="mailto:support@earnedlab.com" style={{ color:"#C855EA", textDecoration:"none" }}>support@earnedlab.com</a>
          </p>
          <p style={{ fontSize:13, color:DIM }}>
            Response time is typically within 1 business day.
          </p>
        </div>
      </Section>

    </ContentLayout>
  );
}
