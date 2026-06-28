#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REDIRECTS="$ROOT/artifacts/walker-creek/public/_redirects"

# SPA fallback (always)
cat > "$REDIRECTS" <<'EOF'
/*    /index.html   200
EOF

# Proxy /api to your hosted backend (set API_URL in Netlify env vars)
if [ -n "${API_URL:-}" ]; then
  API_URL="${API_URL%/}"
  {
    echo "/api/*  ${API_URL}/api/:splat  200"
    echo "/*    /index.html   200"
  } > "$REDIRECTS"
  echo "Netlify: proxying /api/* → ${API_URL}/api/*"
else
  echo "Netlify: API_URL not set — frontend only (no live data until API is configured)"
fi

cd "$ROOT"
export PORT="${PORT:-5173}"
export BASE_PATH="${BASE_PATH:-/}"
pnpm --filter @workspace/walker-creek run build
