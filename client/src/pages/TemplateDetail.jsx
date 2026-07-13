import { Link } from "react-router-dom";
import ContentLayout from "../components/ContentLayout";
import { CheckCircle2, ArrowRight } from "lucide-react";

const MUT  = "rgba(255,255,255,0.5)";
const DIM  = "rgba(255,255,255,0.25)";
const BD   = "rgba(255,255,255,0.08)";
const CARD = "rgba(255,255,255,0.04)";
const GRAD = "linear-gradient(135deg,#C855EA,#4558D6)";

function StatRow({ stats }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:0, background:CARD, border:`1px solid ${BD}`, borderRadius:12, overflow:"hidden", marginBottom:36 }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{ flex:1, minWidth:160, padding:"18px 20px", borderRight: i < stats.length - 1 ? `1px solid ${BD}` : "none" }}>
          <div style={{ fontSize:11, fontWeight:700, color:DIM, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>{s.label}</div>
          <div style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.85)" }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:48 }}>
      <h2 style={{ fontSize:"clamp(18px,2.5vw,24px)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:20 }}>{title}</h2>
      {children}
    </div>
  );
}

function CheckList({ items }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
          <CheckCircle2 size={16} color="#C855EA" strokeWidth={2} style={{ flexShrink:0, marginTop:2 }} />
          <span style={{ fontSize:14, color:"rgba(255,255,255,0.8)", lineHeight:1.6 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function CardGrid({ items }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14 }}>
      {items.map(item => (
        <div key={item.title} style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:12, padding:"18px 20px" }}>
          <h3 style={{ fontWeight:700, fontSize:14, letterSpacing:"-0.01em", marginBottom:8 }}>{item.title}</h3>
          <p style={{ fontSize:13, color:MUT, lineHeight:1.65 }}>{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default function TemplateDetail({ templateId, title, tagline, intro, stats, who, whatEarnedLabDoes, planOutline, sampleTasks, marketingChannels, otherTemplates }) {
  return (
    <ContentLayout title={title} description={tagline}>

      <p style={{ fontSize:16, color:MUT, lineHeight:1.8, maxWidth:660, marginBottom:36 }}>{intro}</p>

      <StatRow stats={stats} />

      {/* who it's for */}
      <Section title="Who this is for">
        <CheckList items={who} />
      </Section>

      {/* what EarnedLab does */}
      <Section title="What EarnedLab sets up for you">
        <CardGrid items={whatEarnedLabDoes} />
      </Section>

      {/* plan outline */}
      <Section title="Sample launch plan outline">
        <div style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:14, padding:"24px 26px" }}>
          <p style={{ fontSize:12, fontWeight:700, color:DIM, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:20 }}>
            EarnedLab generates this automatically when you start with this template
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {planOutline.map((item, i) => (
              <div key={i} style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:GRAD, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", flexShrink:0 }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{item.milestone}</div>
                  <div style={{ fontSize:13, color:MUT, lineHeight:1.5 }}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* sample first tasks */}
      <Section title="Sample first-week tasks">
        <CheckList items={sampleTasks} />
      </Section>

      {/* marketing channels */}
      <Section title="Recommended marketing channels">
        <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
          {marketingChannels.map(ch => (
            <span key={ch} style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${BD}`, borderRadius:8, padding:"7px 14px", fontSize:13, color:"rgba(255,255,255,0.75)", fontWeight:500 }}>
              {ch}
            </span>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <div style={{ background:"rgba(200,85,234,0.06)", border:"1px solid rgba(200,85,234,0.2)", borderRadius:14, padding:"32px", textAlign:"center", marginBottom:48 }}>
        <h3 style={{ fontWeight:800, fontSize:"clamp(18px,3vw,26px)", letterSpacing:"-0.03em", marginBottom:12 }}>
          Start your {title.toLowerCase()} with EarnedLab
        </h3>
        <p style={{ fontSize:15, color:MUT, marginBottom:24 }}>7-day free trial. No credit card required.</p>
        <Link
          to={`/start?template=${templateId}`}
          style={{ display:"inline-flex", alignItems:"center", gap:8, background:GRAD, color:"#fff", textDecoration:"none", padding:"14px 32px", borderRadius:12, fontSize:16, fontWeight:700 }}
        >
          Start with this template <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </div>

      {/* other templates */}
      {otherTemplates?.length > 0 && (
        <div style={{ borderTop:`1px solid ${BD}`, paddingTop:36 }}>
          <p style={{ fontSize:12, color:DIM, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:16 }}>Other templates</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {otherTemplates.map(t => (
              <Link
                key={t.id}
                to={`/templates/${t.id}`}
                style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:8, padding:"7px 16px", fontSize:13, color:MUT, textDecoration:"none", fontWeight:500 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(200,85,234,0.4)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = BD}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      )}

    </ContentLayout>
  );
}
