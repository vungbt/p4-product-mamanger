#!/usr/bin/env bash
set -euo pipefail
root="$1"
release="$2"
test -s "$root/releases/$release/index.html"
chmod -R a+rX "$root/releases/$release"
# Rename within the same directory keeps nginx's current path continuously available.
rm -f "$root/current.next"
ln -s "$root/releases/$release" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"
echo "Published web release: $release"
# Release names are generated SHA/timestamps without whitespace.
# shellcheck disable=SC2012
ls -1dt "$root"/releases/* | tail -n +4 | xargs -r rm -rf
