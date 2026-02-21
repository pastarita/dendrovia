# PR: Remove .js Import Extensions (Monorepo-Wide)

## Coat of Arms

```
+--------------------------------------------------------------+
|   fix/js-import-extensions                                   |
+--------------------------------------------------------------+
|                      MODERATE **                             |
|                                                              |
|          skip  [party-per-cross]  pass                       |
|                   cross x 1                                  |
|                   hammer x 1                                 |
|                   bend x 1                                   |
|                                                              |
|    [chronos|imaginarium|architectus|operatus|shared|app|infra]|
|                                                              |
|           files: 32 | +142 / -137                            |
+--------------------------------------------------------------+
|   "Stability restored"                                       |
+--------------------------------------------------------------+
```

**Compact:** ** [chronos|imaginarium|architectus|operatus|shared|app|infra] cross×1 hammer×1 bend×1 skip/pass/WARN/skip +142/-137

---

## Summary

Removes vestigial `.js` extensions from all TypeScript relative imports across six packages, adds a Castle Walls pre-commit gate to prevent regression, and cleans up downstream workarounds in the playground-chronos app. This unblocks Turbopack resolution for all downstream pillar consumers.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Strip .js extensions | Remove ~106 `.js` suffixes from relative imports across chronos, imaginarium, architectus, operatus, shared, and heraldry | Complete |
| Castle Walls gate | Wall 2 advisory check greps staged `.ts` files for `.js` import extensions | Complete |
| Playground cleanup | Remove `extensionAlias` webpack workaround and replace inlined types with proper `@dendrovia/chronos` and `@dendrovia/shared` imports | Complete |

## Files Changed

```
packages/chronos/src/
  index.ts                          — 13 import extensions removed
  pipeline.ts                       — 8 import extensions removed
  analyze.ts                        — 6 import extensions removed
  parse.ts                          — 1 import extension removed
  parser/ASTParser.ts               — 2 import extensions removed
  parser/GitParser.ts               — 1 import extension removed
  parser/GoParser.ts                — 3 import extensions removed
  builder/TopologyBuilder.ts        — 1 import extension removed
  builder/ContributorProfiler.ts    — 1 import extension removed
  enrichment/TopologyEnricher.ts    — 1 import extension removed
  resolver/index.ts                 — 1 import extension removed

packages/imaginarium/src/
  pipeline/SegmentPipeline.ts       — 5 import extensions removed
  storyarc/index.ts                 — 4 import extensions removed
  storyarc/StoryArcDeriver.ts       — 4 import extensions removed
  storyarc/SegmentSlicer.ts         — 1 import extension removed

packages/architectus/src/dendrite/
  index.ts                          — 5 import extensions removed
  bridge.ts                         — 6 import extensions removed
  collectors.ts                     — 4 import extensions removed
  actions.ts                        — 2 import extensions removed

packages/operatus/src/dendrite/
  index.ts                          — 6 import extensions removed
  bridge.ts                         — 8 import extensions removed
  collectors.ts                     — 8 import extensions removed
  health.ts                         — 2 import extensions removed
  actions.ts                        — 3 import extensions removed

packages/shared/src/
  events/EventBus.ts                — 1 import extension removed

lib/heraldry/
  index.ts                          — 4 import extensions removed
  analyzer.ts                       — 2 import extensions removed
  mermaid.ts                        — 2 import extensions removed
  emoji.ts                          — 1 import extension removed

apps/playground-chronos/
  next.config.js                    — extensionAlias webpack workaround removed
  lib/load-data.ts                  — inlined types replaced with proper imports

.husky/
  pre-commit                        — .js import extension gate added (Wall 2)
```

## Commits

1. `3b19723` fix(monorepo): remove .js extensions from TypeScript relative imports
2. `188eb5a` chore(infra): add Castle Walls gate for .js import extensions
3. `d8093c3` refactor(apps): remove .js extension workarounds from playground-chronos

## Test Plan

- [x] `bun test` in packages/chronos — 111 pass, 3 pre-existing failures (unrelated: missing ts-morph, missing @dendrovia/shared/schemas)
- [x] Monorepo-wide grep confirms zero `.js` imports remain in source files
- [x] Castle Walls pre-commit hook passes on all 3 commits
- [x] New ImportExt gate correctly reports "No .js import extensions" on clean files
- [ ] `bun run build` (turbo) — verify no TypeScript resolution errors
- [ ] `bun run td:chronos` — verify playground-chronos starts without resolution errors
