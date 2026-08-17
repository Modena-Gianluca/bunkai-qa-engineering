# BK-398 — Acceptance Test Results (QA)

> Jira field: `customfield_10124` · [View in Jira](https://jira.upexgalaxy.com/browse/BK-398)

# Acceptance Test Results: BK-398

## Execution Summary

- Ticket: BK-398
- Environment: `https://staging-upexbunkai.vercel.app`
- Execution date: 2026-08-17
- Result: PASSED WITH BLOCKED COVERAGE
- Smoke: PASS
- UI exploration: PASS for the executed scenarios
- API exploration: BLOCKED by workspace-scoped authentication
- DB validation: PASS for schema availability and staging data presence

## Executed Checks

| Area | Result | Evidence / Notes |
| --- | --- | --- |
| Authenticated application smoke | PASS | `/projects` loaded in staging; `BK-398-smoke-authenticated-projects.yml` |
| Ctrl+K opens one command palette | PASS | `BK-398-AC01-command-palette-open.yml` |
| Search input receives focus and grouped result renders | PASS | `BK-398-AC03-search-results.yml` |
| Selecting a project navigates to its destination | PASS | Navigated to `/projects/markdown-editor-test`; `BK-398-AC04-project-navigation.yml` |
| Query below two characters | PASS | `BK-398-AC06-below-threshold.yml` |
| No-results state | PASS | `BK-398-AC07-no-results.yml` |
| Six search entity tables contain staging data | PASS | DBHub: projects 388, modules 356, atcs 2453, tests 564, bugs 372, runs 469 |
| Direct API search contract | BLOCKED | Endpoint reached, but JWT was invalid and signin PAT lacked workspace scope |

## Coverage Not Executed

- Full 28-outline ATP execution was not completed.
- API response contract, RLS isolation, second-workspace scoping, timeout/error recovery, latest-query-wins, and all six destination routes remain unverified.
- No defect was filed because the API blocker is an environment/test-credential scope issue, not confirmed product behavior.

## Evidence Uploaded To Jira

- `BK-398-smoke-authenticated-projects.yml`
- `BK-398-AC01-command-palette-open.yml`
- `BK-398-AC03-search-results.yml`
- `BK-398-AC04-project-navigation.yml`
- `BK-398-AC06-below-threshold.yml`
- `BK-398-AC07-no-results.yml`
- `BK-398-stage2-execution-summary.txt`

## Recommendation

Do not mark BK-398 fully QA-approved yet. Resolve the workspace-scoped API credential/data setup, then execute the blocked API/RLS and route coverage before final sign-off.

---
_Synced from Jira by sync-jira-issues_
