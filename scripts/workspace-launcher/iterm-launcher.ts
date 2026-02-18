/**
 * iTerm2 AppleScript Generator for Dendrovia
 *
 * Generates AppleScript to launch iTerm2 windows for each pillar.
 *
 * Standard pillars (CHRONOS, IMAGINARIUM, ARCHITECTUS, LUDUS, OCULUS) — 2 panes:
 * ┌─────────────────────────┐
 * │    TOP (Pillar Root)    │  <- Pillar checkout root (where CLAUDE.md lives)
 * ├─────────────────────────┤
 * │    BOTTOM (Dev/Shell)   │  <- Dev work (smaller font)
 * └─────────────────────────┘
 *
 * OPERATUS — 3 panes (runs td, needs extra shell):
 * ┌─────────────────────────┐
 * │    TOP (Pillar Root)    │  <- Pillar checkout root (where CLAUDE.md lives)
 * ├────────────┬────────────┤
 * │ Bottom L   │ Bottom R   │
 * │  (td)      │ (Shell)    │  <- td runner / General shell (smaller font)
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

  // Build the AppleScript - OPERATUS gets 3 panes, all others get 2 panes
  const windowScripts = pillars.map((pillar, i) => {
    const pos = positions[i] || positions[positions.length - 1];
    const isOperatus = pillar.id === "OPERATUS";

    // Commands for each pane
    // Top pane (Claude Code) opens at pillar checkout root (where CLAUDE.md lives)
    const cdCommandTop = `cd '${pillar.path}'`;
    // Bottom panes open in the dendrovia monorepo (where production code lives)
    const cdCommandBottom = `cd '${pillar.path}/dendrovia'`;
    const titleTop = `echo -e '\\\\033]0;${pillar.shortCode} Root\\\\007'`;

    // Dev server command (if requested)
    const devServerCmd = withDevServers
      ? ` && echo 'Starting dev server...' && bun run dev`
      : "";

    if (isOperatus) {
      // OPERATUS: 3-pane layout (top + bottom-left td runner + bottom-right shell)
      const titleBottomLeft = `echo -e '\\\\033]0;${pillar.shortCode} Dev\\\\007'`;
      const titleBottomRight = `echo -e '\\\\033]0;${pillar.shortCode} Shell\\\\007'`;

      return `
    -- Window ${i + 1}: ${pillar.name} (3-pane: top + bottom-left + bottom-right)
    set newWindow to (create window with profile "${pillar.profile}")
    delay 0.5

    tell newWindow
      tell current session
        write text "${cdCommandTop} && ${titleTop}"
      end tell
      delay 0.15

      tell current session
        set bottomLeftSession to (split horizontally with profile "${pillar.profile}")
      end tell
      delay 0.2

      tell bottomLeftSession
        write text "${cdCommandBottom} && ${titleBottomLeft}${devServerCmd}"
        delay 0.1
        set bottomRightSession to (split vertically with profile "${pillar.profile}")
      end tell
      delay 0.15

      tell bottomRightSession
        write text "${cdCommandBottom} && ${titleBottomRight}"
      end tell
    end tell
    delay 0.2

    set bounds of newWindow to {${pos.x}, ${pos.y}, ${pos.x + pos.width}, ${pos.y + pos.height}}
    delay 0.1

    -- Resize panes: make top pane larger
    tell application "System Events"
      tell process "iTerm2"
        repeat 9 times
          key code 125 using {command down, control down}
          delay 0.02
        end repeat
      end tell
    end tell
    delay 0.3

    -- Decrease font size in both bottom panes (Cmd+- twice each)
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
    set bounds of newWindow to {${pos.x}, ${pos.y}, ${pos.x + pos.width}, ${pos.y + pos.height}}
    delay 0.1

    tell newWindow
      tell first session of current tab
        select
      end tell
    end tell
    delay 0.3`;
    }

    // Standard pillars: 2-pane layout (top + single bottom)
    const titleBottom = `echo -e '\\\\033]0;${pillar.shortCode} Dev\\\\007'`;

    return `
    -- Window ${i + 1}: ${pillar.name} (2-pane: top + bottom)
    set newWindow to (create window with profile "${pillar.profile}")
    delay 0.5

    tell newWindow
      tell current session
        write text "${cdCommandTop} && ${titleTop}"
      end tell
      delay 0.15

      tell current session
        set bottomSession to (split horizontally with profile "${pillar.profile}")
      end tell
      delay 0.2

      tell bottomSession
        write text "${cdCommandBottom} && ${titleBottom}${devServerCmd}"
      end tell
    end tell
    delay 0.2

    set bounds of newWindow to {${pos.x}, ${pos.y}, ${pos.x + pos.width}, ${pos.y + pos.height}}
    delay 0.1

    -- Resize panes: make top pane larger
    tell application "System Events"
      tell process "iTerm2"
        repeat 9 times
          key code 125 using {command down, control down}
          delay 0.02
        end repeat
      end tell
    end tell
    delay 0.3

    -- Decrease font size in bottom pane (Cmd+- once)
    tell newWindow
      tell bottomSession
        select
      end tell
    end tell
    delay 0.1
    tell application "System Events"
      tell process "iTerm2"
        key code 27 using command down
      end tell
    end tell
    delay 0.1
    set bounds of newWindow to {${pos.x}, ${pos.y}, ${pos.x + pos.width}, ${pos.y + pos.height}}
    delay 0.1

    tell newWindow
      tell first session of current tab
        select
      end tell
    end tell
    delay 0.3`;
  });

  return `-- Dendrovia Workspace Launcher
-- Launches ${pillars.length} pillar windows:
--   Standard pillars: 2 panes (top root + bottom dev)
--   OPERATUS: 3 panes (top root + bottom-left td + bottom-right shell)

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
