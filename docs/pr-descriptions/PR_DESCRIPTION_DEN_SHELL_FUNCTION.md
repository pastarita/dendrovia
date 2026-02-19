# PR: `den` Shell Function for Terminal Parity

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/wave0-imaginarium-reactive-foundations                 |
+--------------------------------------------------------------+
|                       + TRIVIAL +                            |
|                                                              |
|              skip  [Sable / Tenne]  skip                     |
|                    mullet x 1                                |
|                                                              |
|                  [operatus · docs]                            |
|                                                              |
|              files: 2 | +121 / -2                            |
+--------------------------------------------------------------+
|   "New horizons"                                             |
+--------------------------------------------------------------+
```

**Compact:** + [operatus·docs] mullet×1 skip +121/-2

---

## Summary

Adds the `den` shell function — a one-command fix for terminal parity after worktree swaps. When `wt:new` replaces a symlink with a worktree, peer terminals still point to the canonical repo. `den` re-resolves the pillar path so the shell lands in the correct working tree.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| `den` shell function | Re-resolve current pillar's dendrovia path (symlink or worktree) | Complete |
| `den <PILLAR>` | Jump to any pillar's dendrovia, case-insensitive | Complete |
| `den status` | Quick topology view — symlink/worktree/canonical per pillar | Complete |
| Terminal Parity docs | New section in SYMBOLIC_CHECKOUT_CONVENTIONS explaining the problem and fix | Complete |

## Files Changed

```
dendrovia/
├── scripts/
│   └── shell/
│       └── den.sh                           # +76 — NEW: den() function (bash/zsh compatible)
└── docs/
    └── SYMBOLIC_CHECKOUT_CONVENTIONS.md     # +45 — Terminal Parity section, updated Quick Reference
```

## Commits

1. `390a7d9` feat(operatus): add `den` shell function for terminal parity after worktree swaps

## Test Plan

- [x] `den status` — shows all 6 pillars with correct state (5 worktrees + 1 canonical)
- [x] `den IMAGINARIUM` — lands in worktree, correct branch
- [x] `den chronos` — case-insensitive, jumps to CHRONOS worktree
- [x] `den` (bare) — infers pillar from `$PWD`, re-resolves path
- [x] `den BOGUS` — clean error with valid pillar list
- [x] Works in both bash and zsh (uses `tr` for uppercase, prefix match for pillar detection)

---

_Magnitude: TRIVIAL (4) — 2 domains, 2 files, 123 lines_
_Shield: per-pale (2 domains) — Sable, Tenne_
_Primary charge: mullet × 1 (feat commit)_
