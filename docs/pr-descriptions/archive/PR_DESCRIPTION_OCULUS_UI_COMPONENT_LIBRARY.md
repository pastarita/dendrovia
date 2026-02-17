# PR: Implement OCULUS Pillar — Full UI Component Library

## Coat of Arms

```
+--------------------------------------------------------------+
|   oculus/implement-ui-component-library                      |
+--------------------------------------------------------------+
|                        MAJOR (***)                            |
|                                                              |
|          pass  [PER-PALE: Vert|Tenné]  pass                 |
|              mullet x 5  hammer x 1  book x 1               |
|                                                              |
|                  [oculus|docs]                                |
|                                                              |
|           files: 31 | +3672 / -15                            |
+--------------------------------------------------------------+
|   "Per aspera ad astra"                                      |
|   — Through hardship to the stars                            |
+--------------------------------------------------------------+
```

**Compact:** `***` [oculus|docs] mullet x5 hammer x1 book x1 pass|pass +3672/-15

---

## Heraldry Derivation Trace

> This section pioneers a fully auditable heraldic computation. Every value is derived from git metadata and the scoring algorithm defined in `PR_HERALDRY_COMPLETENESS.rules.md` §3. The trace enables independent verification and establishes a reproducibility standard for future PR classifications.

### Input Values

| Metric | Value | Source |
|--------|-------|--------|
| `fileCount` | 31 | `git diff --stat main..HEAD \| tail -1` |
| `lineCount` | 3672 | `git diff --shortstat main..HEAD` → insertions |
| `domainCount` | 2 | `oculus` (`packages/oculus/`), `docs` (`docs/`, `IMPLEMENTATION_STATUS.md`) |
| `hasBreakingChanges` | false | No removed exports, no changed interfaces |
| `hasNewDependencies` | true | `@tanstack/react-virtual`, `bun-types`, optional `@react-three/*` peers |
| `hasMigrations` | false | No database or schema changes |
| `hasSchemaChanges` | false | No shared type modifications |

### Scoring Computation

```
score  = min(ceil(31 / 5), 5)        →  min(7, 5)   =  5   // files
score += min(ceil(3672 / 200), 5)     →  min(19, 5)  =  5   // lines
score += min(2, 4)                                    =  2   // domains
score += 0                                            =  0   // no breaking changes
score += 1                                            =  1   // new dependencies
score += 0                                            =  0   // no migrations
score += 0                                            =  0   // no schema changes
─────────────────────────────────────────────────────────────
TOTAL                                                 = 13   // → MAJOR (13-18)
```

### Charge Derivation

| Commit | Message Prefix | Detection Method | Charge |
|--------|---------------|------------------|--------|
| `68fca8c` | "Configure" | keyword → chore | hammer |
| `6e02e02` | "Add" | keyword → feat | mullet |
| `25c2af8` | "Add" | keyword → feat | mullet |
| `fc86f9e` | "Add" | keyword → feat | mullet |
| `ded510b` | "Add" | keyword → feat | mullet |
| `39b6bea` | "Finalize" | keyword → feat | mullet |
| `e8e0fab` | "docs(pr):" | conventional → docs | book |

**Primary charge:** mullet (5/7 = 71%) → governs motto register selection.

### Shield Division

`domainCount = 2` → **per-pale** (vertical split). Dexter: Vert (`#22C55E`, OCULUS). Sinister: Tenné (`#CD853F`, docs).

### Motto Selection

Primary charge = mullet (feat), magnitude = major → formal register → **"Per aspera ad astra"** (Through hardship to the stars).

### Supporters

| Position | Check | Result | Evidence |
|----------|-------|--------|----------|
| Dexter | TypeScript typecheck | **pass** | `npx tsc --noEmit` exits 0, zero errors across 24 modules |
| Sinister | Unit tests | **pass** | `bun test` — 20/20 tests, 34 assertions, 153ms |

---

## Summary

Implements the OCULUS pillar — the read-only Interface layer of the Dendrovia six-pillar architecture. Delivers a complete reactive UI component library (8 view components, 5 atomic primitives, 4 hooks, 1 Zustand store, 1 context provider) that subscribes to `EventBus` game events and renders HUD overlays, code navigation, turn-based combat UI, and 3D-anchored billboards atop the R3F canvas. All components observe the "Show, Don't Touch" principle: OCULUS reads game state from LUDUS/CHRONOS/ARCHITECTUS but never mutates it — user interactions emit events back through the EventBus for LUDUS to resolve.

---

