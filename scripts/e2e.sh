#!/usr/bin/env bash
#
# Brings up a complete mail stack and runs the browser tests against it.
#
#   PostgreSQL ─┐
#   e2estack ───┼─► sora (IMAP, ManageSieve, admin API) ─┐
#   (object store, SMTP, CalDAV/CardDAV, control API) ───┴─► alps ─► chromium
#
# sora is Migadu's IMAP server: a real server with METADATA, Sieve and a
# delivery API, so these tests exercise alps's IMAP provider the way a
# deployment does. It is built from a checkout (SORA_DIR, default ../sora) and
# stores into a throwaway PostgreSQL database created for the run.
#
# Usage:
#   scripts/e2e.sh                      # the whole suite
#   scripts/e2e.sh e2e/reading.spec.ts  # arguments go to Playwright; a file
#                                       # argument is a regular expression, so
#                                       # keep the e2e/ prefix
#
# Environment:
#   SORA_DIR          sora checkout                       (../sora)
#   E2E_PORT          alps's port; the other servers take the next eight (8900)
#   E2E_PG_HOST, E2E_PG_PORT, E2E_PG_USER, E2E_PG_PASSWORD
#                     a PostgreSQL server that may create databases
#                     (localhost, 5432, postgres, empty)
#   E2E_KEEP_STATE=1  keep the database and state directory after the run
#   E2E_SKIP_BUILD=1  test the frontend/dist already on disk
#   PW_CHROMIUM_PATH  a pre-installed Chromium to use instead of Playwright's
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SORA_DIR="${SORA_DIR:-$ROOT/../sora}"

# One port decides every other, so two runs on different E2E_PORTs share
# nothing: not a server, not a database, not a log.
ALPS_PORT="${E2E_PORT:-8900}"
IMAP_PORT=$((ALPS_PORT + 1))
SIEVE_PORT=$((ALPS_PORT + 2))
ADMIN_PORT=$((ALPS_PORT + 3))
S3_PORT=$((ALPS_PORT + 4))
SMTP_PORT=$((ALPS_PORT + 5))
DAV_PORT=$((ALPS_PORT + 6))
CONTROL_PORT=$((ALPS_PORT + 7))
RELAY_PORT=$((ALPS_PORT + 8))

PG_HOST="${E2E_PG_HOST:-localhost}"
PG_PORT="${E2E_PG_PORT:-5432}"
PG_USER="${E2E_PG_USER:-postgres}"
PG_PASSWORD="${E2E_PG_PASSWORD:-}"
PG_DB="alps_e2e_$ALPS_PORT"

# Outside the repository: sora and alps write here constantly, and nothing in
# it is worth keeping once the run is over.
STATE="${E2E_STATE:-${TMPDIR:-/tmp}/alps-e2e-$ALPS_PORT}"
# Logs outlive the state, so a failed run can be read afterwards.
LOGS="${E2E_LOGS:-${TMPDIR:-/tmp}/alps-e2e-logs-$ALPS_PORT}"

# Not secrets anywhere this script runs; they only have to agree between the
# servers started below.
ADMIN_KEY="e2e-admin-key-not-a-secret"
E2E_USER="alice@example.test"
E2E_PASSWORD="alice-e2e-password"

export PGPASSWORD="$PG_PASSWORD" PGOPTIONS="--client-min-messages=warning"
psql_admin() {
  psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -v ON_ERROR_STOP=1 -q "$@"
}

for tool in go npm psql curl lsof; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "e2e: $tool is required and was not found on PATH." >&2
    exit 1
  fi
done
if [ ! -f "$SORA_DIR/cmd/sora/main.go" ]; then
  echo "e2e: no sora checkout at $SORA_DIR; set SORA_DIR." >&2
  exit 1
fi
if ! psql_admin -d postgres -c 'SELECT 1' >/dev/null 2>&1; then
  echo "e2e: cannot reach PostgreSQL as $PG_USER@$PG_HOST:$PG_PORT; set E2E_PG_*." >&2
  exit 1
