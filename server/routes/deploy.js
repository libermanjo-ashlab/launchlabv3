/**
 * /api/deploy — Live Netlify deployment routes
 *
 * POST /api/deploy/netlify/:businessId        — deploy/redeploy current website HTML
 * POST /api/deploy/netlify/:businessId/update — AI regenerates content, then redeploys
 * GET  /api/deploy/netlify/:businessId        — get current deployment status and URL
 */

const router      = require("express").Router();
const requireAuth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const { createSite, deploySite, getSiteInfo } = require("../services/netlify");
const { generateWebsite } = require("../services/ai");

const prisma = new PrismaClient();

function getNetlifyToken() {
  if (!process.env.NETLIFY_TOKEN) {
    throw Object.assign(new Error("NETLIFY_TOKEN not set — add it to your Railway environment variables"), { status: 503 });
  }
  return process.env.NETLIFY_TOKEN;
}

async function getOrCreateNetlifySite(token, business) {
  // Check if we already have a Netlify integration saved
  const existing = await prisma.integration.findFirst({
    where: { businessId: business.id, provider: "netlify" },
  });

  if (existing?.status === "connected" && existing.metadata) {
    const meta = JSON.parse(existing.metadata);
    if (meta.siteId) return meta;
  }

  // Create a new Netlify site
  const { siteId, siteUrl } = await createSite(token, business.name);

  // Save to DB
  await prisma.integration.upsert({
    where:  { businessId_provider: { businessId: business.id, provider: "netlify" } },
    update: { status: "connected", metadata: JSON.stringify({ siteId, siteUrl }) },
    create: { businessId: business.id, provider: "netlify", status: "connected",
              metadata: JSON.stringify({ siteId, siteUrl }) },
  });

  return { siteId, siteUrl };
}

// GET /api/deploy/netlify/:businessId — current deployment info
router.get("/netlify/:businessId", requireAuth, async (req, res, next) => {
  try {
    const business = await prisma.business.findFirst({
      where: { id: req.params.businessId, userId: req.userId },
    });
    if (!business) return res.status(404).json({ error: "Business not found" });

    const intg = await prisma.integration.findFirst({
      where: { businessId: req.params.businessId, provider: "netlify" },
    });

    if (!intg || intg.status !== "connected") {
      return res.json({ deployed: false });
    }

    const meta = JSON.parse(intg.metadata || "{}");
    res.json({ deployed: true, ...meta });
  } catch (e) { next(e); }
});

// POST /api/deploy/netlify/:businessId — deploy existing website HTML to Netlify
router.post("/netlify/:businessId", requireAuth, async (req, res, next) => {
  try {
    const token    = getNetlifyToken();
    const business = await prisma.business.findFirst({
      where: { id: req.params.businessId, userId: req.userId },
    });
    if (!business) return res.status(404).json({ error: "Business not found" });

    // Get the stored website HTML
    const websiteOutput = await prisma.businessOutput.findFirst({
      where: { businessId: req.params.businessId, type: "website" },
    });
    if (!websiteOutput) {
      return res.status(400).json({ error: "Generate the website first in the Content tab" });
    }

    const site = await getOrCreateNetlifySite(token, business);
    const { deployId, liveUrl } = await deploySite(token, site.siteId, websiteOutput.content);

    // Save live URL
    await prisma.integration.updateMany({
      where: { businessId: req.params.businessId, provider: "netlify" },
      data: { metadata: JSON.stringify({ ...site, liveUrl, deployId, lastDeployed: new Date().toISOString() }) },
    });

    res.json({ deployed: true, liveUrl, deployId, siteId: site.siteId });
  } catch (e) { next(e); }
});

// POST /api/deploy/netlify/:businessId/update — AI regenerates website, then redeploys live
router.post("/netlify/:businessId/update", requireAuth, async (req, res, next) => {
  try {
    const token    = getNetlifyToken();
    const business = await prisma.business.findFirst({
      where: { id: req.params.businessId, userId: req.userId },
    });
    if (!business) return res.status(404).json({ error: "Business not found" });

    let idea = {}, intake = {};
    try { idea   = JSON.parse(business.ideaData   || "{}"); } catch {}
    try { intake = JSON.parse(business.intakeData  || "{}"); } catch {}

    const { updateInstructions } = req.body;
    if (updateInstructions) intake._updateInstructions = updateInstructions;

    const newHtml = await generateWebsite(business, idea, intake);

    // Save new version to BusinessOutput
    const existing = await prisma.businessOutput.findFirst({
      where: { businessId: business.id, type: "website" },
    });
    const updatedOutput = existing
      ? await prisma.businessOutput.update({ where: { id: existing.id }, data: { content: newHtml } })
      : await prisma.businessOutput.create({ data: { businessId: business.id, type: "website", title: business.name + " — Website", content: newHtml } });

    const site = await getOrCreateNetlifySite(token, business);
    const { deployId, liveUrl } = await deploySite(token, site.siteId, newHtml);
    await prisma.integration.updateMany({
      where: { businessId: business.id, provider: "netlify" },
      data: { metadata: JSON.stringify({ ...site, liveUrl, deployId, lastDeployed: new Date().toISOString() }) },
    });

    res.json({ deployed: true, liveUrl, deployId, outputId: updatedOutput.id });
  } catch (e) { next(e); }
});

module.exports = router;
