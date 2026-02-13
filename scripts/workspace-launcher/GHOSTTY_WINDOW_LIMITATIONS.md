# Ghostty Window Positioning Limitations

## Issue

Ghostty does not expose its windows to macOS Accessibility APIs, which means automated window positioning via AppleScript, JXA, or Python is **not currently possible**.

**Confirmed behavior:**
```bash
osascript -e 'tell application "System Events" to tell process "ghostty" to count windows'
# Returns: 0 (even when windows are open)
```

This is a fundamental limitation of how Ghostty integrates with macOS window management.

## Workarounds

### Option 1: Manual Window Management (Recommended)

**Use macOS native features:**
- **Stage Manager** (macOS 13+): Auto-arranges windows
- **Split View**: Drag windows to screen edges
- **Mission Control**: Manually arrange in spaces

**Use third-party window managers:**
- **Rectangle** (free): [rectangleapp.com](https://rectangleapp.com)
  - Keyboard shortcuts for window positioning
  - Can save custom layouts
- **Magnet** ($7.99): Similar to Rectangle
- **BetterSnapTool** ($2.99): Advanced window management

### Option 2: Use Rectangle with Keyboard Shortcuts

After launching Ghostty windows:

1. **Install Rectangle**: `brew install --cask rectangle`

2. **Position windows manually** using keyboard shortcuts:
   ```
   Control + Option + Left Arrow  - Left half
   Control + Option + Right Arrow - Right half
   Control + Option + U           - Top left corner
   Control + Option + I           - Top right corner
   Control + Option + J           - Bottom left corner
   Control + Option + K           - Bottom right corner
   ```

3. **Suggested layout for 6 windows**:
   - CHRONOS: Top left third (`Ctrl+Opt+U` then resize)
   - IMAGINARIUM: Top center third
   - ARCHITECTUS: Top right third (`Ctrl+Opt+I`)
   - LUDUS: Bottom left third (`Ctrl+Opt+J`)
   - OCULUS: Bottom center third
   - OPERATUS: Bottom right third (`Ctrl+Opt+K`)

### Option 3: Use yabai (Advanced)

[yabai](https://github.com/koekeishiya/yabai) is a tiling window manager that can force-manage windows:

```bash
# Install yabai
brew install koekeishiya/formulae/yabai

# Configure yabai to tile Ghostty windows
# Add to ~/.yabairc:
yabai -m rule --add app="ghostty" manage=on grid=2:3:0:0:1:1
```

**Note:** yabai requires disabling SIP (System Integrity Protection) for full functionality.

### Option 4: Switch to iTerm2

iTerm2 has **full AppleScript support** and can be positioned programmatically:

```applescript
tell application "iTerm"
    create window with default profile
    tell current window
        set bounds to {0, 0, 640, 480}
    end tell
end tell
```

If automated grid layout is critical, iTerm2 is the better choice.

### Option 5: Use Hammerspoon (Lua-based automation)

[Hammerspoon](https://www.hammerspoon.org/) can manipulate windows using lower-level APIs:

```lua
-- ~/.hammerspoon/init.lua
hs.hotkey.bind({"cmd", "alt"}, "G", function()
  local ghostty = hs.application.find("ghostty")
  if ghostty then
    local windows = ghostty:allWindows()
    local screen = hs.screen.mainScreen():frame()

    -- Position first 6 windows in 3x2 grid
    local positions = {
      {0, 0, 1/3, 1/2},     -- CHRONOS
      {1/3, 0, 1/3, 1/2},   -- IMAGINARIUM
      {2/3, 0, 1/3, 1/2},   -- ARCHITECTUS
      {0, 1/2, 1/3, 1/2},   -- LUDUS
      {1/3, 1/2, 1/3, 1/2}, -- OCULUS
      {2/3, 1/2, 1/3, 1/2}, -- OPERATUS
    }

    for i, win in ipairs(windows) do
      if i <= 6 then
        local pos = positions[i]
        win:move({
          x = screen.x + screen.w * pos[1],
          y = screen.y + screen.h * pos[2],
          w = screen.w * pos[3],
          h = screen.h * pos[4]
        })
      end
    end
  end
end)
```

Then press `Cmd+Alt+G` to arrange windows.

## Current Status

The Dendrovia launcher includes:
- ✅ Custom themes (working)
- ✅ Automatic split configuration (working)
- ❌ Automatic grid layout (not possible with Ghostty)

## Recommendation

**For now:**
1. Use Rectangle or similar tool for manual positioning
2. Save your preferred layout
3. Use keyboard shortcuts to quickly arrange windows after launch

**For the future:**
- Monitor Ghostty issues for Accessibility API support
- Consider contributing to Ghostty to add this feature
- Alternatively, switch to iTerm2 if automated positioning is critical

## Related Issues

- Ghostty GitHub: Check for issues related to AppleScript/Accessibility support
- This is a known limitation, not a bug in our scripts

## Testing Done

Attempted approaches:
- ✗ AppleScript with System Events
- ✗ JXA (JavaScript for Automation)
- ✗ Python with Quartz/AppKit
- ✗ Direct CGWindow API access

All fail because Ghostty doesn't register windows with the Accessibility API.

---

*Last updated: 2026-02-12*
