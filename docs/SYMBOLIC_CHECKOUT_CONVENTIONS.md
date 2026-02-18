# Symbolic Checkout Conventions

> Full reference for the worktree + symlink topology used across the six-pillar architecture.

---

## Topology

```
~/denroot/
  OPERATUS/                           # canonical host
    CLAUDE.md                         #   sidecar (UNTRACKED)
    .claude/                          #   agent settings (UNTRACKED)
    dendrovia/                        #   THE canonical git repo (.git/ lives here)
  CHRONOS/                            # symbolic checkout
    CLAUDE.md                         #   sidecar (UNTRACKED)
    .claude/                          #   agent settings (UNTRACKED)
    dendrovia -> ../OPERATUS/dendrovia  # symlink to canonical OR git worktree
  IMAGINARIUM/                        # symbolic checkout
    CLAUDE.md
    dendrovia -> ../OPERATUS/dendrovia
  ARCHITECTUS/                        # symbolic checkout
    CLAUDE.md
    .claude/
    dendrovia -> ../OPERATUS/dendrovia
  LUDUS/                              # symbolic checkout
    CLAUDE.md
    .claude/
    dendrovia -> ../OPERATUS/dendrovia
  OCULUS/                             # symbolic checkout
    CLAUDE.md
    .claude/
    dendrovia -> ../OPERATUS/dendrovia
```

### Why OPERATUS?

OPERATUS is the infrastructure pillar. It runs the dev server, owns tooling (workspace launcher, worktree lifecycle, iTerm2 profiles), and is the natural "home base" for the monorepo. Placing the canonical checkout inside OPERATUS means:

- No orphan directory at `~/denroot/dendrovia/` that doesn't belong to any pillar
- The pillar that runs `bun run dev` owns the repo it runs from
- Five symmetric symbolic checkouts + one canonical host

### Two States Per Pillar

| State | Mechanism | When | Applies To |
|-------|-----------|------|------------|
| **Canonical** | Real `.git/` directory | Always | OPERATUS only |
| **Symlink** | `dendrovia -> ../OPERATUS/dendrovia` | Default (resting state) | Other 5 pillars |
| **Worktree** | `git worktree add` | Active feature branch | Other 5 pillars |

A symlink is the resting state for non-canonical pillars. A worktree is a temporary promotion when a pillar needs branch isolation. Releasing the worktree restores the symlink.

### OPERATUS Branching

Since OPERATUS hosts the canonical `.git/`, it cannot use worktrees on itself. Instead:

- `wt:new OPERATUS <branch>` → runs `git switch` (normal branching)
- `wt:release OPERATUS` → runs `git switch main`
- **Caveat:** When OPERATUS switches branches, all symlinked pillars see the new branch. Pillars with their own worktree are unaffected.

---

## Worktree Lifecycle Commands

All commands run from any `dendrovia/` directory (canonical or worktree — they resolve to the same git repo).

| Command | What It Does |
|---------|-------------|
| `bun run wt:new <PILLAR> <branch>` | Remove symlink, create worktree for pillar on `<branch>` (creates branch if needed) |
| `bun run wt:release <PILLAR>` | Remove worktree, restore symlink to canonical |
| `bun run wt:status` | Show all pillars' current state (canonical/symlink/worktree/clone) |
| `bun run wt:list` | `git worktree list` — show all active worktrees |
| `bun run wt:prune` | `git worktree prune` — clean up stale references |
| `bun run hooks:install` | Activate Castle Walls via `core.hooksPath=.husky` |
| `bun run hooks:verify` | Verify Castle Walls hook activation |

### Creating a Worktree

```bash
cd dendrovia/
bun run wt:new CHRONOS feat/chronos-parser
# Now ~/denroot/CHRONOS/dendrovia is a worktree on feat/chronos-parser
```

The script:
1. Removes the existing symlink at `~/denroot/CHRONOS/dendrovia`
2. Resolves branch source:
   - local branch if present
   - `origin/<branch>` tracking branch if remote exists
   - new local branch from canonical HEAD if branch is new
3. Runs `git worktree add ...` with the resolved branch mode
4. The pillar now has its own independent working tree on that branch

### Releasing a Worktree

