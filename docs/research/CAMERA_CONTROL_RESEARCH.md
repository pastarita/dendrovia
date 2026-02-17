# Camera Control Research — Modalities, Conventions & Engine Policy

> **Status:** COMPLETE — synthesized into `CAMERA_POLICY.md`
> **Date:** 2026-02-17
> **Context:** ARCHITECTUS camera system redesign (CameraRig.tsx)
> **Branch:** `feat/nest-system-viewframe`

---

## Motivation

Our current camera system has discrete locked modes (falcon, player-1p, player-3p, spectator) with hard transitions between them. The user experience is brittle — you enter a mode and lose access to basic navigation affordances (pan, zoom, orbit) that should be ambient and always-available regardless of mode. The camera should feel like a *continuum* with personality per mode, not a set of locked boxes.

We need to understand how mature 3D applications and games solve this — not to copy them, but to identify the **invariant affordances** (things that should always work) versus **modal affordances** (things that change with context).

---

## Research Questions

### Q1: What are the universal camera affordances?

What operations does every mature 3D application provide regardless of mode?
- Zoom (scroll wheel, pinch)
- Pan (middle-click drag, two-finger drag)
- Orbit/rotate (right-click drag, one-finger drag)
- Reset/home (double-click, home key)

**Which of these should NEVER be locked out?**

### Q2: What is the zoom continuum?

How do applications handle the transition from macro (whole-world view) to micro (surface-level detail)?
- Google Earth: seamless orbital → street level → interior
- WoW: scroll wheel from max zoom-out to first-person
- Is there a "zoom = mode transition" pattern where zooming past a threshold changes the camera behavior?

### Q3: How do chase cameras maintain agency?

In third-person games, how is the camera semi-autonomous (follows player) while remaining user-controllable?
- WoW: camera auto-resets behind player on movement, but user can freely orbit
- How does the "rubber band" between user input and auto-follow work?
- What's the difference between "camera follows player" and "camera is locked to player"?

### Q4: How do debug/spectator cameras coexist with gameplay cameras?

- How do game engines (Unity, Unreal) handle the editor/debug camera alongside the game camera?
- Is the debug camera a separate camera object or a mode of the same camera?
- What gets conditionally rendered in debug mode (frustums, paths, collision volumes)?

### Q5: What is the escape hatch pattern?

When a user feels "stuck" in a view, what's the universal recovery gesture?
- Escape key? Double-click? Home key?
- Is there always a "reset to known good position" action?
- How do applications communicate what mode you're in and how to leave it?

---

## Reference Implementations to Survey

### Agent 1: Google Earth — The Zoom Continuum

**Inquiry focus:** How Google Earth handles the seamless transition from orbital view to street-level. What input modalities exist (mouse, touch, keyboard). How the camera model changes at different scales. What affordances are always available. How tilt/rotation works at different zoom levels. The relationship between zoom level and rendered detail. How Google Earth handles the "unstuck" problem — can you ever get lost?

**Return summary goal:** A catalog of Google Earth's camera states, transitions between them, which inputs are always active, and how it signals the current state to the user. Note any "zoom threshold" behaviors where the camera model changes.

### Agent 2: World of Warcraft — The Chase Camera Continuum

**Inquiry focus:** How WoW's camera system works across its many contexts: ground movement, flying, swimming, mounted, indoors, combat. How scroll wheel zoom works (min/max distances, first-person transition). How the camera auto-follows vs user override works. The "action camera" mode. How camera collision with geometry works (camera pulls forward when hitting a wall). CVar settings that control camera behavior. How WoW handles the transition between flying/mounted and ground — does the camera model change?

**Return summary goal:** A taxonomy of WoW's camera behaviors by context, the scroll-wheel zoom continuum (max zoom-out to first-person), how camera-player coupling varies by mode, and the collision/avoidance model. List the user-configurable camera parameters.

### Agent 3: RuneScape & Isometric 3D Games — The Constrained Camera

**Inquiry focus:** How RuneScape (RS3 and OSRS) handles camera control. The evolution from fixed isometric to free camera. How zoom and rotation work. What constraints exist (angle limits, zoom limits). How the camera relates to the player character. Compare with other isometric-to-3D games (Diablo, Path of Exile, Lost Ark). What happens when you zoom all the way in?

**Return summary goal:** How constrained camera systems provide agency within limits. The relationship between camera freedom and game readability. How these games handle the zoom-in-to-first-person transition (or explicitly prevent it).

### Agent 4: 3D Application Camera Conventions (CAD, DCC, Web3D)

**Inquiry focus:** Camera conventions in professional 3D tools — Blender, Maya, three.js/R3F (OrbitControls, MapControls, FlyControls, PointerLockControls), Google Maps 3D, Cesium, Mapbox GL. What are the established mouse button conventions (left=orbit, middle=pan, right=context menu vs. right=orbit, middle=pan). Touch gesture conventions. How these tools handle camera bookmarks/saved views. How they handle coordinate system display and orientation indicators.

**Return summary goal:** A convention matrix: what does left-click-drag, right-click-drag, middle-click-drag, scroll, pinch, and two-finger-rotate do across each tool? What's the de facto standard? What three.js controls are available and what paradigm does each implement?

### Agent 5: Debug Camera Patterns in Game Engines

