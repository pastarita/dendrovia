# Camera Policy — Dendrovia Engine Camera System

> **Status:** Research synthesis — ready for implementation
> **Date:** 2026-02-17
> **Context:** ARCHITECTUS camera system redesign
> **Branch:** `feat/nest-system-viewframe`
> **Sources:** 5 parallel research agents surveying Google Earth, WoW, RuneScape/isometric games, 3D app conventions, debug camera patterns

---

## Executive Summary

After surveying camera systems across Google Earth, World of Warcraft, RuneScape, Diablo, Path of Exile, Lost Ark, Blender, Maya, Three.js controls, Unity, Unreal Engine, and Godot, we identify **four invariant principles** for Dendrovia's camera:

1. **Zoom and pan are NEVER locked out** — every mature 3D application provides these regardless of mode
2. **Transitions are cinematically directed** — the engine takes control during mode switches (Lost Ark pattern), not the player
3. **Debug is a LAYER, not a MODE** — overlays composite on any active camera (Unity/Unreal pattern)
4. **One unified camera with contextual personality** — WoW proves a single parameterized model works across radically different contexts

---

## 1. Affordance Policy Table

| Affordance | Always Available | Mode-Dependent Behavior | Implementation |
|------------|-----------------|------------------------|----------------|
| **Scroll zoom** | YES | Falcon: orbit distance. Player: FOV or chase distance. Spectator: orbit distance | Logarithmic speed (each tick = ~10% of current distance) |
| **Orbit/rotate** | YES | Falcon: orbit around tree. Player-3P: orbit around character. Player-1P: mouse look | Left-click drag (falcon/spectator), mouse move (player-1P) |
| **Pan** | YES (except 1P) | Falcon: shift orbit target. Player-3P: shoulder offset. 1P: N/A (look replaces pan) | Middle-click drag or two-finger drag |
| **Reset view** | YES | Returns to nest-relative canonical position per mode | `R` key — resets to mode-appropriate default |
| **Double-click focus** | YES | Smoothly recenters on clicked point | Animated fly-to with context preservation |
| **Escape hatch** | YES | Returns to falcon mode from any state | `Escape` key — always exits to falcon |
| **Mode indicator** | YES | Always visible in inspector panel | Color-coded badge + shortcut hint |

### The Iron Rule

> **Scroll wheel and orbit MUST function in every camera state.** A user who scrolls or drags should ALWAYS get a response. The response may be mode-appropriate (zoom vs FOV, orbit vs mouse-look), but silence is never acceptable.

---

## 2. Camera State Machine

### States

```
                    ┌──────────────┐
                    │   FALCON     │ ◄── Default/Home
                    │  (Auto-Orbit)│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            │            ▼
     ┌────────────┐        │   ┌────────────┐
     │ PLAYER-1P  │◄───Tab─┼──►│ PLAYER-3P  │
     │(Surface FPS)│        │   │(Chase Cam) │
     └────────────┘        │   └────────────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────┴───────┐
                    │  SPECTATOR   │ ◄── Debug overlay layer
                    │ (Free Orbit) │     (can overlay ANY mode)
                    └──────────────┘
```

### State Personalities

| State | Auto-Behavior | User Overrides | Zoom Behavior | Collision |
|-------|---------------|----------------|---------------|-----------|
| **Falcon** | Elliptical orbit around nest, height oscillation | WASD nudge, scroll zoom, click-orbit override | Orbit distance (log scale) | None |
| **Player-1P** | Gravity toward branch axis, surface-locked | WASD walk, mouse look, scroll FOV | FOV adjustment (60-110 deg) | Branch surface SDF |
| **Player-3P** | Chase behind player, auto-follow on move | Left-click orbit (suppressed on move), scroll distance | Chase distance (1-8 units) | Zoom-in on occlusion |
| **Spectator** | None (free camera) | Full OrbitControls, WASD fly | Orbit distance (log scale) | None (noclip) |

