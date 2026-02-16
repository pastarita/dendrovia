# PR: feat/architectus-spatial-index-error-boundary

```
+--------------------------------------------------------------+
|   feat/architectus-spatial-index-error-boundary              |
+--------------------------------------------------------------+
|                      ** MODERATE **                           |
|                                                              |
|          skip  [ARCHITECTUS]  skip                           |
|                   mullet x 1                                 |
|                                                              |
|                [architectus] [docs]                          |
|                                                              |
|           files: 6 | +974 / -60                             |
+--------------------------------------------------------------+
|   "Innovation through iteration"                             |
+--------------------------------------------------------------+
```

Compact: ** [architectus,docs] mullet x1 skip +974/-60

---

## Summary

Implements the first two ARCHITECTUS directives (D1 and D10) from the renderer improvement plan. D1 replaces the O(n) linear proximity scan in BranchTracker with a 3D spatial hash grid for O(1) average-case nearest-node queries. D10 wraps the R3F Canvas in a React Error Boundary so scene crashes show a themed fallback instead of a blank screen.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| SpatialIndex | 3D spatial hash grid with auto-computed cell size, nearestNode/queryRadius/nearestSegment APIs | Complete |
| ErrorBoundary | React class Error Boundary with Tron-themed fallback UI, retry button, console logging | Complete |
| BranchTracker refactor | Swapped O(n) linear scan for SpatialIndex.nearestNode() call | Complete |
| Canvas crash resilience | ErrorBoundary wraps Canvas with palette-matched colors | Complete |
| Directives document | 10-directive implementation plan with 4 parallel execution lanes | Complete |

## Files Changed

```
packages/architectus/src/
  systems/
    SpatialIndex.ts          ++ NEW: 3D spatial hash grid (240 lines)
  components/
    ErrorBoundary.tsx        ++ NEW: React Error Boundary with themed fallback
    DendriteWorld.tsx        ~  BranchTracker uses SpatialIndex, removed O(n) scan
  App.tsx                    ~  Canvas wrapped in ErrorBoundary
  index.ts                   ~  Barrel exports for SpatialIndex + NearestSegmentResult
docs/
  ARCHITECTUS_DIRECTIVES.md  ++ NEW: Full 10-directive implementation plan
```

## Commits

1. `8e8d4bd` feat(architectus): add SpatialIndex for O(1) proximity queries and ErrorBoundary

## Test Plan

- [ ] Scene renders identically to before (no visual regression)
- [ ] BRANCH_ENTERED events still fire when camera moves near nodes
- [ ] Proximity detection works correctly with SpatialIndex
- [ ] Intentionally throwing in a scene component triggers ErrorBoundary fallback
- [ ] Retry button in ErrorBoundary remounts the Canvas
- [ ] TypeScript compiles with zero architectus errors
