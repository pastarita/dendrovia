# Procedural Generation Frameworks: A Comprehensive Landscape Map

> **Research Date:** 2026-02-13
> **Scope:** Game engines, algorithms, design patterns, notable games, and academic resources

---

## Table of Contents

1. [Unity Procedural Generation](#1-unity-procedural-generation)
2. [Unreal Engine Procedural Generation](#2-unreal-engine-procedural-generation)
3. [Other Game Engines with Procedural Focus](#3-other-game-engines-with-procedural-focus)
4. [Procedural Game Design Patterns](#4-procedural-game-design-patterns)
5. [Notable Procedural Games and Their Techniques](#5-notable-procedural-games-and-their-techniques)
6. [Runtime vs Build-Time Generation](#6-runtime-vs-build-time-generation)
7. [Academic and Conference Resources](#7-academic-and-conference-resources)

---

## 1. Unity Procedural Generation

### 1.1 Terrain System and Runtime Terrain Generation

Unity's built-in `Terrain` component supports heightmap-based terrain with splatmap texturing, detail/tree painting, and wind zones. For procedural use cases:

- **Runtime API:** `TerrainData` can be modified at runtime via `SetHeights()`, `SetAlphamaps()`, and `SetDetailLayer()`, enabling full procedural terrain generation during gameplay.
- **Heightmap Resolution:** Configurable from 33x33 to 4097x4097. Higher resolutions increase quality but consume more memory.
- **Terrain Tiles:** Multiple `Terrain` objects can be stitched together using `SetNeighbors()` for large worlds. Seams are handled automatically when neighbors are registered.
- **Compute Shader Approach:** Projects like [WorldKit](https://github.com/vkDreamInCode/WorldKit) demonstrate using compute shaders for full GPU-accelerated terrain generation at runtime and in-editor.
- **Limitations:** Unity's terrain system is heightmap-only (no overhangs or caves without workarounds). Voxel terrain requires custom mesh generation or third-party tools.

### 1.2 Entity Component System (DOTS/ECS) for Procedural Workloads

Unity's [Data-Oriented Technology Stack (DOTS)](https://unity.com/dots) is now production-ready in Unity 6 and provides massive performance benefits for procedural generation:

- **ECS Architecture:** Arranges data linearly in memory, enabling cache-friendly iteration over tens of thousands of entities. Procedural generation benefits from batch processing of terrain chunks, foliage placement, and structure generation.
- **Key Components:**
  - `IComponentData` for storing generation parameters per entity
  - `ISystem` / `SystemBase` for generation logic
  - `EntityCommandBuffer` for deferred entity creation during generation passes
- **Memory Layout:** Components are stored in `ArchetypeChunk` arrays, ensuring that procedural generation loops over contiguous memory. This is critical for generating thousands of terrain tiles or foliage instances per frame.
- **Performance:** DOTS can provide over 100x performance improvement over MonoBehaviour-based approaches for procedural workloads due to data locality and parallelism.

### 1.3 Burst Compiler and Jobs System for Parallel Generation

- **[Burst Compiler](https://docs.unity3d.com/Packages/com.unity.burst@latest):** Translates C# (IL/.NET bytecode) to highly optimized native code via LLVM. Key for procedural generation because noise functions, mesh generation, and spatial algorithms become near-C++ performance.
- **Jobs System:** Enables multi-threaded execution without manual thread management.
  - `IJob` for single-unit work
  - `IJobParallelFor` for parallel iteration (e.g., generating heightmap values for each column)
  - `IJobParallelForBatch` for batched parallel work (e.g., processing terrain chunks)
- **Typical Procedural Pipeline:**
  1. `IJobParallelFor` to compute noise values for a heightmap grid
  2. `IJobParallelFor` to generate mesh vertices from heightmap
  3. `IJob` to assemble final mesh and upload to GPU
- **NativeContainers:** `NativeArray<T>`, `NativeHashMap<K,V>`, and `NativeList<T>` provide thread-safe, Burst-compatible data structures for generation pipelines.

### 1.4 Unity Splines for Procedural Paths/Roads

The official [Unity Splines package](https://docs.unity3d.com/Packages/com.unity.splines@2.4/manual/index.html) (com.unity.splines) provides:

- **Spline Types:** Catmull-Rom, Bezier, and Linear interpolation modes.
- **SplineExtrude:** Built-in component for extruding tube-like shapes along splines. Custom mesh extrusion requires manual implementation.
- **Procedural Use Cases:** Road generation, river paths, rail networks, cable routing.
- **Ecosystem Tools:**
  - [TerraSplines](https://jettelly.com/blog/terrasplines-a-spline-based-non-destructive-terrain-editor-for-unity) - Spline-based terrain modification (height, paint, holes)
  - Road Splines Procedural Tool - Integration with Unity's terrain system
  - [Curvy Splines](https://curvyeditor.com/) - Third-party package with advanced features for roads, railways, and cables

### 1.5 Shader Graph for Procedural Materials

[Shader Graph](https://unity.com/features/graphics) provides node-based visual shader authoring:

- **Procedural Nodes:** Noise (Gradient, Simple, Voronoi), Checkerboard, Rounded Rectangle, procedural shape generators.
- **Layering:** Multiple noise functions can be composed via FBM (Fractal Brownian Motion) patterns using Add, Multiply, and Lerp nodes.
- **Sub-graphs:** Reusable procedural patterns can be encapsulated as sub-graphs for terrain texturing, weathering effects, and organic material generation.
- **Custom Function Nodes:** HLSL code can be injected for custom noise implementations (Worley, Simplex, domain warping).
- **Integration with VFX Graph:** Shader Graph outputs can drive particle appearance in VFX Graph by enabling "Support VFX Graph" in Graph Settings.

### 1.6 VFX Graph for Procedural Particles

[Unity VFX Graph](https://unity.com/visual-effect-graph) enables GPU-accelerated particle systems:

- **Scale:** Can render hundreds of thousands of particles in real-time.
- **Particle Types:** Points, quads, triangles, octagons, meshes, lines, strips.
- **Procedural Behaviors:** Turbulence, noise-driven forces, attribute maps for spawn position/color/size.
- **Spawn on Mesh:** Particles can spawn on mesh surfaces with normal-aligned orientation, enabling procedural foliage, moss, or debris.
- **Shader Graph Integration:** Custom shaders for particles via Shader Graph enable unique procedural visual styles.
- **Notable Games Using VFX Graph:** V Rising, Road 96, Hardspace: Shipbreaker, Syberia: The World Before.
- **Performance Note:** VFX Graph excels for massive systems (10K+ particles). The legacy Particle System remains better for many small systems (~1000 particles each).

### 1.7 Asset Store Procedural Tools

| Tool | Type | Key Feature | Runtime Support |
|------|------|-------------|-----------------|
| **[MapMagic 2](https://assetstore.unity.com/packages/tools/terrain/mapmagic-2-165180)** | Node-based terrain generator | Infinite/streaming terrain, runtime generation as player moves | Yes |
| **[Gaia Pro VS](https://www.procedural-worlds.com/products/professional/gaia-pro/)** | World-building suite | Automated biome rules, slope/height/mask-based placement, weather + lighting | Partial |
| **Vista** | Terrain tool | Hexagonal grid support for 4X/tactics games | Yes |
| **[Terrain Composer 2](https://assetstore.unity.com/packages/tools/terrain/terrain-composer-2-65563)** | Multi-terrain generator | Stamp-based and node-based workflows, multi-terrain support | Partial |
| **Tileable 3D Terrain Generator** | Chunk-based terrain | Seamlessly tiling terrain chunks for open-world streaming | Yes |
| **[Gaea](https://quadspinner.com/)** | External heightmap tool | High-quality erosion simulation, exports to Unity | Build-time only |

**MapMagic 2** is the most versatile for runtime procedural generation due to its node graph that executes during play mode, generating new terrain tiles as the player explores. **Gaia Pro** emphasizes ease of use and art-directed results with automated biome placement.

### 1.8 GPU Instancing and Indirect Rendering

Unity provides multiple tiers of instanced rendering for procedural content:

- **GPU Instancing (Standard):** Enable on materials to batch identical meshes with per-instance properties. Limited to 1023 instances per `DrawMeshInstanced()` call.
- **`Graphics.DrawMeshInstancedIndirect()`:** GPU-driven instancing that bypasses the 1023 limit. Instance data (position, rotation, scale, color) lives entirely on the GPU via `ComputeBuffer`. Position matrices are computed in shader `setup()` functions. No CPU upload per frame.
- **`Graphics.DrawMeshInstancedProcedural()`:** Similar to Indirect but with a fixed instance count. Instance data generated procedurally in the shader.
- **`Graphics.RenderMeshIndirect()`:** Newer API (Unity 6+) supporting multiple draw commands in a single call via `GraphicsBuffer.IndirectDrawIndexedArgs`.
- **Key Shader Keyword:** `PROCEDURAL_INSTANCING_ON` enables per-instance data access in the vertex shader.
- **Use Cases:** Procedural grass (millions of blades), foliage, debris, crowds, particle-like effects rendered as meshes.

---

## 2. Unreal Engine Procedural Generation

### 2.1 PCG Framework (Procedural Content Generation)

The [PCG Framework](https://dev.epicgames.com/documentation/en-us/unreal-engine/procedural-content-generation-framework-in-unreal-engine) is now **production-ready** as of UE 5.7 (released November 2025):

- **Architecture:** Graph-based system where nodes define generation rules. Graphs execute in the editor or at runtime.
- **Core Concepts:**
  - **PCG Graph:** The primary asset containing generation logic
  - **PCG Component:** Attached to actors to trigger graph execution
  - **PCG Volume:** Defines spatial bounds for generation
  - **Points:** The fundamental data type -- generation produces point clouds that are then converted to instances, meshes, or other actors
- **Performance:** Almost double the performance compared to UE 5.5, with GPU compute path now viable across platforms.
- **Key Features (UE 5.7):**
  - Parameter overrides for GPU nodes enabling dynamic tuning
  - New PCG Editor Mode with spline drawing, paint, and volume tools
  - Each tool linked to a PCG Graph for real-time parameter control
  - Standalone executability of individual tools

### 2.2 PCG Graph -- Node-Based Procedural Scattering

The PCG Graph provides visual, node-based authoring of procedural rules:

- **Input Nodes:** Landscape data, spline data, mesh data, point data from other graphs.
- **Filter Nodes:** Slope, height, density, distance, normal direction, custom attribute filters.
- **Transform Nodes:** Random rotation, scale, offset, projection to surface.
- **Execution Nodes:** Spawn static mesh instances, spawn actors, modify landscape, create spline meshes.
- **Subgraphs:** Reusable generation modules (e.g., a "forest" subgraph used across multiple biomes).
- **Determinism:** Seeded random number generation ensures reproducible results.
- **Procedural Vegetation Editor (PVE):** A specialized graph-based tool for creating vegetation assets that directly output Nanite skeletal assemblies.

### 2.3 Nanite and Its Impact on Procedural Geometry

[Nanite](https://dev.epicgames.com/documentation/en-us/unreal-engine/nanite-virtualized-geometry-in-unreal-engine) is Unreal Engine 5's virtualized geometry system that fundamentally changes procedural content approaches:

- **How It Works:** Nanite uses an internal mesh format that renders pixel-scale detail, intelligently rendering only visible detail. It virtualizes geometry similar to how virtual texturing works for textures.
- **Impact on Procedural Generation:**
  - **No Manual LOD:** Procedurally generated meshes converted to Nanite automatically get continuous LOD without authoring LOD levels.
  - **High Polygon Budgets:** Procedural generators can output film-quality meshes without performance concerns. Nanite handles millions of triangles efficiently.
  - **Instance Counts:** Massive instance counts (millions of foliage, rocks, debris) are feasible with Nanite's culling.
- **Nanite Assemblies (UE 5.7):** Enable procedural vegetation pipelines that output Nanite-compatible skeletal mesh assemblies.
- **Nanite Foliage:** Trees and foliage now work with Nanite (major updates in UE 5.6+), enabling procedural forests with full Nanite benefits.
- **Streaming:** Nanite works with World Partition for streaming, with asset loading coordinated for smooth transitions across large procedural terrains.
- **Limitations:** Nanite does not support all material features (translucency support added in UE 5.6+). Procedural deformable meshes may need non-Nanite paths.

### 2.4 World Partition for Streaming Procedural Worlds

[World Partition](https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition-in-unreal-engine) manages streaming for large procedural worlds:

- **Cell-Based Streaming:** The world is divided into grid cells that load/unload based on player proximity and streaming volumes.
- **One File Per Actor (OFPA):** Each actor is stored in its own file, enabling parallel editing and selective loading.
- **Data Layers:** Content can be organized into layers that stream independently (e.g., terrain on one layer, foliage on another, structures on a third).
- **HLOD (Hierarchical LOD):** Automatically generates simplified representations of distant content. Critical for procedural worlds where manual LOD authoring is impractical.
- **Integration with PCG:** PCG-generated content respects World Partition boundaries and can generate content per-cell on demand.
- **Runtime Streaming:** Content loads and unloads seamlessly as the player moves, with configurable loading distances per data layer.

### 2.5 Houdini Engine Plugin for Unreal

[Houdini Engine for Unreal](https://www.sidefx.com/products/houdini-engine/plug-ins/unreal-plug-in/) bridges SideFX Houdini's procedural workflows with Unreal:

- **Houdini Digital Assets (HDAs):** Procedural tools built in Houdini with custom UI are usable inside Unreal Editor by artists who don't know Houdini.
- **Live Cooking:** Assets "cook" inside the editor when parameters change -- no baking required during development.
- **Automatic Baking:** When compiling for gameplay, assets are automatically baked to native Unreal formats.
- **PCG Integration:** Direct integration with Unreal's PCG framework for hybrid Houdini+PCG workflows.
- **Supported Outputs:** Meshes, instances, landscapes, curves, volumes, and attribute data.
- **Licensing:** [Free for commercial use](https://www.sidefx.com/community/houdini-engine-for-unreal-and-unity/) -- up to 10 licenses per studio.
- **Current Support:** Binaries for UE 5.5 and UE 5.6, linked with latest production Houdini.

### 2.6 Niagara VFX for Procedural Effects

Niagara is Unreal's GPU-accelerated particle/VFX system with procedural capabilities:

- **Modular Architecture:** Emitters, modules, and renderers are composable building blocks.
- **Data Interfaces:** Niagara can read from meshes, textures, audio, skeletal meshes, landscapes, and custom data sources for procedural behavior.
- **Simulation Stages:** Multi-stage simulation enables complex procedural effects (spawn -> update -> collision -> secondary spawn).
- **PCG Interop (Planned):** Epic plans to make Niagara and PCG interoperable, enabling simulations to "inform and affect" one another.
- **Procedural Spawning:** Particles can spawn based on noise fields, distance fields, or procedural rules rather than fixed emitter locations.
- **Light Emission:** Particles can emit dynamic lights that interact with Lumen GI.
- **UE 5.7:** Over 50 free Niagara systems available as learning examples.

### 2.7 Material Editor for Procedural Textures

Unreal's node-based Material Editor supports fully procedural texture generation:

- **Noise Nodes:** Perlin, Simplex, Gradient, Voronoi built-in.
- **World-Aligned Texturing:** `WorldAlignedTexture` and `WorldAlignedNormal` functions implement triplanar projection -- textures project from world-space X/Y/Z axes without UV mapping. Critical for procedural meshes that lack authored UVs.
- **Triplanar Mapping:** Projects textures from three orthogonal directions with smooth blending at transitions. Works on any mesh regardless of shape, scale, or orientation.
- **Material Functions:** Reusable procedural patterns (weathering, moss growth, edge wear) that can be shared across materials.
- **Landscape Materials:** Support multiple layers with slope/height-based blending, enabling procedural terrain texturing.
- **Runtime Parameter Control:** Material Parameter Collections and Material Instances enable runtime modification of procedural material properties.
- **Virtual Texturing:** Runtime Virtual Texturing reduces memory cost of unique procedural textures across large terrains.

### 2.8 Lumen Global Illumination with Procedural Content

[Lumen](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-global-illumination-and-reflections-in-unreal-engine) is UE5's fully dynamic GI system, critical for procedural content:

- **No Baked Lighting Required:** Procedurally generated geometry receives correct global illumination automatically -- no lightmap baking needed.
- **Dynamic Response:** When procedural content changes (buildings generated, terrain modified), Lumen updates GI in real-time.
- **Performance Targets:** Epic is working on 120Hz mode and low-end hardware prototypes for broader platform support.
- **Color Bleeding:** Procedural materials' colors correctly bleed onto nearby surfaces.
- **Indirect Shadows:** Procedurally placed objects cast and receive indirect shadows automatically.
- **Considerations for Procedural Content:** Very thin geometry or extremely small features may not be captured by Lumen's screen-space traces. Software ray tracing handles most cases; hardware ray tracing provides highest quality.

### 2.9 MetaHuman + Procedural Character Generation

[MetaHuman](https://www.metahuman.com/) provides high-fidelity digital human creation with increasing procedural capabilities:

- **MetaHuman Creator:** Cloud-based tool for authoring realistic human characters with hundreds of blend shapes and parameters.
- **Automation APIs (UE 5.7):** Python and Blueprint scripting can now automate nearly all MetaHuman editing and assembly operations, enabling procedural character variation.
- **Batch Processing:** Operations can run on compute farms for generating character populations.
- **Procedural Grooming:** Hair and facial hair can be procedurally varied per character instance.
- **Live Link Face:** Real-time animation capture from iOS/Android devices for procedural animation.
- **Platform Support (2025):** Now available on Linux and macOS in addition to Windows.
- **Procedural NPC Pipelines:** By scripting parameter randomization within artist-defined ranges, studios can generate diverse NPC populations while maintaining quality.

---

## 3. Other Game Engines with Procedural Focus

### 3.1 Godot 4 Procedural Capabilities

Godot 4 (open-source, MIT licensed) offers several procedural generation approaches:

- **Built-in Noise:** `FastNoiseLite` resource provides Perlin, Simplex, Cellular (Worley), and Value noise with configurable octaves, frequency, and domain warping. Available as both 2D and 3D noise.
- **Voxel Terrain (Community):**
  - [Godot Voxel Module](https://github.com/Zylann/godot_voxel) - C++ extension for volumetric terrain with Minecraft-style blocky and smooth (Transvoxel) modes, infinite terrain via chunk paging, real-time in-game editing, LOD support, and Godot physics integration.
  - [Procedural Voxel Terrain](https://github.com/EmberNoGlow/Godot-Procedural-VOXEL-Terrain) - Simpler implementation using `MeshInstance3D` and 3D noise.
- **Heightmap Terrain:** Available through community tools like [Terrain3D](https://godotengine.org/asset-library/asset/4439) for heightmap-based procedural terrain.
- **GDScript + C#:** Procedural generation code can be written in GDScript (Python-like), C#, or C++ via GDExtension.
- **Shader Language:** Custom shaders in Godot's GLSL-like shader language support procedural texturing.
- **Scene Tree:** Godot's scene-as-resource model allows procedural instantiation of pre-authored sub-scenes.
- **Limitations:** No built-in terrain system in the engine core (community-driven solutions). Smaller ecosystem of procedural tools compared to Unity/Unreal.

### 3.2 O3DE (Open 3D Engine)

[O3DE](https://o3de.org/) is an Apache 2.0 licensed engine originally derived from Amazon's Lumberyard:

- **Procedural Prefabs:** [Python scripts](https://docs.o3de.org/docs/user-guide/assets/scene-pipeline/procedural_prefab/) hook into the scene pipeline to create procedural prefab product assets from source art (FBX/glTF).
- **Script Canvas:** Visual scripting system that can drive procedural logic.
- **Gem System:** Modular architecture where procedural generation features can be added as "Gems" (plugins).
- **Rendering (2025):** Multi-GPU rendering architecture is now "mature." Vulkan and Metal subpass support improved performance by up to 40%.
- **Focus Areas:** O3DE's primary 2025 focus has been rendering performance, robotics simulation, and stability rather than expanding procedural generation features specifically.
- **Community Size:** Smaller community than Unity/Unreal/Godot, limiting the availability of procedural generation plugins and tutorials.

### 3.3 Custom Engines Built for Procedural Games

Several landmark procedural games use custom engines purpose-built for their generation needs:

**Minecraft (Java + C++ Bedrock Edition)**
- Custom voxel engine with chunk-based world management
- Highly optimized for block-based rendering and physics
- Generation pipeline deeply integrated with the engine's data model
- See Section 5.1 for generation details

**Dwarf Fortress (Custom C++ Engine)**
- ~700,000 lines of code developed over 20 years by one developer (Tarn Adams)
- Simulation depth prioritized over rendering performance
- Geological simulation, fluid dynamics, and history generation integrated at the engine level
- See Section 5.2 for generation details

**Factorio (Custom C++ Engine)**
- Optimized for massive-scale simulation (belts, inserters, logistics)
- Chunk-based procedural map generation with on-demand generation
- Deterministic simulation enables multiplayer synchronization
- See Section 5.3 for generation details

**Noita (Custom C++ Engine with "Falling Everything" Physics)**
- Every pixel is physically simulated
- Custom engine built specifically for pixel-level procedural terrain destruction and generation
- Cellular automata-based physics for liquids, gases, fire, and powder

### 3.4 Bevy (Rust ECS Engine) Procedural Approaches

[Bevy](https://bevy.org/) is an open-source, data-driven game engine built in Rust:

- **ECS Architecture:** All game objects are composed of components processed by systems. Procedural generation systems naturally fit this pattern -- a `TerrainChunk` component triggers a `terrain_generation_system`.
- **Parallelism:** Bevy's scheduler automatically parallelizes systems with non-overlapping data access. Multiple terrain chunks can generate simultaneously without explicit threading.
- **Rust Performance:** No garbage collector, zero-cost abstractions, and compile-time memory safety make Rust ideal for procedural generation workloads.
- **Community Examples:**
  - [Procedural Terrain Generation in Bevy](https://kcstuff.com/blog/procedural-generation-bevy) - Heightmap-based terrain with noise functions
  - [POLDERS](https://2025.rustweek.org/talks/jos/) - Full 3D application with procedural generation, custom shaders, and UI systems
- **Bevy 0.15.1 (2025):** Latest stable release with improved rendering, asset system, and ECS ergonomics.
- **`bevy_ecs`:** Can be used independently of the full engine, even on embedded systems (no_std support).
- **Crate Ecosystem:** `noise` crate for Perlin/Simplex/Worley noise, `bracket-noise` for game-focused noise, `wfc` crate for Wave Function Collapse.
- **Limitations:** Younger ecosystem with fewer pre-built procedural tools. More suited for developers comfortable writing generation code from scratch.

---

## 4. Procedural Game Design Patterns

### 4.1 Wave Function Collapse (WFC)

**Concept:** A constraint-solving algorithm inspired by quantum mechanics superposition. Each cell in a grid starts in a "superposition" of all possible tile states. The algorithm iteratively "collapses" the cell with the lowest entropy (fewest possibilities), then propagates constraints to neighbors.

**How It Works:**
1. Initialize all cells with all possible tile types
2. Select the cell with minimum entropy (fewest remaining options)
3. Collapse it to a single tile (weighted random selection)
4. Propagate adjacency constraints to neighboring cells, removing invalid options
5. Repeat until all cells are collapsed or a contradiction is detected
6. On contradiction: backtrack or restart

**Variants:**
- **Simple Tiled Model:** Works with pre-defined tiles and explicit adjacency rules
- **Overlapping Model:** Learns patterns from a sample image by scanning NxN patches

**Implementations:** Available in [C++, Python, Kotlin, Rust, Julia, Go, Haxe, Java, JavaScript](https://github.com/mxgmn/WaveFunctionCollapse), and adapted for Unity, Unreal Engine 5, and Houdini.

**Games Using WFC:** Bad North (island dioramas), Townscaper (building generation), Caves of Qud (cave layouts), Dead Static Drive, The Matrix Awakens.

**Practical Considerations:**
- Not fast -- processing should be pushed to worker threads or spread across frames
- Best suited for loading screens, world streamers, or per-chunk generation
- Easy to get good-looking results, but nailing specific design requirements is difficult
- [Boris the Brave's WFC Tips](https://www.boristhebrave.com/2020/02/08/wave-function-collapse-tips-and-tricks/) is an essential practical reference

### 4.2 Marching Cubes / Dual Contouring for Terrain

**Marching Cubes:**
- Divides 3D space into a grid of cubes
- For each cube, determines which corners are inside/outside the surface (isosurface)
- 256 possible configurations (15 unique cases due to symmetry) define triangle placement
- **Strengths:** Simple, well-understood, always produces manifold meshes, widely available implementations
- **Weaknesses:** Cannot reproduce sharp features (corners, edges are always rounded), stair-stepping artifacts at low resolution

**Dual Contouring:**
- Places one vertex inside each cell (rather than on edges like Marching Cubes)
- Requires the gradient/normal of the density function in addition to its value
- Uses Quadric Error Function (QEF) minimization to position vertices optimally
- **Strengths:** Reproduces sharp features (edges, corners), naturally supports adaptive grids without crack patching, more natural-looking results
- **Weaknesses:** May produce non-manifold topology in some configurations, requires gradient information, more complex implementation

**Transvoxel Algorithm:** A variant of Marching Cubes specifically designed for smooth transitions between different LOD levels -- eliminates cracks where high-resolution chunks meet low-resolution ones.

**Games Using These:** Deep Rock Galactic (marching cubes variant), Astroneer (marching cubes), Minecraft clones, No Man's Sky.

### 4.3 Poisson Disk Sampling for Natural Distribution

**Concept:** Generates random point distributions where points maintain a minimum distance from each other while filling space uniformly. Produces "blue noise" -- no clumping, no voids.

**[Bridson's Algorithm](https://sighack.com/post/poisson-disk-sampling-bridsons-algorithm) (O(n) complexity):**
1. Place a random initial point
2. For each active point, generate up to k candidates in the annulus [r, 2r]
3. For each candidate, check if any existing point is within distance r (using spatial grid for O(1) lookup)
4. If valid, add to point set and active list
5. If all k candidates fail, remove point from active list
6. Repeat until active list is empty

**Applications in Games:**
- Tree/foliage placement for natural-looking forests
- Rock and debris scattering
- Enemy spawn point distribution
- Item/resource placement
- Texture sample point selection

**Variants:**
- **Weighted Poisson Disk:** Variable minimum distance based on a density map (denser placement near water, sparser on mountains)
- **Multi-class Poisson Disk:** Different object types with different minimum distances

**Properties:** Linear time complexity, produces distributions resembling natural phenomena (forest spacing, cell nuclei), avoids the uniform-grid look of jittered grids.

### 4.4 Perlin/Simplex/Worley Noise Compositions

#### Perlin Noise (Ken Perlin, 1983)
- Gradient noise on a regular grid
- Smooth, continuous, pseudorandom
- Suffers from axis-aligned artifacts in higher dimensions
- O(2^n) complexity for n dimensions

#### Simplex Noise (Ken Perlin, 2001)
- Operates on a simplex lattice (triangles in 2D, tetrahedra in 3D) instead of a square grid
- Fewer multiplications per point, no directional artifacts
- O(n^2) complexity (better than Perlin in high dimensions)
- Preferable for volumetric clouds, fluid dynamics, and real-time applications
- **Patent:** Previously patented by Ken Perlin; the patent expired in January 2022. Open Simplex Noise was created as a patent-free alternative.

#### Worley Noise (Steven Worley, 1996)
- Also called Cellular Noise or Voronoi Noise
- Computes distance to the nearest (or nth nearest) feature point
- Produces cell-like patterns resembling biological cells, cracked mud, stone walls
- **Not useful alone for terrain** -- creates artificial, jagged structures
- Combined with Perlin/Simplex, produces distinctive organic patterns

#### Composition Techniques

**Fractal Brownian Motion (fBm):**
```
value = 0
amplitude = 1.0
frequency = 1.0
for each octave:
    value += amplitude * noise(position * frequency)
    amplitude *= persistence  // typically 0.5
    frequency *= lacunarity   // typically 2.0
```
- Layering multiple noise octaves creates natural-looking detail at multiple scales
- Low frequencies: broad terrain features (continents, mountain ranges)
- High frequencies: fine details (rocks, bumps, crevices)

**Domain Warping:**
```
// Distort the input coordinates with another noise function
float warpedNoise(vec2 p) {
    vec2 offset = vec2(noise(p), noise(p + vec2(5.2, 1.3)));
    return noise(p + offset * warpStrength);
}
```
- Creates organic, flowing distortions
- Used for terrain features like twisted rock formations, alien landscapes

**Ridged Noise:**
```
float ridged(vec2 p) {
    return 1.0 - abs(noise(p));  // Invert absolute value
}
```
- Creates sharp ridges resembling mountain ranges

### 4.5 Grammar-Based Generation (L-Systems, Shape Grammars, Graph Grammars)

#### L-Systems (Lindenmayer Systems)
Developed by Aristid Lindenmayer (1968) to model plant growth:

- **Components:** Alphabet of symbols, production rules, axiom (initial string), geometric interpretation
- **Example:**
  ```
  Axiom: A
  Rules: A -> AB, B -> A
  Step 0: A
  Step 1: AB
  Step 2: ABA
  Step 3: ABAAB
  ```
- **Turtle Graphics Interpretation:** Symbols map to drawing commands (F=forward, +=turn left, -=turn right, [=push state, ]=pop state)
- **Applications:** Trees, plants, branching structures, river networks, road networks, L-system cities
- **CityEngine:** Uses L-systems to generate cities from statistical and geographical data -- first road networks from population density, then buildings
- **Stochastic L-Systems:** Production rules have associated probabilities, introducing variation

#### Shape Grammars
Rule-based systems for generating 3D geometry:

- **Process:** Start with an initial shape, apply production rules that replace non-terminal shapes with sets of new shapes via commands (split, extrude, scale, translate)
- **Applications:** Building facades, architectural generation, urban environments
- **CGA Shape Grammar:** Used in CityEngine for building generation from simple lot shapes to detailed facades
- **Key Advantage:** Compact rule sets generate enormous variety

#### Graph Grammars
Extend grammars to operate on graph structures:

- **Applications:** Level layout generation, quest structure generation, mission/narrative graph generation
- **Process:** Graph rewriting rules replace subgraph patterns with new subgraph structures
- **Example:** A rule might replace a "corridor" node with a "corridor -> room -> corridor" subgraph

### 4.6 Agent-Based Generation

Autonomous agents simulate organic growth processes:

**Settlement Generation:**
- Agents represent settlers, merchants, or builders
- They navigate the world, establish residences, create trade routes, and expand infrastructure
- Road networks emerge from agent movement patterns
- Land use (residential, commercial, industrial) emerges from agent behavior

**Key Research:**
- [Agent-based city generation with LUTI models](https://arxiv.org/abs/2211.01959) - Agents incrementally expand cities by building sites and roads, with reward functions from urban planning models
- [TownSim](https://www.researchgate.net/publication/335590552_TownSim_agent-based_city_evolution_for_naturalistic_road_network_generation) - Agent-based simulation producing naturalistic road networks
- [AgentCraft](https://www.semanticscholar.org/paper/AgentCraft:-An-Agent-Based-Minecraft-Settlement-Iramanesh-Kreminski/80abb21a16fad6eadb8b473c26fd074569e87169) - Agent-based Minecraft settlement generator that also produces written settlement histories

**Road Network Generation:**
- Hierarchical road generation connecting cities, towns, and villages
- Non-Euclidean metrics combined with path merging for junction creation
- Agent movement patterns determine where roads are needed

### 4.7 Constraint Satisfaction for Dungeon/Level Generation

**Concept:** Define variables, domains, and constraints; let a solver find valid configurations.

**Components:**
- **Variables:** Room count, room sizes, connectivity, enemy types, treasure density, door placements
- **Domains:** Possible values for each variable (e.g., room size in [3x3, 5x5, 7x7, 10x10])
- **Constraints:** "Boss room must connect to at least 2 corridors," "No dead ends longer than 3 rooms," "Key must be reachable before locked door"

**Solving Approaches:**
- **Backtracking:** Recursively assign variables, check constraints, backtrack on violation
- **Arc Consistency (AC-3):** Pre-prune domains by checking pairwise constraints
- **Answer Set Programming (ASP):** Declarative logic programming for expressing level requirements

**Advantages:**
- Guarantees on output (all constraints satisfied)
- Intuitive rule specification ("shower next to wall" = one constraint)
- Combines naturally with evolutionary algorithms (evolve seeds, CSP validates)

**Tools:** [MiniZinc](https://www.minizinc.org/) (constraint modeling language), Clingo (ASP solver), OR-Tools (Google's optimization suite)

### 4.8 Voronoi-Based Biome/Region Partitioning

**Concept:** Partition space into regions around seed points where each region contains all locations closest to its seed.

**Process:**
1. Scatter seed points (random, Poisson disk, or manually placed)
2. Compute Voronoi diagram (Fortune's algorithm, O(n log n))
3. Assign biome types to cells (based on noise, distance from center, climate simulation)
4. Optionally apply Lloyd relaxation (move seeds to cell centroids, recompute) for more regular cells

**Enhancements:**
- **Weighted Voronoi (Power Diagrams):** Some seeds have greater "influence," creating larger territories
- **Edge Features:** Voronoi edges naturally define rivers, roads, borders
- **Delaunay Triangulation:** The dual of the Voronoi diagram, useful for connectivity graphs (which regions are neighbors)

**Reference Implementation:** [Red Blob Games' Polygonal Map Generation](http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/) -- a widely-cited tutorial combining Voronoi, elevation noise, moisture simulation, and biome assignment.

**Games:** Civilization series (territory borders), Minecraft (biome distribution), various 4X and strategy games.

---

## 5. Notable Procedural Games and Their Techniques

### 5.1 Minecraft -- Chunk-Based Generation with Noise Composition

**Engine:** Custom Java / C++ (Bedrock)
**Generation Model:** Chunk-based (16x16xWorld_Height columns), generated on-demand as players explore

**Generation Pipeline:**
1. **Heightmap Generation:** Layered noise functions (multi-octave Perlin noise) compute base elevation for every (X,Z) column. The sum of layers at multiple scales mimics real geology at different spatial frequencies.
2. **3D Density (Post-1.18):** For underground features, 3D noise determines where stone is placed. Below the threshold = air (cave), above = stone.
3. **Biome Assignment:** Temperature and humidity noise maps determine biome type per column. Biomes influence surface blocks, vegetation, structures, and mob spawning.
4. **Surface Decoration:** Biome-specific surface blocks (grass, sand, snow, mycelium) replace top stone layers.
5. **Cave Carving (Pre-1.18):** "Perlin Worms" -- noise-guided tunneling agents that snake through solid stone creating branching cave systems.
6. **Cave Generation (Post-1.18, Caves & Cliffs):** Three new cave types, all 3D noise-based:
   - **Cheese Caves:** Large, open caverns (high noise threshold)
   - **Spaghetti Caves:** Long, winding tunnels (narrow threshold band)
   - **Noodle Caves:** Thin, interconnected passages (very narrow threshold)
7. **Structure Generation:** Villages, temples, strongholds, mineshafts placed via constraint rules (biome requirements, minimum distances, feature intersection tests).
8. **Ore Distribution:** Noise-based placement with depth-dependent probability distributions.

**Key Design:** Some generation steps require neighboring chunk data to prevent discontinuities at chunk borders.

### 5.2 Dwarf Fortress -- Geological Simulation + History Generation

**Engine:** Custom C++ (~700,000 lines, one developer since 2002)
**Generation Model:** Full-world simulation before gameplay begins

**World Generation Pipeline:**
1. **Topography:** Basic map values (elevation, rainfall, temperature, drainage, volcanism, savagery) seeded on a grid and filled fractally.
2. **Geological Layers:** Fairly accurate geology -- olivine, gabbro, and other real minerals appear. Topmost layers are sand/clay/soil; deeper layers contain rock with minerals in geologically appropriate clusters.
3. **Biome Classification:** Derived from elevation + rainfall + drainage + temperature. High rainfall + low drainage = swamp. Each biome has savagery and alignment variables.
4. **Hydrology:** Water simulated with 7 density levels per tile, falling-sand style physics.
5. **History Generation:** Simulates centuries of history:
   - Civilizations rise, wage war, fall, and rise again
   - Characters live full lives with relationships, grudges, and accomplishments
   - Artifacts are created and change hands through trade, theft, and warfare
   - Languages evolve procedurally
6. **Creature Generation:** Procedural creatures with anatomically correct body plans, tissue types, and behavioral patterns.

**Key Design:** Some calculations are as complex as industrial aerospace simulations. Generation is modular -- different systems can be toggled on/off independently.

### 5.3 Factorio -- Resource Distribution + Enemy Base Generation

**Engine:** Custom C++
**Generation Model:** Chunk-based, generated on-demand as map is revealed

**Key Systems:**
- **Resource Distribution:** Starting area always has at least one patch each of coal, iron ore, copper ore, and stone. Uranium and crude oil excluded from start. Resource patch size increases with distance from spawn, scaling to tens of millions of ore in distant patches.
- **Enemy Base Generation:** Noise-based placement with two key parameters:
  - **Frequency:** Controls distance between bases
  - **Size:** Controls base diameter, but counterintuitively also pushes bases further from spawn when increased
- **Terrain:** Noise-based biome assignment (grass, desert, water) with configurable parameters.
- **Determinism:** All generation is seed-based and deterministic, critical for multiplayer synchronization where all clients must generate identical worlds.

### 5.4 Deep Rock Galactic -- Cave Generation via Marching Cubes

**Engine:** Unreal Engine 4
**Generation Model:** Per-mission cave generation

**Technique:**
- Uses a variant of the [Marching Cubes algorithm](https://www.byteplus.com/en/topic/420776) to create cave geometry from volumetric data
- Actual implementation uses **Occupancy Related Extension** rather than pure marching cubes
- **Hybrid Approach:** Caves are pre-designed by hand for shape/layout, then:
  - A procedural "paint layer" adds visual variation
  - The order and arrangement of pre-designed segments is randomized
  - Room connections and tunnel routing are procedurally determined
- No two missions feel exactly the same due to the combination of handcrafted quality and procedural arrangement

### 5.5 Astroneer -- Voxel Terrain Deformation

**Engine:** Unreal Engine 4 (heavily modified)
**Generation Model:** Pre-generated planets with runtime deformation

**Technique:**
- **Volumetric Voxel Data:** Terrain stored as a 3D density field
- **Marching Cubes Polygonization:** Converts voxel density to visible mesh geometry and collision data
- **Chunked Deformation:** Ground divided into chunks; only modified chunks are rebuilt (not the whole planet)
- **Custom Generation Graph:** Procedural generation defined in a graph that compiles to low-level code for shipping
- **Real-Time Terrain Tool:** Player can add or subtract terrain by modifying voxel density values
- **Design Challenge:** Since terrain is fully deformable, traditional offline optimization (lightmap baking, static batching) cannot be used

### 5.6 Valheim -- Terrain + Biome Generation

**Engine:** Unity
**Generation Model:** Seed-based, world generated at game start (not runtime)

**Technique:**
- **Seed System:** Every world seed determines the entire map layout. A heightmap field much larger than any single map is generated; the game randomly selects a center point and draws a bounding circle for the playable area.
- **Disk-Shaped World:** Islands scattered across a circular ocean.
- **Biome Placement:** Rule-based with spatial constraints:
  - Certain biomes (Ashlands) must never border anything except ocean
  - Northern/southern biomes form distinct latitude stripes
  - Biome probability varies with distance from world center and latitude
- **Modular Generation:** Objects within biomes are placed procedurally with random variation.

### 5.7 Townscaper -- WFC-Based Building Generation

**Engine:** Custom (Oskar Stalberg)
**Generation Model:** Real-time, user-driven

**Technique:**
- **Irregular Grids:** Starting from a hexagonal grid, broken into quads, then into quads again, with vertex jittering for organic irregularity.
- **Wave Function Collapse:** Determines which building tiles are valid based on the player-created environment shape.
- **Marching Cubes on Irregular Grids:** Combined with WFC for geometry generation.
- **Minimal Input:** Player only adds or removes blocks; the algorithm handles all architectural detail (roofs, windows, arches, stairs, railings).
- **Lineage:** Culmination of techniques from Stalberg's prior games (Bad North island gen, Night Call quad grids).

Reference: [How Townscaper Works](https://www.gamedeveloper.com/game-platforms/how-townscaper-works-a-story-four-games-in-the-making)

### 5.8 Bad North -- Island Generation

**Engine:** Custom
**Generation Model:** Per-level procedural islands

**Technique:**
- **Custom WFC Implementation:** Island dioramas assembled from handcrafted tilesets using Wave Function Collapse.
- **Custom Observation Heuristic:** Stalberg developed a WFC variant that doesn't produce local minimums, specifically designed for triangle/quad tile combinations.
- **Constraint Propagation:** Local adjacency rules ensure coherent, visually appealing island layouts.
- **Gameplay Integration:** Island shape directly affects tactical gameplay (chokepoints, high ground, landing beaches).

---

## 6. Runtime vs Build-Time Generation

### 6.1 When to Generate at Build Time vs Runtime

| Factor | Build-Time | Runtime |
|--------|-----------|---------|
| **Quality Control** | Artists can review, tweak, reject | Must trust algorithms + constraints |
| **Performance** | Zero runtime cost | Must fit within frame budget or loading screen |
| **Variety** | Fixed content per build | Infinite variety per playthrough |
| **App Size** | Larger (pre-baked assets) | Smaller (algorithms + seeds) |
| **Iteration** | Slower (regenerate + review) | Faster (change parameters, see results) |
| **Multiplayer** | Ship identical world data | Must ensure determinism across clients |

**Hybrid Approach (Most Common):**
- Generate at build time, then use runtime procedural generation for variation
- Example: Hand-authored biome templates + procedural placement of objects within biomes
- Example: Pre-baked terrain heightmaps + runtime foliage/grass scattering

### 6.2 Streaming and Chunking Strategies

**Chunk-Based Streaming:**
- Divide world into fixed-size chunks (Minecraft: 16x16x384, typical: 32x32 to 256x256 meters)
- Maintain a "loaded radius" around the player
- Generate chunks in a priority queue ordered by distance to player
- Background thread generates chunk data; main thread uploads meshes to GPU

**Concentric Ring Pattern:**
```
Ring 0 (closest): Full detail, physics, AI, all systems active
Ring 1: Full visual detail, simplified physics
Ring 2: Reduced LOD, no physics, simplified AI
Ring 3: HLOD/imposter representations
Ring 4+: Unloaded, only metadata retained
```

**Hybrid Streaming:**
- Terrain generated from seed + noise (cheap to regenerate)
- Player modifications stored as delta overlays on top of generated base
- Only deltas need to be saved/streamed

**World Partition (Unreal-specific):**
- Cell-based streaming with configurable cell sizes
- Data layers enable independent streaming of different content types
- HLOD automatically generates simplified representations for distant cells

### 6.3 Seed-Based Determinism

**Principles:**
- Same seed + same algorithm = identical output, always
- Pseudorandom number generators (PRNGs) are deterministic sequences from a seed
- Each subsystem should derive its own seed from the master seed to ensure independence:
  ```
  terrainSeed = hash(masterSeed, "terrain")
  biomeSeed   = hash(masterSeed, "biome")
  structSeed  = hash(masterSeed, "structures")
  ```

**Common Pitfalls:**
- **Floating-point non-determinism:** Different CPUs may produce different float results. Use fixed-point math for critical generation code, or ensure consistent compiler settings.
- **Order-dependent generation:** If chunk generation order varies (due to player movement), and chunks share PRNG state, results change. Solution: each chunk gets its own seed derived from chunk coordinates.
- **Multithreading:** Parallel generation must not share PRNG state. Derive per-thread seeds from chunk coordinates + master seed.

**Hash Functions for Seed Derivation:**
- `xxHash` - Fast, good distribution, widely used in games
- `MurmurHash3` - Popular alternative
- Simple: `hash(x, y) = fract(sin(x * 12.9898 + y * 78.233) * 43758.5453)` (adequate for shaders, not for critical generation)

### 6.4 Save System Implications

**Seed-Only Saves:**
- Store only the master seed + player modifications (deltas)
- Regenerate everything else from seed on load
- Extremely compact save files
- Example: Minecraft stores seed + player-placed/removed blocks + entity state

**Delta Storage:**
- Track changes to procedurally generated content: block modifications, tree removals, structure damage
- Efficient encoding: run-length encoding, sparse voxel octrees, or simple change lists
- Challenge: as players modify more content, delta size grows unboundedly

**Snapshot Saves:**
- Store full world state at save time
- Larger save files but simpler implementation
- No need to regenerate on load

**Hybrid:**
- Save seed + deltas for terrain
- Save full state for entities, inventory, quest progress
- Regenerate terrain from seed, apply deltas, then load entity state

### 6.5 LOD Transitions for Procedural Content

**Challenge:** Procedurally generated content often lacks pre-authored LOD levels.

**Solutions:**

| Approach | Description | Best For |
|----------|-------------|----------|
| **Nanite (Unreal)** | Automatic, continuous LOD from any mesh | Static procedural meshes in UE5 |
| **Mesh Simplification** | Runtime mesh decimation (Quadric Error Metrics) | Custom engines |
| **HLOD** | Merge nearby objects into single low-poly representation | World Partition streaming |
| **Imposters** | Billboard sprites rendered from 3D objects | Distant vegetation, buildings |
| **SDF LOD** | Switch from mesh to SDF raymarching at distance | Dendrovia-style hybrid rendering |
| **Voxel LOD** | Reduce voxel resolution at distance (Transvoxel) | Voxel terrain engines |
| **Tessellation LOD** | Reduce subdivision factor with distance | Heightmap terrain |

**Transition Strategies:**
- **Dithering:** Dissolve pattern fades between LOD levels over several frames
- **Cross-fade:** Render both LOD levels simultaneously with opacity blend during transition
- **Hysteresis:** Use different distances for LOD increase vs decrease to prevent flickering at boundary
- **Screen-size metric:** Switch LOD based on projected screen size rather than distance (accounts for FOV, screen resolution)

---

## 7. Academic and Conference Resources

### 7.1 PCG Workshop at FDG (Foundations of Digital Games)

The [PCG Workshop](https://www.pcgworkshop.com/) is the primary academic venue for procedural content generation research:

- **Format:** Accepts full-length papers, short position papers, and demos
- **Collocated with:** FDG (Foundations of Digital Games) or IEEE CoG (Conference on Games)
- **History:** Over 10 years of operation (retrospective: [10 Years of the PCG Workshop](https://arxiv.org/pdf/2104.11037))
- **Upcoming:** IEEE Conference on Games 2025 (CoG'25) -- August 26-29, 2025, Lisbon, Portugal

### 7.2 Key Textbooks

| Book | Authors | Year | Focus |
|------|---------|------|-------|
| **[Procedural Content Generation in Games](https://link.springer.com/book/10.1007/978-3-319-42716-4)** | Shaker, Togelius, Nelson | 2016 | Comprehensive PCG textbook: search-based, solver-based, constructive, noise, fractals, ad-hoc methods |
| **[Procedural Content Generation in Games](https://www.pcgbook.com/)** (free online) | Same authors | 2016 | Free web version of the above |
| **Artificial Intelligence and Games** | Yannakakis, Togelius | 2018 | Broader AI for games, including PCG chapters |
| **Procedural Content Generation via Machine Learning** | Summerville et al. | 2018 | ML-based approaches to PCG (PCGML) |

### 7.3 Key Research Papers and Surveys

| Paper | Focus | Link |
|-------|-------|------|
| **PCG in Games: A Survey with Insights on Emerging LLM Integration** (2024) | Comprehensive survey covering traditional PCG and LLM-based generation | [arxiv.org/html/2410.15644](https://arxiv.org/html/2410.15644v1) |
| **10 Years of the PCG Workshop: Past and Future Trends** (2021) | Retrospective analysis of PCG research trends | [arxiv.org/pdf/2104.11037](https://arxiv.org/pdf/2104.11037) |
| **WaveFunctionCollapse is Constraint Solving in the Wild** (2019) | Formal analysis of WFC as constraint satisfaction | [github.com/mxgmn/WaveFunctionCollapse](https://github.com/mxgmn/WaveFunctionCollapse) |
| **Procedural Generation of Dungeons** (2014) | Survey of dungeon generation methods | [researchgate.net](https://www.researchgate.net/publication/260800341_Procedural_Generation_of_Dungeons) |
| **Answer Set Programming for Procedural Content Generation** | Using ASP solvers for guaranteed-valid level generation | [Liapis Research](https://antoniosliapis.com/research/research_pcg.php) |
| **Agent-Based City Generation with LUTI Models** (2022) | Agent-based urban planning simulation for city generation | [arxiv.org/abs/2211.01959](https://arxiv.org/abs/2211.01959) |

### 7.4 GDC Vault Procedural Generation Talks

The [GDC Vault](https://gdcvault.com/) contains numerous procedural generation presentations:

- **[Practices in Procedural Generation](https://www.gdcvault.com/play/1023372/Practices-in-Procedural)** -- Designers from Dwarf Fortress and Moon Hunters discuss concrete practical PCG approaches
- **GDC 2025:** 730+ sessions including PCG talks on procedural village generation with unique histories, cultures, and quests for roguelikes
- **AI and Games Summer School:** 7th edition, Malmo, Sweden, June 23-27, 2025 -- covers PCG topics

**Notable Historical GDC PCG Talks (available on GDC Vault or YouTube):**
- "Building Worlds in No Man's Sky" (Sean Murray, Hello Games)
- "Math for Game Programmers: Noise-Based RNG" (Squirrel Eiserloh)
- "Procedural World Generation in Far Cry 5" (Ubisoft)
- "Townscaper: A City Building Exploration" (Oskar Stalberg)
- "The Systems Behind Spelunky" (Derek Yu)
- "Failing to Fail: The Spiderweb of Constraints in Unexplored" (Joris Dormans)

### 7.5 Online Learning Resources

| Resource | Type | URL |
|----------|------|-----|
| **Red Blob Games** | Interactive tutorials on map generation, pathfinding, noise | [redblobgames.com](http://www.redblobgames.com/) |
| **Boris the Brave** | WFC tutorials, constraint-based generation | [boristhebrave.com](https://www.boristhebrave.com/) |
| **Catlike Coding** | Unity procedural tutorials (noise, mesh, terrain) | [catlikecoding.com](https://catlikecoding.com/) |
| **Inigo Quilez** | SDF functions, noise, raymarching (essential for shader PCG) | [iquilezles.org](https://iquilezles.org/) |
| **The Book of Shaders** | Interactive shader tutorial including noise chapter | [thebookofshaders.com](https://thebookofshaders.com/) |
| **Procedural Generation Subreddit** | Community discussion and showcase | [reddit.com/r/proceduralgeneration](https://reddit.com/r/proceduralgeneration) |
| **PCG Wiki** | Community wiki of PCG algorithms and techniques | [pcg.wikidot.com](http://pcg.wikidot.com/) |

---

## Cross-Reference: Relevance to Dendrovia

Several patterns from this research directly inform Dendrovia's "Macro-SDF, Micro-Mesh" architecture:

| Dendrovia Need | Relevant Pattern | Notes |
|----------------|-----------------|-------|
| Dendrite branching structures | **L-Systems** | Natural fit for tree-like code visualization structures |
| Procedural SDF terrain | **Noise Composition (fBm, Domain Warping)** | Drives SDF distance functions for branch shapes |
| Node placement on branches | **Poisson Disk Sampling** | Natural distribution of code nodes along dendrite surfaces |
| LOD transitions (SDF far, mesh near) | **LOD Strategies (Section 6.5)** | Hybrid SDF/mesh LOD with dithered transitions |
| Biome-like file/directory regions | **Voronoi Partitioning** | Map repository directories to spatial biomes |
| Instanced mesh rendering | **Unity GPU Instancing / DrawMeshInstancedIndirect** | For leaves, bugs, particles at scale |
| GPU-accelerated generation | **Burst Compiler + Jobs** or **Compute Shaders** | Parallel noise evaluation and mesh generation |
| Deterministic worlds from git state | **Seed-Based Determinism (Section 6.3)** | Git commit hash as world seed |

---

*This document is a living research artifact. Update as new engine versions and techniques emerge.*
