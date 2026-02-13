/**
 * Ghostty Workspace Launcher for Dendrovia
 *
 * Launches 6 Ghostty windows (one per pillar) with custom themes.
 *
 * Limitations vs iTerm2:
 * - No precise window positioning (macOS handles placement)
 * - No programmatic splits (user creates with cmd+d, cmd+shift+d)
 * - Single pane per window initially
 *
 * Advantages:
 * - Simpler theming (400+ built-in themes)
 * - Faster (GPU-accelerated)
 * - Native split support (manual)
 */

import type { DendroviaConfig, Pillar } from "./pillar-registry";
import type { LaunchOptions } from "./types";
import { $ } from "bun";

// Ghostty theme mappings for each pillar (using custom Dendrovia themes)
const PILLAR_THEMES: Record<string, string> = {
  CHRONOS: "dendrovia-chronos",          // Archaeological amber
  IMAGINARIUM: "dendrovia-imaginarium",  // Alchemical violet
  ARCHITECTUS: "dendrovia-architectus",  // Computational blue
  LUDUS: "dendrovia-ludus",              // Tactical green
  OCULUS: "dendrovia-oculus",            // Observational amber
  OPERATUS: "dendrovia-operatus",        // Industrial grey
};

/**
 * Generate shell command to launch Ghostty window for a pillar
 */
function generateGhosttyCommand(pillar: Pillar, options: LaunchOptions = {}): string {
  const { withDevServers = false } = options;

  const theme = PILLAR_THEMES[pillar.id] || "Nord";

  // Build initial command
  let command = `cd '${pillar.path}'`;

  // Add title/info display
  command += ` && echo '\\n${pillar.name}\\n${pillar.description}\\n'`;
  command += ` && echo 'CLAUDE.md context available for this pillar\\n'`;
  command += ` && echo 'Run claude to start AI assistant\\n'`;
  command += ` && echo '\\nGhostty keybindings:'`;
  command += ` && echo '  cmd+d          - Split right'`;
  command += ` && echo '  cmd+shift+d    - Split down'`;
  command += ` && echo '  cmd+[/]        - Navigate splits'`;
  command += ` && echo '  cmd+shift+enter - Toggle split zoom\\n'`;

  // Start dev server if requested
  if (withDevServers) {
    command += ` && echo 'Starting dev server...' && bun run dev`;
  } else {
    command += ` && exec $SHELL`;
  }

  // Build Ghostty launch command
  const args: string[] = [
    "-na",
    "Ghostty.app",
    "--args",
    `--theme="${theme}"`,
    `--title="${pillar.emoji} ${pillar.shortCode} - ${pillar.name}"`,
    "-e",
    "$SHELL",
    "-c",
    `"${command}"`,
  ];

  return `open ${args.join(" ")}`;
}

/**
 * Launch Dendrovia workspace in Ghostty
 */
export async function launchGhosttyWorkspace(
  config: DendroviaConfig,
  options: LaunchOptions = {}
): Promise<void> {
  const { pillars: pillarIds, withDevServers = false, dryRun = false } = options;

  // Filter pillars
  let pillars = config.pillars;
  if (pillarIds && pillarIds.length > 0) {
    pillars = config.pillars.filter((p) => pillarIds.includes(p.id));
  }

  console.log("🌳 Launching Dendrovia workspaces in Ghostty...\\n");

  for (const pillar of pillars) {
    console.log(`  ${pillar.emoji} ${pillar.id} - ${pillar.name} (${PILLAR_THEMES[pillar.id]})`);
  }

  console.log();

  if (dryRun) {
    console.log("📋 Generated Commands:\\n");
    for (const pillar of pillars) {
      console.log(`# ${pillar.name}`);
      console.log(generateGhosttyCommand(pillar, options));
      console.log();
    }
    return;
  }

  // Launch windows with staggered delays
  for (let i = 0; i < pillars.length; i++) {
    const pillar = pillars[i];
    const command = generateGhosttyCommand(pillar, options);

    try {
      await $`sh -c ${command}`;

      // Small delay between launches to prevent race conditions
      if (i < pillars.length - 1) {
        await Bun.sleep(500);
      }
    } catch (error) {
      console.error(`❌ Failed to launch ${pillar.name}:`, error);
    }
  }

  console.log("\\n✅ Workspace launched in Ghostty!");

  // Auto-configure splits if requested
  if (options.autoSplits !== false) {
    console.log("\\n📐 Configuring window splits...");
    try {
      await $`./scripts/workspace-launcher/setup-ghostty-splits.sh`;
    } catch (error) {
      console.warn("⚠️  Could not auto-configure splits. You can run manually:");
      console.warn("   ./scripts/workspace-launcher/setup-ghostty-splits.sh");
    }
  }

  console.log("\\n💡 Tips:");
  console.log("  - Top pane (70%): Main workspace");
  console.log("  - Bottom-left (15%): Commands/logs");
  console.log("  - Bottom-right (15%): Secondary tasks");
  console.log("  - cmd+option+arrows: Resize splits");
  console.log("  - cmd+[ / cmd+]: Navigate splits");
  console.log("  - cmd+shift+enter: Toggle split zoom");
}
