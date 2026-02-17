# Getting Started with Dendrovia

## What Was Just Implemented

We've successfully implemented the **architectural foundation** for Dendrovia - the six-pillar cognitive architecture with a working end-to-end pipeline.

### ✅ What's Working Now

1. **Complete Monorepo Structure** - Six pillars with proper boundaries
2. **Shared Type System** - TypeScript contracts between pillars
3. **Event-Driven Architecture** - EventBus for pillar communication
4. **Procedural Generation** - Deterministic color palette + SDF shader generation

---

## Quick Start: Analyze a Repository

From the monorepo root:

```bash
cd /Users/Patmac/denroot/OPERATUS/dendrovia
bun run refresh:worlds
```

This runs the CHRONOS parser with `--install`, generating world data under `worlds/`.

### Launch the App

```bash
bun run dev
```

Navigate to `http://localhost:3000` to see the portal with available worlds.

---

## Directory Structure

```
/Users/Patmac/denroot/
│
├── README.md                    # Overview of the 6 checkout folders
│
├── CHRONOS/                     # 📜 Git/AST parsing R&D
│   └── README.md
│
├── IMAGINARIUM/                 # 🎨 AI distillation R&D
│   └── README.md
│
├── ARCHITECTUS/                 # 🏛️ Rendering R&D + MAIN MONOREPO
│   └── dendrovia/               ⭐ THE PRODUCTION MONOREPO
│       ├── README.md
│       ├── ARCHITECTURE.md
│       ├── IMPLEMENTATION_STATUS.md
│       ├── GETTING_STARTED.md   ← You are here
│       ├── package.json
│       ├── turbo.json
│       ├── packages/
│       │   ├── shared/          # Types, EventBus, contracts
│       │   ├── chronos/         # Git + AST parser
│       │   ├── imaginarium/     # AI → Shader compiler
│       │   ├── architectus/     # R3F rendering engine
│       │   ├── ludus/           # Game mechanics
│       │   ├── oculus/          # UI components
│       │   └── operatus/        # Infrastructure
│       └── scripts/
│
├── LUDUS/                       # 🎮 Game mechanics R&D
│   └── README.md
│
├── OCULUS/                      # 👁️ UI/UX R&D
│   └── README.md
│
└── OPERATUS/                    # 💾 Infrastructure R&D
    └── README.md
```

---

## Key Files Explained

### Root Monorepo Configuration

| File | Purpose |
|------|---------|
| `package.json` | Workspace configuration (Bun + TurboRepo) |
| `turbo.json` | Build pipeline (CHRONOS → IMAGINARIUM → ARCHITECTUS) |
| `.gitignore` | Excludes `node_modules`, `dist`, `generated/` |

### Shared Contracts (packages/shared/)

| File | Purpose |
|------|---------|
| `src/types/index.ts` | TypeScript interfaces for all pillars |
| `src/events/EventBus.ts` | Event-driven communication system |
| `src/contracts/index.ts` | JSON schemas for generated files |

---

## Development Workflow

### Option 1: Work on the Full Pipeline

```bash
cd /Users/Patmac/denroot/ARCHITECTUS/dendrovia
bun install
bun run dev  # Launch all pillars (future: pipeline-factory)
```

### Option 2: Work on a Single Pillar

```bash
cd /Users/Patmac/denroot/ARCHITECTUS/dendrovia/packages/chronos
bun install
bun run dev
```

### Option 3: Experiment in a Checkout Folder

```bash
cd /Users/Patmac/denroot/CHRONOS
# Create prototypes, test Git parsing algorithms, etc.
```

---

## Next Steps: Implementation Roadmap

### Immediate (Phase 1): CHRONOS - Week 2-3

**Goal:** Parse Dendrovia's own codebase

**Tasks:**
1. Implement Git history parser (isomorphic-git)
2. Build AST parser (ts-morph)
3. Calculate complexity metrics
4. Generate `topology.json`

**Test Command:**
```bash
cd packages/chronos
bun run parse --path /Users/Patmac/denroot/ARCHITECTUS/dendrovia
```

