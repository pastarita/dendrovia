#!/usr/bin/env python3
"""
Generate full 256-color iTerm2 Dynamic Profiles for Dendrovia pillars.

Uses the color256 trilinear-interpolation-in-CIELAB algorithm (public domain,
by Jake Stewart) to derive colors 16-255 from each pillar's base16 palette.

This ensures ALL 256-color indices harmonize with each pillar's theme,
fixing contrast issues where tools (e.g. Claude Code) emit 256-color
escape sequences that map to unreadable dark colors.

Usage:
    python3 generate-iterm-256.py
    # Writes to ~/Library/Application Support/iTerm2/DynamicProfiles/Dendrovia.plist

Ref: https://github.com/jake-stewart/color256
"""

import os
import sys
from datetime import datetime

# ─── color256 core algorithm (public domain) ────────────────────────────────

def clamp(low, high, n):
    return max(low, min(high, n))

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(rgb):
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"

def rgb_to_lab(rgb):
    r, g, b = (
        c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
            for c in (c / 255 for c in rgb)
    )
    xyz = (
        (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047,
        (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0,
        (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
    )
    fx, fy, fz = (
        t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
        for t in xyz
    )
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)

def lab_to_rgb(lab):
    l, a, b = lab
    fy = (l + 16) / 116
    fx = a / 500 + fy
    fz = fy - b / 200
    x, y, z = (
        t**3 if t**3 > 0.008856 else (t - 16/116) / 7.787
        for t in (fx, fy, fz)
    )
    x, y, z = x * 0.95047, y * 1.0, z * 1.08883
    r = x * 3.2406 + y * -1.5372 + z * -0.4986
    g = x * -0.9689 + y * 1.8758 + z * 0.0415
    b_lin = x * 0.0557 + y * -0.2040 + z * 1.0570
    r, g, b_lin = (
        12.92 * c if c <= 0.0031308 else 1.055 * c**(1/2.4) - 0.055
        for c in (r, g, b_lin)
    )
    r = clamp(0, 255, int(r * 255 + 0.5))
    g = clamp(0, 255, int(g * 255 + 0.5))
    b_rgb = clamp(0, 255, int(b_lin * 255 + 0.5))
    return (r, g, b_rgb)

def lerp_lab(t, lab1, lab2):
    return tuple(a + t * (b - a) for a, b in zip(lab1, lab2))

def generate_base16_extras(palette, bg, fg):
    """Fix bright variants if they duplicate normals."""
    bg_lab = rgb_to_lab(bg)
    fg_lab = rgb_to_lab(fg)

    for i in range(8):
        if palette[i + 8] == palette[i]:
            l, a, b = rgb_to_lab(palette[i])
            l = clamp(0, 100, l * 1.1)
            palette[i + 8] = lab_to_rgb((l, a, b))

    if palette[0] == bg:
        l = clamp(0, 100, bg_lab[0] + 3)
        palette[0] = lab_to_rgb((l, bg_lab[1], bg_lab[2]))

    l = clamp(0, 100, bg_lab[0] + 20)
    palette[8] = lab_to_rgb((l, bg_lab[1], bg_lab[2]))

def generate_256_palette(base16, bg, fg):
    """Trilinear CIELAB interpolation: 8 base hues -> 216 cube + 24 grays."""
    base8_lab = [rgb_to_lab(c) for c in base16[:8]]
    bg_lab = rgb_to_lab(bg)
    fg_lab = rgb_to_lab(fg)

    palette = list(base16)

    # 216-color cube (indices 16-231)
    for r in range(6):
        c0 = lerp_lab(r / 5, bg_lab, base8_lab[1])
        c1 = lerp_lab(r / 5, base8_lab[2], base8_lab[3])
        c2 = lerp_lab(r / 5, base8_lab[4], base8_lab[5])
        c3 = lerp_lab(r / 5, base8_lab[6], fg_lab)
        for g in range(6):
            c4 = lerp_lab(g / 5, c0, c1)
            c5 = lerp_lab(g / 5, c2, c3)
            for b in range(6):
                c6 = lerp_lab(b / 5, c4, c5)
                palette.append(lab_to_rgb(c6))

    # Grayscale ramp (indices 232-255)
    for i in range(24):
        t = (i + 1) / 25
        lab = lerp_lab(t, bg_lab, fg_lab)
        palette.append(lab_to_rgb(lab))

    return palette

# ─── Pillar definitions ─────────────────────────────────────────────────────

PILLARS = {
    "CHRONOS": {
        "name": "Dendrovia-CHRONOS",
        "guid": "dendrovia-chronos",
        "desc": "CHRONOS - Archaeological amber theme (256-color)",
        "bg": "#2a1f16",
        "fg": "#e8d7c3",
        "cursor": "#dda15e",
        "selection": "#8b7355",
        # Base16: Ansi 0-15 (already promoted for visibility)
        "base16": [
            "#6B5940", "#B85C38", "#8B944D", "#D4A574",  # 0-3
            "#7D98A1", "#A07D6F", "#9DAA9C", "#E8D7C3",  # 4-7
            "#8B7960", "#DDA15E", "#B5C689", "#ECC194",  # 8-11
            "#A8C5D1", "#C9ABAE", "#C5D6C6", "#F5EDE1",  # 12-15
        ],
    },
    "IMAGINARIUM": {
        "name": "Dendrovia-IMAGINARIUM",
        "guid": "dendrovia-imaginarium",
        "desc": "IMAGINARIUM - Alchemical violet theme (256-color)",
        "bg": "#24202f",
        "fg": "#ede7f6",
        "cursor": "#dda0dd",
        "selection": "#6e5494",
        "base16": [
            "#5D5270", "#D896FF", "#7DC4A0", "#C6A0F6",  # 0-3
            "#8B9DC3", "#B891C9", "#A5A0D9", "#EDE7F6",  # 4-7
            "#7D7290", "#E8B9FF", "#9DD9BC", "#DDC2FF",  # 8-11
            "#B5C5E3", "#D1B5E5", "#C9C4F3", "#F8F4FF",  # 12-15
        ],
    },
    "ARCHITECTUS": {
        "name": "Dendrovia-ARCHITECTUS",
        "guid": "dendrovia-architectus",
        "desc": "ARCHITECTUS - Computational blue theme (256-color)",
        "bg": "#1a1f2e",
        "fg": "#e3ebf5",
        "cursor": "#6fa8dc",
        "selection": "#3d5a7e",
        "base16": [
            "#475569", "#63A8E8", "#6AB38A", "#8AB4F8",  # 0-3
            "#5D87C9", "#7A8FC7", "#7DB3C9", "#E3EBF5",  # 4-7
            "#677589", "#85C0FF", "#87D3A8", "#A5CEFF",  # 8-11
            "#7EA5E3", "#9DAAE3", "#A3D2E8", "#F0F7FF",  # 12-15
        ],
    },
    "LUDUS": {
        "name": "Dendrovia-LUDUS",
        "guid": "dendrovia-ludus",
        "desc": "LUDUS - Tactical green theme (256-color)",
        "bg": "#1a2520",
        "fg": "#e4f0e7",
        "cursor": "#6fb583",
        "selection": "#3d5e4a",
        "base16": [
            "#475A50", "#7AB88E", "#81C995", "#9DD9AC",  # 0-3
            "#6DA690", "#8EB09E", "#7DBFA5", "#E4F0E7",  # 4-7
            "#677A70", "#95D4A6", "#99E3B0", "#B5F0C5",  # 8-11
            "#89C2AC", "#A8D1BE", "#9AE0C4", "#F0F9F3",  # 12-15
        ],
    },
    "OCULUS": {
        "name": "Dendrovia-OCULUS",
        "guid": "dendrovia-oculus",
        "desc": "OCULUS - Observational amber theme (256-color)",
        "bg": "#2a1e1a",
        "fg": "#f0e6dc",
        "cursor": "#e89566",
        "selection": "#8b6350",
        "base16": [
            "#6B5044", "#F5A97F", "#9DAA8A", "#F5C894",  # 0-3
            "#A8958A", "#C49A87", "#B8A095", "#F0E6DC",  # 4-7
            "#8B7064", "#FFB599", "#B9D1A8", "#FFDDAF",  # 8-11
            "#C9B5A8", "#E0BAA7", "#D9C4B8", "#FAF4EE",  # 12-15
        ],
    },
    "OPERATUS": {
        "name": "Dendrovia-OPERATUS",
        "guid": "dendrovia-operatus",
        "desc": "OPERATUS - Industrial grey theme (256-color)",
        "bg": "#1a1d23",
        "fg": "#e5e7eb",
        "cursor": "#6b7280",
        "selection": "#4b5563",
        "base16": [
            "#52606F", "#8B92A0", "#849C8C", "#9CA3AF",  # 0-3
            "#7A8CA1", "#908BA3", "#8B99A8", "#E5E7EB",  # 4-7
            "#72808F", "#A8B0BF", "#9EC4A9", "#B8BFD0",  # 8-11
            "#97ABC0", "#ABA2C2", "#A7B8C9", "#F3F4F6",  # 12-15
        ],
    },
}

# ─── iTerm2 plist generation ────────────────────────────────────────────────

def rgb_to_plist_color(rgb):
    """Convert an (R, G, B) tuple to an iTerm2 plist color dict string."""
    r, g, b = rgb
    return (
        f'<dict>'
        f'<key>Red Component</key><real>{r/255:.4f}</real>'
        f'<key>Green Component</key><real>{g/255:.4f}</real>'
        f'<key>Blue Component</key><real>{b/255:.4f}</real>'
        f'<key>Alpha Component</key><real>1</real>'
        f'<key>Color Space</key><string>sRGB</string>'
        f'</dict>'
    )

def generate_profile_plist(pillar):
    """Generate a single profile's plist XML."""
    cfg = PILLARS[pillar]
    bg = hex_to_rgb(cfg["bg"])
    fg = hex_to_rgb(cfg["fg"])
    cursor = hex_to_rgb(cfg["cursor"])
    selection = hex_to_rgb(cfg["selection"])

    # Parse base16 palette
    base16 = [hex_to_rgb(c.strip()) for c in cfg["base16"]]

    # Generate base16 extras (fix bright variants if needed)
    generate_base16_extras(base16, bg, fg)

    # Generate full 256-color palette
    palette = generate_256_palette(base16, bg, fg)

    lines = []
    lines.append(f'    <!-- {pillar}: {cfg["desc"]} -->')
    lines.append( '    <dict>')
    lines.append(f'      <key>Name</key>')
    lines.append(f'      <string>{cfg["name"]}</string>')
    lines.append(f'      <key>Guid</key>')
    lines.append(f'      <string>{cfg["guid"]}</string>')
    lines.append(f'      <key>Description</key>')
    lines.append(f'      <string>{cfg["desc"]}</string>')
    lines.append( '')

    # Background
    lines.append(f'      <!-- Background: {cfg["bg"]} -->')
    lines.append(f'      <key>Background Color</key>')
    lines.append(f'      {rgb_to_plist_color(bg)}')
    lines.append( '')

    # Foreground
    lines.append(f'      <!-- Foreground: {cfg["fg"]} -->')
    lines.append(f'      <key>Foreground Color</key>')
    lines.append(f'      {rgb_to_plist_color(fg)}')
    lines.append( '')

    # Bold Color (set to foreground for guaranteed readability)
    lines.append(f'      <!-- Bold Color: matches foreground for readability -->')
    lines.append(f'      <key>Bold Color</key>')
    lines.append(f'      {rgb_to_plist_color(fg)}')
    lines.append( '')

    # Cursor
    lines.append(f'      <!-- Cursor: {cfg["cursor"]} -->')
    lines.append(f'      <key>Cursor Color</key>')
    lines.append(f'      {rgb_to_plist_color(cursor)}')
    lines.append( '')

    # Cursor text color
    lines.append(f'      <key>Cursor Text Color</key>')
    lines.append(f'      {rgb_to_plist_color(bg)}')
    lines.append( '')

    # Selection
    lines.append(f'      <!-- Selection: {cfg["selection"]} -->')
    lines.append(f'      <key>Selection Color</key>')
    lines.append(f'      {rgb_to_plist_color(selection)}')
    lines.append( '')

    # Selected text color
    lines.append(f'      <key>Selected Text Color</key>')
    lines.append(f'      {rgb_to_plist_color(fg)}')
    lines.append( '')

    # Minimum Contrast: ensure at least 30% contrast floor
    lines.append(f'      <!-- Minimum contrast floor for readability -->')
    lines.append(f'      <key>Minimum Contrast</key>')
    lines.append(f'      <real>0.3</real>')
    lines.append( '')

    # Use Bold Color: enable the Bold Color override for bold text
    lines.append(f'      <key>Use Bold Color</key>')
    lines.append(f'      <true/>')
    lines.append( '')

    # Draw bold text in bright colors (disabled — we use Bold Color instead)
    lines.append(f'      <key>Draw Bold Text In Bright Colors</key>')
    lines.append(f'      <false/>')
    lines.append( '')

    # All 256 ANSI colors
    lines.append(f'      <!-- Full 256-color palette (CIELAB-interpolated) -->')
    for i in range(256):
        color = palette[i]
        comment = ""
        if i == 0: comment = " <!-- Black (promoted) -->"
        elif i == 7: comment = " <!-- White (foreground) -->"
        elif i == 8: comment = " <!-- Bright Black (comment text) -->"
        elif i == 15: comment = " <!-- Bright White -->"
        elif i == 16: comment = " <!-- Start of 6x6x6 cube -->"
        elif i == 232: comment = " <!-- Start of grayscale ramp -->"
        lines.append(f'      <key>Ansi {i} Color</key>')
        lines.append(f'      {rgb_to_plist_color(color)}{comment}')

    lines.append( '    </dict>')
    return '\n'.join(lines)


def generate_full_plist():
    """Generate the complete Dendrovia.plist with all 6 pillar profiles."""
    header = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<!--
  Dendrovia iTerm2 Dynamic Profiles
  Generated by generate-iterm-256.py on {datetime.now().strftime('%Y-%m-%d %H:%M')}

  Full 256-color palettes derived via CIELAB trilinear interpolation
  from each pillar's base16 theme (algorithm: jake-stewart/color256).

  Colors 0-15:   Base16 pillar palette (hand-tuned)
  Colors 16-231: 6x6x6 cube interpolated from base8 hues in CIELAB space
  Colors 232-255: Grayscale ramp from background to foreground in CIELAB
-->
<plist version="1.0">
<dict>
  <key>Profiles</key>
  <array>
"""

    footer = """
  </array>
</dict>
</plist>
"""

    profiles = []
    for pillar in ["CHRONOS", "IMAGINARIUM", "ARCHITECTUS", "LUDUS", "OCULUS", "OPERATUS"]:
        profiles.append(generate_profile_plist(pillar))

    return header + '\n\n'.join(profiles) + footer


def main():
    plist_content = generate_full_plist()

    output_path = os.path.expanduser(
        "~/Library/Application Support/iTerm2/DynamicProfiles/Dendrovia.plist"
    )

    # Also write a local copy for version control
    script_dir = os.path.dirname(os.path.abspath(__file__))
    local_path = os.path.join(script_dir, "Dendrovia.plist")

    # Write to iTerm2 DynamicProfiles
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        f.write(plist_content)
    print(f"Wrote iTerm2 profile: {output_path}")

    # Write local copy
    with open(local_path, 'w') as f:
        f.write(plist_content)
    print(f"Wrote local copy:     {local_path}")

    # Summary
    print()
    for pillar in PILLARS:
        cfg = PILLARS[pillar]
        base16 = [hex_to_rgb(c.strip()) for c in cfg["base16"]]
        bg = hex_to_rgb(cfg["bg"])
        fg = hex_to_rgb(cfg["fg"])
        palette = generate_256_palette(base16, bg, fg)
        print(f"  {pillar:14s}  bg={cfg['bg']}  fg={cfg['fg']}  "
              f"gray[232]={rgb_to_hex(palette[232])}  gray[243]={rgb_to_hex(palette[243])}  "
              f"gray[255]={rgb_to_hex(palette[255])}")

    print()
    print("Reload iTerm2 profiles: iTerm2 > Scripts > Manage > Reload All Dynamic Profiles")
    print("Or restart iTerm2.")


if __name__ == "__main__":
    main()
