# PR: Cross-Pillar Directive Dispatch from Visual Audit

## Coat of Arms

```
+--------------------------------------------------------------+
|   docs/cross-pillar-directive-dispatch                       |
+--------------------------------------------------------------+
|                      MINOR *                                 |
|                                                              |
|          skip typecheck  [SHIELD]  skip lint                 |
|                   book x 1                                   |
|                                                              |
|                [docs]                                        |
|                                                              |
|           files: 7 | +1456 / -3                             |
+--------------------------------------------------------------+
|   "Scientia potentia est"                                    |
+--------------------------------------------------------------+
```

**Compact:** * [docs] book x1 typecheck:skip lint:skip test:pass build:skip +1456/-3

---

## Summary

Formalizes a visual audit of the deployed Dendrovia app (`dendrovia-architectus.vercel.app`, anthropics/claude-code world) into 42 numbered directives across all six pillars. Creates per-pillar directive documents following the established ARCHITECTUS_DIRECTIVES.md format, a master dispatch routing table with cross-pillar dependency graph, and a 3-wave execution strategy prioritized by blast radius.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Cross-pillar dispatch | Master routing table with Mermaid dependency graph, priority tiers (P0/P1/P2), 3-wave execution strategy, recommended branch names | Complete |
| OPERATUS directives | O-D1 through O-D5: segment 404 gating, lifecycle events, initializeOperatus, GameStore collision, MultiplayerClient tests | Complete |
| IMAGINARIUM directives | I-D1 through I-D5: deploy segment artifacts, palette variation flow, encounter visuals, CHRONOS event subscription, ambient atmosphere | Complete |
| LUDUS directives | L-D1 through L-D7: combat action expansion, damage feedback, turn visibility, combat outcomes, BRANCH_ENTERED wiring, TurnBasedEngine + EventWiring tests | Complete |
| OCULUS directives | U-D1 through U-D8: battle pane redesign, HP bar contrast, contextual controls, quest dedup, breadcrumbs, HUD separation, useEventSubscriptions + BattleUI tests | Complete |
| CHRONOS directives | C-D1 through C-D4: fix .js imports, complexity pipeline verification, GitParser/ASTParser tests, runtime pipeline to IMAGINARIUM | Complete |
| ARCHITECTUS addendum | D11-D13: gate segment requests, hull visualization, default particles + bloom | Complete |

## Files Changed

```
docs/
  CROSS_PILLAR_DIRECTIVE_DISPATCH.md   ── NEW: master routing table (42 directives, dependency graph)
  ARCHITECTUS_DIRECTIVES.md            ── UPDATED: D11-D13 addendum, updated file impact summary
  CHRONOS_DIRECTIVES.md                ── NEW: C-D1 to C-D4 (4 directives)
  IMAGINARIUM_DIRECTIVES.md            ── NEW: I-D1 to I-D5 (5 directives)
  LUDUS_DIRECTIVES.md                  ── NEW: L-D1 to L-D7 (7 directives)
  OCULUS_DIRECTIVES.md                 ── NEW: U-D1 to U-D8 (8 directives)
  OPERATUS_DIRECTIVES.md               ── NEW: O-D1 to O-D5 (5 directives)
```

## Commits

1. `7fe2b6c` docs(directives): dispatch cross-pillar directives from visual audit

## Test Plan

- [x] All documents use valid Mermaid syntax with accessible `color:` in style directives
- [x] No Mermaid reserved keywords used as node IDs
- [x] Each directive has: Priority, Complexity, Files, Problem, Target State, Approach, Exit Criteria
- [x] Cross-references between pillars are bidirectional (producer → consumer links match)
- [x] Priority tiers (P0/P1/P2) consistent between dispatch table and per-pillar docs
- [x] ARCHITECTUS D11-D13 numbering continues from existing D1-D10 without gaps
- [x] Recommended branch names follow `{type}/{pillar}-{description}` convention
- [ ] Each pillar checkout can read its directive doc and begin scoped work independently
