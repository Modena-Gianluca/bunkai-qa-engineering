# User Story — Format Reference

> **Reference-only.** Canonical shape of a Story artifact. Per-ticket content is synced from Jira by `/sprint-testing` (`bun run jira:sync-issues get <KEY> --include-comments`) — NEVER author a per-ticket `story.md` locally.

## Shape

```markdown
## Summary
As a [persona] I want to [action] so that [benefit]

## Acceptance Criteria
- [ ] AC1. Given [context], when [action], then [observable result]
- [ ] AC2. Given [context], when [action], then [observable result]
- [ ] AC3. Given [context], when [action], then [observable result]

## Technical Notes
- [ ] API changes: [endpoint / contract]
- [ ] DB changes: [table / column / migration]
- [ ] UI changes: [route / component]
- [ ] Dependencies: [library / service]

## Out of Scope
- [item explicitly not covered]

## Related
- Design/Mockups: [link]
- Blocked by: [KEY]
- Related to: [KEY]
```

## AC checklist (QA shift-left gate)

- [ ] Specific and measurable
- [ ] Testable (can be automated)
- [ ] Independent (doesn't assume other ACs)
- [ ] Business-focused (not implementation detail)

## Discovery Gaps

- [ ] Workflow states assumed; verify against real tickets before relying on them.
