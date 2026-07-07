/**
 * Social media image generation — SVG → PNG via sharp.
 * No external services: all composition happens in-process.
 *
 * Images are stored in memory with a 2-hour TTL and served at
 * GET /api/instagram/images/:id (no auth — Instagram's CDN fetches directly).
 */

const sharp  = require("sharp");
const crypto = require("crypto");

// ── In-memory image store ─────────────────────────────────────────────────────

const store  = new Map(); // id -> { buffer: Buffer, expires: number }
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function storeImage(buffer) {
  const id = crypto.randomUUID();
  store.set(id, { buffer, expires: Date.now() + TTL_MS });
  // Lazy cleanup: remove expired entries every 30 min
  if (store.size % 20 === 0) pruneExpired();
  return id;
}

function getImage(id) {
  const entry = store.get(id);
  if (!entry || entry.expires < Date.now()) return null;
  return entry.buffer;
}

function pruneExpired() {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expires < now) store.delete(id);
  }
}

// ── SVG templates ─────────────────────────────────────────────────────────────

const PALETTE = [
  ["#7C3AED", "#4F46E5"], // purple → indigo
  ["#059669", "#0D9488"], // emerald → teal
  ["#D97706", "#DC2626"], // amber → red
  ["#1D4ED8", "#7C3AED"], // blue → purple
  ["#0F172A", "#1E293B"], // dark
];

function pickPalette(seed) {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[n % PALETTE.length];
}

/**
 * Build an SVG post image using pure geometry — no text, no fonts required.
 * Looks professional and avoids all font-rendering issues across platforms.
 *
 * @param {string} businessName
 * @param {string} [seed] — deterministic palette seed
 * @returns {string} SVG markup
 */
/**
 * Build an SVG post image — pure geometry, no text elements.
 * Text is rendered client-side via Canvas API (browser fonts are always available).
 * librsvg on Railway has no system fonts, so all <text> elements are omitted here.
 */
function buildSvg(businessName, _bodyText, seed) {
  const W = 1080, H = 1080;
  const [c1, c2] = pickPalette(seed || businessName);

  let rng = 0;
  for (let i = 0; i < businessName.length; i++) rng = (rng * 31 + businessName.charCodeAt(i)) >>> 0;
  const r = (min, max) => { rng = (rng * 1664525 + 1013904223) >>> 0; return min + (rng % (max - min)); };

  const accents = [
    `<circle cx="${r(680,950)}" cy="${r(60,260)}" r="${r(180,280)}" fill="white" fill-opacity="0.06"/>`,
    `<circle cx="${r(80,300)}"  cy="${r(680,900)}" r="${r(100,170)}" fill="white" fill-opacity="0.04"/>`,
    `<circle cx="${r(480,580)}" cy="${r(420,560)}" r="${r(180,250)}" fill="none" stroke="white" stroke-width="1.5" stroke-opacity="0.07"/>`,
    `<rect x="${r(60,110)}" y="${r(60,110)}" width="28" height="28" rx="5" fill="white" fill-opacity="0.12"/>`,
    `<rect x="${r(120,180)}" y="${r(70,130)}" width="16" height="16" rx="3" fill="white" fill-opacity="0.07"/>`,
    `<line x1="${r(820,920)}" y1="${r(680,780)}" x2="${r(880,980)}" y2="${r(800,900)}" stroke="white" stroke-width="2.5" stroke-opacity="0.14" stroke-linecap="round"/>`,
  ];

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="vig" cx="50%" cy="50%" r="72%">
      <stop offset="55%" stop-color="${c1}" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.32"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${accents.join("\n  ")}
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a social post image and return an id that can be served via
 * GET /api/instagram/images/:id.
 *
 * @param {string} businessName
 * @param {string} captionBody  — the body text of the caption (no hashtags)
 * @returns {Promise<string>}    image id
 */
async function generatePostImage(businessName, captionBody) {
  const svg    = buildSvg(businessName, captionBody || "New post");
  const buffer = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 8 })
    .toBuffer();
  return storeImage(buffer);
}

module.exports = { generatePostImage, getImage, storeImage };
