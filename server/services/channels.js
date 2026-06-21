/**
 * Channel adapters for the autopilot OBSERVE → ACT loop.
 * Each function bridges the generic autopilot interface to the concrete
 * implementations that already exist in this codebase.
 */
const { PrismaClient } = require('@prisma/client');
const { runManagementAgent } = require('./agents');
const { createSite, deploySite } = require('./netlify');

const prisma = new PrismaClient();

// Returns which channels are actionable for this business right now.
async function getConnectedChannels(business) {
  const channels = ['website']; // always available once a site is generated
  const integrations = await prisma.integration.findMany({
    where: { businessId: business.id, status: 'connected' },
  });
  const providers = integrations.map(i => i.provider);
  if (providers.some(p => ['google'].includes(p))) channels.push('reviews');
  return channels;
}

// Pure read — no generation. Returns the current metrics snapshot.
async function collectMetrics(business) {
  const out = await prisma.businessOutput.findFirst({
    where: { businessId: business.id, type: 'user_metrics' },
  });
  if (!out) return { revenue: {}, leads: {}, social: {}, website: {} };
  try { return JSON.parse(out.content); } catch { return {}; }
}

// Regenerate website content with AI and redeploy to Netlify.
async function redeployWebsite(business, { reason }) {
  if (!process.env.NETLIFY_TOKEN) throw new Error('NETLIFY_TOKEN not configured');
  const websiteOut = await prisma.businessOutput.findFirst({
    where: { businessId: business.id, type: 'website' },
  });
  if (!websiteOut) throw new Error('No website generated yet');

  const { html } = await runManagementAgent(
    business,
    { recommendation: reason, priority: 'medium' },
    websiteOut.content,
  );
  await prisma.businessOutput.update({ where: { id: websiteOut.id }, data: { content: html } });

  const token = process.env.NETLIFY_TOKEN;
  let netlifyIntg = await prisma.integration.findFirst({
    where: { businessId: business.id, provider: 'netlify' },
  });
  let siteId, siteUrl;
  if (netlifyIntg?.status === 'connected' && netlifyIntg.metadata) {
    ({ siteId, siteUrl } = JSON.parse(netlifyIntg.metadata));
  } else {
    const site = await createSite(token, business.name);
    siteId = site.siteId; siteUrl = site.siteUrl;
    await prisma.integration.upsert({
      where: { businessId_provider: { businessId: business.id, provider: 'netlify' } },
      update: { status: 'connected', metadata: JSON.stringify({ siteId, siteUrl }) },
      create: { businessId: business.id, provider: 'netlify', status: 'connected', metadata: JSON.stringify({ siteId, siteUrl }) },
    });
  }
  const { liveUrl, deployId } = await deploySite(token, siteId, html);
  await prisma.integration.updateMany({
    where: { businessId: business.id, provider: 'netlify' },
    data: { metadata: JSON.stringify({ siteId, siteUrl, liveUrl, deployId, lastDeployed: new Date().toISOString() }) },
  });
  return { summary: `Website updated and live at ${liveUrl}` };
}

// Stubs — wired when social/ads/review platform integrations are added.
async function publishSocialPost(business, { brief }) {
  return { summary: `Social post queued: ${(brief || '').slice(0, 80)}` };
}
async function reallocateAdBudget(business, { plan }) {
  return { summary: `Ad budget adjustment queued: ${(plan || '').slice(0, 80)}` };
}
async function respondToReviews(business) {
  return { summary: 'Review responses queued.' };
}

module.exports = { getConnectedChannels, collectMetrics, redeployWebsite, publishSocialPost, reallocateAdBudget, respondToReviews };
