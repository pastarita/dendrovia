# PR: Add worktree context canonicalization analysis

## Coat of Arms

```
+--------------------------------------------------------------+
|   docs/worktree-context-canonicalization                     |
+--------------------------------------------------------------+
|                       TRIVIAL +                              |
|                                                              |
|            skip  [Tenné]  skip                               |
|                   book x 1                                   |
|                                                              |
|                    [docs]                                    |
|                                                              |
|            files: 1 | +172 / -0                              |
+--------------------------------------------------------------+
|   "Wisdom documented"                                        |
+--------------------------------------------------------------+
```

**Compact:** + [docs] book×1 skip/skip/skip/skip +172/-0

---

## Summary

Adds a comparative analysis of Dendrovia's current multi-checkout clone workflow against a proposed worktree + sidecar context model. The document provides a weighted decision matrix, navigability policies, migration strategy, and developer profile options to guide the team toward a canonical parallel-development configuration.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Configuration comparison | Side-by-side of multi-checkout clones vs worktrees vs single checkout | Complete |
| Weighted decision matrix | 8-objective scoring across three modalities (C wins at 4.60) | Complete |
| Navigability matrix | Policies for reload behavior, prefetch, cross-port nav, registry drift | Complete |
| Migration strategy | 5-phase plan from multi-clone to worktree-based parallelism | Complete |
| Developer profiles | 4 opt-in profiles (strict isolation, balanced parallel, minimalist, CI mirror) | Complete |
| Guardrails | Anti-patterns and conventions for sidecar context, registries, worktree naming | Complete |

## Files Changed

```
docs/
└── WORKTREE_CONTEXT_CANONICALIZATION_ANALYSIS.md  ← new analysis document (172 lines)
```

## Commits

1. `51e09a7` docs(workflow): add worktree context canonicalization analysis

## Test Plan

- [ ] Document renders correctly in GitHub markdown preview
- [ ] Tables are well-formed and readable
- [ ] No broken links or references
- [ ] Content aligns with existing monorepo conventions in CLAUDE.md
