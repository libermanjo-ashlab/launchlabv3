const { Resend } = require("resend");

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.EMAIL_FROM || "EarnedLab <noreply@earnedlab.com>";
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173")
  .replace(/\/$/, "")
  .replace("://earnedlab.com", "://www.earnedlab.com");

async function sendEmail({ to, subject, html }) {
  const resend = getResend();
  if (!resend) {
    console.log(`[Email] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (e) {
    console.error(`[Email] Failed to send "${subject}" to ${to}:`, e.message);
  }
}

function baseLayout(content) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#0D0D14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .wrap{max-width:520px;margin:40px auto;padding:0 24px}
  .card{background:#16161F;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px 32px}
  .logo{font-size:14px;font-weight:700;letter-spacing:-0.02em;color:#A78BFA;margin-bottom:28px}
  h1{margin:0 0 12px;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.03em;line-height:1.3}
  p{margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.65);line-height:1.7}
  .btn{display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#7C3AED,#DB2777);color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:-0.01em}
  .divider{border:none;border-top:1px solid rgba(255,255,255,0.07);margin:24px 0}
  .small{font-size:12px;color:rgba(255,255,255,0.3)}
  .footer{text-align:center;margin-top:28px}
</style></head><body>
<div class="wrap">
  <div class="card">
    <div class="logo">⬡ EARNEDLAB</div>
    ${content}
  </div>
  <div class="footer">
    <p class="small">EarnedLab · You're receiving this because you signed up at earnedlab.com</p>
  </div>
</div>
</body></html>`;
}

async function sendVerificationEmail(to, name, token) {
  const link = `${CLIENT_URL}/verify-email?token=${token}`;
  await sendEmail({
    to,
    subject: "Verify your EarnedLab email",
    html: baseLayout(`
      <h1>Confirm your email</h1>
      <p>Hey ${name}, thanks for joining EarnedLab! Click the button below to verify your email address.</p>
      <a href="${link}" class="btn">Verify email address</a>
      <hr class="divider">
      <p class="small">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
      <p class="small">Or copy this link: ${link}</p>
    `),
  });
}

async function sendPasswordResetEmail(to, name, token) {
  const link = `${CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({
    to,
    subject: "Reset your EarnedLab password",
    html: baseLayout(`
      <h1>Reset your password</h1>
      <p>Hey ${name}, we received a request to reset your password. Click below to choose a new one.</p>
      <a href="${link}" class="btn">Reset password</a>
      <hr class="divider">
      <p class="small">This link expires in 1 hour. If you didn't request a reset, your password hasn't changed — you can safely ignore this.</p>
      <p class="small">Or copy this link: ${link}</p>
    `),
  });
}

const PLAN_LABELS = { starter: "Starter", pro: "Pro", pro_autopilot: "Pro Autopilot" };
const PLAN_PRICES = { starter: 39, pro: 89, pro_autopilot: 199 };

async function sendReceiptEmail(to, name, planId) {
  const label = PLAN_LABELS[planId] || planId;
  const price = PLAN_PRICES[planId] || "—";
  await sendEmail({
    to,
    subject: `You're on EarnedLab ${label} — receipt`,
    html: baseLayout(`
      <h1>Payment confirmed</h1>
      <p>Thanks ${name}! Your subscription to the <strong style="color:#fff">${label} plan</strong> is now active.</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr><td style="padding:10px 0;color:rgba(255,255,255,0.5);font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07)">Plan</td><td style="padding:10px 0;color:#fff;font-size:13px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.07)">${label}</td></tr>
        <tr><td style="padding:10px 0;color:rgba(255,255,255,0.5);font-size:13px">Amount</td><td style="padding:10px 0;color:#fff;font-size:13px;text-align:right">$${price}/month</td></tr>
      </table>
      <a href="${CLIENT_URL}/dashboard" class="btn">Go to your dashboard</a>
      <hr class="divider">
      <p class="small">To manage or cancel your subscription, visit the billing section in your dashboard. Questions? Reply to this email.</p>
    `),
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendReceiptEmail };
