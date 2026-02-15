# Tranche 6: WebGPU Rendering Landscape 2025-2026

**Date:** February 13, 2026
**Pillar:** ARCHITECTUS (The Renderer)
**Purpose:** Comprehensive map of WebGPU-based rendering across engines, frameworks, capabilities, and emerging patterns

---

## 1. Browser Support Status (Updated Feb 2026)

As of November 25, 2025, WebGPU ships by default in all major browsers. This is the inflection point.

| Browser | Engine | Version | Platform | Status |
|---------|--------|---------|----------|--------|
| Chrome | Dawn (C++) | 113+ | Windows, macOS, ChromeOS | Stable |
| Chrome | Dawn | 121+ | Android 12+ (Qualcomm/ARM) | Stable |
| Chrome | Dawn | 144+ | Linux (Intel Gen12+) | Rolling out |
| Edge | Dawn (C++) | 113+ | Windows, macOS | Stable |
| Firefox | wgpu (Rust) | 141+ | Windows | Stable |
| Firefox | wgpu (Rust) | 145+ | macOS ARM64 | Stable |
| Firefox | wgpu (Rust) | 2026 | Linux | Planned |
| Firefox | wgpu (Rust) | 2026 | Android | Planned |
| Safari | Metal (WebKit) | 26+ | macOS Tahoe 26, iOS 26, iPadOS 26, visionOS 26 | Stable |

**Coverage:** ~95% of desktop users have WebGPU-capable browsers. The remaining ~5% get automatic WebGL2 fallback. Linux and older Android are the primary gaps.

**Sources:**
- https://caniuse.com/webgpu
- https://github.com/gpuweb/gpuweb/wiki/Implementation-Status
- https://web.dev/blog/webgpu-supported-major-browsers
- https://www.webgpu.com/news/webgpu-hits-critical-mass-all-major-browsers/
- https://byteiota.com/webgpu-2026-70-browser-support-15x-performance-gains/

---

## 2. WebGPU Engines and Frameworks

### 2.1 Three.js WebGPU Backend + TSL

**Status:** Production-ready since r171 (September 2025). The dominant choice for custom 3D web experiences.

**TSL (Three Shading Language):** Introduced in r166, TSL is a node-based, JavaScript-authored shader system that compiles to both WGSL (WebGPU) and GLSL (WebGL2). It is now the mandatory path for writing custom shaders on the WebGPU backend. Raw WGSL cannot be injected directly into the material system.

**Key capabilities:**
- `WebGPURenderer` serves as a universal renderer with automatic WebGL2 fallback
- Compute shaders via `Fn().compute()` with `instancedArray` for persistent GPU buffers
- Full post-processing pipeline via native `PostProcessing` class and TSL pass nodes
- Async initialization required: `await renderer.init()`

**Import paths (r171+):**
- `three/webgpu` for renderer and node-material classes
- `three/tsl` for shader authoring functions

**Breaking changes (r170-r175):**
- `colorBufferType` renamed to `outputBufferType`
- `WebGLCubeRenderTarget` replaced by `CubeRenderTarget`
- Shadow bias values may need reduction (improved shadow algorithm)
- `MeshPostProcessingMaterial` removed
- `RGBELoader` renamed to `HDRLoader`
- TSL `label()` renamed to `setName()`
- TSL blending functions prefixed with `blend` (e.g., `burn()` becomes `blendBurn()`)
- New `DepthOfFieldNode` and `TRAANode` APIs

**Sources:**
- https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs
- https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
- https://www.utsubo.com/blog/webgpu-threejs-migration-guide
- https://www.utsubo.com/blog/threejs-2026-what-changed
- https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language
- https://github.com/mrdoob/three.js/wiki/Migration-Guide

### 2.2 Babylon.js

**Status:** Production WebGPU since v5.0 (May 2022). Major v8.0 release in March 2025.

**Key capabilities:**
- All core shaders available in both GLSL and WGSL natively (no conversion layer)
- Node Material Editor supports WGSL shader graph creation
- Snapshot Rendering (via WebGPU Render Bundles) achieves ~10x CPU overhead reduction
- Compute shaders available with a fallback to texture-based GPGPU on WebGL
- WebGPU and WebGL maintained side by side

**v8.0 highlights (March 2025):**
- Native WGSL shaders (engine is ~2x smaller when targeting WebGPU only)
- Node Material Editor generates WGSL directly
- Improved Render Bundles for recording and replaying GPU commands

**Dendrovia relevance:** Strong compute shader story and mature WebGPU support, but no React integration. Would require a full framework switch away from R3F.

**Sources:**
- https://doc.babylonjs.com/setup/support/webGPU
- https://doc.babylonjs.com/setup/support/webGPU/webGPUStatus
- https://blogs.windows.com/windowsdeveloper/2025/03/27/announcing-babylon-js-8-0/
- https://forum.babylonjs.com/t/current-state-of-webgpu-support-in-babylon-js/57134

### 2.3 PlayCanvas

**Status:** Production WebGPU in Engine v2.8+. Open-source editor frontend as of July 2025.

