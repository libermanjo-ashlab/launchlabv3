/**
 * Autopilot iteration: OBSERVE → DECIDE → ACT → REPORT.
 *
 * Each tick makes one cheap Haiku call (DECIDE). Content is only generated
 * when a real threshold is crossed, so most cycles cost almost nothing.
 * Hard cadence caps prevent channel spam even if the model over-proposes.
 *
 * Usage in agents.js:
 *   const { runAutopilotIteration } = require('../services/autopilotLoop');
 *   // inside runAutopilotCycle(businessId):
 *   const biz = await prisma.business.findUnique({ where: { id: businessId } });
 *   await runAutopilotIteration(biz);
 */
const Anthropic = require('@anthropic-ai/sdk');
const { PrismaClient } = require('@prisma/client');
const {
  getConnectedChannels,
  collectMetrics,
  publishSocialPost,
  redeployWebsite,
  reallocateAdBudget,
  respondToReviews,
} = require('./channels');

const prisma   = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DECIDE_MODEL = 'claude-haiku-4-5-20251001';

// Minimum time between actions per channel (ms). The model proposes; these enforce.
const CADENCE = {
  social:  60 * 60 * 1000,       // 1 post/hour max
  website:  6 * 60 * 60 * 1000,  // 1 redeploy/6h max
  ads:     12 * 60 * 60 * 1000,
  reviews: 30 * 60 * 1000,
};

async function runAutopilotIteration(business) {
  // 1) OBSERVE — pure data reads, no generation.
  const channels = await getConnectedChannels(business);
  if (!channels || channels.length === 0) {
    return buildReport(business, { assessment: 'No channels connected yet — nothing to manage.', actions: [], results: [] });
  }

  const snapshot = await collectMetrics(business);
  const previous = await getLastSnapshot(business);
  await saveSnapshot(business, snapshot);

  // 2) DECIDE — one Haiku call. Returns which channels (if any) to act on.
  const decision = await decide(snapshot, previous, channels);

  // 3) ACT — only approved actions, each behind a hard cadence cap.
  const results = [];
  for (const a of decision.actions) {
    if (!(await withinCadence(business, a.channel))) {
      results.push({ channel: a.channel, status: 'skipped', detail: 'too soon since last update' });
      continue;
    }
    try {
      const res = await execute(business, a);
      await markActed(business, a.channel);
      results.push({ channel: a.channel, status: 'done', detail: res?.summary || a.action });
    } catch (err) {
      results.push({ channel: a.channel, status: 'failed', detail: 'We hit a snag and skipped this one — it will retry next cycle.' });
    }
  }

  // 4) REPORT
  return buildReport(business, { assessment: decision.assessment, actions: decision.actions, results });
}

// ── DECIDE ────────────────────────────────────────────────────────────────────
async function decide(snapshot, previous, channels) {
  const msg = await anthropic.messages.create({
    model: DECIDE_MODEL,
    max_tokens: 700,
    tools: [{
      name: 'autopilot_decision',
      description: 'Decide which channels, if any, need action this cycle.',
      input_schema: {
        type: 'object',
        properties: {
          assessment: { type: 'string', description: 'One sentence on business health vs. last cycle.' },
          actions: {
            type: 'array',
            description: 'Empty unless a metric clearly crosses a threshold.',
            items: {
              type: 'object',
              properties: {
                channel: { type: 'string', enum: ['social', 'website', 'ads', 'reviews'] },
                action:  { type: 'string', description: 'Plain-language action to take.' },
                reason:  { type: 'string', description: 'The metric/threshold that justifies it.' },
              },
              required: ['channel', 'action', 'reason'],
            },
          },
        },
        required: ['assessment', 'actions'],
      },
    }],
    tool_choice: { type: 'tool', name: 'autopilot_decision' },
    messages: [{
      role: 'user',
      content:
`You manage a small business on autopilot. Read the snapshot and decide if anything needs doing THIS cycle. Default to NO action — acting without a real signal wastes money and risks making things worse.

Connected channels: ${channels.join(', ')}

Current snapshot:
${JSON.stringify(snapshot, null, 2)}

Previous snapshot:
${previous ? JSON.stringify(previous, null, 2) : 'none (first run — observe only, take no action)'}

Thresholds (only act when clearly crossed):
- social: only if there is something genuinely worth saying (a milestone, a clear trend, a timely promo) AND you have not posted recently.
- website: only if traffic moved more than ~20% up or down vs. previous, or conversion clearly dropped.
- ads: only if cost-per-lead spiked more than ~25%, or one channel clearly outperforms and budget should shift.
- reviews: only if there are unanswered reviews.

Return an empty actions array if nothing crosses a threshold.`,
    }],
  });

  const block = msg.content.find(b => b.type === 'tool_use');
  return block?.input || { assessment: 'No decision this cycle.', actions: [] };
}

