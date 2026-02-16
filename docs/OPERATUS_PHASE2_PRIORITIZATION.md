# OPERATUS Phase 2 — Integration & Inspectability Prioritization

> Post-merge assessment: main at `42eabc5` | 773 tests passing | 0 failures
> Scope: What OPERATUS must provide given the last ~30 commits of new infrastructure

---

## Test Results (All Green)

| Pillar | Tests | Assertions | Status |
|--------|-------|------------|--------|
| OPERATUS | 22 | 45 | Pass |
| LUDUS | 204 | 4,372 | Pass |
| IMAGINARIUM | 261 | 3,917 | Pass |
| CHRONOS | 159 | 339 | Pass |
| ARCHITECTUS | 99 | 166 | Pass |
| OCULUS | 28 | 56 | Pass |
| **Total** | **773** | **8,895** | **All pass** |

---

## Situation Assessment

### What Landed Since Phase 1

| PR | New Infrastructure | OPERATUS Impact |
|----|-------------------|-----------------|
| **Mesh Pipeline** | IMAGINARIUM half-edge mesh → serialize → `manifest.meshes` | AssetLoader already has `loadMesh()` but **AssetBridge bypasses it entirely** — direct `fetch()`, no cache |
| **OCULUS Remediation** | Fixed 8 event payload mismatches, added `useEventSubscriptions` T01-T14 tags | OCULUS **does not subscribe** to ASSETS_LOADED, STATE_PERSISTED, CACHE_UPDATED |
| **CHRONOS Analyze** | `analyze.ts` pipeline, `RepoResolver` (clones to `~/.chronos/`), `DeepWikiFetcher` | Outputs sit on filesystem — **no manifest entry, no browser delivery, no cache invalidation** |
| **LUDUS Playground** | Combat gym, balance simulator, mechanic zoo | All ephemeral `useState` — no persistence, no shared state |
| **OCULUS Playground** | Battle arena, HUD sandbox, event museum, cross-pillar museum | Hardcoded mock data — no AssetLoader, no persistence |
| **CHRONOS Playground** | 8 zoo pages, `load-data.ts` | Server-side `fs.readFile` — works but no browser cache |

### The Core Problem

OPERATUS has a complete infrastructure stack (4-tier cache, AssetLoader with priorities, manifest-driven loading, persistence, cross-tab sync) but **no pillar actually uses it for asset delivery**. Each pillar either:
- Fetches directly (`AssetBridge.ts` — mesh loading)
- Reads from filesystem (`load-data.ts` — CHRONOS topology)
- Hardcodes mock data (`mock-data.ts` — OCULUS playground)

The pipeline exists but the wiring is disconnected.

---

## Task Inventory

### A. Bridge Asset Delivery (AssetBridge → AssetLoader)

| ID | Task | Impact | Effort | Inspectable? |
|----|------|--------|--------|-------------|
| A1 | Route AssetBridge mesh loading through AssetLoader.loadMesh() | Mesh caching across sessions (100-500KB saved per revisit) | S | No |
| A2 | Route AssetBridge palette/shader loading through AssetLoader | Unified cache for all IMAGINARIUM outputs | S | No |
| A3 | Pass OperatusContext.assetLoader into AssetBridge from DendroviaQuest | Connect the two systems at the app shell level | S | No |

### B. OCULUS Event Wiring

| ID | Task | Impact | Effort | Inspectable? |
|----|------|--------|--------|-------------|
| B1 | Subscribe OCULUS to ASSETS_LOADED → update loading state | UI reflects actual asset loading progress | S | Yes — visible in HUD |
| B2 | Subscribe OCULUS to STATE_PERSISTED → show save indicator | Player sees "Game Saved" feedback | S | Yes — visible in HUD |
| B3 | Emit ASSETS_LOADED with full manifest payload after loadAll() | OCULUS + ARCHITECTUS can react to asset availability | XS | No |

### C. Playground Infrastructure (Inspectability)

