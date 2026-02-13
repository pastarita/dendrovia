# Tranche 2: SDF Raymarching & Hybrid Rendering Research

**Date:** February 12, 2026
**Pillar:** ARCHITECTUS (The Renderer)
**Purpose:** Ground truth for Steps 6-10 of the 25-step implementation plan

---

## 1. SDF Primitive Selection for Dendrite Trees

### Recommended Primitives

| Tree Element | Primary SDF | Parameters | Notes |
|---|---|---|---|
| Trunk | `sdRoundCone(p, a, b, r1, r2)` | Endpoints + radii | Tapered, rounded ends blend well |
| Major branches | `sdRoundCone(p, a, b, r1, r2)` | Endpoints + radii | Arbitrary orientation version essential |
| Sub-branches | `sdCapsule(p, a, b, r)` | Endpoints + radius | Simpler, faster for small features |
| Junction blending | `opSmoothUnion(d1, d2, k)` | Blend factor k | Quadratic polynomial recommended |
| Leaf nodes | `sdSphere(p, r)` | Center + radius | Simple, cheap |
| Ring markers | `sdTorus(p, t)` | Major + minor radius | Code region indicators |

### Key Primitive: sdRoundCone (Arbitrary Orientation)

The primary building block for Dendrovia branches. Combines tapering with rounded hemisphere caps:

```glsl
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2) {
    vec3  ba = b - a;
    float l2 = dot(ba, ba);
    float rr = r1 - r2;
    float a2 = l2 - rr * rr;
    float il2 = 1.0 / l2;
    vec3  pa = p - a;
    float y = dot(pa, ba);
    float z = y - l2;
    float x2 = dot(pa * l2 - ba * y, pa * l2 - ba * y);
    float y2 = y * y * l2;
    float z2 = z * z * l2;
    float k = sign(rr) * rr * rr * x2;
    if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
    if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
    return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}
```

### Key Primitive: sdCapsule (Simplest Branch Segment)

```glsl
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}
```

**Sources:**
- https://iquilezles.org/articles/distfunctions/
- https://iquilezles.org/articles/distfunctions2d/
- https://gist.github.com/munrocket/f247155fc22ecb8edf974d905c677de1 (WGSL versions)

---

## 2. Smooth Union (smin) — The Junction Blender

### Quadratic Polynomial (Recommended)

```glsl
float smin(float a, float b, float k) {
    k *= 4.0;
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * (1.0 / 4.0);
}
```

### Cubic Polynomial (Smoother Falloff)

```glsl
float sminCubic(float a, float b, float k) {
    k *= 6.0;
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * h * k * (1.0 / 6.0);
}
```

### The "k" Parameter — Critical Design Knob

| k Value | Effect | Use Case |
|---------|--------|----------|
| 0.0 | No blending (sharp union) | Debug / wireframe view |
| 0.05-0.1 | Tight blend, subtle filleting | Fine branch tips, leaf connections |
| 0.15-0.3 | Moderate blend, visible "melted" effect | **Branch-to-branch junctions** |
| 0.3-0.5 | Wide blend, very organic | **Trunk-to-major-branch unions** |
| 0.5-1.0 | Very wide, "liquid" appearance | Artistic/stylized tree trunks |

### LOD-Based k Recommendations

- **Far LOD (Falcon mode):** k = 0.3-0.5 — more blending hides detail you cannot see; smoother SDF is cheaper to trace
- **Mid LOD:** k = 0.15-0.25 — the "sweet spot" for the melted-plastic aesthetic
- **Near LOD (Player mode):** k = 0.05-0.15 — tighter blends show more structural definition

### Material Blending with smin

```glsl
vec2 sminColor(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    float d = mix(b, a, h) - k * h * (1.0 - h);
    return vec2(d, h); // h = blend factor for material interpolation
}
```

**Sources:**
- https://iquilezles.org/articles/smin/
- https://www.smish.dev/math/smin_overlap_correction/ (N-way junction bulging correction)

---

## 3. SDF Transformations for Organic Branching

### Domain Twist (Spiral Branches)

