# ARCHITECTUS: The Reality Engine
**Technical Role:** Graphics Engineer / Systems Architect / Shader Wizard
**Primary Mandate:** "Render the Truth without Fog."

## 1. Domain of Concern
The Architectus is solely responsible for the visual representation of the world. It does *not* decide *what* to render (that is Ludus/Chronos) or *how* it looks artistically (that is Imaginarium), but *how* it is drawn to the screen performantly.

### Core Responsibilities
*   **The Dendrite Renderer:** Implementing the Signed Distance Field (SDF) and Raymarching algorithms to render infinite, procedural branching structures based on mathematical topology.
*   **The Performance Budget:** Maintaining 60 FPS on target hardware (including integrated GPUs). This involves strict polygon budgeting, draw call batching, and instanced mesh management.
*   **WebGPU Implementation:** Managing the `device`, `queue`, and compute shaders. Providing a WebGL2 fallback for older devices.
*   **The Camera Controller:** Implementing the "Ant on a Manifold" physics. The camera must stick to the dendrite surface, handle gimbal lock on arbitrary gravity vectors, and transition smoothly between "Surface View" and "Falcon Mode."

## 2. Technical Stack & Boundaries
*   **Primary Framework:** React Three Fiber (R3F) / Three.js.
*   **Shaders:** WGSL (WebGPU) and GLSL (WebGL).
*   **Math:** `dendro-math` package (Quaternions, SDF primitives).

### Separation of Concerns
*   **Input:** Receives `WorldState` (positions of entities) from *Ludus*.
*   **Input:** Receives `AssetManifest` (textures/models) from *Imaginarium*.
*   **Output:** Renders pixels to the `<Canvas>`.
*   **RESTRICTION:** The Architectus **never** calculates game logic (e.g., "Did the spell hit?"). It only visualizes the result ("Play hit animation").

## 3. Shared Governance
*   **With Imaginarium:** You define the *Material Interface* (e.g., `Uniforms: { uRoughness, uColor }`). Imaginarium provides the values.
*   **With Oculus:** You provide the `Z-Buffer` depth data to allow UI elements to properly occlude or overlay 3D objects.