| ID | Task | Impact | Effort | Inspectable? |
|----|------|--------|--------|-------------|
| C1 | **OPERATUS Gym: Cache Inspector** — Live view of all cached assets (path, size, tier, hash, age) with manual invalidate/reload buttons | Primary debugging tool for the entire cache hierarchy | M | **Yes — the demo** |
| C2 | **OPERATUS Gym: Persistence Sandbox** — Save/load/export/import game state, show IndexedDB contents, trigger migrations | Proves the save system works end-to-end | M | **Yes — the demo** |
| C3 | **OPERATUS Museum: Asset Lifecycle** — Animated diagram: manifest → priority sort → cache check → fetch → cache write → consumer. Live event stream showing ASSETS_LOADED, CACHE_UPDATED, STATE_PERSISTED in real time | Explains OPERATUS to onlookers | M | **Yes — the demo** |
| C4 | **OPERATUS Zoo: Manifest Catalog** — Parse and display the current manifest.json: shaders, palettes, meshes, mycology entries with size/hash/tier metadata | Shows what OPERATUS is responsible for delivering | S | **Yes — the demo** |
| C5 | Provide shared mock manifest + topology for all playgrounds to use via AssetLoader instead of hardcoded data | Unify data loading across all 6 playground apps | M | Yes — playground consistency |

### D. CHRONOS → OPERATUS Delivery

| ID | Task | Impact | Effort | Inspectable? |
|----|------|--------|--------|-------------|
| D1 | Add `chronos` section to AssetManifest (topology path + hash) in ManifestGenerator | CHRONOS outputs become manifest-tracked assets | S | No |
| D2 | Update AssetLoader.loadTopology() to use manifest.chronos.topologyHash for cache invalidation | Stale topology auto-purged when repo changes | S | No |
| D3 | Copy CHRONOS outputs into `/generated/` during build (turbo pipeline) | Browser can reach topology.json via standard asset path | M | No |

### E. StateAdapter Enhancements

| ID | Task | Impact | Effort | Inspectable? |
|----|------|--------|--------|-------------|
| E1 | Sync LUDUS `Inventory` (slot-based) ↔ OPERATUS `inventory` (flat Item[]) with item registry resolution | Loot from combat actually persists across sessions | M | Yes — save/load items |
| E2 | Sync LUDUS encounterState + battleStats into OPERATUS gameFlags for persistence | Combat progress (defeated bosses, step counter) survives reload | S | Yes — save/load progress |
| E3 | Emit STATE_PERSISTED event from Zustand persist `setItem` callback | Downstream subscribers (OCULUS save indicator) get notified | XS | Yes — HUD feedback |

### F. Cross-Pillar Inspectability

| ID | Task | Impact | Effort | Inspectable? |
|----|------|--------|--------|-------------|
| F1 | Add PerfMonitor integration to AssetLoader (track load times, cache hit rates) | Quantify infrastructure performance | S | Yes — metrics |
| F2 | Add event stream panel to OPERATUS playground (EventBus.onAny() → live log) | See all cross-pillar communication in real time | S | **Yes — the demo** |
| F3 | Wire OCULUS event-flow museum to show live events (not just documentation) | Existing museum becomes a runtime debugger | M | **Yes — the demo** |

---

## Multi-Objective Scoring

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Inspectability** | 0.30 | Does this create something a human can see and interact with? |
| **Integration Density** | 0.25 | How many pillars does this connect? |
| **Unblocking Factor** | 0.20 | Does this enable other work? |
| **Risk Reduction** | 0.15 | Does this fix a silent failure mode? |
| **Effort Efficiency** | 0.10 | Value per hour invested |

### Scored Rankings

