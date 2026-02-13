# Tranche 3: R3F Advanced Patterns, Camera Systems & Manifold Physics

**Date:** February 12, 2026
**Pillar:** ARCHITECTUS (The Renderer)
**Purpose:** Ground truth for Steps 11-15 of the 25-step implementation plan

---

## 1. R3F Scene Architecture

### Scene Graph Organization

For a large-scale 3D code visualization with thousands of objects, R3F scenes should be organized into logical `<group>` hierarchies:

```tsx
<Canvas>
  <SceneContents />
</Canvas>

function SceneContents() {
  return (
    <>
      {/* Static world geometry */}
      <group name="dendrite-world">
        <BranchInstances topology={data} />
        <NodeInstances nodes={data.nodes} />
      </group>

      {/* Dynamic entities */}
      <group name="entities">
        <PlayerMesh />
        <BugEntities bugs={activeBugs} />
      </group>

      {/* Effects layer */}
      <group name="effects">
        <ParticlePool />
        <AmbientGlow />
      </group>

      {/* Systems (no visual output) */}
      <CameraRig />
      <Lighting />
      <PostProcessing />
    </>
  );
}
```

### Recommended Layered Architecture

| Layer | Purpose | Key Technology |
|-------|---------|----------------|
| **Store** | Game state, camera, selection | Zustand with `getState()` in `useFrame` |
| **Scene Graph** | Environment, dendrites, entities | Nested `<group>` components with LOD |
| **Branches** | Thousands of branch segments | Raw `<instancedMesh>` or `InstancedMesh2` |
| **Nodes** | Interactive file/function nodes | Drei `<Instances>` + `meshBounds` raycasting |
| **Particles** | Bug effects, glow, ambient | Object pool on `<instancedMesh>` |
| **HUD** | Minimap, breadcrumbs, health | Drei `<Hud>` + `<View>` for minimap |
| **Renderer** | WebGPU with WebGL fallback | Async `gl` prop, TSL node materials |
| **Communication** | Cross-pillar events | EventBus bridged to Zustand stores |

**Sources:**
- https://r3f.docs.pmnd.rs/advanced/scaling-performance
- https://r3f.docs.pmnd.rs/advanced/pitfalls

---

## 2. R3F Performance Patterns

### useFrame Best Practices

Everything in `useFrame` runs **outside React's reconciliation**:

```tsx
// CRITICAL: Never setState inside useFrame
// BAD: 60 React re-renders per second
useFrame(() => setRotation(r => r + 0.01));

// GOOD: Direct Three.js mutation via refs
useFrame((state, delta) => {
  ref.current.rotation.y += delta * 0.5;
});
```

**Priority system** for ordering frame callbacks:

```tsx
useFrame(updatePhysics, -1);      // Runs first
useFrame(updateAnimation, 0);      // Default
useFrame(updateCamera, 1);         // Runs after animation
useFrame(updatePostProcess, 100);  // Runs last
```

**Reuse temporary objects** to avoid GC pressure:

```tsx
// Module-level reusable objects (never GC'd)
const _tempVec3 = new Vector3();
const _tempMatrix = new Matrix4();
const _tempQuat = new Quaternion();
```

### Instanced Rendering

For Dendrovia's thousands of branch segments, instancing reduces thousands of draw calls to one:

```tsx
const MAX_BRANCHES = 10000;
const _dummy = new Object3D();
const _color = new Color();

function BranchInstances({ branches }) {
  const meshRef = useRef<InstancedMesh>(null);

  useEffect(() => {
    branches.forEach((branch, i) => {
      _dummy.position.set(...branch.position);
      _dummy.scale.set(branch.radius, branch.length, branch.radius);
      _dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, _dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.count = branches.length;
  }, [branches]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_BRANCHES]}>
      <cylinderGeometry args={[1, 1, 1, 8]} />
      <meshStandardMaterial vertexColors />
    </instancedMesh>
  );
}
```

**Performance guidance:** Direct `<instancedMesh>` is faster than drei `<Instances>` for large counts (10k+). The drei approach creates React elements per instance, which has overhead. For branch segments, use raw `<instancedMesh>`. For interactive nodes (fewer in number), drei `<Instances>` is fine.

### InstancedMesh2 (@three.ez/instanced-mesh)

Adds critical features missing from standard `InstancedMesh`:

- **Per-instance frustum culling** (`perObjectFrustumCulled = true` default)
- **BVH spatial indexing** for fast raycasting
- **Dynamic add/remove** with auto-growing buffers
- **Per-instance visibility** toggle
- **Sorting** to reduce overdraw for transparent objects

```tsx
const im = new InstancedMesh2(geometry, material, { capacity: 10000 });
im.addInstances(count, (obj, index) => {
  obj.position.set(...positions[index]);
});
im.computeBVH({ margin: 0.5 }); // Speed up culling
```

### Adaptive Quality with PerformanceMonitor

