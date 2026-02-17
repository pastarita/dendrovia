# Contributing to Dendrovia

Thank you for your interest in contributing to Dendrovia! This document explains how to get involved.

## Getting Started

1. **Fork** the repository and clone your fork
2. **Install dependencies** with [Bun](https://bun.sh/) (v1.0+):
   ```bash
   bun install
   ```
3. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
4. **Run the dev server** to verify your environment:
   ```bash
   bun run dev
   ```

## Development Workflow

### Branch Naming

Use conventional prefixes:

| Prefix | Use Case |
|--------|----------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `refactor/` | Code restructuring |
| `docs/` | Documentation only |
| `chore/` | Maintenance / tooling |
| `test/` | Test additions |

Example: `feat/chronos-git-parser`, `fix/hotspot-nan-scores`

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
{type}({scope}): {subject}
```

- **type**: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `style`, `ci`, `build`
- **scope**: package or module name (`chronos`, `oculus`, `shared`, etc.)
- **subject**: imperative mood, no period, under 72 characters

Examples:
```
feat(chronos): implement hybrid GitParser via Bun.spawn
fix(oculus): correct panel glow token reference
docs(shared): add EventBus usage examples
```

### Code Style

- **TypeScript** throughout the monorepo
- **2-space indentation**, no tabs
- **Single quotes** in TypeScript, **double quotes** in JSON
- Run `bun run lint` before committing

### Testing

```bash
bun test                    # Run all tests
bun test packages/oculus    # Run tests for a specific package
```

Write tests for new functionality. Place test files adjacent to the code they test or in a `__tests__/` directory.

### Pre-Commit Hooks

The repository uses a tiered quality gate system ("Castle Walls") that runs automatically on commit:

- **Wall 1**: Secret detection (blocking)
- **Wall 2**: TypeScript type checking and linting (advisory)
- **Wall 3**: Test suite (advisory)

If a check fails, fix the issue before committing. Do not bypass Wall 1 (secret detection).

## Six-Pillar Architecture

Dendrovia is organized into six pillars. When contributing, keep changes scoped to the relevant pillar:

| Pillar | Package | Responsibility |
|--------|---------|----------------|
| CHRONOS | `packages/chronos` | Git history + AST parsing |
| IMAGINARIUM | `packages/imaginarium` | Procedural art generation |
| ARCHITECTUS | `packages/architectus` | 3D rendering engine |
| LUDUS | `packages/ludus` | Game mechanics + rules |
| OCULUS | `packages/oculus` | UI + navigation overlays |
| OPERATUS | `packages/operatus` | Infrastructure + persistence |

Cross-pillar types and events live in `packages/shared/`.

## Pull Requests

1. Ensure all tests pass and linting is clean
2. Write a clear PR description explaining **what** changed and **why**
3. Keep PRs focused — one coherent concern per PR
4. Link related issues in the PR description

## Reporting Issues

Use the [issue templates](https://github.com/pastarita/dendrovia/issues/new/choose) for bug reports and feature requests. Include:

- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Environment details (OS, Bun version, Node version)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
