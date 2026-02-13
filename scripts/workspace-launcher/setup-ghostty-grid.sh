#!/usr/bin/env bash
#
# Setup Ghostty Window Grid Layout
# NOTE: Ghostty does not support programmatic window positioning via Accessibility APIs
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "⚠️  Ghostty Window Grid Limitation"
echo ""
echo "Ghostty does not expose windows to macOS Accessibility APIs,"
echo "so automated grid positioning is not currently possible."
echo ""
echo "📖 See GHOSTTY_WINDOW_LIMITATIONS.md for workarounds"
echo ""
echo "💡 Manual positioning options:"
echo "   1. Use Rectangle app (brew install --cask rectangle)"
echo "   2. Use macOS Stage Manager or Split View"
echo "   3. Use Hammerspoon for automation"
echo "   4. Manually arrange with mouse/trackpad"
echo ""
echo "Target grid layout:"
echo "┌─────────────┬─────────────┬─────────────┐"
echo "│   CHRONOS   │ IMAGINARIUM │ ARCHITECTUS │"
echo "├─────────────┼─────────────┼─────────────┤"
echo "│    LUDUS    │   OCULUS    │  OPERATUS   │"
echo "└─────────────┴─────────────┴─────────────┘"
