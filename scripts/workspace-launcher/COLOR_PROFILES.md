# Dendrovia iTerm2 Color Profiles

Monument Valley-inspired pastel color schemes for each pillar.

## Color Themes

| Pillar | Profile Name | Theme | Description |
|--------|--------------|-------|-------------|
| 📜 CHRONOS | `Dendrovia-CHRONOS` | Amber/Sepia | Archaeological, parchment-like tones |
| 🎨 IMAGINARIUM | `Dendrovia-IMAGINARIUM` | Purple/Magenta | Creative, artistic palette |
| 🏛️ ARCHITECTUS | `Dendrovia-ARCHITECTUS` | Blue/Cyan | Technical, structural blues |
| 🎮 LUDUS | `Dendrovia-LUDUS` | Green | Game-like, matrix aesthetic |
| 👁️ OCULUS | `Dendrovia-OCULUS` | Orange/Coral | Warm, visual interface tones |
| 💾 OPERATUS | `Dendrovia-OPERATUS` | Gray/Steel | Industrial, infrastructure palette |

## Installation

Profiles are automatically installed as iTerm2 Dynamic Profiles:

```bash
# Run the setup script (already done)
./setup-iterm-profiles.sh

# Restart iTerm2 to load profiles
```

Profiles are stored at:
```
~/Library/Application Support/iTerm2/DynamicProfiles/Dendrovia.json
```

## Usage

The workspace launcher automatically uses the correct profile for each pillar:

```bash
bun run launch
```

Each window and all its panes (top, bottom-left, bottom-right) will use the pillar's color scheme.

## Customization

To customize colors:

1. Open iTerm2 → Preferences → Profiles
2. Find the `Dendrovia-*` profiles
3. Edit colors under "Colors" tab
4. Changes are saved automatically

Or edit the JSON file directly:
```bash
open ~/Library/Application\ Support/iTerm2/DynamicProfiles/Dendrovia.json
```

## Color Values

All colors use RGB values from 0.0 to 1.0.

### CHRONOS (Amber/Sepia)
- Background: `rgb(38, 31, 26)` - Dark brown
- Foreground: `rgb(217, 191, 140)` - Warm amber
- Cursor: `rgb(242, 204, 128)` - Bright amber

### IMAGINARIUM (Purple/Magenta)
- Background: `rgb(31, 26, 46)` - Deep purple
- Foreground: `rgb(217, 179, 242)` - Light purple
- Cursor: `rgb(242, 153, 242)` - Bright magenta

### ARCHITECTUS (Blue/Cyan)
- Background: `rgb(20, 31, 41)` - Dark blue
- Foreground: `rgb(153, 217, 242)` - Light cyan
- Cursor: `rgb(102, 230, 242)` - Bright cyan

### LUDUS (Green)
- Background: `rgb(20, 36, 26)` - Dark green
- Foreground: `rgb(153, 242, 179)` - Light green
- Cursor: `rgb(128, 242, 153)` - Bright green

### OCULUS (Orange/Coral)
- Background: `rgb(41, 28, 23)` - Dark brown
- Foreground: `rgb(242, 191, 153)` - Light orange
- Cursor: `rgb(242, 166, 115)` - Bright coral

### OPERATUS (Gray/Steel)
- Background: `rgb(28, 31, 33)` - Dark gray
- Foreground: `rgb(191, 199, 209)` - Light gray
- Cursor: `rgb(166, 191, 217)` - Steel blue

## Philosophy

These colors follow the **Monument Valley** aesthetic:
- **Pastel tones** - Soft, not harsh
- **High contrast** - Text is readable
- **Distinctive** - Each pillar has a unique visual identity
- **Cohesive** - All use similar saturation levels

The colors help reinforce the **cognitive separation** between pillars - when you switch windows, the color shift signals a context switch to a different pillar's mindset.
