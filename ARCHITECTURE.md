# Dendrovia: Architectural Deep Dive

## The Meta-Strategy: Cognitive Architecture Through Separation

The six-pillar structure is not bureaucracy—it's a **cognitive architecture** that prevents "spaghetti design" where game logic bleeds into rendering, or AI generation blocks user interaction.

### The Steering Principle

> "Does this architectural separation allow two people to work on the project without speaking to each other? If yes, the interface is defined correctly."

## Perspicacious Considerations by Pillar

### I. CHRONOS - The Archaeologist

**Philosophy:** "The Broken Pottery Approach"

We don't pretend to tell objective history. We present **artifacts**. The player's quest is to piece them together.

#### The Squash Merge Problem

**Challenge:** Squash merges erase granular commit history.

**Optimistic Interpretation:** Squash merges are **Boss Fights**.

A squash merge represents massive condensed effort → becomes a "Titan" enemy requiring multi-stage analysis to defeat.

**Narrative Device:** "The Records are Fragmented here, you must use Intuition (Heuristics) to proceed."

This makes the system **honest** and the archaeology **immersive**.

#### Temporal vs Spatial

**Key Distinction:**
- **Chronological Time** = Git history (temporal)
- **Ludological Time** = Game progression (spatial)

The player moves through the **structure of code** (spatial), encountering **history as echoes** (temporal), rather than replaying development linearly.

---

### II. IMAGINARIUM - The Compiler

**Philosophy:** "Curated Determinism"

We don't generate 1000 textures; we generate **1 "Style Sheet"** that the engine applies procedurally.

#### Hallucination as Feature

**Optimistic Insight:** AI "hallucinations" are **surrealist interpretations**.

If the AI generates a "Green Slime" for a memory leak, that's **valid poetic expression**. We're not visualizing the literal code; we're visualizing the **feeling** of the code.

#### The Inspiration Feed

Serves as a **"Mood Board Generator"**:
- Doesn't dictate exact geometry
- Ensures lighting and color grading match cohesive aesthetic
- Prevents "Clown Vomit" look of random procedural generation

#### Non-Blocking Generation

**Steering Heuristic:** Never block user entry on generation.

**Implementation:**
1. Provide "Default Beautiful" fallback immediately
2. Stream in "AI Customized" assets as they complete
3. User sees instant load → progressive enhancement

---

### III. ARCHITECTUS - The Renderer

**Philosophy:** "Macro-SDF, Micro-Mesh"

Use SDFs for **static dendrite structure** (infinite detail). Use **instanced meshes** for dynamic elements (bugs, leaves).

#### The Aesthetic Choice

**Embrace Abstraction:** The "Melted Plastic" look of SDFs is **perfect** for code visualization.

We're not simulating "Real Trees"—we're simulating **Data Trees**. The smooth blending is a design feature, not a rendering artifact.

**Visual References:**
- Tron (glowing edges, digital aesthetic)
- Rez (abstract geometry, rhythm)
- Monument Valley (impossible architecture)

#### Zero Fog / Infinite View

**Traditional Approach:** Use fog to hide distant objects (performance).

**Dendrovia Approach:**
- **Atmospheric perspective** (color shift, not opacity)
- **Lower resolution SDFs** for far objects
- **Depth-based color grading** (Monument Valley style)

This achieves the "see the whole codebase" goal without sacrificing performance.

#### The Ant on a Manifold

**Camera Philosophy (Player Mode):**

The camera is "glued" to the dendrite surface. You walk along branches like an ant on a log.

**Physics:**
- Gravity points **toward the branch axis**
- Movement is **tangent to the surface**
- Jumping "falls back" to the branch

Creates the Monument Valley "impossible perspective" feeling.

---

### IV. LUDUS - The Mechanics

**Philosophy:** "Diegetic Mechanics"

We don't cast "Fireball"; we cast **"Blame"**. Mechanics mimic **cognitive actions** of a developer.

#### The Character Classes

Classes map to **developer roles**:

- **Tank (Refactorer)** = Absorbs technical debt
- **Healer (Patcher)** = Keeps production alive
- **DPS (Feature Builder)** = Ships features rapidly

#### The Zachtronics Pivot

**Insight:** Combat is **state inspection**, not button mashing.

Each "turn" is a **debugging action**:
- Not "damaging" the bug
- **Narrowing the search space** for root cause

**Victory Condition:** Understand the bug's origin (find the commit).

#### The Gym: Simulation Sandbox

**Purpose:** Test "What if I changed this dependency?"

Allows users to:
- Fork the codebase state
- Apply hypothetical changes
- See the impact (without affecting real codebase)

**This teaches:**
- Dependency relationships
- Breaking change propagation
- Refactoring strategies

---

### V. OCULUS - The Interface

**Philosophy:** "World as Wallpaper, UI as Workbench"

The 3D world provides **Navigation and Context** (finding where module lives). The 2D UI provides **Investigation and Content** (reading the code).

#### The Iron Man HUD

**Goal:** Peripheral vision awareness without blocking view.

**Layout Strategy:**
- 3D world provides spatial awareness ("I am deep in utils folder")
- HUD overlays **sharp, high-contrast 2D text** directly in front
- 3D world **recedes/blurs** when reading code (depth of field)

#### Falcon Mode vs Player Mode

