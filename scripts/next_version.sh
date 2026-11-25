#!/usr/bin/env bash
# Prints the next release tag: the highest vN or vN.M tag in the repository, with N + 1 and no minor part.
# v24 -> v25, v24.1 -> v25, no tags -> v1. Reads tags from the local clone (fetch them first).
set -euo pipefail
max=$(git tag --list 'v[0-9]*' | sed -n 's/^v\([0-9][0-9]*\)\(\.[0-9][0-9]*\)\{0,1\}$/\1/p' | sort -n | tail -1)
echo "v$(( ${max:-0} + 1 ))"
