#!/usr/bin/env bash
set -euo pipefail

# This file also runs on laptops and CI; curl and Bash are the only requirements.
verify_release() {
  local kind="$1" url="$2" expected="$3" attempts="${4:-45}"
  local body attempt
  [[ "$expected" =~ ^[a-zA-Z0-9._-]+$ ]] || return 1
  for ((attempt = 1; attempt <= attempts; attempt++)); do
    if body=$(curl -fsS --connect-timeout 3 --max-time 5 -H 'Cache-Control: no-cache' "$url"); then
      if [[ "$kind" == api ]]; then
        if [[ "$body" =~ \"status\"[[:space:]]*:[[:space:]]*\"ok\" ]] &&
          [[ "$body" =~ \"version\"[[:space:]]*:[[:space:]]*\""$expected"\" ]]; then
          echo "Verified $url: $expected"
          return 0
        fi
      elif [[ "$body" == *"<meta name=\"version\" content=\"$expected\">"* ]]; then
        echo "Verified $url: $expected"
        return 0
      fi
    fi
    sleep 2
  done
  echo "Failed to verify $kind at $url (expected $expected)" >&2
  return 1
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  verify_release "$@"
fi
