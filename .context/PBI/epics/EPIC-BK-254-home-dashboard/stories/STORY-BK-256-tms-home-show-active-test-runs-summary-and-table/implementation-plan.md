# BK-256 — Implementation Plan (Dev)

> Jira field: `customfield_10165` · [View in Jira](https://jira.upexgalaxy.com/browse/BK-256)

[https://jira.upexgalaxy.com/browse/BK-256#icft=BK-256](https://jira.upexgalaxy.com/browse/BK-256#icft=BK-256) TEST RESULTS

Tested: 2026-08-26
Environment: Staging (`https://staging-upexbunkai.vercel.app`)
Tester: Carlos C
Result: PASSED (9/9)

## Summary

Verified the Home "Active test runs" widget end to end: empty state, multi-project active listing with all 6 required columns, resume-most-recent quick action, and the Running/Blocked-vs-Finished/Aborted business rule — through UI (Playwright), API (`GET /api/v1/workspaces/{id}/active-runs`), and DB (read-only `runs`/`run_steps` cross-check). All 9 outlines PASS; the Story's own ACs are fully satisfied.

## Test cases

| ***TC**** | ****Name**** | ****Status*** |
| --- | --- | --- |
| TC1 | List every active run across 2+ projects, all 6 columns | PASSED |
| TC2 | Empty state when nothing is active | PASSED |
| TC3 | Resume the most recently active run | PASSED |
| TC4 | Exclude a run once Finished | PASSED |
| TC5 | Show `blocked` state (derived from `run_steps`, not `runs.status`) | PASSED |
| TC6 | Exclude a run once Aborted | PASSED |
| TC7 | Render non-zero mid-progress (`X/N`, X>0) | PASSED |
| TC8 | "Resume" navigates to the correct run | PASSED |
| TC9 | Tie-break on identical sort key (accepted, non-blocking) | PASSED / Accepted |

## Test data

- Workspace: Sir Tests A Lot (`45146d08-...`)
- Projects: TMS Bunkai (`1495ebc9-...`), Energy Insights (`5b75a743-...`)
- Runs: `c2524914` (running, 1/3), `a90ecfd9` (blocked, 1/1), `1c158e83` (running, 3/3), `f7fdf331` (running, 0/1); `5a7e14db` (passed), `4ffcb6cb` + `2600cd1e` (aborted) — all correctly excluded

## Bugs found

[https://jira.upexgalaxy.com/browse/BK-620#icft=BK-620](https://jira.upexgalaxy.com/browse/BK-620#icft=BK-620) — Bunkai Runs/Tests: a Test created in Project A leaks into Project B's Explorer and is runnable from there (422 is only the downstream symptom). Filed as Defect, parented to QA Defect Management ([https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183)), linked to this Story (`causes`). Does not falsify any of BK-256's own ACs — noted as a cross-cutting data-integrity risk discovered while producing fixture data.

## Observations

- Fixed a pre-existing framework config defect blocking automation entirely: `config/variables.ts` had the staging `base`/`api` URLs and `scripts/api-login.ts`'s login endpoint hardcoded to a leftover placeholder host, unrelated to this Story — disclosed and fixed with the user's authorization (uncommitted).
- The Business Rule's "Blocked" is not a `runs.status` value — it's derived per-row from `run_steps.status`, while the run's own `status` stays `running`. Confirmed directly against source (`lib/home/active-runs.ts`) and DB.
- "Resume" tie-break is a deterministic, documented `id`-descending stable sort in the source, not database-engine luck as first assumed — corrected in the ATP.

## Recommendations

- [https://jira.upexgalaxy.com/browse/BK-620#icft=BK-620](https://jira.upexgalaxy.com/browse/BK-620#icft=BK-620) should be triaged/fixed independently; it is not a [https://jira.upexgalaxy.com/browse/BK-256#icft=BK-256](https://jira.upexgalaxy.com/browse/BK-256#icft=BK-256) blocker.
- TC1-TC9 are solid automation candidates for Stage 5 given they're now fully data-backed (API + DB assertions already proven out manually).

---
_Synced from Jira by sync-jira-issues_
