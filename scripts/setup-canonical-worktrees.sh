#!/usr/bin/env bash
set -euo pipefail

# setup-canonical-worktrees.sh — Migrate from 6 independent clones to
# 1 canonical repo (in OPERATUS) + git worktrees + symlinks.
#
# OPERATUS hosts the canonical checkout. All other pillars get symlinks
# (if on main) or worktrees (if on a feature branch).
#
# Usage:
#   scripts/setup-canonical-worktrees.sh              # Execute migration
#   scripts/setup-canonical-worktrees.sh --dry-run    # Show plan without executing

DENROOT="${DENROOT:-$HOME/denroot}"
CANONICAL_PILLAR="OPERATUS"
CANONICAL="$DENROOT/$CANONICAL_PILLAR/dendrovia"
SYMLINK_TARGET="../${CANONICAL_PILLAR}/dendrovia"

# All pillars (canonical pillar is handled specially)
PILLARS=(CHRONOS IMAGINARIUM ARCHITECTUS LUDUS OCULUS OPERATUS)

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "=== DRY RUN — no changes will be made ==="
  echo ""
fi

# ── Helpers ──────────────────────────────────────────────────────

log()  { echo "  $*"; }
info() { echo "→ $*"; }
warn() { echo "⚠ $*" >&2; }
fail() { echo "✗ $*" >&2; exit 1; }

run() {
  if $DRY_RUN; then
    log "[dry-run] $*"
  else
    "$@"
  fi
}

# Check if a directory has uncommitted changes
is_dirty() {
  local dir="$1"
  [[ -d "$dir/.git" || -f "$dir/.git" ]] || return 1
  cd "$dir"
  ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null
}

# Get current branch of a git directory
current_branch() {
  local dir="$1"
  git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"
}

# Check for unpushed commits
has_unpushed() {
  local dir="$1"
  local branch
  branch=$(current_branch "$dir")
  local upstream
  upstream=$(git -C "$dir" rev-parse --abbrev-ref "@{upstream}" 2>/dev/null || echo "")
  if [[ -z "$upstream" ]]; then
    return 0  # No upstream — treat as unpushed
  fi
  [[ -n "$(git -C "$dir" log "$upstream..$branch" --oneline 2>/dev/null)" ]]
}

# ── Phase 1: Validate canonical ──────────────────────────────────

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Dendrovia Worktree Migration                           ║"
echo "║  Canonical host: $CANONICAL_PILLAR                              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

CANONICAL_DIR="$DENROOT/$CANONICAL_PILLAR/dendrovia"

if [[ -L "$CANONICAL_DIR" ]]; then
  fail "$CANONICAL_PILLAR/dendrovia is a symlink — it should be the canonical repo. Something is wrong."
fi

if [[ ! -d "$CANONICAL_DIR" ]]; then
  fail "No dendrovia/ found at $CANONICAL_DIR"
fi

if [[ ! -d "$CANONICAL_DIR/.git" ]]; then
  # Could be a worktree (.git file) — that's not what we want
  if [[ -f "$CANONICAL_DIR/.git" ]]; then
    fail "$CANONICAL_DIR is a worktree, not a full repo. The canonical must be a real .git directory."
  fi
  fail "$CANONICAL_DIR exists but has no .git — not a git repo."
fi

info "Canonical repo confirmed at $CANONICAL_DIR"
log "Branch: $(current_branch "$CANONICAL_DIR")"
echo ""

# ── Phase 2: Convert remaining pillars ──────────────────────────

info "Converting pillar clones to symlinks/worktrees..."
echo ""

