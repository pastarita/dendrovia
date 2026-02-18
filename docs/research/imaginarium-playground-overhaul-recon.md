# IMAGINARIUM Playground Overhaul — Reconnaissance Report

> **Date:** 2026-02-17
> **Scope:** Full archaeology of `@dendrovia/imaginarium` package evolution, cross-pillar playground comparison, and gap analysis for playground app overhaul.

---

## 1. Executive Summary

The `@dendrovia/imaginarium` package is the richest unexhibited pillar in Dendrovia. Across 47+ commits, 7 merged PRs, and 4 days of development, it has grown into an 8-subsystem pipeline — but its playground app (`apps/playground-imaginarium/`) only surfaces one domain (Museums, with 4 exhibits). Its **hero domain** (Generators, affinity 5) and **featured domain** (Zoos, affinity 4) remain empty stubs.

**The core problem:** Rich engine, empty storefront.

---

## 2. Package Inventory — What IMAGINARIUM Actually Has

### 2.1 Subpath Exports (9 public entry points)

| Export | Module | Purpose |
|--------|--------|---------|
| `.` | `src/index.ts` | Barrel re-export |
| `./distillation` | `src/distillation/index.ts` | Color, L-System, Turtle, Noise, SDF |
| `./generation` | `src/generation/index.ts` | AI art prompt building + generation |
| `./cache` | `src/cache/DeterministicCache.ts` | SHA-256 keyed deterministic cache |
| `./fallbacks` | `src/fallback/index.ts` | Default palettes + SDFs |
| `./utils/color` | `src/utils/color.ts` | OKLCH color math |
| `./utils/glsl` | `src/utils/glsl.ts` | GLSL string helpers |
| `./mycology` | `src/mycology/index.ts` | Fungal taxonomy system |
| `./storyarc` | `src/storyarc/index.ts` | Narrative arc derivation |
| `./mesh-runtime` | `src/mesh-runtime/index.ts` | Browser-safe mesh utilities |

### 2.2 Subsystem Map

```
IMAGINARIUM Package
├── Distillation Core (5 modules)
│   ├── ColorExtractor      — image/topology → palette
│   ├── LSystemCompiler     — topology → L-System rules
│   ├── TurtleInterpreter   — L-System string → 3D geometry
│   ├── NoiseGenerator      — procedural noise functions
│   └── SDFCompiler         — topology → GLSL SDF code
│
├── Mycology System (7 modules + 3 asset generators)
│   ├── GenusMapper         — code pattern → fungal genus (20 genera)
│   ├── MorphologyGenerator — code metrics → mushroom shape
│   ├── MycelialNetwork     — dependency graph → mycelium model
│   ├── LoreGenerator       — specimen → narrative lore
│   ├── SpecimenCatalog     — collection management
│   ├── MycologyPipeline    — sub-pipeline orchestrator
│   └── Assets: SvgTemplates, MushroomSprite.tsx, MeshGenerator
│
├── Mesh Pipeline (6 modules + 3 ops)
│   ├── HalfEdgeMesh        — topology data structure
│   ├── pipeline.ts         — composable operation chain
│   ├── serialize.ts        — binary asset serialization
│   ├── adapters.ts         — rendering format bridges
│   ├── genusPipelines.ts   — per-genus mesh configs
│   ├── generateMeshAssets  — pipeline integration
│   └── Ops: subdivide, smooth, displace
│
├── Story Arc Engine (4 modules)
│   ├── StoryArcDeriver     — topology → narrative arc
│   ├── MoodMapper          — code metrics → atmosphere
│   ├── PhaseAssigner       — region → story phase
│   └── SegmentSlicer       — arc → spatial segments
│
├── Shader System (1 module + 3 templates)
│   ├── ShaderAssembler     — template composition
│   └── Templates: raymarcher.glsl, sdf-library.glsl, lighting.glsl
│
├── Pipeline Orchestration (6 modules)
│   ├── DistillationPipeline — main orchestrator
│   ├── ManifestGenerator    — asset manifest builder
│   ├── SegmentPipeline      — spatial segmentation
│   ├── SegmentPlacementPrecomputer — pre-computed placements
│   ├── TopologyChunker      — spatial partitioning
│   └── VariantGenerator     — procedural variations
│
├── Deterministic Cache
│   └── DeterministicCache.ts — SHA-256 keyed, build-reproducible
│
└── Fallback System
    ├── DefaultPalettes.ts   — pre-built color schemes
    └── DefaultSDFs.ts       — generic SDF shapes
```

