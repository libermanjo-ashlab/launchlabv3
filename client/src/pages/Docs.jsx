import ContentLayout from "../components/ContentLayout";
import { ExternalLink } from "lucide-react";

const MUT  = "rgba(255,255,255,0.5)";
const DIM  = "rgba(255,255,255,0.25)";
const BD   = "rgba(255,255,255,0.08)";
const CARD = "rgba(255,255,255,0.04)";

const DOCS = [
  {
    category: "Getting started",
    entries: [
      { title:"Getting started with EarnedLab", desc:"Account creation, the 7-day trial, discovery questionnaire, and your first business.", slug:"getting-started" },
    ],
  },
  {
    category: "AI agents",
    entries: [
      { title:"Marketing agent", desc:"How the marketing agent generates insights, growth opportunities, and content plans.", slug:"marketing-agent" },
      { title:"Management agent", desc:"How the management agent implements recommendations to connected channels.", slug:"management-agent" },
      { title:"Intelligence assistant", desc:"The context-aware chat AI — what it knows and how to use it effectively.", slug:"intelligence-assistant" },
      { title:"Content lab", desc:"Generating social, email, and web content on demand.", slug:"content-lab" },
      { title:"Autopilot mode", desc:"How Pro Autopilot works, what runs automatically, and how to configure it.", slug:"autopilot" },
    ],
  },
  {
    category: "Platform",
    entries: [
      { title:"Integrations", desc:"Connecting social media, website, email, and Google Business — setup and capabilities.", slug:"integrations" },
      { title:"Plans and daily limits", desc:"Comparing plans, the daily AI token budget, cost per action, and what resets when.", slug:"plans-and-limits" },
    ],
  },
  {
    category: "API and MCP",
    entries: [
      { title:"API and MCP (coming soon)", desc:"Programmatic access and the EarnedLab MCP server for AI-native integrations.", slug:"api-mcp" },
    ],
  },
];

export default function Docs() {
  return (
    <ContentLayout
      title="Documentation"
      description="Guides for every part of EarnedLab — from getting started to advanced agent configuration."
    >
      {DOCS.map((group, i) => (
        <div key={group.category} style={{ marginBottom:48, paddingBottom:48, borderBottom: i < DOCS.length - 1 ? `1px solid ${BD}` : "none" }}>
          <h2 style={{ fontSize:13, fontWeight:700, color:DIM, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:20 }}>
            {group.category}
          </h2>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {group.entries.map(doc => (
              <a
                key={doc.slug}
                href={`/docs/${doc.slug}.md`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:20, background:CARD, border:`1px solid ${BD}`, borderRadius:12, padding:"18px 22px", textDecoration:"none", color:"inherit", transition:"border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(200,85,234,0.35)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = BD}
              >
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, letterSpacing:"-0.01em", marginBottom:5 }}>{doc.title}</div>
                  <div style={{ fontSize:13, color:MUT, lineHeight:1.5 }}>{doc.desc}</div>
                </div>
                <ExternalLink size={14} color={DIM} style={{ flexShrink:0 }} />
              </a>
            ))}
          </div>
        </div>
      ))}

      {/* machine-readable note */}
      <div style={{ background:"rgba(200,85,234,0.05)", border:"1px solid rgba(200,85,234,0.15)", borderRadius:14, padding:"22px 24px" }}>
        <h3 style={{ fontWeight:700, fontSize:14, letterSpacing:"-0.01em", marginBottom:8 }}>For AI assistants and LLM crawlers</h3>
        <p style={{ fontSize:13, color:MUT, lineHeight:1.7 }}>
          These documentation pages are available as plain Markdown files at <code style={{ fontFamily:"monospace", color:"#C855EA", background:"rgba(200,85,234,0.1)", padding:"1px 6px", borderRadius:4 }}>earnedlab.com/docs/*.md</code>.
          See also: <a href="/llms.txt" style={{ color:"#C855EA", textDecoration:"none" }}>llms.txt</a> and <a href="/llms-full.txt" style={{ color:"#C855EA", textDecoration:"none" }}>llms-full.txt</a> for structured product information.
        </p>
      </div>
    </ContentLayout>
  );
}
