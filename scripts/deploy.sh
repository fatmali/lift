#!/usr/bin/env bash
#
# Publish Lift to GitHub Pages without using GitHub Actions.
#
# Builds locally and force-pushes the result to the `gh-pages` branch, which
# Pages serves directly. The branch holds build output only — it is not part
# of the source history, so it is replaced wholesale on every deploy.
#
# Usage: npm run deploy
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

REMOTE=$(git remote get-url origin)
REPO=$(basename -s .git "$REMOTE")
BRANCH=gh-pages

echo "→ Building for /$REPO/"
BASE_PATH="/$REPO/" npm run build

# Tell Pages to serve the files as-is instead of running them through Jekyll,
# which would otherwise skip anything it does not recognise.
touch dist/.nojekyll

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
cp -a dist/. "$STAGE/"

echo "→ Publishing to $BRANCH"
cd "$STAGE"
git init -q
git checkout -qb "$BRANCH"
git add -A
git -c user.name="${GIT_AUTHOR_NAME:-Lift deploy}" \
    -c user.email="${GIT_AUTHOR_EMAIL:-deploy@local}" \
    commit -qm "Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -q --force "$REMOTE" "$BRANCH"

echo "✓ Deployed. Live at https://$(basename "$(dirname "$REMOTE")" | sed 's/.*://').github.io/$REPO/"
