# PR: Playground Build Fixes + Quest Portal Game Flow

## Coat of Arms (Unified)

```
+--------------------------------------------------------------+
|   fix/playground-build-errors                                |
+--------------------------------------------------------------+
|                     *** MAJOR ***                            |
|                                                              |
|     +------------------------+  +------------------------+   |
|     | I Build Fixes          |  | II Quest Portal        |   |
|     | cross x7, hammer x1   |  | mullet x3, cross x1   |   |
|     | [arch,imag,lud,op,oc]  |  | [app, docs]            |   |
|     +------------------------+  +------------------------+   |
|                                                              |
|        skip  [gyronny]  skip                                 |
|        skip             skip                                 |
|                                                              |
|           files: 108 | +2348 / -489                         |
+--------------------------------------------------------------+
|   "Per aspera ad astra"                                      |
+--------------------------------------------------------------+
```

**Compact:** *** [arch,imag,lud,op,oc,app,docs] I: cross x7 hammer x1 | II: mullet x3 cross x1 book x1 skip/skip/skip/skip +2348/-489

---

## Feature Space Index

| Index | Short Name | Full Name | Domain | Commits |
|-------|------------|-----------|--------|---------|
| I | Build Fixes | Playground Build Error Resolution | architectus, imaginarium, ludus, operatus, oculus, app | 9 |
| II | Quest Portal | Quest Portal Game Flow & Design System | app, docs | 5 |

## Cross-Space Dependencies

| From | To | Dependency Type |
|------|----|-----------------|
| I Build Fixes | II Quest Portal | Pillar packages must compile before quest app can import them |
| I Build Fixes | II Quest Portal | Webpack fallback pattern from playground-architectus reused in quest next.config.js |

---

## I. Playground Build Error Resolution

### Coat of Arms (Space I)

```
+--------------------------------------------------------------+
|                     ** MODERATE **                            |
|                                                              |
|        skip  [party-per-cross]  skip                         |
|        skip                     skip                         |
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

### Summary

Resolves all build errors across the 6 playground Next.js applications and their underlying pillar packages. Three root causes: Turbopack's inability to resolve `.js` extensions in TypeScript relative imports, `noUncheckedIndexedAccess` strict mode violations from indexed array accesses, and missing type declarations for React 19, WebGPU, and Bun runtime APIs.

### Features

| Feature | Description | Status |
|---------|-------------|--------|
| Extension stripping | Remove `.js` from all relative imports in ludus, operatus, imaginarium for Turbopack compatibility | Complete |
| Index safety | Add null guards for all `noUncheckedIndexedAccess` violations across architectus, imaginarium, ludus, oculus | Complete |
| Type declarations | Add `bun-globals.d.ts` for Bun.spawn, React 19 `useRef<T>(null)` pattern, WebGPU `GPUDevice` stubs | Complete |
| Turbopack resolver stubs | Add `resolveAlias` in playground next.config.js for `node:*` built-in shimming | Complete |
| React 19 types | Upgrade `@types/react` and `@types/react-dom` to 19.x across all apps | Complete |

---

## II. Quest Portal Game Flow & Design System

### Coat of Arms (Space II)

```
+--------------------------------------------------------------+
|                     ** MODERATE **                            |
|                                                              |
|        skip  [per-pale]  skip                                |
|        skip              skip                                |
|                mullet x 3                                    |
|                cross x 1                                     |
|                book x 1                                      |
|                                                              |
|               [app, docs]                                    |
|                                                              |
|           files: 8 | +1654 / -12                             |
+--------------------------------------------------------------+
|   "Per aspera ad astra"                                      |
+--------------------------------------------------------------+
```

### Summary

Transforms dendrovia-quest from a static hub page into a playable 3-phase game entry (Portal → Pipeline → Game), with API routes for the CHRONOS→IMAGINARIUM pipeline, character class selection mapped to pillar archetypes, and a full Portal page design implementing the Dendrovia design system vocabulary from `SYMBOL_DRIVEN_DESIGN_SYSTEM.md`.

### Features

| Feature | Description | Status |
|---------|-------------|--------|
| SSE API routes | Three Next.js API routes (analyze, distill, results) spawning CHRONOS/IMAGINARIUM CLIs as subprocesses and streaming progress via Server-Sent Events | Complete |
| Webpack node: fallbacks | `NormalModuleReplacementPlugin` stripping `node:` prefix + expanded `resolve.fallback` covering 14 Node.js built-ins for browser builds | Complete |
| Character props | `characterClass` and `characterName` props on DendroviaQuest, wired through to `createCharacter()` in LUDUS init | Complete |
| Portal phase | DendriticBackground (radial gradients, SVG grid, dendritic branch SVGs, 12 floating particles), OrnateFrame (SVG corner brackets, edge ticks, glow filter), 3 class cards with pillar-derived SVG icons, stat bars, spell tags | Complete |
| Pipeline phase | SSE progress reader consuming /api/analyze then /api/distill, color-coded log entries by stage, summary stats grid, auto-transition | Complete |
| Game phase | Renders full DendroviaQuest with pipeline output paths, character selection passthrough, "NEW RUN" return button | Complete |
| Design tokens | `T` object sourcing all colors from SYMBOL_DRIVEN_DESIGN_SYSTEM.md — 6 pillar palettes, 3 class-specific tints, core palette | Complete |
| Image prompts | Three iterations of AI image generation prompts for Portal background, derived from full design system vocabulary and SVG insignia layers | Complete |

---

## Files Changed (All Spaces)

```
apps/dendrovia-quest/                          ── Space II ──
├── app/
│   ├── api/
│   │   ├── analyze/route.ts                   NEW  SSE endpoint for CHRONOS
│   │   ├── distill/route.ts                   NEW  SSE endpoint for IMAGINARIUM
│   │   └── results/route.ts                   NEW  File reader with traversal protection
│   ├── components/
│   │   └── DendroviaQuest.tsx                 MOD  +characterClass, +characterName props
│   └── page.tsx                               MOD  Full rewrite: 3-phase flow + design system
├── next.config.js                             MOD  NormalModuleReplacementPlugin + fallbacks
└── package.json                               MOD  +zod, +pino, +pino-pretty

