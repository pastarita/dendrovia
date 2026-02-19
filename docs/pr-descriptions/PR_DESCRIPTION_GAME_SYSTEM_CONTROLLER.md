# PR: GameSystemController — Toggleable, Inspectable LUDUS Engine

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/ludus-game-system-controller                          |
+--------------------------------------------------------------+
|                        MINOR *                               |
|                                                              |
|           WARN  [Gules | Or]  WARN                           |
|                   mullet x 1                                 |
|                                                              |
|                [ludus, shared]                                |
|                                                              |
|           files: 5 | +1251 / -7                              |
+--------------------------------------------------------------+
|   "New horizons"                                             |
+--------------------------------------------------------------+
```

**Compact:** * [ludus, shared] mullet x1 WARN/WARN/pass/skip +1251/-7

---

## Summary

Adds a GameSystemController that lets developers toggle LUDUS game systems (encounters, combat, progression, quests, inventory) on/off at runtime, with a master override and shadow mode that traces what suppressed handlers would have done. This is the foundation for the Gym/Zoo/Museum paradigm, enabling isolated observation of game mechanics before the D1-D4 combat expansion.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Toggle API | Per-system enable/disable with master override; `setSystemEnabled`, `setMasterEnabled`, `isSystemActive` | Complete |
| Event Gating | `gated()` higher-order wrapper blocks disabled system handlers at subscription time; PLAYER_MOVED always passes | Complete |
| Shadow Mode | Ring-buffered trace of suppressed events with shadow evaluators per system; queryable via `getShadowTrace` | Complete |
| Persistence | Toggle state stored in `gameFlags` using `ludus.*` key convention; survives save/load cycle | Complete |
| OCULUS Surface | `getSystemStatus()` snapshot + `SYSTEM_STATUS_CHANGED` bus event for HUD consumption | Complete |
| Handler Exports | EventWiring handlers exported for controller composition without logic changes | Complete |
| Backward Compatibility | `wireGameEvents()` still works without controller; zero breaking changes | Complete |

## Files Changed

```
packages/
  ludus/
    src/
      controller/
        GameSystemController.ts   [NEW] Core controller (~340 lines)
      integration/
        EventWiring.ts            [MOD] Export 7 handler functions
      index.ts                    [MOD] Add controller export
    tests/
      game-system-controller.test.ts  [NEW] 32 tests across 6 suites
  shared/
    src/
      events/
        EventBus.ts               [MOD] Add SYSTEM_STATUS_CHANGED event + payload type
```

## Commits

1. `f7bb13d` feat(ludus): add GameSystemController for toggleable game systems

## Test Plan

- [x] All 248 existing tests pass (backward compat verified)
- [x] 32 new controller tests pass across 6 suites
- [x] Toggle API: defaults, individual toggle, master toggle, effective state
- [x] Event Gating: events pass when enabled, blocked when disabled, master override, transition guard
- [x] Shadow Mode: trace collection, ring buffer bounds, per-system filtering, clear
- [x] Persistence: round-trip through gameFlags, survives save/load cycle via SaveSystem
- [x] OCULUS Surface: getSystemStatus shape, SYSTEM_STATUS_CHANGED emission
- [x] Backward Compatibility: wireGameEvents works without controller, startBattle/dispatchCombatAction unaffected
- [ ] Castle Walls: Wall 1 (secrets) passed; advisory warnings are pre-existing
