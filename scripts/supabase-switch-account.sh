#!/usr/bin/env bash
# Connexion CLI à un autre compte Supabase.
# Usage :
#   export SUPABASE_ACCESS_TOKEN="sbp_..."   # https://supabase.com/dashboard/account/tokens (compte cible)
#   ./scripts/supabase-switch-account.sh
#
# Lier le repo au projet (optionnel, besoin du mot de passe Postgres du projet) :
#   export SUPABASE_PROJECT_REF="oeczfyzawjkfnfnncgxz"
#   export SUPABASE_DB_PASSWORD="..."       # Settings → Database
#   ./scripts/supabase-switch-account.sh --link
#
# Si tu changes de projet Supabase pour l’app : édite .env (VITE_SUPABASE_*), puis :
#   npm run vercel:sync-supabase-env
# et adapte supabase/config.toml (project_id).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LINK=false
[[ "${1:-}" == "--link" ]] && LINK=true

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Définissez SUPABASE_ACCESS_TOKEN (token du compte Supabase cible)."
  exit 1
fi

npx supabase login --token "$SUPABASE_ACCESS_TOKEN" --name "sadakapp-cli"

echo "OK — session CLI active. Projets accessibles :"
npx supabase projects list

if [[ "$LINK" == true ]]; then
  REF="${SUPABASE_PROJECT_REF:-oeczfyzawjkfnfnncgxz}"
  if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    echo "Pour lier : export SUPABASE_DB_PASSWORD=... puis $0 --link"
    exit 0
  fi
  npx supabase link --project-ref "$REF" --password "$SUPABASE_DB_PASSWORD" --yes
  echo "Projet lié : $REF"
fi
