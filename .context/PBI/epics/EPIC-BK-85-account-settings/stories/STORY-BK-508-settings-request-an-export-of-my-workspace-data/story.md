# Settings | Request an export of my workspace data

**Jira Key:** [BK-508](https://jira.upexgalaxy.com/browse/BK-508)
**Epic:** [BK-85](https://jira.upexgalaxy.com/browse/BK-85) (Account & Settings)
**Type:** Story
**Status:** Ready For QA
**Priority:** Medium
**Story Points:** -

---

## Overview

## User story

******As a**** **QA Lead / Quality Engineering Manager who owns a workspace*
**********I want to****** ****request a complete export of my workspace's data from Settings and download it once it is ready***
**So that**** I can answer a compliance or data-subject request with the actual records instead of assembling them by hand

## Definition of done

- [ ] A Data export section exists in the Settings hub, visible only to a workspace Owner
- [ ] An Owner can request an export of the workspace's data and the request is acknowledged immediately
- [ ] The section reports the state of the current request and, when ready, offers the archive for download
- [ ] The download stops working after a stated window, and the section says so plainly
- [ ] A failed export is reported as failed with a retry, never left looking stuck
- [ ] The archive never contains another workspace's data and never contains a credential

## Context

`.context/SRS/non-functional-specs.md` §9 commits to it: "GDPR: Workspace owners can request data export + deletion via Settings." Nothing of the kind exists today — no route, no section, no ticket. The two exports that do ship are much narrower and neither substitutes for this one: a Project's ATCs to CSV ([https://jira.upexgalaxy.com/browse/BK-467#icft=BK-467](https://jira.upexgalaxy.com/browse/BK-467#icft=BK-467)) and a client-side evidence-chain snapshot of a single User Story. Both are working artifacts for a QA Engineer; neither is a workspace-scoped subject-data export an Owner can hand to compliance.

This story delivers the ***export half only***. Owner-initiated deletion — the other half of that SRS sentence — is deliberately excluded and its exclusion is recorded in the Out Of Scope field with the reasoning.

## Provenance

Authored 2026-08-18 by the autonomous discovery routine, from `.context/SRS/non-functional-specs.md` §9 (Compliance).

## QA Refinements (Shift-Left Analysis)

### Edge Cases Identified

- A new export requested right after a still-valid prior archive exists — does the old download link stay valid on its own expiry? (AC-14, NEEDS PO/DEV CONFIRMATION)
- Can a Personal Access Token request or download a workspace export, or is this cookie-session (Owner) only? (AC-15, NEEDS PO/DEV CONFIRMATION)
- Export of a brand-new, empty workspace (AC-16, NEEDS PO/DEV CONFIRMATION)
- An export stuck in `preparing` past any bound, given Run snapshots grow unbounded per the architecture decision comment on this issue
- Concurrent export requests across two different workspaces the same Owner owns

### Clarified Business Rules

- The codebase's only existing role-adjacent precedent for a workspace-level action is the `workspace:admin` ***capability***, which does not restrict by role for cookie sessions. Owner-only enforcement for this Story needs an explicit inline role check (same shape as PAT issuance's `assertTokenIssuanceAuthorized`), not the standard capability decorator.
- Activity Stream's `ACTIVITY*ALLOWED*ACTIONS` allowlist has no export-related event types yet; that file's own comments document a prior instance (`bug.filed`) of the allowlist and its RPC-side SQL counterpart drifting out of sync by hand.
- A workspace can only ever have one Owner (granted once at creation; invites are structurally blocked from granting Owner rank) — ruled out as a race condition to test.

### Open Questions for PO / Dev

1. ***[****PO]*** What is the exact download-expiry window (AC-06/AC-07/BR all say "a stated window" with no number)?
2. ***[****PO]*** Is the "one export in flight" rule scoped per workspace or per Owner (affects AC-14/AC-05 test design)?
3. ***[****PO]*** Can a PAT request or download a workspace export (AC-15)?
4. ***[****Dev]*** How is Owner-only access enforced — role check or capability check?
5. ***[****Dev]*** What are the new Activity Stream event names for export request/download?
6. ***[****Dev]*** What archive format is chosen (deferred to implementation plan per the architecture decision comment)?

Full refinement (Critical Analysis, Story Quality Analysis, 21 test outlines, coverage estimate, risks) lives in the 🧪 Acceptance Test Plan (ATP) field on this issue.

---

## Fields

> Each rich-text field is a separate file in this folder.

- [Mockup](./mockup.md)

---

## Traceability

### Story (1)

- [BK-512](https://jira.upexgalaxy.com/browse/BK-512): TMS-| Delete a workspace I own _(Ready For QA)_

---

## Metadata

- **Created:** 18/8/2026
- **Updated:** 31/8/2026
- **Reporter:** Ely
- **Assignee:** Ely
- **Labels:** shift-left-2026-08-24, shift-left-reviewed

---

_Synced from Jira by sync-jira-issues_
