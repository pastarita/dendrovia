# PR: Procedural Generation Atlas — Rendering Heuristics & Spatial Segmentation

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/playground-apps-turbodev                              |
+--------------------------------------------------------------+
|                        **                                    |
|                                                              |
|     +------------------+   +------------------+              |
|     | I HEURISTICS     |   | II SEGMENTATION  |             |
|     | book x 1         |   | book x 1         |             |
|     | [architectus]    |   | [architectus]    |             |
|     +------------------+   +------------------+              |
|                                                              |
|           pass  [SHIELD]  pass                               |
|                  book x 2                                    |
|                                                              |
|              [architectus · research]                        |
|                                                              |
|           files: 2 | +974 / -0                               |
+--------------------------------------------------------------+
|   "Per aspera ad astra"                                      |
+--------------------------------------------------------------+
```

**Compact:** `**` [architectus] book x2 pass/pass +974/-0

---

## Summary

Two research documents establishing the decision-making foundation for ARCHITECTUS rendering architecture and spatial segmentation strategy. Product of 10 parallel research agents investigating procedural generation across NMS-derivative engines, WebGPU browser rendering, professional tool pipelines, and spatial grid systems.

---

## Feature Space Index

### I. Rendering Heuristics & Multi-Objective Decision Framework

**File:** `docs/research/procedural-atlas-II-rendering-heuristics.md`

| Section | Coverage |
|---------|----------|
| NMS-derivative engine survey | 10 engines analyzed: Teardown, Elite Dangerous (Stellar Forge), Astroneer, Star Citizen (Planet Tech v4), Space Engineers (VRAGE), Dual Universe, Rodina, Starfield, Empyrion, NMS |
| Terrain representation tradeoffs | Voxels (MC, DC, non-aligned), heightmap+biomes, SDF raymarching, hierarchical procedural |
| Indie engine community | Gustafsson, Lague, ThinMatrix, Gennari; open-source: Luanti, IOLITE, Octo, Atomontage |
| Web asset delivery pipeline | Draco (90%+ mesh), Meshopt (70-80%), KTX2+Basis (75% GPU mem), progressive loading phases |
| Frame budget allocation | Desktop 16.6ms / Mobile 33.3ms breakdown across JS, scene graph, draw calls, GPU, post-fx |
| Draw call + memory budgets | WebGPU 2-5k calls, mobile 100-200; GPU tex 512MB desktop / 128MB mobile |
| Rendering fidelity tricks | Procedural vs baked textures, skybox strategies, depth tricks, atmospheric perspective, caching |
| Post-processing budget | Bang-for-buck: color LUT (23.3x), grid pattern (23.3x), emissive edges (18.0x), bloom (8.0x) |
| Trap techniques | Volumetric lighting, SSR, full PBR, ray-traced soft shadows (all fight Tron aesthetic) |
| Multi-objective decision matrices | 6 matrices: texture, SDF vs mesh, skybox, post-fx, loading, client vs server |
| 4-tier device strategy | Discrete GPU / Integrated / Mobile Hi / Mobile Lo with adaptive degradation rules |
| Per-tier ms budgets | Specific allocations per rendering phase per tier |

### II. Spatial Segmentation Decision

**File:** `docs/research/procedural-atlas-III-spatial-segmentation.md`

| Section | Coverage |
|---------|----------|
| Key findings registry | 22 findings with source, impact, confidence, and ARCHITECTUS implication |
| Current state assessment | Full codebase audit: no spatial partitioning, single InstancedMesh, O(n) proximity, no grid |
| Segmentation candidates | Voxel grid (63/100), Hex grid (77/100), Pure SDF (59/100), SDF+Hex hybrid (78/100) |
| Qualitative decision matrix | 10 criteria scored per option: visual quality, interactivity, memory, pathfinding, content injection, exfoliation, branch fit, physics, dev effort, aesthetic |
| Engine investigation map | 12 engines ranked P0-P4 for investigation: Teardown (P0), Elite Dangerous (P0), NMS (P1), Astroneer (P1), Civ VI (P2), Dreams (P2), Star Citizen (P2), DRG (P3) |
| Exfoliation pipeline | 4-level LOD: SDF silhouette → coarse hex (12/circ) → fine hex (24-36/circ) → interactive |
| Hex cell data contract | TypeScript interface: cube coords, world position, content type, encounter data, seed, biome |
| Content injection protocol | Typed injection from LUDUS/IMAGINARIUM/OCULUS into hex cells with priority and constraints |
| Recommended architecture | 3-layer: SDF rendering (visual) + hex grid (game logic) + content modules (generation) |
| Hex vs voxel rationale | 6 factors: cylindrical geometry fit, SDF preservation, surface-only cells, isotropy, memory |
| Junction handling | Overlap zones (Phase 2) → junction cells (Phase 5) → geodesic voronoi (future) |
| 6-phase implementation plan | Parameterization → grid gen → spatial indexing → LOD exfoliation → content injection → navmesh |

---

## Key Decisions Documented

| # | Decision | Rationale | Score |
|---|----------|-----------|-------|
| D1 | SDF + Hex hybrid for spatial segmentation | Hex preserves SDF aesthetic, fits cylindrical branches, enables isotropic pathfinding | 78/100 |
| D2 | Procedural textures for 80%+ of surfaces | Tron aesthetic is fundamentally procedural; baked textures waste memory | 23.3x ratio |
| D3 | TSL as shader authoring path | Auto GLSL/WGSL cross-compilation; official Three.js recommendation | Confirmed |
| D4 | Atmospheric perspective over fog | Color shift preserves depth perception without hiding distant dendrites | -- |
| D5 | SDF AO from step count | Free ambient occlusion during raymarch; never waste SSAO pass | 0ms cost |
| D6 | Bloom at half-res with selective layers | Visually identical, 2x cheaper; THREE.Layers targets emissive only | 1ms saved |
| D7 | 4-tier adaptive degradation | Auto-downgrade after 30 consecutive frame misses | Runtime |

---

## Research Methodology

10 parallel research agents across 3 rounds:

**Round 1** (Atlas I — committed in prior PR):
- No Man's Sky engine deep-dive
- WebGPU state of the art (2025-2026)
- Houdini/Blender/Unity/Unreal procedural pipelines
- Procedural generation taxonomy + blind spot analysis

**Round 2** (Atlas II):
- NMS-derivative games and custom engine communities
- Web ports of high-fidelity 3D and optimization patterns
- Rendering fidelity tricks (skyboxes, depth, textures, caching)
- Multi-objective analysis framework

**Round 3** (Atlas III):
- Full codebase exploration of current ARCHITECTUS spatial architecture
- Hexagonal grids, voxel systems, and spatial segmentation research

---

## Files Changed

```
dendrovia/
└── docs/
    └── research/
        ├── procedural-atlas-II-rendering-heuristics.md     # +504 lines
        └── procedural-atlas-III-spatial-segmentation.md    # +470 lines
```

---

## Commits

1. `fc33861` research(architectus): rendering heuristics and multi-objective decision framework
2. `f1f3fab` research(architectus): spatial segmentation decision — SDF + hex hybrid

---

## Test Plan

- [x] Markdown renders correctly in local preview
- [x] Cross-references align with existing t1-t6 research series
- [x] Spatial segmentation recommendation consistent with CLAUDE.md "Macro-SDF, Micro-Mesh" philosophy
- [x] Engine investigation map covers all engines analyzed
- [x] Decision matrices internally consistent (scores sum correctly)
- [ ] Review against Atlas I findings for completeness
