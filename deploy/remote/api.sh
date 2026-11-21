#!/usr/bin/env bash
set -euo pipefail
# Migrations are NOT reverted by image rollback. Restore backups/predeploy if needed.
# shellcheck source=deploy/remote/verify.sh
source "$(dirname "$0")/verify.sh"
target="$1"
root="$2"
expected="$3"
action="${4:-deploy}"
case "$target" in
  p4-api)
    project=p4-prod
    file=docker-compose.yml
    env_file=.env.prod
    port=3001
    backup=p4-db-backup.sh
    cron='30 3 * * *'
    services=(api worker)
    ;;
  stay-api)
    project=stay
    file=docker-compose.stay.yml
    env_file=.env.stay.prod
    port=3011
    backup=stay-db-backup.sh
    cron='15 3 * * *'
    services=(api)
    ;;
  *) echo "Unknown API target: $target" >&2; exit 1 ;;
esac
cd "$root"
compose() { docker compose -f "$file" --env-file "$env_file" -p "$project" "$@"; }
rollback_state="$root/.${target}-rollback"
rollback_previous="$target:rollback-previous"
cleanup_incoming() {
  local protected running tags
  [[ -n "${incoming:-}" ]] || return 0
  # Never force removal: keep protected tags and images still used by containers.
  for protected in "$target:latest" "$target:previous"; do
    [[ "$(docker image inspect --format '{{.Id}}' "$protected" 2>/dev/null || true)" != "$incoming" ]] || return 0
  done
  tags=$(docker image inspect --format '{{range .RepoTags}}{{println .}}{{end}}' "$incoming") || return 0
  [[ -z "$tags" ]] || return 0
  running=$(docker ps -q --filter "ancestor=$incoming") || return 0
  [[ -z "$running" ]] || return 0
  docker image rm "$incoming" || true
}
restore_previous() {
  if [[ -n "$original_previous" ]]; then
    docker tag "$original_previous" "$target:previous" || return 1
  elif docker image inspect "$target:previous" >/dev/null 2>&1; then
    docker image rm "$target:previous" || return 1
  fi
  docker image rm "$rollback_previous" >/dev/null 2>&1 || true
}
image_version() {
  docker image inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$1" |
    sed -n 's/^APP_VERSION=//p'
}
wait_for_image() {
  local image="$1" version="$2" container
  verify_release api "http://127.0.0.1:$port/health" "$version" || return 1
  container=$(compose ps -q api) || return 1
  [[ -n "$container" ]] || return 1
  [[ "$(docker inspect --format '{{.Image}}' "$container")" == "$image" ]]
}
rollback() {
  local image version
  image="$old_image"
  [[ -n "$image" ]] || return 1
  version=$(image_version "$image") || return 1
  docker tag "$image" "$target:latest" || return 1
  compose up -d "${services[@]}" || return 1
  if [[ -n "$version" ]]; then
    wait_for_image "$image" "$version"
  else
    # The first hardened deploy may roll back to an image predating versioned /health.
    # Check its actual container image ID and HTTP health, and call out the limitation.
    echo 'Legacy rollback image has no APP_VERSION; checking image ID and HTTP health.' >&2
    local attempt container
    for ((attempt = 1; attempt <= 45; attempt++)); do
      container=$(compose ps -q api) || return 1
      if [[ -n "$container" ]] &&
        [[ "$(docker inspect --format '{{.Image}}' "$container")" == "$image" ]] &&
        curl -fsS --connect-timeout 3 --max-time 5 "http://127.0.0.1:$port/health" >/dev/null; then
        return 0
      fi
      sleep 2
    done
    return 1
  fi
}

if [[ "$action" == finalize ]]; then
  # Public verification passed; the older release no longer needs a rollback pin.
  if docker image inspect "$rollback_previous" >/dev/null 2>&1; then
    docker image rm "$rollback_previous" || exit 1
  fi
  rm -f "$rollback_state" || exit 1
  docker image prune -f || exit 1
  exit 0
fi

if [[ "$action" == rollback ]]; then
  compose logs --tail 60 api || true
  if [[ -f "$rollback_state" ]]; then
    {
      read -r old_image
      read -r original_previous
      read -r incoming
    } < "$rollback_state"
  else
    # Support manual rollback on hosts that have not saved deployment state yet.
    old_image=$(docker image inspect --format '{{.Id}}' "$target:previous")
    original_previous="$old_image"
    incoming=''
  fi
  status=0
  rollback || status=$?
  restore_previous || status=1
  cleanup_incoming
  # Consume successful rollback state so a later manual rollback uses :previous.
  if [[ "$status" == 0 ]]; then
    rm -f "$rollback_state"
  fi
  exit "$status"
fi
chmod 600 "$env_file"
chmod 700 "$backup"
postgres=$(compose ps --status running -q postgres)
if [[ -n "$postgres" ]]; then
  echo 'Pre-deploy database backup (kept 30 days)...'
  BACKUP_DIR="$root/backups/predeploy" KEEP_DAYS=30 "./$backup" </dev/null
fi

# Save the running image ID before load replaces :latest. Fall back to the tag on first start.
container=$(compose ps -q api)
old_image=''
if [[ -n "$container" ]]; then
  old_image=$(docker inspect --format '{{.Image}}' "$container")
else
  old_image=$(docker image inspect --format '{{.Id}}' "$target:latest" 2>/dev/null || true)
fi
# Save the pre-attempt tags for both local health failures and later public failures.
# Pin the older release: the successful deploy's prune must not discard it before
# the laptop has completed public verification and finalized the deploy.
original_previous=$(docker image inspect --format '{{.Id}}' "$target:previous" 2>/dev/null || true)
if [[ -n "$original_previous" ]]; then
  docker tag "$original_previous" "$rollback_previous"
else
  docker image rm "$rollback_previous" >/dev/null 2>&1 || true
fi
gunzip -c "$target.tar.gz" | docker load
rm -f "$target.tar.gz"
incoming=$(docker image inspect --format '{{.Id}}' "$target:latest")
printf '%s\n' "$old_image" "$original_previous" "$incoming" > "$rollback_state.tmp"
mv "$rollback_state.tmp" "$rollback_state"
if [[ -n "$old_image" && "$old_image" != "$incoming" ]]; then
  docker tag "$old_image" "$target:previous"
fi
if ! compose up -d postgres "${services[@]}" || ! wait_for_image "$incoming" "$expected"; then
  echo 'New API failed; last API logs:' >&2
  compose logs --tail 60 api || true
  status=0
  if rollback; then
    echo 'Rollback healthy. Migrations were not reverted; restore backups/predeploy if needed.' >&2
  else
    status=1
    echo 'Rollback failed or no previous image exists. Restore backups/predeploy if needed.' >&2
    compose logs --tail 60 api || true
  fi
  if ! restore_previous; then
    status=1
    echo 'Could not restore the original previous tag.' >&2
  fi
  cleanup_incoming
  if [[ "$status" == 0 ]]; then
    rm -f "$rollback_state"
  fi
  exit 1
fi

docker images "$target" --format '{{.Repository}}:{{.Tag}}' |
  grep -vxE "$target:(latest|previous|rollback-previous)" | xargs -r docker rmi || true
docker image prune -f
docker builder prune -f >/dev/null 2>&1 || true
echo "$cron root $root/$backup >> /var/log/${backup%.sh}.log 2>&1" > "/etc/cron.d/${backup%.sh}"
compose ps
