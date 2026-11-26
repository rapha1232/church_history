#!/usr/bin/env bash
# Checks that the page builds from src/ (every source file used, nothing missing), that the build is
# deterministic, and that the generated data files are up to date. Run from the repository root:
#   bash tests/build_check.sh
set -euo pipefail

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

python3 scripts/build_site.py "$TMP/a.html"
python3 scripts/build_site.py "$TMP/b.html"
if ! cmp -s "$TMP/a.html" "$TMP/b.html"; then
  echo "FAIL: two builds of the same sources differ (the build is not deterministic)"
  exit 1
fi
echo "ok   page builds from src/ and the build is deterministic"

# the doctrine timeline: every quotation must still be found word for word in its source text
python3 tools/doctrines.py > /dev/null
if ! git diff --quiet -- site/bible/doctrines.js; then
  echo "FAIL: site/bible/doctrines.js is out of date. Run python3 tools/doctrines.py and commit it."
  exit 1
fi
echo "ok   doctrine timeline quotations verified against their sources"

python3 tools/studies.py > /dev/null
if ! git diff --quiet -- site/bible/studies.js; then
  echo "FAIL: site/bible/studies.js is out of date. Run python3 tools/studies.py and commit it."
  exit 1
fi
echo "ok   ready-made study quotations verified against their sources"