```glsl
float opTwist(vec3 p, float k) {
    float c = cos(k * p.y); float s = sin(k * p.y);
    mat2 m = mat2(c, -s, s, c);
    vec3 q = vec3(m * p.xz, p.y);
    return primitive(q);
}
```

### Domain Bend (Curved Branches)

```glsl
float opCheapBend(vec3 p, float k) {
    float c = cos(k * p.x); float s = sin(k * p.x);
    mat2 m = mat2(c, -s, s, c);
    vec3 q = vec3(m * p.xy, p.z);
    return primitive(q);
}
```

### Limited Repetition (Finite Sub-Branch Arrays)

```glsl
float opLimitedRepetition(vec3 p, float s, vec3 l) {
    vec3 q = p - s * clamp(round(p / s), -l, l);
    return primitive(q);
}
```

### Displacement (Bark Texture)

```glsl
float opDisplace(vec3 p) {
    float d = primitive(p);
    float noise = sin(20.0*p.x) * sin(20.0*p.y) * sin(20.0*p.z) * 0.02;
    return d + noise;
}
```

### Onion (Hollow Tubes)

```glsl
float opOnion(float d, float thickness) { return abs(d) - thickness; }
```

### Rounding

```glsl
float opRound(float d, float rad) { return d - rad; }
```

**Source:** https://iquilezles.org/articles/distfunctions/

---

## 4. Normal Estimation

### Tetrahedron Technique (RECOMMENDED — 4 evaluations, unbiased)

```glsl
vec3 calcNormal(vec3 p) {
    const float h = 0.0001;
    const vec2 k = vec2(1, -1);
    return normalize(
        k.xyy * sdf(p + k.xyy * h) +
        k.yyx * sdf(p + k.yyx * h) +
        k.yxy * sdf(p + k.yxy * h) +
        k.xxx * sdf(p + k.xxx * h)
    );
}
```

Best accuracy-to-cost ratio. The four sample points form a tetrahedron, producing unbiased gradients with only 4 evaluations (vs 6 for central differences).

**Source:** https://iquilezles.org/articles/normalsSDF/

---

## 5. Raymarching Algorithm Selection

### Algorithm Comparison

| Algorithm | Steps Saved | Best For | Notes |
|-----------|-------------|----------|-------|
| Standard Sphere Tracing | Baseline | Simple scenes | Conservative, never overshoots |
| Relaxed Sphere Tracing (omega ~1.4) | 20-40% | Smooth SDFs | May miss thin features |
| Enhanced Sphere Tracing | 30-50% | General | Geometric construction approach |
| Segment Tracing (Galin 2020) | 40-60% | Hierarchical procedural objects | **Best for Dendrovia** |
| Skipping Spheres (2024) | 50-70% | Complex scenes | Two-pass with SDF scaling |

### Recommendation: Segment Tracing

Segment Tracing computes Lipschitz bounds **locally per ray segment** rather than using a global constant. This is optimal for Dendrovia's dendrite SDF because:
- The SDF is built from smooth-blended cylinders (locally smooth)
- It excels with hierarchical procedural objects
- No preprocessing overhead (important for dynamic code trees)
- Falls back to standard sphere tracing where needed

**Sources:**
- https://hal.science/hal-02507361/file/lipschitz-author-version.pdf
- https://github.com/aparis69/Segment-Tracing
- https://diglib.eg.org/items/7f21e58c-639e-4359-bf94-414738612006

---

## 6. Step Count Strategy

### Per-Mode Budget

| Context | Steps | Resolution | Target |
|---------|-------|-----------|--------|
| Falcon Mode (overview) | 32-48 | 0.5x | 60fps desktop |
| Player Mode (surface-locked) | 64-96 | 1.0x | 60fps desktop |
| Background/distant branches | 16-32 | 0.25x | — |
| Shadow rays | 32 max | — | — |
| Mobile | 32 | 0.25-0.5x | 30fps |

### Adaptive Step Count

```glsl
int maxSteps = int(mix(32.0, 128.0, 1.0 - smoothstep(0.0, 100.0, rayLength)));
```

