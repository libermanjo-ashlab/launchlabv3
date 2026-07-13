import { useNavigate } from "react-router-dom";
import { C, FH, FB } from "../components";

function LegalPage({ title, sections }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FB }}>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, height:54, display:"flex", alignItems:"center", padding:"0 32px", gap:16 }}>
        <button onClick={() => navigate(-1)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:20, lineHeight:1, padding:0 }}>&#8592;</button>
        <span style={{ fontFamily:FH, fontWeight:700, fontSize:16, color:C.text }}>{title}</span>
      </div>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"48px 24px 80px" }}>
        <h1 style={{ fontFamily:FH, fontWeight:700, fontSize:28, color:C.text, marginBottom:8, letterSpacing:"-0.04em" }}>{title}</h1>
        <p style={{ fontSize:13, color:C.muted, marginBottom:40 }}>Last updated: July 13, 2026 &mdash; Contact us at support@earnedlab.com with any questions.</p>
        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom:32 }}>
            {s.heading && <h2 style={{ fontFamily:FH, fontWeight:700, fontSize:17, color:C.text, marginBottom:10, letterSpacing:"-0.02em" }}>{s.heading}</h2>}
            {s.paragraphs.map((p, j) => (
              <p key={j} style={{ fontSize:14, color:"#374151", lineHeight:1.75, marginBottom:12 }}>{p}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <LegalPage title="Terms of Service" sections={[
      { paragraphs: [
        `These Terms of Service ("Terms") are a legal agreement between you and EarnedLab ("we," "us") governing your use of the EarnedLab platform and all associated features (the "Service"). By creating an account or using the Service, you agree to these Terms, our Privacy Policy, and our Disclaimer. If you do not agree, do not use the Service.`,
      ]},
      { heading:"1. Eligibility", paragraphs:[
        `You must be at least 18 years old and capable of forming a binding contract to use the Service. By registering you confirm that you meet these requirements. We do not knowingly provide the Service to anyone under 18.`,
      ]},
      { heading:"2. Your account", paragraphs:[
        `You are responsible for all activity under your account and for keeping your credentials secure. Notify us immediately at support@earnedlab.com if you suspect unauthorized access. You agree to provide accurate, current information and to keep it up to date.`,
      ]},
      { heading:"3. Acceptable use", paragraphs:[
        `You agree not to use the Service to violate any law or regulation; to infringe any third party's rights; to create deceptive, harmful, or abusive content; to circumvent or attempt to gain unauthorized access to the Service or its infrastructure; to reverse-engineer, scrape, or copy the Service; or to violate the terms of any third-party platform you connect to the Service.`,
      ]},
      { heading:"4. Subscriptions, trials, and billing", paragraphs:[
        `The Service offers the following subscription plans, billed monthly in advance through Stripe:`,
        `Free Trial — 7 days of access with limited agent usage (up to 3 marketing analyses and 1 implementation). No charge during the trial. If you do not upgrade before the trial ends, your account is locked until you subscribe.`,
        `Starter — $39 per month. Includes unlimited marketing insights and analysis, revenue and lead tracking, and business planning tools. The management implementation agent is not included.`,
        `Pro — $89 per month. Includes everything in Starter plus the management agent, which can implement recommendations directly to your connected channels and website on your request.`,
        `Pro Autopilot — $199 per month. Includes everything in Pro, plus agents run automatically on a schedule without manual input.`,
        `All plans are subject to a daily AI usage budget. Trial and Starter plans share a budget of 20,000 tokens per day. Pro and Pro Autopilot plans share a budget of 110,000 tokens per day. Budgets reset at midnight UTC each day.`,
        `Subscriptions renew automatically each billing period until you cancel. You authorize us to charge your payment method for each renewal. You may cancel at any time through your account settings; cancellation takes effect at the end of the current billing period and you retain access until then. Except where required by law, payments are non-refundable, including for unused portions of a billing period. We may change pricing with reasonable notice; changes apply to the next billing period.`,
      ]},
      { heading:"5. AI-powered features and daily limits", paragraphs:[
        `The Service uses artificial intelligence — including models from Anthropic and OpenAI — to generate business ideas, marketing insights, content, recommendations, and images. AI output is subject to a daily token budget that varies by plan (see Section 4). Once your daily budget is reached, AI-powered features are paused until the budget resets at midnight UTC. This limit applies across all AI agents: marketing analysis, management implementation, the intelligence chat assistant, campaign content generation, and content lab.`,
      ]},
      { heading:"6. Automated actions and connected accounts", paragraphs:[
        `Certain features, including Autopilot mode and the management agent, can take automated actions on your behalf through accounts you connect — for example publishing social media posts, updating your website, sending emails, or adjusting campaign content on Instagram, Twitter/X, TikTok, Facebook, LinkedIn, Google Business, WordPress, or Netlify. By enabling these features and connecting accounts you authorize us to take those actions on your behalf. You remain responsible for all resulting actions, any platform policy compliance, and any costs or charges those platforms may impose. You can disable Autopilot or disconnect any account at any time. We are not responsible for the conduct, availability, decisions, or fees of third-party platforms.`,
      ]},
      { heading:"7. AI output — no guarantee", paragraphs:[
        `AI-generated output may be inaccurate, incomplete, or unsuitable for your specific situation. It is not professional advice. We make no guarantee of any business outcome. Please review our Disclaimer, which forms part of these Terms.`,
      ]},
      { heading:"8. Intellectual property", paragraphs:[
        `You own the business content, plans, and materials you create through the Service. We own the Service itself — our software, AI pipelines, designs, branding, and trademarks — and grant you a limited, non-exclusive, non-transferable right to use it while your account is active and these Terms are in effect.`,
      ]},
      { heading:"9. Disclaimers and limitation of liability", paragraphs:[
        `The Service is provided "as is" and "as available," without warranties of any kind, to the fullest extent permitted by law. To the fullest extent permitted by law, we will not be liable for indirect, incidental, special, consequential, or punitive damages, including lost profits or lost business. Our total liability for any claim relating to the Service will not exceed the amount you paid us in the twelve months preceding the claim.`,
      ]},
      { heading:"10. Indemnification", paragraphs:[
        `You agree to indemnify and hold EarnedLab and its affiliates harmless from any claims, losses, damages, and expenses (including reasonable attorneys' fees) arising from your use of the Service, your content, automated actions taken through your connected accounts, or your violation of these Terms or applicable law.`,
      ]},
      { heading:"11. Termination", paragraphs:[
        `You may stop using the Service and delete your account at any time. We may suspend or terminate your access if you violate these Terms, if required to protect the security or integrity of the Service, or if required by law.`,
      ]},
      { heading:"12. Changes to these Terms", paragraphs:[
        `We may update these Terms from time to time. If we make material changes we will update the date at the top of this page and, where appropriate, notify you by email. Continued use of the Service after changes take effect means you accept the updated Terms.`,
      ]},
      { heading:"13. Governing law", paragraphs:[
        `These Terms are governed by the laws of the Commonwealth of Pennsylvania, without regard to its conflict-of-laws rules. Any disputes will be resolved in the courts of Pennsylvania.`,
      ]},
    ]} />
  );
}

export function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" sections={[
      { paragraphs:[
        `This Privacy Policy explains how EarnedLab ("we," "us") collects, uses, and shares information when you use the EarnedLab platform (the "Service"). By using the Service you agree to this policy.`,
      ]},
      { heading:"Who can use EarnedLab", paragraphs:[
        `EarnedLab is intended only for users who are 18 years of age or older. We do not knowingly collect personal information from anyone under 18. If you believe a minor has provided us information, contact us at support@earnedlab.com and we will delete it promptly.`,
      ]},
      { heading:"Information we collect", paragraphs:[
        `Information you provide directly: account information (name, email address, and a securely hashed password); your age (used only to verify eligibility); business profile data you enter, such as location, available hours, capital, skills, assets, and goals; businesses, websites, posts, tasks, and other content you create or generate in the Service; integration credentials and access tokens for third-party accounts you choose to connect; and communications you send us.`,
        `Information collected automatically: usage data including pages visited, features used, actions taken, and the timing of those actions; device and connection data including IP address, browser type, and operating system; session and behavior data collected through PostHog, our analytics provider, including page views, session replays (where enabled), and user flows; error and diagnostic data collected through Sentry, our error-tracking provider, including stack traces and the context in which errors occurred.`,
        `From connected services: if you connect third-party accounts (Instagram, Twitter/X, TikTok, Facebook, LinkedIn, Google Business, WordPress, Netlify, email providers, or others), we receive the access tokens and data necessary to operate those integrations on your behalf, within the permissions you explicitly grant.`,
        `Payment information: payments are processed by Stripe. We receive a customer ID and subscription status from Stripe but do not store your full card number or payment details — those are handled by Stripe under its own terms and privacy policy.`,
      ]},
      { heading:"How we use information", paragraphs:[
        `We use your information to create and manage your account; to provide and operate all features of the Service, including running AI agents (powered by Anthropic's Claude and OpenAI's models) that generate ideas, content, images, and recommendations; to process your subscription and payments; to send verification emails, password reset emails, and transactional communications through Resend; to operate integrations and any automated (Autopilot) actions you enable; to display usage statistics and account information to you in the app; to monitor for errors and maintain security through Sentry; to analyze usage patterns and improve the Service through PostHog; and to respond to your support requests.`,
      ]},
      { heading:"How we share information", paragraphs:[
        `We do not sell your personal information. We share it only with service providers who help us operate the Service, and only as necessary to provide it:`,
        `Anthropic — we send your business inputs and relevant context to Anthropic's API to generate AI output (ideas, reports, recommendations, chat responses). OpenAI — we send content context to OpenAI's API to generate post captions, channel content, slide copy, and images (via DALL-E). Stripe — payment processing and subscription management. Resend — transactional email delivery (verification emails, password resets, receipts). PostHog — product analytics, page view tracking, and session data. Sentry — error tracking and crash reporting. Netlify — hosting and deployment of websites you create through the Service. Railway — cloud hosting for the application and database. Third-party channel platforms — only those you explicitly connect (Instagram, Twitter/X, TikTok, Facebook, LinkedIn, Google Business, WordPress, email providers) and only to perform the actions you enable.`,
        `We may also disclose information if required by law, to protect the rights or safety of EarnedLab or others, or in connection with a merger, acquisition, or sale of our business assets.`,
      ]},
      { heading:"Analytics and tracking", paragraphs:[
        `We use PostHog to understand how users navigate the Service. PostHog collects page views, feature interactions, and session data. When you are logged in, your activity is associated with your account (email, name, plan) so we can understand usage by user segment. You can learn about PostHog's data practices at posthog.com/privacy. We use Sentry for error monitoring; when an error occurs, Sentry captures diagnostic information including your user ID and the context of the error. You can learn about Sentry's data practices at sentry.io/privacy.`,
      ]},
      { heading:"Data retention", paragraphs:[
        `We retain your information for as long as your account is active. If you request account deletion, we will delete or anonymize your personal data within a reasonable period, except where we are required to retain it to comply with legal obligations, resolve disputes, or enforce agreements.`,
      ]},
      { heading:"Security", paragraphs:[
        `We protect your information using encrypted connections (HTTPS), bcrypt-hashed passwords, JWT-based authentication with expiring tokens, and role-based access controls. We perform regular database backups. No system is perfectly secure, but we take reasonable measures to safeguard your data and limit who can access it.`,
      ]},
      { heading:"Your choices and rights", paragraphs:[
        `You can update your account information in the app at any time. You can disconnect any third-party integration from your settings. You can request deletion of your account and associated data by emailing support@earnedlab.com. Depending on where you live (for example, under the GDPR or California's CCPA/CPRA), you may have additional rights including the right to access, correct, delete, or port your data, or to object to certain processing. To exercise these rights, contact us at support@earnedlab.com.`,
      ]},
      { heading:"Changes to this policy", paragraphs:[
        `We may update this Privacy Policy from time to time. If we make material changes we will update the date at the top of this page and, where appropriate, notify you by email. Continued use of the Service after changes take effect means you accept the updated policy.`,
      ]},
    ]} />
  );
}