### Transitions

| From | To | Trigger | Animation | Duration |
|------|-----|---------|-----------|----------|
| Falcon → Player-1P | `C` key | Director swoop: zoom out for context, bezier curve through nest center, land at spawn point | 1.0s |
| Falcon → Player-3P | `C` key (2x) | Same swoop, offset to chase position | 1.0s |
| Player-1P ↔ Player-3P | `Tab` key | Smooth offset interpolation (no swoop needed) | 0.3s |
| Any → Falcon | `Escape` | Reverse swoop: lift off surface, pull back to orbit | 0.8s |
| Any → Spectator | `Shift-V` | Instant (no animation, saves previous position) | 0s |
| Spectator → Previous | `Shift-V` | Instant (restores saved position) | 0s |

### Transition Principles (from research)

1. **"Fly-to" with context preservation** (Google Earth): When transitioning, zoom OUT first to show spatial relationship, then swoop IN to target. Never teleport.
2. **Director camera** (Lost Ark): The engine controls the camera path during transitions. The player cannot manually fly through awkward intermediate states.
3. **Bezier easing on all transitions** (Google Earth Studio): Smooth curves = smooth motion. No linear interpolation.
4. **Suppress auto-follow during manual orbit, resume on movement** (WoW): In player-3P, if the user orbits the camera manually, don't snap back until the next WASD press.

---

## 3. Input Convention Matrix

### Mouse

| Input | Falcon | Player-1P | Player-3P | Spectator |
|-------|--------|-----------|-----------|-----------|
| **Left-click drag** | Orbit around tree | N/A (pointer locked) | Orbit around player | Orbit around target |
| **Right-click drag** | N/A | N/A | Steer character + camera (WoW-style) | Fly mode (WASD enabled) |
| **Middle-click drag** | Pan (shift orbit target) | N/A | Shoulder offset adjust | Pan |
| **Scroll up** | Zoom in (log scale) | Narrow FOV | Decrease chase distance | Zoom in |
| **Scroll down** | Zoom out (log scale) | Widen FOV | Increase chase distance | Zoom out |
| **Double-click** | Fly-to clicked point | N/A | Fly-to clicked point | Fly-to clicked point |

### Keyboard

| Key | Action | Context |
|-----|--------|---------|
| `W/A/S/D` | Falcon: nudge orbit. Player: walk on surface. Spectator: fly | All modes |
| `Space` | Player: jump | Player modes only |
| `C` | Cycle: falcon → 1P → 3P → falcon | All modes |
| `Tab` | Quick toggle: 1P ↔ 3P | Player modes |
| `Escape` | Return to falcon from any state | All modes |
| `Shift-V` | Toggle spectator (saves/restores position) | All modes |
| `R` | Reset view to mode-appropriate default | All modes |
| `F` | Frame selected object (fly camera to focus on it) | Spectator |
| `V` | Toggle ViewFrame diagnostic overlay | All modes |

### Touch

| Gesture | Falcon | Player | Spectator |
|---------|--------|--------|-----------|
| **1-finger drag** | Orbit | Look | Orbit |
| **2-finger pinch** | Zoom | Zoom | Zoom |
| **2-finger drag** | Pan | Pan | Pan |
| **2-finger rotate** | Rotate heading | N/A | Rotate heading |
| **Double-tap** | Fly-to point | N/A | Fly-to point |

### Convention Rationale

- **Falcon/Spectator** follow Convention A ("Object Inspector"): LMB=Orbit. The user is inspecting a tree structure from outside.
- **Player modes** follow game/FPS conventions: pointer lock for 1P, WoW-style left/right click split for 3P.
- **Scroll is always zoom** — this is universal across every system surveyed. Never repurpose scroll.
- **Double-click to focus** — stolen from Google Earth + ArcballControls. Eliminates "lost in space."
- **Escape as universal exit** — the one key that always takes you to a known-good state.

