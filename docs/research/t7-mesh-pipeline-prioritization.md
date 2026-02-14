# T7: Mesh Pipeline Integration — Prioritization & Playground Strategy

> **Date:** 2026-02-13
> **Domain:** IMAGINARIUM mesh pipeline ↔ 5 pillar interfaces
> **Scope:** ~25 tasks across type system, serialization, adapters, pipeline integration, and playground systems

---

## 1. Interface Gap Summary

The half-edge mesh pipeline is **complete but isolated** — 54 tests passing, 14 composable operations, but zero integration with the distillation pipeline or downstream consumers. Seven critical bridge categories:

| Category | Gaps | Blocking |
|----------|------|----------|
| **Type system** | No `SerializedHalfEdgeMesh`, no `MeshAsset` in shared, no mesh field in `GeneratedAssets` | Everything |
| **Serialization** | No `toJSON`/`fromJSON` for `HalfEdgeMesh`, no disk format spec | OPERATUS, persistence |
| **Adapters** | `ProfileGeometry` ↔ `HalfEdgeMesh` disconnected, no Three.js `BufferGeometry` adapter | ARCHITECTUS rendering |
| **Manifest** | `MycologyManifest` lacks `meshDir`, `FungalSpecimen.assets.meshDataPath` never populated | OPERATUS cataloging |
| **Pipeline invocation** | `DistillationPipeline` never calls mesh generation | Nothing gets generated |
| **Loader** | `AssetLoader` has no `'mesh'` type, `AssetBridge` has no mesh field | ARCHITECTUS loading |
| **Rendering** | ARCHITECTUS has no component for `FlatMeshData` → instanced mesh | Nothing displays |

---

## 2. Upstream/Downstream Interface Analysis

### IMAGINARIUM Produces → 5 Consumers

```
                    ┌─── ARCHITECTUS (renders meshes, loads assets)
                    │
CHRONOS ───► IMAGINARIUM ───► OPERATUS (catalogs, caches, serves)
(topology)    (mesh pipeline)  │
                    │          └─── via AssetLoader → ARCHITECTUS
                    │
                    ├─── LUDUS (spatial encounter zones from mesh regions)
                    │
                    └─── OCULUS (mesh stats in lore, minimap clusters)
```

### Per-Pillar Interface Readiness

| Pillar | Direction | Current State | Missing Bridges | Priority |
|--------|-----------|---------------|-----------------|----------|
| **ARCHITECTUS** | Downstream (renders) | `GeneratedAssets` has no mesh field; no `BufferGeometry` adapter | 5 bridges | **Critical** |
| **OPERATUS** | Downstream (catalogs) | Manifest schema lacks mesh; `AssetLoader` lacks mesh type | 3 bridges | **High** |
| **LUDUS** | Downstream (consumes) | No spatial mesh → encounter mapping | 1 bridge (future) | Low |
| **OCULUS** | Downstream (displays) | No mesh stats in lore/minimap | 1 bridge (future) | Low |
| **CHRONOS** | Upstream (produces) | Topology → mesh params pathway exists (morphology derivation) | 0 bridges | None |

---

## 3. Multi-Objective Task Analysis (~25 Tasks)

### Dimension 1: Type System Foundation (5 tasks)

| # | Task | Blocks | Effort | Impact |
|---|------|--------|--------|--------|
| T1 | Add `SerializedHalfEdgeMesh` + `MeshAsset` to `@dendrovia/shared` types | T4, T6, T8, T10 | S | Critical |
| T2 | Add mesh field to `GeneratedAssets` interface in AssetBridge | T10, T11 | S | Critical |
| T3 | Add `'mesh'` to `AssetDescriptor.type` union in OPERATUS | T8 | S | High |
| T4 | Add `meshDir` field to `MycologyManifest` | T7 | S | High |
| T5 | Add mesh barrel exports to `@dendrovia/imaginarium` package entry | T10, T11 | S | High |

### Dimension 2: Serialization & Persistence (3 tasks)

| # | Task | Blocks | Effort | Impact |
|---|------|--------|--------|--------|
| T6 | Implement `HalfEdgeMesh.toJSON()` / `fromJSON()` serializer | T7, T8 | M | Critical |
| T7 | Write mesh files in `MycologyPipeline` → `mycology/meshes/` | T8, T10 | M | High |
| T8 | Add `loadMesh()` to OPERATUS `AssetLoader` | T10 | M | High |

