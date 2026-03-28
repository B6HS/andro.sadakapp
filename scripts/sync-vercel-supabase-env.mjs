#!/usr/bin/env node
/**
 * Pousse VITE_SUPABASE_* depuis .env vers Vercel (Production).
 * Usage : node scripts/sync-vercel-supabase-env.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

function parseEnvFile(text) {
  const out = {};
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function setVercelEnv(name, value, environment = "production") {
  const add = spawnSync(
    "npx",
    ["vercel", "env", "add", name, environment, "--non-interactive"],
    { cwd: root, input: value, encoding: "utf-8" },
  );
  if (add.status === 0) {
    console.log(`+ ${name} (${environment})`);
    return;
  }
  const upd = spawnSync(
    "npx",
    [
      "vercel",
      "env",
      "update",
      name,
      environment,
      "--yes",
      "--non-interactive",
    ],
    { cwd: root, input: value, encoding: "utf-8" },
  );
  if (upd.status === 0) {
    console.log(`~ ${name} (${environment})`);
    return;
  }
  console.error(add.stderr || add.stdout || "", upd.stderr || upd.stdout || "");
  throw new Error(`Échec ${name}`);
}

if (!fs.existsSync(envPath)) {
  console.error("Fichier .env introuvable — copiez .env.example vers .env");
  process.exit(1);
}

const env = parseEnvFile(fs.readFileSync(envPath, "utf-8"));
const keys = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PROJECT_ID",
];

for (const k of keys) {
  if (!env[k]) {
    console.warn(`(skip) ${k} absent du .env`);
    continue;
  }
  setVercelEnv(k, env[k]);
}

console.log("OK — variables Supabase synchronisées vers Vercel Production.");
