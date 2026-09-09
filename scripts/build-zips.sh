#!/usr/bin/env bash
# Regenerates the dependency zips for the Disband bot docs.
#
# Usage:  ./build-zips.sh [path/to/disband-monorepo]
# Default monorepo path: ~/Projects/disband-latest
set -euo pipefail

REPO="${1:-$HOME/Projects/disband-latest}"
ZIPS="$(cd "$(dirname "$0")/.." && pwd)/zips"

if [[ ! -f "$REPO/package.json" ]]; then
  echo "Monorepo not found at $REPO" >&2
  exit 1
fi

mkdir -p "$ZIPS"

echo "Packing @disband/bot …"
(
  cd "$REPO/packages/bot"
  npm pack --pack-destination "$ZIPS" >/dev/null
)

echo "Packing disband-bot (Python) …"
tar -czf "$ZIPS/disband-bot-python-0.1.0.tar.gz" -C "$REPO/packages" \
  disband-bot-python/pyproject.toml \
  disband-bot-python/README.md \
  disband-bot-python/disband_bot

echo "Wrote:"
ls -lh "$ZIPS" | tail -n +2