## Features

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | `useOculusStore` | Zustand store: HUD state (health/mana/level/xp), `ActivePanel` enum (none\|quest-log\|miller-columns\|code-reader\|battle-ui), `BattleState` (active/enemy/log), `CodeReaderState` (filePath/content/lang), `FileTreeNode` topology, hotspots, `millerSelection`, `visitedNodes` Set, `isUiHovered` flag, `cameraMode`. 18 actions covering panel toggle, character stats, quest CRUD, combat lifecycle, code reader, player position | Complete |
| 2 | `OculusProvider` | React context wrapping `EventBus` instance + `OculusConfig` (showMinimap, showQuestTracker, enableShortcuts, themeOverrides). Mounts `useEventSubscriptions` + `useKeyboardShortcuts` on init. Renders `.oculus-root` overlay container with optional CSS variable injection | Complete |
| 3 | CSS Design System | 4 stylesheets — `tokens.css`: 60+ custom properties (amber `#f5a97f` / orange `#d88957` / peach `#ffd4b8`, semantic health/mana/xp/bug-type/quest-type colors, glass-panel vars, typography, spacing, z-layers, timing). `base.css`: 4-corner HUD grid, `.oculus-panel` glass-morphism (backdrop-filter blur, translucent bg), button states, themed scrollbars, backdrop blur. `animations.css`: 12 keyframes (fade-in, slide-{up,down,left,right}, scale-in, pulse-glow, damage-flash, ripple, checkmark, bar-fill) + stagger utility. `responsive.css`: tablet (≤1024px) and mobile (≤768px) breakpoints with panel collapse, single-column Miller, fullscreen CodeReader, 44px touch targets | Complete |
| 4 | Atomic Primitives | `Panel`: glass-morphism container with compact/glow/noPadding variants, wires `useInputCapture` for camera suppression. `ProgressBar`: animated fill with variant presets (health=red, mana=teal, xp=gold, quest=amber), ref-tracked damage-flash on decrease, `role=progressbar`. `IconBadge`: circular sized badge (sm/md/lg) with color-mixed bg. `StatLabel`: flex key/value row. `Tooltip`: hover/focus popup with 200ms delay, 4 position variants | Complete |
| 5 | `HUD` | 4-corner CSS Grid layout — top-left: health/mana `ProgressBar` with HP/MP labels, camera mode `IconBadge` (falcon=eagle/player=mage), level `StatLabel`; top-right: `Minimap`; bottom-left: `QuestLog` compact tracker; bottom-right: controls legend; center: `BattleUI` when `battle.active`. Container `pointer-events:none`, interactive children `pointer-events:auto` | Complete |
| 6 | `Minimap` | SVG 120x120 in `Panel`; `flattenTree()` uses golden-angle (137.5deg) radial layout mapping depth to radius; nodes colored by state (yellow=current, grey=visited, white=unvisited, red=hotspot with `pulse-glow` animation); click emits `NODE_CLICKED` via EventBus for LUDUS consumption | Complete |
| 7 | `BattleUI` | `Panel` with glow, triggered by `COMBAT_STARTED`; enemy section: bug-type `IconBadge` (null-pointer=explosion, memory-leak=droplet, race-condition=lightning, off-by-one=numbers) + severity badge + HP `ProgressBar`; action toolbar: Attack + spell buttons disabled when `mana < manaCost`; battle log with auto-scroll ref + `aria-live=polite`. Clicks emit `SPELL_CAST` / `ITEM_USED` via EventBus | Complete |
| 8 | `QuestLog` | Dual-mode: compact `Panel` with active quest `IconBadge` preview; expanded fixed overlay with `.oculus-backdrop` blur, quests grouped by status (active/available/completed/locked), `QuestItem` with expand/collapse, requirements list, rewards display. Type badges: bug-hunt=bug, refactor=wrench, feature=star, archaeology=scroll. Status icons: lock/sparkle/play/check | Complete |
| 9 | `MillerColumns` | 3-column virtualized file browser via `@tanstack/react-virtual` (`useVirtualizer`, 32px row height, 5-item overscan); `VirtualColumn` subcomponent with type icons (dir/file/function/class), hotspot red dots, complexity badges; breadcrumb nav; keyboard arrows navigate columns/items, Esc closes; mobile single-column + back button. Selecting a file calls `openCodeReader`. Slides up from bottom at 60vh | Complete |
| 10 | `CodeReader` | Fixed center overlay 850x75vh; header: language `IconBadge`, monospace file path, LOC count, `riskScore` from hotspots; body: HTML `<table>` with line numbers in gutter (tabular-nums, border-right), hotspot lines get `rgba(255,68,68,0.08)` background; Esc closes; `.oculus-backdrop` blur behind | Complete |
| 11 | `FalconModeOverlay` | Renders only when `cameraMode === 'falcon'`; bottom-center flex row — Overview `Panel` (files/dirs/visited/hotspots via recursive tree traversal `StatLabel`s), Risk Heatmap (CSS `linear-gradient` green to yellow to red), Top Hotspots (sorted by `riskScore`, basename + score) | Complete |
| 12 | `Billboard3D` | Optional R3F integration via dynamic `require('@react-three/drei').Html`; uses `React.createElement('group')` to avoid JSX type declarations for R3F intrinsics; wraps `<Html>` with OCULUS glass-morphism defaults (bg, border, blur, 300px maxWidth); props: `position`, `distanceFactor`, `occlude`, `visible`; returns `null` gracefully when drei unavailable | Complete |
| 13 | `useEventSubscriptions` | EventBus-to-Zustand bridge: subscribes to `HEALTH_CHANGED`, `MANA_CHANGED`, `QUEST_UPDATED`, `COMBAT_STARTED`, `COMBAT_ENDED`, `PLAYER_MOVED`, `NODE_CLICKED`, `DAMAGE_DEALT`, `TOPOLOGY_GENERATED`; returns cleanup array on unmount | Complete |
| 14 | `useInputCapture` / `useIsUiHovered` | `onPointerEnter`/`onPointerLeave` handlers setting `isUiHovered` in store; `useIsUiHovered()` read-only hook consumed by `CameraController` in ARCHITECTUS to suppress rotation when cursor over OCULUS panels | Complete |
| 15 | `useKeyboardShortcuts` | Global keydown listener: `Q` toggles quest-log, `M` toggles miller-columns, `Esc` closes active panel; skips capture when focus in `input`/`textarea`/`contentEditable`; disabled via `OculusConfig.enableShortcuts` | Complete |
| 16 | Unit Tests | 20 tests across 7 `describe` blocks: health/mana setters with optional max override; panel toggle/previousPanel tracking; quest CRUD + activeQuest sync on update; combat start/end lifecycle + battle log append; code reader open/close panel transitions; miller selection + visitedNodes Set accumulation + player position; isUiHovered flag; camera mode switching. 34 `expect()` assertions, all passing via `bun test` | Complete |

---

## Architecture

### Pillar Integration — Data Flow

```mermaid
flowchart TB
    subgraph EXTERNAL["Peer Pillars (Read-Only Sources)"]
        LUDUS["LUDUS\nCharacter, Spells,\nQuests, Combat"]
        CHRONOS["CHRONOS\nFileTreeNode,\nHotspots, Topology"]
        ARCHITECTUS["ARCHITECTUS\nCameraMode,\nR3F Canvas"]
        OPERATUS["OPERATUS\nFile Content\nAsset Loading"]
    end

    subgraph BUS["EventBus (Inter-Pillar)"]
        direction LR
        EV_IN["Inbound Events\nHEALTH_CHANGED\nMANA_CHANGED\nQUEST_UPDATED\nCOMBAT_STARTED\nCOMBAT_ENDED\nPLAYER_MOVED\nNODE_CLICKED\nDAMAGE_DEALT\nTOPOLOGY_GENERATED"]
        EV_OUT["Outbound Events\nSPELL_CAST\nITEM_USED\nNODE_CLICKED"]
    end

    subgraph OCULUS["OCULUS — The Interface"]
        direction TB

        subgraph FOUNDATION["Foundation Layer"]
            STORE["useOculusStore\nZustand: 18 actions\nHUD + Battle +\nCode + Nav state"]
            PROVIDER["OculusProvider\nContext + EventBus\nwiring + shortcuts"]
            HOOKS["Hooks\nuseEventSubscriptions\nuseInputCapture\nuseKeyboardShortcuts"]
            CSS["CSS System\ntokens + base +\nanimations + responsive"]
        end

        subgraph PRIMITIVES["Primitives Layer"]
            PANEL["Panel\nglass-morphism"]
            PBAR["ProgressBar\nhealth/mana/xp"]
            BADGE["IconBadge"]
            STAT["StatLabel"]
            TIP["Tooltip"]
        end

        subgraph VIEWS["View Components"]
            HUD_C["HUD\n4-corner grid"]
            MINI["Minimap\nSVG radial"]
            BATTLE["BattleUI\ncombat panel"]
            QUEST["QuestLog\ntracker + overlay"]
            MILLER["MillerColumns\nvirtualized browser"]
            CODE["CodeReader\nline-numbered viewer"]
            FALCON["FalconModeOverlay\nheatmap + stats"]
            BILL["Billboard3D\nR3F Html wrapper"]
        end
    end

    LUDUS -->|"state events"| EV_IN
    CHRONOS -->|"topology"| EV_IN
    ARCHITECTUS -->|"camera mode"| EV_IN
    EV_IN --> HOOKS
    HOOKS --> STORE
    STORE --> VIEWS
    CSS --> PRIMITIVES
    PRIMITIVES --> VIEWS
    PROVIDER --> HOOKS
    PROVIDER --> STORE

    BATTLE -->|"SPELL_CAST"| EV_OUT
    MINI -->|"NODE_CLICKED"| EV_OUT
    EV_OUT -->|"user actions"| LUDUS

    BILL -->|"optional drei"| ARCHITECTUS

    style EXTERNAL fill:#1e3a5f,stroke:#3b82f6,color:#ffffff
    style BUS fill:#FFD700,stroke:#b8960f,color:#000000
    style OCULUS fill:#22c55e,stroke:#166534,color:#000000
    style FOUNDATION fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style PRIMITIVES fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style VIEWS fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style LUDUS fill:#EF4444,stroke:#991b1b,color:#ffffff
    style CHRONOS fill:#c77b3f,stroke:#8b5e2f,color:#000000
    style ARCHITECTUS fill:#3B82F6,stroke:#1e40af,color:#ffffff
    style OPERATUS fill:#1F2937,stroke:#444,color:#ffffff
    style EV_IN fill:#b8960f,stroke:#FFD700,color:#000000
    style EV_OUT fill:#b8960f,stroke:#FFD700,color:#000000
    style STORE fill:#166534,stroke:#22c55e,color:#ffffff
    style PROVIDER fill:#166534,stroke:#22c55e,color:#ffffff
    style HOOKS fill:#166534,stroke:#22c55e,color:#ffffff
    style CSS fill:#166534,stroke:#22c55e,color:#ffffff
    style PANEL fill:#166534,stroke:#22c55e,color:#ffffff
    style PBAR fill:#166534,stroke:#22c55e,color:#ffffff
    style BADGE fill:#166534,stroke:#22c55e,color:#ffffff
    style STAT fill:#166534,stroke:#22c55e,color:#ffffff
    style TIP fill:#166534,stroke:#22c55e,color:#ffffff
    style HUD_C fill:#166534,stroke:#22c55e,color:#ffffff
    style MINI fill:#166534,stroke:#22c55e,color:#ffffff
    style BATTLE fill:#166534,stroke:#22c55e,color:#ffffff
    style QUEST fill:#166534,stroke:#22c55e,color:#ffffff
    style MILLER fill:#166534,stroke:#22c55e,color:#ffffff
    style CODE fill:#166534,stroke:#22c55e,color:#ffffff
    style FALCON fill:#166534,stroke:#22c55e,color:#ffffff
    style BILL fill:#166534,stroke:#22c55e,color:#ffffff
```

