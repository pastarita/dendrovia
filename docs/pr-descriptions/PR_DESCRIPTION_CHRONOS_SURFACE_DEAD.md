# PR Description — CHRONOS Surface Dead Outputs

```
+--------------------------------------------------------------+
|   feat/chronos-surface-dead                                  |
+--------------------------------------------------------------+
|                       MINOR *                                |
|                                                              |
|            pass  [Or/Gules/Amber/Argent]  pass               |
|                    mullet x 2                                |
|                                                              |
|          [shared · ludus · chronos · app]                    |
|                per-quarterly division                        |
|                                                              |
|            files: 5 | +83 / -24                              |
+--------------------------------------------------------------+
|   "New horizons"                                             |
+--------------------------------------------------------------+

Compact: * [shared·ludus·chronos·app] mullet×2 pass/pass/pass/skip +83/-24
```

## Summary

Surfaces orphaned CHRONOS outputs into the runtime pipeline. Contributor profiles now flow from `contributors.json` through `@dendrovia/shared` types into the LUDUS `GameSession` for NPC encounter data, archaeology quests are wired into the quest generation pipeline, and dead dependencies and over-strict thresholds are cleaned up.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Shared ContributorProfile types | `Archetype`, `TimeArchetype`, `ContributorFacets`, `ContributorProfile` exported from `@dendrovia/shared` | Complete |
| GameSession contributors field | LUDUS `GameSession` gains `contributors: ContributorProfile[]`, `createGameSession` accepts contributor parameter | Complete |
| Parallel contributors.json fetch | DendroviaQuest fetches `contributors.json` alongside `topology.json` during init | Complete |
| Archaeology quest wiring | `generateArchaeologyQuests` integrated into DendroviaQuest quest pipeline | Complete |
| Coupling threshold reduction | `minCouplingCount` default lowered 5 → 2 for shallow clone compatibility | Complete |
| Dead dependency removal | `isomorphic-git` pruned from CHRONOS (uses `Bun.spawn git`) | Complete |

## Files Changed

```
packages/
  shared/
    src/types/index.ts           — Add ContributorProfile + supporting types to cross-pillar contract
  chronos/
    package.json                 — Remove dead isomorphic-git dependency
    src/analyzer/HotspotDetector.ts — Lower minCouplingCount default 5→2
  ludus/
    src/integration/EventWiring.ts — Add contributors field to GameSession + createGameSession
apps/
  dendrovia-quest/
    app/components/DendroviaQuest.tsx — Parallel contributors fetch, archaeology quests, NPC log
```

## Commits

1. `bc11b50` feat(chronos): surface dead outputs — shared ContributorProfile types, coupling threshold, prune isomorphic-git
2. `27912bf` feat(quest): wire contributors.json + archaeology quests into DendroviaQuest init pipeline

## Test Plan

- [x] `packages/shared` typechecks clean (`bunx tsc --noEmit`)
- [x] CHRONOS test suite: 192 pass, 0 fail
- [ ] Verify `contributors.json` fetch in browser DevTools Network tab (200 or graceful 404)
- [ ] Verify archaeology quests appear in LUDUS log output alongside commit/hotspot quests
- [ ] Confirm no runtime regression on world launcher class selection → 3D entry flow
