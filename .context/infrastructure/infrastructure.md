# Infraestructura — upex-bunkai-tms (Vercel + Supabase single-tenant)

## Environments (`upex-bunkai-tms/.agents/project.yaml:70-82`)

| Env | Web | API base | Supabase ref |
|---|---|---|---|
| `local` | `http://localhost:3000` | `http://localhost:3000/api` | `fmbpikzpkafptqximhxn` |
| `staging` | `https://staging-upexbunkai.vercel.app` | `https://staging-upexbunkai.vercel.app/api` | `fmbpikzpkafptqximhxn` |
| `production` | `https://upexbunkai.vercel.app` | `https://upexbunkai.vercel.app/api` | `fmbpikzpkafptqximhxn` |

- `testing.default_env: local` (`project.yaml:35`) — default de QA.
- Mismos valores espejados en runtime: `lib/urls.ts:9-13` (`APP_URLS`), detección por `VERCEL_ENV` (`:17-25`).
- **Single-tenant**: los 3 envs apuntan al MISMO proyecto Supabase (`fmbpikzpkafptqximhxn`, `project.yaml:74,78,82`) — decisión MVP documentada (ADR-0009, `project.yaml:138-141`). Riesgo: datos compartidos entre local/staging/prod; QA debe usar fixtures dedicados.

## Deploy — Vercel

- Sin `vercel.json` ni config custom (verificado). Deploy estándar Next.js.
- Aliases: `staging-upexbunkai.vercel.app` (preview/staging branch) y `upexbunkai.vercel.app` (production) — `project.yaml:75-81`
- `NEXT_PUBLIC_APP_URL` debe apuntar al host de cada env (`.env.example:131` default localhost)
- Dominio defensivo `bunkai.io` → redirige a producción (post-MVP, `project.yaml:13`)

## Supabase

- Ref único: `fmbpikzpkafptqximhxn` (dashboard URL) — `project.yaml:74,78,82`
- Postgres 16 (`project.yaml:27`); 70 migraciones en `supabase/migrations/0001..0070` (ver backend.md)
- Migraciones aplicadas por `autonomous_delivery.migrations: unrestricted` (`project.yaml:136-144`) — DDL destructivo permitido sin confirmar (riesgo para datos de QA en el shared project)
- Acceso QA: `SUPABASE_ACCESS_TOKEN` (MCP admin, `.env.example:89`) + `POSTGRES_*` conexión directa (`:117-123`)

## CI/CD — GAP confirmado

- **NO hay CI/CD**: no existe `.github/`, ni `vercel.json`, ni `.gitlab-ci.yml`, ni `.circleci/`, ni `Jenkinsfile` (verificado por filesystem).
- Solo **Husky local** (`package.json:40` prepare):
  - `.husky/pre-commit` — `bunx lint-staged` + `types:check` + `vars:check` + `skills:check` + `skills:registry:check` condicional
  - `.husky/pre-push` — `format:check` + `lint:check` + `vars:env:check` + `skills:registry:check`
- **Impacto QA**: nada ejecuta E2E automáticamente post-deploy; la regresión corre a mano o desde nuestro repo. Gate local completo: `bun run repo:check` (`package.json:37`).

## Test runner (target)

- `bun test` (`package.json:36`). Suites: unit puras (`middleware.test.ts` — gate `isProtected`; `lib/tree.test.ts`, `lib/supabase/rpc.test.ts`) + `*-isolation.test.ts` que pegan contra Supabase REAL y hacen `describe.skip` si falta env (patrón: `app/api/v1/auth/magic-link/route.test.ts:33`).
- **NO hay E2E ni Playwright en el target** — confirmado. Nuestro repo es el que aporta la capa E2E.

## Git strategy (`project.yaml:89-119`)

- `main-integration`: `main` (production) + `staging` (integration), protegidas (`:102`); feature/fix branches salen de staging, merge `--no-ff`; release = fast-forward `staging → main` (`:92-97`); hotfix branch-off-prod + backmerge mismo día
- `promote_method: ff-only` (`:104`), `feature_merge: merge-commit` (`:105`), `direct_push_to_protected: confirm` (`:108`)
- QA: PRs de fixtures/tests van a `staging`, no directo a `main`.

## Variable contract (QA)

Nombres desde `.env.example` + `lib/env.ts` (¡el runtime usa nombres LEGACY, ver backend.md):

| Var | Uso QA | Fuente |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | base de API/auth del app | `.env.example:102` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente browser/SSR | runtime `middleware.ts:6` (NO está en `.env.example` — gap) |
| `SUPABASE_SERVICE_ROLE_KEY` | setup/teardown de datos (isolation tests) | runtime `lib/env.ts:44` (NO está en `.env.example` — gap) |
| `SUPABASE_JWT_SECRET` | Bearer PAT principal | `lib/api/principal.ts:111` |
| `SUPABASE_ACCESS_TOKEN` | MCP Supabase / migrations | `.env.example:89` |
| `ATLASSIAN_URL` / `ATLASSIAN_EMAIL` / `ATLASSIAN_API_TOKEN` | import Jira (acli + app) | `.env.example:47-49` |
| `RESEND_API_KEY` | solo `resend` CLI / install — la app NO la lee | `.env.example:80`; `cli/install.ts:977-1005` |
| `QA_E2E_USER_EMAIL` / `QA_E2E_USER_PASSWORD` | fixture dedicado no-producción (provisionado 2026-07-30, BK-87) | `.env.example:150-151`; `project.yaml:37-38` |
| `NEXT_PUBLIC_APP_URL` | redirects auth por env | `.env.example:131` |
| `VERCEL_ENV` | detección local/staging/production | `lib/urls.ts:17-25` (la inyecta Vercel) |

- `automation_identity.per_env: {}` — el MISMO fixture QA vale en local/staging/production (single-project tenancy) — `project.yaml:40`
- Jira: `upexgalaxy71.atlassian.net` (`project.yaml:32`), key `BK` (`:12`)

## Discovery Gaps

- **CI/CD ausente (GAP mayor)**: sin pipelines de build/test/deploy automáticos. Nuestro repo debería considerar correr smoke E2E contra staging por cuenta propia o proponer un workflow.
- **DB compartida entre envs**: single-tenant (`fmbpikzpkafptqximhxn`) — los datos de staging/production conviven. Estrategia de datos QA obligatoria: fixtures con prefijos únicos + limpieza.
- **`autonomous_delivery.migrations: unrestricted`** sobre la DB compartida — DDL destructivo puede correr sin aprobación; riesgo real para fixtures de QA.
- **Desincronización de nombres de env** (`.env.example` new-style keys vs runtime legacy) — documentar en nuestro setup de `.env`.
- **Test runner del target no cubre E2E**: cobertura de nuestra capa es 100% neta (sin duplicación con el target).
- **No hay entorno `qa` dedicado** — solo local/staging/production (`project.yaml:70-82`); staging es el default recomendado para E2E.
- **Sin previews multi-branch documentados**: el alias staging apunta a la branch `staging`; PRs de feature no tienen alias propio conocido.
