#!/usr/bin/env python3
"""
Generate Dendrovia custom icon font from SVG files.

Converts 6 SVG icons into a TrueType font with glyphs mapped to
Private Use Area (PUA) Unicode characters U+E000-U+E005.

Requirements:
    pip3 install fonttools
    brew install fontforge  # Optional, for viewing

Usage:
    python3 generate-icon-font.py
"""

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.svgPathPen import SVGPathPen
import xml.etree.ElementTree as ET
from pathlib import Path
import re

# Icon mappings to Private Use Area
ICON_MAPPINGS = {
    0xE000: ("CHRONOS", "assets/icons/chronos.svg"),
    0xE001: ("IMAGINARIUM", "assets/icons/imaginarium.svg"),
    0xE002: ("ARCHITECTUS", "assets/icons/architectus.svg"),
    0xE003: ("LUDUS", "assets/icons/ludus.svg"),
    0xE004: ("OCULUS", "assets/icons/oculus.svg"),
    0xE005: ("OPERATUS", "assets/icons/operatus.svg"),
}

def extract_svg_path(svg_file):
    """Extract path data from SVG file."""
    tree = ET.parse(svg_file)
    root = tree.getroot()

    # Collect all path, line, circle, rect, polygon elements
    paths = []

    # Remove namespace if present
    ns = {'svg': 'http://www.w3.org/2000/svg'}

    for elem in root.iter():
        tag = elem.tag.split('}')[-1]  # Remove namespace

        if tag == 'path' and 'd' in elem.attrib:
            paths.append(elem.attrib['d'])

        elif tag == 'line':
            x1, y1 = float(elem.attrib['x1']), float(elem.attrib['y1'])
            x2, y2 = float(elem.attrib['x2']), float(elem.attrib['y2'])
            paths.append(f'M{x1},{y1} L{x2},{y2}')

        elif tag == 'circle':
            cx, cy = float(elem.attrib['cx']), float(elem.attrib['cy'])
            r = float(elem.attrib['r'])
            # Approximate circle with bezier curves
            paths.append(
                f'M{cx-r},{cy} '
                f'a{r},{r} 0 1,0 {r*2},0 '
                f'a{r},{r} 0 1,0 {-r*2},0'
            )

        elif tag == 'ellipse':
            cx, cy = float(elem.attrib['cx']), float(elem.attrib['cy'])
            rx, ry = float(elem.attrib['rx']), float(elem.attrib['ry'])
            paths.append(
                f'M{cx-rx},{cy} '
                f'a{rx},{ry} 0 1,0 {rx*2},0 '
                f'a{rx},{ry} 0 1,0 {-rx*2},0'
            )

        elif tag == 'rect':
            x, y = float(elem.attrib['x']), float(elem.attrib['y'])
            w, h = float(elem.attrib['width']), float(elem.attrib['height'])
            rx = float(elem.attrib.get('rx', 0))
            if rx > 0:
                paths.append(
                    f'M{x+rx},{y} '
                    f'h{w-2*rx} '
                    f'a{rx},{rx} 0 0,1 {rx},{rx} '
                    f'v{h-2*rx} '
                    f'a{rx},{rx} 0 0,1 {-rx},{rx} '
                    f'h{-w+2*rx} '
                    f'a{rx},{rx} 0 0,1 {-rx},{-rx} '
                    f'v{-h+2*rx} '
                    f'a{rx},{rx} 0 0,1 {rx},{-rx} Z'
                )
            else:
                paths.append(
                    f'M{x},{y} h{w} v{h} h{-w} Z'
                )

        elif tag == 'polygon' and 'points' in elem.attrib:
            points = elem.attrib['points'].strip().split()
            if points:
                first = points[0].split(',')
                path = f'M{first[0]},{first[1]}'
                for point in points[1:]:
                    coords = point.split(',')
                    path += f' L{coords[0]},{coords[1]}'
                path += ' Z'
                paths.append(path)

    return ' '.join(paths)

def scale_and_center_path(path_data, viewbox=(0, 0, 100, 100), units_per_em=1000):
    """
    Scale SVG path to font units and center it.
    SVG viewBox: (0, 0, 100, 100)
    Font units: 1000 (standard)
    """
    # Scale factor: font units / SVG viewBox size
    scale = units_per_em / max(viewbox[2], viewbox[3])

    # SVG has origin top-left, fonts have origin bottom-left
    # Need to flip Y axis
    transform = f'scale({scale}, {-scale}) translate(0, {-viewbox[3]})'

    return path_data, transform

def create_font():
    """Generate the Dendrovia icon font."""
    print("🎨 Generating Dendrovia custom icon font...\n")

    fb = FontBuilder(1000, isTTF=True)  # 1000 units per em

    # Font metadata
    fb.setupHead(unitsPerEm=1000, lowestRecPPEM=8)
    fb.setupPost()  # PostScript table

    fb.setupNameTable(
        familyName="Dendrovia Icons",
        styleName="Regular",
        uniqueFontID="Dendrovia-Icons-Regular",
        fullName="Dendrovia Icons Regular",
        psName="DendroviaIcons-Regular",
        version="1.0"
    )

    fb.setupOS2(
        sTypoAscender=800,
        sTypoDescender=-200,
        sTypoLineGap=0,
        usWinAscent=1000,
        usWinDescent=200
    )

    fb.setupHhea(ascent=800, descent=-200, lineGap=0)

    # Character map
    cmap = {}
    glyphs = {".notdef": None}  # Required glyph
    metrics = {".notdef": (500, 0)}  # width, left side bearing

    # Process each icon
    for codepoint, (name, svg_path) in ICON_MAPPINGS.items():
        print(f"  {chr(codepoint)} ({name:12}) <- {svg_path}")

        svg_file = Path(__file__).parent.parent / svg_path

        if not svg_file.exists():
            print(f"    ❌ File not found: {svg_file}")
            continue

        try:
            # Extract SVG paths
            path_data = extract_svg_path(svg_file)

            if not path_data:
                print(f"    ⚠️  No paths found in SVG")
                continue

            # For now, store path data (we'll need FontForge for full conversion)
            glyph_name = name.lower()
            glyphs[glyph_name] = path_data
            metrics[glyph_name] = (1000, 0)  # Full width
            cmap[codepoint] = glyph_name

            print(f"    ✅ Processed")

        except Exception as e:
            print(f"    ❌ Error: {e}")

    print(f"\n📊 Generated {len(cmap)} glyphs")
    print("\n⚠️  Note: Full font generation requires FontForge")
    print("     SVG paths extracted successfully, but conversion")
    print("     to TrueType outlines needs FontForge.")
    print("\nNext step: Install FontForge and use fontforge-generate.py")

    return cmap, glyphs, metrics

if __name__ == "__main__":
    create_font()
