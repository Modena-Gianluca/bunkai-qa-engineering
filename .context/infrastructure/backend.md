# Backend — upex-bunkai-tms (Next.js 15 + Supabase)

Target repo: `C:\Users\redes\Desktop\projects\dojo\upex-bunkai-tms`
QA repo: this (Playwright + KATA)

## Stack

- Next.js 15 (App Router, Route Handlers) + React 19 + TypeScript 5.9 — `package.json:69-72`
- Supabase (PostgreSQL 16) — `@supabase/ssr@0.10.3` + `@supabase/supabase-js@2.106` — `package.json:59-60`
- Server-only code marked via `import 'server-only'` (e.g. `lib/supabase/admin.ts:5`, `lib/env.ts:13`)
- Deploy target: Vercel (ver `infrastructure.md`)

## Scripts (`package.json:7-44`)

| Script | Comando | Notas |
|---|---|---|
| `dev` | `next dev` (`:8`) | puerto 3000 |
| `build` | `next build` (`:9`) | |
| `start` | `next start` (`:10`) | producción local |
| `typecheck` | `tsc --noEmit` (`:11`) | |
| `test` | `bun test` (`:36`) | runner = bun; unit + isolation tests |
| `prepare` | `husky` (`:40`) | hooks locales |
| `repo:check` | format+lint+types+vars+skills (`:37`) | gate completo, estilo CI local |
| `types:gen` | `bun scripts/gen-supabase-types.ts` (`:34`) | regenera `lib/types/supabase.ts` |
| `api:sync` | `bun scripts/sync-openapi.ts` (`:17`) | OpenAPI → schemas |

## Rutas API — `app/api/v1/` (Auth por defecto `required` vía `withApiHandler`)

- `/api/v1` — GET index (banner version/openapi/docs, `auth: 'public'`) + OPTIONS CORS — `app/api/v1/route.ts:12-31`
- `/api/v1/health` — GET `{ok, service, env, ts}` (`auth: 'public'`) — `app/api/v1/health/route.ts:5-11`
- `/api/v1/openapi` (spec) + `/api/docs` (Scalar UI — `@scalar/api-reference-react`, `package.json:58`)
- `/api/v1/auth/*` — signup, confirm, signin, magic-link, check-email, resend (detalle abajo)
- `/api/v1/me` — introspect principal (cookie O Bearer) — `app/api/v1/me/route.ts`; `/api/v1/me/active-workspace`
- `/api/v1/workspaces` + `/workspaces/[id]`, `[id]/projects`, `[id]/recent-projects`, `[id]/open-bugs`, `[id]/notifications`
- `/api/v1/projects` + `/projects/[id]/traceability`
- `/api/v1/atcs` + `/atcs/search`, `/atcs/[id]`, `/atcs/[id]/usage`, `/atcs/[id]/duplicate`
- `/api/v1/acceptance-criteria/[id]`; `/api/v1/user-stories/[id]`, `[id]/acceptance-criteria`
- `/api/v1/tests/[id]`; `/api/v1/runs` + `/runs/[id]`, `/runs/[id]/finish`, `/runs/[id]/abort`
- `/api/v1/bugs` + `/bugs/[id]`, `/bugs/[id]/status`, `/bugs/[id]/assign`
- `/api/v1/milestones/[id]`, `/api/v1/modules/[id]`, `/api/v1/environments/[id]`
- `/api/v1/imports` + `/imports/[id]` (Jira import, BK-17); `/api/v1/invites/accept`
- `/api/v1/tokens` + `/tokens/[id]` (PATs, session-only — `app/api/v1/tokens/route.ts:32-38`)
- `/api/v1/notification-preferences`, `/api/v1/notifications`

Cada carpeta lleva `route.ts` + `route.openapi.ts` (Zod → OpenAPI vía `@asteasolutions/zod-to-openapi`) + tests `route.test.ts`.

## `lib/` — piezas clave

