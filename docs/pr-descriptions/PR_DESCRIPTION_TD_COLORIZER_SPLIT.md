# PR: refactor/td-colorizer-split

```
+--------------------------------------------------------------+
|   refactor/td-colorizer-split                                |
+--------------------------------------------------------------+
|                      * minor                                 |
|                                                              |
|          WARN  [SHIELD]  WARN                                |
|                   bend x 1                                   |
|                                                              |
|                [operatus]                                    |
|                                                              |
|           files: 4 | +221 / -159                             |
+--------------------------------------------------------------+
|   "Structure renewed"                                        |
+--------------------------------------------------------------+
```

Compact: * [operatus] bend x1 WARN/WARN/WARN/skip +221/-159

## Summary

Splits the overloaded `td-colorizer.ts` into two focused files: a pure colorizer library (`turbo-colors.ts`) and an orchestrator entry point (`td.ts`). Also fixes a turbo binary resolution crash and simplifies browser launch from a 7-tab blast to single-tab refresh-or-open on the Quest hub.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| File split | `td-colorizer.ts` decomposed into `turbo-colors.ts` (library) + `td.ts` (entry point) | Complete |
| Turbo resolution fix | Resolves `node_modules/.bin/turbo` instead of bare `spawn('turbo', ...)` which crashed with `ENOENT` | Complete |
| Brave simplification | Replaces 7-port `launchBrave()` with single-tab refresh-or-open on `:3010` (Quest hub) | Complete |

## Files Changed

```
dendrovia/
  package.json                    — td/td:nobrowser scripts point to td.ts
  scripts/
    td-colorizer.ts               — DELETED (replaced by td.ts + turbo-colors.ts)
    td.ts                         — NEW: orchestrator (spawn turbo, pipe, browser)
    turbo-colors.ts               — NEW: pure colorizer library (colorizeLine export)
```

## Commits

1. `04c1476` refactor(operatus): split td-colorizer into td.ts + turbo-colors.ts

## Test Plan

- [x] `bun run td --no-browser` — pillar-colored turbo output, no browser
- [x] `bun run td` — colored output + Brave opens/refreshes `:3010`
- [x] `scripts/td-colorizer.ts` is gone
- [x] Castle Walls Wall 1 (secrets) clean
