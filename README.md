<p align="center">
  <img src="assets/hero-banner.svg" width="800" alt="Dendrovia — Six-pillar architecture for codebase archaeologization" />
</p>

<h1 align="center">DENDROVIA</h1>

<p align="center">
  <em>Autogamification of Codebase Archaeologization</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-c77b3f" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Runtime-Bun_1.0+-000000" alt="Runtime: Bun 1.0+" />
  <img src="https://img.shields.io/badge/Monorepo-TurboRepo-ef4444" alt="Monorepo: TurboRepo" />
  <img src="https://img.shields.io/badge/Rendering-WebGPU-3b82f6" alt="Rendering: WebGPU" />
  <img src="https://img.shields.io/badge/Status-Alpha-22c55e" alt="Status: Alpha" />
  <img src="https://img.shields.io/badge/TypeScript-5.7+-3178c6" alt="TypeScript: 5.7+" />
</p>

---

## Quick Start

```bash
bun install
bun run slice        # Parse a file → generate palette → render SDF branch
bun run dev          # Launch dev mode (all packages)
```

This runs the **Thin Vertical Slice** — a single file parsed through the entire stack to prove the architecture end-to-end:

```
CHRONOS: Parse package.json → IMAGINARIUM: Generate palette → ARCHITECTUS: Render SDF
    → LUDUS: Detect interaction → OCULUS: Show file contents
```

## What is Dendrovia?

Dendrovia transforms Git repositories into explorable 3D RPG worlds. Point it at any codebase and it generates a Monument Valley-inspired landscape where:

- **Git history** becomes geological strata you excavate
- **Code structure** becomes navigable dendritic architecture
- **Bugs** become creatures with stats derived from complexity
- **Refactors** become healing spells, `git blame` becomes reconnaissance

Instead of shipping heavy assets, Dendrovia **procedurally distills** AI-generated art into mathematical representations — SDFs, shaders, noise functions — creating infinite detail at minimal download size.

## Six-Pillar Architecture

<table>
  <tr>
    <td align="center" width="200">
      <img src="assets/icons/medium/chronos.svg" width="60" alt="CHRONOS" /><br />
      <strong>CHRONOS</strong><br />
      <em>The Archaeologist</em><br />
      Git + AST parsing
    </td>
    <td align="center" width="200">
      <img src="assets/icons/medium/imaginarium.svg" width="60" alt="IMAGINARIUM" /><br />
      <strong>IMAGINARIUM</strong><br />
      <em>The Compiler</em><br />
      Procedural distillation
    </td>
    <td align="center" width="200">
      <img src="assets/icons/medium/operatus.svg" width="60" alt="OPERATUS" /><br />
      <strong>OPERATUS</strong><br />
      <em>The Infrastructure</em><br />
      Asset loading + persistence
    </td>
  </tr>
  <tr>
    <td align="center" width="200">
      <img src="assets/icons/medium/architectus.svg" width="60" alt="ARCHITECTUS" /><br />
      <strong>ARCHITECTUS</strong><br />
      <em>The Renderer</em><br />
      WebGPU + SDF raymarching
    </td>
    <td align="center" width="200">
      <img src="assets/icons/medium/ludus.svg" width="60" alt="LUDUS" /><br />
      <strong>LUDUS</strong><br />
      <em>The Mechanics</em><br />
      Game logic + combat
    </td>
    <td align="center" width="200">
      <img src="assets/icons/medium/oculus.svg" width="60" alt="OCULUS" /><br />
      <strong>OCULUS</strong><br />
      <em>The Interface</em><br />
      UI + navigation
    </td>
  </tr>
</table>

### Build → Runtime Pipeline

