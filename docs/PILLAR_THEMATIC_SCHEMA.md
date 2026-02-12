# PILLAR THEMATIC SCHEMA
## Type System for Symbol-Driven Asset Generation

> **Purpose:** Formal specification of thematic identity, design parameters, and prompt construction schemas for each of the six pillars. This document defines the structural DNA that guides all visual asset generation within the **Dendrovian Aesthetic** - a unique visual language born from the intersection of dendritic biology, computational geometry, and the archaeology of living code.

---

## 🌳 THE DENDROVIAN AESTHETIC

### Core Design Philosophy

**Dendrovia** is not a game that looks like other games. It is the **autogamification of codebase archaeology** - a system where software structure becomes navigable 3D space, where git history becomes geological time, where bugs transform into creatures, and where the act of reading code becomes spatial exploration.

### Universal Design Principles

1. **Dendritic Geometry** - All forms follow branching logic. Murray's Law governs proportion (Σ r_children³ = r_parent³). Visual elements split, merge, and flow like neural networks, river deltas, and vascular systems.

2. **Temporal Stratification** - Depth is time. Layers represent history. Visual sediment accumulates. The newest floats on top of ancient foundations.

3. **Impossible Coherence** - Geometric precision meets organic impossibility. Escher-like perspectives where "up" is relative to your current branch. Gravity points toward code structure, not ground.

4. **Living Mathematics** - Everything is procedurally distillable. Art becomes executable. Aesthetics compile into shaders. Beauty is a function with parameters.

5. **Archaeological Reverence** - Treat code as ancient artifact. Every commit is a fossil. Every refactor leaves strata. Contributors are civilization-builders whose works we excavate.

### Cross-Pillar Cohesive Motifs

These elements appear across ALL pillars, creating unity:

- **Branch Motifs** - Dendritic splits, Y-forks, tree-like hierarchies
- **Stratified Depth** - Layered transparency showing temporal history
- **Circular Nodes** - Commit points, decision nodes, focal centers
- **Flowing Paths** - Curved connections following organic growth
- **Geometric Precision** - Mathematical clarity beneath organic flow
- **Embedded Glyphs** - Small symbolic markers carrying semantic meaning
- **Radial Symmetry** - Balance around central axes like cell division
- **Weathered Edges** - Soft aging suggesting time's passage

---

## 🏗️ TYPE DEFINITIONS

### Core Types

```typescript
/**
 * Elemental affinity representing the pillar's fundamental nature
 */
type Element =
  | "Earth"      // Stability, foundation, history
  | "Fire"       // Energy, transformation, action
  | "Water"      // Flow, adaptation, emotion
  | "Air"        // Perception, communication, thought
  | "Aether"     // Transcendence, creativity, spirit
  | "Metal"      // Structure, precision, mechanics
  | "Time"       // Chronology, memory, evolution
  | "Light"      // Illumination, rendering, clarity

/**
 * Archetypal role defining the pillar's narrative function
 */
type Archetype =
  | "The Sage"       // Keeper of wisdom and knowledge
  | "The Alchemist"  // Transformer of matter and concept
  | "The Architect"  // Builder of structures and systems
  | "The Warrior"    // Agent of action and conflict
  | "The Oracle"     // Seer and guide
  | "The Engineer"   // Maintainer of infrastructure

/**
 * Emotional resonance the pillar evokes
 */
type EmotionalTone =
  | "Reverence"      // Respectful awe
  | "Wonder"         // Curious enchantment
  | "Clarity"        // Focused understanding
  | "Excitement"     // Energized anticipation
  | "Awareness"      // Mindful observation
  | "Reliability"    // Steadfast trust

/**
 * Visual weight and prominence
 */
type VisualWeight = "light" | "medium" | "bold" | "heavy"

/**
 * Corner treatment style
 */
type CornerStyle =
  | "sharp_precise"      // Right angles, no rounding
  | "slightly_rounded"   // Subtle radius
  | "friendly_rounded"   // Approachable curves
  | "smooth_organic"     // Flowing natural curves
  | "functional"         // Utilitarian, neither harsh nor soft

/**
 * Texture quality
 */
type TextureQuality =
  | "aged_parchment"     // Organic, historical
  | "iridescent"         // Light-refractive, ethereal
  | "polished_stone"     // Smooth, mathematical
  | "soft_matte"         // Tactile, approachable
  | "translucent"        // See-through layers
  | "brushed_metal"      // Industrial, engineered

/**
 * Geometric primitive preference
 */
type GeometricForm =
  | "circle"             // Wholeness, cycles
  | "square"             // Stability, foundation
  | "triangle"           // Direction, hierarchy
  | "hexagon"            // Efficiency, natural packing
  | "spiral"             // Growth, recursion
  | "cross"              // Intersection, navigation
  | "ellipse"            // Organic viewing
  | "rectangle"          // Organization, structure

/**
 * Expanded color palette with relational tensions
 */
interface ColorPalette {
  // Core Identity Colors
  primary: string;              // Main identity color (hex)
  secondary: string;            // Supporting color
  accent: string;               // Highlight color

  // Depth & Atmosphere
  shadow: string;               // Deep shadow color
  midtone: string;              // Middle value for gradients
  highlight: string;            // Bright highlight

  // Complementary Tensions
  complement: string;           // Color wheel opposite (tension)
  analogous: string[];          // Adjacent colors (harmony) - 2-3 colors

  // Functional States
  active: string;               // Interactive/selected state
  inactive: string;             // Dormant/disabled state
  warning: string;              // Alert/attention state

  // Transparency Layers
  opacity: {
    base: number;               // Solid presence (0.9-1.0)
    medium: number;             // Semi-transparent (0.5-0.7)
    subtle: number;             // Barely there (0.2-0.4)
    ghost: number;              // Trace presence (0.05-0.15)
  };

  // Color Relationships
  relationships: {
    type: "warm" | "cool" | "neutral";
    energy: "vibrant" | "muted" | "saturated" | "desaturated";
    contrast: "high" | "medium" | "low";
    harmony: "complementary" | "analogous" | "triadic" | "monochromatic";
  };
}

/**
 * Symbol motif - the iconic representation
 */
interface SymbolMotif {
  primary: string;        // Main symbolic element
  secondary: string;      // Supporting symbol
  tertiary?: string;      // Optional third element
  metaphor: string;       // What the symbol represents
}

/**
 * Geometric composition preferences
 */
interface GeometryProfile {
  forms: GeometricForm[];           // Preferred shapes
  emphasis: "vertical" | "horizontal" | "radial" | "dynamic" | "balanced";
  layering: "flat" | "stratified" | "nested" | "interlocking";
  symmetry: "perfect" | "approximate" | "asymmetric" | "bilateral";
}

/**
 * Line and stroke characteristics
 */
interface StrokeProfile {
  weight: VisualWeight;
  style: "solid" | "dashed" | "dotted" | "variable";
  quality: "precise" | "organic" | "weathered" | "flowing" | "mechanical";
}

/**
 * Complete thematic specification for a pillar
 */
interface PillarTheme {
  // Identity
  id: string;                       // Uppercase identifier (e.g., "CHRONOS")
  name: string;                     // Display name
  title: string;                    // Archetypal title
  tagline: string;                  // One-line essence
  epithet: string;                  // Poetic descriptor

  // Narrative Core
  narrative: {
    role: string;                   // What this pillar DOES in the system
    responsibility: string;         // What this pillar is RESPONSIBLE FOR
    transformation: string;         // What this pillar TRANSFORMS (input → output)
    essence: string;                // The fundamental nature (2-3 sentences)
    story: string;                  // The narrative context (paragraph)
  };

  affinity: {
    elements: Element[];            // Primary elemental associations
    archetype: Archetype;           // Narrative role
    emotion: EmotionalTone;         // Evoked feeling
    metaphor: string;               // Central metaphor
    philosophy: string;             // Philosophical stance
  };

  // Visual DNA
  palette: ColorPalette;
  motifs: SymbolMotif;
  geometry: GeometryProfile;
  stroke: StrokeProfile;
  texture: TextureQuality;
  corners: CornerStyle;

  // Symbolic Language
  iconography: {
    forms: string[];                // Physical forms (e.g., "scrolls", "gears")
    patterns: string[];             // Visual patterns (e.g., "layers", "spirals")
    symbols: string[];              // Semantic symbols (e.g., "git branch", "clock")
    textures: string[];             // Surface qualities
    details: string[];              // Fine ornamental elements
  };

  // Dendrovian Cohesion
  dendrovianMotifs: {
    branchingStyle: string;         // How this pillar expresses dendritic form
    layeringApproach: string;       // How depth/time is shown
    nodeCharacter: string;          // How connection points appear
    flowDirection: string;          // Movement and energy flow
  };

  // Prompt Construction
  promptSeeds: {
    style: string;                  // Art style direction
    aesthetic: string;              // Overall visual feel
    composition: string;            // Layout guidance
    symbolism: string;              // Meaning layer
    mood: string;                   // Atmospheric quality
    technical: string;              // Technical requirements
    vocabulary: string[];           // Key descriptive words
  };
}

/**
 * Prompt template structure for asset generation
 */
interface PromptTemplate {
  pillar: string;                   // Pillar ID
  assetType: "icon" | "shader" | "texture" | "model" | "ui_component";
  template: string;                 // Full prompt with {{placeholders}}
  parameters: Record<string, any>;  // Variable substitutions
  constraints: {
    svg?: {
      viewBox: string;              // e.g., "0 0 100 100"
      maxComplexity: number;        // Path point limit
    };
    sdf?: {
      primitiveCount: number;       // Max SDF operations
      complexityBudget: number;     // Raymarch steps
    };
  };
}
```

