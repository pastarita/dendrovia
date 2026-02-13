# OPERATUS: The Backbone
**Technical Role:** DevOps Engineer / Backend Engineer / Site Reliability Engineer
**Primary Mandate:** "Persist the World."

## 1. Domain of Concern
Operatus manages the plumbing. It handles data persistence, networking, deployment, and the "Save Game" functionality.

### Core Responsibilities
*   **Local Storage Strategy:** Implementing the *Origin Private File System (OPFS)* wrapper to save massive Git histories and asset caches locally in the browser.
*   **The SpaceTimeDB Integration:** (Future) Managing the Rust modules and WebAssembly bindings for the MMO backend.
*   **Asset Delivery:** Managing the loading strategy. Deciding when to fetch a High-Res asset vs. keeping the Procedural fallback.
*   **Telemetry:** Logging performance metrics (FPS, Memory usage) to help optimize the engine.

## 2. Technical Stack & Boundaries
*   **Storage:** IndexedDB, OPFS.
*   **Backend:** Rust, WebAssembly, SpaceTimeDB.
*   **Build:** TurboRepo configuration, Docker (for server deployment).

### Separation of Concerns
*   **Input:** Serialization requests from *Ludus* and *Chronos*.
*   **Output:** Persisted binaries and network packets.
*   **RESTRICTION:** Operatus does not implement game rules. It only stores the result of the rules.

## 3. Shared Governance
*   **With Everyone:** Operatus defines the *Schema* for saving data. If Ludus changes the Player Object, Operatus must migrate the database.