### 2.3 Test Coverage

**275+ tests** across 25 files:

| Category | Files | Tests |
|----------|-------|-------|
| Core distillation | 7 | ~87 |
| Mycology | 6 | ~94 |
| Mesh pipeline | 3 | ~50+ |
| Story arc | 5 | ~25+ |
| Integration | 2 | ~15+ |
| Color/GLSL utils | 2 | ~15+ |

Known issue: 3 pre-existing failures in `__tests__/mycology/catalog.test.ts`.

---

## 3. Merged PR Timeline

| PR | Date | Description | Impact |
|----|------|-------------|--------|
| #7 | Feb 13 | Mycology system: 20 genera, asset pipeline, 94 tests | New subsystem |
| #15 | Feb 13 | Mesh pipeline: half-edge, ops, serialization | New subsystem |
| #32 | Feb 15 | Museums page: 4 exhibit tabs | Playground content |
| #40 | Feb 15 | Story arc + segment pipeline + Zod contracts | New subsystem |
| #47 | Feb 16 | Deterministic cache wiring + SDF backdrop | Cross-pillar integration |
| #50 | Feb 16 | Fix flaky cache timing test | Stability |
| #81 | Feb 16 | Browser mesh-runtime + world segmentation | Runtime capability |

---

## 4. Playground App — Current State

### 4.1 IMAGINARIUM Domain Map

| Domain | Affinity | Status | Content |
|--------|----------|--------|---------|
| **Generators** | **5 (HERO)** | **STUB** | "Coming soon" |
| **Zoos** | **4 (Featured)** | **STUB** | "Coming soon" |
| **Museums** | 3 | IMPLEMENTED | 4 exhibits (Palette, Shader, Pipeline, Mycology) |
| **Gyms** | 3 | PARTIAL | Dendrite Observatory only (shared) |
| Halls | 2 | STUB | "Coming soon" |
| Foundry | 2 | STUB | "Coming soon" |
| Spatial Docs | 1 | STUB | "Coming soon" |

### 4.2 What Museums Has (the one implemented domain)

- **PaletteExhibit** — Language palettes, OKLCH color space detail, real `DEFAULT_PALETTES` and `hexToOklch`
- **ShaderExhibit** — 5 SDF tiers with GLSL syntax highlighting, instruction counting
- **PipelineExhibit** — 8-stage distillation pipeline visualization
- **MycologyExhibit** — Fungal specimens with taxonomy, morphology, lore; server-side computation via `@dendrovia/imaginarium`

---

## 5. Cross-Pillar Comparison

### 5.1 Feature Coverage Matrix

| Pillar | Gens | Zoos | Museums | Gyms | Halls | Spatial | Foundry | Total Domains |
|--------|------|------|---------|------|-------|---------|---------|---------------|
| **LUDUS** | DEEP | DEEP | DEEP | DEEP | DEEP | IMPL | - | **6/7** |
| **OCULUS** | - | DEEP | IMPL | DEEP | - | - | IMPL | **4/7** |
| **OPERATUS** | - | IMPL | IMPL | DEEP | - | - | - | **3/7** |
| **CHRONOS** | - | DEEP | - | IMPL | - | - | - | **2/7** |
| **ARCHITECTUS** | - | IMPL | IMPL | IMPL | - | - | - | **3/7** |
| **IMAGINARIUM** | - | - | IMPL | partial | - | - | - | **1/7** |

### 5.2 Component Count by Pillar

| Pillar | TSX Files | Sub-Pages | Kit Infrastructure |
|--------|-----------|-----------|-------------------|
| OCULUS | 48 | 9+ | _gym-kit, _zoo-kit, _museum-kit |
| OPERATUS | 40 | 8+ | per-gym components |
| LUDUS | 38+ | 6+ | per-domain clients |
| CHRONOS | 22 | 8 (zoos) | - |
| ARCHITECTUS | 16 | 3 | - |
| **IMAGINARIUM** | **18** | **0** | **none** |

### 5.3 Hero Domain Implementation Depth

Every pillar with an affinity-5 domain has deep implementation **except IMAGINARIUM**:

| Pillar | Hero Domain | What They Built |
|--------|-------------|-----------------|
| ARCHITECTUS | Gyms (5) | L-System Sandbox + parameter panel, live 3D |
| CHRONOS | Gyms (5) | AnalyzeClient, interactive repo analysis |
| LUDUS | Gyms (5) | Combat Simulator + Monte Carlo Balance Sim |
| OCULUS | Zoos (5) + Foundry (5) | 4 zoo sub-pages (6 primitive exhibits), Frame Matrix (24 combos) |
| OPERATUS | Halls (5) | _(not yet implemented)_ |
| **IMAGINARIUM** | **Generators (5)** | **Empty stub** |

