# PR: Wire remaining LUDUS playground stub pages

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/ludus-playground-stubs                                |
+--------------------------------------------------------------+
|                      ** MODERATE **                           |
|                                                              |
|          WARN  [=============SHIELD=============]  pass      |
|                       mullet x 4                             |
|                                                              |
|                         [app]                                |
|                                                              |
|              files: 20 | +2291 / -16                         |
+--------------------------------------------------------------+
|   "Innovation through iteration"                             |
+--------------------------------------------------------------+
```

**Compact:** ** [app] mullet x4 typecheck:WARN test:pass +2291/-16

---

## Summary

Replaces the four "Coming soon" stubs (`/generators`, `/museums`, `/halls`, `/spatial-docs`) with working pages wired to real `@dendrovia/ludus` APIs. Each follows the existing tab-navigation pattern from Zoos/Gyms.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Generators | Spell, monster, quest, encounter creation tools | Complete |
| Museums | Battle stats, progression curves, damage formula, balance config | Complete |
| Halls | Combat rules, element grid, class/monster reference | Complete |
| Spatial Docs | Event system table, module map, cross-pillar integration | Complete |

## Commits

1. `92dc8be` feat(playground-ludus): wire generators page with spell/monster/quest/encounter tools
2. `87a32b6` feat(playground-ludus): wire museums page with battle stats/progression/formula/balance exhibits
3. `94f3908` feat(playground-ludus): wire halls page with combat rules/elements/class/monster reference
4. `7013240` feat(playground-ludus): wire spatial-docs page with event system and API reference

## Test Plan

- [x] LUDUS unit tests pass (204/204)
- [x] Dev server compiles all 4 routes cleanly (webpack)
- [x] All 7 routes return HTTP 200 (4 new + 3 existing)
- [ ] Visual review in browser