fi

# A server left over from an earlier run would silently take a port, and the
# suite would then test against its state instead of this run's.
for port in "$ALPS_PORT" "$IMAP_PORT" "$SIEVE_PORT" "$ADMIN_PORT" "$S3_PORT" "$SMTP_PORT" "$DAV_PORT" "$CONTROL_PORT" "$RELAY_PORT"; do
  if lsof -ti:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "e2e: port $port is in use; stop whatever holds it or set E2E_PORT." >&2
    exit 1
  fi
done

# Each server in its own process group, so cleanup reaches the server and not
# just the shell that started it.
set -m
pids=()
BUILD_LOCK="${TMPDIR:-/tmp}/alps-e2e-build.lock"
BUILD_LOCK_HELD=""
cleanup() {
  for pid in "${pids[@]:-}"; do
    [ -n "$pid" ] || continue
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  done
  for pid in "${pids[@]:-}"; do
    [ -n "$pid" ] || continue
    wait "$pid" 2>/dev/null || true
  done
  if [ -n "$BUILD_LOCK_HELD" ]; then
    rm -rf "$BUILD_LOCK"
  fi
  if [ -z "${E2E_KEEP_STATE:-}" ]; then
    psql_admin -d postgres -c "DROP DATABASE IF EXISTS $PG_DB WITH (FORCE)" >/dev/null 2>&1 || true
    rm -rf "$STATE"
  else
    echo "e2e: state kept in $STATE and database $PG_DB"
  fi
}
trap cleanup EXIT

rm -rf "$STATE" "$LOGS"
mkdir -p "$STATE/bin" "$LOGS" "$STATE/sora/cache" "$STATE/sora/uploads" "$STATE/sora/relay" "$STATE/alps-tmp"

# The build is the one step two runs cannot share: frontend/dist is a single
# directory, and a binary embedding it while another run rewrites it gets a
# half-written bundle. Everything after the build uses this run's own binary,
# so only the build is serialized.
acquire_build_lock() {
  for attempt in $(seq 1 600); do
    if mkdir "$BUILD_LOCK" 2>/dev/null; then
      echo $$ >"$BUILD_LOCK/pid"
      BUILD_LOCK_HELD=1
      return
    fi
    holder="$(cat "$BUILD_LOCK/pid" 2>/dev/null || true)"
    if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then
      rm -rf "$BUILD_LOCK"
      continue
    fi
    [ "$attempt" = 1 ] && echo "==> waiting for another run's build (pid ${holder:-unknown})"
    sleep 1
  done
  echo "e2e: gave up waiting for the build lock at $BUILD_LOCK" >&2
  exit 1
}

acquire_build_lock
if [ -z "${E2E_SKIP_BUILD:-}" ]; then
  echo "==> building the frontend"
  npm --prefix "$ROOT/frontend" run build >"$LOGS/frontend-build.log" 2>&1 || {
    tail -30 "$LOGS/frontend-build.log" >&2
    exit 1
  }
fi
echo "==> building alps, sora and the test stack"
(cd "$ROOT" && go build -o "$STATE/bin/alps" ./cmd/alps && go build -o "$STATE/bin/e2estack" ./internal/e2estack)
(cd "$SORA_DIR" && go build -o "$STATE/bin/sora" ./cmd/sora)
rm -rf "$BUILD_LOCK"
BUILD_LOCK_HELD=""

echo "==> creating database $PG_DB"
psql_admin -d postgres -c "DROP DATABASE IF EXISTS $PG_DB WITH (FORCE)" >/dev/null
psql_admin -d postgres -c "CREATE DATABASE $PG_DB" >/dev/null
psql_admin -d "$PG_DB" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm" >/dev/null

cat >"$STATE/sora.toml" <<EOF
# The lowest cost sora accepts: every sign-in and every DAV request hashes.
bcrypt_cost = 10

[logging]
output = "stderr"
format = "console"
level = "info"

