#!/usr/bin/env bun

/**
 * Dendrovia Workspace Launcher CLI
 *
 * Usage:
 *   bun run launch              # Launch all 6 pillars
 *   bun run launch --dev        # Launch with dev servers
 *   bun run launch --pillars CHRONOS IMAGINARIUM  # Launch specific pillars
 *   bun run launch --dry-run    # Show what would happen
 */

import { parseArgs } from "util";
import { $ } from "bun";
import { DENDROVIA_CONFIG } from "./workspace-launcher/pillar-registry";
import { generateItermAppleScript } from "./workspace-launcher/iterm-launcher";
import { launchGhosttyWorkspace } from "./workspace-launcher/ghostty-launcher";
import type { LaunchOptions } from "./workspace-launcher/types";

// Parse CLI arguments
const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    pillars: {
      type: "string",
      short: "p",
      multiple: true,
    },
    dev: {
      type: "boolean",
      short: "d",
      default: false,
    },
    "dry-run": {
      type: "boolean",
      default: false,
    },
    help: {
      type: "boolean",
      short: "h",
      default: false,
    },
    list: {
      type: "boolean",
      short: "l",
      default: false,
    },
    ghostty: {
      type: "boolean",
      short: "g",
      default: false,
    },
    orn: {
      type: "boolean",
      default: false,
    },
  },
  allowPositionals: true,
});

// Show help
if (values.help) {
  console.log(`
🌳 Dendrovia Workspace Launcher

Launch all 6 pillar checkouts in iTerm2 with proper layout and context.

Usage:
  bun run launch              Launch all pillars (iTerm2)
  bun run launch --orn        Ornithicus-focused layout (4 pillars + ORN hero)
  bun run launch --ghostty    Launch all pillars (Ghostty)
  bun run launch --dev        Launch with dev servers
  bun run launch --pillars CHRONOS IMAGINARIUM
                              Launch specific pillars
  bun run launch --dry-run    Show AppleScript without executing
  bun run launch --list       List available pillars

Options:
  --pillars, -p <names>   Specific pillars to launch (can repeat)
  --dev, -d               Start dev servers in each window
  --orn                   Ornithicus-focused mode (5 windows)
  --ghostty, -g           Use Ghostty instead of iTerm2
  --dry-run               Show what would happen without executing
  --list, -l              List available pillars
  --help, -h              Show this help

Pillars:
  CHRONOS       📜 Git + AST Parsing
  IMAGINARIUM   🎨 AI → Shader Distillation
  ARCHITECTUS   🏛️ WebGPU Rendering
  LUDUS         🎮 Game Logic
  OCULUS        👁️ UI/UX Components
  OPERATUS      💾 Infrastructure
  ORNITHICUS    🐦 Spatial Codebase Editor

Standard Layout (6 pillars, 3×2):
  ┌─────────────┬─────────────┬─────────────┐
  │ CHR         │ IMG         │ ARC         │
  ├─────────────┼─────────────┼─────────────┤
  │ LUD         │ OCU         │ OPR         │
  └─────────────┴─────────────┴─────────────┘

Ornithicus Layout (--orn):
  ┌──────────┬──────────┬──────────┬──────────┐
  │ CHRONOS  │ IMAGINA- │ ARCHITE- │ OCULUS   │
  │ (2-pane) │ RIUM     │ CTUS     │ (2-pane) │
  ├──────────┴──────────┴──────────┴──────────┤
  │ ORNITHICUS (full-width, 3-pane)           │
  └───────────────────────────────────────────┘

Each standard window: 2 panes (root + dev)
OPERATUS/ORNITHICUS: 3 panes (root + td runner + shell)
  `);
  process.exit(0);
}

// List pillars
if (values.list) {
  console.log("\n🌳 Available Pillars:\n");
  for (const pillar of DENDROVIA_CONFIG.pillars) {
    console.log(
      `  ${pillar.emoji} ${pillar.id.padEnd(12)} ${pillar.name.padEnd(20)} ${pillar.description}`
    );
    console.log(`     ${pillar.path}`);
    console.log();
  }
  process.exit(0);
}

// Build launch options
const options: LaunchOptions = {
  pillars: values.pillars as string[] | undefined,
  withDevServers: values.dev as boolean,
  dryRun: values["dry-run"] as boolean,
};

// Ornithicus-focused mode
if (values.orn) {
  options.ornMode = true;
  options.pillars = ["CHRONOS", "IMAGINARIUM", "ARCHITECTUS", "OCULUS", "ORNITHICUS"];
}

const useGhostty = values.ghostty as boolean;

// Add positional arguments as pillars
if (positionals.length > 0) {
  options.pillars = [...(options.pillars || []), ...positionals];
}

// Validate pillar names
if (options.pillars) {
  const validIds = DENDROVIA_CONFIG.pillars.map((p) => p.id);
  const invalid = options.pillars.filter((id) => !validIds.includes(id.toUpperCase()));
  if (invalid.length > 0) {
    console.error(`❌ Invalid pillar names: ${invalid.join(", ")}`);
    console.error(`   Valid pillars: ${validIds.join(", ")}`);
    process.exit(1);
  }
  // Normalize to uppercase
  options.pillars = options.pillars.map((id) => id.toUpperCase());
}

// Use Ghostty or iTerm2
if (useGhostty) {
  // Launch with Ghostty
  await launchGhosttyWorkspace(DENDROVIA_CONFIG, options);
} else {
  // Launch with iTerm2
  const script = generateItermAppleScript(DENDROVIA_CONFIG, options);

  // Dry run - just show the script
  if (options.dryRun) {
    console.log("🌳 Dendrovia Workspace Launcher (DRY RUN)\n");
    console.log("Generated AppleScript:\n");
    console.log("─".repeat(80));
    console.log(script);
    console.log("─".repeat(80));
    process.exit(0);
  }

  // Execute the AppleScript
  console.log("🌳 Launching Dendrovia workspaces...\n");

  const pillars = options.pillars
    ? DENDROVIA_CONFIG.pillars.filter((p) => options.pillars?.includes(p.id))
    : DENDROVIA_CONFIG.pillars;

  for (const pillar of pillars) {
    console.log(
      `  ${pillar.emoji} ${pillar.id} - ${pillar.name}`
    );
  }

  console.log();

  try {
    await $`osascript -e ${script}`;
    console.log("\n✅ Workspace launched successfully!");
  } catch (error) {
    console.error("\n❌ Failed to launch workspace:");
    console.error(error);
    process.exit(1);
  }
}
