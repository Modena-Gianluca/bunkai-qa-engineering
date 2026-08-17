# Adapt Framework Plan — Bunkai TMS (BK)

> Generated: 2026-08-15
> Project: Bunkai (BK)
> Status: PENDING APPROVAL

## 1. Project Summary

- **Stack**: Next.js 15 (App Router) + Supabase (Postgres + RLS + Realtime + Storage) + R2 + Vercel. Target repo: `upex-bunkai-tms`.
- **Auth**: Email-first sign-in with OTP confirmation. Browser = Supabase SSR session cookie (`sb-<ref>-auth-token`); Headless/API = Bearer PAT (`bk_pat_<prefix>.<secret>`) or raw session JWT.
- **Main entities** (from feature-map): Workspace, Project, Module, User Story, AC, ATC, Test, Run (run_atcs/run_steps), Bug, Milestone, Import Job.
- **OpenAPI source**: Local file `../upex-bunkai-tms/public/openapi.json` (already synced — `api/openapi-types.ts` generated, 7892 lines, 60+ endpoints).
- **Environments**: `local` (localhost:3000) + `staging` (staging-upexbunkai.vercel.app). Default: staging.

## 2. Auth Strategy — HYBRID

| Surface | Mechanism | Detail |
|---|---|---|
| Browser (UI tests) | Supabase SSR session cookie | Email-first: `POST /auth/check-email` → `POST /auth/signin` → server sets session cookies. Post-login URL: `/projects`. |
| API tests (headless) | `Authorization: Bearer bk_pat_...` | `POST /auth/signin` body `{email, password, pat_name?, pat_scopes?, pat_expires_in_days?}` → response `pat.token` = `bk_pat_*`. OR mint via `POST /tokens` (cookie session only). |
| Agentic curl (api-login.ts) | Bearer PAT | `scripts/api-login.ts` must mint a PAT via signin and store in `.auth/tokens.env`. |

**Key contract facts** (verified in target repo):
- Login flow: `POST /api/v1/auth/signin` `{email, password}` (min 6) → `200 {user, session, pat, warning}`. PAT defaults scopes `['atc:read','atc:write','run:execute']`, non-expiring if `pat_expires_in_days` omitted.
- Unconfirmed account: signin 401s → `POST /api/v1/auth/confirm` `{email, token}` (6–8 digit OTP) → same signin-shaped response.
- Success probe: `GET /api/v1/me` → `200 {user:{id,email}, workspaces[], active_workspace_id, active_workspace_role, auth:{source:'cookie'|'bearer', scopes[]}}`.
- UI success indicator: land on `/projects` (`data-testid="projects-list"`); login form testids: `login-email`, `login-continue`, `login-password`, `login-signin`, `login-create`, `login-otp`, `login-verify`, `login-resend`, `login-error`.
- **Token refresh**: per-run minting (NO auto-refresh). Supabase session JWT TTL = 1h (GoTrue default); PATs are non-expiring by default. Use PAT for the agentic curl flow (stable), not the short-lived session JWT.
- **Current test user**: `qa1@antocalie.resend.app` (staging, password in `.env` `STAGING_USER_PASSWORD`). Already confirmed via Resend (OTP verified in a prior session).

## 3. OpenAPI Strategy

- **Source**: local file → already synced (`bun run api:sync --file ../upex-bunkai-tms/public/openapi.json`). No re-sync needed unless the target spec changes.
- **Facades to create** (in `api/schemas/`):
  | Facade | Sources schemas / paths |
  |---|---|
  | `auth.types.ts` (adapt existing) | `/auth/signin`, `/auth/confirm`, `/me`, `AuthSigninResponse`, `MeResponse`, `Pat` |
  | `runs.types.ts` (new) | `/runs`, `/runs/{id}`, `/runs/{id}/abort`, `/runs/{id}/finish`, `/runs/{id}/steps/{stepId}/mark`, `Run`, `RunAtc`, `RunStep`, `CreateRunBody` |
  | `atcs.types.ts` (new, optional first pass) | `/atcs`, `/atcs/{id}`, `Atc`, `AtcStep`, `AtcAssertion` |
