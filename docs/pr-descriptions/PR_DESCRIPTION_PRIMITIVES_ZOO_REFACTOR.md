# PR: Spacepark Triptych — Zoo Kit + Gym Kit + Museum Kit

## Coat of Arms (Unified)

```
+--------------------------------------------------------------+
|   feat/primitives-zoo-refactor                               |
+--------------------------------------------------------------+
|                      *** MAJOR ***                           |
|                                                              |
|     +------------------+------------------+-----------+      |
|     | I Zoo Kit        | II Gym Kit       | III Museum|      |
|     | mullet x 2       | mullet x 1       | mullet x 1|     |
|     | bend x 1         | bend x 1         | bend x 1  |     |
|     | [ app ]          | [ app ]          | [ app ]   |      |
|     +------------------+------------------+-----------+      |
|                                                              |
|          pass  [========SHIELD========]  skip                |
|          tsc                               lint              |
|                                                              |
|             files: 45 | +3399 / -958                         |
+--------------------------------------------------------------+
|   "Per aspera ad astra"                                      |
+--------------------------------------------------------------+
```

**Compact:** *** [app] mullet×4 bend×3 book×1 per-chevron tsc:pass lint:skip test:pass build:skip +3399/-958

---

## Feature Space Index

| Index | Short Name | Full Name | Domain | Commits |
|-------|------------|-----------|--------|---------|
| I | Zoo Kit | Reusable zoo layout system + primitives gallery | app | 3 |
| II | Gym Kit | Reusable gym layout system + wiretap + state dashboard | app | 3 |
| III | Museum Kit | Reusable museum layout system + search + group headers | app | 3 |

## Cross-Space Dependencies

| From | To | Type |
|------|----|------|
| I Zoo Kit | II Gym Kit | Style factories (`tabStyle`, `sectionHeaderStyle`, `countStyle`) imported from `zoo-styles.ts` |
| I Zoo Kit | III Museum Kit | Style factories (`tabStyle`, `sectionHeaderStyle`, `countStyle`) imported from `zoo-styles.ts` |

---

## I. Zoo Kit — Reusable Component Catalog Layout

### Coat of Arms (Space I)

```
+--------------------------------------------------------------+
|   I  ZOO KIT                                                |
+--------------------------------------------------------------+
|                      ** MODERATE **                           |
|                   mullet x 2, bend x 1                       |
|                      [ app ]                                 |
|             files: 18 | +1454 / -153                         |
+--------------------------------------------------------------+
|   "Innovation through iteration"                             |
+--------------------------------------------------------------+
```

### Summary

Extracts a reusable `_zoo-kit` layout system from the primitives zoo page and rebuilds it as the flagship consumer. The kit provides category filtering, sorting, view mode toggling, a sticky prop inspector with live controls, URL hash deep-linking, and a declarative exhibit descriptor pattern. Six primitive exhibits including OrnateFrame's 6x4 pillar/variant matrix.

### Features

| Feature | Description | Status |
|---------|-------------|--------|
| ZooShell | Main orchestrator: header, filter bar, grid/list, inspector, keyboard nav, URL hash sync | Complete |
| ZooFilterBar | Category tabs + sort dropdown + grid/list toggle + exhibit count | Complete |
| ZooExhibitCard | Card (grid) and row (list) modes with preview and category badge | Complete |
| ZooInspector | Sticky right panel with PropPlayground controls and live preview | Complete |
| PropPlayground | Interactive controls from PropControl descriptors (checkbox, range, select, text, color) | Complete |
| 6 Exhibit descriptors | Panel, ProgressBar, IconBadge, StatLabel, Tooltip, OrnateFrame with full control sets | Complete |
| Style factories | `tabStyle`, `cardStyle`, `listRowStyle`, `inspectorStyle` — shared foundation | Complete |

---

## II. Gym Kit — Interactive Sandbox Layout with Wiretap

### Coat of Arms (Space II)

```
+--------------------------------------------------------------+
|   II  GYM KIT                                               |
+--------------------------------------------------------------+
|                      ** MODERATE **                           |
|                   mullet x 1, bend x 1                       |
|                      [ app ]                                 |
|             files: 13 | +1011 / -404                         |
+--------------------------------------------------------------+
|   "Innovation through iteration"                             |
+--------------------------------------------------------------+
```

### Summary

Extracts a reusable `_gym-kit` layout system for interactive sandboxes. Unlike zoos (which use typed descriptors), gyms use render-prop slots because each gym's controls are unique. The kit adds two features that didn't exist before: a live EventBus wiretap showing every event flowing through the system, and a live Zustand state dashboard with change highlighting.

### Features

