# LUDUS - The Mechanics

> **Philosophy:** "Diegetic Mechanics - We don't cast 'Fireball'; we cast 'Blame.' The mechanics mimic the cognitive actions of a developer."

## Responsibility

LUDUS contains **all game logic** - no rendering, no UI, just pure mechanics:

1. **Character System** - Classes (Tank/Healer/DPS), stats, progression
2. **Spell System** - Symbol-driven generation, cooldowns, effects
3. **Combat Engine** - Turn-based battles, no real-time rendering needed
4. **Quest Graph** - Generated from Git history
5. **Encounter System** - Bugs → Battles

## Core Principle: Separation from Rendering

LUDUS can run **completely independently** of ARCHITECTUS:

```bash
# Simulate 100 turns of combat in Node.js (no browser needed)
bun run simulate --combat --turns 100
```

This allows:
- ✅ Unit testing without WebGL
- ✅ Headless simulations
- ✅ Server-side validation (future MMO)

## Cognitive Boundaries

**Dependencies:**
- CHRONOS (reads commits/bugs for quest generation)

**Consumers:**
- OCULUS (receives game state updates for UI)

**Interface:**
- Listens to `GameEvents.PLAYER_MOVED`, `NODE_CLICKED`, `SPELL_CAST`
- Emits `GameEvents.HEALTH_CHANGED`, `COMBAT_STARTED`, `QUEST_UPDATED`

## Steering Heuristic

> "If a mechanic exists only to make numbers go up, cut it. Every mechanic must deepen the player's understanding of the codebase's topology or history."

## Key Philosophies

### 1. Diegetic Spells

Spells are **developer actions**, not fantasy magic:

| Spell Name | Effect | Code Analogue |
|------------|--------|---------------|
| **Blame** | Reveals enemy origin | `git blame` |
| **Refactor** | Reduces technical debt | Code cleanup |
| **Debug** | Reveals bug weaknesses | Breakpoint inspection |
| **Patch** | Quick heal | Hotfix |
| **Rebase** | Rewrite history | `git rebase` |
| **Merge** | Combines effects | Branch merging |

### 2. Character Classes

Classes map to **developer roles**:

#### Tank (Refactorer)
- High health, low damage
- Ability: "Absorb Technical Debt" (blocks damage to team)
- Metaphor: The person who cleans up legacy code

#### Healer (Patcher)
- Medium health, no damage
- Ability: "Hotfix" (instant heal), "Rollback" (undo damage)
- Metaphor: The firefighter who keeps production alive

#### DPS (Feature Builder)
- Low health, high damage
- Ability: "Rapid Prototyping" (burst damage), "Move Fast" (extra turn)
- Metaphor: The person shipping features quickly

### 3. The Zachtronics Pivot

**Insight:** Combat is **state inspection**, not button mashing.

Instead of:
```
[Attack] [Defend] [Magic] [Item]
```

We have:
```
[Step Over] [Step Into] [Inspect] [Query]
```

Each "turn" is a **debugging action**:
- You're not "damaging" the bug
- You're **narrowing the search space** for its root cause

**Victory Condition:** Understand the bug's origin (find the commit).

### 4. Quest Generation from Git

**Input:** CHRONOS commit history

**Output:** Procedural quest chains

```typescript
// Example quest generation
function generateQuest(commit: ParsedCommit): Quest {
  if (commit.isBugFix) {
    return {
      title: `Hunt: ${extractBugType(commit.message)}`,
      type: 'bug-hunt',
      description: `Find and eliminate the bug introduced in ${commit.hash.substring(0, 7)}`,
      requirements: [], // First quest
      rewards: [
        { type: 'experience', value: 100 },
        { type: 'knowledge', value: commit.message }
      ]
    };
  }
  // ... feature quests, refactor quests, etc.
}
```

## Implementation Status

- [ ] Character system (stats, progression)
- [ ] Spell factory (symbol-driven generation)
- [ ] Turn-based combat engine
- [ ] Quest generator
- [ ] Encounter system
- [ ] State management (Zustand)

## Turn-Based Combat Flow

```
Player Turn:
  1. Select Action (Spell/Item/Inspect)
  2. Choose Target (Bug/Environment)
  3. Resolve Effect (Damage/Heal/Reveal)
  4. Check Victory Condition

Enemy Turn:
  1. AI Decision (based on bug type)
  2. Execute Attack
  3. Apply Status Effects
  4. Check Defeat Condition
```

**Example Combat:**

```typescript
// Null Pointer Bug encounter
const bug: Bug = {
  id: 'bug_abc123',
  type: 'null-pointer',
  severity: 3,
  health: 100,
  position: [5, 2, 1],
  sourceCommit: 'abc123def456'
};

// Player casts "Debug"
combat.castSpell('debug', bug);
// → Reveals: "This bug was introduced in commit abc123"

// Player casts "Blame"
combat.castSpell('blame', bug);
// → Reveals: "Author: john_doe, Date: 2024-01-15"

// Player casts "Patch"
combat.castSpell('patch', bug);
// → Deals 50 damage, reduces bug health to 50

// Victory: Bug defeated, quest completed
```

## The Gym: Simulation Sandbox

**Purpose:** Test "What if I changed this dependency?"

The Gym is a **safe space** to experiment:
- Fork the codebase state
- Apply hypothetical changes
- See the impact (without affecting the real codebase)

This teaches:
- Dependency relationships
- Breaking change propagation
- Refactoring strategies

## Bug Type Bestiary

Different bugs have different behaviors:

| Bug Type | Behavior | Weakness |
|----------|----------|----------|
| **Null Pointer** | Random attacks | "Type Check" spell |
| **Memory Leak** | Drains mana over time | "Garbage Collect" |
| **Race Condition** | Dodges attacks randomly | "Lock" spell |
| **Off-by-One** | Targets wrong player | "Boundary Check" |

## Future Enhancements

- [ ] Multiplayer (shared quest progress)
- [ ] Skill trees (unlock advanced spells)
- [ ] Item system (linters, testing tools as "equipment")
- [ ] Boss fights (squash merges, major refactors)
