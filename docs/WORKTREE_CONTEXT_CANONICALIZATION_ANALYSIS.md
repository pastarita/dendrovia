# Workspaces, Context, and Navigability Canonicalization

## Purpose
This document compares Dendrovia's current multi-checkout workflow with a worktree-centered direction, then proposes a default configuration and optional developer profiles.

Scope:
- configuration model (checkouts vs worktrees)
- contextualization model (`CLAUDE.md` / `AGENTS.md` handling)
- navigability + no-reload switching inside SpacePark/unified playground
- anticipatory loading and fast switching between parallel streams
- recon visibility across concurrent development contexts

---

## Current vs Proposed Modalities

| Modality | Summary | Strengths | Weaknesses | Best Fit |
|---|---|---|---|---|
| `A. Multi-checkout clones` (current) | One full clone per pillar/stream, each with local untracked agent context | Strong cognitive separation; simple mental model; hard isolation between sessions | High disk + install duplication; slower sync; weaker turbo local cache reuse | Teams optimizing for strict context isolation and low coupling |
| `B. Single checkout only` | One branch at a time in one working tree | Minimal operational complexity; simplest Git model | Poor parallelism; context collisions; frequent stash/branch switching overhead | Solo short-lived tasks |
| `C. Canonical + Git worktrees + sidecar context` (proposed default) | One canonical repo plus many worktrees; per-worktree external context profiles | Parallelism with lower duplication; shared turbo cache behavior; preserves contextual identity via sidecar profiles | Needs launcher + profile conventions; modest setup complexity | Multi-stream pillar development with strong DevEx and fast switching |

---

## Contextualization Pattern (Critical Requirement)

Requirement: preserve per-stream agent identity without committing role files into the repo.

Recommended pattern:
- store contextual files outside repo in a sidecar root keyed by worktree name
- inject profile context at launcher time (env vars + optional symlink/copy into runtime path)
- keep any in-tree transient context untracked via `.git/info/exclude`

Example layout:

```text
~/denroot/
  dendrovia/                       # canonical checkout
  wt/
    oculus-nav/                    # worktree
    ludus-balance/                 # worktree
  .agent-context/
    oculus-nav/
      AGENTS.md
      CLAUDE.md
      .env.agent
    ludus-balance/
      AGENTS.md
      CLAUDE.md
      .env.agent
```

---

## Multi-Objective Decision Matrix (Weighted)

Scoring: `1 (poor) -> 5 (excellent)`

| Objective | Weight | A: Multi-checkout clones | B: Single checkout | C: Worktrees + sidecar context |
|---|---:|---:|---:|---:|
| Context isolation / role fidelity | 0.20 | 5 | 2 | 5 |
| Fast branch/workspace switching | 0.15 | 3 | 2 | 5 |
| Parallel development throughput | 0.15 | 5 | 2 | 5 |
| Disk + dependency efficiency | 0.10 | 2 | 5 | 4 |
| Turbo/local cache efficiency | 0.10 | 2 | 4 | 5 |
| Operational simplicity | 0.10 | 4 | 5 | 3 |
| Recon visibility across streams | 0.10 | 3 | 2 | 5 |
| Onboarding consistency | 0.10 | 3 | 5 | 4 |
| **Weighted total** | **1.00** | **3.45** | **3.10** | **4.60** |

Interpretation:
- `C` wins for Dendrovia's stated goals: parallelism + contextualization + fast navigation.
- `A` remains valid when hard isolation is prioritized over operational efficiency.

---

## Navigability and Reload Behavior Matrix

| Concern | Current Risk | Improvement Direction | Default Policy |
|---|---|---|---|
| In-app route switching | Full page reloads when plain anchors are used for internal routes | Internal routes should use client transitions (`Link`/router) | "No full reload for same-origin route changes" |
| Domain/pillar traversal latency | Cold transitions when likely next routes are not prefetched | Prefetch likely targets from sidebar/domain nav and hover intent | Prefetch top-N likely next pages per pillar/domain |
| Cross-port navigation | Hard reload is unavoidable across separate app ports | Prefer unified app internal routes for primary flow | Cross-port links only for legacy/debug surfaces |
| Registry-driven nav drift | Duplicate registries diverge across apps | One source of truth in shared UI/domain registry | Registry SSoT enforced in review checklist |

---

## Configuration Facets (Compare/Contrast)

