#!/usr/bin/env bash
# Crée le dépôt GitHub (défaut : andro.sadak.app) et pousse la branche courante.
# Prérequis : gh installé + `gh auth login` une fois.
set -euo pipefail

REPO_NAME="${1:-andro.sadak.app}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "Installez GitHub CLI : brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
  if [[ -n "$TOKEN" ]]; then
    echo "$TOKEN" | gh auth login --with-token -h github.com 2>/dev/null || {
      echo "Échec auth avec GITHUB_TOKEN — vérifiez le PAT (scope: repo)."
      exit 1
    }
  else
    echo "Aucune session GitHub. Choisissez une option :"
    echo "  • Interactive : gh auth login"
    echo "  • Avec un PAT : export GITHUB_TOKEN=ghp_... puis relancez ce script"
    exit 1
  fi
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" == "HEAD" ]]; then
  echo "Branche invalide (detached HEAD). Créez une branche (ex: git checkout -b main)"
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote 'origin' existe déjà :"
  git remote -v
  echo "Pour pousser : git push -u origin $BRANCH"
  exit 0
fi

echo "Création du dépôt GitHub : $REPO_NAME (public) et push de '$BRANCH'..."
gh repo create "$REPO_NAME" --public --source=. --remote=origin --push

echo ""
echo "OK — dépôt créé et code poussé."
echo ""
echo "Vercel — déploiement automatique :"
echo "  1. https://vercel.com/dashboard → votre projet (ex. sadakapp-main-2)"
echo "  2. Settings → Git → Connect Git Repository"
echo "  3. Choisir le dépôt $(gh api user -q .login)/$REPO_NAME, branche $BRANCH"
echo "  4. Settings → Environment Variables : copier les VITE_* / Supabase depuis .env"
echo ""
echo "Si le dépôt existe déjà (sans gh) : GITHUB_USER=votre_compte ./scripts/push-github.sh"
echo "Ou installez la CLI : npm i -g vercel && vercel link"