---

## 📜 PILLAR THEMATIC SPECIFICATIONS

### CHRONOS - The Archaeologist

```typescript
const CHRONOS: PillarTheme = {
  // Identity
  id: "CHRONOS",
  name: "Chronos",
  title: "The Archaeologist",
  tagline: "Time crystallized into navigable space",
  epithet: "The Keeper of Sedimentary Code",

  // Narrative Core
  narrative: {
    role: "Temporal cartographer and historical excavator",
    responsibility: "Transforms git history into navigable archaeological sites. Parses commits, branches, and merges into dendritic temporal structures.",
    transformation: "Raw git data + AST analysis → Spatial geology of code evolution",
    essence: "CHRONOS sees time as a dimension to be excavated, not merely traversed. Every commit is a fossil layer, every branch a divergent evolutionary path, every merge a tectonic convergence. Code history becomes archaeological strata.",
    story: "In the depths of every codebase lies sedimentary time - layers upon layers of decisions, refinements, and pivots. CHRONOS is the archaeologist who excavates these strata, revealing not just what the code is, but what it was, what it became, and the forces that shaped its evolution. Git branches become dendritic growths extending from ancient roots. Commits crystallize into fossils. The diff between versions becomes the boundary between geological epochs. CHRONOS doesn't just parse repositories - it performs temporal archaeology, transforming linear history into multi-dimensional excavation sites where developers can walk through time itself."
  },

  affinity: {
    elements: ["Earth", "Time"],
    archetype: "The Sage",
    emotion: "Reverence",
    metaphor: "Git history as sedimentary geology, commits as fossils pressed into stone, branches as dendritic evolution",
    philosophy: "Time is not a line - it is a landscape. History is not past - it is foundation. Code evolution is not change - it is sedimentation."
  },

  // Visual DNA
  palette: {
    // Core Identity Colors
    primary: "#d4a574",              // Weathered parchment, aged bronze, ochre earth
    secondary: "#8b7355",            // Clay tablets, terracotta, earthenware
    accent: "#e8d7c3",               // Sunbleached bone, limestone, fossilized ivory

    // Depth & Atmosphere
    shadow: "#4a3822",               // Deep archaeological pit, ancient soil
    midtone: "#a6896b",              // Sedimented layers, compressed time
    highlight: "#f5ead6",            // Surface light on excavated artifact

    // Complementary Tensions
    complement: "#74a5d4",           // Blue-grey (opposite warmth - cold time)
    analogous: ["#c49060", "#d9c3a5"], // Warm earth tones (harmony)

    // Functional States
    active: "#dda15e",               // Illuminated parchment (currently excavating)
    inactive: "#6b5d4f",             // Dormant fossil (unexamined)
    warning: "#b85c38",              // Erosion alert (data corruption)

    // Transparency Layers
    opacity: {
      base: 0.95,                    // Solid fossil presence
      medium: 0.65,                  // Semi-fossilized (partial history)
      subtle: 0.35,                  // Faint strata lines
      ghost: 0.12,                   // Ancient trace (deep time)
    },

    // Color Relationships
    relationships: {
      type: "warm",
      energy: "muted",
      contrast: "medium",
      harmony: "analogous"
    }
  },

  motifs: {
    primary: "scroll",
    secondary: "branch",
    tertiary: "strata",
    metaphor: "Unfurling parchment reveals branching time compressed into layers"
  },

  geometry: {
    forms: ["spiral", "circle", "rectangle"],
    emphasis: "vertical",
    layering: "stratified",
    symmetry: "bilateral"
  },

  stroke: {
    weight: "medium",
    style: "solid",
    quality: "weathered"
  },

  texture: "aged_parchment",
  corners: "slightly_rounded",

  // Symbolic Language
  iconography: {
    forms: [
      "unfurling scrolls with visible fiber texture",
      "clay tablets bearing commit hashes like cuneiform",
      "tree rings revealing temporal density",
      "excavation grid overlays suggesting methodology",
      "cross-sectional strata showing code layers",
      "trowel and brush tools of gentle excavation"
    ],
    patterns: [
      "concentric commit rings (tree-ring dating)",
      "vertical stratification (time flows upward)",
      "dendritic branch splits (evolutionary divergence)",
      "horizontal sediment layers (version epochs)",
      "archaeological measurement grids",
      "weathered edge irregularities (time's erosion)"
    ],
    symbols: [
      "git branch Y-fork as evolutionary split",
      "commit nodes as circular fossil imprints",
      "diff boundaries as geological unconformities",
      "merge points as tectonic convergence",
      "HEAD pointer as excavation focus",
      "time arrows flowing from deep past to surface present"
    ],
    textures: [
      "rough papyrus fiber",
      "compressed sediment grain",
      "weathered stone surface",
      "aged parchment crackle"
    ],
    details: [
      "micro-text representing file names",
      "timestamp markings like dates on artifacts",
      "author signatures as archaeological marks",
      "small measurement indicators"
    ]
  },

  // Dendrovian Cohesion
  dendrovianMotifs: {
    branchingStyle: "Archaeological strata that split at divergence points, maintaining vertical temporal flow",
    layeringApproach: "Horizontal stratification with transparency showing depth into past",
    nodeCharacter: "Circular fossil imprints with concentric age rings",
    flowDirection: "Upward from ancient bedrock to surface present, with lateral branches"
  },

  // Prompt Construction
  promptSeeds: {
    style: "Dendrovian archaeological precision - geometric clarity emerging from organic sediment",
    aesthetic: "Weathered wisdom layered with mathematical stratification - ancient yet structured, eroded yet precise",
    composition: "Strong vertical emphasis with visible stratification, dendritic branching from central timeline, concentric temporal rings, centered excavation focus",
    symbolism: "Time as excavatable geology, git commits as compressed fossils, branches as evolutionary divergence, code history as archaeological dig site",
    mood: "Reverent discovery, patient stratification, timeless wisdom slowly revealed, archaeological wonder at sedimentary code",
    technical: "Clean SVG paths with weathered edges, layered opacity revealing depth, scale-independent geometry, concentric circles and vertical rectangles, SDF-compatible rounded forms",
    vocabulary: [
      "sedimentary", "fossilized", "stratified", "excavated", "compressed",
      "temporal", "geological", "dendritic", "weathered", "ancient",
      "archaeological", "layered", "divergent", "evolutionary", "preserved"
    ]
  }
};
```

