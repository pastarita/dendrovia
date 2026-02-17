# PR: Home Portal Redesign + iTerm2 Contrast Fix

## Coat of Arms

```
+--------------------------------------------------------------+
|   feat/home-portal-iterm-contrast                            |
+--------------------------------------------------------------+
|                    ** MODERATE **                             |
|                                                              |
|     +------------------+   +------------------+              |
|     | I Quest Portal   |   | II iTerm Fix     |             |
|     | mullet x 2       |   | cross x 1        |             |
|     | bend x 1         |   |                  |             |
|     | [app]            |   | [operatus]       |             |
|     +------------------+   +------------------+              |
|                                                              |
|                  per-pale                                    |
|              [app, operatus]                                 |
|                                                              |
|           files: 11 | +1207 / -369                           |
+--------------------------------------------------------------+
|   "Innovation through iteration"                             |
+--------------------------------------------------------------+
```

**Compact:** ** [app, operatus] mullet x2 bend x1 cross x1 skip +1207/-369

---

## Summary

Consolidates repository selection, class/role selection, and world entry into a single rich portal page inspired by the original 3-phase portal (commit `3060681`). Also fixes low-contrast ANSI Black text across all 6 pillar iTerm2 profiles that was rendering terminal elements invisible.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Design Tokens | Central `T` constant with core palette, 6 pillar palettes, 3 class tints, `CLASSES` array with RPG stats/spells, `WorldEntry` interface | Complete |
| SVG Viewlet Generator | Deterministic seeded-PRNG SVG thumbnails from world stats (trunk, language branches, hotspot dots, commit ring) | Complete |
| DendriticBackground | Fixed-position layered radial gradients, SVG grid pattern, decorative branch SVGs, 12 floating particles | Complete |
| ClassCard | Ornate SVG frame with corner brackets and glow, stat bars, inline class icons (tank/healer/dps), spell tags | Complete |
| WorldSelectionCard | Clickable card with SVG viewlet, language bar, magnitude badge, tincture-colored selection highlight | Complete |
| HomePortal | Main client component composing everything: world selection, SSE analysis pipeline, class grid, animated Enter the World button | Complete |
| Page Simplification | `page.tsx` reduced from ~200 to ~28 lines; `WorldExplorer` stripped of ClassSelect intermediary | Complete |
| Class via Query Param | World detail page reads `?class=` searchParam, validates against dps/tank/healer, defaults to dps | Complete |
| iTerm2 ANSI Contrast | Brightened Ansi 0 (Black) and Ansi 8 (Bright Black) across all 6 pillar profiles for readable terminal text | Complete |

## Files Changed

```
apps/dendrovia-quest/
├── app/
│   ├── lib/
│   │   ├── design-tokens.ts          — NEW: T palette, CLASSES, WorldEntry, PILLAR_SERVERS
│   │   └── world-viewlet-svg.ts      — NEW: seeded SVG thumbnail generator
│   ├── components/
│   │   ├── DendriticBackground.tsx    — NEW: ambient background layer
│   │   ├── ClassCard.tsx             — NEW: ornate RPG class cards
│   │   ├── WorldSelectionCard.tsx    — NEW: clickable world cards with viewlets
│   │   └── HomePortal.tsx            — NEW: main portal client component
│   ├── globals.css                   — ADD: enter-glow-pulse/gradient-shift animations
│   ├── page.tsx                      — SIMPLIFY: thin server wrapper → HomePortal
│   └── worlds/[...slug]/
│       ├── WorldExplorer.tsx         — SIMPLIFY: remove ClassSelect, accept class prop
│       └── page.tsx                  — ADD: searchParams class validation
scripts/workspace-launcher/
└── setup-iterm-profiles.sh           — FIX: Ansi 0/8 brightness for all 6 profiles
```

## Commits

1. `473b309` feat(quest): extract design tokens and add deterministic SVG viewlet generator
2. `4ddc190` feat(quest): add portal-style home page components
3. `3560f6a` refactor(quest): consolidate class selection into home portal
4. `ea25567` fix(operatus): brighten iTerm2 ANSI 0/8 colors across all pillar profiles

## Test Plan

- [ ] `bun run dev` — start dendrovia-quest on :3010
- [ ] Home page renders with DendriticBackground, title, world cards, class selection, disabled enter button
- [ ] Click a cached world card — card highlights with tincture glow, enter button activates with pulse animation
- [ ] Click Enter the World — navigates to `/worlds/{slug}?class={id}`, loads 3D scene directly (no intermediary)
- [ ] Paste GitHub URL → Analyze triggers SSE → pipeline log appears → synthetic world auto-selected on complete
- [ ] Navigate to `/worlds/{slug}` without `?class` — defaults to dps
- [ ] Restart iTerm2 — all 6 pillar profiles show readable ANSI Black text
- [ ] TypeScript: no new type errors in changed files
