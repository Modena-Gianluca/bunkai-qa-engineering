# BK-269 — Acceptance Test Plan (QA)

> Jira field: `customfield_10067` · [View in Jira](https://jira.upexgalaxy.com/browse/BK-269)

## Acceptance Test Plan — BK-269

### Test Strategy

Manual QA + DB exploration + API verification. No UI changes. Environment: Staging.

### TC Outlines

#### AC1 — Idle Run past threshold is closed

***TC-01***: Close a running Run with step activity older than threshold

- Precondition: Run in running, last step marked >4h ago
- Expected: Status → aborted, finish*time set, abort*reason = system text

***TC-02***: Don't close a running Run with step activity within threshold

- Precondition: Run in running, last step marked 30min ago
- Expected: Status stays running, abort_reason null

***TC-03***: Idle time measured from last step executed*at, not runs.updated*at

- Precondition: Run in running, step marked 5h ago, updated_at 10min ago
- Expected: Run is closed

#### AC2 — Finished Runs are untouched

***TC-04***: Skip a passed Run

- Precondition: Run in passed, last activity >4h ago
- Expected: Unchanged

***TC-05***: Skip a failed Run

- Precondition: Run in failed, last activity >4h ago
- Expected: Unchanged

#### AC3 — Manually aborted Run is untouched

***TC-06***: Skip a manually aborted Run with person-typed reason

- Precondition: Run in aborted with person reason
- Expected: Reason preserved, never overwritten

#### AC4 — Widget update

***TC-07***: Widget removes swept Run

- Precondition: Run visible in active-runs widget
- Expected: Run disappears on next load

***TC-08***: Widget count decrements by one

- Precondition: Widget shows N runs
- Expected: Count becomes N-1

#### AC5 — Idempotent

***TC-09***: Second sweep on same Run changes nothing

- Precondition: Run closed by previous sweep
- Expected: All fields unchanged

#### AC6 — Reason + audit

***TC-10***: Reason text exact format

- Expected: Auto-closed by inactivity sweep: no step activity for 4h (closed {YYYY-MM-DD HH:MM} UTC)

***TC-11***: Audit row system-originated

- Expected: action=run.aborted, actor*user*id=null, via=sweep

***TC-12***: Sweep vs person audit diff

- Expected: Sweep=null+sweep, Person=non-null+cookie/bearer

#### AC7 — Workspace isolation

***TC-13***: Sweep scopes to workspace

- Precondition: 2 workspaces, 1 idle run each
- Expected: Only qualifying workspace run closed

#### AC-E2 — 0-step Run

***TC-14***: Close Run with 0 steps marked

- Precondition: Run in running, all steps pending, started >4h ago
- Expected: Closed from started_at

#### AC-E3 — Only running is swept

***TC-15***: Never sweep non-running (parameterized: passed/failed/aborted)

- Precondition: Run in status, last activity >4h ago
- Expected: Unchanged

#### AC8 — Threshold floor

***TC-16***: Refuse threshold below 1 hour

- Expected: 45215 sweep*threshold*invalid, no Run closed
- Deferred: no EXECUTE privilege

#### AC9 — Notification

***TC-17***: Notify Run starter

- Expected: One run.aborted notification to starter
- Deferred: notification system

### Deferred to Automation

| Scenario | Reason |
| --- | --- |
| E1.1/E1.2 Race condition | Concurrent DB transactions required |
| 8.1 Threshold floor | No EXECUTE privilege |
| 9.1 Notification | Realtime-based, no inbox API |

---
_Synced from Jira by sync-jira-issues_