```tsx
import { PerformanceMonitor } from '@react-three/drei';

<PerformanceMonitor
  onIncline={() => setDegraded(false)}
  onDecline={() => setDegraded(true)}
  flipflops={3}
  averages={10}
>
  <DendriteWorld
    lodBias={degraded ? 2 : 0}
    particleCount={degraded ? 100 : 1000}
    shadowsEnabled={!degraded}
  />
</PerformanceMonitor>
```

**Sources:**
- https://www.npmjs.com/package/@three.ez/instanced-mesh
- https://github.com/agargaro/instanced-mesh
- https://agargaro.github.io/instanced-mesh/basics/06-frustum-culling/
- https://github.com/gkjohnson/three-mesh-bvh

---

## 3. R3F Events and Interaction

### Pointer Events on 3D Objects

R3F exposes DOM-like pointer events on any Three.js object with `raycast`:

```tsx
<mesh
  onClick={(e) => { e.stopPropagation(); onSelect(nodeId); }}
  onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
  onPointerOut={() => setHovered(false)}
/>
```

### Raycasting Performance

Key strategies for thousands of interactive objects:

1. **`meshBounds`** from drei: bounding-sphere checks instead of geometry (much faster)
2. **Layered raycasting**: only attach events to objects that need them
3. **`stopPropagation()`**: prevent events hitting objects behind target
4. **For `instancedMesh`**: events do NOT work natively — use `InstancedMesh2` with built-in BVH raycasting

---

## 4. R3F Hooks Reference

| Hook | Purpose | Dendrovia Usage |
|------|---------|-----------------|
| `useThree()` | Access renderer, camera, scene, size | Renderer info, camera access |
| `useFrame(fn, priority)` | Per-frame update loop | Physics, animation, camera |
| `useLoader(Loader, url)` | Cached asset loading | GLTF bugs, textures |
| Custom `useComplexityGlow` | Animate emissive by code complexity | Branch visualization |
| Custom `useBranchWalker` | Follow path along curve | NPC/debug movement |
| Custom `useDistanceCulling` | Distance-based visibility | LOD management |

**Sources:**
- https://r3f.docs.pmnd.rs/api/hooks
- https://r3f.docs.pmnd.rs/api/events

---

## 5. Multi-View and Portals

### Drei `<Hud>` for HUD Overlay

```tsx
import { Hud, OrthographicCamera, Text } from '@react-three/drei';

<Hud renderPriority={1}>
  <OrthographicCamera makeDefault position={[0, 0, 5]} />
  <Text position={[-3, 3.5, 0]} fontSize={0.15} color="white">
    src / components / Dendrite.tsx
  </Text>
</Hud>
```

### Drei `<View>` for Split Viewports

Uses `gl.scissor` to cut the canvas into segments tied to HTML tracking divs:

```tsx
<View track={mainViewRef}>
  <PerspectiveCamera makeDefault position={[0, 50, 100]} fov={75} />
  <DendriteWorld />
</View>

<View track={minimapRef}>
  <OrthographicCamera makeDefault position={[0, 200, 0]} zoom={0.5} />
  <DendriteWorld simplified />
  <PlayerMarker />
</View>
```

**Sources:**
- https://drei.docs.pmnd.rs/portals/hud
- https://drei.docs.pmnd.rs/portals/view

---

## 6. Camera Controller System Design

### Library Selection

| Library | Use Case | Dendrovia Role |
|---------|----------|---------------|
| `camera-controls` (yomotsu) | Smooth orbital camera with programmatic API | **Falcon Mode** + mode transitions |
| Custom `useFrame` controller | Surface-locked third-person following | **Player Mode** |
| `maath/easing` | Frame-rate independent damping | Both modes (position/rotation smoothing) |
| `@react-spring/three` | Physics-based discrete animations | Focus-on-node zoom, UI transitions |

### Falcon Mode Implementation

Use `camera-controls` via drei with constraints for bird's-eye viewing:

```tsx
import { CameraControls } from '@react-three/drei';

function FalconCamera() {
  const controlsRef = useRef<CameraControlsImpl>(null);

  useEffect(() => {
    const c = controlsRef.current;
    c.minPolarAngle = 0.1;         // Nearly top-down minimum
    c.maxPolarAngle = Math.PI / 3; // 60 degrees max tilt
    c.minDistance = 15;
    c.maxDistance = 200;
    c.smoothTime = 0.25;
    c.draggingSmoothTime = 0.125;
  }, []);

  return <CameraControls ref={controlsRef} makeDefault />;
}
```

**Focus-on-object animation:**

```tsx
await controls.fitToBox(targetMesh, true, {
  paddingTop: 1.5, paddingBottom: 1.5,
  paddingLeft: 1.5, paddingRight: 1.5,
});
```

### Player Mode Implementation (Surface-Locked)

Custom `useFrame` controller for the "Ant on a Manifold" camera:

