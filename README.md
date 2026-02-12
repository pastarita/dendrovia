# 🌳 Dendrovia - Autogamification of Codebase Archaeologization

> **The Vision:** Parse any codebase and generate a playable 3D game world where developers explore code structure as a Monument Valley-inspired dendritic landscape.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## The Paradigm Shift: Procedural Distillation

Instead of shipping **heavy geometric assets**, we compile **AI-generated art into mathematical representations** (SDFs, shaders, noise functions) - creating infinite detail at minimal download size.

```
AI Art → Mathematical Distillation → Real-time Rendering
```

## The Six-Pillar Architecture

Dendrovia is structured as a **cognitive architecture** where each pillar has a single, well-defined responsibility:

```
┌─────────────────────────────────────────────────────────┐
│ BUILD PHASE (Runs once per codebase analysis)          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📜 CHRONOS (Data Source)                              │
│    └─ Parses Git + AST → topology.json                 │
│              ↓                                          │
│  🎨 IMAGINARIUM (Compiler)                             │
│    └─ AI + Distillation → shaders/*.glsl               │
│              ↓                                          │
│  💾 OPERATUS (Infrastructure)                          │
│    └─ Builds manifest.json                             │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ RUNTIME PHASE (Browser execution)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🏛️ ARCHITECTUS (Render Engine)                        │
│    └─ WebGPU raymarching + hybrid LOD                  │
│              ↓                                          │
│  🎮 LUDUS (Game Logic)                                 │
│    └─ Turn-based combat, quests, spells               │
│              ↓                                          │
│  👁️ OCULUS (UI Layer)                                  │
│    └─ HUD, Miller Columns, code reader                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Pillar Responsibilities

| Pillar | Responsibility | Key Output |
|--------|---------------|------------|
| **CHRONOS** | Git + AST parsing | `topology.json` |
| **IMAGINARIUM** | AI → Shader distillation | `shaders/*.glsl` |
| **ARCHITECTUS** | 3D rendering (WebGPU) | Real-time world |
| **LUDUS** | Game mechanics | Combat, quests |
| **OCULUS** | UI overlays | HUD, code reader |
| **OPERATUS** | Infrastructure | Asset loading |

## Quick Start

### Install Dependencies

```bash
# Using bun (recommended)
bun install

# Or using pnpm
pnpm install
```

### Run the Proof of Concept

```bash
# Generate artifacts for one file (Thin Vertical Slice)
bun run slice

# Launch 3D viewer
cd packages/proof-of-concept
bun run dev
```

This will:
1. Parse `package.json` from this repo
2. Generate a procedural color palette
3. Compile an SDF shader
4. Launch a 3D viewer where you can click the branch to read the file

## Project Structure

```
dendrovia/
├── packages/
│   ├── shared/              # Types, events, contracts
│   ├── chronos/             # 📜 Git + AST parser
│   ├── imaginarium/         # 🎨 AI → Shader compiler
│   ├── architectus/         # 🏛️ R3F + WebGPU engine
│   ├── ludus/               # 🎮 Game mechanics
│   ├── oculus/              # 👁️ UI components
│   ├── operatus/            # 💾 Infrastructure
│   └── proof-of-concept/    # 🧪 Thin vertical slice
├── turbo.json               # TurboRepo pipeline
└── package.json             # Workspace config
```

## The Thin Vertical Slice

Instead of building all six pillars horizontally, we **drill one feature through the entire stack** to force the APIs to mature:

**Feature:** "Visualize One File"

```
CHRONOS: Parse package.json
    ↓
IMAGINARIUM: Generate color palette
    ↓
ARCHITECTUS: Render SDF branch
    ↓
LUDUS: Detect click event
    ↓
OCULUS: Show file contents
```

This proves the architecture works end-to-end.

## Core Philosophies

### 1. Cognitive Architecture

> "Does this architectural separation allow two people to work on the project without speaking to each other? If yes, the interface is defined correctly."

Each pillar communicates **only via the EventBus** at runtime:

```typescript
// ARCHITECTUS emits spatial event
eventBus.emit(GameEvents.NODE_CLICKED, { nodeId, position });

// LUDUS listens and responds
eventBus.on(GameEvents.NODE_CLICKED, (data) => {
  checkForEncounter(data.position);
});
```

### 2. Build-Time vs Runtime

**Build-Time (CHRONOS → IMAGINARIUM):**
- Runs once per codebase
- Outputs static artifacts (JSON, GLSL)
- Deterministic (cacheable)

**Runtime (ARCHITECTUS → LUDUS → OCULUS):**
- Runs in browser
- Event-driven architecture
- Loads pre-generated artifacts

### 3. Local-First Architecture

The game **fully works offline**:
- No server required for v1
- Assets bundled (<1MB initial)
- State persisted in OPFS
- Multiplayer is **opt-in** (future)

### 4. Hybrid Rendering

**Macro-SDF, Micro-Mesh:**
- SDF for **static dendrite** (infinite detail)
- Instanced meshes for **dynamic elements** (bugs, particles)
- Adaptive LOD (SDF far, mesh near)

### 5. Diegetic Mechanics

Spells are **developer actions**, not fantasy magic:

- **Blame** → `git blame` (reveal enemy origin)
- **Refactor** → Code cleanup (absorb tech debt)
- **Debug** → Breakpoint inspection (reveal weaknesses)
- **Patch** → Hotfix (quick heal)

## Development Workflow

### Terminal Setup (Pipeline Factory)

```bash
# Launch all six pillars in parallel
bun run dev
```

This opens six terminal tabs:
1. **CHRONOS** - Watching for new commits
2. **IMAGINARIUM** - Hot-reloading shaders
3. **ARCHITECTUS** - Vite dev server
4. **LUDUS** - Test runner
5. **OCULUS** - Storybook (UI components)
6. **OPERATUS** - Asset server

### Building for Production

```bash
# Build all packages
bun run build

# This executes the TurboRepo pipeline:
# chronos#parse → imaginarium#distill → architectus#build
```

## Technical Stack

- **Runtime:** Bun 1.0+
- **Monorepo:** TurboRepo
- **Rendering:** Three.js r171 (WebGPU)
- **Framework:** React 18 + React Three Fiber
- **State:** Zustand
- **Parsing:** isomorphic-git, ts-morph
- **Build:** Vite

## Steering Heuristics

Key decision-making principles:

1. **CHRONOS:** "Reward the discovery of 'Why,' not just 'What.'"
2. **IMAGINARIUM:** "Never block user entry on generation. Default Beautiful first."
3. **ARCHITECTUS:** "If shader exceeds budget, bake to mesh (LOD)."
4. **LUDUS:** "If a mechanic only makes numbers go up, cut it."
5. **OCULUS:** "Text must always be orthogonal to camera when reading."
6. **OPERATUS:** "Build as if networked, implement as local function call."

## Implementation Phases

- [x] **Phase 0:** Six-pillar monorepo setup
- [x] **Phase 0.5:** Thin vertical slice (proof-of-concept)
- [ ] **Phase 1:** CHRONOS - Git + AST parser
- [ ] **Phase 2:** IMAGINARIUM - AI distillation pipeline
- [ ] **Phase 3:** ARCHITECTUS - WebGPU rendering
- [ ] **Phase 4:** LUDUS - Game mechanics
- [ ] **Phase 5:** OCULUS - UI components
- [ ] **Phase 6:** OPERATUS - Infrastructure
- [ ] **Phase 7:** Integration & polish

## Current Status: 10-15% Complete

**What's Working:**
- ✅ Six-pillar architecture scaffolded
- ✅ Shared types and EventBus
- ✅ Proof-of-concept (thin vertical slice)
- ✅ Color palette generation (deterministic)

**Next Steps:**
1. Run the proof-of-concept (`bun run slice`)
2. Implement CHRONOS Git parser
3. Build IMAGINARIUM distillation engine
4. Validate SDF performance benchmarks

## Contributing

Each pillar can be developed **independently** by different teams/agents:

1. **Fork the repo**
2. **Pick a pillar** (e.g., CHRONOS)
3. **Read the pillar's README** (`packages/chronos/README.md`)
4. **Respect the interface** (EventBus contracts in `packages/shared`)
5. **Submit PR** when tests pass

The architecture ensures you can work without blocking others.

## License

MIT - See LICENSE file

## Vision

**Goal:** Any developer can:
1. Point Dendrovia at their GitHub repo
2. Wait 30 seconds (parsing + generation)
3. Explore their codebase as a 3D Monument Valley world
4. Learn the history by playing quests
5. Share their world with others (via seed URL)

**Success Metric:** "I understand this codebase better after playing for 15 minutes than I would after reading docs for an hour."

---

Built with 🌳 by the Dendrovia collective.