### ActivePanel State Machine

> Pioneering addition: visualizes the exclusive overlay panel transitions as a state machine. Only one overlay is active at any time; transitions are triggered by keyboard shortcuts, clicks, or game events. This diagram enables reviewers to verify panel exclusivity invariants at a glance.

```mermaid
stateDiagram-v2
    [*] --> none

    none --> quest_log : Q key / click "Quests"
    none --> miller_columns : M key / click "Miller"
    none --> battle_ui : COMBAT_STARTED event
    none --> code_reader : selectFile() in MillerColumns

    quest_log --> none : Q key / Esc / click backdrop
    miller_columns --> none : M key / Esc / click backdrop
    miller_columns --> code_reader : selectFile()
    battle_ui --> none : COMBAT_ENDED event
    code_reader --> none : Esc / click backdrop
    code_reader --> miller_columns : (previousPanel restore)

    state none {
        [*] --> hud_visible
        hud_visible : HUD always renders
        hud_visible : Minimap visible
        hud_visible : QuestLog compact tracker visible
        hud_visible : FalconModeOverlay if cameraMode=falcon
    }

    state quest_log {
        [*] --> quest_overlay
        quest_overlay : Full quest log with backdrop blur
        quest_overlay : Grouped by status
    }

    state miller_columns {
        [*] --> miller_overlay
        miller_overlay : 3-column browser, 60vh
        miller_overlay : Keyboard nav active
    }

    state code_reader {
        [*] --> code_overlay
        code_overlay : Center overlay 850x75vh
        code_overlay : Line numbers + hotspot highlights
    }

    state battle_ui {
        [*] --> combat_panel
        combat_panel : Enemy + spells + log
        combat_panel : Cannot be dismissed manually
    }
```

### Component Dependency Graph

```mermaid
flowchart LR
    subgraph ENTRY["Package Entry"]
        IDX["index.ts\n57 exports"]
    end

    subgraph STORE_L["State"]
        S["useOculusStore"]
    end

    subgraph HOOK_L["Hooks"]
        H1["useEventSubscriptions"]
        H2["useInputCapture"]
        H3["useKeyboardShortcuts"]
    end

    subgraph PRIM_L["Primitives"]
        P1["Panel"]
        P2["ProgressBar"]
        P3["IconBadge"]
        P4["StatLabel"]
        P5["Tooltip"]
    end

    subgraph VIEW_L["Views"]
        V1["HUD"]
        V2["Minimap"]
        V3["BattleUI"]
        V4["QuestLog"]
        V5["MillerColumns"]
        V6["CodeReader"]
        V7["FalconModeOverlay"]
        V8["Billboard3D"]
    end

    subgraph CTX["Context"]
        OP["OculusProvider"]
    end

    OP --> H1
    OP --> H3
    H1 --> S
    H2 --> S
    H3 --> S

    V1 --> S
    V1 --> V2
    V1 --> V3
    V1 --> V4
    V1 --> P1
    V1 --> P2
    V1 --> P3
    V1 --> P4

    V2 --> S & P1
    V3 --> S & P1 & P2 & P3
    V4 --> S & P1 & P2 & P3
    V5 --> S & P1 & P3
    V6 --> S & P1 & P3 & P4
    V7 --> S & P1 & P4
    V8 -.->|"optional drei"| S

    P1 --> H2

    style ENTRY fill:#22c55e,stroke:#166534,color:#000000
    style STORE_L fill:#166534,stroke:#22c55e,color:#ffffff
    style HOOK_L fill:#166534,stroke:#22c55e,color:#ffffff
    style PRIM_L fill:#166534,stroke:#22c55e,color:#ffffff
    style VIEW_L fill:#166534,stroke:#22c55e,color:#ffffff
    style CTX fill:#166534,stroke:#22c55e,color:#ffffff
    style IDX fill:#22c55e,stroke:#166534,color:#000000
    style S fill:#22c55e,stroke:#166534,color:#000000
    style OP fill:#22c55e,stroke:#166534,color:#000000
    style H1 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style H2 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style H3 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style P1 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style P2 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style P3 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style P4 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style P5 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style V1 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style V2 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style V3 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style V4 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style V5 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style V6 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style V7 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style V8 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
```

### EventBus Contract Map

```mermaid
flowchart LR
    subgraph IN["Subscribed (Read)"]
        direction TB
        I1["HEALTH_CHANGED → setHealth"]
        I2["MANA_CHANGED → setMana"]
        I3["QUEST_UPDATED → updateQuest"]
        I4["COMBAT_STARTED → startCombat"]
        I5["COMBAT_ENDED → endCombat"]
        I6["PLAYER_MOVED → setPlayerPosition"]
        I7["NODE_CLICKED → addVisitedNode"]
        I8["DAMAGE_DEALT → addBattleLog"]
        I9["TOPOLOGY_GENERATED → setTopology"]
    end

    subgraph OUT["Emitted (Write-Back)"]
        direction TB
        O1["SPELL_CAST ← BattleUI click"]
        O2["ITEM_USED ← BattleUI click"]
        O3["NODE_CLICKED ← Minimap click"]
    end

    IN -->|"useEventSubscriptions\n9 subscriptions"| STORE["useOculusStore"]
    STORE -->|"reactive selectors"| VIEWS["8 View Components"]
    VIEWS -->|"user interaction\n3 emissions"| OUT

    style IN fill:#22c55e,stroke:#166534,color:#000000
    style OUT fill:#c77b3f,stroke:#8b5e2f,color:#000000
    style STORE fill:#166534,stroke:#22c55e,color:#ffffff
    style VIEWS fill:#166534,stroke:#22c55e,color:#ffffff
    style I1 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style I2 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style I3 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style I4 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style I5 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style I6 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style I7 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style I8 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style I9 fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style O1 fill:#8b5e2f,stroke:#c77b3f,color:#ffffff
    style O2 fill:#8b5e2f,stroke:#c77b3f,color:#ffffff
    style O3 fill:#8b5e2f,stroke:#c77b3f,color:#ffffff
```