### Early Ray Termination

1. Distance threshold with distance scaling: `epsilon = 0.001 * t`
2. Maximum distance: `t > maxDist`
3. Depth buffer pre-test: skip rays behind rasterized meshes

### Performance Benchmarks (Approximate)

| Platform | Resolution | 64 Steps | 128 Steps |
|----------|-----------|----------|-----------|
| M1 Pro (MacBook) | 1080p | ~4ms | ~8ms |
| M1 (MacBook Air) | 1080p | ~8ms | ~16ms |
| iPhone 14 | 750p | ~25ms (64 steps) | N/A |

**Source:** Compiled from multiple benchmarks

---

## 7. Lighting Models for SDF Surfaces

### SDF-Based Ambient Occlusion (Cheap, ~0.1-0.3ms)

```glsl
float calcAO(vec3 pos, vec3 nor) {
    float occ = 0.0;
    float sca = 1.0;
    for (int i = 0; i < 5; i++) {
        float h = 0.01 + 0.12 * float(i) / 4.0;
        float d = map(pos + h * nor);
        occ += (h - d) * sca;
        sca *= 0.95;
    }
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}
```

### Soft Shadows (Improved Aaltonen Variant)

```glsl
float softshadow(vec3 ro, vec3 rd, float mint, float maxt, float w) {
    float res = 1.0;
    float ph = 1e20;
    float t = mint;
    for (int i = 0; i < 256 && t < maxt; i++) {
        float h = map(ro + rd * t);
        if (h < 0.001) return 0.0;
        float y = h * h / (2.0 * ph);
        float d = sqrt(h * h - y * y);
        res = min(res, d / (w * max(0.0, t - y)));
        ph = h;
        t += h;
    }
    return res;
}
```

### Fresnel Rim Glow (Tron Aesthetic)

```glsl
float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
vec3 rimColor = glowColor * fresnel * emissiveIntensity;
```

### Subsurface Scattering Approximation (1-3 SDF evaluations)

```glsl
float sss = max(0.0, dot(viewDir, -lightDir));
float thickness = map(pos - lightDir * 0.1);
sss *= exp(-thickness * absorptionCoeff);
```

**Sources:**
- https://iquilezles.org/articles/rmshadows/
- http://www.aduprat.com/portfolio/?page=articles/hemisphericalSDFAO

---

## 8. TSL Implementation Patterns

### Core Imports

```javascript
import * as THREE from 'three/webgpu'
import {
  Fn, If, Loop, Break,
  float, int, vec2, vec3, vec4,
  length, normalize, dot, cross, reflect, abs, negate,
  min, max, clamp, mix, step, smoothstep, select,
  sin, cos, pow, sqrt, fract,
  positionLocal, positionWorld, cameraPosition,
  uv, time, deltaTime, uniform,
  viewportResolution,
} from 'three/tsl'
```

### SDF Primitives in TSL

```javascript
const sdSphere = Fn(([p, r]) => {
  return p.length().sub(r)
})

const sdCapsule = Fn(([p, a, b, r]) => {
  const pa = p.sub(a)
  const ba = b.sub(a)
  const h = clamp(dot(pa, ba).div(dot(ba, ba)), 0.0, 1.0)
  return length(pa.sub(ba.mul(h))).sub(r)
})

const smin = Fn(([a, b, k]) => {
  const h = max(k.sub(abs(a.sub(b))), 0).div(k)
  return min(a, b).sub(h.mul(h).mul(k).mul(0.25))
})
```

### Raymarching Loop in TSL

```javascript
const raymarch = Fn(() => {
  const _uv = uv().mul(viewportResolution.xy).mul(2)
    .sub(viewportResolution.xy).div(viewportResolution.y)

  const rayOrigin = vec3(0, 0, -3)
  const rayDirection = vec3(_uv, 1).normalize()
  const t = float(0).toVar()
  const ray = rayOrigin.add(rayDirection.mul(t)).toVar()

  Loop({ start: 1, end: 80 }, () => {
    const d = sdf(ray)
    t.addAssign(d)
    ray.assign(rayOrigin.add(rayDirection.mul(t)))
    If(d.lessThan(0.001), () => { Break() })
    If(t.greaterThan(100), () => { Break() })
  })

  return lighting(rayOrigin, ray)
})()  // MUST be immediately invoked when assigned to material
```