```tsx
function PlayerCamera({ branchCurve, playerT }) {
  const { camera } = useThree();
  const playerPos = useRef(new Vector3());
  const tangent = useRef(new Vector3());
  const normal = useRef(new Vector3());

  useFrame((state, delta) => {
    branchCurve.getPointAt(playerT.current, playerPos.current);
    branchCurve.getTangentAt(playerT.current, tangent.current);

    // Camera behind player, offset by surface normal
    const desiredPos = playerPos.current.clone()
      .addScaledVector(tangent.current, -3)
      .addScaledVector(normal.current, 2);

    // Frame-rate independent smooth follow
    easing.damp3(camera.position, desiredPos, 0.15, delta);

    // Smooth look-at via quaternion SLERP
    const lookMatrix = new Matrix4().lookAt(
      camera.position, playerPos.current, normal.current
    );
    const targetQuat = new Quaternion().setFromRotationMatrix(lookMatrix);
    camera.quaternion.slerp(targetQuat, 1 - Math.exp(-6 * delta));
  });
}
```

### Camera Transition System

The transition from Falcon to Player mode uses `camera-controls.setLookAt()` for animated handoff, then disables orbital controls:

```tsx
async function transitionToPlayerMode(controls, branchCurve, playerT) {
  const playerPos = branchCurve.getPointAt(playerT);
  const tangent = branchCurve.getTangentAt(playerT);
  const cameraPos = playerPos.clone()
    .addScaledVector(tangent, -3)
    .addScaledVector(normal, 2);

  controls.smoothTime = 1.5; // Slow transition
  await controls.setLookAt(
    cameraPos.x, cameraPos.y, cameraPos.z,
    playerPos.x, playerPos.y, playerPos.z,
    true // enableTransition
  );
  controls.enabled = false; // Hand off to custom controller
}
```

### Camera Collision Detection

Raycast from player to desired camera position to prevent clipping:

```tsx
raycaster.set(playerPos, rayDirection);
raycaster.far = maxDist;
const intersects = raycaster.intersectObjects(scene.children, true);
if (intersects.length > 0 && intersects[0].distance < maxDist) {
  const safeDist = Math.max(intersects[0].distance - 0.5, minDistance);
  return playerPos.clone().addScaledVector(rayDirection, safeDist);
}
```

### Avoiding Gimbal Lock

Always store camera orientations as quaternions, never Euler angles. Use SLERP for transitions:

```tsx
const targetQuat = mode === 'falcon' ? falconQuat : playerQuat;
state.camera.quaternion.slerp(targetQuat, 1 - Math.exp(-3 * delta));
```

**Key insight:** Create Quaternion/Euler objects OUTSIDE of `useFrame` — allocating them every frame causes GC pressure.

**Sources:**
- https://github.com/yomotsu/camera-controls
- https://drei.docs.pmnd.rs/controls/camera-controls
- https://github.com/pmndrs/maath
- https://react-spring.dev/docs/guides/react-three-fiber

---

## 7. Frame-Rate Independent Smoothing

### maath/easing Functions

The single most important utility library for camera and animation smoothing:

```tsx
import { easing } from 'maath';

useFrame((state, delta) => {
  // Smooth position (Vector3)
  easing.damp3(camera.position, targetPos, 0.25, delta);

  // Smooth rotation (Euler)
  easing.dampE(camera.rotation, targetRot, 0.25, delta);

  // Smooth single value (FOV)
  easing.damp(camera, 'fov', targetFov, 0.25, delta);
});
```

**API:** `damp3(current, target, smoothTime, delta, maxSpeed?, easing?, eps?)`

**Advantage over raw LERP:** SmoothDamp provides critically-damped spring behavior — approaches target without oscillation, speed proportional to distance remaining. Based on Game Programming Gems 4 Chapter 1.10.

### The Exponential Decay Formula

The universal frame-rate independent interpolation:

```tsx
current + (target - current) * (1 - Math.exp(-speed * delta))
```

For Vector3: `camera.position.lerp(target, 1 - Math.exp(-speed * delta))`
For Quaternion: `camera.quaternion.slerp(target, 1 - Math.exp(-speed * delta))`

**Sources:**
- https://github.com/pmndrs/maath/blob/main/README.md

---

## 8. Manifold Physics — Surface-Constrained Movement

### Coordinate System

Player position on a branch is represented in **cylindrical coordinates (s, θ)**:

- **s** — arc-length distance along the branch center curve (0 to branch.length)
- **θ** — angular position around the branch circumference (0 to 2π)

This reduces movement from 3D to 2D while the player is grounded.

### Converting to World Position

```typescript
function getWorldPosition(s: number, theta: number, branch: Branch): Vector3 {
  const t = s / branch.length; // normalize to 0-1
  const frame = branch.frames[Math.floor(t * (branch.frames.length - 1))];

  return frame.position.clone()
    .addScaledVector(frame.normal, Math.cos(theta) * branch.radius)
    .addScaledVector(frame.binormal, Math.sin(theta) * branch.radius);
}
```

### Parallel Transport vs Frenet-Serret

**Decision: Use Parallel Transport (Bishop Frame).**

