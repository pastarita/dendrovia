# PROCEDURAL ATLAS II — Rendering Heuristics & Decision Frameworks
## High-Fidelity Web Deployment for ARCHITECTUS / Dendrovia

> Compiled: 2026-02-13
> Continuation of PROCEDURAL_ATLAS.md

---

## TABLE OF CONTENTS

1. [NMS-Derivative Engines & Custom Engine Community](#1-nms-derivative-engines)
2. [Web Ports & Asset Delivery Patterns](#2-web-ports--asset-delivery)
3. [Rendering Fidelity Tricks](#3-rendering-fidelity-tricks)
4. [Multi-Objective Decision Framework](#4-multi-objective-decision-framework)
5. [Device Tiering Strategy](#5-device-tiering)
6. [Quick-Reference Decision Tables](#6-quick-reference)

---

## 1. NMS-DERIVATIVE ENGINES

### Landscape of Procedural Engines

| Game | Engine | Terrain | Key Architectural Insight |
|------|--------|---------|--------------------------|
| **No Man's Sky** | Custom (in-house) | Voxels + procedural tex | Deterministic seed hierarchy; 64-bit addressing; ~300MB entire universe |
| **Astroneer** | UE4 (heavily modified) | Voxels + marching cubes | Chunk-based deformation; re-polygonize per chunk on edit |
| **Elite Dangerous** | COBRA (in-house) | Hierarchical (Stellar Forge) | 400B star systems from first-principles sim; octree sector layers; real star catalog seeding |
| **Star Citizen** | StarEngine (CryEngine fork) | Heightmap + procedural biomes | Climate-data-driven biomes; no global textures; multi-level LOD |
| **Teardown** | Custom C++ | Non-aligned voxel volumes | Thousands of small voxel volumes (not one big grid); zero triangles; GPU raytraced via OpenGL |
| **Space Engineers** | VRAGE2/3 (in-house) | Voxels | On-demand generation; unmodified voxels evicted from memory; source partially open |
| **Dual Universe** | Custom (in-house) | Voxels + dual contouring | 25cm resolution; continuous single-shard cluster; servers shut down Aug 2025 |
| **Rodina** | Custom (from scratch) | Procedural heightmap | Solo dev (ex-Bethesda); full-scale seamless solar system |
| **Starfield** | Creation Engine 2 | Heightmap + tile biomes | 1000+ planets; biome tile stamping over procedural heightmaps |

### Terrain Representation Tradeoffs

| Approach | Pros | Cons | Used By |
|----------|------|------|---------|
| **Voxels (Marching Cubes)** | Full 3D deformation; caves/overhangs | Memory-heavy; meshing cost | Astroneer, Space Engineers |
| **Voxels (Dual Contouring)** | Sharp edges preserved | More complex implementation | Dual Universe |
| **Voxels (Non-aligned volumes)** | Natural destruction; per-volume physics | Custom collision required | Teardown |
| **Heightmap + Biome Tiles** | Memory efficient; fast LOD | No caves without supplements | Star Citizen, Starfield |
| **SDF Raymarching** | Infinite detail; smooth blending; no geometry | GPU-expensive; hard to deform | Dreams, ARCHITECTUS |
| **Hierarchical Procedural** | Deterministic; minimal storage; galaxy-scale | Complex seed management | NMS, Elite Dangerous |

### Universal Patterns Across All These Engines

1. **Deterministic seeds** — Store a seed, not geometry. Regenerate on demand.
2. **Hierarchical data** — Parent provides context for child generation.
3. **Aggressive memory eviction** — Only persist player modifications.
4. **LOD cascades** — Multiple detail levels with cross-fade/morph transitions.
5. **Noise layering** — Multiple octaves combined for detail at every scale.

### Indie Custom Engine Community

| Creator | Project | Approach |
|---------|---------|----------|
| **Dennis Gustafsson** | Teardown / next-gen voxel engine | Non-aligned voxel volumes + ray tracing |
| **Sebastian Lague** | Procedural planets, marching cubes | Unity-based educational series |
| **ThinMatrix** | Custom Java/LWJGL engine | OpenGL pipeline from scratch |
| **Frank Gennari** | 3DWorld | C++/OpenGL; procedural terrain, cities, entire universe |
| **Brendan Anthony** | Rodina | Custom C++; seamless planet-scale transitions |

### Open-Source Procedural Engines

| Project | Tech | Notable Feature |
|---------|------|-----------------|
| **Luanti** (fmr. Minetest) | C++/Lua | Open-source voxel engine; v5.15.0 (Jan 2026) |
| **IOLITE** | Custom | Voxel engine with real-time path tracing |
| **Octo** | Rust | Path-traced indirect lighting; large-scale volumes |
| **Atomontage** | Custom | Volumetric engine; mobile-playable since Jun 2024 |
| **3DWorld** | C++/OpenGL | Full procedural universe generator |
| **Voxel Tools for Godot** | GDScript/C++ | Transvoxel meshing, SDF terrain, heightmap |

### Community Hubs

- **r/proceduralgeneration** — Algorithms, showcases
- **r/VoxelGameDev** — Voxel engine architecture
- **PROCJAM** — Annual game jam ("make things that make things")
- **GitHub Topics**: `voxel-engine` (100+ repos), `procedural-generation` (500+ repos)

---

## 2. WEB PORTS & ASSET DELIVERY

### Notable High-Fidelity Web 3D Projects

| Project | Strategy | Key Insight |
|---------|----------|-------------|
| **Figma** | Custom C++/WASM + WebGPU | BindGroup caching, batched renderPasses, explicit pipelines |
| **Babylon.js Snapshot** | WebGPU Render Bundles | Record once, replay = ~10x speedup for static scenes |
| **Google Earth Web** | Quadtree 3D Tile streaming | OGC standard; LOD culling via Screen-Space Error |
| **PlayCanvas (Seemore)** | Texture atlas + HW compression | Aggressive batching, DXT/ASTC/PVRTC |
| **Unity WebGL** | WASM + SIMD + URP | Draw call batching; avoid HDRP on web |
| **Unreal Pixel Streaming** | Server-side rendering | Full fidelity but $$$ at scale + latency |

**Key takeaway**: Every successful web 3D project uses **WASM for compute-heavy logic**, not pure JS.

### Asset Compression Pipeline (Apply ALL of These)

| Asset Type | Tool | Compression | Notes |
|-----------|------|-------------|-------|
| **Mesh geometry** | Draco | 90%+ reduction | Best for static meshes; ~50ms decode |
| **Mesh + animation** | Meshopt (gltfpack) | 70-80% reduction | Lower decode cost than Draco |
| **Textures** | KTX2 + Basis Universal | 75% GPU memory reduction | Stays compressed on GPU; transcodes to device-native format |
| **Full pipeline** | glTF-Transform CLI | Chains all above | `gltf-transform optimize input.glb output.glb` |

### Progressive Loading Strategy

```
Phase 1 (INLINE):     Skybox, core shaders, UI sprites           <50KB
Phase 2 (PRIORITY):   Hero model (LOD0 mesh + 256px textures)    ~100KB
Phase 3 (STREAM):     Full-res textures swap in progressively    ~2MB
Phase 4 (DEFER):      Distant scenery, particles, audio          ~5MB+
```

### CDN & Caching Patterns

| Pattern | Implementation |
|---------|---------------|
| Progressive textures | Load 64px placeholder, swap to full-res |
| Progressive glTF | Needle progressive loader (70-95% perceived speedup) |
| Service Worker | Cache decoded meshes in IndexedDB; Cache API for textures |
| CDN strategy | `.glb` + `.ktx2` on edge CDN with `immutable` cache headers |
| HTTP/2 multiplexing | Split into many small files for parallel fetch |

### Frame Budget Allocation

| Phase | Desktop (16.6ms) | Mobile (33.3ms) |
|-------|-----------------|-----------------|
| JS / Game logic | 2-3ms | 4-5ms |
| Scene graph traversal | 1-2ms | 2-3ms |
| Draw call submission | 3-4ms | 8-10ms |
| GPU render | 6-8ms | 12-15ms |
| Post-processing | 2-3ms | 3-5ms |

### Draw Call Budgets

| Platform | Max Draw Calls | Strategy |
|----------|---------------|----------|
| Desktop WebGPU | 2000-5000 | Render Bundles |
| Desktop WebGL2 | 500-1000 | Batch + Instance |
| Mobile WebGL2 | 100-200 | Merge meshes, atlas textures |
| Mobile WebGPU | 500-1000 | Render Bundles |

### Memory Budgets

| Resource | Desktop | Mobile |
|----------|---------|--------|
| Total asset payload | 50-100MB | <70MB (crashes above) |
| GPU texture memory | 512MB-1GB | 128-256MB |
| Vertex count | 5-10M | <1M (crashes above) |
| Shader variants | <50 | <20 (compilation stalls) |

---

## 3. RENDERING FIDELITY TRICKS

### Procedural vs Baked Textures

| Factor | Procedural (Shader) | Baked (Image) |
|--------|---------------------|---------------|
| Bandwidth | Zero | High |
| GPU cost/frame | High (recomputed) | Low (single fetch) |
| Memory | Near zero | Full texture size |
| Resolution | Infinite | Fixed |
| Best for | Tron aesthetic, noise, patterns | Photorealistic detail |

**Hybrid trick**: Generate procedural textures once to a `RenderTarget`, then sample as baked. Bandwidth savings of procedural with per-frame cost of baked.

**For Dendrovia**: Procedural wins for 80%+ of surfaces. The Tron/MV look is fundamentally procedural.

### GPU-Compressed Texture Formats

| Format | Support | Web Status |
|--------|---------|------------|
| **KTX2 + Basis Universal** | Transcodes to all | Best universal choice |
| **ASTC** | Mobile (iOS/Android) | Via KTX2 transcode |
| **ETC2** | Mobile + some desktop | Via KTX2 transcode |
| **BC7** | Desktop (all GPUs) | Via KTX2 transcode |

**Rule**: Always ship KTX2 with Basis Universal. Three.js `KTX2Loader` handles transcoding. Saves 30-70% vs PNG while staying GPU-resident.

### Skybox Strategy

| Technique | Cost | Use When |
|-----------|------|----------|
| Static cubemap | Cheapest | Static scenes, controlled lighting |
| Equirectangular HDRI | Low | PBR lighting + reflections simultaneously |
| Procedural atmosphere | Medium-High | Time-of-day, no download needed |
| AI-generated panorama | Download cost | Unique worlds, rapid prototyping |

**For Dendrovia**: Procedural gradient skybox (cheap, fits Tron aesthetic) + low-res PMREM for metallic reflections on dendrite surfaces.

### Depth and Distance Tricks

| Technique | When to Use |
|-----------|-------------|
| **Logarithmic depth buffer** | WebGL; large-scale scenes (>1000 units) |
| **Reverse-Z** | WebGPU only; best precision distribution |
| **Atmospheric perspective** | Color shift (hue toward cool, reduce contrast) NOT opacity fade |
| **Height fog** | `fog = exp(-height * density) * exp(-distance * density)` |
| **DoF as LOD mask** | Blur hides low-poly geometry at transitions |
| **Billboard impostors** | Distant repeated objects (>50m indistinguishable from geo) |

**Key for Dendrovia**: Override Three.js fog chunks to implement atmospheric perspective -- shift color toward cool tones with distance rather than fading to solid color. Preserves sense of infinite depth without hiding distant dendrites.

### Scene Layering Architecture

| Tier | Distance | Rendering | Resolution | Update Rate |
|------|----------|-----------|------------|-------------|
| Foreground | 0-20 units | Full geometry + shading | Native | Every frame |
| Midground | 20-200 units | Simplified geo / LOD1-2 | Native | Every frame |
| Background | 200+ units | Render-to-texture | Quarter | On camera move |

**Background RTT trick**: Render far scene at quarter res, update only when camera moves >5 degrees or >10 units. Cuts distant rendering cost by 90%.

### Caching Strategies

| Strategy | What to Cache | Storage |
|----------|---------------|---------|
| **IndexedDB** | Generated geometry (ArrayBuffer), baked textures, SDF volumes | Hundreds of MB; cross-session |
| **Service Worker** | Static assets (models, textures, shaders) | Disk-backed; offline-capable |
| **GPU pipeline cache** | Compiled shader pipelines (WebGPU native) | Auto; 65% faster init on revisit |
| **Instancing** | Repeated geometry | GPU memory; per-frame |
| **Shader warm-up** | Pre-compile all variants at load | GPU; per-session |

**IndexedDB pattern**: After generating SDF volumes or procedural textures, serialize to `ArrayBuffer`, store via Dexie.js. Use content hash as key for automatic invalidation.

### Post-Processing Budget

| Effect | Cost | Impact | Tron Priority |
|--------|------|--------|---------------|
| **Bloom** (half-res) | Medium | High | MUST HAVE |
| **FXAA** | Low | Medium | MUST HAVE (replace MSAA) |
| **Color grading / LUT** | Very Low | High | MUST HAVE |
| **Vignette** | Very Low | Low | Cheap win |
| **Chromatic aberration** | Low | Low | Optional |
| **SSR** | High | Medium | Skip (use env map) |
| **SSAO** | High | Medium | Skip on mobile; SDF gets AO free |
| **DoF** | High | Low | Only for LOD masking |

**Critical rules**:
- Disable renderer MSAA when using post-processing; add FXAA as final pass
- Bloom at half resolution (visually identical, 2x cheaper)
- Use `THREE.Layers` for selective bloom (only emissive objects)
- Use pmndrs/postprocessing over built-in EffectComposer (auto-merges passes)
- SDF raymarching gets AO free by tracking step count -- never waste a SSAO pass

---

## 4. MULTI-OBJECTIVE DECISION FRAMEWORK

### Competing Objectives

| Objective | Desktop Target | Mobile Target | Direction |
|-----------|---------------|---------------|-----------|
| Visual Fidelity | 8+/10 | 5+/10 | Maximize |
| Frame Rate | ≤16.6ms (60fps) | ≤33.3ms (30fps) | Minimize |
| Load Time (TTFMR) | <2s | <3s | Minimize |
| Memory | <512MB | <200MB | Minimize |
| Bandwidth | <5MB initial | <2MB initial | Minimize |
| Battery | N/A | <2W sustained | Minimize |
| Compatibility | >95% | >85% | Maximize |

**Key insight**: Visual Fidelity is the universal antagonist -- it conflicts with nearly everything. Compatibility and Fidelity are the hardest pair to reconcile.

### Decision Matrices

#### A. Texture Strategy

| Criterion | Procedural | Baked | CDN-Loaded |
|-----------|-----------|-------|------------|
| Fidelity | 9 (infinite res) | 7 (fixed) | 8 (high-res) |
| Frame cost | HIGH | LOW | LOW |
| Load time | ZERO | MEDIUM | HIGH |
| Memory | ZERO | MEDIUM | HIGH |
| Bandwidth | ZERO | MEDIUM | HIGH |

**Rule**: Procedural for 80%+ of Tron surfaces. CDN for unique high-detail assets only.

#### B. SDF vs Mesh vs Hybrid

| Screen Coverage | Use | Rationale |
|----------------|-----|-----------|
| >50% (very close) | **Mesh** | Too many pixels to raymarch |
| 10-50% (mid-range) | **Hybrid** | SDF trunk + mesh detail |
| <10% (far) | **SDF** | Few pixels; infinite detail cheaply |
| >200 SDF primitives | **Mesh fallback** | Complexity makes steps explode |

**Switching formula**: `if (pixelsCovered * avgSteps * sdfPrimitiveCount > frameBudgetALU) → switchToMesh()`

#### C. Skybox Strategy

**For Tron/MV aesthetic**: Procedural wins outright. An HDRI clashes with every other visual element. A 15-line fragment shader producing a dark gradient with scan lines beats any photograph.

#### D. Post-Processing vs Baked-Into-Material

| Effect | Post-Process? | Bake? |
|--------|--------------|-------|
| Bloom/glow | Yes (screen-space bleed) | No |
| Edge glow (Tron lines) | No | Yes (emissive term) |
| Color grading | Yes (global consistency) | No |
| AO | No | Yes (free in SDF march) |

#### E. Loading Strategy

| Category | Strategy |
|----------|----------|
| Shaders, shared uniforms (<200KB) | **Eager** |
| SDF parameters | **Progressive** (simplified first, detail later) |
| Distant branches, particles, post-fx | **Lazy** (load on approach) |

#### F. Client vs Server Generation

| Work | Where | Why |
|------|-------|-----|
| SDF evaluation, procedural textures, particles, lighting | **Client** | Real-time; network latency incompatible with 16ms |
| Topology computation (git parse), SDF param optimization, LOD mesh pre-bake | **Server** | Heavy compute; done once |
| Anything in render loop | **Never server** | Latency kills frame budget |

### Pareto Analysis: Tron/Monument Valley Aesthetic

#### Minimum Viable Technique Set

| Technique | Purpose | Cost | Required? |
|-----------|---------|------|-----------|
| Emissive edge lines | Core Tron identity | ~0.5ms | YES |
| Dark background + bloom | Glow effect | ~1.5ms | YES |
| Flat/cel shading | Monument Valley feel | ~0.2ms | YES |
| SDF smooth blending | Organic digital feel | ~4-8ms | Partially |
| Color grading (cool palette) | Unified mood | ~0.3ms | YES |

**Minimum cost: ~6.5ms.** Leaves 10ms for geometry and logic on desktop.

#### Bang-for-Buck Rankings

| Rank | Technique | Visual Impact | Frame Cost | Ratio |
|------|-----------|---------------|------------|-------|
| 1 | Color grading LUT | 7 | 0.3ms | **23.3** |
| 2 | Procedural grid pattern | 7 | 0.3ms | **23.3** |
| 3 | Emissive edge detection | 9 | 0.5ms | **18.0** |
| 4 | Bloom (half-res) | 8 | 1.0ms | **8.0** |
| 5 | Instanced particles | 6 | 1.5ms | **4.0** |
| 6 | SDF smooth union | 8 | 3.0ms | **2.7** |
| 7 | Screen-space reflections | 5 | 3.0ms | **1.7** |
| 8 | Volumetric fog | 6 | 4.0ms | **1.5** |

#### Trap Techniques (Avoid)

| Trap | Why It's Wrong for This Aesthetic |
|------|----------------------------------|
| Volumetric lighting | 4-6ms for effect that fights flat aesthetic |
| Screen-space reflections | Monument Valley is matte; adds visual noise |
| High-step-count SDF (>48) | Beyond 48, quality improvement is subpixel |
| Full PBR pipeline | Antithetical to stylized look; wastes ALU |
| Ray-traced shadows | Tron uses hard edges; soft shadows are wrong |

### One-Page Decision Heuristic

```
FOR EACH rendering decision:
  1. What tier is the current device?
  2. What is the remaining frame budget?
  3. Does this technique serve the Tron/MV aesthetic?
     - If NO → skip regardless of how impressive
     - If YES → check bang-for-buck ratio
  4. Ratio > 4.0? → Include
     Ratio 2.0-4.0? → Tier 1-2 only
     Ratio < 2.0? → Exclude (it's a trap)
  5. Does adding it push any tier past frame budget?
     - If YES → Tier 1 only, or cut it
```

**Core principle**: In a stylized aesthetic, **restraint IS the visual strategy.** Every technique you omit makes the ones you keep more coherent.

---

## 5. DEVICE TIERING

### Detection

```typescript
function detectTier(): 1 | 2 | 3 | 4 {
  const gpu = renderer.capabilities;
  const mobile = /Mobile|Android|iPhone/.test(navigator.userAgent);
  const mem = (navigator as any).deviceMemory || 4;
  if (!mobile && gpu.maxTextureSize >= 8192 && mem >= 8) return 1;
  if (!mobile) return 2;
  if (mem >= 6 && gpu.maxTextureSize >= 4096) return 3;
  return 4;
}
```

### Feature Matrix

| Feature | Tier 1 (Discrete) | Tier 2 (Integrated) | Tier 3 (Mobile Hi) | Tier 4 (Mobile Lo) |
|---------|-------------------|--------------------|--------------------|---------------------|
| Render mode | Full SDF | Hybrid SDF+Mesh | Mesh + simple SDF | Mesh only |
| SDF max steps | 64 | 32 | 16 | 0 |
| SDF primitives | Unlimited | <100 | <20 | None |
| Post-processing | Bloom + Color + Vignette | Bloom (half) + Color | Bloom (quarter) | None (baked emissive) |
| Texture resolution | 2048px | 1024px | 512px | 256px |
| Particle count | 5000 | 2000 | 500 | 100 |
| Shadow type | SDF soft shadow | Shadow map 1024 | Shadow map 512 | None |
| Render resolution | Native | Native | 0.75x | 0.5x |
| Target FPS | 60 | 60 | 30 | 30 |
| Max draw calls | 200 | 100 | 50 | 25 |
| Skybox | Procedural animated | Procedural static | 2-color gradient | Solid color |

### Adaptive Degradation

When a tier misses frame target for 30+ consecutive frames:

```
Tier 1 → Reduce SDF steps (64 → 48 → 32) → fall to Tier 2
Tier 2 → Expand mesh radius → disable vignette → fall to Tier 3
Tier 3 → Disable bloom → reduce particles 50% → fall to Tier 4
Tier 4 → Reduce render resolution → reduce geometry → static scene
```

### Per-Tier Budget Breakdown

| Phase | Tier 1 (16.6ms) | Tier 2 (16.6ms) | Tier 3 (33.3ms) | Tier 4 (33.3ms) |
|-------|-----------------|-----------------|-----------------|-----------------|
| JS / React | 2ms | 2ms | 3ms | 3ms |
| Geometry | 1ms | 2ms | 4ms | 5ms |
| SDF Pass | 5ms | 3ms | 2ms | 0ms |
| Mesh Pass | 2ms | 4ms | 10ms | 12ms |
| Shading | 1.5ms | 1.5ms | 3ms | 4ms |
| Post-FX | 2ms | 1.5ms | 1ms | 0ms |
| Headroom | 3.1ms | 2.6ms | 10.3ms | 9.3ms |

---

## 6. QUICK-REFERENCE DECISION TABLES

### What to Use When

| Situation | Use This |
|-----------|----------|
| Stylized materials, Tron glow | Procedural textures + emissive |
| Photorealistic surfaces | KTX2/Basis baked textures |
| Distant repeated objects | Billboard impostors |
| Infinite view distance | Atmospheric perspective + log depth |
| Large scale (>1000 units) | Logarithmic depth (WebGL) or Reverse-Z (WebGPU) |
| PBR reflections cheaply | PMREM pre-filtered env map |
| Dynamic sky | Procedural Rayleigh scatter shader |
| Anti-aliasing with post-fx | FXAA as final pass, disable renderer AA |
| Glow effect | Selective bloom at half-res |
| Cross-session persistence | IndexedDB for generated assets |
| First-load performance | Service Worker + Cache API |
| WebGPU shader startup | Pre-create pipelines during loading screen |

### WebGPU-Specific Wins

| Feature | Benefit |
|---------|---------|
| Render Bundles | Pre-record draw commands; replay with zero CPU overhead |
| Compute Shaders | GPU-driven culling, particle sim, skeletal animation |
| Explicit Pipelines | No hidden state changes; predictable performance |
| Bind Group Caching | Figma's pattern: reuse GPU resource bindings across frames |
| Multi-Draw Indirect | Single API call dispatches thousands of different meshes |

---

## SOURCES

### NMS-Derivative Engines
- [GDC: Continuous World Generation in NMS](https://www.gdcvault.com/play/1024265/)
- [Generating the Universe in Elite Dangerous](https://80.lv/articles/generating-the-universe-in-elite-dangerous)
- [Astroneer + UE4](https://www.unrealengine.com/en-US/spotlights/how-system-era-softworks-leveraged-ue4-to-create-astroneer-s-wonderful-universe)
- [Teardown Voxel Rendering](https://pod.wave.co/podcast/software-engineering-daily/teardown-and-voxel-based-rendering-with-dennis-gustafsson-0b4d6e9b)
- [Voxagon Blog (Dennis Gustafsson)](https://blog.voxagon.se/)
- [Star Citizen Planet Tech v4](https://starcitizen.tools/Planet_Tech_v4)
- [VRAGE Engine](https://www.keenswh.com/vrage/)
- [Luanti](https://www.luanti.org/), [3DWorld](https://github.com/fegennari/3DWorld), [Voxel Tools for Godot](https://voxel-tools.readthedocs.io/)

### Web Rendering
- [Figma WebGPU Blog](https://www.figma.com/blog/figma-rendering-powered-by-webgpu/)
- [Babylon.js Snapshot Rendering](https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUSnapshotRendering)
- [Google 3D Tiles](https://developers.google.com/maps/documentation/tile/3d-tiles-overview)
- [PlayCanvas Optimization](https://developer.playcanvas.com/user-manual/optimization/guidelines/)
- [glTF-Transform](https://gltf-transform.dev/), [KTX2 (Khronos)](https://www.khronos.org/ktx/)
- [Don McCurdy Texture Formats](https://www.donmccurdy.com/2024/02/11/web-texture-formats/)
- [Needle Progressive Loading](https://cloud.needle.tools/articles/needle-cloud-modelviewer)

### Rendering Tricks
- [Three.js Fog Hacks](https://snayss.medium.com/three-js-fog-hacks-fc0b42f63386)
- [FastHDR Environment Maps](https://cloud.needle.tools/articles/fasthdr-environment-maps)
- [Codrops Three.js Performance](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)
- [100 Three.js Tips](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [Draw Calls: The Silent Killer](https://threejsroadmap.com/blog/draw-calls-the-silent-killer)
- [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing)

### Decision Frameworks
- [Pixel Streaming vs WebGL vs WebGPU](https://vagon.io/blog/pixel-streaming-vs-webgl-vs-webgpu-the-best-solution-for-unreal-engine-web-deployment)
- [WebGPU Performance Benchmarks](https://www.mayhemcode.com/2025/12/gpu-acceleration-in-browsers-webgpu.html)
- [Toji WebGPU Best Practices](https://toji.dev/webgpu-best-practices/webgl-performance-comparison.html)

---

*This document pairs with PROCEDURAL_ATLAS.md. Together they form the complete research foundation for ARCHITECTUS rendering decisions.*