**Success Criteria:**
- ✅ Parse 100+ files
- ✅ Classify 50+ commits
- ✅ Identify 10+ hotspots

---

### Phase 2: IMAGINARIUM - Week 4-5

**Goal:** AI art → Shader distillation pipeline

**Tasks:**
1. Integrate AI API (Stable Diffusion or local model)
2. Build image → SDF extractor
3. Implement caching layer
4. Generate shaders for different file types

**Test Command:**
```bash
cd packages/imaginarium
bun run distill --topology ../chronos/generated/topology.json
```

**Success Criteria:**
- ✅ Generate 5 unique shaders
- ✅ Deterministic output (same input = same result)
- ✅ <5 second generation time

---

### Phase 3: ARCHITECTUS - Week 6-7

**Goal:** Render procedural dendrites at 60fps

**Tasks:**
1. Implement WebGPU renderer
2. Build SDF raymarching system
3. Add hybrid LOD (SDF far, mesh near)
4. Create Falcon ↔ Player camera modes

**Test Command:**
```bash
cd packages/architectus
bun run dev
# Should open browser at localhost:3010
```

**Success Criteria:**
- ✅ 60fps on desktop (M1 MacBook)
- ✅ 30fps on mobile (iPhone 12+)
- ✅ Smooth camera transitions

---

### Phase 4: Integration - Week 8

**Goal:** Full end-to-end pipeline

**Tasks:**
1. Connect CHRONOS → IMAGINARIUM → ARCHITECTUS
2. Implement LUDUS encounter detection
3. Add OCULUS Miller Columns
4. Set up OPERATUS asset serving

**Test Command:**
```bash
bun run slice  # Should work for ANY GitHub repo
```

**Success Criteria:**
- ✅ Load a real GitHub repo
- ✅ Generate playable world
- ✅ Click branches to read code

---

## Architectural Principles

### 1. Cognitive Separation

> "Does this architectural separation allow two people to work on the project without speaking to each other?"

Each pillar has:
- ✅ **Clear responsibility** (documented in README)
- ✅ **Defined interface** (EventBus contracts)
- ✅ **Independent development** (no cross-dependencies at runtime)

### 2. Build-Time vs Runtime

**Build-Time (CHRONOS → IMAGINARIUM):**
- Runs once per codebase
- Outputs static artifacts (JSON, GLSL)
- Deterministic (TurboRepo caching works)

**Runtime (ARCHITECTUS → LUDUS → OCULUS):**
- Runs in browser
- Event-driven architecture
- Loads pre-generated artifacts

### 3. The Thin Vertical Slice

Instead of building all six pillars horizontally (feature by feature), we **drill one complete feature through all layers**:

```
Parse ONE file
    ↓
Generate ONE palette
    ↓
Render ONE branch
    ↓
Detect ONE click
    ↓
Show ONE overlay
```

This **forces the APIs to mature immediately** and proves the architecture works end-to-end.

---

## Troubleshooting

### "Module not found" errors

```bash
# Reinstall dependencies
cd /Users/Patmac/denroot/ARCHITECTUS/dendrovia
rm -rf node_modules bun.lock
bun install
```

### Generated world data is missing

Re-run the CHRONOS parser:
```bash
bun run refresh:worlds
ls worlds/
```

---

## Contributing

Each pillar can be developed independently:

1. **Pick a pillar** (e.g., CHRONOS)
2. **Read the README** (`packages/chronos/README.md`)
3. **Respect the interface** (EventBus contracts in `packages/shared`)
4. **Submit PR** when tests pass

The architecture ensures you can work without blocking others.

---

## Resources

- **Main Documentation:** `README.md`
- **Architecture Details:** `ARCHITECTURE.md`
- **Implementation Status:** `IMPLEMENTATION_STATUS.md`
- **This Guide:** `GETTING_STARTED.md`

---

*Built with 🌳 by the Dendrovia collective*

*Last Updated: 2026-02-12*
