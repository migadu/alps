# Testing

ALPS has three test tiers:

| Tier | Where | What it catches |
|---|---|---|
| Go tests | `go test ./...` or `make test` | Handlers, providers, sessions, protocol handling |
| Frontend unit tests | `cd frontend && npm test` (Vitest + jsdom) | Component logic and render decisions |
| **Browser tests** | `scripts/e2e.sh` (Playwright + Chromium) | The application actually running against real servers |

The browser tier exists for what the other two cannot see: a component reading a field the backend
does not send, a page that logs an error and renders nothing, a flow that only breaks once a real
IMAP server, a real SMTP submission and a real browser are all involved. Every test fails on any
console error or uncaught exception on its page, not only on its own assertions.

The repository has no CI configuration, so these tests run only when someone runs them locally.
`make test` runs the Go tests only; no Makefile target runs Vitest. Two further checks:
`cd frontend && npm run typecheck:e2e` typechecks the browser specs, and
`python3 scripts/model-recovery-versions.py` checks the credential update protocol (see
[WEBAUTHN_COORDINATION.md](WEBAUTHN_COORDINATION.md#verification)).

---

## Go tests

Go tests sit beside the sources, in every package. They need neither sora nor PostgreSQL nor any
other setup: the servers they talk to run in-process on
loopback (in-memory IMAP servers, go-smtp SMTP servers, HTTP servers from `net/http/httptest`, and
the cluster tests' gossip members on fixed 127.0.0.1 ports).

- The base plugin's tests run the real server, over a maildir in `t.TempDir()` (the
  `newTestServer…` helpers in `plugins/base/http_test.go`) or over an in-memory IMAP server (the
  `newIMAPTestServer…` helpers in `plugins/base/verdicts_test.go`). The caldav and carddav plugins
  have harnesses of their own (`newHarness`).
- Shared mocks: `provider.MockProvider`, `MockOptions` and `MockStore`
  (`provider/mock_provider.go`, `provider/mock_store.go`) and `storage.MockS3Client`
  (`tlsmanager/storage/mock_s3.go`).
- `go test -short` skips `TestAnswerSavedWhenTheReplyCannotBeSent`, which waits out the SMTP
  submission retries. Some caldav tests skip themselves when the system has no tzdata.
- `make test` runs `go test -v ./...`. `make test-coverage` writes `coverage.out` and opens its
  HTML report.
- The browser harness's test stack (`internal/e2estack`) has Go tests too, which `go test ./...`
  runs with the rest.

---

## Frontend unit tests

`npm test` in `frontend/` runs `vitest run` under jsdom. Only `frontend/test/**/*.test.ts` is
collected, so a `*.test.ts` placed beside a source in `src/` or `plugins/*/frontend/` never runs.

- Plugin frontend tests live in `frontend/test` too and import `../../plugins/<name>/frontend/…`.
  `frontend/vitest.config.ts` allows that (`server.fs.allow: ['..']`) and pins `lit`, `@lit`,
  `openpgp` and `rrule` to `frontend/node_modules`.
- `test/helpers/setup.ts` runs before every file and installs jsdom shims, each only where the API
  is missing: `scrollIntoView`, `ResizeObserver`, `<dialog>` `showModal`/`close`, a `matchMedia`
  that answers `min-width`/`max-width` queries from `innerWidth`, and `document.execCommand`.
- Helpers: `test/helpers/dom.ts` (`mount`, `update`, `cleanup`, `shadow`, `shadowAll`, `text`,
  `record`, `flush`, `click`, `waitFor`), `sidebar.ts` (`settleSidebar`, `inSidebar`,
  `setSidebar`), `sources.ts` (`readSources`) and `styles.ts` (`rulesOf`, `ruleMatches`,
  `backgroundOf`, `backgroundsOf`).
- Neither `npm run build` nor `npm run typecheck:e2e` typechecks `frontend/test`. Vitest compiles
  it without checking its types, so a type error there fails nothing.

---

## Running the browser tests

Requirements:

- `go`, `npm`, `psql`, `curl` and `lsof` on `PATH`. The script checks them in that order and stops
  at the first one missing. `psql` is only the client; with Postgres.app, add its `bin` directory
  to `PATH`.
- Go 1.25.0 or later (`go.mod`, which also names `toolchain go1.26.5`; see the
  [README](../README.md#requirements)). Node.js 20 (20.19 or later), 22 (22.12 or later), or 24
  and later: the locked Vite 8.0.10 and rolldown declare `^20.19.0 || >=22.12.0`, and the locked
  Vitest 4.1.10 declares `^20.0.0 || ^22.0.0 || >=24.0.0`, so on Node.js 23 npm prints an engine
  warning.
- A PostgreSQL server that the sora being built supports. sora's README asks for
  PostgreSQL 14 or later with `pg_trgm` and `btree_gin`, and its migrations create `btree_gin`, so
  both contrib extensions must be installable. The harness itself needs 13 or later, because it
  drops a leftover database with `DROP DATABASE … WITH (FORCE)`, and it runs
  `CREATE EXTENSION IF NOT EXISTS pg_trgm` in the new database. The PostgreSQL user must be able
  to connect to the `postgres` database and to create and drop databases.
- A checkout of [sora](https://github.com/migadu/sora), by default next to this repository at
  `../sora`. The directory must contain `cmd/sora/main.go`.
- Playwright's Chromium: `cd frontend && npx playwright install chromium`, or an installed
  Chromium named with `PW_CHROMIUM_PATH`.

```sh
cd frontend && npm install && cd ..

scripts/e2e.sh                          # the whole suite
scripts/e2e.sh e2e/reading.spec.ts      # one file; arguments go to Playwright
scripts/e2e.sh -g "Reply All"           # tests whose title matches
make test-e2e                           # the whole suite; takes no arguments
cd frontend && npm run test:e2e -- e2e/reading.spec.ts   # the same script; arguments after --
E2E_CLUSTER=1 scripts/e2e.sh e2e/cluster-recovery.spec.ts  # with a second ALPS
```

Playwright runs in `frontend/`, with `e2e/` as its test directory. It reads a file argument as a
regular expression over the spec's full path, so a bare `reading.spec.ts` also runs
`threading.spec.ts`. Give the `e2e/` prefix.

| Variable | Default | Meaning |
|---|---|---|
| `SORA_DIR` | `../sora` | The sora checkout to build |
| `E2E_PORT` | `8900` | ALPS's port; the other servers use the next eight (the next eleven with `E2E_CLUSTER=1`) |
| `E2E_PG_HOST` / `E2E_PG_PORT` / `E2E_PG_USER` / `E2E_PG_PASSWORD` | `localhost` / `5432` / `postgres` / empty | The PostgreSQL server |
| `E2E_SKIP_BUILD` | unset | Test the `frontend/dist` already on disk instead of rebuilding it. alps, e2estack and sora are still compiled |
| `E2E_KEEP_STATE` | unset | Keep the database and state directory after the run |
| `E2E_CLUSTER` | unset | Exactly `1` also starts a second ALPS on `E2E_PORT`+9, made from the same config. Both ALPS processes get a `[cluster]` section and gossip with each other (the first on `E2E_PORT`+10, the second on +11), against the one sora. Specs get `ALPS_SECONDARY_URL`; `e2e/cluster-recovery.spec.ts` needs it and skips itself otherwise |
| `E2E_STATE` | `${TMPDIR:-/tmp}/alps-e2e-<port>` | The run's state directory: `bin/` (the alps, e2estack and sora binaries), `alps.toml`, `sora.toml` (and `alps-secondary.toml`), sora's cache, uploads and relay directories, and ALPS's `temp_dir` |
| `E2E_LOGS` | `${TMPDIR:-/tmp}/alps-e2e-logs-<port>` | The server and build logs |
| `E2E_RESULTS` | `$E2E_LOGS/test-results` | Playwright's output directory for traces and screenshots, emptied when a run starts. The default is made absolute, so with a relative `E2E_LOGS` it is under the directory the script was started in; a relative `E2E_RESULTS` that you set is read from `frontend/` |
| `E2E_PREVIEW` | unset | Exactly `1` turns on FETCH PREVIEW in the generated sora config and runs the positive preview test; it needs a `SORA_DIR` checkout that supports PREVIEW |
| `PW_CHROMIUM_PATH` | unset | Use an already installed Chromium binary |

`E2E_SKIP_BUILD` and `E2E_KEEP_STATE` act on any non-empty value, even `0`. `E2E_CLUSTER` and
`E2E_PREVIEW` act only on exactly `1`.

The default run leaves message previews off and tests that a server without them shows no previews
and makes no extra requests. To test previews, point `SORA_DIR` at a checkout that implements FETCH
PREVIEW and opt in:

```sh
E2E_PREVIEW=1 SORA_DIR=../sora-preview scripts/e2e.sh e2e/message-preview.spec.ts
```

An opted-in run fails if the server cannot supply previews. Without the opt-in, the generated sora
config has no PREVIEW keys, so the default suite also runs against sora checkouts without them.

Every run deletes `E2E_STATE` and `E2E_LOGS` (`rm -rf`) when it starts, and `E2E_STATE` again when
it ends unless `E2E_KEEP_STATE` is set, so neither may point at a directory that holds anything
else. The servers are stopped at the end either way. State and a database kept with
`E2E_KEEP_STATE` survive only until the next run on the same port, which deletes the state
directory and drops `alps_e2e_<port>` before creating it again.

### Ports

Every port is an offset from `E2E_PORT`, and all of them listen on 127.0.0.1:

| Offset | Server |
|---|---|
| +0 | ALPS |
| +1 | sora IMAP |
| +2 | sora ManageSieve |
| +3 | sora admin API |
| +4 | e2estack object store (S3) |
| +5 | e2estack SMTP submission |
| +6 | e2estack CalDAV/CardDAV |
| +7 | e2estack control API |
| +8 | e2estack relay (sora's outgoing mail) |
| +9 | the second ALPS (`E2E_CLUSTER=1` only) |
| +10 | the first ALPS's gossip port (`E2E_CLUSTER=1` only) |
| +11 | the second ALPS's gossip port (`E2E_CLUSTER=1` only) |

Before it builds or starts anything, the script refuses to run if any port it will use already has
a listener.

### Runs side by side

The ports, the database `alps_e2e_<port>` and the default state, log and results directories are
all keyed by `E2E_PORT`. Two runs can therefore go side by side when:

- their `E2E_PORT`s are at least 9 apart, or 12 apart when either uses `E2E_CLUSTER=1`;
- they do not set the same `E2E_STATE`, `E2E_LOGS` or `E2E_RESULTS`. Playwright clears its output
  directory when a run starts, and would delete the other run's traces and screenshots.

They still share two things. The build step is serialized, because `frontend/dist` is a single
directory that each ALPS binary embeds. And the PostgreSQL server's connection limit is shared,
which is why sora's read and write pools are capped at 5 connections each.

The build lock is a directory at `${TMPDIR:-/tmp}/alps-e2e-build.lock`. It covers the frontend build
(unless `E2E_SKIP_BUILD`) and the go builds of alps, e2estack and sora, and is taken even with
`E2E_SKIP_BUILD`. A run that finds it held prints `waiting for another run's build (pid N)` and
waits up to about ten minutes (600 tries, a second apart). It removes a lock whose holder has
died. After the build, each run uses its own binaries.

### The frontend build

Unless `E2E_SKIP_BUILD` is set, a run builds the frontend with `npm run build` in `frontend/`
(`tsc`, then `vite build`). That rewrites the checked-in `frontend/dist`, the directory the ALPS
binary embeds, in place, and can leave it modified in git. Check `git status` before committing
after a run. The build's output goes to `frontend-build.log` in the log directory.

---

## What the harness starts

```
PostgreSQL ─┐
e2estack ───┼─► sora (IMAP, ManageSieve, admin API) ─┐
(object store, SMTP, CalDAV/CardDAV, control API) ───┴─► alps ─► Chromium
```

- **sora** — built from `SORA_DIR` and run on a throwaway database `alps_e2e_<port>`. It is a
  complete IMAP server with METADATA (where ALPS keeps its settings), ManageSieve, Sieve filtering
  on delivery, shared folders under `Shared/` (IMAP ACL), and an admin API the tests use to create
  accounts and deliver mail. The tests therefore exercise ALPS's IMAP provider, not a stand-in.
  Its `sora.toml` is set for a test run:
  - `bcrypt_cost = 10`;
  - the lookup cache off on the IMAP and ManageSieve servers, so a deleted account or a changed
    password takes effect at once;
  - the per-account IMAP search rate limit raised to 1,000,000 a minute, because ALPS lists a
    folder with THREAD and SORT, which count against it;
  - loopback a trusted network, which also exempts it from sora's login throttling;
  - the relay queue worked every second, with a retry backoff of 1 s;
  - database pools of 5 connections.
- **e2estack** (`internal/e2estack`) — the servers around sora, all in memory:
  - an S3-compatible object store for sora's message bodies;
  - the SMTP submission server ALPS sends through. It authenticates against sora and records every
    message it accepts in one outbox, the one `sentMessages()` reads. It delivers mail for
    `example.test` back into sora, so a message sent to yourself arrives like real mail; mail to
    any other domain is only recorded. It refuses any sender address ending in `@not-yours.test`
    with `553 5.7.1`, so a spec can provoke a refused send. A second, unauthenticated port, the
    relay, takes sora's own outgoing mail (Sieve redirects, vacation replies); that mail lands in
    the same outbox, recorded with an empty username;
  - a CalDAV/CardDAV server. Each account gets one calendar (events and tasks) at
    `/caldav/{user}/calendars/default/` and one address book at
    `/carddav/{user}/contacts/default/`, created on first use; objects are `{uid}.ics` and
    `{uid}.vcf` inside them. The account can make further calendars (MKCALENDAR), rename calendars
    (PROPPATCH, the name only) and delete them, except its own, which can be renamed but not
    deleted;
  - a control API the tests use to clear an account's ALPS METADATA, Sieve scripts and DAV data,
    to create, subscribe or unsubscribe a folder over IMAP as another client would (a folder made
    with `create` is left unsubscribed), and to read or clear what was sent.

  SMTP and DAV credentials are checked by an IMAP login to sora, and a success is cached for
  5 seconds. Every DAV request needs Basic credentials that sora accepts.
- **alps** — built from this checkout with every plugin enabled (base, caldav, carddav,
  managesieve, gpg and password; password change goes to sora's admin API) and its `temp_dir`
  inside the state directory. Its `alps.toml` differs from a deployment's defaults:
  - `condstore`, `push_new_mail` and `push_subscribed_folders` are on (each defaults to off);
  - rate limiting is off (`[server.rate_limit] enabled = false`), because every sign-in comes from
    one address;
  - WebAuthn is bound to `rpid = "localhost"` with origin `http://localhost:<E2E_PORT>`;
  - there is no `login_key`, so the browser suite does not exercise what needs one: the
    `alps_login_token` cookie, session restore from it, and linked accounts and account switching
    (see [SESSIONS.md](SESSIONS.md)).

  With `E2E_CLUSTER=1`, the second ALPS runs from a copy of this config with its own address, and
  each gets its own `[cluster]` section (see [CLUSTER.md](CLUSTER.md) for what the cluster
  carries). Neither has a `login_key`, so a session is known only to the node that opened it.

One account, `alice@example.test`, is created for the run. The tests run serially against it.

Logs go to `E2E_LOGS`, by default `${TMPDIR:-/tmp}/alps-e2e-logs-<port>/`: `e2estack.log`,
`sora.log` and `alps.log`, plus `frontend-build.log` when the frontend was built and
`alps-secondary.log` with `E2E_CLUSTER=1`, and Playwright's `test-results/` unless `E2E_RESULTS`
says otherwise. They are kept after the run and deleted when the next run on the same port starts.
When Playwright reports a failure, the script prints both directories, as `==> server logs:` and
`==> traces and screenshots:`.

### The control API

The control API listens on `E2E_PORT`+7:

| Request | Does |
|---|---|
| `GET /healthz` | The harness waits on it at startup |
| `GET /outbox` | Every accepted submission, oldest first |
| `DELETE /outbox` | Empties the outbox |
| `POST /reset/settings` `{username, password}` | Deletes every METADATA entry under `/private/vendor/alps`: the account's ALPS settings, linked accounts, security keys and GPG keyring |
| `POST /reset/sieve` `{username, password}` | Deactivates and deletes every Sieve script |
| `POST /reset/dav` `{username}` | Drops the calendars the account made and empties the rest and the address book |
| `POST /mailbox/create`, `/mailbox/subscribe`, `/mailbox/unsubscribe` `{username, password, mailbox}` | CREATE, SUBSCRIBE or UNSUBSCRIBE over IMAP as that account |

Run on its own, e2estack's flags default to 127.0.0.1 ports 9900 (`-s3`), 2525 (`-smtp`), 2526
(`-relay`), 5232 (`-dav`), 9901 (`-control`), 1143 (`-imap`) and 4190 (`-sieve`), plus
`-deliver-url`, `-deliver-key` and `-local-domains` (default `example.test`). `scripts/e2e.sh`
sets every one of them.

### What the specs are given

Playwright reads `frontend/playwright.config.ts`: specs are the `*.spec.ts` files under `e2e/`;
one worker, not fully parallel, because the specs share one account; 30 s per test and 10 s per
`expect`; no retries; the `list` reporter; `outputDir` from `E2E_RESULTS`, else `test-results`;
`baseURL` from `ALPS_URL`, else `http://127.0.0.1:8900`; browser locale `en-US` unless a spec sets
another; a trace recorded for every test and kept only when it fails, and a screenshot taken
only on failure; one project, `chromium` (Desktop Chrome). `PW_CHROMIUM_PATH` sets the browser
executable.

The harness tells the specs where the servers are through `ALPS_URL`, `CONTROL_URL`,
`SORA_ADMIN_URL`, `SORA_ADMIN_KEY`, `DAV_URL`, `SIEVE_ADDR`, `IMAP_ADDR`, `E2E_USER` and
`E2E_PASSWORD`, plus `ALPS_SECONDARY_URL` with `E2E_CLUSTER=1`. Where one is unset, the config and
the fixtures fall back to the `E2E_PORT=8900` layout (ALPS 8900, IMAP 8901, ManageSieve 8902,
admin 8903, DAV 8906, control 8907). So `npx playwright test` run without the harness targets
those default ports.

---

## Writing a browser test

Specs live in `frontend/e2e/*.spec.ts`. Import `test` and `expect` from `./fixtures`, never from
`@playwright/test`: the fixture's `page` is what fails a test on console errors.

The fixture's `page` fails its test on any console message of type `error` and on any uncaught
page error (including unhandled rejections). The exceptions are a fixed built-in list (`favicon`,
`Lit is in dev mode`, `[vite]`, and Chromium's `Blocked script execution in 'about:srcdoc'` from
the sandboxed message reader frame) plus whatever the test allows with `allowConsoleErrors`. Only
that `page` is watched. A page a spec opens itself, in its own `browser.newContext()` or as
another page of the same context, can log errors without failing the test. Such contexts take the
config's `use` options (`baseURL`, `locale`) unless the spec overrides them.

What `fixtures.ts` offers:

| Helper | Does |
|---|---|
| `USER` | The run's account, `{ address, password }`, from `E2E_USER` and `E2E_PASSWORD` |
| `login(page)` | Puts the signed-in mailbox on screen, reusing the run's session when it still works |
| `signIn(page)`, `signInAs(page, address, password)` | A real sign-in through the form. When the page has not reached `#/mailbox` within 15 s it fails with `sign-in did not reach the mailbox`, followed by `— the login form says: …` when the form shows an error |
| `deliver({ subject, from, to, body, headers, messageId, raw, recipient, mailbox })` | Delivers through sora's delivery API, so Sieve filters run, unless `mailbox` is given, which files the message straight into that folder past the filters. `recipient` delivers to another account (default `USER`). `raw` replaces the generated message; otherwise a plain-text message is built with a unique Message-ID unless `messageId` is given |
| `sentMessages()` | Each accepted submission as `{ from, recipients, username, data, at }` (the exported `SentMessage` type), oldest first, with the raw message in `data` |
| `waitForSent(match, timeout = 10_000)` | Polls until a message satisfies `match` and returns it, or throws `no matching message was sent` |
| `clearSent()` | Empties the outbox |
| `resetSettings(account?)`, `resetSieve(account?)`, `resetDav(account?)` | Put the account back to its defaults. `resetSettings()` for `USER` also forgets the cached session, so the next `login()` signs in through the form |
| `mailboxElsewhere(verb, mailbox, account?)` | `"create"`, `"subscribe"` or `"unsubscribe"` a folder over IMAP, behind ALPS's back. A created folder is left unsubscribed |
| `seedEvent(…)`, `seedCalendarObject(uid, ics, account?)`, `readCalendarObject(uid, account?)` | Calendar data, written and read as a DAV client would |
| `seedContact(…)`, `readContact(uid, account?)`, `removeContact(uid)` | Contacts, written, read and deleted as a DAV client would |
| `createAccount({ address, password })`, `deleteAccount(address)` | Throwaway accounts |
| `allowConsoleErrors(page, ...patterns)` | Permit expected console errors in one test. Call it before the action that provokes them |
| `toast(page, text)` | A visible toast |
| `setDocked(page, docked)` | Docks or collapses the desktop sidebar and waits for its width to settle |
| `hasFocus(locator)` | Whether the element has the focus, looking into shadow roots |
| `tabTo(page, target, what, presses = 60, key = "Tab")` | Presses `key` until `target` has the focus, and fails naming `what` if it never does |

`account` defaults to `USER`; passing another is how a spec cleans up after a throwaway account.
`seedEvent`, `seedContact` and `removeContact` always act on `USER`.

`sieve-server.ts` speaks ManageSieve to sora directly: `storedScripts()`,
`storeActiveScript(name, content)` and `storeSwitchedOffScript(name, content)` read and write the
account's Sieve scripts as another client would, so a test can check what the server holds rather
than what ALPS shows. `storeSwitchedOffScript` stores the script and then switches every script
off (`SETACTIVE ""`). All three sign in as `USER` at `SIEVE_ADDR` (default `127.0.0.1:8902`), so
they cannot be used for a throwaway account.

`session-probe.ts` holds the rule `login()` reuses a session by. `login()` probes
`GET /mailboxes/INBOX/status` outside the page, and only a 401 means the session is dead. Any other
answer, including a 5xx, or a probe that never completes keeps the cached cookies. The Vitest test
`frontend/test/session-probe.test.ts` pins this rule.

The suite reaches ALPS at `http://127.0.0.1:<port>`, but a security key is bound to a hostname and
Chromium takes no IP address as one. A spec that registers a security key therefore sets
`test.use({ baseURL })` to `ALPS_URL` with `127.0.0.1` replaced by `localhost`, which the harness
configures as the WebAuthn relying party.

Rules that keep a serial suite on one account reliable:

- Use unique subjects; never assume the inbox is empty.
- Put back anything global a test changes (`resetSettings()` and friends, in `afterEach`).
- A test that deletes its account or changes its password uses an account from `createAccount`.
- Wait with `expect(…)` or `expect.poll(…)`, never with a fixed sleep.
- An expected refusal still logs a console error in Chromium (`Failed to load resource: … 4xx`).
  Allow that exact line in that one test with `allowConsoleErrors`; do not widen the built-in
  list.

`npm run typecheck:e2e` in `frontend/` typechecks the specs. It cannot see a locator whose text or
role the page does not render — only running the suite does.

---

## When a run fails

- **"<tool> is required and was not found on PATH"** — put `go`, `npm`, `psql`, `curl` and `lsof`
  on `PATH`.
- **"no sora checkout at <dir>; set SORA_DIR"** — the directory must contain `cmd/sora/main.go`.
- **"cannot reach PostgreSQL as <user>@<host>:<port>"** — set `E2E_PG_*`. The user needs
  permission to create and drop databases.
- **"port … is in use"** — an earlier run is still up, or something else holds the port. Stop it,
  or pick another `E2E_PORT`. The check only sees servers that are already listening, so a second
  run started on an overlapping `E2E_PORT` while the first is still building passes it, and one of
  the two then fails at startup.
- **"gave up waiting for the build lock at …"** — another run held the build lock for about ten
  minutes.
- **A frontend build failure** — the script prints the last 30 lines of `frontend-build.log`.
- **"<server> exited during startup"** or **"<server> did not become ready"** (after about 60 s) —
  the server is `the test stack`, `sora`, `alps` or `secondary alps`, and the last 20 lines of its
  log follow.
- **"a server died during the run: <names>"** — the names are among `e2estack`, `sora`, `alps`
  and `alps-secondary`; read `<name>.log` in the logs directory the message prints. Every test
  after that point failed for that reason alone, so read the log before reading anything into the
  failures. The run then exits 1 whatever Playwright reported.
- **A test fails with "the page logged errors"** — the application logged a console error. That is
  a finding, not noise; look at what was logged.
- **"sign-in did not reach the mailbox"** — a sign-in through the form did not reach the mailbox
  within 15 s. When the form showed an error, the message goes on with `— the login form says:`
  and that error.
- **Traces and screenshots** of failed tests are in `E2E_RESULTS`, by default `test-results/` in
  the logs directory (`npx playwright show-trace <trace.zip>`).
