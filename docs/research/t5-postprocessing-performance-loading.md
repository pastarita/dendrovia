# Tranche 5: Post-Processing Aesthetic, Performance Profiling, and Progressive Loading

**Date:** February 13, 2026
**Pillar:** ARCHITECTUS (The Renderer)
**Purpose:** Ground truth for Steps 21-25 of the 25-step implementation plan

---

## 1. Post-Processing Stack for the Tron Aesthetic

### 1.1 pmndrs/postprocessing Architecture

The `@react-three/postprocessing` library wraps pmndrs/postprocessing. Its key advantage: **effects are automatically merged into fewer GPU passes**, unlike traditional per-effect chaining.

**EffectComposer props:**

| Prop | Default | Purpose |
|------|---------|---------|
| `enabled` | true | Toggle all effects |
| `depthBuffer` | true | Needed for DOF, SSAO |
| `enableNormalPass` | false | Needed for some effects |
| `multisampling` | 8 | MSAA samples (0 to disable) |
| `resolutionScale` | 1.0 | Lower = cheaper post-processing |

### 1.2 Selective Bloom (Cornerstone of Tron Look)

**Material-based approach (recommended):** Set `luminanceThreshold={1.0}` so nothing blooms by default. Then push emissive values above 1.0 (HDR) on objects that should glow:

```tsx
// WILL glow (emissive > 1.0)
<meshStandardMaterial emissive="#00ffff" emissiveIntensity={2.5} />

// Will NOT glow (stays in 0-1 range)
<meshStandardMaterial color="#333333" />
```

**Recommended Dendrovia bloom config:**
```tsx
<Bloom
  intensity={1.5}
  luminanceThreshold={1.0}
  luminanceSmoothing={0.1}
  mipmapBlur={true}
/>
```

No extra render passes. Works with instanced meshes. Per-material control.

### 1.3 Tron Legacy's Actual Technique

Tron Legacy's look was NOT primarily a post-process outline. It was:
1. **Fresnel/rim lighting** on all circuit-line geometry (per-material)
2. **Emissive materials** with values above 1.0 (HDR)
3. **Bloom post-process** catching all bright emissive and rim-lit edges

**Fresnel math:**
```glsl
float fresnel = pow(1.0 - dot(viewDirection, normal), rimPower);
vec3 finalColor = baseColor + rimColor * fresnel * rimIntensity;
```

Key parameters: `rimPower` (2.0 = soft glow, 5.0 = tight edge), `rimIntensity` (>1.0 for bloom to catch it).

### 1.4 Recommended Dendrovia Post-Processing Stack

**Object-level (zero post-processing cost):**
- Fresnel rim glow on dendrite geometry (`rimPower: 3.0`, `rimIntensity: 1.5+`)
- Emissive materials on circuit-line edges, intensity > 1.0
- Neon palette: cyan `#00ffff`, magenta `#ff00ff`, amber `#ffaa00`

**Post-processing stack (ordered):**

| Order | Effect | Config | Cost (M1) |
|-------|--------|--------|-----------|
| 1 | **Bloom** | `mipmapBlur: true`, `luminanceThreshold: 1.0`, `intensity: 1.5` | 1.0-2.0ms |
| 2 | **LUT Color Grading** | Dynamic warm/cool interpolation based on code activity | ~0.2ms |
| 3 | **Chromatic Aberration** | `offset: [0.0005, 0.0005]`, `radialModulation: true` | ~0.1ms |
| 4 | **Vignette** | `offset: 0.3`, `darkness: 0.5` (increase in Player Mode) | ~0.05ms |
| 5 | **Custom Scanlines** | `intensity: 0.06`, `count: 800` (optional) | ~0.1ms |
| 6 | **DOF** | Player Mode only, focused on current node | 2.0-5.0ms |

**Total budget: 3.5-9.5ms** (DOF is first to cut).

### 1.5 Tonemapping