| Feature | Description | Status |
|---------|-------------|--------|
| GymShell | Layout orchestrator: header + controls slot + viewport slot + bottom panels | Complete |
| GymProvider | EventBus creation + OculusProvider + store seeding boilerplate | Complete |
| GymControlPanel | Styled dark panel container for arbitrary control content | Complete |
| GymViewport | 60vh rendering area with configurable gradient and emoji watermark | Complete |
| GymWiretap | **NEW** Live EventBus event stream via `onAny()` — filterable, clearable, auto-scroll, pillar color dots, 200-entry ring buffer | Complete |
| GymStateDash | **NEW** Live Zustand store snapshot — watched keys with amber flash on change | Complete |
| HUD Sandbox refactor | 193 lines reduced to ~95 lines + gains wiretap and state panels | Complete |
| Battle Arena refactor | 219 lines reduced to ~140 lines + gains wiretap and state panels | Complete |
| Dendrite Observatory | Left unchanged (ReactFlow architecture, different pattern) | N/A |

---

## III. Museum Kit — Read-Only Exhibition Layout with Search

### Coat of Arms (Space III)

```
+--------------------------------------------------------------+
|   III  MUSEUM KIT                                            |
+--------------------------------------------------------------+
|                      ** MODERATE **                           |
|                   mullet x 1, bend x 1                       |
|                      [ app ]                                 |
|             files: 11 | +934 / -397                          |
+--------------------------------------------------------------+
|   "Innovation through iteration"                             |
+--------------------------------------------------------------+
```

### Summary

Extracts a reusable `_museum-kit` layout system for read-only exhibitions. Museums share the master-detail pattern with a filterable, searchable, grouped list. The kit adds text search and group section headers that didn't exist in the monolithic originals. Typed generics (`MuseumExhibitDescriptor<T>`) give each museum page type-safe access to its payload in `renderDetail`.

### Features

| Feature | Description | Status |
|---------|-------------|--------|
| MuseumShell | Layout orchestrator: header + filter bar + grouped list + sticky detail panel | Complete |
| MuseumFilterBar | Filter tabs with auto-counted items + text search input + visible count | Complete |
| MuseumExhibitRow | Clickable row with color dot, name, and inline badges | Complete |
| MuseumDetailPanel | Sticky right panel with footer slot for custom content | Complete |
| Text search | **NEW** Case-insensitive substring search across exhibit `searchText` fields | Complete |
| Group headers | **NEW** Section dividers grouping items by category (e.g. emitter/subscriber route) | Complete |
| Escape to close | Keyboard shortcut closes detail panel | Complete |
| Event Flow refactor | 188 lines reduced to ~90 lines, 29 events with grouped headers by route | Complete |
| Cross-Pillar refactor | 217 lines reduced to ~120 lines, pillars + flows as typed exhibits with pipeline footer | Complete |

---

## Files Changed (All Spaces)

