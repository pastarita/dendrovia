# PR: OrnateFrame — Composable SVG Frame System

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/ornate-frame-system                                   |
+--------------------------------------------------------------+
|                      ** MODERATE **                           |
|                                                              |
|          pass  [========SHIELD========]  pass                |
|          tsc        mullet x 1          test                 |
|                                                              |
|                    [ oculus ]                                 |
|                                                              |
|             files: 14 | +1147 / -0                           |
+--------------------------------------------------------------+
|   "Innovation through iteration"                             |
+--------------------------------------------------------------+
```

**Compact:** ** [oculus] mullet×1 tsc:pass lint:skip test:pass build:skip +1147/-0

---

## Summary

Adds `OrnateFrame`, a composable SVG-overlay frame component that wraps children with pillar-specific ornamental chrome. Each of the six pillars receives a unique ornament vocabulary (corners, edges, gradients, glow filters) driven by a `pillar` prop and `variant` size class, sitting alongside the existing `Panel` primitive without replacing it.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Type system | `PillarId`, `FrameVariant`, `PillarPalette`, `FrameOrnamentSet` types and prop interfaces | Complete |
| Pillar palettes | Static color palettes for all six pillars sourced from thematic schema | Complete |
| OCULUS ornaments | Eyelid curves, hex iris cells, focus ring arc edges | Complete |
| CHRONOS ornaments | Scroll curl terminals, strata band tick marks | Complete |
| ARCHITECTUS ornaments | Column capital brackets, fluted pillar line edges | Complete |
| LUDUS ornaments | D-pad crosshair corners, tactical grid dash edges | Complete |
| IMAGINARIUM ornaments | Prism facet corners, spectrum gradient band edges | Complete |
| OPERATUS ornaments | Gear tooth notch corners, pipeline connector dot edges | Complete |
| Ornament registry | `FRAME_ORNAMENTS` record mapping `PillarId` to ornament sets | Complete |
| OrnateFrame component | SVG overlay wrapper with ResizeObserver, useId() uniqueness, variant-driven sizing, animated glow | Complete |
| Design tokens | `--oculus-frame-*` tokens for corner sizes, stroke width, glow size | Complete |
| CSS layout | Variant padding, glow pulse keyframe, responsive breakpoints, reduced-motion support | Complete |

## Files Changed

```
packages/oculus/src/
├── components/primitives/
│   ├── frames/
│   │   ├── types.ts              ← PillarId, FrameVariant, CornerProps, EdgeProps, DefsProps
│   │   ├── palettes.ts           ← PILLAR_PALETTES (6 pillars)
│   │   ├── oculus.tsx            ← Eyelid curve + iris cell ornaments
│   │   ├── chronos.tsx           ← Scroll curl + strata ornaments
│   │   ├── architectus.tsx       ← Column capital + flute ornaments
│   │   ├── ludus.tsx             ← D-pad + tactical grid ornaments
│   │   ├── imaginarium.tsx       ← Prism facet + spectrum ornaments
│   │   ├── operatus.tsx          ← Gear tooth + pipeline ornaments
│   │   └── index.ts              ← FRAME_ORNAMENTS registry + re-exports
│   ├── OrnateFrame.tsx           ← Main wrapper component
│   └── index.ts                  ← Added OrnateFrame exports (modified)
├── styles/
│   ├── tokens.css                ← Added --oculus-frame-* tokens (modified)
│   └── ornate-frame.css          ← Layout, animations, responsive rules
└── index.ts                      ← Added package-level exports (modified)
```

## Commits

1. `5cab065` feat(oculus): add OrnateFrame composable SVG frame system

## Test Plan

- [x] `bunx tsc --noEmit` — zero type errors
- [x] `bun test` — 775 pass, 0 fail (no regressions)
- [ ] Visual verification: render `<OrnateFrame pillar="oculus" variant="modal">` in playground
- [ ] Visual verification: test all six pillar ornament styles
- [ ] Visual verification: confirm ResizeObserver tracks container resize
- [ ] Visual verification: confirm glow pulse animation on modal variant
- [ ] Responsive check: reduced corner padding on mobile breakpoint
- [ ] Accessibility: confirm `prefers-reduced-motion` disables glow animation
