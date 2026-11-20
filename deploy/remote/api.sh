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
  image=$(docker image inspect --format '{{.Id}}' "$target:previous") || return 1
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

if [[ "$action" == rollback ]]; then
  compose logs --tail 60 api || true
  rollback
  exit $?
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
gunzip -c "$target.tar.gz" | docker load
rm -f "$target.tar.gz"
incoming=$(docker image inspect --format '{{.Id}}' "$target:latest")
if [[ -n "$old_image" && "$old_image" != "$incoming" ]]; then
  docker tag "$old_image" "$target:previous"
fi
if ! compose up -d postgres "${services[@]}" || ! wait_for_image "$incoming" "$expected"; then
  echo 'New API failed; last API logs:' >&2
  compose logs --tail 60 api || true
  if rollback; then
    echo 'Rollback healthy. Migrations were not reverted; restore backups/predeploy if needed.' >&2
  else
    echo 'Rollback failed or no previous image exists. Restore backups/predeploy if needed.' >&2
    compose logs --tail 60 api || true
  fi
  exit 1
fi

docker images "$target" --format '{{.Repository}}:{{.Tag}}' |
  grep -vxE "$target:(latest|previous)" | xargs -r docker rmi || true
docker image prune -f
docker builder prune -f >/dev/null 2>&1 || true
echo "$cron root $root/$backup >> /var/log/${backup%.sh}.log 2>&1" > "/etc/cron.d/${backup%.sh}"
compose ps
