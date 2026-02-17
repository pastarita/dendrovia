# Cross-Pillar Surface Audit

> **Date:** 2026-02-16
> **Scope:** All 6 pillars + shared contracts
> **Baseline:** Post-rebase onto origin/main, zero TS errors, 757 modules, 4.19s build

---

## EventBus Contract Matrix

### Events Defined (32 total)

| Category | Events | Count |
|----------|--------|-------|
| ARCHITECTUS → LUDUS | PLAYER_MOVED, BRANCH_ENTERED, NODE_CLICKED, COLLISION_DETECTED | 4 |
| LUDUS → ARCHITECTUS | ENCOUNTER_TRIGGERED, DAMAGE_DEALT | 2 |
| LUDUS → OCULUS | HEALTH_CHANGED, MANA_CHANGED, QUEST_UPDATED, COMBAT_STARTED, COMBAT_ENDED | 5 |
| LUDUS combat granularity | COMBAT_TURN_START, COMBAT_TURN_END, SPELL_RESOLVED, STATUS_EFFECT_APPLIED, STATUS_EFFECT_EXPIRED, EXPERIENCE_GAINED, LEVEL_UP, LOOT_DROPPED | 8 |
| OCULUS → LUDUS | SPELL_CAST, ITEM_USED | 2 |
| CHRONOS → IMAGINARIUM | PARSE_COMPLETE, TOPOLOGY_GENERATED | 2 |
| IMAGINARIUM → ARCHITECTUS | SHADERS_COMPILED, PALETTE_GENERATED, MYCOLOGY_CATALOGED, STORY_ARC_DERIVED, SEGMENT_DISTILLED | 5 |
| ARCHITECTUS runtime | SEGMENT_ENTERED | 1 |
| OPERATUS → All | ASSETS_LOADED, STATE_PERSISTED, CACHE_UPDATED, SAVE_COMPLETED | 4 |
| Lifecycle | GAME_STARTED, LEVEL_LOADED | 2 |

### Emit Matrix

| Event | Emitted By | File |
|-------|-----------|------|
| PLAYER_MOVED | ARCHITECTUS | CameraRig.tsx:357 |
| BRANCH_ENTERED | ARCHITECTUS | DendriteWorld.tsx:85 |
| NODE_CLICKED | ARCHITECTUS | NodeInstances.tsx:134 |
| NODE_CLICKED | OCULUS | Minimap.tsx:76 |
| PARSE_COMPLETE | CHRONOS | pipeline.ts:171 |
| TOPOLOGY_GENERATED | CHRONOS | pipeline.ts:243 |
| PALETTE_GENERATED | IMAGINARIUM | DistillationPipeline.ts:127 |
| SHADERS_COMPILED | IMAGINARIUM | DistillationPipeline.ts:204 |
| STORY_ARC_DERIVED | IMAGINARIUM | DistillationPipeline.ts:233 |
| MYCOLOGY_CATALOGED | IMAGINARIUM | DistillationPipeline.ts:330,347 |
| SEGMENT_DISTILLED | IMAGINARIUM | SegmentPipeline.ts:128 |
| SPELL_CAST | OCULUS | BattleUI.tsx:49,57 |
| ASSETS_LOADED | OPERATUS | AssetLoader.ts:250, init.ts:211,238 |
| STATE_PERSISTED | OPERATUS | StatePersistence.ts:316 |
| CACHE_UPDATED | OPERATUS | CacheManager.ts:362 |
| SAVE_COMPLETED | OPERATUS | AutoSave.ts:120 |
| HEALTH_CHANGED | LUDUS | GameStore.ts:72 |
| MANA_CHANGED | LUDUS | GameStore.ts:82 |
| QUEST_UPDATED | LUDUS | GameStore.ts:96 |
| _All combat events (12)_ | LUDUS | EventWiring.ts:187-410 |

### Listen Matrix

| Pillar | Events Listened | Count | File |
|--------|----------------|-------|------|
| ARCHITECTUS | ENCOUNTER_TRIGGERED, DAMAGE_DEALT | 2 | DendriteWorld.tsx |
| LUDUS | NODE_CLICKED, PLAYER_MOVED, SPELL_CAST, ITEM_USED | 4 | EventWiring.ts |
| OCULUS | 21 events (full combat + spatial + lifecycle) | 21 | useEventSubscriptions.ts |
| OPERATUS | GAME_STARTED, LEVEL_LOADED, QUEST_UPDATED, COMBAT_ENDED, BRANCH_ENTERED, CACHE_UPDATED, SAVE_COMPLETED, ASSETS_LOADED | 8 | init.ts, AutoSave.ts, bridge.ts |

### Contract Gaps

