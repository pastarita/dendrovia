# Agent Parity Roadmap (Claude + Codex + Future Agents)

## Goal

Reach consistent multi-agent behavior across pillar worktrees while preserving sidecar context isolation and Castle Walls protections.

## Current State

- Sidecar pillar context exists today (`CLAUDE.md`, `.claude/`) at `~/denroot/PILLAR/`.
- Worktree lifecycle is available (`wt:new`, `wt:release`, `wt:status`).
- Castle Walls hooks exist in `.husky/` and are now installable/verifiable via:
  - `bun run hooks:install`
  - `bun run hooks:verify`
- `AGENTS.md` parity context is not yet standardized in Dendrovia sidecars.

## Target State

Every active worktree has a profile directory with agent-neutral context:

```text
~/denroot/.agent-context/
  <worktree-name>/
    AGENTS.md
    CLAUDE.md
    CODEX.md            # optional adapter file
    .env.agent
```

And every launcher session exports:
- `WORKTREE_NAME`
- `WORKTREE_ROOT`
- `AGENT_PROFILE`
- `PORT_OFFSET`

## Implementation Steps

1. Define sidecar profile schema.
- Create a profile contract doc (`schema.md` or `profile.schema.json`).
- Require `AGENTS.md` and `CLAUDE.md` per worktree profile.

2. Add launcher profile resolver.
- Update workspace launcher to resolve profile by worktree name.
- Export `AGENT_PROFILE` and related env vars into terminal sessions.

3. Add profile bootstrap command.
- New script idea: `bun run agent:profile:init <worktree-name> --pillar <PILLAR>`
- Materializes starter `AGENTS.md` + `CLAUDE.md` from templates.

4. Add parity validator.
- New script idea: `bun run agent:profile:verify`
- Checks each active worktree from `git worktree list` has a profile.

5. Hook parity into wt lifecycle.
- On `wt:new`: warn if profile missing.
- On `wt:status`: show profile present/missing marker.

6. Add CI audit (non-blocking first).
- Validate no in-repo `AGENTS.md`/`CLAUDE.md` collisions.
- Validate profile naming matches worktree naming convention.

## Guardrails

- Keep sidecar context out of git-tracked tree.
- Never track a single global `AGENTS.md` in repo root for all sessions.
- One initiative per worktree; one profile per worktree.
- Keep hooks enforcement in git config (`core.hooksPath=.husky`) to preserve Castle Walls invariants across all agents.

## Near-Term Acceptance Criteria

- `bun run hooks:verify` passes in canonical checkout.
- `bun run wt:status` shows active pillar isolation states correctly.
- For each active worktree, a mapped sidecar profile exists and is loadable by launcher.
- Claude/Codex sessions receive equivalent context contract (same project rules, agent-specific adapter notes only).