- **Golden rule**: components import from `@schemas/*`, NEVER `@openapi`. Only facades consume `@openapi`.

## 4. Identity + Variables

### 4.1 `.agents/project.yaml` (mostly populated already)
- `project_key: BK` ✓ · `project_name: Bunkai` ✓ · `webapp_domain: upexbunkai.vercel.app` ✓
- **Fix**: `environments.<env>.db_mcp` / `api_mcp` — currently `local-dbhub`/`staging-dbhub` and `local-openapi`/`staging-openapi`, but the actual MCP servers are named `dbhub` and `openapi`. Point both envs at the existing single servers (`dbhub` / `openapi`).
- `qa_epics.*.key` still null — resolved at runtime by skills, leave.
- `testing.tms_cli: acli` — TMS modality **RESOLVED: jira-native** (2026-08-16; user lacks Xray admin/API keys). Migrate to `bun xray` once XRAY_CLIENT_ID/SECRET exist — see Discovery Gaps.

### 4.2 `.env` (already populated for staging)
- `STAGING_USER_EMAIL` ✓ `STAGING_USER_PASSWORD` ✓
- `API_BASE_URL=` → set to `https://staging-upexbunkai.vercel.app` (agentic curl base)
- `OPENAPI_SPEC_PATH=` → set to local spec path `C:\Users\redes\Desktop\projects\dojo\bunkai-qa-engineering\api\openapi.json` (or the staged copy)
- `DBHUB_*` ✓ (already set — Supabase pooler)
- `ATLASSIAN_URL` ✓ (upexgalaxy71.atlassian.net), `ATLASSIAN_EMAIL`/`ATLASSIAN_API_TOKEN` present in `.env`
- `AUTO_SYNC` — keep `false` until TMS modality confirmed.

### 4.3 `config/variables.ts`
- `envDataMap.staging.base` = `https://staging-upexbunkai.vercel.app`, `api` = `.../api` (currently points at `dojo.upexgalaxy.com` — example host).
- `config.auth`: `loginEndpoint: '/api/v1/auth/signin'`, `tokenEndpoint: '/api/v1/auth/signin'`, `meEndpoint: '/api/v1/me'`, `tokenLifetimeSeconds: 3600` (session JWT 1h; note PAT is non-expiring). Keep storage paths.

## 5. Components to Create / Modify

### API components
| File | Action |
|---|---|
| `tests/components/api/AuthApi.ts` | ADAPT: `authenticateSuccessfully` → POST signin, assert `200` + `user.id` + `pat.token`; setAuthToken(pat.token); probe GET `/me` assert `user.email`. `loginWithInvalidCredentials` → 401. Replace `@atc('PROJ-101')`→`@atc('BK-101')`, `PROJ-102`→`BK-102`. |
| `tests/components/api/RunApi.ts` | CREATE: `startRunSuccessfully(testId)`, `markStepSuccessfully(runId, stepId, status)` (`@atc('BK-201')`+), `abortRun`, `finishRun`. |
| `tests/components/api/ApiBase.ts` | KEEP (Bearer header already correct). |
| `tests/components/api/ExampleApi.ts` | DELETE. |

### UI components
| File | Action |
|---|---|
| `tests/components/ui/LoginPage.ts` | ADAPT to email-first flow: locators `login-email` → `login-continue` → `login-password` → `login-signin`; success = waitForURL `/projects` + `projects-list` visible. `@atc('BK-101')`/`BK-102`. |
| `tests/components/ui/ExamplePage.ts` | DELETE. |

### Steps / data / specs
| File | Action |
|---|---|
| `tests/components/steps/ExampleSteps.ts` | DELETE |
| `tests/e2e/module-example/`, `tests/integration/module-example/` | DELETE; remove `testIgnore` line in playwright.config.ts |
| `tests/data/fixtures/example.json` | DELETE |
| `tests/data/DataFactory.ts` + `types.ts` | STRIP hotel/booking; add `Run`/`Atc`/`Workspace` types + factories; keep `TestUser`/`TestCredentials`/`ApiState` |
| `api/schemas/example.types.ts` | DELETE (consumed by ExampleApi) |
| `tests/e2e/dashboard/dashboard.test.ts`, `tests/integration/auth/user-session.test.ts` | Reconcile `UPEX-` keys → `BK-`; keep if endpoints resolve to real API (they reference `/auth/me` — keep). |

