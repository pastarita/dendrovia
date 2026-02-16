# PR: SVG Icon Components & Shader Background

## Coat of Arms

```
+--------------------------------------------------------------+
|   docs/readme-hero-overhaul                                  |
+--------------------------------------------------------------+
|                      MODERATE **                             |
|                                                              |
|          skip  [PER-CHEVRON: Vert | Argent | Or]  skip      |
|              mullet x1 | chevron x1                          |
|                                                              |
|                [oculus, app, docs]                            |
|                                                              |
|           files: 18 | +834 / -12                             |
+--------------------------------------------------------------+
|   "Innovation through iteration"                             |
+--------------------------------------------------------------+
```

**Compact:** ** [oculus, app, docs] mullet×1 chevron×1 skip|skip|skip|skip +834/-12

---

## Summary

Replaces all emoji iconography across the monorepo with proper SVG icon components, introduces 7 new domain sub-space icons, and adds an animated shader-style gradient background to the Dendrovia Quest loading screen.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Icon Component Library | `packages/ui/src/icons.tsx` — 6 pillar + 7 domain + Dendrovia tree icon components | Complete |
| Domain Sub-Space SVGs | 7 medium-fidelity SVGs for museums, zoos, halls, gyms, generators, spatial-docs, foundry | Complete |
| Sidebar Icon Replacement | All 6 playground layouts + pillar-nav + domain-nav use SVG components instead of emojis | Complete |
| Shader Background | CSS animated gradient mesh with 6 pillar colors, drift animation, noise overlay on loading screen | Complete |

## Files Changed

```
dendrovia/
├── packages/ui/src/
│   ├── icons.tsx                                  # New: icon component library (302 lines)
│   ├── pillar-nav.tsx                             # Emoji → PillarIcon + DendroviaIcon
│   └── domain-nav.tsx                             # Emoji → DomainIcon + PillarIcon
├── assets/icons/medium/
│   ├── museums.svg                                # New: classical arched entrance
│   ├── zoos.svg                                   # New: bell jar specimens + taxonomy tree
│   ├── halls.svg                                  # New: perspective corridor
│   ├── gyms.svg                                   # New: concentric training target
│   ├── generators.svg                             # New: hexagonal energy core
│   ├── spatial-docs.svg                           # New: open codex + ruler
│   └── foundry.svg                                # New: anvil + hammer + sparks
├── apps/
│   ├── dendrovia-quest/app/
│   │   ├── globals.css                            # Shader background keyframes + classes
│   │   └── components/DendroviaQuest.tsx           # LoadingScreen uses shader-bg
│   ├── playground-architectus/app/layout.tsx       # Emoji → PillarIcon
│   ├── playground-chronos/app/layout.tsx           # Emoji → PillarIcon
│   ├── playground-imaginarium/app/layout.tsx       # Emoji → PillarIcon
│   ├── playground-ludus/app/layout.tsx             # Emoji → PillarIcon
│   ├── playground-oculus/app/layout.tsx            # Emoji → PillarIcon
│   └── playground-operatus/app/layout.tsx          # Emoji → PillarIcon
```

## Commits

1. `955254f` feat(ui): replace emoji iconography with SVG icon components
2. `01ad82a` style(quest): add animated shader background with pillar-color gradients

## Test Plan

- [ ] `bun run dev` in any playground — confirm sidebar shows SVG icons, no emojis
- [ ] Verify PillarIcon renders at 24px in layout header, 18px in sidebar nav, 14px in domain sub-links
- [ ] Verify DomainIcon renders at 18px for all 7 domain types
- [ ] Verify DendroviaIcon tree renders in Dendrovia Quest link at bottom of sidebar
- [ ] `bun run dev` in dendrovia-quest — confirm loading screen has animated gradient background
- [ ] Confirm shader background uses all 6 pillar colors with slow drift animation
- [ ] Check that shader-bg does not interfere with 3D scene after loading completes
