# Tranche 1: WebGPU Foundation Research

**Date:** February 12, 2026
**Pillar:** ARCHITECTUS (The Renderer)
**Purpose:** Ground truth for Steps 1-5 of the 25-step implementation plan

---

## 1. Browser Support Matrix

### Desktop

| Browser | Engine | Version | Platform | Status |
|---------|--------|---------|----------|--------|
| Chrome | Dawn (C++) | 113+ | Windows, macOS, ChromeOS | Stable, no flags |
| Edge | Dawn (C++) | 113+ | Windows, macOS | Stable, no flags |
| Firefox | wgpu (Rust) | 141+ | Windows | Stable, no flags |
| Firefox | wgpu (Rust) | 145+ | macOS ARM64 | Stable, no flags |
| Safari | Metal (WebKit) | 26+ | macOS Tahoe 26 | Stable, no flags |
| Chrome | Dawn | Linux | Intel Gen12+ | Rolling out (144+) |

### Mobile

| Browser | Version | Platform | Notes |
|---------|---------|----------|-------|
| Chrome Android | 121+ | Android 12+ | Qualcomm/ARM GPUs |
| iOS Safari | iOS 26+ | iOS 26 | Enabled by default |
| iPadOS Safari | iPadOS 26+ | iPadOS 26 | Enabled by default |

### Coverage

- ~95% of users have WebGPU-capable browsers
- Remaining ~5% receive automatic WebGL2 fallback
- Linux desktop is the primary gap (Chrome flag required except Gen12+ Intel)

### Dendrovia Impact

Our M1 MacBook 60fps target is well-served by all three browsers (Chrome/Dawn, Safari/Metal, Firefox/wgpu). Safari provides the best raw Metal performance on Apple Silicon. Test on Chrome first (broadest features), optimize for Safari (best perf path).

**Sources:**
- https://caniuse.com/webgpu
- https://github.com/gpuweb/gpuweb/wiki/Implementation-Status
- https://webo360solutions.com/blog/webgpu-browser-support-2026/
- https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/

---

## 2. W3C Spec Status

| Document | Phase | Latest Snapshot |
|----------|-------|----------------|
| WebGPU | Candidate Recommendation | Dec 19, 2024 |
| WGSL | Candidate Recommendation Draft | Jan 29, 2026 |

Core features are locked. Subgroups standardized (Chrome 133+). Read-write storage textures available via feature tiers. **Bindless textures still under active design — NOT in spec yet.**

The spec is stable enough for production. All major browsers have shipped interoperable implementations.

**Sources:**
- https://www.w3.org/TR/webgpu/
- https://www.w3.org/TR/WGSL/
- https://developer.chrome.com/blog/next-for-webgpu

---

## 3. Three.js WebGPU Renderer (r171+)

### Import Path

```js
import * as THREE from 'three/webgpu';
```

This is the canonical import. Replaces `'three'` and provides `WebGPURenderer` plus all node-material classes.

### Constructor API

```js
const renderer = new THREE.WebGPURenderer({
  canvas: canvasElement,
  antialias: true,
  forceWebGL: false   // true forces WebGL backend for testing
});

// MANDATORY async initialization
await renderer.init();
```

**Critical:** `await renderer.init()` is required. Omitting it causes silent blank-canvas failure.

### Automatic Fallback

