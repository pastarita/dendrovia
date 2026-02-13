#!/usr/bin/env bash
#
# Install Dendrovia Ghostty Themes
# Copies custom themes from repository to Ghostty config directory
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
THEMES_SRC="$SCRIPT_DIR/themes"
THEMES_DEST="$HOME/.config/ghostty/themes"

echo "📦 Installing Dendrovia Ghostty themes..."

# Create themes directory if it doesn't exist
if [ ! -d "$THEMES_DEST" ]; then
  echo "   Creating $THEMES_DEST"
  mkdir -p "$THEMES_DEST"
fi

# Copy each theme file
THEME_COUNT=0
for theme_file in "$THEMES_SRC"/dendrovia-*; do
  if [ -f "$theme_file" ]; then
    theme_name=$(basename "$theme_file")
    echo "   Installing $theme_name"
    cp "$theme_file" "$THEMES_DEST/$theme_name"
    ((THEME_COUNT++))
  fi
done

echo "✅ Installed $THEME_COUNT Dendrovia themes to $THEMES_DEST"
echo ""
echo "Available themes:"
ls "$THEMES_DEST"/dendrovia-* 2>/dev/null | xargs -n1 basename || echo "   (none found)"
echo ""
echo "To test a theme:"
echo '   open -na Ghostty.app --args --theme="dendrovia-chronos"'
