# PR: feat/architectus-d2-d3-d6-d7

```
+--------------------------------------------------------------+
|   feat/architectus-d2-d3-d6-d7                               |
+--------------------------------------------------------------+
|                       ** MODERATE                            |
|                                                              |
|           pass   [SHIELD]   skip                             |
|                mullet x 5                                    |
|                                                              |
|                [architectus]                                 |
|                                                              |
|           files: 9 | +715 / -9                               |
+--------------------------------------------------------------+
|   "Per aspera ad astra"                                      |
+--------------------------------------------------------------+

** [architectus] mullet x5 typecheck:pass lint:skip test:skip build:skip +715/-9
```

## Summary

Implements four ARCHITECTUS directives (D2, D3, D6, D7) that add WebGPU renderer support, adaptive quality tuning with hysteresis, a CPU particle system for ambient VFX, and story arc segment visualization. These form the visual and performance foundation for the rendering engine.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| D2: WebGPU Renderer Factory | Dynamic `three/webgpu` import with WebGL2 fallback; PostProcessing skips on WebGPU (GLSL-only) | Complete |
| D3: Adaptive Quality Tuning | FPS history ring buffer (10 samples), hysteresis (3 low to downgrade, 5 high to upgrade), `autoTuneQuality()` and `lockQuality()` actions | Complete |
| D6: Particle System | CPU-based particle simulation with pooled allocation, typed array buffers, firefly ambient + burst VFX configs, InstancedMesh renderer | Complete |
| D7: Segment Overlay | Translucent glow spheres at story arc segment centroids via InstancedMesh, active segment pulse animation, wired into DendriteWorld | Complete |

## Files Changed

```
packages/architectus/src/
  renderer/
    createRenderer.ts ............ NEW: WebGPU/WebGL2 renderer factory (D2)
  systems/
    ParticleSystem.ts ............ NEW: CPU particle simulation with pool (D6)
  components/
    ParticleInstances.tsx ........ NEW: InstancedMesh particle renderer (D6)
    SegmentOverlay.tsx ........... NEW: Story arc glow sphere overlay (D7)
    DendriteWorld.tsx ............ MOD: Wire particles + segment overlay, add storyArc prop
    PerformanceMonitor.tsx ....... MOD: Call autoTuneQuality after each FPS sample (D3)
    PostProcessing.tsx ........... MOD: Skip on WebGPU backend (D2)
  store/
    useRendererStore.ts .......... MOD: Adaptive quality state, FPS history, hysteresis (D3)
  index.ts ....................... MOD: Barrel exports for all new systems
```

## Commits

1. `6501fb4` feat(architectus): add adaptive quality tuning with FPS hysteresis (D3)
2. `e039fee` feat(architectus): add WebGPU renderer factory with WebGL2 fallback (D2)
3. `5fbf097` feat(architectus): add CPU particle system with pooled allocation (D6)
4. `c6b55d7` feat(architectus): add segment overlay and wire particles into scene (D7)
5. `4447d48` feat(architectus): export D2/D3/D6/D7 systems from barrel index

## Test Plan

- [ ] `npx tsc --noEmit` passes with zero architectus errors
- [ ] Renderer falls back to WebGL2 when WebGPU is unavailable
- [ ] PostProcessing renders on WebGL2, returns null on WebGPU
- [ ] Quality tier auto-adjusts when sustained FPS crosses thresholds
- [ ] `lockQuality()` disables auto-tuning
- [ ] Firefly particles spawn within scene bounds and drift upward
- [ ] SegmentOverlay renders glow spheres when storyArc is provided
- [ ] Active segment pulses with sine wave animation
- [ ] No render loop GC pressure (particle pool pre-allocated)
