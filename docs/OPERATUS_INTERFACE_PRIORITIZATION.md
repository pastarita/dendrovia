# OPERATUS Interface Prioritization & Playground Strategy

> **Pillar:** OPERATUS (The Infrastructure)
> **Scope:** Interface gaps, cross-pillar contracts, playground enablement
> **Assessed against:** `main` @ `4957f41`

---

## I. Interface Audit

### Current Connection State

| Interface | Direction | Status | Severity |
|-----------|-----------|--------|----------|
| `DendroviaQuest` -> `initializeOperatus()` | app -> OPERATUS | CONNECTED | -- |
| `AssetLoader` emits `ASSETS_LOADED` | OPERATUS -> EventBus | CONNECTED | -- |
| `AutoSave` subscribes to LUDUS events | LUDUS -> OPERATUS | CONNECTED | -- |
| IMAGINARIUM manifest -> OPERATUS loader | IMAGINARIUM -> OPERATUS | CONNECTED (type-level) | -- |
| `OperatusContext` consumed after init | app -> OPERATUS | **DEAD** | Critical |
| ARCHITECTUS uses OPERATUS cache | OPERATUS -> ARCHITECTUS | **NOT CONNECTED** | Critical |
| LUDUS GameStore <-> OPERATUS GameStore | LUDUS <-> OPERATUS | **PARALLEL** | Critical |
| LUDUS save format <-> OPERATUS persistence | LUDUS <-> OPERATUS | **INCOMPATIBLE** | Critical |
| OCULUS listens to OPERATUS events | OPERATUS -> OCULUS | **NOT CONNECTED** | High |
| OCULUS `useCodeLoader` uses OPERATUS cache | OPERATUS -> OCULUS | **NOT CONNECTED** | High |
| CHRONOS topology -> OPERATUS runtime cache | CHRONOS -> OPERATUS | **FILESYSTEM ONLY** | Medium |
| `STATE_PERSISTED` event | OPERATUS -> EventBus | **NEVER EMITTED** | High |
| `CACHE_UPDATED` event | OPERATUS -> EventBus | **NEVER EMITTED** | High |
| OPERATUS `worldPosition` <- `PLAYER_MOVED` | ARCHITECTUS -> OPERATUS | **NOT CONNECTED** | Medium |
| Hydrated state -> LUDUS session | OPERATUS -> LUDUS | **MISSING** | Critical |

### Type Contract Violations

| Location | Issue |
|----------|-------|
| OPERATUS `DEFAULT_PLAYER` | Flat `health`/`mana` fields — shared `Character` requires nested `stats: CharacterStats`. Missing `spells`, `statusEffects`, `cooldowns`. **Type-invalid.** |
| OPERATUS GameStore key: `player` | LUDUS uses `character`. Shared `GameSaveState` uses `character`. Naming divergence. |
| OPERATUS `quests: Quest[]` | Flat array. LUDUS splits into `activeQuests`/`completedQuests`. No reconciliation. |
| OPERATUS GameStore | Missing: `inventory`, `gameFlags`, `encounterState`, `battleStats`, `playtimeMs` (all present in LUDUS `SaveData`) |
| OCULUS event payloads | `HEALTH_CHANGED`: expects `{health, maxHealth}`, LUDUS emits `{entityId, current, max, delta}`. Same mismatch on `MANA_CHANGED`, `DAMAGE_DEALT`, `COMBAT_STARTED`. |

---

## II. Task Inventory (28 items)

### A. Type Corrections (4 tasks)

| # | Task | Blocks |
|---|------|--------|
| A1 | Fix `DEFAULT_PLAYER` to conform to shared `Character` (nested `stats`, add `spells`, `statusEffects`, `cooldowns`) | A2, A3 |
| A2 | Rename `player` -> `character` in OPERATUS GameStore to match shared `GameSaveState` contract | B1, B2 |
| A3 | Add missing fields to `GameStoreState`: `inventory: Item[]`, `gameFlags: Record<string, boolean>` | B2 |
| A4 | Add typed payload interfaces for `ASSETS_LOADED`, `STATE_PERSISTED`, `CACHE_UPDATED`, `COLLISION_DETECTED`, `ITEM_USED` in shared EventBus | C1, C2, C3 |

### B. Store Unification (4 tasks)