| Tonemapper | Dendrovia Fit |
|-----------|---------------|
| **ACESFilmic** | Best default — cinematic neon glow, slight warm shift |
| **AgX** | Better cyan/green preservation — use if bright neons wash out |
| **Neutral** | Too flat for Tron aesthetic |
| **Reinhard** | Too muted |

**Recommendation:** ACESFilmic with exposure 1.0-1.3.

### 1.6 WebGPU Post-Processing Compatibility

pmndrs/postprocessing **does not natively work** with WebGPURenderer (GLSL shaders won't run on WebGPU backend).

**TSL-based post-processing (WebGPU native):**
```typescript
import * as THREE from 'three/webgpu'
import { pass, bloom, fxaa } from 'three/tsl'

const postProcessing = new THREE.PostProcessing(renderer)
const scenePass = pass(scene, camera)
postProcessing.outputNode = scenePass
  .pipe(bloom({ threshold: 0.8, intensity: 1.5 }))
  .pipe(fxaa())
```

**Migration path:**
1. **Phase 1 (Now):** pmndrs/postprocessing with WebGL2 — proven, full effect library
2. **Phase 2 (Transition):** Rewrite pipeline using TSL node system when it matures
3. **Phase 3 (Future):** Full TSL pipeline with compute-shader-based effects

---

## 2. Performance Profiling Toolkit

### 2.1 Recommended Profiling Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Dev overlay | `r3f-perf` (`<Perf>`) | Live FPS/CPU/GPU/draw calls/triangles |
| GPU timing | stats-gl or WebGPU timestamp queries | Actual GPU execution time |
| Frame debugging | WebGPU Inspector extension | Inspect GPU objects, capture frames |
| Deep GPU | Xcode Metal Debugger (macOS), PIX (Windows) | Per-pass timing, shader occupancy |
| Memory | `renderer.info.memory` + Chrome Task Manager | Detect geometry/texture leaks |
| Production | `PerfHeadless` + `getReport()` | Silent metric collection |
| CI regression | Puppeteer + statistical analysis | P50/P95/P99 frame time comparison |

### 2.2 r3f-perf Configuration

```tsx
<Perf
  logsPerSecond={10}
  overClock={false}
  deepAnalyze={false}     // Toggle for shader analysis
  showGraph={true}
  minimal={false}
  position="top-right"
/>
```

Metrics exposed: FPS, CPU time, GPU time, draw calls, triangles, shader programs (with `deepAnalyze`), texture count, geometry count, custom data.

**Headless mode for production:**
```tsx
import { PerfHeadless, getPerf } from 'r3f-perf'
<PerfHeadless />
const report = getPerf().getReport() // { fps, cpu, gpu, mem, ... }
```

Size: 6.23 KB, auto tree-shaken in production.

### 2.3 Three.js `renderer.info`

```typescript
renderer.info.render.calls      // Draw calls this frame
renderer.info.render.triangles  // Triangles rendered
renderer.info.memory.geometries // Geometry objects in GPU memory
renderer.info.memory.textures   // Texture objects in GPU memory
```

**Critical rule:** Draw calls > 100 = CPU bottleneck. Draw call count matters more than triangle count.

### 2.4 GPU Timestamp Queries (WebGPU)

**Required feature:** `'timestamp-query'`
**Chrome flags:** `#enable-unsafe-webgpu`, `#enable-webgpu-developer-features` (removes 100μs quantization)

```typescript
const querySet = device.createQuerySet({ type: 'timestamp', count: 2 })
// Attach to render pass via timestampWrites
// Resolve with encoder.resolveQuerySet()
// Read back via mappable buffer → BigInt64Array → nanoseconds
```

### 2.5 CPU-Bound vs GPU-Bound Diagnosis

| Indicator | CPU-Bound | GPU-Bound |
|-----------|-----------|-----------|
| High JS time, low GPU time | Yes | No |
| High draw call count (>200) | Yes | No |
| Reducing resolution helps | No | Yes |
| Simplifying shaders helps | No | Yes |
| Adding triangles changes FPS | No | Maybe |

### 2.6 Frame Budget at 60fps (16.67ms)

| Phase | Budget | Dendrovia Notes |
|-------|--------|-----------------|
| JavaScript logic | ~2ms | State updates, animation |
| Scene graph traversal | ~1ms | Frustum culling, matrix updates |
| Draw call submission | ~2-4ms | CPU → GPU command recording |
| GPU vertex processing | ~2ms | Vertex shaders |
| GPU fragment processing | ~4-8ms | **SDF raymarching dominates here** |
| Post-processing | ~2-3ms | Bloom, color grading |
| Present | ~0.5ms | Swap chain |

### 2.7 Statistical Frame Time Analysis

Use percentile metrics for benchmarking:
- **P50 (median):** Typical experience. If >16.67ms, most frames dropping.
- **P95:** Catches hitches. If >33ms, 5% of frames noticeably janky.
- **P99:** Worst-case (GC pauses, shader compilation stalls).

```typescript
function analyzeFrameTimes(times: number[]) {
  const sorted = [...times].sort((a, b) => a - b)
  const percentile = (p: number) => sorted[Math.floor(sorted.length * p / 100)]
  return {
    p50: percentile(50),
    p95: percentile(95),
    p99: percentile(99),
    jankFrames: times.filter(t => t > 33.33).length,
    droppedFrames: times.filter(t => t > 16.67).length,
  }
}
```

---

## 3. SDF Raymarching Performance Optimization

### 3.1 Fragment Shader Cost Measurement

The fragment shader is Dendrovia's primary cost center.

**Quick diagnostic tests:**
1. Render at 50% resolution — if FPS doubles, you are fragment-bound
2. Reduce `MAX_STEPS` from 64 to 32 — measure FPS delta to estimate per-step cost
3. Use WebGPU timestamp queries on the SDF render pass

### 3.2 Adaptive Step Count

```wgsl
fn getAdaptiveMaxSteps(uv: vec2f, baseSteps: u32) -> u32 {
    let centerDist = length(uv - vec2f(0.5));
    let factor = 1.0 - centerDist * 0.5; // 50% fewer at edges
    return u32(f32(baseSteps) * factor);
}
```

### 3.3 Bounding Volume Pre-Pass

From Inigo Quilez's SDF bounding technique:

```glsl
float sdfDendrite(vec3 p) {
  float boundDist = length(p - branchCenter) - branchBoundRadius;
  if (boundDist > marchStep) return boundDist; // Skip expensive eval
  return sdBranch(p, height, radius);           // Full SDF only when close
}
```

**Reported speedup:** Up to 8x for complex scenes. Capsule bounds ideal for cylindrical branch geometry.

### 3.4 Half-Resolution Raymarching with Bilateral Upscale

**Highest-impact optimization for Dendrovia:**

1. Render SDF at half resolution (1/4 pixel count)
2. Output color + depth from raymarch pass
3. Joint bilateral upscale using depth to preserve edges
4. Composite with full-resolution mesh content

4x fragment shader reduction with minimal visual cost.

### 3.5 Temporal Reprojection

For slowly-moving cameras (Falcon Mode):
1. Cache previous frame's raymarched result
2. Reproject using camera motion vectors
3. Re-raymarch only: disoccluded pixels, changed SDFs, checkerboard refresh pattern

Can reduce effective cost by 50-75%.

---

## 4. Adaptive Quality System

### 4.1 Quality Tier Design

| Setting | Ultra | High | Medium | Low | Potato |
|---------|-------|------|--------|-----|--------|
| Render Scale | Native DPR | DPR ≤ 2 | 75% | 50% | 50% + no AA |
| Post-Processing | Full stack | Bloom + Grade | Bloom only | None | None |
| Raymarch Steps | 128 | 96 | 64 | 32 | 0 (mesh only) |
| LOD Bias | 0 | 0 | +1 | +2 | +3 |
| Particles | 100% | 75% | 50% | 25% | 10% |
| Materials | PBR Standard | PBR Standard | Phong | Phong | Basic (unlit) |
| SDF Mode | Full | Full | Hybrid | Mesh only | Mesh simplified |

### 4.2 Two-Phase Detection

**Phase 1 — Static (before first frame):**
1. `detect-gpu` library (pmndrs) → tier 0-3 from gfxbench.com data
2. `navigator.deviceMemory` → RAM budget
3. `navigator.hardwareConcurrency` → worker count
4. `navigator.maxTouchPoints > 0` → mobile detection
5. WebGPU `adapter.limits` and `adapter.info` → GPU capabilities
6. Map to initial quality tier

**Phase 2 — Dynamic (first 2-5 seconds):**
1. Run at estimated tier
2. Monitor via `PerformanceMonitor`
3. Above 55fps → try bumping up
4. Below 45fps → drop down
5. Settle within 5 seconds

### 4.3 PerformanceMonitor + AdaptiveDpr

```tsx
<Canvas dpr={dpr}>
  <PerformanceMonitor
    onIncline={() => { setDpr(2); setDegraded(false) }}
    onDecline={() => { setDpr(1); setDegraded(true) }}
    onFallback={() => setDegraded(true)}
    flipflops={3}
    bounds={(refreshrate) => [refreshrate * 0.5, refreshrate * 0.9]}
  >
    <AdaptiveDpr pixelated />
    <AdaptiveEvents />
    <EffectComposer enabled={!degraded}>
      <Bloom ... />
      {!degraded && <DepthOfField ... />}
      <Vignette ... />
    </EffectComposer>
  </PerformanceMonitor>
</Canvas>
```

### 4.4 Hysteresis Design

**Critical:** Without hysteresis, quality oscillates.

- **Drop quality fast:** 2s sustained below threshold
- **Raise quality slow:** 5s sustained above threshold
- **Asymmetric thresholds:** Decline at 75% of target, incline at 92%
- **Flipflop limit:** After 3 oscillations, lock to lower tier (`onFallback`)
- **Use P95 frame time** as decline trigger, not average

### 4.5 Mobile Strategy

1. Default to "Low" tier — mesh-only, no SDF
2. Cap DPR at 2 (even if device reports 3)
3. Disable all post-processing except uniform-based color grade
4. Use `MeshPhongMaterial` or `MeshBasicMaterial`
5. Reduce particles to 25%
6. Disable raycasting during motion (`AdaptiveEvents`)
7. Platform-specific textures: ETC2 (iOS), ASTC (Android), BC (desktop)

### 4.6 User Preference APIs

```typescript
// Reduced motion (respect in 3D)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Device capabilities
const deviceMemoryGB = navigator.deviceMemory    // 0.25-8, powers of 2
const cpuCores = navigator.hardwareConcurrency   // worker count guide
const saveData = navigator.connection?.saveData   // user wants reduced data

// Battery (Chrome 103+ HTTPS only)
const battery = await navigator.getBattery()
// battery.level (0-1), battery.charging (bool)
```

---

## 5. Progressive Loading Architecture

### 5.1 Loading Phases for Dendrovia

| Phase | Time | What Loads | Rendering |
|-------|------|-----------|-----------|
| 0 | 0-100ms | Pre-baked skeleton mesh in bundle | Camera + ambient + low-poly skeleton |
| 1 | 100ms-1s | Stream topology (directory tree) | Simplified branch tubes |
| 2 | 1s-5s | Camera-near full-detail geometry | Full mesh + post-processing |
| 3 | 5s+ | Background generation of remaining nodes | Ambient animations, particles |

### 5.2 React Suspense + R3F

```tsx
<Canvas>
  <Suspense fallback={<SkeletonTree />}>
    <DendroviaScene topology={topology} />
  </Suspense>
</Canvas>
```

Nested Suspense boundaries for progressive subtree reveal. drei's `<Loader>` for HTML overlay during initial load.

### 5.3 LOD System

drei's `<Detailed>` wraps `THREE.LOD`:

```tsx
<Detailed distances={[0, 50, 100]}>
  <HighDetailBranch />   {/* 0-50 units */}
  <MediumDetailBranch /> {/* 50-100 units */}
  <LowDetailBranch />    {/* 100+ units */}
</Detailed>
```

**Cross-fade LOD:** To avoid pop-in, use material opacity fade during transition (blend both LOD levels for ~0.3s).

### 5.4 Web Worker Geometry Generation

| Task | Worker Suitable? |
|------|-----------------|
| Geometry generation (vertex math) | Yes — perfect fit |
| Data parsing (topology, AST) | Yes |
| Spatial index (octree updates) | Yes |
| Pathfinding on dendritic surface | Yes |
| WebGPU context creation | No |
| Scene graph management | No |
| Material/texture creation | No (usually) |

**Transfer vs clone:** Always transfer `ArrayBuffer` >10KB (zero-copy). Use `Comlink` for ergonomic worker communication.

**Worker pool sizing:** `navigator.hardwareConcurrency - 2` (reserve 2 for main + browser).

**Recommended Dendrovia architecture:**
- Main thread: Scene graph, rendering, input, camera
- Workers 1-3: Geometry generation (vertex buffer computation)
- Worker 4: Topology parsing
- Worker 5: Spatial index maintenance (octree)

### 5.5 Time-Sliced Construction

```typescript
class IncrementalSceneBuilder {
  private queue: NodeData[] = []
  private budgetMs = 8 // Half a frame at 60fps

  processFrame() {
    const start = performance.now()
    while (this.queue.length > 0 && (performance.now() - start) < this.budgetMs) {
      const node = this.queue.shift()!
      this.createMeshForNode(node)
    }
  }
}
```

### 5.6 Frustum Culling and Spatial Partitioning

**Built-in:** Three.js frustum culls automatically (`frustumCulled = true`).

**Custom for Dendrovia:**
- Frustum cull (automatic)
- Distance cull (set `visible = false` beyond max distance)
- Importance cull (low-churn, low-complexity files culled earlier)
- Subtree cull (directory culled → skip all file children)

**Spatial structures:**

| Structure | Best For | Dynamic? |
|-----------|----------|----------|
| **Octree** | Uniform distribution, spatial queries | Good |
| **BVH** (three-mesh-bvh) | Raycasting, triangle queries | Poor (rebuild) |
| **kd-tree** (kdbush) | Point clouds, nearest-neighbor | Poor |

drei's `<Bvh firstHitOnly>` for accelerated raycasting against complex geometry (80K+ polygons at 60fps).

### 5.7 Billboard and Impostor Techniques

```tsx
function DendroviaNode({ node, distanceToCamera }) {
  if (distanceToCamera > 100) return <point ... />        // Point sprite
  if (distanceToCamera > 50) return <Billboard><sprite /></Billboard> // Billboard
  return <FullDetailNode />                                // Full 3D mesh
}
```

**At Falcon view (overview):** Most of the tree should be points/billboards. Only area of interest gets full geometry. Single biggest performance win for large codebases.

### 5.8 Asset Compression

| Format | Compresses | Reduction | Dendrovia Relevance |
|--------|-----------|-----------|---------------------|
| **Draco** | Geometry (positions, normals) | ~35% | Low (geometry is procedural) |
| **KTX2 / Basis Universal** | Textures (stays compressed on GPU) | ~10x memory | High for billboard atlas |
| **Vertex quantization** | Vertex attributes (Int16 vs Float32) | ~50% | High for generated buffers |
| **Brotli/gzip** | Shader source | ~80-90% | Built into HTTP |

### 5.9 R3F Performance Scaling API

**`frameloop` prop:**
- `"always"` (default) — every frame
- `"demand"` — only when state changes (call `invalidate()`)
- `"never"` — manual rendering

**Performance regress (Sketchfab-style):**
```tsx
<Canvas performance={{ min: 0.5, max: 1 }}>
  <AdaptiveDpr pixelated />
  <AdaptiveEvents />
</Canvas>
```

During camera movement, quality drops. On stillstand, quality returns.

### 5.10 IndexedDB Caching

```typescript
// Cache generated geometry buffers for instant reload
const db = await openDB('dendrovia-cache', 1, {
  upgrade(db) {
    db.createObjectStore('geometry', { keyPath: 'nodeId' })
    db.createObjectStore('topology', { keyPath: 'commitHash' })
  }
})
// Store on generation, retrieve on reload
```

---

## 6. Memory Management

### 6.1 Three.js Disposal Pattern

Three.js does NOT garbage-collect GPU resources. You must explicitly dispose:

```typescript
function disposeObject(obj) {
  if (obj.geometry) obj.geometry.dispose()
  if (obj.material) {
    // Dispose all texture maps on the material
    for (const key of Object.keys(obj.material)) {
      const value = obj.material[key]
      if (value?.isTexture) {
        value.dispose()
        value.source?.data?.close?.() // GLTF ImageBitmap cleanup
      }
    }
    obj.material.dispose()
  }
}
```

**Leak detection:** Monitor `renderer.info.memory.geometries` and `renderer.info.memory.textures`. If climbing, you have a leak.

### 6.2 Object Pooling

Pre-allocate mesh objects, reassign as camera moves:

```typescript
class MeshPool {
  private pool: Mesh[] = []
  get(): Mesh { return this.pool.pop() ?? this.createNew() }
  release(mesh: Mesh): void { mesh.visible = false; this.pool.push(mesh) }
}
```

### 6.3 Memory Budgets

| Platform | Total GPU Budget | Textures | Geometry | Render Targets |
|----------|-----------------|----------|----------|----------------|
| Desktop (Discrete) | 512MB | 256MB | 128MB | 128MB |
| Desktop (M1 Integrated) | 256MB | 128MB | 64MB | 64MB |
| Mobile (High-end) | 128MB | 64MB | 32MB | 32MB |
| Mobile (Low-end) | 64MB | 32MB | 16MB | 16MB |

### 6.4 SharedArrayBuffer for Worker Communication

```typescript
const sab = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * 1000)
const positions = new Float32Array(sab)
worker.postMessage({ positions: sab })
// Both threads see the same memory — zero copy
```

**Security requirement:** Cross-Origin Isolation headers:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

---

## 7. Production Bundling and Build

### 7.1 Three.js Tree-Shaking Status

Three.js tree-shaking remains imperfect. Named imports (`import { BoxGeometry } from 'three'`) are better than namespace imports but still pull significant unused code.

**Practical recommendation:** Accept ~600KB minified as the Three.js baseline. Focus optimization efforts on code-splitting rather than tree-shaking Three.js internals.

### 7.2 Code Splitting for R3F

```tsx
// Lazy-load the 3D scene (Three.js + R3F add ~600KB+ to bundle)
const DendroviaScene = React.lazy(() => import('./DendroviaScene'))

<Suspense fallback={<LoadingScreen />}>
  <DendroviaScene />
</Suspense>
```

Split post-processing effects as separate chunks. Split shader code from main bundle.

### 7.3 Shader Compilation Warmup

TSL shader compilation can cause **8+ second stalls** on first frame with many shaders.

**Mitigation:**
- Call `renderer.compile(scene, camera)` before first visible frame
- Use a loading screen that triggers compilation behind the scenes
- Keep shader node graphs minimal
- Pre-warm shaders with simple geometry during loading

### 7.4 WASM for Compute-Heavy Operations

When WASM makes sense for Dendrovia:
- L-system string expansion (tight loops, string manipulation)
- Topology parsing (binary protocol decoding)
- Spatial indexing (octree build/query)

**Toolchain:** `wasm-pack` + `wasm-bindgen` (Rust → WASM).
**Worker integration:** Run WASM in Web Workers for non-blocking computation.
**Threading:** `wasm-bindgen-rayon` for parallel WASM using Web Workers + SharedArrayBuffer.

**Decision:** WASM is a V2 optimization. Start with JavaScript, profile, and migrate hot paths to WASM only if needed.

### 7.5 Turborepo Build Optimization

- **Watch mode:** `turbo watch` re-runs tasks on source change, dependency-aware
- **Remote caching:** Share build artifacts across machines/CI
- **Incremental TypeScript:** Set `incremental: true` in tsconfig
- **Parallel execution:** Turborepo runs independent package builds in parallel

### 7.6 Vite for Three.js

Vite is the recommended bundler (already configured in `@dendrovia/architectus`):
- GLSL/WGSL imports via `vite-plugin-glsl` or raw string imports
- Native ESM in dev mode (fast HMR)
- Rollup-based production builds with efficient chunking
- `rollup-plugin-visualizer` for bundle analysis

### 7.7 WebGPU Progressive Rollout

**Phase 1:** Feature detection and WebGL2 fallback (Three.js handles this automatically with `import { WebGPURenderer } from 'three/webgpu'`)
**Phase 2:** Controlled testing on subset of browsers
**Phase 3:** Progressive rollout based on hardware capabilities
**Phase 4:** Default enable (browser support now at ~85% desktop: Chrome stable, Firefox 141+, Safari 26+)

---

## 8. Performance Metrics and Monitoring

### 8.1 Custom Performance Metrics for 3D

| Metric | Description | Target |
|--------|-------------|--------|
| Time-to-first-frame | Canvas shows something | < 500ms |
| Time-to-interactive-scene | User can orbit camera | < 2s |
| Sustained FPS | After initial load | 60fps desktop, 30fps mobile |
| Draw calls per frame | Total GPU draw submissions | < 100 |
| GPU memory growth | Should stabilize after load | Stable (no continuous growth) |

### 8.2 Core Web Vitals Impact

- **LCP:** Canvas element is the LCP candidate — render a placeholder fast
- **FID/INP:** Heavy initialization blocks main thread — use `requestIdleCallback` and workers
- **CLS:** Canvas should have fixed dimensions — avoid layout shift

### 8.3 CI Performance Regression Testing

```bash
# Puppeteer + WebGPU headless
puppeteer.launch({
  headless: 'new',
  args: ['--enable-unsafe-webgpu', '--use-angle=vulkan']
})
```

Record 300+ frames (excluding 60 warmup), compare P95 against baseline, fail CI if >10% regression.

---

## 9. Existing Codebase Integration

### 9.1 Current Package State

`@dendrovia/architectus` (package.json) already has:
- `three: ^0.171.0`
- `@react-three/fiber: ^8.17.0`
- `@react-three/drei: ^9.114.0`
- `@react-three/postprocessing: ^2.16.0`
- `zustand: ^5.0.2`
- Vite + React + TypeScript configured

The package has **no source files yet** (only `package.json`). All implementation starts from scratch.

### 9.2 New Dependencies to Add

| Package | Purpose | Size |
|---------|---------|------|
| `r3f-perf` | Development performance overlay | 6.23KB |
| `detect-gpu` | GPU tier classification | ~5KB |
| `postprocessing` | Core post-processing (peer dep) | Included via @react-three/postprocessing |
| `stats-gl` | GPU timing panel (optional alternative) | ~3KB |
| `comlink` | Ergonomic worker communication | ~3KB |

### 9.3 Zustand Store for Quality State

Quality tier should live in the Zustand store (already a dependency) so all components can react:

```typescript
interface QualityState {
  tier: 'ultra' | 'high' | 'medium' | 'low' | 'potato'
  maxSteps: number
  postProcessingEnabled: boolean
  dpr: number
  // ... per-tier settings
}
```

---

## 10. Decision Log

| # | Decision | Chosen | Alternative | Rationale |
|---|----------|--------|-------------|-----------|
| 1 | Post-processing library | pmndrs/postprocessing (WebGL), TSL native (WebGPU) | Custom shaders | Ecosystem maturity, effect merging, migration path |
| 2 | Bloom approach | Material-based selective (HDR emissive > 1.0) | SelectiveBloom component | No extra render passes, works with instancing |
| 3 | Tonemapping | ACESFilmic | AgX, Neutral | Best cinematic neon glow for Tron aesthetic |
| 4 | Edge glow technique | Fresnel rim lighting (object-level) | Post-process outline | Zero cost, more authentic Tron look |
| 5 | Quality adaptation | PerformanceMonitor + detect-gpu two-phase | Manual presets only | Handles unknown hardware, auto-adapts |
| 6 | Hysteresis | Asymmetric thresholds + flipflop limit | Simple average FPS check | Prevents quality oscillation |
| 7 | SDF perf optimization | Half-res raymarch + bilateral upscale | Reduce step count only | 4x pixel reduction, minimal visual cost |
| 8 | Temporal coherence | Checkerboard + reprojection for Falcon mode | Full re-render every frame | 50-75% cost reduction for slow cameras |
| 9 | Loading strategy | 4-phase progressive (skeleton → topology → detail → background) | Load everything then render | Immediate visual feedback |
| 10 | Worker architecture | Pool of 3-5 workers via Comlink | Single worker or main-thread only | Parallel geometry generation |
| 11 | Spatial partitioning | Octree (spatial queries) + BVH (raycasting) | Octree only | Each optimized for its use case |
| 12 | Distant objects | Billboard/point sprites for far nodes | Full 3D at all distances | Biggest performance win for large codebases |
| 13 | GPU memory disposal | Explicit dispose + pool pattern | Rely on GC | Three.js does not auto-dispose GPU resources |
| 14 | Bundle splitting | React.lazy for 3D scene + separate post-processing chunk | Single bundle | 3D code is ~600KB+ and not needed for initial paint |
| 15 | WASM | Defer to V2, profile first | Immediate Rust+WASM | JS is sufficient; WASM adds toolchain complexity |
| 16 | Shader warmup | `renderer.compile()` during loading screen | Lazy compile on first use | Avoids 8+ second first-frame stall |
| 17 | Mobile rendering | Mesh-only default, SDF opt-in if capable | Same pipeline, fewer steps | Integrated GPUs can't reliably raymarch at 30fps |
| 18 | Caching | IndexedDB for generated geometry + Service Worker for assets | No caching | Instant reload for repeat visits |

---

## Summary: Priority Implementation Order

### Must-Have (Steps 21-22)
1. Post-processing stack: Bloom + Vignette + Chromatic Aberration + Fresnel rim glow
2. `PerformanceMonitor` + `AdaptiveDpr` + quality tier system in Zustand
3. `r3f-perf` integration (dev only)

### Should-Have (Steps 23-24)
4. Half-resolution SDF raymarching with bilateral upscale
5. Web Worker pool for geometry generation (Comlink)
6. Progressive loading phases (skeleton → detail)
7. Frustum + distance + importance culling
8. Object pooling and explicit disposal

### Nice-to-Have (Step 25)
9. Temporal reprojection for Falcon mode
10. Billboard/impostor system for distant nodes
11. IndexedDB geometry caching
12. CI performance regression testing
13. WASM migration for hot paths
