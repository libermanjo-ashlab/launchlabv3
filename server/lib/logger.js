/**
 * Structured logger for the marketing agent pipeline.
 *
 * Output format (one line per entry, grep-friendly):
 *   [TIMESTAMP] [LEVEL] [TAG] message | key=value key=value ...
 *
 * Tags:
 *   OPENAI    – GPT-4o and DALL-E API calls
 *   IMAGE     – image generation (DALL-E, SVG, canvas upload)
 *   TASK      – campaign task execution (POST /tasks/:id/run)
 *   CAPTION   – caption generation (any path)
 *   IMPLEMENT – management/implement route
 *   CONTENT   – task-content route
 *   BRAND     – brand identity fetch / populate
 *   AUTOPILOT – autopilot cycle
 *   API       – general route-level events
 *
 * Usage:
 *   const log = require("../lib/logger");
 *   log.info("TASK", "Campaign task started", { taskId, mode, channel });
 *   log.error("OPENAI", "DALL-E 3 failed", { error: err.message, businessName });
 */

function fmt(level, tag, msg, data) {
  const ts = new Date().toISOString();
  const pairs = data
    ? Object.entries(data)
        .map(([k, v]) => {
          const val = v === null || v === undefined ? "null"
            : typeof v === "string" ? (v.length > 120 ? v.slice(0, 120) + "…" : v)
            : typeof v === "object" ? JSON.stringify(v).slice(0, 120)
            : String(v);
          return `${k}=${val}`;
        })
        .join(" | ")
    : "";
  return `${ts} [${level}] [${tag}] ${msg}${pairs ? " | " + pairs : ""}`;
}

const log = {
  info:  (tag, msg, data) => console.log(fmt("INFO ", tag, msg, data)),
  warn:  (tag, msg, data) => console.warn(fmt("WARN ", tag, msg, data)),
  error: (tag, msg, data) => console.error(fmt("ERROR", tag, msg, data)),
  debug: (tag, msg, data) => { if (process.env.LOG_DEBUG) console.log(fmt("DEBUG", tag, msg, data)); },
};

module.exports = log;
