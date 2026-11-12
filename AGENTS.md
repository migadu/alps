# AGENTS.md

Commands, rules and traps for anyone changing this repository, coding agents included. The
explanations live in [docs/](docs/); this file links to them and does not repeat them. Where it
disagrees with the code, the code is right: fix this file in the same change.

## What ALPS is

A Go server (package `alps` at the root, binary in `cmd/alps`) that serves a JSON API and an
embedded single-page frontend built with Lit, and talks to IMAP, SMTP, CalDAV, CardDAV and
ManageSieve servers on each user's behalf. It has no database: per-account data is kept on the
mail server in IMAP METADATA, under `/private/vendor/alps/<key>`. Read
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before a change that crosses the backend and the
frontend.

| Path | What is there |
|---|---|
| `*.go` at the root | Server, sessions, middleware, rate limiting, auth records |
| `provider/` | Mail stores: `imap`, `maildir`, `multi` |
| `plugins/<name>/` | `base`, `caldav`, `carddav`, `gpg`, `managesieve`, `password`: Go code, plus `frontend/` and `frontend/i18n/` where the plugin has a UI ([docs/PLUGINS.md](docs/PLUGINS.md)) |
| `frontend/src/` | The SPA: `components/`, `pages/`, `store/`, `services/`, `utils/`, `i18n/` |
| `frontend/test/` | Vitest unit tests, for the core and the plugins alike |
| `frontend/e2e/` | Playwright browser tests |
| `frontend/dist/` | The built frontend, tracked in git (see below) |
| `internal/` | `e2estack` (servers around sora for the browser tests), `davsave`, `imip`, `itip` |
| `cluster/`, `tlsmanager/` | Gossip between nodes, ACME and certificate storage |
| `dist/` | systemd unit and FreeBSD rc.d script |

## Build and run

Go 1.25 or later. Node.js 20.19+, 22.12+ or 24+.

```sh
cp config.example.toml config.toml          # config.toml is git-ignored
go run ./cmd/alps -config config.toml       # listens on :1323
cd frontend && npm install && npm run dev   # Vite; proxies the API to localhost:1323
cd frontend && npm run build                # tsc, then vite build into frontend/dist
make build                                  # build/alps
```

## Checks

There is no CI. Run what your change touches before you open a PR:

```sh
go fmt ./... && go vet ./...
go test ./...                          # needs no external services
cd frontend && npx tsc                 # typechecks src and every plugin frontend; writes nothing
cd frontend && npm test                # typechecks tests, then runs Vitest on frontend/test/**/*.test.ts
cd frontend && npm run typecheck:e2e   # after changing browser specs
scripts/e2e.sh e2e/reading.spec.ts     # browser tests: sora at ../sora and PostgreSQL
make test-all                          # go test, frontend unit tests, then browser tests
```

[docs/E2E.md](docs/E2E.md) covers the three tiers. The browser suite:

- A file argument is a regular expression: keep the `e2e/` prefix, or `reading.spec.ts` also runs
  `threading.spec.ts`.
- `E2E_PORT` (default 8900) claims nine consecutive ports, or twelve with `E2E_CLUSTER=1`, and
  gives the run its own state, logs and `E2E_RESULTS` directories. When someone else may be
  running the suite, pick a free base.
- Specs import `test` and `expect` from `./fixtures`. A console error fails the test. Treat it as
  a finding, not noise; allow an expected one in that test alone with `allowConsoleErrors`.
- Wait with `expect(…)` or `expect.poll(…)`, never a fixed sleep. Use unique subjects, and put back
  anything global a test changes.

A change to how WebAuthn records are updated also runs `python3 scripts/model-recovery-versions.py`.

## `frontend/dist` is tracked

The binary embeds `frontend/dist` (`//go:embed all:frontend/dist` in `server.go`), so a change
under `frontend/src` or `plugins/*/frontend` is finished only when the dist is rebuilt from it.

- Rebuild with `npm run build` and commit the result as the last commit, alone, with the subject
  `frontend/dist: rebuilt`. Stage it with `git add -A frontend/dist`: file names carry content
  hashes, and the old ones must go too.
- Leave the dist matching the final source. After a rebase or a later source change, rebuild
  again. Resolve a conflict in the dist by rebuilding, never by editing it.
