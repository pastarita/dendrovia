# PR: OPERATUS Event Contract Hardening

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/operatus-event-contract-hardening                     |
+--------------------------------------------------------------+
|                       TRIVIAL +                              |
|                                                              |
|         WARN (types)  [SHIELD]  skip (lint)                  |
|                   mullet x 2                                 |
|                                                              |
|              [operatus | shared]                             |
|                                                              |
|            files: 4 | +105 / -3                              |
+--------------------------------------------------------------+
|   "New horizons"                                             |
+--------------------------------------------------------------+
```

**Compact:** + [operatus|shared] mullet x2 WARN/skip/pass/skip +105/-3

---

## Summary

Wires the OPERATUS event contracts that were declared but never emitted, and adds a hydration timeout guard to eliminate the only infinite-hang path in the initialization pipeline. This closes the gap between the shared event bus contract and the actual runtime behavior of the infrastructure pillar.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| CACHE_UPDATED emission | CacheManager emits on set/setBinary/delete/clear | Complete |
| SAVE_COMPLETED emission | AutoSave emits after successful persist | Complete |
| Typed payload interfaces | 5 new event payload types in shared contracts | Complete |
| Hydration timeout guard | 5s Promise.race around waitForHydration() | Complete |
| GAME_STARTED listener | Confirms asset readiness to other pillars | Complete |
| LEVEL_LOADED listener | Preloads zone-specific assets via AssetLoader | Complete |
| Lifecycle cleanup | destroy() unsubscribes inbound event listeners | Complete |

## Files Changed

```
packages/
  shared/
    src/events/
      EventBus.ts .............. +36  5 typed payload interfaces for OPERATUS events
  operatus/
    src/
      cache/
        CacheManager.ts ........ +17  emit CACHE_UPDATED after mutations
      persistence/
        AutoSave.ts ............ +7   emit SAVE_COMPLETED after save
      init.ts .................. +48  hydration timeout, GAME_STARTED/LEVEL_LOADED listeners
```

## Commits

1. `10b584a` feat(shared): add typed payload interfaces for OPERATUS infrastructure events
2. `349b7c1` feat(operatus): wire event contracts and add hydration timeout guard

## Test Plan

- [x] `bun test` — 808 pass, 0 fail across 38 files
- [x] TypeScript typecheck — shared clean, operatus has only pre-existing SW/manifest errors
- [x] No new dependencies introduced
- [x] All event emissions use fire-and-forget `.catch(() => {})` to avoid blocking cache operations
- [x] Hydration timeout logs warning and proceeds with defaults (no crash)
- [x] destroy() cleans up both inbound event subscriptions
