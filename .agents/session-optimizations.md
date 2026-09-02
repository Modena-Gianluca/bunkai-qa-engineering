# Session Optimizations — bunkai-qa-engineering

> Bootstrap permanente para velocidad y bajo consumo de tokens. Cargado al inicio si existe (1 read, cacheado). No duplicar en Engram — Engram es fuente primaria, este archivo es espejo humano-legible.

## Reglas de velocidad (aplicar siempre)

1. **Cachear `project.yaml` 1 vez por sesión** — no releer en cada skill. Variables `{{PROJECT_KEY}}`, `{{WEB_URL}}`, `environments.staging.*` ya resueltas.
2. **Context economy**: usar `grep`/`glob` targeted antes de `read` bulk. Nunca leer `.context/PBI` completo — solo `STORY-BK-269/*` o `epic.md` puntual.
3. **Paralelizar tool calls** — 3-4 reads/grep en paralelo cuando son independientes. Secuencial solo si hay dependencia.
4. **Reutilizar `.session/sprint-testing/BK-269/`** — atp.md, progress.md, context.md ya existen. No regenerar si `git status` limpio.
5. **DBHub directo sobre API** cuando sea verificación de estado (`runs`, `activity_log`, `has_function_privilege`). API solo para flujo que requiere auth de app.
6. **Pre-cache MCPs**: `bunx`/`npx` con `--prefer-offline` implícito — evitar re-download de `playwright`, `allure` en cada invocación.
7. **Verificación mínima**: `tests → types → lint` solo si hubo cambio de código. Para queries de lectura, no correr.
8. **Engram primero**: `mem_context` + `mem_search` antes de escanear disco para historia de BK-269.

## Estado BK-269 (actualizado 2026-09-02)

- `qa_inspector_rw` ahora tiene `EXECUTE` en `public.bunkai_sweep_abandoned_runs(integer)` — verificado `has_function_privilege = true`.
- Ya no depende de esperar `pg_cron` tick de 15min; se puede invocar `SELECT public.bunkai_sweep_abandoned_runs(4)` directo.
- Story en `Ready For Release` (QA Approved → release). ATR 13/13 PASSED + 4 deferred.

## Deferred ahora desbloqueado

- `TC-16 / AC8` (threshold <1h → error 45215) — antes bloqueado por falta de GRANT, ahora testeable directo.

## Costo token estimado

- Sin optimización: ~8-12k tokens por turno (lecturas bulk PBI + re-sync Jira).
- Con optimización: ~2-4k tokens por turno (reads targeted + Engram cache).
