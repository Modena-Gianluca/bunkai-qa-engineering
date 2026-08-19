# Shift-Left Refinement: BK-269 — Automatically abort abandoned runs after inactivity

```
╔══════════════════════════════════════════════════════════════════════════════╗
║ BK-269 — SHIFT-LEFT REFINEMENT                                              ║
║ Status: Refined — Awaiting PO Estimation                                    ║
║ Mode: Shift-Left (pre-sprint, batch grooming)                               ║
║ Modality: Jira-native                                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

| Field | Value |
|-------|-------|
| **Refined on** | 2026-08-17 |
| **Refined by** | QA — Shift-Left batch session |
| **Story Points** | 3 |
| **Epic** | BK-30 (Manual Execution & Runs) |
| **Priority** | Medium |

---

## Phase 1 — Critical Analysis

### Business context

| Aspect | Detail |
|--------|--------|
| **Primary persona** | QA Lead (monitors active runs, needs accurate dashboards) |
| **Secondary personas** | QA Engineer (abandoned runs inflate active count), Dev Lead (coverage reports distorted) |
| **Business value** | Dashboards, coverage, and progress reports reflect reality — not runs someone forgot to finish |
| **KPIs influenced** | Active run count, time-to-green, coverage %, test plan progress |
| **User journey** | Background process — no direct user interaction; affects Home widget + Run history + reporting views |

### Technical context

| Layer | Components |
|-------|------------|
| **Frontend** | Home "active test runs" widget (FEAT-038), Run history (BK-37), Run reporting (BK-38) |
| **Backend** | `runs` table (status, updated_at, finish_time, reason), existing abort endpoint (BK-36), scheduled job infrastructure |
| **External services** | None — internal sweep only |
| **Integration points** | `runs` table, `run_atcs`/`run_steps` (cascade on abort), Home widget API, run history query, `module_defect_stats` (materialized view) |

### Story complexity

| Axis | Rating | Rationale |
|------|--------|-----------|
| Business logic | **Low** | Reuses existing abort logic; sweep is a timer-based query + batch update |
| Integration | **Low** | No external APIs; internal DB sweep only |
| Data validation | **Low** | No user input; threshold config is out-of-scope per Story |
| UI | **None** | No UI changes; affects existing widgets via data change |

> **Estimated test effort**: Low (1-2 hours manual exploration + API verification)

### Epic-level inheritance

- **Risks restated**: Run lifecycle is `CRITICAL` per master-test-plan; step-mark rollup, terminal guards, and idempotency are proven patterns from BK-34/35/36/39
- **Integration points inherited**: `runs` table, abort logic (BK-36), Home widget, run history
- **PO/Dev answers already given**: Abort reuses existing logic (business-rules.md "Alternatives considered")
- **Test strategy inherited**: Same as epic — lifecycle testing + terminal guards + cross-workspace isolation

---

## Phase 2 — Story Quality Analysis

### Ambiguities

| # | Location | Question for PO/Dev | Impact | Suggested clarification |
|---|----------|---------------------|--------|-------------------------|
| 1 | Scope vs Out-of-Scope | Threshold is "configurable" but value is "out-of-scope" — where does the sweep read the value? | Cannot test threshold behavior | "Threshold read from `[config source]` with default of `[X hours]`" |
| 2 | Scope | Is the sweep a cron job, serverless function, or API call? Frequency? | Affects timing/concurrency testing | Specify trigger mechanism and frequency |
| 3 | AC7 | What is the exact system-generated reason text? | Cannot assert exact reason string | Provide the exact template |
| 4 | AC9 | How does sweep identify workspace boundaries? | Confirms data model assumption | Confirm `runs.workspace_id` FK exists |

### Gaps (missing info)

| # | Type | Why critical | What to add | Risk if omitted |
|---|------|--------------|-------------|-----------------|
| 1 | Technical | "No step activity recorded" — which timestamp? `runs.updated_at`? `run_steps.updated_at`? Dedicated column? | Specify timestamp column | Wrong column = sweep never triggers or triggers too early |
| 2 | Technical | `run_atcs`/`run_steps` cascade on sweep abort — same as manual abort? | Confirm cascade behavior | Partial cleanup leaves orphan rows |
| 3 | Business Rule | Is the sweep idempotent by design or implementation? | Clarify idempotency mechanism | Double-abort attempts could cause errors |

### Edge cases not in Story

| # | Scenario | Expected behavior | Criticality | Action |
|---|----------|-------------------|-------------|--------|
| 1 | Sweep runs while step is being marked (race condition) | Step mark wins, sweep skips — or sweep wins, step mark rejected | **High** | `NEEDS PO/DEV CONFIRMATION` |
| 2 | Run "running" but last step marked "blocked" | Sweep should still close — "blocked" counts as inactive | Medium | Add to AC |
| 3 | Run has 0 steps marked (no activity at all) | Sweep should close — no activity = abandoned | **High** | `NEEDS PO/DEV CONFIRMATION` |
| 4 | Sweep fails mid-batch (server crash) | Next sweep picks up remaining runs | Medium | Confirm idempotency |
| 5 | Run "pending" or "created" (never started) | Sweep should NOT touch — only "running" qualifies | Medium | Confirm scope |
| 6 | Threshold misconfigured to 0 | Sweep closes ALL running runs immediately | Low | `NEEDS PO/DEV CONFIRMATION` |
| 7 | Sweep updates `updated_at` on abort | Self-reference: next sweep sees aborted run as "recently active" | **High** | Confirm dedicated timestamp |

### Contradictions

> Scope says "configurable inactivity threshold" but Out-of-Scope says "choosing or hard-coding the threshold value" is deferred. The threshold must exist SOMEWHERE for the sweep to work — this is a **scope gap**, not a contradiction, but needs clarification.

### Testability validation

**Verdict**: `Partial`

| Issue | Impact |
|-------|--------|
| Default threshold value unknown | Cannot design time-based test scenarios |
| Sweep trigger mechanism unknown | Cannot trigger sweep manually for testing |
| System-generated reason text unknown | Cannot assert exact string in test |
| Race condition handling unspecified | Cannot design concurrency test |

---

## Phase 3 — Refined Acceptance Criteria

### Original AC1 — An idle Run past the inactivity threshold is closed by the sweep

#### Scenario 1.1: Should abort a running run with no step activity beyond the inactivity threshold

| Attribute | Value |
|-----------|-------|
| **Type** | Positive |
| **Priority** | Critical |

```gherkin
Given A Run in "running" status with last_step_activity_at older than the configured inactivity threshold
When  The scheduled sweep executes
Then  Run status becomes "aborted"
  And Run finish_time is set to sweep execution timestamp
  And Run reason is set to system-generated text identifying automatic sweep
  And run_atcs and run_steps are resolved (same cascade as manual abort BK-36)
