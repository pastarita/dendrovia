# Dendrovia Ghostty Themes

Custom dark mode themes for the Ghostty terminal emulator, one for each of the six Dendrovia pillars.

## Installation

Run the installation script:

```bash
./install-ghostty-themes.sh
```

This will copy all themes to `~/.config/ghostty/themes/`

## Available Themes

| Theme | Pillar | Primary Color | Character |
|-------|--------|---------------|-----------|
| `dendrovia-chronos` | 📜 CHRONOS | `#d4a574` | Archaeological amber |
| `dendrovia-imaginarium` | 🎨 IMAGINARIUM | `#c6a0f6` | Alchemical violet |
| `dendrovia-architectus` | 🏛️ ARCHITECTUS | `#8ab4f8` | Computational blue |
| `dendrovia-ludus` | 🎮 LUDUS | `#81c995` | Tactical green |
| `dendrovia-oculus` | 👁️ OCULUS | `#f5a97f` | Observational amber |
| `dendrovia-operatus` | 💾 OPERATUS | `#9ca3af` | Industrial grey |

## Testing a Theme

Launch Ghostty with a specific theme:

```bash
open -na Ghostty.app --args --theme="dendrovia-chronos"
```

## Theme Format

Each theme file uses Ghostty's simple key=value format:

```
background = 2a1f16
foreground = e8d7c3
cursor-color = dda15e
selection-background = 8b7355
palette = 0=#4a3822
palette = 1=#b85c38
# ... (16 ANSI colors total)
```

## Color Matching

These themes are color-matched to the Dendrovia VS Code themes found in `assets/themes/`. They use the same color palettes defined in `PILLAR_THEMATIC_SCHEMA.md`.

## Usage with Launcher

The workspace launcher (`bun run launch --ghostty`) automatically uses these themes:

```typescript
const PILLAR_THEMES = {
  CHRONOS: "dendrovia-chronos",
  IMAGINARIUM: "dendrovia-imaginarium",
  ARCHITECTUS: "dendrovia-architectus",
  LUDUS: "dendrovia-ludus",
  OCULUS: "dendrovia-oculus",
  OPERATUS: "dendrovia-operatus",
};
```

Each pillar's Ghostty window launches with its corresponding theme.
