#!/usr/bin/env bash
# Checks that the committed site/index.html is exactly what the build steps produce, and that every
# build step is idempotent (a second run changes nothing). Run from the repository root:
#   bash tests/build_check.sh
set -euo pipefail

STEPS=$(ls tools/v2[0-9].py | sort -V)
echo "Build steps: $(echo $STEPS | tr '\n' ' ')"

run_all() { for s in $STEPS; do python3 "$s" > /dev/null; done; }

run_all
if ! git diff --quiet -- site tools; then
  echo "FAIL: running the build steps changed committed files. Run them and commit the result:"
  git diff --stat -- site tools
  exit 1
fi
echo "ok   committed page matches the build steps"

run_all
if ! git diff --quiet -- site tools; then
  echo "FAIL: a second run of the build steps changed files (a step is not idempotent):"
  git diff --stat -- site tools
  exit 1
fi
echo "ok   build steps are idempotent"

# the doctrine timeline: every quotation must still be found word for word in its source text
python3 tools/doctrines.py > /dev/null
if ! git diff --quiet -- site/bible/doctrines.js; then
  echo "FAIL: site/bible/doctrines.js is out of date. Run python3 tools/doctrines.py and commit it."
  exit 1
fi
echo "ok   doctrine timeline quotations verified against their sources"
