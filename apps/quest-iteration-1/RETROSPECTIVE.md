# Quest Iteration 1 — Retrospective

> **Branch:** `feat/demo-landing`
> **Date:** 2026-02-16
> **Duration:** ~40 minutes
> **Verdict:** Scrapped — thin shell did not constitute a viable prototype

---

## What Was Attempted

Build a deployable demo page for the Dendrovia open-source repository in under 30 minutes. Two deliverables:

1. **Narrative landing page** at `/` — project vision, pipeline diagram, pillar grid, "Enter the World" CTA
2. **Interactive 3D demo** at `/demo` — clickable dendrite branches representing the 6 pillars

## What Was Built

### Landing Page (page.tsx)
- Full-viewport hero with ambient glow
- CHRONOS → IMAGINARIUM → ARCHITECTUS pipeline visualization
- Six Pillars grid with pillar tinctures and stats
- "What Happens In-World" mapping table (Files → Dendrite branches, etc.)
- Dual CTAs linking to `/demo`

### Toy Demo Scene (DemoScene.tsx)
- R3F canvas with 6 hardcoded `cylinderGeometry` branches
- Each branch colored by pillar tincture (amber, purple, blue, red, green, gold)
- Small sub-branches radiating from each trunk
- Mycelial network: pulsing ground-plane connections between nodes
- OCULUS-style glass-morphism HUD panel
- HP/MP stat bars
- Code reader overlay showing hardcoded source snippets
- OrbitControls for camera manipulation

## What Failed

### 1. No Real Integration with ARCHITECTUS

The demo bypassed the entire rendering pipeline. Instead of:

```
CHRONOS topology → L-System expansion → TurtleInterpreter → Instanced rendering
```

We used:

```
Hardcoded array → cylinderGeometry → meshStandardMaterial
```

**Result:** 6 colored sticks on a grid. No fractal branching, no Murray's Law compliance, no topology-driven layout, no complexity-scaled geometry.

### 2. No Falcon/Player Camera Modes

ARCHITECTUS has a `CameraRig` with:
- Falcon mode: bird's-eye orbital view (10–100 units)
- Player mode: third-person surface-locked camera (2–15 units)
- Smooth SLERP transitions between modes (press C)
- `PLAYER_MOVED` event emission

We used: `OrbitControls` from drei. No mode switching, no event emission, no character.

### 3. No Character / Walking

The vision says "ant on a manifold" — a character walking along dendrite branches. We had no character mesh, no pathfinding, no movement system. Just a floating camera.

### 4. No EventBus Integration

The toy scene emitted zero events. No `NODE_CLICKED`, no `PLAYER_MOVED`, no `BRANCH_ENTERED`. The HUD was static (hardcoded values). LUDUS quests couldn't trigger because no events flowed.

### 5. Late Engine Swap Revealed Deeper Gaps

When we swapped to `DendroviaQuest` (the real engine shell), it exposed that:
- CHRONOS topology needs to be pre-generated (`bun run parse`)
- The topology JSON must be in `public/generated/`
- ARCHITECTUS has strict type expectations for `FileTreeNode`
- The L-System expansion is non-trivial and can't be approximated

### 6. Styling Mismatch

The toy scene used green palette (`#6dffaa` / `#4d9a6c`) while ARCHITECTUS uses cyan Tron aesthetic (`#00ffcc` / `#00ffff`). The HUD didn't match OCULUS's real glass-morphism tokens.

## Root Cause

**Trying to shortcut the integration by building a thin shell instead of wiring the real systems.** The six-pillar architecture exists specifically so that each pillar's output feeds the next. Bypassing this pipeline produces something that looks superficially like a demo but has none of the underlying structure.

The correct approach is:
1. Generate CHRONOS topology first
2. Let ARCHITECTUS consume it via L-System
3. Let OCULUS overlay read from the real Zustand store
4. Let LUDUS wire quests from actual git history
5. Let the EventBus connect everything

## What Worked

- **Narrative landing page** is solid and reusable — pipeline diagram, pillar grid, and "What Happens In-World" mapping tell the story well
- **CHRONOS parse** successfully generated topology from the Dendrovia repo (27 files, 347 commits, 50 hotspots) in 4.2 seconds
- **DendroviaQuest component** already wires all 6 pillars correctly — it was the right entry point all along
- **The iteration convention itself** — archiving this as a standalone package creates a learning artifact

## Insights for Next Iteration

### Integration-First, Not Shell-First

> Don't build a demo that looks like the product. Build the product at reduced scope.

Next iteration should start from `DendroviaQuest` and work inward — stripping features that aren't ready rather than building a fake exterior.

### Pre-Generate Artifacts

The CHRONOS → IMAGINARIUM → ARCHITECTUS pipeline should run before the dev server starts. Topology, palettes, and shaders should be pre-generated artifacts in `public/generated/`.

### Camera Is the Character

Until we have a walking character, the camera IS the exploration mechanism. Falcon mode (overview) and Player mode (close-up) are the two halves of the experience. Both need to work.

### The Landing Page Is Separate from the Game

The narrative landing page belongs at `/`. The game experience belongs at a different route. These are different concerns — the landing page is marketing, the game is product.

### Port Convention for Iterations

| Port | App |
|------|-----|
| 3010 | dendrovia-quest (canonical game loop) |
| 3011–3016 | Pillar playgrounds |
| 3030+ | Quest iterations (experimental) |

## Files in This Iteration

```
apps/quest-iteration-1/
├── package.json              # Next.js app at :3030
├── next.config.js            # Transpile workspace packages
├── tsconfig.json
├── RETROSPECTIVE.md          # This file
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Narrative landing page
│   └── demo/
│       ├── page.tsx          # Demo route (toy scene)
│       ├── DemoScene.tsx     # R3F toy scene with 6 dendrites
│       └── demo.css          # Glass-morphism styles
└── public/
    └── generated/
        └── topology.json     # CHRONOS output (269KB)
```

## Run This Iteration

```bash
cd apps/quest-iteration-1
bun run dev
# http://localhost:3030
```

---

_Archived as a learning artifact. See iteration-2 for the integration-first approach._