| Property | Frenet-Serret | Parallel Transport |
|----------|--------------|-------------------|
| Straight segments | **Undefined** (curvature = 0) | Works perfectly |
| Inflection points | Flips (discontinuous) | Smooth |
| Twist behavior | Natural twist (torsion) | Minimal twist |
| Computation | Needs 2nd derivative | Only cross products |
| Game suitability | Poor (sudden flips) | Excellent (predictable) |

Parallel Transport algorithm:

```
1. Start with initial frame (T₀, U₀, V₀) at s=0
2. For each sample point i:
   a. Compute new tangent Tᵢ = curve.getTangentAt(sᵢ)
   b. Rotation axis: A = Tᵢ₋₁ × Tᵢ
   c. Rotation angle: φ = acos(Tᵢ₋₁ · Tᵢ)
   d. Rotate previous U and V by (A, φ)
   e. Store frame (Tᵢ, Uᵢ, Vᵢ)
```

**Precompute frames** along each branch curve at initialization (100 samples per branch). Store in array and interpolate at runtime. This costs nothing at runtime.

### Grounded Movement (Parametric)

When the player is on a surface, movement is trivial in (s, θ):

```typescript
function stepGrounded(player, input, branch, dt) {
  const speed = 5.0;
  player.velocity.x += input.forward * speed; // ds/dt
  player.velocity.y += input.right * speed / branch.radius; // dθ/dt

  player.velocity.multiplyScalar(0.85); // friction

  player.s += player.velocity.x * dt;
  player.theta += player.velocity.y * dt;
  player.theta = ((player.theta % TAU) + TAU) % TAU; // wrap
}
```

### Airborne Movement (SDF-Based)

When jumping or transitioning, use full 3D with SDF gravity:

```typescript
function sdfGravity(position, sdf, gravityStrength = 9.81) {
  const d = sdf(position);
  if (d <= 0.01) return new Vector3(0, 0, 0); // on surface
  const normal = sdfNormal(position, sdf);
  return normal.multiplyScalar(-gravityStrength); // pull toward surface
}
```

SDF gradient as surface normal (central differences):

```
∂SDF/∂x ≈ (SDF(p + εx̂) - SDF(p - εx̂)) / (2ε)
∂SDF/∂y ≈ (SDF(p + εŷ) - SDF(p - εŷ)) / (2ε)
∂SDF/∂z ≈ (SDF(p + εẑ) - SDF(p - εẑ)) / (2ε)
```

### Hybrid Physics Architecture

**Key design:** Use BOTH parametric and SDF physics:

```typescript
function updatePlayer(player, input, dt) {
  if (player.isGrounded) {
    return moveOnBranchParametric(player, input, dt); // 2 DOF, fast
  } else {
    return moveInSDFField(player, input, dt); // 3 DOF, SDF gravity
  }
}
```

- **Grounded:** Parametric (s, θ) — fast, exact, predictable, zero SDF queries
- **Airborne:** SDF gradient gravity + Verlet integration
- **Transition:** SDF projection back to surface, find nearest branch

**Sources:**
- https://en.wikipedia.org/wiki/Parallel_transport
- https://en.wikipedia.org/wiki/Frenet%E2%80%93Serret_formulas

---

## 9. Junction Navigation

### The Junction Problem

At branch forks, two or more branch SDFs overlap and blend. The player must:
1. Detect junction approach
2. Choose a branch
3. Smoothly transition onto the new surface

### Junction Detection

```typescript
function detectJunction(player, tree) {
  const branch = tree.getBranch(player.branchId);
  const distToEnd = branch.length - player.s;

  if (distToEnd < JUNCTION_DETECTION_RADIUS) {
    const children = tree.getChildren(player.branchId);
    if (children.length > 0) {
      return { type: 'fork', children };
    }
  }
  return null;
}
```

### Branch Selection Strategy

**Decision: Automatic selection based on movement direction + visual indicators.**

The player's movement direction naturally selects the branch, with glowing indicators showing which is "selected":

```typescript
function selectBranch(playerForward, inputDir, candidates) {
  const desired = playerForward.clone()
    .add(inputDir.clone().multiplyScalar(0.5))
    .normalize();

  let bestBranch = candidates[0];
  let bestDot = -Infinity;
  for (const branch of candidates) {
    const dot = desired.dot(branch.curve.getTangentAt(0));
    if (dot > bestDot) { bestDot = dot; bestBranch = branch; }
  }
  return bestBranch;
}
```

### Smooth Surface Transition

Use LERP/SLERP with smoothstep easing:

```typescript
function transitionBetweenBranches(fromFrame, toFrame, progress) {
  const t = smoothstep(progress); // t*t*(3-2*t)
  return {
    position: fromFrame.position.clone().lerp(toFrame.position, t),
    up: fromFrame.normal.clone().lerp(toFrame.normal, t).normalize(),
    forward: fromFrame.tangent.clone().lerp(toFrame.tangent, t).normalize(),
  };
}
```

### Tree Pathfinding

Since the data structure is a **tree** (not a graph with cycles), pathfinding is trivial — exactly one path between any two nodes via Lowest Common Ancestor (LCA). No A* or Dijkstra needed.

---