- `lib/supabase/`: `client.ts` (browser, anon — `:8-9`), `server.ts` (SSR client con cookies — `:7-35`), `admin.ts` (service role, server-only, bypass RLS — `:7-18`), `rpc.ts`, `with-workspace.ts`
- `lib/api/`: `handler.ts` (`withApiHandler` — auth `required` por defecto salvo `auth: 'public'` explícito, `:75-82`; error mapping ApiError→envelope, ZodError→422, resto→500 con `request_id`, `:112-125`), `principal.ts` (`resolveIdentity` unifica cookie/Bearer en un `Principal` con `db` RLS-scoped, `:45-74`; `ALL_CAPABILITIES` `:31`), `middleware/bearer.ts` (`requireBearerToken`, `:28-113`), `pat.ts` (scopes + `mintPat` `:110-153`), `user-jwt.ts`, `idempotency.ts`, `error-envelope.ts`, `logging.ts`, `workspace-cookie.ts`, `request-id.ts`
- `lib/jira/client.ts` — `searchIssues` JQL v3 REST, Basic auth con `ATLASSIAN_*`, backoff 429 (1-16s), `JiraAuthError` en 401/403 — `:114-166`
- `lib/env.ts` — schema Zod validado al boot (tira error si faltan vars — `:52-60`)
- `lib/urls.ts` — `APP_URLS` por env + detección vía `VERCEL_ENV` — `:9-25`

## Auth flow (QA) — secuencia exacta de requests

Flows headless (BK-166): email-first + PATs. `signup` NO emite credenciales — solo `confirm`/`signin` mintean session + PAT.

### signup → confirm(OTP) → PAT

```bash
# 1. Signup (crea cuenta, envía OTP de 6-8 dígitos por email — NO hay sesión ni PAT)
curl -X POST {WEB_URL}/api/v1/auth/signup \
  -H 'content-type: application/json' \
  -d '{"email":"qa.user@example.com","password":"Passw0rd!-strong"}'
# → 202 {"status":"pending_confirmation","email":"..."}          (signup/route.ts:69)
# → 409 conflict (email ya existe — signup/route.ts:42,60)        — NO revela si existe
# → 429 rate_limited (signup/route.ts:37-39)
# Body: email + password min 8 (signup/route.ts:18-23)

# 2. Confirm OTP (acá se setean session cookies Y se mintea un PAT en la misma call)
curl -X POST {WEB_URL}/api/v1/auth/confirm \
  -H 'content-type: application/json' \
  -d '{"email":"qa.user@example.com","token":"123456","pat_name":"qa-cli","pat_scopes":["atc:read","atc:write","run:execute"],"pat_expires_in_days":30}'
# token: regex ^\d{6,8}$ (confirm/route.ts:21)
# → 200 {user:{id,email}, session:{access_token,refresh_token,expires_at,token_type},
#        pat:{token:"bk_pat_<prefix12>.<secret>",id,name,scopes,expires_at},
#        warning:"Store the PAT token now — it cannot be retrieved later."}  (confirm/route.ts:63-79)
# → 401 unauthorized uniforme (código inválido/vencido — confirm/route.ts:42-45)
# → 429 rate_limited (confirm/route.ts:39-41)
```

### signin (cuenta existente) — mismo shape, también mintea PAT

```bash
curl -X POST {WEB_URL}/api/v1/auth/signin \
  -H 'content-type: application/json' \
  -d '{"email":"qa.user@example.com","password":"...","pat_name":"qa-cli","pat_scopes":["atc:read"]}'
# password min 6 (legacy) vs min 8 en signup/confirm — asimetría deliberada (signin/route.ts:19)
# → 200 {user, session, pat, warning} (signin/route.ts:52-68)
# → 401 uniforme "Invalid email or password." (signin/route.ts:35-38) — nunca filtra qué falló
```

### Uso del PAT (Bearer)

```bash
curl {WEB_URL}/api/v1/me -H "Authorization: Bearer bk_pat_<prefix12>.<secret>"
# Validación: prefix indexado O(1) + SHA-256 del secreto completo en tabla hermana
# (bearer.ts:58-101). 401 uniforme ante cualquier falla (header/forma/prefix/hash/revoked/expired).
```

### magic-link (PKCE — browser, no headless)