| Gap Type | Events | Severity |
|----------|--------|----------|
| Emitted but never listened | PARSE_COMPLETE, PALETTE_GENERATED, SHADERS_COMPILED, STORY_ARC_DERIVED, MYCOLOGY_CATALOGED, SEGMENT_DISTILLED, STATE_PERSISTED | High — build-time pipeline disconnected at runtime |
| Listened but never emitted | COLLISION_DETECTED (OCULUS listens), ITEM_USED (LUDUS + OCULUS listen), GAME_STARTED (OPERATUS listens), LEVEL_LOADED (OPERATUS listens) | High |
| Defined but completely unused | SEGMENT_ENTERED | Low |
| Under-subscribed | ARCHITECTUS handles 2/21 events OCULUS subscribes to | High |

**Critical insight:** The build-time pipeline (CHRONOS → IMAGINARIUM → ARCHITECTUS) emits 7 events but no runtime listener exists for any of them. Production pillars have no wiring for these build-time events.

---

## Cross-Pillar Import Dependency Graph

### Package Dependencies

```
Layer 0 (foundation):  shared
                       ├─→ chronos
                       ├─→ imaginarium
                       ├─→ architectus
                       ├─→ ludus
                       ├─→ oculus
                       └─→ operatus

Layer 1 (cross-pillar):
  imaginarium ──→ architectus  (root import, 2 files)
  imaginarium ──→ operatus     (./mesh-runtime subpath, 2 files)

Layer 2 (leaf nodes — consumed only by apps):
  chronos, ludus, oculus, architectus, operatus
```

**Key finding:** Two cross-pillar import edges exist (imaginarium → architectus, imaginarium → operatus). All other inter-pillar communication flows exclusively through the EventBus. The graph is a clean DAG with no circular dependencies.

### Export Surface

| Package | Index Exports | Subpath Exports | External Consumers |
|---------|--------------|-----------------|-------------------|
| shared | 5 re-exports | events, types, contracts | All 6 pillars |
| chronos | 14 | 0 | Zero packages (apps only) |
| imaginarium | 25 | 9 (mesh-runtime, etc.) | Zero packages (apps only) |
| architectus | 36 | dendrite (broken) | Zero packages (apps only) |
| ludus | 17 | 0 | Zero packages (apps only) |
| oculus | 31 | 0 | Zero packages (7 apps) |
| operatus | 19 | dendrite, manifest | Zero packages (apps only) |

### Import Hygiene Issues

