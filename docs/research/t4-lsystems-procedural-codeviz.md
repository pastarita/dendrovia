# Tranche 4: L-Systems, Procedural Trees, and 3D Code Visualization

**Date:** February 13, 2026
**Pillar:** ARCHITECTUS (The Renderer)
**Purpose:** Ground truth for Steps 16-20 of the 25-step implementation plan

---

## 1. L-System Fundamentals

### 1.1 L-System Classification

| Type | Description | Use for Dendrovia |
|------|-------------|-------------------|
| **D0L (Deterministic, Context-Free)** | Single rule per symbol, no neighbor context | Basic skeleton generation |
| **Stochastic L-System** | Multiple rules per symbol with probabilities | Organic variation per-branch |
| **Parametric L-System** | Symbols carry numeric parameters, rules include conditions | Data-driven tree geometry |
| **Context-Sensitive (1L/2L)** | Rules depend on left/right neighbors | Neighbor-aware growth patterns |

**Dendrovia uses Parametric + Stochastic**: production rules carry code metrics as parameters (complexity, churn, LOC), with stochastic variation seeded by file hashes for organic feel.

### 1.2 Formal Definition

A parametric L-system is a tuple G = (V, Σ, ω, P) where:
- **V** = alphabet of symbols (F, +, -, [, ], etc.)
- **Σ** = set of formal parameters (length, radius, angle)
- **ω** = axiom (starting string)
- **P** = production rules with conditions

Context-sensitive production format:
```
label : left_context < strict_predecessor > right_context : condition → successor
```

Example: `A(x) < B(y) > C(z) : x + y + z > 10 → E((x+y)/2) F((y+z)/2)`

### 1.3 Standard Turtle Symbols

| Symbol | Action |
|--------|--------|
| `F(len)` | Move forward, draw segment of length `len` |
| `f(len)` | Move forward without drawing |
| `+(angle)` | Yaw left (rotate around up axis) |
| `-(angle)` | Yaw right |
| `^(angle)` | Pitch up |
| `&(angle)` | Pitch down |
| `\\(angle)` | Roll left |
| `/(angle)` | Roll right |
| `[` | Push turtle state to stack |
| `]` | Pop turtle state from stack |
| `!(radius)` | Set branch radius |
| `'(color)` | Set branch color/material |

### 1.4 3D Turtle State

```typescript
interface TurtleState {
  position: THREE.Vector3;
  orientation: THREE.Quaternion;  // Always quaternion, never Euler
  radius: number;
  color: THREE.Color;
  depth: number;
  metadata?: {
    filePath: string;
    complexity: number;
    churnRate: number;
  };
}
```

Quaternion-based orientation avoids gimbal lock and provides smooth interpolation (SLERP) for branch curves. Each rotation symbol applies a quaternion multiplication:

```typescript
// Yaw left by angle
const yawQ = new THREE.Quaternion().setFromAxisAngle(UP, angle);
turtle.orientation.multiply(yawQ);

// Pitch up by angle
const pitchQ = new THREE.Quaternion().setFromAxisAngle(RIGHT, angle);
turtle.orientation.multiply(pitchQ);
```

### 1.5 JavaScript L-System Libraries

| Library | Stars | Last Update | API | Verdict |
|---------|-------|-------------|-----|---------|
| `lindenmayer` (npm) | ~250 | 2024 | Clean, parametric support | **Recommended** |
| `L3D` (abiusx) | ~50 | 2021 | 3D trees from simple rules | Reference only |
| Custom (~200 LOC) | N/A | N/A | Full control | Fallback option |

**`lindenmayer`** supports parametric production rules, stochastic rules, context-sensitive rules, and custom final/classic modes. Install: `bun add lindenmayer`.

For maximum control, a custom interpreter is ~200 lines:

```typescript
class LSystem {
  axiom: string;
  rules: Map<string, (params: number[]) => string>;
  iterations: number;

  generate(): string {
    let current = this.axiom;
    for (let i = 0; i < this.iterations; i++) {
      current = this.applyRules(current);
    }
    return current;
  }

  interpret(result: string): TurtleState[] {
    const segments: TurtleState[] = [];
    const stack: TurtleState[] = [];
    let turtle = initialState();

    for (const { symbol, params } of parse(result)) {
      switch (symbol) {
        case 'F': segments.push(moveForward(turtle, params[0])); break;
        case '+': yaw(turtle, params[0]); break;
        case '-': yaw(turtle, -params[0]); break;
        case '[': stack.push(cloneTurtle(turtle)); break;
        case ']': turtle = stack.pop()!; break;
        case '!': turtle.radius = params[0]; break;
      }
    }
    return segments;
  }
}
```

**Sources:**
- https://en.wikipedia.org/wiki/L-system
- https://algorithmicbotany.org/papers/abop/abop-ch1.pdf
- https://gpfault.net/posts/generating-trees.txt.html
- https://jsantell.com/l-systems/
- https://github.com/nylki/lindenmayer

