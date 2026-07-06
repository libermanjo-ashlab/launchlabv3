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

// ── Text helpers ──────────────────────────────────────────────────────────────

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Wrap text into lines of at most `maxChars` characters, preserving words.
function wrapText(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars) {
      if (current) lines.push(current);
      current = word.slice(0, maxChars); // hard-break very long words
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
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
 * Build the SVG for a social media post card.
 *
 * @param {string} businessName
 * @param {string} bodyText   — first ~200 chars of the caption body (no hashtags)
 * @param {string} [seed]     — deterministic palette seed (default: businessName)
 * @returns {string} SVG markup
 */
function buildSvg(businessName, bodyText, seed) {
  const W = 1080, H = 1080;
  const [c1, c2] = pickPalette(seed || businessName);

  // Body text — wrap to ~28 chars per line, show max 7 lines
  const rawLines = wrapText(bodyText.slice(0, 260), 28);
  const lines = rawLines.slice(0, 7);
  if (rawLines.length > 7) {
    lines[6] = lines[6].slice(0, lines[6].length - 1) + "…";
  }

  const fontSize    = lines.length <= 4 ? 64 : 54;
  const lineSpacing = fontSize * 1.35;
  const blockH      = lines.length * lineSpacing;
  const startY      = (H - blockH) / 2 + fontSize;

  const textRows = lines.map((line, i) => `
    <text x="540" y="${Math.round(startY + i * lineSpacing)}"
      text-anchor="middle" dominant-baseline="auto"
      font-family="'Arial', 'Helvetica Neue', sans-serif"
      font-size="${fontSize}" font-weight="600"
      fill="rgba(255,255,255,0.95)">${escapeXml(line)}</text>`).join("");

  // Business name — top strip
  const bizName = businessName.length > 30 ? businessName.slice(0, 29) + "…" : businessName;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
  xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <!-- subtle vignette -->
    <radialGradient id="vig" cx="50%" cy="50%" r="70%">
      <stop offset="60%" stop-color="transparent"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.25)"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>

  <!-- Top strip -->
  <rect x="0" y="0" width="${W}" height="110" fill="rgba(0,0,0,0.18)"/>
  <text x="540" y="68"
    text-anchor="middle"
    font-family="'Arial', 'Helvetica Neue', sans-serif"
    font-size="32" font-weight="700" letter-spacing="3"
    fill="rgba(255,255,255,0.85)">${escapeXml(bizName.toUpperCase())}</text>

  <!-- Decorative line -->
  <rect x="200" y="90" width="680" height="1.5" fill="rgba(255,255,255,0.2)"/>

  <!-- Main caption text -->
  ${textRows}

  <!-- Bottom bar -->
  <rect x="0" y="${H - 80}" width="${W}" height="80" fill="rgba(0,0,0,0.18)"/>
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
