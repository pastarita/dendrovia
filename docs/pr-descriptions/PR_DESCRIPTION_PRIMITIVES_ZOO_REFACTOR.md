# PR: Primitives Zoo Refactor — Zoo Kit Convention Standard

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/primitives-zoo-refactor                               |
+--------------------------------------------------------------+
|                      ** MODERATE **                           |
|                                                              |
|          pass  [========SHIELD========]  skip                |
|          tsc        mullet x 2          lint                 |
|                     bend x 1                                 |
|                                                              |
|                      [ app ]                                 |
|                                                              |
|             files: 18 | +1454 / -153                         |
+--------------------------------------------------------------+
|   "Innovation through iteration"                             |
+--------------------------------------------------------------+
```

**Compact:** ** [app] mullet×2 bend×1 tsc:pass lint:skip test:pass build:skip +1454/-153

---

## Summary

Replaces the flat 158-line primitives zoo page with a reusable `_zoo-kit` layout system and rebuilds the primitives gallery as its flagship consumer. The zoo kit provides category filtering, sorting, view mode toggling, a sticky prop inspector with live controls, and a declarative exhibit descriptor pattern that any zoo page can adopt. OrnateFrame — previously absent from the primitives zoo — is now included as the 6th exhibit with a full 6×4 pillar×variant matrix.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Zoo Kit types | `ZooExhibitDescriptor`, `ZooPageConfig`, `PropControl` (5 control types), `ExhibitRenderProps` | Complete |
| Style factories | `tabStyle`, `cardStyle`, `listRowStyle`, `inspectorStyle`, `categoryBadgeStyle` — shared across zoo pages | Complete |
| ZooShell | Main orchestrator: header, filter bar, grid/list, inspector, keyboard nav, URL hash sync, responsive breakpoint | Complete |
| ZooFilterBar | Category tabs + sort dropdown + grid/list toggle + exhibit count | Complete |
| ZooExhibitCard | Card (grid) and row (list) modes with preview, category badge, prop count | Complete |
| ZooInspector | Sticky right panel with details, tags, PropPlayground controls, live preview | Complete |
| PropPlayground | Renders interactive controls from PropControl[] descriptors (checkbox, range, select, text, color) | Complete |
| PanelExhibit | compact/glow/noPadding toggles + 2×2 boolean combination grid | Complete |
| ProgressBarExhibit | value/max/variant/height/flash controls + all 5 variants + 0%/100% edge cases | Complete |
| IconBadgeExhibit | icon/size/color controls + size comparison row + pillar colors palette | Complete |
| StatLabelExhibit | label/value/color controls + dense stats panel + color variations | Complete |
| TooltipExhibit | content/position controls + cross-layout 4-position showcase | Complete |
| OrnateFrameExhibit | pillar/variant/header controls + 6×4 pillar×variant mini-matrix | Complete |
| Exhibit registry | Categories (Container, Data Display, Decoration, Overlay), sort dimensions (Name, Complexity, Prop Count) | Complete |
| Page rewrites | `page.tsx` reduced to thin server wrapper, landing page description updated | Complete |

## Files Changed

```
apps/playground-oculus/app/zoos/
├── _zoo-kit/                                    ← NEW: reusable zoo layout system
│   ├── types.ts                                 ← ZooExhibitDescriptor, ZooPageConfig, PropControl
│   ├── zoo-styles.ts                            ← Shared style factories
│   ├── PropPlayground.tsx                       ← Interactive control renderer (5 types)
│   ├── ZooFilterBar.tsx                         ← Category tabs + sort + view toggle
│   ├── ZooExhibitCard.tsx                       ← Card/list-row wrapper with preview
│   ├── ZooInspector.tsx                         ← Sticky right panel with live preview
│   ├── ZooShell.tsx                             ← Main layout orchestrator
│   └── index.ts                                 ← Barrel export
├── primitives/
│   ├── exhibits/                                ← NEW: per-primitive exhibit descriptors
│   │   ├── PanelExhibit.tsx                     ← Panel: boolean combos
│   │   ├── ProgressBarExhibit.tsx               ← ProgressBar: 5 variants + edge cases
│   │   ├── IconBadgeExhibit.tsx                 ← IconBadge: sizes + pillar colors
│   │   ├── StatLabelExhibit.tsx                 ← StatLabel: dense panel + colors
│   │   ├── TooltipExhibit.tsx                   ← Tooltip: 4-position showcase
│   │   ├── OrnateFrameExhibit.tsx               ← OrnateFrame: 6×4 matrix
│   │   └── index.ts                             ← EXHIBIT_REGISTRY + categories + sort
│   ├── PrimitivesZooClient.tsx                  ← NEW: builds ZooPageConfig, renders ZooShell
│   └── page.tsx                                 ← REWRITTEN: thin server wrapper (~10 lines)
└── page.tsx                                     ← MODIFIED: updated primitives description
```

## Commits

1. `cbc201e` feat(playground): add reusable _zoo-kit layout system
2. `48425bb` feat(playground): add 6 primitive exhibit descriptors with controls
3. `8d69c00` refactor(playground): rewrite primitives zoo to use _zoo-kit

## Test Plan

- [x] `bunx tsc --noEmit` — zero new type errors in `_zoo-kit/` and `primitives/`
- [x] `bun test packages/oculus` — 30 pass, 0 fail (no regressions)
- [ ] `http://localhost:3015/zoos/primitives` — all 6 primitives rendered in grid
- [ ] Category filtering isolates Container / Data Display / Decoration / Overlay
- [ ] Sort by Name, Complexity, Prop Count all work
- [ ] Clicking exhibit opens inspector with live controls
- [ ] Changing controls updates live preview in real-time
- [ ] OrnateFrame exhibit shows 6×4 pillar×variant mini-matrix
- [ ] Grid/list view toggle works
- [ ] URL hash deep-linking: `/zoos/primitives#ornate-frame` opens inspector
- [ ] Keyboard navigation: arrows navigate, Enter opens, Escape closes
- [ ] Responsive: inspector overlays full-width below 1200px
