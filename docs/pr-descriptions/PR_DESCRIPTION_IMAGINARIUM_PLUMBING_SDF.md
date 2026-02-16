# PR Description: IMAGINARIUM Plumbing & SDF Backdrop

```
+--------------------------------------------------------------+
|   feat/imaginarium-plumbing-sdf                              |
+--------------------------------------------------------------+
|                        * MINOR                               |
|                                                              |
|          pass  [per-chevron SHIELD]  pass                    |
|                   mullet x 1                                 |
|                                                              |
|          [imaginarium] [architectus] [shared]                |
|                                                              |
|           files: 10 | +472 / -94                             |
+--------------------------------------------------------------+
|   "New horizons"                                             |
+--------------------------------------------------------------+
```

Compact: * [imaginarium,architectus,shared] mulletx1 pass/pass/skip/skip +472/-94

---

## Summary

Wires the `DeterministicCache` (previously instantiated but never called) into every pipeline step, makes the manifest checksum content-based instead of path-only, and adds an `SDFBackdrop` component to ARCHITECTUS that renders IMAGINARIUM raymarching shaders as a fullscreen backdrop behind the scene.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Cache wiring | 6 pipeline steps wrapped with `cache.get()`/`set()` keyed on topology hash | Complete |
| Content-based checksum | Manifest checksum includes topology hash, mycology/mesh/segment counts | Complete |
| Portable topology path | `manifest.topology` stores basename instead of absolute path | Complete |
| Manifest noise/lsystem | `noise` and `lsystem` paths added to `AssetManifest` type and written by generator | Complete |
| AssetBridge manifest paths | Reads `manifest.noise`/`manifest.lsystem` with hardcoded fallback | Complete |
| SDFBackdrop component | Fullscreen quad with `RawShaderMaterial` running IMAGINARIUM GLSL | Complete |
| S key toggle | `sdfBackdrop` store state + keyboard toggle + HUD indicator | Complete |
| Cache integration tests | 4 tests: populate, hit, miss, timing | Complete |
| Manifest completeness tests | Assertions for noise/lsystem/mycology/meshes/storyArc/cache in integration suite | Complete |

## Files Changed

```
packages/
├── shared/
│   └── src/types/index.ts                          # Add noise?, lsystem? to AssetManifest
├── imaginarium/
│   ├── src/pipeline/
│   │   ├── DistillationPipeline.ts                 # Wire cache around 6 steps, topology hash
│   │   └── ManifestGenerator.ts                    # Content-based checksum, basename topology, noise/lsystem paths
│   └── __tests__/
│       ├── cache-integration.test.ts               # NEW: 4 cache integration tests
│       └── integration.test.ts                     # Add manifest completeness + cache assertions
└── architectus/
    ├── src/
    │   ├── components/
    │   │   ├── SDFBackdrop.tsx                      # NEW: fullscreen raymarching quad
    │   │   └── DendriteWorld.tsx                    # Render SDFBackdrop when toggle on
    │   ├── loader/AssetBridge.ts                    # Read noise/lsystem from manifest
    │   ├── store/useRendererStore.ts                # sdfBackdrop state + toggleSdfBackdrop action
    │   └── App.tsx                                  # S key handler, HUD indicator
```

## Commits

1. `46d805b feat(imaginarium,architectus): wire deterministic cache and add SDF backdrop`

## Test Plan

- [x] `bun test packages/imaginarium/` — 299 pass, 0 fail
- [x] Cache integration: `.cache/` populated, second run hits cache, changed topology misses, second run faster
- [x] Manifest: `noise` and `lsystem` paths present, topology is relative, mycology/meshes/storyArc defined
- [x] Rebase on latest main clean (pino logging conflict resolved)
- [ ] Manual: ARCHITECTUS playground — SDFBackdrop renders behind mesh tree with S key toggle
- [ ] Manual: Palette colors visible in backdrop
