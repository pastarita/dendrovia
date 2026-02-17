# CHRONOS Pillar Audit

> **Pillar:** The Timekeeper
> **Package:** `packages/chronos`
> **Mandate:** "Translate History into Topology."
> **Date:** 2026-02-16

---

## Surface Summary

| Metric | Value |
|--------|-------|
| Index exports | 14 |
| External consumers | 0 packages (apps only) |
| Test files | 7 |
| EventBus emits | 2 (PARSE_COMPLETE, TOPOLOGY_GENERATED) |
| EventBus listens | 0 |

## Health Assessment

### Strengths

- **Test coverage on enrichment layer:** ComplexityAnalyzer, GoParser, TreeBuilder, CommitClassifier, ContributorProfiler, HotspotDetector, TopologyBuilder all tested
- **Clean EventBus emit:** Single TOPOLOGY_GENERATED emission from pipeline.ts with proper payload
- **No dependency on other pillar packages** (only shared)

### Weaknesses

| Issue | Severity | Detail |
|-------|----------|--------|
| **Zero runtime consumers** | High | No package imports `@dendrovia/chronos` — all 39 exports orphaned at package level |
| **`.js` import extensions** | High | Blocks Turbopack resolution; prevents any pillar from consuming CHRONOS |
| **Critical modules untested** | High | GitParser, ASTParser, pipeline.ts, DeepWikiFetcher have zero test coverage |
| **CHRONOS → IMAGINARIUM pipeline undocumented wiring** | Medium | Documented in architecture but not implemented as runtime integration |

### EventBus Contract

| Direction | Event | Status |
|-----------|-------|--------|
| CHRONOS → | PARSE_COMPLETE | Emitted from pipeline.ts:171, **never listened** |
| CHRONOS → | TOPOLOGY_GENERATED | Emitted from pipeline.ts:243, **never listened** |

**Gap:** Both events are emitted correctly but no pillar subscribes to either at runtime. IMAGINARIUM should listen to TOPOLOGY_GENERATED to trigger the distillation pipeline.

### Test Coverage Detail

| Module | Tested | Status |
|--------|--------|--------|
| ComplexityAnalyzer | Yes | 7 tests |
| GoParser | Yes | Covered |
| TreeBuilder | Yes | Covered |
| CommitClassifier | Yes | Covered |
| ContributorProfiler | Yes | Covered |
| HotspotDetector | Yes | Covered |
| TopologyBuilder | Yes | Covered |
| **GitParser** | **No** | Raw git log parsing, many guard paths |
| **ASTParser** | **No** | Multi-language AST extraction |
| **pipeline.ts** | **No** | Full orchestration pipeline |
| **DeepWikiFetcher** | **No** | External API + cache, 6 null-return paths |
| **RepoResolver** | **No** | Path resolution |
| **TopologyEnricher** | **No** | Enrichment orchestrator |

---

## Directive Alignment

CHRONOS has **no directives** in the ARCHITECTUS Directives document (D1-D10 are ARCHITECTUS-scoped). However, CHRONOS is a critical upstream dependency:

| ARCHITECTUS Directive | CHRONOS Dependency | Status |
|-----------------------|-------------------|--------|
| D1 (Spatial Hash) | Consumes CHRONOS topology data | Indirect — topology flows through AssetBridge |
| D7 (SegmentMapper) | Needs StoryArc from CHRONOS pipeline | Blocked — CHRONOS → IMAGINARIUM pipeline not wired |

### CHRONOS-Specific Priorities

1. **Fix `.js` extensions** — Unblock downstream consumers
2. **Test GitParser + ASTParser** — Primary input parsers are the foundation of all downstream data
3. **Wire CHRONOS → IMAGINARIUM pipeline listeners** — Both PARSE_COMPLETE and TOPOLOGY_GENERATED are emitted but IMAGINARIUM never subscribes
4. **OCULUS subscribes to TOPOLOGY_GENERATED** — Working correctly

---

*Audit version: 1.0.0*
