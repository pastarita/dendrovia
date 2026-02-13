#!/bin/bash

# Setup iTerm2 Color Profiles for Dendrovia Pillars
# Creates 6 custom profiles matching the exact Ghostty/VS Code theme colors

echo "🌳 Setting up Dendrovia iTerm2 color profiles..."

PROFILES_DIR="$HOME/Library/Application Support/iTerm2/DynamicProfiles"
mkdir -p "$PROFILES_DIR"

# Helper function to convert hex to iTerm2 RGB dict
hex_to_iterm_color() {
  local hex=$1
  # Remove # if present
  hex=${hex#"#"}

  # Convert hex to decimal RGB (0-255)
  local r=$((16#${hex:0:2}))
  local g=$((16#${hex:2:2}))
  local b=$((16#${hex:4:2}))

  # Convert to 0-1 range
  local r_float=$(echo "scale=4; $r / 255" | bc)
  local g_float=$(echo "scale=4; $g / 255" | bc)
  local b_float=$(echo "scale=4; $b / 255" | bc)

  cat <<COLORDICT
      <dict>
        <key>Red Component</key>
        <real>$r_float</real>
        <key>Green Component</key>
        <real>$g_float</real>
        <key>Blue Component</key>
        <real>$b_float</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>
COLORDICT
}

cat > "$PROFILES_DIR/Dendrovia.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Profiles</key>
  <array>

    <!-- CHRONOS: Archaeological Amber -->
    <dict>
      <key>Name</key>
      <string>Dendrovia-CHRONOS</string>
      <key>Guid</key>
      <string>dendrovia-chronos</string>
      <key>Description</key>
      <string>CHRONOS - Archaeological amber theme</string>

      <!-- Background: #2a1f16 -->
      <key>Background Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.1647</real>
        <key>Green Component</key>
        <real>0.1216</real>
        <key>Blue Component</key>
        <real>0.0863</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <!-- Foreground: #e8d7c3 -->
      <key>Foreground Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.9098</real>
        <key>Green Component</key>
        <real>0.8431</real>
        <key>Blue Component</key>
        <real>0.7647</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <!-- Cursor: #dda15e -->
      <key>Cursor Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.8667</real>
        <key>Green Component</key>
        <real>0.6314</real>
        <key>Blue Component</key>
        <real>0.3686</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <!-- Selection: #8b7355 -->
      <key>Selection Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.5451</real>
        <key>Green Component</key>
        <real>0.4510</real>
        <key>Blue Component</key>
        <real>0.3333</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <!-- ANSI Colors -->
      <key>Ansi 0 Color</key>
      <dict><key>Red Component</key><real>0.2902</real><key>Green Component</key><real>0.2196</real><key>Blue Component</key><real>0.1333</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 1 Color</key>
      <dict><key>Red Component</key><real>0.7216</real><key>Green Component</key><real>0.3608</real><key>Blue Component</key><real>0.2196</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 2 Color</key>
      <dict><key>Red Component</key><real>0.5451</real><key>Green Component</key><real>0.5804</real><key>Blue Component</key><real>0.3373</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 3 Color</key>
      <dict><key>Red Component</key><real>0.8314</real><key>Green Component</key><real>0.6471</real><key>Blue Component</key><real>0.4549</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 4 Color</key>
      <dict><key>Red Component</key><real>0.4902</real><key>Green Component</key><real>0.5961</real><key>Blue Component</key><real>0.6314</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 5 Color</key>
      <dict><key>Red Component</key><real>0.6275</real><key>Green Component</key><real>0.4902</real><key>Blue Component</key><real>0.4353</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 6 Color</key>
      <dict><key>Red Component</key><real>0.6157</real><key>Green Component</key><real>0.6667</real><key>Blue Component</key><real>0.6118</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 7 Color</key>
      <dict><key>Red Component</key><real>0.9098</real><key>Green Component</key><real>0.8431</real><key>Blue Component</key><real>0.7647</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 8 Color</key>
      <dict><key>Red Component</key><real>0.4196</real><key>Green Component</key><real>0.3490</real><key>Blue Component</key><real>0.2510</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 9 Color</key>
      <dict><key>Red Component</key><real>0.8667</real><key>Green Component</key><real>0.6314</real><key>Blue Component</key><real>0.3686</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 10 Color</key>
      <dict><key>Red Component</key><real>0.7098</real><key>Green Component</key><real>0.7765</real><key>Blue Component</key><real>0.5373</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 11 Color</key>
      <dict><key>Red Component</key><real>0.9255</real><key>Green Component</key><real>0.7529</real><key>Blue Component</key><real>0.5804</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 12 Color</key>
      <dict><key>Red Component</key><real>0.6588</real><key>Green Component</key><real>0.7725</real><key>Blue Component</key><real>0.8196</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 13 Color</key>
      <dict><key>Red Component</key><real>0.7882</real><key>Green Component</key><real>0.6706</real><key>Blue Component</key><real>0.6196</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 14 Color</key>
      <dict><key>Red Component</key><real>0.7725</real><key>Green Component</key><real>0.8392</real><key>Blue Component</key><real>0.7765</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 15 Color</key>
      <dict><key>Red Component</key><real>0.9608</real><key>Green Component</key><real>0.9294</real><key>Blue Component</key><real>0.8824</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
    </dict>

    <!-- IMAGINARIUM: Alchemical Violet -->
    <dict>
      <key>Name</key>
      <string>Dendrovia-IMAGINARIUM</string>
      <key>Guid</key>
      <string>dendrovia-imaginarium</string>

      <!-- Background: #24202f -->
      <key>Background Color</key>
      <dict><key>Red Component</key><real>0.1412</real><key>Green Component</key><real>0.1255</real><key>Blue Component</key><real>0.1843</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Foreground: #ede7f6 -->
      <key>Foreground Color</key>
      <dict><key>Red Component</key><real>0.9294</real><key>Green Component</key><real>0.9059</real><key>Blue Component</key><real>0.9647</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Cursor: #dda0dd -->
      <key>Cursor Color</key>
      <dict><key>Red Component</key><real>0.8667</real><key>Green Component</key><real>0.6275</real><key>Blue Component</key><real>0.8667</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Selection: #6e5494 -->
      <key>Selection Color</key>
      <dict><key>Red Component</key><real>0.4314</real><key>Green Component</key><real>0.3294</real><key>Blue Component</key><real>0.5804</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- ANSI Colors -->
      <key>Ansi 0 Color</key>
      <dict><key>Red Component</key><real>0.2431</real><key>Green Component</key><real>0.2118</real><key>Blue Component</key><real>0.3137</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 1 Color</key>
      <dict><key>Red Component</key><real>0.8471</real><key>Green Component</key><real>0.5882</real><key>Blue Component</key><real>1.0000</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 2 Color</key>
      <dict><key>Red Component</key><real>0.4902</real><key>Green Component</key><real>0.7686</real><key>Blue Component</key><real>0.6275</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 3 Color</key>
      <dict><key>Red Component</key><real>0.7765</real><key>Green Component</key><real>0.6275</real><key>Blue Component</key><real>0.9647</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 4 Color</key>
      <dict><key>Red Component</key><real>0.5451</real><key>Green Component</key><real>0.6157</real><key>Blue Component</key><real>0.7647</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 5 Color</key>
      <dict><key>Red Component</key><real>0.7216</real><key>Green Component</key><real>0.5686</real><key>Blue Component</key><real>0.7882</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 6 Color</key>
      <dict><key>Red Component</key><real>0.6471</real><key>Green Component</key><real>0.6275</real><key>Blue Component</key><real>0.8510</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 7 Color</key>
      <dict><key>Red Component</key><real>0.9294</real><key>Green Component</key><real>0.9059</real><key>Blue Component</key><real>0.9647</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 8 Color</key>
      <dict><key>Red Component</key><real>0.3647</real><key>Green Component</key><real>0.3216</real><key>Blue Component</key><real>0.4392</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 9 Color</key>
      <dict><key>Red Component</key><real>0.9098</real><key>Green Component</key><real>0.7255</real><key>Blue Component</key><real>1.0000</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 10 Color</key>
      <dict><key>Red Component</key><real>0.6157</real><key>Green Component</key><real>0.8510</real><key>Blue Component</key><real>0.7373</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 11 Color</key>
      <dict><key>Red Component</key><real>0.8667</real><key>Green Component</key><real>0.7608</real><key>Blue Component</key><real>1.0000</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 12 Color</key>
      <dict><key>Red Component</key><real>0.7098</real><key>Green Component</key><real>0.7725</real><key>Blue Component</key><real>0.8902</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 13 Color</key>
      <dict><key>Red Component</key><real>0.8196</real><key>Green Component</key><real>0.7098</real><key>Blue Component</key><real>0.8980</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 14 Color</key>
      <dict><key>Red Component</key><real>0.7882</real><key>Green Component</key><real>0.7686</real><key>Blue Component</key><real>0.9529</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 15 Color</key>
      <dict><key>Red Component</key><real>0.9725</real><key>Green Component</key><real>0.9569</real><key>Blue Component</key><real>1.0000</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
    </dict>

    <!-- ARCHITECTUS: Computational Blue -->
    <dict>
      <key>Name</key>
      <string>Dendrovia-ARCHITECTUS</string>
      <key>Guid</key>
      <string>dendrovia-architectus</string>

      <!-- Background: #1a1f2e -->
      <key>Background Color</key>
      <dict><key>Red Component</key><real>0.1020</real><key>Green Component</key><real>0.1216</real><key>Blue Component</key><real>0.1804</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Foreground: #e3ebf5 -->
      <key>Foreground Color</key>
      <dict><key>Red Component</key><real>0.8902</real><key>Green Component</key><real>0.9216</real><key>Blue Component</key><real>0.9608</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Cursor: #6fa8dc -->
      <key>Cursor Color</key>
      <dict><key>Red Component</key><real>0.4353</real><key>Green Component</key><real>0.6588</real><key>Blue Component</key><real>0.8627</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Selection: #3d5a7e -->
      <key>Selection Color</key>
      <dict><key>Red Component</key><real>0.2392</real><key>Green Component</key><real>0.3529</real><key>Blue Component</key><real>0.4941</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- ANSI Colors -->
      <key>Ansi 0 Color</key>
      <dict><key>Red Component</key><real>0.1765</real><key>Green Component</key><real>0.2157</real><key>Blue Component</key><real>0.2824</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 1 Color</key>
      <dict><key>Red Component</key><real>0.3882</real><key>Green Component</key><real>0.6588</real><key>Blue Component</key><real>0.9098</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 2 Color</key>
      <dict><key>Red Component</key><real>0.4157</real><key>Green Component</key><real>0.7020</real><key>Blue Component</key><real>0.5412</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 3 Color</key>
      <dict><key>Red Component</key><real>0.5412</real><key>Green Component</key><real>0.7059</real><key>Blue Component</key><real>0.9725</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 4 Color</key>
      <dict><key>Red Component</key><real>0.3647</real><key>Green Component</key><real>0.5294</real><key>Blue Component</key><real>0.7882</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 5 Color</key>
      <dict><key>Red Component</key><real>0.4784</real><key>Green Component</key><real>0.5608</real><key>Blue Component</key><real>0.7804</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 6 Color</key>
      <dict><key>Red Component</key><real>0.4902</real><key>Green Component</key><real>0.7020</real><key>Blue Component</key><real>0.7882</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 7 Color</key>
      <dict><key>Red Component</key><real>0.8902</real><key>Green Component</key><real>0.9216</real><key>Blue Component</key><real>0.9608</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 8 Color</key>
      <dict><key>Red Component</key><real>0.2784</real><key>Green Component</key><real>0.3333</real><key>Blue Component</key><real>0.4118</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 9 Color</key>
      <dict><key>Red Component</key><real>0.5216</real><key>Green Component</key><real>0.7529</real><key>Blue Component</key><real>1.0000</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 10 Color</key>
      <dict><key>Red Component</key><real>0.5294</real><key>Green Component</key><real>0.8275</real><key>Blue Component</key><real>0.6588</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 11 Color</key>
      <dict><key>Red Component</key><real>0.6471</real><key>Green Component</key><real>0.8078</real><key>Blue Component</key><real>1.0000</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 12 Color</key>
      <dict><key>Red Component</key><real>0.4941</real><key>Green Component</key><real>0.6471</real><key>Blue Component</key><real>0.8902</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 13 Color</key>
      <dict><key>Red Component</key><real>0.6157</real><key>Green Component</key><real>0.6667</real><key>Blue Component</key><real>0.8902</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 14 Color</key>
      <dict><key>Red Component</key><real>0.6392</real><key>Green Component</key><real>0.8235</real><key>Blue Component</key><real>0.9098</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 15 Color</key>
      <dict><key>Red Component</key><real>0.9412</real><key>Green Component</key><real>0.9647</real><key>Blue Component</key><real>1.0000</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
    </dict>

    <!-- LUDUS: Tactical Green -->
    <dict>
      <key>Name</key>
      <string>Dendrovia-LUDUS</string>
      <key>Guid</key>
      <string>dendrovia-ludus</string>

      <!-- Background: #1a2520 -->
      <key>Background Color</key>
      <dict><key>Red Component</key><real>0.1020</real><key>Green Component</key><real>0.1451</real><key>Blue Component</key><real>0.1255</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Foreground: #e4f0e7 -->
      <key>Foreground Color</key>
      <dict><key>Red Component</key><real>0.8941</real><key>Green Component</key><real>0.9412</real><key>Blue Component</key><real>0.9059</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Cursor: #6fb583 -->
      <key>Cursor Color</key>
      <dict><key>Red Component</key><real>0.4353</real><key>Green Component</key><real>0.7098</real><key>Blue Component</key><real>0.5137</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Selection: #3d5e4a -->
      <key>Selection Color</key>
      <dict><key>Red Component</key><real>0.2392</real><key>Green Component</key><real>0.3686</real><key>Blue Component</key><real>0.2902</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- ANSI Colors -->
      <key>Ansi 0 Color</key>
      <dict><key>Red Component</key><real>0.1765</real><key>Green Component</key><real>0.2431</real><key>Blue Component</key><real>0.2078</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 1 Color</key>
      <dict><key>Red Component</key><real>0.4784</real><key>Green Component</key><real>0.7216</real><key>Blue Component</key><real>0.5569</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 2 Color</key>
      <dict><key>Red Component</key><real>0.5059</real><key>Green Component</key><real>0.7882</real><key>Blue Component</key><real>0.5843</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 3 Color</key>
      <dict><key>Red Component</key><real>0.6157</real><key>Green Component</key><real>0.8510</real><key>Blue Component</key><real>0.6745</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 4 Color</key>
      <dict><key>Red Component</key><real>0.4275</real><key>Green Component</key><real>0.6510</real><key>Blue Component</key><real>0.5647</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 5 Color</key>
      <dict><key>Red Component</key><real>0.5569</real><key>Green Component</key><real>0.6902</real><key>Blue Component</key><real>0.6196</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 6 Color</key>
      <dict><key>Red Component</key><real>0.4902</real><key>Green Component</key><real>0.7490</real><key>Blue Component</key><real>0.6471</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 7 Color</key>
      <dict><key>Red Component</key><real>0.8941</real><key>Green Component</key><real>0.9412</real><key>Blue Component</key><real>0.9059</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 8 Color</key>
      <dict><key>Red Component</key><real>0.2784</real><key>Green Component</key><real>0.3529</real><key>Blue Component</key><real>0.3137</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 9 Color</key>
      <dict><key>Red Component</key><real>0.5843</real><key>Green Component</key><real>0.8314</real><key>Blue Component</key><real>0.6510</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 10 Color</key>
      <dict><key>Red Component</key><real>0.6000</real><key>Green Component</key><real>0.8902</real><key>Blue Component</key><real>0.6902</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 11 Color</key>
      <dict><key>Red Component</key><real>0.7098</real><key>Green Component</key><real>0.9412</real><key>Blue Component</key><real>0.7725</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 12 Color</key>
      <dict><key>Red Component</key><real>0.5373</real><key>Green Component</key><real>0.7608</real><key>Blue Component</key><real>0.6745</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 13 Color</key>
      <dict><key>Red Component</key><real>0.6588</real><key>Green Component</key><real>0.8196</real><key>Blue Component</key><real>0.7451</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 14 Color</key>
      <dict><key>Red Component</key><real>0.6039</real><key>Green Component</key><real>0.8784</real><key>Blue Component</key><real>0.7686</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 15 Color</key>
      <dict><key>Red Component</key><real>0.9412</real><key>Green Component</key><real>0.9765</real><key>Blue Component</key><real>0.9529</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
    </dict>

    <!-- OCULUS: Observational Amber -->
    <dict>
      <key>Name</key>
      <string>Dendrovia-OCULUS</string>
      <key>Guid</key>
      <string>dendrovia-oculus</string>

      <!-- Background: #2a1e1a -->
      <key>Background Color</key>
      <dict><key>Red Component</key><real>0.1647</real><key>Green Component</key><real>0.1176</real><key>Blue Component</key><real>0.1020</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Foreground: #f0e6dc -->
      <key>Foreground Color</key>
      <dict><key>Red Component</key><real>0.9412</real><key>Green Component</key><real>0.9020</real><key>Blue Component</key><real>0.8627</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Cursor: #e89566 -->
      <key>Cursor Color</key>
      <dict><key>Red Component</key><real>0.9098</real><key>Green Component</key><real>0.5843</real><key>Blue Component</key><real>0.4000</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Selection: #8b6350 -->
      <key>Selection Color</key>
      <dict><key>Red Component</key><real>0.5451</real><key>Green Component</key><real>0.3882</real><key>Blue Component</key><real>0.3137</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- ANSI Colors -->
      <key>Ansi 0 Color</key>
      <dict><key>Red Component</key><real>0.2902</real><key>Green Component</key><real>0.2039</real><key>Blue Component</key><real>0.1647</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 1 Color</key>
      <dict><key>Red Component</key><real>0.9608</real><key>Green Component</key><real>0.6627</real><key>Blue Component</key><real>0.4980</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 2 Color</key>
      <dict><key>Red Component</key><real>0.6157</real><key>Green Component</key><real>0.6667</real><key>Blue Component</key><real>0.5412</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 3 Color</key>
      <dict><key>Red Component</key><real>0.9608</real><key>Green Component</key><real>0.7843</real><key>Blue Component</key><real>0.5804</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 4 Color</key>
      <dict><key>Red Component</key><real>0.6588</real><key>Green Component</key><real>0.5843</real><key>Blue Component</key><real>0.5412</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 5 Color</key>
      <dict><key>Red Component</key><real>0.7686</real><key>Green Component</key><real>0.6039</real><key>Blue Component</key><real>0.5294</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 6 Color</key>
      <dict><key>Red Component</key><real>0.7216</real><key>Green Component</key><real>0.6275</real><key>Blue Component</key><real>0.5843</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 7 Color</key>
      <dict><key>Red Component</key><real>0.9412</real><key>Green Component</key><real>0.9020</real><key>Blue Component</key><real>0.8627</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 8 Color</key>
      <dict><key>Red Component</key><real>0.4196</real><key>Green Component</key><real>0.3137</real><key>Blue Component</key><real>0.2667</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 9 Color</key>
      <dict><key>Red Component</key><real>1.0000</real><key>Green Component</key><real>0.7608</real><key>Blue Component</key><real>0.6000</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 10 Color</key>
      <dict><key>Red Component</key><real>0.7255</real><key>Green Component</key><real>0.8196</real><key>Blue Component</key><real>0.6510</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 11 Color</key>
      <dict><key>Red Component</key><real>1.0000</real><key>Green Component</key><real>0.8667</real><key>Blue Component</key><real>0.6902</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 12 Color</key>
      <dict><key>Red Component</key><real>0.7882</real><key>Green Component</key><real>0.7098</real><key>Blue Component</key><real>0.6588</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 13 Color</key>
      <dict><key>Red Component</key><real>0.8784</real><key>Green Component</key><real>0.7294</real><key>Blue Component</key><real>0.6549</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 14 Color</key>
      <dict><key>Red Component</key><real>0.8510</real><key>Green Component</key><real>0.7686</real><key>Blue Component</key><real>0.7216</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 15 Color</key>
      <dict><key>Red Component</key><real>0.9804</real><key>Green Component</key><real>0.9569</real><key>Blue Component</key><real>0.9333</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
    </dict>

    <!-- OPERATUS: Industrial Grey -->
    <dict>
      <key>Name</key>
      <string>Dendrovia-OPERATUS</string>
      <key>Guid</key>
      <string>dendrovia-operatus</string>

      <!-- Background: #1a1d23 -->
      <key>Background Color</key>
      <dict><key>Red Component</key><real>0.1020</real><key>Green Component</key><real>0.1137</real><key>Blue Component</key><real>0.1373</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Foreground: #e5e7eb -->
      <key>Foreground Color</key>
      <dict><key>Red Component</key><real>0.8980</real><key>Green Component</key><real>0.9059</real><key>Blue Component</key><real>0.9216</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Cursor: #6b7280 -->
      <key>Cursor Color</key>
      <dict><key>Red Component</key><real>0.4196</real><key>Green Component</key><real>0.4471</real><key>Blue Component</key><real>0.5020</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- Selection: #4b5563 -->
      <key>Selection Color</key>
      <dict><key>Red Component</key><real>0.2941</real><key>Green Component</key><real>0.3333</real><key>Blue Component</key><real>0.3882</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>

      <!-- ANSI Colors -->
      <key>Ansi 0 Color</key>
      <dict><key>Red Component</key><real>0.2157</real><key>Green Component</key><real>0.2549</real><key>Blue Component</key><real>0.3176</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 1 Color</key>
      <dict><key>Red Component</key><real>0.5451</real><key>Green Component</key><real>0.5725</real><key>Blue Component</key><real>0.6275</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 2 Color</key>
      <dict><key>Red Component</key><real>0.5176</real><key>Green Component</key><real>0.6627</real><key>Blue Component</key><real>0.5490</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 3 Color</key>
      <dict><key>Red Component</key><real>0.6118</real><key>Green Component</key><real>0.6392</real><key>Blue Component</key><real>0.6863</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 4 Color</key>
      <dict><key>Red Component</key><real>0.4784</real><key>Green Component</key><real>0.5490</real><key>Blue Component</key><real>0.6314</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 5 Color</key>
      <dict><key>Red Component</key><real>0.5647</real><key>Green Component</key><real>0.5333</real><key>Blue Component</key><real>0.6392</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 6 Color</key>
      <dict><key>Red Component</key><real>0.5451</real><key>Green Component</key><real>0.6000</real><key>Blue Component</key><real>0.6588</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 7 Color</key>
      <dict><key>Red Component</key><real>0.8980</real><key>Green Component</key><real>0.9059</real><key>Blue Component</key><real>0.9216</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 8 Color</key>
      <dict><key>Red Component</key><real>0.3216</real><key>Green Component</key><real>0.3765</real><key>Blue Component</key><real>0.4353</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 9 Color</key>
      <dict><key>Red Component</key><real>0.6588</real><key>Green Component</key><real>0.6902</real><key>Blue Component</key><real>0.7490</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 10 Color</key>
      <dict><key>Red Component</key><real>0.6196</real><key>Green Component</key><real>0.7686</real><key>Blue Component</key><real>0.6627</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 11 Color</key>
      <dict><key>Red Component</key><real>0.7216</real><key>Green Component</key><real>0.7529</real><key>Blue Component</key><real>0.8118</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 12 Color</key>
      <dict><key>Red Component</key><real>0.5922</real><key>Green Component</key><real>0.6706</real><key>Blue Component</key><real>0.7529</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 13 Color</key>
      <dict><key>Red Component</key><real>0.6706</real><key>Green Component</key><real>0.6353</real><key>Blue Component</key><real>0.7608</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 14 Color</key>
      <dict><key>Red Component</key><real>0.6549</real><key>Green Component</key><real>0.7216</real><key>Blue Component</key><real>0.7882</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
      <key>Ansi 15 Color</key>
      <dict><key>Red Component</key><real>0.9529</real><key>Green Component</key><real>0.9569</real><key>Blue Component</key><real>0.9647</real><key>Alpha Component</key><real>1</real><key>Color Space</key><string>sRGB</string></dict>
    </dict>

  </array>
</dict>
</plist>
EOF

echo "✅ Created iTerm2 dynamic profiles with exact Dendrovia colors"
echo ""
echo "📋 Profiles installed:"
echo "   📜 Dendrovia-CHRONOS      - Archaeological amber (#d4a574)"
echo "   🎨 Dendrovia-IMAGINARIUM  - Alchemical violet (#c6a0f6)"
echo "   🏛️ Dendrovia-ARCHITECTUS  - Computational blue (#8ab4f8)"
echo "   🎮 Dendrovia-LUDUS        - Tactical green (#81c995)"
echo "   👁️ Dendrovia-OCULUS       - Observational amber (#f5a97f)"
echo "   💾 Dendrovia-OPERATUS     - Industrial grey (#9ca3af)"
echo ""
echo "🔄 Restart iTerm2 to load the new profiles"
echo "   Or go to: Preferences → Profiles → Other Actions → Reload Dynamic Profiles"