| Facet | A: Multi-checkout clones | C: Worktrees + sidecar context |
|---|---|---|
| Git model | Multiple full clones | Single repo + `git worktree` entries |
| Dependency footprint | Duplicated `node_modules` and tool artifacts | Reduced duplication; shared repo object database |
| Turbo behavior | Cache isolated by clone | Worktree cache sharing behavior available (when default cache semantics retained) |
| Context model | Per-clone untracked role files | Per-worktree external profile mapped by launcher |
| Recon aggregation | Cross-clone scanning required | Native enumeration from `git worktree list` + profile map |
| Failure isolation | Strong (clone-level) | Strong enough (worktree-level + branch isolation) |
| Migration complexity | Existing baseline | Moderate (scripts + conventions) |

---

## Recommended Default Configuration (Project Standard)

| Layer | Default | Rationale |
|---|---|---|
| Source topology | `1 canonical repo + N worktrees` | Best weighted outcome for parallel stream development |
| Context topology | `sidecar profiles outside repo` | Preserves persona/context without polluting git history |
| Launcher | `td/wt` unified launcher, worktree-aware | Single command path for starting local dev contexts |
| Navigation | Unified app as primary entry | Minimizes cross-port reloads and improves continuity |
| Registry | Shared registry in `@repo/ui` | Avoids nav/config drift |
| Recon | Aggregate across all worktrees + profile metadata | Keeps cross-stream awareness for archaeology workflows |

Default conventions:
- worktree naming: `<pillar>-<initiative>-<seq>`
- profile naming: exactly match worktree name
- env contract: `AGENT_PROFILE`, `WORKTREE_NAME`, `WORKTREE_ROOT`, optional `PORT_OFFSET`

---

## Optional Developer Profiles (Opt-In)

| Profile | Description | Recommended For | Tradeoffs |
|---|---|---|---|
| `Strict Isolation` | Continue multi-checkout clones with local context files | Contributors who value hard separation and minimal tooling changes | Higher disk and cache duplication |
| `Balanced Parallel` (default) | Canonical repo + worktrees + sidecar context | Most contributors on multi-stream feature work | Requires launcher/profile discipline |
| `Minimalist` | Single checkout + branch switching + lightweight context presets | New contributors or quick fixes | Weak parallelism, context collisions |
| `CI Mirror` | Ephemeral clean worktrees for verification-only sessions | Release and verification flows | Less ergonomic for active coding |

---

## Migration Strategy (A -> C)

| Phase | Action | Success Criteria |
|---|---|---|
| 1 | Introduce sidecar context schema and launcher profile resolution | Per-worktree context loads without committing files |
| 2 | Add worktree lifecycle commands (`wt:new`, `wt:list`, `wt:dev`, `wt:prune`) | Contributors can run parallel streams without manual git plumbing |
| 3 | Make unified app primary in `td` workflows | Cross-pillar navigation is mostly no-reload |
| 4 | Enable recon aggregation across worktrees | Recon dashboard sees all active streams with profile context |
| 5 | Deprecate multi-clone default docs (keep as opt-in profile) | New contributor docs default to worktree model |

---

## Guardrails and Anti-Patterns

| Anti-pattern | Why It Hurts | Guardrail |
|---|---|---|
| Tracking `CLAUDE.md`/`AGENTS.md` in repo root for all contexts | Context collisions and noisy PRs | Keep role files external + untracked |
| Duplicating domain/page registries per app | Navigability drift and inconsistent behavior | Shared registry SSoT in `@repo/ui` |
| Relying on cross-port links for normal UX | Full reloads and session discontinuity | Unified app internal routes as default |
| Overloading one worktree with multiple initiatives | Reduced traceability and context bleed | One initiative per worktree |

---

## Open Decisions

| Decision | Default Candidate | Needs Team Alignment |
|---|---|---|
| Sidecar root location | `~/denroot/.agent-context` | yes |
| Profile schema format | `yaml` or `json` + markdown context files | yes |
| Port strategy for parallel sessions | deterministic `PORT_OFFSET` per worktree | yes |
| Legacy per-pillar app status | keep for debug only | yes |

---

## Summary
The recommended canonical path is:
- preserve contextual identity as a first-class concept
- move from clone-based parallelism to worktree-based parallelism
- externalize agent context profiles per worktree
- make unified registry + unified navigation the default runtime experience

This keeps the ethos of the current system (focused role-context and parallel streams) while improving switch speed, cache efficiency, and navigability.
