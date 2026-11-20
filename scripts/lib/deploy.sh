#!/usr/bin/env bash
# SSH command arguments intentionally expand locally before transmission.
# shellcheck disable=SC2029
# Loaded by the laptop entry points after changing to the repository root.
# shellcheck source=deploy/remote/verify.sh
source deploy/remote/verify.sh

run_remote_script() {
  local script="$1" directory command argument status=0
  shift
  directory=$(ssh "$SERVER" 'mktemp -d /tmp/p4-deploy.XXXXXXXX')
  if scp -q deploy/remote/*.sh "$SERVER:$directory/"; then
    # SSH joins arguments as a command; quote each one for the remote shell.
    printf -v command 'bash %q' "$directory/$script"
    for argument in "$@"; do
      printf -v command '%s %q' "$command" "$argument"
    done
    ssh "$SERVER" "$command" </dev/null || status=$?
  else
    status=1
  fi
  ssh "$SERVER" "rm -rf '$directory'" </dev/null || true
  return "$status"
}

stamp_web_release() {
  local index="$1" version="$2"
  # Use Node already required by the web build, avoiding platform-specific sed -i.
  node --input-type=module - "$index" "$version" <<'JS'
import { readFileSync, writeFileSync } from 'node:fs';
const [file, version] = process.argv.slice(2);
const html = readFileSync(file, 'utf8');
if (!html.includes('</head>')) throw new Error(`Missing </head> in ${file}`);
writeFileSync(file, html.replace('</head>', `<meta name="version" content="${version}"></head>`));
JS
}

verify_public_api() {
  local target="$1" root="$2" url="$3" expected="$4"
  if verify_release api "$url" "$expected"; then
    return 0
  fi
  echo 'Public API verification failed; rolling back. Migrations are not reverted.' >&2
  if ! run_remote_script api.sh "$target" "$root" "$expected" rollback; then
    echo 'Rollback failed; inspect the API logs and backups/predeploy.' >&2
  fi
  return 1
}