## 10. Physics Engine Analysis

### Why Traditional Engines Are Wrong

| Feature | Traditional Engine | Dendrovia Needs |
|---------|-------------------|--------------------|
| Gravity | Constant (0, -g, 0) | Variable, per-point, toward branch axis |
| Movement | Euclidean 3D | On 2D manifold surface |
| Collision | Mesh/convex hull | SDF queries |
| Ground check | Downward raycast | Radial raycast toward axis |
| Jumping | Parabolic arc | Radial arc back to surface |

**Decision: Custom physics, NOT an engine.** Rapier/Cannon.js fight the use case at every step. The constraint surface makes traditional engines counterproductive.

### Fixed Timestep with Render Interpolation

```typescript
class DendroviaPhysics {
  private fixedTimestep = 1 / 60; // 60 Hz physics
  private accumulator = 0;

  update(dt, player, input, tree) {
    this.accumulator += dt;
    while (this.accumulator >= this.fixedTimestep) {
      player = this.step(player, input, tree, this.fixedTimestep);
      this.accumulator -= this.fixedTimestep;
    }
    // Interpolate for rendering
    const alpha = this.accumulator / this.fixedTimestep;
    return this.interpolate(player.previous, player, alpha);
  }
}
```

### Verlet Integration for Airborne State

Better energy conservation than Euler. Position-based — easy to enforce SDF surface constraints:

```typescript
function verletStep(position, previousPosition, acceleration, dt) {
  const newPosition = position.clone()
    .multiplyScalar(2)
    .sub(previousPosition)
    .addScaledVector(acceleration, dt * dt);
  return { position: newPosition, previousPosition: position.clone() };
}
```

**Sources:**
- Super Mario Galaxy gravity system (priority-based gravity areas)
- Manifold Garden (discrete gravity switching with 0.5s camera rotation)
- Grow Home (procedural climbing, surface detection via raycasts)

---

## 11. Game Prior Art for Non-Standard Gravity

### Super Mario Galaxy

- **Gravity areas** with shape + priority + range + power
- **Priority-based selection** (highest priority wins, no blending)
- Camera "up" smoothly SLERPed to match gravity direction (20-30 frames)
- If gravity changes >90 degrees, brief cinematic transition

**Key insight for Dendrovia:** Use the parametric branch ID to determine gravity, not a global SDF query, except during transitions.

### Manifold Garden

- World is a 3D torus (infinite repetition via modular arithmetic)
- Six discrete gravity states (axis-aligned)
- Camera rotation during gravity change: ~0.5 seconds SLERP

**Relevance:** Camera rotation during junction transitions directly applies.

### Three.js Relevant APIs

```typescript
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';

const curve = new CatmullRomCurve3(points);
const point = curve.getPointAt(t);    // World position at t
const tangent = curve.getTangentAt(t); // Forward direction at t
```

---

## 12. Animation Libraries

### Library Selection Matrix

| Library | Use Case | Frame-Rate Independent | Interruptible | Dendrovia Role |
|---------|----------|----------------------|---------------|----------------|
| `maath/easing` | Continuous damped follow | Yes (delta param) | Yes (overwrite target) | Camera, position smoothing |
| `@react-spring/three` | Discrete spring transitions | Yes (physics-based) | Yes (mid-flight retarget) | Hover effects, UI animations |
| GSAP | Timeline choreography | Yes (ticker) | Yes (kill/overwrite) | Cutscenes, complex sequences |
| `framer-motion-3d` | Declarative animations | Yes | Yes | **Not recommended** (maintenance lag) |

### React Spring for 3D

```tsx
import { useSpring, animated } from '@react-spring/three';

const { scale, color } = useSpring({
  scale: hovered ? 1.2 : 1.0,
  color: hovered ? '#6dffaa' : '#4d9a6c',
  config: { mass: 1, tension: 280, friction: 60 },
});

<animated.mesh scale={scale}>
  <sphereGeometry />
  <animated.meshStandardMaterial color={color} />
</animated.mesh>
```

### Hover and Selection Effects

**Selective Bloom** — materials glow only when their colors exceed luminanceThreshold:

```tsx
<EffectComposer>
  <Bloom luminanceThreshold={1} luminanceSmoothing={0.9} intensity={1.5} />
</EffectComposer>

// Make a material glow by setting toneMapped={false}
<meshStandardMaterial
  color="#6dffaa"
  emissive="#6dffaa"
  emissiveIntensity={2}
  toneMapped={false}  // Lifts color out of 0-1 range → triggers bloom
/>
```

**Outline Selection** via `@react-three/postprocessing`:

```tsx
<Selection>
  <EffectComposer autoClear={false}>
    <Outline blur edgeStrength={100} visibleEdgeColor={0x6dffaa} />
  </EffectComposer>
  <Select enabled={isSelected}>
    <mesh />
  </Select>
</Selection>
```

**WebGPU Note:** `@react-three/postprocessing` does NOT support WebGPU. When migrating to R3F v9/WebGPU, use Three.js native `PostProcessing` class with TSL nodes instead.

