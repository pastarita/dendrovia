# PR: Mesh Pipeline Foundation — Half-Edge Data Structure, Composable Operations, Pipeline Integration

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/mesh-pipeline-foundation                              |
+--------------------------------------------------------------+
|                         MAJOR (***)                           |
|                                                              |
|     +------------------+   +------------------+              |
|     | I FOUNDATION     |   | II INTEGRATION   |             |
|     | mullet x 3       |   | mullet x 2       |             |
|     | [imaginarium]    |   | [imaginarium|    |             |
|     |                  |   |  architectus]    |             |
|     +------------------+   +------------------+              |
|                  +------------------+                        |
|                  | III RESEARCH     |                        |
|                  | book x 2         |                        |
|                  | [docs]           |                        |
|                  +------------------+                        |
|                                                              |
|   skip  [PER-CHEVRON: Purpure|Or|Tenné]  skip               |
|                   mullet x 5 | book x 2                     |
|                                                              |
|              [imaginarium|shared|architectus|docs]            |
|                                                              |
|           files: 27 | +4085 / -4                             |
+--------------------------------------------------------------+
|   "Per aspera ad astra"                                      |
+--------------------------------------------------------------+
```

**Compact:** `***` [imaginarium|shared|architectus|docs] mullet x5 book x2 skip|skip +4085/-4

---

## Summary

Introduces a composable half-edge mesh pipeline inspired by Nervous System (Floraform/Hyphae), the Grasshopper ecosystem (Kangaroo/Weaverbird), and demoscene procedural techniques. 14 atomic mesh operations compose via `pipe()` into per-genus generation pipelines for 20 fungal genera across 3 complexity tiers. Meshes are generated as step 8.5 of the distillation pipeline (50 specimens → 75,996 vertices in 500ms), serialized in a versioned OPERATUS-compatible format with automatic fallback chain (enriched → base → parametric → billboard), and rendered in ARCHITECTUS via GPU-instanced `MushroomInstances` (1 draw call per genus). Backed by 7 parallel research investigations across SVG inflation, implicit surfaces, browser-native procedural generation, classic CG techniques, Nervous System methodology, Grasshopper ecosystem practitioners, and GH-to-TypeScript translation. 80 mesh tests, 261 IMAGINARIUM total, 99 ARCHITECTUS, 0 failures.

## Features

### Space I: Foundation (3 commits)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | Half-edge mesh data structure | `HalfEdgeMesh` with array-of-structs integer indices. Builders: `buildFromIndexed`, `buildFromProfile` (LatheGeometry equivalent), `buildFromCylinder`. Queries: `vertexNeighbors` (CW+CCW boundary traversal), `vertexFaces`, `isBoundaryVertex`. Export: `toFlatArrays` → Float32Array positions/normals + Uint32Array indices | Complete |
| 2 | Composable pipeline | `MeshOp` type (`HalfEdgeMesh → HalfEdgeMesh`), `pipe()` for left-to-right composition, `when()` conditional, `repeat(n)` iteration, `MeshPipeline` fluent builder with per-step timing | Complete |
| 3 | Mesh operations | Loop subdivision (`subdivide(n)`), Laplacian smoothing (`smooth(n, factor)`), Taubin smoothing (shrinkage-free), `displaceNormal`, `displaceByFunction`, `displaceByField`, `displaceByNoise` (deterministic hash-based 3D noise) | Complete |
| 4 | Serialization | `serialize()` → JSON-safe `SerializedMeshData` v1 with optional topology (saves ~40% when omitted). `deserializeToFlat` (fast), `deserializeToHalfEdge` (full), `deserializeWithFallback` (cascading). Version field for OPERATUS migration support | Complete |
| 5 | Adapters | `profileToHalfEdge`, `cylinderToHalfEdge`, `specimenToHalfEdge` bridge existing MeshGenerator. `applyPipelineToProfile` wraps execution with automatic fallback (never throws) | Complete |
| 6 | Shared types | `MeshManifestEntry` (hash + format + tier + vertex/face counts + size), `SerializedMeshData` v1, `MeshFormat` (halfedge/indexed/profile), `MeshTier` (enriched/base/parametric/billboard). `AssetManifest.meshes` field | Complete |

### Space II: Integration (2 commits)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 7 | Genus pipelines | `genusPipeline(genus)` returns genus-specific `MeshOp`. Tier 1 (12 genera): subdivide(1)+smooth(2). Tier 2 (5): subdivide(2)+smooth(3)+noise(0.02). Tier 3 (3): Morchella aggressive noise, Hericium minimal, Trametes inflation. `DEFAULT_PIPELINE` + `STEM_PIPELINE` fallbacks | Complete |
| 8 | Pipeline step 8.5 | `generateMeshAssets()` orchestrator in `DistillationPipeline`. Per-specimen: generateMeshData → genusPipeline → applyPipeline → serialize → write meshes/{id}-cap.json + stem.json. Per-specimen try/catch. 50 specimens → 75,996 vertices in 500ms | Complete |
| 9 | Manifest extension | `ManifestInput.meshes` → conditional inclusion in manifest output. `MeshManifestEntry` with SHA-256 hash for OPERATUS cache invalidation | Complete |
| 10 | MushroomInstances | R3F component: groups specimens by genus → 1 `InstancedMesh` per genus (1 draw call). Builds `THREE.BufferGeometry` from `FlatMeshData`. Per-instance transforms from placement, per-instance colors from morphology, emissive pulsing for bioluminescence | Complete |
| 11 | AssetBridge mesh loading | `GeneratedAssets.meshes: Map<string, FlatMeshData>`. Parallel fetch of manifest.meshes entries → `deserializeToFlat()`. Per-mesh failure never blocks other assets | Complete |

### Space III: Research (2 commits)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 12 | T6 research | 7 parallel investigations: SVG inflation, implicit surfaces, browser procedural, classic CG, Nervous System, Grasshopper ecosystem, GH-to-TypeScript. 676 lines, 90+ references | Complete |
| 13 | T7 prioritization | 25 tasks, 5 waves, interface gap analysis across 5 pillars. Top 3 playgrounds: Genus Morphology Gym, Genus Gallery Zoo, Bezier-to-Mesh Museum | Complete |

## Test Plan

- [x] Half-edge mesh: 28 tests (construction, queries, boundary traversal, flat export)
- [x] Pipeline + ops: 26 tests (pipe, repeat, when, subdivide, smooth, displace, integration)
- [x] Serialization + adapters: 26 tests (round-trip, fallback, JSON safety, determinism, size budget)
- [x] IMAGINARIUM full suite: 261 tests, 0 failures
- [x] ARCHITECTUS full suite: 99 tests, 0 failures
- [x] Pipeline performance: 50 specimens → 75,996 vertices in 500ms (budget: 5000ms)
- [x] Determinism: same input → identical serialized JSON output
- [x] Fallback chain: broken pipeline → base mesh returned (never throws)
- [x] Serialized size: <50KB per mushroom cap (verified in test)
- [ ] Manual: MushroomInstances renders in dev server with visible specimens
- [ ] Manual: LOD transition from mesh to billboard at distance

## Files Changed

```
dendrovia/
├── docs/research/
│   ├── t6-mycological-asset-pipeline.md            # NEW: 7-track research (676 lines)
│   └── t7-mesh-pipeline-prioritization.md          # NEW: 25-task prioritization (279 lines)
├── packages/shared/src/types/index.ts              # +MeshManifestEntry, SerializedMeshData,
│                                                   #  MeshFormat, MeshTier, AssetManifest.meshes
├── packages/imaginarium/
│   ├── src/
│   │   ├── index.ts                                # +mesh pipeline barrel exports
│   │   ├── mesh/
│   │   │   ├── HalfEdgeMesh.ts                     # NEW: core data structure (310 lines)
│   │   │   ├── pipeline.ts                         # NEW: pipe, when, repeat, MeshPipeline
│   │   │   ├── serialize.ts                        # NEW: serialize/deserialize with fallback
│   │   │   ├── adapters.ts                         # NEW: ProfileGeometry ↔ HalfEdgeMesh bridge
│   │   │   ├── genusPipelines.ts                   # NEW: 20-genus MeshOp definitions
│   │   │   ├── generateMeshAssets.ts               # NEW: per-specimen mesh orchestrator
│   │   │   ├── index.ts                            # NEW: mesh barrel exports
│   │   │   └── ops/
│   │   │       ├── subdivide.ts                    # NEW: Loop subdivision
│   │   │       ├── smooth.ts                       # NEW: Laplacian + Taubin smoothing
│   │   │       ├── displace.ts                     # NEW: normal/function/field/noise displacement
│   │   │       └── index.ts                        # NEW: ops barrel
│   │   └── pipeline/
│   │       ├── DistillationPipeline.ts             # +step 8.5 mesh generation
│   │       └── ManifestGenerator.ts                # +meshes field in ManifestInput
│   └── __tests__/mesh/
│       ├── half-edge.test.ts                       # NEW: 28 tests
│       ├── pipeline.test.ts                        # NEW: 26 tests
│       └── serialize.test.ts                       # NEW: 26 tests
└── packages/architectus/
    ├── package.json                                # +@dendrovia/imaginarium dependency
    ├── src/
    │   ├── index.ts                                # +MushroomInstances export
    │   ├── components/
    │   │   ├── MushroomInstances.tsx                # NEW: GPU-instanced mushroom renderer
    │   │   └── DendriteWorld.tsx                    # +conditional MushroomInstances render
    │   └── loader/
    │       └── AssetBridge.ts                      # +meshes Map in GeneratedAssets