```

#### Scenario 1.2: Should NOT abort a running run with recent step activity within the threshold

| Attribute | Value |
|-----------|-------|
| **Type** | Negative |
| **Priority** | Critical |

```gherkin
Given A Run in "running" status with a step marked within the inactivity threshold
When  The scheduled sweep executes
Then  Run status remains "running"
  And No reason is added
  And No finish_time is set
```

### Original AC2 — A Run that already finished with a verdict is untouched

#### Scenario 2.1: Should skip a passed run

| Attribute | Value |
|-----------|-------|
| **Type** | Negative |
| **Priority** | High |

```gherkin
Given A Run with status "passed"
When  Sweep executes
Then  Run status, finish_time, reason are unchanged
```

#### Scenario 2.2: Should skip a failed run

| Attribute | Value |
|-----------|-------|
| **Type** | Negative |
| **Priority** | High |

```gherkin
Given A Run with status "failed"
When  Sweep executes
Then  Run status, finish_time, reason are unchanged
```

### Original AC3 — A Run a person already aborted is untouched

#### Scenario 3.1: Should skip a manually aborted run

| Attribute | Value |
|-----------|-------|
| **Type** | Negative |
| **Priority** | High |

```gherkin
Given A Run with status "aborted" and a person-typed reason
When  Sweep executes
Then  Run status, finish_time, reason are unchanged
  And Person's reason is preserved
