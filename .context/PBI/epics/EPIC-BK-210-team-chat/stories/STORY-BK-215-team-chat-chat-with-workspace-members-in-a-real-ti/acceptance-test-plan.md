# BK-215 — Acceptance Test Plan (QA)

> Jira field: `customfield_10067` · [View in Jira](https://jira.upexgalaxy.com/browse/BK-215)

## Acceptance Test Plan (ATP) — Shift-Left DRAFT

### Coverage Estimate

| Type | Count | Notes |
| --- | --- | --- |
| Positive | 7 | Core delivery, history, roster, viewer, reconnection |
| Negative | 4 | Cross-workspace, viewer send, empty msg, multi-workspace |
| Boundary | 5 | Message length 1/4000/4001, whitespace, disconnection window |
| Integration | 4 | Membership, App Shell, Realtime, DB persistence |
| Security-RBAC | 3 | Viewer read-only, cross-workspace isolation, role enforcement |
| State-Transition | 3 | Connected/disconnected, member/viewer, empty/populated |
| Non-Functional | 4 | Performance (delivery, history) + Accessibility (keyboard, SR) |
| ***Total**** | ****30*** | New domain, missing infrastructure, RBAC risk |

### Test Outlines — Positive (7)

***P1******:****** Should deliver a new message to all channel members in real time***
Pre: two members have the channel open. Expected: new message appears for both without refresh.

***P2******:****** Should display sender name and timestamp on each message***
Pre: a message exists in the channel. Expected: sender display name + formatted timestamp.

***P3******:****** Should load full history when user opens the channel***
Pre: channel has 20+ messages. Expected: all messages in chronological order.

***P4******:****** Should load older messages on scroll-up***
Pre: channel has more messages than fit on screen. Expected: older messages load progressively.

***P5******:****** Should display all workspace members with roles in roster***
Pre: workspace has 3 members with different roles. Expected: roster shows all with role badges.

***P6******:****** Should allow viewers to read full history***
Pre: viewer opens channel. Expected: full history readable.

***P7******:****** Should show missed messages after reconnection***
Pre: connection drops while messages arrive. Expected: missed messages in correct order on reconnect.

### Test Outlines — Negative (4)

***N1******:****** Should not deliver messages to non-members of the workspace***
Pre: user belongs to different workspace. Expected: foreign messages do not appear.

***N2******:****** Should prevent viewers from sending messages***
Pre: viewer attempts to send. Expected: send rejected at server level (403).

***N3******:****** Should reject empty or whitespace-only messages***
Pre: user types only spaces. Expected: not sent, error shown.

***N4******:****** Should not show messages from other workspaces***
Pre: user has access to multiple workspaces. Expected: channel shows only current workspace messages.

### Test Outlines — Boundary (5)

***B1******:****** Should accept message at exactly 1 character***
Pre: user types single character. Expected: sent successfully.

***B2******:****** Should accept message at exactly 4000 characters***
Pre: user types 4000 chars. Expected: sent successfully.

***B3******:****** Should reject message at 4001 characters***
Pre: user types 4001 chars. Expected: rejected with error.

***B4******:****** Should handle leading/trailing whitespace correctly***
Pre: user types " Hello ". Expected: trimmed and sent as "Hello".

***B5******:****** Should handle disconnection window boundary***
Pre: connection drops for exactly the catch-up window. Expected: messages load or refresh prompted.

### Test Outlines — Integration (4)

***I1******:****** Should enforce channel access through workspace membership***
Pre: user is/is not a workspace member. Expected: access granted/denied based on membership.

***I2******:****** Should render chat panel within App Shell***
Pre: user opens panel. Expected: right-side dock consistent with BK-147 patterns.

***I3******:****** Should persist messages to the database***
Pre: message sent. Expected: stored in messages table with correct foreign keys.

***I4******:****** Should subscribe to Realtime for message delivery***
Pre: channel open. Expected: Realtime subscription active, receives new messages.

### Test Outlines — Security-RBAC (3)

***S1******:****** Should enforce viewer read-only at the API level***
Pre: viewer sends via API. Expected: 403 Forbidden returned.

***S2******:****** Should isolate workspace channels from each other***
Pre: user accesses channels from different workspaces. Expected: no cross-workspace leakage.

***S3******:****** Should enforce role-based access on channel operations***
Pre: user with different roles attempts operations. Expected: permitted/denied per RBAC.

### Test Outlines — State-Transition (3)

***ST1******:****** Should handle connected→disconnected transition***
Pre: user connected then loses connection. Expected: UI reflects disconnection, reconnects automatically.

***ST2******:****** Should handle member→viewer role transition***
Pre: member's role changes to viewer. Expected: composer disables in real-time.

***ST3******:****** Should handle empty→populated channel transition***
Pre: channel has 0 messages, then message sent. Expected: empty state disappears, message appears.

### Test Outlines — Non-Functional (4) — NEEDS PO/DEV CONFIRMATION

***NFR1******:****** Should meet delivery latency SLA under concurrent load***
Pre: 10 members send simultaneously. Expected: all delivered within SLA (P95 <200ms, P99 <500ms).

***NFR2******:****** Should load large history within defined time***
Pre: channel has 10,000+ messages. Expected: loads within time budget (P95 <500ms, P99 <1000ms).

***NFR3******:****** Should support keyboard-only navigation***
Pre: user navigates with keyboard only. Expected: all interactions accessible with visible focus (WCAG 2.1 AA).

***NFR4******:****** Should announce new messages to screen readers***
Pre: SR user has channel open. Expected: messages announced via live region; presence not color-only (WCAG 2.1 AA).

### Test Data Requirements

| Data | Quantity | Purpose |
| --- | --- | --- |
| Workspace members | 10 concurrent (5 Members, 2 Admins, 1 Owner, 2 Viewers) | All RBAC roles + concurrent load |
| Messages per channel | 1000+ messages | Pagination + history load testing |
| Message lengths | 1 char, 4000 chars, 4001 chars, whitespace-only | Boundary testing |
| Network profiles | 3G, 4G, WiFi, offline | Reconnection + performance testing |
| Multi-tab sessions | 2-3 tabs per user | Multi-tab merge + dedup testing |
| Concurrent senders | 10 users × 50 msg/min | Load testing + ordering consistency |

### Test Environment Requirements

- Supabase project with Realtime enabled
- Postgres 15 + RLS functions (`bunkai*is*workspace*member`, `bunkai*can*write*workspace`) deployed
- Next.js 15 app with `withApiHandler` middleware
- Browsers: Chrome / Firefox / Safari (latest 2 versions)
- Screen readers: NVDA (Windows), VoiceOver (macOS), TalkBack (Android)
- Load testing: k6 or Artillery for P95/P99 measurement
- Mobile devices: iOS Safari + Android Chrome (safe-area + virtual keyboard testing)

### Entry Criteria

- DB schema migration deployed (channels, messages, channel_members)
- API endpoints deployed with Zod validation
- Realtime broadcast + Presence wired with `setAuth()`
- RLS policies active on all 3 tables
- App Shell panel component functional

### Exit Criteria

- All 30 outlines executed (7+4+5+4+3+3+4)
- P95/P99 SLAs met under load (k6: 10 users × 50 msg/min)
- WCAG 2.1 AA verified (NVDA, VoiceOver, TalkBack)
- Zero critical/security defects open
- Zero data-leakage issues (cross-workspace isolation confirmed)

### Risk-Based Prioritization

| Priority | Outlines | Rationale |
| --- | --- | --- |
| P1 Critical | AC1–AC5 positive/negative, Security-RBAC, State-Transition, NFR1–NFR4 | Blocks release — delivery, RBAC, state, perf, a11y |
| P2 High | Boundary, Integration, Positive optional | Impacts quality — pagination, DB, Realtime |
| P3 Medium | Edge cases, integration edge | Nice to have — offline, role propagation, multi-tab |

### Open Items for Sprint

- [ ] Implement DB migration with partial unique index + CHECK constraints
- [ ] Implement API endpoints with `client_nonce` idempotency
- [ ] Wire Realtime with `setAuth()` + Broadcast
- [ ] Implement Presence with online/away/offline + multi-tab merge
- [ ] Implement RLS policies on all 3 tables
- [ ] Build UI with atomic SR announcer, focus mgmt, reduced-motion
- [ ] Set up k6 load test for SLA measurement
- [ ] Set up accessibility testing with NVDA/VoiceOver/TalkBack

### Risks & Mitigation

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| 1 | Realtime auth missed → RLS bypass | Medium | Critical | Code review gate: `setAuth()` mandatory |
| 2 | Cursor cross-workspace leak | Low | High | Validation gate: cursor `w`/`c` validated |
| 3 | Typing TTL leak → ghost indicators | Medium | Medium | TTL 3s + receiver mirror |
| 4 | NFR SLAs not met under load | Medium | High | Load test gate: k6 script in CI |
| 5 | WCAG gaps in mobile modal | Low | Medium | SR testing: NVDA/VoiceOver/TalkBack mandatory |
| 6 | DB schema missing — blocks all | High | Critical | Schema confirmation before estimation |
| 7 | API contracts undefined | High | Critical | Contract confirmation before estimation |
| 8 | Presence inaccurate | Medium | High | Multi-tab merge + `last*seen*at` fallback |
| 9 | Ordering inconsistent under load | Medium | High | `clock_timestamp()` microsecond + UUID |

### Performance SLAs (NFR Detail)

| Metric | P95 | P99 | Conditions |
| --- | --- | --- | --- |
| Message delivery (client→client) | <200ms | <500ms | 10 concurrent, 500 chars/msg, same region |
| Initial history load (cold, 1000 msgs) | <500ms | <1000ms | Cursor at end, index-only scan |
| Pagination (cursor, 50 msgs) | <200ms | <400ms | Valid cursor, covered index |
| Presence sync (join→sync) | <1000ms | <2000ms | 10 members, multi-tab |
| Reconnection catch-up | <1500ms | <3000ms | <5 min gap |
| Index fetch | <5ms | — | `idx*messages*channel_pagination` |

***Measurement******:*** k6/Artillery 10 users × 50 msg/min. Timestamp `client*sent*at` in metadata.

### Accessibility Criteria (WCAG 2.1 AA)

| Criterion | Implementation | Test |
| --- | --- | --- |
| SR announcements | `#sr-announcer` atomic `role="status" aria-live="polite" aria-atomic="true"` | NVDA/VoiceOver: verify each message announced |
| Focus management | Panel open → focus composer/first message; Escape closes + returns focus | Keyboard: Tab through all elements |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables transitions | OS setting: verify no animations |
| Presence non-color | Dot + `sr-only` label ("Online"/"Away"/"Offline") | WCAG 1.4.1: verify text label |
| Keyboard shortcuts | `Ctrl+Shift+K` (toggle), `Escape` (close), `Enter` (send), `Shift+Enter` (newline) | Keyboard: all shortcuts functional |
| Log semantics | `role="log" aria-live="polite" aria-atomic="false" aria-relevant="additions text"` | NVDA/VoiceOver: verify log semantics |

### Recommended Testing Strategy

***Pre-implementation******:***

- Confirm DB schema (channels, messages, channel_members) with Dev
- Confirm API endpoint contracts (send, history, roster, presence) with Dev
- Confirm Realtime wiring for chat delivery with Dev
- Confirm presence implementation approach with Dev
- Confirm message ordering mechanism and pagination strategy with Dev

***During implementation******:***

- Pair chat API work with contract tests for send, history, roster, presence
- Validate DB schema matches agreed design
- Test Realtime subscription for message delivery
- Test RBAC enforcement at API level
- Verify `setAuth()` called before Realtime subscription (critical security gate)

***Post-implementation (in-sprint by /sprint-testing)******:***

- UI tests: panel rendering, send/receive, history scroll, roster, viewer access
- API tests: message CRUD, history pagination, roster, presence
- Integration tests: Realtime delivery, reconnection catch-up, role change propagation
- Security-RBAC tests: viewer read-only, cross-workspace isolation
- Performance tests: k6 load test for P95/P99 SLAs
- Accessibility tests: NVDA/VoiceOver/TalkBack + keyboard navigation

---
_Synced from Jira by sync-jira-issues_
