# Custom Pillar Icons for Dendrovia

## Approaches for Custom Icons in Terminals

### Option 1: Custom Icon Font (Recommended)

Create a custom icon font with SVG-based glyphs for each pillar.

**Workflow:**
1. Design SVG icons (one per pillar)
2. Convert SVGs to font glyphs using FontForge or fonttools
3. Map to Private Use Area (PUA): U+E000-U+E005
4. Install font system-wide
5. Configure terminals to use the font

**Tools needed:**
- **FontForge** (open source font editor)
- **fonttools** (Python library for font manipulation)
- **svg2ttf** (convert SVGs to TrueType)

**Unicode mappings:**
```
U+E000  CHRONOS icon (Git/Archaeological)
U+E001  IMAGINARIUM icon (Palette/Brush)
U+E002  ARCHITECTUS icon (Column/Building)
U+E003  LUDUS icon (Game controller)
U+E004  OCULUS icon (Eye)
U+E005  OPERATUS icon (Gears/Infrastructure)
```

**Implementation:**
```bash
# Install fonttools
pip3 install fonttools

# Generate font from SVGs
fontforge -script generate-icon-font.py

# Install to system
cp dendrovia-icons.ttf ~/Library/Fonts/

# Use in config
# iTerm2: Set font to "Dendrovia Icons" (fallback)
# Ghostty: font-family = "JetBrains Mono, Dendrovia Icons"
```

---

### Option 2: Terminal Image Protocol

Use terminal-specific image protocols to display PNG/SVG icons inline.

**iTerm2 inline images:**
```bash
# iTerm2 supports inline images via imgcat
printf '\033]1337;File=inline=1:'
cat icon.png | base64
printf '\a\n'
```

**Kitty image protocol:**
```bash
# Kitty has its own graphics protocol
kitty +kitten icat icon.png
```

**Ghostty:**
- Currently unclear if Ghostty supports inline images
- Need to check documentation

**Limitations:**
- Not persistent in scrollback
- Different protocols per terminal
- Adds complexity

---

### Option 3: Nerd Fonts Integration

Integrate our custom glyphs into a Nerd Fonts fork.

**Nerd Fonts approach:**
- Fork popular font (JetBrains Mono, FiraCode)
- Add our custom glyphs to PUA
- Use fontforge patcher
- Distribute as "Dendrovia Mono"

**Benefits:**
- Works everywhere
- Includes all Nerd Fonts icons
- Professional appearance

---

## Recommended: Custom Icon Font

Let's create a simple icon font with 6 custom glyphs.

### Design Guidelines

**Style:** Minimal, geometric, Monument Valley-inspired

**Icons:**

1. **CHRONOS** (📜 → )
   - Scroll/manuscript icon
   - Or: Git branch symbol
   - Suggested: Unfurled scroll with text lines

2. **IMAGINARIUM** (🎨 → )
   - Palette icon
   - Or: Brain with sparkles
   - Suggested: Paint palette with brush

3. **ARCHITECTUS** (🏛️ → )
   - Greek column
   - Or: Blueprint/T-square
   - Suggested: Classical column or geodesic dome

4. **LUDUS** (🎮 → )
   - Game controller
   - Or: D20 dice
   - Suggested: Minimal D-pad

5. **OCULUS** (👁️ → )
   - Eye symbol
   - Or: Monitor/viewport
   - Suggested: Stylized eye

6. **OPERATUS** (💾 → )
   - Gears
   - Or: Database/storage
   - Suggested: Interconnected gears

### SVG Template

```svg
<!-- Example: CHRONOS icon -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g id="chronos">
    <!-- Scroll shape -->
    <path d="M20,30 Q15,30 15,35 L15,65 Q15,70 20,70 L80,70 Q85,70 85,65 L85,35 Q85,30 80,30 Z"
          fill="none"
          stroke="currentColor"
          stroke-width="2"/>
    <!-- Text lines -->
    <line x1="25" y1="40" x2="75" y2="40" stroke="currentColor" stroke-width="1"/>
    <line x1="25" y1="50" x2="75" y2="50" stroke="currentColor" stroke-width="1"/>
    <line x1="25" y1="60" x2="60" y2="60" stroke="currentColor" stroke-width="1"/>
  </g>
</svg>
```

