# Ghostty Setup Guide for Dendrovia

Complete guide to setting up Ghostty with custom Dendrovia themes and split layouts.

## Prerequisites

1. **Install Ghostty**: https://ghostty.org
2. **Enable Accessibility**: Required for split automation
   - System Settings → Privacy & Security → Accessibility
   - Add "Terminal" or "Script Editor" to allowed apps

## Step 1: Install Custom Themes

The workspace launcher automatically installed 6 custom themes to:
```
~/.config/ghostty/themes/
```

**Installed themes:**
- ✅ `dendrovia-chronos` - Archaeological amber
- ✅ `dendrovia-imaginarium` - Alchemical violet
- ✅ `dendrovia-architectus` - Computational blue
- ✅ `dendrovia-ludus` - Tactical green
- ✅ `dendrovia-oculus` - Observational amber
- ✅ `dendrovia-operatus` - Industrial grey

**Verify installation:**
```bash
ls ~/.config/ghostty/themes/dendrovia-*
```

## Step 2: Configure Ghostty

Add recommended settings to your Ghostty config:
```bash
open ~/Library/Application\ Support/com.mitchellh.ghostty/config
```

**Copy configuration from:**
```bash
cat scripts/workspace-launcher/ghostty-config-snippet.txt
```

**Or append automatically:**
```bash
cat scripts/workspace-launcher/ghostty-config-snippet.txt >> \
  ~/Library/Application\ Support/com.mitchellh.ghostty/config
```

## Step 3: Launch Workspace

**Basic launch (all 6 pillars with auto-splits):**
```bash
bun run launch --ghostty
```

**Launch specific pillars:**
```bash
bun run launch --ghostty --pillars CHRONOS IMAGINARIUM ARCHITECTUS
```

**Without auto-splits:**
```bash
bun run launch --ghostty --no-auto-splits
```

**Dry run (see commands):**
```bash
bun run launch --ghostty --dry-run
```

## Step 4: Understanding the Grid Layout

All 6 Ghostty windows are arranged in a 3x2 grid:

```
┌─────────────┬─────────────┬─────────────┐
│   CHRONOS   │ IMAGINARIUM │ ARCHITECTUS │
├─────────────┼─────────────┼─────────────┤
│    LUDUS    │   OCULUS    │  OPERATUS   │
└─────────────┴─────────────┴─────────────┘
```

**Grid features:**
- Automatic positioning and sizing based on screen resolution
- 10px gaps between windows for visual separation
- Optimized for widescreen displays (3456x2234, 1920x1080, etc.)
- Can be disabled with `--no-grid-layout` flag

## Step 5: Understanding the Split Layout

Each Ghostty window has a 3-pane split layout:

```
┌─────────────────────────────────────┐
│                                     │
│         TOP PANE (70%)              │
│      Main Workspace                 │
│                                     │
│                                     │
├──────────────────┬──────────────────┤
│  BOTTOM-LEFT     │  BOTTOM-RIGHT    │
│    (15%)         │     (15%)        │
│  Commands/Logs   │  Secondary       │
└──────────────────┴──────────────────┘
```

**Pane purposes:**
- **Top (70%)**: Main development workspace (code editing, primary terminal)
- **Bottom-left (15%)**: Commands, logs, monitoring (git, npm, etc.)
- **Bottom-right (15%)**: Secondary tasks, testing, background processes

## Step 6: Keybindings Reference

### Split Navigation
| Keybinding | Action |
|------------|--------|
| `cmd+[` | Previous split |
| `cmd+]` | Next split |
| `cmd+k` | Jump to top split |
| `cmd+j` | Jump to bottom split |
| `cmd+h` | Jump to left split |
| `cmd+l` | Jump to right split |

### Split Creation
| Keybinding | Action |
|------------|--------|
| `cmd+d` | Split right (vertical) |
| `cmd+shift+d` | Split down (horizontal) |