### Dimension 3: Adapter Functions (5 tasks)

| # | Task | Blocks | Effort | Impact |
|---|------|--------|--------|--------|
| T9 | `ProfileGeometry → HalfEdgeMesh` converter (bridges old + new) | T14 | S | High |
| T10 | `FlatMeshData → Three.js BufferGeometry` adapter (ARCHITECTUS) | T11 | S | Critical |
| T11 | Load meshes in `AssetBridge.loadGeneratedAssets()` | T12 | M | Critical |
| T12 | ARCHITECTUS component for rendering `FlatMeshData` via `InstancedMesh` | — | L | Critical |
| T13 | `applyInstanceTransform()` for positioned mesh instances | T12 | S | Medium |

### Dimension 4: Pipeline Integration (5 tasks)

| # | Task | Blocks | Effort | Impact |
|---|------|--------|--------|--------|
| T14 | Add mesh generation step to `DistillationPipeline` (step 8.5) | T7 | L | Critical |
| T15 | Define per-genus `MeshOp` pipeline compositions (20 genera) | T14 | M | High |
| T16 | Populate `FungalSpecimen.assets.meshDataPath` in `SpecimenCatalog` | T7 | S | High |
| T17 | Add `MESH_READY` event to GameEvents | — | S | Low |
| T18 | Verlet constraint solver (springs, pressure, anchor, hinge) | T15 | M | Medium |

### Dimension 5: Advanced Operations (4 tasks)

| # | Task | Blocks | Effort | Impact |
|---|------|--------|--------|--------|
| T19 | Integrate `isosurface` npm for metaball/SDF → mesh extraction | T15 | M | High (Tier 2 genera) |
| T20 | Integrate `space-colonization` npm for mycelial hyphae layout | — | M | Medium |
| T21 | Port differential growth (Jason Webb 2D → 3D on half-edge) | T18 | L | Medium (Morchella) |
| T22 | Gray-Scott reaction-diffusion on mesh vertices | — | M | Medium (surface detail) |

### Dimension 6: Playground Systems (3 tasks)

| # | Task | Blocks | Effort | Impact |
|---|------|--------|--------|--------|
| T23 | Mushroom Genus Playground (Leva + R3F) — parameter tweaking per genus | T12, T15 | L | High |
| T24 | Mesh Operation Playground — visualize subdivide/smooth/displace in isolation | T12 | M | Medium |
| T25 | Pipeline Composition Playground — chain MeshOps and see result in real-time | T23, T24 | L | High |

---

## 4. Dependency Graph

```
T1 (shared types) ─────┬──► T4 (manifest schema) ──► T7 (write meshes) ──► T8 (load meshes)
                        │                                     │
                        ├──► T6 (serialization) ─────────────┘
                        │
                        ├──► T2 (GeneratedAssets) ──► T11 (AssetBridge) ──► T12 (render component)
                        │                                                         │
T5 (barrel exports) ───┘                                                          │
                                                                                  ▼
T9 (ProfileGeometry adapter) ──► T14 (pipeline invocation) ──► T15 (genus pipelines)
                                         │                            │
T3 (AssetDescriptor) ──► T8            T16 (specimen.assets)         T18 (Verlet solver)
                                                                      │
T10 (FlatMesh→Three.js) ──► T12                                     T19 (isosurface)
                                                                      │
T13 (instance transforms) ──► T12                                    T21 (diff growth)
                                                                      │
T17 (MESH_READY event) ──► (LUDUS, future)                          T22 (RD on mesh)
                                                                      │
T20 (space colonization) ──► (mycelial network, future)             T23 (playground)
                                                                      │
                                                                     T24 (mesh op playground)
                                                                      │
                                                                     T25 (pipeline playground)
```

---

## 5. Critical Path

The shortest path to **meshes rendering in the browser**:

```
T1 → T6 → T2 → T5 → T9 → T14 → T7 → T10 → T11 → T12
```

10 tasks. Estimated effort: ~1,200 lines across 12 files.

---

## 6. Gym / Zoo / Museum Analysis

