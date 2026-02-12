/**
 * iTerm2 AppleScript Generator for Dendrovia
 *
 * Generates AppleScript to launch iTerm2 windows for each pillar.
 * Each window has 3 panes:
 * ┌─────────────────────────┐
 * │      TOP (Claude)       │  <- Claude Code with CLAUDE.md context
 * ├────────────┬────────────┤
 * │ Bottom L   │ Bottom R   │
 * │  (Dev)     │ (Shell)    │  <- Dev work / General shell
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
    const cdCommand = `cd '${pillar.path}'`;
    const titleTop = `echo -e '\\\\033]0;${pillar.shortCode} Claude\\\\007'`;
    const titleBottomLeft = `echo -e '\\\\033]0;${pillar.shortCode} Dev\\\\007'`;
    const titleBottomRight = `echo -e '\\\\033]0;${pillar.shortCode} Shell\\\\007'`;

    // Dev server command (if requested)
    const devServerCmd = withDevServers
      ? ` && echo 'Starting dev server...' && bun run dev`
      : "";

    // Claude Code pane shows CLAUDE.md on launch
    const claudeSetup = ` && echo '\\n${pillar.name}\\n${pillar.description}\\n' && echo 'CLAUDE.md context loaded for this pillar\\n' && echo 'Run claude to start AI assistant\\n'`;

    return `
    -- Window ${i + 1}: ${pillar.name}
    -- Create window with ${pillar.profile} profile
    set newWindow to (create window with profile "${pillar.profile}")
    delay 0.5

    tell newWindow
      -- Top pane: Claude Code context
      tell current session
        write text "${cdCommand} && ${titleTop}${claudeSetup}"
      end tell
      delay 0.15

      -- Split horizontally to create bottom section
      tell current session
        set bottomLeftSession to (split horizontally with profile "${pillar.profile}")
      end tell
      delay 0.2

      -- Bottom left pane: Dev work
      tell bottomLeftSession
        write text "${cdCommand} && ${titleBottomLeft}${devServerCmd}"
        delay 0.1
        -- Split vertically to create bottom right
        set bottomRightSession to (split vertically with profile "${pillar.profile}")
      end tell
      delay 0.15

      -- Bottom right pane: General shell
      tell bottomRightSession
        write text "${cdCommand} && ${titleBottomRight}"
      end tell
    end tell
    delay 0.2

    -- Position and size the window
    set bounds of newWindow to {${pos.x}, ${pos.y}, ${pos.x + pos.width}, ${pos.y + pos.height}}
    delay 0.1

    -- Resize panes: make top pane ~70% of height (Claude gets more space)
    tell application "System Events"
      tell process "iTerm2"
        repeat 15 times
          key code 125 using {command down, control down}
          delay 0.02
        end repeat
      end tell
    end tell
    delay 0.5`;
  });

  return `-- Dendrovia Workspace Launcher
-- Launches ${pillars.length} pillar windows, each with 3 panes:
--   TOP: Claude Code with CLAUDE.md context
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
