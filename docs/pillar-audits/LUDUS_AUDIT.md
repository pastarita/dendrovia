# LUDUS Pillar Audit

> **Pillar:** The Rulemaker
> **Package:** `packages/ludus`
> **Mandate:** "Make the Data Playable."
> **Date:** 2026-02-16

---

## Surface Summary

| Metric | Value |
|--------|-------|
| Index exports | 17 |
| External consumers | 0 packages (apps only) |
| Test files | 4 |
| Test LOC | ~3050 lines (best raw coverage) |
| EventBus emits | 10+ events (combat, quest, UI) |
| EventBus listens | 4 (NODE_CLICKED, PLAYER_MOVED, SPELL_CAST, ITEM_USED) |

## Health Assessment

### Strengths

- **Highest test LOC** across all pillars (~3050 lines in 4 test files)
- **Richest EventBus emitter:** 10+ distinct events covering full combat lifecycle
- **Clean separation:** No Three.js dependency (pure logic engine, as mandated)
- **Integration E2E test** validates cross-system behavior

### Weaknesses

| Issue | Severity | Detail |
|-------|----------|--------|
| **BRANCH_ENTERED documented as listened but NOT wired** | High | EventWiring.ts doesn't register a listener despite documentation claiming it |
| **TurnBasedEngine untested directly** | Medium | 625+ lines, only exercised via combat-engine.test.ts integration |
| **EnemyAI untested** | Medium | Complex decision trees with no direct test coverage |
| **EventWiring untested** | Medium | 425-line integration bridge with zero tests |
| **QuestGenerator untested** | Medium | Quest templating from CHRONOS data |
| **Zero pillar-package consumers** | Low | Only apps import LUDUS (architecturally expected) |

### EventBus Contract

| Direction | Event | Status |
|-----------|-------|--------|
| → LUDUS | NODE_CLICKED | Listened in EventWiring.ts:137 |
| → LUDUS | PLAYER_MOVED | Listened in EventWiring.ts:141 |
| → LUDUS | SPELL_CAST | Listened in EventWiring.ts:147 |
| → LUDUS | ITEM_USED | Listened in EventWiring.ts:153 |
| → LUDUS | BRANCH_ENTERED | **NOT listened** (documented but not wired) |
| LUDUS → | ENCOUNTER_TRIGGERED | Emitted (combat start) |
| LUDUS → | DAMAGE_DEALT | Emitted (combat resolution) |
| LUDUS → | HEALTH_CHANGED | Emitted |
| LUDUS → | MANA_CHANGED | Emitted |
| LUDUS → | QUEST_UPDATED | Emitted |
| LUDUS → | COMBAT_STARTED | Emitted |
| LUDUS → | COMBAT_ENDED | Emitted |
| LUDUS → | COMBAT_TURN_START | Emitted |
| LUDUS → | COMBAT_TURN_END | Emitted |
| LUDUS → | SPELL_RESOLVED | Emitted |
| LUDUS → | STATUS_EFFECT_APPLIED | Emitted |
| LUDUS → | STATUS_EFFECT_EXPIRED | Emitted |
| LUDUS → | EXPERIENCE_GAINED | Emitted |
| LUDUS → | LEVEL_UP | Emitted |
| LUDUS → | LOOT_DROPPED | Emitted |

**Gap:** BRANCH_ENTERED is supposed to trigger encounter checks when the player enters a new file/directory. It's documented as a LUDUS listener but the registration is missing from wireGameEvents().

### Test Coverage Detail

| Module | Tested | Notes |
|--------|--------|-------|
| core-data-layer.test.ts | Yes | GameStore, state management |
| combat-engine.test.ts | Yes | Combat flow integration |
| game-systems.test.ts | Yes | Character, inventory, progression |
| integration-e2e.test.ts | Yes | Cross-system flow |
| **TurnBasedEngine** | **No** | 625+ lines, indirect only |
| **EnemyAI** | **No** | Decision tree logic |
| **CombatMath** | **No** | Damage formulas |
| **EventWiring** | **No** | 425-line bridge |
| **QuestGenerator** | **No** | Quest templating |
| **MonsterFactory** | **No** | Monster instantiation |
| **SpellFactory** | **No** | Spell creation |
| **EncounterSystem** | **No** | Encounter detection |
| **StatusEffects** | **No** | Buff/debuff logic |
| **BalanceConfig** | **No** | Game balance tuning |

---

## Directive Alignment

LUDUS has no directives in D1-D10 (ARCHITECTUS-scoped). Its relationship:

| ARCHITECTUS Directive | LUDUS Role | Status |
|-----------------------|-----------|--------|
| D8 (Event Feedback) | LUDUS emits combat events that D8 must handle in ARCHITECTUS | LUDUS side complete; ARCHITECTUS handles only 2/11 |
| D4 (Surface Camera) | LUDUS listens to PLAYER_MOVED for encounter proximity | Working |
| D7 (SegmentMapper) | LUDUS quest state indicates active segment | EventBus link exists but StoryArc data unwired |

### LUDUS-Specific Priorities

1. **Wire BRANCH_ENTERED listener** in EventWiring.ts — documented but missing
2. **Test TurnBasedEngine directly** — 625 lines of core combat logic
3. **Test EventWiring** — 425-line integration bridge is the LUDUS ↔ world connection
4. **Test EnemyAI + CombatMath** — Core combat decision and resolution logic

---

*Audit version: 1.0.0*
