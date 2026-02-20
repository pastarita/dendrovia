# PR: D1 SpatialIndex Tests + D11 Segment Gate

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/architectus-d1-tests-d11-segment-gate                 |
+--------------------------------------------------------------+
|                       * MINOR                                |
|                                                              |
|            WARN  [Azure]  WARN                               |
|                  cross x 2                                   |
|                  scales x 1                                  |
|                                                              |
|                [architectus]                                 |
|                                                              |
|           files: 4 | +399 / -10                             |
+--------------------------------------------------------------+
|   "The path made clear"                                      |
+--------------------------------------------------------------+
```

**Compact:** * [architectus] cross x2 scales x1 WARN/WARN/pass/FAIL +399/-10

---

## Summary

Adds 26 unit tests for SpatialIndex (D1) and gates downstream segment loading (D11) to prevent 404 cascades when chunk files are absent. The segment gate introduces an `error` load state and a probe-first pattern that converts 5-request failures into 1-request failures.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| D1 SpatialIndex tests | 26 tests covering construction, rebuild, nearestNode, queryRadius, nearestSegment, diagnostics | Complete |
| D11 `error` load state | Failed segments stay in `error` state, skipped by evaluateSegmentLoading | Complete |
| D11 probe-first loading | `loadSegmentData()` fetches topology first; bails on 404 before the other 4 requests | Complete |

## Files Changed

```
packages/architectus/
  __tests__/
    spatial-index.test.ts          NEW  26 tests for SpatialIndex
  src/
    store/
      useSegmentStore.ts           Add 'error' to SegmentLoadState union
    loader/
      SegmentLoadManager.ts        Set 'error' on failure instead of 'hull'
      AssetBridge.ts               Probe-first: fetch topology, bail if null
```

## Commits

1. `89e247b` fix(architectus): gate segment loading to prevent 404 cascade
2. `30fc16a` test(architectus): add SpatialIndex tests (D1)
3. `cc9041b` fix(architectus): gate downstream segment requests (D11)

## Test Plan

- [x] `bun test packages/architectus/__tests__/spatial-index.test.ts` — 26 pass
- [x] `bun test packages/architectus/__tests__/` — 152 pass (all ARCHITECTUS tests)
- [x] `bun test` — 1155 pass, 0 fail (full monorepo suite)
- [ ] Manual: deploy app without segment chunk files, verify max 3 topology probes then stop
- [ ] Manual: inspect segment store — failed segments show `error` state, not retried
