/**
 * Client-side social post image generator using browser Canvas API.
 * Browser always has fonts — text renders correctly unlike server-side librsvg.
 *
 * Usage:
 *   import { generatePostImageBlob } from "../lib/postImageCanvas";
 *   const blob = await generatePostImageBlob(businessName, captionBody);
 *   const { imageUrl } = await api.instagram.uploadImage(blob);
 */

const PALETTES = [
  ["#7C3AED", "#4F46E5"],
  ["#059669", "#0D9488"],
  ["#D97706", "#DC2626"],
  ["#1D4ED8", "#7C3AED"],
  ["#0F172A", "#1E293B"],
];

function pickPalette(seed) {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTES[n % PALETTES.length];
}

function seededRng(seed) {
  let state = 0;
  for (let i = 0; i < seed.length; i++) state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  return (min, max) => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return min + (state % (max - min));
  };
}

function roundRectPath(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth, maxLines) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

/**
 * Generate a 1080×1080 branded post image as a PNG Blob.
 * Renders entirely in the browser so system fonts are always available.
 *
 * @param {string} businessName  — used for palette + name label
 * @param {string} [captionBody] — caption text (first sentence displayed as headline)
 * @returns {Promise<Blob>}
 */
export async function generatePostImageBlob(businessName, captionBody = "") {
  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const r = seededRng(businessName);

  // Gradient background
  const [c1, c2] = pickPalette(businessName);
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Geometric accents — same layout algorithm as server imageGen.js
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.arc(r(680, 950), r(60, 260), r(180, 280), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.beginPath();
  ctx.arc(r(80, 300), r(680, 900), r(100, 170), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(r(480, 580), r(420, 560), r(180, 250), 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  roundRectPath(ctx, r(60, 110), r(60, 110), 28, 28, 5);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.07)";
  roundRectPath(ctx, r(120, 180), r(70, 130), 16, 16, 3);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(r(820, 920), r(680, 780));
  ctx.lineTo(r(880, 980), r(800, 900));
  ctx.stroke();

  const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

  // Headline text card — first sentence of the caption (max 64 chars)
  const firstSentence = (captionBody || "").split(/[.!?\n]/)[0]?.trim() || "";
  const displayText = firstSentence.length > 64 ? firstSentence.slice(0, 63) + "…" : firstSentence;

  if (displayText) {
    const fontSize = 56;
    ctx.font = `bold ${fontSize}px ${fontStack}`;

    const lines = wrapLines(ctx, displayText, 840, 3);
    const lineH = Math.round(fontSize * 1.35);
    const padV = 52;
    const cardH = padV * 2 + lines.length * lineH;
    const cardY = Math.round((H - cardH) / 2) - 30;

    // Frosted card
    ctx.fillStyle = "rgba(0,0,0,0.24)";
    roundRectPath(ctx, 80, cardY, 920, cardH, 18);
    ctx.fill();

    // Text — centered in card
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, cardY + padV + fontSize + i * lineH);
    });
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // Dark vignette overlay
  const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.42, W / 2, H / 2, W * 0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.30)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Business name — bottom left
  const nameText = businessName.length > 30 ? businessName.slice(0, 27) + "…" : businessName;
  ctx.font = `600 29px ${fontStack}`;
  ctx.fillStyle = "rgba(255,255,255,0.50)";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(nameText, 80, H - 38);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/png",
      0.92
    );
  });
}
