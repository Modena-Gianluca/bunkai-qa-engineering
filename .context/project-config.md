# Project Config — Bunkai (BK)

Project config discovered by `/project-discovery` (Brownfield scope, 2026-08-15).

## Repositories

| Repo | Role | Path |
|---|---|---|
| `upex-bunkai-tms` | App under test (Next.js 15 + Supabase + Vercel) | `C:\Users\redes\Desktop\projects\dojo\upex-bunkai-tms` |
| `bunkai-qa-engineering` | QA framework (Playwright + KATA) — THIS repo | cwd |

## Project identity

- **Name**: Bunkai — Test Management System (分解)
- **Key**: `BK`
- **Web domain**: `upexbunkai.vercel.app` (production) / `staging-upexbunkai.vercel.app` (staging)
- **Tracker**: Jira Cloud — https://upexgalaxy71.atlassian.net/

## Tech Stack

- **Backend**: Next.js 15 (App Router, Route Handlers) + TypeScript 5.9 + Supabase (Postgres 16, Auth, Realtime). Sin ORM — `@supabase/supabase-js` + migraciones SQL directas. Bun como runtime/package manager.
- **Frontend**: Next.js 15 + React 19 + Tailwind 3.4 + shadcn/ui (Radix) + Monaco + TanStack Table. 521 `data-testid` (kebab-case, prefijo de dominio).
- **Auth**: email-first OTP (signup/confirm) + magic-link PKCE (login) + PATs Bearer (`bk_pat_<prefix>.<secret>`, scopes `atc:read|atc:write|run:execute|workspace:admin`). Supabase SSR cookies.
- **Testing (target)**: `bun test` — solo unit/isolation. NO E2E, NO Playwright, NO CI/CD.

## Environments

| Env | Web | API base |
|---|---|---|
| local | http://localhost:3000 | http://localhost:3000/api |
| staging | https://staging-upexbunkai.vercel.app | https://staging-upexbunkai.vercel.app/api |
| production | https://upexbunkai.vercel.app | https://upexbunkai.vercel.app/api |

- Los 3 envs apuntan al MISMO Supabase (`fmbpikzpkafptqximhxn`, single-tenant MVP, ADR-0009).
- QA default env: **staging**.

## Test users

- `STAGING_USER_EMAIL` / `STAGING_USER_PASSWORD` → `.env` (usuario `qa1@antocalie.resend.app`, OTP leído vía `resend emails receiving get <id>` — el mail de verificación llega al dominio Resend `antocalie.resend.app`).
- `QA_E2E_USER_EMAIL` / `QA_E2E_USER_PASSWORD` → fixture dedicado del target (BK-87).
- OTP retrieval recipe: `resend emails receiving list --limit 5 -q` → `resend emails receiving get <id> -q` (8-digit code).

## Key pointers

- Auth flow completo (signup→confirm→PAT, magic-link, PAT rules): `.context/infrastructure/backend.md` §Auth flow
- Test IDs strategy + coming-soon nav: `.context/infrastructure/frontend.md`
- Env/deploy/CI gaps: `.context/infrastructure/infrastructure.md`
- Glosario canónico: `.context/business/domain-glossary.md`
- API spec: `public/openapi.json` en el target (65 paths) — `bun run api:sync` para schemas TS

## Discovery Gaps

- CI/CD del target ausente — sin pipelines; E2E corre desde este repo.
- `.env.example` del target desincronizado con runtime (new-style keys vs legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`).
- API contract source: `public/openapi.json` reachable — `bun run api:sync` aún no corrido.