The Space Park system provides three playground modalities:

| Modality | Purpose | Interaction Pattern |
|----------|---------|-------------------|
| **Gym** | Train/exercise a specific skill in isolation | Input parameters → immediate visual feedback loop |
| **Zoo** | Observe specimens in a curated collection | Browse, inspect, compare — read-only observation |
| **Museum** | Study the process/history/methodology behind artifacts | Educational, explanatory, archival |

### Candidate Playgrounds for the Mesh Pipeline Domain

#### Gyms (Active Parameter Training)

| Gym | Description | Exercises |
|-----|-------------|-----------|
| **G1: Genus Morphology Gym** | Leva sliders control all morphological parameters for a single genus. Live 3D preview updates in real-time as parameters change. | Adjust capRadius/stemHeight/gillCount/bioluminescence → see mesh update. Compare across cap shapes. Find sweet spots. |
| **G2: MeshOp Composition Gym** | Chain MeshOps (subdivide, smooth, displace) in a visual sequence. Each op shows before/after vertex count and timing. | Add/remove/reorder ops. Adjust parameters per op. Observe how composition order affects output. |
| **G3: Reaction-Diffusion Parameter Gym** | Adjust Gray-Scott feed/kill rates and watch patterns emerge on a mesh surface in real-time. | Sweep through parameter space. Identify which (f,k) pairs produce spots vs. stripes vs. labyrinthine. Map to genera. |
| **G4: Verlet Physics Gym** | Define spring/pressure/anchor constraints on a mesh and watch it relax in real-time. | Inflate a mesh, add anchor points, adjust stiffness. Observe equilibrium. |

#### Zoos (Specimen Collection Observation)

| Zoo | Description | Exhibits |
|-----|-------------|----------|
| **Z1: Genus Gallery Zoo** | All 20 genera displayed side-by-side with consistent lighting and camera. Rotate, zoom, compare morphologies. | Grid of 20 pedestals, each with a rotating specimen. Click for lore card. Filter by tier/division/cap shape. |
| **Z2: LOD Transition Zoo** | Single specimen at varying distances. Observe LOD 0 → 1 → 2 → billboard transition. | Distance slider. Triangle count display. Side-by-side LOD comparison. Frame time impact. |
| **Z3: Pipeline Output Zoo** | Side-by-side comparison of Tier 1 (LatheGeometry), Tier 2 (metaball extraction), Tier 3 (special) outputs for the same morphological parameters. | Select genus. See all 3 tier outputs. Compare vertex/face counts, visual quality, generation time. |

#### Museums (Process & Methodology Study)

| Museum | Description | Exhibits |
|--------|-------------|----------|
| **M1: Nervous System Method Museum** | Interactive recreation of Floraform differential growth, Hyphae space colonization, and Reaction Gray-Scott. Step-by-step simulation with pause/resume. | Floraform: watch mesh grow frame by frame. Hyphae: watch veins colonize space. Reaction: watch patterns emerge from noise. Each annotated with algorithm description. |
| **M2: Bezier-to-Mesh Museum** | Visualize the complete SVG → profile → LatheGeometry → HalfEdgeMesh → subdivide → smooth → FlatMeshData pipeline step by step. | Step through pipeline. At each stage, see the intermediate representation. Highlight which vertices were added/moved. |
| **M3: Mycological Taxonomy Museum** | The 20-genus classification system as an explorable encyclopedia. Each genus with biological reference, code-property mapping, morphological derivation, and generated specimen. | Taxonomic tree navigation. Click genus → see real mycological photos, the code-property mapping table, a live generated specimen, and the lore entry. |

---

## 7. Top 3 Playground Priorities

Evaluated against: (a) exercises the most unverified interfaces, (b) provides the most reusable infrastructure, (c) validates the critical path.

### Priority 1: Genus Morphology Gym (G1)

**Why first:** This is the single highest-value playground because it:
- **Forces T9 + T10 + T12** to be implemented (ProfileGeometry → HalfEdgeMesh → BufferGeometry → render) — the core adapter chain
- **Forces T15** to be implemented (per-genus MeshOp pipeline definitions)
- **Tests the full vertical slice** from morphology parameters → mesh → screen
- **Provides immediate visual validation** of the 3-tier genus architecture
- **Reusable:** The R3F canvas + Leva controls pattern becomes the foundation for G2, G3, G4