---

## 6. Gap Analysis — What IMAGINARIUM Needs

### 6.1 Critical Gaps

**A. Generators (hero domain) — completely empty**

The package has exactly the modules that should power this:
- `ColorExtractor` → **Palette Generator**
- `SDFCompiler` → **SDF Generator**
- `LSystemCompiler` + `TurtleInterpreter` → **L-System Compiler**
- `NoiseGenerator` → **Noise Function Designer**
- `MycologyPipeline` → **Specimen Generator**

**B. Zoos (featured domain) — completely empty**

The package has catalogs and fallbacks ready to display:
- `DefaultPalettes` → **Palette Catalog**
- `DefaultSDFs` → **SDF Catalog**
- `SpecimenCatalog` → **Mycology Bestiary**
- `ShaderAssembler` templates → **Shader Zoo**
- `LSystemCompiler` rules → **L-System Rule Browser**

**C. No pillar-specific Gyms**

Interactive sandboxes that should exist:
- **Shader Live Editor** — edit GLSL, see raymarched output
- **Palette Mixer** — OKLCH color space manipulation
- **SDF Sculptor** — combine SDF primitives visually
- **Noise Tuner** — parameter-driven noise visualization

### 6.2 Moderate Gaps

- No `*Client.tsx` wrappers (LUDUS has one per domain)
- No sub-page depth (CHRONOS Zoos has 8 sub-routes)
- No kit infrastructure (OCULUS has reusable shells per domain)
- No server-side data patterns for most domains (only Museums)

### 6.3 What IMAGINARIUM Does Well (preserve this)

- Museums exhibits pull from **real package code** — not mock data
- Server-side `computeSpecimens()` is a good pattern
- GLSL syntax highlighting in ShaderExhibit
- OKLCH color science display in PaletteExhibit
- Pipeline visualization maps the actual 8-stage distillation

---

## 7. OCULUS Deep Recon — Architecture Analysis

### 7.1 Vital Statistics