```
apps/playground-oculus/app/
├── zoos/                                         ← SPACE I: Zoo Kit
│   ├── _zoo-kit/                                 ← Reusable zoo layout system
│   │   ├── types.ts                              ← ZooExhibitDescriptor, ZooPageConfig, PropControl
│   │   ├── zoo-styles.ts                         ← Shared style factories (also used by gym/museum)
│   │   ├── PropPlayground.tsx                    ← Interactive control renderer (5 types)
│   │   ├── ZooFilterBar.tsx                      ← Category tabs + sort + view toggle
│   │   ├── ZooExhibitCard.tsx                    ← Card/list-row wrapper with preview
│   │   ├── ZooInspector.tsx                      ← Sticky right panel with live preview
│   │   ├── ZooShell.tsx                          ← Main layout orchestrator
│   │   └── index.ts                              ← Barrel export
│   ├── primitives/
│   │   ├── exhibits/                             ← Per-primitive exhibit descriptors
│   │   │   ├── PanelExhibit.tsx                  ← Panel: boolean combos
│   │   │   ├── ProgressBarExhibit.tsx            ← ProgressBar: 5 variants + edge cases
│   │   │   ├── IconBadgeExhibit.tsx              ← IconBadge: sizes + pillar colors
│   │   │   ├── StatLabelExhibit.tsx              ← StatLabel: dense panel + colors
│   │   │   ├── TooltipExhibit.tsx                ← Tooltip: 4-position showcase
│   │   │   ├── OrnateFrameExhibit.tsx            ← OrnateFrame: 6x4 matrix
│   │   │   └── index.ts                          ← EXHIBIT_REGISTRY + categories + sort
│   │   ├── PrimitivesZooClient.tsx               ← Builds ZooPageConfig, renders ZooShell
│   │   └── page.tsx                              ← Thin server wrapper
│   └── page.tsx                                  ← Updated primitives description
├── gyms/                                         ← SPACE II: Gym Kit
│   ├── _gym-kit/                                 ← Reusable gym layout system
│   │   ├── types.ts                              ← GymPageConfig, WiretapEntry, GymSlots
│   │   ├── gym-styles.ts                         ← Style factories (imports zoo-kit universals)
│   │   ├── GymProvider.tsx                       ← EventBus + OculusProvider + seeding
│   │   ├── GymControlPanel.tsx                   ← Styled dark panel for controls
│   │   ├── GymViewport.tsx                       ← 60vh gradient area with watermark
│   │   ├── GymWiretap.tsx                        ← Live EventBus event stream (NEW)
│   │   ├── GymStateDash.tsx                      ← Live Zustand store snapshot (NEW)
│   │   ├── GymShell.tsx                          ← Main layout orchestrator
│   │   └── index.ts                              ← Barrel export
│   ├── hud-sandbox/
│   │   ├── HudSandboxGym.tsx                     ← Thin client using GymShell
│   │   └── page.tsx                              ← Thin server wrapper
│   ├── battle-arena/
│   │   ├── BattleArenaGym.tsx                    ← Thin client using GymShell
│   │   └── page.tsx                              ← Thin server wrapper
│   └── page.tsx                                  ← Updated descriptions
├── museums/                                      ← SPACE III: Museum Kit
│   ├── _museum-kit/                              ← Reusable museum layout system
│   │   ├── types.ts                              ← MuseumExhibitDescriptor<T>, MuseumPageConfig<T>
│   │   ├── museum-styles.ts                      ← Style factories (imports zoo-kit universals)
│   │   ├── MuseumFilterBar.tsx                   ← Filter tabs + text search + count
│   │   ├── MuseumExhibitRow.tsx                  ← Clickable row with dot, name, badges
│   │   ├── MuseumDetailPanel.tsx                 ← Sticky right panel with footer slot
│   │   ├── MuseumShell.tsx                       ← Main layout orchestrator
│   │   └── index.ts                              ← Barrel export
│   ├── event-flow/
│   │   ├── EventFlowMuseumClient.tsx             ← 29 events with group-by-route headers
│   │   └── page.tsx                              ← Thin server wrapper
│   ├── cross-pillar/
│   │   ├── CrossPillarMuseumClient.tsx           ← Pillars + flows with pipeline footer
│   │   └── page.tsx                              ← Thin server wrapper
│   └── page.tsx                                  ← Updated descriptions
docs/pr-descriptions/
└── PR_DESCRIPTION_PRIMITIVES_ZOO_REFACTOR.md     ← This file (updated for triptych)
```

## Commits (All Spaces)

1. `cbc201e` feat(playground): add reusable _zoo-kit layout system
2. `48425bb` feat(playground): add 6 primitive exhibit descriptors with controls
3. `8d69c00` refactor(playground): rewrite primitives zoo to use _zoo-kit
4. `a45c135` docs(pr): add PR description for primitives zoo refactor
5. `131307e` feat(playground): add reusable _gym-kit layout system
6. `f1e90a4` refactor(playground): rewrite gym pages to use _gym-kit
7. `7839423` feat(playground): add reusable _museum-kit layout system
8. `0b61c08` refactor(playground): rewrite museum pages to use _museum-kit
9. `d62ce30` docs(playground): update gym and museum landing page descriptions

## Test Plan

- [x] `bunx tsc --noEmit` — zero new errors in `_gym-kit/`, `_museum-kit/`, gym pages, museum pages
- [x] `bun test packages/oculus` — 30 pass, 0 fail (no regressions)
- [x] Dendrite Observatory (`/gyms/dendrite`) — untouched
- [x] All zoo pages — untouched
- [ ] `/zoos/primitives` — all 6 primitives rendered, filtering/sorting/inspector work
- [ ] `/gyms/hud-sandbox` — HUD renders, sliders work, wiretap shows events, state dashboard updates live
- [ ] `/gyms/battle-arena` — combat flow works, wiretap shows combat events
- [ ] Wiretap filters by event type, Clear empties log
- [ ] State dashboard amber flash on value change
- [ ] `/museums/event-flow` — all 29 events listed with group headers by route
- [ ] `/museums/cross-pillar` — pillar selector + flow cards, pipeline footer
- [ ] Museum search: typing "HEALTH" filters to matching events
- [ ] Museum filter tabs: All / OCULUS Handled counts match
- [ ] Clicking museum item opens sticky detail panel
- [ ] Keyboard: Escape closes museum detail panel
