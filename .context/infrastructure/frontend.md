# Frontend — upex-bunkai-tms (Next 15 App Router + shadcn/ui)

## Framework

- Next.js 15 App Router, React 19, TypeScript 5.9, `typedRoutes: true` — `next.config.ts`
- Tailwind 3.4 + shadcn/ui (estilo `new-york`, baseColor neutral, iconos lucide) — `components.json:3,20`
- Radix primitives: dialog, dropdown-menu, tabs, tooltip — `package.json:54-57`; sonner toasts (`:76`)
- Otros: `@tanstack/react-table` (`:61`), `@monaco-editor/react` (editor ATC, `:53`), `@dnd-kit` (drag & drop módulos/ATCs, `:49-51`), `@scalar/api-reference-react` (`:58`)
- UI kit en `components/ui/`: button, input, card, badge, tabs, switch, label (+ Dialog/DropdownMenu/Tooltip desde Radix directo)
- Tokens de diseño en `tailwind.config.ts:16-141`: `surface-0..5`, `fg-0..4`, `stroke-1..3|strong`, `accent|hi|glow|soft` (vermillón), `signal-pass|fail|blocked|skipped|running` (+ `-bg`), `layer-ui|api|unit`, radios `r-1..4`, font sizes `2xs..2xl`, easing/duration `token`

## Rutas principales (route groups)

- `app/page.tsx` — root: redirect `/home` (logueado) o `/login` (`:14`)
- `app/(auth)/login/page.tsx` — página de login (redirect si ya logueado — `:22-25`)
- `app/(app)/` — shell autenticado (`AppSidebar` en `app/(app)/layout.tsx`):
  - `/home` — dashboard (KPIs: cobertura, bugs abiertos, runs activos, actividad reciente)
  - `/onboarding` — primer ingreso sin workspace
  - `/projects` + `/projects/new` — lista + creación de proyectos
  - `/projects/[projectSlug]` — project shell (explorer de módulos, sub-nav: Tests / Runs / Bugs / Milestones / Metrics / Traceability / ATCs)
  - `/projects/[projectSlug]/atcs` + `atcs/new` + `atcs/[atcId]` — editor ATC (Monaco), búsqueda (`atc-search-filter.tsx`)
  - `/projects/[projectSlug]/tests` + `tests/new` + `tests/[testId]` + `tests/[testId]/runs`
  - `/projects/[projectSlug]/runs` + `runs/[runId]` — runner (paso a paso, mark pass/fail/block, evidencia, report bug)
  - `/projects/[projectSlug]/bugs` + `bugs/[bugId]` — bugs + detalle (status, assign)
  - `/projects/[projectSlug]/milestones` + `milestones/[milestoneId]`
  - `/projects/[projectSlug]/metrics` — recovery cycle + defect heatmap (reportes RPC)
  - `/projects/[projectSlug]/traceability` — chain view story→ATC→run→bug
  - `/settings` + `/settings/account` + `/settings/tokens` (PATs) + `/settings/workspaces` + `/settings/notifications`
  - `/workspaces/[id]/members`
- `app/auth/callback/route.ts` — callback magic-link/OAuth (ver backend.md)
- `app/invites/accept/page.tsx` — aceptar invitación de workspace
- `app/qa/page.tsx` — página interna de QA/dev (demos MCP/API — testids `qa-*`)
- `app/about/`, `app/design-tokens/`, `app/api/docs/`

## Test ID strategy (`data-testid`)

