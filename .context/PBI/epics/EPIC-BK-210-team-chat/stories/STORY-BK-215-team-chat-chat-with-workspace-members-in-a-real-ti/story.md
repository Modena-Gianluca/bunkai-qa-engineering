# Team Chat | Chat with workspace members in a real-time channel

**Jira Key:** [BK-215](https://jira.upexgalaxy.com/browse/BK-215)
**Epic:** [BK-210](https://jira.upexgalaxy.com/browse/BK-210) (Team Chat)
**Type:** Story
**Status:** Estimation
**Priority:** Medium
**Story Points:** -
**Web Link:** https://staging-upexbunkai.vercel.app/

---

## Overview

## User Story

As a ***workspace member***
I want to ***chat with my team in a real-time general channel***
So that ***we can collaborate without leaving Bunkai***

## Context

- ***Workspace******:*** BK-210 Team Chat
- ***Sprint******:*** Pre-sprint (Shift-Left QA)
- ***Parent Epic******:*** EPIC-BK-210
- ***Primary Persona******:*** Elena Vargas, Senior QA Engineer
- ***Secondary Personas******:*** QA engineers, workspace members who need real-time operational conversation
- ***Business Value******:*** Operational questions ("is staging down?") get answered where the QA work lives — no tool-switching.
- ***KPIs******:*** Time-to-answer, context retention, reduced tool-switching friction
- ***Position******:*** Foundation story — every subsequent story (BK-216 project channels, BK-217 threads) builds on this.

## Critical Analysis

### Technical Context

- ***Frontend******:*** Right-side collapsible panel in App Shell (BK-147). Channel header + scrollable message list (newest at bottom) + composer pinned to bottom. Presence dots on member avatars. Unread separator line.
- ***Backend******:*** No confirmed chat API endpoints exist in the baseline. New DB tables required: `channels`, `messages`, `channel_members`.
- ***Database******:*** New tables needed — no schema exists yet. Workspace membership model (BK-1) is the upstream dependency for channel access.
- ***External services******:*** Supabase Auth/Postgres/RLS are relevant because channel visibility depends on workspace membership. Supabase Realtime (broadcast) is configured but not wired for chat.
- ***Integration points******:*** Workspace membership (BK-1) for access control; App Shell (BK-147) for panel hosting; Supabase Realtime for message delivery.

### Evidence-Confirmed Facts

- Supabase Realtime is configured in migration 0043 for broadcast channels.
- Chat features are marked as post-MVP in business-model.md — new DB tables (channels, messages, channel_members) are not yet in migrations.
- Workspace membership model (BK-1) exists and provides the RBAC ladder (viewer, member, admin, owner).
- App Shell with tabbed explorer patterns (BK-147) exists and can host a right-side panel.
- No confirmed chat API endpoints, message delivery pipeline, or Realtime chat subscription exists in the baseline.
- No confirmed presence tracking system exists in the baseline.

### Story Complexity

| Axis | Rating | Why |
| --- | --- | --- |
| Business logic | Medium | Clear user value but new domain (chat) with undefined API contracts and DB schema. |
| Integration | High | Depends on workspace membership, App Shell, Supabase Realtime, and new DB tables — all need wiring. |
| Data validation | Medium | Message length bounds (1-4000 chars), empty/whitespace rejection, ordering guarantees, history retention. |
| UI | Medium | Panel layout designed, but interaction states (typing, presence, unread, reconnect) need definition. |

***Estimated test effort******:*** High — new domain, missing infrastructure, RBAC risk.

### Epic-Level Inheritance

- ***Risks******:*** Chat is a new domain — no existing chat infrastructure, no message delivery pipeline, no presence system. All must be built from scratch.
- ***Integration points******:*** Workspace membership (BK-1) → channel access; App Shell (BK-147) → panel hosting; Supabase Realtime → message delivery.
- ***Test strategy******:*** Treat workspace membership as upstream dependency; do not finalize message delivery assertions until API contract and Realtime subscription are confirmed.

---

## Critical Findings

| # | Finding | Impact | Action |
| --- | --- | --- | --- |
| 1 | No DB schema exists for channels, messages, or channel_members | Blocks all data-layer testing | Confirm schema design before sprint estimation |
| 2 | No chat API endpoints exist in the baseline | Blocks API contract testing | Confirm endpoint paths, auth, response shapes |
| 3 | Supabase Realtime is configured for broadcast, not chat | May need different Realtime subscription pattern | Confirm Realtime usage for chat vs broadcast |
| 4 | Presence tracking system does not exist | Roster online/offline status is untestable | Confirm presence implementation approach |
| 5 | Message ordering under concurrent sends is undefined | Ordering assertions are unstable | Confirm ordering guarantees (server timestamp vs client) |
| 6 | Pagination strategy for history is not defined | Scroll-up-to-load behavior is untestable | Confirm cursor format and page size |

---

## Ambiguities (9)

| # | Location | Question for PO/Dev | Impact on testing | Suggested clarification |
| --- | --- | --- | --- | --- |
| 1 | AC1 "without refreshing the page" | Does this mean WebSocket/SSE, or polling? | Cannot decide auto vs manual refresh testing | Confirm delivery mechanism (Supabase Realtime broadcast) |
| 2 | AC2 "oldest messages load as she scrolls up" | Infinite scroll, pagination, or lazy loading? Page size? | Cannot test pagination boundaries | Confirm pagination strategy and page size |
| 3 | AC3 "currently online" | Real-time via Supabase Presence, or last-seen timestamp? | Cannot test presence accuracy | Confirm presence implementation |
| 4 | AC4 "composer is disabled with a hint" | What exact copy does the hint show? Where positioned? | Cannot assert exact UI text | Define hint copy and placement |
| 5 | AC5 "connection drops for 2 minutes" | How is connection drop simulated? What is the reconnection window? | Cannot design reconnection test | Define reconnection semantics and timeout |
| 6 | AC5 "Elena does not need to refresh" | Does the client automatically reconnect and fetch missed messages? | Cannot test catch-up behavior | Confirm auto-reconnect and catch-up mechanism |
| 7 | Business Rules "order they were sent" | Server-assigned timestamp, client timestamp, or sequence number? | Ordering assertions depend on this | Confirm ordering mechanism |
| 8 | Business Rules "retained for life of Workspace" | Maximum message count or storage limit? | Cannot test large-history scenarios | Confirm retention policy details |
| 9 | Mockup "send on Enter, newline on Shift+Enter" | Confirmed behavior or design intent? | Cannot test keyboard shortcuts | Confirm keyboard interaction model |

---

## Gaps (9 — missing info)

| # | Type | Why critical | What to add | Risk if omitted |
| --- | --- | --- | --- | --- |
| 1 | DB schema | No tables exist for channels, messages, channel_members | Schema design with columns, types, constraints, indexes | Implementation and QA invent different data models |
| 2 | API contract | No chat endpoints exist | Endpoint paths, methods, auth, request/response shapes | Implementation and QA invent different contracts |
| 3 | Realtime subscription | Configured for broadcast, not chat | Confirm channel naming, event types, payload shape | Message delivery may not work as expected |
| 4 | Presence system | No online/offline tracking exists | Presence implementation approach | Roster online status is untestable |
| 5 | Message ordering | Ordering guarantee is not defined | Confirm server timestamp vs sequence number | Ordering assertions become subjective |
| 6 | Pagination | Scroll-up behavior is not defined | Cursor format, page size, loading states | History loading cannot be tested |
| 7 | Error states | No error handling is defined | Network error, auth failure, send failure, disconnect | User may see broken UI on failure |
| 8 | Loading states | No loading indicators defined | Message loading, history loading, send-in-progress | UX may feel broken during loads |
| 9 | Empty state copy | "friendly prompt" is vague | Exact copy for empty channel | Cannot assert exact UI text |

---

## Edge Cases (10 — not in original Story)

| # | Scenario | Expected behavior | Criticality | Action |
| --- | --- | --- | --- | --- |
| 1 | Two users send at exact same millisecond | Deterministic order via server timestamp tie-breaker | High | PO/Dev confirmation needed |
| 2 | User sends message while disconnected | Queued and sent on reconnect, or user notified of failure | High | PO/Dev confirmation needed |
| 3 | User has 10,000+ messages in history | History loads progressively without degradation | Medium | PO/Dev confirmation needed |
| 4 | User opens channel with 0 messages | Empty state with friendly prompt appears | Medium | PO/Dev confirmation needed |
| 5 | User is the only member in workspace | Channel shows 1 member, no other online indicators | Low | PO/Dev confirmation needed |
| 6 | Role changes from member to viewer while open | Composer becomes disabled in real-time | High | PO/Dev confirmation needed |
| 7 | Workspace deleted while user has channel open | Channel becomes inaccessible, redirect or error shown | Medium | PO/Dev confirmation needed |
| 8 | User opens same channel in two tabs | Messages appear in both without duplication | Medium | PO/Dev confirmation needed |
| 9 | Message exceeds 4000 characters | Send button disabled or error shown | Medium | PO/Dev confirmation needed |
| 10 | User pastes whitespace-only message | Message rejected with clear error | Medium | PO/Dev confirmation needed |

---

## Contradictions

- Story says "real-time channel" but business-model.md marks chat as post-MVP with no DB tables. The story assumes infrastructure that does not exist yet.
- Mockup says "send on Enter, newline on Shift+Enter" but this is not confirmed in the ACs or business rules.
- Business Rules say "history is retained for the life of the Workspace" but no storage limits or purge policy are defined.

---

## Testability Validation

***Verdict******:*** Partial

Issues blocking full testability:

- No DB schema exists for channels, messages, or channel_members.
- No chat API endpoints exist in the baseline.
- Supabase Realtime is configured for broadcast, not chat — subscription pattern undefined.
- Presence tracking system does not exist.
- Message ordering guarantee is not defined.
- Pagination strategy and page size are not defined.
- Error and loading states are not defined.
- Empty state copy is not defined.

---

## Open Questions — 26 (Pending PO/Dev/Design Answers)

> These questions BLOCK sprint planning and estimation until answered.

| # | Category | Question |
| --- | --- | --- |
| 1 | ***PO - Product*** | Should the general channel be a special case of a `channels` table or a separate concept? |
| 2 | ***PO - Product*** | What is the message ordering guarantee when multiple users send simultaneously — server timestamp, client timestamp, or sequence number? |
| 3 | ***PO - Product*** | What is the pagination strategy for message history — cursor-based or offset-based, and what is the page size? |
| 4 | ***PO - Product*** | Is message validation client-side only, server-side only, or both? |
| 5 | ***PO - Product*** | What is the maximum disconnection window before requiring a manual refresh? |
| 6 | ***PO - Product*** | How should the empty channel state be worded — what is the exact copy? |
| 7 | ***PO - Product*** | Should presence dots reflect real-time online status via Supabase Presence or a last-seen timestamp? |
| 8 | ***PO - Product*** | What happens when a user's role changes from member to viewer while the channel is open? |
| 9 | ***PO - Product*** | Should messages be queued for delivery when the user is disconnected, or should the user be notified of failure? |
| 10 | ***Dev - Tech*** | What DB schema will be used for channels, messages, and channel_members — columns, types, constraints, indexes? |
| 11 | ***Dev - Tech*** | What API endpoints will power the chat — paths, methods, auth, request/response shapes? |
| 12 | ***Dev - Tech*** | How will Supabase Realtime be wired for chat message delivery — channel naming, event types, payload shape? |
| 13 | ***Dev - Tech*** | How will presence tracking be implemented — states, thresholds, multi-tab handling? |
| 14 | ***Dev - Tech*** | What is the message ordering mechanism for sub-second simultaneity — tie-breaker on simultaneous inserts? |
| 15 | ***Dev - Tech*** | What cursor format and page size will be used for history pagination — encoding, cross-workspace validation? |
| 16 | ***Dev - Tech*** | How will RLS policies be implemented for channel access — policies for SELECT, INSERT, UPDATE on each table? |
| 17 | ***Dev - Tech*** | What error codes and shapes will the API return for auth failures, validation errors, and server errors? |
| 18 | ***Dev - Tech*** | Will there be a typing indicator or message delivery confirmation — IN SCOPE or OUT for v1? |
| 19 | ***Dev - Tech*** | What performance SLAs apply to message delivery and history loading — P95/P99 targets? |
| 20 | ***Dev - Tech*** | Will the chat panel meet WCAG 2.1 AA accessibility — keyboard navigation, screen reader support? |
| 21 | ***Design - UI/UX*** | What exact copy does the viewer read-only hint show — placement, icon, button visibility? |
| 22 | ***Design - UI/UX*** | How should the empty channel state be visually represented — card design, icon, quick prompt chips? |
| 23 | ***Design - UI/UX*** | How should the roster behave — flyout overlay or persistent sidebar? |
| 24 | ***Design - UI/UX*** | How should the unread separator line be styled and positioned — color, badge, auto-scroll, expiration? |
| 25 | ***Design - UI/UX*** | Should the panel remember its open/closed state across page navigations — localStorage key, shortcut, badge? |
| 26 | ***Design - UI/UX*** | How should the panel behave on narrow viewports — desktop docked, laptop overlay, tablet drawer, mobile full-screen? |

---

## Suggested Story Improvements

| # | Current state | Suggested change | Benefit |
| --- | --- | --- | --- |
| 1 | "real-time channel" | Define delivery mechanism (Supabase Realtime broadcast) | Removes ambiguity about implementation |
| 2 | "without refreshing the page" | Define reconnection mechanism and catch-up window | Makes AC5 testable |
| 3 | "currently online" | Define presence implementation (Supabase Presence) | Makes AC3 testable |
| 4 | "oldest messages load as she scrolls up" | Define pagination strategy and page size | Makes AC2 testable |
| 5 | "friendly prompt" for empty state | Provide exact copy | Makes empty state assertable |
| 6 | "messages display in the order they were sent" | Define ordering mechanism (server timestamp) | Makes ordering assertions objective |
| 7 | No error states defined | Add AC for network error, auth failure, send failure | Prevents broken UI on failure |
| 8 | No loading states defined | Add AC for message loading, history loading, send-in-progress | Prevents UX gaps during loads |

---

## Data Feasibility Flags

- ***Entity / fixture missing******:*** No `channels`, `messages`, or `channel_members` tables exist in the database schema.
- ***API contract gap******:*** No chat API endpoints exist — message send, history load, roster, presence are all undefined.
- ***Required pre-work******:*** Design and implement DB schema; implement chat API endpoints; wire Supabase Realtime for chat delivery; implement presence tracking.
- ***Data risk******:*** All data-layer testing is blocked until schema and API contracts defined. Story cannot be estimated without this pre-work.

---

## Assumptions

1. Workspace membership (BK-1) is complete and provides the RBAC ladder.
2. App Shell (BK-147) can host a right-side panel.
3. Supabase Realtime (migration 0043) can be extended for chat delivery.
4. The general channel is created automatically with the workspace.
5. Message history is retained indefinitely in v1 (no auto-purge).

## Blockers

1. DB schema design for channels, messages, channel_members — blocks all data-layer testing.
2. API endpoint contracts — blocks API contract testing.
3. Supabase Realtime wiring for chat — blocks Realtime delivery testing.
4. Presence implementation approach — blocks roster online/offline testing.
5. Message ordering mechanism — blocks ordering assertions.

---

## Risks & Mitigation

| # | Risk | Likelihood | Impact | Mitigated by |
| --- | --- | --- | --- | --- |
| 1 | DB schema missing — blocks all testing | High | Critical | Integration, Security-RBAC |
| 2 | API contracts undefined | High | Critical | Integration, Tech Q#2 |
| 3 | Realtime misconfigured | Medium | Critical | Integration, Positive #1 |
| 4 | Presence inaccurate | Medium | High | Positive #6, Tech Q#4 |
| 5 | Ordering inconsistent | Medium | High | Positive #7, Edge #1 |
| 6 | Viewer bypass via API | Medium | Critical | Security-RBAC, Negative #2 |
| 7 | Pagination breaks large histories | Medium | High | Boundary, Edge #3 |
| 8 | Role changes not real-time | Medium | High | State-Transition #2 |
| 9 | NFRs undefined | Medium | Medium | NFR1-4, Tech Q#10-11 |

---

## Traceability Map

| Original AC | Refined Scenarios | Test Outlines |
| --- | --- | --- |
| ***AC1******:*** Real-time message delivery | 1.1–1.7 | Positive #1,#2; Negative #1,#3; Boundary #1–3 |
| ***AC2******:*** Message history persistence | 2.1–2.3 | Positive #3,#4; Boundary #4 |
| ***AC3******:*** Workspace roster | 3.1–3.2 | Positive #5; State-Transition #3 |
| ***AC4******:*** Viewer read-only access | 4.1–4.3 | Positive #6; Negative #2; Security-RBAC #1 |
| ***AC5******:*** Reconnection catch-up | 5.1–5.2 | Positive #7; Boundary #5; State-Transition #1 |
| ***E1******:*** Offline queue | E1 | Edge #2 |
| ***E2******:*** Role propagation | E2 | State-Transition #2; Edge #6 |
| ***E3******:*** Validation layers | E3 | Boundary #3; Edge #9 |
| ***E4******:*** NFR Performance | E4 | NFR1 |
| ***E5******:*** NFR History load | E5 | NFR2 |
| ***E6******:*** NFR Keyboard | E6 | NFR3 |
| ***E7******:*** NFR Screen reader | E7 | NFR4 |

---

## Next Steps

- PO answers Critical Questions before sprint planning
- PO/Dev confirm NFR proposals (E4-E7, NFR1-NFR4) — confirmation upgrades to contract
- Dev answers Technical Questions before estimation
- DB schema design confirmed and implemented
- API endpoint contracts confirmed and implemented
- Supabase Realtime wiring confirmed
- Story enters sprint at `Ready For Dev` once estimated
- At `Ready For QA`, `/sprint-testing` short-circuits refinement (label `shift-left-reviewed`)

---

## Fields

> Each rich-text field is a separate file in this folder.

- [Acceptance Criteria](./acceptance-criteria.md)
- [Business Rules](./business-rules.md)
- [Scope](./scope.md)
- [Out Of Scope](./out-of-scope.md)
- [Workflow](./workflow.md)
- [Mockup](./mockup.md)
- [Acceptance Test Plan (QA)](./acceptance-test-plan.md)

---

## Traceability

### Storys (5)

- [BK-216](https://jira.upexgalaxy.com/browse/BK-216): Team Chat | Chat in a dedicated per-project channel _(Backlog)_
- [BK-220](https://jira.upexgalaxy.com/browse/BK-220): Team Chat | Search the message history _(Backlog)_
- [BK-219](https://jira.upexgalaxy.com/browse/BK-219): Team Chat | Edit and delete my own messages _(Ready For Dev)_
- [BK-217](https://jira.upexgalaxy.com/browse/BK-217): Team Chat | Mention a teammate to get their attention _(Backlog)_
- [BK-218](https://jira.upexgalaxy.com/browse/BK-218): Team Chat | Share an ATC, test, or run as a rich link _(Backlog)_

### Epic (1)

- [BK-1](https://jira.upexgalaxy.com/browse/BK-1): Tenancy & Identity _(Planning)_

---

## Metadata

- **Created:** 11/7/2026
- **Updated:** 16/8/2026
- **Reporter:** Ely
- **Assignee:** pinto.lucas.nahuel
- **Labels:** shift-left-2026-08-15, shift-left-reviewed

---

_Synced from Jira by sync-jira-issues_
