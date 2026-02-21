#!/usr/bin/env bash
set -euo pipefail

# wt-lifecycle.sh — Manage worktree ↔ symlink state per pillar.
#
# OPERATUS hosts the canonical checkout. All other pillars symlink to it
# or get promoted to worktrees for branch isolation.
#
# Usage:
#   scripts/wt-lifecycle.sh new <PILLAR> <branch>    # Switch pillar to worktree on branch
#   scripts/wt-lifecycle.sh release <PILLAR>          # Switch pillar back to symlink
#   scripts/wt-lifecycle.sh rebranch <PILLAR> <name>  # Rename current worktree branch
#   scripts/wt-lifecycle.sh status                    # Show all pillars' state

DENROOT="${DENROOT:-$HOME/denroot}"
CANONICAL_PILLAR="OPERATUS"
CANONICAL="$DENROOT/$CANONICAL_PILLAR/dendrovia"
PILLARS=(CHRONOS IMAGINARIUM ARCHITECTUS LUDUS OCULUS OPERATUS ORNITHICUS)
SYMLINK_TARGET="../${CANONICAL_PILLAR}/dendrovia"

# ── Helpers ──────────────────────────────────────────────────────

fail() { echo "✗ $*" >&2; exit 1; }
info() { echo "→ $*"; }

ensure_hooks_active() {
  if [[ -d "$CANONICAL/.git" ]]; then
    git -C "$CANONICAL" config core.hooksPath .husky
  fi
}

is_dirty_including_untracked() {
  local dir="$1"
  [[ -d "$dir/.git" || -f "$dir/.git" ]] || return 1
  [[ -n "$(git -C "$dir" status --porcelain --untracked-files=normal 2>/dev/null || true)" ]]
}

branch_exists_local() {
  local branch="$1"
  git -C "$CANONICAL" show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null
}

branch_exists_remote() {
  local branch="$1"
  git -C "$CANONICAL" show-ref --verify --quiet "refs/remotes/origin/$branch" 2>/dev/null
}

branch_checked_out_anywhere() {
  local branch="$1"
  git -C "$CANONICAL" worktree list --porcelain | grep -q "^branch refs/heads/$branch\$"
}

validate_pillar() {
  local pillar="${1:-}"
  local upper
  upper=$(echo "$pillar" | tr '[:lower:]' '[:upper:]')
  for p in "${PILLARS[@]}"; do
    if [[ "$p" == "$upper" ]]; then
      echo "$upper"
      return 0
    fi
  done
  fail "Unknown pillar: $pillar (valid: ${PILLARS[*]})"
}

# ── Commands ─────────────────────────────────────────────────────

