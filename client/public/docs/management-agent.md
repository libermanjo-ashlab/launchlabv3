# Management Agent

The management agent implements recommendations directly to your connected channels — without you having to log into each platform separately. It updates your website, posts to social media, sends email campaigns, and updates your Google Business Profile. On Pro, each action requires your approval. On Pro Autopilot, approved action categories run automatically.

---

## What the management agent can implement

### Website updates (Netlify)
- Add or update pages
- Edit headlines, body copy, service descriptions, and calls to action
- Update contact information or pricing sections
- Add new service or portfolio entries

### Social media (Instagram, Twitter/X, TikTok, Facebook, LinkedIn)
- Publish posts and captions
- Post image + caption combinations (with content lab images)
- Schedule posts to connected channels

### Email campaigns (Resend, Mailchimp, SendGrid)
- Send one-time campaign emails to connected lists
- Draft and send newsletters
- Send individual transactional or promotional messages

### Google Business Profile
- Post business updates
- Update business hours and description
- Add offer or event posts

---

## How to use the management agent

### On the Pro plan (manual approval)

1. The marketing agent produces recommendations, or you create a task directly.
2. Click **Implement** on the recommendation or task.
3. The management agent generates an implementation plan: exactly what it will do, where, and with what content.
4. Review the plan — edit any content if needed.
5. Click **Approve and run** — the agent executes the action.
6. The action is logged with a timestamp and outcome.

Every implementation requires this approval step on the Pro plan. Nothing goes live without your explicit sign-off.

### On Pro Autopilot (automatic execution)

You configure categories of actions the agent is pre-authorized to run:

- Example: "Post to Instagram when the marketing agent generates a social caption."
- Example: "Publish website copy updates when the marketing agent recommends them."

Once configured, the agent executes pre-approved action types automatically when the marketing agent runs on its schedule. See [autopilot mode](https://earnedlab.com/docs/autopilot.md) for full configuration details.

---

## Plan requirements

| Plan | Management agent access |
|------|------------------------|
| Trial | Up to 1 implementation |
| Starter | Not included |
| Pro | Unlimited (with approval, within daily budget) |
| Pro Autopilot | Unlimited — runs automatically with pre-approved action types |

The management agent is not available on the Starter plan.

---

## Token usage

The management agent uses approximately 1,800 tokens per implementation task. Multiple tasks in a single session accumulate against the daily budget.

See [plans and daily limits](https://earnedlab.com/docs/plans-and-limits.md) for full token budget details.

---

## Integration requirements

The management agent can only implement actions to channels you've connected. Connect integrations from your business hub settings. See [integrations](https://earnedlab.com/docs/integrations.md) for setup instructions for each platform.

If a channel isn't connected, the management agent will generate the content and instructions but flag the implementation step as requiring manual action.

---

## Logs and reversibility

Every management agent action is logged in your hub with:

- Action type and target channel
- Content used
- Timestamp
- Outcome (success or failure with reason)

Website changes can be reverted from the hub. Social posts and email sends are not reversible after execution — review carefully before approving.

---

## Related docs

- [Marketing agent](https://earnedlab.com/docs/marketing-agent.md)
- [Autopilot mode](https://earnedlab.com/docs/autopilot.md)
- [Integrations](https://earnedlab.com/docs/integrations.md)
- [Plans and daily limits](https://earnedlab.com/docs/plans-and-limits.md)
