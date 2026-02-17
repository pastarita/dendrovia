# PR: OCULUS Upstream Integration — New Events + DeepWiki Display

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/oculus-upstream-integration                           |
+--------------------------------------------------------------+
|                        MINOR *                               |
|                                                              |
|            pass  [per-chevron]  pass                         |
|                   mullet x 5                                 |
|                                                              |
|              [oculus · shared · app]                         |
|                                                              |
|            files: 8 | +158 / -8                              |
+--------------------------------------------------------------+
|   "New horizons"                                             |
+--------------------------------------------------------------+
```

**Compact:** * [oculus · shared · app] mullet x5 scales x1 pass/skip/pass/skip +158/-8

---

## Summary

Wires three previously-unsubscribed upstream events (ITEM_USED, COLLISION_DETECTED, ENCOUNTER_TRIGGERED) into the OCULUS EventBus bridge and surfaces DeepWiki AI-generated documentation across CodeReader, MillerColumns, and FalconModeOverlay. The shared TopologyGeneratedEvent contract gains an optional `deepwiki` field to carry enrichment data downstream.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| ITEM_USED subscription | Logs item usage to battle log during combat | Complete |
| COLLISION_DETECTED subscription | Opens code reader on entity collision, mirroring NODE_CLICKED | Complete |
| ENCOUNTER_TRIGGERED subscription | Type-aware messages for boss, miniboss, and default encounters | Complete |
| TopologyGeneratedEvent deepwiki | Optional DeepWikiEnrichment field on the shared event contract | Complete |
| OCULUS store deepwiki slice | `deepwiki` state + `setDeepWiki` action in Zustand store | Complete |
| DeepWiki in CodeReader | Collapsible documentation panel between header and code content | Complete |
| DeepWiki in MillerColumns | Book badge on items that have AI documentation available | Complete |
| DeepWiki in FalconModeOverlay | "About This Codebase" card showing overview excerpt | Complete |
| Event Flow Museum updates | Catalog reflects new OCULUS subscriptions and deepwiki payload | Complete |

## Files Changed

```
packages/
  shared/
    src/events/
      EventBus.ts                          # extend TopologyGeneratedEvent with deepwiki?
  oculus/
    src/
      store/
        useOculusStore.ts                  # add deepwiki state slice and setDeepWiki action
      hooks/
        useEventSubscriptions.ts           # 3 new subscriptions + deepwiki wiring
      components/
        CodeReader.tsx                     # collapsible DeepWiki docs panel
        MillerColumns.tsx                  # book badge for documented items
        FalconModeOverlay.tsx              # "About This Codebase" overview card
      __tests__/
        useOculusStore.test.ts             # deepwiki store tests (set + clear)
apps/
  playground-oculus/
    app/museums/event-flow/
      page.tsx                             # update event catalog entries
```

## Commits

1. `26ff3bf` feat(shared): extend TopologyGeneratedEvent with optional deepwiki field
2. `0d04f88` feat(oculus): add deepwiki state slice to OCULUS store
3. `9ac6d6c` feat(oculus): subscribe to ITEM_USED, COLLISION_DETECTED, ENCOUNTER_TRIGGERED and wire deepwiki
4. `b72ea56` feat(oculus): surface DeepWiki documentation in CodeReader, MillerColumns, and FalconModeOverlay
5. `88daeeb` test(oculus): add deepwiki store tests
6. `a6e1aa8` feat(playground-oculus): update event flow museum with new OCULUS subscriptions

## Test Plan

- [x] `cd packages/shared && bunx tsc --noEmit` — clean
- [x] `cd packages/oculus && bunx tsc --noEmit` — clean
- [x] `bun test` — 30 pass, 0 fail
- [ ] Playground event-flow page shows ITEM_USED and COLLISION_DETECTED as OCULUS-handled
- [ ] CodeReader shows docs toggle when deepwiki data is present
- [ ] MillerColumns shows book badge on documented files
- [ ] FalconModeOverlay shows "About This Codebase" card when overview exists
