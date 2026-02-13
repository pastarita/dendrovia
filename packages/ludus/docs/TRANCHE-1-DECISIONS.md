# Tranche 1: Combat Architecture & Formula Decisions

> Research completed 2026-02-13. These decisions govern all LUDUS implementation.

---

## Decision 1: Engine Architecture — Functional Reducer

**Choice:** Pure functional reducer pattern `(BattleState, Action) => BattleState`

**Rejected alternatives:**
- **ECS (bitecs/miniplex):** Overkill for 1-4 entities. ECS is designed for thousands of real-time entities with cache-friendly memory layouts. Turn-based games with few entities actually fight the ECS paradigm (systems-run-every-frame breaks down when turns are sequential and order-dependent).
- **boardgame.io:** Excellent patterns but ships with networking, lobby management, and client-server architecture we don't need. We adopt its core insight (moves as reducers, seeded PRNG in state, replay from action log) without the framework.
- **Deep OOP inheritance:** Rigid hierarchies, base-class bloat, hard to compose. We use interfaces + composition instead.

**Pattern:**
```typescript
type BattleState = {
  turn: number;
  phase: CombatPhase;
  player: Character;
  enemies: Monster[];
  log: ActionLogEntry[];
  rng: RngState;
};

function battleReducer(state: BattleState, action: Action): BattleState {
  // Pure function. Same input always produces same output.
}
```

**Key principles:**
1. State is data (plain objects), not class instances. Everything serializes to JSON.
2. RNG state lives inside BattleState. Every random call returns `[value, newRngState]`.
3. Actions are the source of truth. The action log IS the game. State is derived via replay.
4. Phase transitions happen inside the reducer. No external state machine.

---

## Decision 2: State Machine — Hand-Rolled Discriminated Union

**Choice:** TypeScript discriminated union for combat phases. No xstate.