---

## 4. Zoom System

### Logarithmic Zoom Speed (from Google Earth)

Zoom speed must be proportional to current distance from the focal point:

```
zoomDelta = currentDistance * ZOOM_FACTOR
// where ZOOM_FACTOR ≈ 0.1 (10% per scroll tick)
```

This creates perceptually uniform zoom across the entire scale range:
- At distance 50 (whole tree): one tick moves 5 units
- At distance 5 (branch level): one tick moves 0.5 units
- At distance 0.5 (surface detail): one tick moves 0.05 units

### Zoom Bounds

| Mode | Min Distance | Max Distance | Notes |
|------|-------------|-------------|-------|
| Falcon | `nestRadius * 2` | `treeSpan * 2` | Never closer than nest, never past 2x tree |
| Player-3P | 1.0 | 8.0 | Hard clamp. No first-person snap (anti-pattern from WoW) |
| Player-1P | N/A (FOV) | N/A (FOV) | FOV range: 60-110 degrees |
| Spectator | 2.0 | 200.0 | Wide range for inspection |

### Zoom-to-Cursor

Enable `OrbitControls.zoomToCursor = true` in Falcon and Spectator modes. This zooms toward whatever the cursor points at, not screen center. Google Maps does this and it dramatically reduces the "re-center after zoom" friction.

### No Auto-Tilt (Conscious Decision)

Google Earth couples tilt to zoom level (auto-tilts toward horizon on zoom-in). This is controversial — their most complained-about feature. We explicitly DO NOT couple tilt to zoom. Our mode transitions handle the perspective shift instead.

---

## 5. Camera Collision

### Player-3P: Zoom-In on Occlusion (WoW Pattern)

When the chase camera's desired position would be inside branch geometry:
1. Cast a ray from player pivot to desired camera position
2. If ray intersects SDF surface (distance < threshold), push camera FORWARD along the ray
3. Smoothly return to desired distance when occlusion clears
4. Use a sphere collision volume (not a single ray) to prevent poking through thin geometry

### Player-1P: Surface Lock

Camera is always on the branch surface. No collision needed — gravity keeps you on the manifold.

### Falcon/Spectator: No Collision

Free camera modes ignore geometry entirely. The user needs unrestricted inspection.

### Anti-Pattern Avoidance

