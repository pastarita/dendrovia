/**
 * Dendrovia Workspace Launcher
 *
 * Launches all 6 pillar checkouts in iTerm2 or Ghostty with proper layout and context.
 */

export { launchGhosttyWorkspace } from './ghostty-launcher';
export { generateBashLauncher, generateItermAppleScript } from './iterm-launcher';
export * from './pillar-registry';
export * from './types';