**Key capabilities:**
- Full WebGPU rendering pipeline with WebGL fallback
- Compute shader support since Engine v1.70.0
- Indirect drawing support (WebGPU only)
- Engine v2.9.0 as default Editor version (July 2025)

**Dendrovia relevance:** Strong game engine with editor, but not React-based. Interesting for comparing compute shader patterns and indirect draw implementations.

**Sources:**
- https://github.com/playcanvas/engine
- https://blog.playcanvas.com/build-webgpu-apps-today-with-playcanvas/
- https://developer.playcanvas.com/user-manual/graphics/advanced-rendering/indirect-drawing/

### 2.4 Google Dawn

**Status:** The C++ WebGPU implementation that powers Chrome/Edge. Also usable as a standalone native library.

Dawn is the reference implementation of `webgpu.h`, mapping to Direct3D 12 (Windows), Metal (macOS/iOS), and Vulkan (Linux/Android). It is the engine behind Chrome's WebGPU support and can be used outside the browser for native C++ applications.

**Notable:** Android Jetpack Kotlin bindings for WebGPU have been published (alpha), based on Dawn, giving Android developers native access to the WebGPU API.

**Sources:**
- https://github.com/google/dawn
- https://developer.chrome.com/blog/next-for-webgpu

### 2.5 wgpu (Rust)

**Status:** Mature cross-platform Rust GPU library. Powers Firefox's WebGPU implementation and the Bevy game engine.