### Rendering Layer Stack

> Pioneering addition: documents the z-index stacking order and pointer-event passthrough architecture that governs how OCULUS coexists with the R3F canvas. This answers the critical integration question "how do overlays avoid blocking 3D interaction?"

```mermaid
flowchart TB
    subgraph STACK["Z-Index Layer Stack (top to bottom)"]
        direction TB
        Z_MODAL["z-modal: 9000\nQuestLog overlay\nMillerColumns overlay\nCodeReader overlay"]
        Z_BACKDROP["z-backdrop: 8000\n.oculus-backdrop\nCSS backdrop-filter blur"]
        Z_HUD["z-hud: 1000\n.oculus-hud container\npointer-events: none"]
        Z_CORNERS["z-corners (within HUD)\nTop-left: Stats panel\nTop-right: Minimap\nBottom-left: QuestLog compact\nBottom-right: Controls\npointer-events: auto per child"]
        Z_CANVAS["z-base: 0\nR3F Canvas\nOrbitControls\nRaycast targets"]
    end

    Z_MODAL --> Z_BACKDROP --> Z_HUD --> Z_CORNERS --> Z_CANVAS

    subgraph POINTER["Pointer Event Flow"]
        direction LR
        MOUSE["Mouse Event"] --> CHECK{"Over OCULUS\npanel?"}
        CHECK -->|"Yes"| UI_HANDLE["Panel handles event\nsetUiHovered(true)\nCameraController suppressed"]
        CHECK -->|"No"| CANVAS_HANDLE["Event falls through\npointer-events: none\nOrbitControls handles"]
    end

    style STACK fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style Z_MODAL fill:#EF4444,stroke:#991b1b,color:#ffffff
    style Z_BACKDROP fill:#c77b3f,stroke:#8b5e2f,color:#000000
    style Z_HUD fill:#166534,stroke:#22c55e,color:#ffffff
    style Z_CORNERS fill:#22c55e,stroke:#166534,color:#000000
    style Z_CANVAS fill:#3B82F6,stroke:#1e40af,color:#ffffff
    style POINTER fill:#1F2937,stroke:#444,color:#ffffff
    style MOUSE fill:#FFD700,stroke:#b8960f,color:#000000
    style CHECK fill:#c77b3f,stroke:#8b5e2f,color:#000000
    style UI_HANDLE fill:#22c55e,stroke:#166534,color:#000000
    style CANVAS_HANDLE fill:#3B82F6,stroke:#1e40af,color:#ffffff
```

### CSS Token Architecture

> Pioneering addition: shows the cascade from design tokens through base styles to component consumption. Documents the three-tier CSS architecture that enables theming via custom property override on `.oculus-root`.

```mermaid
flowchart TB
    subgraph TOKENS["tokens.css — Design Tokens"]
        direction TB
        T_COLOR["Color Primitives\n--oculus-amber: #f5a97f\n--oculus-orange: #d88957\n--oculus-peach: #ffd4b8"]
        T_SEMANTIC["Semantic Aliases\n--oculus-health: #EF4444\n--oculus-mana: #22d3ee\n--oculus-xp: #FFD700\n--oculus-danger: #ff4444"]
        T_SURFACE["Surface Tokens\n--oculus-panel-bg: rgba(10,10,16,0.85)\n--oculus-border: rgba(245,169,127,0.25)\n--oculus-glass-blur: 12px"]
        T_LAYOUT["Layout Tokens\n--oculus-space-xs through --oculus-space-xl\n--oculus-font-xs through --oculus-font-lg\n--oculus-z-hud / --oculus-z-modal"]
    end

    subgraph BASE["base.css — Structural Styles"]
        direction TB
        B_ROOT[".oculus-root\nabsolute overlay\npointer-events: none"]
        B_HUD[".oculus-hud\n4-corner CSS grid"]
        B_PANEL[".oculus-panel\nglass-morphism recipe\nbackdrop-filter + bg + border"]
        B_SCROLL[".oculus-scrollable\nthemed scrollbar\noverflow-y: auto"]
    end

    subgraph ANIM["animations.css — Motion System"]
        direction TB
        A_ENTER["Entry: fade-in, slide-up\nscale-in"]
        A_FEEDBACK["Feedback: pulse-glow\ndamage-flash, ripple"]
        A_REDUCED["@prefers-reduced-motion\nall animations: none"]
    end

    subgraph RESPONSIVE["responsive.css — Breakpoints"]
        direction TB
        R_TABLET["≤1024px: compact panels\nsmaller fonts"]
        R_MOBILE["≤768px: hidden minimap\nsingle-column Miller\nfullscreen CodeReader\n44px touch targets"]
    end

    T_COLOR --> T_SEMANTIC --> T_SURFACE --> T_LAYOUT
    T_SURFACE --> B_PANEL
    T_LAYOUT --> B_HUD
    T_LAYOUT --> B_ROOT
    B_PANEL --> B_SCROLL
    A_ENTER --> B_PANEL
    A_REDUCED --> A_ENTER
    A_REDUCED --> A_FEEDBACK
    R_TABLET --> B_HUD
    R_MOBILE --> B_HUD

    style TOKENS fill:#c77b3f,stroke:#8b5e2f,color:#000000
    style BASE fill:#166534,stroke:#22c55e,color:#ffffff
    style ANIM fill:#A855F7,stroke:#7c3aed,color:#ffffff
    style RESPONSIVE fill:#3B82F6,stroke:#1e40af,color:#ffffff
    style T_COLOR fill:#8b5e2f,stroke:#c77b3f,color:#ffffff
    style T_SEMANTIC fill:#8b5e2f,stroke:#c77b3f,color:#ffffff
    style T_SURFACE fill:#8b5e2f,stroke:#c77b3f,color:#ffffff
    style T_LAYOUT fill:#8b5e2f,stroke:#c77b3f,color:#ffffff
    style B_ROOT fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style B_HUD fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style B_PANEL fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style B_SCROLL fill:#1a4d2e,stroke:#22c55e,color:#ffffff
    style A_ENTER fill:#7c3aed,stroke:#A855F7,color:#ffffff
    style A_FEEDBACK fill:#7c3aed,stroke:#A855F7,color:#ffffff
    style A_REDUCED fill:#7c3aed,stroke:#A855F7,color:#ffffff
    style R_TABLET fill:#1e40af,stroke:#3B82F6,color:#ffffff
    style R_MOBILE fill:#1e40af,stroke:#3B82F6,color:#ffffff
```

---