---

### IMAGINARIUM - The Compiler

```typescript
const IMAGINARIUM: PillarTheme = {
  // Identity
  id: "IMAGINARIUM",
  name: "Imaginarium",
  title: "The Compiler",
  tagline: "Dreams distilled into executable mathematics",
  epithet: "The Alchemist of Procedural Vision",

  // Narrative Core
  narrative: {
    role: "Transformational bridge between artistic vision and computational reality",
    responsibility: "Distills AI-generated art into mathematical representations - SDFs, shaders, noise functions, L-systems. Compiles aesthetics into code.",
    transformation: "Generative art + aesthetic intent → Procedural shader code + mathematical beauty",
    essence: "IMAGINARIUM is the alchemist's laboratory where ephemeral dreams crystallize into executable geometry. It transmutes pixels into distance fields, colors into noise parameters, compositions into L-system rules. Art becomes mathematics without losing its soul.",
    story: "Every beautiful image contains hidden mathematics waiting to be discovered. IMAGINARIUM sees beyond pixels to the underlying equations - the SDF that could generate this tree, the noise function producing this texture, the color palette expressible as wavelength distributions. It is both artist and scientist, wielding AI generation to dream visions, then wielding procedural compilation to make those dreams executable. Where others see images, IMAGINARIUM sees compressed instructions. A sunset becomes a gradient function. A tree becomes an L-system. A texture becomes composable noise. This is not reduction - it is revelation. The compiled code is not a copy of the art; it is the art's true mathematical nature, distilled and preserved forever in functions that generate infinite variations of the original vision."
  },

  affinity: {
    elements: ["Aether", "Light"],
    archetype: "The Alchemist",
    emotion: "Wonder",
    metaphor: "Art as compressed mathematics, AI generation as prima materia, shader compilation as philosophical stone, procedural code as transmuted gold",
    philosophy: "Beauty is not arbitrary - it is mathematical truth made visible. Art and code are not opposites - they are the same substance in different phases."
  },

  // Visual DNA
  palette: {
    // Core Identity Colors
    primary: "#c6a0f6",              // Ethereal violet, alchemical purple, mystic transformation
    secondary: "#9b6dd8",            // Deep lavender, twilight distillation, contemplative depth
    accent: "#e5d4ff",               // Pale lilac, crystalline light, refined essence

    // Depth & Atmosphere
    shadow: "#4a2d5f",               // Deep alchemical chamber, transformation darkness
    midtone: "#b088e0",              // Mid-transformation glow, process luminescence
    highlight: "#f8f0ff",            // Transcendent white-violet, pure distillate

    // Complementary Tensions
    complement: "#d8f69b",           // Yellow-green (energetic contrast - nature vs. synthesis)
    analogous: ["#d0a0f6", "#a0c6f6"], // Purple-blue spectrum (harmonic gradation)

    // Functional States
    active: "#da9ef7",               // Glowing transformation (actively compiling)
    inactive: "#7a5fa0",             // Dormant potential (awaiting generation)
    warning: "#ff8fd5",              // Unstable mixture (generation error)

    // Transparency Layers
    opacity: {
      base: 0.92,                    // Ethereal yet present
      medium: 0.62,                  // Transitional state
      subtle: 0.32,                  // Fading essence
      ghost: 0.10,                   // Trace of possibility
    },

    // Color Relationships
    relationships: {
      type: "cool",
      energy: "saturated",
      contrast: "medium",
      harmony: "analogous"
    }
  },

  motifs: {
    primary: "palette",
    secondary: "prism",
    tertiary: "alembic",
    metaphor: "Color wells feed into refraction prism, distilled through alchemical vessel into pure mathematical essence"
  },

  geometry: {
    forms: ["ellipse", "circle", "spiral"],
    emphasis: "radial",
    layering: "nested",
    symmetry: "approximate"
  },

  stroke: {
    weight: "light",
    style: "solid",
    quality: "flowing"
  },

  texture: "iridescent",
  corners: "smooth_organic",

  // Symbolic Language
  iconography: {
    forms: [
      "artist palettes with luminous color wells",
      "prismatic crystals refracting light into spectrum",
      "alchemical alembics with vapor trails",
      "flowing brushes leaving mathematical equations",
      "transformation circles containing shader nodes",
      "distillation apparatus dripping pure functions"
    ],
    patterns: [
      "radial energy emanating from creative center",
      "color gradient flows showing transformation",
      "light refraction paths (wavelength decomposition)",
      "spiral transformation sequences (iterative refinement)",
      "nested circles (compilation stages)",
      "dendritic color bleeding (artistic spread)"
    ],
    symbols: [
      "palette wells (tunable parameters)",
      "brush strokes (generative agency)",
      "prismatic rays (spectral analysis)",
      "shader node trees (procedural graphs)",
      "distillation drops (extracted essence)",
      "alchemical symbols (transformation operations)",
      "color wheels (parameter spaces)",
      "vapor trails (ephemeral to solid)"
    ],
    textures: [
      "iridescent shimmer",
      "soft gradient halos",
      "crystalline refraction",
      "ethereal glow"
    ],
    details: [
      "tiny color theory diagrams",
      "micro shader code snippets",
      "wavelength markers",
      "transformation stage indicators"
    ]
  },

  // Dendrovian Cohesion
  dendrovianMotifs: {
    branchingStyle: "Radiating transformation paths from central alchemical core, branching into shader variants",
    layeringApproach: "Nested circles showing compilation stages from art to code",
    nodeCharacter: "Luminous wells containing color/parameter essence",
    flowDirection: "Radial outward from creative source, with spiraling refinement"
  },

  // Prompt Construction
  promptSeeds: {
    style: "Dendrovian alchemical precision - geometric transformation vessels containing flowing creative energy",
    aesthetic: "Ethereal mathematics made visible - iridescent logic, crystalline procedures, flowing yet structured, magical yet executable",
    composition: "Radial emanation from creative core, nested transformation layers, flowing connections, prismatic refraction, balanced asymmetry suggesting organic process",
    symbolism: "Art as compressed mathematics, AI generation as raw vision, shader compilation as alchemical distillation, procedural beauty as transmuted essence",
    mood: "Creative wonder, transformative revelation, alchemical synthesis, inspired discovery of mathematical beauty hidden in artistic vision",
    technical: "Smooth Bezier curves suggesting flow, gradient-friendly circular forms, prismatic ellipses, nested composition, iridescent color bleeding, SDF-compatible organic shapes",
    vocabulary: [
      "ethereal", "alchemical", "distilled", "refracted", "luminous",
      "crystalline", "transmuted", "synthesized", "iridescent", "flowing",
      "procedural", "parameterized", "generative", "transformative", "prismatic"
    ]
  }
};
```