[database]
query_timeout = "10s"
search_timeout = "30s"
write_timeout = "10s"

# Small pools: PostgreSQL's default ceiling is 100 connections, and parallel
# runs on different ports share it.
[database.write]
hosts = ["$PG_HOST"]
port = $PG_PORT
user = "$PG_USER"
password = "$PG_PASSWORD"
name = "$PG_DB"
tls = false
max_conns = 5
min_conns = 1

[database.read]
hosts = ["$PG_HOST"]
port = $PG_PORT
user = "$PG_USER"
password = "$PG_PASSWORD"
name = "$PG_DB"
tls = false
max_conns = 5
min_conns = 1

[s3]
endpoint = "127.0.0.1:$S3_PORT"
disable_tls = true
access_key = "e2e"
secret_key = "e2e"
bucket = "e2e"

[local_cache]
path = "$STATE/sora/cache"
capacity = "200mb"
max_object_size = "10mb"

[uploader]
path = "$STATE/sora/uploads"
concurrency = 4
retry_interval = "1s"

# Sieve redirects and vacation replies leave through the test stack's relay
# port, so a test finds them in the outbox like any other message. Polled
# every second rather than every minute: a test waits for the reply.
[relay]
type = "smtp"
smtp_host = "127.0.0.1:$RELAY_PORT"
smtp_tls = false
smtp_use_starttls = false

[relay.queue]
path = "$STATE/sora/relay"
worker_interval = "1s"
retry_backoff = ["1s"]

# Loopback is trusted, which also exempts it from sora's login throttling: the
# suite signs in far more often than any one person would.
[servers]
trusted_networks = ["127.0.0.1/32", "::1/128"]

# alps lists a folder with UID THREAD and SORT, both of which count against
# sora's per-account search limit (60 a minute, and 0 does not switch it off).
# The suite, one account clicking through folders all run long, is far past it.
#
# The lookup cache is off because it answers a sign-in from memory for minutes:
# a deleted account or a changed password would keep working, and the tests
# about exactly that would be testing the cache.
[[server]]
type = "imap"
name = "imap"
addr = "127.0.0.1:$IMAP_PORT"
insecure_auth = true
tls = false
limits.search_rate_limit_per_min = 1000000

[server.lookup_cache]
enabled = false

[[server]]
type = "managesieve"
name = "managesieve"
addr = "127.0.0.1:$SIEVE_PORT"
insecure_auth = true
tls = false

[server.lookup_cache]
enabled = false

[[server]]
type = "http_admin_api"
name = "admin"
addr = "127.0.0.1:$ADMIN_PORT"
api_key = "$ADMIN_KEY"
tls = false
EOF

cat >"$STATE/alps.toml" <<EOF
[server]
addr = "127.0.0.1:$ALPS_PORT"
temp_dir = "$STATE/alps-tmp"

# Off: every sign-in comes from one address, and the suite signs in more
# often than the production limits allow. The limiter has its own unit tests.
[server.rate_limit]
enabled = false

[logging]
output = "stderr"
format = "console"
level = "info"

[provider]
type = "imap"

[provider.imap]
server = "imap+insecure://127.0.0.1:$IMAP_PORT"

[smtp]
server = "smtp+insecure://127.0.0.1:$SMTP_PORT"

[plugin.base]
enabled = true

[plugin.caldav]
enabled = true
server = "http+insecure://127.0.0.1:$DAV_PORT/caldav/"

[plugin.carddav]
enabled = true
server = "http+insecure://127.0.0.1:$DAV_PORT/carddav/"

[plugin.managesieve]
enabled = true
server = "managesieve+insecure://127.0.0.1:$SIEVE_PORT"

[plugin.gpg]
enabled = true

# Password changes go straight to sora's admin API, which is what a
# deployment's own endpoint would do in the end.
[plugin.password]
enabled = true

[plugin.password.options]
endpoint = "http://127.0.0.1:$ADMIN_PORT/admin/accounts/{email}"
method = "PUT"
auth_type = "bearer"
token = "$ADMIN_KEY"
payload = "json"

