#!/usr/bin/env fontforge -script
"""
Generate Dendrovia icon font using FontForge.

This script requires FontForge Python bindings.

Install:
    brew install fontforge

Usage:
    fontforge -script fontforge-generate.py
"""

try:
    import fontforge
except ImportError:
    print("❌ FontForge Python module not found!")
    print("   Install with: brew install fontforge")
    exit(1)

import os

# Get script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

# Icon mappings
icons = {
    0xE000: ("chronos", "CHRONOS"),
    0xE001: ("imaginarium", "IMAGINARIUM"),
    0xE002: ("architectus", "ARCHITECTUS"),
    0xE003: ("ludus", "LUDUS"),
    0xE004: ("oculus", "OCULUS"),
    0xE005: ("operatus", "OPERATUS"),
}

print("🎨 Generating Dendrovia custom icon font with FontForge...\n")

# Create new font
font = fontforge.font()
font.familyname = "Dendrovia Icons"
font.fullname = "Dendrovia Icons Regular"
font.fontname = "DendroviaIcons-Regular"
font.encoding = "UnicodeFull"
font.version = "1.0"
font.copyright = "Dendrovia Project"
font.em = 1000  # Units per em

print(f"📝 Font: {font.fullname}")
print(f"   Family: {font.familyname}")
print(f"   EM: {font.em}\n")

# Import SVG icons
for codepoint, (filename, name) in icons.items():
    svg_path = os.path.join(project_root, "assets", "icons", f"{filename}.svg")

    if not os.path.exists(svg_path):
        print(f"  ⚠️  {name:12} - File not found: {svg_path}")
        continue

    try:
        # Create glyph at codepoint
        glyph = font.createChar(codepoint, filename)

        # Import SVG
        glyph.importOutlines(svg_path, scale=True)

        # Set glyph width (make it monospaced)
        glyph.width = 1000

        # Center the glyph
        bbox = glyph.boundingBox()
        if bbox[2] - bbox[0] > 0:  # Has content
            # Calculate centering offset
            glyph_width = bbox[2] - bbox[0]
            offset_x = (1000 - glyph_width) / 2 - bbox[0]
            glyph.transform((1, 0, 0, 1, offset_x, 0))

        print(f"  ✅ U+{codepoint:04X} {name:12} <- {filename}.svg")

    except Exception as e:
        print(f"  ❌ {name:12} - Error: {e}")

# Generate font files
output_dir = os.path.join(project_root, "assets", "fonts")
os.makedirs(output_dir, exist_ok=True)

print(f"\n📦 Generating font files in {output_dir}...\n")

# Generate TrueType
ttf_path = os.path.join(output_dir, "dendrovia-icons.ttf")
font.generate(ttf_path)
print(f"  ✅ {ttf_path}")

# Generate WOFF2 (for web)
woff2_path = os.path.join(output_dir, "dendrovia-icons.woff2")
font.generate(woff2_path)
print(f"  ✅ {woff2_path}")

print("\n🎉 Font generation complete!")
print("\n📋 Unicode mappings:")
for codepoint, (filename, name) in icons.items():
    print(f"   U+{codepoint:04X}  {chr(codepoint)}  {name}")

print("\n💡 Next steps:")
print("   1. Install font: cp assets/fonts/dendrovia-icons.ttf ~/Library/Fonts/")
print("   2. Restart terminal")
print("   3. Update launcher to use \\uE000-\\uE005 characters")
