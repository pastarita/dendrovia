# IMAGINARIUM - Icon Generation Iterations
## The Alchemist of Procedural Vision

> **Narrative Core:** Dreams distilled into executable mathematics. Art becomes code without losing its soul.
> **Visual DNA:** Ethereal violet, alchemical transformation, iridescent light refraction
> **Symbols:** Palette wells, prismatic crystals, alchemical alembics, flowing brushes

---

## IMAGINARIUM - EMOJI-GRADE (High Fidelity)

### Generation Prompt:

Create a highly detailed, Apple emoji-quality icon of an alchemist's palette undergoing magical transformation. The composition features a luminous artist's palette at center with glowing color wells in mystical purples and violets, feeding into a prismatic crystal prism that refracts light into mathematical equations. Above the prism floats a translucent alchemical alembic dripping pure distilled essence drops.

**Visual DNA - Dendrovian Alchemical Precision:**
- **Primary Form:** Radial composition emanating from central alchemical core
- **Color Palette:** Ethereal violet (#c6a0f6) as primary glow, deep lavender (#9b6dd8) for transformation shadows, pale lilac (#e5d4ff) for crystalline highlights, with iridescent shimmer throughout
- **Transformation Elements:** Color wells as luminous parameter pools, prismatic rays showing spectral decomposition, vapor trails rising from alembic (ephemeral to solid)
- **Geometric Structure:** Nested circles showing compilation stages, flowing Bezier curves suggesting creative energy, spiral refinement patterns
- **Lighting:** Iridescent shimmer with soft gradient halos, crystalline refraction effects, ethereal glow emanating from transformation center
- **Depth & Atmosphere:** Deep alchemical chamber shadows (#4a2d5f) contrasting with transcendent white-violet highlights (#f8f0ff), mid-transformation luminescence (#b088e0)

**Symbolic Language:**
- Palette wells contain swirling liquid colors (tunable parameters)
- Brush strokes leaving mathematical equations (generative agency)
- Prismatic rays decomposing into wavelength spectrum
- Shader node trees as dendritic color bleeding
- Distillation drops of pure functional essence
- Transformation circles with nested compilation layers
- Alchemical symbols for transformation operations

**Dendrovian Motifs:**
- Radiating transformation paths branching from central core into shader variants
- Nested circles showing compilation stages from raw art to executable code
- Luminous wells as circular focal nodes containing parameter essence
- Spiral patterns suggesting iterative refinement
- Dendritic color bleeding spreading organically

**Texture & Quality:**
- Iridescent shimmer on all surfaces (light-refractive, ethereal)
- Soft gradient halos around energy sources
- Crystalline refraction effects on prism
- Smooth organic curves (smooth_organic corners)
- Flowing light trails with translucent glow

**Emotional Tone:** Creative wonder, transformative revelation, alchemical synthesis, inspired discovery of mathematical beauty hidden in artistic vision

**Style Direction:** Dendrovian alchemical precision - geometric transformation vessels containing flowing creative energy. Ethereal mathematics made visible through iridescent logic, crystalline procedures, flowing yet structured, magical yet executable.

**Technical Requirements:**
- Complex gradients with 8+ color stops
- Subtle shadows suggesting depth and 3D form
- Specular highlights on crystal surfaces
- Soft ambient occlusion in wells and recesses
- Radial light emanation with falloff
- Prismatic color separation effects
- Detailed texture on all surfaces

### Technical Specifications:
- **Canvas:** 100x100px at emoji resolution (with 3x retina density = 300x300 render)
- **Colors:**
  - Primary: #c6a0f6 (ethereal violet glow)
  - Secondary: #9b6dd8 (deep lavender shadows)
  - Accent: #e5d4ff (pale lilac highlights)
  - Shadow: #4a2d5f (transformation darkness)
  - Midtone: #b088e0 (process luminescence)
  - Highlight: #f8f0ff (transcendent white-violet)
  - Complement: #d8f69b (energetic yellow-green contrast)
  - Analogous: #d0a0f6, #a0c6f6 (purple-blue harmony)
  - Active State: #da9ef7 (glowing transformation)
- **Key Elements:**
  - Artist palette with 5-7 luminous color wells
  - Prismatic crystal refracting light
  - Alchemical alembic with vapor trails
  - Flowing brushes leaving equation traces
  - Nested transformation circles
  - Radial energy emanation
  - Shader node tree branches
- **Complexity:** High - Rich gradients, multiple layers, detailed textures, complex lighting

### SVG Pseudocode:

```xml
<!-- Base structure: 100x100 viewBox, centered composition -->
<svg viewBox="0 0 100 100">
  <!-- Background alchemical chamber -->
  <radialGradient id="chamber">
    <stop offset="0%" stop-color="#4a2d5f" stop-opacity="0.3"/>
    <stop offset="100%" stop-color="#4a2d5f" stop-opacity="0"/>
  </radialGradient>
  <circle cx="50" cy="50" r="45" fill="url(#chamber)"/>

  <!-- Outer transformation circle (compilation boundary) -->
  <circle cx="50" cy="50" r="42" fill="none" stroke="#9b6dd8" stroke-width="0.5" opacity="0.3"/>
  <circle cx="50" cy="50" r="38" fill="none" stroke="#c6a0f6" stroke-width="0.5" opacity="0.5"/>

  <!-- Artist Palette (bottom, rotated 15deg) -->
  <g transform="translate(50, 65) rotate(15)">
    <!-- Palette shape: organic ellipse with thumb hole -->
    <ellipse cx="0" cy="0" rx="20" ry="15" fill="#b088e0" opacity="0.9"/>
    <circle cx="-15" cy="0" r="3" fill="#4a2d5f"/> <!-- thumb hole -->

    <!-- Color wells (luminous parameter pools) with gradients -->
    <circle cx="-8" cy="-5" r="3" fill="url(#well1)"/> <!-- violet -->
    <circle cx="0" cy="-7" r="3" fill="url(#well2)"/> <!-- lavender -->
    <circle cx="8" cy="-5" r="3" fill="url(#well3)"/> <!-- lilac -->
    <circle cx="-6" cy="3" r="3" fill="url(#well4)"/> <!-- blue -->
    <circle cx="6" cy="3" r="3" fill="url(#well5)"/> <!-- pink -->

    <!-- Iridescent shimmer overlay on each well -->
    <circle cx="-8" cy="-5" r="3" fill="white" opacity="0.3"/>
    <!-- (repeat for all wells) -->
  </g>

  <!-- Prismatic Crystal (center, above palette) -->
  <g transform="translate(50, 45)">
    <!-- Crystal prism: hexagonal/diamond shape -->
    <polygon points="0,-12 -8,0 0,12 8,0"
             fill="url(#prismGradient)"
             stroke="#e5d4ff"
             stroke-width="1"
             opacity="0.95"/>

    <!-- Refraction rays (spectral decomposition) -->
    <line x1="0" y1="-12" x2="-15" y2="-25" stroke="#da9ef7" stroke-width="2" opacity="0.7"/>
    <line x1="0" y1="-12" x2="0" y2="-28" stroke="#c6a0f6" stroke-width="2" opacity="0.7"/>
    <line x1="0" y1="-12" x2="15" y2="-25" stroke="#a0c6f6" stroke-width="2" opacity="0.7"/>

    <!-- Inner crystalline structure -->
    <polygon points="0,-8 -4,0 0,8 4,0" fill="white" opacity="0.4"/>
  </g>

  <!-- Alchemical Alembic (top) -->
  <g transform="translate(50, 22)">
    <!-- Alembic vessel: rounded bottom, narrow top -->
    <ellipse cx="0" cy="3" rx="8" ry="6" fill="#9b6dd8" opacity="0.85"/>
    <rect x="-2" y="-8" width="4" height="11" rx="2" fill="#b088e0" opacity="0.85"/>

    <!-- Vapor trail (ephemeral to solid) -->
    <path d="M 0,-8 Q -3,-12 -2,-16 Q -1,-18 0,-20"
          stroke="#e5d4ff"
          stroke-width="2"
          fill="none"
          opacity="0.6"
          stroke-linecap="round"/>
    <path d="M 0,-8 Q 3,-11 2,-15"
          stroke="#f8f0ff"
          stroke-width="1.5"
          fill="none"
          opacity="0.4"
          stroke-linecap="round"/>

    <!-- Distillation drops -->
    <circle cx="0" cy="10" r="1.5" fill="#da9ef7" opacity="0.9"/>
    <circle cx="0" cy="14" r="1" fill="#c6a0f6" opacity="0.7"/>
  </g>

  <!-- Flowing Brush (left side, leaving equations) -->
  <g transform="translate(25, 50) rotate(-30)">
    <!-- Brush handle -->
    <rect x="-1" y="-12" width="2" height="20" rx="1" fill="#6b7280" opacity="0.8"/>
    <!-- Brush bristles -->
    <ellipse cx="0" cy="10" rx="3" ry="5" fill="#c6a0f6" opacity="0.7"/>

    <!-- Equation traces (mathematical residue) -->
    <text x="5" y="0" font-size="4" fill="#e5d4ff" opacity="0.5">f(x)</text>
    <text x="8" y="5" font-size="3" fill="#b088e0" opacity="0.4">σ</text>
  </g>

  <!-- Shader Node Tree (right side, dendritic) -->
  <g transform="translate(75, 50)">
    <circle cx="0" cy="0" r="2" fill="#c6a0f6" opacity="0.8"/>
    <line x1="0" y1="0" x2="-5" y2="-8" stroke="#9b6dd8" stroke-width="1" opacity="0.6"/>
    <line x1="0" y1="0" x2="-5" y2="8" stroke="#9b6dd8" stroke-width="1" opacity="0.6"/>
    <circle cx="-5" cy="-8" r="1.5" fill="#b088e0" opacity="0.7"/>
    <circle cx="-5" cy="8" r="1.5" fill="#b088e0" opacity="0.7"/>
  </g>

  <!-- Central glow (radial emanation) -->
  <radialGradient id="centerGlow">
    <stop offset="0%" stop-color="#da9ef7" stop-opacity="0.6"/>
    <stop offset="50%" stop-color="#c6a0f6" stop-opacity="0.3"/>
    <stop offset="100%" stop-color="#4a2d5f" stop-opacity="0"/>
  </radialGradient>
  <circle cx="50" cy="50" r="35" fill="url(#centerGlow)" opacity="0.5"/>

  <!-- Gradient Definitions -->
  <defs>
    <!-- Well gradients -->
    <radialGradient id="well1">
      <stop offset="0%" stop-color="#da9ef7"/>
      <stop offset="100%" stop-color="#9b6dd8"/>
    </radialGradient>
    <radialGradient id="well2">
      <stop offset="0%" stop-color="#c6a0f6"/>
      <stop offset="100%" stop-color="#9b6dd8"/>
    </radialGradient>
    <radialGradient id="well3">
      <stop offset="0%" stop-color="#e5d4ff"/>
      <stop offset="100%" stop-color="#c6a0f6"/>
    </radialGradient>
    <radialGradient id="well4">
      <stop offset="0%" stop-color="#a0c6f6"/>
      <stop offset="100%" stop-color="#5a8dd8"/>
    </radialGradient>
    <radialGradient id="well5">
      <stop offset="0%" stop-color="#ff8fd5"/>
      <stop offset="100%" stop-color="#c6a0f6"/>
    </radialGradient>

    <!-- Prism gradient -->
    <linearGradient id="prismGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8f0ff" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#e5d4ff" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#c6a0f6" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
</svg>
```

**Layer Structure:**
1. Background alchemical chamber (radial gradient)
2. Outer transformation circles (nested compilation stages)
3. Artist palette with luminous wells (bottom layer)
4. Prismatic crystal with refraction rays (center)
5. Alchemical alembic with vapor trails (top)
6. Flowing brush with equation traces (left decoration)
7. Shader node tree branches (right decoration)
8. Central radial glow (atmosphere)

---

## IMAGINARIUM - SIMPLE SVG (Minimal, Clean Icon)

### Generation Prompt:

Create a minimal, geometric icon representing alchemical transformation and creative compilation. The design features a simple artist's palette shape with 3 circular color wells, positioned at the bottom. Above it, a clean triangular prism symbol showing light refraction with 2-3 straight rays emanating upward. Use only 2-3 flat colors from the IMAGINARIUM palette - primary ethereal violet, pale lilac accent, and deep lavender for contrast. No gradients, no complex details - pure symbolic clarity.

**Style:** Flat design, geometric precision, icon clarity over detail
**Composition:** Centered, vertically stacked (palette bottom, prism top), balanced negative space
**Forms:** Simple ellipse for palette, equilateral triangle for prism, perfect circles for wells, straight lines for rays
**Colors:**
  - Primary: #c6a0f6 (ethereal violet)
  - Secondary: #9b6dd8 (deep lavender)
  - Accent: #e5d4ff (pale lilac)
**Line Weight:** Light stroke weight (1-2px), smooth organic corners
**Recognizability:** Instantly readable at 16x16px as "creative transformation tool"

### Technical Specifications:
- **Canvas:** 100x100 viewBox
- **Colors (max 3):**
  - Primary: #c6a0f6
  - Secondary: #9b6dd8
  - Accent: #e5d4ff
- **Key Elements:**
  - Simplified palette ellipse
  - 3 circular wells
  - Triangular prism
  - 3 refraction rays
- **Complexity:** Low - Flat shapes, no gradients, minimal paths

### SVG Pseudocode:

```xml
<svg viewBox="0 0 100 100">
  <!-- Artist Palette (bottom) - simplified ellipse -->
  <ellipse cx="50" cy="65" rx="22" ry="16" fill="#c6a0f6" opacity="1.0"/>

  <!-- Thumb hole (palette authentication) -->
  <circle cx="32" cy="65" r="4" fill="#ffffff" opacity="0.3"/>

  <!-- Color Wells (3 only, evenly spaced) -->
  <circle cx="45" cy="60" r="4" fill="#9b6dd8"/>
  <circle cx="55" cy="60" r="4" fill="#e5d4ff"/>
  <circle cx="50" cy="70" r="4" fill="#9b6dd8"/>

  <!-- Prismatic Prism (top) - equilateral triangle -->
  <polygon points="50,25 40,45 60,45" fill="none" stroke="#e5d4ff" stroke-width="2"/>

  <!-- Refraction Rays (3 rays, straight lines) -->
  <line x1="50" y1="25" x2="40" y2="10" stroke="#c6a0f6" stroke-width="2" stroke-linecap="round"/>
  <line x1="50" y1="25" x2="50" y2="8" stroke="#e5d4ff" stroke-width="2" stroke-linecap="round"/>
  <line x1="50" y1="25" x2="60" y2="10" stroke="#9b6dd8" stroke-width="2" stroke-linecap="round"/>

  <!-- Connection flow (palette feeds prism) -->
  <line x1="50" y1="49" x2="50" y2="45" stroke="#c6a0f6" stroke-width="1.5" opacity="0.6" stroke-dasharray="2,2"/>
</svg>
```

**Design Principles:**
- Vertical flow: input (palette) → transformation (prism) → output (rays)
- Bilateral symmetry for clarity
- Negative space emphasizes core symbols
- Works at tiny sizes (16x16px)

---

## IMAGINARIUM - MEDIUM SVG (Balanced Detail)

### Generation Prompt:

Create a moderately detailed icon showing alchemical transformation from art to code. Features an artist's palette with 5 luminous color wells at the bottom, feeding into a hexagonal prismatic crystal in the center that refracts light into 5 colorful rays spreading upward. Add a small alchemical flask silhouette above the prism. Use 4-6 colors with subtle layering - include soft shadows under palette, gentle glows around prism edges, and slight transparency on refraction rays. The icon should be recognizable at 32x32px with enough detail to show transformation stages while maintaining clean readability.

**Visual Elements:**
- Palette: Organic ellipse with 5 wells (not perfectly circular - slight asymmetry)
- Prism: Hexagonal crystal with subtle inner structure
- Alembic: Simple flask silhouette with narrow neck
- Rays: 5 refraction rays with varying opacity
- Connections: Flowing curved lines from wells to prism
- Depth: Subtle shadows and glows (no complex gradients)

**Color Usage (4-6 colors):**
- Base: #c6a0f6 (primary violet)
- Shadow: #9b6dd8 (depth)
- Highlight: #e5d4ff (bright points)
- Glow: #da9ef7 (active transformation)
- Accent 1: #a0c6f6 (blue harmony)
- Accent 2: #d0a0f6 (purple harmony)

**Composition:**
- Radial emanation from central prism
- Nested layers showing compilation stages
- Approximate symmetry (organic, not rigid)
- Balanced visual weight

**Detail Level:**
- Some texture indication (not full texture)
- Layered transparency (2-3 opacity levels)
- Moderate path complexity
- Inner details on main forms

### Technical Specifications:
- **Canvas:** 100x100 viewBox
- **Colors (4-6):**
  - #c6a0f6 (primary)
  - #9b6dd8 (shadow)
  - #e5d4ff (highlight)
  - #da9ef7 (glow)
  - #a0c6f6 (blue accent)
  - #d0a0f6 (purple accent)
- **Key Elements:**
  - Palette with 5 wells
  - Hexagonal prism
  - Alembic flask
  - 5 refraction rays
  - Flowing connections
  - Shadow/glow layers
- **Complexity:** Medium - Subtle layering, moderate detail, some texture

### SVG Pseudocode:

```xml
<svg viewBox="0 0 100 100">
  <!-- Background glow (subtle atmosphere) -->
  <ellipse cx="50" cy="50" rx="40" ry="40" fill="#c6a0f6" opacity="0.1"/>

  <!-- Artist Palette (bottom layer) -->
  <g transform="translate(50, 68)">
    <!-- Palette shadow (depth) -->
    <ellipse cx="1" cy="1" rx="20" ry="14" fill="#4a2d5f" opacity="0.3"/>

    <!-- Palette body -->
    <ellipse cx="0" cy="0" rx="20" ry="14" fill="#b088e0" opacity="0.9"/>

    <!-- Thumb hole -->
    <circle cx="-14" cy="0" r="3" fill="#4a2d5f" opacity="0.6"/>

    <!-- Color Wells (5 wells with glow) -->
    <!-- Top row -->
    <circle cx="-8" cy="-5" r="3" fill="#da9ef7"/>
    <circle cx="-8" cy="-5" r="4" fill="#da9ef7" opacity="0.3"/> <!-- glow -->

    <circle cx="0" cy="-7" r="3" fill="#c6a0f6"/>
    <circle cx="0" cy="-7" r="4" fill="#c6a0f6" opacity="0.3"/>

    <circle cx="8" cy="-5" r="3" fill="#a0c6f6"/>
    <circle cx="8" cy="-5" r="4" fill="#a0c6f6" opacity="0.3"/>

    <!-- Bottom row -->
    <circle cx="-5" cy="3" r="3" fill="#d0a0f6"/>
    <circle cx="-5" cy="3" r="4" fill="#d0a0f6" opacity="0.3"/>

    <circle cx="5" cy="3" r="3" fill="#e5d4ff"/>
    <circle cx="5" cy="3" r="4" fill="#e5d4ff" opacity="0.3"/>

    <!-- Shimmer highlights on wells -->
    <circle cx="-8" cy="-5" r="1" fill="white" opacity="0.6"/>
    <circle cx="0" cy="-7" r="1" fill="white" opacity="0.6"/>
    <circle cx="8" cy="-5" r="1" fill="white" opacity="0.6"/>
  </g>

  <!-- Flowing connections (wells to prism) -->
  <path d="M 50,61 Q 50,55 50,48" stroke="#c6a0f6" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 42,63 Q 45,55 48,48" stroke="#da9ef7" stroke-width="1" fill="none" opacity="0.4"/>
  <path d="M 58,63 Q 55,55 52,48" stroke="#a0c6f6" stroke-width="1" fill="none" opacity="0.4"/>

  <!-- Hexagonal Prism (center) -->
  <g transform="translate(50, 42)">
    <!-- Prism shadow -->
    <polygon points="0,-10 -8,-5 -8,5 0,10 8,5 8,-5" fill="#9b6dd8" opacity="0.3"/>

    <!-- Prism body -->
    <polygon points="0,-10 -8,-5 -8,5 0,10 8,5 8,-5"
             fill="#e5d4ff"
             opacity="0.8"
             stroke="#c6a0f6"
             stroke-width="1.5"/>

    <!-- Inner crystal structure -->
    <polygon points="0,-6 -4,-3 -4,3 0,6 4,3 4,-3" fill="white" opacity="0.5"/>
    <line x1="0" y1="-6" x2="0" y2="6" stroke="#c6a0f6" stroke-width="0.5" opacity="0.6"/>
    <line x1="-4" y1="-3" x2="4" y2="3" stroke="#c6a0f6" stroke-width="0.5" opacity="0.6"/>
    <line x1="-4" y1="3" x2="4" y2="-3" stroke="#c6a0f6" stroke-width="0.5" opacity="0.6"/>

    <!-- Crystal glow -->
    <polygon points="0,-10 -8,-5 -8,5 0,10 8,5 8,-5"
             fill="none"
             stroke="#da9ef7"
             stroke-width="2"
             opacity="0.3"/>
  </g>

  <!-- Refraction Rays (5 rays with varying opacity) -->
  <line x1="50" y1="32" x2="35" y2="15" stroke="#da9ef7" stroke-width="2" opacity="0.7" stroke-linecap="round"/>
  <line x1="50" y1="32" x2="43" y2="12" stroke="#c6a0f6" stroke-width="2" opacity="0.8" stroke-linecap="round"/>
  <line x1="50" y1="32" x2="50" y2="8" stroke="#e5d4ff" stroke-width="2.5" opacity="1.0" stroke-linecap="round"/>
  <line x1="50" y1="32" x2="57" y2="12" stroke="#a0c6f6" stroke-width="2" opacity="0.8" stroke-linecap="round"/>
  <line x1="50" y1="32" x2="65" y2="15" stroke="#d0a0f6" stroke-width="2" opacity="0.7" stroke-linecap="round"/>

  <!-- Ray endpoint glows -->
  <circle cx="35" cy="15" r="2" fill="#da9ef7" opacity="0.6"/>
  <circle cx="50" cy="8" r="2.5" fill="#e5d4ff" opacity="0.8"/>
  <circle cx="65" cy="15" r="2" fill="#d0a0f6" opacity="0.6"/>

  <!-- Alchemical Flask (top, simplified) -->
  <g transform="translate(50, 18)">
    <!-- Flask body -->
    <ellipse cx="0" cy="2" rx="5" ry="4" fill="#9b6dd8" opacity="0.7"/>

    <!-- Flask neck -->
    <rect x="-1.5" y="-6" width="3" height="8" rx="1.5" fill="#b088e0" opacity="0.7"/>

    <!-- Flask highlight -->
    <ellipse cx="-1" cy="1" rx="2" ry="2" fill="white" opacity="0.4"/>

    <!-- Vapor wisp -->
    <path d="M 0,-6 Q -2,-9 -1,-11" stroke="#e5d4ff" stroke-width="1.5" fill="none" opacity="0.5" stroke-linecap="round"/>
  </g>

  <!-- Nested transformation circles (compilation stages) -->
  <circle cx="50" cy="42" r="18" fill="none" stroke="#c6a0f6" stroke-width="0.5" opacity="0.3"/>
  <circle cx="50" cy="42" r="22" fill="none" stroke="#9b6dd8" stroke-width="0.5" opacity="0.2"/>
</svg>
```

**Design Balance:**
- Enough detail to show transformation process
- Not overwhelming at medium sizes (32x32px)
- Layers suggest depth without complex gradients
- Recognizable symbols with artistic flair

---

## IMAGINARIUM - DETAILED SVG (Complex, High Fidelity)

### Generation Prompt:

Create a richly detailed, ornamental icon depicting the complete alchemical transformation from artistic vision to executable mathematics. The composition features a detailed artist's palette at the bottom with 7 luminous color wells showing swirling liquid colors, each with micro shader code snippets visible in the wells. The palette feeds into an intricately faceted hexagonal prismatic crystal in the center, showing internal crystalline structure with multiple refraction planes and wavelength decomposition markers. Light refracts through the crystal into 7-9 colorful rays spreading upward, each labeled with tiny alchemical transformation symbols.

Above the prism floats a detailed alchemical alembic with visible distillation apparatus, dripping pure function essence drops. Flowing brush strokes on the left leave trails of mathematical equations (f(x), σ, ∂). On the right, a dendritic shader node tree shows branching parameter connections. The entire composition is surrounded by nested transformation circles indicating compilation stages, with subtle background patterns suggesting code structure.

**Full Color Palette Usage:**
- Primary: #c6a0f6 (ethereal violet core)
- Secondary: #9b6dd8 (deep lavender depth)
- Accent: #e5d4ff (pale lilac highlights)
- Shadow: #4a2d5f (transformation darkness)
- Midtone: #b088e0 (process luminescence)
- Highlight: #f8f0ff (transcendent white-violet)
- Complement: #d8f69b (yellow-green contrast accents)
- Analogous: #d0a0f6, #a0c6f6 (purple-blue harmony)
- Active: #da9ef7 (glowing transformation state)
- Warning: #ff8fd5 (unstable mixture pink)

**Symbolic Richness:**
- Palette wells as tunable parameters with swirling colors
- Brush strokes leaving mathematical residue
- Prismatic rays labeled with transformation operations
- Shader node trees showing dendritic branching
- Distillation drops of pure essence
- Color theory diagrams as micro-details
- Wavelength markers on refraction spectrum
- Transformation stage indicators on nested circles
- Alchemical symbols for operations (transmutation, refinement, distillation)

**Dendrovian Motifs:**
- Radiating transformation paths from central core branching into shader variants
- Nested circles showing progressive compilation stages
- Luminous wells as circular nodes containing parameter essence
- Spiral refinement patterns suggesting iterative processes
- Dendritic color bleeding spreading organically through connections
- Stratified depth with multiple transparency layers
- Branch motifs in shader node tree
- Circular focal centers at transformation points

**Texture & Ornamentation:**
- Iridescent shimmer on all liquid surfaces
- Soft gradient halos with multiple falloffs
- Crystalline refraction with light decomposition
- Smooth organic curves throughout
- Flowing light trails with particle effects
- Ethereal glow layers
- Fine ornamental details on all edges

**Composition:**
- Radial emanation from alchemical core
- Balanced asymmetry suggesting organic creative process
- Nested information layers showing depth
- Sacred geometry proportions (consider golden ratio)
- Multiple focal points guiding eye through transformation stages

**Detail Level:**
- Fine details visible at 64x64px and larger
- Maximum symbolic richness
- Complex path work
- Multiple transparency layers
- Rich ornamentation without cluttering core message

### Technical Specifications:
- **Canvas:** 100x100 viewBox with 8-unit padding (complex interior: 84x84)
- **Colors (Full Palette - 10+ colors):**
  - #c6a0f6, #9b6dd8, #e5d4ff, #4a2d5f, #b088e0, #f8f0ff
  - #d8f69b, #d0a0f6, #a0c6f6, #da9ef7, #ff8fd5
- **Key Elements:**
  - Palette with 7 swirling wells
  - Faceted hexagonal prism with internal structure
  - Alchemical alembic with distillation apparatus
  - 7-9 labeled refraction rays
  - Flowing brush with equation trails
  - Dendritic shader node tree
  - Nested transformation circles (3-4 layers)
  - Background code structure patterns
  - Micro-details: code snippets, symbols, markers
- **Complexity:** High - Multiple layers, rich detail, complex paths, fine ornamental elements

### SVG Pseudocode:

```xml
<svg viewBox="0 0 100 100">
  <!-- Background code structure pattern (subtle) -->
  <g opacity="0.05">
    <line x1="10" y1="20" x2="90" y2="20" stroke="#c6a0f6" stroke-width="0.5"/>
    <line x1="10" y1="40" x2="90" y2="40" stroke="#c6a0f6" stroke-width="0.5"/>
    <line x1="10" y1="60" x2="90" y2="60" stroke="#c6a0f6" stroke-width="0.5"/>
    <line x1="10" y1="80" x2="90" y2="80" stroke="#c6a0f6" stroke-width="0.5"/>
    <!-- (vertical lines too) -->
  </g>

  <!-- Outermost transformation circle (compilation boundary) -->
  <circle cx="50" cy="50" r="46" fill="none" stroke="#9b6dd8" stroke-width="0.3" opacity="0.15" stroke-dasharray="3,3"/>

  <!-- Third nested circle -->
  <circle cx="50" cy="50" r="42" fill="none" stroke="#c6a0f6" stroke-width="0.5" opacity="0.25"/>

  <!-- Second nested circle -->
  <circle cx="50" cy="50" r="36" fill="none" stroke="#da9ef7" stroke-width="0.5" opacity="0.35"/>

  <!-- Innermost transformation circle -->
  <circle cx="50" cy="50" r="28" fill="none" stroke="#e5d4ff" stroke-width="0.5" opacity="0.45"/>

  <!-- Background radial glow (multi-layer atmosphere) -->
  <radialGradient id="atmosphereDeep">
    <stop offset="0%" stop-color="#da9ef7" stop-opacity="0.2"/>
    <stop offset="50%" stop-color="#c6a0f6" stop-opacity="0.1"/>
    <stop offset="100%" stop-color="#4a2d5f" stop-opacity="0"/>
  </radialGradient>
  <circle cx="50" cy="50" r="38" fill="url(#atmosphereDeep)"/>

  <!-- Artist Palette (bottom layer, detailed) -->
  <g transform="translate(50, 70) rotate(12)">
    <!-- Palette drop shadow (depth) -->
    <ellipse cx="2" cy="2" rx="24" ry="17" fill="#4a2d5f" opacity="0.4" filter="blur(2)"/>

    <!-- Palette body (organic shape) -->
    <ellipse cx="0" cy="0" rx="24" ry="17" fill="#b088e0" opacity="0.95"/>

    <!-- Palette edge highlight (3D form) -->
    <ellipse cx="-5" cy="-4" rx="20" ry="14" fill="none" stroke="#e5d4ff" stroke-width="0.5" opacity="0.3"/>

    <!-- Thumb hole with depth -->
    <circle cx="-17" cy="0" r="4" fill="#4a2d5f" opacity="0.8"/>
    <circle cx="-17.5" cy="-0.5" r="3.5" fill="#9b6dd8" opacity="0.6"/>

    <!-- Color Wells (7 wells with swirling colors and micro details) -->
    <!-- Top row (3 wells) -->
    <g>
      <!-- Well 1: violet -->
      <circle cx="-10" cy="-7" r="3.5" fill="url(#wellGrad1)"/>
      <circle cx="-10" cy="-7" r="4.5" fill="#da9ef7" opacity="0.2"/> <!-- glow -->
      <path d="M -11,-7 Q -10,-6 -9,-7" stroke="white" stroke-width="0.3" opacity="0.6"/> <!-- swirl -->
      <text x="-10" y="-6.5" font-size="1.5" fill="#4a2d5f" text-anchor="middle" opacity="0.5">f</text>

      <!-- Well 2: lavender center -->
      <circle cx="0" cy="-9" r="3.5" fill="url(#wellGrad2)"/>
      <circle cx="0" cy="-9" r="4.5" fill="#c6a0f6" opacity="0.2"/>
      <path d="M -1,-9 Q 0,-8 1,-9" stroke="white" stroke-width="0.3" opacity="0.6"/>
      <text x="0" y="-8.5" font-size="1.5" fill="#4a2d5f" text-anchor="middle" opacity="0.5">x</text>

      <!-- Well 3: blue -->
      <circle cx="10" cy="-7" r="3.5" fill="url(#wellGrad3)"/>
      <circle cx="10" cy="-7" r="4.5" fill="#a0c6f6" opacity="0.2"/>
      <path d="M 9,-7 Q 10,-6 11,-7" stroke="white" stroke-width="0.3" opacity="0.6"/>
      <text x="10" y="-6.5" font-size="1.5" fill="#4a2d5f" text-anchor="middle" opacity="0.5">σ</text>
    </g>

    <!-- Middle row (2 wells) -->
    <g>
      <!-- Well 4: purple harmony -->
      <circle cx="-7" cy="0" r="3.5" fill="url(#wellGrad4)"/>
      <circle cx="-7" cy="0" r="4.5" fill="#d0a0f6" opacity="0.2"/>
      <path d="M -8,0 Q -7,1 -6,0" stroke="white" stroke-width="0.3" opacity="0.6"/>
      <text x="-7" y="0.5" font-size="1.5" fill="#4a2d5f" text-anchor="middle" opacity="0.5">∂</text>

      <!-- Well 5: lilac -->
      <circle cx="7" cy="0" r="3.5" fill="url(#wellGrad5)"/>
      <circle cx="7" cy="0" r="4.5" fill="#e5d4ff" opacity="0.2"/>
      <path d="M 6,0 Q 7,1 8,0" stroke="white" stroke-width="0.3" opacity="0.6"/>
      <text x="7" y="0.5" font-size="1.5" fill="#4a2d5f" text-anchor="middle" opacity="0.5">λ</text>
    </g>

    <!-- Bottom row (2 wells) -->
    <g>
      <!-- Well 6: glow violet -->
      <circle cx="-5" cy="7" r="3.5" fill="url(#wellGrad6)"/>
      <circle cx="-5" cy="7" r="4.5" fill="#da9ef7" opacity="0.2"/>
      <path d="M -6,7 Q -5,8 -4,7" stroke="white" stroke-width="0.3" opacity="0.6"/>
      <text x="-5" y="7.5" font-size="1.5" fill="#4a2d5f" text-anchor="middle" opacity="0.5">θ</text>

      <!-- Well 7: pink unstable -->
      <circle cx="5" cy="7" r="3.5" fill="url(#wellGrad7)"/>
      <circle cx="5" cy="7" r="4.5" fill="#ff8fd5" opacity="0.2"/>
      <path d="M 4,7 Q 5,8 6,7" stroke="white" stroke-width="0.3" opacity="0.6"/>
      <text x="5" y="7.5" font-size="1.5" fill="#4a2d5f" text-anchor="middle" opacity="0.5">π</text>
    </g>

    <!-- Shimmer highlights on all wells (iridescence) -->
    <circle cx="-10" cy="-7" r="1" fill="white" opacity="0.7"/>
    <circle cx="0" cy="-9" r="1" fill="white" opacity="0.7"/>
    <circle cx="10" cy="-7" r="1" fill="white" opacity="0.7"/>
    <circle cx="-7" cy="0" r="1" fill="white" opacity="0.7"/>
    <circle cx="7" cy="0" r="1" fill="white" opacity="0.7"/>
    <circle cx="-5" cy="7" r="1" fill="white" opacity="0.7"/>
    <circle cx="5" cy="7" r="1" fill="white" opacity="0.7"/>

    <!-- Palette texture (wood grain suggestion) -->
    <ellipse cx="0" cy="0" rx="24" ry="17" fill="url(#paletteTexture)" opacity="0.1"/>
  </g>

  <!-- Flowing connections (wells to prism, multiple paths) -->
  <path d="M 50,63 Q 48,56 48,48" stroke="url(#flowGrad1)" stroke-width="1.5" fill="none" opacity="0.6"/>
  <path d="M 40,63 Q 44,56 47,48" stroke="url(#flowGrad2)" stroke-width="1.2" fill="none" opacity="0.5"/>
  <path d="M 60,63 Q 56,56 53,48" stroke="url(#flowGrad3)" stroke-width="1.2" fill="none" opacity="0.5"/>
  <path d="M 43,70 Q 46,58 48,50" stroke="url(#flowGrad4)" stroke-width="1" fill="none" opacity="0.4"/>
  <path d="M 57,70 Q 54,58 52,50" stroke="url(#flowGrad5)" stroke-width="1" fill="none" opacity="0.4"/>

  <!-- Hexagonal Prismatic Crystal (center, faceted) -->
  <g transform="translate(50, 42)">
    <!-- Prism drop shadow -->
    <polygon points="0,-12 -10,-6 -10,6 0,12 10,6 10,-6" fill="#4a2d5f" opacity="0.3" filter="blur(2)"/>

    <!-- Prism body (main crystal) -->
    <polygon points="0,-12 -10,-6 -10,6 0,12 10,6 10,-6"
             fill="url(#prismBodyGrad)"
             opacity="0.9"
             stroke="#c6a0f6"
             stroke-width="2"/>

    <!-- Inner crystalline facets (complex geometry) -->
    <polygon points="0,-8 -6,-4 -6,4 0,8 6,4 6,-4" fill="white" opacity="0.6"/>
    <polygon points="0,-6 -4,-3 -4,3 0,6 4,3 4,-3" fill="url(#innerCrystal)" opacity="0.5"/>

    <!-- Refraction planes -->
    <line x1="0" y1="-12" x2="0" y2="12" stroke="#e5d4ff" stroke-width="0.5" opacity="0.7"/>
    <line x1="-10" y1="-6" x2="10" y2="6" stroke="#e5d4ff" stroke-width="0.5" opacity="0.5"/>
    <line x1="-10" y1="6" x2="10" y2="-6" stroke="#e5d4ff" stroke-width="0.5" opacity="0.5"/>
    <line x1="-10" y1="-6" x2="0" y2="0" stroke="#a0c6f6" stroke-width="0.3" opacity="0.6"/>
    <line x1="10" y1="-6" x2="0" y2="0" stroke="#a0c6f6" stroke-width="0.3" opacity="0.6"/>

    <!-- Wavelength decomposition markers (tiny ticks on edges) -->
    <circle cx="-5" cy="-9" r="0.5" fill="#da9ef7" opacity="0.8"/>
    <circle cx="0" cy="-12" r="0.5" fill="#c6a0f6" opacity="0.8"/>
    <circle cx="5" cy="-9" r="0.5" fill="#a0c6f6" opacity="0.8"/>

    <!-- Prism edge highlights (3D form) -->
    <line x1="0" y1="-12" x2="-10" y2="-6" stroke="#f8f0ff" stroke-width="1" opacity="0.4"/>
    <line x1="0" y1="-12" x2="10" y2="-6" stroke="#f8f0ff" stroke-width="1" opacity="0.4"/>

    <!-- Crystal glow (outer halo) -->
    <polygon points="0,-12 -10,-6 -10,6 0,12 10,6 10,-6"
             fill="none"
             stroke="#da9ef7"
             stroke-width="3"
             opacity="0.25"/>

    <!-- Transformation symbols on crystal faces -->
    <text x="-6" y="0" font-size="2" fill="#4a2d5f" opacity="0.4">🜃</text> <!-- alchemical symbol -->
    <text x="4" y="0" font-size="2" fill="#4a2d5f" opacity="0.4">🜄</text>
  </g>

  <!-- Refraction Rays (7-9 rays with labels and varying properties) -->
  <g>
    <!-- Far left ray -->
    <line x1="50" y1="30" x2="28" y2="10" stroke="#da9ef7" stroke-width="2.5" opacity="0.7" stroke-linecap="round"/>
    <circle cx="28" cy="10" r="2" fill="#da9ef7" opacity="0.6"/>
    <text x="26" y="8" font-size="2" fill="#da9ef7" opacity="0.6">🜁</text>

    <!-- Left rays -->
    <line x1="50" y1="30" x2="35" y2="12" stroke="#c6a0f6" stroke-width="2.5" opacity="0.75" stroke-linecap="round"/>
    <circle cx="35" cy="12" r="1.5" fill="#c6a0f6" opacity="0.7"/>

    <line x1="50" y1="30" x2="42" y2="10" stroke="#d0a0f6" stroke-width="2" opacity="0.8" stroke-linecap="round"/>
    <circle cx="42" cy="10" r="1.5" fill="#d0a0f6" opacity="0.7"/>

    <!-- Center ray (brightest) -->
    <line x1="50" y1="30" x2="50" y2="6" stroke="#e5d4ff" stroke-width="3" opacity="1.0" stroke-linecap="round"/>
    <circle cx="50" cy="6" r="2.5" fill="#e5d4ff" opacity="0.9"/>
    <circle cx="50" cy="6" r="4" fill="#f8f0ff" opacity="0.3"/> <!-- extra glow -->
    <text x="50" y="4" font-size="2.5" fill="#4a2d5f" text-anchor="middle" opacity="0.7">✦</text>

    <!-- Right rays -->
    <line x1="50" y1="30" x2="58" y2="10" stroke="#a0c6f6" stroke-width="2" opacity="0.8" stroke-linecap="round"/>
    <circle cx="58" cy="10" r="1.5" fill="#a0c6f6" opacity="0.7"/>

    <line x1="50" y1="30" x2="65" y2="12" stroke="#9b6dd8" stroke-width="2.5" opacity="0.75" stroke-linecap="round"/>
    <circle cx="65" cy="12" r="1.5" fill="#9b6dd8" opacity="0.7"/>

    <!-- Far right ray -->
    <line x1="50" y1="30" x2="72" y2="10" stroke="#ff8fd5" stroke-width="2.5" opacity="0.7" stroke-linecap="round"/>
    <circle cx="72" cy="10" r="2" fill="#ff8fd5" opacity="0.6"/>
    <text x="74" y="8" font-size="2" fill="#ff8fd5" opacity="0.6">🜂</text>

    <!-- Additional subtle rays (light leakage) -->
    <line x1="50" y1="30" x2="22" y2="14" stroke="#b088e0" stroke-width="1" opacity="0.3" stroke-linecap="round"/>
    <line x1="50" y1="30" x2="78" y2="14" stroke="#b088e0" stroke-width="1" opacity="0.3" stroke-linecap="round"/>
  </g>

  <!-- Alchemical Alembic (top, detailed apparatus) -->
  <g transform="translate(50, 16)">
    <!-- Alembic drop shadow -->
    <ellipse cx="1" cy="3" rx="7" ry="5" fill="#4a2d5f" opacity="0.3" filter="blur(1)"/>

    <!-- Alembic body (rounded flask) -->
    <ellipse cx="0" cy="2" rx="6" ry="5" fill="#9b6dd8" opacity="0.85"/>

    <!-- Alembic highlight (3D form) -->
    <ellipse cx="-1.5" cy="0.5" rx="3" ry="2.5" fill="white" opacity="0.3"/>

    <!-- Alembic neck (distillation tube) -->
    <rect x="-1.5" y="-8" width="3" height="10" rx="1.5" fill="#b088e0" opacity="0.85"/>

    <!-- Neck highlight -->
    <rect x="-1" y="-7" width="1" height="8" rx="0.5" fill="white" opacity="0.2"/>

    <!-- Vapor trails (multiple wisps) -->
    <path d="M 0,-8 Q -2,-11 -1.5,-14 Q -1,-16 -0.5,-18"
          stroke="#e5d4ff"
          stroke-width="1.5"
          fill="none"
          opacity="0.6"
          stroke-linecap="round"/>
    <path d="M 0,-8 Q 1,-10 0.5,-13 Q 0,-15 0,-17"
          stroke="#f8f0ff"
          stroke-width="1.2"
          fill="none"
          opacity="0.5"
          stroke-linecap="round"/>
    <path d="M 0,-8 Q 2,-10 1.5,-12"
          stroke="#c6a0f6"
          stroke-width="1"
          fill="none"
          opacity="0.4"
          stroke-linecap="round"/>

    <!-- Distillation drops (pure essence) -->
    <circle cx="0" cy="8" r="1.5" fill="#da9ef7" opacity="0.9"/>
    <circle cx="0" cy="8" r="2.5" fill="#da9ef7" opacity="0.3"/> <!-- glow -->

    <circle cx="-0.5" cy="11" r="1.2" fill="#c6a0f6" opacity="0.8"/>
    <circle cx="0.5" cy="13" r="1" fill="#e5d4ff" opacity="0.7"/>

    <!-- Alchemical symbol on flask -->
    <text x="0" y="3" font-size="2.5" fill="#4a2d5f" text-anchor="middle" opacity="0.5">🜔</text>
  </g>

  <!-- Flowing Brush (left side, detailed with equation trail) -->
  <g transform="translate(22, 48) rotate(-35)">
    <!-- Brush handle (wood texture suggestion) -->
    <rect x="-1.5" y="-15" width="3" height="22" rx="1.5" fill="#6b7280" opacity="0.9"/>
    <rect x="-1" y="-15" width="1" height="22" rx="0.5" fill="#9ca3af" opacity="0.3"/> <!-- highlight -->

    <!-- Brush ferrule (metal band) -->
    <rect x="-2" y="5" width="4" height="3" fill="#d1d5db" opacity="0.8"/>
    <line x1="-2" y1="6" x2="2" y2="6" stroke="#374151" stroke-width="0.3" opacity="0.6"/>

    <!-- Brush bristles (splayed) -->
    <ellipse cx="0" cy="10" rx="3.5" ry="6" fill="#c6a0f6" opacity="0.8"/>
    <ellipse cx="0" cy="10" rx="2.5" ry="5" fill="#da9ef7" opacity="0.6"/>

    <!-- Individual bristle details -->
    <line x1="-2" y1="12" x2="-2.5" y2="16" stroke="#9b6dd8" stroke-width="0.5" opacity="0.7"/>
    <line x1="0" y1="13" x2="0" y2="17" stroke="#c6a0f6" stroke-width="0.5" opacity="0.7"/>
    <line x1="2" y1="12" x2="2.5" y2="16" stroke="#da9ef7" stroke-width="0.5" opacity="0.7"/>

    <!-- Paint drips -->
    <circle cx="0" cy="16" r="0.8" fill="#da9ef7" opacity="0.7"/>

    <!-- Equation trail (mathematical residue) -->
    <g transform="translate(8, -5)">
      <text x="0" y="0" font-size="3.5" fill="#e5d4ff" opacity="0.6" font-family="serif" font-style="italic">f(x)</text>
      <text x="8" y="3" font-size="3" fill="#c6a0f6" opacity="0.5" font-family="serif">σ</text>
      <text x="2" y="8" font-size="2.5" fill="#b088e0" opacity="0.4" font-family="serif">∂y</text>
      <text x="10" y="10" font-size="2" fill="#9b6dd8" opacity="0.3" font-family="serif">dx</text>

      <!-- Equation connectors (flowing math) -->
      <path d="M 3,1 Q 6,4 9,5" stroke="#c6a0f6" stroke-width="0.3" opacity="0.3" fill="none"/>
    </g>
  </g>

  <!-- Dendritic Shader Node Tree (right side, complex branching) -->
  <g transform="translate(78, 48)">
    <!-- Root node (main shader) -->
    <circle cx="0" cy="0" r="3" fill="#c6a0f6" opacity="0.9" stroke="#e5d4ff" stroke-width="0.5"/>
    <circle cx="0" cy="0" r="4" fill="#c6a0f6" opacity="0.2"/> <!-- glow -->
    <text x="0" y="1" font-size="2" fill="#f8f0ff" text-anchor="middle" opacity="0.8">S</text>

    <!-- Primary branches (parameter groups) -->
    <line x1="0" y1="0" x2="-8" y2="-10" stroke="#9b6dd8" stroke-width="1.5" opacity="0.7"/>
    <line x1="0" y1="0" x2="-6" y2="10" stroke="#9b6dd8" stroke-width="1.5" opacity="0.7"/>

    <!-- Branch 1: Top left -->
    <circle cx="-8" cy="-10" r="2.5" fill="#d0a0f6" opacity="0.8" stroke="#e5d4ff" stroke-width="0.3"/>
    <text x="-8" y="-9" font-size="1.5" fill="#f8f0ff" text-anchor="middle" opacity="0.7">P</text>

    <!-- Branch 1 sub-nodes -->
    <line x1="-8" y1="-10" x2="-12" y2="-16" stroke="#9b6dd8" stroke-width="0.8" opacity="0.6"/>
    <line x1="-8" y1="-10" x2="-14" y2="-8" stroke="#9b6dd8" stroke-width="0.8" opacity="0.6"/>

    <circle cx="-12" cy="-16" r="1.5" fill="#a0c6f6" opacity="0.7"/>
    <circle cx="-14" cy="-8" r="1.5" fill="#e5d4ff" opacity="0.7"/>

    <!-- Branch 2: Bottom left -->
    <circle cx="-6" cy="10" r="2.5" fill="#da9ef7" opacity="0.8" stroke="#e5d4ff" stroke-width="0.3"/>
    <text x="-6" y="11" font-size="1.5" fill="#f8f0ff" text-anchor="middle" opacity="0.7">C</text>

    <!-- Branch 2 sub-nodes -->
    <line x1="-6" y1="10" x2="-10" y2="16" stroke="#9b6dd8" stroke-width="0.8" opacity="0.6"/>
    <line x1="-6" y1="10" x2="-12" y2="12" stroke="#9b6dd8" stroke-width="0.8" opacity="0.6"/>
    <line x1="-6" y1="10" x2="-8" y2="8" stroke="#9b6dd8" stroke-width="0.8" opacity="0.6"/>

    <circle cx="-10" cy="16" r="1.5" fill="#ff8fd5" opacity="0.7"/>
    <circle cx="-12" cy="12" r="1.5" fill="#d0a0f6" opacity="0.7"/>
    <circle cx="-8" cy="8" r="1.5" fill="#a0c6f6" opacity="0.7"/>

    <!-- Connection flow indicators (data flowing) -->
    <circle cx="-4" cy="-5" r="0.5" fill="#da9ef7" opacity="0.6">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="-3" cy="5" r="0.5" fill="#c6a0f6" opacity="0.6">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite"/>
    </circle>
  </g>

  <!-- Transformation stage indicators (on nested circles) -->
  <g opacity="0.6">
    <text x="50" y="22" font-size="2" fill="#e5d4ff" text-anchor="middle" opacity="0.5">input</text>
    <text x="15" y="50" font-size="2" fill="#c6a0f6" text-anchor="middle" opacity="0.5">transform</text>
    <text x="85" y="50" font-size="2" fill="#c6a0f6" text-anchor="middle" opacity="0.5">compile</text>
    <text x="50" y="85" font-size="2" fill="#da9ef7" text-anchor="middle" opacity="0.5">execute</text>
  </g>

  <!-- Gradient and Pattern Definitions -->
  <defs>
    <!-- Well gradients (swirling colors) -->
    <radialGradient id="wellGrad1">
      <stop offset="0%" stop-color="#f8f0ff"/>
      <stop offset="30%" stop-color="#da9ef7"/>
      <stop offset="100%" stop-color="#9b6dd8"/>
    </radialGradient>
    <radialGradient id="wellGrad2">
      <stop offset="0%" stop-color="#e5d4ff"/>
      <stop offset="30%" stop-color="#c6a0f6"/>
      <stop offset="100%" stop-color="#9b6dd8"/>
    </radialGradient>
    <radialGradient id="wellGrad3">
      <stop offset="0%" stop-color="#c8e0ff"/>
      <stop offset="30%" stop-color="#a0c6f6"/>
      <stop offset="100%" stop-color="#5a8dd8"/>
    </radialGradient>
    <radialGradient id="wellGrad4">
      <stop offset="0%" stop-color="#f8f0ff"/>
      <stop offset="30%" stop-color="#d0a0f6"/>
      <stop offset="100%" stop-color="#9b6dd8"/>
    </radialGradient>
    <radialGradient id="wellGrad5">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="30%" stop-color="#e5d4ff"/>
      <stop offset="100%" stop-color="#c6a0f6"/>
    </radialGradient>
    <radialGradient id="wellGrad6">
      <stop offset="0%" stop-color="#f8f0ff"/>
      <stop offset="30%" stop-color="#da9ef7"/>
      <stop offset="100%" stop-color="#c6a0f6"/>
    </radialGradient>
    <radialGradient id="wellGrad7">
      <stop offset="0%" stop-color="#fff0f8"/>
      <stop offset="30%" stop-color="#ff8fd5"/>
      <stop offset="100%" stop-color="#c6a0f6"/>
    </radialGradient>

    <!-- Prism body gradient -->
    <linearGradient id="prismBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8f0ff" stop-opacity="0.95"/>
      <stop offset="30%" stop-color="#e5d4ff" stop-opacity="0.9"/>
      <stop offset="70%" stop-color="#c6a0f6" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#9b6dd8" stop-opacity="0.8"/>
    </linearGradient>

    <!-- Inner crystal gradient -->
    <radialGradient id="innerCrystal">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#e5d4ff" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#c6a0f6" stop-opacity="0.4"/>
    </radialGradient>

    <!-- Flow connection gradients -->
    <linearGradient id="flowGrad1" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#b088e0" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#e5d4ff" stop-opacity="0.8"/>
    </linearGradient>
    <linearGradient id="flowGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#da9ef7" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#c6a0f6" stop-opacity="0.7"/>
    </linearGradient>
    <linearGradient id="flowGrad3" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#a0c6f6" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#c6a0f6" stop-opacity="0.7"/>
    </linearGradient>
    <linearGradient id="flowGrad4" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#d0a0f6" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#e5d4ff" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="flowGrad5" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#ff8fd5" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#da9ef7" stop-opacity="0.6"/>
    </linearGradient>

    <!-- Palette texture pattern -->
    <pattern id="paletteTexture" width="4" height="4" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="4" y2="4" stroke="#4a2d5f" stroke-width="0.3" opacity="0.2"/>
      <line x1="4" y1="0" x2="0" y2="4" stroke="#4a2d5f" stroke-width="0.3" opacity="0.2"/>
    </pattern>

    <!-- Filters -->
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1"/>
    </filter>
  </defs>
</svg>
```

**Extreme Detail Layer Structure:**
1. Background code structure pattern (context)
2. Four nested transformation circles (compilation stages)
3. Multi-layer radial glow (atmospheric depth)
4. Detailed artist palette with 7 swirling wells containing micro symbols
5. Flowing connections from wells to prism (5 paths)
6. Faceted hexagonal prism with internal structure and refraction planes
7. 7-9 labeled refraction rays with varying properties
8. Detailed alchemical alembic with vapor trails and distillation drops
9. Flowing brush with equation trail (left ornamentation)
10. Complex dendritic shader node tree (right ornamentation)
11. Transformation stage text labels
12. Multiple gradient and pattern definitions
13. Animated elements (subtle pulsing on connection flows)

**Symbolism at Maximum Density:**
- Every well contains swirling color (tunable parameters)
- Micro symbols in wells represent mathematical operations
- Prismatic facets show light decomposition process
- Wavelength markers on prism edges
- Alchemical symbols on crystal faces and rays
- Equation trails show mathematical residue from artistic process
- Shader node tree demonstrates procedural branching
- Nested circles map compilation stages
- Distillation drops represent pure extracted essence
- Background pattern suggests underlying code structure

---

## SUMMARY

These four fidelity levels provide complete coverage for IMAGINARIUM iconography:

1. **EMOJI-GRADE**: Maximum detail for high-resolution contexts, app icons, splash screens
2. **SIMPLE SVG**: Clean, minimal icon for toolbars, buttons, UI elements at small sizes (16x16px)
3. **MEDIUM SVG**: Balanced detail for medium contexts, documentation, tooltips (32x32px)
4. **DETAILED SVG**: Rich symbolic icon for hero displays, detailed views, artistic contexts (64x64px+)

Each level maintains the **IMAGINARIUM** identity:
- Ethereal violet color palette (#c6a0f6 family)
- Alchemical transformation symbolism (palette → prism → rays)
- Radial emanation composition
- Iridescent, flowing aesthetic
- Procedural/mathematical essence
- Dendrovian cohesive motifs (nested circles, branching, luminous nodes)

All prompts are ready for AI image generation or manual SVG creation. The SVG pseudocode provides structural guidance for implementation.
