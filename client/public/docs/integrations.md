# Integrations

EarnedLab connects to external platforms so the management agent can implement recommendations directly. Connect integrations from your business hub settings. Integrations are optional — the platform is fully usable without them, but the management agent requires connected channels to take automated action.

---

## Social media

### Instagram
**What it does:** Publish posts and image+caption combinations to your Instagram business account.
**Permissions required:** Basic display + content publishing.
**Setup:** Connect via the Instagram OAuth flow in hub settings. Requires an Instagram Business or Creator account linked to a Facebook page.

### Twitter / X
**What it does:** Post tweets and thread openers to your connected X account.
**Permissions required:** Read and write access.
**Setup:** Connect via X's OAuth flow in hub settings. Standard API access (no elevated access required).

### TikTok
**What it does:** Post short-form video captions and content briefs to your TikTok business account.
**Permissions required:** Video upload and posting.
**Setup:** Connect via TikTok's OAuth flow in hub settings. Requires a TikTok Business account.

### Facebook
**What it does:** Post to your Facebook Page.
**Permissions required:** Page content publishing.
**Setup:** Connect via Facebook OAuth. Requires admin access to a Facebook Page. Personal profiles are not supported.

### LinkedIn
**What it does:** Post to your LinkedIn personal profile or company page.
**Permissions required:** Share content.
**Setup:** Connect via LinkedIn OAuth in hub settings. Company page posting requires admin access to the page.

---

## Website

### Netlify (EarnedLab-hosted sites)
**What it does:** Updates content, adds pages, and redeploys your business website.
**Setup:** Automatic. EarnedLab-generated sites are deployed to Netlify and connected automatically. No setup required.
**Custom domains:** Connect a custom domain from the Netlify dashboard or via your domain registrar's DNS settings.

### WordPress
**What it does:** Updates posts, pages, and plugin-managed content on your WordPress site.
**Permissions required:** Editor or Administrator user role.
**Setup:** Enter your WordPress site URL and credentials in hub settings. EarnedLab uses the WordPress REST API.

---

## Email

### Resend
**What it does:** Sends email campaigns and individual messages to your contacts.
**Setup:** Enter your Resend API key in hub settings. You must own and have verified a sending domain in your Resend account.

### Mailchimp
**What it does:** Sends campaigns to your Mailchimp lists.
**Setup:** Connect via Mailchimp OAuth in hub settings. Select the audience (list) the management agent should use.

### SendGrid
**What it does:** Sends email campaigns via SendGrid's API.
**Setup:** Enter your SendGrid API key and a verified sender email in hub settings.

---

## Search and local

### Google Business Profile
**What it does:** Posts business updates, edits hours and description, and publishes offer or event posts.
**Permissions required:** Manager or Owner access to the Google Business Profile.
**Setup:** Connect via Google OAuth in hub settings. Select the correct business location if you manage multiple.

---

## Integration status and health

All connected integrations show a status indicator in your business hub:

- **Connected** — Token is valid, last test passed.
- **Needs attention** — Token expired or permissions changed. Reconnect from hub settings.
- **Disconnected** — Integration was manually disconnected or access was revoked from the platform.

If a channel becomes disconnected while autopilot is running, the management agent skips that channel and logs a notice. It does not retry until you reconnect.

---

## Disconnecting an integration

Disconnect any integration from hub settings at any time. EarnedLab revokes the stored token immediately. To fully remove access, also revoke it from the external platform's app permissions settings.

---

## Security

Integration credentials (OAuth tokens and API keys) are stored encrypted. They are only used when the management agent performs an action on that channel. EarnedLab requests only the minimum permissions required for each platform.

See [security](https://earnedlab.com/security) for more detail on how credentials are stored.

---

## Related docs

- [Management agent](https://earnedlab.com/docs/management-agent.md)
- [Autopilot mode](https://earnedlab.com/docs/autopilot.md)
- [Security](https://earnedlab.com/security)
