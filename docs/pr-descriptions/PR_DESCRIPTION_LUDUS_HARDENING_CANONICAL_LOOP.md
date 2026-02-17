# PR: LUDUS Hardening + Cross-Pillar Wiring + Canonical Game Loop

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/ludus-hardening-canonical-loop                        |
+--------------------------------------------------------------+
|                      ** MODERATE **                           |
|                                                              |
|          pass  [Gules / Or / Argent]  pass                   |
|                   mullet x 3                                 |
|                                                              |
|              [ludus, shared, app]                             |
|                                                              |
|           files: 13 | +744 / -199                            |
+--------------------------------------------------------------+
|   "Innovation through iteration"                             |
+--------------------------------------------------------------+
```

**Compact:** ** [ludus, shared, app] mullet x3 pass|pass|pass|WARN +744/-199

---

## Summary

Replaces fragile string-based coupling in LUDUS internals with typed discriminators and structured event data, adds missing cross-pillar event handlers for BRANCH_ENTERED and COMBAT_ACTION, and refactors the playground gym to use the canonical LUDUS integration layer instead of bypassing it with direct `initBattle`/`executeTurn`/`getEventBus` calls.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| EnemyBehavior discriminator | Typed `behavior` field on `EnemyDecision` replaces `log.includes()` string matching in `isSkippedTurn`, `isOffByOneHeal`, `isOffByOneSelfHit` | Complete |
| Structured action logging | `makeLog` now records the actual `Action` object instead of hardcoding `ATTACK` for all entries | Complete |
| Event-based stats extraction | `updateBattleStatistics` accepts optional `InternalCombatEvent[]` for structured damage/healing/spell/crit extraction with fallback to legacy log parsing | Complete |
| Per-battle event accumulation | `GameSession.currentBattleCombatEvents` accumulates events across turns, passed to stats on battle end | Complete |
| COMBAT_ACTION event | New shared event type + handler enables external systems to dispatch combat actions into an active session | Complete |
| BRANCH_ENTERED handler | Responds to navigation events by checking file complexity for encounter triggers; guards against firing during active combat | Complete |
| useGameSession hook | Wraps `GameStore` + `GameSession` with React state sync, terminal battle preservation, starter inventory, and cleanup | Complete |
| useProgressionEvents hook | Subscribes to XP/level-up/loot events and accumulates `ProgressionSummary` | Complete |
| VictoryOverlay component | Extracted overlay showing XP progress bar, level-up stat changes, new spells, loot, and action buttons | Complete |
| ActionPanel item support | Items section with amber border renders when inventory has entries and `canUseItem` is true | Complete |
| GymClient session refactor | Removes all direct `getEventBus()` calls; uses session-driven events; character persists across battles | Complete |

## Files Changed

```
packages/
  ludus/
    src/
      combat/
        EnemyAI.ts              — Add EnemyBehavior type + behavior field; rewrite 3 detection fns
        TurnBasedEngine.ts      — makeLog accepts Action; update ~28 call sites
      integration/
        EventWiring.ts          — Accumulate events per-battle; add BRANCH_ENTERED + COMBAT_ACTION handlers
      progression/
        ProgressionSystem.ts    — Structured accumulatedEvents path in updateBattleStatistics
    tests/
      combat-engine.test.ts     — Add behavior to 2 EnemyDecision fixtures
      game-systems.test.ts      — Add 3 cross-pillar handler tests; add bus.clear() in beforeEach
  shared/
    src/
      events/
        EventBus.ts             — Add COMBAT_ACTION event type + CombatActionEvent interface
apps/
  playground-ludus/
    app/
      gyms/
        GymClient.tsx           — Session-based refactor; remove direct EventBus usage
        components/
          ActionPanel.tsx       — Add onItem + inventoryItems props
          MockEventPanel.tsx    — Add BRANCH_ENTERED mock button
          VictoryOverlay.tsx    — New: extracted victory/defeat overlay with progression display
        hooks/
          useGameSession.ts     — New: session lifecycle hook with React state sync
          useProgressionEvents.ts — New: XP/level-up/loot event accumulator
```

## Commits

1. `d3a8b6d` feat(ludus): add structured behavior field and event-based stats extraction
2. `d927628` feat(ludus): wire BRANCH_ENTERED and COMBAT_ACTION cross-pillar events
3. `e5773f3` feat(playground-ludus): canonical game loop via session hooks

## Test Plan

- [x] `bun test` in `packages/ludus` — 216/216 pass (213 existing + 3 new)
- [x] No pre-existing tests broken
- [ ] `bun run build` in `apps/playground-ludus` — pre-existing failure in operatus/imaginarium dep chain (unrelated)
- [ ] Manual: start battle in playground gym, use attack/spell/defend/item, win, see XP + level-up in VictoryOverlay
- [ ] Manual: MockEventPanel BRANCH_ENTERED button triggers encounter when no battle active
- [ ] Manual: rematch preserves character state (XP carries forward)
