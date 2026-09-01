# ACCEPTANCE TEST PLAN (ATP): ATP: BK-315: TMS-ATC Library | Export a Project's ATCs to CSV

**Jira Key:** [BK-787](https://jira.upexgalaxy.com/browse/BK-787)
**Status:** Planning
**Components:** None

> Run results / coverage are NOT synced — read those via xray-cli. This file mirrors the issue description.

---

## Description

# ATP: [https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315](https://jira.upexgalaxy.com/browse/BK-315#icft=BK-315) — TMS-ATC Library | Export a Project's ATCs to CSV

***Status***: ACTIVE — Stage 1 Planning complete. Seeded from the Shift-Left DRAFT (`{{jira.acceptance*test*plan`}} field, refined 2026-08-16). PO and Dev answered every Critical/Technical Question the same day (see Story comments). Tech Lead added a CSV formula-injection security fix on 2026-08-27, covered below as test-beyond-AC.

***Refined on***: 2026-08-16 — QA Shift-Left batch session
***Stage 1 wired on***: 2026-08-30
***Modality***: Jira-xray — this Test Plan's list is derived from the ATS ([https://jira.upexgalaxy.com/browse/BK-786#icft=BK-786](https://jira.upexgalaxy.com/browse/BK-786#icft=BK-786)) membership, never hand-maintained.

## Coverage estimate

