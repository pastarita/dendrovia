#!/bin/bash

# Setup iTerm2 Color Profiles for Dendrovia Pillars
# Creates 6 custom profiles with Monument Valley-inspired color schemes

echo "🌳 Setting up Dendrovia iTerm2 color profiles..."

# Note: iTerm2 profiles are best created via the GUI or by importing JSON
# This script generates the profile definitions that can be imported

PROFILES_DIR="$HOME/Library/Application Support/iTerm2/DynamicProfiles"
mkdir -p "$PROFILES_DIR"

cat > "$PROFILES_DIR/Dendrovia.json" <<'EOF'
{
  "Profiles": [
    {
      "Name": "Dendrovia-CHRONOS",
      "Guid": "dendrovia-chronos",
      "Tags": ["dendrovia", "chronos"],
      "Background Color": {
        "Red": 0.15,
        "Green": 0.12,
        "Blue": 0.10
      },
      "Foreground Color": {
        "Red": 0.85,
        "Green": 0.75,
        "Blue": 0.55
      },
      "Cursor Color": {
        "Red": 0.95,
        "Green": 0.80,
        "Blue": 0.50
      },
      "Ansi 0 Color": {
        "Red": 0.15,
        "Green": 0.12,
        "Blue": 0.10
      },
      "Ansi 1 Color": {
        "Red": 0.85,
        "Green": 0.45,
        "Blue": 0.35
      },
      "Ansi 2 Color": {
        "Red": 0.75,
        "Green": 0.65,
        "Blue": 0.40
      },
      "Ansi 3 Color": {
        "Red": 0.95,
        "Green": 0.80,
        "Blue": 0.50
      },
      "Ansi 4 Color": {
        "Red": 0.55,
        "Green": 0.60,
        "Blue": 0.70
      },
      "Ansi 5 Color": {
        "Red": 0.85,
        "Green": 0.65,
        "Blue": 0.75
      },
      "Ansi 6 Color": {
        "Red": 0.65,
        "Green": 0.75,
        "Blue": 0.75
      },
      "Ansi 7 Color": {
        "Red": 0.90,
        "Green": 0.85,
        "Blue": 0.80
      }
    },
    {
      "Name": "Dendrovia-IMAGINARIUM",
      "Guid": "dendrovia-imaginarium",
      "Tags": ["dendrovia", "imaginarium"],
      "Background Color": {
        "Red": 0.12,
        "Green": 0.10,
        "Blue": 0.18
      },
      "Foreground Color": {
        "Red": 0.85,
        "Green": 0.70,
        "Blue": 0.95
      },
      "Cursor Color": {
        "Red": 0.95,
        "Green": 0.60,
        "Blue": 0.95
      },
      "Ansi 0 Color": {
        "Red": 0.12,
        "Green": 0.10,
        "Blue": 0.18
      },
      "Ansi 1 Color": {
        "Red": 0.95,
        "Green": 0.45,
        "Blue": 0.75
      },
      "Ansi 2 Color": {
        "Red": 0.70,
        "Green": 0.85,
        "Blue": 0.95
      },
      "Ansi 3 Color": {
        "Red": 0.95,
        "Green": 0.80,
        "Blue": 0.95
      },
      "Ansi 4 Color": {
        "Red": 0.65,
        "Green": 0.70,
        "Blue": 0.95
      },
      "Ansi 5 Color": {
        "Red": 0.95,
        "Green": 0.60,
        "Blue": 0.95
      },
      "Ansi 6 Color": {
        "Red": 0.75,
        "Green": 0.85,
        "Blue": 0.95
      },
      "Ansi 7 Color": {
        "Red": 0.95,
        "Green": 0.90,
        "Blue": 0.95
      }
    },
    {
      "Name": "Dendrovia-ARCHITECTUS",
      "Guid": "dendrovia-architectus",
      "Tags": ["dendrovia", "architectus"],
      "Background Color": {
        "Red": 0.08,
        "Green": 0.12,
        "Blue": 0.16
      },
      "Foreground Color": {
        "Red": 0.60,
        "Green": 0.85,
        "Blue": 0.95
      },
      "Cursor Color": {
        "Red": 0.40,
        "Green": 0.90,
        "Blue": 0.95
      },
      "Ansi 0 Color": {
        "Red": 0.08,
        "Green": 0.12,
        "Blue": 0.16
      },
      "Ansi 1 Color": {
        "Red": 0.85,
        "Green": 0.50,
        "Blue": 0.55
      },
      "Ansi 2 Color": {
        "Red": 0.50,
        "Green": 0.85,
        "Blue": 0.75
      },
      "Ansi 3 Color": {
        "Red": 0.75,
        "Green": 0.90,
        "Blue": 0.95
      },
      "Ansi 4 Color": {
        "Red": 0.50,
        "Green": 0.75,
        "Blue": 0.95
      },
      "Ansi 5 Color": {
        "Red": 0.75,
        "Green": 0.70,
        "Blue": 0.90
      },
      "Ansi 6 Color": {
        "Red": 0.60,
        "Green": 0.90,
        "Blue": 0.95
      },
      "Ansi 7 Color": {
        "Red": 0.90,
        "Green": 0.95,
        "Blue": 0.98
      }
    },
    {
      "Name": "Dendrovia-LUDUS",
      "Guid": "dendrovia-ludus",
      "Tags": ["dendrovia", "ludus"],
      "Background Color": {
        "Red": 0.08,
        "Green": 0.14,
        "Blue": 0.10
      },
      "Foreground Color": {
        "Red": 0.60,
        "Green": 0.95,
        "Blue": 0.70
      },
      "Cursor Color": {
        "Red": 0.50,
        "Green": 0.95,
        "Blue": 0.60
      },
      "Ansi 0 Color": {
        "Red": 0.08,
        "Green": 0.14,
        "Blue": 0.10
      },
      "Ansi 1 Color": {
        "Red": 0.95,
        "Green": 0.50,
        "Blue": 0.55
      },
      "Ansi 2 Color": {
        "Red": 0.60,
        "Green": 0.95,
        "Blue": 0.70
      },
      "Ansi 3 Color": {
        "Red": 0.85,
        "Green": 0.95,
        "Blue": 0.60
      },
      "Ansi 4 Color": {
        "Red": 0.55,
        "Green": 0.80,
        "Blue": 0.90
      },
      "Ansi 5 Color": {
        "Red": 0.80,
        "Green": 0.95,
        "Blue": 0.75
      },
      "Ansi 6 Color": {
        "Red": 0.60,
        "Green": 0.95,
        "Blue": 0.85
      },
      "Ansi 7 Color": {
        "Red": 0.90,
        "Green": 0.98,
        "Blue": 0.92
      }
    },
    {
      "Name": "Dendrovia-OCULUS",
      "Guid": "dendrovia-oculus",
      "Tags": ["dendrovia", "oculus"],
      "Background Color": {
        "Red": 0.16,
        "Green": 0.11,
        "Blue": 0.09
      },
      "Foreground Color": {
        "Red": 0.95,
        "Green": 0.75,
        "Blue": 0.60
      },
      "Cursor Color": {
        "Red": 0.95,
        "Green": 0.65,
        "Blue": 0.45
      },
      "Ansi 0 Color": {
        "Red": 0.16,
        "Green": 0.11,
        "Blue": 0.09
      },
      "Ansi 1 Color": {
        "Red": 0.95,
        "Green": 0.45,
        "Blue": 0.40
      },
      "Ansi 2 Color": {
        "Red": 0.85,
        "Green": 0.85,
        "Blue": 0.60
      },
      "Ansi 3 Color": {
        "Red": 0.95,
        "Green": 0.75,
        "Blue": 0.50
      },
      "Ansi 4 Color": {
        "Red": 0.70,
        "Green": 0.75,
        "Blue": 0.90
      },
      "Ansi 5 Color": {
        "Red": 0.95,
        "Green": 0.65,
        "Blue": 0.75
      },
      "Ansi 6 Color": {
        "Red": 0.75,
        "Green": 0.85,
        "Blue": 0.85
      },
      "Ansi 7 Color": {
        "Red": 0.98,
        "Green": 0.92,
        "Blue": 0.88
      }
    },
    {
      "Name": "Dendrovia-OPERATUS",
      "Guid": "dendrovia-operatus",
      "Tags": ["dendrovia", "operatus"],
      "Background Color": {
        "Red": 0.11,
        "Green": 0.12,
        "Blue": 0.13
      },
      "Foreground Color": {
        "Red": 0.75,
        "Green": 0.78,
        "Blue": 0.82
      },
      "Cursor Color": {
        "Red": 0.65,
        "Green": 0.75,
        "Blue": 0.85
      },
      "Ansi 0 Color": {
        "Red": 0.11,
        "Green": 0.12,
        "Blue": 0.13
      },
      "Ansi 1 Color": {
        "Red": 0.90,
        "Green": 0.50,
        "Blue": 0.50
      },
      "Ansi 2 Color": {
        "Red": 0.65,
        "Green": 0.85,
        "Blue": 0.70
      },
      "Ansi 3 Color": {
        "Red": 0.85,
        "Green": 0.85,
        "Blue": 0.70
      },
      "Ansi 4 Color": {
        "Red": 0.60,
        "Green": 0.75,
        "Blue": 0.90
      },
      "Ansi 5 Color": {
        "Red": 0.80,
        "Green": 0.70,
        "Blue": 0.85
      },
      "Ansi 6 Color": {
        "Red": 0.65,
        "Green": 0.85,
        "Blue": 0.85
      },
      "Ansi 7 Color": {
        "Red": 0.90,
        "Green": 0.92,
        "Blue": 0.94
      }
    }
  ]
}
EOF

echo "✅ Created iTerm2 dynamic profiles at:"
echo "   $PROFILES_DIR/Dendrovia.json"
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
