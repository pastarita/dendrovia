# T6: Mycological Asset Pipeline — SVG-to-3D Generation Research

> **Investigation Date:** 2026-02-13
> **Scope:** 7 parallel research tracks across 4 domains
> **Purpose:** Establish the technical foundation for converting parametric mushroom morphology descriptions into efficient 3D meshes via a deterministic, browser-native pipeline

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [SVG Inflation to 3D Geometry](#2-svg-inflation-to-3d-geometry)
3. [Implicit Surfaces & Point Cloud Methods](#3-implicit-surfaces--point-cloud-methods)
4. [Browser-Native Procedural 3D Generation](#4-browser-native-procedural-3d-generation)
5. [Classic CG Organic Techniques](#5-classic-cg-organic-techniques)
6. [Nervous System Methodology](#6-nervous-system-methodology)
7. [Grasshopper Ecosystem & Biomorphic Practitioners](#7-grasshopper-ecosystem--biomorphic-practitioners)
8. [Grasshopper-to-TypeScript Translation](#8-grasshopper-to-typescript-translation)
9. [Synthesized Architecture](#9-synthesized-architecture)
10. [Implementation Status](#10-implementation-status)
11. [References](#11-references)

---

## 1. Executive Summary

Seven parallel research investigations converged on a **three-tier genus complexity architecture** powered by a **composable mesh pipeline** built from ~14 atomic operations extracted from the computational design ecosystem (Nervous System, Grasshopper/Kangaroo, demoscene).

### The Core Insight

Jessica Rosenkrantz and Jesse Louis-Rosenberg (Nervous System) demonstrated that a compact set of geometric primitives — spring-mass physics, edge subdivision, Voronoi partitioning, PDE solvers, space colonization — compose into radically different organic morphologies depending on configuration. Their three key algorithms map directly to fungal morphology:

| Algorithm | Nervous System Project | Fungal Application |
|-----------|----------------------|-------------------|
| **Space colonization** | Hyphae lamps | Mycelial network layout |
| **Differential growth** | Floraform jewelry | Fruiting body cap surfaces |
| **Reaction-diffusion** | Reaction collection | Surface ornamentation (spots, pores, zones) |

### The Architecture

20 fungal genera are served by three tiers of increasing complexity, all sharing the same composable `MeshOp` pipeline:

| Tier | Genera | Technique | Build Time |
|------|--------|-----------|------------|
| **1 — Simple** (12) | Agaricus, Russula, Mycena, Coprinus, Pleurotus, Psilocybe, Lactarius, Cordyceps, Xylaria, Clavaria, Phallus, Tuber | LatheGeometry from Bezier profiles | <1ms |
| **2 — Organic** (5) | Amanita, Boletus, Armillaria, Cantharellus, Ganoderma | Metaball/SDF → surface nets extraction | 5–150ms |
| **3 — Special** (3) | Morchella (Voronoi pitting), Hericium (instanced spines), Trametes (RD zones) | Custom per-genus techniques | 50–200ms |

---

## 2. SVG Inflation to 3D Geometry

### Primary Finding: LatheGeometry from Bezier Profiles

The proven pipeline, confirmed by the Desbenoit 2004 mushroom paper and the `mushroom-atlas` Three.js implementation:

```
SVG <path> string
  → path-data-parser (normalize to M/L/C/Z)
  → bezier-js (sample at power-of-2 t values)
  → Vector2[] profile points (quantized to 1/4096 grid)
  → Three.js LatheGeometry (cap: 32 segments, stem: 16 segments)
  → Three.js InstancedMesh (one per genus, LOD-aware)
```

### Inflation Algorithms Evaluated

| Algorithm | Source | Applicability | Verdict |
|-----------|--------|---------------|---------|
| **Teddy** (Igarashi 1999) | SIGGRAPH 1999 | Low — produces amorphous blobs, no radial symmetry | Reject |
| **Monster Mash** (Google 2021) | WebAssembly + WebGL | Medium-low — Poisson inflation, can't do gills | Reject |
| **Inflatemesh** (arpruss) | Python/Inkscape | Low — stochastic random-walk, slow | Reject |
| **FiberMesh** (Nealen 2007) | SIGGRAPH 2007 | Low — interactive sculpting, not procedural | Reject |
| **LatheGeometry** | Three.js built-in | Excellent — radially symmetric caps + stems | **Primary** |

### Revolution vs. Extrusion

| Part | Technique | Rationale |
|------|-----------|-----------|
| Cap (pileus) | LatheGeometry | Radially symmetric — revolution surface |
| Stem (stipe) | LatheGeometry | Cylindrical with taper |
| Gills (lamellae) | Custom radial planes | Thin radial features |
| Bracket forms | ExtrudeGeometry | Non-symmetric shelf shapes |
| Spots/warts | Instanced spheres | Small decorative elements |

### Deterministic Mesh Guarantees

- **Power-of-2 sampling** (N=16, 32, 64): all `t` values exactly representable in IEEE 754
- **Vertex quantization**: `Math.round(x / (1/4096)) * (1/4096)` absorbs platform rounding differences
- **Math.fround()** on intermediate calculations ensures Float32Array precision matching

### Key Libraries

| Library | npm | Role |
|---------|-----|------|
| `path-data-parser` | `path-data-parser` | SVG path normalization (all curves → cubic Bezier) |
| `bezier-js` | `bezier-js` | Bezier math: evaluation, arc length, splitting |
| Three.js `LatheGeometry` | Built-in | Revolution surface from profile points |
| Three.js `SVGLoader` | `three/addons` | Full SVG document → ShapePath arrays |
| `svg-mesh-3d` | `svg-mesh-3d` | CDT triangulation of SVG paths |

### Mushroom-Specific Prior Art

- **Desbenoit et al., "Interactive Modeling of Mushrooms" (Eurographics 2004)** — seminal paper treating mushrooms as three separate revolution surfaces unified by a shared skeleton axis
- **`mushroom-atlas` (ferluht/GitHub)** — working Three.js LatheGeometry mushroom generator with Bezier profiles, built for NFT generation (deterministic seeds)
- **NYU Future Reality Lab "Procedural Fungi Generation"** — Bezier splines + Poisson disk placement + gravity-based clustering

---

## 3. Implicit Surfaces & Point Cloud Methods

### Metaballs / Blobby Surfaces

Mushroom SDF composition from scalar field primitives:

```
F(p) = cap_dome(p) + stem_cylinder(p) + basal_bulb(p) - gill_torus(p)
```

Each primitive contributes to a scalar field; the isosurface at `F(p) = threshold` is extracted via marching cubes or surface nets.

| Grid Resolution | Triangles | Extraction Time (JS) |
|----------------|-----------|---------------------|
| 16³ | 100–500 | 0.5–2ms |
| 32³ | 500–3,000 | 5–15ms |
| 64³ | 3,000–15,000 | 50–150ms |

### SDF Composition for Cap Shapes

| CapShape | SDF Approach |
|----------|-------------|
| `convex` | `sdSphere` with y-scale < 1 (flattened dome) |
| `campanulate` | `sdRoundCone` inverted, narrow top, wide base |
| `umbonate` | `opSmoothUnion(dome, smallSphere_at_apex)` |
| `infundibuliform` | Negative `sdCappedCone` + rim torus |
| `plane` | Very flat ellipsoid (y-scale ~0.1) |
| `depressed` | `opSmoothSubtraction(smallSphere_at_center, dome)` |

### Morchella Honeycomb Problem

**Solution:** 3D Voronoi displacement on SDF cap, extracted via marching cubes at build time.

```glsl
float cellDist = voronoi3D(p * voronoiScale);
float pits = pitDepth * (1.0 - smoothstep(0.0, 0.3, cellDist));
return baseCap + pits;
```

Polygon count: ~8,000–15,000 triangles (pitting adds significant surface area).

### Hericium Cascading Spines

**Hybrid approach:**

| Distance | Technique | Triangles | Draw Calls |
|----------|-----------|-----------|------------|
| Close (LOD 0) | Instanced cones on metaball body | ~3,000 | 2 |
| Medium (LOD 1) | Shell texturing (16 shells) | ~16,000 | 16 |
| Far (LOD 2) | Billboard sprite | 2 | 1 |

### Point Cloud Methods

**Verdict: weakest fit.** Parametric descriptions are clean and structured — no noisy scan data that would benefit from Poisson smoothing. Use metaballs or SDF composition instead.

### Marching Cubes Libraries

| Package | Notes |
|---------|-------|
| `isosurface` (mikolalysenko) | Surface Nets + MC, ~8KB, returns raw arrays |
| `softxels` | Chunked MC for Three.js with color support |
| `@bitheral/marching-cubes` | Direct Three.js integration |
| WebGPU MC (Will Usher) | 10–50x faster than CPU, within 5% of native Vulkan |

---

## 4. Browser-Native Procedural 3D Generation

### Three.js BufferGeometry Construction

Two approaches for mushroom morphology:

1. **LatheGeometry** (radially symmetric caps/stems) — sub-1ms construction
2. **Raw BufferGeometry** (non-symmetric features) — ~2–5ms including normal computation

### WebGPU Compute Shaders

Storage buffers with `GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX` enable GPU-side mesh generation with zero CPU-GPU readback. **Caveat:** GPU floating-point is NOT cross-device deterministic — use CPU for canonical geometry, GPU for preview only.

### Web Workers + Transferable ArrayBuffers

The recommended threading pattern for the OPERATUS pipeline:

```typescript
// Worker generates vertex data (pure math, no DOM)
self.postMessage(
  { positions, normals, indices },
  [positions.buffer, normals.buffer, indices.buffer]  // zero-copy transfer
);
```

- Transfer overhead: microseconds for ~5KB mushroom geometry
- Worker pool of 2–4 workers distributes genera across cores
- Total per-specimen: ~5–10ms (well within 100ms budget)

### Instanced Mesh Optimization

| Package | Feature |
|---------|---------|
| `THREE.InstancedMesh` | Built-in, 1 draw call per genus |
| `THREE.BatchedMesh` | Mixed geometries, single material |
| `@three.ez/instanced-mesh` | Per-instance frustum culling, LOD, BVH raycasting |

### Deterministic Floating Point

- **IEEE 754 basic ops** (+, -, *, /, sqrt): guaranteed identical across platforms
- **Transcendentals** (sin, cos): NOT formally guaranteed, but practically consistent
- **Math.fround()**: rounds to Float32, ~1ns per call
- **Mulberry32 PRNG**: deterministic seeded randomness, ~200 bytes, >2¹²⁸ period

### Playground Systems

**Leva** (pmndrs) is the recommended GUI for a mushroom parameter playground:

```typescript
const params = useControls('Amanita', {
  capRadius: { value: 3, min: 0.5, max: 10 },
  stemHeight: { value: 5, min: 1, max: 15 },
  gillCount: { value: 24, min: 8, max: 64, step: 1 },
  bioluminescence: { value: 0.3, min: 0, max: 1 },
});
```

---

## 5. Classic CG Organic Techniques

### Superquadrics (Barr 1981)

Two exponent parameters (e1, e2) map to all 6 cap shapes:

| Cap Shape | e1 | e2 | Additional |
|-----------|----|----|------------|
| Convex | 0.8–1.0 | 1.0 | None |
| Campanulate | 1.5–2.5 | 1.0 | Slight taper |
| Plane | 0.2–0.4 | 1.0 | None |
| Umbonate | 0.3 | 1.0 | Additive Gaussian bump |
| Infundibuliform | 0.8 | 1.0 | Z-inversion + taper |
| Depressed | 0.5 | 1.0 | Subtractive Gaussian |

Half-superellipsoid at 8×5 tessellation = **80 triangles** — visibly smooth.

### Generalized Cylinders (Agin & Binford 1976)

Sweep cross-section along spine curve with **parallel transport frames** (twist-free). Per-genus radius profiles:

```
r_amanita(t) = base * (1 + 0.8*exp(-((t-0.1)²)/0.02)) * lerp(1.0, 0.7, t) + ring_bump
r_boletus(t) = base * (1.3 - 0.5*t)
r_cordyceps(t) = base * 0.3 * (1.0 + 0.2*noise(t*10))
```

### Graftals (Prusinkiewicz 1990, Desbenoit 2004)

L-system derived geometry grafted onto surfaces. Feature-to-graftal mapping:

| Feature | Graftal Type | Triangle Cost | Genera |
|---------|-------------|---------------|--------|
| Radial gills | Thin quad strips | 2 tri/gill | Agaricus, Amanita, Mycena |
| Forking ridges | Extruded curve strips | 4–8 tri/ridge | Cantharellus |
| Wart/spot patches | Hemisphere decals | 0 (texture) | Amanita muscaria |
| Spine arrays | Small cones | 3 tri/tooth | Hericium |
| Coral branches | Recursive cylinders | 12–16 tri/branch | Clavaria |

### Reaction-Diffusion (Turing 1952, Witkin & Kass 1991)

Gray-Scott parameters for genus-specific surface patterns:

| Pattern | f | k | Genus |
|---------|---|---|-------|
| Spots (mitotic) | 0.055 | 0.062 | Amanita wart patches |
| Labyrinthine/maze | 0.04 | 0.06 | Morchella honeycomb ridges |
| Concentric rings | 0.078 | 0.061 | Trametes versicolor zones |
| Pores/holes | 0.035 | 0.065 | Boletus pore surface |
| Branching ridges | 0.025 | 0.05 | Cantharellus vein ridges |

Baked at build time: 256×256 texture, ~50ms per genus, zero polygon cost at runtime.

### LOD Strategy

| LOD | Distance | Triangles | Technique |
|-----|----------|-----------|-----------|
| 0 | <15m | 60–100 | Full mesh (superquadric + gen. cylinder + gills) |
| 1 | 15–30m | 16–24 | Reduced segments, gills as normal map |
| 2 | >30m | 2–4 | Billboard impostor (cylindrical or octahedral) |

Billboard crossover at ~30m where mushroom occupies <20 pixels on screen.

### Demoscene Heritage

Ctrl-Alt-Test (2023) documented the key insight: **SDF-derived normals** (via central differences on the distance field) produce smooth shading even on coarse marching cubes extraction, eliminating faceted artifacts that plague low-poly organic meshes.

---

## 6. Nervous System Methodology

### Core Thesis

**Don't design objects; design the processes that generate objects.**

Jessica Rosenkrantz (MIT biology + architecture) and Jesse Louis-Rosenberg (MIT mathematics) write all their own design software in C++/CGAL/Cinder. Every collection has bespoke simulation code — they do NOT use Grasshopper as a primary tool.

### Algorithm Catalog

| Algorithm | Project | Biological Basis |
|-----------|---------|-----------------|
| **Leaf venation / Space colonization** | Hyphae, Xylem | Auxin flux canalization (Runions et al. 2005) |
| **Differential growth** | Floraform | Edge tissue growing faster than interior → buckling |
| **Reaction-diffusion** | Reaction | Gray-Scott two-chemical system (Turing 1952) |
| **DLA / Phase-field** | Dendrite puzzles | Dendritic solidification (crystal growth) |
| **Anisotropic Voronoi** | Corollaria | Cellular tissue organization with stress alignment |
| **Spring-mass / Cell simulation** | Cell Cycle, Radiolaria | Radiolarian silica skeletons |
| **Minimal surfaces** | Porifera | Glass sponge (Porifera) triply periodic surfaces |
| **Rigid body folding** | Kinematics | Articulated panel tessellation |

### Floraform (Differential Growth) — Deep Dive

Per-timestep operations on a half-edge triangle mesh:

1. **Force computation**: stretch springs (edge rest length) + bend forces (dihedral angle between faces)
2. **Integration**: update vertex positions from forces
3. **Growth**: expand edge rest lengths by spatially-varying growth rate (geodesic distance from source)
4. **Subdivision**: split edges above length threshold (longest-in-triangle priority)
5. **Edge flipping**: maintain mesh quality after splits

Physics based on Grinspun et al., "Discrete Shells" (discrete differential geometry).

### Primitive Operation Set (Extracted Across All Projects)

**Mesh topology:** edge split, edge flip, edge collapse, cell subdivision, half-edge traversal

**Physics/forces:** spring (Hooke's law), bend/dihedral, numerical integration (Euler/Verlet), collision detection, rigid body dynamics

**Growth:** edge rest-length expansion, spatially-varying growth rates, auxin attraction/consumption, phase-field solidification, elastic rod growth

**Spatial partitioning:** Voronoi diagram, Delaunay triangulation, centroidal Voronoi optimization (Lloyd's), capacity-constrained + anisotropic variants

**PDE/fields:** diffusion (Laplacian), reaction (Gray-Scott), anisotropic diffusion, phase-field evolution

**Surface geometry:** Laplacian smoothing, minimal surface fitting, surface thickening, geodesic distance

### Mapping to Fungal Morphology

| Fungal Structure | NS Algorithm | Primitives |
|-----------------|-------------|------------|
| Hyphal tip growth | Space colonization | Auxin attraction, branching |
| Mycelial network | Space colonization + Voronoi | Anastomosis, reticulation |
| Fruiting body cap | Differential growth | Edge expansion, bend energy |
| Bracket shelves | Differential growth + boundary | Edge growth from fixed zone |
| Spore ornamentation | Reaction-diffusion | Gray-Scott on surface mesh |
| Sclerotia | DLA / phase-field | Brownian aggregation |

### Open Source

GitHub: [github.com/nervoussystem](https://github.com/nervoussystem) — OBJExport, voxel editor, glShader, Computational-Design-in-Nature course materials.

---

## 7. Grasshopper Ecosystem & Biomorphic Practitioners

### Daniel Piker — Kangaroo Physics

Position-based dynamics solver where everything is a **Goal** (constraint/force). The IGoal interface: `PIndex[]`, `Move[]`, `Weighting[]`, `Calculate()`.

Key goals for organic forms:

| Goal | Operation | Mushroom Application |
|------|-----------|---------------------|
| Length (Spring) | Maintain edge distance | Branch segments, membranes |
| Pressure | Depth-dependent force on faces | Cap inflation |
| Hinge | Set dihedral angle between faces | Shell curvature |
| LiveSoap | Area-minimizing + adaptive remesh | Minimal surfaces |
| SphereCollide | Equal-size sphere packing | Cellular crowding |

Goals compose additively: solver finds equilibrium minimizing total energy.

### David Rutten — Grasshopper Architecture

Data Trees (hierarchical `{path}` → items) enable implicit parallelism over structured geometry. A "definition" (visual script) is a DAG of pure-function components — deterministic, composable, parametric.

### Michael Hansmeyer — Subdivision Cascades

Modified Catmull-Clark where vertices are **extruded along normals** (not just averaged). Per-face parametric variation at each level produces ornamental complexity. 6–8 iterations: cube → 6M+ faces.

### Andy Lomas — Morphogenetic Creations

Particle-based cellular growth: nutrient accumulation from "light", division threshold, inter-cell springs + torsion + repulsion. Subtle parameter variations produce corals, organs, microorganisms.

### Key Grasshopper Plugins

| Plugin | Author | Primitive Operations |
|--------|--------|---------------------|
| **Kangaroo** | Daniel Piker | Springs, pressure, hinge, collision, anchor, minimal surface |
| **Cocoon** | David Stasiuk | Marching cubes from metaball scalar fields |
| **Dendro** | ryein | OpenVDB: mesh→volume, Boolean, smooth, offset, blend |
| **Anemone** | Mateusz Zwierzycki | Loop iteration in the DAG (enables recursion) |
| **Weaverbird** | Giulio Piacentino | Catmull-Clark, Loop, Doo-Sabin, stellate, thicken |
| **Mesh+** | — | Triply periodic surfaces, weave, topological effects |
| **Millipede** | Sawako Kaijima | FEM topology optimization (bone-like density fields) |
| **Biomorpher** | John Harding | Interactive evolutionary algorithms for form selection |

### 5 Canonical Biomorphic Pipeline Patterns

1. **Generate-Simulate-Refine** (Kangaroo): mesh → goals → solver → subdivide
2. **Recursive Growth** (Anemone): seed → loop(transform + branch) → wrap → output
3. **Field-Driven Morphology** (RD/Voronoi): surface → sample → field computation → geometry
4. **Subdivision Cascade** (Hansmeyer): primitive → (subdivide + perturb) × N → output
5. **Differential Growth** (Nervous System): seed mesh → loop(forces + integrate + grow + split + flip)

---

## 8. Grasshopper-to-TypeScript Translation

### Half-Edge Mesh in JavaScript

| Package | Notes |
|---------|-------|
| `three-mesh-halfedge` | TypeScript, direct Three.js integration |
| `mda.js` (YCAM InterLab) | Full operator suite: extrude, subdivide, smooth |
| `geometry-processing-js` (CMU) | Academic quality, Laplacian matrices, curvature |

**Recommendation:** Custom implementation (built — see Section 10) using `geometry-processing-js` as reference architecture.

### Mesh Subdivision

| Package | Scheme | Notes |
|---------|--------|-------|
| `three-subdivide` | Loop | Active, Three.js native, `LoopSubdivision.modify()` |
| `gl-catmull-clark` | Catmull-Clark | For quad meshes |
| `verb-nurbs` | NURBS | Full curves + surfaces, Web Worker support |

### Spring-Mass / Force-Directed Simulation

Kangaroo's solver translates to a Verlet integration loop (~50 lines):

```typescript
function verletStep(particles, constraints, gravity, damping, iterations) {
  // 1. Integration: pos += (pos - prev) * damping + gravity
  // 2. Constraint satisfaction (iterated): project each constraint
}
```

| Package | Notes |
|---------|-------|
| `d3-force-3d` | Velocity Verlet, link/charge/collision forces in 3D |
| `cannon-es` (pmndrs) | Full rigid body (NOT for soft-body mesh) |
| `verlet-js` | Simple Verlet particles + distance/angle constraints |

### Differential Growth

Core algorithm (4 steps per timestep): attraction → repulsion → alignment → edge split.

| Project | Language | Notes |
|---------|----------|-------|
| Jason Webb `2d-differential-growth-experiments` | JavaScript (p5.js) | Best documented reference |
| Inconvergent `differential-line` / `differential-mesh` | Python | Canonical reference |
| Adrian Toncean real-time implementation | JavaScript + WebGL | Performance-optimized |

### Space Colonization

```typescript
import SpaceColonization from 'space-colonization';
const sc = SpaceColonization({
  hormones: attractorPoints,
  growthStep: 0.3,
  splitChance: 0.4,
  type: '3d',
  mode: 'split', // trees/hyphae (open) or 'straight' (leaf venation, closed)
});
```

### Composable Pipeline Pattern

```typescript
type MeshOp = (mesh: HalfEdgeMesh) => HalfEdgeMesh;

const pipeline = pipe(
  subdivide(2),
  inflate(0.03, 50),
  relax(10),
  displaceByRD(0.04, 0.06, 200),
);

const result = pipeline(baseMesh);
```

### Implementation Priority

1. Half-edge mesh + BufferGeometry conversion ✅ (implemented)
2. Loop subdivision ✅ (implemented)
3. Verlet solver (50 lines — unlocks relaxation, inflation, growth)
4. Compose pattern ✅ (implemented)
5. Space colonization via `space-colonization` npm (mycelial hyphae)
6. Differential growth (port Jason Webb 2D → 3D)
7. Mesh-space reaction-diffusion (genus-specific cap textures)

---

## 9. Synthesized Architecture

### Three-Tier Genus Pipeline

**Tier 1 — LatheGeometry (12 genera, <1ms each)**

Agaricus, Russula, Mycena, Coprinus, Pleurotus, Psilocybe, Lactarius, Cordyceps, Xylaria, Clavaria, Phallus, Tuber

```typescript
const cap = buildFromProfile(capProfile, 16);
const enriched = pipe(subdivide(1), smooth(2), displaceByNoise(0.01))(cap);
```

**Tier 2 — Metaball/SDF Extraction (5 genera, 5–150ms each)**

Amanita, Boletus, Armillaria, Cantharellus, Ganoderma

```typescript
const field = evaluateMetaballField(capDome, stemCylinder, basalBulb, grid32);
const mesh = surfaceNetsExtract(field, isoValue);
const enriched = pipe(smooth(3), displaceByNoise(0.02))(mesh);
```

**Tier 3 — Special Techniques (3 genera)**

- **Morchella**: Voronoi displacement on SDF → marching cubes
- **Hericium**: Metaball body + 200–300 instanced cones
- **Trametes**: Half-disc extrusion + reaction-diffusion texture

### Shared MeshOp Vocabulary

| Operation | Type | Lines | Source |
|-----------|------|-------|--------|
| `buildFromProfile` | Constructor | ~40 | Desbenoit 2004 |
| `buildFromCylinder` | Constructor | ~15 | Generalized cylinders |
| `subdivide(n)` | Topology | ~120 | Loop 1987 |
| `smooth(n, factor)` | Geometry | ~40 | Laplacian smoothing |
| `taubinSmooth(n)` | Geometry | ~10 | Taubin 1995 |
| `displaceNormal(amount)` | Geometry | ~15 | Kangaroo Pressure |
| `displaceByFunction(fn)` | Geometry | ~15 | Custom |
| `displaceByField(field)` | Geometry | ~15 | RD output |
| `displaceByNoise(amp, freq)` | Geometry | ~50 | Perlin 1985 |
| `pipe(...ops)` | Composition | ~3 | Grasshopper wiring |
| `when(pred, op)` | Control flow | ~3 | Conditional |
| `repeat(n, op)` | Iteration | ~5 | Anemone loop |

### Per-Genus Pipeline Definitions

| Genus | Pipeline | Key Ops |
|-------|----------|---------|
| Agaricus | `pipe(subdivide(1), smooth(2))` | Base case |
| Amanita | `pipe(subdivide(2), inflate(0.03, 50), smooth(5))` | Inflation + spots via RD |
| Boletus | `pipe(subdivide(1), inflate(0.02, 30))` | Thick porous cap |
| Cantharellus | `pipe(subdivide(2), inflate(-0.02, 30), smooth(3))` | Inverted pressure (funnel) |
| Morchella | `pipe(subdivide(2), grow(config, 100), displaceByRD(0.04, 0.06, 200))` | Differential growth + pitting |
| Hericium | `pipe(subdivide(1), inflate(0.05, 30))` + instanced spines | Hybrid mesh + instances |
| Mycena | `pipe(subdivide(1), displaceByNoise(0.005))` | Tiny, minimal processing |
| Trametes | `pipe(extrudeHalf, smooth(2))` + RD concentric zones | Bracket + texture |

### Polygon Budget

| LOD | Distance | Budget | Technique |
|-----|----------|--------|-----------|
| 0 | <15m | 60–100 tri | Full pipeline output |
| 1 | 15–30m | 16–24 tri | Reduced segments |
| 2 | >30m | 2–4 tri | Billboard impostor |

At 1000 instanced mushrooms with LOD, ~100K triangles total — well within GPU budget.

---

## 10. Implementation Status

### Completed (this session)

| Module | File | Tests |
|--------|------|-------|
| Half-edge mesh data structure | `src/mesh/HalfEdgeMesh.ts` | 28 |
| Composable pipeline | `src/mesh/pipeline.ts` | 12 |
| Loop subdivision | `src/mesh/ops/subdivide.ts` | 4 |
| Laplacian + Taubin smoothing | `src/mesh/ops/smooth.ts` | 5 |
| Normal/function/field/noise displacement | `src/mesh/ops/displace.ts` | 5 |
| **Total** | **7 files, ~850 lines** | **54 tests, 0 failures** |

### Next Implementation Steps

| Priority | Module | Approach | Est. Lines |
|----------|--------|----------|-----------|
| 1 | Verlet constraint solver | Custom (spring, pressure, anchor, hinge) | ~150 |
| 2 | `isosurface` integration | npm + wrapper for SDF → HalfEdgeMesh | ~80 |
| 3 | `space-colonization` integration | npm + network → capsule segments | ~60 |
| 4 | Differential growth | Port Jason Webb 2D → 3D on half-edge | ~200 |
| 5 | Gray-Scott on mesh | Mesh Laplacian + per-vertex simulation | ~100 |
| 6 | Genus pipeline definitions | One-liner `pipe()` per genus | ~60 |
| 7 | Leva playground | React Three Fiber + genus parameter GUI | ~150 |

---

## 11. References

### Foundational Papers

- Barr, A.H. "Superquadrics and Angle-Preserving Transformations." IEEE CG&A, 1981.
- Agin, G.J. & Binford, T.O. "Computer Description of Curved Objects." IEEE Trans. Computers, 1976.
- Loop, C. "Smooth Subdivision Surfaces Based on Triangles." MS Thesis, University of Utah, 1987.
- Turing, A. "The Chemical Basis of Morphogenesis." Phil. Trans. Royal Society, 1952.
- Witkin, A. & Kass, M. "Reaction-Diffusion Textures." SIGGRAPH 1991.
- Grinspun, E. et al. "Discrete Shells." SIGGRAPH/Eurographics SCA, 2003.
- Prusinkiewicz, P. & Lindenmayer, A. "The Algorithmic Beauty of Plants." Springer, 1990.
- Hoppe, H. "Progressive Meshes." SIGGRAPH 1996.
- Runions, A. et al. "Modeling and Visualization of Leaf Venation Patterns." SIGGRAPH 2005.
- Runions, A. et al. "Modeling Trees with a Space Colonization Algorithm." Eurographics 2007.
- Igarashi, T. et al. "Teddy: A Sketching Interface for 3D Freeform Design." SIGGRAPH 1999.
- Wang, W. et al. "Computation of Rotation Minimizing Frames." ACM TOG, 2008.

### Mushroom-Specific

- Desbenoit, B. et al. "Interactive Modeling of Mushrooms." Eurographics 2004. [INRIA](https://maverick.inria.fr/Publications/2004/DVGG04/)
- ferluht. "mushroom-atlas." [GitHub](https://github.com/ferluht/mushroom-atlas) + [HackerNoon tutorial](https://hackernoon.com/how-to-draw-generative-nft-mushrooms-with-threejs)
- NYU Future Reality Lab. "Procedural Fungi Generation." [Project](https://frl.nyu.edu/procedural-fungi-generation/)
- SIGGRAPH Asia 2024. "Exploring Fungal Morphology Simulation." [arXiv](https://arxiv.org/abs/2409.05171)

### Computational Design Practitioners

- Nervous System (Rosenkrantz & Louis-Rosenberg). [n-e-r-v-o-u-s.com](https://n-e-r-v-o-u-s.com/)
- Floraform blog post. [Detailed technical writeup](https://n-e-r-v-o-u-s.com/blog/?p=6721)
- Hyphae lamps. [Blog](https://n-e-r-v-o-u-s.com/blog/?p=1701)
- Nervous System education. [Simulation and Nature in Design](https://n-e-r-v-o-u-s.com/education/simulation/)
- Hansmeyer, M. "Subdivided Columns." [Project](https://michael-hansmeyer.com/subdivided-columns)
- Lomas, A. "Cellular Forms." [Paper](https://andylomas.com/extra/andylomas_paper_cellular_forms_aisb50.pdf)
- Ctrl-Alt-Test. "Procedural 3D Mesh Generation in a 64kB Intro." [Blog](https://www.ctrl-alt-test.fr/2023/procedural-3d-mesh-generation-in-a-64kb-intro/)

### Grasshopper Plugins

- Kangaroo Physics. [Food4Rhino](https://www.food4rhino.com/en/app/kangaroo-physics) + [K2Goals GitHub](https://github.com/Dan-Piker/K2Goals)
- Cocoon. [Grasshopper Docs](https://grasshopperdocs.com/addons/cocoon.html)
- Dendro. [GitHub](https://github.com/ryein/dendro)
- Weaverbird. [Giulio Piacentino](https://www.giuliopiacentino.com/weaverbird/)

### SDF & Raymarching

- Quilez, I. "Distance Functions." [iquilezles.org](https://iquilezles.org/articles/distfunctions/)
- Quilez, I. "Smooth Minimum." [iquilezles.org](https://iquilezles.org/articles/smin/)
- Mercury. "hg_sdf Library." [mercury.sexy](https://mercury.sexy/hg_sdf/)

### JavaScript/TypeScript Libraries

- `bezier-js` (Pomax). [pomax.github.io/bezierjs](https://pomax.github.io/bezierjs/)
- `isosurface` (mikolalysenko). [npm](https://www.npmjs.com/package/isosurface)
- `three-subdivide`. [npm](https://www.npmjs.com/package/three-subdivide)
- `space-colonization`. [npm](https://www.npmjs.com/package/space-colonization)
- `d3-force-3d`. [GitHub](https://github.com/vasturiano/d3-force-3d)
- `geometry-processing-js` (CMU). [GitHub](https://geometrycollective.github.io/geometry-processing-js/)
- `@three.ez/instanced-mesh`. [npm](https://www.npmjs.com/package/@three.ez/instanced-mesh)
- `leva` (pmndrs). [GitHub](https://github.com/pmndrs/leva)
- Jason Webb. "2D Differential Growth." [GitHub](https://github.com/jasonwebb/2d-differential-growth-experiments) + [Medium](https://medium.com/@jason.webb/2d-differential-growth-in-js-1843fd51b0ce)
- joel-simon. "mesh-reaction-diffusion." [GitHub](https://github.com/joel-simon/mesh-reaction-diffusion)

### Browser APIs & Performance

- Toji. "WebGPU Compute Vertex Data Best Practices." [toji.dev](https://toji.dev/webgpu-best-practices/compute-vertex-data.html)
- Heckel, M. "Field Guide to TSL and WebGPU." [Blog](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
- Fiedler, G. "Floating Point Determinism." [gafferongames.com](https://gafferongames.com/post/floating_point_determinism/)
- Pomax. "A Primer on Bezier Curves." [pomax.github.io/bezierinfo](https://pomax.github.io/bezierinfo/)
- Levien, R. "How Long Is That Bezier?" [raphlinus.github.io](https://raphlinus.github.io/curves/2018/12/28/bezier-arclength.html)

---

*Research conducted via 7 parallel investigations. Implementation begun with half-edge mesh foundation (54 tests passing).*