### Setups
| File | Action |
|---|---|
| `tests/setup/api-auth.setup.ts` | Uses `{api}` fixture → `api.auth.authenticateSuccessfully` (already the pattern); asserts `.auth/api-state.json` non-empty. Token source: PAT. |
| `tests/setup/ui-auth.setup.ts` | Intercept POST `/api/v1/auth/signin`; run LoginPage email-first flow; storageState → `.auth/user.json` + `.auth/api-state.json`. |
| `scripts/api-login.ts` | ADAPT: `buildAuthPayload` → `{email, password, pat_name: '<env>-agentic', pat_scopes: [...]}`; `extractTokenFromResponse` → `body.pat.token`. Store as `API_TOKEN_<ROLE>_<ENV>`. |

## 6. Env Vars + Secrets

- `.env` to populate: `API_BASE_URL`, `OPENAPI_SPEC_PATH` (see §4.2). Everything else present.
- **GitHub repo Secrets the user must set** (outside repo):
  - `STAGING_USER_EMAIL` / `STAGING_USER_PASSWORD`
  - `ATLASSIAN_EMAIL` / `ATLASSIAN_API_TOKEN` (if `AUTO_SYNC=true` after TMS modality confirmed)
  - `XRAY_CLIENT_ID` / `XRAY_CLIENT_SECRET` (only if modality = xray)
  - optional `SLACK_WEBHOOK_URL`
  - `API_BASE_URL`, `OPENAPI_SPEC_PATH` (for OpenAPI MCP in CI, if used)
- Manual external: create `gh-pages` branch + enable GitHub Pages if browsable Allure reports wanted.

## 7. CI + MCP + Reporting

- **Workflows** (`.github/workflows/{regression,sanity,smoke,build}.yml`): verify `environment.options` = `[local, staging]`, secret names = `<ENV>_USER_EMAIL/_PASSWORD`, smoke filter = `@critical`. No change expected unless drift.
- **MCP dual-file** (`.mcp.json` `${VAR}` + `opencode.jsonc` `{env:VAR}`): both already declare `dbhub` + `openapi`. Set `API_BASE_URL` + `OPENAPI_SPEC_PATH` in `.env` so `openapi` server reads the local spec (schema-read-only; NO token injection — auth via curl per doctrine).
- **`dbhub.toml`**: `[[sources]] primary` already matches `DBHUB_*` (Supabase pooler). Keep.
- **`allurerc.mjs`**: `name: 'Agentic QA Boilerplate'` → `name: 'Bunkai TMS QA'`.

## 8. Implementation Phases

| Phase | Work | Gate |
|---|---|---|
| P3 | project.yaml mcp names fix · .env API_BASE_URL/OPENAPI_SPEC_PATH · config/variables.ts envDataMap+auth | after approval |
| P4 | (skip re-sync) create `runs.types.ts` + adapt `auth.types.ts`; update `index.ts` | |
| P5 | AuthApi.ts, LoginPage.ts, api-login.ts, api-auth/ui-auth setups | |
| P6 | RunApi.ts, fixture wiring, delete all Example*/module-example, DataFactory strip, smoke test `@critical` | |
| P7 | kata-manifest regen, workflows check, MCP dual check, allurerc rename | |
| P8 | Validation gate (§8 of command) — repo:check, api-setup, ui-setup, api:login, test:smoke ×2 | |
| P9 | Genericness scan + report + CLAUDE.md update + /sync-ai-memory handoff | |

## 9. AI Guidelines