```

### Original AC4 — A swept Run disappears from Home active-runs list

#### Scenario 4.1: Should remove swept run from active-runs widget

| Attribute | Value |
|-----------|-------|
| **Type** | Positive |
| **Priority** | High |

```gherkin
Given A Run appears in Home "active test runs" widget (status "running")
When  Sweep closes that Run
Then  On next page load, Run no longer appears in widget
```

#### Scenario 4.2: Should decrement active-runs count by one

| Attribute | Value |
|-----------|-------|
| **Type** | Positive |
| **Priority** | High |

```gherkin
Given Home widget shows count N of running Runs (one is idle past threshold)
When  Sweep closes that idle Run
Then  Widget count becomes N-1 on next page load
```

### Original AC5 — Running sweep repeatedly has no further effect

#### Scenario 5.1: Should be idempotent on already-swept run

| Attribute | Value |
|-----------|-------|
| **Type** | Boundary |
| **Priority** | High |

```gherkin
Given A Run was closed by sweep on previous execution
When  Sweep executes again
Then  Run status, finish_time, reason unchanged from first sweep
```

### Original AC6 — Swept Run's reason is distinguishable from person-aborted

#### Scenario 6.1: Should show system-generated reason with sweep identifier

| Attribute | Value |
|-----------|-------|
| **Type** | Positive |
| **Priority** | Medium |

```gherkin
Given A Run closed by sweep
When  QA Lead opens Run detail
Then  Reason text contains "automatic sweep" or equivalent system identifier
  And Reason is visually distinguishable from free-text abort reason
```

### Original AC7 — Sweep never closes a Run outside its Workspace

#### Scenario 7.1: Should scope sweep to workspace boundaries

| Attribute | Value |
|-----------|-------|
| **Type** | Positive |
| **Priority** | Critical |

```gherkin
Given Workspace A has idle Run past threshold
  And Workspace B has active Run within threshold
When  Sweep executes
Then  Workspace A's Run becomes "aborted"
  And Workspace B's Run remains "running" unchanged
```

### New scenarios — NEEDS PO/DEV CONFIRMATION

#### Scenario E1: Should handle sweep-step mark race condition

| Attribute | Value |
|-----------|-------|
| **Type** | Edge |
| **Priority** | High |
| **Status** | `NEEDS PO/DEV CONFIRMATION` |

```gherkin
Given Sweep is executing while a step is being marked on the same Run
When  Both operations target the same Run simultaneously
Then  Either (a) step mark wins, sweep skips
  Or  (b) sweep wins, step mark rejected with terminal guard
```

#### Scenario E2: Should close runs with 0 steps marked

| Attribute | Value |
|-----------|-------|
| **Type** | Edge |
| **Priority** | High |
| **Status** | `NEEDS PO/DEV CONFIRMATION` |

```gherkin
Given A Run was created but no steps were ever marked (no activity at all)
When  Sweep executes after inactivity threshold
Then  Run is closed as "aborted"
  And 0 steps = no activity = abandoned
```

#### Scenario E3: Should NOT close runs in "pending" or "created" status

| Attribute | Value |
|-----------|-------|
| **Type** | Negative |
| **Priority** | Medium |
| **Status** | `NEEDS PO/DEV CONFIRMATION` |

```gherkin
Given A Run in "pending" or "created" status (not yet started)
When  Sweep executes
Then  Run untouched
  And Sweep only targets "running" status
