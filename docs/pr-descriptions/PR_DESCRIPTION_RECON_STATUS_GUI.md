# PR: ReconStatusBar GUI Widget

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/recon-status-gui                                      |
+--------------------------------------------------------------+
|                       * MINOR                                |
|                                                              |
|           pass  [PER-PALE]  skip                             |
|                  mullet x 3                                  |
|                                                              |
|               [oculus] [app]                                 |
|                                                              |
|           files: 9 | +400 / -0                              |
+--------------------------------------------------------------+
|   "New horizons"                                             |
+--------------------------------------------------------------+
```

**Compact:** * [oculus][app] mullet x3 pass/skip/skip/skip +400/-0

---

## Summary

Adds a compact ReconStatusBar sidebar widget to all 6 playground apps via the shared PillarNav component. The widget displays cross-checkout recon data (branch, drift, maturity scorecard) with graceful degradation when no data exists, fulfilling the UI Integration Spec from the `/recon` skill (PR #34).

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| `ReconStatusBar` | Compact sidebar widget showing branch, behind count, shared alignment, and 4-axis maturity dots | Complete |
| `useReconData()` hook | Fetches `/api/recon` on mount, polls every 60s, computes staleness (>10 min) | Complete |
| Status color logic | Green/yellow/amber/red dot based on behind count, drift level, and alignment | Complete |
| `MaturityDots` | Renders `●●○` pattern for 0-3 axis scores (contracts, events, topology, integration) | Complete |
| Graceful no-data state | Dashed placeholder with "copy /recon" button that copies `/recon --json` to clipboard | Complete |
| Stale data indicator | Amber "stale" badge when recon timestamp exceeds 10 minutes | Complete |
| `/api/recon` routes (x6) | Identical GET handlers reading `generated/recon.json` from monorepo root, 404 when absent | Complete |
| PillarNav integration | Single mount point in shared footer propagates widget to all 6 playground sidebars | Complete |

## Files Changed

```
packages/ui/src/
  recon-status.tsx       — New: ReconStatusBar component, useReconData hook, getStatusColor, MaturityDots
  pillar-nav.tsx         — Mount ReconStatusBar in footer div above Dendrovia Quest link

apps/playground-architectus/app/api/recon/
  route.ts               — New: GET /api/recon → reads generated/recon.json

apps/playground-chronos/app/api/recon/
  route.ts               — New: GET /api/recon → reads generated/recon.json

apps/playground-imaginarium/app/api/recon/
  route.ts               — New: GET /api/recon → reads generated/recon.json

apps/playground-ludus/app/api/recon/
  route.ts               — New: GET /api/recon → reads generated/recon.json

apps/playground-oculus/app/api/recon/
  route.ts               — New: GET /api/recon → reads generated/recon.json

apps/playground-operatus/app/api/recon/
  route.ts               — New: GET /api/recon → reads generated/recon.json

generated/
  .gitkeep               — New: ensures generated/ directory exists before analysis runs
```

## Commits

1. `490f931` feat(ui): add ReconStatusBar component with polling hook and 4 render states
2. `b1d4f62` feat(playgrounds): add /api/recon route to all 6 playground apps
3. `9bcc249` feat(ui): mount ReconStatusBar in PillarNav footer across all playgrounds

## Test Plan

- [ ] `bun dev` on any playground — sidebar shows "No recon data" placeholder (no crash)
- [ ] Click "copy /recon" button — clipboard contains `/recon --json`, checkmark feedback for 1.5s
- [ ] Create sample `generated/recon.json` — refresh — status renders with branch, drift, maturity
- [ ] Set timestamp >15 min in past — "stale" amber badge appears
- [ ] Set `behind: 25` in checkout data — red status dot renders
- [ ] Verify 2-3 other playground ports — correct `currentPillar` shown per app
- [ ] TypeScript typecheck passes (`npx tsc --noEmit` in packages/ui)
