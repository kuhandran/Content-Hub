#!/bin/bash
# Test Everything Script - API health, admin ops, sync, and cache
# Usage:
#   ./scripts/test-all.sh
#   DOMAIN=https://your-domain ./scripts/test-all.sh
#   DOMAIN=https://your-domain TOKEN=xyz ./scripts/test-all.sh

set -euo pipefail

probe_port() {
  local port="$1"
  curl -s --max-time 2 "http://localhost:${port}/api/health" > /dev/null && echo "http://localhost:${port}" && return 0
  return 1
}

if [[ -z "${DOMAIN:-}" ]]; then
  DOMAIN=$(probe_port 3000 || true)
  if [[ -z "$DOMAIN" ]]; then DOMAIN=$(probe_port 3001 || true); fi
  if [[ -z "$DOMAIN" ]]; then DOMAIN="http://localhost:3000"; fi
fi

TOKEN="${TOKEN:-}"
AUTH_HEADER=()
[[ -n "$TOKEN" ]] && AUTH_HEADER=(-H "Authorization: Bearer $TOKEN")

blue()  { printf "\033[34m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }

echo "Testing domain: $DOMAIN"

curl_json() {
  local method path body
  method=${1:-GET}
  path=$2
  body=${3:-}
  blue "$method $path"
  local resp status
  if [[ "$method" == "GET" ]]; then
    resp=$(curl -sS ${AUTH_HEADER[@]:-} -w "\nHTTP_STATUS:%{http_code}\n" "$DOMAIN$path" 2>&1)
  else
    resp=$(curl -sS ${AUTH_HEADER[@]:-} -w "\nHTTP_STATUS:%{http_code}\n" -X "$method" -H "Content-Type: application/json" -d "$body" "$DOMAIN$path" 2>&1)
  fi
  status=$(echo "$resp" | tail -n1 | sed 's/HTTP_STATUS://')
  echo "$resp" | head -c 1400 | sed 's/\n/\n/g'
  if [[ "$status" -ge 400 || "$status" -eq 000 ]]; then
    red "Status: $status"; return 1
  else
    green "Status: $status"; return 0
  fi
}

# Health
curl_json GET "/api/health"

# Admin endpoints
curl_json GET "/api/admin/operations"
curl_json GET "/api/admin/data"

# Cache actions
curl_json POST "/api/admin/cache" '{"action":"clearAll"}' || true
curl_json POST "/api/admin/cache" '{"action":"cache","key":"cms:ping","value":{"ok":true}}'
curl_json POST "/api/admin/cache" '{"action":"check","key":"cms:ping"}'
curl_json POST "/api/admin/cache" '{"action":"clear","key":"cms:ping"}' || true

# Sync endpoints
curl_json GET "/api/admin/sync"
curl_json POST "/api/admin/sync" '{"mode":"scan"}' || true
curl_json POST "/api/admin/sync" '{"mode":"pull"}' || true

blue "All tests completed."