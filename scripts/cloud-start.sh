#!/usr/bin/env bash
set -euo pipefail
cd /workspace

PORT=43127
if curl -sf "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
  echo "LiveStats already responding on :${PORT}"
  exit 0
fi

# Prefer existing local secrets when present; demo mode works without them.
if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  # AUTH_SECRET required for session cookies even in demo
  if ! grep -q '^AUTH_SECRET=.\+' .env.local; then
    sed -i "s/^AUTH_SECRET=.*/AUTH_SECRET=$(openssl rand -hex 32)/" .env.local
  fi
fi

export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://127.0.0.1:${PORT}}"
exec npm run dev -- --port "${PORT}" --hostname 127.0.0.1
