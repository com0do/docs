#!/usr/bin/env bash
# Regenerate manifest.json and force-push the repo as a single commit.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMMIT_MESSAGE="${COMMIT_MESSAGE:-docs: publish}"
BRANCH="${BRANCH:-main}"

cd "$ROOT"
python3 scripts/generate-manifest.py

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "✗ not a git repository: $ROOT" >&2
  exit 1
fi

git add -A
if git diff --cached --quiet; then
  echo "✓ nothing to publish"
  exit 0
fi

commit_flags=()
if [[ "${SKIP_GIT_HOOKS:-1}" == "1" ]]; then
  commit_flags+=(--no-verify)
fi

current_branch="$(git branch --show-current 2>/dev/null || echo "$BRANCH")"
git checkout --orphan publish-tmp
git add -A
git -c user.useConfigOnly=true commit "${commit_flags[@]}" -m "$COMMIT_MESSAGE"
git branch -D "$current_branch" 2>/dev/null || true
git branch -M "$current_branch"
git push -f origin "$current_branch"

echo "✓ published single commit to origin/$current_branch"
