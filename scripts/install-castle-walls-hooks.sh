#!/usr/bin/env bash
set -euo pipefail

# install-castle-walls-hooks.sh
#
# Ensures Castle Walls git hooks are actually active by setting:
#   core.hooksPath = .husky
#
# Usage:
#   scripts/install-castle-walls-hooks.sh
#   scripts/install-castle-walls-hooks.sh --verify

VERIFY_ONLY=false
if [[ "${1:-}" == "--verify" ]]; then
  VERIFY_ONLY=true
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$ROOT" ]]; then
  echo "✗ Not inside a git repository." >&2
  exit 1
fi

cd "$ROOT"

[[ -d ".husky" ]] || { echo "✗ Missing .husky directory at $ROOT/.husky" >&2; exit 1; }

for hook in pre-commit pre-push post-rebase; do
  [[ -f ".husky/$hook" ]] || { echo "✗ Missing hook file: .husky/$hook" >&2; exit 1; }
done

if ! $VERIFY_ONLY; then
  git config core.hooksPath .husky
  chmod +x .husky/*
fi

HOOKS_PATH="$(git config --get core.hooksPath || true)"
if [[ "$HOOKS_PATH" != ".husky" ]]; then
  echo "✗ Hook installation incomplete. Expected core.hooksPath=.husky, got '${HOOKS_PATH:-<unset>}'" >&2
  exit 1
fi

echo "✓ Castle Walls hooks active"
echo "  core.hooksPath = $HOOKS_PATH"
echo "  hooks: .husky/pre-commit, .husky/pre-push, .husky/post-rebase"