---

## 2. Data-Driven L-System Rules

### 2.1 Mapping Code Topology to L-System Parameters

The core challenge: deriving production rules FROM `CodeTopology` data.

```typescript
function topologyToLSystem(topology: CodeTopology): LSystemRule {
  const root = topology.tree;
  const maxDepth = computeMaxDepth(root);

  return {
    axiom: `T(${root.children?.length || 0}, ${maxDepth}, 1.0)`,
    rules: {
      // T(children, depth, scale) = Trunk/directory node
      'T': `F(depth * 2 * scale) !(scale * 0.5) ${generateBranchingRule(root)}`,
    },
    iterations: Math.min(maxDepth, 8),  // Cap at 8 to prevent explosion
    angle: 25 + (topology.hotspots.length * 2),  // More hotspots = more spread
  };
}

function generateBranchingRule(node: FileTreeNode): string {
  if (!node.children || node.children.length === 0) return 'L'; // Leaf

  const n = node.children.length;
  const angleStep = 360 / n;

  return node.children.map((child, i) => {
    const weight = subtreeWeight(child);
    const angle = angleStep * i + (i * 137.508); // Golden angle offset
    const length = child.type === 'directory' ? weight * 0.5 : 1.0;
    const radius = child.type === 'directory' ? Math.sqrt(weight) * 0.1 : 0.05;

    return `[+(${angle}) ^(${25 + Math.random() * 10}) !(${radius}) F(${length}) ${
      child.type === 'directory' ? `T(${child.children?.length || 0})` : 'L'
    }]`;
  }).join(' ');
}
```

### 2.2 Metric-to-Parameter Mappings

| Code Metric | L-System Parameter | Visual Effect |
|-------------|-------------------|---------------|
| Directory depth | Iteration count | Tree height/complexity |
| Children count | Branching factor (angle distribution) | Branch spread |
| File complexity | Branch length | Longer = more complex |
| Aggregate LOC | Branch radius (pipe model) | Thicker = more code |
| Churn rate | Stochastic rule probability | Organic variation |
| Bug density | Color parameter | Red glow |
| File age | Texture parameter | Patina/weathering |

### 2.3 Deterministic Seeding

Following the No Man's Sky approach of hierarchical deterministic seeds:

```typescript
// Repository hash -> master seed
const masterSeed = hashToSeed(topology.repository);

// Directory path -> branch seed (ensures same dir = same branch shape)
const branchSeed = hashToSeed(masterSeed + directoryPath);

// File hash -> leaf/detail seed
const detailSeed = hashToSeed(branchSeed + file.hash);

// Mulberry32 PRNG (fast, deterministic, 32-bit)
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
```

**Impact:** Change a file → its branch seed changes → only that branch re-generates. All other branches stay identical.

**Sources:**
- https://www.generationamiga.com/2026/01/27/inside-no-mans-sky-the-algorithms-that-power-18-quintillion-planets/
- https://algorithmicbotany.org/papers/abop/abop-ch1.pdf

---

## 3. Space Colonization Algorithm

### 3.1 Overview

Space colonization (Runions et al., 2007) is an **alternative to L-Systems** for tree generation that produces more natural-looking trees by simulating resource-seeking growth.

**Core components:**
1. **Attraction points**: Scattered in space representing "resources"
2. **Tree nodes**: Growth tips that move toward attractors
3. **Growth rules**: Each iteration, nodes grow toward nearby attractors; attractors consumed when reached

### 3.2 Algorithm

```
1. SCATTER attraction points in crown volume
2. PLACE root node at base
3. REPEAT until no more growth:
   a. ASSOCIATE each attractor with its nearest node within attraction_distance
   b. For each node with associated attractors:
      - COMPUTE average direction toward all attractors
      - CREATE new node at: parent + direction * segment_length
   c. REMOVE any attractor within kill_distance of any node
4. APPLY pipe model for radius tapering
```

### 3.3 Data-Driven Space Colonization for Dendrovia

Instead of random attractors, place them based on file positions:

```typescript
function placeAttractorsFromTopology(
  node: FileTreeNode,
  center: THREE.Vector3,
  depth: number = 0
): Attractor[] {
  const attractors: Attractor[] = [];

  if (node.type === 'file' && node.metadata) {
    const seed = hashToSeed(node.metadata.hash);
    const rng = mulberry32(seed);
    const theta = rng() * Math.PI * 2;
    const phi = rng() * Math.PI;
    const r = 3 + depth * 2 + rng() * 3;

    attractors.push({
      position: new THREE.Vector3(
        center.x + r * Math.sin(phi) * Math.cos(theta),
        center.y + r * Math.cos(phi),
        center.z + r * Math.sin(phi) * Math.sin(theta)
      ),
      file: node.metadata,
      alive: true
    });
  }

  if (node.children) {
    const goldenAngle = 137.508 * (Math.PI / 180);
    node.children.forEach((child, i) => {
      const angle = goldenAngle * i;
      const childCenter = center.clone().add(
        new THREE.Vector3(
          Math.cos(angle) * (4 + depth),
          2,
          Math.sin(angle) * (4 + depth)
        )
      );
      attractors.push(...placeAttractorsFromTopology(child, childCenter, depth + 1));
    });
  }

  return attractors;
}
```

