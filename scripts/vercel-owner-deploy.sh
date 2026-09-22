#!/usr/bin/env bash
# Trigger a Vercel deploy on Hobby + private repo by pushing a commit authored as the repo owner.
# Usage (from repo root, with a PAT for tosinjames385-maker):
#   GITHUB_TOKEN=ghp_xxx ./scripts/vercel-owner-deploy.sh

set -euo pipefail

OWNER_NAME="tosinjames385-maker"
OWNER_EMAIL="332264268+tosinjames385-maker@users.noreply.github.com"
REMOTE="${REMOTE:-https://github.com/tosinjames385-maker/mollie-verify.git}"
BRANCH="${BRANCH:-main}"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Set GITHUB_TOKEN to a personal access token for ${OWNER_NAME} (repo scope)."
  exit 1
fi

git pull "${REMOTE}" "${BRANCH}" 2>/dev/null || true

export GIT_AUTHOR_NAME="${OWNER_NAME}"
export GIT_AUTHOR_EMAIL="${OWNER_EMAIL}"
export GIT_AUTHOR_DATE="$(date -R)"
export GIT_COMMITTER_NAME="${OWNER_NAME}"
export GIT_COMMITTER_EMAIL="${OWNER_EMAIL}"
export GIT_COMMITTER_DATE="${GIT_AUTHOR_DATE}"

git commit --allow-empty \
  --author="${OWNER_NAME} <${OWNER_EMAIL}>" \
  -m "chore: trigger Vercel production deploy (owner commit)"

PUSH_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/tosinjames385-maker/mollie-verify.git"
git push "${PUSH_URL}" "HEAD:${BRANCH}"

echo "Pushed owner commit to ${BRANCH}. Check Vercel Deployments in ~1 minute."
