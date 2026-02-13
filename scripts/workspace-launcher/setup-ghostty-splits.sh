#!/bin/bash
#
# Setup Ghostty window splits for all pillar windows
# Creates 70/30 horizontal split with bottom split vertically
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Pillar window identifiers
declare -a PILLARS=(
    "CHR - The Archaeologist"
    "IMG - The Compiler"
    "ARC - The Renderer"
    "LUD - The Mechanics"
    "OCU - The Interface"
    "OPR - The Infrastructure"
)

echo "🌳 Setting up Ghostty window splits..."
echo ""

# Wait for windows to be ready
echo "⏳ Waiting 2 seconds for windows to initialize..."
sleep 2

# Apply split layout to each window
for pillar in "${PILLARS[@]}"; do
    echo "  📐 Configuring splits for: $pillar"

    # Run AppleScript to create splits
    osascript "$SCRIPT_DIR/ghostty-split-layout.applescript" "$pillar" 2>/dev/null || {
        echo "     ⚠️  Warning: Could not configure $pillar (window may not exist)"
        continue
    }

    # Small delay between windows
    sleep 0.5
done

echo ""
echo "✅ Split layouts configured!"
echo ""
echo "💡 Manual adjustments:"
echo "   • cmd+option+arrow    - Resize splits"
echo "   • cmd+shift+enter     - Toggle split zoom"
echo "   • cmd+[ / cmd+]       - Navigate between splits"
echo ""