---

## 13. Particle and VFX Systems

### Approach Comparison

| System | Draw Calls | Max Particles | Ease of Use | WebGPU |
|--------|-----------|---------------|-------------|--------|
| Custom instanced pool | 1 | 10k+ | Manual | Yes |
| `wawa-vfx` | 1 (batched) | 10k+ | Declarative | Partial |
| `three.quarks` | 1 (batched) | 50k+ | Moderate | Partial |
| GPU compute (TSL) | 1 | 1M+ | Advanced | Yes |

### Recommended: Custom Instanced Particle Pool

For Dendrovia's encounter effects (damage sparks, glow particles):

```tsx
function ParticlePool() {
  const meshRef = useRef<InstancedMesh>(null);
  const particles = useRef<Particle[]>([]);

  useFrame((_, delta) => {
    let writeIndex = 0;
    for (const p of particles.current) {
      p.life += delta;
      if (p.life >= p.maxLife) continue;
      // Update position, scale, write to instance matrix
      writeIndex++;
    }
    meshRef.current.count = writeIndex;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 500]}>
      <icosahedronGeometry args={[1, 2]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
```

### wawa-vfx for Declarative VFX

```tsx
import { VFXParticles, VFXEmitter } from 'wawa-vfx';

<VFXParticles name="damage" settings={{ nbParticles: 200, renderMode: 'billboard', intensity: 2 }} />
<VFXEmitter emitter="damage" settings={{ duration: 0.3, nbParticles: 50 }} />
```

### GPU Compute Particles (WebGPU)

Using TSL for million-particle systems:

```tsx
import { storage, float, vec3, compute, instanceIndex, time } from 'three/webgpu';

const computeShader = compute(() => {
  const i = instanceIndex;
  const angle = float(i).mul(0.1).add(time);
  storage(positionBuffer, i).assign(vec3(cos(angle), float(i).mul(0.05), sin(angle)));
}, count);
```

**Sources:**
- https://wawasensei.dev/blog/wawa-vfx-open-source-particle-system-for-react-three-fiber-projects
- https://github.com/Alchemist0823/three.quarks
- https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/

---

## 14. Spatial Audio

### Drei PositionalAudio

```tsx
<PositionalAudio ref={audioRef} url="/audio/ambient-hum.mp3" distance={5} loop autoplay={false} />
```

**Note:** Browsers require user interaction before audio can play. Gate audio behind a click gesture.

### Audio Zones with Distance-Based Volume

```tsx
useFrame((_, delta) => {
  const distance = camera.position.distanceTo(zone.position);
  const targetVolume = distance < zone.radius
    ? zone.maxVolume * (1 - distance / zone.radius)
    : 0;
  easing.damp(vol, 'current', targetVolume, 0.5, delta);
  audioRef.current?.setVolume(vol.current);
});
```

---

## 15. Zustand v5 Store Architecture

### Key v5 Changes from v4

- `create` no longer requires currying for TypeScript (`create<T>()(...)` still works but `create<T>(...)` is now valid)
- `useShallow` replaces `shallow` as the recommended equality function for selectors
- Middleware ordering matters: `subscribeWithSelector > devtools > persist > immer`
- `getState()` pattern for 60fps reads remains the core R3F integration pattern

### Single Store with Slices (Recommended)

**Decision: Single bounded store with typed slices**, NOT multiple stores. Pillars have cross-cutting state dependencies that make multiple stores painful.

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export const useDendroviaStore = create<DendroviaStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        immer((...args) => ({
          ...createCameraSlice(...args),
          ...createPlayerSlice(...args),
          ...createQuestSlice(...args),
          ...createGameStateSlice(...args),
          ...createRenderSlice(...args),
        })),
        persistConfig
      ),
      { name: 'DendroviaStore' }
    )
  )
);
```

### Three-Tier State Performance Strategy

| Tier | Update Frequency | Access Pattern | Example |
|------|-----------------|----------------|---------|
| **Hot** | Every frame (60fps) | `getState()` in `useFrame` | Player position, camera target, velocities |
| **Warm** | On events | `useShallow` selectors | Active quest, health, mana, combat state |
| **Cold** | Rarely | Simple selectors | Game phase, settings, character class |

```tsx
// HOT: Never use React selectors for 60fps state
useFrame(() => {
  const { playerPosition } = useDendroviaStore.getState();
  meshRef.current.position.set(...playerPosition);
  useDendroviaStore.setState({ playerPosition: newPos }); // No re-render
});

// WARM: useShallow prevents re-render on reference changes
const { health, mana } = useDendroviaStore(
  useShallow((s) => ({ health: s.character?.health, mana: s.character?.mana }))
);

// COLD: Simple selector, re-renders are fine (rare changes)
const gamePhase = useDendroviaStore((s) => s.gamePhase);
```

**Decision rule:** If more than one component needs the value → Zustand. If only one component reads it → `useRef`.

---

## 16. EventBus Bridge Pattern

### Bidirectional Bridge with Circular-Update Prevention

```typescript
let _bridgeEmitting = false;
let _bridgeReceiving = false;

