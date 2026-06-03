#!/usr/bin/env bash
# Orchestrates the full stack and runs the Playwright e2e test against it.
# Postgres (docker) -> API (dotnet) -> frontend (started by Playwright's webServer) -> test.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PORT=5021

export DOTNET_ROOT="${DOTNET_ROOT:-/opt/homebrew/opt/dotnet/libexec}"
export PATH="/opt/homebrew/opt/dotnet/bin:$HOME/.dotnet/tools:$PATH"

cleanup() {
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "==> Starting Postgres"
docker compose -f "$ROOT/docker-compose.yml" up -d

echo "==> Waiting for Postgres to be healthy"
for _ in $(seq 1 30); do
  if [[ "$(docker inspect --format '{{.State.Health.Status}}' bookmanager-postgres 2>/dev/null)" == "healthy" ]]; then
    break
  fi
  sleep 2
done

echo "==> Starting API"
ASPNETCORE_ENVIRONMENT=Development dotnet run --project "$ROOT/backend/src/BookManager.Api/BookManager.Api.csproj" \
  --launch-profile http > /tmp/bookmanager-api-e2e.log 2>&1 &
API_PID=$!

echo "==> Waiting for API on port $API_PORT"
for _ in $(seq 1 40); do
  if curl -s -o /dev/null "http://localhost:$API_PORT/books?page=1&pageSize=1"; then
    break
  fi
  sleep 2
done

echo "==> Running Playwright e2e"
cd "$ROOT/frontend"
npx playwright test "$@"
