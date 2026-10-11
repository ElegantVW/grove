#!/usr/bin/env bash
# versions.sh — report Grove version buttons vs live GitHub releases.
# Usage: ./versions.sh   (needs: gh)
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PAGE="$HERE/../index.html"
check() { # repo expected_tag
  local live
  live=$(gh api "repos/ElegantVW/$1/releases/latest" --jq .tag_name 2>/dev/null || echo "?")
  if [ "$live" = "$2" ]; then echo "ok      $1 $live"; else echo "STALE   $1 page=$2 live=$live"; fi
  grep -q "$1/releases/tag/$2" "$PAGE" || echo "MISSING $1 button $2 not in index.html"
}
check kindling v0.0.3
check bulwark v0.9.9
check pixie v1.1.2
check magpie v0.1.0
check siren v0.1.1
check goblin v0.1.1
check mourama v0.0.1
check kur v0.9.0
check imp v3.3.3
check scroll v1.0.0
