/**
 * iTerm2 AppleScript Generator for Dendrovia
 *
 * Generates AppleScript to launch iTerm2 windows for each pillar.
 * Each window has 3 panes:
 * ┌─────────────────────────┐
 * │    TOP (Pillar Root)    │  <- Pillar checkout root (where CLAUDE.md lives)
 * ├────────────┬────────────┤
 * │ Bottom L   │ Bottom R   │
 * │  (Dev)     │ (Shell)    │  <- Dev work / General shell (smaller font)
 * └────────────┴────────────┘
 */

import type { DendroviaConfig, Pillar } from "./pillar-registry";
import type { LaunchOptions, WindowPosition } from "./types";

interface LayoutConfig {
  columns: number;
  rows: number;
  margin: number;
}

/**
 * Calculate grid positions for windows
 */
function calculateGridPositions(
  count: number,
  layout: LayoutConfig,
  screenWidth: number = 1920,
  screenHeight: number = 1080
): WindowPosition[] {
  const { columns, rows, margin } = layout;
  const positions: WindowPosition[] = [];
  const menuBar = 25;
  const usableWidth = screenWidth - margin * 2;
  const usableHeight = screenHeight - margin * 2 - menuBar;

  const cellWidth = Math.floor((usableWidth / columns) * 0.85);
  const cellHeight = Math.floor(usableHeight / rows);

  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    positions.push({
      x: margin + col * cellWidth,
      y: margin + menuBar + row * cellHeight,
      width: cellWidth,
      height: cellHeight,
    });
  }

  return positions;
}

/**
 * Generate AppleScript for launching Dendrovia workspace
 */
export function generateItermAppleScript(
  config: DendroviaConfig,
  options: LaunchOptions = {}
): string {
  const { pillars: pillarIds, withDevServers = false } = options;

  // Filter pillars if specific ones requested
  let pillars = config.pillars;
  if (pillarIds && pillarIds.length > 0) {
    pillars = config.pillars.filter((p) => pillarIds.includes(p.id));
  }

  const positions = calculateGridPositions(pillars.length, config.layout);

  // Build the AppleScript - each pillar gets its own window with 3 panes
  const windowScripts = pillars.map((pillar, i) => {
    const pos = positions[i] || positions[positions.length - 1];

    // Commands for each pane
    // Top pane (Claude Code) opens at pillar checkout root (where CLAUDE.md lives)
    const cdCommandTop = `cd '${pillar.path}'`;
    // Bottom panes open in the dendrovia monorepo (where production code lives)
    const cdCommandBottom = `cd '${pillar.path}/dendrovia'`;
    const titleTop = `echo -e '\\\\033]0;${pillar.shortCode} Root\\\\007'`;
    const titleBottomLeft = `echo -e '\\\\033]0;${pillar.shortCode} Dev\\\\007'`;
    const titleBottomRight = `echo -e '\\\\033]0;${pillar.shortCode} Shell\\\\007'`;

    // Dev server command (if requested)
    const devServerCmd = withDevServers
      ? ` && echo 'Starting dev server...' && bun run dev`
      : "";

    return `
    -- Window ${i + 1}: ${pillar.name}
    -- Create window with ${pillar.profile} profile
    set newWindow to (create window with profile "${pillar.profile}")
    delay 0.5

    tell newWindow
      -- Top pane: Pillar checkout root
      tell current session
        write text "${cdCommandTop} && ${titleTop}"
      end tell
      delay 0.15

      -- Split horizontally to create bottom section
      tell current session
        set bottomLeftSession to (split horizontally with profile "${pillar.profile}")
      end tell
      delay 0.2

      -- Bottom left pane: Dev work (dendrovia monorepo)
      tell bottomLeftSession
        write text "${cdCommandBottom} && ${titleBottomLeft}${devServerCmd}"
        delay 0.1
        -- Split vertically to create bottom right
        set bottomRightSession to (split vertically with profile "${pillar.profile}")
      end tell
      delay 0.15

      -- Bottom right pane: General shell (dendrovia monorepo)
      tell bottomRightSession
        write text "${cdCommandBottom} && ${titleBottomRight}"
      end tell
    end tell
    delay 0.2

    -- Position and size the window
    set bounds of newWindow to {${pos.x}, ${pos.y}, ${pos.x + pos.width}, ${pos.y + pos.height}}
    delay 0.1

    -- Resize panes: make top pane larger (pillar root gets more space)
    tell application "System Events"
      tell process "iTerm2"
        repeat 9 times
          key code 125 using {command down, control down}
          delay 0.02
        end repeat
      end tell
    end tell
    delay 0.3

    -- Decrease font size in bottom panes (Cmd+- twice each)
    -- The escape-sequence approach (OSC 1337 SetFontSize) doesn't exist in iTerm2,
    -- so we use System Events keystrokes on the selected session instead.
    tell newWindow
      tell bottomLeftSession
        select
      end tell
    end tell
    delay 0.1
    tell application "System Events"
      tell process "iTerm2"
        key code 27 using command down
        delay 0.05
        key code 27 using command down
      end tell
    end tell
    delay 0.1
    tell newWindow
      tell bottomRightSession
        select
      end tell
    end tell
    delay 0.1
    tell application "System Events"
      tell process "iTerm2"
        key code 27 using command down
        delay 0.05
        key code 27 using command down
      end tell
    end tell
    delay 0.1
    -- Re-apply window bounds (Cmd+- shrinks the window to maintain row/col count)
    set bounds of newWindow to {${pos.x}, ${pos.y}, ${pos.x + pos.width}, ${pos.y + pos.height}}
    delay 0.1

    -- Re-select top pane so it's ready for use
    tell newWindow
      tell first session of current tab
        select
      end tell
    end tell
    delay 0.3`;
  });

  return `-- Dendrovia Workspace Launcher
-- Launches ${pillars.length} pillar windows, each with 3 panes:
--   TOP: Pillar checkout root
--   BOTTOM-LEFT: Dev work
--   BOTTOM-RIGHT: General shell

tell application "iTerm"
  activate
  delay 0.3
${windowScripts.join("\n")}

end tell

-- Summary
display notification "Launched ${pillars.length} pillar workspaces" with title "🌳 Dendrovia"
`;
}

/**
 * Generate bash-friendly launcher that invokes osascript
 */
export function generateBashLauncher(
  config: DendroviaConfig,
  options: LaunchOptions = {}
): string {
  const script = generateItermAppleScript(config, options);
  // Escape for bash
  const escaped = script.replace(/'/g, "'\\''");
  return `osascript -e '${escaped}'`;
}