## Cross-Pillar Contract Matrix

> Pioneering addition: formalizes the exact inter-pillar data contracts — what OCULUS reads from each source pillar, the EventBus event name, payload shape, and which OCULUS component consumes it. This matrix serves as the integration test specification and makes the "Show, Don't Touch" boundary machine-verifiable.

### Inbound (OCULUS Reads)

| Source Pillar | Event | Payload Type | Store Action | Consuming Components |
|--------------|-------|-------------|-------------|---------------------|
| LUDUS | `HEALTH_CHANGED` | `{ health: number; maxHealth?: number }` | `setHealth` | HUD (ProgressBar) |
| LUDUS | `MANA_CHANGED` | `{ mana: number; maxMana?: number }` | `setMana` | HUD (ProgressBar), BattleUI (spell disable) |
| LUDUS | `QUEST_UPDATED` | `Quest` | `updateQuest` | QuestLog (compact + overlay) |
| LUDUS | `COMBAT_STARTED` | `{ enemy: Bug; playerSpells: Spell[] }` | `startCombat` | BattleUI (enemy panel + spell toolbar) |
| LUDUS | `COMBAT_ENDED` | `{ result: string }` | `endCombat` | BattleUI (dismiss), HUD (restore panel) |
| LUDUS | `DAMAGE_DEALT` | `{ message: string }` | `addBattleLog` | BattleUI (battle log scroll) |
| CHRONOS | `TOPOLOGY_GENERATED` | `{ topology: FileTreeNode; hotspots: Hotspot[] }` | `setTopology`, `setHotspots` | Minimap, MillerColumns, FalconModeOverlay |
| ARCHITECTUS | `PLAYER_MOVED` | `{ position: [number, number, number] }` | `setPlayerPosition` | Minimap (position indicator) |
| ARCHITECTUS | `NODE_CLICKED` | `{ nodeId: string; filePath: string }` | `addVisitedNode` | Minimap (grey visited marker) |

### Outbound (OCULUS Emits)

| Target Pillar | Event | Trigger | Payload Type | Source Component |
|--------------|-------|---------|-------------|-----------------|
| LUDUS | `SPELL_CAST` | User clicks spell button | `{ spellId: string }` | BattleUI |
| LUDUS | `ITEM_USED` | User clicks item button | `{ itemId: string }` | BattleUI |
| LUDUS | `NODE_CLICKED` | User clicks minimap node | `{ nodeId: string; filePath: string; position: [n,n,n] }` | Minimap |

### Shared State (Non-EventBus)

| Mechanism | Direction | Data | Consumer |
|-----------|-----------|------|----------|
| `useIsUiHovered()` hook | OCULUS writes, ARCHITECTUS reads | `boolean` | `CameraController` suppresses OrbitControls |
| `cameraMode` | ARCHITECTUS writes, OCULUS reads | `'falcon' \| 'player'` | `FalconModeOverlay` conditional render, HUD mode badge |

---

## Accessibility Audit

> Pioneering addition: per-component ARIA compliance matrix establishing an accessibility baseline for OCULUS. Each component documents its semantic roles, keyboard interaction, and screen reader behavior.

| Component | ARIA Roles | Keyboard Nav | Screen Reader | Reduced Motion |
|-----------|-----------|-------------|---------------|----------------|
| `HUD` | `role="status"`, `aria-label="Game HUD"` | N/A (container) | Announced as live status region | N/A (container) |
| `Panel` | `aria-label` passthrough | N/A (container) | Label announced on focus | N/A |
| `ProgressBar` | `role="progressbar"`, `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax` | N/A (display) | Announces current/max values | `animation: none` via `prefers-reduced-motion` |
| `BattleUI` | `aria-label="Battle"`, `role="log"` on battle log, `aria-live="polite"` | Tab through spell buttons, Enter to cast | Battle log entries auto-announced, disabled spells announced as unavailable | Damage flash suppressed |
| `QuestLog` | `role="list"`, `role="listitem"` per quest, `aria-expanded` on accordion | Tab to quest items, Enter to expand, Esc to close overlay | Quest status announced (active/locked/completed), expand state announced | Slide animation suppressed |
| `MillerColumns` | `role="tree"` | Arrow keys: left/right switch columns, up/down within column, Esc closes | Column position announced, item type (file/dir) announced | Column slide suppressed |
| `CodeReader` | `aria-label="Code viewer"` | Esc closes | File path and language announced on open | N/A (static content) |
| `Minimap` | `role="img"`, `aria-label="File tree minimap"` | Click-only (SVG) | Minimap described as image, `<title>` on each node | Pulse-glow suppressed |
| `FalconModeOverlay` | `role="status"`, `aria-label="Falcon mode overview"` | N/A (display) | Stats announced as status updates | Fade-in suppressed |
| `Billboard3D` | Inherits from children | N/A (3D anchored) | Not accessible (3D context) | N/A |

---

## Key Interfaces

```typescript
// ── Store State Shape ────────────────────────────────────────

type ActivePanel = 'none' | 'quest-log' | 'miller-columns' | 'code-reader' | 'battle-ui';
type CameraMode = 'falcon' | 'player';

interface BattleState {
  active: boolean;
  enemy: Bug | null;       // from @dendrovia/shared
  log: string[];
}

interface CodeReaderState {
  filePath: string | null;
  content: string | null;
  language: string;
}

// OculusStore = OculusState & OculusActions (18 actions)
// State selectors: health, maxHealth, mana, maxMana, level, experience,
//                  activePanel, previousPanel, cameraMode, quests, activeQuest,
//                  battle, playerSpells, topology, hotspots, codeReader,
//                  millerSelection, isUiHovered, playerPosition, visitedNodes

// ── Provider Config ──────────────────────────────────────────

interface OculusConfig {
  showMinimap?: boolean;           // default: true
  showQuestTracker?: boolean;      // default: true
  enableShortcuts?: boolean;       // default: true
  themeOverrides?: Record<string, string>;  // CSS custom property overrides
}

// ── Billboard3D Props (Optional R3F) ─────────────────────────

interface Billboard3DProps {
  position: [number, number, number];
  distanceFactor?: number;    // default 10
  occlude?: boolean;          // default false
  visible?: boolean;          // default true
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

// ── Primitive Props ──────────────────────────────────────────

interface PanelProps {
  compact?: boolean;
  glow?: boolean;
  noPadding?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  'aria-label'?: string;
}

type ProgressBarVariant = 'health' | 'mana' | 'xp' | 'quest';

interface ProgressBarProps {
  value: number;
  max: number;
  variant?: ProgressBarVariant;  // default: 'health'
  height?: number;               // default: 8
  flash?: boolean;               // animate on decrease, default: false
  'aria-label'?: string;
}

interface IconBadgeProps {
  icon: string;                  // emoji or text
  color?: string;                // CSS color, default: '--oculus-amber'
  size?: 'sm' | 'md' | 'lg';    // default: 'md'
  label?: string;                // tooltip text
}
```

---

## Module Surface Area