---

### ARCHITECTUS - The Renderer

```typescript
const ARCHITECTUS: PillarTheme = {
  // Identity
  id: "ARCHITECTUS",
  name: "Architectus",
  title: "The Renderer",
  tagline: "Light made manifest through computational geometry",
  epithet: "The Master Builder of Impossible Spaces",

  // Narrative Core
  narrative: {
    role: "Spatial constructor and visual manifestor",
    responsibility: "Renders procedural geometry in real-time using WebGPU. Transforms mathematical descriptions (SDFs, L-systems) into navigable 3D space. Manages camera, lighting, and the 'impossible perspective' of dendritic navigation.",
    transformation: "Mathematical definitions + shader code → Rendered 3D dendritic worlds",
    essence: "ARCHITECTUS builds spaces that cannot exist in physical reality, yet feel more real than concrete. It constructs dendritic architectures where gravity points toward code structure, where impossible perspectives coexist, where the ant walks on the manifold and never falls.",
    story: "In the void, ARCHITECTUS speaks geometry into being. It is the master builder of impossible spaces - where up is relative, where branches extend infinitely without fog, where the small is as detailed as the large because everything is distance fields, not triangles. WebGPU becomes its construction material, raymarching becomes its vision, shaders become its building blocks. It builds temples of code where developers walk as embodied avatars through their own creation's structure. The dendritic world grows from ARCHITECTUS like a crystal forming - mathematically perfect, organically flowing, impossible yet navigable. It renders not what is, but what could never be except through computation. Escher would weep with joy."
  },

  affinity: {
    elements: ["Light", "Metal"],
    archetype: "The Architect",
    emotion: "Clarity",
    metaphor: "WebGPU as divine construction material, SDFs as platonic ideals, raymarching as sight itself, impossible geometry as architectural truth",
    philosophy: "Space is not given - it is constructed. Perspective is not fixed - it is relative. The impossible is merely the unrendered."
  },

  // Visual DNA
  palette: {
    // Core Identity Colors
    primary: "#8ab4f8",              // Computational clarity blue, sky made digital
    secondary: "#5a8dd8",            // Deep structure blue, blueprint depth
    accent: "#c8e0ff",               // Light scaffold, ethereal construction glow

    // Depth & Atmosphere
    shadow: "#1e3a5f",               // Deep computational void, unrendered space
    midtone: "#6fa0e8",              // Mid-construction state, partial manifestation
    highlight: "#e8f4ff",            // Pure light, fully rendered radiance

    // Complementary Tensions
    complement: "#f8c98a",           // Warm gold (warmth vs. cool logic - organic vs. computational)
    analogous: ["#8ad4f8", "#8a9bf8"], // Blue spectrum (structural harmony)

    // Functional States
    active: "#5dbaff",               // Bright render (actively computing)
    inactive: "#4a6b8f",             // Dormant structure (unloaded geometry)
    warning: "#ff6b5d",              // Render error (failed raycast)

    // Transparency Layers
    opacity: {
      base: 1.0,                     // Solid rendered geometry
      medium: 0.70,                  // Partially loaded LOD
      subtle: 0.35,                  // Distance fade (far geometry)
      ghost: 0.08,                   // Render bounds indicator
    },

    // Color Relationships
    relationships: {
      type: "cool",
      energy: "vibrant",
      contrast: "high",
      harmony: "analogous"
    }
  },

  motifs: {
    primary: "column",
    secondary: "light_ray",
    tertiary: "polyhedron",
    metaphor: "Classical columns support impossible architecture, illuminated by raymarched light"
  },

  geometry: {
    forms: ["rectangle", "triangle", "circle"],
    emphasis: "vertical",
    layering: "interlocking",
    symmetry: "perfect"
  },

  stroke: {
    weight: "bold",
    style: "solid",
    quality: "precise"
  },

  texture: "polished_stone",
  corners: "sharp_precise",

  // Symbolic Language
  iconography: {
    forms: [
      "classical columns with geometric fluting",
      "architectural capitals bearing computational ornament",
      "platonic solids (cube, pyramid, octahedron)",
      "blueprint wireframes showing structure",
      "raymarched light beams",
      "impossible staircases and perspectives"
    ],
    patterns: [
      "strong vertical emphasis (structural ascension)",
      "sacred geometry proportions (golden ratio, fibonacci)",
      "technical grid overlays (coordinate systems)",
      "light and shadow interplay (real-time illumination)",
      "hierarchical layering (LOD levels)",
      "interlocking geometries (SDF operations)"
    ],
    symbols: [
      "column fluting (rendering detail levels)",
      "capital ornament (architectural refinement)",
      "blueprint grids (3D coordinate space)",
      "light rays (raymarching paths)",
      "impossible geometry (dendritic perspective)",
      "camera glyph (viewpoint)",
      "polyhedron (pure mathematical form)"
    ],
    textures: [
      "polished computational surface",
      "wireframe blueprint overlay",
      "light-refractive clarity",
      "geometric precision"
    ],
    details: [
      "tiny grid coordinates",
      "LOD level indicators",
      "render statistics",
      "camera focal points"
    ]
  },

  // Dendrovian Cohesion
  dendrovianMotifs: {
    branchingStyle: "Structural columns that bifurcate following SDF union operations, maintaining vertical integrity",
    layeringApproach: "LOD-based depth with interlocking geometric stages",
    nodeCharacter: "Platonic solid intersections at branch points",
    flowDirection: "Vertical ascension with raymarched light descending from above"
  },

  // Prompt Construction
  promptSeeds: {
    style: "Dendrovian architectural precision - impossible geometry made computationally real",
    aesthetic: "Pristine geometric clarity with structural gravitas - clean lines, bold forms, mathematical perfection visible as beauty",
    composition: "Strong vertical emphasis suggesting ascension, interlocking geometries, sacred proportions (golden ratio), light streaming from computational heaven, impossible perspectives coexisting",
    symbolism: "WebGPU as divine building material, SDFs as platonic ideals made manifest, raymarching as sight itself, columns as load-bearing render structures, impossible architecture as dendritic truth",
    mood: "Sublime computational order, architectural transcendence, geometric revelation, engineered clarity, impossible wonder",
    technical: "Sharp geometric primitives (rectangles, triangles), perfect symmetry, bold precise strokes, high contrast lighting, interlocking forms, SDF-compatible platonic solids",
    vocabulary: [
      "architectural", "geometric", "structural", "raymarched", "computational",
      "pristine", "impossible", "interlocking", "vertical", "platonic",
      "blueprint", "rendered", "manifested", "constructed", "illuminated"
    ]
  }
};
```