[plugin.password.options.payload_mapping]
password = "new_password"
EOF

echo "==> starting the test stack on :$S3_PORT-:$RELAY_PORT"
"$STATE/bin/e2estack" \
  -s3 "127.0.0.1:$S3_PORT" \
  -smtp "127.0.0.1:$SMTP_PORT" \
  -relay "127.0.0.1:$RELAY_PORT" \
  -dav "127.0.0.1:$DAV_PORT" \
  -control "127.0.0.1:$CONTROL_PORT" \
  -imap "127.0.0.1:$IMAP_PORT" \
  -sieve "127.0.0.1:$SIEVE_PORT" \
  -deliver-url "http://127.0.0.1:$ADMIN_PORT/admin/mail/deliver" \
  -deliver-key "$ADMIN_KEY" \
  -local-domains "example.test" \
  >"$LOGS/e2estack.log" 2>&1 &
pids+=($!)

echo "==> starting sora on :$IMAP_PORT"
"$STATE/bin/sora" -config "$STATE/sora.toml" >"$LOGS/sora.log" 2>&1 &
pids+=($!)

wait_for() {
  local name="$1" pid="$2" check="$3" log="$4"
  for _ in $(seq 1 60); do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "e2e: $name exited during startup; $log:" >&2
      tail -20 "$log" >&2
      exit 1
    fi
    if eval "$check" >/dev/null 2>&1; then
      return
    fi
    sleep 1
  done
  echo "e2e: $name did not become ready; $log:" >&2
  tail -20 "$log" >&2
  exit 1
}

wait_for "the test stack" "${pids[0]}" \
  "curl -sf http://127.0.0.1:$CONTROL_PORT/healthz" "$LOGS/e2estack.log"
wait_for "sora" "${pids[1]}" \
  "curl -sf -H 'Authorization: Bearer $ADMIN_KEY' http://127.0.0.1:$ADMIN_PORT/admin/health/overview" "$LOGS/sora.log"

echo "==> creating $E2E_USER"
curl -sf -X POST "http://127.0.0.1:$ADMIN_PORT/admin/accounts" \
  -H "Authorization: Bearer $ADMIN_KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$E2E_USER\",\"password\":\"$E2E_PASSWORD\"}" >/dev/null

echo "==> starting alps on :$ALPS_PORT"
"$STATE/bin/alps" -config "$STATE/alps.toml" >"$LOGS/alps.log" 2>&1 &
pids+=($!)
wait_for "alps" "${pids[2]}" "curl -sf -o /dev/null http://127.0.0.1:$ALPS_PORT/" "$LOGS/alps.log"
echo "==> up"

export ALPS_URL="http://127.0.0.1:$ALPS_PORT"
export CONTROL_URL="http://127.0.0.1:$CONTROL_PORT"
export SORA_ADMIN_URL="http://127.0.0.1:$ADMIN_PORT"
export SORA_ADMIN_KEY="$ADMIN_KEY"
export DAV_URL="http://127.0.0.1:$DAV_PORT"
export SIEVE_ADDR="127.0.0.1:$SIEVE_PORT"
export E2E_USER E2E_PASSWORD

status=0
(cd "$ROOT/frontend" && npx playwright test "$@") || status=$?

# A server that died mid-run fails every later spec in milliseconds, which
# reads as a wall of unrelated regressions. Say so, and say which one.
dead=""
kill -0 "${pids[0]}" 2>/dev/null || dead="$dead e2estack"
kill -0 "${pids[1]}" 2>/dev/null || dead="$dead sora"
kill -0 "${pids[2]}" 2>/dev/null || dead="$dead alps"
if [ -n "$dead" ]; then
  echo >&2
  echo "==> a server died during the run:$dead — the results above are void." >&2
  echo "    Logs: $LOGS" >&2
  exit 1
fi
if [ "$status" != 0 ]; then
  echo "==> server logs: $LOGS"
fi
exit "$status"