export function initEventBusBridge(debug = false) {
  const eventBus = getEventBus(debug);
  const store = useDendroviaStore;
  const unsubs: Array<() => void> = [];

  // OUTBOUND: Store → EventBus (throttled for position)
  let lastEmitTime = 0;
  const THROTTLE_MS = 100; // 10 updates/sec to EventBus

  unsubs.push(
    store.subscribe(
      (s) => s.playerPosition,
      (position) => {
        if (_bridgeReceiving) return;
        if (Date.now() - lastEmitTime < THROTTLE_MS) return;
        lastEmitTime = Date.now();
        _bridgeEmitting = true;
        eventBus.emit(GameEvents.PLAYER_MOVED, { position, ... });
        _bridgeEmitting = false;
      }
    )
  );

  // INBOUND: EventBus → Store
  unsubs.push(
    eventBus.on(GameEvents.ENCOUNTER_TRIGGERED, (data) => {
      if (_bridgeEmitting) return;
      _bridgeReceiving = true;
      store.getState().startCombat(data);
      _bridgeReceiving = false;
    })
  );

  return () => unsubs.forEach((u) => u());
}
```

**Key design decisions:**
- Position events throttled to 10/sec (not 60) for inter-pillar communication
- Flag-based circular prevention (store→eventBus→store loop blocked)
- `subscribeWithSelector` enables granular field-level subscriptions

---

## 17. Game State Machine

### Pure Zustand FSM (Recommended)

```typescript
const TRANSITIONS = {
  loading: { LOADED: { target: 'menu' } },
  menu: { START_GAME: { target: 'playing' } },
  playing: {
    PAUSE: { target: 'paused' },
    ENTER_COMBAT: { target: 'combat', guard: (s) => s.activeBugs.length > 0 },
  },
  paused: { RESUME: { target: 'playing' }, QUIT: { target: 'menu' } },
  combat: { VICTORY: { target: 'playing' }, DEFEAT: { target: 'cutscene' } },
  cutscene: { CUTSCENE_END: { target: 'playing' } },
};

send: (event) => {
  const transition = TRANSITIONS[get().gamePhase]?.[event];
  if (!transition) return;
  if (transition.guard && !transition.guard(get())) return;
  transition.onExit?.(set, get);
  set((s) => { s.gamePhase = transition.target; });
  transition.onEnter?.(set, get);
}
```

**Decision: Pure Zustand FSM, not XState.** Sufficient for menu/playing/paused/combat/cutscene states. XState adds unnecessary complexity unless hierarchical states are needed later.

---

## 18. Persistence and Serialization

### Stack: SuperJSON + IndexedDB + Partialize

```typescript
import superjson from 'superjson';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

const persistConfig = {
  name: 'dendrovia-save',
  storage: createJSONStorage(() => ({
    getItem: async (name) => await idbGet(name) ?? null,
    setItem: async (name, value) => await idbSet(name, value),
    removeItem: async (name) => await idbDel(name),
  }), { replacer: superjson.serialize, reviver: superjson.deserialize }),
  partialize: (state) => ({
    character: state.character,
    quests: state.quests,
    visitedNodes: state.visitedNodes,
    currentBranchId: state.currentBranchId,
    gamePhase: state.gamePhase,
  }),
  version: 1,
};
```

**Why SuperJSON:** Handles `Set`, `Map`, and `Date` types that exist in our shared type definitions.
**Why IndexedDB:** Larger storage quota than localStorage for game saves.
**Why partialize:** Only persist game-critical state, not transient rendering state (positions, velocities).

### DevTools

- `devtools` middleware provides Redux DevTools integration
- Filter noisy 60fps updates with `actionsDenylist: ['setPlayerPosition', 'setCameraTarget']`
- `zundo` library available for undo/redo time-travel

**Sources:**
- https://zustand.docs.pmnd.rs/migrations/migrating-to-v5
- https://zustand.docs.pmnd.rs/guides/slices-pattern
- https://zustand.docs.pmnd.rs/integrations/persisting-store-data
- https://zustand.docs.pmnd.rs/middlewares/subscribe-with-selector
- https://tkdodo.eu/blog/working-with-zustand
- https://github.com/pmndrs/react-three-fiber/issues/126

---

## 19. Input Handling

### Unified Input Action Mapping

```typescript
type InputState = {
  moveX: number;  moveY: number;   // -1 to 1
  cameraX: number; cameraY: number; // -1 to 1
  interact: boolean; toggleMode: boolean; jump: boolean;
};

function resolveInput(keyboard, gamepad): InputState {
  return {
    moveX: keyboard.left ? -1 : keyboard.right ? 1 : gamepad.leftStick.x,
    moveY: keyboard.forward ? -1 : keyboard.backward ? 1 : gamepad.leftStick.y,
    cameraX: gamepad.rightStick.x,
    cameraY: gamepad.rightStick.y,
    interact: keyboard.interact || gamepad.buttons[0],
    toggleMode: keyboard.tab || gamepad.buttons[3],
    jump: keyboard.space || gamepad.buttons[1],
  };
}
```

### Keyboard via Drei KeyboardControls

```tsx
<KeyboardControls map={[
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
]}>
  <Canvas>...</Canvas>