---

## Quick Implementation with FontForge

### Step 1: Create SVGs

Create 6 SVG files in `assets/icons/`:
- `chronos.svg`
- `imaginarium.svg`
- `architectus.svg`
- `ludus.svg`
- `oculus.svg`
- `operatus.svg`

### Step 2: Generate Font

```python
#!/usr/bin/env python3
# generate-icon-font.py

import fontforge

# Create new font
font = fontforge.font()
font.familyname = "Dendrovia Icons"
font.fullname = "Dendrovia Icons"
font.fontname = "DendroviaIcons"
font.encoding = "UnicodeFull"

# Map icons to Private Use Area
icons = {
    0xE000: "assets/icons/chronos.svg",      # CHRONOS
    0xE001: "assets/icons/imaginarium.svg",  # IMAGINARIUM
    0xE002: "assets/icons/architectus.svg",  # ARCHITECTUS
    0xE003: "assets/icons/ludus.svg",        # LUDUS
    0xE004: "assets/icons/oculus.svg",       # OCULUS
    0xE005: "assets/icons/operatus.svg",     # OPERATUS
}

for codepoint, svg_path in icons.items():
    glyph = font.createChar(codepoint)
    glyph.importOutlines(svg_path)
    glyph.width = 1000  # Standard width

# Generate font
font.generate("dendrovia-icons.ttf")
font.generate("dendrovia-icons.woff2")
print("✅ Generated dendrovia-icons.ttf and dendrovia-icons.woff2")
```

### Step 3: Install Font

```bash
# Install to system fonts
cp dendrovia-icons.ttf ~/Library/Fonts/

# Or install to project only
mkdir -p ~/.config/dendrovia/fonts
cp dendrovia-icons.ttf ~/.config/dendrovia/fonts/
```

### Step 4: Configure Terminals

**iTerm2:**
```
Preferences → Profiles → Text
Font: JetBrains Mono (regular)
Non-ASCII Font: Dendrovia Icons (fallback)
```

**Ghostty:**
```
# ~/.config/ghostty/config
font-family = "JetBrains Mono"
font-family-fallback = "Dendrovia Icons"
```

### Step 5: Use in Code

```typescript
// pillar-registry.ts
const PILLAR_ICONS = {
  CHRONOS: '\uE000',      // Custom scroll icon
  IMAGINARIUM: '\uE001',  // Custom palette icon
  ARCHITECTUS: '\uE002',  // Custom column icon
  LUDUS: '\uE003',        // Custom controller icon
  OCULUS: '\uE004',       // Custom eye icon
  OPERATUS: '\uE005',     // Custom gears icon
};
```

---

## Alternative: Use Existing Nerd Fonts

If we don't want to create custom fonts, we can use Nerd Fonts glyphs:

```typescript
// Using Nerd Fonts (already available)
const PILLAR_ICONS = {
  CHRONOS: '\uf1d3',      //  git branch
  IMAGINARIUM: '\uf53f',  //  palette
  ARCHITECTUS: '\ue7a8',  //  cube (architecture)
  LUDUS: '\uf11b',        //  gamepad
  OCULUS: '\uf06e',       //  eye
  OPERATUS: '\uf085',     //  gears
};
```

This requires installing a Nerd Font like "JetBrainsMono Nerd Font".

---

## Pros/Cons

| Approach | Pros | Cons |
|----------|------|------|
| **Custom Font** | Unique branding, perfect match | Requires font creation/distribution |
| **Terminal Images** | Full color, any design | Not persistent, terminal-specific |
| **Nerd Fonts** | Already available, many icons | Generic, not custom-designed |

---

## Recommendation

**For now: Use Nerd Fonts** (quickest, works everywhere)

**Future: Create custom font** when we have finalized icon designs

Would you like me to:
1. Set up Nerd Fonts icons for each pillar?
2. Create a FontForge script to generate custom icons?
3. Design SVG templates for each pillar icon?
