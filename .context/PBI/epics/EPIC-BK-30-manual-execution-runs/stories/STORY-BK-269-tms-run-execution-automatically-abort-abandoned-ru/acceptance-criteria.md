# BK-269 — Acceptance Criteria

> Jira field: `customfield_10097` · [View in Jira](https://jira.upexgalaxy.com/browse/BK-269)

## Refined Acceptance Criteria

> The three `NEEDS PO/DEV CONFIRMATION` markers were cleared on 2026-08-24 by the ***AI Product Owner & AI Tech Lead*** ruling published as a comment on this ticket (Critical Rule #18). Scenarios E1, E2 and E3 are rewritten below; 6.2 and 8.1 are new.

### Original AC1 — An idle Run past the inactivity threshold is closed by the sweep

#### Scenario 1.1: Should close a running Run with no step activity beyond the inactivity threshold (Type: Positive, Priority: Critical)

- ********Given****: A Run in `running` status whose last marked step is older than the configured inactivity threshold
- ********When****: The scheduled sweep executes
- ********Then****: Run status becomes `aborted`, `finished*at` is set to the sweep timestamp, and `abort*reason` is the system-generated text

#### Scenario 1.2: Should NOT close a running Run with recent step activity within the threshold (Type: Negative, Priority: Critical)

- ********Given****: A Run in `running` status with a step marked within the inactivity threshold
- ********When****: The scheduled sweep executes
- ********Then****: Run status remains `running`, `abort*reason` stays null, `finished*at` stays null

### Original AC2 — A Run that already finished with a verdict is untouched

#### Scenario 2.1: Should skip a passed Run (Type: Negative, Priority: High)

- ********Given****: A Run with status `passed`
- ********When****: The sweep executes
- ********Then****: Run status, `finished*at` and `abort*reason` are unchanged

#### Scenario 2.2: Should skip a failed Run (Type: Negative, Priority: High)

- ********Given****: A Run with status `failed`
- ********When****: The sweep executes
- ********Then****: Run status, `finished*at` and `abort*reason` are unchanged

### Original AC3 — A Run a person already aborted is untouched

#### Scenario 3.1: Should skip a manually aborted Run (Type: Negative, Priority: High)

- ********Given****: A Run with status `aborted` and a person-typed reason
- ********When****: The sweep executes
- ********Then****: Run status, `finished*at` and `abort*reason` are unchanged — in particular the person's reason is never overwritten by the system-generated text

### Original AC4 — A swept Run disappears from the Home active-runs list

#### Scenario 4.1: Should remove a swept Run from the active-runs widget (Type: Positive, Priority: High)

- ********Given****: A Run appears in the Home active test runs widget (status `running`)
- ********When****: The sweep closes that Run
- ********Then****: On next page load, the Run no longer appears in the widget

#### Scenario 4.2: Should decrement the active-runs count by one (Type: Positive, Priority: High)

- ********Given****: The Home widget shows a count of N running Runs, one of which is idle past the threshold
- ********When****: The sweep closes that idle Run
- ********Then****: The widget count becomes N-1 on next page load

### Original AC5 — Running the sweep repeatedly has no further effect

#### Scenario 5.1: Should be idempotent on an already-swept Run (Type: Boundary, Priority: High)

- ********Given****: A Run was closed by the sweep on a previous execution
- ********When****: The sweep executes again
- ********Then****: Run status, `finished*at` and `abort*reason` are unchanged from the first sweep

### Original AC6 — A swept Run's reason is distinguishable from a person-aborted one

#### Scenario 6.1: Should show the system-generated reason with the sweep prefix (Type: Positive, Priority: Medium)

- ********Given****: A Run closed by the sweep at a 4-hour threshold
- ********When****: A QA Lead opens Run detail
- ********Then****: The abort-reason block reads `Auto-closed by inactivity sweep: no step activity for 4h (closed {YYYY-MM-DD HH:MM} UTC)`
- ********And****: The prefix `Auto-closed by inactivity sweep:` distinguishes it from any free-text reason a person typed

#### Scenario 6.2: Should mark the audit row as system-originated (Type: Positive, Priority: Medium)

- ********Given****: A Run closed by the sweep
- ********When****: The resulting `activity_log` row is read
- ********Then****: `action` is `run.aborted`, `actor*user*id` is null, and `payload->>'via'` is `sweep`
- ********And****: A Run aborted by a person carries a non-null `actor*user*id` and a `via` of `cookie` or `bearer`

### Original AC7 — The sweep never closes a Run outside its Workspace

#### Scenario 7.1: Should scope sweep effects to the Run's own Workspace (Type: Positive, Priority: Critical)

- ********Given****: Workspace A has an idle Run past the threshold; Workspace B has an active Run within the threshold
- ********When****: The sweep executes
- ********Then****: The Workspace A Run becomes `aborted`; the Workspace B Run remains `running`
- ********And****: Each resulting `activity*log` row carries the `workspace*id` of the Run it closed

### AC-E1 — The sweep / step-mark race

> ***Resolved.*** The winner is decided by commit order, and the invariant is that real activity always beats the sweep. Both operations serialize on the same `runs` row lock.

#### Scenario E1.1: Should leave the Run running when a step mark commits before the sweep acquires the row lock (Type: Edge, Priority: High)

- ********Given****: A Run in `running` status that qualifies as idle when the sweep builds its candidate set
- ********And****: A QA Engineer marks a step on that Run before the sweep acquires the `runs` row lock
- ********When****: The sweep reaches that Run and re-evaluates the inactivity predicate under the lock
- ********Then****: The sweep skips the Run, its status stays `running`, `abort*reason` stays null, `finished*at` stays null
- ********And****: The step mark is recorded normally, with its `run_atcs` verdict recomputed as usual

#### Scenario E1.2: Should reject the step mark when the sweep commits first (Type: Edge, Priority: High)

- ********Given****: A Run in `running` status that the sweep has already closed as `aborted`
- ********When****: A QA Engineer's in-flight step mark acquires the `runs` row lock afterwards
- ********Then****: The step mark is rejected with `45212 run*step*marking_closed`, surfaced as HTTP 409
- ********And****: The Run stays `aborted` with the system-generated reason, and no `run_steps` row was modified by the rejected call

### AC-E2 — A Run on which no step was ever marked

> ***Resolved******:****** yes, it is closed.*** Idle time falls back to `runs.started_at`. This is the archetypal abandoned Run — someone opened the runner and walked away.

#### Scenario E2.1: Should close a Run whose steps were never marked (Type: Edge, Priority: High)

- ********Given****: A Run in `running` status whose chain steps are all still `pending`
- ********And****: The Run's `started_at` is older than the configured inactivity threshold
- ********When****: The scheduled sweep executes
- ********Then****: The Run is closed as `aborted` with the system-generated reason
- ********And****: The idle time was measured from `runs.started*at`, never from `runs.updated*at`

> ***Note for the ATC author****: seed this as a Run ****with*** steps, none of them marked. A Run with zero `run*steps` rows cannot be created — `bunkai*create*run` raises `45202 no*executable_steps` for a chain with no executable steps.

### AC-E3 — Only a running Run is ever swept

> ***Resolved, and the original wording corrected.**** The Run-grain status vocabulary is exactly `running | passed | failed | aborted`. There is ****no*** `pending` or `created` Run status — a Run is created directly in `running`. The previous wording asserted a state the database refuses to store.

#### Scenario E3.1: Should never sweep a Run that is not running (Type: Negative, Priority: Medium)

- ********Given****: A Run whose status is `<status>` and whose last activity is older than the configured inactivity threshold
- ********When****: The scheduled sweep executes
- ********Then****: The Run's status, `finished*at` and `abort*reason` are unchanged

| `<status>` |
| --- |
| `passed` |
| `failed` |
| `aborted` |

### AC8 — The threshold has a floor

#### Scenario 8.1: Should refuse a threshold below the minimum (Type: Boundary, Priority: Low)

- ********Given****: The sweep is invoked with an inactivity threshold below 1 hour
- ********When****: The call executes
- ********Then****: It raises `45215 sweep*threshold*invalid` and closes no Run
- ********And****: Every Run in `running` status is left untouched

### AC9 — The Run's starter is notified

> Recorded because it resolves the third Out-of-Scope open question ***by inheritance***: the notification arrives from the already-live run-event trigger and needs no new code.

#### Scenario 9.1: Should notify the Run's starter when the sweep closes their Run (Type: Positive, Priority: Medium)

- ********Given****: A Run started by a QA Engineer whose account is still active
- ********When****: The sweep closes that Run
- ********Then****: Exactly one notification of type `run.aborted` is delivered to the Run's starter, scoped to that Run's Workspace
- ********And****: No notification is written when the Run's starter no longer has an account

---
_Synced from Jira by sync-jira-issues_