- **521 `data-testid` en 84 archivos** (`app/` + `components/`)
- Convención: **kebab-case, prefijo de dominio** — `login-*`, `projects-*`, `create-project-*`, `runner-*`, `run-history-*`, `coverage-*`, `traceability-*`, `ac-*`, `bug-*`, `home-*`, `tokens-*`, `workspaces-*`
- IDs dinámicos con template literals (selector por índice/id, NO por texto):
  - `` `projects-list-item-${project.slug}` `` — `app/(app)/projects/page.tsx:143`
  - `` `runner-atc-${position}` ``, `` `runner-step-${atc.position}-${s.position}` `` — `components/runs/RunnerView.tsx:720,770`
  - `` `ac-row-${ac.id}` ``, `` `ac-edit-${ac.id}` `` — `app/(app)/projects/[projectSlug]/acceptance-criteria-panel.tsx:273,334`
  - `` `coverage-module-row-${mod.module_id}` `` — `components/coverage/ProjectCoverageView.tsx:262`
- Familia login (flujo email-first) — `app/(auth)/login/email-first-form.tsx`:
  `login-email` (`:256`), `login-continue` (`:280`), `login-password` (`:309,358`), `login-signin` (`:321`), `login-create` (`:373`), `login-otp` (`:418`), `login-verify` (`:430`), `login-resend` (`:441`), `login-error` (`:243`)
- Otras auth: `login-magic-link-toggle` — `magic-link-disclosure.tsx:17`; `oauth-github`/`oauth-google` — `oauth-buttons.tsx:32,44`
- Formularios: `create-project-*` — `app/(app)/projects/create-project-form.tsx:125-194`; `create-environment-*` — `create-environment-form.tsx:101-159`; `user-story-*` — `user-story-form.tsx:127-210`; `import-*` (Jira JQL) — `import-from-jira-dialog.tsx:121-175`
- Dashboard (`home-*`, 42 ids únicos con ese prefijo): KPIs, coverage, actividad — `app/(app)/home/page.tsx` y `lib/home/*`
- Runner (`runner-*`, 26+): estados, marks, modales abort/finish — `components/runs/RunnerView.tsx:533-1210`
- ⚠️ **Drift de naming** en notificaciones: `notificationsPanel` (camelCase) y `notifications_*` (snake_case) — `components/notifications/NotificationsPanel.tsx:52-121` (p.ej. `notifications_mark_all_read` `:64`). El resto del código es kebab-case. QA: no asumir consistencia ahí.
- Familia `qa-*` en `app/qa/_components/` (página interna de dev, no producto).

## Coming soon (nav deshabilitada)

- **Sidebar principal** (`components/layout/AppSidebar.tsx:167-174`): `ATC Library` (`:170`), `Test Runs` (`:171`), `Bug Reports` (`:172`), `Metrics` (`:173`) — `href: null`, render como `<span aria-disabled title="Coming soon">` con tag `soon` (`:594-627`). Rutas reales NO existen (deep-link 404).
- **Settings** (`lib/settings/nav-items.ts:23-27` + `components/settings/SettingsNav.tsx:57-73`): `Members`, `Billing`, `Environments` — spans no-focusables, `data-testid="settings-nav-<id>"` igualmente presente (`:65`)
- **Mind-map**: tooltip "Needs run / bug data — coming soon" — `app/(app)/projects/[projectSlug]/mind-map-view.tsx:149`

## Discovery Gaps

- **Coming soon sin ruta**: ATC Library / Test Runs / Bug Reports / Metrics son nav muerta (no navegable, no testeable más allá del estado disabled). No intentar flujos E2E ahí — esperar a que existan rutas.
- **Drift de naming en testids** (notifications camelCase/snake_case) — definir en nuestro Page Objects un mapeo explícito.
- **Sin tests de accesibilidad** en el target (no hay axe/Playwright); los coming-soon ya cumplen `aria-disabled` y son no-focusables.
- **Login es el punto más rico en testids** (11 ids, 4 steps del form email-first: email → password|create|verify) — ideal para el primer E2E.
- **`typedRoutes`**: rutas tipadas — romper el build si un href no existe (protección extra contra coming-soon linkeados).
- **Sin visual-regression** en el target; los tokens de diseño (surface/signal/accent) son estables para asserts visuales ligeros.
