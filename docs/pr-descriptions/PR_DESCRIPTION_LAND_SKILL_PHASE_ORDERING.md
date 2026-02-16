# PR: Land Skill Phase Ordering Fix

## Coat of Arms

```
+--------------------------------------------------------------+
|   docs/land-skill-phase-ordering                             |
+--------------------------------------------------------------+
|                      + TRIVIAL                               |
|                                                              |
|          skip  [plain]  skip                                 |
|          skip           skip                                 |
|                 book x 1                                     |
|                                                              |
|                  [docs]                                      |
|                                                              |
|           files: 1 | +20 / -16                               |
+--------------------------------------------------------------+
|   "Wisdom documented"                                        |
+--------------------------------------------------------------+
```

**Compact:** + [docs] book x1 skip/skip/skip/skip +20/-16

---

## Summary

Corrects the phase ordering in the landing workflow skill. PR description authoring now precedes rebase and push, ensuring the description file is committed content that travels through rebase with all other commits.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Phase reorder | Move PR Description from Phase 6 (after push) to Phase 4 (after commits, before rebase) | Complete |
| Anti-patterns | Add "stash before rebase" and "post-push PR description" to anti-pattern table | Complete |
| Rationale annotation | Explain why PR description must precede rebase | Complete |

## Files Changed

```
.claude/skills/workflow/land/SKILL.md    MOD  Phase reorder + anti-patterns + version bump
```

## Commits

1. `f659dc2` docs(skills): reorder land workflow — PR description before rebase

## Test Plan

- [ ] Read SKILL.md — phases numbered 1-6, PR Description is Phase 4, Rebase is Phase 5, Push is Phase 6
- [ ] Anti-pattern table includes stash and post-push rows
- [ ] Cross-references section points pr-workflow to Phase 4
- [ ] Version reads 1.1.0
