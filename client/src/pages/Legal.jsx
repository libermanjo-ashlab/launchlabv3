import { useNavigate } from "react-router-dom";
import { C, FH, FB } from "../components";

function LegalPage({ title, sections }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FB }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, height: 54, display: "flex", alignItems: "center", padding: "0 32px", gap: 16 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 20, lineHeight: 1, padding: 0 }}>&#8592;</button>
        <span style={{ fontFamily: FH, fontWeight: 700, fontSize: 16, color: C.text }}>{title}</span>
      </div>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontFamily: FH, fontWeight: 700, fontSize: 28, color: C.text, marginBottom: 8, letterSpacing: "-0.04em" }}>{title}</h1>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 40 }}>Last updated: 07 July 2026 &mdash; Contact us at info@earnedlab.com with questions.</p>
        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            {s.heading && <h2 style={{ fontFamily: FH, fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 10, letterSpacing: "-0.02em" }}>{s.heading}</h2>}
            {s.paragraphs.map((p, j) => (
              <p key={j} style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, marginBottom: 12 }}>{p}</p>
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
        `These Terms of Service ("Terms") are a legal agreement between you and EarnedLab ("we," "us") governing your use of EarnedLab (the "Service"). By creating an account or using the Service, you agree to these Terms, our Privacy Policy, and our Disclaimer. If you do not agree, do not use the Service.`,
      ]},
      { heading: "1. Eligibility", paragraphs: [
        `You must be at least 18 years old and able to form a binding contract to use the Service. By using EarnedLab you represent that you meet these requirements.`,
      ]},
      { heading: "2. Your account", paragraphs: [
        `You are responsible for the activity under your account and for keeping your password secure. Notify us promptly at support@earnedlab.com if you suspect unauthorized use. You agree to provide accurate information and to keep it current.`,
      ]},
      { heading: "3. Acceptable use", paragraphs: [
        `You agree not to use the Service to break the law; to infringe others' rights; to create deceptive, harmful, or abusive content; to interfere with or attempt to gain unauthorized access to the Service; or to use it in any way that violates the terms of the third-party platforms you connect.`,
      ]},
      { heading: "4. Subscriptions, trials, and billing", paragraphs: [
        `The Service offers paid subscription plans, billed in advance on a recurring basis through Stripe.`,
        `Free trial. Paid plans may begin with a free trial. If you do not cancel before the trial ends, your subscription begins and your payment method is charged.`,
        `Auto-renewal. Subscriptions renew automatically each billing period until you cancel. You authorize us to charge your payment method for each renewal.`,
        `Cancellation. You can cancel at any time; cancellation takes effect at the end of the current billing period, and you retain access until then.`,
        `Refunds. Except where required by law, payments are non-refundable, including for partial periods.`,
        `Price changes. We may change pricing; we will give you reasonable notice, and changes apply to the next billing period.`,
      ]},
      { heading: "5. Automated actions and connected accounts", paragraphs: [
        `Some features, including Autopilot, can take automated actions on your behalf through accounts you connect — for example publishing content, updating your website, adjusting advertising, or responding to messages. By enabling these features and connecting accounts, you authorize us to take such actions on your behalf. You remain responsible for these actions and any resulting costs or charges, you can disable Autopilot or disconnect accounts at any time, and we are not responsible for the conduct, decisions, fees, or availability of third-party platforms.`,
      ]},
      { heading: "6. AI output and no guarantees", paragraphs: [
        `The Service generates AI output that may be inaccurate or unsuitable for your situation, and it is not professional advice. We do not guarantee any business outcome. Please review the Disclaimer, which forms part of these Terms.`,
      ]},
      { heading: "7. Intellectual property", paragraphs: [
        `You own the business content and materials you create through the Service. We own the Service itself — our software, models, designs, and trademarks — and grant you a limited, non-exclusive, non-transferable right to use it while these Terms are in effect.`,
      ]},
      { heading: `8. Disclaimers and limitation of liability`, paragraphs: [
        `The Service is provided "as is" and "as available," without warranties of any kind, to the fullest extent permitted by law. To the fullest extent permitted by law, we will not be liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits or lost business; and our total liability for any claim relating to the Service will not exceed the amount you paid us in the twelve months before the claim.`,
      ]},
      { heading: "9. Indemnification", paragraphs: [
        `You agree to indemnify and hold us harmless from claims, losses, and expenses arising out of your use of the Service, your content, your connected accounts, or your violation of these Terms or applicable law.`,
      ]},
      { heading: "10. Termination", paragraphs: [
        `You may stop using the Service and delete your account at any time. We may suspend or terminate access if you violate these Terms or if necessary to protect the Service or other users.`,
      ]},
      { heading: "11. Changes to these Terms", paragraphs: [
        `We may update these Terms. If we make material changes, we will update the date above and, where appropriate, notify you. Continued use after changes means you accept them.`,
      ]},
      { heading: "12. Governing law", paragraphs: [
        `These Terms are governed by the laws of the State of Pennsylvania, without regard to its conflict-of-laws rules.`,
      ]},
    ]} />
  );
}