| Issue | Location | Impact |
|-------|----------|--------|
| CHRONOS uses `.js` import extensions | chronos/src/*.ts | Blocks Turbopack resolution |
| ARCHITECTUS `./dendrite` sub-export references non-existent `src/dendrite/index.ts` | architectus package.json | Broken barrel export |
| `@dendrovia/ui` referenced in CLAUDE.md but package never created | CLAUDE.md | Doc drift |
| Both LUDUS and OPERATUS define `GameStore` | ludus/state/, operatus/persistence/ | Naming collision risk |
| 7/8 IMAGINARIUM subpath exports orphaned | imaginarium package.json | Only `./mesh-runtime` consumed; rest unused |
| 3 shared subpath exports orphaned | shared package.json | `./contracts`, `./logger-types`, `./magnitude` never imported via subpath |
| CHRONOS re-exports shared types | chronos/src/index.ts | Creates facade where consumers could import shared types from chronos (benign since chronos has zero consumers) |
| No app-layer integration package | monorepo-wide | Leaf pillars lack a dedicated integration layer |

---

## Test Coverage Summary

| Package | Test Files | Coverage Quality | Critical Untested |
|---------|-----------|-----------------|-------------------|
| **shared** | 0 | None | EventBus, types, contracts, schemas |
| **chronos** | 7 | Partial | GitParser, ASTParser, pipeline, DeepWikiFetcher |
| **imaginarium** | 21 | Best | DistillationPipeline, MockTopology, mesh ops |
| **architectus** | 4 | Minimal | AssetBridge, CameraRig, DendriteWorld, SpatialIndex |
| **ludus** | 4 | Partial | TurnBasedEngine, EnemyAI, EventWiring, QuestGenerator |
| **oculus** | 2 | Minimal | All UI components, useEventSubscriptions, useCodeLoader |
| **operatus** | 11 | Good | MultiplayerClient, OPFS/IDB caches |

**Total: 49 test files. Zero TODO/FIXME/HACK comments in entire codebase.**

### Critical Untested Paths (Top 5)

1. **shared/EventBus** — Zero tests on the core inter-pillar communication bus
2. **architectus/AssetBridge** — 15+ null-return error paths, failure = blank screen
3. **ludus/TurnBasedEngine** — 625+ lines, core combat loop, only indirectly tested
4. **chronos/GitParser** — Primary input parser, many null-guard paths
5. **architectus/SpatialIndex** — New spatial partitioning system, completely untested

---

## Tooling & Infrastructure

### Turbo Pipeline Gaps

| Script | Pillar Packages With It | Missing From |
|--------|------------------------|-------------|
| `build` | shared, imaginarium, architectus | chronos, ludus, operatus |
| `lint` | _(none)_ | **All 7 pillar packages** |
| `test` | All 7 | ui |
| `check-types` | _(none)_ | **All 7 pillar packages** |
| `clean` | imaginarium only | All others |

**`turbo run lint` silently skips all production code.** Only apps and 2 tooling packages are linted.

### TypeScript Project References

No packages use project `references`. All packages resolve workspace deps purely through Bun's workspace resolution. `tsc --build` mode cannot work across the monorepo.

### Scope Inconsistency

| Scope | Packages |
|-------|----------|
| `@dendrovia/*` | All 7 pillars, shared, dendrite |
| `@repo/*` | ui, eslint-config, typescript-config |

Two naming scopes coexist.

### Duplicate Patterns

| Pattern | Locations | Resolution |
|---------|-----------|------------|
| GameStore (zustand) | ludus/state/GameStore.ts, operatus/persistence/GameStore.ts | Clarify ownership; extract interface to shared/contracts |
| Bridge pattern | architectus/dendrite/bridge.ts, operatus/dendrite/bridge.ts | Duplicated dendrite bridge abstraction |
| Math utils (clamp/lerp/smoothstep) | architectus (3 files), imaginarium, operatus | Extract to shared/src/math.ts |
| Logger creation | shared/logger.ts pre-builds only 3 pillar loggers (chronos, imaginarium, operatus) | Missing: architectus, ludus, oculus |
| Post-processing | architectus/PostProcessing.tsx | Bloom config |

### Version Skew

| Dependency | Versions Used |
|------------|--------------|
| zustand | `^5.0.0` (operatus), `^5.0.2` (ludus, oculus), `^5.0.3` (architectus) |

### Dead Dependencies

| Package | Dependency | Status |
|---------|-----------|--------|
| operatus | `lz-string` | In optionalDependencies, zero imports |
| architectus | `postprocessing` | Direct dep but only `@react-three/postprocessing` imported |
| lib/dendrite | `@xyflow/react`, `@dagrejs/dagre`, `immer` | Orphaned package, no consumers |

### Recommended Actions (Ranked)

| # | Action | Impact | Scope |
|---|--------|--------|-------|
| 1 | **Add `build`, `lint`, `check-types` scripts to all pillar packages** | Turbo silently skips them; production code unlinted | All 7 pillars |
| 2 | **Add EventBus tests to shared** | Highest blast radius on regression; zero tests on core bus | shared |
| 3 | **Fix CHRONOS `.js` extensions** | Blocks Turbopack resolution for all consumers | chronos |
| 4 | **Unify `@repo/*` and `@dendrovia/*` scopes** | Two naming conventions create confusion | monorepo-wide |
| 5 | **Resolve dual GameStore** | Overlapping state ownership between ludus and operatus | ludus, operatus, shared |
| 6 | **Consolidate math utils into shared** | clamp/lerp/smoothstep reimplemented 3+ times | shared |
| 7 | **Fix ARCHITECTUS `./dendrite` sub-export** | Broken barrel export | architectus |
| 8 | **Wire GAME_STARTED / LEVEL_LOADED emitters** | OPERATUS listens but nobody emits | lifecycle gap |
| 9 | **Pin zustand to single version** | Version skew across 5 packages | monorepo-wide |
| 10 | **Delete or integrate `lib/dendrite`** | Orphaned workspace member with no consumers | lib/dendrite |

---

## Recommended Feature Branches

| Branch | Scope | Priority |
|--------|-------|----------|
| `feat/architectus-d8-extended-vfx` | D8+ combat event coverage in ARCHITECTUS | P1 |
| `feat/architectus-meshfactory-l3` | Wire MeshFactory + binary cache from OPERATUS | P2 |
| `feat/oculus-combat-hud` | Subscribe OCULUS to LUDUS combat events | P2 |
| `feat/operatus-save-state` | GameSaveState persistence end-to-end | P2 |
| `feat/imaginarium-segment-shaders` | Per-mood SDF shader variants | P3 |
| `chore/shared-eventbus-tests` | EventBus + contracts test suite | P0 |
| `fix/chronos-js-extensions` | Remove .js extensions from CHRONOS imports | P1 |

---

*Generated: 2026-02-16*
*Audit version: 1.0.0*