cmd_new() {
  local pillar_raw="${1:-}"
  local branch="${2:-}"

  [[ -n "$pillar_raw" ]] || fail "Usage: wt-lifecycle.sh new <PILLAR> <branch>"
  [[ -n "$branch" ]]     || fail "Usage: wt-lifecycle.sh new <PILLAR> <branch>"

  local pillar
  pillar=$(validate_pillar "$pillar_raw")
  local target="$DENROOT/$pillar/dendrovia"

  [[ -d "$CANONICAL/.git" ]] || fail "Canonical repo not found at $CANONICAL"
  ensure_hooks_active

  # OPERATUS is the canonical — branching is just git switch
  if [[ "$pillar" == "$CANONICAL_PILLAR" ]]; then
    info "$CANONICAL_PILLAR hosts the canonical repo — using git switch instead of worktree"
    local current
    current=$(git -C "$CANONICAL" rev-parse --abbrev-ref HEAD 2>/dev/null)

    # Check for uncommitted/untracked changes before switching
    if is_dirty_including_untracked "$CANONICAL"; then
      fail "$CANONICAL_PILLAR has uncommitted or untracked changes. Commit/stash/clean first."
    fi

    # Create branch if it doesn't exist, otherwise switch to it
    if git -C "$CANONICAL" show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
      git -C "$CANONICAL" switch "$branch"
    elif git -C "$CANONICAL" show-ref --verify --quiet "refs/remotes/origin/$branch" 2>/dev/null; then
      git -C "$CANONICAL" switch --track "origin/$branch"
    else
      git -C "$CANONICAL" switch -c "$branch"
    fi

    info "Done. $CANONICAL_PILLAR switched from $current to $branch"
    info "Note: all symlinked pillars now see branch $branch"
    return 0
  fi

  # Remove existing symlink
  if [[ -L "$target" ]]; then
    info "Removing symlink at $target"
    rm "$target"
  elif [[ -f "$target/.git" ]]; then
    fail "$target is already a worktree (on branch $(git -C "$target" rev-parse --abbrev-ref HEAD)). Release first."
  elif [[ -d "$target" ]]; then
    fail "$target is a full clone, not a symlink or worktree. Run setup-canonical-worktrees.sh first."
  fi

  # git worktree cannot check out the same local branch in multiple worktrees
  if branch_exists_local "$branch" && branch_checked_out_anywhere "$branch"; then
    fail "Branch '$branch' is already checked out in another worktree. Pick a different branch."
  fi

  info "Creating worktree: $pillar → $branch"
  if branch_exists_local "$branch"; then
    git -C "$CANONICAL" worktree add "$target" "$branch"
  elif branch_exists_remote "$branch"; then
    git -C "$CANONICAL" worktree add --track -b "$branch" "$target" "origin/$branch"
  else
    # Create a brand-new branch from current canonical HEAD
    git -C "$CANONICAL" worktree add -b "$branch" "$target"
  fi

  info "Done. $pillar is now on branch: $branch"
  info "Run 'bun install' in the new worktree if needed."
}

cmd_release() {
  local pillar_raw="${1:-}"
  [[ -n "$pillar_raw" ]] || fail "Usage: wt-lifecycle.sh release <PILLAR>"

  local pillar
  pillar=$(validate_pillar "$pillar_raw")
  local target="$DENROOT/$pillar/dendrovia"

  # OPERATUS release = switch back to main
  if [[ "$pillar" == "$CANONICAL_PILLAR" ]]; then
    info "$CANONICAL_PILLAR hosts the canonical repo — switching back to main"

    if is_dirty_including_untracked "$CANONICAL"; then
      fail "$CANONICAL_PILLAR has uncommitted or untracked changes. Commit/stash/clean first."
    fi

    local current
    current=$(git -C "$CANONICAL" rev-parse --abbrev-ref HEAD 2>/dev/null)
    if [[ "$current" == "main" ]]; then
      info "$CANONICAL_PILLAR is already on main — nothing to do"
      return 0
    fi

    git -C "$CANONICAL" switch main
    info "Done. $CANONICAL_PILLAR back on main (was $current)."
    info "Note: all symlinked pillars now see main again"
    return 0
  fi

  if [[ -L "$target" ]]; then
    info "$pillar is already a symlink — nothing to do"
    return 0
  fi

  if [[ ! -f "$target/.git" ]]; then
    fail "$target is not a worktree. Cannot release."
  fi

  # Check for uncommitted changes
  if is_dirty_including_untracked "$target"; then
    fail "$pillar has uncommitted or untracked changes. Commit/stash/clean first."
  fi

  local branch
  branch=$(git -C "$target" rev-parse --abbrev-ref HEAD)
  info "Removing worktree: $pillar (was on $branch)"
  git -C "$CANONICAL" worktree remove "$target"

  info "Restoring symlink: $target → $SYMLINK_TARGET"
  ln -s "$SYMLINK_TARGET" "$target"

  info "Done. $pillar is back on canonical (follows $CANONICAL_PILLAR)."
}

