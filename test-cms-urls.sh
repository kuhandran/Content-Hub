#!/bin/bash
# Lightweight CMS URL tester (robust)
# Usage examples:
#   ./test-cms-urls.sh                      # auto-probes localhost:3000/3001
#   DOMAIN=https://static.kuhandranchatbot.info ./test-cms-urls.sh
#   DOMAIN=https://example.com TOKEN=xyz ./test-cms-urls.sh

set -uo pipefail  # do not exit on curl errors; show summary

# Detect domain: prefer env, else probe localhost ports
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
AUTH_HEADER=""
[[ -n "$TOKEN" ]] && AUTH_HEADER="-H Authorization: Bearer $TOKEN"

blue()  { printf "\033[34m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }

blue "Testing domain: $DOMAIN"

curl_json() {
  local path="$1"
  blue "GET $path"
  local resp status
  resp=$(curl -sS $AUTH_HEADER -w "\nHTTP_STATUS:%{http_code}\n" "$DOMAIN$path" 2>&1)
  status=$(echo "$resp" | tail -n1 | sed 's/HTTP_STATUS://')
  echo "$resp" | head -c 1400 | sed 's/\n/\n/g'
  if [[ "$status" -ge 400 || "$status" -eq 000 ]]; then
    red "Status: $status"
  else
    green "Status: $status"
  fi
  echo
}

# Core health and admin endpoints
curl_json "/api/health"
curl_json "/api/admin/data"
curl_json "/api/admin/operations"
curl_json "/api/admin/urls"
blue "POST /api/admin/cache {\"action\":\"clearAll\"}"
curl -sS $AUTH_HEADER -w "\nHTTP_STATUS:%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"action":"clearAll"}' "$DOMAIN/api/admin/cache" | head -c 1400; echo
blue "POST /api/admin/cache {\"action\":\"cache\", \"key\":\"cms:ping\", \"value\":{\"ok\":true}}"
curl -sS $AUTH_HEADER -w "\nHTTP_STATUS:%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"action":"cache","key":"cms:ping","value":{"ok":true}}' "$DOMAIN/api/admin/cache" | head -c 1400; echo
blue "POST /api/admin/cache {\"action\":\"check\", \"key\":\"cms:ping\"}"
curl -sS $AUTH_HEADER -w "\nHTTP_STATUS:%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"action":"check","key":"cms:ping"}' "$DOMAIN/api/admin/cache" | head -c 1400; echo
blue "POST /api/admin/cache {\"action\":\"clear\", \"key\":\"cms:ping\"}"
curl -sS $AUTH_HEADER -w "\nHTTP_STATUS:%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"action":"clear","key":"cms:ping"}' "$DOMAIN/api/admin/cache" | head -c 1400; echo
curl_json "/api/admin/logs?limit=10"

# Sync endpoints
curl_json "/api/admin/sync"
blue "POST /api/admin/sync {\"action\":\"sync-collections\"}"
curl -sS $AUTH_HEADER -w "\nHTTP_STATUS:%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"action":"sync-collections"}' "$DOMAIN/api/admin/sync" | head -c 1400; echo

blue "POST /api/admin/operations {\"operation\":\"status\"}"
curl -sS $AUTH_HEADER -w "\nHTTP_STATUS:%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"operation":"status"}' "$DOMAIN/api/admin/operations" | head -c 1400; echo

blue "Done. Set TOKEN=... if API requires auth."