- `scripts/e2e.sh` rebuilds the dist unless `E2E_SKIP_BUILD=1` is set. Read `git status` after a
  run and never `git commit -a`, which sweeps the rebuilt dist into a source commit.
- Go-only and docs-only changes do not touch the dist.

## Dependencies

- go-imap is `github.com/migadu/go-imap`, a hard fork with its own module path and tags. Bump it
  with `go get github.com/migadu/go-imap@<tag>`.
- go-smtp, go-message and go-webdav are imported by their `github.com/emersion/…` paths and pinned
  in `go.mod` with `replace` to forks under `github.com/migadu/`. A change to one goes into its
  fork first. Then repin with `go mod edit -replace …@<commit>` and `go mod tidy`.
- After a bump, run the Go tests and the browser suite (`E2E_SKIP_BUILD=1` when the frontend did
  not change).

## Frontend

- Stylesheets use logical properties (`margin-inline-start`, `inset-inline-end`,
  `text-align: start`). `frontend/test/rtl-interface.test.ts` fails on a new physical side. See
  [docs/LOCALIZATION.md](docs/LOCALIZATION.md#right-to-left-layout).
- A plugin page or settings tab registers with `load: () => import(…)`, not a static import, so
  it stays out of the first download.
- `alps-input` sends `change` only when a value is committed. A consumer that wants every
  keystroke listens to `input`.
- A unit test that types into a field inside a shadow root dispatches its events with
  `{ bubbles: true, composed: true }`, as a browser does.
- A `*.test.ts` beside a source file never runs. Unit tests go in `frontend/test/`, plugin tests
  too.

## Translations

The interface ships 19 languages. [docs/LOCALIZATION.md](docs/LOCALIZATION.md) has the details.

- Every visible string is a dictionary key. A new key goes into `en.ts` and into every other
  dictionary of the same set: the core set in `frontend/src/i18n/`, or the plugin's
  `plugins/<name>/frontend/i18n/`. `frontend/test/i18n-dictionaries.test.ts` fails on a missing
  or extra key, a lost placeholder, or a wrong plural form.
- A phrase with a count is a plural key, not a `.replace()` on the result of `t()`.
- `sr` is Serbian in Latin script and `rs` Serbian in Cyrillic, the opposite of what the codes
  suggest. `pt` is the Portuguese of Portugal and `pt-BR` that of Brazil. Write each new string in
  the right variety, and do not reword existing ones in passing.
- When translations are machine-written, say so in the PR so a native speaker can check them.
- The text of calendar invitation emails is in `plugins/caldav/mailtext.go`, not in the
  dictionaries.

## Settings, configuration and docs

- Per-account data goes through the store, never into a database or onto the node's disk. User
  preferences belong in the `base.settings` record, which must fit in one METADATA entry, so keep
  additions small. See
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#4-stateless-persistence-imap-metadata).
- A new configuration key is documented with its default in `config.example.toml` and in
  [docs/CONFIGURATION.md](docs/CONFIGURATION.md).
- A change in behaviour updates the page in `docs/` that describes it.

## Commits and pull requests

- Subjects read `area: what is true now`, in lower case, with the area named after the part
  changed: `provider/imap: a failed SELECT keeps its cause`, `alps-input: one input per key`. Dependency
  bumps are `chore(deps): …`.
- For a bug a test can show, the failing test comes first (`area: failing tests for #123`), then
  the fix, then `frontend/dist: rebuilt` when the frontend changed. Each commit builds and passes
  on its own.
- A PR body starts with `Fixes #123.` when it closes an issue, then says what changes for the
  user.
- One concern per PR.
- A defect you notice but do not fix becomes an issue, after you check `main` and the open issues
  for it. Security findings are the exception; see below.

## Security

- Never put a suspected vulnerability in a public issue, pull request, commit or comment. Report
  it to the person you work for, who decides how it is handled.
- Word a security fix as an added protection. Commits, code comments, test names, branch names
  and PR text say what is now protected, not how the gap could have been used.

## Working beside other agents

Several agents often share one clone.

- Work in your own git worktree, not the main checkout.
- Never use `git stash`: the stash is shared by every worktree.
- Read `git status` and `git diff` before staging. A file may hold someone else's uncommitted work.
- Before pushing, fetch, and rebase if `origin/main` has moved.
