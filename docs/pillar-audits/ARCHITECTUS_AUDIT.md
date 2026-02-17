# ARCHITECTUS Pillar Audit

> **Pillar:** The Reality Engine
> **Package:** `packages/architectus`
> **Mandate:** "Render the Truth without Fog."
> **Date:** 2026-02-16

---

## Surface Summary

| Metric | Value |
|--------|-------|
| Index exports | 36 |
| Subpath exports | 1 (dendrite — broken) |
| External consumers | 3 apps |
| Test files | 4 |
| EventBus emits | 3 (PLAYER_MOVED, BRANCH_ENTERED, NODE_CLICKED) |
| EventBus listens | 2 (ENCOUNTER_TRIGGERED, DAMAGE_DEALT) |
| Orphaned exports | ~20 |

## Health Assessment

### Strengths

- **Core spatial events wired:** PLAYER_MOVED and BRANCH_ENTERED emitted correctly
- **ENCOUNTER_TRIGGERED + DAMAGE_DEALT listeners** functional in DendriteWorld
- **SpatialIndex system implemented** (new, replaces O(n) BranchTracker)
- **GPU detection pipeline** complete (detectGPU, quality tiers)

### Weaknesses

| Issue | Severity | Detail |
|-------|----------|--------|
| **Only 2/11 LUDUS events handled** | High | OCULUS subscribes to 21 events; ARCHITECTUS only handles ENCOUNTER_TRIGGERED + DAMAGE_DEALT |
| **Zero tests on rendering components** | High | CameraRig, DendriteWorld, SDFBackdrop, NodeInstances all untested |
| **AssetBridge untested** | High | 15+ null-return error paths; failure = blank screen |
| **`./dendrite` sub-export broken** | Medium | References non-existent src/dendrite/index.ts |
| **COLLISION_DETECTED never emitted** | Medium | Spec'd in CLAUDE.md, type exists, never implemented |
| **SpatialIndex untested** | Medium | New system with no test coverage |

### EventBus Contract

| Direction | Event | Status |
|-----------|-------|--------|
| ARCHITECTUS → | PLAYER_MOVED | Emitted from CameraRig.tsx:357 |
| ARCHITECTUS → | BRANCH_ENTERED | Emitted from DendriteWorld.tsx:85 |
| ARCHITECTUS → | NODE_CLICKED | Emitted from NodeInstances.tsx:134 |
| ARCHITECTUS → | COLLISION_DETECTED | **Never emitted** (spec'd in CLAUDE.md) |
| ARCHITECTUS → | SEGMENT_ENTERED | **Never emitted** |
| → ARCHITECTUS | ENCOUNTER_TRIGGERED | Listened in DendriteWorld.tsx:159 |
| → ARCHITECTUS | DAMAGE_DEALT | Listened in DendriteWorld.tsx:175 |
| → ARCHITECTUS | COMBAT_STARTED | **Not listened** (OCULUS handles) |
| → ARCHITECTUS | COMBAT_ENDED | **Not listened** |
| → ARCHITECTUS | SPELL_RESOLVED | **Not listened** |
| → ARCHITECTUS | STATUS_EFFECT_APPLIED | **Not listened** |
| → ARCHITECTUS | STATUS_EFFECT_EXPIRED | **Not listened** |
| → ARCHITECTUS | EXPERIENCE_GAINED | **Not listened** |
| → ARCHITECTUS | LEVEL_UP | **Not listened** |
| → ARCHITECTUS | LOOT_DROPPED | **Not listened** |
| → ARCHITECTUS | DAMAGE_DEALT | **Not listened** (wait — it IS listened) |

**Summary:** ARCHITECTUS handles 2 of the 11 combat events defined in the LUDUS → ARCHITECTUS direction. The remaining 9 need VFX implementations (D8 scope).

### Test Coverage Detail

| Module | Tested | Notes |
|--------|--------|-------|
| detectGPU | Yes | GPU capability detection |
| LSystem | Yes | L-System grammar |
| renderer-store | Yes | Zustand store |
| TurtleInterpreter | Yes | Topology → geometry |
| **AssetBridge** | **No** | 15+ error paths |
| **CameraRig** | **No** | Falcon/Player modes |
| **DendriteWorld** | **No** | Main scene graph |
| **SpatialIndex** | **No** | New spatial hash |
| **SegmentMapper** | **No** | Story arc → geometry |
| **SDFBackdrop** | **No** | SDF raymarching |
| **PostProcessing/TSL** | **No** | WebGPU effects |
| **ParticleSystem** | **No** | GPU particles |
| **NodeInstances** | **No** | Instanced rendering |
| **BranchInstances** | **No** | Instanced rendering |

---

## Directive Alignment

ARCHITECTUS owns all 10 directives (D1-D10). Current status against each:

| Directive | Lane | Priority | Status | Blockers |
|-----------|------|----------|--------|----------|
| **D1: Spatial Hash** | A | P0 | Implemented (SpatialIndex.ts exists) | Needs tests |
| **D2: WebGPU Backend** | B | P0 | Partial (detectGPU done, createRenderer not wired) | R3F gl prop integration |
| **D3: Adaptive LOD** | C | P1 | Not started | FPS history + hysteresis logic |
| **D4: Surface Camera** | A | P1 | Not started | Depends on D1 (met) |
| **D5: SDF in LOD** | C | P2 | Not started | Depends on D3 |
| **D6: Particle System** | C | P2 | Scaffold exists (ParticleSystem.ts, ParticleInstances.tsx) | WebGPU compute path |
| **D7: SegmentMapper** | D | P2 | Not started | StoryArc data from IMAGINARIUM unwired |
| **D8: Event Feedback** | C | P3 | 2/11 events wired | Depends on D6 for burst() |
| **D9: TSL PostProcessing** | B | P3 | Component exists but unused | Depends on D2 |
| **D10: Error Boundary** | D | P3 | Not started | Independent, trivial |

### Next Actions for ARCHITECTUS

1. **Test SpatialIndex** — D1 implemented but unverified
2. **Start D4 (Surface Camera)** — D1 dependency met, critical path item
3. **Wire D2 (WebGPU Backend)** — createRenderer.ts → R3F Canvas gl prop
4. **Expand D8 coverage** — Handle remaining 9 combat events with VFX
5. **Fix `./dendrite` barrel export** — Broken sub-export path
6. **Emit COLLISION_DETECTED** — Spec'd in CLAUDE.md but never implemented

---

*Audit version: 1.0.0*
