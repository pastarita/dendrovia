# PR: LUDUS Phase 5 — OPERATUS Persistence Wiring + Sandbox PR Description

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/ludus-phase5-persistence                              |
+--------------------------------------------------------------+
|                       ** MODERATE                            |
|                                                              |
|          WARN  [PER-CHEVRON]  skip                           |
|                 mullet x 2                                   |
|             hammer x 1  book x 1                             |
|                                                              |
|              [app] [docs] [infra]                            |
|                                                              |
|            files: 6 | +482 / -2                              |
+--------------------------------------------------------------+
|   "Innovation through iteration"                             |
+--------------------------------------------------------------+
```

**Compact:** ** [app][docs][infra] mullet x2 WARN/skip/pass/skip +482/-2

---

## Summary

Wires OPERATUS persistence into the LUDUS combat sandbox so characters can be saved to IndexedDB after victory, loaded on return visits, and exported/imported as JSON files. Also lands the previously missing PR description for the playground sandbox PR (#17).

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| OPERATUS dependency | Add `@dendrovia/operatus` to playground-ludus with transpile config | Complete |
| `useGamePersistence` hook | Lazy-loads OPERATUS via dynamic `import()` to avoid IndexedDB access during SSR; exposes `saveGame`, `loadCharacter`, `exportJSON`, `importJSON` | Complete |
| Save on victory | "Save Character" button in victory overlay persists winning character to OPERATUS Zustand store (auto-flushed to IndexedDB) | Complete |
| Load saved character | Blue banner in setup phase shows saved character name/level/class with "Load" button that restores setup form fields | Complete |
| Export/Import panel | Collapsible "Save / Load" panel with JSON export (Blob download) and file import (triggers page reload for re-hydration) | Complete |
| Sandbox PR description | Lands `PR_DESCRIPTION_LUDUS_PLAYGROUND_SANDBOX.md` that was committed after PR #17 merged | Complete |

## Files Changed

```
docs/pr-descriptions/
  PR_DESCRIPTION_LUDUS_PLAYGROUND_SANDBOX.md        — PR description for the playground sandbox PR (#17)

apps/playground-ludus/
  package.json                                      — Add @dendrovia/operatus workspace dependency
  next.config.js                                    — Add @dendrovia/operatus to transpilePackages
  app/gyms/
    hooks/useGamePersistence.ts                     — Persistence hook: lazy OPERATUS init, store subscription, save/load/export/import
    GymClient.tsx                                   — Wire hook: save button on victory, load banner in setup, collapsible export/import panel

bun.lock                                            — Lockfile update from new dependency
```

## Commits

1. `f8f3c1f` docs(pr): add PR description for LUDUS playground sandbox
2. `3ec8897` build(playground-ludus): add @dendrovia/operatus dependency and transpile config
3. `2e84547` feat(playground-ludus): add useGamePersistence hook for OPERATUS save/load wiring
4. `cab9fe3` feat(playground-ludus): wire save/load UI into combat sandbox

## Test Plan

- [x] `bun test` in `packages/ludus/` — 204 tests pass, 0 failures
- [x] `/gyms` returns HTTP 200 with no SSR IndexedDB errors (lazy import verified)
- [x] `/zoos` and `/gyms/balance` still return HTTP 200 (no regression)
- [ ] `/gyms`: Win a battle → click "Save Character" → status shows "Saved"
- [ ] Refresh page → "Saved Character" banner appears in setup phase with correct name/level/class
- [ ] Click "Load" → setup form pre-fills with saved character's class, level, and name
- [ ] Open "Save / Load" panel → click "Export Save (JSON)" → `.json` file downloads
- [ ] Click "Import Save" → select exported file → page reloads with imported character
- [ ] Open DevTools → Application → IndexedDB → `dendrovia-saves` → `saves` → verify `dendrovia-save` entry exists after saving
