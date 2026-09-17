# Browser Tests

ALPS has three test tiers:

| Tier | Where | What it catches |
|---|---|---|
| Go tests | `go test ./...` | Handlers, providers, sessions, protocol handling |
| Frontend unit tests | `cd frontend && npm test` (Vitest + jsdom) | Component logic and render decisions |
| **Browser tests** | `scripts/e2e.sh` (Playwright + Chromium) | The application actually running against real servers |

The browser tier exists for what the other two cannot see: a component reading a field the backend
does not send, a page that logs an error and renders nothing, a flow that only breaks once a real
IMAP server, a real SMTP submission and a real browser are all involved. Every test fails on any
console error or uncaught exception, not only on its own assertions.

---

## Running

Requirements:

- Go and Node.js (the versions the rest of the repository needs)
- A PostgreSQL server the harness can create databases on (with the `pg_trgm` extension available)
- A checkout of [sora](https://github.com/migadu/sora), by default next to this repository at `../sora`
- Playwright's Chromium: `cd frontend && npx playwright install chromium`

```sh
cd frontend && npm install && cd ..

scripts/e2e.sh                          # the whole suite
scripts/e2e.sh e2e/reading.spec.ts      # one file; arguments go to Playwright
scripts/e2e.sh -g "Reply All"           # tests whose title matches
make test-e2e                           # same as the first line
```

Playwright reads a file argument as a regular expression over the path, so a bare
`reading.spec.ts` also runs `threading.spec.ts`. Give the `e2e/` prefix.

| Variable | Default | Meaning |
|---|---|---|
| `SORA_DIR` | `../sora` | The sora checkout to build |
| `E2E_PORT` | `8900` | ALPS's port; the other servers use the next eight |
| `E2E_PG_HOST` / `E2E_PG_PORT` / `E2E_PG_USER` / `E2E_PG_PASSWORD` | `localhost` / `5432` / `postgres` / empty | The PostgreSQL server |
| `E2E_SKIP_BUILD` | unset | Test the `frontend/dist` already on disk instead of rebuilding it |
| `E2E_KEEP_STATE` | unset | Keep the database and state directory after the run |
| `PW_CHROMIUM_PATH` | unset | Use an already installed Chromium binary |

Two runs on different `E2E_PORT`s share nothing — servers, database, state and logs are all keyed
by the port — so they can run side by side. Only the frontend build is serialized, because
`frontend/dist` is a single directory that the ALPS binary embeds.

---

## What the harness starts

```
PostgreSQL ─┐
e2estack ───┼─► sora (IMAP, ManageSieve, admin API) ─┐
(object store, SMTP, CalDAV/CardDAV, control API) ───┴─► alps ─► Chromium
```

- **sora** — built from `SORA_DIR` and run on a throwaway database `alps_e2e_<port>`. It is a
  complete IMAP server with METADATA (where ALPS keeps its settings), ManageSieve, Sieve filtering
  on delivery, and an admin API the tests use to create accounts and deliver mail. The tests
  therefore exercise ALPS's IMAP provider, not a stand-in.
- **e2estack** (`internal/e2estack`) — the servers around sora, all in memory:
  - an S3-compatible object store for sora's message bodies;
  - the SMTP submission server ALPS sends through. It authenticates against sora, records every
    message it accepts, and delivers mail for `example.test` back into sora, so a message sent to
    yourself arrives like real mail. A second, unauthenticated port takes sora's own outgoing mail
    (Sieve redirects, vacation replies);
  - a CalDAV/CardDAV server (one calendar holding events and tasks, one address book per account);
  - a control API the tests use to reset an account's settings, Sieve scripts and DAV data, and
    to read what was sent.
- **alps** — built from this checkout with the login rate limiter off (every sign-in comes from one
  address) and every plugin enabled, including password change, which goes to sora's admin API.

One account, `alice@example.test`, is created for the run. The tests run serially against it.

Server logs are in `$TMPDIR/alps-e2e-logs-<port>/` and are kept after the run.

---

## Writing a test

Specs live in `frontend/e2e/*.spec.ts`. Import `test` and `expect` from `./fixtures`, never from
`@playwright/test`: the fixture's `page` is what fails a test on console errors.

What `fixtures.ts` offers:

| Helper | Does |
|---|---|
| `login(page)` | Puts the signed-in mailbox on screen, reusing the run's session when it still works |
| `signIn(page)`, `signInAs(page, address, password)` | A real sign-in through the form |
| `deliver({ subject, from, body, headers, raw, … })` | Delivers a message through sora, filters included |
| `sentMessages()`, `waitForSent(predicate)`, `clearSent()` | What the SMTP server accepted, as raw messages |
| `resetSettings()`, `resetSieve()`, `resetDav()` | Put the account back to its defaults |
| `seedEvent(…)`, `seedCalendarObject(…)`, `readCalendarObject(uid)`, `seedContact(…)` | DAV data, written and read as a DAV client would |
| `createAccount(…)`, `deleteAccount(address)` | Throwaway accounts |
| `allowConsoleErrors(page, /pattern/)` | Permit an expected console error in one test |
| `toast(page, text)` | A visible toast |

Rules that keep a serial suite on one account reliable:

- Use unique subjects; never assume the inbox is empty.
- Put back anything global a test changes (`resetSettings()` and friends, in `afterEach`).
- A test that deletes its account or changes its password uses an account from `createAccount`.
- Wait with `expect(…)` or `expect.poll(…)`, never with a fixed sleep.
- An expected refusal still logs a console error in Chromium (`Failed to load resource: … 4xx`).
  Allow that exact line in that one test with `allowConsoleErrors`; do not widen the global list.

`npm run typecheck:e2e` in `frontend/` typechecks the specs. It cannot see a locator whose text or
role the page no longer renders — only running the suite does.

---

## When a run fails

- **"port … is in use"** — an earlier run is still up, or something else holds the port. Stop it,
  or pick another `E2E_PORT`.
- **"cannot reach PostgreSQL"** — set `E2E_PG_*`. The user needs permission to create and drop
  databases.
- **"a server died during the run"** — every test after that point failed for that reason alone.
  Read the log the message names before reading anything into the failures.
- **A test fails with "the page logged errors"** — the application logged a console error. That is
  a finding, not noise; look at what was logged.
- **Traces and screenshots** of failed tests are in `frontend/test-results/`
  (`npx playwright show-trace <trace.zip>`).
