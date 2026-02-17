# IMAGINARIUM Pillar Audit

> **Pillar:** The Dream Forge
> **Package:** `packages/imaginarium`
> **Mandate:** "Distill Hallucination into Determinism."
> **Date:** 2026-02-16

---

## Surface Summary

| Metric | Value |
|--------|-------|
| Index exports | 25 |
| Subpath exports | 9 |
| External consumers | 0 packages (consumed by ARCHITECTUS via root import, not subpath) |
| Test files | 21 (best coverage across all pillars) |
| EventBus emits | 6 (PALETTE_GENERATED, SHADERS_COMPILED, STORY_ARC_DERIVED, MYCOLOGY_CATALOGED x2, SEGMENT_DISTILLED) |
| EventBus listens | 0 |

## Health Assessment

### Strengths

- **Best test coverage** in the entire monorepo (21 test files)
- **Rich export surface:** 9 subpath exports for mesh-runtime, SDFs, story arcs, etc.
- **Deterministic caching:** DeterministicCache tested with cache-integration tests
- **Deep domain coverage:** mycology taxonomy, L-System compilation, SDF primitives, story arc derivation

### Weaknesses

| Issue | Severity | Detail |
|-------|----------|--------|
| **6 events emitted but never listened to** | Medium | SHADERS_COMPILED, PALETTE_GENERATED, STORY_ARC_DERIVED, MYCOLOGY_CATALOGED, SEGMENT_DISTILLED — all emitted from DistillationPipeline/SegmentPipeline but no runtime listener exists |
| **Import path hygiene** | Low | ARCHITECTUS imports from root instead of `/mesh-runtime` subpath |
| **DistillationPipeline untested** | Medium | Core orchestration pipeline has no direct tests |
| **MockTopology** | Info | Test-only, not a gap — but CHRONOS is the real source |

### EventBus Contract

| Direction | Event | Status |
|-----------|-------|--------|
| IMAGINARIUM → | PALETTE_GENERATED | Emitted from DistillationPipeline.ts:127, **never listened** |
| IMAGINARIUM → | SHADERS_COMPILED | Emitted from DistillationPipeline.ts:204, **never listened** |
| IMAGINARIUM → | STORY_ARC_DERIVED | Emitted from DistillationPipeline.ts:233, **never listened** |
| IMAGINARIUM → | MYCOLOGY_CATALOGED | Emitted from DistillationPipeline.ts:330,347, **never listened** |
| IMAGINARIUM → | SEGMENT_DISTILLED | Emitted from SegmentPipeline.ts:128, **never listened** |
| → IMAGINARIUM | TOPOLOGY_GENERATED | Should listen (CHRONOS emits) but doesn't |
| → IMAGINARIUM | PARSE_COMPLETE | Should listen (CHRONOS emits) but doesn't |

**Gap:** IMAGINARIUM emits all 6 build-time events correctly from DistillationPipeline, but no runtime listener exists in any pillar for any of them. The build-time pipeline is firing into the void.

### Test Coverage Detail

| Module | Tested | Notes |
|--------|--------|-------|
| ColorExtractor | Yes | |
| DeterministicCache | Yes | + cache-integration |
| LSystemCompiler | Yes | |
| NoiseGenerator | Yes | |
| SDFCompiler | Yes | |
| ShaderAssembler | Yes | |
| TurtleInterpreter | Yes | |
| HalfEdgeMesh | Yes | |
| mesh/pipeline | Yes | |
| mesh/serialize | Yes | |
| mycology/* (6 files) | Yes | catalog, morphology, svg, lore, network, taxonomy |
| storyarc/* (5 files) | Yes | deriver, integration, mood, phase, slicer |
| **DistillationPipeline** | **No** | Core orchestration |
| **ManifestGenerator** | **No** | Asset manifest creation |
| **SegmentPipeline** | **No** | Segment-level processing |
| **mesh/ops/** | **No** | displace, smooth, subdivide |

---

## Directive Alignment

IMAGINARIUM has no directives in D1-D10 (ARCHITECTUS-scoped). Its relationship to directives:

| ARCHITECTUS Directive | IMAGINARIUM Role | Status |
|-----------------------|-----------------|--------|
| D5 (SDF in LOD) | Provides SDF shaders consumed by SDFBackdrop | Shaders exist but SHADERS_COMPILED event unwired |
| D7 (SegmentMapper) | Provides StoryArc via STORY_ARC_DERIVED | Event defined but never emitted |
| D3 (Adaptive LOD) | Quality tier controls IMAGINARIUM shader complexity | Indirect — uniforms passed, no direct dependency |

### IMAGINARIUM-Specific Priorities

1. **Wire listeners for build-time events** — All 6 events are emitted but nobody subscribes; ARCHITECTUS needs listeners for SHADERS_COMPILED, PALETTE_GENERATED, MYCOLOGY_CATALOGED, SEGMENT_DISTILLED
2. **Listen for TOPOLOGY_GENERATED / PARSE_COMPLETE** — Complete the CHRONOS → IMAGINARIUM pipeline
3. **Test DistillationPipeline** — Core orchestration logic has no tests
4. **Fix subpath import hygiene** — Ensure ARCHITECTUS uses `/mesh-runtime` not root

---

*Audit version: 1.0.0*