---

### LUDUS - The Mechanics

```typescript
const LUDUS: PillarTheme = {
  // Identity
  id: "LUDUS",
  name: "Ludus",
  title: "The Mechanics",
  tagline: "Play encoded in systematic rules",
  epithet: "The Game Master of Systematic Wonder",

  // Narrative Core
  narrative: {
    role: "Transformation engine converting code structure into playable game mechanics",
    responsibility: "Manages turn-based combat, spell systems, quest generation from git history, encounter triggering, character classes, and all game logic. Pure mechanics - no rendering, just rules.",
    transformation: "Code metadata + git history → Game mechanics + playable challenges",
    essence: "LUDUS sees every codebase as an unplayed game waiting to happen. Bugs become monsters with strengths derived from their complexity. Commits become quest chains. Contributors become NPC classes. The systematic becomes playable.",
    story: "Code is not static text - it is a battlefield of decisions, a quest chain of features, a strategic landscape where bugs lurk as creatures and refactors are healing spells. LUDUS is the game master who sees the play potential in every repository. It transforms TypeError into a fire-type enemy weak to documentation attacks. It turns a merge conflict into a boss battle requiring strategic resolution. Git history becomes a procedurally generated quest line where each commit is a chapter. The player doesn't just read code - they battle it, quest through it, strategize around it. LUDUS makes exploration tactical, making comprehension playful, making debugging combative. Every codebase is a unique roguelike dungeon generated from its own structure. The game rules aren't imposed - they're discovered in the code's own nature."
  },

  affinity: {
    elements: ["Fire", "Air"],
    archetype: "The Warrior",
    emotion: "Excitement",
    metaphor: "Bugs as monsters, commits as quests, turn-based combat as chess, game rules as emergent from code structure, strategic play as deep comprehension",
    philosophy: "Play is learning in disguise. Strategy is understanding made tactical. Games are systems made visible. Every codebase contains a unique game waiting to be played."
  },

  // Visual DNA
  palette: {
    // Core Identity Colors
    primary: "#81c995",              // Vibrant growth green, energetic life force
    secondary: "#5fa876",            // Strategic forest green, tactical depth
    accent: "#b8e6c9",               // Mint spark, playful highlight

    // Depth & Atmosphere
    shadow: "#2d4d3a",               // Deep strategy shadow, game board darkness
    midtone: "#6eb584",              // Mid-game energy, active play state
    highlight: "#d4f5e3",            // Victory glow, quest completion light

    // Complementary Tensions
    complement: "#c98581",           // Warm red (conflict vs. growth - combat vs. progress)
    analogous: ["#81c9b8", "#95c981"], // Green-teal spectrum (harmonic strategies)

    // Functional States
    active: "#5ff59f",               // Glowing action (player's turn)
    inactive: "#648f6f",             // Waiting state (enemy's turn)
    warning: "#ff9d5f",              // Danger alert (low health)

    // Transparency Layers
    opacity: {
      base: 0.95,                    // Solid game piece
      medium: 0.68,                  // Possible move indicator
      subtle: 0.38,                  // Path preview
      ghost: 0.12,                   // Strategic hint
    },

    // Color Relationships
    relationships: {
      type: "warm",
      energy: "vibrant",
      contrast: "medium",
      harmony: "analogous"
    }
  },

  motifs: {
    primary: "controller",
    secondary: "dice",
    tertiary: "chess_piece",
    metaphor: "Player agency (controller) meets procedural chance (dice) in strategic space (chess)"
  },

  geometry: {
    forms: ["cross", "circle", "square"],
    emphasis: "dynamic",
    layering: "flat",
    symmetry: "bilateral"
  },

  stroke: {
    weight: "medium",
    style: "solid",
    quality: "precise"
  },

  texture: "soft_matte",
  corners: "friendly_rounded",

  // Symbolic Language
  iconography: {
    forms: [
      "game controllers with ergonomic grips",
      "polyhedral dice showing procedural outcomes",
      "chess pieces representing tactical roles",
      "game boards with movement grids",
      "resource bars (health, mana, stamina)",
      "quest scrolls with branching paths"
    ],
    patterns: [
      "grid-based movement systems",
      "action flow arrows (turn sequence)",
      "combat state diagrams",
      "dynamic diagonal emphasis (action energy)",
      "strategic positioning zones",
      "dendritic skill trees"
    ],
    symbols: [
      "D-pad cross (directional agency)",
      "action button circles (choice prompts)",
      "resource bars (system states)",
      "quest markers (goal indicators)",
      "encounter indicators (enemy proximity)",
      "dice pips (RNG elements)",
      "chess knight L-move (strategic paths)",
      "shield/sword (Tank class)",
      "staff/heart (Healer class)",
      "dagger/burst (DPS class)"
    ],
    textures: [
      "soft matte tactility",
      "game piece surface",
      "strategic grid overlay",
      "action glow"
    ],
    details: [
      "micro stat numbers",
      "turn order indicators",
      "cooldown timers",
      "combo multipliers"
    ]
  },

  // Dendrovian Cohesion
  dendrovianMotifs: {
    branchingStyle: "Skill trees and quest paths that branch based on player choices, maintaining strategic clarity",
    layeringApproach: "Flat tactical view with clear state indicators, no depth ambiguity",
    nodeCharacter: "Interactive decision points with clear affordances",
    flowDirection: "Dynamic diagonals suggesting action, with grid-based strategic movement"
  },

  // Prompt Construction
  promptSeeds: {
    style: "Dendrovian game design - tactile interfaces meeting strategic clarity",
    aesthetic: "Friendly precision with energetic motion - playful yet systematic, approachable yet deep, game-like yet meaningful",
    composition: "Dynamic diagonals suggesting action, balanced tactical layout, clear interaction zones, grid-based strategic space, centered focal points for decisions",
    symbolism: "Turn-based combat as strategic chess, bugs as procedurally generated monsters, git history as quest chains, code exploration as tactical gameplay, comprehension through play",
    mood: "Playful strategic excitement, tactical engagement, game-like wonder, challenge-driven joy, systematic discovery through interaction",
    technical: "Friendly rounded corners, cross-shaped D-pad forms, circular action buttons, symmetrical balance, tactile shapes suggesting interactivity, grid-aligned elements",
    vocabulary: [
      "tactical", "strategic", "playful", "systematic", "procedural",
      "energetic", "combative", "quest-driven", "interactive", "balanced",
      "turn-based", "grid-based", "choice-driven", "emergent", "game-like"
    ]
  }
};
```

