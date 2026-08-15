# Bug Report — Format Reference

> **Reference-only.** Canonical shape of a defect report. Per-ticket content is synced from Jira / authored by `/sprint-testing` Stage 2-3. Severity model aligns with the defect-management doctrine (`agentic-qa-core/references/defect-management-doctrine.md`).

## Shape

```markdown
## Summary
[one-line defect description]

## Environment
| Field | Value |
|---|---|
| Environment | [local / staging / production] |
| Browser / OS | [e.g. Chrome 126 / macOS] |
| User type | [role] |
| Date / time | [ISO 8601] |

## Steps to Reproduce
1. [step]
2. [step]
3. [step]

## Expected vs Actual
- **Expected**: [what should happen]
- **Actual**: [what happens]

## Evidence
- Screenshots: [path]
- Console logs: [path]
- Network requests: [path]
- Video: [path]

## Impact
- Severity: [Critical / High / Medium / Low]
- Users affected: [who]
- Workaround: [none / description]
- Frequency: [always / intermittent / rare]

## Regression
- [ ] Worked before
- [ ] Never worked
- [ ] Unknown

## Related
- Source Story: [KEY]
- Related issues: [KEY]
```

## Severity guide

| Severity | Criteria | Example |
|----------|----------|---------|
| Critical | System down, data loss, security breach | Cannot login, payment fails |
| High | Major feature broken, no workaround | Cannot create orders |
| Medium | Feature impaired, workaround exists | Filter broken, search works |
| Low | Cosmetic, minor | Typo, alignment |

## Discovery Gaps

- [ ] Severity→Priority auto-derivation rules live in the defect doctrine; confirm against Jira config before filing.
- [ ] Components list depends on the target project's modules — verify before filing.