### 3.4 L-Systems vs Space Colonization

| Criterion | L-Systems | Space Colonization |
|-----------|-----------|-------------------|
| Natural appearance | Repetitive without stochastic rules | Naturally varied |
| Data-driven | Rules encode structure | Attractor placement encodes data |
| Performance | O(n) string rewriting | O(n*m) per iteration (use kd-tree) |
| Control | High (explicit rules) | Medium (emergent) |
| Best for | Regular hierarchical patterns | Organic space-filling forms |

**Decision: Hybrid approach.** L-system rules define macro structure (directory hierarchy = trunk and main branches). Space colonization fills in micro-detail (files as attraction points create organic sub-branching).

### 3.5 Performance

For 10K+ files, spatial indexing is essential:
- **kdbush** (npm): Fast kd-tree for 2D/3D nearest-neighbor queries
- O(n log n) build, O(sqrt(n)) per query
- Generation time: <100ms for 5K files on M1 MacBook

**Sources:**
- https://algorithmicbotany.org/papers/colonization.egwnp2007.large.pdf
- https://github.com/nicknikolov/pex-space-colonization
- https://thecodingtrain.com/tracks/algorithmic-botany/17-fractal-trees-space-colonization/

---

## 4. The Pipe Model and Branch Geometry

### 4.1 Leonardo da Vinci's Rule

The cross-sectional area of a parent branch equals the sum of its children's cross-sectional areas:

```
π * r_parent² = Σ(π * r_child²)
r_parent = √(Σ r_child²)
```

In Dendrovia, this means: **A directory's branch radius is the square root of the sum of squares of its children's radii.** A directory containing 4 files each of radius 0.1 would have radius √(4 * 0.01) = 0.2.

### 4.2 Generalized Pipe Model for Code

```typescript
function computeBranchRadius(node: FileTreeNode): number {
  if (node.type === 'file') {
    // Leaf radius proportional to file complexity
    const complexity = node.metadata?.complexity || 1;
    return 0.05 + Math.log2(1 + complexity) * 0.02;
  }

  // Directory: sum of children's cross-sections
  const childRadii = (node.children || []).map(c => computeBranchRadius(c));
  const sumArea = childRadii.reduce((sum, r) => sum + r * r, 0);
  return Math.sqrt(sumArea);
}
```

### 4.3 Branch Geometry Generation

Two strategies for converting turtle segments to 3D geometry:

**Strategy A: Merged CylinderGeometry (single draw call)**
```typescript
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

function buildTreeMesh(segments: TurtleSegment[]): THREE.Mesh {
  const geometries = segments.map(seg => {
    const geo = new THREE.CylinderGeometry(
      seg.radiusTop, seg.radiusBottom, seg.length, 8
    );
    // Apply position/rotation from turtle state
    geo.applyMatrix4(seg.matrix);
    return geo;
  });

  const merged = mergeGeometries(geometries);
  return new THREE.Mesh(merged, branchMaterial);
}
```
- Pro: Single draw call
- Con: More GPU memory (each segment stored individually)

