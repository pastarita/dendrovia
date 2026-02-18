# Dendrovia Workflow (Canonical + Worktrees)

## Current Architecture

Dendrovia now runs in a **canonical repo + symbolic checkout/worktree** model:

```text
~/denroot/
  OPERATUS/
    dendrovia/                  # canonical git repo (.git directory)
  CHRONOS/
    dendrovia -> ../OPERATUS/dendrovia   # default symlink, promotable to worktree
  IMAGINARIUM/
    dendrovia -> ../OPERATUS/dendrovia
  ARCHITECTUS/
    dendrovia -> ../OPERATUS/dendrovia
  LUDUS/
    dendrovia -> ../OPERATUS/dendrovia
  OCULUS/
    dendrovia -> ../OPERATUS/dendrovia
```

- `OPERATUS/dendrovia` is the canonical host.
- Other pillars are symlinked by default.
- Any non-canonical pillar can be promoted to its own git worktree for branch isolation.

Reference: `docs/SYMBOLIC_CHECKOUT_CONVENTIONS.md`

---

## One-Time Setup

Run from the canonical repo:

```bash
cd /Users/Patmac/denroot/OPERATUS/dendrovia
scripts/setup-canonical-worktrees.sh --dry-run
scripts/setup-canonical-worktrees.sh
bun run hooks:install
```

What this does:
1. Validates canonical repo in OPERATUS.
2. Converts remaining pillar clones to symlinks/worktrees.
3. Activates Castle Walls git hooks (`core.hooksPath=.husky`).

---

## Daily Operations

### Check state

```bash
cd /Users/Patmac/denroot/OPERATUS/dendrovia
bun run wt:status
bun run wt:list
bun run hooks:verify
```

### Promote a pillar to an isolated branch worktree

```bash
bun run wt:new CHRONOS feat/chronos-parser
```

Behavior:
- If branch exists locally: attaches worktree to that branch.
- If branch exists on `origin`: creates tracking local branch and attaches.
- If branch does not exist: creates new local branch from canonical HEAD.

### Release a pillar back to symlink mode

```bash
bun run wt:release CHRONOS
```

Safety checks:
- Refuses release if worktree has uncommitted/untracked changes.

### OPERATUS special behavior

`OPERATUS` is canonical, so it cannot be promoted into a second worktree at its own path.

```bash
bun run wt:new OPERATUS feat/some-branch   # maps to git switch
bun run wt:release OPERATUS                # maps to git switch main
```

Caveat: when OPERATUS switches branch, all symlinked pillars see the same branch.

---

## Sidecar Context Model

Pillar identity/context lives outside git-tracked code:

- `~/denroot/PILLAR/CLAUDE.md` (untracked sidecar)
- `~/denroot/PILLAR/.claude/` (untracked sidecar)

This avoids repo-context collisions while preserving strong per-pillar cognitive framing.

For upcoming dual-agent context parity (`CLAUDE.md` + `AGENTS.md` sidecars), see:
- `docs/AGENT_PARITY_ROADMAP.md`
- `docs/WORKTREE_CONTEXT_CANONICALIZATION_ANALYSIS.md`

---

## Castle Walls Enforcement

Castle Walls runs via git hooks in `.husky/` and is enforced only when hooks path is configured.

```bash
bun run hooks:install
bun run hooks:verify
```

Active blocking gates:
- Secret detection (pre-commit)
- Protected branch push block (`main`/`master` in pre-push)

Advisory gates remain active for static analysis, tests, dependency checks, and asset boundaries.

---

## Migration Note

Legacy full-clone workflow has been superseded by this worktree-first model.

If you still need strict clone-level isolation for a special case, use it as an opt-in profile, not the default.
