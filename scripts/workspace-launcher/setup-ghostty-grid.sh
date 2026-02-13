#!/usr/bin/env bash
#
# Setup Ghostty Window Grid Layout
# Arranges 6 Ghostty windows in a 3x2 grid on the main display
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📐 Arranging Ghostty windows in grid layout..."
echo ""

# Wait a moment for windows to fully open
sleep 1

# Run the AppleScript to arrange windows
osascript "$SCRIPT_DIR/ghostty-window-grid.applescript"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Windows arranged in 3x2 grid"
  echo ""
  echo "Grid layout:"
  echo "┌─────────────┬─────────────┬─────────────┐"
  echo "│   CHRONOS   │ IMAGINARIUM │ ARCHITECTUS │"
  echo "├─────────────┼─────────────┼─────────────┤"
  echo "│    LUDUS    │   OCULUS    │  OPERATUS   │"
  echo "└─────────────┴─────────────┴─────────────┘"
else
  echo ""
  echo "⚠️  Could not arrange windows in grid"
  echo "    Make sure Accessibility permissions are granted"
fi
