/**
 * Dendrovia Workspace Launcher Types
 */

export interface LaunchOptions {
  /** Specific pillar IDs to launch (all if not provided) */
  pillars?: string[];
  /** Launch with dev servers running */
  withDevServers?: boolean;
  /** Dry run - just show what would happen */
  dryRun?: boolean;
  /** Layout mode */
  layout?: "grid" | "stack";
}

export interface LaunchResult {
  success: boolean;
  launched: string[];
  errors: string[];
}

export interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Pillar {
  id: string;
  name: string;
  path: string;
  shortCode: string;
  description: string;
  primaryPackage: string;
  emoji: string;
}
