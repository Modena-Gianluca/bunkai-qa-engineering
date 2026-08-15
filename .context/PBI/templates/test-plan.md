# Test Plan — Format Reference

> **Reference-only.** Canonical shape of a story-scoped test plan. Per-ticket ATP/ATR is synced from Jira fields / Xray by `/sprint-testing` — never authored as a standalone local file for a per-ticket plan.

## Shape

```markdown
## Header
- Story: [KEY] — [title]
- Sprint: [N]

## AC → TC mapping
| AC | TC | Type | Priority | Automatable |
|---|---|---|---|---|
| AC1 | TC-001 | Functional | High | Yes |
| AC1 | TC-002 | UI | Medium | Yes |
| AC2 | TC-003 | API | High | Yes |

## Scope
- **In scope**: [items]
- **Out of scope**: [items]

## Test types
| Type | Required | Reason |
|---|---|---|
| Functional | Yes | Core behavior |
| UI | Yes | User-facing flows |
| API | Yes | Contract |
| Perf / Security / A11y | No | [reason] |

## Environments
- [ ] local
- [ ] staging
- [ ] production (smoke)

## Test data
- [requirements / fixtures]

## Test cases (TC-001, TC-002, ...)
Each: priority, type, AC ref, automatable flag, steps, expected.

## Edge cases & negative tests
- [case]

## Dependencies / blockers / risks
- [item]

## Execution checklist
- [ ] ATP authored
- [ ] ATR filled
- [ ] Sign-off: [QA / PO]
```

## Discovery Gaps

- [ ] AC→TC explosion policy (1:N default, collapse only with justification) per test-design doctrine.
- [ ] Environment availability varies — confirm staging vs production smoke before planning.
