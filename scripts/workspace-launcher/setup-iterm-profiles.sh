#!/bin/bash

# Setup iTerm2 Color Profiles for Dendrovia Pillars
# Creates 6 custom profiles with Monument Valley-inspired color schemes

echo "🌳 Setting up Dendrovia iTerm2 color profiles..."

PROFILES_DIR="$HOME/Library/Application Support/iTerm2/DynamicProfiles"
mkdir -p "$PROFILES_DIR"

cat > "$PROFILES_DIR/Dendrovia.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Profiles</key>
  <array>

    <!-- CHRONOS: Amber/Sepia (Archaeological) -->
    <dict>
      <key>Name</key>
      <string>Dendrovia-CHRONOS</string>
      <key>Guid</key>
      <string>dendrovia-chronos</string>
      <key>Description</key>
      <string>CHRONOS - Archaeological amber/sepia theme</string>

      <key>Background Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.15</real>
        <key>Green Component</key>
        <real>0.12</real>
        <key>Blue Component</key>
        <real>0.10</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <key>Foreground Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.85</real>
        <key>Green Component</key>
        <real>0.75</real>
        <key>Blue Component</key>
        <real>0.55</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <key>Cursor Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.95</real>
        <key>Green Component</key>
        <real>0.80</real>
        <key>Blue Component</key>
        <real>0.50</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>
    </dict>

    <!-- IMAGINARIUM: Purple/Magenta (Creative) -->
    <dict>
      <key>Name</key>
      <string>Dendrovia-IMAGINARIUM</string>
      <key>Guid</key>
      <string>dendrovia-imaginarium</string>
      <key>Description</key>
      <string>IMAGINARIUM - Creative purple/magenta theme</string>

      <key>Background Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.12</real>
        <key>Green Component</key>
        <real>0.10</real>
        <key>Blue Component</key>
        <real>0.18</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <key>Foreground Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.85</real>
        <key>Green Component</key>
        <real>0.70</real>
        <key>Blue Component</key>
        <real>0.95</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <key>Cursor Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.95</real>
        <key>Green Component</key>
        <real>0.60</real>
        <key>Blue Component</key>
        <real>0.95</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>
    </dict>

    <!-- ARCHITECTUS: Blue/Cyan (Technical) -->
    <dict>
      <key>Name</key>
      <string>Dendrovia-ARCHITECTUS</string>
      <key>Guid</key>
      <string>dendrovia-architectus</string>
      <key>Description</key>
      <string>ARCHITECTUS - Technical blue/cyan theme</string>

      <key>Background Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.08</real>
        <key>Green Component</key>
        <real>0.12</real>
        <key>Blue Component</key>
        <real>0.16</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <key>Foreground Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.60</real>
        <key>Green Component</key>
        <real>0.85</real>
        <key>Blue Component</key>
        <real>0.95</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <key>Cursor Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.40</real>
        <key>Green Component</key>
        <real>0.90</real>
        <key>Blue Component</key>
        <real>0.95</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>
    </dict>

    <!-- LUDUS: Green (Game-like) -->
    <dict>
      <key>Name</key>
      <string>Dendrovia-LUDUS</string>
      <key>Guid</key>
      <string>dendrovia-ludus</string>
      <key>Description</key>
      <string>LUDUS - Game-like green theme</string>

      <key>Background Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.08</real>
        <key>Green Component</key>
        <real>0.14</real>
        <key>Blue Component</key>
        <real>0.10</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <key>Foreground Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.60</real>
        <key>Green Component</key>
        <real>0.95</real>
        <key>Blue Component</key>
        <real>0.70</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <key>Cursor Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.50</real>
        <key>Green Component</key>
        <real>0.95</real>
        <key>Blue Component</key>
        <real>0.60</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>
    </dict>

    <!-- OCULUS: Orange/Coral (Warm) -->
    <dict>
      <key>Name</key>
      <string>Dendrovia-OCULUS</string>
      <key>Guid</key>
      <string>dendrovia-oculus</string>
      <key>Description</key>
      <string>OCULUS - Warm orange/coral theme</string>

      <key>Background Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.16</real>
        <key>Green Component</key>
        <real>0.11</real>
        <key>Blue Component</key>
        <real>0.09</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <key>Foreground Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.95</real>
        <key>Green Component</key>
        <real>0.75</real>
        <key>Blue Component</key>
        <real>0.60</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <key>Cursor Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.95</real>
        <key>Green Component</key>
        <real>0.65</real>
        <key>Blue Component</key>
        <real>0.45</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>
    </dict>

    <!-- OPERATUS: Gray/Steel (Industrial) -->
    <dict>
      <key>Name</key>
      <string>Dendrovia-OPERATUS</string>
      <key>Guid</key>
      <string>dendrovia-operatus</string>
      <key>Description</key>
      <string>OPERATUS - Industrial gray/steel theme</string>

      <key>Background Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.11</real>
        <key>Green Component</key>
        <real>0.12</real>
        <key>Blue Component</key>
        <real>0.13</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <key>Foreground Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.75</real>
        <key>Green Component</key>
        <real>0.78</real>
        <key>Blue Component</key>
        <real>0.82</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>

      <key>Cursor Color</key>
      <dict>
        <key>Red Component</key>
        <real>0.65</real>
        <key>Green Component</key>
        <real>0.75</real>
        <key>Blue Component</key>
        <real>0.85</real>
        <key>Alpha Component</key>
        <real>1</real>
        <key>Color Space</key>
        <string>sRGB</string>
      </dict>
    </dict>

  </array>
</dict>
</plist>
EOF

echo "✅ Created iTerm2 dynamic profiles at:"
echo "   $PROFILES_DIR/Dendrovia.plist"
echo ""
echo "📋 Color Themes:"
echo "   📜 CHRONOS      - Amber/Sepia (archaeological)"
echo "   🎨 IMAGINARIUM  - Purple/Magenta (creative)"
echo "   🏛️ ARCHITECTUS  - Blue/Cyan (technical)"
echo "   🎮 LUDUS        - Green (game-like)"
echo "   👁️ OCULUS       - Orange/Coral (warm)"
echo "   💾 OPERATUS     - Gray/Steel (industrial)"
echo ""
echo "🔄 Restart iTerm2 to load the new profiles"