```

---

## Phase 4 — Test Outlines (DRAFT)

### Coverage estimate

| Type | Count | Notes |
|------|-------|-------|
| Positive | 5 | Happy path: abort idle, remove from widget, show reason, scope by workspace, idempotent |
| Negative | 4 | Skip passed, skip failed, skip manually aborted, skip non-running |
| Boundary | 2 | Idempotency (double sweep), 0-step run |
| Integration | 1 | Sweep-step mark race condition |
| API | 0 | No new API endpoint (sweep is internal) |
| **Total** | **12** | Low complexity, mostly state-guard testing |

> **Rationale**: BK-269 is a state-machine extension (`running` → `aborted` via system trigger). The existing abort logic (BK-36) is proven; the sweep adds a timer-based trigger and workspace scoping. Most outlines verify state guards and isolation — low logic complexity, high reliability requirement.

### Outline list (NAMES ONLY)

#### Positive

| # | Outline | Preconditions | Expected |
|---|---------|---------------|----------|
| 1 | Should abort idle running run when sweep executes | Run "running" with last activity > threshold | Status "aborted" + finish_time set + system reason |
| 2 | Should remove swept run from Home active-runs widget | Run visible in widget | Run disappears on next load |
| 3 | Should decrement active-runs count after sweep | Widget shows N runs | Count N-1 after sweep |
| 4 | Should show distinguishable system reason for swept run | Run closed by sweep | Reason contains sweep identifier, not free text |
| 5 | Should scope sweep to workspace — close only idle runs in target workspace | 2 workspaces, 1 idle run each (different thresholds) | Only qualifying workspace's run closed |

#### Negative

| # | Outline | Preconditions | Expected |
|---|---------|---------------|----------|
| 6 | Should NOT abort running run with recent activity within threshold | Run "running" with step marked < threshold | Status "running" unchanged |
| 7 | Should NOT touch passed run during sweep | Run "passed" | Unchanged |
| 8 | Should NOT touch failed run during sweep | Run "failed" | Unchanged |
| 9 | Should NOT touch manually aborted run during sweep | Run "aborted" with person reason | Reason preserved |
| 10 | Should NOT touch pending/created run during sweep | Run not yet started | Untouched |

#### Boundary

| # | Outline | Preconditions | Expected |
|---|---------|---------------|----------|
| 11 | Should be idempotent — second sweep on same closed run changes nothing | Run closed by sweep on prior execution | All fields unchanged |
| 12 | Should close run with 0 steps marked after threshold | Run "running" with 0 step marks | Closed as abandoned |

#### Integration

| # | Outline | Preconditions | Expected |
|---|---------|---------------|----------|
| 13 | Should handle concurrent sweep and step mark gracefully | Sweep executing while step mark in progress | No data corruption, one operation wins |

> **NOT included here** (deferred to in-sprint): parametrization tables, per-outline test-data JSON, numbered steps, Faker recipes.

---

## Phase 5 — Edge Cases (DRAFT)

| # | Edge case | In original Story? | Criticality | Action |
|---|-----------|:------------------:|-------------|--------|
| 1 | Sweep-step mark race condition | No | **High** | `NEEDS PO/DEV CONFIRMATION` — add concurrency AC |
| 2 | 0-step run (created but never started marking) | No | **High** | `NEEDS PO/DEV CONFIRMATION` — confirm qualifies as abandoned |
| 3 | Sweep fails mid-batch (server crash) | No | Medium | Confirm idempotency covers partial execution |
| 4 | Threshold misconfigured to 0 | No | Low | `NEEDS PO/DEV CONFIRMATION` — minimum threshold guard? |
| 5 | Sweep updates `updated_at` causing self-reference on next run | No | **High** | Confirm sweep uses `finish_time`, not `updated_at` for inactivity check |
| 6 | Run "blocked" status (step blocked, not pass/fail) | No | Medium | Confirm "blocked" runs qualify as inactive |

---

## Story Quality Assessment

**Verdict**: `Needs Improvement`

| Finding | Impact |
|---------|--------|
| Story is clear on WHAT (abort idle runs) and WHY (accurate dashboards) but lacks HOW details critical for testing | Testing gaps |
| 3 PO open questions BLOCK sprint planning: threshold value, sweep trigger mechanism, exact reason text | Cannot finalize ATP |
| 1 data-model question: timestamp column for inactivity check | Implementation risk |
| Edge cases around race conditions and 0-step runs need explicit ACs | Coverage gaps |

---

## Critical Questions for PO

> **BLOCK sprint planning until answered.**

| # | Question | Context | Impact if unanswered | Suggested answer |
|---|----------|---------|----------------------|------------------|
| 1 | What is the default inactivity threshold value? | Scope says "configurable" but Out-of-Scope defers choosing the value | Cannot design time-based test scenarios | 4 hours (from business-rules.md) |
| 2 | What is the exact system-generated reason text? | AC7 says reason must be "visibly distinguishable" from person-typed | Cannot assert exact reason string in test | `"Auto-closed by inactivity sweep — no step activity for {threshold}h (closed at {YYYY-MM-DD HH:MM} UTC)"` |
| 3 | How is the sweep triggered — cron, serverless, or API call? What's the frequency? | Scope says "scheduled sweep" but doesn't specify mechanism | Cannot trigger sweep manually for testing | Supabase Edge Function via pg_cron every 15 minutes |

### PO Responses (2026-08-17)

> **Confirmed by**: PO (Ely) — see [BK-269 comment #12448](https://jira.upexgalaxy.com/browse/BK-269)

| # | Answer |
|---|--------|
| 1 | **4 hours**. Env var `SWEEP_INACTIVITY_THRESHOLD_HOURS` with default 4. Config UI out-of-scope for this Story. |
| 2 | `"Auto-closed by inactivity sweep — no step activity for {threshold}h (closed at {YYYY-MM-DD HH:MM} UTC)"` |
| 3 | **Supabase Edge Function** triggered by **pg_cron** every **15 minutes**. Calls `POST /api/v1/admin/sweep/run-timeout` with service-role key. |

---

## Technical Questions for Dev

> These do not block PO but block implementation.

| # | Question | Testing impact |
|---|----------|----------------|
| 1 | Which timestamp column for inactivity check — `runs.updated_at`, `run_steps.updated_at`, or dedicated `last_step_activity_at`? | If `runs.updated_at`, sweep itself updates it on abort → self-reference problem |
| 2 | Does the sweep reuse the exact same abort logic as BK-36? | If same path, manual abort tests partially cover sweep behavior |
| 3 | What is the cascade behavior on sweep abort — same as manual abort (BK-36)? | Need to verify `run_atcs`/`run_steps` resolution matches manual abort |

### Dev Responses (2026-08-17)

> **Confirmed by**: Dev — see [BK-269 comment #12449](https://jira.upexgalaxy.com/browse/BK-269)

| # | Answer |
|---|--------|
| 1 | Add dedicated column `last_step_activity_at` to `runs` table. Updated only when step is marked, never by sweep. Sweep query: `SELECT id FROM runs WHERE status = 'running' AND last_step_activity_at < NOW() - interval '{threshold} hours'` |
| 2 | **Yes**, calls same `abortRun(runId, reason)` function. Same cascade, rollup, realtime broadcast, terminal guard. |
| 3 | **Identical to manual abort (BK-36)**. `run_atcs` computed from child `run_steps`; pending `run_steps` set to "skipped"; `runs` status→"aborted" + `finish_time` set + reason set; `progress_pct` recomputed; realtime broadcast fires. |

---

## Suggested Story Improvements

| # | Current state | Suggested change | Benefit |
|---|---------------|------------------|---------|
| 1 | "configurable inactivity threshold" + "choosing threshold value" (out-of-scope) | Explicitly state: "Threshold read from `[config]` with default of `[X]`h. Config UI deferred." | Eliminates ambiguity for Dev + QA |
| 2 | "no step activity recorded" (AC1) | Specify: "no step marked and `last_step_activity_at` older than threshold" | Eliminates timestamp source ambiguity |
| 3 | "reason shown identifies closure as automatic sweep" (AC7) | Provide exact reason template string | Enables precise test assertion |

---

## Data feasibility flags

> No data feasibility risks identified. The `runs` table with status, timestamps, and `workspace_id` FK exists and is well-tested (BK-34/35/36/39 all shipped).

---

## Recommended testing strategy

### Pre-implementation

- [ ] Review BK-36 (manual abort) test coverage — sweep reuses same logic
- [ ] Confirm `runs` table schema has `workspace_id` and appropriate timestamp columns
- [ ] Add `last_step_activity_at` column via Supabase migration

### During implementation

- [ ] API-level testing: trigger sweep endpoint (or mock cron), verify run status transitions
- [ ] Workspace isolation: two workspaces, verify sweep scopes correctly
- [ ] Idempotency: run sweep twice on same set, verify no double-abort errors

### Post-implementation (in-sprint by `/sprint-testing`)

- [ ] Home widget integration: verify swept run disappears from active list
- [ ] Run history: verify swept run appears with correct reason
- [ ] Edge cases: race condition, 0-step run, mid-batch failure

---

## Risks & mitigation

| # | Risk | Likelihood | Impact | Mitigated by outlines |
|---|------|------------|--------|----------------------|
| 1 | Sweep uses wrong timestamp column, never triggers | Medium | High | #1, #12 |
| 2 | Race condition between sweep and step mark | Low | High | #13 |
| 3 | Sweep affects runs outside target workspace | Low | Critical | #5 |

---

## Next steps

- [x] PO answers Critical Questions (threshold value, reason text, trigger mechanism) — **CONFIRMED 2026-08-17**
- [x] Dev answers Technical Questions (timestamp column, abort code path, cascade behavior) — **CONFIRMED 2026-08-17**
- [ ] Story enters sprint at status `ready_for_dev` once estimated
- [ ] When Story reaches `ready_for_qa`, `/sprint-testing` will short-circuit refinement (label `shift-left-reviewed` detected)

---

*Refined on 2026-08-17 — QA Shift-Left batch session*
*Local working copy: `.context/PBI/epics/EPIC-BK-30-manual-execution-runs/stories/STORY-BK-269-tms-run-execution-automatically-abort-abandoned-ru/shift-left-refinement.md`*
