# ACCEPTANCE TEST PLAN (ATP): ATP: BK-229: Billing view my workspace plan seats and usage

**Jira Key:** [BK-738](https://jira.upexgalaxy.com/browse/BK-738)
**Status:** Planning
**Components:** None

> Run results / coverage are NOT synced — read those via xray-cli. This file mirrors the issue description.

---

## Description

# Acceptance Test Plan — [https://jira.upexgalaxy.com/browse/BK-229#icft=BK-229](https://jira.upexgalaxy.com/browse/BK-229#icft=BK-229) (Billing overview)

***Story:*** Billing | View my workspace plan, seats, and usage
***Environment:**** staging · ****Modality:**** jira-xray · ****TC format:*** Manual

## Risk

MEDIUM. Read-only surface, no money movement; the critical surfaces are access control (owner/admin vs member) and meter accuracy (seat counting + boundary states).

## Authoritative naming (drift correction)

The ACs predate the shipped tier ladder. Per domain-glossary §3 and `lib/billing/plan-tiers.ts`, the binding values are:

- `community` (Community): 5 seats, 3 projects, 30-day retention, $0/month, "No active subscription"
- `cloud` (Cloud): 25 seats, 50 projects, 90-day retention, $24/seat/month, no renewal row
- `enterprise` (Enterprise): unlimited, "Custom", "Per contract"

Drift from the literal ACs (recorded as findings, tested against the product): "Free/Team/Enterprise" → Community/Cloud/Enterprise; "10-seat limit" → 25 (cloud); "next renewal date" → not rendered for cloud.

## Surfaces

UI (Playwright) + API (curl, `GET /api/v1/workspaces/{id}/billing`) + DB (Postgres seed/validate).

## Coverage map (18 TCs → ACs)

| ***TC**** | ****AC**** | ****Type*** |
| --- | --- | --- |
| TC01 Cloud plan card | AC1 | Positive |
| TC02 Enterprise plan card | AC2/AC6 | Positive |
| TC03 Community plan card | AC3/AC6 | Positive |
| TC04 seats: pending excluded | AC10 | Boundary |
| TC05 seats: suspended excluded | AC11 | Boundary |
| TC06 seats: zero active | AC12 | Boundary |
| TC07 seats: exceeded | AC13 | Boundary |
| TC08 projects 80-99% | AC3 | Boundary |
| TC09 projects exactly 80% | AC15 | Boundary |
| TC10 projects 100% | AC4 | Boundary |
| TC11 projects exceeded | AC5 | Boundary |
| TC12 retention paid (90d) | AC16 | Positive |
| TC13 retention community (30d) | AC17 | Positive |
| TC14 owner can view | AC7 | Positive |
| TC15 admin can view | AC8 | Positive |
| TC16 member cannot view | AC9 | Negative |
| TC17 API failure | AC14 | Negative |
| TC18 API timeout | AC18 | Negative |

7 Positive / 3 Negative / 8 Boundary = 18 TCs.

---

## Related Issues

- is tested by: [BK-229](https://jira.upexgalaxy.com/browse/BK-229) - Billing | View my workspace plan, seats, and usage

---

## Metadata

- **Created:** 30/8/2026
- **Updated:** 31/8/2026
- **Reporter:** pinto.lucas.nahuel
- **Assignee:** Unassigned

---

_Synced from Jira by sync-jira-issues_

---
_Source: Xray Test Plan [BK-738](https://jira.upexgalaxy.com/browse/BK-738) description · ATP · synced by sync-jira-issues_
