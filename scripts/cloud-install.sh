#!/usr/bin/env bash
set -euo pipefail
cd /workspace
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi
