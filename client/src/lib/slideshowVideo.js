/**
 * Generates a WebM slideshow video from AI-generated slides.
 * Each slide is rendered onto a canvas (background image + headline + subtext),
 * then captured via canvas.captureStream() + MediaRecorder into a WebM blob.
 *
 * @param {Array<{headline:string, subtext:string}>} slides
 * @param {string|null} backgroundUrl  — URL of the AI-generated background image
 * @param {string} businessName
 * @param {number} [slideDuration=4000]  — ms per slide
 * @param {number} [fps=25]
 * @returns {Promise<Blob>}  — WebM video blob
 */
export async function generateSlideshowBlob(slides, backgroundUrl, businessName, slideDuration = 4000, fps = 25) {
  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Load background image once (shared across all slides)
  let bgImg = null;
  if (backgroundUrl) {
    bgImg = await new Promise(resolve => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload  = () => resolve(el);
      el.onerror = () => resolve(null);
      el.src = backgroundUrl;
    });
  }

  const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

  function drawSlide(slide) {
    // Background
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, W, H);
    } else {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#1D4ED8");
      grad.addColorStop(1, "#7C3AED");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Dark overlay for legibility
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(0, 0, W, H);

    // Vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.72);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Headline
    const headline = (slide.headline || "").slice(0, 120);
    ctx.font = `bold 64px ${fontStack}`;
    ctx.fillStyle = "rgba(255,255,255,0.97)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const hlLines = wrapText(ctx, headline, 880);
    const hlLineH = 82;
    const totalHlH = hlLines.length * hlLineH;
    const hlStartY = H / 2 - totalHlH / 2 - (slide.subtext ? 50 : 0);
    hlLines.forEach((line, i) => {
      ctx.fillText(line, W / 2, hlStartY + i * hlLineH);
    });

    // Subtext
    if (slide.subtext) {
      const subtext = (slide.subtext || "").slice(0, 180);
      ctx.font = `400 34px ${fontStack}`;
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      const subLines = wrapText(ctx, subtext, 820, 3);
      const subLineH = 46;
      const subStartY = hlStartY + totalHlH + 36;
      subLines.forEach((line, i) => {
        ctx.fillText(line, W / 2, subStartY + i * subLineH);
      });
    }

    // Business name bottom
    ctx.font = `600 28px ${fontStack}`;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.textAlign = "center";
    ctx.fillText(businessName, W / 2, H - 44);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  function wrapText(ctx, text, maxWidth, maxLines = 4) {
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

  // Set up MediaRecorder
  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  const done = new Promise((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = reject;
  });

  recorder.start();

  const FADE_FRAMES = Math.round(fps * 0.4); // ~0.4s fade
  const HOLD_FRAMES = Math.round((slideDuration / 1000 - 0.4) * fps);

  for (let s = 0; s < slides.length; s++) {
    const slide = slides[s];

    // Hold frames
    drawSlide(slide);
    for (let f = 0; f < HOLD_FRAMES; f++) {
      await nextAnimationFrame();
    }

    // Fade-out to black (except last slide)
    if (s < slides.length - 1) {
      for (let f = 0; f < FADE_FRAMES; f++) {
        drawSlide(slide);
        const alpha = (f + 1) / FADE_FRAMES;
        ctx.fillStyle = `rgba(0,0,0,${alpha.toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
        await nextAnimationFrame();
      }
    }
  }

  recorder.stop();
  return done;
}

function nextAnimationFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}
