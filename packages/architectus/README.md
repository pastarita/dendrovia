# ARCHITECTUS - The Renderer

> **Philosophy:** "Macro-SDF, Micro-Mesh - The world is defined by math (SDF), but the inhabitants are defined by geometry (GLTF)."

## Responsibility

ARCHITECTUS is the **3D rendering engine** powering the Monument Valley-inspired dendritic world:

1. **WebGPU Rendering** - Modern GPU compute for raymarching
2. **SDF Evaluation** - Real-time distance field rendering
3. **Hybrid LOD** - SDF for far, mesh for near
4. **Camera Modes** - Falcon (overview) ↔ Player (first-person)
5. **Spatial Events** - Emit position/collision data to LUDUS

## Core Technologies

- **Three.js r171+** - WebGPU-first renderer
- **React Three Fiber** - Declarative 3D scene management
- **TSL (Three Shader Language)** - Shader composition without manual GLSL
- **@react-three/drei** - Helper components
- **@react-three/postprocessing** - Visual polish

## Output

- Real-time 3D visualization (60fps desktop, 30fps mobile)
- Spatial event stream via EventBus
- WebGPU with graceful WebGL2 fallback

## Cognitive Boundaries

**Dependencies:**
- IMAGINARIUM (loads generated shaders)
- OPERATUS (loads assets)

**Consumers:**
- LUDUS (receives spatial events)
- OCULUS (provides 3D canvas for overlay)

**Interface:**
- Emits `GameEvents.PLAYER_MOVED`, `NODE_CLICKED`, `COLLISION_DETECTED`
- Listens to `GameEvents.ENCOUNTER_TRIGGERED` (visual feedback)

## Steering Heuristic

> "If the shader complexity exceeds the frame budget on an integrated GPU (e.g., MacBook Air), bake the SDF result into a static Low-Poly Mesh for that session (LOD)."

## Key Philosophies

### 1. Embrace the Abstraction

**Insight:** The "Melted Plastic" look of SDFs is perfect for code visualization.

We're not simulating "Real Trees"; we're simulating "Data Trees." The smooth blending is a **feature**, not an artifact.

Visual language:
- **Tron** - Glowing edges, digital aesthetic
- **Rez** - Abstract geometry, rhythm
- **Monument Valley** - Impossible architecture, perspective tricks

### 2. Hybrid Rendering

**Problem:** Pure SDF raymarching is expensive at high resolution.

**Solution:** Adaptive LOD

```typescript
<group>
  {/* Distant branches - raymarched SDF (infinite detail) */}
  <RaymarchedBranches sdfShader={shader} lodLevel="far" />

  {/* Nearby nodes - instanced meshes (performance) */}
  <InstancedNodes count={1000} geometry={mesh} />
</group>
```

### 3. Zero Fog / Infinite View

**Goal:** See the entire codebase from Falcon mode.

**Challenge:** Traditional fog obscures distant objects.

**Solution:**
- Use **atmospheric perspective** (color shift, not opacity)
- Render far objects with **lower resolution SDFs**
- Apply **depth-based color grading** (Monument Valley style)

### 4. The Ant on a Manifold

**Camera Philosophy:**

When in Player mode, the camera is "glued" to the dendrite surface. You walk along branches like an ant on a log.

Physics:
- Gravity points **toward the branch axis**
- Movement is **tangent to the surface**
- Jumping "falls back" to the branch

This creates the Monument Valley "impossible perspective" feeling.

## Implementation Status

- [ ] WebGPU renderer initialization
- [ ] SDF raymarching shader system
- [ ] Hybrid LOD (SDF + mesh)
- [ ] Camera controller (Falcon ↔ Player)
- [ ] Spatial event emission
- [ ] Post-processing (glow, color grading)
- [ ] Performance monitoring

## Camera Modes

### Falcon Mode (Overview)

- **Purpose:** Pattern recognition, hotspot detection
- **Camera:** Free-floating, orbital
- **Rendering:** Full SDF raymarching (infinite zoom)
- **UI:** Minimap, hotspot highlights

### Player Mode (Exploration)

- **Purpose:** Code reading, quest interaction
- **Camera:** Third-person, surface-locked
- **Rendering:** Hybrid (mesh near, SDF far)
- **UI:** HUD, Miller Columns

Transition: Smooth interpolation over 2 seconds

## Performance Targets

| Platform | Target FPS | Rendering Mode |
|----------|-----------|----------------|
| Desktop (Discrete GPU) | 60 | Full SDF |
| Desktop (Integrated GPU) | 60 | Hybrid SDF+Mesh |
| Mobile (High-end) | 30 | Mesh-only |
| Mobile (Low-end) | 30 | Simplified Mesh |

## WebGPU Fallback Strategy

```typescript
const preferredBackend = 'webgpu';
const fallbackBackend = 'webgl2';

if (!navigator.gpu) {
  console.warn('WebGPU not supported, falling back to WebGL2');
  renderer.backend = fallbackBackend;
}
```

**Fallback compromises:**
- No raymarching (pre-baked meshes)
- Simplified shaders
- Reduced particle counts

## Future Enhancements

- [ ] Real-time shader hot-reload (dev mode)
- [ ] VR support (WebXR)
- [ ] Mobile-optimized rendering
- [ ] Screenshot/video export
- [ ] Custom camera paths (cinematics)
