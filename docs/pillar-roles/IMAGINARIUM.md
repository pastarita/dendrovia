# IMAGINARIUM: The Dream Forge
**Technical Role:** Technical Artist / AI Pipeline Engineer / Python Specialist
**Primary Mandate:** "Distill Hallucination into Determinism."

## 1. Domain of Concern
The Imaginarium builds the factory that builds the art. It operates primarily at *Build Time* (or "Install Time"), not Runtime. Its goal is to take high-level prompts and raw code metrics and convert them into optimized assets.

### Core Responsibilities
*   **The Distillation Pipeline:** Creating the `bun run pipeline` scripts that chain together:
    1.  **Inspiration:** Scrapes/Retrieves reference imagery.
    2.  **Generation:** Calls Stable Diffusion/Flux/Midjourney APIs to generate concept art.
    3.  **Extraction:** Uses Computer Vision to extract color palettes, noise patterns, and texture maps from the concepts.
    4.  **Baking:** Converts these into GLBs, Compressed Textures (KTX2), and Shader Code.
*   **Procedural Generation Scripts:** Writing the L-System grammars that dictate how the Dendrite grows based on code complexity.
*   **The Asset Registry:** Managing the JSON manifest that maps `BugType: "MemoryLeak"` to `Model: "slime_green.glb"`.

## 2. Technical Stack & Boundaries
*   **Languages:** TypeScript (Pipeline orchestration), Python (AI/ML interplay if needed), Node/Bun (Scripting).
*   **Tools:** Stable Diffusion API, OpenAI API, Blender (headless via Python), Sharp (Image processing).

### Separation of Concerns
*   **Output:** Produces static files in `/public/assets` and generated TypeScript config files.
*   **RESTRICTION:** The Imaginarium **never** runs during the game loop. If the game hitches because it's generating an image, you have failed. All assets must be pre-baked or streamed asynchronously.

## 3. Shared Governance
*   **With Chronos:** Chronos provides the *Keywords* (e.g., "Rusty," "Complex," "Legacy"). Imaginarium translates these keywords into visual parameters (Rust textures, Twisted geometry, Cobwebs).