| Rank | ID | Task | Inspect | Integ | Unblock | Risk | Effort | **Score** |
|------|-----|------|---------|-------|---------|------|--------|-----------|
| 1 | C1 | Cache Inspector gym | 10 | 6 | 7 | 8 | 6 | **7.75** |
| 2 | A1+A2+A3 | Bridge AssetBridge → AssetLoader | 3 | 9 | 9 | 9 | 7 | **7.30** |
| 3 | C3 | Asset Lifecycle museum | 10 | 7 | 5 | 5 | 5 | **7.00** |
| 4 | C2 | Persistence Sandbox gym | 10 | 5 | 5 | 7 | 5 | **6.85** |
| 5 | B1+B2+E3 | OCULUS event subscriptions + save indicator | 8 | 8 | 6 | 4 | 8 | **6.80** |
| 6 | C4 | Manifest Catalog zoo | 9 | 5 | 4 | 3 | 8 | **6.10** |
| 7 | F2 | Event stream panel | 9 | 8 | 4 | 3 | 6 | **6.45** |
| 8 | E1+E2 | StateAdapter inventory + encounter sync | 6 | 7 | 6 | 7 | 4 | **6.20** |
| 9 | D1+D2 | CHRONOS manifest integration | 3 | 7 | 7 | 6 | 7 | **5.70** |
| 10 | F3 | Live event museum | 8 | 6 | 3 | 2 | 5 | **5.35** |
| 11 | C5 | Shared mock manifest | 4 | 8 | 5 | 3 | 4 | **5.00** |
| 12 | D3 | CHRONOS build pipeline copy | 2 | 5 | 6 | 5 | 4 | **4.35** |
| 13 | F1 | PerfMonitor integration | 5 | 4 | 3 | 4 | 7 | **4.30** |

---

## Implementation Phases

### Phase 2A — "Connect the Pipes" (Integration)

**Goal:** Make AssetBridge use OPERATUS infrastructure instead of raw fetch.

| Task | Files | What Changes |
|------|-------|--------------|
| A3 | `DendroviaQuest.tsx` | Pass `operatusRef.current.assetLoader` to ARCHITECTUS |
| A1 | `AssetBridge.ts` | Accept optional `AssetLoader`, use `loadMesh()` for mesh data |
| A2 | `AssetBridge.ts` | Use `loadAsset()` for palette/shader fetches too |
| B3 | `StatePersistence.ts` | Emit STATE_PERSISTED in `setItem` callback |
| E3 | Already done in B3 | — |

**Outcome:** All IMAGINARIUM-generated assets flow through OPERATUS 4-tier cache. Mesh, shader, palette data persists in OPFS/IDB across sessions.

### Phase 2B — "Show the Work" (Inspectability)

**Goal:** Build the OPERATUS playground — the primary demonstration of infrastructure capabilities.

| Task | Route | What It Shows |
|------|-------|---------------|
| C4 | `/zoos/manifest` | Parsed manifest.json with size/hash/tier per entry |
| C1 | `/gyms/cache-inspector` | Live cache contents, hit rates, manual invalidation |
| C2 | `/gyms/persistence-sandbox` | Save/load/export/import, IndexedDB viewer, migration test |
| F2 | `/gyms/event-stream` | Real-time EventBus log (all 27 events, color-coded by pillar) |
| C3 | `/museums/asset-lifecycle` | Animated flow diagram + live event overlay |

**Outcome:** OPERATUS playground becomes the debugging dashboard for the entire project.

### Phase 2C — "Cross-Pillar Feedback" (Integration Polish)

**Goal:** Close the OCULUS feedback loop and persist combat progress.

| Task | Files | What Changes |
|------|-------|--------------|
| B1 | `useEventSubscriptions.ts` | Subscribe to ASSETS_LOADED → update loading state |
| B2 | `useEventSubscriptions.ts` | Subscribe to STATE_PERSISTED → flash save indicator |
| E1 | `StateAdapter.ts` | Map LUDUS InventorySlot[] ↔ Item[] with registry lookup |
| E2 | `StateAdapter.ts` | Persist encounterState.defeatedBosses + battleStats into gameFlags |

**Outcome:** Player sees save feedback, combat loot persists, defeated bosses stay defeated.

