# CLAUDE.md — Dendrovia Monorepo

> **Autogamification of Codebase Archaeologization**
> The Six-Pillar Architecture

## Project Context

Dendrovia transforms Git repositories into explorable 3D RPG worlds. The monorepo contains six pillars that form a build-time-to-runtime pipeline:

```
CHRONOS → IMAGINARIUM → ARCHITECTUS
                           ├→ LUDUS
                           ├→ OCULUS
                           └→ OPERATUS
```

### Runtime

- **Bun** 1.0+ (package manager, runtime, test runner)
- **TurboRepo** for build orchestration
- **TypeScript** throughout

### Common Commands

```bash
bun install           # Install dependencies
bun run dev           # Dev mode (all packages)
bun run build         # Build all packages
bun test              # Run all tests
bun run lint          # Lint all packages

# CHRONOS-specific
cd packages/chronos && bun run parse    # Run CHRONOS parser
```

---

## Six-Pillar Architecture

| Pillar | Role | Package | Status |
|--------|------|---------|--------|
| CHRONOS | Git History + AST Parsing | `packages/chronos` | Implemented |
| IMAGINARIUM | Procedural Art Generation | `packages/imaginarium` | Scaffold |
| ARCHITECTUS | 3D Rendering Engine | `packages/architectus`, `packages/dendrovia-engine` | Scaffold |
| LUDUS | Game Mechanics + Rules | `packages/ludus` | Scaffold |
| OCULUS | UI + Navigation | `packages/oculus`, `packages/ui` | Scaffold |
| OPERATUS | Infrastructure + Persistence | `packages/operatus` | Scaffold |

### Shared Contracts

- Types: `packages/shared/src/types/index.ts`
- Contracts: `packages/shared/src/contracts/index.ts`
- Events: `packages/shared/src/events/index.ts`

### Build Pipeline (turbo.json)

```
chronos#parse → imaginarium#distill → architectus#build
```

---

## Skills Available

| Skill | Location | Activation |
|-------|----------|------------|
| `pr-workflow` | `.claude/skills/workflow/pr/SKILL.md` | "create PR", "PR description", "prepare PR" |
| `pr-heraldry` | `.claude/skills/heraldry/pr-heraldry/SKILL.md` | "generate coat of arms", "PR heraldry" |
| `pr-heterogeneous` | `.claude/skills/workflow/pr-heterogeneous/SKILL.md` | "heterogeneous PR", "multi-space PR" |
| `recon` | `.claude/skills/recon/cross-checkout-scan/SKILL.md` | "recon", "scan checkouts", "branch inventory" |

---

## Rules

All governance rules live in `.claude/rules/`. See `.claude/rules/INDEX.md` for the complete trigger-to-rule mapping.

| Rule | Governs |
|------|---------|
| `PR_WORKFLOW.rules.md` | PR creation process |
| `PR_DESCRIPTION_CONTENT.rules.md` | PR description structure and content |
| `PR_HERALDRY_COMPLETENESS.rules.md` | Heraldic classification taxonomy |
| `DIAGRAM_CONVENTIONS.rules.md` | Mermaid diagram accessibility |
| `BRANCH_WORKFLOW.rules.md` | Branch naming and commit conventions |
| `CASTLE_WALLS.rules.md` | Pre-commit quality gates and permission engine |

---

## Heraldry System

PRs are classified using a heraldic system that maps code changes to medieval blazonry:

- **Domains** map to pillar tinctures (colors)
- **Charges** map to commit types (feat→mullet, fix→cross, etc.)
- **Magnitude** is computed from file count, line count, domain count, and flags
- **Mottos** are Latin phrases selected by charge type and magnitude

Type definitions: `lib/heraldry/types.ts`
Full taxonomy: `.claude/rules/PR_HERALDRY_COMPLETENESS.rules.md`

---

## Castle Walls — Pre-Commit Quality Gates

Tiered quality gate system enforcing code health on every commit.

### Wall System

| Wall | Purpose | Enforcement |
|------|---------|-------------|
| 0 | Context protection (branch, stash) | Advisory |
| 1 | Secret detection | **BLOCKING** |
| 2 | Static analysis (typecheck, lint) | Advisory |
| 2.5 | Dependency validation | Advisory |
| 2.7 | Runtime/shebang compliance | Advisory |
| 3 | Test suite (10s timeout) | Advisory |
| 7 | Large file/asset warnings | Advisory |

### Permission Policy Engine

3-tier permission system for agentic workflows (Claude Code hooks):

| Tier | File | Hook Point |
|------|------|------------|
| 1 | `.claude/hooks/tier1-gatekeeper.py` | PreToolUse |
| 2 | `.claude/hooks/tier2-llm-gatekeeper.py` | PermissionRequest |
| Audit | `.claude/hooks/decision-logger.py` | PostToolUse |

### Policy Modes

```bash
.claude/hooks/switch-mode.sh testing      # Switch to testing mode
.claude/hooks/switch-mode.sh              # Show current mode
```

Modes: `default`, `testing`, `rendover`, `deployment`

### Expedition Mode

Branches with `expedite` in the name skip advisory walls (Wall 1 always runs).

### Key Files

| File | Purpose |
|------|---------|
| `.husky/pre-commit` | Castle Walls main script (7 walls) |
| `.husky/pre-push` | Branch protection + PR readiness |
| `.castle-walls/certified-exceptions.yaml` | Safe strings registry |
| `.gitleaks.toml` | Gitleaks custom rules |
| `.claude/policies/modes/*.yaml` | Policy mode definitions |

Full rules: `.claude/rules/CASTLE_WALLS.rules.md`
Setup guide: `docs/governance/CASTLE_WALLS_CODEBASE_CONTEXT_SYSTEM_SETUP.md`

---

## Design System

- Pillar insignia: `docs/PILLAR_INSIGNIA_STRUCTURAL.md`
- Thematic schema: `docs/PILLAR_THEMATIC_SCHEMA.md`
- Symbol system: `docs/SYMBOL_DRIVEN_DESIGN_SYSTEM.md`

---

## Conventions

### Branch-First Development (MANDATORY)

**NEVER commit directly to `main`.** All work must happen on a feature branch. Create one before starting any task:

```bash
git checkout -b {type}/{short-description}
```

Push the feature branch, then create a PR. The pre-push hook and Tier 1 policy engine both block pushes to main. See `.claude/rules/BRANCH_WORKFLOW.rules.md` for full protocol.

### Commit Messages

Use conventional commits: `{type}({scope}): {subject}`

Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `style`, `ci`, `build`

### Diagrams

All architecture diagrams use Mermaid. Every `style` directive MUST include explicit `color:` for text accessibility. See `.claude/rules/DIAGRAM_CONVENTIONS.rules.md`.

### PR Descriptions

Output to `docs/pr-descriptions/PR_DESCRIPTION_{NAME}.md`. Must include Coat of Arms, Summary, Features, Files Changed, Commits, Test Plan. See `.claude/rules/PR_DESCRIPTION_CONTENT.rules.md`.
