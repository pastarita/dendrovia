# PR: feat/shared-state-contracts

```
+--------------------------------------------------------------+
|   feat/shared-state-contracts                                |
+--------------------------------------------------------------+
|                      * minor                                 |
|                                                              |
|          WARN  [SHIELD]  WARN                                |
|                  mullet x 1                                  |
|                                                              |
|                [shared]                                      |
|                                                              |
|           files: 3 | +706 / -3                               |
+--------------------------------------------------------------+
|   "New horizons"                                             |
+--------------------------------------------------------------+
```

Compact: * [shared] mullet x1 WARN/WARN/WARN/skip +706/-3

## Summary

Introduces canonical typed contracts for cross-pillar state and services in `shared/contracts/`. Resolves the GameStore naming collision between LUDUS and OPERATUS, establishes explicit ownership annotations, and defines service interfaces for all six pillar boundaries.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| State contracts | `IGameState` replaces 4 competing definitions (LUDUS GameState, OPERATUS GameStoreState, shared GameSaveState, shared GameWorldState) | Complete |
| Store interface | `IGameStore` (getState/setState/subscribe) — LUDUS implements, OPERATUS consumes | Complete |
| ViewMode | Shared `'falcon' \| 'player'` type alias used by both IGameState and IEngineState | Complete |
| Read-only projections | `IHudView`, `IBattleView`, `ISaveSnapshot` — typed views for OCULUS and OPERATUS | Complete |
| Quest helpers | `isActiveQuest()`, `isCompletedQuest()`, `isAvailableQuest()` — flat array filter pattern | Complete |
| Service interfaces | 7 interfaces: IPersistence, ICacheService, ILifecycle, ICombatSystem, ISpatialQuery, IMeshProvider, ITopologyProvider | Complete |
| Service registry | `IServiceRegistry` + typed `ServiceMap` for DI wiring at app startup | Complete |
| Migration guide | Per-pillar adoption notes in both files | Complete |

## Files Changed

```
packages/shared/src/contracts/
  index.ts         — barrel: re-exports state + service contracts alongside JSON schemas
  state.ts         — NEW: IGameState, IGameStore, IEngineState, ViewMode, projections, quest helpers
  services.ts      — NEW: 7 service interfaces + ServiceMap registry
```

## Commits

1. `e74fdb4` feat(shared): add canonical state and service contracts

## Test Plan

- [x] `bunx tsc --noEmit --project packages/shared/tsconfig.json` — clean typecheck
- [x] Castle Walls Wall 1 (secrets) clean
- [x] All new types are re-exported from `@dendrovia/shared` via contracts barrel
- [ ] Downstream pillar migration (separate PRs per phase)
