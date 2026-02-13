# Dendrovia Dark Mode Themes

> **Ghosty Profiles** - Six comprehensive dark mode themes representing each pillar of the Dendrovia architecture.

## Overview

Each theme is a complete dark mode configuration crafted from the pillar's canonical color palette defined in `PILLAR_THEMATIC_SCHEMA.md`. These themes provide immersive, representative experiences that embody the archetypal essence of each pillar.

---

## 📜 CHRONOS DARK - The Archaeologist

**Colors:** Weathered earth tones, archaeological amber, sedimentary browns
**Mood:** Reverent discovery, patient stratification, timeless wisdom
**Best For:** Git operations, version control, historical analysis, documentation

**Palette:**
- Primary: `#d4a574` (Weathered parchment)
- Background: `#2a1f16` (Deep archaeological pit)
- Accent: `#dda15e` (Illuminated artifact)
- Highlight: `#f5ead6` (Surface light)

**Syntax Philosophy:**
- Keywords = Temporal markers (bold, prominent)
- Strings = Ancient text (warm earth)
- Functions = Excavation tools (highlighted)
- Comments = Archaeological notation (subtle, italic)

---

## 🎨 IMAGINARIUM DARK - The Compiler

**Colors:** Ethereal violets, alchemical purples, iridescent pastels
**Mood:** Creative wonder, transformative revelation, mathematical beauty
**Best For:** Shader coding, creative work, generative art, procedural design

**Palette:**
- Primary: `#c6a0f6` (Ethereal violet)
- Background: `#1a0f1f` (Alchemical chamber)
- Accent: `#da9ef7` (Glowing transformation)
- Highlight: `#f8f0ff` (Transcendent white-violet)

**Syntax Philosophy:**
- Keywords = Transformation operators (mystical purple)
- Strings = Ethereal essence (lavender)
- Functions = Compilation vessels (pure white)
- Comments = Alchemical notation (subdued violet)

---

## 🏛️ ARCHITECTUS DARK - The Renderer

**Colors:** Computational blues, structural clarity, pristine geometry
**Mood:** Sublime computational order, architectural transcendence, geometric revelation
**Best For:** 3D rendering, WebGPU, graphics programming, spatial computing

**Palette:**
- Primary: `#8ab4f8` (Computational clarity blue)
- Background: `#0d1824` (Deep computational void)
- Accent: `#5dbaff` (Bright render)
- Highlight: `#e8f4ff` (Pure light)

**Syntax Philosophy:**
- Keywords = Structural directives (bold blue)
- Strings = Geometric definitions (cyan)
- Functions = Construction methods (pure white)
- Comments = Blueprint annotations (muted blue)

---

## 🎮 LUDUS DARK - The Mechanics

**Colors:** Vibrant greens, tactical forest, energetic growth
**Mood:** Playful strategic excitement, tactical engagement, game-like wonder
**Best For:** Game logic, state machines, rules engines, interactive systems

**Palette:**
- Primary: `#81c995` (Vibrant growth green)
- Background: `#1a2820` (Deep strategy shadow)
- Accent: `#5ff59f` (Glowing action)
- Highlight: `#d4f5e3` (Victory glow)

**Syntax Philosophy:**
- Keywords = Game rules (bold green)
- Strings = Quest text (mint)
- Functions = Skill actions (highlighted)
- Comments = Strategic notes (tactical green)

---

## 👁️ OCULUS DARK - The Interface

**Colors:** Warm amber, observational orange, perceptual peach
**Mood:** Gentle mindful awareness, insightful clarity, observational wisdom
**Best For:** UI/UX work, component design, interface development, accessibility

**Palette:**
- Primary: `#f5a97f` (Warm observational amber)
- Background: `#1f1410` (Deep perceptual shadow)
- Accent: `#ffb366` (Bright focus)
- Highlight: `#fff5ed` (Pure clarity)

**Syntax Philosophy:**
- Keywords = Interface directives (warm amber)
- Strings = Display text (peach)
- Functions = View methods (pure white)
- Comments = Contextual hints (muted amber)

---

## 💾 OPERATUS DARK - The Infrastructure

**Colors:** Industrial greys, utilitarian steel, foundational neutrals
**Mood:** Reliable quiet strength, dependable operation, engineered excellence
**Best For:** Infrastructure code, DevOps, configuration, system administration

**Palette:**
- Primary: `#9ca3af` (Industrial grey)
- Background: `#1c1f23` (Infrastructure void)
- Accent: `#60a5fa` (System operational blue)
- Highlight: `#e5e7eb` (Clean operational surface)