apps/playground-architectus/                   ── Space I ──
├── bun-globals.d.ts                           NEW  Bun.spawn type declarations
├── lib/node-stub.js                           NEW  Node.js built-in stub
├── next.config.js                             MOD  Turbopack resolveAlias
└── app/gyms/LSystemSandbox.tsx                MOD  Remove unused import

apps/playground-chronos/                       ── Space I ──
├── app/api/analyze/route.ts                   MOD  Fix controller double-close
├── app/gyms/AnalyzeClient.tsx                 MOD  Type narrowing
├── app/zoos/complexity/complexity-drilldown.tsx MOD  Index safety
├── app/zoos/contract/page.tsx                 MOD  Index safety
├── app/zoos/page.tsx                          MOD  Index safety
└── lib/load-data.ts                           MOD  Index safety

apps/playground-imaginarium/                   ── Space I ──
├── bun-globals.d.ts                           NEW  Bun.spawn type declarations
├── lib/node-stub.js                           NEW  Node.js built-in stub
└── next.config.js                             MOD  Turbopack resolveAlias

apps/playground-operatus/                      ── Space I ──
├── app/components/PlaygroundProvider.tsx       MOD  Type narrowing
├── app/gyms/event-stream/EventStreamClient.tsx MOD  Index safety
├── app/gyms/persistence/PersistenceSandboxClient.tsx MOD  Index safety
└── app/museums/cross-pillar/page.tsx           MOD  Index safety

packages/architectus/src/                      ── Space I ──
├── components/BranchInstances.tsx             MOD  Index safety
├── components/DendriteWorld.tsx               MOD  Index safety
├── components/MushroomInstances.tsx            MOD  Index safety
├── components/NodeInstances.tsx               MOD  Index safety
├── renderer/detectGPU.ts                      MOD  WebGPU type guards
└── systems/LSystem.ts                         MOD  Index safety

packages/imaginarium/                          ── Space I ──
├── package.json                               MOD  Strip .js from exports
├── src/bun-globals.d.ts                       NEW  Bun type declarations
├── src/**/*.ts (24 files)                     MOD  Strip .js extensions, index safety

packages/ludus/src/                            ── Space I ──
├── **/*.ts (11 files)                         MOD  Strip .js extensions

packages/oculus/                               ── Space I ──
├── package.json                               MOD  React 19 types
└── src/components/**/*.tsx (2 files)           MOD  useRef null pattern, index safety

packages/operatus/src/                         ── Space I ──
├── **/*.ts (16 files)                         MOD  Strip .js extensions

docs/                                          ── Space II ──
├── image-prompts/
│   └── PORTAL_BACKGROUND_PROMPTS.md           NEW  3 image generation prompt iterations
└── pr-descriptions/
    └── PR_DESCRIPTION_PLAYGROUND_BUILD_ERRORS.md MOD  Updated with Space II

lib/dendrite/package.json                      ── Space I ──
bun.lock                                       MOD  Lockfile update
```

## Commits (All Spaces)

1. `01a2a59` chore(deps): upgrade React 19 types and add missing type declarations
2. `b7b55a7` fix(playgrounds): add Turbopack resolveAlias stubs and Bun type declarations
3. `dc6f20f` fix(ludus): strip .js extensions from relative imports for Turbopack
4. `0e63da2` fix(operatus): strip .js extensions and resolve noUncheckedIndexedAccess errors
5. `b796370` fix(imaginarium): strip .js extensions and resolve noUncheckedIndexedAccess errors
6. `166e1d6` fix(architectus): resolve noUncheckedIndexedAccess and WebGPU type errors
7. `eff8c97` fix(oculus): resolve noUncheckedIndexedAccess and React 19 useRef errors
8. `91fe348` fix(playgrounds): resolve TypeScript errors in playground app code
9. `bd18e88` docs(pr): add PR description for playground build error fixes
10. `cbdc615` feat(quest): add CHRONOS, IMAGINARIUM, and results SSE API routes
11. `7e8cc18` fix(quest): expand webpack node: fallbacks with NormalModuleReplacementPlugin
12. `7c91b33` feat(quest): add characterClass and characterName props to DendroviaQuest
13. `25f94d3` feat(quest): rewrite portal with 3-phase game flow and Dendrovia design system
14. `8cc41b6` docs(quest): add portal background image generation prompts in 3 iterations

## Test Plan

- [ ] `bun install` succeeds with new dependencies
- [ ] `bun run build` compiles all packages and apps without errors
- [ ] Navigate to localhost:3010 — Portal screen renders with DendriticBackground, ornate frame class cards, character selection
- [ ] Select each class (Tank/Healer/DPS) — frame highlights, stat bars populate, spell tags show
- [ ] Enter `.` as repository URL — CHRONOS pipeline streams SSE progress
- [ ] Pipeline completes — IMAGINARIUM distillation streams, auto-transitions to Game phase
- [ ] Game phase renders DendroviaQuest with selected character class and name
- [ ] "NEW RUN" button returns to Portal
- [ ] Pillar playground links expand/collapse and navigate to :3011-3016
- [ ] `/gyms` route still works (Dendrite Observatory)
- [ ] All playground apps (:3011-3016) compile without type errors
