# PR: IMAGINARIUM Museums Phase 1 — Procedural Art Exhibitions

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/imaginarium-museums-phase1                            |
+--------------------------------------------------------------+
|                       * MINOR                                |
|                                                              |
|          pass  [SHIELD: Argent]  skip                        |
|                   mullet x 1                                 |
|                                                              |
|                      [app]                                   |
|                                                              |
|            files: 7 | +909 / -4                              |
+--------------------------------------------------------------+
|   "New horizons"                                             |
+--------------------------------------------------------------+
```

**Compact:** * [app] mullet x1 pass/skip/skip/skip +909/-4

---

## Summary

Replaces the museums stub in the IMAGINARIUM playground with a fully functional tabbed exhibit page. Four read-only exhibits showcase pipeline outputs — language palettes, SDF shader tiers, distillation pipeline flow, and mycology specimens — all driven by static imports from `@dendrovia/imaginarium`.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Palette Exhibit | 13-language palette gallery with OKLCH color space detail panel | Complete |
| Shader Exhibit | 5 SDF tier cards with expandable syntax-highlighted GLSL source | Complete |
| Pipeline Exhibit | 8-stage distillation pipeline flow with input/output annotations | Complete |
| Mycology Exhibit | 8 specimen cards with genus classification, morphology, taxonomy, and lore | Complete |
| Tab Shell | 4-tab navigation following ludus MuseumsClient pattern | Complete |
| Fixture Data | Static pipeline stage descriptions and synthetic specimen file data | Complete |

## Files Changed

```
apps/playground-imaginarium/app/museums/
├── museum-fixtures.ts              NEW  Pipeline stage + specimen fixture data
├── MuseumsClient.tsx               NEW  Client shell with 4-tab navigation
├── page.tsx                        MOD  Replace stub with heading + MuseumsClient
└── components/
    ├── PaletteExhibit.tsx          NEW  Language palette gallery with OKLCH detail
    ├── ShaderExhibit.tsx           NEW  SDF tier gallery with GLSL source viewer
    ├── PipelineExhibit.tsx         NEW  Distillation pipeline stage flow
    └── MycologyExhibit.tsx         NEW  Specimen gallery with taxonomy/morphology/lore
```

## Commits

1. `e717447` feat(imaginarium): implement museums page with 4 exhibit tabs

## Test Plan

- [ ] Type check: `npx tsc --noEmit -p apps/playground-imaginarium/tsconfig.json` — no museum-related errors
- [ ] Dev server: `bun run dev` in playground-imaginarium, navigate to `/museums`
- [ ] Tab switching: all 4 tabs render without errors
- [ ] Palette exhibit: 13 language cards visible, click expands detail with OKLCH values
- [ ] Shader exhibit: 5 SDF tiers listed, click expands GLSL source with syntax coloring
- [ ] Pipeline exhibit: 8 pipeline stages connected vertically with input/output flow
- [ ] Mycology exhibit: 8 specimen cards with genus/morphology/lore, click expands taxonomy
