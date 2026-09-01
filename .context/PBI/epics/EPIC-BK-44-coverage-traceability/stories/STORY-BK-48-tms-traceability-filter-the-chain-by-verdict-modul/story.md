# TMS-Traceability | Filter the chain by verdict, module, and date range

**Jira Key:** [BK-48](https://jira.upexgalaxy.com/browse/BK-48)
**Epic:** [BK-44](https://jira.upexgalaxy.com/browse/BK-44) (Coverage & Traceability)
**Type:** Story
**Status:** Ready For Release
**Priority:** Medium
**Story Points:** -

---

## Overview

## User story

As a Senior QA Engineer, I want to filter the evidence chain by result, module and date range so that I can focus on what failed, where, and when without scrolling the whole history.

---

## QA Refinements (Shift-Left Analysis) — Added 2026-06-16

> Refined Acceptance Criteria live in the acceptance_criteria field (Step 1a).

### Edge Cases Identified

| ***#**** | ****Edge case**** | ****In original Story?**** | ****Criticality**** | ****Action*** |
| --- | --- | --- | --- | --- |
| 1 | Inverted date range (from after to) | No | Medium | Add to AC (PO confirm) |
| 2 | Filtering by a soft-archived module | No | High | Add to AC (PO confirm) |
| 3 | Date-range inclusive/exclusive boundary | No | Medium | Add to AC (PO confirm) |
| 4 | Verdict filter value with zero matching runs (vs. an invalid/unsupported verdict value) | No | Low | Test only — don't add AC |
| 5 | Cross-workspace data exposure through crafted filter params | No | High | Add to AC (PO confirm) — security-relevant |
| 6 | Filter applied on a chain with zero underlying evidence ([https://jira.upexgalaxy.com/browse/BK-45#icft=BK-45](https://jira.upexgalaxy.com/browse/BK-45#icft=BK-45) "no coverage") vs. filter matching zero evidence ([https://jira.upexgalaxy.com/browse/BK-48#icft=BK-48](https://jira.upexgalaxy.com/browse/BK-48#icft=BK-48) AC3) — distinguishing the two empty states | No | Medium | Add to AC (PO confirm) |
| 7 | Filter state persistence across reload / navigation / share | No | Medium | Add to AC (PO confirm) |

### Clarified Business Rules

- Filter targets the Run's verdict field (once [https://jira.upexgalaxy.com/browse/BK-30#icft=BK-30](https://jira.upexgalaxy.com/browse/BK-30#icft=BK-30) defines it) — not the ATC `status` field — pending PO confirmation.
- Module + date-range filters are assumed AND logic, not OR, pending PO confirmation.
- Date range is assumed to filter on Run `executed_at` as the most natural "when did the evidence happen" anchor, pending PO confirmation.
- Module filter scope (exact-match vs. tree-scoped to include descendant sub-modules) is undefined and must be confirmed before estimation.

### Critical Questions for PO

1. ***Does the result filter prune entire AC/Test branches with no failing descendant, or only filter the Run-level rows while keeping parent AC/Test rows visible?***

1. ***Are module + date-range filters combined with AND or OR logic, and is the module filter exact-match on the selected node or tree-scoped to include sub-modules?***

1. ***Should this Story remain in the current sprint-readiness pipeline given that its data source (BK-45's chain) and BK-45's own upstream dependencies (BK-24 Tests, BK-30 Runs, BK-31 Defects) are all still in "Planificación" with no schema?***

### Technical Questions for Dev

1. ***Will filter predicates be pushed down into the (future) chain-assembly query, or applied client-side after fetching the full unfiltered chain?*** — Context: BK-45's refinement already flags an N+1 / large-chain performance risk at the assembly layer; adding filter logic without server-side predicate push-down compounds that risk for any story with a large ATC/Run count. Testing impact: determines whether performance/boundary outlines test the API layer or only the UI rendering layer.

1. ***What is the persistence mechanism for filter state — URL query params, local component state, or server-side saved view?*** — Context: no AC addresses this. Testing impact: determines whether "share this filtered view" / browser-back-button test outlines are in scope at all.

1. ***Which timestamp column does the date-range filter target — Run**** `executed_at`****, or some other per-layer timestamp — and is the range inclusive or exclusive at the boundaries?*** — Context: boundary test outline cannot be finalized without this.

> Full refinement (Phases 1-5, outline DRAFT, risk + data feasibility) lives in the ATP DRAFT custom field and the canonical comment below.

---

## QA Refinements (Shift-Left Analysis) — Updated 2026-08-10

> ***Supersedes 2026-06-16 analysis.*** All dependencies ([https://jira.upexgalaxy.com/browse/BK-45#icft=BK-45](https://jira.upexgalaxy.com/browse/BK-45#icft=BK-45), [https://jira.upexgalaxy.com/browse/BK-24#icft=BK-24](https://jira.upexgalaxy.com/browse/BK-24#icft=BK-24), [https://jira.upexgalaxy.com/browse/BK-30#icft=BK-30](https://jira.upexgalaxy.com/browse/BK-30#icft=BK-30), [https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31), [https://jira.upexgalaxy.com/browse/BK-50#icft=BK-50](https://jira.upexgalaxy.com/browse/BK-50#icft=BK-50)) are now SHIPPED.

### Design Contract Status

| ***#**** | ****Ambiguity**** | ****Resolution**** | ****Source*** |
| --- | --- | --- | --- |
| 1 | Result filter target | RESOLVED: Row `data-status` (latest-run outcome). Six-value set (pass/fail/blocked/skipped/aborted/running). | HTML lines 559-563; D27 |
| 2 | Tree-pruning vs row-level | RESOLVED: ROW-LEVEL filtering. AC card hidden only when ALL rows filtered out. | HTML lines 939-949 |
| 3 | Module filter scope | RESOLVED: Exact-match on `data-module`. NOT tree-scoped. | HTML line 926 |
| 4 | Date range anchor | RESOLVED: Filters `data-date` (latest-run date). INCLUSIVE bounds. | HTML lines 928-933 |
| 5 | AND vs OR | RESOLVED: AND across result + module + date. | HTML lines 914-936 |
| 6 | Active filter display | RESOLVED: "Active filters:" + chips + Clear all button + aria-live count. | HTML lines 588-595 |
| 7 | Empty states | RESOLVED: THREE distinct states (filter-empty / zero-coverage / zero-AC). | HTML lines 805-812 |

### Still Open (3 items)

| ***#**** | ****Item**** | ****Why open*** |
| --- | --- | --- |
| 1 | Filter-state persistence (URL params vs local) | Mockup is static; no AC addresses this |
| 2 | Archived-module behavior | Picker shows demo modules only; undefined |
| 3 | Shipped-chain alignment | Verify [https://jira.upexgalaxy.com/browse/BK-45#icft=BK-45](https://jira.upexgalaxy.com/browse/BK-45#icft=BK-45) exposes latest-Run date and six outcomes per row |

### Coverage Estimate: 14 outlines

- Positive: 6 (single-verdict, multi-verdict, six-value, module, date, AND)
- Negative: 3 (inverted date, zero-match, zero-coverage precedence)
- Boundary: 3 (date inclusive edges, empty-date exclusion, AC card hide rule)
- Integration: 2 (real [https://jira.upexgalaxy.com/browse/BK-45#icft=BK-45](https://jira.upexgalaxy.com/browse/BK-45#icft=BK-45) data, Clear-all reset)

### Critical Questions for PO

1. ***Filter-state persistence:**** ****URL query params vs local component state?***
2. ***Archived-module behavior:**** ****excluded from picker, or resolves to empty-result state?***
3. ***Shipped-chain alignment:**** ****does BK-45 expose latest-Run date per row and all six outcomes?***

> Full refinement in the ATP DRAFT field and shift-left-refinement.md.

---

## Fields

> Each rich-text field is a separate file in this folder.

- [Mockup](./mockup.md)

---

## Traceability

### Test Execution (1)

- [BK-716](https://jira.upexgalaxy.com/browse/BK-716): ATR: BK-48: Story Testing _(ACTIVE)_

### Defects (2)

- [BK-717](https://jira.upexgalaxy.com/browse/BK-717): Traceability filters drop the ?story param from the URL, breaking filter persistence and sharing (AC5.1/5.2) _(Closed)_
- [BK-717](https://jira.upexgalaxy.com/browse/BK-717): Traceability filters drop the ?story param from the URL, breaking filter persistence and sharing (AC5.1/5.2) _(Closed)_

### Epic (1)

- [BK-30](https://jira.upexgalaxy.com/browse/BK-30): Manual Execution & Runs _(Planning)_

### Test Plan (1)

- [BK-715](https://jira.upexgalaxy.com/browse/BK-715): ATP: BK-48: TMS-Traceability | Filter the chain by verdict, module, and date range _(Planning)_

### Test Set (1)

- [BK-714](https://jira.upexgalaxy.com/browse/BK-714): ATS: BK-48: TMS-Traceability | Filter the chain by verdict, module, and date range _(Designing)_

---

## Metadata

- **Created:** 1/6/2026
- **Updated:** 31/8/2026
- **Reporter:** Ely
- **Assignee:** pinto.lucas.nahuel
- **Labels:** +shift-left-2026-08-10, new-feature, shift-left-2026-06-16, shift-left-reviewed, sprint-planning-estimated

---

_Synced from Jira by sync-jira-issues_