### Normal Computation in TSL (Tetrahedron)

```javascript
const calcNormal = Fn(([p]) => {
  const h = float(0.0001)
  const k = vec2(1, -1)
  return normalize(
    k.xyy.mul(sdf(p.add(k.xyy.mul(h))))
    .add(k.yyx.mul(sdf(p.add(k.yyx.mul(h)))))
    .add(k.yxy.mul(sdf(p.add(k.yxy.mul(h)))))
    .add(k.xxx.mul(sdf(p.add(k.xxx.mul(h)))))
  )
})
```

### Lighting in TSL (Phong + Fresnel)

```javascript
const lighting = Fn(([ro, r]) => {
  const normal = calcNormal(r)
  const viewDir = normalize(ro.sub(r))
  const lightDir = normalize(vec3(1, 1, 1))

  const diffuse = max(0, dot(lightDir, normal))
  const fresnel = float(1).sub(max(0, dot(viewDir, normal))).pow(2)
  const ph = normalize(reflect(lightDir.negate(), normal))
  const specular = max(0, dot(viewDir, ph)).pow(32)

  return vec3(diffuse.mul(0.6).add(fresnel.mul(0.3)).add(specular.mul(0.1)))
})
```

### Material Assignment

```javascript
const material = new MeshBasicNodeMaterial()
material.colorNode = raymarch  // The invoked Fn result
```

### Critical TSL Gotchas

| Pitfall | Rule |
|---------|------|
| Immutability | ALWAYS `.toVar()` for any reassigned value |
| No recursion | Use iterative `Loop()` with manual state |
| `Fn()` invocation | Invoke with `()` when assigning to material nodes |
| Capital `If()` | Lowercase `if` is build-time only, not GPU runtime |
| Import paths | `three/webgpu` for renderer, `three/tsl` for nodes |
| Async init | `await renderer.init()` before first render |
| Loop caching | Pre-compute expensive values with `.toVar()` before loops |
| Swizzle assignment | Individual `.x.assign()` works; multi-swizzle needs `.toVar()` |
| Struct returns | Always `.toVar()` to avoid inline duplication |
| `wgslFn()` | Escape hatch for patterns TSL cannot express |

**Sources:**
- https://tympanus.net/codrops/2024/07/15/how-to-create-a-liquid-raymarching-scene-using-three-js-shading-language/
- https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language
- https://threejsroadmap.com/blog/getting-ai-to-write-tsl-that-works
- https://sbcode.net/tsl/

### Existing TSL SDF Repos