```bash
cd dendrovia/
bun run wt:release CHRONOS
# Now ~/denroot/CHRONOS/dendrovia is a symlink to ../OPERATUS/dendrovia again
```

The script:
1. Checks for uncommitted changes (refuses if dirty)
2. Runs `git worktree remove ~/denroot/CHRONOS/dendrovia`
3. Creates symlink: `~/denroot/CHRONOS/dendrovia -> ../OPERATUS/dendrovia`

---

## Turborepo + Worktrees

Each git worktree is a separate working tree that shares the same `.git/` object store:

| Artifact | Shared or Per-Worktree | Notes |
|----------|----------------------|-------|
| `.git/` objects | **Shared** | All worktrees point to the same object database |
| `node_modules/` | **Per-worktree** | Each worktree needs `bun install` |
| `bun.lock` | **Per-worktree** | Lives in the working tree root |
| `.turbo/cache/` | **Per-worktree** | Turbo content-hashes independently per working tree |
| `dist/`, `generated/` | **Per-worktree** | Build outputs are local to each working tree |

**Key implication:** After creating a worktree, run `bun install` before building. Turbo caches don't cross worktree boundaries, but since they're content-addressed, identical code produces identical cache hits.

---

## Agent Autonomy Rules

### Worktree Creation — Autonomous

Agents **may freely create worktrees** when they need a feature branch:

```
Agent decides it needs a branch
  → bun run wt:new PILLAR feat/my-work
  → do work, commit, push
```

### Worktree Release — Ask First

Agents **must ask the user before releasing a worktree.** Another agent session on the same pillar might be using it.

### Observability

```bash
bun run wt:status          # Human-readable table of all pillars
bun run wt:list            # git worktree list (canonical perspective)
```

---

## Sidecar Convention

### Tracked vs. Untracked

| Location | Tracked? | Contains |
|----------|----------|----------|
| `~/denroot/OPERATUS/dendrovia/` | **Yes** (canonical git repo) | All production code, monorepo config, docs |
| `~/denroot/PILLAR/dendrovia/` | **Yes** (symlink or worktree resolving to the repo) | Same content |
| `~/denroot/PILLAR/CLAUDE.md` | **No** (filesystem only) | Agent persona, pillar context, worktree instructions |
| `~/denroot/PILLAR/.claude/` | **No** (filesystem only) | Agent permission settings |

The pillar root directory is not inside any git repo. Git only knows about what's inside `dendrovia/`. Everything else is a local sidecar file for agent context.

### Agent Working Directory Convention

When an agent session starts in a symbolic checkout:

1. **Read CLAUDE.md** in the current directory to understand your pillar identity.
2. **`cd dendrovia/`** before doing any git operations, running scripts, or editing production code.
3. The monorepo's own `dendrovia/CLAUDE.md` provides build commands, pillar package locations, and governance rules.
4. Return to the pillar root only for sidecar file updates.

---

## Migration From Full Clones

```bash
scripts/setup-canonical-worktrees.sh --dry-run   # Preview
scripts/setup-canonical-worktrees.sh              # Execute
```

The script:
1. Validates that OPERATUS/dendrovia is the canonical (real `.git/` directory)
2. For each other pillar: checks for dirty state, removes the full clone, creates symlink or worktree
3. Pillars on `main` get symlinks; pillars on feature branches get worktrees
4. Verifies the result

Safety: refuses to touch any pillar with uncommitted changes or unpushed branches.

---

## Castle Walls Hook Activation

Hooks are only enforced if git is configured to use `.husky/`.

```bash
cd ~/denroot/OPERATUS/dendrovia
bun run hooks:install
bun run hooks:verify
```

This ensures pre-commit/pre-push/post-rebase gates are active in the shared canonical git config used by worktrees.

---

## Quick Reference

```bash
# Check state
bun run wt:status                              # All pillars
bun run wt:list                                # Active worktrees

# Create worktree (agent: autonomous)
bun run wt:new CHRONOS feat/chronos-parser

# Release worktree (agent: ask user first)
bun run wt:release CHRONOS

# Clean up
bun run wt:prune
```

---

_Version: 2.0.0 — OPERATUS-canonical topology_
_Updated: 2026-02-18_
