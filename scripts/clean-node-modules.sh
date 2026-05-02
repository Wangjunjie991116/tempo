#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

count=0
while IFS= read -r -d '' dir; do
  count=$((count + 1))
  printf 'Removing %s\n' "${dir#./}"
  rm -rf "$dir"
done < <(
  find . \( \
      -path './.git' -o \
      -path './.git/*' -o \
      -path './.cursor' -o \
      -path './.cursor/*' \
    \) -prune -o \
    -name node_modules -type d -print0 \
  2>/dev/null
)

if [[ "$count" -eq 0 ]]; then
  echo 'No node_modules directories found.'
else
  printf 'Removed %d node_modules director(y/ies).\n' "$count"
fi
