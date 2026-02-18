#!/usr/bin/env bash
set -euo pipefail

# wt-lifecycle.sh — Manage worktree ↔ symlink state per pillar.
#
# OPERATUS hosts the canonical checkout. All other pillars symlink to it
# or get promoted to worktrees for branch isolation.
#
# Usage:
#   scripts/wt-lifecycle.sh new <PILLAR> <branch>   # Switch pillar to worktree on branch
#   scripts/wt-lifecycle.sh release <PILLAR>         # Switch pillar back to symlink
#   scripts/wt-lifecycle.sh status                   # Show all pillars' state

DENROOT="${DENROOT:-$HOME/denroot}"
CANONICAL_PILLAR="OPERATUS"
CANONICAL="$DENROOT/$CANONICAL_PILLAR/dendrovia"
PILLARS=(CHRONOS IMAGINARIUM ARCHITECTUS LUDUS OCULUS OPERATUS)
SYMLINK_TARGET="../${CANONICAL_PILLAR}/dendrovia"

# ── Helpers ──────────────────────────────────────────────────────

fail() { echo "✗ $*" >&2; exit 1; }
info() { echo "→ $*"; }

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

  # OPERATUS is the canonical — branching is just git switch
  if [[ "$pillar" == "$CANONICAL_PILLAR" ]]; then
    info "$CANONICAL_PILLAR hosts the canonical repo — using git switch instead of worktree"
    local current
    current=$(git -C "$CANONICAL" rev-parse --abbrev-ref HEAD 2>/dev/null)

    # Check for uncommitted changes before switching
    if ! git -C "$CANONICAL" diff --quiet 2>/dev/null || ! git -C "$CANONICAL" diff --cached --quiet 2>/dev/null; then
      fail "$CANONICAL_PILLAR has uncommitted changes. Commit first."
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

  info "Creating worktree: $pillar → $branch"
  git -C "$CANONICAL" worktree add "$target" "$branch"

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

    if ! git -C "$CANONICAL" diff --quiet 2>/dev/null || ! git -C "$CANONICAL" diff --cached --quiet 2>/dev/null; then
      fail "$CANONICAL_PILLAR has uncommitted changes. Commit first."
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
  if ! git -C "$target" diff --quiet 2>/dev/null || ! git -C "$target" diff --cached --quiet 2>/dev/null; then
    fail "$pillar has uncommitted changes. Commit or discard first."
  fi

  local branch
  branch=$(git -C "$target" rev-parse --abbrev-ref HEAD)
  info "Removing worktree: $pillar (was on $branch)"
  git -C "$CANONICAL" worktree remove "$target"

  info "Restoring symlink: $target → $SYMLINK_TARGET"
  ln -s "$SYMLINK_TARGET" "$target"

  info "Done. $pillar is back on canonical (follows $CANONICAL_PILLAR)."
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
  new)      shift; cmd_new "$@" ;;
  release)  shift; cmd_release "$@" ;;
  status)   cmd_status ;;
  *)
    echo "Usage: wt-lifecycle.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  new <PILLAR> <branch>   Create worktree (or git switch for $CANONICAL_PILLAR)"
    echo "  release <PILLAR>        Remove worktree and restore symlink (or switch to main)"
    echo "  status                  Show all pillars' worktree/symlink state"
    echo ""
    echo "Canonical host: $CANONICAL_PILLAR ($CANONICAL)"
    exit 1
    ;;
esac
