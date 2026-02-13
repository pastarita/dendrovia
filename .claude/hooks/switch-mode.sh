#!/bin/sh
# ════════════════════════════════════════════════════════════════
# Castle Walls — Policy Mode Switcher
# Dendrovia Monorepo
#
# Usage:
#   .claude/hooks/switch-mode.sh <mode>
#   .claude/hooks/switch-mode.sh        # Show current mode
#
# Available modes: default, testing, rendover, deployment
# ════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
POLICIES_DIR="$SCRIPT_DIR/../policies"
MODES_DIR="$POLICIES_DIR/modes"
ACTIVE_MODE_FILE="$POLICIES_DIR/.active-mode"

# Available modes
AVAILABLE_MODES="default testing rendover deployment"

# If no argument, show current mode
if [ -z "$1" ]; then
    if [ -f "$ACTIVE_MODE_FILE" ]; then
        CURRENT=$(cat "$ACTIVE_MODE_FILE")
        echo "Current policy mode: $CURRENT"
    else
        echo "No active mode set (defaulting to 'default')"
    fi
    echo ""
    echo "Available modes:"
    for mode in $AVAILABLE_MODES; do
        MARKER=""
        if [ -f "$ACTIVE_MODE_FILE" ] && [ "$(cat "$ACTIVE_MODE_FILE")" = "$mode" ]; then
            MARKER=" (active)"
        fi
        if [ -f "$MODES_DIR/$mode.yaml" ]; then
            # Extract description from YAML
            DESC=$(grep "^description:" "$MODES_DIR/$mode.yaml" | head -1 | cut -d: -f2- | sed 's/^ //')
            echo "  $mode$MARKER — $DESC"
        else
            echo "  $mode$MARKER — (no policy file)"
        fi
    done
    exit 0
fi

TARGET_MODE="$1"

# Validate mode
VALID=false
for mode in $AVAILABLE_MODES; do
    if [ "$TARGET_MODE" = "$mode" ]; then
        VALID=true
        break
    fi
done

if [ "$VALID" = false ]; then
    echo "Error: Unknown mode '$TARGET_MODE'"
    echo "Available modes: $AVAILABLE_MODES"
    exit 1
fi

# Check policy file exists
if [ ! -f "$MODES_DIR/$TARGET_MODE.yaml" ]; then
    echo "Error: Policy file not found: $MODES_DIR/$TARGET_MODE.yaml"
    exit 1
fi

# Switch mode
echo "$TARGET_MODE" > "$ACTIVE_MODE_FILE"
echo "Policy mode switched to: $TARGET_MODE"

# Show mode description
DESC=$(grep "^description:" "$MODES_DIR/$TARGET_MODE.yaml" | head -1 | cut -d: -f2- | sed 's/^ //')
echo "  $DESC"