</KeyboardControls>
```

### Gamepad via Zustand Polling

```tsx
function GamepadPoller() {
  useFrame(() => {
    const gp = navigator.getGamepads()[0];
    if (!gp) return;
    useGamepadStore.setState({
      leftStick: { x: gp.axes[0], y: gp.axes[1] },
      rightStick: { x: gp.axes[2], y: gp.axes[3] },
      buttons: gp.buttons.map(b => b.pressed),
    });
  });
  return null;
}
```

### Mobile Touch

Set `touch-action: none` on canvas CSS. OrbitControls/CameraControls already support pinch-to-zoom, two-finger rotate, single-finger pan.

**Sources:**
- https://drei.docs.pmnd.rs/controls/keyboard-controls
- https://github.com/pmndrs/ecctrl

---

## 20. Key Data Structures

### Branch Representation

```typescript
interface Branch {
  id: string;
  parentId: string | null;
  childIds: string[];
  curve: CatmullRomCurve3;
  radius: number;
  length: number;
  frames: TransportFrame[]; // precomputed parallel transport

  getPoint(s: number, theta: number): Vector3;
  getFrame(s: number, theta: number): SurfaceFrame;
  getSDF(point: Vector3): number;
}

interface TransportFrame {
  position: Vector3;
  tangent: Vector3;   // T — along branch
  normal: Vector3;    // U — first perpendicular
  binormal: Vector3;  // V — second perpendicular
}

interface PlayerState {
  branchId: string;
  s: number;
  theta: number;
  surfaceVelocity: Vector2; // (ds/dt, dθ/dt)
  worldPosition: Vector3;
  worldVelocity: Vector3;
  previousWorldPosition: Vector3; // for Verlet
  mode: 'grounded' | 'airborne' | 'transitioning';
  transitionProgress: number;
}
```

---

## 21. Recommended Dependencies to Add

Based on T3 research, add to `packages/architectus/package.json`:

```json
{
  "dependencies": {
    "maath": "^0.10.0",
    "camera-controls": "^3.1.0",
    "@react-spring/three": "^9.7.0",
    "wawa-vfx": "^0.3.0",
    "superjson": "^2.2.0",
    "idb-keyval": "^6.2.0"
  }
}
```

Note: `camera-controls` is bundled in drei but explicit install gives TypeScript types. GSAP optional — add only if complex timeline choreography is needed.

---

## 22. Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Camera math frame | **Parallel Transport** over Frenet-Serret | Handles straight segments and inflection points without discontinuities |
| Physics engine | **Custom** (no Rapier/Cannon) | Traditional engines fight surface-constrained movement at every step |
| Physics integration | **Verlet** for airborne, **Euler** for grounded | Verlet conserves energy better; grounded is 2 DOF (trivial) |
| Fixed timestep | **60 Hz** with render interpolation | Frame-rate independent physics |
| Store architecture | **Single Zustand store with slices** | Cross-cutting state dependencies between pillars |
| 60fps state reads | **`getState()` in `useFrame()`** | Zero React re-renders for hot state |
| EventBus bridge | **Flag-based circular prevention** + 10/sec throttle | Prevents infinite loops, reduces inter-pillar chatter |
| Game FSM | **Pure Zustand** guard table | No XState dependency; sufficient for current state count |
| Camera library | **camera-controls** (Falcon) + **custom** (Player) | camera-controls for orbital + transitions; custom for surface-locked |
| Camera smoothing | **maath/easing** (`damp3`, `dampE`) | Frame-rate independent, critically-damped spring behavior |
| Mode transition | **camera-controls.setLookAt()** with animated handoff | Built-in smooth transition, then disable for custom controller |
| Gimbal lock | **Quaternion SLERP** always | Never store orientations as Euler angles |
| Junction selection | **Automatic** (movement direction) + **visual indicators** | Natural feel, no explicit UI required |
| Instancing | **Raw `<instancedMesh>`** for branches, **InstancedMesh2** for interactive nodes | Performance (10k+ branches) vs features (BVH raycasting) |
| Particle system | **Custom instanced pool** + **wawa-vfx** for declarative effects | Control for core effects, convenience for decorative ones |
| Post-processing | **`@react-three/postprocessing`** (WebGL) → **TSL PostProcessing** (WebGPU) | Must migrate when switching renderer |
| Persistence | **SuperJSON + IndexedDB** with partialize | Handles Set/Map/Date; large save capacity |
| Serialization | **`[number, number, number]` tuples** for positions | Already used in shared types; Zustand-serializable |
| Smoothing formula | `current + (target - current) * (1 - Math.exp(-speed * delta))` | Universal frame-rate independent interpolation |
| Camera up-vector | **Smooth SLERP** over 0.3s independently | Prevents camera nausea; position can snap but up must interpolate |