**Strategy B: InstancedMesh (for identical segments)**
```typescript
const branchGeo = new THREE.CylinderGeometry(1, 1, 1, 8); // Unit cylinder
const branchMesh = new THREE.InstancedMesh(branchGeo, material, segmentCount);

segments.forEach((seg, i) => {
  const matrix = new THREE.Matrix4();
  matrix.compose(seg.position, seg.quaternion, new THREE.Vector3(seg.radius, seg.length, seg.radius));
  branchMesh.setMatrixAt(i, matrix);
});
```
- Pro: Memory efficient
- Con: All segments share geometry (can't taper within a segment)

**Strategy C: Custom BufferGeometry with spline extrusion**
```typescript
const curve = new THREE.CatmullRomCurve3(branchPoints);
const geometry = new THREE.TubeGeometry(curve, 20, radiusFunction, 8, false);
```
- Pro: Smooth, organic curves
- Con: Higher vertex count

**Decision:** Use Strategy C (TubeGeometry) for near branches (Player Mode), Strategy B (InstancedMesh) for medium distance, Strategy A (merged) or SDF for far distance.

### 4.4 EZ-Tree (Three.js Reference Implementation)

The Codrops "Fractals to Forests" tutorial (January 2025) documents EZ-Tree, a Three.js tree generator:
- Recursive fractal branching with configurable parameters
- Bark texture via triplanar mapping
- Leaf billboards with wind animation
- Single merged geometry for performance

**Sources:**
- https://tympanus.net/codrops/2025/01/27/fractals-to-forests-creating-realistic-3d-trees-with-three-js/
- https://jobtalle.com/lindenmayer_systems.html
- https://gpfault.net/posts/generating-trees.txt.html

---

## 5. Procedural Noise and Material Generation

### 5.1 TSL Noise Functions

Three.js Shading Language (TSL) provides built-in noise via MaterialX nodes:

```typescript
import { mx_noise_float, mx_noise_vec3, mx_fractal_noise_float } from 'three/tsl';

// Simplex noise in TSL
const noise = mx_noise_float(positionLocal.mul(frequency));

// FBM (Fractional Brownian Motion) - multiple octaves
const fbm = mx_fractal_noise_float(
  positionLocal.mul(scale),
  octaves,    // int: number of layers (4-6 typical)
  lacunarity, // float: frequency multiplier per octave (2.0)
  diminish    // float: amplitude decay per octave (0.5)
);
```

### 5.2 Domain Warping for Organic Surfaces

Domain warping creates organic, flowing patterns by feeding noise into itself:

```typescript
const domainWarped = Fn(() => {
  const p = positionLocal.mul(scale);

  // First warp: offset sample position by noise
  const warp1 = mx_noise_vec3(p.mul(warpScale1));
  const warped = p.add(warp1.mul(warpStrength));

  // Second warp: feed warped position back into noise
  const warp2 = mx_noise_vec3(warped.mul(warpScale2).add(time.mul(0.1)));
  const doubleWarped = warped.add(warp2.mul(warpStrength.mul(0.5)));

  return mx_fractal_noise_float(doubleWarped, 4, float(2.0), float(0.5));
});
```

### 5.3 Procedural Tron/Digital Aesthetic

For Dendrovia's "Tron" aesthetic — edge glow and flowing light:

```typescript
const edgeGlow = Fn(() => {
  const t = time;

  // UV-based flow along branch axis
  const flow = fract(uv().y.sub(t.mul(flowSpeed)));
  const band = smoothstep(float(0.0), float(0.1), flow)
    .mul(smoothstep(float(0.2), float(0.1), flow));

  // Fresnel edge detection
  const viewDir = normalize(cameraPosition.sub(positionLocal));
  const fresnel = float(1.0).sub(abs(dot(normalLocal, viewDir)));
  const edgeFactor = smoothstep(float(0.3), float(0.8), fresnel);

  // Combine: edge glow + flowing light band
  const intensity = edgeFactor.mul(0.5).add(band.mul(0.8));
  return glowColor.mul(intensity);
});

// Apply to material
const branchMaterial = new MeshStandardNodeMaterial();
branchMaterial.emissiveNode = edgeGlow();
```

### 5.4 Procedural Palette from Code Metrics

Using OKHSL color space (perceptually uniform) for procedural palette generation:

```typescript
function generatePalette(topology: CodeTopology): ProceduralPalette {
  const avgComplexity = topology.files.reduce((s, f) => s + f.complexity, 0) / topology.files.length;
  const bugRatio = topology.commits.filter(c => c.isBugFix).length / topology.commits.length;

  const mood: 'warm' | 'cool' | 'neutral' =
    avgComplexity > 20 ? 'warm' :
    bugRatio > 0.3 ? 'warm' :
    avgComplexity < 5 ? 'cool' :
    'neutral';

  const baseHue = mood === 'warm' ? 15 : mood === 'cool' ? 200 : 160;

  return {
    primary:    okhslToHex(baseHue, 0.7, 0.5),
    secondary:  okhslToHex((baseHue + 30) % 360, 0.5, 0.4),
    accent:     okhslToHex((baseHue + 180) % 360, 0.9, 0.6),
    background: okhslToHex(baseHue, 0.1, 0.05),
    glow:       okhslToHex((baseHue + 180) % 360, 1.0, 0.8),
    mood
  };
}
```

**Sources:**
- https://threejsroadmap.com/blog/10-noise-functions-for-threejs-tsl-shaders
- https://iquilezles.org/articles/warp/
- https://thebookofshaders.com/13/
- https://bottosson.github.io/posts/oklab/
- https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/

---

## 6. Tree Layout Algorithms

### 6.1 Algorithm Comparison

| Algorithm | Dimensions | Occlusion | Scalability | Organic Feel | Best For |
|-----------|-----------|-----------|-------------|-------------|----------|
| Reingold-Tilford | 2D (extendable to 3D) | High in 3D | 10K+ nodes | Low | Tidy tree diagrams |
| Radial Tree | 2D/3D | Medium | 5K nodes | Medium | Overview mode |
| Cone Tree | 3D | High at depth | 1K nodes | Low | Small hierarchies |
| Balloon Layout | 3D | Low (spheres) | 3K nodes | Medium | Isolated subtrees |
| Hyperbolic Tree | 2D/3D | Low (fisheye) | 100K+ nodes | Low | Focus+context |
| **Botanical Tree** | 3D | Low (organic) | 5K nodes | **High** | **Dendrovia** |

**Decision: Botanical Tree Layout.** L-system + space colonization produces the organic 3D tree structure Dendrovia needs. Other algorithms are useful for the Falcon Mode minimap (radial/sunburst overlay) but not the main 3D world.

### 6.2 Phyllotaxis (Golden Angle) for Branch Distribution

When a directory has N children, distribute branches using the golden angle (137.508 degrees) to prevent bunching:

```typescript
function distributeBranches(childCount: number): number[] {
  const goldenAngle = 137.508 * (Math.PI / 180);
  return Array.from({ length: childCount }, (_, i) => goldenAngle * i);
}
```

This produces an even, non-overlapping spiral distribution regardless of child count — the same pattern seen in sunflower seeds, pine cones, and leaf arrangements.

### 6.3 Collision Avoidance

For preventing branch-branch intersections:

1. **Phyllotaxis angular distribution** (primary defense — golden angle)
2. **Pitch variation by depth** (deeper branches pitch more steeply)
3. **Post-generation octree check** with displacement correction
4. **Space colonization kill distance** (natural collision avoidance)

```typescript
// Octree-based collision check
const octree = new Octree(worldBounds);
for (const segment of treeSegments) {
  const colliders = octree.query(segment.boundingSphere);
  if (colliders.length > 0) {
    // Displace segment away from collision
    const avgCollisionDir = computeAverageDirection(segment, colliders);
    segment.position.addScaledVector(avgCollisionDir, 0.5);
  }
  octree.insert(segment);
}
```

### 6.4 Dynamic Layout Updates

When a file is added/removed:
1. **Incremental update**: Only regenerate the affected branch subtree
2. **Animate transition**: Spring-based interpolation between old and new positions
3. **Deterministic seeding ensures stability**: Unchanged branches keep identical geometry

Performance for 10K+ nodes: L-system string generation is O(n), turtle interpretation is O(n), space colonization with kd-tree is O(n log n). Total generation: <200ms for 10K files.

**Sources:**
- https://en.wikipedia.org/wiki/Phyllotaxis
- https://github.com/vasturiano/3d-force-graph
- https://graphics.uni-konstanz.de/publikationen/Balzer2005VoronoiTreemapsVisualization/

---

## 7. Spatial Encoding of Code Metrics

### 7.1 Visual Channel Assignments

Based on information visualization best practices (Bertin's visual variables) and surveyed prior art:

| Visual Channel | Mapped Metric | Justification |
|----------------|---------------|---------------|
| **Branch radius** | Aggregate LOC (pipe model) | Area perception = quantity |
| **Branch length** | File count in subtree | Distance = scale |
| **Branch color hue** | Primary language | Categorical distinction |
| **Branch color saturation** | Code health (test coverage) | Intensity = quality |
| **Branch color temperature** | Age (warm=new, cool=old) | Convention from GitLens |
| **Glow intensity** | Churn rate (recent activity) | Attention = activity |
| **Bark texture** | Complexity (smooth=simple, gnarled=complex) | Roughness = difficulty |
| **Leaf count** | File count | Density = content |
| **Leaf size** | File LOC | Volume = size |
| **Particle emission** | Bug density | Motion = danger |

### 7.2 The "3-4 Channel" Rule

From cognitive science research: **never map more than 3-4 metrics simultaneously.** Beyond this, users experience information overload. Solution: user-configurable metric layers that can be toggled.

Default view: radius (LOC) + color (language) + glow (activity) = 3 channels.
Debug view: swap glow to bug density, add texture for complexity = 4 channels.

**Sources:**
- https://www.interaction-design.org/literature/article/visual-mapping-the-elements-of-information-visualization
- https://www.ndepend.com/docs/treemap-visualization-of-code-metrics

---

## 8. Code Visualization Prior Art

### 8.1 City Metaphor (CodeCity Family)

| Tool | Platform | Technology | Status |
|------|----------|-----------|--------|
| **CodeCity** (Wettel) | Desktop | SmallTalk, Moose | Academic reference |
| **JSCity** | Web | Three.js | Open source, maintained |
| **PHPCity** | Web | Three.js + TypeScript | Open source |
| **CoderCity** | Web | Three.js | Code ownership focus |
| **City Blocks** | Web | Three.js | Git churn visualization |
| **SecCityVR** | VR (Unity) | C# | Security vulnerabilities (2025) |

**CodeCity mapping:** Classes = buildings (height=LOC, footprint=methods), packages = districts. Controlled experiments (ICSE) showed 15% faster task completion vs. table-based views.

**Lessons for Dendrovia:**
- City metaphor works but creates occlusion problems at scale
- Tree metaphor (Dendrovia) avoids occlusion — you can see through branches
- The "building height = LOC" mapping is universally understood

### 8.2 Organic/Tree Metaphor (Closest to Dendrovia)

**Software Forest** (Bacher et al., 2021):
- Classes as individual trees, with branch morphology encoding class properties
- Uses NLP (Doc2Vec) for semantic similarity — similar classes placed near each other
- **Key insight:** Semantic proximity layout makes the visualization useful, not just pretty

**CodeFlower** (fzaninotto):
- Interactive sunburst/radial tree using D3.js
- Files as circles, directories as enclosing circles
- Simple but effective for overview

**CodeForest** (Ritsumei):
- Software metrics visualized as a forest
- Each class = one tree, metrics = tree properties

**UniVis** (2022):
- 3D software visualization using "natural metaphors"
- Plants, animals, and landscape elements represent code structure

### 8.3 Temporal Visualization

**Gource:**
- Radial tree layout animated over git history
- Files "light up" when touched, fade when inactive
- Beautiful but non-interactive, no metrics, desktop-only
- **Borrow:** Light-up-on-activity, fade-on-inactivity

**code_swarm:**
- Particle-based: files fly toward their committing developer
- "Organic software visualization" — deliberately sought living, breathing aesthetic
- **Borrow:** Particle flow along branches toward active nodes

**GitVoyant:**
- "Temporal Code Intelligence" — predicts maintenance burden from git patterns
- Decay forecasting for codebase health
- **Borrow:** Decay prediction models for weathering visual effects

### 8.4 VR/Game-Like Code Exploration

**Primitive (VR):**
- Most mature VR code exploration tool
- 3D call graphs described as "clearer and more memorable" than 2D
- Multi-user collaboration with spatial audio
- **Borrow:** 3D call graph rendering for dependency visualization

**CodeCity VR Study:**
- Controlled study: VR users completed tasks significantly faster with comparable correctness
- Evidence that spatial code visualization benefits from immersion
- **Validates:** Dendrovia's "Player Mode" immersive approach

**IslandViz (DLR):**
- Modules as islands on water, packages as regions, classes as buildings
- VR + HoloLens versions
- **Borrow:** "Water" (empty space) between loosely-coupled subsystems

### 8.5 Modern Web Tools

**repo-visualizer** (GitHub Next): Circle packing with D3.js. Simple but effective.
**GitDiagram** (2025-2026): AI-generated architecture diagrams from repo URL. Uses LLM interpretation.
**CodeSee**: Commercial platform for automated codebase mapping.
**Sourcegraph**: Time-series code analytics at scale.

### 8.6 What Dendrovia Does That Nobody Else Does

1. **Continuous organic structure**: Others use discrete objects (buildings, islands). Dendrovia uses a single dendrite where branching IS the hierarchy.
2. **SDF rendering**: No other code viz tool uses SDF raymarching.
3. **Game mechanics on code**: RPG encounters + spatial code exploration is unique.
4. **Dual camera modes**: Falcon (orbital) to Player (ant-on-manifold) transition is novel.

**Sources:**
- https://wettel.github.io/codecity.html
- https://github.com/aserg-ufmg/JSCity
- https://www.scitepress.org/PublishedPapers/2021/102676/102676.pdf
- https://gource.io/
- https://github.com/rictic/code_swarm
- https://primitive.io/
- https://github.com/DLR-SC/island-viz
- https://github.com/githubocto/repo-visualizer
- https://gitdiagram.com/
- https://arxiv.org/html/2504.18238v1

---

## 9. Three.js Tree Rendering Techniques

### 9.1 Libraries Evaluated

| Library | Status | Features | Verdict |
|---------|--------|----------|---------|
| **EZ-Tree** (Codrops) | 2025 tutorial | Fractal branching, bark texture, wind | Reference implementation |
| **proctree.js** | Unmaintained | Basic procedural trees | Too limited |
| **three-custom-shader-material** | Active | Extend MeshStandard with custom GLSL | Useful for bark shader |
| **Custom (recommended)** | N/A | Full control, TSL integration | **Primary path** |

### 9.2 Performance Budgets

| Metric | Target | Acceptable |
|--------|--------|-----------|
| Draw calls per frame | <100 | <200 |
| Triangles per frame | <2M | <5M |
| Vertices per tree (near) | 10K-50K | 100K |
| Vertices per tree (far) | 0 (SDF) | 1K (billboard) |
| Tree generation time | <100ms | <500ms |

**Golden rule:** Draw call count matters more than triangle count. Modern GPUs render millions of triangles efficiently when batched into few draw calls.

### 9.3 Three-Custom-Shader-Material (CSM)

For extending MeshStandardMaterial with custom bark shaders:

```tsx
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

const barkMaterial = new CustomShaderMaterial({
  baseMaterial: THREE.MeshStandardMaterial,
  vertexShader: `
    varying vec3 vWorldPos;
    void main() {
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      csm_Position = position + normal * noise(position * 2.0) * 0.05;
    }
  `,
  fragmentShader: `
    varying vec3 vWorldPos;
    void main() {
      float pattern = triplanarNoise(vWorldPos, vNormal, 4.0);
      csm_DiffuseColor = vec4(mix(barkColorA, barkColorB, pattern), 1.0);
    }
  `,
  uniforms: { barkColorA: { value: new THREE.Color(0.2, 0.15, 0.1) } }
});
```

**Note:** CSM is WebGL-only. For WebGPU, use TSL `NodeMaterial` with `positionNode` and `colorNode` directly (see Section 5).

### 9.4 Wind Animation

```typescript
const windDisplacement = Fn(() => {
  const height = positionLocal.y;
  const windStrength = uniform(0.5);
  const windFreq = uniform(1.0);

  const sway = sin(time.mul(windFreq).add(positionLocal.x.mul(0.5)))
    .mul(windStrength)
    .mul(height.mul(0.1));  // More sway at top

  return positionLocal.add(vec3(sway, 0, sway.mul(0.3)));
});
```

**Sources:**
- https://tympanus.net/codrops/2025/01/27/fractals-to-forests-creating-realistic-3d-trees-with-three-js/
- https://github.com/FarazzShaikh/THREE-CustomShaderMaterial
- https://threejsroadmap.com/blog/draw-calls-the-silent-killer
- https://github.com/utsuboco/r3f-perf

---

## 10. Wave Function Collapse (Supplementary)

### 10.1 Applicability to Dendrovia

WFC is **moderately applicable** to specific sub-problems:

| Use Case | Applicable? |
|----------|-------------|
| Main tree topology | No (L-systems + space colonization) |
| Branch segment tiles | Yes (straight, curved, fork types) |
| Environment decoration | Yes (moss, crystals, particles) |
| Interior exploration rooms | Yes (if implemented) |

WFC is inherently tile/grid-based, making it unsuitable for continuous organic geometry but useful for discrete decoration placement.

### 10.2 Alternative: Poisson Disk Sampling for Decoration

For placing decorations (bugs, leaves, glowing nodes) along branches:

```typescript
function poissonDiskOnBranch(
  branch: BranchCurve,
  minDistance: number,
  maxAttempts: number = 30
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  // Sample along branch curve, reject if too close to existing points
  for (let t = 0; t < 1; t += 0.01) {
    const candidate = branch.getPointAt(t);
    const tooClose = points.some(p => p.distanceTo(candidate) < minDistance);
    if (!tooClose) points.push(candidate);
  }
  return points;
}
```

**Sources:**
- https://github.com/mxgmn/WaveFunctionCollapse
- https://www.boristhebrave.com/2020/04/13/wave-function-collapse-explained/

---

## 11. GPU Compute for Tree Deformation

### 11.1 Compute Shader Approach (TSL)

For deforming many branch segments simultaneously (wind, player interaction, growth):

```typescript
import { storage, compute, instanceIndex, time } from 'three/tsl';

const positionBuffer = new THREE.StorageBufferAttribute(
  new Float32Array(vertexCount * 3), 3
);

const deformCompute = Fn(() => {
  const idx = instanceIndex;
  const pos = storage(positionBuffer, 'vec3', vertexCount).element(idx);

  // Wind
  const sway = sin(time.mul(windFreq).add(pos.x.mul(0.5)))
    .mul(windStrength).mul(pos.y.mul(0.1));
  pos.x.addAssign(sway);

  // Player proximity repulsion
  const toPlayer = pos.sub(playerPos);
  const dist = length(toPlayer);
  const repulsion = smoothstep(repulsionRadius, float(0.0), dist);
  pos.addAssign(normalize(toPlayer).mul(repulsion.mul(0.5)));
});

// Execute each frame
renderer.computeAsync(deformCompute().compute(vertexCount));
```

### 11.2 Growth Animation

For "code growing" visualization when new commits add branches:

```typescript
const growthProgress = uniform(0.0); // 0 = seed, 1 = full tree

const growthMask = Fn(() => {
  // Each vertex stores its generation order as an attribute
  const generationOrder = attribute('generationOrder');

  // Vertices with order > progress are hidden (scale to 0)
  const visible = step(generationOrder, growthProgress);
  return positionLocal.mul(visible);
});
```

---

## 12. Build-Time vs Runtime Generation

### 12.1 Decision Matrix

| Aspect | Build-Time (IMAGINARIUM) | Runtime (ARCHITECTUS) |
|--------|--------------------------|----------------------|
| L-System rule derivation | Yes (from topology) | No |
| L-System string expansion | Yes (cached as JSON) | No |
| Turtle interpretation → positions | Could be either | **Yes** (needs GPU access) |
| Space colonization | Could be either | **Yes** (interactive tweaking) |
| Noise/material generation | No (GPU-dependent) | **Yes** |
| Geometry construction | No (needs Three.js) | **Yes** |

**Decision:**
1. **IMAGINARIUM** (build-time): Derives L-system rules from topology → outputs `lsystems/{hash}.json`
2. **ARCHITECTUS** (runtime): Expands L-system string → interprets turtle → generates geometry → applies materials

This split aligns with the existing contract: `DendriteConfig.lSystem: LSystemRule` in shared types.

### 12.2 Caching Strategy

```
Build-time output (IMAGINARIUM):
  lsystems/abc123.json = {
    axiom: "T(5, 3, 1.0)",
    rules: { "T": "F(2) !(0.3) [+(137) ^(25) T(3)] [+(274) ^(30) T(2)]" },
    iterations: 5,
    angle: 25
  }

Runtime cache (ARCHITECTUS):
  - Expanded L-system string (memoized by rules hash)
  - Turtle segment positions (memoized by string hash)
  - GPU geometry buffers (persist across frames)
```

---

## 13. Existing Codebase Integration

### 13.1 Current State

The monorepo already has:
- `packages/shared/src/types/index.ts:87-92` — `LSystemRule` interface (axiom, rules, iterations, angle)
- `packages/shared/src/types/index.ts:99-105` — `DendriteConfig` (sdfShader, palette, lSystem, rootPosition, scale)
- `packages/dendrovia-engine/src/world/MurrayTree.tsx` — Placeholder component (cylinder + sphere)
- `packages/imaginarium/README.md` — Lists `generated/lsystems/{hash}.json` as output
- `packages/shared/src/contracts/index.ts` — SDFShaderTemplate with `{{sdf_body}}` placeholders

### 13.2 Interface Contract

IMAGINARIUM outputs → ARCHITECTUS consumes:

```typescript
// Already defined in shared types
interface LSystemRule {
  axiom: string;
  rules: Record<string, string>;
  iterations: number;
  angle: number;
}

// Proposed extension for data-driven parameters
interface DendroviaLSystemRule extends LSystemRule {
  seed: number;                    // Deterministic seeding
  pipeModelExponent: number;       // Da Vinci rule exponent (default 2.0)
  stochasticRules?: Record<string, { rule: string; probability: number }[]>;
  metricBindings: {
    complexity: 'branchLength' | 'branchRadius' | 'glowIntensity';
    churn: 'branchLength' | 'branchRadius' | 'glowIntensity';
    age: 'colorTemperature' | 'textureRoughness';
  };
}
```

---

## 14. Recommended Dependencies

| Package | Purpose | Install |
|---------|---------|---------|
| `lindenmayer` | L-system string generation | `bun add lindenmayer` |
| `kdbush` | Spatial indexing for space colonization | `bun add kdbush` |
| `three-custom-shader-material` | Extend materials (WebGL path) | `bun add three-custom-shader-material` |
| `@react-three/postprocessing` | Bloom for glow effects | `bun add @react-three/postprocessing` |
| `r3f-perf` | Performance monitoring | `bun add r3f-perf` |

No new heavy dependencies. All tree generation is custom code. Noise is via TSL built-ins.

---

## 15. Decision Log

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| L-System type | Parametric + Stochastic | Context-sensitive, D0L | Parametric carries code metrics; stochastic adds organic variation |
| L-System library | `lindenmayer` (npm) | Custom implementation | Good enough API; fallback to custom if needed |
| Tree generation | Hybrid L-System + Space Colonization | Pure L-System, pure space colonization | L-System for macro (directory hierarchy), space colonization for micro (file detail) |
| Branch radius model | Leonardo's rule (pipe model) | Constant radius, linear taper | Produces natural-looking trees from data |
| Branch distribution | Golden angle (phyllotaxis) | Equal spacing, random | Even distribution regardless of child count |
| Noise library | TSL built-in (mx_noise) | lygia, custom WGSL | Zero dependency; TSL compiles to both WGSL and GLSL |
| Color space | OKHSL | HSL, RGB | Perceptually uniform; data-driven palettes look harmonious |
| Seeding strategy | Hierarchical deterministic (NMS style) | Random, global seed | File change only affects its branch; others stable |
| Branch geometry (near) | CatmullRomCurve3 → TubeGeometry | CylinderGeometry, instanced | Smooth organic curves for close viewing |
| Branch geometry (far) | SDF raymarching | Billboard impostor, low-poly mesh | Infinite detail at distance; consistent with hybrid LOD |
| Build-time vs runtime | Rules at build-time, geometry at runtime | All build-time, all runtime | Rules are data-derived (IMAGINARIUM); geometry needs GPU (ARCHITECTUS) |
| Layout algorithm | Botanical (L-system + space colonization) | Reingold-Tilford, cone tree, radial | Only botanical produces the organic 3D tree Dendrovia needs |
| Metric visual channels | Max 3-4 simultaneous | Map everything at once | Cognitive load research: >4 channels causes overload |
| Tron aesthetic | TSL emissiveNode + Bloom | Post-processing only, texture-based | Per-material control; bloom adds screen-space glow |
| Wind animation | TSL vertex displacement | CPU-side, no animation | GPU-efficient; adds life to static scenes |
| Decoration placement | Poisson disk sampling | WFC, random, grid | Even distribution with organic spacing |
| Collision avoidance | Phyllotaxis + octree post-check | No collision check, force-directed | Golden angle prevents most collisions; octree catches remainder |

---

*"The map is not the territory. The code is the soil; the game is the lens; the art is the vibe."*
