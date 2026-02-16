# PR: Fix Playground Build Errors

## Coat of Arms

```
+--------------------------------------------------------------+
|   fix/playground-build-errors                                |
+--------------------------------------------------------------+
|                     *** MAJOR ***                             |
|                                                              |
|        skip  [party-per-cross]  skip                         |
|                  cross x 7                                   |
|                  hammer x 1                                  |
|                                                              |
|   [architectus, imaginarium, ludus, operatus, oculus, app]   |
|                                                              |
|           files: 102 | +577 / -496                           |
+--------------------------------------------------------------+
|   "Correctio fundamentum"                                    |
+--------------------------------------------------------------+
```

**Compact:** *** [architectus, imaginarium, ludus, operatus, oculus, app] cross x7 hammer x1 skip/skip/skip/skip +577/-496

---

## Summary

Resolves all build errors across all 6 playground Next.js applications. Three root causes are addressed: Turbopack's inability to resolve `.js` extensions in TypeScript relative imports, `noUncheckedIndexedAccess` strict mode violations from indexed array accesses, and missing type declarations for React 19, WebGPU, and Bun runtime APIs.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| `.js` extension stripping | Remove `.js` from all relative imports in imaginarium, operatus, and ludus for Turbopack compatibility | Complete |
| `noUncheckedIndexedAccess` compliance | Add non-null assertions and type casts to ~80+ indexed array access sites across 5 packages | Complete |
| Turbopack resolveAlias stubs | Add `node-stub.js` and `turbopack.resolveAlias` config for `fs`/`crypto` in architectus and imaginarium playgrounds | Complete |
| Bun type declarations | Add `bun-globals.d.ts` with `Bun.file`, `Bun.write`, `Bun.hash`, `Bun.CryptoHasher` stubs | Complete |
| React 19 type upgrades | Add `@types/react@19.2.2` to imaginarium, upgrade oculus React types, fix `useRef` initial value | Complete |
| WebGPU type safety | Replace `navigator.gpu` with `'gpu' in navigator` guard and `any`-cast in detectGPU | Complete |

## Files Changed

```
packages/
  architectus/src/
    components/
      BranchInstances.tsx      — noUncheckedIndexedAccess fix
      DendriteWorld.tsx         — noUncheckedIndexedAccess fix
      MushroomInstances.tsx     — noUncheckedIndexedAccess fix
      NodeInstances.tsx         — noUncheckedIndexedAccess fix (3 sites)
    renderer/detectGPU.ts       — WebGPU navigator type guard
    systems/LSystem.ts          — noUncheckedIndexedAccess fix (2 sites)
  imaginarium/
    package.json                — add @types/react devDependency
    src/bun-globals.d.ts        — NEW: Bun type stubs
    src/cache/                  — strip .js extensions
    src/distill.ts              — strip .js + noUncheckedIndexedAccess
    src/distillation/*.ts       — strip .js + noUncheckedIndexedAccess (ColorExtractor, SDFCompiler)
    src/generation/*.ts         — strip .js + noUncheckedIndexedAccess (ArtGen)
    src/mesh/*.ts               — strip .js + noUncheckedIndexedAccess (HalfEdgeMesh 49 sites, subdivide, displace, smooth, serialize)
    src/mycology/*.ts           — strip .js + noUncheckedIndexedAccess (GenusMapper, MycelialNetwork, SpecimenCatalog, LoreGenerator)
    src/pipeline/*.ts           — strip .js + noUncheckedIndexedAccess (MockTopology, VariantGenerator)
    src/shaders/                — strip .js
    src/utils/glsl.ts           — noUncheckedIndexedAccess fix
  ludus/src/
    combat/*.ts                 — strip .js extensions (4 files)
    encounter/*.ts              — strip .js extensions
    index.ts                    — strip .js extensions
    integration/*.ts            — strip .js extensions
    inventory/*.ts              — strip .js extensions
    progression/*.ts            — strip .js extensions
    save/*.ts                   — strip .js extensions
    simulation/*.ts             — strip .js extensions
  oculus/
    package.json                — upgrade React types to v19
    src/components/
      MillerColumns.tsx         — noUncheckedIndexedAccess fix (5 sites)
      primitives/Tooltip.tsx    — React 19 useRef initial value
  operatus/src/
    cache/*.ts                  — strip .js extensions
    index.ts, init.ts           — strip .js extensions
    loader/*.ts                 — strip .js + noUncheckedIndexedAccess (AssetLoader)
    manifest/*.ts               — strip .js + noUncheckedIndexedAccess (ManifestGenerator, generate)
    multiplayer/, perf/, sw/    — strip .js extensions
    persistence/*.ts            — strip .js extensions
    sync/*.ts                   — strip .js extensions
apps/
  playground-architectus/
    next.config.js              — add turbopack.resolveAlias for fs/crypto
    lib/node-stub.js            — NEW: empty Node.js built-in stub
    bun-globals.d.ts            — NEW: Bun type declarations
    app/gyms/LSystemSandbox.tsx — remove unused @ts-expect-error
    app/museums/ShowcaseViewer.tsx — remove unused @ts-expect-error
    app/zoos/ComponentGallery.tsx — remove unused @ts-expect-error
  playground-chronos/
    app/api/analyze/route.ts    — type narrowing fixes
    app/gyms/AnalyzeClient.tsx  — type narrowing fixes
    app/zoos/complexity/*.tsx   — type narrowing fixes
    app/zoos/contract/page.tsx  — type narrowing fixes
    app/zoos/page.tsx           — type narrowing fixes
    lib/load-data.ts            — type narrowing fixes
  playground-imaginarium/
    next.config.js              — add turbopack.resolveAlias for fs/crypto
    lib/node-stub.js            — NEW: empty Node.js built-in stub
    bun-globals.d.ts            — NEW: Bun type declarations
  playground-oculus/
    app/components/PlaygroundProvider.tsx — type fixes
  playground-operatus/
    app/gyms/event-stream/*.tsx  — type fixes
    app/gyms/persistence-sandbox/*.tsx — type fixes
    app/museums/cross-pillar/*.tsx — type fixes
lib/dendrite/package.json       — add type resolution devDependencies
bun.lock                        — lockfile update
```

## Commits

1. `01a2a59` chore(deps): upgrade React 19 types and add missing type declarations
2. `b7b55a7` fix(playgrounds): add Turbopack resolveAlias stubs and Bun type declarations
3. `dc6f20f` fix(ludus): strip .js extensions from relative imports for Turbopack
4. `0e63da2` fix(operatus): strip .js extensions and resolve noUncheckedIndexedAccess errors
5. `b796370` fix(imaginarium): strip .js extensions and resolve noUncheckedIndexedAccess errors
6. `166e1d6` fix(architectus): resolve noUncheckedIndexedAccess and WebGPU type errors
7. `eff8c97` fix(oculus): resolve noUncheckedIndexedAccess and React 19 useRef errors
8. `91fe348` fix(playgrounds): resolve TypeScript errors in playground app code

## Test Plan

- [x] All 6 playground apps build successfully (`next build`)
- [x] playground-architectus: 10 routes
- [x] playground-chronos: 21 routes
- [x] playground-imaginarium: 10 routes
- [x] playground-ludus: 11 routes
- [x] playground-oculus: 18 routes
- [x] playground-operatus: 17 routes
- [ ] Manual: verify each playground dev server starts without errors
- [ ] Manual: spot-check pages render correctly