| # | Task | Blocks |
|---|------|--------|
| B1 | Create `StateAdapter` bridging LUDUS GameStore <-> OPERATUS persistence (bidirectional sync on event-driven boundaries) | B3 |
| B2 | Unify save format: OPERATUS `GameStoreState` as the persistence superset, LUDUS `SaveData` as a serialization view | B3 |
| B3 | Wire hydrated OPERATUS state into LUDUS `createGameSession()` in DendroviaQuest (player, quests, inventory, flags) | -- |
| B4 | Reconcile quest structure: adapter to split/merge flat `quests[]` <-> `activeQuests`/`completedQuests` | B3 |

### C. Event Contract Fulfillment (5 tasks)

| # | Task | Blocks |
|---|------|--------|
| C1 | Emit `STATE_PERSISTED` from `StatePersistence` and `AutoSave` after successful persist | -- |
| C2 | Emit `CACHE_UPDATED` from `CacheManager.set()` | -- |
| C3 | Subscribe OPERATUS to `PLAYER_MOVED` to update `worldPosition` | -- |
| C4 | Subscribe OPERATUS to `LEVEL_UP`, `LOOT_DROPPED` as additional auto-save triggers | -- |
| C5 | Fix OCULUS event payload expectations to match LUDUS emission shapes (or create shared payload adapter) | -- |

### D. Cross-Pillar Integration (5 tasks)

| # | Task | Blocks |
|---|------|--------|
| D1 | Expose `OperatusContext` (cache, assetLoader, cdnLoader) via React context provider so ARCHITECTUS/OCULUS can consume | D2, D3 |
| D2 | Refactor ARCHITECTUS `AssetBridge` to route through OPERATUS `AssetLoader`/`CacheManager` instead of raw `fetch()` | -- |
| D3 | Refactor OCULUS `useCodeLoader` to use OPERATUS `CacheManager` for file content caching | -- |
| D4 | Unify manifest loading: single `AssetLoader.loadManifest()` call, pass result to ARCHITECTUS via context/props | -- |
| D5 | Wire `ASSETS_LOADED` event -> OCULUS loading state (progress indicator, ready signal) | -- |

### E. Missing Infrastructure (4 tasks)

