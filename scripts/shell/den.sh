#!/usr/bin/env bash
# den — navigate to a pillar's dendrovia, re-resolving symlink/worktree state.
#
# After `wt:new` replaces a symlink with a worktree, shells that were already
# cd'd through the old symlink still point to the canonical repo. `den`
# re-resolves the path so you land in the correct working tree.
#
# Usage:
#   den                # cd to current pillar's dendrovia (inferred from $PWD)
#   den IMAGINARIUM    # cd to IMAGINARIUM's dendrovia
#   den status         # show all pillars' dendrovia state
#
# Install — add to ~/.zshrc or ~/.bashrc:
#   source "${DENROOT:-$HOME/denroot}/OPERATUS/dendrovia/scripts/shell/den.sh"

den() {
  local DENROOT="${DENROOT:-$HOME/denroot}"
  local pillars=(CHRONOS IMAGINARIUM ARCHITECTUS LUDUS OCULUS OPERATUS)

  # ── den status ─────────────────────────────────────────────────
  if [[ "${1:-}" == "status" ]]; then
    for p in "${pillars[@]}"; do
      local t="$DENROOT/$p/dendrovia"
      if [[ -L "$t" ]]; then
        printf "  %-14s  symlink\n" "$p"
      elif [[ -f "$t/.git" ]]; then
        printf "  %-14s  worktree → %s\n" "$p" "$(git -C "$t" rev-parse --abbrev-ref HEAD 2>/dev/null)"
      elif [[ -d "$t/.git" ]]; then
        printf "  %-14s  canonical → %s\n" "$p" "$(git -C "$t" rev-parse --abbrev-ref HEAD 2>/dev/null)"
      else
        printf "  %-14s  MISSING\n" "$p"
      fi
    done
    return 0
  fi

  # ── Resolve pillar ─────────────────────────────────────────────
  local pillar="${1:-}"

  # If no argument, infer from current directory
  if [[ -z "$pillar" ]]; then
    for p in "${pillars[@]}"; do
      if [[ "$PWD" == "$DENROOT/$p"* ]]; then
        pillar="$p"
        break
      fi
    done
  fi

  # Uppercase (portable across bash/zsh)
  pillar="$(echo "$pillar" | tr '[:lower:]' '[:upper:]')"

  if [[ -z "$pillar" ]]; then
    echo "Usage: den [PILLAR]   — navigate to a pillar's dendrovia" >&2
    echo "       den status     — show all pillars' state" >&2
    return 1
  fi

  # Validate
  local valid=false
  for p in "${pillars[@]}"; do
    [[ "$p" == "$pillar" ]] && valid=true
  done
  if [[ "$valid" != "true" ]]; then
    echo "den: unknown pillar '$pillar' (valid: ${pillars[*]})" >&2
    return 1
  fi

  local target="$DENROOT/$pillar/dendrovia"
  if [[ ! -e "$target" ]]; then
    echo "den: no dendrovia at $target" >&2
    return 1
  fi

  cd "$target" || return 1
}