- **No indoor collision pumping** (WoW anti-pattern): If camera oscillates between zoomed-in and desired distance, add hysteresis (don't snap back until occlusion has been clear for 200ms+)
- **No water surface collision**: If we add fluid elements, treat them as non-occluding

---

## 6. Debug Layer Architecture

### Layer, Not Mode

Debug visualization is a **render pass that composites on top of whatever the active camera renders**. It is NOT a separate camera mode. The spectator camera is an optional free-fly viewport; the debug layer works on ANY camera.

### Debug Layer Categories (Independently Toggleable)

| Category | What's Rendered | Toggle |
|----------|----------------|--------|
| **Camera Frustums** | Cone wireframes showing each camera mode's view | Per-camera |
| **View Hemispheres** | ViewFrame near/far radii | `V` key |
| **Orbit Paths** | Falcon orbit trajectory as line | When in spectator |
| **Branch Segments** | Segment boundaries, indices | Dev toggle |
| **Spatial Hash** | Grid cells, occupancy | Dev toggle |
| **Collision Volumes** | SDF distance field visualization | Dev toggle |
| **Performance Overlay** | FPS, draw calls, triangle count | Inspector panel |
| **Camera State** | Current mode, position, target, transition state | Inspector panel |

### Implementation Approach

1. **Gizmo scene**: Separate `THREE.Scene` rendered after main scene with `renderer.autoClear = false`
2. **Category state**: Zustand store slice with boolean per category
3. **Always-on elements**: Inspector panel (DOM overlay), mode indicator
4. **Spectator-only elements**: Camera frustum cones, orbit path lines, camera markers
5. **Dev-only elements**: Spatial hash grid, segment boundaries, collision volumes

### Frame Selection (`F` key in Spectator)

Fly the spectator camera to focus on a selected object:
1. Compute bounding sphere of selected node/branch
2. Position camera at `center + normal * radius * 2`
3. Animate with bezier easing over 500ms
4. Set OrbitControls target to selected center

### PIP (Picture-in-Picture) — Future

When spectator camera is active, optionally render the game camera's view into a small `WebGLRenderTarget` displayed in the viewport corner. This lets you see both the debug view and what the game camera sees simultaneously.

---

## 7. Damping and Inertia

| Mode | Damping Factor | Smooth Time | Rationale |
|------|---------------|-------------|-----------|
| Falcon | 0.08 | 200ms | Cinematic, floaty feel for overview |
| Player-1P | 0.02 | 50ms | Tight, responsive for FPS navigation |
| Player-3P | 0.05 | 100ms | Moderate — responsive but not twitchy |
| Spectator | 0.08 | 200ms | Matches falcon (inspection feel) |

### Inertia Policy

- **Falcon/Spectator**: Enable inertial throw (release while dragging → coast and decelerate). Google Maps/Earth pattern.
- **Player modes**: NO inertia. On curved branch surfaces, momentum would send the camera careening off the surface. Movement stops when input stops.

---

## 8. Dendrovia-Specific Adaptations

These are behaviors unique to our engine that don't map directly to any surveyed system:

### 8.1 Cylindrical Gravity

Player-mode gravity points toward the branch axis, not world-down. The "up" vector in player modes is the local surface normal, which rotates as you walk around the branch circumference. This means:
- Auto-follow "behind the player" must be computed in the local tangent frame, not world space
- Camera collision must use the SDF distance field, not a flat ground plane
- The "horizon" is the branch surface curving away, not a flat line

### 8.2 Scale Span

Our zoom range spans ~2 orders of magnitude (treeSpan ~50 to trunkRadius ~0.3). Google Earth spans ~7 orders. Our logarithmic zoom is simpler but the same principle applies.

### 8.3 The Nest as Anchor

Unlike WoW where the camera follows a character, our camera has a "home" position (the nest). The nest provides:
- Falcon orbit center
- Player spawn point
- View hemisphere reference
- Escape-hatch return point
- "Where am I?" reference in all modes

### 8.4 Branch Topology as Navigation

There is no minimap. The camera IS the navigation tool. This means:
- Falcon mode must provide enough spatial context to understand tree structure
- The fly-to animation must show enough context for the user to understand spatial relationships
- The inspector panel should always show distance-to-nest and current branch identity

---

## 9. Implementation Roadmap

### Phase A: Universal Affordances (High Priority)

1. **Enable scroll zoom in ALL modes** — logarithmic speed, mode-appropriate behavior
2. **Enable orbit in falcon/spectator** — already done via OrbitControls
3. **Add `zoomToCursor: true`** to falcon/spectator OrbitControls
4. **Add `R` key reset** — returns to mode-appropriate default view
5. **Add `Escape` as universal exit** — returns to falcon from any state
6. **Add double-click fly-to** — animated recentering in falcon/spectator

### Phase B: Transition Polish

1. **Director camera transitions** — engine-controlled bezier curves, not player-driven
2. **Context-preserving fly-to** — zoom out first, then swoop in (Google Earth pattern)
3. **Tab quick-toggle** — smooth 300ms interpolation between 1P ↔ 3P (already implemented)
4. **Suppress auto-follow during manual orbit** (WoW pattern) for player-3P
5. **Reduce transition jank** — ensure spawn point is always on platform, not on branch

### Phase C: Debug Layer Refactor

1. **Separate gizmo scene** — render debug geometry after main scene
2. **Per-category toggles** — independent boolean per debug category in store
3. **Frame Selection (F key)** — fly spectator camera to selected object
4. **Camera frustum visualization** — Three.js CameraHelper for game camera in spectator mode
5. **Always-on inspector** — mode indicator, position, escape hint visible in all states

### Phase D: Collision and Surface

1. **Player-3P zoom-in on occlusion** — sphere-cast from pivot to camera, push forward on hit
2. **Hysteresis on collision recovery** — don't snap back until clear for 200ms+
3. **Surface-normal auto-tilt** — subtle camera pitch adjustment on branch curvature (WoW terrain tilt pattern)
4. **Branch-relative auto-follow** — compute "behind player" in local tangent frame

### Phase E: Advanced (Future)

1. **PIP viewport** — render game camera into corner when spectator active
2. **Camera bookmarks** — save/restore named viewpoints with animated transitions
3. **Situation-aware parameter blending** — DynamicCam pattern: smooth blend between parameter sets based on context (combat, exploration, inspection)
4. **Touch gesture support** — pinch/drag/rotate mapping per mode
5. **Inertial throw** — coast-and-decelerate for falcon/spectator orbit

---

## 10. Anti-Pattern Registry

Things we explicitly DO NOT do, based on research findings:

| Anti-Pattern | Source | Why We Avoid It |
|--------------|--------|-----------------|
| Auto-tilt coupled to zoom | Google Earth | Most complained-about feature. We use mode transitions instead. |
| First-person snap on max zoom-in | WoW | Discrete jump is jarring. Our 1P is a separate mode with explicit entry. |
| Hard Street View transition | Google Earth | Breaks the continuum. Our transitions are always animated. |
| Indoor collision pumping | WoW | Camera oscillates rapidly. We use hysteresis. |
| Debug as separate mode | Current system | Debug is a layer, not a mode. |
| Momentum on curved surfaces | N/A | Inertia on branch surfaces would be disorienting. Player modes have no inertia. |
| Unbounded zoom slider | RuneScape Freedom | Hard bounds on both ends prevent disorientation. |
| All-or-nothing debug rendering | Unity anti-pattern | Per-category toggles prevent visual noise. |
| Pointer lock without escape | 3D apps | Escape key ALWAYS exits pointer lock and returns to falcon. |
| Scroll hijacking | Web3D apps | Only capture scroll when canvas is focused/hovered. |

---

## 11. Research Sources

### Agent 1: Google Earth
- Logarithmic altitude adaptation, auto-tilt gradient, always-available pan/zoom
- "Fly-to" with context preservation, bezier easing on all transitions
- Anti-pattern: hard Street View transition, involuntary tilt coupling

### Agent 2: World of Warcraft
- Single unified camera model across all contexts
- Left-click/right-click split (orbit vs steer), scroll zoom continuum
- Auto-follow suppressed during manual orbit, collision via zoom-in
- DynamicCam addon validates context-aware parameter blending
- Anti-pattern: first-person snap, indoor collision pumping, water collision

### Agent 3: RuneScape & Isometric Games
- Overview and close-up are discrete states, not a zoom slider
- Camera always anchored to focal entity, named presets > raw sliders
- Lost Ark's director camera — engine is the cinematographer during transitions
- Anti-pattern: unbounded zoom exposing engine seams, mouse button conflicts

### Agent 4: 3D Application Conventions
- Two conventions: Object Inspector (LMB=orbit) vs Map Navigator (LMB=pan)
- Zoom-to-cursor, double-click to focus, damping recommendations
- camera-controls library for unified orbit/FPS paradigm
- Anti-pattern: no damping, polar gimbal lock, right-click context menu conflicts

### Agent 5: Debug Camera Patterns
- Debug is a layer (overlay pass), not a mode (separate viewport)
- Per-category toggles, Frame Selection (F key), UE's Eject pattern
- PIP for simultaneous game + debug views
- Anti-pattern: debug camera with gameplay collision, static debug text ignoring camera