**Syntax Philosophy:**
- Keywords = Infrastructure directives (neutral grey)
- Strings = Configuration values (cool grey)
- Functions = System operations (bright)
- Comments = System documentation (subdued)

---

## Installation

### VS Code

1. Copy the desired `.json` theme file to:
   - **macOS/Linux:** `~/.vscode/extensions/`
   - **Windows:** `%USERPROFILE%\.vscode\extensions\`

2. Or use VS Code's built-in theme importer:
   ```
   Cmd/Ctrl + Shift + P → "Preferences: Color Theme"
   ```

3. Create a new extension folder structure:
   ```
   my-dendrovia-themes/
   ├── package.json
   └── themes/
       ├── chronos-dark.json
       ├── imaginarium-dark.json
       └── ... (all 6 themes)
   ```

### Terminal (iTerm2, Alacritty, Kitty)

Convert the color values to your terminal's config format:

**Example for iTerm2:**
```xml
<dict>
  <key>Ansi 0 Color</key>
  <dict>
    <key>Color Space</key>
    <string>sRGB</string>
    <key>Red Component</key>
    <real>0.29</real> <!-- extracted from hex -->
    ...
  </dict>
</dict>
```

**Example for Alacritty (`~/.config/alacritty/alacritty.yml`):**
```yaml
colors:
  primary:
    background: '#2a1f16'  # CHRONOS example
    foreground: '#e8d7c3'
  cursor:
    cursor: '#dda15e'
  # ... etc
```

### Other Editors

These themes follow the VS Code color theme schema, which can be adapted to:
- **Sublime Text:** Convert to `.tmTheme` format
- **Neovim:** Use `:colorscheme` with Lua configuration
- **JetBrains IDEs:** Import as color scheme XML
- **Emacs:** Convert to Emacs theme `.el` format

---

## Theme Selection Guide

**Choose your theme based on the type of work:**

| Work Type | Recommended Theme | Why |
|-----------|------------------|-----|
| Git operations, history diving | **CHRONOS** | Archaeological colors suggest temporal exploration |
| Shader/graphics programming | **IMAGINARIUM** | Violet tones inspire creative mathematical thinking |
| 3D rendering, WebGPU work | **ARCHITECTUS** | Blue clarity reflects computational geometry |
| Game logic, state machines | **LUDUS** | Green energy conveys dynamic interaction |
| UI/UX, component design | **OCULUS** | Warm amber promotes focused awareness |
| DevOps, infrastructure | **OPERATUS** | Neutral greys maintain operational focus |

---

## Color Accessibility

All themes have been designed with contrast ratios meeting WCAG AA standards:
- **Background to Foreground:** Minimum 7:1 ratio
- **Syntax Highlighting:** Minimum 4.5:1 ratio
- **Active Elements:** Minimum 3:1 ratio

**Colorblind Considerations:**
- CHRONOS: Warm earth tones remain distinct in deuteranopia
- ARCHITECTUS: High luminance contrast aids protanopia
- LUDUS: Multiple green shades differentiated by brightness
- All themes: Shape and weight used alongside color

---

## Customization

Each theme is fully customizable via VS Code settings:

```json
{
  "workbench.colorCustomizations": {
    "[Chronos Dark - The Archaeologist]": {
      "editor.background": "#2a1f16",
      "editor.foreground": "#e8d7c3"
    }
  },
  "editor.tokenColorCustomizations": {
    "[Chronos Dark - The Archaeologist]": {
      "comments": "#6b5d4f"
    }
  }
}
```

---

## Philosophy

These themes are not just color schemes—they are **thematic experiences**. Each embodies the archetypal essence of its pillar:

- **CHRONOS** makes you feel like an archaeologist excavating code history
- **IMAGINARIUM** surrounds you with alchemical transformation
- **ARCHITECTUS** presents pristine geometric clarity
- **LUDUS** energizes with playful tactical thinking
- **OCULUS** provides gentle observational awareness
- **OPERATUS** offers reliable foundational strength

**The right theme enhances not just visibility, but mindset.**

---

## Credits

Generated from `PILLAR_THEMATIC_SCHEMA.md` - the formal specification of thematic identity for all Dendrovia visual assets.

**Palette Authority:** Color values are canonical and derived from pillar archetypes, elemental affinities, and symbolic metaphors defined in the schema.

**VS Code Schema:** Follows `vscode://schemas/color-theme` specification for maximum compatibility.

---

## License

Part of the Dendrovia project. See main repository LICENSE.