---

### OCULUS - The Interface

```typescript
const OCULUS: PillarTheme = {
  // Identity
  id: "OCULUS",
  name: "Oculus",
  title: "The Interface",
  tagline: "Vision structured as navigable information",
  epithet: "The Oracle of Perceptual Clarity",

  // Narrative Core
  narrative: {
    role: "Perceptual bridge between human awareness and system complexity",
    responsibility: "Designs and renders all UI/UX components - HUD overlays, Miller Column code readers, quest modals, inspector panels, minimap. Makes the invisible visible, the complex clear, the overwhelming navigable.",
    transformation: "Raw system state + overwhelming data → Structured, beautiful, navigable information",
    essence: "OCULUS is the eye through which the system sees the user, and the lens through which the user sees the system. It structures chaos into clarity, transforms data into meaning, makes the invisible architecture of code visible as navigable space.",
    story: "To see is to understand, and understanding requires the right lens. OCULUS is not just an interface layer - it is an extension of human perception into the computational realm. It takes the overwhelming complexity of a living codebase and structures it into navigable information landscapes. Miller Columns become spatial navigation trees. The minimap becomes a dendritic overview consciousness. HUD elements float in 3D space like thoughts hovering at the edge of awareness. Quest modals appear as billboard scrolls in the world itself. Every UI element is not a screen overlay - it is an extension of sight, a lens for seeing into the structure of code. OCULUS makes the invisible visible, the complex navigable, the overwhelming serene. It is the gentle guide, the patient teacher, the clear-eyed oracle showing you exactly what you need to see, exactly when you need to see it."
  },

  affinity: {
    elements: ["Air", "Light"],
    archetype: "The Oracle",
    emotion: "Awareness",
    metaphor: "Eye as interface portal, Miller columns as dendrite of sight, UI as extended perception, observation as structured understanding, vision as navigation",
    philosophy: "Seeing is not passive reception - it is active construction. The interface doesn't show reality - it structures it. Good UI makes the invisible visible and the visible clear."
  },

  // Visual DNA
  palette: {
    // Core Identity Colors
    primary: "#f5a97f",              // Warm observational amber, attentive glow
    secondary: "#d88957",            // Focused sunset orange, concentrated awareness
    accent: "#ffd4b8",               // Soft illumination peach, gentle highlight

    // Depth & Atmosphere
    shadow: "#5f3d2d",               // Deep perceptual shadow, unseen information
    midtone: "#e89b6f",              // Mid-awareness state, partially revealed
    highlight: "#fff5ed",            // Pure clarity, full revelation

    // Complementary Tensions
    complement: "#7fa9f5",           // Cool blue (warmth vs. logic - emotion vs. data)
    analogous: ["#f5c27f", "#f57f9b"], // Warm spectrum (harmonious awareness)

    // Functional States
    active: "#ffb366",               // Bright focus (element in view)
    inactive: "#9d7357",             // Unfocused state (background element)
    warning: "#ff6b66",              // Alert perception (requires attention)

    // Transparency Layers
    opacity: {
      base: 0.90,                    // Present but non-obstructive
      medium: 0.65,                  // Semi-transparent overlay
      subtle: 0.35,                  // Contextual hint
      ghost: 0.10,                   // Barely perceptible guide
    },

    // Color Relationships
    relationships: {
      type: "warm",
      energy: "muted",
      contrast: "medium",
      harmony: "analogous"
    }
  },

  motifs: {
    primary: "eye",
    secondary: "lens",
    tertiary: "frame",
    metaphor: "Eye observes through lens, framed by structured boundaries - organic perception meets organized presentation"
  },

  geometry: {
    forms: ["ellipse", "hexagon", "circle"],
    emphasis: "radial",
    layering: "nested",
    symmetry: "bilateral"
  },

  stroke: {
    weight: "light",
    style: "solid",
    quality: "organic"
  },

  texture: "translucent",
  corners: "smooth_organic",

  // Symbolic Language
  iconography: {
    forms: [
      "stylized eyes with structured iris geometry",
      "observation lenses with focal rings",
      "window frames and information panels",
      "nested viewing circles showing depth",
      "information cards floating in space",
      "magnifying glasses revealing detail"
    ],
    patterns: [
      "concentric focus rings (attention hierarchy)",
      "Miller column dendritic trees (navigation structure)",
      "translucent UI overlay layers",
      "gentle eyelid curves (soft framing)",
      "nested information depth (progressive revelation)",
      "radial awareness emanation"
    ],
    symbols: [
      "hexagonal iris (structured info cells)",
      "pupil circle (focal attention point)",
      "eyelid curves (gentle contextual framing)",
      "window panes (panel divisions)",
      "reflection highlights (moment of clarity)",
      "lens reticles (targeting attention)",
      "minimap dendritic overview",
      "HUD elements (extended awareness)"
    ],
    textures: [
      "translucent glass overlay",
      "soft focus blur",
      "gentle glow emanation",
      "smooth organic surface"
    ],
    details: [
      "tiny scroll indicators",
      "column divider lines",
      "focus state highlights",
      "attention pulse animations"
    ]
  },

  // Dendrovian Cohesion
  dendrovianMotifs: {
    branchingStyle: "Miller columns that branch like dendritic sight, each level revealing deeper structure",
    layeringApproach: "Nested translucent overlays suggesting progressive depth of awareness",
    nodeCharacter: "Circular focal points with hexagonal information structure",
    flowDirection: "Radial emanation from focal center, with layered depth perception"
  },

  // Prompt Construction
  promptSeeds: {
    style: "Dendrovian information architecture - organic perception structured through geometric clarity",
    aesthetic: "Gentle observational warmth with structured presentation - non-intrusive yet clear, soft yet organized, ambient yet focused",
    composition: "Concentric layers suggesting depth of awareness, radial focus from central point, gentle framing curves, translucent overlays showing progressive revelation, nested information hierarchy",
    symbolism: "Eye as interface portal to system understanding, Miller columns as dendritic navigation tree, UI overlays as extended human perception, vision as structured exploration, seeing as understanding",
    mood: "Gentle mindful awareness, insightful clarity without overwhelm, observational wisdom, patient focus, serene information revelation",
    technical: "Smooth elliptical curves suggesting organic sight, hexagonal information grids, nested circular focus rings, translucent layering, gentle bilateral symmetry, SDF-compatible organic forms",
    vocabulary: [
      "observational", "focused", "translucent", "structured", "aware",
      "perceptual", "navigable", "layered", "gentle", "clear",
      "mindful", "revealing", "contextual", "ambient", "illuminating"
    ]
  }
};
```