| ***Type**** | ****Count**** | ****Notes*** |
| --- | --- | --- |
| Positive | 6 | Happy-path variants: full export, column order, tag join, status pass-through, empty-with-no-error, combined-chars baseline |
| Negative | 6 | Non-disclosure denial (3 EP-distinct causes), unauthenticated 401, security non-leak charter, slow-generation anomaly |
| Boundary | 9 | n=1, n=0, 3 isolated escape-character classes, title x tags decision-table interaction, tag-own-text escaping, representative-large (500), very-large (5,000+) |
| Integration | 1 | Browser-native file download from the API response |
| Edge (idempotency) | 1 | Double-click / repeated trigger |
| ***Test-beyond-AC (security)*** | 2 | CSV formula-injection prefix-quote neutralization — NOT in original ACs, added from the 2026-08-27 Tech-Lead comment (PR #207 review, MAJOR finding) |
| ***Total**** | ****24*** | 5 original ACs -> 22 AC-derived Tests + 2 test-beyond-AC security Tests |

## Test mapping (Jira key -> AC scenario)

| ***Test**** | ****Scenario**** | ****Priority*** |
| --- | --- | --- |
| [https://jira.upexgalaxy.com/browse/BK-761#icft=BK-761](https://jira.upexgalaxy.com/browse/BK-761#icft=BK-761) (TC1) | 1.1 — 12-ATC full export, all columns populated | Critical |
| [https://jira.upexgalaxy.com/browse/BK-763#icft=BK-763](https://jira.upexgalaxy.com/browse/BK-763#icft=BK-763) (TC2) | 1.2 — n=1 boundary | High |
| [https://jira.upexgalaxy.com/browse/BK-764#icft=BK-764](https://jira.upexgalaxy.com/browse/BK-764#icft=BK-764) (TC3) | 1.3 — fixed column order | High |
| [https://jira.upexgalaxy.com/browse/BK-765#icft=BK-765](https://jira.upexgalaxy.com/browse/BK-765#icft=BK-765) (TC4) | 1.4 — tag join delimiter {{; }} | Medium |
| [https://jira.upexgalaxy.com/browse/BK-766#icft=BK-766](https://jira.upexgalaxy.com/browse/BK-766#icft=BK-766) (TC5) | 1.5 — status enum pass-through (Scenario Outline, 6 Examples rows) | Low |
| [https://jira.upexgalaxy.com/browse/BK-767#icft=BK-767](https://jira.upexgalaxy.com/browse/BK-767#icft=BK-767) (TC6) | 2.1 — header-only export, n=0 | Critical |
| [https://jira.upexgalaxy.com/browse/BK-768#icft=BK-768](https://jira.upexgalaxy.com/browse/BK-768#icft=BK-768) (TC7) | 2.2 — no error indicator on empty export | Medium |
| [https://jira.upexgalaxy.com/browse/BK-769#icft=BK-769](https://jira.upexgalaxy.com/browse/BK-769#icft=BK-769) (TC8) | 3.1 — 404 non-member | Critical |
| [https://jira.upexgalaxy.com/browse/BK-770#icft=BK-770](https://jira.upexgalaxy.com/browse/BK-770#icft=BK-770) (TC9) | 3.2 — 404 nonexistent Project | Critical |
| [https://jira.upexgalaxy.com/browse/BK-771#icft=BK-771](https://jira.upexgalaxy.com/browse/BK-771#icft=BK-771) (TC10) | 3.3 — 404 removed member | Critical |
| [https://jira.upexgalaxy.com/browse/BK-772#icft=BK-772](https://jira.upexgalaxy.com/browse/BK-772#icft=BK-772) (TC11) | 3.4 — 401 unauthenticated | Critical |
| [https://jira.upexgalaxy.com/browse/BK-773#icft=BK-773](https://jira.upexgalaxy.com/browse/BK-773#icft=BK-773) (TC12) | 3.5 — non-leak charter across denial causes | Medium |
| [https://jira.upexgalaxy.com/browse/BK-774#icft=BK-774](https://jira.upexgalaxy.com/browse/BK-774#icft=BK-774) (TC13) | 4.0 — comma + quote + line break combined | Critical |
| [https://jira.upexgalaxy.com/browse/BK-775#icft=BK-775](https://jira.upexgalaxy.com/browse/BK-775#icft=BK-775) (TC14) | 4.1 — comma only | High |
| [https://jira.upexgalaxy.com/browse/BK-776#icft=BK-776](https://jira.upexgalaxy.com/browse/BK-776#icft=BK-776) (TC15) | 4.2 — quote only | High |
| [https://jira.upexgalaxy.com/browse/BK-777#icft=BK-777](https://jira.upexgalaxy.com/browse/BK-777#icft=BK-777) (TC16) | 4.3 — line break only | High |
| [https://jira.upexgalaxy.com/browse/BK-778#icft=BK-778](https://jira.upexgalaxy.com/browse/BK-778#icft=BK-778) (TC17) | 4.4 — Title x Tags decision-table interaction | High |
| [https://jira.upexgalaxy.com/browse/BK-779#icft=BK-779](https://jira.upexgalaxy.com/browse/BK-779#icft=BK-779) (TC18) | 4.5 — tag's own text escaping | High |
| [https://jira.upexgalaxy.com/browse/BK-780#icft=BK-780](https://jira.upexgalaxy.com/browse/BK-780#icft=BK-780) (TC19) | 5.1 — 500-ATC representative large library | Critical |
| [https://jira.upexgalaxy.com/browse/BK-781#icft=BK-781](https://jira.upexgalaxy.com/browse/BK-781#icft=BK-781) (TC20) | 5.2 — 5,000+ ATC behavior | High |
| [https://jira.upexgalaxy.com/browse/BK-782#icft=BK-782](https://jira.upexgalaxy.com/browse/BK-782#icft=BK-782) (TC21) | 5.3 — slow-generation, no partial/corrupted file | High |
| [https://jira.upexgalaxy.com/browse/BK-783#icft=BK-783](https://jira.upexgalaxy.com/browse/BK-783#icft=BK-783) (TC22) | 5.4 — repeated-trigger idempotency | Medium |
| [https://jira.upexgalaxy.com/browse/BK-784#icft=BK-784](https://jira.upexgalaxy.com/browse/BK-784#icft=BK-784) (TC23) | ***Test-beyond-AC*** — formula-injection trigger chars `= + - @ TAB CR` (Scenario Outline) | High |
| [https://jira.upexgalaxy.com/browse/BK-785#icft=BK-785](https://jira.upexgalaxy.com/browse/BK-785#icft=BK-785) (TC24) | ***Test-beyond-AC*** — formula-injection prefix-quote combined with RFC4180 escaping | High |

## Test-beyond-AC addendum — CSV formula-injection neutralization

Not present in any original AC or in this ATP's Shift-Left DRAFT. Discovered from the Story's 2026-08-27 Tech-Lead comment: a PR #207 conductor review flagged (MAJOR) that `csvEscapeField` performed RFC4180 quoting only, leaving a cell starting with `= + - @` (tab/CR) able to execute as a formula when the export is opened in Excel/Sheets — a real exfiltration risk since ATC `title`/`tags` are member-writable free text and this export exists specifically to be opened in a spreadsheet. The fix (implemented in `lib/atcs/csv-export.ts`) prepends a literal `'` before RFC4180 escaping whenever a cell's leading character is a trigger character. This is a risk-beyond-AC item per the test-design doctrine (security dimension not captured by the Story's own ACs) and is covered by [https://jira.upexgalaxy.com/browse/BK-784#icft=BK-784](https://jira.upexgalaxy.com/browse/BK-784#icft=BK-784)/[https://jira.upexgalaxy.com/browse/BK-785#icft=BK-785](https://jira.upexgalaxy.com/browse/BK-785#icft=BK-785), HIGH priority.

## Critical/Technical Questions — RESOLVED (2026-08-16, see Story comments for full text)

1. Tag-join delimiter -> `"; "` (semicolon-space). PO decision.
2. Tag content charset -> unrestricted, same RFC4180 escaping as Title. PO decision.
3. Library size ceiling -> no hard cap for MVP; export must succeed regardless of size, best-effort, no formal SLA. PO decision (supersedes Dev's proposed row-cap, per the Tech Lead's 2026-08-27 endpoint-design comment).
4. Non-disclosure 404 convention -> reuse `mapCoverageRpcError`'s `P0002` -> 404 pattern. Dev confirmed.
5. Unauthenticated status -> 401, free via `withApiHandler`'s auth gateway. Dev confirmed.
6. Export trigger lock -> `disabled={loading`} while in flight. Dev confirmed.
7. Performance/timeout budget -> no formal SLA; best-effort. PO ruling on Q3 governs.

## Data feasibility

No risks — data model fully implemented. `atcs` (`module_id`, `layer`, `status`, `tags` all `NOT NULL`/defaulted), Project/workspace membership, and the RLS + RPC access-control pattern all pre-exist.

## Coverage backbone

The Story's ATS is ***BK-786*** (`ATS: BK-315: TMS-ATC Library | Export a Project's ATCs to CSV`) — the single source of truth for the 24 Tests listed above. This Test Plan's list is derived from ATS membership via `plan add-set`, never hand-maintained.

---

Full pre-sprint narrative: `.context/PBI/epics/EPIC-BK-13-atc-library-acceptance-test-cases/stories/STORY-BK-315-tms-atc-library-export-a-project-s-atcs-to-csv/shift-left-refinement.md`

---

## Related Issues

- is tested by: [BK-315](https://jira.upexgalaxy.com/browse/BK-315) - TMS-ATC Library | Export a Project's ATCs to CSV

---

## Metadata

- **Created:** 31/8/2026
- **Updated:** 31/8/2026
- **Reporter:** Alfonso Hernandez
- **Assignee:** Unassigned

---

_Synced from Jira by sync-jira-issues_

---
_Source: Xray Test Plan [BK-787](https://jira.upexgalaxy.com/browse/BK-787) description · ATP · synced by sync-jira-issues_
