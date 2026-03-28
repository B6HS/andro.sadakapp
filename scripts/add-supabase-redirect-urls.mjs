#!/usr/bin/env node
/**
 * Ajoute https://andro.sadak.app aux « Redirect URLs » (uri_allow_list) du projet Supabase
 * via l’API Management (sans passer par le dashboard).
 *
 * Prérequis :
 *   1. Token : https://supabase.com/dashboard/account/tokens (accès au projet)
 *   2. Une fois dans le terminal :
 *        export SUPABASE_ACCESS_TOKEN="sbp_..."
 *        node scripts/add-supabase-redirect-urls.mjs
 *
 * DNS OVH (sadak.app) — à faire dans l’espace client (je ne peux pas me connecter à ta place) :
 *   Type A, nom « andro », valeur 76.76.21.21 (ou la valeur affichée par Vercel → Domaines → andro.sadak.app)
 */
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "znjqfcvksyjdqbwunshv";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const ADD = ["https://andro.sadak.app", "https://andro.sadak.app/**"];

const api = "https://api.supabase.com/v1";

function parseList(raw) {
  if (raw == null || raw === "") return [];
  return String(raw)
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  if (!TOKEN) {
    console.error(
      "Définissez SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)",
    );
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };

  const getRes = await fetch(`${api}/projects/${PROJECT_REF}/config/auth`, { headers });
  const text = await getRes.text();
  if (!getRes.ok) {
    console.error("GET /config/auth :", getRes.status, text);
    process.exit(1);
  }

  const config = JSON.parse(text);
  const merged = new Set(parseList(config.uri_allow_list));
  for (const u of ADD) merged.add(u);
  const uri_allow_list = [...merged].join(",");

  const patchRes = await fetch(`${api}/projects/${PROJECT_REF}/config/auth`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ uri_allow_list }),
  });
  const patchBody = await patchRes.text();
  if (!patchRes.ok) {
    console.error("PATCH /config/auth :", patchRes.status, patchBody);
    process.exit(1);
  }

  console.log("OK — uri_allow_list mis à jour pour", PROJECT_REF);
  console.log(patchBody.slice(0, 500) + (patchBody.length > 500 ? "…" : ""));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
