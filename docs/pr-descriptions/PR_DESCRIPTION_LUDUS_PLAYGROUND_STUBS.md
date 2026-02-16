# PR: Wire & polish LUDUS playground stub pages

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/ludus-playground-stubs                                |
+--------------------------------------------------------------+
|                      ** MODERATE **                           |
|                                                              |
|          WARN  [=============SHIELD=============]  pass      |
|                       mullet x 7                             |
|                                                              |
|                         [app]                                |
|                                                              |
|              files: 22 | +2484 / -21                         |
+--------------------------------------------------------------+
|   "Innovation through iteration"                             |
+--------------------------------------------------------------+
```

**Compact:** ** [app] mullet x7 typecheck:WARN test:pass +2484/-21

---

## Summary

Replaces the four "Coming soon" stubs (`/generators`, `/museums`, `/halls`, `/spatial-docs`) with working pages wired to real `@dendrovia/ludus` APIs, then polishes the post-rebase surface: fixes stale cross-nav ports, removes `as any` casts, makes museum exhibits combatant-selectable, derives the event catalog from `GameEvents`, and adds randomize buttons to generators.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Generators | Spell, monster, quest, encounter creation tools | Complete |
| Museums | Battle stats, progression curves, damage formula, balance config | Complete |
| Halls | Combat rules, element grid, class/monster reference | Complete |
| Spatial Docs | Event system table, module map, cross-pillar integration | Complete |
| Port fix | CROSS_NAV ports aligned to 3010-3016 range | Complete |
| Type safety | `BattleStatsExhibit` `as any` replaced with `keyof BattleStatistics` | Complete |
| Configurable matchup | BalanceExhibit class/level/bugType/severity selectors | Complete |
| Selectable combatants | BattleStatsExhibit class/level/bugType/severity dropdowns | Complete |
| Derived event catalog | EVENT_CATALOG built from `Object.entries(GameEvents)` + lookup map | Complete |
| Randomize buttons | SpellGenerator "Random Symbol", MonsterGenerator "Randomize All" | Complete |

## Files Changed

```
apps/playground-ludus/
├── app/
│   ├── layout.tsx                               — fix CROSS_NAV ports (+1 each)
│   ├── generators/
│   │   ├── GeneratorsClient.tsx                 — tab shell for generator tools
│   │   ├── page.tsx                             — route entry point
│   │   └── components/
│   │       ├── SpellGenerator.tsx               — spell factory + random symbol btn
│   │       ├── MonsterGenerator.tsx             — monster factory + randomize all btn
│   │       ├── QuestGenerator.tsx               — quest graph generator
│   │       └── EncounterScanner.tsx             — encounter scanner
│   ├── museums/
│   │   ├── MuseumsClient.tsx                    — tab shell for museum exhibits
│   │   ├── page.tsx                             — route entry point
│   │   └── components/
│   │       ├── BattleStatsExhibit.tsx           — typed key access + combatant selectors
│   │       ├── BalanceExhibit.tsx               — configurable matchup selectors
│   │       ├── DamageFormulaExhibit.tsx         — damage formula explorer
│   │       └── ProgressionExhibit.tsx           — progression curve exhibit
│   ├── halls/
│   │   ├── HallsClient.tsx                      — tab shell for reference halls
│   │   ├── page.tsx                             — route entry point
│   │   └── components/
│   │       ├── CombatRulesHall.tsx              — combat rules reference
│   │       ├── ElementsHall.tsx                 — element effectiveness grid
│   │       ├── ClassGuideHall.tsx               — class reference
│   │       └── MonsterGuideHall.tsx             — monster reference
│   └── spatial-docs/
│       ├── SpatialDocsClient.tsx                — derived event catalog + module map
│       └── page.tsx                             — route entry point
docs/pr-descriptions/
└── PR_DESCRIPTION_LUDUS_PLAYGROUND_STUBS.md     — this file
```

## Commits

1. `92dc8be` feat(playground-ludus): wire generators page with spell/monster/quest/encounter tools
2. `87a32b6` feat(playground-ludus): wire museums page with battle stats/progression/formula/balance exhibits
3. `94f3908` feat(playground-ludus): wire halls page with combat rules/elements/class/monster reference
4. `7013240` feat(playground-ludus): wire spatial-docs page with event system and API reference
5. `39e2e5a` docs(pr): add PR description for LUDUS playground stubs wiring
6. `43e2bfa` fix(playground-ludus): update CROSS_NAV ports and fix type safety
7. `0c8b0be` feat(playground-ludus): make BalanceExhibit matchup configurable
8. `bb502dd` feat(playground-ludus): make BattleStatsExhibit combatant-selectable
9. `f51c571` refactor(playground-ludus): derive SpatialDocs event catalog from GameEvents
10. `e27f859` feat(playground-ludus): add randomize buttons to generators

## Test Plan

- [x] LUDUS unit tests pass (204/204)
- [x] Dev server compiles all routes cleanly (webpack)
- [x] All 7 routes return HTTP 200 (4 new + 3 existing)
- [x] Typecheck clean on playground-ludus files (WARN from operatus — pre-existing)
- [ ] Visual review in browser
