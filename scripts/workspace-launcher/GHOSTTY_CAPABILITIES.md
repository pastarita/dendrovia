# Ghostty Terminal Capabilities

Research document for Dendrovia workspace launcher Ghostty support.

## Key Findings

### 1. **Massive Theme Library**
- **400+ built-in themes** from various popular collections
- Includes: Catppuccin, Gruvbox, Nord, TokyoNight, Dracula, Monokai, etc.
- Themes are resources-based (no manual RGB configuration needed)
- Simple theme switching: `theme = <name>`

### 2. **Configuration System**
```bash
Config location: ~/Library/Application Support/com.mitchellh.ghostty/config
```

**Config format:**
```
# Simple key = value pairs
font-family = JetBrains Mono
font-size = 14
theme = Catppuccin Mocha
window-padding-x = 10
```

**CLI override:**
```bash
open -na Ghostty.app --args --theme="Nord" --font-size=16
```

### 3. **Window Management**

**Actions available:**
- `new_window` - Create new window
- `new_tab` - Create new tab in current window
- `new_split` - Split current pane (horizontal/vertical)
- `goto_split` - Navigate between splits
- `toggle_split_zoom` - Zoom/unzoom a split
- `resize_split` - Resize splits
- `equalize_splits` - Make all splits equal size

**Key insight:** Ghostty has **native split support** (like tmux but built-in)!

### 4. **Command Execution**

```bash
# Run specific command
ghostty -e top

# macOS: Use open
open -na Ghostty.app --args -e "cd /path && ls"
```

### 5. **Keybindings**

Ghostty uses a powerful keybinding system:
```
keybind = cmd+t=new_tab
keybind = cmd+d=new_split:right
keybind = cmd+shift+d=new_split:down
```

## Differences from iTerm2

| Feature | iTerm2 | Ghostty |
|---------|--------|---------|
| **Automation** | AppleScript | Config files + CLI args |
| **Window positioning** | Precise pixel bounds | No direct control (OS managed) |
| **Themes** | RGB manual config | 400+ built-in themes |
| **Splits** | No (use tmux) | Native built-in |
| **Speed** | Good | Extremely fast (GPU-accelerated) |
| **Config** | GUI preferences | Text file |
| **Profiles** | Multiple profiles | Single config + CLI overrides |

## Advantages for Dendrovia

1. **Simpler theming** - Just reference theme names instead of RGB values
2. **Native splits** - 3-pane layout without tmux
3. **Faster** - GPU-accelerated rendering
4. **Declarative** - Config-based instead of scripting

## Limitations

1. **No precise window positioning** - Can't create 3x2 grid like iTerm2
2. **No AppleScript** - Can't query/control running instance
3. **macOS CLI limitation** - Must use `open` command
4. **Newer/less mature** - Fewer features than iTerm2

## Proposed Dendrovia Approach

### Option A: Single Window with Splits (Recommended)
- Launch one Ghostty window per pillar
- Use splits for 3-pane layout (1 top, 2 bottom)
- Theme per window via config file override
- Let macOS position windows naturally

### Option B: Tab-based
- Launch one Ghostty window with 6 tabs (one per pillar)
- Each tab uses splits for 3-pane layout
- Set tab titles with pillar names
- Simpler but less visual separation

### Option C: Hybrid
- 2-3 windows, each with 2-3 tabs
- Balance between separation and simplicity

## Recommended Themes for Pillars

Based on available themes:

| Pillar | Theme | Matches |
|--------|-------|---------|
| CHRONOS 📜 | `Gruvbox Material` | Warm, earthy |
| IMAGINARIUM 🎨 | `Catppuccin Mocha` | Purple/pink tones |
| ARCHITECTUS 🏛️ | `Nord` | Cool blues |
| LUDUS 🎮 | `TokyoNight Storm` | Green/cyan |
| OCULUS 👁️ | `Everforest Dark Hard` | Orange/warm |
| OPERATUS 💾 | `Zenburn` | Gray/muted |

## Implementation Plan

1. Create 6 config file templates (one per pillar)
2. Add `--ghostty` flag to launcher
3. Generate launch commands using `open` with config overrides
4. Use shell scripts to set up splits (can't do via AppleScript)
5. Document keybindings for navigation

## Testing Commands

```bash
# Test basic launch
open -na Ghostty.app

# Test with theme
open -na Ghostty.app --args --theme="Catppuccin Mocha"

# Test with command
open -na Ghostty.app --args -e "echo 'Hello Ghostty'"

# Test with multiple args
open -na Ghostty.app --args --theme="Nord" --font-size=14 -e "cd ~/denroot/CHRONOS"
```

## Configuration References

- Main docs: https://ghostty.org/docs/config
- Default config: `ghostty +show-config --default --docs`
- Available themes: `ghostty +list-themes`
- Available actions: `ghostty +list-actions`
- Available keybinds: `ghostty +list-keybinds`

## Next Steps

1. Choose theming approach
2. Test split configuration
3. Build Ghostty launcher script
4. Add `--ghostty` flag to main launcher
5. Document usage differences
