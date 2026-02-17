# PR Description — Stash Archaeology + Anti-Stash Git Hooks

+--------------------------------------------------------------+
|   feat/stash-archaeology-anti-stash-hooks                    |
+--------------------------------------------------------------+
|                      TRIVIAL (+)                             |
|                                                              |
|          skip  [SHIELD]  skip                                |
|                mullet x1                                     |
|                                                              |
|                [infra]                                       |
|                                                              |
|           files: 7 | +184 / -13                             |
+--------------------------------------------------------------+
|   "New horizons"                                             |
+--------------------------------------------------------------+

Compact: + [infra] mullet x1 skip/skip/skip/skip +184/-13

---

## Summary

Adds stash archaeology to the recon skill and hardens git hooks to prevent stash accumulation. A cross-checkout recon scan revealed a 551-file stash in ARCHITECTUS containing nearly-lost work — this change ensures stashes are surfaced with full metadata during scans and blocked from creation by the Tier 1 policy engine.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Recon Step 1b | Per-stash metadata gathering (ref, message, source branch, age, file/line counts, top files, packages) | Complete |
| Stash Classification | 4-tier system: minor/notable/major/critical with icons | Complete |
| Dashboard Rendering | Terse (default) and deep (`--stash-deep`) stash display modes | Complete |
| JSON Schema | `stashes` array and `StashEntry` interface added to `CheckoutStatus` | Complete |
| Stash Recommendations | 3 new rules: critical recovery, orphan detection, PR correlation | Complete |
| Tier 1 Policy Block | Stash creation blocked across all 4 policy modes | Complete |
| Pre-commit Fix | Replaced stash-recommending guidance with branch workflow | Complete |
| Pre-commit Enhancement | Stash detection now shows per-entry metadata and recommends `git stash branch` | Complete |
| Castle Walls Rules | New Stash Anti-Pattern section with rationale and recovery workflow | Complete |

## Files Changed

```
.claude/
├── policies/modes/
│   ├── default.yaml           — Add stash creation block pattern
│   ├── deployment.yaml        — Add stash creation block pattern
│   ├── rendover.yaml          — Add stash creation block pattern
│   └── testing.yaml           — Add stash creation block pattern
├── rules/
│   └── CASTLE_WALLS.rules.md  — Add Stash Anti-Pattern section, bump to v1.1.0
└── skills/recon/cross-checkout-scan/
    └── SKILL.md               — Add Step 1b, stash classification, dashboard rendering,
                                  JSON schema, --stash-deep arg, recommendations, StashEntry
                                  interface; bump to v2.3.0
.husky/
└── pre-commit                 — Fix stash-recommending guidance, enhance stash detection
```

## Commits

1. `184406f feat(recon,hooks): add stash archaeology to recon skill and anti-stash git hooks`

## Test Plan

- [ ] Policy block: Run `git stash` in a Claude Code session — should be blocked by Tier 1
- [ ] Policy allow: Run `git stash list` — should be allowed (read-only)
- [ ] Pre-commit: Create a test stash, then run a commit — verify enhanced stash warning with metadata
- [ ] Pre-commit main: Checkout main temporarily, verify recovery guidance no longer recommends stash
- [ ] Recon skill: Run `/recon` — verify stash entries show terse metadata in dashboard
- [ ] Recon deep: Run `/recon --stash-deep` — verify expanded stash details
