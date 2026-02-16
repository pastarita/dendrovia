# PR: EventBus Completeness — Status Effect + Loot Drop Coverage

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/status-effect-loot-coverage                           |
+--------------------------------------------------------------+
|                      * MINOR *                               |
|                                                              |
|          pass  [======SHIELD======]  skip                    |
|          tsc        [ oculus ]        lint                   |
|          pass                        skip                    |
|          test                        build                   |
|                                                              |
|                   mullet x 4                                 |
|                   scales x 1                                 |
|                                                              |
|                    [oculus]                                   |
|                                                              |
|             files: 7 | +433 / -0                             |
+--------------------------------------------------------------+
|   "New horizons"                                             |
+--------------------------------------------------------------+
```

**Compact:** * [oculus] mullet×4 scales×1 plain tsc:pass test:pass +433/-0

---

## Summary

Fills the last 3 uncovered GameEvents in the OCULUS package — `STATUS_EFFECT_APPLIED`, `STATUS_EFFECT_EXPIRED`, and `LOOT_DROPPED` — completing 29/29 EventBus event coverage. Adds store state with upsert and cap semantics, 3 EventBus subscriptions, two new UI components (StatusEffectBar and LootPanel), HUD integration, and 7 unit tests.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Store: `statusEffects` | Array with upsert-by-effectId semantics via `addStatusEffect` | Complete |
| Store: `lootDrops` | Array capped at 5 with oldest auto-eviction via `addLootDrop` | Complete |
| 3 EventBus subscriptions | `STATUS_EFFECT_APPLIED`, `STATUS_EFFECT_EXPIRED`, `LOOT_DROPPED` piped to store + battle log | Complete |
| StatusEffectBar | Horizontal IconBadge row with effectType emoji mapping (7 types) and turn counter overlay | Complete |
| LootPanel | Toast-style stacked notifications with 8s auto-dismiss timer and manual close | Complete |
| HUD integration | StatusEffectBar below player stats (top-left), LootPanel at bottom-center | Complete |
| 7 unit tests | Status effect add/upsert/remove/coexist + loot add/cap/dismiss | Complete |

## Files Changed

```
packages/oculus/src/
├── store/
│   └── useOculusStore.ts                         ← +StatusEffect/LootDrop types, state, 4 actions
├── hooks/
│   └── useEventSubscriptions.ts                  ← +3 subscriptions (status:applied/expired, loot:dropped)
├── components/
│   ├── StatusEffectBar.tsx                       ← NEW: horizontal effect badge row
│   ├── LootPanel.tsx                             ← NEW: toast-style loot notifications
│   └── HUD.tsx                                   ← Integrates StatusEffectBar + LootPanel
├── index.ts                                      ← Exports new components + types
└── __tests__/
    └── useOculusStore.test.ts                    ← +7 tests (status effects + loot)
```

## Commits

1. `da847cc` feat(oculus): add StatusEffect and LootDrop store types, state, and actions
2. `f2a54d5` feat(oculus): subscribe to STATUS_EFFECT_APPLIED, STATUS_EFFECT_EXPIRED, LOOT_DROPPED
3. `a412087` feat(oculus): add StatusEffectBar and LootPanel components
4. `c7e16f8` feat(oculus): integrate StatusEffectBar and LootPanel into HUD and exports
5. `7f33c29` test(oculus): add 7 unit tests for status effect and loot drop actions

## Test Plan

- [x] `bunx tsc --noEmit -p packages/oculus/tsconfig.json` — zero type errors
- [x] `bun test packages/oculus` — 37 pass, 0 fail
- [ ] Emit `STATUS_EFFECT_APPLIED` in Battle Arena gym — StatusEffectBar shows effect badge with turn counter
- [ ] Emit `STATUS_EFFECT_EXPIRED` — badge disappears from StatusEffectBar
- [ ] Emit `LOOT_DROPPED` — LootPanel toast appears at bottom-center, auto-dismisses after 8s
- [ ] Manual dismiss of loot toast via close button
- [ ] Battle log includes status effect and loot messages