**Inquiry focus:** How Unity, Unreal Engine, Godot, and other engines implement debug/editor cameras. What is rendered in debug mode (camera frustums, collision volumes, nav meshes, LOD boundaries, wireframes). How the debug camera relates to the game camera — is it a separate object? Can you see the game camera's frustum from the debug camera? How do developers toggle between game view and scene view? What overlays exist (stats, gizmos, handles)?

**Return summary goal:** A pattern catalog of debug camera implementations. What gets visualized, how it's toggled, how the debug camera is architecturally separate from game cameras. Note any "picture-in-picture" patterns where both views coexist.

---

## Synthesis Goals

After all agents return, we need to produce:

### 1. Affordance Policy Table

| Affordance | Always Available | Mode-Dependent | Our Implementation |
|------------|-----------------|----------------|-------------------|
| Scroll zoom | ? | ? | ? |
| Orbit/rotate | ? | ? | ? |
| Pan | ? | ? | ? |
| Reset view | ? | ? | ? |

### 2. Camera State Machine

Define our camera states not as hard-locked modes but as points on a continuum:
- What is the "personality" of each state (what auto-behaviors are active)?
- What user overrides are available in each state?
- What transitions are explicit (key press) vs implicit (zoom threshold)?

### 3. Debug Layer Architecture

- What is rendered conditionally in debug/spectator mode?
- How are camera frustums, paths, and boundaries visualized?
- What's the relationship between the debug camera and the game cameras?
- How do we escape from any state?

### 4. Input Convention Matrix

Define our mouse/keyboard/touch mapping:
- What does each input do in each camera state?
- Where do we follow convention vs deviate intentionally?
- What's our "signature" camera behavior (the thing that feels uniquely Dendrovia)?

---

## Our Current State (Pre-Research)

### Camera Modes

| Mode | Description | User Input | Problem |
|------|-------------|------------|---------|
| `falcon` | Auto-orbit with WASD nudge | WASD nudge, scroll zoom | Ends and transitions to player; no free orbit |
| `player-1p` | Surface-locked first-person | WASD move, Space jump | Locked to branch/platform; no zoom/orbit |
| `player-3p` | Chase camera behind player | WASD move, Space jump | Fixed offset; no zoom adjustment |
| `spectator` | Free OrbitControls | Full orbit/pan/zoom | Separate debug mode; not integrated |

### Known Problems

1. **No ambient zoom** — scroll wheel only works in falcon mode
2. **No ambient orbit** — can't rotate view in player modes
3. **Hard mode boundaries** — entering a mode locks out affordances from other modes
4. **No zoom-to-transition** — can't scroll from overview into first-person smoothly
5. **Transition jumps** — mode switches cause discontinuous camera position changes
6. **No escape hatch** — getting stuck in a view requires knowing the right key
7. **Debug is a separate mode** — not a layer that can overlay any mode

### What We Want

- Scroll wheel zoom should work in EVERY mode (with mode-appropriate behavior)
- Right-click drag should orbit/rotate in EVERY mode (with appropriate constraints)
- The camera should feel like ONE continuous system with different personalities
- Debug visualization should be a LAYER, not a MODE
- There should always be a way to "unstuck" yourself
- The inspector panel should always show where you are and how to get out

---

## Connection to Dendrovia's Unique Constraints

Our camera system has properties that standard games don't:

1. **The tree IS the world** — there's no flat terrain, no horizon line. The geometry is fractal and cylindrical. Camera collision is against branch cylinders, not walls.

2. **Scale spans orders of magnitude** — from seeing the entire tree (treeSpan ≈ 10-50u) to walking on a single branch surface (trunkRadius ≈ 0.3u). Google Earth's zoom continuum is the closest analog.

3. **The "ant on a manifold" metaphor** — player mode gravity points toward the branch axis, not world-down. This is fundamentally different from WoW/RuneScape where gravity is always -Y.

4. **Diagnostic/inspection is a first-class use case** — this isn't just a game; it's a code visualization tool. The user frequently needs to "step outside" the experience to understand the spatial structure.

5. **The nest is the anchor point** — unlike WoW where the camera follows the character, our camera has a "home" position (the nest) that provides spatial reference.

6. **Branch topology is the map** — there's no minimap. The camera IS the navigation tool. The user needs to be able to see where they are relative to the whole tree at any time.

---

## Deliverable

After research synthesis, produce:

1. **`CAMERA_POLICY.md`** — Our camera affordance policy (what's always on, what's modal, escape hatches)
2. **Camera state machine diagram** (Mermaid) showing states, transitions, and available affordances per state
3. **Input convention matrix** — complete mouse/keyboard/touch mapping per state
4. **Debug layer specification** — what gets conditionally rendered and how
5. **Implementation roadmap** — what to change in CameraRig.tsx, what new components, what store changes

---

## Agent Dispatch Notes

- Each agent should return **at most 2500 words** (avoid context bloat)
- Focus on **behavioral patterns and conventions**, not implementation details
- Include specific parameter values where relevant (e.g., WoW's max camera distance is X units)
- Note any **anti-patterns** — things these systems do that feel bad
- Note any **breakthrough moments** — interactions that feel unexpectedly good
- Cross-reference with our constraints (cylindrical geometry, fractal scale, diagnostic use case)