```mermaid
flowchart LR
    A["CHRONOS<br/>Parse"] --> B["IMAGINARIUM<br/>Distill"]
    B --> C["OPERATUS<br/>Manifest"]
    C --> D["ARCHITECTUS<br/>Render"]
    D --> E["LUDUS<br/>Play"]
    E --> F["OCULUS<br/>Navigate"]
    style A fill:#c77b3f,stroke:#8b5e2f,color:#000000
    style B fill:#A855F7,stroke:#7c3aed,color:#ffffff
    style C fill:#1F2937,stroke:#111827,color:#ffffff
    style D fill:#3B82F6,stroke:#2563eb,color:#ffffff
    style E fill:#EF4444,stroke:#dc2626,color:#ffffff
    style F fill:#22C55E,stroke:#16a34a,color:#000000
```

## Current Status

| Pillar | Version | Status | Key Output |
|--------|---------|--------|------------|
| **CHRONOS** | v0.1.0 | Implemented | `topology.json` via isomorphic-git + ts-morph |
| **IMAGINARIUM** | v0.1.0 | Active | Distillation, generation, cache, fallbacks |
| **OPERATUS** | v0.3.0 | Production | OPFS cache, IndexedDB, Zustand persistence, SW |
| **ARCHITECTUS** | v0.1.0 | Scaffold | R3F + Three.js r171 integration |
| **LUDUS** | v0.1.0 | Scaffold | Zustand state machine, combat rules |
| **OCULUS** | v0.1.0 | Component Library | TanStack Virtual, panel system |

**Shared contracts** (`@dendrovia/shared`): Types, EventBus, schemas via Zod.

## Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Bun** | Runtime + Package Manager | 1.0+ |
| **TurboRepo** | Build Orchestration | 2.7 |
| **Three.js** | 3D Rendering | r171 |
| **React** | UI Framework | 19 |
| **Zustand** | State Management | 5 |
| **TypeScript** | Language | 5.7+ |
| **Next.js** | Application Framework | 16 |

## How It Works

### Core Principles

1. **Cognitive Architecture** — Each pillar communicates only via the EventBus. Two teams can work without coordination if the interface contracts hold.
2. **Build-Time vs Runtime** — CHRONOS and IMAGINARIUM run once per codebase, producing static artifacts (JSON, GLSL). ARCHITECTUS, LUDUS, and OCULUS consume them in the browser.
3. **Local-First** — The game fully works offline. Initial payload under 1MB. State persisted in OPFS with IndexedDB fallback.
4. **Hybrid Rendering** — SDF for static dendrites (infinite detail), instanced meshes for dynamic elements (creatures, particles), adaptive LOD.
5. **Diegetic Mechanics** — Spells are developer actions: `git blame` reveals origins, `refactor` heals tech debt, `debug` exposes weaknesses.

### Project Structure

```
dendrovia/
├── apps/
│   ├── dendrovia-quest/        # Main game application (Next.js)
│   └── playground-*/           # Per-pillar playgrounds
├── packages/
│   ├── shared/                 # Types, events, contracts
│   ├── chronos/                # Git + AST parser
│   ├── imaginarium/            # Procedural distillation
│   ├── architectus/            # R3F + WebGPU engine
│   ├── ludus/                  # Game mechanics
│   ├── oculus/                 # UI components
│   └── operatus/               # Infrastructure + persistence
├── assets/                     # SVG icons, design assets
├── lib/                        # Heraldry, shared utilities
├── turbo.json                  # TurboRepo pipeline
└── package.json                # Workspace config
```

## Contributing

Each pillar can be developed independently:

1. **Fork the repo** and pick a pillar
2. **Read the pillar's README** in `packages/{pillar}/`
3. **Respect the interface** — EventBus contracts in `packages/shared`
4. **Submit a PR** when tests pass

See `docs/` for architecture guides, the design system, and pillar thematic schemas.

## Docs

- [Pillar Thematic Schema](docs/PILLAR_THEMATIC_SCHEMA.md) — Design DNA for all six pillars
- [Pillar Insignia](docs/PILLAR_INSIGNIA_STRUCTURAL.md) — Structural icon specifications
- [Symbol-Driven Design System](docs/SYMBOL_DRIVEN_DESIGN_SYSTEM.md) — Visual language architecture

## License

MIT — See [LICENSE](LICENSE)
