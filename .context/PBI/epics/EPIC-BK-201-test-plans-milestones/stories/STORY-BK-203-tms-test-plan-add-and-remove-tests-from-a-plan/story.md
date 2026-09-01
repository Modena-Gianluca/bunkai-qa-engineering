# TMS-Test Plan | Add and remove tests from a plan

**Jira Key:** [BK-203](https://jira.upexgalaxy.com/browse/BK-203)
**Epic:** [BK-201](https://jira.upexgalaxy.com/browse/BK-201) (Test Plans & Milestones)
**Type:** Story
**Status:** Ready For Release
**Priority:** Medium
**Story Points:** -

---

## Overview

## User story

As Elena Vargas, Senior QA Engineer, I want to add existing Tests to a test plan and remove them, so that the plan reflects exactly the verification scope agreed for its goal.

## Context

A Test Plan is only useful once it holds the right Tests. This story delivers membership curation: picking Tests from the project's existing test library and removing ones that no longer belong. Membership is by reference — the same Test can serve several plans (a smoke plan and a regression plan may share it), and removing a Test from a plan never touches the Test itself. This story activates once its dependency epics (Tests, Manual Execution & Runs) and the plan container story are live.

## QA Refinements (Shift-Left Analysis)

> Full refinement: `.context/PBI/epics/EPIC-BK-201-test-plans-milestones/stories/STORY-BK-203-tms-test-plan-add-and-remove-tests-from-a-plan/shift-left-refinement.md`

### Data Feasibility Flag

***DATA-FEASIBILITY-RISK:**** ****confirmed.*** No `test_plan`/`TestPlan` entity exists yet in the target repo (zero routes, zero migrations, zero source references). This Story is blocked on [https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202](https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202) (plan container, still `Estimation`) and the Tests dependency epic. This blocks execution, not design — the refinement below is fully derivable from the spec.

### Edge Cases Identified

1. Removing the last test returns the plan to its empty state with no residual count drift — High criticality, no AC covers it (Scenario 4.2).
2. Viewer's direct API attempt to add/remove, bypassing the absent UI control — High, test-only (established RBAC precedent).
3. Concurrent add of the same test to the same plan by two members near-simultaneously — Medium, exact rejection shape needs PO confirmation (Scenario E3).
4. Add-tests picker search returns 0 results — Low, empty-state copy needs confirmation (Scenario E4).
5. Membership change attempted on a Closed plan — hidden control vs. shown-then-rejected — Critical, no AC covers it (Scenario E1).
6. Test from a different project added via direct API, bypassing the picker's project-scoped search — High, enforcement layer needs confirmation (Scenario E2).

### Clarified Business Rules (pending PO confirmation)

- business-rules.md: "viewers are read-only" — read as UI controls not rendered at all (not disabled), pending PO confirmation.
- business-rules.md + out-of-scope.md: "Closed plans reject membership changes" — read as UI-hidden, but exact surfaced behavior is not stated; suggested: hidden UI + server-side rejection (double-gate), pending PO confirmation.
- business-rules.md: "Only Tests from the plan's own project can be added" — enforcement layer (picker-scope-only vs. also server-validated) not stated; suggested: both layers, pending PO confirmation.

### Open Questions for PO

1. Is membership editing on a Closed plan hidden from the UI entirely, or shown and then rejected on submit? Suggested: hide controls entirely, enforce server-side too (defense-in-depth).
2. Is cross-project Test isolation enforced only by scoping the picker's search results, or also validated server-side against a direct API call? Suggested: enforce both layers, consistent with this codebase's established multi-tenant isolation pattern.

### Open Questions for Dev

1. Exact error shape (status code + error code) for the three rejection paths: duplicate add, closed-plan add/remove, cross-project add.
2. Idempotency behavior on a rapid double-submit of the add-tests confirm action.
3. Empty-results state copy for the add-tests picker when a search term matches nothing.

---

## QA Refinements (Shift-Left Analysis) — Refreshed 2026-08-23

> Refined Acceptance Criteria live in the `acceptance_criteria` field (14 scenarios).
First pass: 2026-08-16. Refreshed 2026-08-23 after [https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202](https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202) (plan container) and [https://jira.upexgalaxy.com/browse/BK-24#icft=BK-24](https://jira.upexgalaxy.com/browse/BK-24#icft=BK-24) (Tests) both shipped and reached QA Approved / Ready For Release — the original data-feasibility blocker on those two dependencies is resolved. This Story's own membership entity (join table, add/remove RPCs, search endpoint) still needs to be built — normal in-sprint work, not a feasibility gap.

### Edge Cases Identified

| ***#**** | ****Edge case**** | ****In original Story?**** | ****Criticality**** | ****Action*** |
| --- | --- | --- | --- | --- |
| 1 | Removing the last test returns the plan to its empty state with no residual count drift | No (design-intent line only, no AC) | High | Add to AC (PO confirm) — Scenario 4.2 |
| 2 | Viewer's direct API attempt to add/remove, bypassing the absent UI control | No | High | Test only — don't add AC (established RBAC precedent) |
| 3 | Concurrent add of the same test to the same plan by two members near-simultaneously | No | Medium | Test only (PO confirm exact rejection shape) — Scenario E3 |
| 4 | Add-tests picker search returns 0 results | No | Low | Test only (PO confirm empty-state copy) — Scenario E4 |
| 5 | Membership change attempted on a Closed plan — hidden control vs. shown-then-rejected | No (business-rules.md/out-of-scope.md only, no AC) | Critical | Add to AC (PO confirm) — Scenario E1 |
| 6 | Test from a different project added via direct API, bypassing the picker's project-scoped search | No | High | Add to AC (PO confirm which layer enforces it) — Scenario E2 |

### Clarified Business Rules

1. ***"Viewers are read-only" (business-rules.md)*** — resolved: Add/Remove controls are not rendered at all for a `viewer` role (structurally absent, not disabled), consistent with this codebase's established UI-affordance pattern.
2. ***"Membership can only be edited while the plan is Open" (business-rules.md + out-of-scope.md)*** — resolved: the Add/Remove UI is hidden entirely on a Closed plan, with server-side rejection enforced as a backstop (defense-in-depth double-gate).
3. ***"Only Tests from the plan's own project can be added" (business-rules.md)*** — resolved: enforced at both the picker's search-result scoping (UX) AND server-side validation on every write (mandatory, non-negotiable).

### Critical Questions for PO — ANSWERED (2026-08-16)

1. ***Closed-plan membership editing — hidden vs. shown-then-rejected?*** Answered: hidden entirely in the UI, server-side rejection as a backstop — matches this product's existing viewer-write-blocking pattern.
2. ***Cross-project Test isolation — picker-scope-only vs. also server-validated?*** Answered: both layers — picker scoping for UX, mandatory server-side validation on every write — consistent with this product's highest-severity failure class (multi-tenant isolation).

### Technical Questions for Dev — ANSWERED (2026-08-16, one addendum 2026-08-23)

1. ***Exact error shape for the 3 rejection paths**** — duplicate add: SQLSTATE `23505` → HTTP 409 (`conflict`, "This test is already in the plan."); Closed-plan add/remove: HTTP 409 (`conflict`, "This test plan is closed and can no longer be edited."); cross-project add: HTTP 422 (`test*outside*plan*project`-style, modeled on `module*outside*project*subtree`). ****Addendum (2026-08-23)***: the Closed-plan errcode is corrected from the 2026-08-16 placeholder guess (`45510`) to the real shipped code `45603 test*plan*not*open` — BK-202's migration (`0073*test_plans.sql`) claims the `456xx` block and this code already exists live in `lib/test-plans/errors.ts`. The duplicate-add and cross-project answers are unaffected.
2. ***Double-submit idempotency behavior*** — answered: reuse the existing `Idempotency-Key` header middleware (`lib/api/idempotency.ts`) on the add-tests POST, with the DB `unique(plan*id, test*id)` constraint as a second, independent backstop.
3. ***Empty-results state copy*** — answered: `"No tests match."` (italic, muted style), matching the existing search-picker precedent in `components/atcs/AnchoringPanel.tsx`.

> Full refinement (all phases, coverage outlines, risk + data feasibility) lives in the ATP — the `acceptance*test*plan` field.

---

## Fields

> Each rich-text field is a separate file in this folder.

- [Mockup](./mockup.md)
- [Implementation Plan (Dev)](./implementation-plan.md)

---

## Traceability

### Test Execution (1)

- [BK-760](https://jira.upexgalaxy.com/browse/BK-760): ATR: BK-203: Story Testing _(ACTIVE)_

### Storys (2)

- [BK-204](https://jira.upexgalaxy.com/browse/BK-204): TMS-Test Plan | Track plan progress from run outcomes _(Backlog)_
- [BK-202](https://jira.upexgalaxy.com/browse/BK-202): TMS-Test Plan | Create a test plan grouping tests for a goal _(Ready For Release)_

### Test Plan (1)

- [BK-759](https://jira.upexgalaxy.com/browse/BK-759): ATP: BK-203: TMS-Test Plan | Add and remove tests from a plan _(Planning)_

### Test Set (1)

- [BK-758](https://jira.upexgalaxy.com/browse/BK-758): ATS: BK-203: TMS-Test Plan | Add and remove tests from a plan _(Designing)_

---

## Metadata

- **Created:** 11/7/2026
- **Updated:** 31/8/2026
- **Reporter:** Ely
- **Assignee:** Alfonso Hernandez
- **Labels:** new-feature, post-mvp, shift-left-2026-08-16, shift-left-2026-08-23, shift-left-reviewed

---

_Synced from Jira by sync-jira-issues_