cmd_rebranch() {
  local pillar_raw="${1:-}"
  local new_name="${2:-}"

  [[ -n "$pillar_raw" ]] || fail "Usage: wt-lifecycle.sh rebranch <PILLAR> <new-branch-name>"
  [[ -n "$new_name" ]]   || fail "Usage: wt-lifecycle.sh rebranch <PILLAR> <new-branch-name>"

  local pillar
  pillar=$(validate_pillar "$pillar_raw")
  local target="$DENROOT/$pillar/dendrovia"

  # OPERATUS: standard rename on canonical
  if [[ "$pillar" == "$CANONICAL_PILLAR" ]]; then
    [[ -d "$CANONICAL/.git" ]] || fail "Canonical repo not found at $CANONICAL"
    local current
    current=$(git -C "$CANONICAL" rev-parse --abbrev-ref HEAD 2>/dev/null)
    git -C "$CANONICAL" branch -m "$current" "$new_name"
    info "Done. $CANONICAL_PILLAR branch renamed: $current → $new_name"
    info "Note: all symlinked pillars now see branch $new_name"
    return 0
  fi

  # Must be a worktree (not a symlink)
  if [[ -L "$target" ]]; then
    fail "$pillar is a symlink — nothing to rename. Use 'wt:new $pillar <branch>' to create a worktree first."
  fi
  if [[ ! -f "$target/.git" ]]; then
    fail "$target is not a worktree. Cannot rebranch."
  fi

  local current
  current=$(git -C "$target" rev-parse --abbrev-ref HEAD 2>/dev/null)

  if [[ "$current" == "$new_name" ]]; then
    info "$pillar is already on branch $new_name — nothing to do"
    return 0
  fi

  # Check new name isn't already taken by a different branch
  if branch_exists_local "$new_name"; then
    fail "Branch '$new_name' already exists locally (on a different worktree or detached). Pick a different name."
  fi

  # Rename the branch
  git -C "$target" branch -m "$current" "$new_name"
  info "Done. $pillar branch renamed: $current → $new_name"

  # If the old branch was tracking a remote, update the upstream
  if git -C "$target" config "branch.$new_name.remote" >/dev/null 2>&1; then
    info "Note: upstream tracking preserved. Push with: git push -u origin $new_name"
  fi
}

cmd_status() {
  echo "Dendrovia worktree status:"
  echo ""

  for pillar in "${PILLARS[@]}"; do
    local target="$DENROOT/$pillar/dendrovia"
    if [[ "$pillar" == "$CANONICAL_PILLAR" ]]; then
      # Canonical host — always a real repo
      local branch
      branch=$(git -C "$target" rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')
      printf "  %-14s  canonical → %s\n" "$pillar" "$branch"
    elif [[ -L "$target" ]]; then
      printf "  %-14s  symlink → %s\n" "$pillar" "$(readlink "$target")"
    elif [[ -f "$target/.git" ]]; then
      printf "  %-14s  worktree → %s\n" "$pillar" "$(git -C "$target" rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
    elif [[ -d "$target/.git" ]]; then
      printf "  %-14s  clone → %s\n" "$pillar" "$(git -C "$target" rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
    else
      printf "  %-14s  MISSING\n" "$pillar"
    fi
  done

  echo ""
  echo "Canonical: $CANONICAL"
  if [[ -d "$CANONICAL/.git" ]]; then
    echo ""
    git -C "$CANONICAL" worktree list
  fi
}

# ── Dispatch ─────────────────────────────────────────────────────

CMD="${1:-}"

case "$CMD" in
  new)       shift; cmd_new "$@" ;;
  release)   shift; cmd_release "$@" ;;
  rebranch)  shift; cmd_rebranch "$@" ;;
  status)    cmd_status ;;
  *)
    echo "Usage: wt-lifecycle.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  new <PILLAR> <branch>        Create worktree (or git switch for $CANONICAL_PILLAR)"
    echo "  release <PILLAR>             Remove worktree and restore symlink (or switch to main)"
    echo "  rebranch <PILLAR> <new-name> Rename the current worktree branch"
    echo "  status                       Show all pillars' worktree/symlink state"
    echo ""
    echo "Canonical host: $CANONICAL_PILLAR ($CANONICAL)"
    exit 1
    ;;
esac
