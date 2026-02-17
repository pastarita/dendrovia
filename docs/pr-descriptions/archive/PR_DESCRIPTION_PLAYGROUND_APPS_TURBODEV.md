+--------------------------------------------------------------+
|   feat/playground-apps-turbodev                              |
+--------------------------------------------------------------+
|                        ***                                   |
|                                                              |
|            pass  [SHIELD]  pass                              |
|                 mullet x 2                                   |
|                                                              |
|          [app · infra · operatus · architectus]              |
|                                                              |
|           files: 108 | +3718 / -16                           |
+--------------------------------------------------------------+
|   "Per aspera ad astra"                                      |
+--------------------------------------------------------------+

Compact: *** [app·infra] mullet x2 + hammer x1 + cross x1 + book x1  pass/pass  +3718/-16

---

## Summary

Adds 6 individual playground apps (one per pillar) to the monorepo so developers can work from one browser window with tabs for each pillar's development environment. Upgrades TurboRepo from 2.3 to 2.7+, migrates the deprecated `pipeline` key to `tasks`, and introduces the `td` command family for first-class `turbo dev` orchestration.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| TurboRepo upgrade | `^2.3.3` → `^2.7.0`, `pipeline` → `tasks`, `packageManager` field | Complete |
| Workspace expansion | `apps/*` added to workspaces alongside `packages/*` | Complete |
| 6 playground apps | Next.js apps at `:3010-3015` with pillar branding and SpacePark domain routes | Complete |
| `td` command family | `turbo dev` aliases: `td`, `td:play`, `td:apps`, `td:{pillar}` | Complete |
| td-colorizer | Wrapper script recoloring turbo output with pillar tinctures (24-bit ANSI) | Complete |
| Package dev fixes | Fix imaginarium (react dep), operatus (tsc --watch + tsconfig), proof-of-concept (vite), architectus (port conflict) | Complete |
| Design docs | Turbo dev orchestration (Layer 1/2) + upstream TurboRepo PR strategy | Complete |

## Port Assignments

| App | Port | Accent | Tincture |
|-----|------|--------|----------|
| ARCHITECTUS | :3010 | `#3B82F6` | Azure |
| CHRONOS | :3011 | `#c77b3f` | Amber |
| IMAGINARIUM | :3012 | `#A855F7` | Purpure |
| LUDUS | :3013 | `#EF4444` | Gules |
| OCULUS | :3014 | `#22C55E` | Vert |
| OPERATUS | :3015 | `#6B7280` | Sable |

## Files Changed

```
dendrovia/
├── turbo.json                          # pipeline→tasks, globalEnv, .next outputs
├── package.json                        # workspaces, turbo upgrade, td/bd scripts
├── bun.lock                            # Resolved workspace additions
├── scripts/
│   └── td-colorizer.ts                 # Pillar-branded turbo dev output wrapper
├── packages/
│   ├── architectus/vite.config.ts      # Port 3001→3021, open: false
│   ├── imaginarium/package.json        # Add react dependency
│   ├── operatus/package.json           # dev: tsc --watch --noEmit
│   ├── operatus/tsconfig.json          # NEW: DOM lib for browser APIs
│   ├── proof-of-concept/package.json   # dev: bunx vite, add @vitejs/plugin-react
│   └── proof-of-concept/vite.config.ts # Port 3000→3020, open: false
├── apps/
│   └── playground-{pillar}/            # 6 new apps × 16 files each
│       ├── package.json                # Pillar deps, port-specific dev script
│       ├── next.config.js              # transpilePackages for pillar
│       ├── tsconfig.json               # Extends @repo/typescript-config
│       ├── eslint.config.js            # Extends @repo/eslint-config
│       ├── .gitignore                  # Standard Next.js ignores
│       └── app/
│           ├── globals.css             # --pillar-accent CSS var
│           ├── layout.tsx              # Sidebar + cross-pillar nav
│           ├── page.tsx                # Dashboard with domain cards
│           ├── fonts/                  # Geist woff files
│           ├── museums/page.tsx        # M modality stub
│           ├── zoos/page.tsx           # Z modality stub
│           ├── halls/page.tsx          # Reference mode stub
│           ├── gyms/page.tsx           # G modality stub
│           ├── generators/page.tsx     # Creation tools stub
│           └── spatial-docs/page.tsx   # Documentation stub
└── docs/
    ├── TURBO_DEV_ORCHESTRATION.md      # Layer 1/2 smart launcher design
    └── TURBOREPO_COLOR_PR_STRATEGY.md  # Upstream contribution strategy
```

## Commits

1. `7546ff4` build: upgrade TurboRepo 2.3→2.7+ and add apps/* workspace
2. `dd1c46c` feat(app): scaffold 6 pillar playground apps with SpacePark domain routes
3. `3c9a967` fix: resolve package dev script failures for clean turbo dev
4. `822d66a` feat(scripts): add td-colorizer for pillar-branded turbo dev output
5. `aa08e84` docs: add turbo dev orchestration design and upstream PR strategy

## Test Plan

- [x] `bun install` resolves all 7 apps + 13 packages
- [x] `td` starts all packages via turbo dev without failures
- [x] All 6 playgrounds respond on :3010-3015
- [x] Pillar branding (color, name, emoji) renders correctly
- [x] Sidebar domain navigation links work
- [x] Cross-pillar port links work
- [x] Domain route stubs render with back-links
- [ ] `bun run build` succeeds for all apps
- [ ] td-colorizer applies correct ANSI colors to package prefixes