---

### OPERATUS - The Infrastructure

```typescript
const OPERATUS: PillarTheme = {
  // Identity
  id: "OPERATUS",
  name: "Operatus",
  title: "The Infrastructure",
  tagline: "Systems beneath systems, invisible foundations",
  epithet: "The Silent Engineer of Unseen Operations",

  // Narrative Core
  narrative: {
    role: "Foundational systems maintainer and resource orchestrator",
    responsibility: "Manages asset loading, state persistence (Zustand + OPFS), caching strategies, optional CDN delivery, future MMO infrastructure (SpaceTimeDB). The invisible substrate enabling all other pillars.",
    transformation: "Scattered resources + volatile state → Orchestrated assets + persistent memory",
    essence: "OPERATUS is the silent engineer whose work is only noticed when it fails. It is the foundation beneath the temple, the pipeline beneath the city, the memory beneath the thought. All other pillars stand upon its shoulders.",
    story: "Great cathedrals rest on hidden foundations. Complex cities depend on invisible pipelines. Every visible wonder requires invisible infrastructure. OPERATUS is the engineer who builds what nobody sees - the asset loaders that fetch shader code, the state managers that remember your progress, the cache layers that make second loads instant, the CDN orchestration that delivers HD texture packs. It is the memory of the system, the supply chain of data, the bedrock of persistence. When ARCHITECTUS renders, it renders assets OPERATUS loaded. When OCULUS displays state, it displays what OPERATUS persisted. When LUDUS resumes your game, it's because OPERATUS remembered. This pillar asks for no glory - it measures success by invisibility. When everything works, nobody thinks of OPERATUS. And that is exactly how it should be. The best infrastructure is the infrastructure you never notice."
  },

  affinity: {
    elements: ["Metal", "Earth"],
    archetype: "The Engineer",
    emotion: "Reliability",
    metaphor: "Asset loading as supply chains, state persistence as geological memory, infrastructure as silent foundation, caching as anticipatory service, orchestration as invisible logistics",
    philosophy: "The best system is the one you never notice. Infrastructure is not the building - it is the ground that lets the building stand. Glory belongs to the surface; reliability belongs to the substrate."
  },

  // Visual DNA
  palette: {
    // Core Identity Colors
    primary: "#9ca3af",              // Industrial grey, utilitarian precision
    secondary: "#6b7280",            // Iron grey, foundational strength
    accent: "#d1d5db",               // Light steel, polished efficiency

    // Depth & Atmosphere
    shadow: "#374151",               // Deep infrastructure void, buried systems
    midtone: "#838b95",              // Mid-operational state, active processing
    highlight: "#e5e7eb",            // Clean operational surface, well-maintained

    // Complementary Tensions
    complement: "#af9c9c",           // Warm earth grey (cold metal vs. organic foundation)
    analogous: ["#9cadb3", "#a39caf"], // Cool grey spectrum (harmonic infrastructure)

    // Functional States
    active: "#60a5fa",               // System operational (actively processing)
    inactive: "#52525b",             // Dormant but ready (standby state)
    warning: "#f59e0b",              // System strain (approaching capacity)

    // Transparency Layers
    opacity: {
      base: 1.0,                     // Solid infrastructure presence
      medium: 0.75,                  // Partial visibility (debug mode)
      subtle: 0.40,                  // Background system indicators
      ghost: 0.08,                   // Trace of operation
    },

    // Color Relationships
    relationships: {
      type: "neutral",
      energy: "desaturated",
      contrast: "low",
      harmony: "monochromatic"
    }
  },

  motifs: {
    primary: "gears",
    secondary: "pipeline",
    tertiary: "foundation",
    metaphor: "Interlocking gears (synchronization) rest on foundation blocks, connected by flowing pipelines"
  },

  geometry: {
    forms: ["circle", "rectangle", "hexagon"],
    emphasis: "horizontal",
    layering: "interlocking",
    symmetry: "perfect"
  },

  stroke: {
    weight: "medium",
    style: "solid",
    quality: "mechanical"
  },

  texture: "brushed_metal",
  corners: "functional",

  // Symbolic Language
  iconography: {
    forms: [
      "interlocking gears with precise teeth",
      "pipeline segments with flow indicators",
      "foundation blocks supporting structure",
      "mechanical bearings and components",
      "system architecture diagrams",
      "cache layer stacks"
    ],
    patterns: [
      "gear mesh interlocking (system synchronization)",
      "horizontal pipeline flow (data movement)",
      "modular grid infrastructure (component organization)",
      "synchronized rotation cycles (operational harmony)",
      "interlocking foundations (layered support)",
      "dendritic distribution networks"
    ],
    symbols: [
      "gear teeth (system synchronization points)",
      "pipe connections (data flow junctions)",
      "foundation blocks (load-bearing substrate)",
      "load indicators (capacity monitoring)",
      "cache layers (memory strata)",
      "CDN nodes (distributed delivery)",
      "bolt fasteners (secure connections)",
      "bearing housings (smooth operation)"
    ],
    textures: [
      "brushed metal surface",
      "industrial matte finish",
      "mechanical precision",
      "engineered consistency"
    ],
    details: [
      "tiny capacity indicators",
      "system health metrics",
      "load distribution markers",
      "synchronization timing marks"
    ]
  },

  // Dendrovian Cohesion
  dendrovianMotifs: {
    branchingStyle: "Pipeline networks that branch to distribute resources, maintaining horizontal flow efficiency",
    layeringApproach: "Stratified foundation blocks with interlocking support structures",
    nodeCharacter: "Mechanical connection points (bearings, junctions, load distributors)",
    flowDirection: "Horizontal distribution from central supply, with vertical support pillars"
  },

  // Prompt Construction
  promptSeeds: {
    style: "Dendrovian industrial minimalism - functional precision celebrating utilitarian beauty",
    aesthetic: "Efficient mechanical clarity with quiet strength - no ornament, only function; no decoration, only precision; beauty through reliability",
    composition: "Interlocking circular and rectangular forms, horizontal emphasis suggesting stable foundation, modular arrangement, perfect mechanical symmetry, efficient spatial organization",
    symbolism: "Infrastructure as invisible foundation enabling all else, gears as synchronized harmony, pipelines as resource distribution, foundations as load-bearing substrate, caching as anticipatory memory, orchestration as silent logistics",
    mood: "Reliable quiet strength, dependable operation, engineered excellence, invisible confidence, utilitarian pride, foundational stability",
    technical: "Precise circular gear forms with accurate teeth, rectangular modular blocks, hexagonal efficiency patterns, perfect mechanical symmetry, interlocking precision, SDF-compatible industrial shapes",
    vocabulary: [
      "foundational", "reliable", "operational", "synchronized", "efficient",
      "industrial", "mechanical", "utilitarian", "invisible", "substrate",
      "orchestrated", "modular", "interlocking", "precise", "dependable"
    ]
  }
};
```

