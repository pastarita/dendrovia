# PR: Fix ARCHITECTUS WebGPU Rendering Issues

## Coat of Arms

```
+--------------------------------------------------------------+
|   fix/architectus-webgpu-renderer                            |
+--------------------------------------------------------------+
|                      MINOR *                                 |
|                                                              |
|         WARN typecheck  [SHIELD]  WARN lint                  |
|                   cross x 1                                  |
|                                                              |
|                [architectus]                                 |
|                                                              |
|           files: 5 | +215 / -84                             |
+--------------------------------------------------------------+
|   "Correctio fundamentum"                                    |
+--------------------------------------------------------------+
```

**Compact:** * [architectus] cross x1 typecheck:WARN lint:WARN test:pass build:pass +215/-84

---

## Summary

Resolves three cascading WebGPU console errors observed on the deployed Vercel app (`dendrovia-architectus.vercel.app`): a noisy 404 warning for the optional chunked manifest, a renderer-init race condition causing `.render()` before backend initialization, and a uniform buffer overflow from instanced meshes exceeding WebGPU's 64KB UBO limit. All fixes are WebGPU-path-only; the WebGL2 fallback path is unaffected.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Manifest 404 silence | Downgrade expected 404 warnings to `console.debug` in `fetchJson()` and `loadWorldIndex()` | Complete |
| Renderer init sequencing | Defer R3F render loop via `frameloop="never"` until `WebGPURenderer.init()` resolves | Complete |
| UBO-safe instance batching | Cap `ParticleInstances` to 1000 on WebGPU; split `BranchInstances` and `NodeInstances` into chunked meshes of 1000 when count exceeds limit | Complete |

## Policy Decisions Registered

These fixes establish binding technical conventions for the ARCHITECTUS rendering pipeline. They should be considered when modifying instanced rendering, asset loading, or renderer initialization in any pillar that touches the 3D canvas.

### P1: WebGPU Instance Count Ceiling

**Convention:** No single `<instancedMesh>` may exceed 1000 instances when the GPU backend is WebGPU.

**Rationale:** Three.js r0.171.0 places instance matrices into a uniform buffer when `count <= 1000`. Each matrix is 64 bytes; at 1000 instances this exactly fills WebGPU's `maxUniformBufferBindingSize` of 65,536 bytes (64KB). Exceeding this produces cascading validation errors (`GPUValidationError: Buffer binding size (128000) is larger than the maximum...`).

**Mechanism:** Each instanced-rendering component reads `gpuBackend` from `useRendererStore` and either caps the count (`ParticleInstances`) or splits into multiple mesh groups (`BranchInstances`, `NodeInstances`). The constant `WEBGPU_MAX_INSTANCES_PER_MESH = 1000` is defined locally in each component.

**Implication for IMAGINARIUM:** If future distillation pipelines produce segment topologies with >1000 branches or nodes per segment, ARCHITECTUS will transparently batch them. No upstream cap is needed, but pipeline authors should be aware that WebGPU render cost scales with `ceil(count / 1000)` draw calls rather than 1.

**Implication for quality presets:** The `ultra` (5000) and `high` (2000) particle budgets in `QUALITY_PRESETS` remain unchanged in the store. The cap is applied at the consumption point in `ParticleInstances`, meaning the WebGL2 path retains full particle density. If a future Three.js release changes the UBO-vs-attribute threshold, only the constant needs updating.

### P2: Renderer Initialization Must Complete Before Frame Loop

**Convention:** When using `WebGPURenderer`, the R3F `<Canvas>` must use `frameloop="never"` until `renderer.init()` resolves, then switch to `"always"`.

**Rationale:** `WebGPURenderer.init()` is async (it calls `navigator.gpu.requestAdapter()` + `requestDevice()`). R3F's synchronous `gl` callback returns the renderer immediately, but the render loop starts on the next frame. Without gating, `.render()` is called before the GPU device exists, producing `TypeError: Cannot read properties of undefined`.

**Mechanism:** A `rendererReady` state flag starts `false`. The `gl` callback fires `renderer.init().then(() => setRendererReady(true))`. The `<Canvas frameloop=...>` expression evaluates to `"never"` while `!rendererReady` on WebGPU, and `"always"` otherwise. WebGL2 sets `rendererReady = true` synchronously (no async init).

**Note:** The existing `createWebGPURenderer()` in `createRenderer.ts` already handles `await renderer.init()` correctly. This fix applies the same discipline to the `App.tsx` `gl` callback path where `createWebGPURenderer` was not used.

### P3: Optional Resource 404s Are Debug-Level, Not Warnings

**Convention:** HTTP 404 responses in `fetchJson()` are logged at `console.debug` level. Non-404 errors remain `console.warn`.

**Rationale:** The chunked manifest (`manifest-chunked.json`) is an optional optimization. When it doesn't exist, the fallback to monolithic `manifest.json` loading works correctly. Logging a `console.warn` for expected-absent resources creates noise that obscures real errors.

**Implication for OPERATUS:** If AssetLoader adds its own logging for 404s, the same convention should apply: expected-absent resources at debug level, unexpected failures at warn level.

## Files Changed

```
packages/architectus/src/
  loader/
    AssetBridge.ts               ── 404 responses → console.debug; "No chunked manifest" → debug
  App.tsx                        ── rendererReady state, frameloop gating, renderer.init() await
  components/
    ParticleInstances.tsx        ── WEBGPU_MAX_INSTANCES_PER_MESH cap on maxParticles
    BranchInstances.tsx          ── Extract BranchMesh inner component, chunkArray batching
    NodeInstances.tsx            ── Extract NodeMesh inner component, chunkArray batching with globalOffset
```

## Commits

1. `62e8106` fix(architectus): resolve WebGPU renderer init race and UBO overflow

## Test Plan

- [x] `bun test` — 1045/1045 tests pass, 0 failures
- [x] `bun run build` (architectus) — vite build succeeds, 770 modules, no type errors
- [x] `npx tsc --noEmit` — no type errors in modified files (pre-existing errors in engine/imaginarium only)
- [ ] Manual: deploy to Vercel, confirm no console errors for manifest 404
- [ ] Manual: confirm WebGPU renderer initializes without `.render()` race
- [ ] Manual: confirm instanced meshes render correctly at ultra/high quality on WebGPU
- [ ] Manual: confirm WebGL2 fallback path unaffected (disable WebGPU in browser flags)
- [ ] Manual: verify particle density at ultra on WebGL2 remains at 5000 (uncapped)