**Falcon Mode:**
- For **pattern recognition**, not reading
- Shows "hotspots" (red glowing areas of high churn) from 30,000 feet
- Answers "Where is the mess?" instantly

**Player Mode:**
- For **code reading**, quest interaction
- Full HUD (health, mana, quest tracker)
- Miller Columns for file navigation

#### Orthogonal Text Rule

**Steering Heuristic:** Text must **always be orthogonal** to camera when reading.

Never force user to read tilted text. 3D is for **navigation**, 2D is for **content**.

---

### VI. OPERATUS - The Infrastructure

**Philosophy:** "Local-First is the Ultimate MVP"

Build the "MMO" architecture, but run the "Server" **inside the browser** (WASM/WebWorkers).

#### The Distributed Dungeon

**Insight:** Every user's machine is a "Shard".

**Benefits:**
- Zero server costs until user base justifies it
- Full offline functionality
- Asynchronous multiplayer (share seeds, compare scores)

#### Progressive Loading

**Goal:** <1MB initial load, stream the rest.

**User Experience:**
1. Instant load with "Default Beautiful" aesthetic
2. Progressive enhancement as HD assets arrive
3. Never blocks interaction

---

## Critical Architectural Decisions

### 1. Build-Time Compilation (Default)

**Decision:** IMAGINARIUM runs at **build-time**, outputs cached in git.

**Rationale:**
- Deterministic builds (TurboRepo caching works)
- Faster app startup
- Larger repo size, but better DX

**Trade-off:** Commit generated code, but use `.gitattributes` to diff separately.

---

### 2. Event-Driven Runtime

**Decision:** Pillars communicate via **EventBus** (not direct function calls).

**Rationale:**
- Decouples pillars
- Enables independent development
- Easier testing (mock events)

**Example:**
```typescript
// ARCHITECTUS emits
eventBus.emit(GameEvents.PLAYER_MOVED, { position, branch });

// LUDUS listens
eventBus.on(GameEvents.PLAYER_MOVED, (data) => {
  checkForEncounter(data.position);
});
```

---

### 3. Deterministic AI Caching

**Decision:** Cache AI API responses, use seeded generation.

**Rationale:**
- Same input → same output (reproducible builds)
- TurboRepo remote caching works
- Can opt-in to regeneration

**Implementation:**
```typescript
async function generateConcept(prompt: string, seed: number) {
  const cacheKey = hash({ prompt, seed });
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const result = await callAI(prompt, seed);
  cache.set(cacheKey, result);
  return result;
}
```

---

## The Data Flow Model

### Build-Time Phase

```
Git Repo
    ↓
CHRONOS (Parser)
    ├─ Git history → commits.json
    ├─ AST analysis → code_structure.json
    └─ Metrics → topology.json
    ↓
IMAGINARIUM (Distillation)
    ├─ AI art generation (cached)
    ├─ Color extraction → palettes/*.json
    ├─ SDF compilation → shaders/*.glsl
    └─ L-System rules → lsystems/*.json
    ↓
OPERATUS (Manifest)
    └─ Builds manifest.json (asset registry)
```

### Runtime Phase

```
Browser Loads App
    ↓
OPERATUS (Asset Loader)
    ├─ Fetches manifest.json
    ├─ Loads from OPFS cache (if exists)
    └─ Falls back to CDN/bundle
    ↓
ARCHITECTUS (Renderer)
    ├─ Compiles shaders
    ├─ Builds 3D scene
    └─ Emits spatial events → EventBus
    ↓
LUDUS (Game Logic)
    ├─ Listens to spatial events
    ├─ Updates game state
    └─ Emits UI events → EventBus
    ↓
OCULUS (UI)
    ├─ Listens to UI events
    └─ Renders HUD overlays
```

---

## Performance Budget

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|-----------|--------------|
| Initial Load | <1MB | <2MB | >5MB |
| Time to Interactive | <2s | <5s | >10s |
| Desktop FPS | 60 | 30 | <30 |
| Mobile FPS | 30 | 20 | <20 |
| SDF Complexity | 100 instructions | 200 instructions | >500 |

---

## Risk Mitigation Matrix

| Risk | Mitigation | Owner |
|------|-----------|-------|
| Distillation doesn't work | Build POC first (Phase 0) | IMAGINARIUM |
| WebGPU too slow | Implement hybrid LOD early | ARCHITECTUS |
| Circular dependencies | Event-driven architecture | ALL |
| Poor Git commit quality | Fallback heuristics | CHRONOS |
| Non-deterministic builds | Cache AI responses | IMAGINARIUM |
| Mobile performance | Target 30fps, not 60fps | ARCHITECTUS |

---

## Success Metrics (MVP)

At the end of Phase 8:

- ✅ Can analyze Dendrovia's own codebase
- ✅ Generates playable 3D world from file structure
- ✅ Monument Valley aesthetic achieved
- ✅ Falcon mode + Player mode both functional
- ✅ At least 10 quests generated from Git history
- ✅ One working character class with 4 spells
- ✅ Turn-based combat with 3 bug types
- ✅ Runs at 60fps desktop, 30fps mobile
- ✅ <1MB initial load, <10MB total

---

*"The map is not the territory. The code is the soil; the game is the lens; the art is the vibe."*
