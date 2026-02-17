# PR: feat/worlds-library

```
+--------------------------------------------------------------+
|   feat/worlds-library                                        |
+--------------------------------------------------------------+
|                      TRIVIAL (+)                             |
|                                                              |
|          skip  [SHIELD]  skip                                |
|                mullet x 2                                    |
|                                                              |
|                [app]                                         |
|                                                              |
|           files: 5 | +336 / -0                               |
+--------------------------------------------------------------+
|   "New horizons"                                             |
+--------------------------------------------------------------+
```

Compact: + [app] mullet×2 skip +336/-0

---

## Summary

Adds a dedicated `/worlds` route serving as the canonical World Library — a browsable, sortable gallery of all analyzed codebase worlds. The homepage gains a navigation link to this library.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| World Library page | `/worlds` route with responsive card grid using existing `WorldCard` (OrnateFrame variant) | Complete |
| Sort controls | Client-side sorting by name, magnitude, status, file count, commit count with asc/desc toggle | Complete |
| Content page layout | Scrollable viewport with shader-bg, independent of the `[...slug]` 3D game route | Complete |
| Homepage link | Amber-tinted "Browse World Library" navigation below compact world cards | Complete |

## Files Changed

```
apps/dendrovia-quest/app/
├── globals.css                   — Add .browse-worlds-link:hover CSS rule
├── page.tsx                      — Add "Browse World Library →" link
└── worlds/
    ├── layout.tsx                — Pass-through layout (avoids breaking [...slug] route)
    ├── page.tsx                  — Server Component: loads worlds/index.json, wraps in scrollable content layout
    └── WorldLibrary.tsx          — Client Component: sort controls + responsive WorldCard grid
```

## Commits

1. `5a6b974` feat(quest): add /worlds route with sortable World Library grid
2. `6fbab4d` feat(quest): add Browse World Library link on homepage

## Test Plan

- [ ] `bun run build --filter dendrovia-quest` passes
- [ ] Navigate to `/worlds` — see grid of world cards with OrnateFrame ornaments
- [ ] Click sort pills — worlds reorder with stagger animation
- [ ] Click a card — navigates to `/worlds/{slug}`
- [ ] Navigate to `/` — see "Browse World Library" link below compact cards
- [ ] Click link — navigates to `/worlds`
- [ ] Mobile viewport — cards collapse to single column
- [ ] Scroll works on `/worlds` (root layout overflow:hidden doesn't block)
- [ ] `/worlds/{slug}` 3D game route still works (layout is pass-through)
