# PROCEDURAL GENERATION ATLAS
## A Comprehensive Research Foundation for ARCHITECTUS / Dendrovia

> Compiled: 2026-02-13
> Purpose: Map the full ecosystem of procedural game development, identify blind spots in ARCHITECTUS, and establish research footholds for improving the generative pipeline.

---

## TABLE OF CONTENTS

1. [Grand Taxonomy](#1-grand-taxonomy)
2. [No Man's Sky Engine Deep-Dive](#2-no-mans-sky-engine)
3. [WebGPU & Browser-Based Rendering State of the Art](#3-webgpu-state-of-the-art)
4. [Professional Tool Pipelines](#4-professional-tool-pipelines)
5. [Cross-Cutting Architectural Patterns](#5-cross-cutting-patterns)
6. [ARCHITECTUS Blind Spot Analysis](#6-blind-spot-analysis)
7. [Practitioner Ecosystem](#7-practitioner-ecosystem)
8. [Priority Action Matrix](#8-priority-action-matrix)
9. [Sources & References](#9-sources)

---

## 1. GRAND TAXONOMY

### A. Generation Domain x Algorithm Family

| Domain | Noise | Grammar | Simulation | Constraint | SDF/Implicit | Fractal | Agent | ML |
|--------|-------|---------|------------|------------|-------------|---------|-------|-----|
| **Terrain** | Perlin/Simplex heightfields | - | Hydraulic/thermal erosion | WFC tilesets | Implicit surfaces | fBm layering | - | GAN heightmaps |
| **Flora** | Wind displacement | L-systems, shape grammars | Growth sim | Spacing constraints | SDF blending (canopy) | Branching fractals | - | Neural growth |
| **Architecture** | Weathering | Shape/split grammars | Structural sim | WFC, SAT layout | CSG room carving | Recursive subdiv | - | Layout diffusion |
| **Materials** | Perlin/Worley textures | - | Reaction-diffusion | - | Implicit displacement | Voronoi patterns | - | Style-transfer |
| **VFX** | Turbulence fields | - | Fluid/smoke sim | - | Metaballs, isosurface | - | Boids, swarms | - |
| **Audio** | Noise generators | Generative grammars | Physical modeling | - | - | Self-similar rhythm | - | Neural synthesis |
| **Narrative** | - | Story grammars, Tracery | - | Planning (STRIPS) | - | - | Dialogue agents | LLM-driven |
| **Code Viz** | Surface texture | **L-systems (AST)** | - | Layout constraints | **SDF raymarching** | Recursive tree | - | Neural SDF |

### B. Execution Models

| Model | Description | Tradeoff |
|-------|-------------|----------|
| Offline/Baked | Generate once, serialize | Max quality, zero runtime cost |
| Runtime Deterministic | Generate from seed on load | Reproducible, moderate cost |
| Runtime Stochastic | Generate with RNG variation | Organic feel, harder to debug |
| GPU Compute | Compute shader generation | Massive parallelism, 100-1000x throughput |
| Lazy/Streaming | Generate on demand as camera moves | Infinite worlds, complexity management |
| **Hybrid Bake+Runtime** | Pre-compute structure, animate at runtime | **ARCHITECTUS's approach** |

### C. Composition Patterns

| Pattern | Example Systems | Key Property |
|---------|----------------|--------------|
| **Node Graph (DAG)** | Houdini, Substance, MaterialX | Visual, modular, hot-swappable |
| **Function Composition** | Quilez SDF combinators, shader chains | Composable, GPU-friendly |
| **Pipeline/Stream** | CHRONOS -> IMAGINARIUM -> ARCHITECTUS | Sequential, typed contracts |
| **Event-Driven** | ARCHITECTUS EventBus | Decoupled, reactive |
| **Blackboard** | Behavior trees + shared state | Agent coordination |

### D. Maturity Tiers

| Tier | Status | Techniques |
|------|--------|-----------|
| **Production** | Shipped in AAA | Perlin noise, L-systems, basic WFC, SDF CSG, instanced meshes |
| **Emerging** | Smaller studios/demos | Neural SDFs (NGLOD), compute particles, hierarchical WFC |
| **Research** | Papers/prototypes | Neural radiance caching, differentiable procedural gen, learned erosion |

---

## 2. NO MAN'S SKY ENGINE

### Core Architecture

- **Single 64-bit seed** drives 18.4 quintillion planets -- no stored geometry
- Entire universe compresses to ~300 MB (algorithms + assets)
- Engine is **content-source agnostic** -- makes no distinction between procedural and hand-authored
- Founding seed: reportedly a Hello Games developer's phone number

### Generation Hierarchy

```
Seed (64-bit)
  -> PRNG -> Galaxy Placement (star positions, classifications)
    -> Star Seed -> System Generation (planet count, orbits, biomes)
      -> Planet Seed -> Noise Functions (terrain density field)
        -> Voxel Density Field -> Marching Cubes Polygonization
          -> Triangle Mesh -> Texturing (procedural + authored)
            -> Population (flora via L-systems, fauna via component assembly)
              -> Simulation (weather, day/night, AI)
                -> Procedural Audio layered on top
```

### Key Techniques

| Technique | Method | Notes |
|-----------|--------|-------|
| Terrain | Voxel density fields + Marching Cubes | "Embarrassingly parallel" -- ideal for GPU |
| Flora | L-systems + artist-supplied base models | Constrained rule sets prevent pure randomness |
| Fauna | Component assembly (heads, torsos, limbs) | Attachment points + probability weights |
| Audio | Curated pre-recorded elements in real-time | 65daysofstatic collab; not pure synthesis |
| LOD | Continuous LOD from orbit to surface | No loading screens |
| Superformula | Officially denied (likely early prototype only) | Patent concerns probable |

### Key Practitioners

| Person | Role | Notable Talks |
|--------|------|---------------|
| **Sean Murray** | Co-founder | "Building Worlds Using Math(s)" (GDC 2017) |
| **Innes McKendrick** | Engine programmer | "Continuous World Generation" (GDC 2017), "Beyond Procedural Horizons" (GDC 2018) |
| **Grant Duncan** | Art Director | "How I Learned to Love Procedural Art" (GDC 2015) |
| **Paul Weir** | Audio Director | Designed procedural audio engine |

### NMS -> ARCHITECTUS Mapping

| NMS Technique | Dendrovia Application |
|---|---|
| Seed-based determinism | Git commit hashes as seeds for branch geometry |
| Continuous LOD (voxel to mesh) | "Macro-SDF, Micro-Mesh" hybrid rendering |
| L-systems for flora | Dendritic branch generation from AST data |
| Marching Cubes polygonization | SDF-to-mesh baking for performance fallback |
| Component assembly with rules | Node types (files, functions) as constrained procedural variations |
| Procedural audio | Ambient soundscape responding to code complexity/hotspots |

---

## 3. WEBGPU STATE OF THE ART

### Browser Support (2026)

Chrome (Apr 2023), Safari 26 (Jun 2025), Firefox 141 (Jul 2025) -- ~98% global coverage.

### Performance: WebGL vs WebGPU vs Native

| Metric | WebGL | WebGPU | Native (Vulkan/Metal) |
|--------|-------|--------|----------------------|
| Particle update (100K) | ~30ms (10K only) | <2ms | <1ms |
| Draw call overhead | High | Low (render bundles) | Lowest |
| Compute shaders | Not available | Native support | Native support |
| Marching Cubes throughput | CPU fallback | Near-native | Baseline |
| Scene rendering (Babylon) | 1x | ~10x (render bundles) | ~12-15x |
| SDF Raymarching (64 steps, 1080p) | ~8ms/frame | ~3-4ms/frame | ~2ms/frame |

**WebGPU closes the gap to 80-90% of native** for compute workloads.

### Three.js Shading Language (TSL)

- **Node-based shader authoring in JavaScript** -- no raw GLSL/WGSL
- Same TSL code compiles to GLSL (WebGL) and WGSL (WebGPU) automatically
- Mirrors Unreal Blueprints / Blender Shader Nodes but in code
- **Now the official recommended shader path** in Three.js
- Community: [boytchev/tsl-textures](https://github.com/boytchev/tsl-textures) procedural texture library

### Key Libraries & Tools

| Tool | Status | Notes |
|------|--------|-------|
| **Three.js TSL** | Production-ready | Cross-backend shaders. The recommended path. |
| **Babylon.js NME** | Mature | Visual node graph for shaders + raymarching |
| **PlayCanvas** | WebGPU Beta | Compute shaders in Engine v1.70.0 |
| **gpu.js** | Dead | Superseded by native WebGPU APIs |
| **Houdini Engine for Web** | Does not exist | No browser runtime |

### SDF Raymarching in WebGPU

- Fullscreen quad fragment shader or compute-to-texture approach
- TSL integration: Codrops published liquid raymarching tutorial using TSL
- No native SDF acceleration structures -- spatial partitioning must be hand-rolled
- Half-res SDF pass + upscale is standard optimization
- On integrated GPUs (M1 Air): complex SDF drops below 60fps at full res -- **validates Macro-SDF, Micro-Mesh**

### Notable WebGPU Projects

| Project | Demonstrates |
|---------|-------------|
| Renaud Rohlinger -- MPM Fluid Sim | Material Point Method fluid in WebGPU |
| Will Usher -- WebGPU Marching Cubes | GPU-parallel isosurface at near-native speed |
| Codrops TSL Liquid Raymarching | SDF booleans + lighting via TSL |
| battesonb/webgpu-raymarching | Programmable stack machine for composable SDFs |
| WebGPU Samples (webgpu.github.io) | Reference: boids, particles, Game of Life, shadows |

---

## 4. PROFESSIONAL TOOL PIPELINES

### Houdini

- **DAG architecture**: SOPs (geometry), VOPs (visual VEX), DOPs (simulation)
- **HDAs** (Houdini Digital Assets): Package entire node networks as reusable operators
- **Houdini Engine**: Cooks HDAs live inside Unity/Unreal -- eliminates export/import
- **Dual layer**: VOPs (visual) + VEX (code) -- same pattern everywhere
- **AAA usage**: Horizon Forbidden West, Ghost of Tsushima, Assassin's Creed series

### Blender Geometry Nodes

- Node-based procedural geometry as modifier stack
- Free/open-source, rapidly maturing (new SDF + volume nodes in 2024-2025)
- No Houdini Engine equivalent -- bake/export static meshes to engines
- Growing community asset ecosystem for procedural building/terrain/vegetation

### Unity

- **Shader Graph**: Visual node-based materials (URP/HDRP)
- **VFX Graph**: GPU-accelerated particle systems on compute buffers (millions of particles)
- **DOTS/ECS**: Entity Component System for runtime world generation (maturing)
- **Compute shaders**: Terrain, vegetation, mesh deformation
- Next-gen: dedicated world-building system, non-destructive procedural rulesets

### Unreal Engine

- **PCG Framework (UE 5.5+)**: Graph-based spatial data pipeline; GPU gen nearly 2x faster in UE 5.7
- **Niagara**: GPU compute VFX; reads scene distance fields, environment-reactive
- **Material Editor**: Procedural noise, distance fields, custom HLSL
- **Procedural Vegetation Editor**: Graph-based flora -> Nanite skeletal assemblies
- **World Partition**: PCG generates per-cell for automatic streaming of massive worlds

---

## 5. CROSS-CUTTING PATTERNS

### Pattern 1: Node Graph as Universal Abstraction

Every tool converges on the DAG: Houdini SOPs, Blender GeoNodes, Unity Shader/VFX Graph, Unreal PCG/Niagara/Material. Provides non-destructive editing, lazy evaluation, composability.

### Pattern 2: Seed-Based Determinism

All systems use seeds for reproducible results. Enables multiplayer consistency, version control of procedural content, QA reproducibility.

### Pattern 3: Attribute Flow

Data flows as **attributed point clouds** -- positions with metadata (normals, density, color, custom). This is the lingua franca: Houdini point attributes, Unreal PCG point data, Blender named attributes.

### Pattern 4: LOD for Procedural Content

- Distance-based evaluation (fewer points/simpler geometry for far objects)
- Chunking/tiling (generate per-cell, cull non-visible)
- Representation switching (SDF at distance, mesh up close)
- Resolution scaling (sparse grass at low LOD, dense at high)

### Pattern 5: Baking vs Runtime

Industry trend: **editor-time procedural with optional runtime**. Generate in editor via node graphs, bake for shipping, retain graph for iteration. Houdini Engine and Unreal PCG exemplify this.

### Pattern 6: Dual-Layer Abstraction

Every mature tool provides visual graph + code escape hatch:
- Houdini: VOPs + VEX
- Unreal: Blueprints + HLSL
- Unity: Shader Graph + Custom Function nodes
- Blender: Geometry Nodes + Python

---

## 6. BLIND SPOT ANALYSIS

### What ARCHITECTUS Currently Has (Strengths)

- **L-systems from AST**: Parametric + stochastic, topology-driven (genuinely novel -- not found in literature)
- **SDF compilation**: Capsule primitives + smooth union chain
- **Noise mapping**: Simplex/Perlin/fBm/Worley from code metrics
- **Deterministic seeds**: Mulberry32 PRNG, hash-based seeding
- **Instruction budgeting**: Depth-first pruning to stay within GPU budget (practical innovation)
- **Domain twist**: Hotspot branches get `opTwist` distortion
- **Palette system**: Code metrics mapped to mood-based color palettes
- **Mycology system**: Fungal specimens with L-system-like morphology

### Critical Blind Spots (Ranked)

#### P0: No Compute Shader Particle System

**Severity: HIGH**

The system describes instanced meshes for dynamic elements but has no particle implementation. WebGPU compute can handle 1M+ particles at 60fps in browser. This is the single biggest gap for the Tron/Rez aesthetic (glowing particles, data flows along branches, spore clouds around mushrooms).

**Action**: Implement TSL compute particle system per [Maxime Heckel's field guide](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/). Particles flow along L-system branch paths, emit from hotspot nodes, respond to EventBus spatial events.

#### P1: No Wave Function Collapse for Layout

**Severity: MEDIUM-HIGH**

L-system generates branch geometry but no constraint solver for spatial layout. When hundreds of branches overlap, no mechanism resolves collisions or ensures navigability. The "Ant on a Manifold" camera needs traversable structure.

**Action**: Use WFC as a **layout constraint solver** -- define adjacency rules for branch segments, let WFC resolve spatial conflicts. See [Eurographics 2025 paper on 3D procedural map generation with WFC](https://diglib.eg.org/bitstream/handle/10.2312/ceig20251107/ceig20251107.pdf).

#### P2: No Procedural Audio

**Severity: MEDIUM**

EventBus emits `PLAYER_MOVED`, `BRANCH_ENTERED`, `NODE_CLICKED`, `COLLISION_DETECTED` but nothing listens for audio. Web Audio API supports spatial audio natively. Essential for Rez aesthetic.

**Action**: Map existing noise parameters to Web Audio synthesis parameters. High-complexity branches = dense, layered audio; simple branches = clean tones.

#### P2: SDF Primitive Vocabulary is Minimal

**Severity: MEDIUM**

Only uses `sdCapsule` + `opSmoothUnion` + `opTwist`. Quilez documents 30+ primitives and 15+ operators. Missing: `sdBox` (directories), `sdTorus` (loops), `opRep` (arrays), `sdBezier` (smooth curves).

**Action**: Expand primitive set. Map AST node types to SDF primitives: functions = capsules, classes = boxes, loops = tori, arrays = repeated elements.

#### P3: No Erosion/Weathering Pass

**Severity: MEDIUM**

SDF branches are geometrically pristine. No simulation ages geometry based on code metrics (old files = weathered, new files = fresh growth).

**Action**: Add domain warping pass in SDF compiler. Map `lastModified` age and `churnRate` to displacement noise amplitude. Purely shader-time -- no simulation overhead.

#### P3: No DAG-Based Shader Pipeline (Hot-Swappability)

**Severity: MEDIUM-LOW**

Stated goal is "hot-swappable virtualized procedural engines" but pipeline is a linear `compile()` function. Houdini and Substance achieve hot-swappability through node graphs where any node is replaceable at runtime.

**Action**: Refactor `DistillationPipeline.ts` into a DAG of typed processing nodes. Each node (L-system expansion, SDF compilation, noise injection, palette application) becomes independently replaceable.

#### P4: No Neural SDF Representation

**Severity: LOW (track, don't implement)**

NVIDIA's NGLOD achieves real-time neural SDF via sparse octree traversal. WebGPU Gaussian Splatting runs in browsers. But computational cost is still too high for 60fps on integrated GPUs.

**Action**: Monitor. When WebGPU compute maturity allows it, neural SDFs could replace hand-authored SDF compiler for organic detail.

---

## 7. PRACTITIONER ECOSYSTEM

### Academic

| Researcher | Affiliation | Contribution |
|------------|------------|--------------|
| Julian Togelius | NYU | PCG taxonomy & search-based generation |
| Paul Merrell | Stanford/TAMU | Model Synthesis (WFC precursor) |
| Towaki Takikawa et al. | NVIDIA/Toronto | Neural Geometric LOD (NGLOD) |
| Aristid Lindenmayer | Utrecht (historical) | L-system formalism |
| Rafael Bidarra | TU Delft | Hierarchical Semantic WFC |

### Industry

| Person/Team | Platform | Focus |
|-------------|----------|-------|
| **Inigo Quilez** | Adobe (Neo), Shadertoy | SDF art, procedural shaders (SIGGRAPH 2025 keynote) |
| **Oskar Stalberg** | Townscaper | WFC in production game design |
| **Maxim Gumin** | Independent | WFC algorithm (23k+ GitHub stars) |
| **SideFX** | Houdini | Procedural pipeline architecture, L-system node |
| **Adobe** | Substance Designer | Node-graph procedural materials |
| **Sean Murray / Hello Games** | No Man's Sky | Seed-based universe generation |

### Community Educators

| Creator | Medium | Focus |
|---------|--------|-------|
| **Sebastian Lague** | YouTube/GitHub | Procedural terrain, marching cubes, planet gen |
| **Maxime Heckel** | Blog | TSL + WebGPU (directly relevant) |
| **The Art of Code** | YouTube | SDF raymarching tutorials |
| **Lisyarus** | Blog | WebGPU particle simulation |
| **Three.js Roadmap** | Blog | WebGPU compute shader tutorials |

### Key Conferences

| Conference | Track |
|------------|-------|
| **SIGGRAPH** | Real-time rendering, neural graphics, Web3D |
| **GDC** | Procedural generation summit, technical art |
| **Eurographics** | PCG research (WFC, terrain) |
| **AIIDE** | AI-driven content generation |
| **FDG** | Foundations of Digital Games, PCG workshop |

---

## 8. PRIORITY ACTION MATRIX

| # | Blind Spot | Effort | Impact | Priority | Enables |
|---|-----------|--------|--------|----------|---------|
| 1 | Compute shader particles | Medium | HIGH | **P0** | Tron/Rez aesthetic, data flow viz, spore clouds |
| 2 | WFC layout constraints | Medium | HIGH | **P1** | Navigable structures, collision-free branches |
| 3 | Procedural audio | Low | MEDIUM | **P2** | Immersion, synesthetic code experience |
| 4 | SDF primitive expansion | Low | MEDIUM | **P2** | Richer visual vocabulary for AST nodes |
| 5 | Erosion/weathering pass | Low | MEDIUM | **P3** | Organic detail, code age visualization |
| 6 | DAG shader pipeline | High | MED-LOW | **P3** | Hot-swappable procedural engines |
| 7 | Neural SDFs | High | LOW | **P4** | Future organic detail (track only) |

---

## 9. SOURCES & REFERENCES

### No Man's Sky
- [GDC Vault - Continuous World Generation](https://www.gdcvault.com/play/1024265/Continuous-World-Generation-in-No)
- [GDC Vault - Building Worlds Using Math(s)](https://www.gdcvault.com/play/1024514/Building-Worlds-Using)
- [GDC Vault - How I Learned to Love Procedural Art](https://www.gdcvault.com/play/1021805/Art-Direction-Bootcamp-How-I)
- [GDC Vault - Beyond Procedural Horizons](https://gdcvault.com/play/1025536/Beyond-Procedural-Horizons-Exploring-Different)
- [Game Developer - What the Code Says About Procedural Gen](https://www.gamedeveloper.com/programming/what-the-code-of-i-no-man-s-sky-i-says-about-procedural-generation)
- [Rambus - The Algorithms of No Man's Sky](https://www.rambus.com/blogs/the-algorithms-of-no-mans-sky-2/)
- [Transvoxel Algorithm](https://transvoxel.org/)
- [NVIDIA GPU Gems 3 - Procedural Terrain](https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-1-generating-complex-procedural-terrains-using-gpu)

### WebGPU & Browser Rendering
- [Three.js Roadmap - Galaxy Simulation Compute Shaders](https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders)
- [Maxime Heckel - Field Guide to TSL and WebGPU](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
- [Codrops - Liquid Raymarching with TSL](https://tympanus.net/codrops/2024/07/15/how-to-create-a-liquid-raymarching-scene-using-three-js-shading-language/)
- [WebGPU Marching Cubes (Will Usher)](https://www.willusher.io/graphics/2024/04/22/webgpu-marching-cubes/)
- [WebGPU Fundamentals - Compute Shaders](https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders.html)
- [Surma - WebGPU: All of the Cores](https://surma.dev/things/webgpu/)
- [TSL Textures Library](https://github.com/boytchev/tsl-textures)
- [battesonb/webgpu-raymarching](https://github.com/battesonb/webgpu-raymarching)
- [WebGPU Samples](https://webgpu.github.io/webgpu-samples/)
- [Toji - WebGPU Performance Best Practices](https://toji.dev/webgpu-best-practices/webgl-performance-comparison.html)

### Professional Tools
- [SideFX - Houdini Game Development](https://www.sidefx.com/industries/games/)
- [Houdini Engine Integration](https://www.sidefx.com/products/houdini-engine/)
- [Devoted Studios - The Houdini Generation](https://devotedstudios.com/the-houdini-generation-how-procedural-workflows-are-changing-game-development/)
- [Blender 2026 Roadmap](https://www.blender.org/development/projects-to-look-forward-to-in-2026/)
- [Unreal PCG Framework Docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/procedural-content-generation-framework-in-unreal-engine)
- [UE 5.7 PCG Updates](https://www.guru3d.com/story/unreal-engine-57-released-with-new-procedural-content-generation-and-more-features/)
- [MaterialX Procedural Texturing](https://digitalproduction.com/2024/12/02/procedural-texturing-using-houdini-and-materialx/)

### Taxonomy & Research
- [Togelius et al. - Search-Based PCG](https://ieeexplore.ieee.org/document/5756645/)
- [NVIDIA NGLOD](https://research.nvidia.com/labs/toronto-ai/nglod/)
- [Wave Function Collapse (Gumin)](https://github.com/mxgmn/WaveFunctionCollapse)
- [Eurographics 2025 - 3D Procedural Maps with WFC](https://diglib.eg.org/bitstream/handle/10.2312/ceig20251107/ceig20251107.pdf)
- [Inigo Quilez - SIGGRAPH 2025 Talk](https://san-francisco.siggraph.org/2025/04/05/inigo-quilez-unlocking-creativity-with-signed-distance-fields/)
- [Web Audio Spatialization (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics)
- [Procedural Content Generation for Games (Springer)](https://link.springer.com/book/10.1007/979-8-8688-1787-8)
- [Sebastian Lague - Procedural Landmass](https://github.com/SebLague/Procedural-Landmass-Generation)

---

*This atlas is a living document. Update as new techniques emerge or ARCHITECTUS capabilities evolve.*