for PILLAR in "${PILLARS[@]}"; do
  # Skip the canonical pillar — it stays as-is
  if [[ "$PILLAR" == "$CANONICAL_PILLAR" ]]; then
    echo "── $PILLAR (canonical) ──"
    log "Canonical host — no conversion needed"
    log "Branch: $(current_branch "$CANONICAL_DIR")"
    echo ""
    continue
  fi

  PILLAR_DIR="$DENROOT/$PILLAR"
  PILLAR_DENDROVIA="$PILLAR_DIR/dendrovia"

  echo "── $PILLAR ──"

  # Skip if already a symlink (already converted)
  if [[ -L "$PILLAR_DENDROVIA" ]]; then
    log "Already a symlink → $(readlink "$PILLAR_DENDROVIA")"
    echo ""
    continue
  fi

  # Skip if it's a worktree (has .git file, not .git directory)
  if [[ -f "$PILLAR_DENDROVIA/.git" ]]; then
    log "Already a worktree"
    log "Branch: $(current_branch "$PILLAR_DENDROVIA")"
    echo ""
    continue
  fi

  # Check if the directory exists and is a full clone
  if [[ ! -d "$PILLAR_DENDROVIA" ]]; then
    log "No dendrovia/ directory — creating symlink"
    run ln -s "$SYMLINK_TARGET" "$PILLAR_DENDROVIA"
    echo ""
    continue
  fi

  # Safety checks
  if is_dirty "$PILLAR_DENDROVIA"; then
    warn "$PILLAR has uncommitted changes — SKIPPING"
    log "Resolve manually: cd $PILLAR_DENDROVIA && git status"
    echo ""
    continue
  fi

  if has_unpushed "$PILLAR_DENDROVIA"; then
    warn "$PILLAR has unpushed commits — SKIPPING"
    log "Resolve manually: cd $PILLAR_DENDROVIA && git push"
    echo ""
    continue
  fi

  BRANCH=$(current_branch "$PILLAR_DENDROVIA")
  log "Current branch: $BRANCH"

  # Remove the full clone
  run rm -rf "$PILLAR_DENDROVIA"

  if [[ "$BRANCH" == "main" || "$BRANCH" == "master" || "$BRANCH" == "unknown" ]]; then
    # Pillar on main — use symlink to canonical
    info "  → Symlink (on main)"
    run ln -s "$SYMLINK_TARGET" "$PILLAR_DENDROVIA"
  else
    # Pillar on feature branch — create worktree
    info "  → Worktree on branch: $BRANCH"
    run git -C "$CANONICAL" worktree add "$PILLAR_DENDROVIA" "$BRANCH"
  fi

  echo ""
done

# ── Phase 3: Verify ─────────────────────────────────────────────

echo "── Verification ──"
echo ""

if ! $DRY_RUN; then
  info "Worktree list:"
  git -C "$CANONICAL" worktree list
  echo ""

  info "Pillar state:"
  for PILLAR in "${PILLARS[@]}"; do
    PILLAR_DENDROVIA="$DENROOT/$PILLAR/dendrovia"
    if [[ "$PILLAR" == "$CANONICAL_PILLAR" ]]; then
      printf "  %-14s → canonical (%s)\n" "$PILLAR" "$(current_branch "$PILLAR_DENDROVIA")"
    elif [[ -L "$PILLAR_DENDROVIA" ]]; then
      printf "  %-14s → symlink (%s)\n" "$PILLAR" "$(readlink "$PILLAR_DENDROVIA")"
    elif [[ -f "$PILLAR_DENDROVIA/.git" ]]; then
      printf "  %-14s → worktree (%s)\n" "$PILLAR" "$(current_branch "$PILLAR_DENDROVIA")"
    elif [[ -d "$PILLAR_DENDROVIA" ]]; then
      printf "  %-14s → full clone (%s)\n" "$PILLAR" "$(current_branch "$PILLAR_DENDROVIA")"
    else
      printf "  %-14s → MISSING\n" "$PILLAR"
    fi
  done

  echo ""
  info "Turborepo note: Each worktree needs its own 'bun install'."
  info "Turbo cache (.turbo/) is per-working-tree — no conflicts between worktrees."
else
  log "[dry-run] Would verify worktree list and symlinks"
fi

echo ""
echo "Done."