```bash
# 1. Pedir link (SOLO emails con cuenta — shouldCreateUser:false, anti-enrolamiento BK-175)
curl -X POST {WEB_URL}/api/v1/auth/magic-link \
  -H 'content-type: application/json' \
  -d '{"email":"qa.user@example.com","next":"/projects"}'
# → 200 {"ok":true} (magic-link/route.ts:99) — mismo response para email inexistente (anti-enumeración, :85-87)
# `@supabase/ssr` fuerza flowType pkce (magic-link/route.ts:36-38). redirect → /auth/callback?next=...

# 2. Click del link → GET {WEB_URL}/auth/callback?token_hash=...&type=magiclink&next=...
#    Verifica stateless con verifyOtp (funciona cross-device, BK-400) — app/auth/callback/route.ts:85-103
#    Solo acepta types magiclink|email (allow-list VERIFIABLE_OTP_TYPES — :34)
#    → redirect a {next} con session cookies seteadas, o /login?error=magic_link_invalid (:99)
#    Variante PKCE legacy: ?code=... → exchangeCodeForSession (:110)
#    OAuth (GitHub/Google): ?code=...&bkstate=... → valida CSRF contra cookie bk_oauth_state (:68-76)
```

### check-email (routing del form email-first)

```bash
curl -X POST {WEB_URL}/api/v1/auth/check-email -H 'content-type: application/json' \
  -d '{"email":"qa.user@example.com"}'
# → 200 {"exists":bool,"confirmed":bool} (check-email/route.ts:74-77)
# Usa RPC SECURITY DEFINER public.auth_email_status — service_role ONLY (0034_auth_email_status_rpc.sql)
# ENUMERATION TRADEOFF aceptado (ADR-0007) — no hay rate-limiter de app aún (check-email/route.ts:14-24)
```

### resend OTP

```bash
curl -X POST {WEB_URL}/api/v1/auth/resend -H 'content-type: application/json' -d '{"email":"..."}'
# → 202 {"status":"sent",...} (resend/route.ts:61) — reenvía el OTP pendiente sin re-crear la cuenta
```

### PATs — reglas clave (lib/api/pat.ts)

- Formato: `bk_pat_<prefix12>.<secret>` — secret 32 bytes base64url, ~256 bits entropía (`pat.ts:110-153`; `tokens/route.ts:20-22`)
- Scopes válidos: `atc:read | atc:write | run:execute | workspace:admin` (`pat.ts:12-19`; CHECK en `supabase/migrations/0008_access_tokens.sql`)
- Default headless: `[atc:read, atc:write, run:execute]` — NUNCA `workspace:admin` (`pat.ts:24-28`; `assertNoGlobalAdminScope` `:33-40`)
- `workspace:admin` solo vía `POST /api/v1/tokens` con session de browser + workspace_id + rol admin/owner (`pat.ts:53-89`; ADR-0005)
- Un PAT NO puede mintear otro PAT (`tokens/route.ts:36-38`)
- Revocación = soft delete (`revoked_at`); sin DELETE policy (0008)

## `middleware.ts` — gate de páginas (NO es el auth de la API)

