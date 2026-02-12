# IMAGINARIUM - The Compiler

> **Philosophy:** "Curated Determinism - The AI generates a 'Seed Palette,' then the engine applies it procedurally. We don't generate 1000 textures; we generate 1 'Style Sheet.'"

## Responsibility

IMAGINARIUM is the **Procedural Distillation Pipeline** - the core innovation of Dendrovia:

1. **AI Art Generation** - Create concept art from codebase metadata
2. **Mathematical Distillation** - Extract SDFs, noise functions, color palettes
3. **Shader Compilation** - Generate GLSL/WGSL code
4. **Deterministic Caching** - Ensure reproducible builds

## The Distillation Process

```
CHRONOS topology.json
        ↓
Prompt Generator → "Twisted TypeScript tree, cyberpunk aesthetic"
        ↓
AI Art API (Stable Diffusion / Flux) → concept.png
        ↓
Distillation Engine:
  ├─ Color Extractor → palette.json
  ├─ Shape Analyzer → sdf_parameters.json
  └─ Noise Profiler → noise_config.json
        ↓
Shader Generator → dendrite.glsl
        ↓
ARCHITECTUS (runtime)
```

## Output Artifacts

- `generated/palettes/{hash}.json` - Color schemes
- `generated/shaders/{hash}.glsl` - SDF shaders
- `generated/noise/{hash}.json` - Procedural noise configs
- `generated/lsystems/{hash}.json` - L-System rules
- `generated/manifest.json` - Asset registry

## Cognitive Boundaries

**Dependencies:**
- CHRONOS (reads topology.json)

**Consumers:**
- ARCHITECTUS (loads shaders at runtime)
- OPERATUS (serves assets)

**Interface:**
- Emits `GameEvents.SHADERS_COMPILED` when distillation completes
- Runs at **build-time** (not in the browser)

## Steering Heuristic

> "Never block the user's entry on generation. Provide a 'Default Beautiful' fallback immediately, and stream in the 'AI Customized' assets as they complete."

## Key Philosophies

### 1. Hallucination as Feature

**Insight:** AI "hallucinations" are "surrealist interpretations."

If the AI generates a "Green Slime" for a memory leak, that's valid poetic expression. We're not simulating reality; we're visualizing feeling.

### 2. Mood Board, Not Blueprint

The "Inspiration Feed" generates a **style guide**, not exact geometry:
- Lighting temperature (warm/cool)
- Color grading rules
- Material properties (metallic/organic)
- Animation pacing (slow/frenetic)

### 3. Deterministic Generation

**Challenge:** AI APIs are non-deterministic.

**Solution:**
```typescript
async function generateConcept(prompt: string, seed: number) {
  const cacheKey = hash({ prompt, seed });

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey); // Cached response
  }

  const result = await callAI(prompt, { seed });
  cache.set(cacheKey, result);
  return result;
}
```

### 4. Macro-SDF, Micro-Mesh

**Architecture Decision:**
- Use SDFs for **static dendrite structure** (infinite detail, no geometry)
- Use **instanced meshes** for dynamic elements (bugs, leaves, particles)

This balances aesthetic with performance.

## Implementation Status

- [x] Color palette generator (deterministic HSL extraction)
- [ ] AI API integration (Stable Diffusion / Flux)
- [ ] SDF distillation engine
- [ ] Noise function generator
- [ ] L-System compiler
- [ ] Shader template system
- [ ] Caching layer

## Distillation Techniques

### Color Extraction

```typescript
// Extract dominant colors from AI-generated image
function extractPalette(imageData: ImageData): ProceduralPalette {
  // K-means clustering on pixel colors
  const clusters = kMeans(imageData, k=5);

  return {
    primary: clusters[0],
    secondary: clusters[1],
    accent: clusters[2],
    background: mostCommon(imageData),
    glow: brightest(clusters),
    mood: colorTemperature(clusters) > 0.5 ? 'warm' : 'cool'
  };
}
```

### SDF Generation

**Approach:** Convert visual shapes to mathematical primitives

1. Edge detection on concept art
2. Fit geometric primitives (spheres, cylinders, tori)
3. Generate GLSL `sdf()` function
4. Tune parameters for artistic effect

### Fallback Strategy

If AI generation fails:
1. Use **language-based defaults** (TypeScript = blue, Rust = orange)
2. Apply **golden ratio** color distribution
3. Generate **simple geometric SDFs** (cylinders, cones)

## Future Enhancements

- [ ] Local AI model support (Ollama, ComfyUI)
- [ ] Real-time regeneration (dev mode)
- [ ] Style transfer between codebases
- [ ] Custom art prompts (user overrides)