### Split Resizing
| Keybinding | Action |
|------------|--------|
| `cmd+opt+↑` | Resize up (small) |
| `cmd+opt+↓` | Resize down (small) |
| `cmd+opt+←` | Resize left (small) |
| `cmd+opt+→` | Resize right (small) |
| `cmd+opt+shift+arrows` | Resize (large) |

### Split Management
| Keybinding | Action |
|------------|--------|
| `cmd+shift+enter` | Toggle split zoom (fullscreen) |
| `cmd+opt+e` | Equalize all splits |
| `cmd+w` | Close current split |

## Manual Grid Setup

If auto-grid fails, run manually:

```bash
./scripts/workspace-launcher/setup-ghostty-grid.sh
```

Or arrange windows manually using macOS window management (Rectangle, Magnet, Stage Manager, etc.)

## Manual Split Setup

If auto-splits fail, create manually:

1. **Open Ghostty window**
2. **Create horizontal split**: `cmd+shift+d`
3. **Resize to 70/30**: `cmd+opt+↑` (8 times)
4. **Navigate to bottom**: `cmd+]`
5. **Split vertically**: `cmd+d`
6. **Navigate back to top**: `cmd+[` (twice)

Or run the setup script manually:
```bash
./scripts/workspace-launcher/setup-ghostty-splits.sh
```

## Troubleshooting

### "Could not configure splits" warning

**Cause**: Accessibility permissions not granted

**Solution:**
1. System Settings → Privacy & Security → Accessibility
2. Add Terminal/Script Editor
3. Restart terminal and try again

### Themes not appearing

**Verify themes exist:**
```bash
ls ~/.config/ghostty/themes/
```

**List available themes:**
```bash
ghostty +list-themes | grep dendrovia
```

**Test theme manually:**
```bash
open -na Ghostty.app --args --theme="dendrovia-chronos"
```

### Wrong split ratios

**Adjust manually:**
```bash
# Make top split bigger
cmd+opt+shift+↑  (hold and press multiple times)

# Make bottom splits equal
cmd+opt+e
```

### Window positioning

Ghostty uses macOS native window management:
- **Stage Manager**: Windows auto-tile
- **Rectangle/Magnet**: Use window manager
- **Manual**: Drag to position, macOS remembers per-theme

## Advanced: Custom Window Layouts

Create custom layouts with AppleScript:

```applescript
-- Example: Different split for IMAGINARIUM
tell application "System Events"
    tell process "Ghostty"
        -- Your custom layout logic
    end tell
end tell
```

## Comparison with iTerm2

| Feature | Ghostty | iTerm2 |
|---------|---------|--------|
| **Theming** | Built-in + custom | Manual RGB |
| **Splits** | Native | tmux required |
| **Automation** | AppleScript + config | AppleScript |
| **Speed** | Very fast (GPU) | Good |
| **Window control** | Limited | Precise |

**Recommendation:**
- **Ghostty**: Better for development, faster, native splits
- **iTerm2**: Better for precise automation, legacy workflows

## Theme Previews

**CHRONOS** (Archaeological Amber):
```bash
open -na Ghostty.app --args --theme="dendrovia-chronos"
```

**IMAGINARIUM** (Alchemical Violet):
```bash
open -na Ghostty.app --args --theme="dendrovia-imaginarium"
```

**ARCHITECTUS** (Computational Blue):
```bash
open -na Ghostty.app --args --theme="dendrovia-architectus"
```

**LUDUS** (Tactical Green):
```bash
open -na Ghostty.app --args --theme="dendrovia-ludus"
```

**OCULUS** (Observational Amber):
```bash
open -na Ghostty.app --args --theme="dendrovia-oculus"
```

**OPERATUS** (Industrial Grey):
```bash
open -na Ghostty.app --args --theme="dendrovia-operatus"
```

## Next Steps

1. **Customize keybindings**: Edit Ghostty config
2. **Adjust split ratios**: Use resize commands
3. **Set up shell integration**: Ghostty supports fish, zsh, bash
4. **Explore themes**: `ghostty +list-themes`

---

*For more info: `ghostty +help` or https://ghostty.org/docs*
