/**
 * Email channel send-on-behalf service
 * Supports: Resend (user API key), Mailchimp Transactional (Mandrill), ConvertKit broadcasts
 *
 * Provider detection from integration.metadata.provider:
 *   "Resend"      → POST https://api.resend.com/emails with user's apiKey
 *   "Mailchimp"   → Mailchimp Transactional (Mandrill) API
 *   "ConvertKit"  → ConvertKit broadcasts API
 *   "Sendgrid"    → SendGrid mail send API
 *   otherwise     → returns content only (no send)
 */

async function sendEmail({ provider, apiKey, fromEmail, fromName, to, subject, body, html }) {
  const p = (provider || "").toLowerCase();

  if (p === "resend" && apiKey) {
    return sendViaResend({ apiKey, fromEmail, fromName, to, subject, body, html });
  }
  if ((p === "mailchimp" || p === "mandrill") && apiKey) {
    return sendViaMandrill({ apiKey, fromEmail, fromName, to, subject, body, html });
  }
  if (p === "sendgrid" && apiKey) {
    return sendViaSendGrid({ apiKey, fromEmail, fromName, to, subject, body, html });
  }
  if (p === "convertkit" && apiKey) {
    return sendViaConvertKit({ apiKey, subject, body });
  }

  // No send capability — return content only
  return { sent: false, reason: "no_api_key", content: { subject, body: html || body } };
}

async function sendViaResend({ apiKey, fromEmail, fromName, to, subject, body, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail ? `${fromName || fromEmail} <${fromEmail}>` : "onboarding@resend.dev",
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || `<p>${body}</p>`,
      text: body,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.name || "Resend send failed");
  return { sent: true, id: data.id, provider: "resend" };
}

async function sendViaMandrill({ apiKey, fromEmail, fromName, to, subject, body, html }) {
  const res = await fetch("https://mandrillapp.com/api/1.0/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: apiKey,
      message: {
        from_email: fromEmail,
        from_name: fromName,
        to: [{ email: to, type: "to" }],
        subject,
        html: html || `<p>${body}</p>`,
        text: body,
      },
    }),
  });
  const data = await res.json();
  if (Array.isArray(data) && data[0]?.status === "sent") return { sent: true, id: data[0]._id, provider: "mailchimp" };
  if (Array.isArray(data) && data[0]?.reject_reason) throw new Error(`Mailchimp: ${data[0].reject_reason}`);
  throw new Error("Mailchimp send failed");
}

async function sendViaSendGrid({ apiKey, fromEmail, fromName, to, subject, body, html }) {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail || "noreply@earnedlab.com", name: fromName },
      subject,
      content: [
        { type: "text/plain", value: body },
        { type: "text/html",  value: html || `<p>${body}</p>` },
      ],
    }),
  });
  if (res.status === 202) return { sent: true, provider: "sendgrid" };
  const data = await res.json().catch(() => ({}));
  throw new Error(data.errors?.[0]?.message || "SendGrid send failed");
}

async function sendViaConvertKit({ apiKey, subject, body }) {
  // ConvertKit broadcasts — sends to the user's entire subscriber list
  const createRes = await fetch("https://api.convertkit.com/v3/broadcasts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_secret: apiKey,
      subject,
      content: body,
      description: subject,
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.broadcast?.id) {
    throw new Error(createData.message || "ConvertKit broadcast creation failed");
  }
  return { sent: true, id: String(createData.broadcast.id), provider: "convertkit", note: "Broadcast created as draft — review in ConvertKit before sending" };
}

async function getEmailStats(meta) {
  if (!meta.apiKey) return null;
  const p = (meta.provider || "").toLowerCase();
  try {
    if (p === "resend") {
      // Resend doesn't have bulk stats API — return stored stats
      return { emailsSent: meta.emailsSent || 0, openRate: meta.openRate || 0, provider: "Resend" };
    }
    if (p === "mailchimp" || p === "mandrill") {
      return { emailsSent: meta.emailsSent || 0, openRate: meta.openRate || 0, provider: "Mailchimp" };
    }
    if (p === "convertkit") {
      const res = await fetch(`https://api.convertkit.com/v3/subscribers?api_secret=${meta.apiKey}`);
      if (res.ok) {
        const data = await res.json();
        return { subscribers: data.total_subscribers || 0, openRate: meta.openRate || 0, provider: "ConvertKit" };
      }
    }
  } catch {}
  return null;
}

module.exports = { sendEmail, getEmailStats };
