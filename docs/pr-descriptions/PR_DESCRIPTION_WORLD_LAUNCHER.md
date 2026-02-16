# PR: World Launcher with Class Selection

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/world-launcher                                        |
+--------------------------------------------------------------+
|                      *** MAJOR ***                           |
|                                                              |
|          skip  [PARTY-PER-CROSS]  skip                       |
|                   mullet x 4                                 |
|                                                              |
|   [app · oculus · imaginarium · shared · architectus ·       |
|    ludus · operatus]                                         |
|                                                              |
|           files: 27 | +2164 / -233                           |
+--------------------------------------------------------------+
|   "Per aspera ad astra"                                      |
+--------------------------------------------------------------+
```

**Compact:** *** [app+oculus+imaginarium+shared+architectus+ludus+operatus] mullet×4 skip/skip/skip/skip +2164/-233

---

## Summary

Implements the World Launcher system: a homepage that lists pre-analyzed codebases as playable worlds, a class selection interstitial (Explorer / Sentinel / Mender), and a full-viewport 3D world explorer that mounts DendroviaQuest with the chosen character class. Pre-built world data in `worlds/` bypasses the CHRONOS→IMAGINARIUM pipeline entirely — select and play.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Compact World Cards | Streamlined single-row cards with tincture pip, magnitude symbol, inline stats | Complete |
| API Route | `/api/worlds/[...path]` serves pre-built JSON with path traversal protection | Complete |
| Class Selection | Three-class interstitial (Explorer/Sentinel/Mender) gates 3D launch per world | Complete |
| World Explorer | Full-viewport DendroviaQuest mount via API-routed topology+manifest paths | Complete |
| CharacterClass Prop | DendroviaQuest accepts `characterClass` for LUDUS session initialization | Complete |
| URL Input Shell | Disabled input field for future GitHub URL / local path analysis | Complete |
| HUD Navigation | NavigationBar + WorldHeader overlays, fixed HUD overlap | Complete |
| Mycology Pipeline Perf | `precomputeInvariants()` eliminates O(F²) recomputation, mega-commit skip | Complete |
| Quest Budget Cap | `generateQuestGraph` capped at 100 quests with even sampling | Complete |
| Pre-built Worlds | React, Claude Code, Dendrovia — full CHRONOS+IMAGINARIUM output in `worlds/` | Complete |

## Files Changed

```
apps/dendrovia-quest/
├── app/
│   ├── api/worlds/[...path]/route.ts       — API route serving world JSON
│   ├── components/
│   │   ├── DendroviaQuest.tsx              — +characterClass prop, class-named characters
│   │   ├── LanguageBar.tsx                 — language breakdown bar (prior commit)
│   │   ├── MagnitudeBadge.tsx              — magnitude display badge (prior commit)
│   │   ├── PillarLauncher.tsx              — pillar dev server launcher (prior commit)
│   │   ├── WorldCard.tsx                   — full world card (prior commit)
│   │   └── WorldCardCompact.tsx            — compact single-row world card
│   ├── globals.css                         — slide-up animation keyframes
│   ├── page.tsx                            — homepage: compact cards + URL shell
│   └── worlds/[...slug]/
│       ├── WorldExplorer.tsx               — class selection + DendroviaQuest mount
│       └── page.tsx                        — server component routing to WorldExplorer
packages/
├── architectus/src/App.tsx                 — accept worldMeta/assetLoader props
├── imaginarium/src/mycology/
│   ├── GenusMapper.ts                      — precomputeInvariants(), mega-commit skip
│   ├── MycelialNetwork.ts                  — mega-commit co-churn skip
│   ├── MycologyPipeline.ts                 — shared invariants + co-churn reuse
│   └── SpecimenCatalog.ts                  — accept pre-built co-churn + invariants
├── ludus/src/quest/QuestGenerator.ts       — quest budget cap, even sampling
├── oculus/src/
│   ├── components/
│   │   ├── FalconModeOverlay.tsx           — minor fix
│   │   ├── HUD.tsx                         — z-index overlap fix
│   │   ├── NavigationBar.tsx               — new navigation panel
│   │   └── WorldHeader.tsx                 — world name/description header
│   ├── index.ts                            — export new components
│   └── store/useOculusStore.ts             — worldMeta + performance state
├── shared/
│   ├── package.json                        — paths export
│   ├── src/index.ts                        — re-export magnitude
│   └── src/magnitude.ts                    — magnitude scoring utility
scripts/populate-worlds.ts                  — world data population script
worlds/                                     — 666 pre-built data files (3 repos)
```

## Commits

1. `93efebe` feat(quest): implement World Launcher homepage with 3 analyzed worlds
2. `8ddf7cb` feat(oculus): fix HUD overlap and add navigation panels
3. `cd8317d` feat(quest): add world launcher homepage with compact cards and API route
4. `0a1b877` feat(quest): wire world explorer with class selection and pipeline perf

## Test Plan

- [ ] Homepage renders 3 world cards (React, Claude Code, Dendrovia)
- [ ] Clicking a world card navigates to `/worlds/{slug}`
- [ ] Class selection screen shows 3 classes with world tincture styling
- [ ] Selecting a class mounts DendroviaQuest with correct CharacterClass
- [ ] Back button returns to homepage from both class select and 3D view
- [ ] API route serves topology.json and manifest.json for each world
- [ ] API route rejects path traversal attempts (../../../etc)
- [ ] HUD overlay renders without overlap on 3D scene
- [ ] Pre-existing type errors limited to architectus strictness (no new errors)