**Implementation:** React Three Fiber canvas with Leva control panel. Genus selector dropdown → loads genus-specific `MeshOp` pipeline → applies to `buildFromProfile` base mesh → renders via instanced geometry. Display vertex/face count, generation time, and mesh wireframe toggle.

**Infrastructure it creates:** Live mesh preview component, Leva-to-MeshOp binding, genus pipeline registry.

---

### Priority 2: Genus Gallery Zoo (Z1)

**Why second:** This is the **integration test for the entire mycology system**:
- **Forces T14 + T7** (mesh generation in distillation pipeline + file output)
- **Forces T11** (AssetBridge loads mesh data for all 20 genera)
- **Validates determinism** — same topology → same 20 specimens displayed identically
- **Validates LOD** — 20 specimens at different distances exercises the LOD chain
- **Reusable:** The gallery layout + specimen card pattern becomes the collection UI for the actual game

**Implementation:** Grid of 20 pedestals in a 4×5 layout. Each pedestal mounts an `InstancedMesh` for one genus specimen with slow rotation. Click opens lore card (MushroomLore.title, .flavorText, .codeInsight). Filter controls: by division, by cap shape, by tier. Global lighting consistent across all specimens.

**Infrastructure it creates:** Specimen collection renderer, lore card UI, multi-genus batch rendering proof.

---

### Priority 3: Bezier-to-Mesh Museum (M2)

**Why third:** This is the **educational and debugging tool** for the entire pipeline:
- **Forces T6** (serialization — each intermediate stage must be inspectable as data)
- **Forces T5** (barrel exports — museum imports from `@dendrovia/imaginarium`)
- **Validates pipeline determinism** — step-through reveals any non-deterministic behavior
- **Teaches the system to new developers** — the pipeline is complex; a visual step-through makes it comprehensible
- **Reusable:** The step-through debugger pattern applies to any `pipe()` pipeline, not just meshes

**Implementation:** Horizontal step indicator (SVG Path → Bezier Sample → Profile → HalfEdgeMesh → Subdivide → Smooth → Displace → FlatMeshData → Render). Click any step to see the intermediate state. Left panel: data inspector (vertex count, face count, JSON preview). Right panel: 3D preview of the mesh at that stage. Diff view between adjacent steps (which vertices moved, which were added).

**Infrastructure it creates:** Pipeline debugger/inspector, intermediate state serialization, step-through UI pattern.

---

## 8. Implementation Order

```
Wave A (Foundation — enables all playgrounds):
  T1  Add shared types (SerializedHalfEdgeMesh, MeshAsset)
  T5  Add mesh barrel exports to @dendrovia/imaginarium
  T6  Implement HalfEdgeMesh serialization (toJSON/fromJSON)
  T9  ProfileGeometry → HalfEdgeMesh converter
  T10 FlatMeshData → Three.js BufferGeometry adapter

Wave B (Pipeline + Rendering — enables G1):
  T14 Add mesh generation step to DistillationPipeline
  T15 Define per-genus MeshOp pipeline compositions
  T12 ARCHITECTUS mesh rendering component

Wave C (Persistence + Loading — enables Z1):
  T4  Add meshDir to MycologyManifest
  T7  Write mesh files in MycologyPipeline
  T8  Add loadMesh() to OPERATUS AssetLoader
  T11 Update AssetBridge to load meshes
  T16 Populate FungalSpecimen.assets.meshDataPath

Wave D (Playgrounds):
  G1  Genus Morphology Gym
  Z1  Genus Gallery Zoo
  M2  Bezier-to-Mesh Museum

Wave E (Advanced — after playgrounds validate the base):
  T18 Verlet constraint solver
  T19 isosurface integration (Tier 2 genera)
  T21 Differential growth (Tier 3: Morchella)
  T22 Reaction-diffusion on mesh
  T20 Space colonization (mycelial hyphae)
```

---

*25 tasks identified. 10 on critical path. Top 3 playgrounds: Genus Morphology Gym (G1), Genus Gallery Zoo (Z1), Bezier-to-Mesh Museum (M2).*
