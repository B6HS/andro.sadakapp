#!/usr/bin/env bash
# Push du projet vers GitHub (dépôt andro.sadakapp par défaut).
# Usage :
#   ./scripts/push-github.sh                    # si origin existe déjà → push
#   GITHUB_USER=moncompte ./scripts/push-github.sh
#   ./scripts/push-github.sh moncompte
# SSH : GITHUB_USER=moncompte GITHUB_USE_SSH=1 ./scripts/push-github.sh
# Nom de repo autre : GITHUB_REPO=autre-nom GITHUB_USER=...
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REPO_NAME="${GITHUB_REPO:-andro.sadakapp}"

if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  echo "Des changements non commités — committez ou stash avant le push."
  git status -s
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" == "HEAD" ]]; then
  echo "Branche invalide (detached HEAD)."
  exit 1
fi

if git remote get-url origin &>/dev/null; then
  echo "Remote origin : $(git remote get-url origin)"
  echo "Push de la branche « $BRANCH »…"
  git push -u origin "$BRANCH"
  exit 0
fi

GITHUB_USER="${1:-${GITHUB_USER:-}}"
if [[ -z "$GITHUB_USER" ]]; then
  echo "Pas de remote « origin ». Choisissez :"
  echo ""
  echo "  1) Créer le dépôt + push (GitHub CLI) :"
  echo "       gh auth login && ./scripts/setup-github-vercel.sh"
  echo ""
  echo "  2) Dépôt déjà créé sur GitHub — ajouter origin puis pousser :"
  echo "       GITHUB_USER=votre_compte ./scripts/push-github.sh"
  echo "       # ou : git remote add origin https://github.com/votre_compte/${REPO_NAME}.git"
  echo "       #      git push -u origin $BRANCH"
  exit 1
fi

if [[ "${GITHUB_USE_SSH:-}" == "1" ]]; then
  URL="git@github.com:${GITHUB_USER}/${REPO_NAME}.git"
else
  URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
fi

echo "git remote add origin $URL"
git remote add origin "$URL"
echo "Push de la branche « $BRANCH »…"
git push -u origin "$BRANCH"
