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
#   E2E_PREVIEW=1 SORA_DIR=../sora-preview scripts/e2e.sh e2e/message-preview.spec.ts
#
# Environment:
#   SORA_DIR          sora checkout                       (../sora)
#   E2E_PORT          alps's port; the other servers take the next eight (8900)
#   E2E_PG_HOST, E2E_PG_PORT, E2E_PG_USER, E2E_PG_PASSWORD
#                     a PostgreSQL server that may create databases
#                     (localhost, 5432, postgres, empty)
#   E2E_KEEP_STATE=1  keep the database and state directory after the run
#   E2E_SKIP_BUILD=1  test the frontend/dist already on disk
#   E2E_PREVIEW=1     enable message previews (off by default); SORA_DIR must
#                     point to a checkout that supports FETCH PREVIEW
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
SECONDARY_PORT=$((ALPS_PORT + 9))
PRIMARY_GOSSIP_PORT=$((ALPS_PORT + 10))
SECONDARY_GOSSIP_PORT=$((ALPS_PORT + 11))

PG_HOST="${E2E_PG_HOST:-localhost}"
PG_PORT="${E2E_PG_PORT:-5432}"
PG_USER="${E2E_PG_USER:-postgres}"
PG_PASSWORD="${E2E_PG_PASSWORD:-}"
PG_DB="alps_e2e_$ALPS_PORT"

# Main sora need not support PREVIEW yet. Omit its config keys entirely unless
# the run explicitly asks for it, then let the positive browser test require
# support. The preview suite lists enough older mail to exceed normal budgets.
SORA_PREVIEW_CONFIG=
if [ "${E2E_PREVIEW:-0}" = 1 ]; then
  SORA_PREVIEW_CONFIG='enable_preview = true
limits.preview_s3_per_min = 0
limits.preview_s3_node_per_min = 0'
fi

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
ports=("$ALPS_PORT" "$IMAP_PORT" "$SIEVE_PORT" "$ADMIN_PORT" "$S3_PORT" "$SMTP_PORT" "$DAV_PORT" "$CONTROL_PORT" "$RELAY_PORT")
if [ "${E2E_CLUSTER:-}" = 1 ]; then
  ports+=("$SECONDARY_PORT" "$PRIMARY_GOSSIP_PORT" "$SECONDARY_GOSSIP_PORT")
fi
for port in "${ports[@]}"; do
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

# Folders under Shared/ can be shared with the other accounts of the domain
# (IMAP ACL); e2e/folder-sharing.spec.ts is about them. Personal folders
# cannot be, on sora. Its owner makes the folder over IMAP, which sora
# leaves to administrators unless allow_user_create is on.
[shared_mailboxes]
enabled = true
namespace_prefix = "Shared/"
allow_user_create = true

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
$SORA_PREVIEW_CONFIG

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
# On, unlike a deployment's default, so that every spec runs with the server's
# change numbers (CONDSTORE); e2e/condstore.spec.ts is about them.
condstore = true

# On, unlike a deployment's default, so that every spec runs with the pages'
# event stream open and the IDLE behind it; e2e/push.spec.ts is about them.
push_new_mail = true
# And with the news of the subscribed folders, which sora tells of (NOTIFY).
push_subscribed_folders = true

# Off: every sign-in comes from one address, and the suite signs in more
# often than the production limits allow. The limiter has its own unit tests.
[server.rate_limit]
enabled = false

[logging]
output = "stderr"
format = "console"
level = "info"

# The tests that register a security key reach alps as localhost: a key is
# bound to a hostname, and the browser takes no IP address as one.
[webauthn]
rpid = "localhost"
origins = ["http://localhost:$ALPS_PORT"]

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

if [ "${E2E_CLUSTER:-}" = 1 ]; then
  # Separate processes, session managers and gossip members; only the IMAP
  # backend and login-token key are shared. No in-process mutex can arbitrate.
  sed "s/addr = \"127.0.0.1:$ALPS_PORT\"/addr = \"127.0.0.1:$SECONDARY_PORT\"/" "$STATE/alps.toml" > "$STATE/alps-secondary.toml"
  cat >> "$STATE/alps.toml" <<EOF

[cluster]
enabled = true
node_id = "e2e-primary-$ALPS_PORT"
bind = "127.0.0.1"
port = $PRIMARY_GOSSIP_PORT
secret_key = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
EOF
  cat >> "$STATE/alps-secondary.toml" <<EOF

[cluster]
enabled = true
node_id = "e2e-secondary-$ALPS_PORT"
bind = "127.0.0.1"
port = $SECONDARY_GOSSIP_PORT
peers = ["127.0.0.1:$PRIMARY_GOSSIP_PORT"]
secret_key = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
EOF
fi

echo "==> starting alps on :$ALPS_PORT"
"$STATE/bin/alps" -config "$STATE/alps.toml" >"$LOGS/alps.log" 2>&1 &
pids+=($!)
wait_for "alps" "${pids[2]}" "curl -sf -o /dev/null http://127.0.0.1:$ALPS_PORT/" "$LOGS/alps.log"
if [ "${E2E_CLUSTER:-}" = 1 ]; then
  "$STATE/bin/alps" -config "$STATE/alps-secondary.toml" >"$LOGS/alps-secondary.log" 2>&1 &
  pids+=($!)
  wait_for "secondary alps" "${pids[3]}" "curl -sf -o /dev/null http://127.0.0.1:$SECONDARY_PORT/" "$LOGS/alps-secondary.log"
  export ALPS_SECONDARY_URL="http://127.0.0.1:$SECONDARY_PORT"
fi
echo "==> up"

export ALPS_URL="http://127.0.0.1:$ALPS_PORT"
export CONTROL_URL="http://127.0.0.1:$CONTROL_PORT"
export SORA_ADMIN_URL="http://127.0.0.1:$ADMIN_PORT"
export SORA_ADMIN_KEY="$ADMIN_KEY"
export DAV_URL="http://127.0.0.1:$DAV_PORT"
export SIEVE_ADDR="127.0.0.1:$SIEVE_PORT"
export IMAP_ADDR="127.0.0.1:$IMAP_PORT"
export E2E_USER E2E_PASSWORD

status=0
(cd "$ROOT/frontend" && npx playwright test "$@") || status=$?

# A server that died mid-run fails every later spec in milliseconds, which
# reads as a wall of unrelated regressions. Say so, and say which one.
dead=""
kill -0 "${pids[0]}" 2>/dev/null || dead="$dead e2estack"
kill -0 "${pids[1]}" 2>/dev/null || dead="$dead sora"
kill -0 "${pids[2]}" 2>/dev/null || dead="$dead alps"
if [ "${E2E_CLUSTER:-}" = 1 ]; then
  kill -0 "${pids[3]}" 2>/dev/null || dead="$dead alps-secondary"
fi
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