- Golden KATA: components import `@schemas/*` facades, never `@openapi`. Only `api/schemas/` consumes `@openapi`.
- `@atc('BK-NNN')` on every ATC. Max 2 positional params (3+ → object). Locators inline unless reused 2+ times.
- Alias imports (`@api/`, `@schemas/`, `@utils/`) — no relative.
- Smoke tag = `@critical` (NOT `@smoke`). `test:smoke` greps `@critical`.
- Never hardcode credentials; read from `.env` via `config.testUser`.
- Step endpoint is `POST /api/v1/runs/{id}/steps/{stepId}/mark` — NOT `/result` (docs reconciled in commit `05495ad`).

## 10. Questions Answered

- Auth: HYBRID (cookie for browser, Bearer PAT for headless/curl). Verified against target route handlers + middleware.
- OpenAPI source: local file (already synced).
- First entity: **Run** (highest traffic per master-test-plan §2 — CRITICAL "Run step-mark & lifecycle"). Wire `RunApi` end-to-end.
- Test user: `qa1@antocalie.resend.app` staging, confirmed.
- Envs: local + staging. URLs match project.yaml.
- OpenCode + Claude Code both in use → dual-file MCP sync mandatory.
- Allure name: "Bunkai TMS QA".

## 11. Discovery Gaps

1. **TMS modality unconfirmed** (jira-native vs xray). `tms_cli: bun xray` assumed; `AUTO_SYNC` stays false until confirmed.
2. **Runtime cookie name**: `sb-<ref>-auth-token` derived from deployed Supabase ref — not pinned; UI tests use cookie via storageState (works regardless).
3. **Session JWT TTL = 1h** (GoTrue default) — tests use PAT (non-expiring) for API; if a test needs the session JWT, mint per-run.
4. **`/me` email optional** — admin lookup best-effort; assert `user.id` primarily.
5. **PAT scopes**: headless tokens never carry `workspace:admin`; harness scoped to `atc:read`/`atc:write`/`run:execute` — if an admin-scoped token is ever needed, mint via browser session `POST /tokens`.
6. **Q4 epics keys null** — runtime discovery; not blocking adaptation.
7. **GitHub Pages / gh-pages branch** — not confirmed enabled; report browsing needs external setup.

## 12. Genericness Baseline (Phase 0 snapshot)

| Subsystem | Status |
|---|---|
| OpenAPI types | ✅ ADAPTED (synced, real paths incl. `/mark`) |
| project.yaml | ⚠️ GENERIC (mcp names drift) |
| ATC keys | ⚠️ GENERIC (`PROJ-101`/`UPEX-` present) |
| Example components | ❌ GENERIC (ExampleApi/Page/Steps/example.types exist) |
| Example specs | ❌ GENERIC (module-example ×2 + testIgnore) |
| Example domain data | ❌ GENERIC (hotel/booking in DataFactory) |
| Facade boundary | ⚠️ GENERIC (only auth.types; no real domain facades) |
| Auth URLs | ❌ GENERIC (`dojo.upexgalaxy.com` in variables.ts) |
| Smoke tag | ✅ ADAPTED (`@critical`) |
| kata-manifest | ⚠️ GENERIC (6 × "Example") |
| MCP dual-file | ⚠️ GENERIC (env vars empty) |
| allurerc | ❌ GENERIC (boilerplate name) |
| .env values | ⚠️ GENERIC (API_BASE_URL/OPENAPI_SPEC_PATH empty) |

## 13. Approval Checklist

- [ ] Confirm first entity = **Run** (RunApi + step-mark smoke)
- [ ] Confirm auth strategy = HYBRID (cookie UI + Bearer PAT API) — no UI 2FA/OTP bypass needed at runtime (user already confirmed)
- [ ] Confirm Allure report name = "Bunkai TMS QA"
- [ ] Confirm `.env` edits: `API_BASE_URL` + `OPENAPI_SPEC_PATH` (staging URLs / local spec path)
- [ ] Confirm deletion of all `Example*` + `module-example/` + hotel/booking data
- [ ] Approve plan → Phases 3-9 execute

> WAIT for explicit user approval before starting Phase 3. Do not write code yet.