WebGPURenderer is a **universal renderer**. When WebGPU is unavailable, it silently falls back to WebGL2. No separate code paths needed. There is an active proposal to rename it to simply `Renderer` (issue #31381).

### The CLAUDE.md Pattern is Outdated

The current CLAUDE.md shows manual `navigator.gpu` checking and fallback logic. This is unnecessary — `WebGPURenderer` handles fallback automatically. The recommended pattern is simply:

```js
const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init();
// renderer is now using WebGPU or WebGL2 transparently
```

### Version Changes

- **r171** (Sept 2025): Production-ready, zero-config bundler support
- **r172**: `colorBufferType` renamed to `outputBufferType`, `WebGLCubeRenderTarget` replaced by `CubeRenderTarget`, shadow bias adjustments
- **r173-r174**: Continued refinements

**Sources:**
- https://www.utsubo.com/blog/threejs-2026-what-changed
- https://www.utsubo.com/blog/webgpu-threejs-migration-guide
- https://sbcode.net/threejs/webgpu-renderer/
- https://github.com/mrdoob/three.js/issues/31381

---

## 4. TSL (Three.js Shading Language)

### Overview

TSL is a functional, JavaScript-based shader authoring system that compiles to:
- **WGSL** on WebGPU backend
- **GLSL** on WebGL2 fallback

It is the **mandatory** way to write custom shaders for the WebGPU path. Raw WGSL strings cannot be used directly (unlike how ShaderMaterial allowed raw GLSL).

### Core API

```js
import { Fn, vec3, float, uniform, positionLocal, normalLocal,
         uv, color, mix, time, sin, Loop, If,
         storage, instanceIndex, instancedArray } from 'three/tsl';
```

### Creating Shader Functions

```js
const myShader = Fn(() => {
  const pos = positionLocal.toVar();
  const n = normalLocal;
  return vec3(1.0, 0.0, 0.0);
})();
```

### Material Node Properties

| Property | Purpose | Behavior |
|----------|---------|----------|
| `colorNode` | Base color | Extends PBR — lights/shadows still work |
| `fragmentNode` | Full fragment override | **Replaces** internal lighting |
| `positionNode` | Vertex displacement | Respects MVP transforms |
| `normalNode` | Surface normals | Affects lighting calculations |

**Critical distinction:** `colorNode` *extends* the material. `fragmentNode` *replaces* it.

### Control Flow for Raymarching

```js
// Loop — equivalent of GLSL for-loop
Loop({ start: 0, end: 64 }, ({ i }) => {
  // raymarching step
});

// Conditional
If(distance.lessThan(0.001), () => {
  // surface hit
});

// Mutable variables
const t = float(0.0).toVar();
t.addAssign(stepSize);
```

### Escape Hatches to Raw Shaders

```js
// Lock to WebGL only
const myGlsl = glslFn(`float sdSphere(vec3 p, float r) { return length(p) - r; }`);

// Lock to WebGPU only
const myWgsl = wgslFn(`fn sdSphere(p: vec3f, r: f32) -> f32 { return length(p) - r; }`);
```

Using `glslFn` or `wgslFn` breaks cross-backend compatibility. For ARCHITECTUS, prefer pure TSL nodes to maintain automatic fallback.

### TSL vs. ShaderMaterial

| Feature | ShaderMaterial (legacy) | TSL / NodeMaterial |
|---------|------------------------|-------------------|
| Backend | WebGL only | WebGPU + WebGL |
| Language | Raw GLSL strings | JavaScript functions |
| IDE support | None (strings) | Full autocomplete |
| Lighting | Manual implementation | Built-in via colorNode |
| Future-proof | No | Yes (recommended path) |

**Sources:**
- https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language
- https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs
- https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
- https://sbcode.net/tsl/getting-started/
- https://niklever.com/tutorials/getting-to-grips-with-threejs-shading-language-tsl/

---

## 5. Compute Shaders in Three.js

### Core Pattern

```js
import * as THREE from 'three/webgpu';
import { Fn, instancedArray, instanceIndex, vec3 } from 'three/tsl';

// Persistent GPU buffers (survive across frames)
const positionBuffer = instancedArray(PARTICLE_COUNT, 'vec3');
const velocityBuffer = instancedArray(PARTICLE_COUNT, 'vec3');

// Define compute function
const computeUpdate = Fn(() => {
  const position = positionBuffer.element(instanceIndex);
  const velocity = velocityBuffer.element(instanceIndex);
  position.addAssign(velocity.mul(deltaTime));
})().compute(PARTICLE_COUNT);

// Execute
await renderer.computeAsync(computeUpdate);
```

### Key APIs

| API | Purpose |
|-----|---------|
| `instancedArray(count, type)` | Creates persistent GPU storage buffer |
| `storage(bufferAttribute, type, count)` | Wraps StorageBufferAttribute as TSL node |
| `instanceIndex` | Built-in unique thread ID per invocation |
| `.compute(count)` | Creates compute dispatch for `count` threads |
| `renderer.computeAsync(node)` | Executes compute shader |

### Performance

- CPU particle systems bottleneck at ~50K particles
- WebGPU compute shaders handle **millions** of particles
- Benchmark: 10K particles at 30ms/frame (CPU) vs 100K particles at <2ms (GPU compute) — ~150x improvement

### Relevance to SDF

Compute shaders can:
- Pre-compute distance fields into 3D textures
- Evaluate SDF for collision detection
- Run marching cubes on GPU for mesh extraction
- Drive particle systems that interact with SDF geometry

### Critical Limitation

**Compute shaders have NO WebGL2 fallback.** The ~5% of users on WebGL2 cannot use compute. For them, the "Micro-Mesh" approach (instanced cylinders, no raymarching) is the correct fallback — matching the CLAUDE.md LOD strategy.

**Sources:**
- https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders
- https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
- https://wawasensei.dev/courses/react-three-fiber/lessons/tsl-gpgpu

---

## 6. R3F + WebGPU Integration

### R3F v9 WebGPU Support

R3F supports WebGPU through the async `gl` prop factory:

```jsx
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import { extend } from '@react-three/fiber';

// Extend R3F's JSX types with WebGPU-compatible elements
extend(THREE);

<Canvas
  gl={async (canvas) => {
    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    await renderer.init();
    return renderer;
  }}
  frameloop="never"  // Required: stop frameloop until renderer ready
>
  {/* Scene */}
</Canvas>
```

### Frameloop Consideration

Set `frameloop="never"` initially because the WebGPU renderer needs async initialization. Once `renderer.init()` completes, switch to `"always"`.

### Drei Compatibility

- Most drei helpers (OrbitControls, Html, Environment) work with WebGPU backend
- The `View` component has a separate WebGPU PR (#2528) — not yet merged into main drei, but a separate package `wuhhh/view-webgpu` exists
- Some effects need WebGPU-specific versions or TSL rewrites

### Post-Processing

The `pmndrs/postprocessing` library (which `@react-three/postprocessing` wraps) does **not yet have native WebGPU support**. WebGPU support is planned for v7, still in development.

**Alternative for WebGPU:** Use Three.js's built-in node-based `PostProcessing` class:

```js
import { PostProcessing } from 'three/webgpu';
import { pass, bloom } from 'three/tsl';

const postProcessing = new PostProcessing(renderer);
const scenePass = pass(scene, camera);
const bloomPass = bloom(scenePass, { threshold: 0.8, intensity: 1.5 });
postProcessing.outputNode = bloomPass;
```

This is the path ARCHITECTUS should use for post-processing effects.

### Reference Repos

| Repo | Description |
|------|-------------|
| [ektogamat/r3f-webgpu-starter](https://github.com/ektogamat/r3f-webgpu-starter) | R3F + WebGPU + PostProcessing demo |
| [wass08/r3f-webgpu-starter](https://github.com/wass08/r3f-webgpu-starter) | Wawa Sensei's WebGPU template |
| [verekia/r3f-webgpu](https://github.com/verekia/r3f-webgpu) | R3F WebGPU integration example |
| [phobon/raymarching-tsl](https://github.com/phobon/raymarching-tsl) | SDF raymarching in TSL |
| [MisterPrada/singularity](https://github.com/MisterPrada/singularity) | Black hole raymarching — Three.js + TSL |
| [CK42BB/procedural-clouds-threejs](https://github.com/CK42BB/procedural-clouds-threejs) | WebGPU raymarching + WebGL mesh fallback |
| [MelonCode/r3f-raymarching](https://github.com/MelonCode/r3f-raymarching) | R3F raymarching abstraction |

**Sources:**
- https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide
- https://blog.loopspeed.co.uk/react-three-fiber-webgpu-typescript
- https://wawasensei.dev/courses/react-three-fiber/lessons/webgpu-tsl
- https://github.com/pmndrs/postprocessing/issues/279

---

## 7. GPU Capability Detection

### Probing WebGPU Availability

```js
async function detectGPUTier() {
  if (!navigator.gpu) return { tier: 'webgl2', reason: 'no navigator.gpu' };

  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: 'high-performance'
  });

  if (!adapter) return { tier: 'webgl2', reason: 'no adapter returned' };

  const info = adapter.info;
  // info.vendor, info.architecture, info.device, info.description
  // All may be empty strings (privacy/fingerprinting protection)

  const limits = adapter.limits;
  // limits.maxComputeWorkgroupSizeX, limits.maxStorageBufferBindingSize, etc.

  const features = adapter.features;
  // Set-like object: features.has('float32-filterable'), etc.
}
```

### Adapter Info Reliability

| Property | Reliability |
|----------|-------------|
| `vendor` | Most reliably populated |
| `architecture` | May be empty |
| `device` | May be empty |
| `description` | May be empty |
| `isFallbackAdapter` | Always false currently (no browser ships software fallback yet) |

**There is no direct boolean for discrete vs. integrated GPU.** Use `powerPreference: "high-performance"` as a hint and infer from vendor/limits. On dual-GPU MacBooks, Chrome auto-selects discrete on AC power.

### Recommended Tier System

```
webgpu-full     — Discrete GPU or Apple Silicon, full compute access
webgpu-limited  — Integrated GPU, reduced compute budget
webgl2          — No WebGPU, mesh-only rendering
webgl1-fallback — Legacy, simplified mesh rendering
```

**Best practice:** Adapt based on *measured frame times* rather than GPU identity, since adapter info may be redacted.

### detect-gpu Library

The `detect-gpu` npm package (by Tim van Scherpenzeel) provides GPU benchmarking:
- Renders a test scene and measures FPS
- Returns tier 0-3 based on performance
- Can be used alongside WebGPU adapter info for a composite quality tier

**Sources:**
- https://developer.mozilla.org/en-US/docs/Web/API/GPUAdapterInfo
- https://developer.mozilla.org/en-US/docs/Web/API/GPU/requestAdapter
- https://toji.dev/webgpu-best-practices/error-handling.html
- https://webgpufundamentals.org/webgpu/lessons/webgpu-limits-and-features.html

---

## 8. Performance Characteristics

### WebGPU vs WebGL Benchmarks

| Scenario | WebGPU | WebGL | Improvement |
|----------|--------|-------|-------------|
| Particles (RTX 3080) | 37M @ 60fps | 2.7M @ 60fps | ~14x |
| Particles (Intel UHD 620) | 2.1M | 374K | ~5.6x |
| Compute update | Native compute | Texture hacks | ~100x |
| Babylon.js Render Bundles | Pre-recorded | Standard draw | ~10x |

### Where WebGPU Excels

1. **Compute shaders** — WebGL has none; WebGPU compute is transformative for physics, particles, SDF
2. **Reduced draw call overhead** — Render Bundles pre-record GPU commands
3. **Instanced rendering** — Compute-driven indirect draws
4. **Large-scale scenes** — Explicit resource management scales better

### SDF Raymarching Specific

- SDF resolution of **256^3** provides good balance for real-time
- Frame time increases **exponentially** with SDF resolution
- Workgroup size of **64** is recommended default (most GPUs run 64 threads in lockstep)

### Performance Gotchas

| Issue | Mitigation |
|-------|-----------|
| Pipeline creation blocks main thread | Cache pipelines; use `createComputePipelineAsync()` |
| Buffer mapping is async | Pre-allocate pool of mapped buffers |
| GC pressure from buffer creation | Preallocate buffer pools at startup |
| Uniform buffer alignment | vec3 must align to 16 bytes; use vec4 padding |
| Render Bundles are CPU-only optimization | Profile whether CPU or GPU is bottleneck first |

### Device Lost Handling

```js
device.addEventListener('uncapturederror', (event) => {
  console.error('WebGPU error:', event.error);
});

// device.lost returns a Promise that resolves when the device is lost
device.lost.then((info) => {
  console.error('GPU device lost:', info.message);
  if (info.reason !== 'destroyed') {
    // Attempt recovery: re-request adapter and device
  }
});
```

Label all GPU objects even in production — labels appear in error messages and aid telemetry.

**Sources:**
- https://toji.dev/webgpu-best-practices/webgl-performance-comparison.html
- https://toji.dev/webgpu-best-practices/buffer-uploads.html
- https://toji.dev/webgpu-best-practices/render-bundles.html
- https://toji.dev/webgpu-best-practices/error-handling.html
- https://webgpufundamentals.org/webgpu/lessons/webgpu-optimization.html
- https://gaming67.com/radiance-guide.html

---

## 9. Alternative Engines (Comparative)

| Engine | Stars | WebGPU Status | Notes |
|--------|-------|---------------|-------|
| Three.js | 104K | Production (r171+) | Our choice. Best R3F ecosystem. |
| Babylon.js | 25K | Production (v8.0+) | Mature WebGPU, good compute API, no React integration |
| PlayCanvas | 14.4K | Production | Compute radix sort, indirect draw. Editor-focused. |
| Orillusion | ~587 | Pure WebGPU | Built from ground up for WebGPU. Small community. |

### Key Lesson from Babylon.js

Babylon.js's fallback strategy: same API surface, automatic backend selection. Their compute shaders fall back to texture-based GPGPU on WebGL. We do NOT need to replicate this complexity — our "Micro-Mesh" fallback is simpler and sufficient.

### Notable WebGPU Demos

| Project | Description | Relevance |
|---------|-------------|-----------|
| [MisterPrada/singularity](https://github.com/MisterPrada/singularity) | Black hole raymarching with TSL | Full TSL raymarching reference |
| [phobon/raymarching-tsl](https://github.com/phobon/raymarching-tsl) | Liquid SDF raymarching | Direct SDF + TSL pattern |
| [battesonb/webgpu-raymarching](https://github.com/battesonb/webgpu-raymarching) | Stack machine raymarcher | Programmable SDF architecture |
| [CK42BB/procedural-clouds-threejs](https://github.com/CK42BB/procedural-clouds-threejs) | WebGPU raymarching + WebGL billboard fallback | Hybrid fallback pattern |

### Learning Resources

| Resource | Coverage |
|----------|----------|
| [webgpufundamentals.org](https://webgpufundamentals.org) | Full curriculum: 3D math, lighting, compute, post-processing |
| [sbcode.net/tsl](https://sbcode.net/tsl/) | TSL tutorials from basics to SDFs |
| [Wawa Sensei](https://wawasensei.dev/courses/react-three-fiber) | R3F + WebGPU + GPGPU course |
| [Maxime Heckel's Field Guide](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/) | Deep TSL + compute reference |
| [Codrops Liquid Raymarching](https://tympanus.net/codrops/2024/07/15/how-to-create-a-liquid-raymarching-scene-using-three-js-shading-language/) | Step-by-step TSL SDF tutorial |
| [Nik Lever's TSL Series](https://niklever.com/tutorials/getting-to-grips-with-threejs-shading-language-tsl/) | 16-part TSL deep dive |

---

## 10. GLSL-to-WGSL Porting Notes

Since IMAGINARIUM generates GLSL shaders, and ARCHITECTUS may need to port them to TSL/WGSL:

### Key Syntax Differences

| GLSL | WGSL |
|------|------|
| `vec3 p = vec3(1.0)` | `var p: vec3f = vec3f(1.0)` |
| `float d = length(p)` | `let d: f32 = length(p)` |
| `p.xz` swizzle on return | Not supported on function returns |
| `.rgba` accessors | Only `.xyzw` |
| Buffer uniforms as globals | Must wrap in struct |
| Implicit type coercion | Explicit casting required |

### Recommended Approach

Do NOT port GLSL to WGSL manually. Instead:
1. Use TSL nodes to express SDF primitives in JavaScript
2. TSL compiles to WGSL or GLSL automatically
3. For IMAGINARIUM's generated GLSL, load via `glslFn()` (WebGL-only) or rewrite as TSL functions (cross-backend)
4. Long-term: IMAGINARIUM should generate TSL node descriptions, not raw GLSL

**Sources:**
- https://github.com/gpuweb/gpuweb/issues/1364
- https://blog.hexbee.net/35-distance-functions-sdfs

---

## 11. Concrete Fallback Strategy for ARCHITECTUS

Based on all research, the recommended fallback tier system:

```
┌─────────────────────────────────────────────────────┐
│ TIER 1: webgpu-full (Desktop discrete GPU)          │
│ - Full SDF raymarching via TSL (128 steps)          │
│ - Compute shader SDF pre-evaluation                 │
│ - Instanced mesh dynamic entities (millions)        │
│ - Full post-processing (bloom, color grading, SSAO) │
│ - Target: 60fps                                     │
├─────────────────────────────────────────────────────┤
│ TIER 2: webgpu-limited (Integrated GPU / mobile)    │
│ - Reduced SDF raymarching (64 steps, larger step)   │
│ - Compute shaders with smaller dispatch             │
│ - Instanced mesh (100K cap)                         │
│ - Reduced post-processing (bloom only)              │
│ - Target: 60fps desktop / 30fps mobile              │
├─────────────────────────────────────────────────────┤
│ TIER 3: webgl2 (No WebGPU available)                │
│ - NO raymarching, NO compute                        │
│ - Pure instanced cylinder meshes for branches       │
│ - Simplified lighting (no PBR)                      │
│ - No post-processing                                │
│ - Target: 30fps                                     │
└─────────────────────────────────────────────────────┘
```

### Detection Flow

```
navigator.gpu exists?
  ├── NO → TIER 3 (WebGL2)
  └── YES → requestAdapter({ powerPreference: 'high-performance' })
       ├── null → TIER 3 (WebGL2)
       └── adapter →
            ├── Measure frame time for 60 frames
            ├── If sustained 60fps → TIER 1
            └── If drops below 50fps → TIER 2
```

Adapt dynamically: start at TIER 1, auto-downgrade if measured FPS drops below threshold for 3 consecutive 500ms samples.

---

## 12. Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Renderer | `WebGPURenderer` from `three/webgpu` | Universal renderer with automatic WebGL2 fallback |
| Shader language | TSL (pure nodes, no raw GLSL/WGSL) | Cross-backend compatibility, IDE support |
| Post-processing | Three.js native `PostProcessing` class | `pmndrs/postprocessing` lacks WebGPU support |
| Compute shaders | TSL `instancedArray` + `Fn().compute()` | Persistent GPU buffers for particles/SDF |
| R3F integration | Async `gl` prop factory pattern | R3F v9 official support |
| Quality adaptation | Measured frame time, not GPU identity | Adapter info unreliable (privacy redaction) |
| SDF fallback | Instanced cylinder meshes (no raymarching) | WebGL2 cannot run SDF compute or complex fragment loops |
| IMAGINARIUM output | Migrate from raw GLSL to TSL descriptions | Cross-backend, composable, future-proof |

---

*This document is the foundation for implementing Steps 1-5 of the ARCHITECTUS 25-step plan.*
