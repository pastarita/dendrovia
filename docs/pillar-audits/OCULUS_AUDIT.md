# OCULUS Pillar Audit

> **Pillar:** The Navigator
> **Package:** `packages/oculus`
> **Mandate:** "Clarify the Context."
> **Date:** 2026-02-16

---

## Surface Summary

| Metric | Value |
|--------|-------|
| Index exports | 31 |
| External consumers | 7 apps |
| Test files | 2 |
| EventBus emits | 3 (SPELL_CAST from BattleUI x2, NODE_CLICKED from Minimap) |
| EventBus listens | 21 events (most comprehensive subscriber) |
| Orphaned exports | ~30 |

## Health Assessment

### Strengths

- **Most comprehensive EventBus subscriber:** 21 events in useEventSubscriptions.ts
- **Used by 7 apps** — highest consumer count of any pillar
- **Full combat event coverage** on the subscribe side
- **Onboarding flow tested** (useOnboarding hook)

### Weaknesses

| Issue | Severity | Detail |
|-------|----------|--------|
| **Zero test files for UI components** | High | BattleUI, HUD, QuestLog, Minimap, CodeReader — all untested |
| **~30 orphaned exports** | Medium | Exported but never consumed by any package or app |
| **`@dendrovia/ui` referenced but never created** | Medium | CLAUDE.md mentions this package alias but it doesn't exist |
| **Subscribes to events never emitted** | Medium | COLLISION_DETECTED, GAME_STARTED, LEVEL_LOADED — listened but never fired |
| **ITEM_USED never emitted** | Medium | OCULUS + LUDUS both listen for ITEM_USED but no UI component emits it |

### EventBus Contract

OCULUS is the most comprehensive listener in the system:

| Event | Direction | Status |
|-------|-----------|--------|
| NODE_CLICKED | Listens | Working (proof-of-concept HUD) |
| HEALTH_CHANGED | Listens | Working |
| MANA_CHANGED | Listens | Working |
| QUEST_UPDATED | Listens | Working |
| COMBAT_STARTED | Listens | Working |
| COMBAT_ENDED | Listens | Working |
| COMBAT_TURN_START | Listens | Working |
| COMBAT_TURN_END | Listens | Working |
| SPELL_RESOLVED | Listens | Working |
| EXPERIENCE_GAINED | Listens | Working |
| LEVEL_UP | Listens | Working |
| PLAYER_MOVED | Listens | Working |
| DAMAGE_DEALT | Listens | Working |
| ITEM_USED | Listens | Working |
| STATUS_EFFECT_APPLIED | Listens | Working |
| STATUS_EFFECT_EXPIRED | Listens | Working |
| LOOT_DROPPED | Listens | Working |
| TOPOLOGY_GENERATED | Listens | Working |
| ENCOUNTER_TRIGGERED | Listens | Working |
| COLLISION_DETECTED | Listens | **Emitter missing** (ARCHITECTUS never emits) |
| GAME_STARTED | Listens? | Needs verification |

### Test Coverage Detail

| Module | Tested | Notes |
|--------|--------|-------|
| useOculusStore | Yes | Zustand store |
| useOnboarding | Yes | Onboarding flow hook |
| **BattleUI** | **No** | Combat interface |
| **Billboard3D** | **No** | 3D text overlay |
| **CodeReader** | **No** | Syntax-highlighted viewer |
| **FalconModeOverlay** | **No** | Macro view heatmaps |
| **HUD** | **No** | Health/mana/quest display |
| **LootPanel** | **No** | Loot drop interface |
| **MillerColumns** | **No** | File navigation |
| **Minimap** | **No** | Scene minimap |
| **NavigationBar** | **No** | App navigation |
| **OnboardingHints** | **No** | Tutorial hints |
| **QuestLog** | **No** | Quest tracking |
| **StatusEffectBar** | **No** | Buff/debuff display |
| **useEventSubscriptions** | **No** | Core EventBus wiring (21 events) |
| **useCodeLoader** | **No** | File content loader |
| **useInputCapture** | **No** | Input handling |
| **useKeyboardShortcuts** | **No** | Keyboard bindings |
| All primitives (6 frames) | **No** | IconBadge, OrnateFrame, Panel, ProgressBar, etc. |

---

## Directive Alignment

OCULUS has no directives in D1-D10 (ARCHITECTUS-scoped). Its relationship:

| ARCHITECTUS Directive | OCULUS Role | Status |
|-----------------------|------------|--------|
| D8 (Event Feedback) | OCULUS subscribes to all combat events for HUD updates | Subscribe side complete; display components untested |
| D4 (Surface Camera) | OCULUS provides Falcon Mode overlays | FalconModeOverlay exists but untested |
| D10 (Error Boundary) | OCULUS could provide fallback UI components | No integration yet |

### OCULUS-Specific Priorities

1. **Test useEventSubscriptions** — 21 event subscriptions with zero test coverage
2. **Test BattleUI + HUD** — Core player-facing components
3. **Prune orphaned exports** — ~30 exports with no consumers
4. **Verify COLLISION_DETECTED handling** — Subscribes but ARCHITECTUS never emits
5. **Create or remove `@dendrovia/ui`** — Referenced in CLAUDE.md but doesn't exist

---

*Audit version: 1.0.0*
