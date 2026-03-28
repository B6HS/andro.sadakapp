#!/usr/bin/env bash
# Applique les migrations sur le projet Supabase distant (znjqfcvksyjdqbwunshv).
# Prérequis :
#   export SUPABASE_ACCESS_TOKEN="sbp_..."   # https://supabase.com/dashboard/account/tokens
#   export SUPABASE_DB_PASSWORD="..."        # Dashboard → Settings → Database → mot de passe
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Définissez SUPABASE_ACCESS_TOKEN (token personnel Supabase)."
  exit 1
fi
if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Définissez SUPABASE_DB_PASSWORD (mot de passe Postgres du projet)."
  exit 1
fi

npx supabase login --token "$SUPABASE_ACCESS_TOKEN" --name "andro-sadakapp-cli"
npx supabase link --project-ref znjqfcvksyjdqbwunshv --password "$SUPABASE_DB_PASSWORD" --yes
npx supabase db push --yes
echo "OK — migrations appliquées. Puis : npm run vercel:sync-supabase-env && npx vercel deploy --prod"
