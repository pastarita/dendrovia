/**
 * Dendrovia Workspace Launcher
 *
 * Launches all 6 pillar checkouts in iTerm2 or Ghostty with proper layout and context.
 */

export * from "./types";
export * from "./pillar-registry";
export { generateItermAppleScript, generateBashLauncher } from "./iterm-launcher";
export { launchGhosttyWorkspace } from "./ghostty-launcher";