export function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" sections={[
      { paragraphs: [
        `This Privacy Policy explains how EarnedLab ("we," "us") collects, uses, and shares information when you use EarnedLab (the "Service"). By using the Service, you agree to this policy.`,
      ]},
      { heading: "Who can use EarnedLab", paragraphs: [
        `EarnedLab is intended only for users who are 18 years of age or older. We do not knowingly collect personal information from anyone under 18. If you believe a minor has provided us information, contact us at support@earnedlab.com and we will delete it.`,
      ]},
      { heading: "Information we collect", paragraphs: [
        `You provide: account information — name, email address, and a securely hashed password; business profile — the intake details you enter, such as location, available hours, capital, skills, assets, risk tolerance, and goals; content and configuration — businesses, websites, posts, and settings you create or generate in the Service; communications — messages you send us.`,
        `Collected automatically: usage and device data — log data, pages used, actions taken, IP address, and similar technical information; cookies and similar technologies, used to keep you signed in and to understand product usage.`,
        `From connected services: if you connect third-party accounts (for example Google, social media, advertising, hosting, booking, or payment services), we receive the access tokens and the data needed to operate those integrations on your behalf, within the permissions you grant.`,
        `Payments: payments are processed by Stripe. We do not store your full card number; Stripe handles card data under its own terms.`,
      ]},
      { heading: "How we use information", paragraphs: [
        `We use information to provide and operate the Service, including running the AI agents that generate ideas, content, and recommendations; to process subscriptions and payments; to operate your connected integrations and any automated (Autopilot) actions you enable; to communicate with you; to maintain security and prevent abuse; and to improve the Service.`,
      ]},
      { heading: "How we share information", paragraphs: [
        `We do not sell your personal information. We share it with service providers who help us run the Service, only as needed to provide it:`,
        `Anthropic — to generate AI output, we send your inputs and relevant business data to Anthropic's API for processing. Stripe — payment processing. Netlify — hosting and deployment of websites you create. Google — authentication and any Google integrations you enable. Railway — application and database hosting. Advertising and channel platforms — only those you choose to connect, to run the actions you enable.`,
        `We may also disclose information if required by law, to protect our rights, or in connection with a merger or sale of our business.`,
      ]},
      { heading: "Data retention", paragraphs: [
        `We keep your information for as long as your account is active and as needed to provide the Service, then delete or anonymize it within a reasonable period, except where we must retain it to comply with legal obligations.`,
      ]},
      { heading: "Security", paragraphs: [
        `We protect your information using measures such as encrypted connections and hashed passwords. No system is perfectly secure, but we work to safeguard your data and limit access to it.`,
      ]},
      { heading: "Your choices and rights", paragraphs: [
        `You can access and update your account information, disconnect integrations, and request deletion of your account and associated data by contacting support@earnedlab.com. Depending on where you live (for example, under the GDPR or California privacy laws), you may have additional rights, such as the right to access, correct, delete, or port your data, or to object to certain processing.`,
      ]},
      { heading: "Changes", paragraphs: [
        `We may update this policy. If we make material changes, we will update the date above and, where appropriate, notify you.`,
      ]},
    ]} />
  );
}

export function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" sections={[
      { paragraphs: [
        `Please read this disclaimer carefully before using EarnedLab (the "Service"), operated by EarnedLab ("we," "us").`,
      ]},
      { heading: "Not professional advice", paragraphs: [
        `EarnedLab uses artificial intelligence to generate business ideas, plans, content, and recommendations. This output is provided for general informational purposes only. It is not financial, investment, legal, tax, accounting, or other professional advice, and it is not a substitute for advice from a qualified professional. You should consult appropriate licensed professionals before making business, financial, or legal decisions. Decisions about your business, your money, and your legal and regulatory obligations (including any licenses, permits, registrations, insurance, and taxes) are yours alone.`,
      ]},
      { heading: "No guarantee of results", paragraphs: [
        `Starting and running a business involves risk, including the risk of financial loss. We do not guarantee any particular outcome — including revenue, profit, customers, or business success — and nothing in the Service should be understood as a promise or projection of earnings. Market data, cost estimates, demand signals, and similar figures are estimates that may be incomplete, out of date, or inaccurate. Verify anything you intend to rely on.`,
      ]},
      { heading: "AI can be wrong", paragraphs: [
        `AI-generated output can contain errors, omissions, or content that is not suitable for your specific situation. You are responsible for reviewing and verifying all output before acting on it.`,
      ]},
      { heading: "Automated actions and connected accounts", paragraphs: [
        `If you enable Autopilot or connect third-party accounts (for example, social media, advertising, website hosting, payment, booking, or email services), you authorize EarnedLab to take automated actions on your behalf using those connections, such as publishing content, updating your website, or adjusting campaigns. You are responsible for monitoring these actions and for any results, costs, or charges they produce. You can disable Autopilot or disconnect any account at any time.`,
      ]},
      { heading: "Third-party services", paragraphs: [
        `The Service integrates with third-party platforms. Your use of those platforms is governed by their own terms and policies, and we are not responsible for their availability, decisions, or conduct.`,
      ]},
      { heading: "Limitation", paragraphs: [
        `To the fullest extent permitted by law, we are not liable for any loss or damage arising from your reliance on the Service's output or from automated actions taken through the Service. Your use of the Service is at your own risk.`,
      ]},
    ]} />
  );
}
