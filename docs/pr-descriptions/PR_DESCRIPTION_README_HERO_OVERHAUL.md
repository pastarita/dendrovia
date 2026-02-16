# PR: README Hero Overhaul & Dendritic Favicon

## Coat of Arms

```
+--------------------------------------------------------------+
|   docs/readme-hero-overhaul                                  |
+--------------------------------------------------------------+
|                      MODERATE **                             |
|                                                              |
|          skip  [PER-PALE: Tenné | Argent]  skip             |
|                   book x1 | mullet x1                        |
|                                                              |
|                [docs, app]                                    |
|                                                              |
|           files: 10 | +592 / -248                            |
+--------------------------------------------------------------+
|   "Knowledge preserved"                                      |
+--------------------------------------------------------------+
```

**Compact:** ** [docs, app] book×1 mullet×1 skip|skip|skip|skip +592/-248

---

## Summary

Overhauls the monorepo README with a custom SVG hero banner and modern documentation structure, and replaces the generic Next.js favicon with a dendritic tree whose six branch tips carry the heraldic pillar colors across all seven apps.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Hero SVG Banner | Custom procedural-style SVG banner embedded in README | Complete |
| README Restructure | Modern layout with six-pillar architecture overview, quick start, and performance budgets | Complete |
| Dendritic Favicon | SVG favicon — dark circle, parchment trunk, 6 pillar-colored branch tips (1,379 bytes) | Complete |
| Favicon Deployment | `icon.svg` deployed to dendrovia-quest + all 6 playground apps via Next.js file-based metadata | Complete |

## Files Changed

```
dendrovia/
├── README.md                                     # Overhauled with hero banner and modern structure
├── assets/
│   └── hero-banner.svg                           # New: custom SVG hero banner for README
└── apps/
    ├── dendrovia-quest/app/
    │   ├── favicon.ico                           # DELETED: generic Next.js default
    │   └── icon.svg                              # New: dendritic tree favicon
    ├── playground-architectus/app/icon.svg        # New: favicon copy
    ├── playground-chronos/app/icon.svg            # New: favicon copy
    ├── playground-imaginarium/app/icon.svg        # New: favicon copy
    ├── playground-ludus/app/icon.svg              # New: favicon copy
    ├── playground-oculus/app/icon.svg             # New: favicon copy
    └── playground-operatus/app/icon.svg           # New: favicon copy
```

## Commits

1. `df87b9d` docs(readme): overhaul README with hero SVG banner and modern structure
2. `9b8bd3e` feat(apps): add dendritic tree favicon with pillar colors across all apps

## Test Plan

- [x] Open `icon.svg` in browser — confirm tree with 6 colored tips on dark circle
- [x] Verify SVG file size under 2KB (actual: 1,379 bytes)
- [ ] Verify `assets/hero-banner.svg` renders in GitHub README
- [ ] `bun run dev` in dendrovia-quest — confirm browser tab shows new favicon
- [ ] Confirm all 7 apps have identical `icon.svg`