```

## Commits

1. `eb8b07f` feat(imaginarium): add half-edge mesh foundation and composable pipeline
2. `18042d4` docs(research): add T6 mycological asset pipeline research — 7 parallel investigations
3. `0e9f145` docs(research): add T7 mesh pipeline prioritization — 25 tasks, 3 playgrounds
4. `31419ef` feat(shared): add versioned mesh asset types for OPERATUS delivery
5. `35dc874` feat(imaginarium): add mesh serialization, adapters, and fallback chain
6. `4919a43` feat(imaginarium): add mesh generation step to distillation pipeline
7. `d2d86f8` feat(architectus): add MushroomInstances component and mesh asset loading

## Design Decisions

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| 1 | Array-of-structs with integer indices (not object refs) | Serializable, cache-friendly, no GC pressure from object graph | Object references (GC pressure, not serializable), flat typed arrays only (no topology queries) |
| 2 | Optional topology in serialization | GPU-only consumers (ARCHITECTUS) save ~40% file size by omitting half-edge topology | Always include (wastes space for renderers), separate files (complexity) |
| 3 | `MeshTier` fallback chain: enriched → base → parametric → billboard | Graceful degradation — if subdivision/smoothing fails, still get renderable geometry. Each tier independently cacheable by OPERATUS | Single-tier (all or nothing), error propagation (blocks rendering) |
| 4 | `applyPipelineToProfile` wraps with try/catch | Mesh pipeline must NEVER block the distillation pipeline. A broken MeshOp returns the base mesh, not an error | Let errors propagate (blocks pipeline), skip mesh entirely (loses data) |
| 5 | Per-genus pipeline via `genusPipeline(genus)` lookup | One-liner pipeline definitions per genus. Adding a genus = adding one `pipe()` call. The Nervous System composition principle | Hardcoded per-genus geometry (no composability), single pipeline for all (no visual differentiation) |
| 6 | Power-of-2 Bezier sampling + vertex quantization | Deterministic byte-identical output. IEEE 754 exactly represents `k/2^n` fractions | Arc-length parameterization (iterative, platform-divergent), unquantized floats (cross-browser drift) |
| 7 | 1 InstancedMesh per genus in MushroomInstances | Minimizes draw calls. 20 genera = 20 draw calls max. All instances of same genus share geometry | 1 mesh per specimen (thousands of draw calls), BatchedMesh (requires upfront vertex budget) |
| 8 | AssetBridge mesh loading parallel + per-mesh fallback | A missing/corrupt mesh file for one specimen doesn't prevent others from loading | Sequential loading (slow), all-or-nothing (fragile) |

## Related

| Document | Relationship |
|----------|-------------|
| `docs/research/t6-mycological-asset-pipeline.md` | 7-track research foundation for this implementation |
| `docs/research/t7-mesh-pipeline-prioritization.md` | 25-task prioritization and playground strategy |
| `docs/pr-descriptions/PR_DESCRIPTION_IMAGINARIUM_MYCOLOGY.md` | Prior PR establishing the mycology taxonomy system |
| `docs/pr-descriptions/PR_DESCRIPTION_CROSS_PILLAR_INTEGRATION.md` | Prior PR establishing cross-pillar event wiring |