export function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" sections={[
      { paragraphs:[
        `Please read this disclaimer carefully before using EarnedLab (the "Service"), operated by EarnedLab ("we," "us"). This disclaimer forms part of our Terms of Service.`,
      ]},
      { heading:"Not professional advice", paragraphs:[
        `EarnedLab uses artificial intelligence — including models from Anthropic and OpenAI — to generate business ideas, plans, marketing insights, content, and recommendations. All output is provided for general informational purposes only. It is not financial, investment, legal, tax, accounting, or any other form of professional advice, and it is not a substitute for consultation with a qualified professional. You should consult licensed professionals before making business, financial, or legal decisions. Responsibility for any licenses, permits, registrations, insurance, employment obligations, and tax filings required by your business rests entirely with you.`,
      ]},
      { heading:"No guarantee of results", paragraphs:[
        `Starting and running a business involves risk, including the risk of losing money. EarnedLab makes no guarantee of any particular outcome — including revenue, profit, customers, growth, or business success. Nothing in the Service should be read as a promise, projection, or guarantee of earnings. Market data, demand estimates, cost figures, and similar information generated by the Service are estimates only; they may be incomplete, out of date, or inaccurate. Verify any information you intend to rely on before acting.`,
      ]},
      { heading:"AI can be wrong", paragraphs:[
        `AI-generated output — including text, images, strategies, and recommendations — can contain errors, omissions, hallucinations, or content that is unsuitable for your specific situation. The quality and relevance of output depends on the information you provide and cannot be guaranteed. You are responsible for reviewing all output before acting on it, and for any decisions you make based on it.`,
      ]},
      { heading:"Daily AI usage limits", paragraphs:[
        `The Service operates within a daily token budget that limits the number and complexity of AI operations per plan. These limits exist to ensure fair access and service stability. Reaching your daily limit does not indicate an error and does not entitle you to a refund or credit. Limits reset at midnight UTC each day.`,
      ]},
      { heading:"Automated actions and connected accounts", paragraphs:[
        `If you enable Autopilot mode or grant the management agent access to connected accounts — including social media platforms (Instagram, Twitter/X, TikTok, Facebook, LinkedIn), advertising accounts, website hosting (WordPress, Netlify), email providers, or Google Business — you authorize EarnedLab to take automated actions on your behalf, such as publishing content, updating your website, sending emails, or scheduling posts. You are solely responsible for monitoring these actions, for any results or consequences they produce, and for any costs, charges, or policy violations that may result on those platforms. You can disable Autopilot or disconnect any account at any time from your settings. We are not responsible for the conduct, decisions, availability, or fees of any third-party platform.`,
      ]},
      { heading:"Third-party services and integrations", paragraphs:[
        `The Service integrates with third-party platforms and services. Your use of those platforms is governed by their own terms and privacy policies, which we do not control. We are not responsible for the availability, accuracy, security, or conduct of any third-party service.`,
      ]},
      { heading:"Limitation of liability", paragraphs:[
        `To the fullest extent permitted by applicable law, EarnedLab and its affiliates are not liable for any loss or damage — including financial loss, lost profits, reputational harm, or data loss — arising from your reliance on AI-generated output, from automated actions taken through the Service, from the conduct of connected third-party platforms, or from any interruption or error in the Service. Your use of the Service is at your own risk.`,
      ]},
    ]} />
  );
}
