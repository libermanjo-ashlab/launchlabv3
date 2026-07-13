import ContentLayout from "../components/ContentLayout";

const MUT  = "rgba(255,255,255,0.5)";
const DIM  = "rgba(255,255,255,0.25)";
const BD   = "rgba(255,255,255,0.08)";
const CARD = "rgba(255,255,255,0.04)";

const SECTIONS = [
  {
    title: "Data storage",
    items: [
      { q:"Where is my data stored?", a:"Business data, account information, and agent outputs are stored in a PostgreSQL database hosted on Railway. Railway operates on secure cloud infrastructure with encrypted storage at rest." },
      { q:"What data does EarnedLab store?", a:"We store your account credentials (hashed), business profile information, agent outputs (marketing analyses, plans, generated content), task and revenue entries, integration tokens for connected channels, and usage data. We do not store payment card details — those are handled directly by Stripe." },
      { q:"Is my data encrypted?", a:"Data is encrypted in transit via TLS and encrypted at rest on the database host. Integration credentials for connected channels are stored encrypted." },
    ],
  },
  {
    title: "Passwords and authentication",
    items: [
      { q:"How are passwords stored?", a:"Passwords are hashed using bcrypt before storage. Your plaintext password is never stored or logged." },
      { q:"What if I forget my password?", a:"Use the 'Forgot password' flow on the sign-in page. A reset link is sent to your verified email address. Reset links expire after a short window." },
      { q:"Is email verification required?", a:"Yes. Email verification is required to access the full platform. This prevents account creation with addresses you don't own." },
    ],
  },
  {
    title: "Third-party processors",
    items: [
      { q:"Who processes my payments?", a:"Stripe handles all payment processing. EarnedLab never sees or stores your card details. Stripe is PCI DSS Level 1 certified." },
      { q:"Which AI providers does EarnedLab use?", a:"EarnedLab uses Anthropic's Claude for most analysis and generation, and OpenAI's models for image generation in the content lab. Your business data is sent to these APIs to generate outputs — it is not used to train their models per their enterprise API terms." },
      { q:"What does PostHog see?", a:"We use PostHog for product analytics — page views, session data, and feature usage. This helps us understand how the platform is used and what to improve. PostHog is configured to only identify users after login, using your internal user ID." },
      { q:"What does Sentry see?", a:"We use Sentry for error monitoring. When something breaks, Sentry captures the error and stack trace so we can fix it quickly. It does not capture passwords or payment information." },
      { q:"What does Resend see?", a:"Resend is our email delivery provider. It processes transactional emails — verification, password reset, and billing notifications. It does not see your business content or integration credentials." },
    ],
  },
  {
    title: "Connected integrations",
    items: [
      { q:"How does EarnedLab access my social media accounts?", a:"You connect accounts via OAuth through each platform's official authorization flow. EarnedLab receives a scoped access token and stores it encrypted. We only request the minimum permissions needed: read profile, write posts, and optionally read analytics." },
      { q:"Can EarnedLab post without my knowledge?", a:"On the Pro plan, the management agent requires your explicit approval for each action before it is implemented. On Pro Autopilot, you pre-approve action categories when you configure autopilot — the agent then runs within those boundaries on a schedule." },
      { q:"How do I disconnect an integration?", a:"Disconnect any integration from your business hub settings at any time. We revoke the token immediately. Some platforms may also require revoking access from their own settings." },
    ],
  },
  {
    title: "Data deletion and portability",
    items: [
      { q:"Can I delete my account?", a:"Yes. Contact support@earnedlab.com to request account deletion. We will delete your account, business data, and agent outputs. This is irreversible." },
      { q:"Can I export my data?", a:"Business plans, marketing analyses, and generated content can be downloaded individually from within the platform. A full data export option is on the roadmap." },
      { q:"How long is data retained after cancellation?", a:"If you cancel your subscription, your data remains accessible in read-only mode. If you don't resubscribe within 90 days, your account and data are scheduled for deletion. You will receive an email notice before this happens." },
    ],
  },
];

function Pill({ label }) {
  return (
    <span style={{ display:"inline-block", background:"rgba(200,85,234,0.12)", border:"1px solid rgba(200,85,234,0.25)", borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600, color:"#C855EA", letterSpacing:"0.03em", marginBottom:16 }}>
      {label}
    </span>
  );
}

export default function Security() {
  return (
    <ContentLayout
      title="Security"
      description="How EarnedLab handles your data, credentials, integrations, and privacy."
    >
      <div style={{ marginBottom:40 }}>
        <Pill label="Transparency" />
        <p style={{ fontSize:16, color:MUT, lineHeight:1.8, maxWidth:680 }}>
          This page covers how EarnedLab stores and protects your data, which third parties process it, and how connected integrations work. It is a plain-language supplement to the <a href="/privacy" style={{ color:"#C855EA", textDecoration:"none" }}>Privacy Policy</a>.
        </p>
      </div>

      {SECTIONS.map((section, i) => (
        <div key={section.title} style={{ marginBottom:56, paddingBottom:56, borderBottom: i < SECTIONS.length - 1 ? `1px solid ${BD}` : "none" }}>
          <h2 style={{ fontSize:"clamp(18px,2.5vw,24px)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:24 }}>
            {section.title}
          </h2>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {section.items.map(item => (
              <div key={item.q} style={{ background:CARD, border:`1px solid ${BD}`, borderRadius:12, padding:"20px 22px" }}>
                <h3 style={{ fontWeight:700, fontSize:14, letterSpacing:"-0.01em", marginBottom:10 }}>{item.q}</h3>
                <p style={{ fontSize:14, color:MUT, lineHeight:1.7 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ background:"rgba(200,85,234,0.06)", border:"1px solid rgba(200,85,234,0.2)", borderRadius:14, padding:"28px 28px" }}>
        <h3 style={{ fontWeight:700, fontSize:16, letterSpacing:"-0.02em", marginBottom:10 }}>Security questions or concerns</h3>
        <p style={{ fontSize:15, color:MUT, lineHeight:1.7 }}>
          If you discover a security vulnerability or have a concern about data handling, contact us directly at{" "}
          <a href="mailto:support@earnedlab.com" style={{ color:"#C855EA", textDecoration:"none" }}>support@earnedlab.com</a>.
          We respond to security reports within 1 business day.
        </p>
      </div>
    </ContentLayout>
  );
}