### Phase 2D — "Build Pipeline" (CHRONOS Integration)

**Goal:** CHRONOS outputs enter the manifest-driven delivery pipeline.

| Task | Files | What Changes |
|------|-------|--------------|
| D1 | `ManifestGenerator.ts` | Scan for topology.json, add `chronos` section to manifest |
| D2 | `AssetLoader.ts` | Use `manifest.chronos.topologyHash` for cache invalidation |
| D3 | `turbo.json` | Add copy step: `~/.chronos/generated/` → `/generated/chronos/` |

**Outcome:** Topology data cached in browser, auto-invalidates when repo changes.

---

## Dependency Graph

```
Phase 2A (pipes)
├── A3: Pass assetLoader to ARCHITECTUS
│   ├── A1: Route mesh loading through AssetLoader
│   └── A2: Route palette/shader loading through AssetLoader
├── B3/E3: Emit STATE_PERSISTED from persist callback
│
Phase 2B (inspectability) — can start in parallel with 2A
├── C4: Manifest Catalog (needs manifest loaded)
├── C1: Cache Inspector (needs cache populated — after 2A)
├── C2: Persistence Sandbox (standalone)
├── F2: Event Stream (standalone)
└── C3: Asset Lifecycle museum (needs 2A complete for live demo)
│
Phase 2C (feedback) — requires 2A complete
├── B1: OCULUS subscribes to ASSETS_LOADED
├── B2: OCULUS subscribes to STATE_PERSISTED (requires B3)
├── E1: Inventory sync (requires Phase 1 StateAdapter)
└── E2: Encounter state sync
│
Phase 2D (build pipeline) — independent
├── D1: Manifest extension for CHRONOS
├── D2: Cache invalidation by hash
└── D3: Turbo pipeline copy step
```

---

## Top 3 Playground Priorities (Inspectability)

### 1. Cache Inspector Gym (`/gyms/cache-inspector`)

**Why first:** This is the window into whether OPERATUS is actually working. Without it, cache behavior is invisible — you can't tell if assets are being re-fetched or served from OPFS. Every other integration (mesh loading, topology caching) becomes debuggable once this exists.

**What it shows:**
- Table of all cached entries: path, size, hash, tier (memory/OPFS/IDB), last accessed
- Cache hit/miss counters per asset type
- Manual buttons: invalidate entry, clear tier, force re-fetch
- Storage quota usage bar (navigator.storage.estimate)

### 2. Manifest Catalog Zoo (`/zoos/manifest`)

**Why second:** Fastest to build (manifest.json is already structured), immediately reveals what OPERATUS is responsible for delivering. Also validates that mesh entries, mycology data, and shader paths are all correctly registered.

**What it shows:**
- Manifest version + checksum
- Shader entries with file sizes
- Palette entries with color previews
- Mesh entries with vertex/face counts, format, tier badges
- Mycology section with specimen count, network edges

### 3. Event Stream Gym (`/gyms/event-stream`)

**Why third:** Makes cross-pillar communication visible. When combined with any other playground (e.g., LUDUS combat gym emitting COMBAT_STARTED), this shows the full event flow in real time. Invaluable for debugging integration issues.

**What it shows:**
- Live scrolling log of all EventBus emissions
- Color-coded by emitting pillar (CHRONOS amber, LUDUS red, etc.)
- Payload inspection on click
- Filter by pillar or event type
- Event frequency sparkline

---

## Recommended Starting Point

**Start with Phase 2A (A3 → A1 → A2 → B3)** — 4 small changes that connect AssetBridge to AssetLoader. This is the highest-leverage work because it makes the existing infrastructure actually function. Then Phase 2B playground work becomes meaningful (cache inspector shows real data instead of empty caches).

Alternatively, **Phase 2B C2 (Persistence Sandbox) and C4 (Manifest Catalog) can start immediately** since they don't depend on 2A — they work with the already-functional persistence layer and static manifest parsing.