**Key capabilities:**
- Safe, portable Rust API implementing the WebGPU standard
- Runs natively on Vulkan, Metal, DX12, and OpenGL ES
- Compiles to WebAssembly for browser targets (uses browser's own WebGPU or WebGL2)
- Actively maturing toward a stable 1.0 release
- Hardware ray tracing support added in wgpu v28 (Vulkan backend only)

**Dendrovia relevance:** If ARCHITECTUS ever needs native rendering (desktop app), wgpu provides a path to share WGSL shaders between browser and native. Not directly useful for the R3F-based web stack.

**Sources:**
- https://wgpu.rs/
- https://github.com/gfx-rs/wgpu
- https://tillcode.com/rust-for-gpu-programming-wgpu-and-rust-gpu/

### 2.6 Bevy Engine (Web Target)

**Status:** Experimental WebGPU support since Bevy 0.11. Functional on Chrome, expanding to other browsers.

Bevy is built on wgpu from the ground up. Its web target compiles to WebAssembly and can use either WebGPU or WebGL2 in the browser. The main challenge was reworking renderer initialization for WebGPU's async requirements.

**Limitations:** WebGPU web target requires compatible browsers (Chrome primary). Safari and Firefox compatibility improving with broader WebGPU adoption.

**Dendrovia relevance:** Interesting as a Rust/ECS game engine reference, but not directly applicable to the R3F stack.

**Sources:**
- https://bevy.org/news/bevy-webgpu/
- https://bevy-cheatbook.github.io/platforms.html
- https://github.com/bevyengine/bevy/issues/8315

### 2.7 WebGPU-Native Engines

**Orillusion:**
A pure WebGPU engine built from the ground up (no WebGL legacy). Uses an ECS architecture. Targets desktop-level rendering quality in the browser. Small community (~587 GitHub stars) but interesting as a WebGPU-first design reference.

- https://www.orillusion.com/en/
- https://github.com/Orillusion/orillusion

**Evergine:**
.NET-based 3D engine that added experimental WebGPU support in its 2025 major release. Runs via .NET 8 + Emscripten + Dawn. Over 4.5 million downloads. Interesting for the .NET ecosystem but not relevant to our JavaScript/TypeScript stack.

- https://evergine.com/webgpu-finally-on-web/
- https://evergine.com/a-new-evergine-2025-major-release/

**Unity 6 (Experimental WebGPU):**
Unity 6000.1 includes experimental WebGPU support. Over 15,000 browser games released in H1 2025, with Unity powering ~55% of web games. WebGPU enables HDR lighting, volumetric fog, and post-processing in browser builds. Still experimental, not production-stable.

- https://docs.unity3d.com/6000.2/Documentation/Manual/WebGPU-limitations.html
- https://unity.com/blog/engine-platform/web-runtime-updates-enhance-browser-experience

**Unreal Engine 5 (Community WebGPU):**
No official Epic web export, but community projects (notably Wonder Interactive) have ported UE5 to WebGPU + WebAssembly. The Lyra sample project runs in Chrome with multithreading and near-native graphics. Still requires custom build pipelines.

- https://forums.unrealengine.com/t/webgpu-for-unreal-engine-5-5-6-and-5-7-support/2693960
- https://forums.unrealengine.com/t/lyra-sample-running-in-webgpu-demo-below/1932180

---

## 3. Compute Shader Capabilities in Browser

### 3.1 GPU Compute for Procedural Generation

WebGPU compute shaders are first-class citizens, enabling simulation and rendering to share data directly on the GPU. Key applications:

- **Terrain generation:** Pure math noise functions running in parallel across millions of points
- **Vegetation placement:** Scatter algorithms on GPU
- **Procedural textures:** Real-time texture synthesis without CPU bottleneck
- **SDF pre-evaluation:** Computing distance fields into 3D textures

Compute shaders dispatch kernels with specific thread counts. Each thread operates independently in parallel, making procedural generation embarrassingly parallel.

**Sources:**
- https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders.html
- https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders
- https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/

### 3.2 Compute Shader Marching Cubes

GPU-parallel Marching Cubes has been demonstrated in WebGPU with near-native performance. The algorithm is nearly embarrassingly parallel with two global reduction steps (prefix sum / exclusive scan).

**Key implementation (Will Usher):**
- Full compute shader pipeline: classify voxels, compute prefix sums, generate vertices
- Exclusive scans as building blocks for parallel output allocation
- Demonstrated interactive isosurface extraction at real-time rates

**WebGPU Compute Metaballs:**
- Combines marching cubes with bloom post-processing via compute shaders
- Physically-based shading, deferred rendering, shadow mapping
- Runs entirely on GPU

**Dendrovia relevance:** Critical for the hybrid SDF+mesh approach. When SDF performance exceeds budget, marching cubes on GPU can extract a mesh from the distance field in real-time, enabling the "bake SDF to mesh" strategy described in CLAUDE.md.

**Sources:**
- https://www.willusher.io/graphics/2024/04/22/webgpu-marching-cubes/
- https://github.com/Twinklebear/webgpu-marching-cubes
- https://gnikoloff.github.io/webgpu-compute-metaballs/

### 3.3 GPU-Driven Rendering Pipelines

**Indirect Draw Calls:**
Indirect draws let the GPU define work parameters in a buffer rather than the CPU specifying them explicitly. A 16-byte GPU buffer holds `[vertexCount, instanceCount, firstVertex, firstInstance]`. Compute shaders can modify these parameters per-frame for dynamic rendering.

**GPU Culling:**
Frustum and occlusion culling can run entirely on the GPU via compute shaders that update indirect draw parameters. Objects outside the frustum get their `instanceCount` set to 0. This eliminates CPU-GPU synchronization for visibility determination.

**Multi-Draw Indirect (Shipping):**
Issues multiple draw calls from a single GPU command. Particularly useful for particle systems, instancing, and large scenes. Available as a GPU feature in Chrome.

**Performance impact:** Using GPU culling "makes the difference between the scene running smoothly or being a choppy mess on many devices" (Brandon Jones / Toji.dev).

**Sources:**
- https://toji.dev/webgpu-best-practices/indirect-draws.html
- https://github.com/toji/webgpu-bundle-culling
- https://toji.dev/webgpu-best-practices/render-bundles.html
- https://developer.playcanvas.com/user-manual/graphics/advanced-rendering/indirect-drawing/

### 3.4 Particle Systems via Compute

WebGPU compute shaders have transformed browser-based particle systems from a CPU bottleneck to a GPU-native workload.

**Performance benchmarks:**

| Platform | CPU Particles | GPU Compute Particles | Improvement |
|----------|--------------|----------------------|-------------|
| GTX 1060 | ~50K @ 60fps | ~10M @ 63fps | ~200x |
| Modern desktop GPU | ~100K | 500K-2M+ | 5-20x |
| MacBook (integrated) | ~30K | ~500K | ~15x |

**Pattern:** Each compute thread updates one particle. Position, velocity, lifetime buffers persist on GPU across frames. No CPU upload per frame. Rendering reads directly from the same storage buffers via instanced draw.

**Three.js TSL pattern:**
```js
const positions = instancedArray(PARTICLE_COUNT, 'vec3');
const velocities = instancedArray(PARTICLE_COUNT, 'vec3');

const updateParticles = Fn(() => {
  const pos = positions.element(instanceIndex);
  const vel = velocities.element(instanceIndex);
  pos.addAssign(vel.mul(deltaTime));
})().compute(PARTICLE_COUNT);
```

**Critical:** Compute shaders have NO WebGL2 fallback. The ~5% on WebGL2 must use CPU-driven instanced mesh particles with reduced counts.

**Sources:**
- https://markaicode.com/webgpu-physics-simulation-1m-particles/
- https://lisyarus.github.io/blog/posts/particle-life-simulation-in-browser-using-webgpu.html
- https://wawasensei.dev/courses/react-three-fiber/lessons/tsl-gpgpu

---

## 4. SDF and Raymarching in WebGPU

### 4.1 Current Performance State

SDF raymarching in WebGPU browsers achieves production-viable frame rates on modern hardware. The key constraint is ray step count and SDF complexity, not browser overhead.

**Benchmark reference (Radiance):**
- Started as a 32KB WebGPU raymarcher
- Evolved into a DirectX 12 compute shader benchmark
- Demonstrates that WebGPU raymarching performance approaches native

**Real-world numbers (estimated from community projects):**

| Scene Complexity | Steps | Resolution | Desktop FPS | Mobile FPS |
|-----------------|-------|-----------|-------------|------------|
| Simple (5-10 SDF ops) | 64 | 1080p | 60+ | 30-45 |
| Medium (20-50 SDF ops) | 128 | 1080p | 45-60 | 15-30 |
| Complex (100+ SDF ops) | 256 | 1080p | 20-40 | <15 |
| Simple | 64 | 720p | 60+ | 45-60 |

**Key insight:** Resolution scaling is the single biggest performance lever. Rendering SDF at 50-75% resolution with upscaling is the standard production approach.

### 4.2 WebGPU SDF Editor (Reinder Nijhoff, January 2026)

A landmark project demonstrating real-time SDF modeling in the browser:

- Hierarchical scene graph with groups and primitives
- Blend operations with configurable blend radius
- Uses atomic max for depth testing (since WebGPU lacks 64-bit atomics)
- Temporal anti-aliasing (TAA) with sub-pixel camera jitter to reduce aliasing and fill holes
- Part of the RenderQueue project

This is the most sophisticated browser-based SDF editor to date and validates the approach for Dendrovia's SDF rendering.

**Sources:**
- https://reindernijhoff.net/2026/01/webgpu-sdf-editor-real-time-signed-distance-field-modeling/

### 4.3 Hybrid SDF+Mesh Approaches

The hybrid approach described in Dendrovia's CLAUDE.md ("Macro-SDF, Micro-Mesh") is well-validated by community projects:

**CK42BB/procedural-clouds-threejs:**
- WebGPU path: Full raymarching with volumetric effects
- WebGL fallback: Billboard mesh approximation
- Demonstrates the exact fallback pattern ARCHITECTUS needs

**wgpu-raymarcher (Rust):**
- WGSL raymarching with dynamic lighting, shadows, reflections
- Smooth object blending via SDF operations
- Adaptive ray marching for performance

**Three.js TSL raymarching (Codrops):**
- Liquid SDF raymarching using TSL
- Demonstrates `colorNode` vs `fragmentNode` for material integration
- Shows how to compose SDF primitives in TSL's functional style

### 4.4 Inigo Quilez Techniques Applied to WebGPU

Quilez's SDF primitives and operations translate directly to both WGSL and TSL:

**Directly portable techniques:**
- SDF primitive library (sphere, box, torus, capsule, etc.)
- Smooth min/max for organic blending (critical for dendrite look)
- Domain repetition for infinite detail
- Bounding volume acceleration for complex scenes
- Normal estimation via central differences

**WebGPU-specific considerations:**
- WGSL requires explicit typing (no implicit casts like GLSL)
- Swizzle restrictions: cannot swizzle function returns in WGSL
- Storage buffer access patterns differ from GLSL texture lookups
- TSL's `Loop` and `If` map well to raymarching patterns

**TSL SDF primitive example:**
```js
const sdSphere = Fn(([p, r]) => {
  return length(p).sub(r);
});

const sdBox = Fn(([p, b]) => {
  const q = abs(p).sub(b);
  return length(max(q, 0.0)).add(min(max(q.x, max(q.y, q.z)), 0.0));
});

const smoothMin = Fn(([a, b, k]) => {
  const h = max(k.sub(abs(a.sub(b))), 0.0).div(k);
  return min(a, b).sub(h.mul(h).mul(k).mul(0.25));
});
```

### 4.5 Shadertoy-to-WebGPU Porting

Several tools exist for running Shadertoy-style shaders in WebGPU:

- **WebGPU Shader Toy (pongasoft):** Fragment shader playground with WGSL, providing Shadertoy-compatible uniforms (size, mouse, time, frame)
- **shadertoy-webgpu (hjlld):** Shadertoy renderer using WebGPU. Note: WGSL does not support combined texture+sampler
- **WGSL Shadertoy (WebGPU-Art):** Direct WGSL toy environment

**Key porting considerations:** WGSL is more verbose and strict than GLSL. No implicit type coercion, no `.rgba` accessors (only `.xyzw`), and buffer uniforms must be wrapped in structs. The recommended path for ARCHITECTUS is TSL (which abstracts these differences) rather than raw WGSL.

**Sources:**
- https://iquilezles.org/articles/sdfbounding/
- https://tympanus.net/codrops/2024/07/15/how-to-create-a-liquid-raymarching-scene-using-three-js-shading-language/
- https://github.com/wesfly/wgpu-raymarcher
- https://pongasoft.com/webgpu-shader-toy
- https://github.com/hjlld/shadertoy-webgpu

---

## 5. React Three Fiber Ecosystem 2025-2026

### 5.1 R3F v9 (Current Stable)

**WebGPU support:** Fully supported via async `gl` prop. The `Canvas` component accepts a promise-returning callback for `WebGPURenderer` initialization.

```jsx
<Canvas
  gl={async (canvas) => {
    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    await renderer.init();
    return renderer;
  }}
  frameloop="never"
>
```

**React 19 compatibility:** R3F v9 is compatible with React 19.2, including the Activity feature.

**Key change:** `state.gl` is now `state.renderer` in the internal API.

**Sources:**
- https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide
- https://blog.loopspeed.co.uk/react-three-fiber-webgpu-typescript
- https://wawasensei.dev/courses/react-three-fiber/lessons/webgpu-tsl

### 5.2 R3F v10 (Alpha)

**Status:** Alpha release. Led by @DennisSmolek. Shipping alongside Drei 11 alpha.

**New features:**
- **WebGPU first-class support:** New built-ins for TSL: `useUniforms`, `useNodes`, `useLocalNodes`, `usePostProcessing`
- **Advanced scheduler:** `useFrame` supports advanced scheduling and can be used outside `<Canvas />`
- **Renderer abstraction:** `state.gl` becomes `state.renderer`, supporting both `WebGLRenderer` and `WebGPURenderer`
- **Data-oriented workflows:** Moving toward ECS-style patterns

**Dendrovia implication:** v10's TSL hooks (`useUniforms`, `useNodes`) will simplify SDF shader integration significantly. Worth tracking the alpha closely.

**Sources:**
- https://github.com/pmndrs/react-three-fiber/releases/tag/v10.0.0-alpha.1
- https://github.com/pmndrs/react-three-fiber/releases

### 5.3 Drei (Current + v11 Alpha)

Most drei helpers (OrbitControls, Html, Environment, etc.) work with the WebGPU backend. The `View` component has a separate WebGPU PR (#2528). A community package `wuhhh/view-webgpu` provides a workaround.

**Drei 11 alpha** is being developed alongside R3F v10 with WebGPU-aware utilities.

**Sources:**
- https://github.com/pmndrs/drei
- https://github.com/pmndrs/drei/releases

### 5.4 Post-Processing

**Critical gap:** The `pmndrs/postprocessing` library (which `@react-three/postprocessing` wraps) does NOT yet have native WebGPU support. WebGPU support is planned for v7, still in development.

**Current solution:** Use Three.js's built-in node-based `PostProcessing` class:
```js
import { PostProcessing } from 'three/webgpu';
import { pass, bloom } from 'three/tsl';

const postProcessing = new PostProcessing(renderer);
const scenePass = pass(scene, camera);
postProcessing.outputNode = bloom(scenePass, { threshold: 0.8 });
```

**R3F v10 solution:** The `usePostProcessing` hook will provide a React-idiomatic API for Three.js native post-processing.

### 5.5 Rapier Physics

`@react-three/rapier` v2 supports R3F v9 and React 19. Rapier runs via WebAssembly (not WebGPU compute). Physics simulation remains CPU-bound through the WASM bridge.

**Future consideration:** For Dendrovia's "Ant on a Manifold" physics, a GPU-based SDF collision system via compute shaders would be more appropriate than Rapier's general-purpose rigid body simulation.

**Sources:**
- https://github.com/pmndrs/react-three-rapier
- https://pmndrs.github.io/react-three-rapier/

### 5.6 Performance Patterns for Large Scenes

**Instanced rendering:** The primary scalability pattern. Compute shaders update instance transforms in storage buffers; instanced draw reads them directly.

**Frame scheduling:** R3F's `useFrame` priority system + v10's advanced scheduler enable splitting work across frames (e.g., update SDF LOD on frame N, update particles on frame N+1).

**Drei performance helpers:**
- `<Instances>` for declarative instancing
- `<Merged>` for geometry merging
- `<LOD>` for distance-based level of detail
- `<BVH>` for accelerated raycasting via three-mesh-bvh

---

## 6. Browser Performance Benchmarks

### 6.1 WebGPU vs WebGL2 Performance

| Scenario | WebGPU | WebGL2 | Improvement | Notes |
|----------|--------|--------|-------------|-------|
| Particles (RTX 3080) | 37M @ 60fps | 2.7M @ 60fps | ~14x | Compute vs texture hacks |
| Particles (Intel UHD 620) | 2.1M | 374K | ~5.6x | Even integrated GPUs benefit |
| Babylon.js Render Bundles | Pre-recorded | Standard draw | ~10x CPU | CPU overhead reduction |
| Draw-call-heavy scenes | Up to 10x | Baseline | ~10x | Multi-draw indirect |
| Large-scale compute | Native compute | N/A | Infinite | WebGL has no compute |
| Small inputs | Slower setup | Faster | WebGL wins | Lower initial overhead |

**Key finding (ACM 2025 paper):** WebGPU outperforms WebGL for large inputs through optimized GPU thread utilization, but WebGL performs better for small inputs due to lower setup overhead. The crossover point is roughly 10K-50K elements depending on the workload.

**Sources:**
- https://toji.dev/webgpu-best-practices/webgl-performance-comparison.html
- https://dl.acm.org/doi/10.1145/3730567.3764504
- https://www.diva-portal.org/smash/get/diva2:1945245/FULLTEXT02
- https://gl2gpu.hanyd.site/

### 6.2 WebGPU Limits and Constraints

**Default minimum limits (all conformant devices):**

| Resource | Minimum Limit |
|----------|--------------|
| Max 1D texture width | 8192 |
| Max 2D texture width/height | 8192 |
| Max 3D texture dimensions | 2048 |
| Max array layers (2D) | 256 |
| Max bind groups | 4 |
| Max textures per shader | 16 |
| Max storage buffers per shader | 8 |
| Max uniform buffer binding size | 64KB |
| Max storage buffer binding size | 128MB (varies) |

**Important:** Browsers may report tiered limits (not exact hardware limits) to reduce fingerprinting surface. ~45% of older devices lack storage buffers in vertex shaders, forcing compatibility mode with reduced features.

**Draw call architecture:** WebGPU does not have an explicit draw call limit like WebGL's practical ~1000-3000 ceiling. Render Bundles pre-record GPU commands and can be replayed with minimal CPU cost. Multi-draw indirect further reduces per-draw overhead.

**Sources:**
- https://webgpufundamentals.org/webgpu/lessons/webgpu-limits-and-features.html
- https://developer.mozilla.org/en-US/docs/Web/API/GPUSupportedLimits
- https://hugodaniel.com/posts/webgpu-shader-limits/

### 6.3 Compute Shader Throughput

- Workgroup size of 64 recommended (most GPUs run 64 threads in lockstep)
- Max compute workgroup size: typically 256 (x * y * z)
- Max compute invocations per workgroup: 256
- Storage buffer reads/writes are the primary bottleneck for compute-heavy workloads
- Subgroup operations (Chrome 133+) enable SIMD-level parallelism within workgroups

### 6.4 Multi-Pass Rendering Costs

WebGPU's explicit resource management makes multi-pass rendering more efficient than WebGL:
- Render targets can be created with explicit usage flags
- No implicit state changes between passes
- Render Bundles can be reused across passes
- Compute passes can run between render passes without CPU roundtrips

---

## 7. Production WebGPU Applications

### 7.1 Major Shipping Products

**Figma:**
Migrated entire rendering pipeline from WebGL to WebGPU. Required significant changes to graphics interface and shader processing. Successfully deployed with compute shader support for future optimizations. The canonical example of a production WebGPU migration.

- https://www.figma.com/blog/figma-rendering-powered-by-webgpu/

**Google Meet:**
Background blurring runs on GPU via WebGPU compute, replacing CPU-based processing.

**Nexara Labs AR Try-Ons:**
Real-time facial AI for AR: 58 FPS on iPhone 15 (vs 12 FPS with WebGL). Serving 3 million users with 40% conversion boost.

### 7.2 Web Games

- **Unity Web:** 15,000+ browser games in H1 2025, Unity powering ~55%. WebGPU enables HDR lighting, volumetric fog, post-processing.
- **PlayCanvas games:** Production WebGPU games shipping through the PlayCanvas editor ecosystem.
- **Unreal Engine 5 (Community):** Lyra sample running in Chrome via Wonder Interactive's WebGPU + WASM pipeline.

### 7.3 Data Visualization

**deck.gl WebGPU Backend (alpha):** Transitioning deck.gl layers to WebGPU for performance boosts on large point clouds and geo data.

**ChartGPU:** Renders charts using GPU compute shaders for parallel processing of large datasets.

**Interactive Wildfire Locator (Nagix):** Real-time satellite data with WebGPU, smooth zooming and data interaction with massive datasets.

**Volume Rendering:** WebGPU-based framework for interactive 3D visualization of ocean scalar data using optimized ray casting.

**Sources:**
- https://www.mayhemcode.com/2025/12/gpu-acceleration-in-browsers-webgpu.html
- https://thebackenddevelopers.substack.com/p/harnessing-webgpu-for-high-performance
- https://www.mdpi.com/2076-3417/15/5/2782

### 7.4 AI/ML Inference in Browser

WebGPU compute shaders are becoming the primary path for in-browser AI inference:

- **ONNX Runtime Web:** 20x speedups vs multithreaded CPU, 550x vs single-threaded on some tasks
- **Transformers.js:** Maps ML operations to WebGPU compute kernels
- **Niivue + Tinygrad:** Real-time brain scan rendering and AI inference in-browser without server GPU

**Dendrovia relevance:** IMAGINARIUM's shader generation could potentially use WebGPU compute for in-browser AI inference, eliminating the need for a server-side AI pipeline.

**Sources:**
- https://opensource.microsoft.com/blog/2024/02/29/onnx-runtime-web-unleashes-generative-ai-in-the-browser-using-webgpu
- https://makitsol.com/webgpu-for-on-device-ai-inference/
- https://aicompetence.org/ai-in-browser-with-webgpu/

---

## 8. Emerging Patterns

### 8.1 GPU-Driven Rendering in Browsers

The GPU-driven rendering paradigm (pioneered in native engines) is now arriving in WebGPU browsers:

**Pattern:** Compute shaders determine what to render (culling, LOD selection), write indirect draw parameters to GPU buffers, and render passes consume those buffers without CPU involvement.

**Current capabilities:**
- Frustum culling via compute (available now)
- Occlusion culling via compute (available now)
- Multi-draw indirect for batched rendering (shipping in Chrome)
- Render Bundles for command recording/replay

**Missing pieces:**
- Bindless textures (still in design, not in spec)
- Mesh shaders (not in WebGPU spec)
- 64-bit atomics (not available)

**Sources:**
- https://whoisryosuke.com/blog/2025/structure-of-a-webgpu-renderer
- https://www.emergentmind.com/topics/webgpu-renderer

### 8.2 Nanite-Style Virtualized Geometry

**Scthe/nanite-webgpu** is a remarkable implementation of UE5's Nanite in WebGPU:

**Features implemented:**
- Meshlet LOD hierarchy (mesh preprocessing via WASM meshoptimizer + METIS)
- Software rasterizer (limited by WGSL capabilities)
- Billboard impostors for extreme distance
- Per-instance AND per-meshlet culling (frustum + occlusion)

**Key limitations:**
- WebGPU lacks 64-bit atomics. The software rasterizer compresses depth+ID into 32 bits (u16 depth, 2x u8 octahedron normals)
- No mesh shaders in WebGPU, so meshlet dispatch uses regular compute
- Performance is viable for moderate scenes but cannot match native Nanite

**Goal:** Consistent "1 pixel = 1 triangle" across the entire screen, not just "fewer triangles for far objects."

**Dendrovia relevance:** The LOD hierarchy and culling patterns are directly applicable. The software rasterizer demonstrates what is achievable within WebGPU's current limits. The meshlet approach could replace or augment the SDF raymarching for dense geometry.

**Sources:**
- https://github.com/Scthe/nanite-webgpu
- https://scthe.github.io/nanite-webgpu/
- https://github.com/bevyengine/bevy/discussions/10433

### 8.3 Gaussian Splatting in WebGPU

3D Gaussian Splatting (3DGS) has emerged as a major WebGPU use case:

**Visionary Platform:**
- WebGPU + ONNX engine for 3D/4D Gaussian Splatting
- 2-16ms per frame on RTX 4090-class hardware
- Up to 135x faster than WebGL viewers via full GPU sorting and compute preprocessing

**WebSplatter:**
- Fully GPU-driven 3DGS in the browser
- 2.26x speedup across devices from desktop to mobile

**Gauzilla Pro:**
- Photorealistic 3D reconstruction with smooth camera orbits
- Real-time Gaussian Splatting for digital twins

**Dendrovia relevance:** Gaussian splatting demonstrates that WebGPU compute is mature enough for complex, real-time rendering pipelines. The GPU sorting techniques used in 3DGS are applicable to transparent particle rendering in Dendrovia.

**Sources:**
- https://www.emergentmind.com/topics/webgpu-powered-gaussian-splatting
- https://arxiv.org/html/2602.03207v1
- https://github.com/Scthe/gaussian-splatting-webgpu
- https://github.com/Visionary-Laboratory/visionary

### 8.4 Mesh Shaders / Task Shaders

**Status:** NOT in the WebGPU specification. No timeline for inclusion.

wgpu/naga (the Rust WebGPU implementation) does not have mesh shader support yet. Native engines use mesh shaders extensively (Nanite, Fortnite), but WebGPU implementations must emulate this functionality via compute shaders that write to storage buffers consumed by vertex shaders.

**Workaround pattern:**
1. Compute shader processes meshlets and writes visible vertex data to storage buffer
2. Compute shader writes indirect draw parameters
3. Vertex shader reads from storage buffer using `instanceIndex`

This is less efficient than native mesh shaders but functionally equivalent for most use cases.

### 8.5 Bindless Textures

**Status:** Under active design. NOT in the WebGPU spec yet. Identified as "the most important feature we need in WebGPU" by the community.

**Current limitation:** Max 16 textures per shader stage on many platforms. This forces texture atlasing, array textures, or multiple draw calls for scenes with many materials.

**Proposed approach:** A large swath of resources made available to the GPU ahead of time, with shaders accessing any/all of them at runtime via indices rather than explicit bindings.

**Dendrovia impact:** For the dendrite visualization with many unique file/module textures, bindless would eliminate the need for texture atlasing. Until then, use array textures or material batching.

**Sources:**
- https://github.com/gpuweb/gpuweb/issues/380
- https://developer.chrome.com/blog/next-for-webgpu

### 8.6 Ray Tracing in WebGPU

**Status:** NOT in the official WebGPU spec. Active development in native backends.

**Current approaches:**
1. **Software ray tracing via compute:** Pure compute shader implementations (WebRTX). No hardware requirement, works on any WebGPU device. Performance-limited but functional.
2. **Hardware ray tracing (native only):** wgpu v28 adds Ray Query support via Vulkan backend. Dawn has experimental DXR and VK_KHR_ray_tracing backends. Not exposed to browsers.
3. **Path tracing demos:** Multiple WebGPU path tracers exist as research projects (Vault CG, gnikoloff).

**Spec proposal:** GitHub issue #535 tracks ray tracing extension discussion. No consensus on timeline. The unstable DXR/Vulkan backends in Dawn are proof-of-concept, not production.

**Dendrovia relevance:** Software raytracing via compute is viable for ambient occlusion or single-bounce GI on the SDF. Hardware RT is years away from browser availability.

**Sources:**
- https://github.com/gpuweb/gpuweb/issues/535
- https://github.com/codedhead/webrtx
- https://www.vaultcg.com/blog/casually-raytracing-in-webgpu-part1/
- https://gfx-rs.github.io/wgpu/issues/1040

### 8.7 Subgroups (Shipped)

Subgroups enable SIMD-level parallelism within a workgroup. After a year of development and origin trials, this feature shipped in Chrome 133+.

**Capabilities:**
- `subgroupAdd`, `subgroupMul`, `subgroupMin`, `subgroupMax`
- `subgroupInclusiveAdd`, `subgroupInclusiveMul`
- `subgroupBallot`, `subgroupBroadcast`
- Uniformity analysis at subgroup level (relaxed from workgroup)

**Performance impact:** Enables efficient parallel reductions, prefix sums, and cross-lane communication. Critical for GPU sorting, prefix scan (marching cubes), and particle system aggregation.

**Sources:**
- https://developer.chrome.com/blog/new-in-webgpu-131
- https://developer.chrome.com/blog/new-in-webgpu-133
- https://groups.google.com/a/chromium.org/g/blink-dev/c/xteMk_tObgI

### 8.8 Compatibility Mode (Shipping Feb 2026)

WebGPU Compatibility Mode ships in Chrome 146 (2026-02-23). Enables WebGPU API on devices with only OpenGL ES support (no Vulkan/Metal/DX12), dramatically expanding the addressable device base.

Request with: `navigator.gpu.requestAdapter({ featureLevel: "compatibility" })`

**Sources:**
- https://webgpufundamentals.org/webgpu/lessons/webgpu-compatibility-mode.html
- https://developer.chrome.com/blog/new-in-webgpu-145

---

## 9. Upcoming WebGPU Spec Additions (Roadmap)

| Feature | Status | Chrome | Impact |
|---------|--------|--------|--------|
| Subgroups | Shipped | 133+ | SIMD parallelism, efficient reductions |
| Multi-draw indirect | Shipping | Recent | GPU-driven batch rendering |
| Compatibility mode | Shipping | 146 (Feb 2026) | OpenGL ES fallback, wider device reach |
| Texel buffers | Planned | TBD | Efficient small data type access (16/8-bit) |
| UMA buffer mapping | Planned | TBD | Reduced copy overhead on unified memory |
| Bindless textures | Design phase | TBD (2026+?) | Unlimited texture access per shader |
| Mesh shaders | Not proposed | N/A | No current plans for WebGPU |
| Hardware ray tracing | Not proposed | N/A | Years away from standardization |

**Expected adoption timeline (developer forecast):**
- 2025-2026: Design tools, data visualization, casual games
- 2026-2027: Professional motion graphics, 2D video tools
- 2027+: AAA browser games, advanced 3D creation tools
- 2028+: Consumer-facing local AI inference

**Sources:**
- https://developer.chrome.com/blog/next-for-webgpu
- https://developer.chrome.com/blog/new-in-webgpu-144
- https://developer.chrome.com/blog/new-in-webgpu-145

---

## 10. Dendrovia Strategic Implications

### What This Means for ARCHITECTUS

**The SDF raymarching approach is validated.** Browser-based SDF editors, raymarching demos, and hybrid renderers are shipping in production. WebGPU performance is sufficient for our target (60fps desktop, 30fps mobile) with appropriate LOD and resolution scaling.

**The hybrid strategy is correct.** Every serious WebGPU project uses a tiered approach: full compute on capable hardware, simplified rendering on weaker devices, WebGL2 mesh-only as last resort.

**Compute shaders are transformative.** The ability to run marching cubes, particle updates, SDF evaluation, and culling on the GPU eliminates the biggest bottlenecks in browser-based 3D.

**TSL is the right shader authoring path.** Cross-backend compatibility, IDE support, and composability make it the clear choice over raw WGSL/GLSL.

**R3F v10 will improve the developer experience.** The `useUniforms`, `useNodes`, and `usePostProcessing` hooks will simplify our shader integration. Worth tracking the alpha.

### Gaps to Monitor

1. **Bindless textures:** Will unlock many-material scenes without atlasing
2. **pmndrs/postprocessing v7:** Will restore `@react-three/postprocessing` for WebGPU
3. **R3F v10 stable:** New TSL hooks and scheduler
4. **Firefox Linux + Android:** Last browser platform gaps
5. **64-bit atomics:** Would unlock better software rasterization and depth testing

### Recommended Architecture Sequence

```
Phase 1 (Now):    Three.js r171+ / R3F v9 / WebGPURenderer / TSL shaders
Phase 2 (Q2 2026): Adopt R3F v10 alpha / TSL hooks / native post-processing
Phase 3 (Q3 2026): GPU-driven culling via compute / indirect draws
Phase 4 (2027):    Evaluate bindless textures, mesh shader emulation
```

---

*This document maps the WebGPU rendering landscape as of February 2026, covering engines, compute capabilities, SDF techniques, the R3F ecosystem, performance characteristics, production applications, and emerging patterns relevant to Dendrovia's rendering architecture.*
