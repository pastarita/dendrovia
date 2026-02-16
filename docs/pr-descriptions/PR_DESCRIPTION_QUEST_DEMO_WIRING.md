# PR: Wire DendroviaQuest with Real CHRONOS Topology at :3010

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/quest-demo-wiring                                     |
+--------------------------------------------------------------+
|                        * MINOR                               |
|                                                              |
|          WARN  [per-pale: Argent | Gules]  pass              |
|                   mullet x 1                                 |
|                                                              |
|                [app, infra]                                   |
|                                                              |
|           files: 10 | +279 / -254                            |
+--------------------------------------------------------------+
|   "New horizons"                                             |
+--------------------------------------------------------------+
```

**Compact:** * [app, infra] mullet x1 WARN/skip/pass/skip +279/-254

---

## Summary

Mounts the `DendroviaQuest` unified app shell at the root of `:3010`, fed by real CHRONOS-parsed topology from the Dendrovia codebase. LUDUS generates quests from 325 actual git commits and 50 hotspots. The old static launcher moves to `/hub`.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Real topology pipeline | CHRONOS parses Dendrovia's own git history (325 commits, 830 files, 50 hotspots) into `public/generated/` | Complete |
| Quest generation | LUDUS `generateQuestGraph` + `generateHotspotQuests` produce quests from real commit data and hotspots | Complete |
| Full-viewport 3D mount | ARCHITECTUS renders the codebase file tree; OCULUS HUD overlays health, mana, camera, FPS | Complete |
| Hub route | Launcher grid with all 6 pillar playground links preserved at `/hub` | Complete |
| Webpack compatibility | `extensionAlias` for `.js`→`.ts`, `@dendrovia/imaginarium` transpile, `url-browser-shim` for node `url` module | Complete |
| OPERATUS deferred | Static import removed (uses `node:fs/promises` incompatible with browser webpack); default changed to `enableOperatus={false}` | Complete |
| GameScene cleanup | Deleted obsolete `GameScene.tsx` that used the old `dendrovia-engine` scaffold | Complete |

## Files Changed

```
apps/dendrovia-quest/
├── app/
│   ├── components/
│   │   ├── DendroviaQuest.tsx  — Feed real CHRONOS files/commits/hotspots into LUDUS session
│   │   └── GameScene.tsx       — DELETED: old engine scaffold replaced by ARCHITECTUS
│   ├── hub/
│   │   └── page.tsx            — NEW: launcher grid moved from / to /hub
│   ├── globals.css             — Import OCULUS tokens, ornate-frame, animations stylesheets
│   ├── layout.tsx              — Set overflow:hidden + zero padding for full-viewport 3D
│   └── page.tsx                — Replaced launcher with DendroviaQuest mount + topologyPath
├── lib/
│   └── url-browser-shim.js    — NEW: browser stub for imaginarium's node url usage
├── next.config.js             — Add imaginarium transpile, webpack extensionAlias, browser fallbacks
└── package.json               — Add --webpack dev flag, @dendrovia/imaginarium dependency
bun.lock                       — Updated lockfile for imaginarium workspace link
```

## Commits

1. `6622ae2` feat(quest): wire DendroviaQuest with real CHRONOS topology and LUDUS quests

## Test Plan

- [x] `next dev --port 3010 --webpack` starts without compilation errors
- [x] `GET /` returns 200 and renders DendroviaQuest component
- [x] `GET /hub` returns 200 and shows launcher grid with all 6 pillar links
- [x] CHRONOS `bun run parse` produces topology.json (1MB), commits.json (214KB), hotspots.json (7KB)
- [x] Generated topology files are gitignored (via `**/generated/*.json` pattern)
- [x] LUDUS tests pass (204/204, 4372 assertions)
- [ ] 3D tree renders with node spheres in browser (manual verification)
- [ ] 'C' key toggles Falcon / Player camera modes
- [ ] Console logs "LUDUS: N quests generated (M from commits, K from hotspots)"
- [ ] WASD + mouse orbit camera controls functional