- Protege rutas de páginas: `PROTECTED_PREFIXES = ['/home','/projects','/onboarding','/settings','/activity']` — `middleware.ts:10`
- Públicas: `PUBLIC_PREFIXES = ['/login','/auth','/api/auth']` — `:11` (ojo: `/api/v1/auth/*` NO matchea `/api/auth` — pasa through)
- `isProtected()` — match exacto o con `/` (evita falsos positivos tipo `/homepage`) — `:13-15` (testeado en `middleware.test.ts:42-46`)
- Sin user en ruta protegida → redirect `/login?next=<path>` — `:50-54`
- Lee `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `:5-6`
- `createServerClient` de `@supabase/ssr` refresca la session y re-escribe cookies — `:24-42`; `supabase.auth.getUser()` — `:46`
- matcher: todo salvo `_next/static|_next/image|favicon.ico|.*\..*` — `:59-60` (por lo tanto TAMBIÉN corre sobre `/api/*`, pero nunca redirige ahí; el auth real de API vive en `withApiHandler`)

## Variables de entorno que la app LEE (`grep process.env` + `lib/env.ts`)

| Variable | Dónde se lee | Requerida al boot |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `middleware.ts:5`, `lib/supabase/client.ts:8`, `lib/env.ts:42` | sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `middleware.ts:6`, `lib/supabase/client.ts:9`, `lib/env.ts:43` | sí |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts:10` (vía env), `lib/env.ts:44` | sí |
| `SUPABASE_JWT_SECRET` | `lib/api/principal.ts:111-114` (`impersonatingClient` — imprescindible para Bearer PAT), `lib/env.ts:45` | no (opcional) |
| `NEXT_PUBLIC_APP_URL` | `lib/env.ts:46` (redirects/auth, default localhost) | no (default) |
| `ATLASSIAN_URL` / `ATLASSIAN_EMAIL` / `ATLASSIAN_API_TOKEN` | `lib/jira/client.ts:116-118`, `lib/env.ts:47-49` | no (solo import Jira) |
| `VERCEL_ENV` | `lib/urls.ts:18-24` (detección de entorno) | no (Vercel la inyecta) |
| `QA_E2E_USER_EMAIL` / `QA_E2E_USER_PASSWORD` | tests isolation (ej. `lib/traceability/story-traceability-isolation.test.ts:38-39`) | solo tests |

> ⚠️ Desincronización: `.env.example` lista `SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY` (new-style, `:103-104`), pero el runtime exige `NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` — sin ellas `lib/env.ts:52-60` aborta el boot. QA debe setear los nombres LEGACY.

## DB — Supabase Postgres

- 70 migraciones: `supabase/migrations/0001_tenancy.sql` … `0070_bug_detail_composer.sql`
- Tenencia multi-tenant: `workspaces` + `workspace_members` (RBAC viewer/member/admin/owner, status active/invited/suspended) — `0001_tenancy.sql`
- RLS como fuente de autoridad (los handlers NUNCA re-implementan access checks — `principal.ts:20-25`)
- PATs: `access_tokens` (prefix indexado, scopes CHECK, revoked_at, sin DELETE) — `0008_access_tokens.sql`; secrets en tabla hermana `access_token_secrets` (split en `0011_split_token_secrets.sql`) — QA/analytics NO pueden leer hashes
- Email-first: RPC `public.auth_email_status` (SECURITY DEFINER, service_role only) — `0034_auth_email_status_rpc.sql`
- Tipos generados: `lib/types/supabase.ts` (`bun run types:gen`)

## Comandos bash (QA local)

```bash
# Setup + dev
bun install
bun run dev                # http://localhost:3000

# Build / start (producción)
bun run build && bun run start

# Tests — bun test. Unit puros (middleware/tree/rpc) corren sin env;
# los *-isolation.test.ts requieren NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
# (+ QA_E2E_USER_EMAIL/PASSWORD en los de RLS) — hacen describe.skip si falta env.
bun test
bun test middleware.test.ts
bun test app/api/v1/auth

# Typecheck + gates
bun run typecheck          # tsc --noEmit
bun run lint:check
bun run vars:check
bun run repo:check         # format + lint + types + vars + skills (gate completo)
```

## Discovery Gaps

- **No hay E2E ni Playwright en el target**: `bun test` es solo unit/isolation. Todo el testing E2E (auth UI, runs, bugs) queda de nuestro lado.
- **OTP por email**: confirmar el OTP requiere acceso al inbox (Supabase Auth envía vía plantillas; `RESEND_API_KEY` está en `.env.example:80` pero la app runtime NO lee Resend — el email sale de GoTrue). QA necesita un inbox de test o interceptar (mock SMTP local) — no hay test-inbox documentado.
- **Enumeración intencional**: `check-email` revela existencia (`{exists, confirmed}`) — ADR-0007 acepta el tradeoff, sin rate-limiter de app todavía. Útil para QA de routing del login, pero el 401 de `signin`/`confirm` es uniforme por diseño (no se puede distinguir email vs password incorrecto).
- **`workspace:admin` no minteable headless**: para tests de PAT admin hay que loguearse por browser → `POST /api/v1/tokens` con `workspace_id`.
- **`SUPABASE_JWT_SECRET` obligatorio para Bearer PAT**: `principal.ts:111-113` tira `internal_error` si falta — QA que use PATs necesita ese var set.
- **Middleware vs API auth**: middleware NO protege `/api/v1/*` (solo prefijos de páginas); el auth de API es 100% `withApiHandler`. Testear ambos caminos por separado.
- **Desincronización env names** (ver tabla arriba): `.env.example` (new-style keys) vs runtime (legacy anon/service_role).
