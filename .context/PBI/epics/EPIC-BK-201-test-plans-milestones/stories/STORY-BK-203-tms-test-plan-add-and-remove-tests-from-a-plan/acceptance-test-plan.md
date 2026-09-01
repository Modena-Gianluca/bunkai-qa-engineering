# ACCEPTANCE TEST PLAN (ATP): ATP: BK-203: TMS-Test Plan | Add and remove tests from a plan

**Jira Key:** [BK-759](https://jira.upexgalaxy.com/browse/BK-759)
**Status:** Planning
**Components:** None

> Run results / coverage are NOT synced — read those via xray-cli. This file mirrors the issue description.

---

## Description

# [https://jira.upexgalaxy.com/browse/BK-203#icft=BK-203](https://jira.upexgalaxy.com/browse/BK-203#icft=BK-203) — Acceptance Test Plan (QA)

> Jira field: `customfield_10067` · [View in Jira](https://jira.upexgalaxy.com/browse/BK-203)

# Shift-Left Refinement: [https://jira.upexgalaxy.com/browse/BK-203#icft=BK-203](https://jira.upexgalaxy.com/browse/BK-203#icft=BK-203) — TMS-Test Plan | Add and remove tests from a plan

******Status*****:** **Refined — Awaiting PO Estimation**
**********Mode********:**** ****Shift-Left (pre-sprint, batch grooming)***
**Refined on****: 2026-08-23 (refreshed — first pass 2026-08-16)
******Refined by*****:** **QA — Shift-Left batch session**
**********Modality*****: Jira-native

******Resumed****: The 2026-08-16 pass was paused pending [https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202](https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202) (plan container). [https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202](https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202) is now `QA Approved` (shipped, 0 defects on retest) and the Tests epic ([https://jira.upexgalaxy.com/browse/BK-24#icft=BK-24](https://jira.upexgalaxy.com/browse/BK-24#icft=BK-24)) was already live. Both originally-cited blockers are resolved. This Story's own membership entity (join table, add/remove RPCs, search endpoint) still needs to be built — normal in-sprint scope, not a feasibility gap.

---

## Phase 1 — Critical Analysis (condensed)

- ******Primary persona:**** ****Elena Vargas (****`member`****+) curates which Tests a plan verifies.**** ****Secondary****: Lucia (`viewer`, read-only).
- ******Business value****: makes BK-202's plan container actually usable; feeds BK-204's progress tracking.
- ******Journey position:**** ****Create plan (BK-202, shipped) ->**** ****curate membership (this Story)**** -> track progress ([https://jira.upexgalaxy.com/browse/BK-204#icft=BK-204](https://jira.upexgalaxy.com/browse/BK-204#icft=BK-204)).
- ******Frontend****: extends the Test Plan detail tab — add-tests dialog (search + multi-select + confirm), member-tests table with per-row Remove.
- ******Backend****: needs new add/remove/list-membership endpoints + a Test-search-by-name endpoint (Tests today only supports single-tag exact match, no name search).
- ******DB*****:** **needs a membership join table modeled on the now-shipped** **`***test*plans{{ table shape (RLS SELECT-only, SECURITY DEFINER RPCs for writes, }}456xx{{ errcode block, }}45603 test*plan*not*open` already defined).
- ******Integration points*****:** **Test-library search (net-new), membership CRUD, RBAC gate (reuse** **`***bunkai*can*write_workspace`, QA-verified via [https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202](https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202)), plan-state gate (Closed blocks writes), live count sync across 2 surfaces (plan header + plans list).

| ***Axis**** | ****Rating**** | ****Why*** |
| --- | --- | --- |
| Business logic | Medium | Join-table CRUD, reference-not-copy semantics, uniqueness, cross-project scoping |
| Integration | Medium | Both named dependencies now shipped — remaining gap is this Story's own entity |
| Data validation | Medium | Duplicate, cross-project, closed-plan all need UI + server-side enforcement (defense-in-depth) |
| UI | Medium | Two-surface live count sync, state-dependent action visibility |

******Estimated test effort****: Medium-High — no longer gated behind external blockers.

******Epic-level inheritance**** **(from BK-202, same epic, QA Approved):** **server-side role gate is a hard NFR (reuse** **`***bunkai*can**write_workspace{{, don't reimplement); RLS is SELECT-only + DEFINER-RPC-only (no member+ write policy); error-code block }}456xx` is claimed by test-plans domain.

---

## Phase 2 — Story Quality Analysis (condensed)

### Ambiguities (all resolved — see PO/Dev Answers below)

1. AC5 "read-only" for viewer — controls absent vs disabled? -> ******Answered****: absent entirely.
2. Closed-plan edit — hidden UI vs shown-then-rejected? -> ******Answered****: hidden + server-side backstop.
3. Cross-project isolation — picker-scope-only vs also server-validated? -> ******Answered****: both layers.

### Gaps

1. No AC states picker behavior when a Test is a member of a ***different*** plan (not this one) — likely identical to "not a member" state, should be explicit.
2. No AC states idempotency of add under a double-submit — ******Answered**** (see Dev Q2): Idempotency-Key header + DB unique-constraint backstop.
3. No pagination/result-size behavior stated for the picker on a large library — presumed to reuse ATC-search precedent.

### Contradictions

None found — Story, ACs, business rules, scope, out-of-scope, workflow narrative are internally consistent.

### Testability validation

******Verdict:**** ****Partial → now mostly resolved by the PO/Dev answers below. Remaining note:**** ****this Story's own membership entity doesn't exist yet in the target codebase, so**** ****execution**** (not design) is blocked until it's built. One exception: the Closed-plan scenario (E1) is testable today via direct DB seed of `status='closed'` — the shipped `test_plans` migration's own author comment explicitly endorses this for test purposes, since no product write path can produce a Closed plan until [https://jira.upexgalaxy.com/browse/BK-207#icft=BK-207](https://jira.upexgalaxy.com/browse/BK-207#icft=BK-207) ships.

---

## Phase 3 — Refined Acceptance Criteria

> Full Given/When/Then detail for all 14 scenarios lives in the Jira ******Acceptance Criteria**** field (published this session, Gherkin format). Scenario index for cross-reference:

| ***#**** | ****Scenario**** | ****Type**** | ****Priority*** |
| --- | --- | --- | --- |
| 1.1 | Add 12 tests via multi-select, count updates | Positive | Critical |
| 1.2 | Add 1 test to empty plan | Positive | High |
| 2.1 | Same test in two plans independently | Positive | Critical |
| 2.2 | Remove from one plan, remains in the other | Positive | Critical |
| 3.1 | Picker marks already-included test, blocks re-selection | Negative | Critical |
| 3.2 | Direct API duplicate add rejected | Negative | High |
| 4.1 | Remove test, count -1, Test entity untouched | Positive | Critical |
| 4.2 | Remove last test -> empty state, count 0 | Boundary | High |
| 5.1 | Viewer: Add/Remove controls hidden (UI) | Negative | Critical |
| 5.2 | Viewer: direct API add/remove rejected | Negative | Critical |
| E1 | Closed plan: add/remove rejected | Negative | Critical |
| E2 | Cross-project Test add rejected | Negative | High |
| E3 | Rapid double-submit: no duplicate row | Edge | Medium |
| E4 | Picker search, 0 results -> distinct empty state | Edge | Low |

All ******NEEDS PO/DEV CONFIRMATION**** **markers from the 2026-08-16 pass are now answered (see PO/Dev Answers section). One correction:** **E1's rejection error code is now the real shipped** **`***45603 test*plan**not_open{{ (replacing the 2026-08-16 placeholder guess }}45510`).

---

## Phase 4 — Test Outlines (outline names only)

### Coverage estimate

| ***Type**** | ****Count**** | ****Notes*** |
| --- | --- | --- |
| Positive | 4 | Multi-select add, single add into empty plan, cross-plan shared membership, remove-without-touching-test |
| Negative | 6 | Duplicate-add (UI+API), viewer-blocked (UI+API), closed-plan rejection, cross-project rejection |
| Boundary | 2 | Last-test-removed ~~> empty state; 0~~>1 transition |
| Integration | 2 | Picker search (FE<->API); live count propagation (2 surfaces, 1 mutation) |
| ******Total****** | 14**** | Drives PO estimation |

******Rationale****: 5 ACs, 2 archetypes converge — Permissions/RBAC (Decision Table: role x plan-state) and List/Table CRUD with uniqueness (EP + BVA at the membership-count boundary). Negative count (6) exceeds Positive (4) because the real risk is in the two gates (RBAC, plan-state) layered on an otherwise-simple join-table CRUD.

### Outline list

******Positive****: add 12 tests to empty plan (header count reflects) · add single test, clear empty state · same test member of two plans independently · remove test, library entity unchanged.

******Negative****: mark already-included test in picker (UI) · reject duplicate add via API · hide Add/Remove for viewer (UI) · reject viewer direct-API add/remove · reject change on Closed plan · reject cross-project Test add.

******Boundary****: return to empty state on last-test removal · transition out of empty state on first add.

******Integration****: search test library by name/tag (ATC-search pattern) · propagate one mutation's count to both plan header and plans list.

> Parametrization tables, test-data JSON, Faker recipes deferred to `/sprint-testing` Stage 1.

---

## Phase 5 — Edge Cases

| ***#**** | ****Edge case**** | ****In original Story?**** | ****Criticality**** | ****Action*** |
| --- | --- | --- | --- | --- |
| 1 | Removing last test -> empty state, no count drift | No (business-rules.md only) | High | Add to AC (PO confirmed) |
| 2 | Viewer direct-API add/remove attempt | No | High | Test only (RBAC precedent) |
| 3 | Concurrent add of same test by 2 members | No | Medium | Test only (PO confirmed: unique-constraint backstop) |
| 4 | Picker search, 0 results | No | Low | Test only (PO confirmed copy: "No tests match.") |
| 5 | Membership change on Closed plan | No | Critical | Add to AC (PO confirmed: hidden + server-rejected) |
| 6 | Cross-project Test via direct API | No | High | Add to AC (PO confirmed: both layers enforced) |

---

## Story Quality Assessment

******Verdict****: Needs Improvement (unchanged — spec-quality gaps unaffected by [https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202](https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202) shipping). The 5 given ACs are clear but only cover happy paths + one duplicate case; Closed-plan rejection and cross-project isolation live only in business-rules.md/out-of-scope.md prose, not as testable ACs (both answered by PO, but not yet promoted to formal ACs — see Suggested Story Improvements).

******Update****: no longer blocked on two unshipped dependencies (Tests, [https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202](https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202)) — both live and QA-verified. Remaining gap is building this Story's own membership entity — normal in-sprint work.

---

## Critical Questions for PO — ANSWERED (2026-08-16)

1. ******Closed-plan editing****: ****hidden vs shown-then-rejected?****

******Answer****: Hidden entirely in UI, server-side rejection as backstop — matches this product's viewer-write-blocking pattern everywhere else.

1. ******Cross-project isolation****: ****picker-scope-only or also server-validated?****

******Answer****: Both layers — picker scoping for UX, mandatory server-side validation on every write. Cross-tenant isolation is this product's highest-severity failure class.

---

## Technical Questions for Dev — ANSWERED (2026-08-16; 1 addendum 2026-08-23)

1. ******Error shape for the 3 rejection paths****:
2. ******Double-submit idempotency*****:** **reuse existing** `Idempotency-Key` **header middleware (already used by Runs domain) + DB** **`***unique(plan*id, test*id)` constraint as backstop.
3. ******Empty-results copy****: `"No tests match."` (italic) — matches the existing search-picker precedent style.

---

## Suggested Story Improvements

| ***#**** | ****Current state**** | ****Suggested change**** | ****Benefit*** |
| --- | --- | --- | --- |
| 1 | Closed-plan rejection only in business-rules.md/out-of-scope.md prose | Add explicit AC | Makes a Critical gate directly testable/traceable |
| 2 | Cross-project scoping stated as rule, no enforcement layer named | Add explicit AC naming both layers | Closes a recurring gap class for this codebase |
| 3 | "Empty state on last removal" is design-intent prose only | Promote to AC (fold into AC4) | N=1->0 boundary shouldn't depend on a QA engineer noticing it |

---

## Data Feasibility Flags

******DATA-FEASIBILITY-RISK****: ****confirmed — narrowed and partially resolved (2026-08-23).****

- ******Resolved****: both originally-cited blockers — [https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202](https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202) (plan container, now `QA Approved`) and the Tests epic ([https://jira.upexgalaxy.com/browse/BK-24#icft=BK-24](https://jira.upexgalaxy.com/browse/BK-24#icft=BK-24), live) — are shipped and QA-verified.
- ******Still missing****: this Story's own deliverable (membership join table + add/remove/search endpoints) does not exist yet in the target codebase. Blocks execution, not design.
- ******Workaround available****: Scenario E1 (Closed-plan) is testable pre-BK-207 via direct DB seed of `status='closed'` — explicitly endorsed by the shipped migration's own author comment.
- ******Required pre-work****: build this Story's own membership table + RPCs + routes (normal in-sprint/automation scope).

---

## Recommended Testing Strategy

******Pre-implementation****: Critical Questions answered (done). Sequencing confirmed satisfied — clear to proceed to estimation / Ready For Dev.

******During implementation*****:** **Dev confirms the 2 remaining error-code contracts early (cross-project code not yet assigned). Model the membership table on the shipped** **`***test*plans{{ RLS/RPC/errcode shape; the }}run*atcs` precedent still applies for reference-not-snapshot semantics only (this Story's membership is a reference, not a copy).

******Post-implementation**** (in-sprint by `/sprint-testing`): re-validate Refined ACs against the actual implementation; expand Phase 4 into full parametrized outlines; explicitly re-test the RBAC + Closed-plan double-gate as two separate assertions (UI absence AND API rejection).

---

## Risks & Mitigation

| ***#**** | ****Risk**** | ****Likelihood**** | ****Impact**** | ****Mitigated by*** |
| --- | --- | --- | --- | --- |
| 1 | Closed-plan edits only gated in UI, no server enforcement | Medium | High | "Reject change on Closed plan" (Negative) |
| 2 | Cross-project Test leak via direct API | Low-Medium | High (tenant isolation breach) | "Reject cross-project Test add" (Negative) |
| 3 | Duplicate row on rapid double-submit | Low | Medium | "No duplicate on double-submit" (Edge) |
| 4 | Live count drifts between plan header and plans list | Low | Medium | "Propagate count to both surfaces" (Integration) |

---

## Next Steps

- [x] PO answered Critical Questions (2026-08-16)
- [x] Dev answered Technical Questions (2026-08-16; Q1 error-code addendum 2026-08-23)
- [x] Refinement resumed 2026-08-23 — [https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202](https://jira.upexgalaxy.com/browse/BK-202#icft=BK-202) dependency resolved
- [ ] Story enters sprint at `Ready For Dev` once estimated — no remaining blocker
- [ ] When Story reaches `Ready For QA`, `/sprint-testing` short-circuits refinement (label `shift-left-reviewed` detected)
- [ ] (Non-blocking) Promote the 2 Suggested Story Improvements into formal ACs on a future Jira sync

> Full investigative detail (exact file/line citations, migration analysis) lives in the local session artifact `shift-left-refinement.md` under this Story's PBI folder — this field carries the canonical decision-relevant content within Jira's field size limit.

---

**Synced from Jira by sync-jira-issues**

---

## Related Issues

- is tested by: [BK-203](https://jira.upexgalaxy.com/browse/BK-203) - TMS-Test Plan | Add and remove tests from a plan

---

## Metadata

- **Created:** 31/8/2026
- **Updated:** 31/8/2026
- **Reporter:** Alfonso Hernandez
- **Assignee:** Unassigned

---

_Synced from Jira by sync-jira-issues_

---
_Source: Xray Test Plan [BK-759](https://jira.upexgalaxy.com/browse/BK-759) description · ATP · synced by sync-jira-issues_