| Metric | OCULUS | IMAGINARIUM |
|--------|--------|-------------|
| Playground TS/TSX files | 62 | 18 |
| Package TS/TSX files | 40 | ~35 |
| Sub-pages | 9+ | 0 |
| Kit infrastructure files | 24 (across 3 kits) | 0 |
| Dev port | 3015 | 3013 |
| Pillar tincture | Vert (#22C55E) | Purpure (#A855F7) |
| Active refactoring branch | `feat/oculus-layered-tokens` | none |

### 7.2 The Three Kits — Architecture in Detail

OCULUS's core innovation is the **kit system**: three reusable layout systems in `_`-prefixed directories (Next.js non-route convention).

#### Zoo Kit (`_zoo-kit/` — 8 files)

**Pattern: Descriptor-driven catalog.**

Pages declare exhibits as `ZooExhibitDescriptor[]` with metadata (name, icon, category, complexity, tags, propCount). The kit handles everything else:

- `ZooShell` — Orchestrator (254 lines): filter/sort state, control values reducer, URL hash sync, keyboard navigation, responsive breakpoint
- `ZooFilterBar` — Category tabs + sort + view mode toggle
- `ZooExhibitCard` — Dual-mode (grid card or list row), renders exhibit inline as live preview
- `ZooInspector` — Sticky right panel with PropPlayground controls + live preview
- `PropPlayground` — Universal control renderer for 5 types: boolean, range, select, text, color

**Key decisions:**
- Descriptor-driven, not render-prop — exhibits are self-contained metadata objects
- `useReducer` manages per-exhibit control state independently
- URL hash sync for deep-linking to specific exhibits
- Arrow key navigation, Escape to deselect

#### Gym Kit (`_gym-kit/` — 9 files)

**Pattern: Render-prop slots with isolated EventBus.**

Gyms use `children: (props: { eventBus }) => GymSlots` where `GymSlots = { controls: ReactNode, viewport: ReactNode }`. This is because gym controls are tightly coupled to their EventBus logic.

- `GymProvider` — Creates isolated `EventBus(true)` per gym page, wraps in OculusProvider
- `GymShell` — Layout: header, controls slot, viewport slot, bottom wiretap+state panels
- `GymControlPanel` — Dark panel container
- `GymViewport` — 60vh rendering area with gradient watermark
- `GymWiretap` — Live EventBus event stream (200-entry ring buffer, pillar color dots, filter by name)
- `GymStateDash` — Live Zustand snapshot (configurable watched keys, amber flash on change)

**Key decisions:**
- Render-prop slots (not descriptors) because controls need tight EventBus coupling
- Isolated EventBus per gym prevents cross-page event leakage
- `useGymEventBus()` hook provides deep child access
- Pillar-aware wiretap maps event prefixes to pillar colors
- Configurable state dashboard per gym

#### Museum Kit (`_museum-kit/` — 7 files)

**Pattern: Generic typed master-detail exhibition.**

- `MuseumShell` — Orchestrator: filtering, text search, grouping, master-detail grid
- `MuseumFilterBar` — Filter tabs with auto-counted badges + search
- `MuseumExhibitRow` — Color dot + name + badges
- `MuseumDetailPanel` — Sticky right panel with optional footer slot

**Key decisions:**
- `MuseumExhibitDescriptor<T>` is generic — type-safe data payloads flow through to render-prop detail functions
- Items grouped by `group` field with preserved order
- Predicate-based filters (more flexible than category matching)
- `searchText` combines all searchable content for substring matching

### 7.3 Style Architecture

The kits form a dependency chain:

```
zoo-styles.ts (BASE)
  → tabStyle, cardStyle, listRowStyle, inspectorStyle, sectionHeaderStyle,
    categoryBadgeStyle, emptyStateStyle, countStyle

gym-styles.ts (EXTENDS zoo-styles)
  → Re-exports tabStyle, sectionHeaderStyle, countStyle
  → Adds: controlPanelStyle, viewportStyle, wiretapStyles, stateDashStyles

museum-styles.ts (EXTENDS zoo-styles)
  → Re-exports tabStyle, sectionHeaderStyle, countStyle
  → Adds: exhibitRowStyle, detailPanelStyle, groupHeaderStyle, searchStyles
```

All styles are **inline CSSProperties** via factory functions — no CSS modules, no Tailwind. Deliberate "framework-agnostic" choice.

### 7.4 Package ↔ Playground Boundary

| Concern | Lives In | Why |
|---------|----------|-----|
| UI primitives, components, hooks, Zustand store | `packages/oculus/` | Production code, consumed by quest app |
| Kit infrastructure (ZooShell, GymShell, MuseumShell) | `apps/playground-oculus/` | Dev tooling, not shipped |
| Mock data, PlaygroundProvider | `apps/playground-oculus/` | Testing fixtures |
| Domain page content (descriptors, catalogs) | `apps/playground-oculus/` | Playground-specific |

**The kits are NOT in the package.** They are playground-local infrastructure. This is deliberate: kits are dev tools for exercising components, not production code.

### 7.5 @dendrovia/oculus Package Internals

The package exports a rich runtime system:

- **OculusProvider** — EventBus + Zustand store wrapper
- **useOculusStore** — 30+ state fields, 25+ actions (HUD, combat, quests, loot, code navigation, world meta, performance)
- **13 components** — HUD, Minimap, BattleUI, QuestLog, MillerColumns (virtualized), CodeReader, StatusEffectBar, LootPanel, FalconModeOverlay, WelcomeScreen, etc.
- **6 primitives** — Panel, ProgressBar, IconBadge, StatLabel, Tooltip, OrnateFrame (24 pillar x variant combinations)
- **5 hooks** — useEventSubscriptions, useKeyboardShortcuts, useInputCapture, useCodeLoader, useOnboarding
- **Frame system** — Per-pillar frame renderers, FRAME_REGISTRY, PILLAR_PALETTES

### 7.6 Active Refactoring: Layered Tokens Branch

`feat/oculus-layered-tokens` (not yet merged) is actively refactoring OCULUS:

1. **Primitive token layer** — color, spacing, timing design tokens
2. **Semantic token layer** — surfaces, text, borders, pillar tinctures
3. **Component token layer** — panel, button, progress "recipes"
4. Rewrote `tokens.css` as barrel with backwards-compat aliases
5. Replaced ~25 hardcoded values

This signals OCULUS is **mid-refactor** on its design token system. IMAGINARIUM should be aware but not blocked by this.

### 7.7 OCULUS Evolution Phases

| Phase | What Happened |
|-------|---------------|
| 1. Scaffold | SpacePark domain routes, basic 6-domain structure |
| 2. Zoo-kit | Created first kit, 6 primitive exhibits, descriptor pattern |
| 3. Gym + Museum kits | Built remaining kits, rewrote pages to use them |
| 4. Frame System | FrameSpecimen, Frame Zoo, FRAME_REGISTRY, Foundry Frame Matrix |
| 5. Layered Tokens | Design token refactoring (in progress, not merged) |

---

## 8. Parity vs Differentiation Analysis

### 8.1 What to Adopt from OCULUS (Parity)

| Pattern | Rationale |
|---------|-----------|
| **Kit-as-Shell pattern** | Battle-tested across 3 modalities. Provides consistent UX. |
| **`_kit/` directory convention** | Next.js non-route convention works well. |
| **Style factory functions** | Inline CSSProperties via factories avoids build tooling. |
| **Sub-page routes** | Better than tab-only for deep linking and URL sharing. |
| **Descriptor pattern for Zoos** | IMAGINARIUM's catalog data (palettes, SDFs, L-systems) maps well to descriptors. |

### 8.2 Where to Differentiate from OCULUS

| OCULUS Pattern | IMAGINARIUM Need | Differentiation |
|----------------|------------------|-----------------|
| GymProvider with EventBus | IMAGINARIUM has no EventBus (build-time-only) | **DistillationProvider** — wraps pipeline params + computed output state |
| GymViewport (60vh empty area + watermark) | IMAGINARIUM needs actual rendering | **ShaderViewport** — WebGL canvas running raymarched SDF preview |
| GymWiretap (EventBus stream) | No EventBus to wiretap | **PipelineTrace** — shows distillation pipeline step-by-step output |
| ZooExhibitCard (React component preview) | IMAGINARIUM exhibits are shaders/math | **ShaderCard** — WebGL thumbnail preview of SDF output |
| PropPlayground (boolean/range/select/text/color) | IMAGINARIUM needs GLSL-aware controls | **DistillationControls** — topology params, complexity sliders, seed inputs, OKLCH pickers |
| MuseumDetailPanel (static data) | IMAGINARIUM data is generated | **ComputedDetailPanel** — shows generation parameters + computed output |

### 8.3 Unique IMAGINARIUM Capabilities No Other Pillar Has

1. **Computational output** — IMAGINARIUM *creates artifacts* (shaders, meshes, palettes). Other playgrounds display or simulate. The Generator domain should emphasize **create → preview → export**.

2. **GLSL as first-class citizen** — No other playground renders shaders. A `ShaderViewport` component with live WebGL raymarching would be unique.

3. **Build-time pipeline made interactive** — The distillation pipeline runs at build-time in production. The playground should let users **tweak parameters and see distillation results live**.

4. **Cross-pillar output chain** — IMAGINARIUM's output feeds ARCHITECTUS and OPERATUS. The playground could visualize the downstream consumption.

5. **Mycology domain** — No other pillar has a biological taxonomy system. The Mycology Bestiary could be a unique exhibit format.

---

## 9. Strategic Recommendation: Option C — Hybrid

### The Approach

**Adopt kit shells for structural consistency. Build domain-specific widgets within them.**

```
IMAGINARIUM Playground Architecture
├── _distill-kit/              ← NEW: IMAGINARIUM-specific infrastructure
│   ├── types.ts               — DistillationConfig, GeneratorDescriptor, etc.
│   ├── DistillationProvider.tsx — Pipeline params + computed state management
│   ├── ShaderViewport.tsx     — WebGL canvas for SDF raymarching preview
│   ├── PipelineTrace.tsx      — Step-by-step distillation output viewer
│   ├── DistillationControls.tsx — Topology params, seed, complexity sliders
│   └── distill-styles.ts      — Style factories (extends zoo-styles pattern)
│
├── _zoo-kit/                  ← PORT from OCULUS with minor adaptations
│   ├── ZooShell.tsx           — Descriptor-driven catalog (same pattern)
│   ├── ZooFilterBar.tsx       — Category tabs + sort
│   ├── ZooExhibitCard.tsx     — Adapted for shader/palette thumbnails
│   ├── ZooInspector.tsx       — Adapted for GLSL/color detail views
│   └── PropPlayground.tsx     — Extended with OKLCH color picker
│
├── _museum-kit/               ← PORT from OCULUS (minimal changes)
│   └── (same structure)
│
├── generators/                ← HERO DOMAIN (affinity 5)
│   ├── page.tsx               — Landing with 4-5 generator sub-pages
│   ├── palette/               — Palette Generator (ColorExtractor interactive)
│   ├── sdf/                   — SDF Generator (SDFCompiler interactive)
│   ├── lsystem/               — L-System Compiler (interactive turtle graphics)
│   ├── noise/                 — Noise Function Designer
│   └── specimen/              — Mycology Specimen Generator
│
├── zoos/                      ← FEATURED DOMAIN (affinity 4)
│   ├── page.tsx               — Landing with 4 zoo sub-pages
│   ├── shaders/               — Shader catalog (DefaultSDFs + generated)
│   ├── palettes/              — Palette catalog (DefaultPalettes + language hues)
│   ├── lsystems/              — L-System rule browser
│   └── mycology/              — Mycology bestiary (20 genera)
│
├── gyms/                      ← SANDBOX DOMAIN (affinity 3)
│   ├── page.tsx               — Landing with 3 gym sub-pages
│   ├── shader-lab/            — Live GLSL editor with ShaderViewport
│   ├── palette-mixer/         — OKLCH color space manipulator
│   └── dendrite/              — Shared Dendrite Observatory
│
├── museums/                   ← EXISTING (enhance, don't rewrite)
│   └── (keep current 4 exhibits, add sub-page routing)
│
└── halls/                     ← LOW PRIORITY
    └── page.tsx               — Pipeline reference docs
```

### Why Hybrid

| Factor | Pure Parity (A) | Pure Domain-Native (B) | Hybrid (C) |
|--------|-----------------|------------------------|------------|
| UX consistency | Best | Worst | Good |
| Domain fit | Poor | Best | Good |
| Dev velocity | Fast (copy-paste) | Slow (from scratch) | Moderate |
| Maintenance | Easy (shared patterns) | Hard (unique) | Balanced |
| Differentiation | None | Maximum | Targeted |

### The `_distill-kit/` Difference

OCULUS's three kits serve three modalities (catalog, sandbox, exhibition). IMAGINARIUM adds a fourth modality: **distillation** — the computational generation pattern. The `_distill-kit/` encapsulates:

- Pipeline parameter management (topology config, seed, complexity level)
- Computed output state (palette, SDF, L-system, noise, mesh)
- Shader preview rendering (WebGL viewport)
- Pipeline execution tracing (step-by-step output)

This kit would be consumed by both Generators (interactive creation) and Gyms (live experimentation).

---

## 10. Implementation Priority

| Phase | Domain | Scope | Est. Files |
|-------|--------|-------|------------|
| **P1** | Generators (hero) | 5 generator sub-pages + `_distill-kit/` | ~25 |
| **P2** | Zoos (featured) | 4 catalog sub-pages + `_zoo-kit/` port | ~15 |
| **P3** | Gyms | 2 new gym sub-pages (shader-lab, palette-mixer) | ~10 |
| **P4** | Museums | Add sub-page routing, enhance exhibits | ~5 |
| **P5** | Halls | Pipeline reference docs | ~5 |

**Total estimated new files: ~60** (matching OCULUS's scale)

---

## 11. Risk Assessment

| Risk | Mitigation |
|------|------------|
| WebGL ShaderViewport complexity | Start with static GLSL display, add WebGL incrementally |
| OCULUS token refactoring in progress | Don't depend on OCULUS tokens; use IMAGINARIUM's own pillar tincture (#A855F7) |
| Zoo-kit assumptions may not fit shader catalogs | Extend `ZooExhibitDescriptor` with optional `previewType: 'component' \| 'shader' \| 'palette'` |
| Build-time modules imported in browser | Use `./mesh-runtime` subpath export pattern; keep heavy computation server-side |
| Kit extraction to @repo/ui temptation | Resist. OCULUS deliberately keeps kits playground-local. Follow same pattern. |

---

## 12. Open Questions

1. **Should `_distill-kit/` be shared across pillar playgrounds?** Other pillars might want computational preview — but IMAGINARIUM should build it first, then evaluate extraction.

2. **Tab-based vs route-based sub-pages for Generators?** OCULUS uses routes. IMAGINARIUM's Museums currently use tabs. Recommendation: routes for Generators (deeper content), keep tabs for Museums (lighter content).

3. **Server-side vs client-side computation?** Museums already uses server-side `computeSpecimens()`. Generators might need client-side for interactivity. Consider: server-side for initial render, client-side for parameter tweaks.

4. **Relationship to quest app?** The playground is a dev tool. But some Generator UIs (palette picker, SDF composer) could eventually migrate to the quest app. Design with portability in mind.

---

## 13. OCULUS New Direction — Shared UI Evolution (Uncommitted)

> **Source:** 33 uncommitted files in `/Users/Patmac/denroot/OCULUS/dendrovia/` working tree, Feb 17 2026.

### 13.1 New Shared UI Components (`packages/ui/src/`)

The OCULUS checkout has evolved the shared UI package with 5 new files and 3 enhanced files that IMAGINARIUM's copy doesn't have yet.

**New files:**

| File | Purpose |
|------|---------|
| `sidebar-provider.tsx` | `SidebarContext` — collapsed/expanded state, localStorage persistence |
| `pillar-context.tsx` | `PillarProvider` — pillar metadata + `unifiedMode` flag for routing |
| `collapsible-sidebar.tsx` | Animated sidebar (260px ↔ 52px) with cubic-bezier transition |
| `domain-sub-nav.tsx` | Sticky horizontal tab bar for sub-pages within a domain |
| `pillar-data.tsx` | `PILLAR_META` constant with hex, hexDim, tincture, port, emoji, subtitle |

**Enhanced files:**

| File | Additions |
|------|-----------|
| `domain-registry.tsx` | `DomainSubPage` interface, `DOMAIN_SUB_PAGES` partial record, `getSubPages()`, `getDefaultSubPage()` |
| `pillar-nav.tsx` | `usePillarMaybe()` + `useSidebarMaybe()`, collapsed icon-rail mode, unified routing, `ReconDot` |
| `domain-nav.tsx` | Collapsed icon-rail mode, unified routing via pillar context |

### 13.2 The Sub-Page Pattern

OCULUS is establishing a new navigation model:

```
BEFORE (card-grid landing):
  /zoos → Full domain page with "Coming soon" or card grid

AFTER (redirect + sub-nav + layout):
  /zoos/page.tsx → redirect("/zoos/primitives")
  /zoos/layout.tsx → <DomainSubNav domain="zoos" /> + {children}
  /zoos/primitives/page.tsx → actual content
  /zoos/frames/page.tsx → actual content
```

Each domain gets:
1. A `page.tsx` that redirects to the first sub-page
2. A `layout.tsx` wrapping children with `DomainSubNav`
3. Sub-page routes with actual content

### 13.3 DOMAIN_SUB_PAGES Registry (OCULUS entries only)

```typescript
OCULUS: {
  zoos: [Primitives, Views, Compositions, Frames],      // 4 sub-pages
  museums: [Event Flow, Cross-Pillar],                    // 2 sub-pages
  gyms: [Dendrite, HUD Sandbox, Battle Arena],           // 3 sub-pages
  foundry: [Frame Matrix],                                // 1 sub-page
}
```

### 13.4 In-Progress Signals

The OCULUS refactor is **mid-flight**:
- Root `app/layout.tsx` still uses static `<nav>` sidebar — `CollapsibleSidebar` not yet wired in
- Two parallel registries exist: shared `DOMAIN_SUB_PAGES` AND local `app/components/domain-pages.ts`
- Zoos layout imports from local `../components/DomainSubNav`, not the shared UI version
- `PillarProvider` and `SidebarProvider` exist but aren't in the layout tree yet

### 13.5 Shared UI Drift Matrix

| Component | IMAGINARIUM (main) | OCULUS (uncommitted) | Delta |
|-----------|-------------------|---------------------|-------|
| `domain-registry.tsx` | Base (no sub-pages) | +DomainSubPage, +DOMAIN_SUB_PAGES, +getSubPages | **Major** |
| `pillar-nav.tsx` | Static, always expanded | Collapsed mode, unified routing, ReconDot | **Major** |
| `domain-nav.tsx` | Search/expand, no collapse | +Collapsed icon-rail, +unified routing | **Moderate** |
| `sidebar-provider.tsx` | Missing | New | **New file** |
| `pillar-context.tsx` | Missing | New | **New file** |
| `collapsible-sidebar.tsx` | Missing | New | **New file** |
| `domain-sub-nav.tsx` | Missing | New | **New file** |
| `pillar-data.tsx` | Missing | New | **New file** |

---

## 14. Updated Strategy: Adapt + Pioneer

### 14.1 Sequencing Principle

> **Don't copy uncommitted OCULUS code. Build content now, wire in shared patterns later.**

The shared UI evolution (sidebar, pillar context, domain sub-nav) will land on main via an OCULUS PR. IMAGINARIUM should:
1. Build domain page **content** and **kits** now (independent of shared UI changes)
2. Use the redirect + layout + sub-page **pattern** (it's the right architecture regardless)
3. Adopt shared UI components when they land on main via rebase

### 14.2 Proposed IMAGINARIUM Sub-Pages

```typescript
IMAGINARIUM: {
  generators: [                                          // Hero domain (affinity 5)
    { name: "Palette Generator",   shortName: "Palettes",  slug: "palette" },
    { name: "SDF Generator",       shortName: "SDF",       slug: "sdf" },
    { name: "L-System Compiler",   shortName: "L-Systems", slug: "lsystem" },
    { name: "Noise Designer",      shortName: "Noise",     slug: "noise" },
    { name: "Specimen Generator",  shortName: "Specimens", slug: "specimen" },
  ],
  zoos: [                                                // Featured domain (affinity 4)
    { name: "Shader Catalog",      shortName: "Shaders",   slug: "shaders" },
    { name: "Palette Catalog",     shortName: "Palettes",  slug: "palettes" },
    { name: "L-System Rules",      shortName: "L-Systems", slug: "lsystems" },
    { name: "Mycology Bestiary",   shortName: "Bestiary",  slug: "bestiary" },
  ],
  museums: [                                             // Keep existing, add routing
    { name: "Palette Exhibition",  shortName: "Palettes",  slug: "palettes" },
    { name: "Shader Exhibition",   shortName: "Shaders",   slug: "shaders" },
    { name: "Pipeline Exhibition", shortName: "Pipeline",  slug: "pipeline" },
    { name: "Mycology Exhibition", shortName: "Mycology",  slug: "mycology" },
  ],
  gyms: [                                                // Sandbox domain (affinity 3)
    { name: "Shader Lab",          shortName: "Shader Lab",    slug: "shader-lab" },
    { name: "Palette Mixer",       shortName: "Palette Mixer", slug: "palette-mixer" },
    { name: "Dendrite Observatory", shortName: "Dendrite",     slug: "dendrite" },
  ],
}
```

### 14.3 Engine → Sub-Page Mapping

| Engine Module | Target Sub-Page | Domain |
|--------------|----------------|--------|
| `ColorExtractor` + `DefaultPalettes` | generators/palette | Generators |
| `SDFCompiler` + `DefaultSDFs` | generators/sdf | Generators |
| `LSystemCompiler` + `TurtleInterpreter` | generators/lsystem | Generators |
| `NoiseGenerator` | generators/noise | Generators |
| `MycologyPipeline` | generators/specimen | Generators |
| `DefaultSDFs` + `ShaderAssembler` | zoos/shaders | Zoos |
| `DefaultPalettes` + `LANGUAGE_HUES` | zoos/palettes | Zoos |
| `LSystemCompiler` rules | zoos/lsystems | Zoos |
| `SpecimenCatalog` + `MushroomSprite` | zoos/bestiary | Zoos |
| `ShaderAssembler` + `VariantGenerator` | gyms/shader-lab | Gyms |
| `harmonize` + `colorTemperature` | gyms/palette-mixer | Gyms |
| `@dendrovia/dendrite` (ReactFlow) | gyms/dendrite | Gyms |
| Existing 4 tab exhibits | museums/* | Museums |
| `StoryArcDeriver` + `MoodMapper` | museums/story-arc (future) | Museums |

### 14.4 Implementation Phases (Revised)

| Phase | Domain | Files | Depends On OCULUS? |
|-------|--------|-------|--------------------|
| **P0** | Shared: `_distill-kit/` + domain-pages local registry | ~8 | No |
| **P1** | Generators (hero): 5 sub-pages using `_distill-kit/` | ~15 | No |
| **P2** | Zoos (featured): 4 sub-pages using `_zoo-kit/` port | ~12 | No |
| **P3** | Museums: Refactor tabs → routes | ~6 | No |
| **P4** | Gyms: 2 new sub-pages + existing dendrite | ~8 | No |
| **P5** | Wire in shared UI: CollapsibleSidebar, PillarContext, DomainSubNav | ~3 | **Yes — wait for main** |

### 14.5 Risk Update

| Risk | Status | Mitigation |
|------|--------|------------|
| OCULUS shared UI changes break IMAGINARIUM | **Elevated** — 8 files diverged | Build content independently, wire shared UI in P5 |
| Dual registry (shared vs local) | **New** — OCULUS has same issue | Use local `domain-pages.ts` initially, merge to shared when pattern stabilizes |
| Collapsible sidebar requires Provider refactoring | **New** — layout.tsx will need rework | Defer to P5, keep static sidebar for now |

---

_Report updated with OCULUS new direction analysis. Ready for implementation planning._
