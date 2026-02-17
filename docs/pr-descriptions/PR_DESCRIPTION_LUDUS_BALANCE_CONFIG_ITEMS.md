# PR: Wire BalanceConfig + Resolve Items in Combat

```
+--------------------------------------------------------------+
|   feat/ludus-balance-config-items                            |
+--------------------------------------------------------------+
|                      ** MODERATE                             |
|                                                              |
|         pass  [SHIELD]  pass                                 |
|                mullet x 1                                    |
|                cross x 1                                     |
|                bend x 1                                      |
|                                                              |
|                [ludus]                                        |
|                                                              |
|           files: 7 | +86 / -77                               |
+--------------------------------------------------------------+
|   "Iterandum est"                                            |
+--------------------------------------------------------------+
```

Compact: ** [ludus] mullet×1 cross×1 bend×1 pass|pass +86/-77

---

## Summary

Phase 2 of the LUDUS domain remediation. Wires the 243-line BalanceConfig (previously decorative) into all combat modules, fixes the pre-existing test failure, and makes items functional in combat by routing them through the InventorySystem.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| BalanceConfig wiring | Replace hardcoded constants across 5 files with DEFAULT_BALANCE_CONFIG references | Complete |
| Item combat resolution | executeUseItem now applies heal/mana/buff/cleanse effects via InventorySystem | Complete |
| EventWiring item routing | handleItemUsed routes through combat engine in battle, applies directly out of combat | Complete |
| Test fix | Correct assertion direction in archaeology quest test (descending sort) | Complete |

## Files Changed

```
packages/ludus/
├── src/
│   ├── character/
│   │   └── CharacterSystem.ts      — Base stats, growth rates, XP curve from BalanceConfig
│   ├── combat/
│   │   ├── CombatMath.ts           — 15 constants from BalanceConfig
│   │   ├── MonsterFactory.ts       — Boss/miniboss XP multipliers from BalanceConfig
│   │   └── TurnBasedEngine.ts      — Defend constants + rewritten executeUseItem
│   ├── encounter/
│   │   └── EncounterSystem.ts      — DEFAULT_CONFIG from BalanceConfig.encounters
│   └── integration/
│       └── EventWiring.ts          — handleItemUsed routes through combat engine
└── tests/
    └── integration-e2e.test.ts     — Fix assertion direction (line 559)
```

## Commits

1. `2d3d1e6` fix(ludus): correct assertion direction in archaeology quest test
2. `0b15659` refactor(ludus): wire BalanceConfig into all combat modules
3. `bc9b286` feat(ludus): resolve items in combat via InventorySystem

## Test Plan

- [x] All 213 tests pass (0 failures) — previously 212/213
- [x] Previously failing test (`integration-e2e.test.ts:559`) now passes
- [x] Tests run after each incremental change (CombatMath → CharacterSystem → EncounterSystem → MonsterFactory → TurnBasedEngine)
- [x] No circular dependencies (bun build succeeds)
- [ ] Manual verification: `executeTurn(state, { type: 'USE_ITEM', itemId: 'item-debug-log' })` heals player and proceeds to enemy phase