| # | Task | Blocks |
|---|------|--------|
| E1 | Add `GAME_STARTED` and `LEVEL_LOADED` events to shared `GameEvents` (referenced in CLAUDE.md, don't exist) | E2 |
| E2 | Subscribe OPERATUS to `GAME_STARTED` for preload trigger, `LEVEL_LOADED` for zone-specific asset loading | -- |
| E3 | Add storage quota reporting to `CacheManager` (expose to OCULUS for UI display) | -- |
| E4 | Implement cache warming from service worker pre-cache list (wire `precacheURLs()` to manifest entries) | -- |

### F. Playground Enablement (6 tasks)

| # | Task | Blocks |
|---|------|--------|
| F1 | **Gym: Cache Inspector** — interactive OPFS/IDB browser with read/write/evict controls | -- |
| F2 | **Gym: Persistence Sandbox** — live Zustand store manipulation with save/load/export/import | -- |
| F3 | **Zoo: Asset Catalog** — browse manifest entries, cache status, staleness, file sizes, hash validation | -- |
| F4 | **Zoo: Save Slot Browser** — list save slots, view snapshots, compare states, import/export JSON | -- |
| F5 | **Museum: Cache Hierarchy Visualizer** — animated flow showing Memory -> OPFS -> IDB -> Network with hit/miss counters | -- |
| F6 | **Museum: Performance Dashboard** — PerfMonitor report rendered as charts (load times, cache ratios, storage usage) | -- |

---

## III. Multi-Objective Analysis

### Scoring Dimensions

| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| **Correctness** | 5 | Type violations and dead events produce runtime bugs or silent failures |
| **Integration Leverage** | 4 | Fixes that unblock multiple pillars simultaneously |
| **Data Loss Prevention** | 4 | Inventory/flags/position not persisting = player progress lost on reload |
| **Playground Enablement** | 3 | Gyms/zoos/museums need real infrastructure to exercise |
| **Test Surface** | 2 | Tasks that increase observable correctness via tests |

### Scored Task Matrix

| Task | Correct. | Integr. | Data Loss | Playground | Test | **Total** |
|------|----------|---------|-----------|------------|------|-----------|
| A1 Fix DEFAULT_PLAYER | 5 | 3 | 4 | 2 | 3 | **73** |
| A2 Rename player->character | 5 | 4 | 3 | 2 | 2 | **68** |
| A3 Add inventory/gameFlags | 3 | 3 | 5 | 3 | 2 | **62** |
| A4 Typed event payloads | 4 | 4 | 1 | 2 | 4 | **59** |
| B1 StateAdapter bridge | 4 | 5 | 5 | 3 | 3 | **78** |
| B2 Unify save format | 4 | 4 | 5 | 3 | 3 | **73** |
| B3 Hydrate LUDUS from OPERATUS | 3 | 5 | 5 | 2 | 2 | **68** |
| B4 Quest reconciliation | 3 | 3 | 3 | 2 | 2 | **52** |
| C1 Emit STATE_PERSISTED | 4 | 3 | 2 | 3 | 3 | **57** |
| C2 Emit CACHE_UPDATED | 3 | 3 | 1 | 3 | 2 | **47** |
| C3 Subscribe PLAYER_MOVED | 2 | 3 | 3 | 2 | 2 | **45** |
| C4 Add save triggers | 2 | 2 | 4 | 1 | 2 | **42** |
| C5 Fix OCULUS payloads | 5 | 3 | 1 | 1 | 3 | **55** |
| D1 OperatusContext provider | 3 | 5 | 1 | 4 | 2 | **59** |
| D2 ARCHITECTUS uses OPERATUS cache | 2 | 5 | 1 | 3 | 2 | **52** |
| D3 OCULUS uses OPERATUS cache | 2 | 4 | 1 | 3 | 2 | **47** |
| D4 Unify manifest loading | 3 | 4 | 1 | 3 | 2 | **52** |
| D5 Wire ASSETS_LOADED -> OCULUS | 2 | 3 | 1 | 3 | 2 | **42** |
| E1 Add GAME_STARTED/LEVEL_LOADED | 3 | 3 | 1 | 2 | 2 | **44** |
| E2 Subscribe to new events | 2 | 3 | 1 | 2 | 2 | **39** |
| E3 Storage quota reporting | 1 | 2 | 2 | 4 | 2 | **38** |
| E4 SW pre-cache from manifest | 2 | 2 | 1 | 3 | 2 | **37** |
| F1 Gym: Cache Inspector | 1 | 2 | 1 | 5 | 3 | **40** |
| F2 Gym: Persistence Sandbox | 1 | 2 | 2 | 5 | 3 | **43** |
| F3 Zoo: Asset Catalog | 1 | 2 | 1 | 5 | 2 | **37** |
| F4 Zoo: Save Slot Browser | 1 | 2 | 2 | 5 | 2 | **40** |
| F5 Museum: Cache Hierarchy Viz | 1 | 1 | 1 | 5 | 1 | **33** |
| F6 Museum: Perf Dashboard | 1 | 2 | 1 | 5 | 2 | **37** |

### Priority Tiers (by score)

**Tier 1 — Critical Path (score >= 65):**
1. **B1** StateAdapter bridge (78)
2. **A1** Fix DEFAULT_PLAYER (73)
3. **B2** Unify save format (73)
4. **A2** Rename player -> character (68)
5. **B3** Hydrate LUDUS from OPERATUS (68)

**Tier 2 — High Value (score 50-64):**
6. A3 Add inventory/gameFlags (62)
7. A4 Typed event payloads (59)
8. D1 OperatusContext provider (59)
9. C1 Emit STATE_PERSISTED (57)
10. C5 Fix OCULUS payloads (55)
11. B4 Quest reconciliation (52)
12. D2 ARCHITECTUS uses OPERATUS cache (52)
13. D4 Unify manifest loading (52)

**Tier 3 — Medium Value (score 37-49):**
14-22. C2, C3, D3, E1, C4, F2, D5, F1, F4

**Tier 4 — Enablement (score < 37):**
23-28. E2, E3, E4, F3, F5, F6

---

## IV. Dependency Graph (Critical Path)

```
A1 (fix Character) ──┐
                      ├──> A2 (rename player) ──> B1 (StateAdapter) ──> B3 (hydrate LUDUS)
A3 (add fields) ──────┤                                │
                      └──> B2 (unify save format) ─────┘
A4 (typed payloads) ──> C1 (emit STATE_PERSISTED)
                    ──> C2 (emit CACHE_UPDATED)

D1 (context provider) ──> D2 (ARCHITECTUS cache)
                       ──> D3 (OCULUS cache)

F1-F6 (playground) can proceed independently once D1 lands
```

**Minimum viable integration:** A1 -> A2 -> B2 -> B1 -> B3. Five tasks to get the two GameStores unified and state flowing correctly between LUDUS and OPERATUS. Everything downstream improves.

---

## V. Playground Priorities: Top 3

Given the infrastructure already implemented in OPERATUS and the playground's purpose of exercising the package APIs, the highest-leverage playground implementations are:

### 1. Gym: Persistence Sandbox (F2) — **RECOMMENDED FIRST**

**Why:** The store unification work (Tier 1) produces the most complex runtime behavior in the system — bidirectional state sync between LUDUS and OPERATUS, hydration from IndexedDB, auto-save triggers, migration chains. A live sandbox where you can:

- Manipulate store fields in real-time and watch persistence fire
- Trigger save/load/export/import cycles
- Test migration chains by loading old save formats
- Observe cross-tab sync (open two tabs, watch leader election)
- Simulate `beforeunload` emergency saves

This gym directly validates the correctness of the Tier 1 critical path work and catches regressions that unit tests can't (browser API behavior, cross-tab race conditions, hydration timing).

**Exercises:** `useGameStore`, `StatePersistence`, `AutoSave`, `CrossTabSync`, `createDendroviaStorage`, `waitForHydration`

### 2. Zoo: Asset Catalog (F3) — **RECOMMENDED SECOND**

**Why:** The manifest/cache unification (D1, D2, D4) needs a visual surface to verify correctness. An asset catalog that:

- Lists all manifest entries with metadata (type, hash, size, priority)
- Shows per-entry cache status across tiers (Memory / OPFS / IDB / uncached)
- Validates hash integrity (is the cached version still current?)
- Displays staleness indicators (manifest hash vs cached hash)
- Provides manual evict/reload controls per entry

This zoo is the observability layer for the entire asset pipeline. It makes the tiered cache hierarchy legible rather than opaque, and it's the first thing you'd use to debug "why isn't my shader loading."

**Exercises:** `CacheManager`, `AssetLoader`, `ManifestGenerator` output, `OPFSCache`, `IDBCache`, `PerfMonitor` (cache hit ratios)

### 3. Museum: Cache Hierarchy Visualizer (F5) — **RECOMMENDED THIRD**

**Why:** OPERATUS's defining architectural contribution is the Memory -> OPFS -> IDB -> Network tiered cache with auto-promotion. This is difficult to understand from code alone. A museum exhibit that:

- Renders the four tiers as visual lanes
- Animates asset lookups flowing through tiers (miss/miss/miss/fetch -> promote up)
- Shows real-time hit/miss counters per tier
- Visualizes quota usage (StorageManager estimate)
- Replays a session's asset loading sequence as a time-stepped animation

This exhibit serves dual purpose: it demonstrates OPERATUS's value proposition to the team (why a tiered cache matters), and it stress-tests the `PerfMonitor` reporting pipeline. It's the kind of thing that makes architecture decisions legible.

**Exercises:** `CacheManager` (full lifecycle), `PerfMonitor` (`generateReport`), `StorageManager` quota API, cache promotion logic

---

## VI. Implementation Sequence

```
Phase 1: Type Corrections + Store Unification
  A1 -> A2 -> A3 -> B2 -> B1 -> B3 -> B4
  (7 tasks, unlocks correct state flow)

Phase 2: Event Contracts + Cross-Pillar Wiring
  A4 -> C1 -> C2 -> C5 -> D1 -> D2 -> D4
  (7 tasks, unlocks integration)

Phase 3: Playground Enablement
  F2 (Persistence Sandbox gym) -> F3 (Asset Catalog zoo) -> F5 (Cache Hierarchy museum)
  (3 tasks, validates Phases 1-2)

Phase 4: Remaining Infrastructure + Polish
  C3, C4, D3, D5, E1-E4, F1, F4, F6
  (11 tasks, hardening)
```
