#!/usr/bin/env bash
# One-shot: commit local tree and push to https://github.com/Mehrn0ush/tmbom-studio
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -d .git ]]; then
  git init -b main
fi

git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit."
else
  git commit -m "$(cat <<'EOF'
Initial release of tmbom-studio

CycloneDX 2.0 TM-BOM workspace with Apache-2.0 license, sample
checkout-api artifact, file-based project save/load, CI, and
GitHub Pages deploy workflow.
EOF
)"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin https://github.com/Mehrn0ush/tmbom-studio.git
fi

git push -u origin HEAD:main
echo
echo "Pushed. Next: GitHub → Settings → Pages → Source: GitHub Actions"
echo "Live URL (after deploy): https://mehrn0ush.github.io/tmbom-studio/"
