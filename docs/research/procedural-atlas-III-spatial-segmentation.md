# PROCEDURAL ATLAS III — Spatial Segmentation & Decision Registry
## Voxel vs Hex vs SDF: The Interaction Layer Decision

> Compiled: 2026-02-13
> Continuation of PROCEDURAL_ATLAS.md and PROCEDURAL_ATLAS_II.md

---

## TABLE OF CONTENTS

1. [Key Findings Registry](#1-key-findings-registry)
2. [Current State Assessment](#2-current-state)
3. [Segmentation Strategy Analysis](#3-segmentation-strategy)
4. [Engine Investigation Map](#4-engine-investigation-map)
5. [The Exfoliation Pipeline](#5-exfoliation-pipeline)
6. [Recommendation: SDF + Hex Hybrid](#6-recommendation)

---

## 1. KEY FINDINGS REGISTRY

### Master Findings Table

| # | Finding | Source | Impact | Confidence | Implication for ARCHITECTUS |
|---|---------|--------|--------|------------|----------------------------|
| F1 | No spatial segmentation exists beyond recursive file hierarchy | Codebase exploration | CRITICAL | Confirmed | Cannot scale beyond ~10k files; no chunking, no spatial hash, no grid |
| F2 | Entire world is a single InstancedMesh per component type | BranchInstances.tsx, NodeInstances.tsx | HIGH | Confirmed | No per-branch culling; everything renders every frame |
| F3 | Proximity queries are O(n) brute force | BranchTracker (~6x/sec camera distance check) | HIGH | Confirmed | Performance degrades linearly with node count |
| F4 | Quality tier system exists but has no runtime switching | useRendererStore.ts (5 tiers) | MEDIUM | Confirmed | LOD infrastructure exists but is manual, not adaptive |
| F5 | three-mesh-bvh is installed but unused | package.json | MEDIUM | Confirmed | Spatial acceleration was intended but never wired up |
| F6 | MycelialNetwork is a pseudo-spatial layer | mycology/*.ts | MEDIUM | Confirmed | Fungal placement system could become spatial grid seed |
| F7 | EventBus has full spatial event vocabulary | EventBus.ts | HIGH | Confirmed | Infrastructure for spatial triggers is ready |
| F8 | Hex grids eliminate diagonal bias; all 6 neighbors equidistant | Research (Red Blob Games) | HIGH | Established | Isotropic content placement without directional artifacts |
| F9 | Cylindrical parameterization natural for branch geometry | Research (hex on surface) | HIGH | Theoretical | (theta, t) space maps hex grid onto branch surfaces cleanly |
| F10 | SDF-to-voxel conversion is O(n^3) dense, O(n^2) with SVO | Research | HIGH | Established | Voxelization is expensive; SVO mitigates but adds complexity |
| F11 | Hex prisms have 90.7% packing efficiency vs 78.5% for cylinders | Research | LOW | Established | Minor but relevant for memory-constrained scenarios |
| F12 | WFC on hex grids enables constraint-based content filling | Research (Eurographics 2025) | MEDIUM | Emerging | Circuit traces, data flow patterns on branch surfaces |
| F13 | Geodesic pathfinding on hex grid is simple BFS when edges ~equal | Research (Heat method, Dijkstra) | HIGH | Established | "Ant on Manifold" traversal reduces to graph walk |
| F14 | Teardown uses thousands of small non-aligned voxel volumes | NMS-derivative research | MEDIUM | Confirmed | Per-object voxelization better than one big grid |
| F15 | Elite Dangerous uses 64-bit addressing encoding position+sector+body | NMS-derivative research | HIGH | Confirmed | Hierarchical ID scheme maps well to git hash seeding |
| F16 | WebGPU compute can handle 1M+ particles at 60fps in browser | WebGPU research | HIGH | Confirmed | Particle systems for data flow viz are fully feasible |
| F17 | TSL is the correct shader path (auto GLSL↔WGSL) | WebGPU research | HIGH | Confirmed | No need for raw GLSL; TSL gives cross-backend portability |
| F18 | Every successful web 3D project uses WASM for compute | Web port research | HIGH | Confirmed | If L-system/SDF evaluation becomes bottleneck, compile to WASM |
| F19 | Procedural textures win for 80%+ of Tron surfaces | Multi-objective analysis | HIGH | Analytical | Baked textures waste memory on what 3-line shaders do better |
| F20 | SDF gets AO free by tracking step count during march | Rendering tricks research | HIGH | Established | Never waste a separate SSAO pass on raymarched content |
| F21 | Render-to-texture at quarter-res for backgrounds cuts cost 90% | Rendering tricks research | HIGH | Established | Far dendrites rendered to RTT, updated only on camera move |
| F22 | IndexedDB can cache generated geometry across sessions | Caching research | MEDIUM | Established | Generated hex grids + SDF volumes persist between visits |

---

## 2. CURRENT STATE ASSESSMENT

### What Exists (Architecture Diagram)

```
BUILD TIME:
  CHRONOS (git parse)
    → topology.json (FileTreeNode hierarchy)
      → IMAGINARIUM (L-system rules, palettes, noise, mycology)
        → manifest.json → OPERATUS (cache to IDB/OPFS)

RUNTIME:
  DendriteWorld
    → LSystem.fromTopology() → axiom string
      → LSystem.expand() → turtle string
        → TurtleInterpreter.interpret() → TreeGeometry {branches[], nodes[], boundingBox}
          → BranchInstances (1 draw call, all cylinders)
          → NodeInstances (1 draw call, all spheres)
            → BranchTracker (O(n) proximity, ~6x/sec)
              → EventBus (BRANCH_ENTERED, NODE_CLICKED)
                → EncounterSystem (boss/miniboss/bug checks)
```

### What's Missing for Spatial Segmentation

| Gap | Severity | Description |
|-----|----------|-------------|
| Spatial partitioning | CRITICAL | No octree, BVH, or grid. All geometry in one batch. |
| Chunk-based streaming | CRITICAL | Can't load/unload regions. All geometry upfront. |
| Per-branch culling | HIGH | Frustum culling at mesh level only, not per-branch. |
| Spatial hashing | HIGH | O(n) proximity queries in BranchTracker. |
| Distance-based LOD switching | HIGH | No SDF↔mesh transition. Mesh-only currently. |
| Interaction grid | MEDIUM | No discrete cells for game logic, content slots, pathfinding. |
| Navigation mesh | MEDIUM | No surface walkability data for "Ant on Manifold". |
| Pre-computed encounter zones | MEDIUM | Encounters checked per-frame, not pre-binned spatially. |

---

## 3. SEGMENTATION STRATEGY ANALYSIS

### The Four Candidates

#### Option A: Voxel Grid (Regular Cubic)

```
World → Dense/Sparse voxel grid → Marching Cubes → Mesh
```

| Criterion | Score (1-10) | Notes |
|-----------|-------------|-------|
| Rendering quality | 5 | Blocky without expensive MC; loses SDF smoothness |
| Interaction granularity | 9 | Per-voxel editing, destruction, modification |
| Memory efficiency | 4 (dense) / 7 (SVO) | O(n^3) dense; SVO helps but adds complexity |
| Pathfinding | 8 | Grid-based A*/BFS trivial |
| Content injection | 9 | Natural: fill voxels with content types |
| Exfoliation support | 7 | LOD via octree depth levels |
| Branch-surface fit | 3 | Axis-aligned grid poorly fits cylindrical branches |
| Physics/collision | 9 | Discrete collision trivial |
| Implementation effort | 6 | Well-understood but requires MC/DC pipeline |
| Aesthetic preservation | 3 | Loses the "melted plastic" SDF quality |
| **TOTAL** | **63** | |

**Verdict**: Overkill for Dendrovia. Full voxelization destroys the SDF aesthetic that defines the project. Good for Teardown-style destructibility, wrong for data visualization.

#### Option B: Hexagonal Grid (Surface-Projected)

```
Branch → Cylindrical parameterization (theta, t) → Hex grid → Content slots
```

| Criterion | Score (1-10) | Notes |
|-----------|-------------|-------|
| Rendering quality | 8 | Grid is game-logic only; rendering stays SDF/mesh |
| Interaction granularity | 7 | Per-hex-cell interaction; coarser than voxel but sufficient |
| Memory efficiency | 8 | Only surface cells; no volumetric waste |
| Pathfinding | 9 | Isotropic BFS on hex graph; 6-neighbor uniform |
| Content injection | 9 | Hex cells as typed slots (code, quest, creature, decoration) |
| Exfoliation support | 8 | Hex subdivision for detail; LOD via cell granularity |
| Branch-surface fit | 8 | Cylindrical param wraps naturally; distortion at junctions only |
| Physics/collision | 6 | Cell-based collision; less granular than voxel |
| Implementation effort | 5 | Requires parameterization math; novel for this domain |
| Aesthetic preservation | 9 | Grid is invisible to rendering; SDF aesthetic untouched |
| **TOTAL** | **77** | |

**Verdict**: Strong fit. Provides discrete game logic layer without affecting visual quality. Natural for surface-walking camera. Junctions are the main challenge.

#### Option C: Pure SDF (No Discrete Grid)

```
Branch → SDF evaluation → Gradient queries → Continuous interaction
```

| Criterion | Score (1-10) | Notes |
|-----------|-------------|-------|
| Rendering quality | 10 | Native SDF; infinite detail; smooth blending |
| Interaction granularity | 3 | No discrete cells; interaction is continuous/fuzzy |
| Memory efficiency | 10 | Zero geometry storage |
| Pathfinding | 3 | Gradient descent only; no precomputation; expensive per-step |
| Content injection | 2 | Must modify SDF function itself; no "slots" |
| Exfoliation support | 5 | Step count LOD only; no structured drill-down |
| Branch-surface fit | 10 | IS the branch surface by definition |
| Physics/collision | 2 | Requires mesh extraction or SDF sphere-trace |
| Implementation effort | 4 | SDF interaction is research-grade, not production-ready in web |
| Aesthetic preservation | 10 | Perfect; this IS the aesthetic |
| **TOTAL** | **59** | |

**Verdict**: Best for rendering, worst for game mechanics. Cannot support content injection, pathfinding, or exfoliation without a supplementary discrete layer.

#### Option D: SDF + Hex Hybrid (RECOMMENDED)

```
Rendering:  SDF (far) → Mesh extraction (near)
Game Logic: Hex grid in cylindrical parameterization
Interaction: Hex cells as content slots
Pathfinding: Dijkstra on hex graph
Exfoliation: SDF silhouette → coarse hex → detailed hex → full content
```

| Criterion | Score (1-10) | Notes |
|-----------|-------------|-------|
| Rendering quality | 9 | SDF for visual; mesh near; hex invisible to renderer |
| Interaction granularity | 7 | Per-hex-cell; sufficient for all game mechanics |
| Memory efficiency | 7 | Hex grid is lightweight; SDF is zero-cost; mesh cached |
| Pathfinding | 9 | Hex graph BFS; geodesic-corrected at junctions |
| Content injection | 9 | Hex cells typed: {code, quest, creature, decoration, empty} |
| Exfoliation support | 9 | Multi-tier: SDF→coarse hex→fine hex→full content |
| Branch-surface fit | 8 | Cylindrical param natural; junction blending needed |
| Physics/collision | 7 | Hex cells for game collision; SDF sphere-trace for precision |
| Implementation effort | 4 | Most complex; two systems to maintain |
| Aesthetic preservation | 9 | Rendering layer is pure SDF/mesh; hex is invisible |
| **TOTAL** | **78** | |

**Verdict**: Highest score. Preserves SDF aesthetic while enabling all game mechanics. Implementation is the most complex but the architecture is the most extensible.

### Qualitative Decision Matrix (All Four Options)

```
                    Voxel    Hex     Pure SDF    SDF+Hex
                    ─────    ───     ────────    ───────
Visual Quality      ██░░░    ████░   █████       ████░
Interactivity       █████    ███░░   █░░░░       ███░░
Memory              ██░░░    ████░   █████       ███░░
Pathfinding         ████░    █████   █░░░░       █████
Content Injection   █████    █████   █░░░░       █████
Exfoliation         ███░░    ████░   ██░░░       █████
Branch Fit          █░░░░    ████░   █████       ████░
Physics             █████    ███░░   █░░░░       ███░░
Dev Effort          ███░░    ██░░░   ██░░░       ██░░░
Aesthetic           █░░░░    █████   █████       █████
                    ─────    ─────   ─────       ─────
TOTAL               63       77      59          78
```

---

## 4. ENGINE INVESTIGATION MAP

Each reference engine teaches a specific lesson for ARCHITECTUS's spatial segmentation. These are ranked by relevance.

### Tier 1: Direct Architectural Lessons

| Engine | Lesson for ARCHITECTUS | What to Study | Investigation Priority |
|--------|----------------------|---------------|----------------------|
| **Teardown** (Gustafsson) | Small non-aligned voxel volumes per-object, not one big grid | Blog: voxagon.se; How per-branch hex grids mirror per-object voxels | P0 |
| **Elite Dangerous** (Stellar Forge) | 64-bit hierarchical addressing (sector+system+body in one ID) | How to encode repo+dir+file+line into a hierarchical spatial ID | P0 |
| **No Man's Sky** (Hello Games) | Seed-deterministic chunk generation; regenerate-on-demand | Apply to hex grid: generate hex cells from branch seed on approach | P1 |
| **Astroneer** (System Era) | SDF-backed voxel terrain with smooth deformation | SDF→discrete conversion for interaction without losing smoothness | P1 |

### Tier 2: Technique Lessons

| Engine | Lesson for ARCHITECTUS | What to Study | Investigation Priority |
|--------|----------------------|---------------|----------------------|
| **Civilization VI** | Hex grid for strategy layer over continuous terrain | How hex cells carry typed content (city, unit, resource, improvement) | P2 |
| **Dreams** (Media Molecule) | SDF rendering as primary visual + separate interaction layer | How they handle interaction on implicit surfaces | P2 |
| **Star Citizen** (Planet Tech v4) | Climate-data-driven biome assignment per-region | Map "code climate" (language, complexity, churn) to biome-like hex cell typing | P2 |
| **Deep Rock Galactic** | Real-time voxel carving + mesh extraction for tunneling | How to "dig into" a branch (exfoliate code detail) interactively | P3 |

### Tier 3: Pattern Inspiration

| Engine | Lesson for ARCHITECTUS | What to Study | Investigation Priority |
|--------|----------------------|---------------|----------------------|
| **Dual Universe** | 25cm voxel resolution across planet-scale world | Extreme-scale spatial hashing for large monorepos | P3 |
| **Minecraft** | Chunk ring buffer streaming around player | Streaming hex grids around camera position on branch | P3 |
| **Space Engineers** | Memory eviction of unmodified chunks | Discard generated hex grids for unvisited branches | P3 |
| **Townscaper** (Stalberg) | WFC on irregular grid for content placement | WFC on hex grid for code-themed surface decoration | P4 |

### Investigation Protocol Per Engine

For each engine study:
```
1. DOCUMENT: What spatial data structure do they use?
2. IDENTIFY: What is the "atom" of interaction (voxel, cell, tile)?
3. MAP: How does content get injected into the spatial structure?
4. EXTRACT: What is the data contract between generation and runtime?
5. ADAPT: How does this pattern translate to branch-surface hex cells?
6. PROTOTYPE: Build a minimal proof-of-concept in Three.js/R3F
```

---

## 5. THE EXFOLIATION PIPELINE

"Exfoliation" is the progressive revelation of detail within a segment. This is the key capability that spatial segmentation enables.

### Four Levels of Detail

```
LOD 0 — SILHOUETTE (far)
  ├─ Representation: SDF raymarched
  ├─ Data needed:    Branch center-line + radius function
  ├─ Content:        None (pure geometry)
  ├─ Cost:           ~2-4ms for distant branches
  └─ Trigger:        Default for branches >200 units away

LOD 1 — STRUCTURE (mid)
  ├─ Representation: Coarse hex grid (12 hexes around circumference)
  ├─ Data needed:    Branch topology + directory metadata
  ├─ Content:        Hex cells typed by file category (source, test, config, asset)
  ├─ Cost:           Grid generation ~1ms; render as colored bands on SDF
  └─ Trigger:        Branch enters 50-200 unit range

LOD 2 — DETAIL (near)
  ├─ Representation: Fine hex grid (24-36 hexes around circumference)
  ├─ Data needed:    File-level metadata (LOC, complexity, churn, language)
  ├─ Content:        Hex cells carry: encounter zones, quest markers, POIs
  ├─ Cost:           Grid generation ~5ms; instanced mesh decorations
  └─ Trigger:        Branch enters 10-50 unit range

LOD 3 — INTERACTIVE (surface)
  ├─ Representation: Full hex grid + mesh extraction + readable content
  ├─ Data needed:    Full file content, AST, line-level annotations
  ├─ Content:        Readable code on hex cells, clickable functions, animated bugs
  ├─ Cost:           Full mesh + text rendering + particles
  └─ Trigger:        "Ant on Manifold" lands on branch surface
```

### Exfoliation as Data Pipeline

```
Camera approaches branch
  │
  ├─ LOD 0→1: Generate coarse hex grid from branch seed
  │   └─ Input:  Branch centerline, radius, directory children
  │   └─ Output: HexGrid { cells: HexCell[], adjacency: Map }
  │
  ├─ LOD 1→2: Subdivide hex cells, inject content
  │   └─ Input:  Coarse grid + file metadata per cell
  │   └─ Output: DetailedHexGrid { cells with content type, encounter data }
  │   └─ Side:   Pre-compute encounters (no more per-frame checks)
  │
  ├─ LOD 2→3: Full content exfoliation
  │   └─ Input:  Detailed grid + file source + AST
  │   └─ Output: InteractiveGrid { code panels, clickable nodes, particles }
  │   └─ Side:   NavMesh generated for surface walking
  │
  └─ Camera departs: Reverse the process, GC unused grids
```

### Hex Cell Data Contract

```typescript
interface HexCell {
  // Spatial
  q: number;                    // Cube coordinate
  r: number;                    // Cube coordinate
  s: number;                    // Cube coordinate (q+r+s=0)
  worldPosition: Vector3;       // Projected onto branch surface
  surfaceNormal: Vector3;       // For orientation

  // Content
  type: 'source' | 'test' | 'config' | 'asset' | 'empty' | 'junction';
  filePath?: string;            // If cell maps to a specific file
  contentLOD: 0 | 1 | 2 | 3;   // Current detail level

  // Game State
  encounter?: EncounterData;    // Pre-computed encounter (boss/bug/etc)
  visited: boolean;             // Player has walked here
  revealed: boolean;            // Content has been exfoliated

  // Generation
  seed: number;                 // Deterministic from branch seed + cell coords
  biome: string;                // "Code climate" classification
}
```

### Content Injection Protocol

External modules (LUDUS encounters, IMAGINARIUM decorations, OCULUS annotations) inject content into hex cells through a typed protocol:

```typescript
interface ContentInjection {
  targetCell: { q: number, r: number, s: number };
  branchId: string;
  content: {
    type: 'encounter' | 'decoration' | 'annotation' | 'quest' | 'collectible';
    data: unknown;              // Type-specific payload
    renderHint: 'sprite' | 'mesh' | 'particle' | 'text' | 'glow';
    priority: number;           // Higher priority wins if cell is contested
  };
  constraints: {
    minLOD: number;             // Don't show until this LOD level
    exclusive: boolean;         // Only one content per cell?
    persistent: boolean;        // Survives LOD transitions?
  };
}
```

---

## 6. RECOMMENDATION: SDF + HEX HYBRID

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                  DENDROVIA SPATIAL ARCHITECTURE                  │
│                      (Proposed Hybrid)                           │
└─────────────────────────────────────────────────────────────────┘

RENDERING LAYER (Visual):
  ┌──────────────────────────────────────┐
  │  Far:   SDF Raymarching              │ ← Smooth, infinite detail
  │  Mid:   Hybrid SDF + Mesh            │ ← Transition zone
  │  Near:  Instanced Mesh               │ ← Full geometry
  │  Post:  Bloom + Color Grade (half)   │ ← Tron aesthetic
  └──────────────────────────────────────┘
       ↕ (rendering reads hex data for coloring/effects)

GAME LOGIC LAYER (Interaction):
  ┌──────────────────────────────────────┐
  │  Hex Grid per Branch Segment         │
  │  ├─ Cylindrical param (theta, t)     │ ← Wraps naturally
  │  ├─ ~12-20 hexes around circumference│ ← Adjustable density
  │  ├─ Typed cells (code/quest/empty)   │ ← Content slots
  │  └─ Adjacency graph for pathfinding  │ ← BFS traversal
  └──────────────────────────────────────┘
       ↕ (events flow through EventBus)

CONTENT LAYER (Generation):
  ┌──────────────────────────────────────┐
  │  CHRONOS → topology data             │
  │  IMAGINARIUM → visual parameters     │
  │  LUDUS → encounters, quests          │ ← Inject into hex cells
  │  OCULUS → annotations, labels        │
  │  Mycology → fungal specimens         │ ← Already pseudo-spatial
  └──────────────────────────────────────┘
```

### Why Hex Over Voxel (For This Project)

| Factor | Voxel | Hex | Winner |
|--------|-------|-----|--------|
| Branch geometry is cylindrical | Axis-aligned grid wastes interior volume | Cylindrical param fits naturally | **Hex** |
| SDF aesthetic must be preserved | Voxelization replaces SDF | Hex is invisible to renderer | **Hex** |
| Surface-walking camera | 3D grid is overkill for surface movement | 2D grid on surface is ideal | **Hex** |
| Content is on branch surface, not inside | Volumetric cells waste on interior | Surface cells only where needed | **Hex** |
| Pathfinding needs isotropy | Square grid has diagonal bias | Hex has uniform 6-neighbor | **Hex** |
| Memory for large codebases | O(n^3) per branch segment | O(n^2) surface cells only | **Hex** |

### Why Not Pure SDF

The SDF is perfect for rendering but cannot:
- Provide discrete slots for content injection
- Support efficient pathfinding (gradient descent is per-step expensive)
- Pre-compute encounter zones (no spatial bins)
- Enable the game logic layer LUDUS needs

The hex grid solves all of these while remaining invisible to the rendering pipeline.

### Implementation Phases

| Phase | Work | Enables |
|-------|------|---------|
| **Phase 1**: Branch parameterization | Map each branch segment to (theta, t) space | Foundation for all grid work |
| **Phase 2**: Hex grid generation | Generate hex cells on parameterized branches | Content slots, spatial queries |
| **Phase 3**: Spatial indexing | BVH/octree for branch-level culling; hex hash for cell-level | Performance scaling |
| **Phase 4**: LOD-triggered exfoliation | Generate hex grids on approach, GC on departure | Streaming, memory management |
| **Phase 5**: Content injection protocol | Typed injection API for all pillar modules | Full pipeline integration |
| **Phase 6**: Surface-walking navmesh | Dijkstra on hex graph for Ant on Manifold | Player mode navigation |

### Junction Handling (The Hard Problem)

Branch junctions are where cylindrical parameterization breaks down. Three approaches:

| Approach | Complexity | Quality |
|----------|-----------|---------|
| **Overlap zone**: Both parent and child hex grids exist in junction area; blend | Low | Acceptable |
| **Junction cell**: Special hex cell type at branch point; acts as portal | Medium | Good |
| **Geodesic voronoi**: Compute voronoi diagram on junction surface; cells are irregular | High | Best |

**Recommendation**: Start with overlap zones (Phase 2), upgrade to junction cells (Phase 5).

---

## APPENDIX: SOURCES

### Spatial Segmentation
- [Red Blob Games - Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/) — Canonical reference
- [Eurographics 2025 - 3D Procedural Maps with WFC](https://diglib.eg.org/bitstream/handle/10.2312/ceig20251107/ceig20251107.pdf)
- [NVIDIA NGLOD - Neural Geometric LOD](https://research.nvidia.com/labs/toronto-ai/nglod/)

### Engine References
- [Teardown / Voxagon Blog](https://blog.voxagon.se/)
- [Elite Dangerous Stellar Forge](https://80.lv/articles/generating-the-universe-in-elite-dangerous)
- [Star Citizen Planet Tech v4](https://starcitizen.tools/Planet_Tech_v4)
- [Astroneer + UE4](https://www.unrealengine.com/en-US/spotlights/how-system-era-softworks-leveraged-ue4-to-create-astroneer-s-wonderful-universe)
- [Space Engineers Source (GitHub)](https://github.com/KeenSoftwareHouse/SpaceEngineers)

### Pathfinding on Surfaces
- Crane et al. — "The Heat Method for Distance Computation" (ACM 2017)
- [Recast/Detour Navigation](https://github.com/recastnavigation/recastnavigation)

### Community
- [PROCJAM](https://www.procjam.com/)
- [r/proceduralgeneration](https://reddit.com/r/proceduralgeneration)
- [r/VoxelGameDev](https://reddit.com/r/VoxelGameDev)

---

*This document completes the three-part PROCEDURAL ATLAS series. Together they form the research foundation for ARCHITECTUS spatial architecture decisions.*