| Module | Path | Exports | LOC | Purpose |
|--------|------|---------|-----|---------|
| Entry | `src/index.ts` | 57 named exports (26 values, 31 types) | 57 | Barrel re-export surface |
| Store | `src/store/useOculusStore.ts` | `useOculusStore`, 7 type exports | 247 | Zustand reactive state + 18 actions |
| Provider | `src/OculusProvider.tsx` | `OculusProvider`, `useOculus`, 2 type exports | 82 | Context wrapper, EventBus wiring |
| EventBus Hook | `src/hooks/useEventSubscriptions.ts` | `useEventSubscriptions` | 111 | 9-event subscription bridge |
| Input Hook | `src/hooks/useInputCapture.ts` | `useInputCapture`, `useIsUiHovered` | 30 | Pointer-event camera suppression |
| Keyboard Hook | `src/hooks/useKeyboardShortcuts.ts` | `useKeyboardShortcuts` | 57 | Q/M/Esc global shortcuts |
| Panel | `src/components/primitives/Panel.tsx` | `Panel`, `PanelProps` | 52 | Glass-morphism container |
| ProgressBar | `src/components/primitives/ProgressBar.tsx` | `ProgressBar`, `ProgressBarProps`, `ProgressBarVariant` | 111 | Animated fill bar (4 presets) |
| IconBadge | `src/components/primitives/IconBadge.tsx` | `IconBadge`, `IconBadgeProps` | 50 | Circular icon badge (3 sizes) |
| StatLabel | `src/components/primitives/StatLabel.tsx` | `StatLabel`, `StatLabelProps` | 36 | Key/value row display |
| Tooltip | `src/components/primitives/Tooltip.tsx` | `Tooltip`, `TooltipProps` | 74 | Hover popup (4 positions) |
| HUD | `src/components/HUD.tsx` | `HUD` | 98 | 4-corner grid layout |
| Minimap | `src/components/Minimap.tsx` | `Minimap` | 141 | SVG radial node map |
| BattleUI | `src/components/BattleUI.tsx` | `BattleUI` | 160 | Combat panel + spell actions |
| QuestLog | `src/components/QuestLog.tsx` | `QuestLog` | 238 | Tracker + full overlay |
| MillerColumns | `src/components/MillerColumns.tsx` | `MillerColumns` | 366 | Virtualized 3-column browser |
| CodeReader | `src/components/CodeReader.tsx` | `CodeReader` | 208 | Line-numbered code viewer |
| FalconModeOverlay | `src/components/FalconModeOverlay.tsx` | `FalconModeOverlay` | 127 | Bird's-eye stats overlay |
| Billboard3D | `src/components/Billboard3D.tsx` | `Billboard3D`, `Billboard3DProps` | 81 | Optional R3F Html wrapper |
| Tokens CSS | `src/styles/tokens.css` | 60+ custom properties | 83 | Design token definitions |
| Base CSS | `src/styles/base.css` | 15 class families | 223 | Layout, panels, buttons, scrollbars |
| Animations CSS | `src/styles/animations.css` | 12 keyframes, 3 utilities | 87 | Motion system |
| Responsive CSS | `src/styles/responsive.css` | 2 breakpoint blocks | 116 | Tablet + mobile overrides |
| Tests | `src/__tests__/useOculusStore.test.ts` | 20 tests, 34 assertions | 216 | Store unit tests |
| **Total** | **24 modules** | | **3,153** | |

---

## Files Changed

```
dendrovia/
├── packages/oculus/
│   ├── package.json                               # +@tanstack/react-virtual, bun-types, R3F peer deps
│   ├── tsconfig.json                              # NEW: ES2022+DOM, react-jsx, bun-types
│   ├── vite.config.ts                             # NEW: library mode, externalized peers
│   └── src/
│       ├── index.ts                               # REWRITTEN: 57 named exports (was 3 stubs)
│       ├── OculusProvider.tsx                      # NEW: context + EventBus + shortcuts wiring
│       ├── store/
│       │   └── useOculusStore.ts                  # NEW: Zustand store, 18 actions, 20 state fields
│       ├── hooks/
│       │   ├── useEventSubscriptions.ts           # NEW: 9-event EventBus→Zustand bridge
│       │   ├── useInputCapture.ts                 # NEW: pointer-event camera suppression
│       │   └── useKeyboardShortcuts.ts            # NEW: Q/M/Esc global handlers
│       ├── styles/
│       │   ├── tokens.css                         # NEW: 60+ CSS custom properties
│       │   ├── base.css                           # NEW: layout, panels, buttons, scrollbars
│       │   ├── animations.css                     # NEW: 12 keyframes, stagger utility
│       │   └── responsive.css                     # NEW: tablet + mobile breakpoints
│       ├── components/
│       │   ├── HUD.tsx                            # NEW: 4-corner grid, stats, mode badge
│       │   ├── Minimap.tsx                        # NEW: SVG golden-angle radial layout
│       │   ├── BattleUI.tsx                       # NEW: bug-type combat, spell buttons, log
│       │   ├── QuestLog.tsx                       # NEW: dual-mode tracker/overlay, grouped
│       │   ├── MillerColumns.tsx                  # NEW: virtualized 3-col browser, keyboard nav
│       │   ├── CodeReader.tsx                     # NEW: line-numbered viewer, hotspot highlight
│       │   ├── FalconModeOverlay.tsx              # NEW: heatmap legend, stats, top hotspots
│       │   ├── Billboard3D.tsx                    # NEW: optional drei Html wrapper
│       │   └── primitives/
│       │       ├── index.ts                       # NEW: barrel export
│       │       ├── Panel.tsx                      # NEW: glass-morphism container
│       │       ├── ProgressBar.tsx                # NEW: animated fill, 4 presets, flash
│       │       ├── IconBadge.tsx                  # NEW: circular badge, 3 sizes
│       │       ├── StatLabel.tsx                  # NEW: key/value row
│       │       └── Tooltip.tsx                    # NEW: hover popup, 4 positions
│       └── __tests__/
│           └── useOculusStore.test.ts             # NEW: 20 tests, 7 describe blocks
│
├── docs/pr-descriptions/
│   └── PR_DESCRIPTION_OCULUS_UI_COMPONENT_LIBRARY.md  # NEW: this document
├── bun.lock                                       # Regenerated (reconciled with upstream)
└── IMPLEMENTATION_STATUS.md                       # OCULUS 20% → 90%, 19 line items added
```

---

## Commits

| # | Hash | Type | Message |
|---|------|------|---------|
| 1 | `68fca8c` | chore | Configure OCULUS package: deps, tsconfig, vite library build |
| 2 | `6e02e02` | feat | Add OCULUS design token system, base styles, animations, responsive |
| 3 | `25c2af8` | feat | Add useOculusStore, EventBus hooks, OculusProvider, input capture |
| 4 | `fc86f9e` | feat | Add OCULUS atomic UI primitives: Panel, ProgressBar, IconBadge, StatLabel, Tooltip |
| 5 | `ded510b` | feat | Add all OCULUS view components: HUD, Minimap, Battle, Quest, Miller, Code, Falcon, Billboard |
| 6 | `39b6bea` | feat | Finalize OCULUS exports, add store tests, update implementation status |
| 7 | `e8e0fab` | docs | docs(pr): add PR description for OCULUS UI component library |

---

