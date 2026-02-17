# OPERATUS Pillar Audit

> **Pillar:** The Backbone
> **Package:** `packages/operatus`
> **Mandate:** "Persist the World."
> **Date:** 2026-02-16

---

## Surface Summary

| Metric | Value |
|--------|-------|
| Index exports | 19 |
| Subpath exports | 2 (dendrite, manifest) |
| External consumers | 0 packages (self-references in comments only) |
| Test files | 11 (second-best coverage) |
| EventBus emits | 1 (STATE_PERSISTED) |
| EventBus listens | 8 events |

## Health Assessment

### Strengths

- **Strong test coverage:** 11 test files covering AssetLoader, AutoSave, CacheManager, CrossTabSync, GameStore, ManifestHealth, Manifest, PerfMonitor, StatePersistence, StateAdapter
- **Comprehensive EventBus listening:** 8 events including lifecycle (GAME_STARTED, LEVEL_LOADED) and game state (QUEST_UPDATED, COMBAT_ENDED, BRANCH_ENTERED)
- **Rich infrastructure:** Persistence, caching, CDN loading, cross-tab sync, performance monitoring

### Weaknesses

| Issue | Severity | Detail |
|-------|----------|--------|
| **Completely disconnected from other pillars** | High | No package imports @dendrovia/operatus — MeshFactory, PerfMonitor, persistence all orphaned |
| **`initializeOperatus` never called** | High | Init function exists but no consumer invokes it |
| **No destroy() cleanup** | Medium | Resources allocated by init have no teardown path |
| **MultiplayerClient untested** | Medium | Full WebSocket client (stretch goal) with zero tests |
| **Listens for events never emitted** | Medium | GAME_STARTED, LEVEL_LOADED — nobody emits these |
| **STATE_PERSISTED emitted but never listened** | Low | OPERATUS emits, nobody subscribes |
| **GameStore naming collision** | Low | Both LUDUS and OPERATUS define GameStore |

### EventBus Contract

| Direction | Event | Status |
|-----------|-------|--------|
| OPERATUS → | STATE_PERSISTED | Emitted from StatePersistence.ts:316, **never listened** |
| → OPERATUS | GAME_STARTED | Listened in init.ts:236, **never emitted by any pillar** |
| → OPERATUS | LEVEL_LOADED | Listened in init.ts:246, **never emitted by any pillar** |
| → OPERATUS | QUEST_UPDATED | Listened in AutoSave.ts:177 |
| → OPERATUS | COMBAT_ENDED | Listened in AutoSave.ts:185 |
| → OPERATUS | BRANCH_ENTERED | Listened in AutoSave.ts:191 |
| → OPERATUS | CACHE_UPDATED | Listened in bridge.ts:212 |
| → OPERATUS | SAVE_COMPLETED | Listened in bridge.ts:224 |
| → OPERATUS | ASSETS_LOADED | Listened in bridge.ts:236 |

**Critical gap:** GAME_STARTED and LEVEL_LOADED are lifecycle events that OPERATUS depends on for asset preloading and initialization — but no pillar ever emits them.

### Test Coverage Detail

| Module | Tested | Notes |
|--------|--------|-------|
| AssetLoader | Yes | Asset loading pipeline |
| AutoSave | Yes | Automatic save triggers |
| CacheManager | Yes | Cache eviction/retrieval |
| CDNLoader | Yes | CDN asset fetching |
| CrossTabSync | Yes | Multi-tab state sync |
| GameStore | Yes | Zustand store |
| ManifestHealth | Yes | Manifest validation |
| Manifest | Yes | Asset manifest parsing |
| PerfMonitor | Yes | Performance metrics |
| StatePersistence | Yes | Save/load cycle |
| StateAdapter | Yes | LUDUS ↔ OPERATUS bridge |
| **MultiplayerClient** | **No** | Full WebSocket client (stretch goal) |
| **OPFSCache** | **No** | Origin Private File System |
| **IDBCache** | **No** | IndexedDB cache layer |
| **sw/service-worker** | **No** | Service worker registration |
| **dendrite/**** | **No** | Dendrite bridge, health, collectors |

---

## Directive Alignment

OPERATUS has no directives in D1-D10 (ARCHITECTUS-scoped). Its relationship:

| ARCHITECTUS Directive | OPERATUS Role | Status |
|-----------------------|--------------|--------|
| D2 (WebGPU Backend) | OPERATUS PerfMonitor needs to handle both renderer info APIs | Not yet adapted |
| D3 (Adaptive LOD) | OPERATUS PerfMonitor feeds FPS data for quality tuning | PerfMonitor exists, not wired to quality controller |
| D6 (Particle System) | OPERATUS could cache particle configs | No integration |

### Dedicated OPERATUS Documents

Additional prioritization documents exist:
- `docs/OPERATUS_INTERFACE_PRIORITIZATION.md`
- `docs/OPERATUS_PHASE2_PRIORITIZATION.md`

### OPERATUS-Specific Priorities

1. **Wire `initializeOperatus` call** — Nobody calls the init function
2. **Emit GAME_STARTED + LEVEL_LOADED** — OPERATUS listens but nobody emits these lifecycle events
3. **Wire MeshFactory to ARCHITECTUS** — L3 mesh pipeline is orphaned
4. **Add destroy() cleanup** — No teardown path for allocated resources
5. **Test MultiplayerClient** — Full WebSocket client with zero coverage
6. **Resolve GameStore naming** — Both LUDUS and OPERATUS export GameStore

---

*Audit version: 1.0.0*
