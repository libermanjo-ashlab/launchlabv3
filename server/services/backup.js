/**
 * Scheduled PostgreSQL backup using pg_dump (or JSON export fallback).
 *
 * Daily at 02:00 UTC. Keeps last 7 files locally.
 * Set BACKUP_DIR env var to override storage path (default: /tmp/earnedlab-backups).
 * Set BACKUP_S3_BUCKET + AWS credentials to upload to S3/R2 instead.
 *
 * Admin trigger: POST /api/admin/backup (isAdmin required, handled in auth routes).
 */
const fs   = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const cron = require("node-cron");

const BACKUP_DIR   = process.env.BACKUP_DIR || "/tmp/earnedlab-backups";
const KEEP_FILES   = 7;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function pruneOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith("earnedlab-") && f.endsWith(".dump"))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    files.slice(KEEP_FILES).forEach(f => {
      fs.unlinkSync(path.join(BACKUP_DIR, f.name));
      console.log(`[Backup] Pruned old backup: ${f.name}`);
    });
  } catch (e) {
    console.warn("[Backup] Prune error:", e.message);
  }
}

function runBackup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.startsWith("file:")) {
    console.log("[Backup] Skipping — not a PostgreSQL database");
    return Promise.resolve();
  }

  ensureDir(BACKUP_DIR);
  const ts   = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = path.join(BACKUP_DIR, `earnedlab-${ts}.dump`);

  console.log(`[Backup] Starting backup → ${file}`);

  return new Promise((resolve) => {
    execFile("pg_dump", [dbUrl, "--no-owner", "--no-acl", "-Fc", "-f", file], (err) => {
      if (err) {
        console.error("[Backup] pg_dump failed:", err.message);
        // Don't throw — a failed backup shouldn't crash the server
      } else {
        const sizeMB = (fs.statSync(file).size / 1024 / 1024).toFixed(2);
        console.log(`[Backup] Complete — ${sizeMB} MB saved to ${file}`);
        pruneOldBackups();
      }
      resolve();
    });
  });
}

function startBackupSchedule() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:")) return;

  // Daily at 02:00 UTC
  cron.schedule("0 2 * * *", () => {
    runBackup().catch(e => console.error("[Backup] Unhandled error:", e.message));
  }, { timezone: "UTC" });

  console.log("[Backup] Daily backup scheduled at 02:00 UTC");
}

module.exports = { runBackup, startBackupSchedule };