---

## 🎯 PROMPT CONSTRUCTION FRAMEWORK

### Template Structure

```typescript
/**
 * Construct a complete generation prompt from pillar theme and asset requirements
 */
function constructPrompt(
  theme: PillarTheme,
  assetType: "icon" | "shader" | "texture",
  specificRequirements: string
): string {
  return `
Style: ${theme.promptSeeds.style}
Subject: ${theme.motifs.primary} representing ${theme.title} - ${specificRequirements}
Aesthetic: ${theme.promptSeeds.aesthetic}
Palette: ${theme.palette.primary} (primary), ${theme.palette.secondary} (secondary), ${theme.palette.accent} (accent)
Composition: ${theme.promptSeeds.composition}
Symbolism: ${theme.promptSeeds.symbolism}
Line Quality: ${theme.stroke.weight} weight, ${theme.stroke.quality} quality, ${theme.corners} corners
Details:
${theme.iconography.forms.map(f => `  - ${f}`).join('\n')}
${theme.iconography.patterns.map(p => `  - ${p}`).join('\n')}
${theme.iconography.symbols.map(s => `  - ${s}`).join('\n')}
Mood: ${theme.promptSeeds.mood}
Technical: ${theme.promptSeeds.technical}
Canvas: 100x100 viewBox, centered composition, 10-unit padding
Metaphor: ${theme.affinity.metaphor}
  `.trim();
}
```

### Usage Example

```typescript
// Generate CHRONOS icon prompt
const chronosIconPrompt = constructPrompt(
  CHRONOS,
  "icon",
  "Ancient scroll unfurling with git branch symbol embedded, showing temporal commit rings"
);

// Generate IMAGINARIUM shader prompt
const imaginariumShaderPrompt = constructPrompt(
  IMAGINARIUM,
  "shader",
  "Iridescent color transformation with flowing gradients and alchemical refraction"
);
```

---

## 📊 VALIDATION SCHEMA

```typescript
/**
 * Validate a generated asset against pillar theme requirements
 */
interface ValidationCriteria {
  symbolClarity: boolean;           // Icon instantly communicates pillar essence
  colorAccuracy: boolean;           // Uses specified palette
  geometricIntegrity: boolean;      // Matches geometry profile
  scalingIndependence: boolean;     // Works at 16px and 512px
  narrativeAlignment: boolean;      // Embodies archetype and metaphor
  technicalFeasibility: boolean;    // Convertible to target format
}

function validateAsset(
  asset: SVGElement | ShaderCode,
  theme: PillarTheme
): ValidationCriteria {
  // Implementation would check SVG against theme specs
  return {
    symbolClarity: true,
    colorAccuracy: true,
    geometricIntegrity: true,
    scalingIndependence: true,
    narrativeAlignment: true,
    technicalFeasibility: true
  };
}
```

---

## 🌳 NEXT STEPS

With this thematic schema established:

1. **Export to TypeScript**: Convert these type definitions to actual `.ts` files for programmatic use
2. **Prompt Generator**: Build tool that constructs prompts from themes + requirements
3. **Asset Pipeline**: Feed generated prompts to AI image generation (Stable Diffusion, Flux)
4. **Validation Suite**: Automated checks against thematic schema
5. **Icon Generation**: Use prompt templates to generate final SVG icons
6. **Font Compilation**: Convert validated SVGs to custom font

---

*This document is the formal specification - the type system from which all Dendrovia visual assets emerge.*