## Design Decisions

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| 1 | **Zustand store per-pillar** (not shared) | OCULUS state is UI-only (panel visibility, hover flags) — mixing into GameLoop store would violate pillar separation. Store subscribes to EventBus events rather than importing LUDUS stores directly, preserving the "Show, Don't Touch" contract | Single global store (couples pillars), React Context alone (no selector optimization), Redux (unnecessary complexity for read-only UI) |
| 2 | **CSS custom properties** over CSS-in-JS | Zero runtime cost, works with `backdrop-filter`/`@media` natively, themes via property override on `.oculus-root`, no bundler config required. Three-tier cascade (tokens → base → component) enables theming without recompilation | styled-components (runtime overhead in render loop), Tailwind (utility-class noise in JSX), CSS Modules (scoping not needed — OCULUS has its own DOM layer) |
| 3 | **`pointer-events:none` container with `auto` holes** | Prevents OCULUS overlay from blocking OrbitControls / R3F raycasting while keeping interactive UI elements clickable. `useInputCapture` hook coordinates with CameraController via `isUiHovered` store flag | Separate DOM layer (z-index fights), Canvas-rendered UI (loses HTML accessibility), manual event forwarding (fragile) |
| 4 | **`@tanstack/react-virtual`** for MillerColumns | Large codebases may have 1000+ files per directory; virtualization keeps frame time <16ms. Lightweight (3KB gzipped), framework-agnostic, no wrapper component required | `react-window` (heavier API, fixed-size bias), native `overflow-anchor` (insufficient for dynamic column data), pagination (breaks spatial navigation UX) |
| 5 | **`Billboard3D` via dynamic `require()` + `createElement`** | Avoids hard dependency on R3F types at compile time — OCULUS can be consumed by non-3D apps (Storybook, test harness) without drei/fiber installed. `createElement('group')` sidesteps JSX intrinsic type declarations | Static import (fails when drei absent), separate entrypoint (splits package surface), `React.lazy` (unnecessary async boundary for synchronous availability check) |
| 6 | **Golden-angle (137.5deg) radial layout** for Minimap | Produces visually even distribution of nodes in polar coordinates without requiring force-directed simulation. Deterministic: same tree always produces same layout. Matches organic Dendrovia aesthetic | Force-directed (non-deterministic, expensive per frame), grid (doesn't convey hierarchy), treemap (rectangle packing poor fit for circular viewport) |
| 7 | **Dual-mode QuestLog** (compact tracker + full overlay) | Compact mode provides persistent awareness without viewport obstruction; full overlay provides detail on demand. Mirrors HUD philosophy: peripheral awareness first, workbench second | Always-visible sidebar (steals too much viewport), notification-only (insufficient quest context), separate route/page (breaks game immersion) |
| 8 | **Diegetic spell names** (Blame, Refactor, Patch, Bisect) | Reinforces the "codebase as RPG" metaphor — spells are developer tools reframed as combat abilities. `SPELL_CAST` event carries `spellId` so LUDUS can map to actual game logic independently | Generic fantasy names (breaks thematic coherence), technical names (not fun), numbered abilities (unimmersive) |
| 9 | **Exclusive ActivePanel state** (only one overlay at a time) | Prevents viewport clutter, simplifies z-index management, and ensures keyboard shortcuts are unambiguous. `previousPanel` tracking enables restore-on-dismiss (e.g., closing CodeReader returns to MillerColumns) | Multiple simultaneous panels (z-index conflicts, focus trapping complexity), tabbed container (foreign to game UI idiom) |
| 10 | **EventBus subscription in useEffect** (not store middleware) | Subscriptions are side effects that should follow React lifecycle — mount/unmount cleanup prevents memory leaks. Separating subscription logic into `useEventSubscriptions` hook keeps the store pure and testable without EventBus mocking | Zustand middleware (couples store to EventBus, harder to test), global listeners (no cleanup guarantees), RxJS (unnecessary reactive layer) |

---

## Performance Budget

> Pioneering addition: establishes measurable performance constraints per component. These budgets define the upper bounds for frame-time contribution and DOM node count, enabling regression detection in future PRs.

| Component | Max DOM Nodes | Max Frame Contribution | Virtualization | Notes |
|-----------|--------------|----------------------|----------------|-------|
| HUD (container) | 1 | <0.5ms | N/A | `pointer-events:none` div, no reflow |
| Stats Panel | ~15 | <1ms | No | Static structure, updates only on state change |
| ProgressBar | 3 per instance | <0.5ms | No | CSS-only animation, no JS per-frame |
| Minimap | N + 6 (where N = tree nodes) | <2ms for 500 nodes | No (SVG) | Golden-angle layout computed in `useMemo` |
| BattleUI | ~30 + log entries | <1ms | Battle log: planned | Auto-scroll ref, `aria-live` batching |
| QuestLog (compact) | ~10 | <0.5ms | No | Minimal DOM in compact mode |
| QuestLog (overlay) | ~20 per visible quest | <1ms | Planned for 50+ quests | Grouped rendering reduces initial mount |
| MillerColumns | 3 * overscan window | <2ms for 1000 items | Yes (`@tanstack/react-virtual`) | 32px rows, 5-item overscan per column |
| CodeReader | lines + header | <2ms for 500 lines | Planned | HTML table with line numbers |
| FalconModeOverlay | ~25 | <0.5ms | No | Only renders in falcon mode |
| Billboard3D | 1 per instance | <1ms | N/A (3D) | Distance-based LOD via `distanceFactor` |
| **Total HUD active** | **<80** | **<4ms** | | **Leaves 12ms+ for R3F render loop** |

---

## Terminology

| Term | Definition | First Use |
|------|-----------|-----------|
| Show Don't Touch | OCULUS design principle: reads game state, never mutates it. User interactions emit events for LUDUS to resolve | `CLAUDE.md`, `OculusProvider.tsx` |
| Falcon Mode | Bird's-eye camera perspective showing macro codebase overview (triggers `FalconModeOverlay`) | `useOculusStore.ts:CameraMode` |
| Player Mode | Third-person camera for navigating individual files/branches | `useOculusStore.ts:CameraMode` |
| Glass-morphism | Panel styling: translucent background + `backdrop-filter: blur()` + subtle border glow | `base.css:.oculus-panel` |
| Golden-angle Layout | Minimap node placement using 137.5deg angular increment (phyllotaxis) for even radial distribution without force simulation | `Minimap.tsx:flattenTree()` |
| ActivePanel | Exclusive UI state enum — only one overlay panel visible at a time. Transitions documented in state machine diagram above | `useOculusStore.ts:ActivePanel` |
| Input Capture | Coordination protocol: when OCULUS panels are hovered, `isUiHovered` flag suppresses ARCHITECTUS camera controls | `useInputCapture.ts`, `Panel.tsx` |
| Hotspot | File with high `riskScore` (churn x complexity, Tornhill scoring) — highlighted in Minimap (red glow), MillerColumns (red dot), CodeReader (line background) | `@dendrovia/shared:Hotspot` |
| Diegetic Spells | Combat abilities named after developer tools: Blame (`git blame`), Refactor, Patch, Bisect (`git bisect`) | `BattleUI.tsx` |
| Pointer-Event Passthrough | CSS technique: container `pointer-events:none` allows clicks to fall through to R3F canvas; interactive children set `pointer-events:auto` to catch UI clicks | `base.css:.oculus-hud`, z-index diagram |
| Design Tokens | CSS custom properties in `tokens.css` that serve as the single source of truth for colors, spacing, typography, and timing. Theme overrides apply at `.oculus-root` level | `tokens.css`, CSS architecture diagram |

---

## Test Plan

### Automated (Completed)

- [x] TypeScript compiles: `npx tsc --noEmit` exits 0 (zero errors across 24 modules)
- [x] Unit tests pass: `bun test` — 20/20 tests, 34 assertions, 153ms
- [x] Store: `setHealth(75)` updates health, `setHealth(80, 120)` updates both health and maxHealth
- [x] Store: `togglePanel('quest-log')` sets activePanel, second call resets to 'none', previousPanel tracked
- [x] Store: `setQuests([q])` + `updateQuest('q1', {status:'completed'})` propagates to both quests array and activeQuest
- [x] Store: `startCombat(bug, spells)` sets battle.active, enemy, playerSpells, activePanel='battle-ui'
- [x] Store: `endCombat()` clears battle state, restores previousPanel
- [x] Store: `openCodeReader(path, content, lang)` sets codeReader state + activePanel='code-reader'
- [x] Store: `addVisitedNode` accumulates into Set without duplicates
- [x] Store: `setUiHovered(true/false)` toggles isUiHovered flag
- [x] Store: `setCameraMode('falcon'/'player')` toggles cameraMode
- [x] Package.json: `@tanstack/react-virtual` in dependencies, `@react-three/*` in optional peerDependencies
- [x] Vite config: library mode entry `src/index.ts`, ES format, 7 externalized packages
- [x] Rebase: clean rebase onto main (`3df91e2`), redundant R3F version fix dropped (already upstream via `3b4e7a2`)

### Integration (Pending)

- [ ] Import `<OculusProvider>` + `<HUD>` into proof-of-concept, verify HUD renders over R3F canvas
- [ ] Emit `HEALTH_CHANGED` event, verify ProgressBar animates with fill width transition
- [ ] Emit `COMBAT_STARTED` event, verify BattleUI appears with enemy name + HP bar
- [ ] Emit `NODE_CLICKED`, verify Minimap node updates to visited (grey fill)
- [ ] Emit `TOPOLOGY_GENERATED`, verify MillerColumns populates with file tree
- [ ] Open CodeReader via MillerColumns file selection, verify line numbers + hotspot highlights render
- [ ] Toggle `cameraMode` to falcon, verify FalconModeOverlay appears with stats

### Performance (Pending)

- [ ] DevTools Performance tab with HUD + one overlay active, verify <16ms frame time
- [ ] DevTools Performance tab with MillerColumns rendering 1000+ items, verify smooth scroll
- [ ] Memory tab: mount/unmount OculusProvider 10x, verify no leaked EventBus subscriptions

### Responsive (Pending)

- [ ] Resize viewport to 375px width, verify collapsed HUD, hidden minimap, fullscreen CodeReader
- [ ] Resize viewport to 1024px, verify tablet breakpoint (compact panels, smaller fonts)

### Accessibility (Pending)

- [ ] Keyboard: Tab through all interactive elements, verify visible focus rings
- [ ] Keyboard: Q/M/Esc shortcuts toggle respective panels
- [ ] Screen reader: health/mana bars announced via `role=progressbar` with current/max values
- [ ] Screen reader: battle log entries auto-announced via `aria-live="polite"`
- [ ] `prefers-reduced-motion`: all animations suppressed when enabled

---

## Dependencies

### Added

| Package | Version | Type | Purpose |
|---------|---------|------|---------|
| `@tanstack/react-virtual` | ^3.13.18 | dependency | List virtualization for MillerColumns, QuestLog, BattleLog |
| `bun-types` | ^1.3.9 | devDependency | Type declarations for `bun:test` in unit tests |
| `@react-three/drei` | >=9.0.0 | peerDependency (optional) | `<Html>` component for Billboard3D |
| `@react-three/fiber` | >=8.0.0 | peerDependency (optional) | R3F `<Canvas>` context for Billboard3D |
| `three` | >=0.150.0 | peerDependency (optional) | Three.js runtime for Billboard3D |

### Pre-existing (Unchanged)

| Package | Version | Type |
|---------|---------|------|
| `@dendrovia/shared` | workspace:* | dependency |
| `react` | ^18.3.1 | dependency |
| `react-dom` | ^18.3.1 | dependency |
| `zustand` | ^5.0.2 | dependency |

---

## Reversibility Assessment

> Pioneering addition: evaluates the blast radius and reversibility of this PR, enabling informed merge decisions.

| Aspect | Assessment | Notes |
|--------|-----------|-------|
| **Additive-only** | Yes | 29 new files, 0 deleted, 2 modified (index.ts rewrite + IMPLEMENTATION_STATUS.md) |
| **Breaking changes** | None | No existing exports removed; `index.ts` previously exported stubs pointing to nonexistent files |
| **Peer pillar impact** | Zero | OCULUS reads from EventBus only; no changes to shared types, EventBus, GameLoop, or InputManager |
| **Revert safety** | Full | `git revert` of all 7 commits cleanly removes the entire pillar with no orphaned references |
| **Partial adoption** | Supported | `OculusProvider` + `HUD` can be mounted independently; other components are opt-in via import |
| **Lock file change** | Reconciled | `bun.lock` regenerated to include `@tanstack/react-virtual`; revert would require `bun install` |

---

## Related

| Document | Relationship |
|----------|-------------|
| `packages/shared/src/types/index.ts` | Source of truth for `Character`, `Spell`, `Quest`, `Bug`, `FileTreeNode`, `Hotspot`, `HUDState`, `MillerColumn`, `MillerColumnItem` types consumed by OCULUS store and components |
| `packages/shared/src/events/EventBus.ts` | `GameEvents` contract defining the 9 inbound and 3 outbound event names + payload types wired by `useEventSubscriptions` |
| `packages/dendrovia-engine/src/core/GameLoop.ts` | `useGameLoop` store providing `mode` (falcon/player) that OCULUS reads via `setCameraMode` |
| `packages/dendrovia-engine/src/core/InputManager.ts` | `useInput` store that will consume `isUiHovered` to suppress camera rotation |
| `packages/proof-of-concept/src/components/HUD.tsx` | POC predecessor — basic EventBus listener, replaced by full HUD with health/mana/mode/quest/minimap |
| `packages/proof-of-concept/src/components/CodeOverlay.tsx` | POC predecessor — fetch-based code display, replaced by `CodeReader` with line numbers and hotspot highlighting |
| `packages/proof-of-concept/src/index.css` | POC styles (green `#6dffaa` accent) — OCULUS establishes its own warm amber palette via `tokens.css` |
| `CLAUDE.md` (pillar checkout) | OCULUS pillar philosophy: "Show, Don't Touch", 2D overlays + 3D billboards, Monument Valley aesthetic |
| `IMPLEMENTATION_STATUS.md` | Updated to reflect OCULUS 20% → 90% with 19 completed line items |
| `.claude/rules/PR_HERALDRY_COMPLETENESS.rules.md` | Heraldic taxonomy and scoring algorithm used in Derivation Trace above |
| `.claude/rules/DIAGRAM_CONVENTIONS.rules.md` | WCAG-compliant Mermaid color rules applied to all 7 diagrams in this description |