**Rejected:** xstate (27k stars, excellent, but overkill for a 4-state FSM — adds 45KB and actor-model concepts we don't need).

**Pattern:**
```typescript
type CombatPhase =
  | { type: 'PLAYER_TURN'; availableActions: Action[] }
  | { type: 'ENEMY_TURN'; currentEnemyIndex: number }
  | { type: 'RESOLUTION'; pendingEffects: Effect[] }
  | { type: 'VICTORY'; xpGained: number; loot: Item[] }
  | { type: 'DEFEAT'; cause: string };
```

TypeScript's exhaustive switch checking ensures we never miss a phase.

---

## Decision 3: PRNG — sfc32

**Choice:** sfc32 (Small Fast Chaotic 32-bit)

**Rejected alternatives:**
- Mulberry32: Author no longer recommends it (skips 1/3 of values).
- seedrandom: External dependency with more surface area than needed.
- Math.random(): Not seedable. Forbidden in LUDUS.

**Properties:** 128-bit state, >2^128 period, passes PractRand, fastest JS PRNG.

**Critical rule:** The PRNG state (4 numbers: a, b, c, d) is stored inside `BattleState` and advanced as part of the reducer. This is what makes replay deterministic.

```typescript
function sfc32(a: number, b: number, c: number, d: number): () => number {
  return function() {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
}
```

---

## Decision 4: State Container — DIY Store Now, Zustand Later

**Phase 1 (now):** Minimal pub/sub store. Zero dependencies.
```typescript
function createBattleStore(initialState: BattleState) {
  let state = initialState;
  const listeners = new Set<(state, prev) => void>();
  return {
    getState: () => state,
    dispatch: (action) => { const prev = state; state = battleReducer(state, action); listeners.forEach(fn => fn(state, prev)); },
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
```

**Phase 2 (OCULUS integration):** Swap to `zustand/vanilla` with `subscribeWithSelector` middleware. The vanilla API (`createStore` from `zustand/vanilla`) works in Node.js/Bun with no React dependency. Migration is trivial because the API surface is nearly identical.

---

## Decision 5: Damage Formula — Hybrid Tung/Pokemon

**Choice:** Tung's ratio formula as base engine + Pokemon-style multiplicative modifiers.

**Rejected alternatives:**
- Dragon Quest / Fire Emblem subtractive (`ATK - DEF`): Produces zero damage when DEF >= ATK. With our stats (DPS ATK 15 vs Tank DEF 15), that's a dead end.
- FFVI: 9-step pipeline with Level^2 — too complex, exponential growth impossible to balance.
- D&D 5e: Binary hit/miss too swingy for Monte Carlo simulation at scale.

### The Formula

```
BaseDamage  = (SpellPower + Attack) * (C / (C + Defense))
FinalDamage = floor(BaseDamage * CritMult * ElementMult * Variance)
FinalDamage = max(FinalDamage, 1)
```

**Constants:**
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| C (defense constant) | 20 | At DEF=20, 50% passes through. With our DEF range (5-15), gives 80%-57% pass-through |
| CritMult | 1.5x | 2x too swingy; 1.5x is exciting but controllable |
| Crit chance | 5% base + 0.5%/speed, cap 25% | Gives Speed a dual purpose |
| Variance | [0.85, 1.00] | 15% swing — matches Pokemon's proven range |
| Element mults | 0.5 / 1.0 / 1.5 | Meaningful, not game-breaking (no 4x extremes) |
| Min damage | 1 | Prevents stalemates |

### Healing & Shield

```
Healing  = floor(SpellPower + CasterAttack * 0.5)
ShieldHP = floor(SpellPower + CasterDefense * 0.5)
```

Not reduced by defense. Raw power + portion of relevant stat.

### Validation (Level 1)

| Matchup | Damage/Turn | Turns to Kill | Feels Right? |
|---------|-------------|---------------|-------------|
| DPS (ATK 15) vs NullPointer (DEF 3) | ~12 | ~3 | Yes — DPS shreds weak bugs |
| NullPointer (ATK 8) vs DPS (DEF 5) | ~6 | ~14 | Yes — DPS wins easily |
| Tank (ATK 5) vs NullPointer (DEF 3) | ~4 | ~10 | Yes — Tank kills slowly |
| NullPointer (ATK 8) vs Tank (DEF 15) | ~4 | ~37 | Yes — Tank is a wall |
| DPS + SQL Injection (POW 40) vs Tank | ~31 | ~5 | Yes — spells are impactful |

---

## Decision 6: XP Curve — Quadratic

```
totalXPForLevel(n) = floor(50 * n^2)
xpToNextLevel(n)   = 50 * (2n + 1)
```

| Level | Total XP | XP to Next |
|-------|----------|------------|
| 1 | 50 | 150 |
| 5 | 1,250 | 550 |
| 10 | 5,000 | 1,050 |
| 15 | 11,250 | 1,550 |
| 20 | 20,000 | 2,050 |
| 25 | 31,250 | 2,550 |
| 30 | 45,000 | — |

Monster XP reward: `floor(25 * severity^2 * (1 + 0.05 * complexity))`

---

## Decision 7: Stat Growth — Flat Per-Level

| Stat | Tank/lvl | Healer/lvl | DPS/lvl |
|------|----------|------------|---------|
| HP | +8 | +5 | +3 |
| Mana | +2 | +5 | +3 |
| Attack | +1 | +0.5 | +2 |
| Defense | +2 | +1 | +0.5 |
| Speed | +1 | +1.5 | +1 |

Fractional growth is accumulated and floored at query time: `floor(baseStat + growthRate * (level - 1))`.

### Level 30 Projections

| Stat | Tank L30 | Healer L30 | DPS L30 |
|------|----------|------------|---------|
| HP | 382 | 245 | 167 |
| Mana | 108 | 245 | 162 |
| Attack | 34 | 17 | 73 |
| Defense | 73 | 37 | 19 |

---

## Decision 8: Monster Stat Scaling

**Formula:**
```
scaledStat(base, severity, complexity) = floor(base * (1 + 0.35 * (severity - 1)) * (1 + 0.1 * complexity))
```

**Base templates:**

| Monster | HP | ATK | DEF | Speed | Element |
|---------|-----|-----|-----|-------|---------|
| NullPointerException | 40 | 8 | 3 | 6 | none |
| MemoryLeak | 60 | 5 | 6 | 3 | earth |
| RaceCondition | 35 | 10 | 2 | 12 | air |
| OffByOne | 25 | 6 | 4 | 8 | none |

Severity multipliers: 1.0x → 1.35x → 1.70x → 2.05x → 2.40x

---

## Decision 9: Element Effectiveness Table

```
         Fire  Water  Earth  Air   None
Fire      0.5   0.5    1.5   1.0   1.0
Water     1.5   0.5    1.0   0.5   1.0
Earth     1.0   1.5    0.5   1.5   1.0
Air       1.0   1.5    0.5   0.5   1.0
None      1.0   1.0    1.0   1.0   1.0
```

---

## Decision 10: Balance Testing Parameters

- **Target win rate:** 55-65% for intended-difficulty encounters
- **Monte Carlo trials:** 1,000 per matchup (tuning), 10,000 (final validation)
- **Margin of error at 95% confidence:** +/- 3.1% (1K trials), +/- 0.98% (10K trials)
- **Flagging thresholds:** Win rate <30% or >80% = unbalanced

---

## Replay Format

```typescript
type BattleReplay = {
  seed: number;
  playerClass: 'tank' | 'healer' | 'dps';
  playerLevel: number;
  monsterType: string;
  monsterSeverity: number;
  actions: ActionLogEntry[];
};

// Replay = actions.reduce(battleReducer, initBattle(replay))
```

---

## Migration Path

1. **Now:** Pure functions + DIY store + inline sfc32. Zero dependencies beyond `@dendrovia/shared`.
2. **OCULUS integration:** Swap to `zustand/vanilla`. Add `subscribeWithSelector` for EventBus bridging.
3. **If complexity grows:** Add Immer for nested state updates. Consider xstate for quest graphs (not combat).
4. **If multiplayer:** Evaluate boardgame.io or Colyseus. The reducer pattern transfers directly.

---

## Sources

### Engine Architecture
- [boardgame.io](https://github.com/boardgameio/boardgame.io) — Reducer pattern, phase/turn model, seeded PRNG plugin
- [rot.js](https://github.com/ondras/rot.js) — Scheduler/speed-based turn system
- [Modifying ECS for Turn-Based Games](https://www.gridbugs.org/modifying-entity-component-system-for-turn-based-games/)
- [Game Programming Patterns — State](https://gameprogrammingpatterns.com/state.html)
- [bryc/code — JS PRNG comparison](https://github.com/bryc/code/blob/master/jshash/PRNGs.md)
- [Zustand vanilla stores](https://zustand.docs.pmnd.rs/apis/create-store)

### Damage Formulas
- [FFVI Algorithms](https://www.rpglegion.com/ff6/algs/algs.htm)
- [Game Developer — Number Punchers: FF vs DQ](https://www.gamedeveloper.com/design/number-punchers-how-i-final-fantasy-i-and-i-dragon-quest-i-handle-combat-math)
- [Bulbapedia — Pokemon Damage](https://bulbapedia.bulbagarden.net/wiki/Damage)
- [Fire Emblem Wiki — Battle Formulas](https://fireemblem.fandom.com/wiki/Battle_Formulas)
- [Tung — Simplest Non-Problematic Damage Formula](https://tung.github.io/posts/simplest-non-problematic-damage-formula/)
- [Red Blob Games — Probability and Damage Rolls](https://www.redblobgames.com/articles/probability/damage-rolls.html)

### XP & Balancing
- [Davide Aversa — RPG Level-based Progression](https://www.davideaversa.it/blog/gamedesign-math-rpg-level-based-progression/)
- [Pav Creations — Level Systems in RPGs](https://pavcreations.com/level-systems-and-character-growth-in-rpg-games/)
- [Boards and Barley — Monte Carlo for Game Design](https://boardsandbarley.com/2013/09/17/monte-carlo-simulations-for-game-design/)