// ── ACT ───────────────────────────────────────────────────────────────────────
async function execute(business, a) {
  switch (a.channel) {
    case 'social':  return publishSocialPost(business, { brief: a.action });
    case 'website': return redeployWebsite(business, { reason: a.reason });
    case 'ads':     return reallocateAdBudget(business, { plan: a.action });
    case 'reviews': return respondToReviews(business);
    default:        return { summary: `No executor wired for "${a.channel}".` };
  }
}

// ── REPORT ────────────────────────────────────────────────────────────────────
function buildReport(business, { assessment, actions, results }) {
  const done   = results.filter(r => r.status === 'done');
  const failed = results.filter(r => r.status === 'failed');
  const lines  = [assessment];
  if (done.length === 0 && failed.length === 0) {
    lines.push("No changes needed this cycle — everything's running steady.");
  } else {
    for (const r of done)   lines.push(`Updated ${r.channel}: ${r.detail}`);
    for (const r of failed) lines.push(`Couldn't update ${r.channel}: ${r.detail}`);
  }
  return { at: new Date(), assessment, proposed: actions, results, summary: lines.join(' ') };
}

// ── State helpers stored in BusinessOutput (no extra schema needed) ───────────
async function getLastSnapshot(business) {
  const out = await prisma.businessOutput.findFirst({ where: { businessId: business.id, type: 'autopilot_snapshot' } });
  if (!out) return null;
  try { return JSON.parse(out.content); } catch { return null; }
}

async function saveSnapshot(business, snapshot) {
  const content = JSON.stringify(snapshot);
  const existing = await prisma.businessOutput.findFirst({ where: { businessId: business.id, type: 'autopilot_snapshot' } });
  if (existing) {
    await prisma.businessOutput.update({ where: { id: existing.id }, data: { content } });
  } else {
    await prisma.businessOutput.create({ data: { businessId: business.id, type: 'autopilot_snapshot', title: 'Autopilot snapshot', content } });
  }
}

async function withinCadence(business, channel) {
  const out = await prisma.businessOutput.findFirst({ where: { businessId: business.id, type: 'autopilot_cadence' } });
  if (!out) return true;
  try {
    const cadence = JSON.parse(out.content);
    const last = cadence[channel];
    if (!last) return true;
    return Date.now() - new Date(last).getTime() >= (CADENCE[channel] || 0);
  } catch { return true; }
}

async function markActed(business, channel) {
  const out = await prisma.businessOutput.findFirst({ where: { businessId: business.id, type: 'autopilot_cadence' } });
  let cadence = {};
  if (out) { try { cadence = JSON.parse(out.content); } catch {} }
  cadence[channel] = new Date().toISOString();
  const content = JSON.stringify(cadence);
  if (out) {
    await prisma.businessOutput.update({ where: { id: out.id }, data: { content } });
  } else {
    await prisma.businessOutput.create({ data: { businessId: business.id, type: 'autopilot_cadence', title: 'Autopilot cadence', content } });
  }
}

module.exports = { runAutopilotIteration };