| Repo | Description |
|------|-------------|
| [phobon/raymarching-tsl](https://github.com/phobon/raymarching-tsl) | R3F + TSL liquid raymarching (Codrops tutorial companion) |
| [MisterPrada/singularity](https://github.com/MisterPrada/singularity) | Black hole raymarching with TSL, 261 stars |
| [verekia/tslfx](https://github.com/verekia/tslfx) | SDF utility library for TSL |
| [brunosimon/three.js-tsl-sandbox](https://github.com/brunosimon/three.js-tsl-sandbox) | Minimalist WebGPU/TSL template |
| [CK42BB/procedural-clouds-threejs](https://github.com/CK42BB/procedural-clouds-threejs) | WebGPU raymarching + WebGL billboard fallback |

### TSL Tutorial Series

| Resource | Coverage |
|----------|----------|
| [sbcode.net TSL](https://sbcode.net/tsl/) | 2D/3D SDFs, lighting, shadows, reflections |
| [Nik Lever 16-part series](https://niklever.com/tutorials/getting-to-grips-with-threejs-shading-language-tsl/) | StorageTextures, compute, 3D textures, volume raymarching |
| [Maxime Heckel Field Guide](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/) | TSL fundamentals, compute shaders, particles |
| [Three.js Roadmap](https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs) | TSL overview and gotchas |

---

## 9. Screen-Space Optimizations

### Half-Resolution Raymarching (3-4x Speedup)

Raymarch at 0.5x resolution, bilateral upscale respecting depth/normal discontinuities:

1. Render SDF at 0.5x resolution → color, depth, normal
2. Bilateral upscale: weight neighbors by depth/normal similarity
3. Composite with full-res UI and mesh

The `three-raymarcher` library uses `userData.resolution = 0.5` as the recommended default.

### Temporal Reprojection

Reuse previous frame's raymarching results via motion vectors:
- Checkerboard rendering: even pixels one frame, odd pixels the next
- Exponential blend between current and reprojected frames
- Only re-raymarch where reprojection fails (disocclusion, fast motion)

### Blue Noise Jitter (Anti-Banding)

```glsl
float blueNoise = texture(blueNoiseTex, gl_FragCoord.xy / 256.0).r;
float startOffset = blueNoise * stepSize;
float t = mint + startOffset;

// Temporal animation for progressive convergence:
float animatedNoise = fract(blueNoise + GOLDEN_RATIO * float(frameNumber));
```

**Sources:**
- https://github.com/danielesteban/three-raymarcher
- https://blog.demofox.org/2020/05/10/ray-marching-fog-with-blue-noise/
- https://momentsingraphics.de/BlueNoise.html

---

## 10. Hybrid LOD Architecture (Macro-SDF, Micro-Mesh)

### Four-Tier Rendering System

```
┌──────────────────────────────────────────────────────────────┐
│ TIER 1: SDF Full (Falcon Mode, far distance)                 │
│ - Full SDF raymarching for entire dendrite structure          │
│ - 32-48 steps, 0.5x resolution                              │
│ - Dithered dissolve transition at boundary                   │
│ - Target: 60fps desktop                                      │
├──────────────────────────────────────────────────────────────┤
│ TIER 2: Hybrid (Transition zone)                             │
│ - SDF for trunk/major branches                               │
│ - InstancedMesh2 for nodes/decorations                       │
│ - Screen-space error metric with 10% hysteresis              │
│ - Single-pass shared depth buffer                            │
├──────────────────────────────────────────────────────────────┤
│ TIER 3: Mesh Full (Player Mode, near distance)               │
│ - InstancedMesh2 for all geometry                            │
│ - Per-instance frustum culling + BVH                         │
│ - TSL compute shaders for bug/particle animation             │
│ - Target: 60fps desktop                                      │
├──────────────────────────────────────────────────────────────┤
│ TIER 4: Baked Mesh (Mobile / Integrated GPU fallback)        │
│ - Pre-baked Surface Nets mesh at session start               │
│ - drei <Detailed> for mesh LOD                               │
│ - PerformanceMonitor auto-adjusts tier                       │
│ - Target: 30fps mobile                                       │
└──────────────────────────────────────────────────────────────┘
```

### LOD Transition Strategy: Dithered Dissolve

Screen-door transparency (Bayer matrix dithering) for SDF↔mesh transitions:
- No alpha sorting required
- Writes to depth buffer correctly
- "Melted plastic" aesthetic naturally masks dithering artifacts
- Used by Unreal Engine and Godot for LOD transitions

### R3F LOD Components

| Component | Use Case |
|-----------|----------|
| `<Detailed distances={[0,10,50]}>` | Simple distance-based mesh LOD |
| `<Instances>` / `<Instance>` | Single-draw-call instancing |
| `<Merged meshes={...}>` | Multiple geometry types, one draw call each |
| `<PerformanceMonitor>` | Dynamic quality adjustment |

### Instanced Rendering

**`@three.ez/instanced-mesh` (InstancedMesh2)** — recommended for Dendrovia's mesh layer:
- Built-in per-instance frustum culling + BVH
- Per-instance uniforms (health, glow color, etc.)
- Dynamic add/remove instances
- Demonstrated: 1M static instances with BVH
- LOD support built-in

**Maximum Instance Counts:**

| Backend | Simple Geometry | Complex Geometry |
|---------|----------------|-----------------|
| WebGL2 | ~100K-500K | ~10K-50K |
| WebGPU | ~1M-10M | ~100K-500K |
| WebGPU + Compute | ~37M particles | N/A |

**Sources:**
- https://github.com/agargaro/instanced-mesh
- https://r3f.docs.pmnd.rs/advanced/scaling-performance
- https://drei.docs.pmnd.rs/performances/merged
- https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/

---

## 11. SDF-to-Mesh Conversion (Steering Heuristic Fallback)

Per CLAUDE.md: "If the shader complexity exceeds the frame budget on an integrated GPU, bake the SDF result into a static Low-Poly Mesh for that session."

### Recommended: Surface Nets

The `isosurface` npm package provides Surface Nets, Marching Cubes, and Marching Tetrahedra:

```typescript
import { surfaceNets } from 'isosurface';

const mesh = surfaceNets(
  [64, 64, 64],      // Grid resolution
  sdf,                // SDF evaluation function
  [[-10, -10, -10], [10, 10, 10]]  // World bounds
);
// mesh.positions, mesh.cells → convert to BufferGeometry
```

**Why Surface Nets?** Produces smooth, organic meshes matching the "melted plastic" aesthetic. Sharp features are NOT needed for Dendrovia.

### Alternative: softxels

WASM-accelerated marching cubes with chunked streaming for Three.js. Supports real-time SDF editing and chunk-based loading.

### GPU-Accelerated: glsl-marching-cubes

Render SDF to texture via WebGL, read back distance values, run marching cubes on CPU. Hybrid GPU/CPU approach faster than pure CPU for complex SDFs.

**Sources:**
- https://github.com/mikolalysenko/isosurface
- https://github.com/danielesteban/softxels
- https://github.com/tdhooper/glsl-marching-cubes

---

## 12. Depth Buffer Compositing (SDF + Mesh)

### Recommended: Single-Pass Shared Depth

Instead of separate render targets, render both into the same pass:

1. Render meshes normally (populates depth buffer)
2. Render SDF fullscreen quad AFTER meshes with depth test enabled
3. SDF shader writes `gl_FragDepth` from raymarched hit position
4. GPU depth test automatically composites

**Caveat:** Writing `gl_FragDepth` disables early-z for the SDF pass. Mitigate by rendering meshes FIRST (populating depth), then SDF shader can `discard` pixels where mesh depth is closer.

### TSL Depth Output

```javascript
const material = new MeshBasicNodeMaterial()
material.colorNode = colorOutput
material.depthNode = depthOutput  // Normalized depth from raymarching
```

### Alternative: Two-Pass with Render Targets

```tsx
const sdfTarget = useFBO({ depthTexture: new THREE.DepthTexture() })
const meshTarget = useFBO({ depthTexture: new THREE.DepthTexture() })
// Composite shader picks closer fragment per pixel
```

**Sources:**
- https://interplayoflight.wordpress.com/2017/12/12/deferred-signed-distance-field-rendering/
- https://cprimozic.net/blog/threejs-depth-pre-pass-optimization/
- https://www.thefrontdev.co.uk/post-processing-in-react-three-fiber-depth-textures-and-world-coordinates-in-fragment-shaders/

---

## 13. SDF Tree Optimization — Bounding Volume Hierarchy

### Hierarchical Evaluation for Trees

```glsl
float sdTree(vec3 pos, float minDist) {
    // Level 0: Bounding sphere of entire tree
    float dBound = sdSphere(pos - treeCenter, boundingRadius);
    if (dBound > minDist) return minDist;

    // Level 1: Trunk (always evaluate)
    float dTrunk = sdRoundCone(pos, trunkBase, trunkTop, r1, r2);
    minDist = min(minDist, dTrunk);

    // Level 1: Per-cluster bounding spheres
    for (int c = 0; c < clusterCount; c++) {
        float dCluster = sdSphere(pos - clusters[c].center, clusters[c].radius);
        if (dCluster < minDist) {
            // Level 2: Evaluate actual branches in this cluster
            for (int b = clusters[c].start; b < clusters[c].end; b++) {
                float d = sdRoundCone(pos, branches[b].a, branches[b].b, branches[b].r1, branches[b].r2);
                minDist = smin(minDist, d, blendK);
            }
        }
    }
    return minDist;
}
```

### Symmetry Exploitation

```glsl
// 4-way symmetry: evaluate one quadrant, mirror result
p.xz = abs(p.xz);
float d = sdBranch(p, ...);
```

### SDF Baking to 3D Texture

For static structures, pre-compute SDF into a 3D texture at load time:
- Resolution: 128^3 (~16MB) or 256^3 (~128MB)
- Cost: ~200ms on GTX 1070
- Runtime benefit: single texture fetch per step vs. dozens of primitive evaluations

**Source:** https://iquilezles.org/articles/sdfbounding/

---

## 14. Data-Driven SDF Parameters

### Metric-to-Visual Mapping

| Code Metric | SDF Parameter | Visual Effect |
|------------|---------------|---------------|
| Complexity (cyclomatic) | Branch radius (`r`) | Thick = complex, thin = simple |
| File churn (commits) | Emissive intensity + color temp | Hot/glowing = frequently changed |
| Directory depth | Branch length | Deep nesting = longer branches |
| Number of children | Junction blend `k` + branching angle | Many children = larger blob junction |
| Lines of code | Segment length / leaf node size | More code = larger representation |
| Age (last modified) | Surface noise amplitude | Old = weathered, new = smooth |
| Test coverage | Tron-line density | More coverage = denser grid |
| Technical debt | Junction bulge size | More debt = "tumor-like" bulging |

### Per-Branch GPU Data

```glsl
struct BranchData {
    vec3 start, end;
    float radiusStart, radiusEnd;  // from complexity
    float emissive;                // from churn
    float blendK;                  // from child count
    vec3 color;                    // from language/file type
};
```

---

## 15. Glow and Digital Aesthetic Effects

### Animated Pulse Along Branches

```glsl
// t = parameter along branch [0..1] from capsule evaluation
float pulse = sin(t * 20.0 - time * 3.0) * 0.5 + 0.5;
pulse = smoothstep(0.4, 0.6, pulse);
vec3 color = baseColor + glowColor * pulse * emissive;
```

### Tron-Line Grid Pattern

```glsl
vec2 surfaceUV = computeBranchUV(hitPoint, branchAxis);
float gridX = abs(fract(surfaceUV.x * gridDensity) - 0.5);
float gridY = abs(fract(surfaceUV.y * gridDensity) - 0.5);
float grid = min(gridX, gridY);
float tronLine = 1.0 - smoothstep(0.0, lineWidth, grid);
vec3 color = surfaceColor + tronLineColor * tronLine;
```

### SDF Edge Detection (Free from Gradient)

```glsl
float edgeFactor = 1.0 - smoothstep(0.0, edgeWidth, abs(sdfValue));
vec3 color = mix(surfaceColor, edgeGlowColor, edgeFactor);
```

### Post-Processing Bloom

For WebGPU: use Three.js native `PostProcessing` class (NOT `pmndrs/postprocessing`). Materials that should glow need `toneMapped={false}` with colors above [1,1,1].

---

## 16. Code Visualization Prior Art

### Key Systems Studied

| Tool | Metaphor | Technology | Key Insight for Dendrovia |
|------|----------|-----------|--------------------------|
| CodeCity | 3D city | Java/Eclipse | Height = methods, area = attributes |
| CodeCharta | 3D tree map | WebGL | Color = churn × complexity hotspot |
| Gource | Animated tree | OpenGL | Directories = branches, files = leaves |
| Code Galaxies | Force-directed graph | Three.js | 1.1M nodes at 60fps with offline layout |
| Software Forest | Forest ecosystem | Research | File topics map to tree species |
| Getaviz | Multiple (incl. Plant) | Web | Plant metaphor for software structure |
| WebGPU SDF Editor (Nijhoff 2026) | Interactive SDF | WebGPU | Spatial partitioning + dirty-cell reuse for thousands of SDF primitives |

### Key Research Papers

| Paper | Contribution |
|-------|-------------|
| Implicit Visualization of Growing Trees (2004) | Hierarchical implicit tree modeling |
| Synchronized Tracing of Primitive-based Implicit Volumes (ACM TOG) | Tile-based rendering of large blobtrees |
| Lipschitz Pruning (2025) | Prunes blobtree hierarchy for relevant subsets |
| The BlobTree (Wyvill et al.) | Foundational hierarchical implicit surfaces |
| N-ary Implicit Blends with Topology Control | Controlled blending for N-way junctions |

**Sources:**
- https://wettel.github.io/codecity.html
- https://codecharta.com/
- https://gource.io/
- https://anvaka.github.io/pm/
- https://reindernijhoff.net/2026/01/webgpu-sdf-editor-real-time-signed-distance-field-modeling/
- https://github.com/softvis-research/Getaviz

---

## 17. Spatial Acceleration for Large Scenes

### three-mesh-bvh (Raycasting + Spatial Queries)

```typescript
import { computeBoundsTree, acceleratedRaycast, MeshBVH } from 'three-mesh-bvh';
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
geometry.computeBoundsTree();
// "Casting 500 rays against 80K polygon model at 60fps"
```

### GPU-Driven Rendering (WebGPU Indirect Draw)

Compute shader tests each instance against frustum/LOD, writes survivors to indirect draw buffer, single `drawIndirect` renders everything. Critical: consolidate all draw arguments into a SINGLE buffer (300x improvement over individual buffers).

### Draw Call Budget

| Range | Status | Strategy |
|-------|--------|----------|
| <100 | Baseline | Monitor |
| 100-500 | Acceptable | Instancing + Merged |
| 500-1000 | Caution | BatchedMesh, aggressive LOD |
| 1000+ | Danger | GPU-driven rendering required |

**Sources:**
- https://github.com/gkjohnson/three-mesh-bvh
- https://toji.dev/webgpu-best-practices/indirect-draws.html
- https://github.com/toji/webgpu-bundle-culling

---

## 18. Key Libraries for Implementation

| Library | Purpose | npm Package |
|---------|---------|-------------|
| `@three.ez/instanced-mesh` | Enhanced instancing + LOD + BVH | `@three.ez/instanced-mesh` |
| `three-mesh-bvh` | Raycasting + spatial queries | `three-mesh-bvh` |
| `isosurface` | SDF-to-mesh extraction | `isosurface` |
| `three-raymarcher` | Reference SDF depth integration | `three-raymarcher` |
| `@react-three/drei` | LOD, Instances, Merged, useFBO | `@react-three/drei` |

---

## 19. Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary branch SDF | `sdRoundCone` arbitrary orientation | Tapered, rounded ends, blends well at junctions |
| Sub-branch SDF | `sdCapsule` | Simpler, faster, sufficient for small features |
| Junction blending | Quadratic `smin` | Best speed/quality for real-time |
| Normal estimation | Tetrahedron (4 evals) | Unbiased with fewest evaluations |
| Raymarching algorithm | Segment Tracing | Best for hierarchical procedural trees |
| LOD transition | Dithered dissolve | No sorting, writes depth, matches aesthetic |
| Instanced mesh library | `@three.ez/instanced-mesh` | Built-in culling, BVH, per-instance uniforms |
| SDF-to-mesh fallback | Surface Nets via `isosurface` | Smooth output matches "melted plastic" look |
| Depth compositing | Single-pass shared depth | Simpler than render targets, sufficient |
| Metric encoding | Radius=complexity, emissive=churn, k=children | Leverages SDF parameters for data visualization |
| Digital aesthetic effects | Fresnel rim + Tron-lines + pulse animation | Achieves Tron/Monument Valley target |

---

*This document is the foundation for implementing Steps 6-10 of the ARCHITECTUS 25-step plan.*
