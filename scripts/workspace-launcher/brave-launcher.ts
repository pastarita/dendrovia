#!/usr/bin/env bun

/**
 * Brave Browser Launcher for Dendrovia Playgrounds
 *
 * Opens all playground tabs in Brave, with Dendrovia Quest (hub)
 * as the active first tab.
 *
 * Behavior:
 * - If Brave is not running, launches a new instance
 * - Opens a new window with all playground tabs
 * - First tab = Quest hub (:3010), then pillars in order
 * - Remaining tabs: ARC, CHR, IMG, LUD, OCU, OPR
 */

import { $ } from 'bun';

// ── Playground Port Registry ────────────────────────────────────

interface PlaygroundEntry {
  pillar: string;
  emoji: string;
  port: number;
  label: string;
}

const PLAYGROUNDS: PlaygroundEntry[] = [
  { pillar: 'QUEST',       emoji: '🌳', port: 3010, label: 'The Hub' },
  { pillar: 'ARCHITECTUS', emoji: '🏛️', port: 3011, label: 'The Renderer' },
  { pillar: 'CHRONOS',     emoji: '📜', port: 3012, label: 'The Archaeologist' },
  { pillar: 'IMAGINARIUM', emoji: '🎨', port: 3013, label: 'The Compiler' },
  { pillar: 'LUDUS',       emoji: '🎮', port: 3014, label: 'The Mechanics' },
  { pillar: 'OCULUS',      emoji: '👁️', port: 3015, label: 'The Interface' },
  { pillar: 'OPERATUS',    emoji: '💾', port: 3016, label: 'The Infrastructure' },
];

const BRAVE_APP = '/Applications/Brave Browser.app';
const BRAVE_BIN = `${BRAVE_APP}/Contents/MacOS/Brave Browser`;

// ── Tab Refresh ─────────────────────────────────────────────────

/**
 * Try to refresh existing Brave tabs that match our playground ports.
 * Returns the number of tabs refreshed (0 if none found).
 */
async function tryRefreshExistingTabs(entries: PlaygroundEntry[]): Promise<number> {
  // Build port-matching conditions for AppleScript
  const portChecks = entries
    .map((e) => `URL of t contains "localhost:${e.port}"`)
    .join(' or ');

  const script = `
tell application "Brave Browser"
  set refreshed to 0
  repeat with w in windows
    repeat with t in tabs of w
      if ${portChecks} then
        tell t to reload
        set refreshed to refreshed + 1
      end if
    end repeat
  end repeat
  return refreshed
end tell
  `.trim();

  try {
    const result = await $`osascript -e ${script}`.quiet();
    const count = parseInt(result.text().trim(), 10);
    return isNaN(count) ? 0 : count;
  } catch {
    return 0;
  }
}

// ── Helpers ─────────────────────────────────────────────────────

async function isBraveRunning(): Promise<boolean> {
  try {
    const result = await $`pgrep -x "Brave Browser" 2>/dev/null`.quiet();
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

function buildAppleScript(urls: string[]): string {
  // First URL opens in a new window; rest open as tabs in that window
  const [first, ...rest] = urls;

  const openTabs = rest
    .map((url) => `      make new tab at end of tabs of front window with properties {URL:"${url}"}`)
    .join('\n');

  return `
tell application "Brave Browser"
  activate
  delay 0.3

  -- Open a new window with the first (home) tab
  make new window
  set URL of active tab of front window to "${first}"

  -- Open remaining tabs
${openTabs}

  -- Switch back to the first tab (home pillar)
  set active tab index of front window to 1
end tell
  `.trim();
}

// ── Main ────────────────────────────────────────────────────────

export interface BraveLaunchOptions {
  /** Which pillar gets the first tab (default: QUEST) */
  homePillar?: string;
  /** Only open specific pillars */
  pillars?: string[];
  /** Dry run — print the AppleScript without executing */
  dryRun?: boolean;
  /** Wait for dev servers to be ready before opening */
  waitForServers?: boolean;
  /** Timeout in ms when waiting for servers (default: 15000) */
  waitTimeout?: number;
}

async function waitForPort(port: number, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`http://localhost:${port}`, {
        signal: AbortSignal.timeout(500),
      });
      // Any response means the server is up (even 500s from SSR errors)
      return true;
    } catch {
      await Bun.sleep(300);
    }
  }
  return false;
}

export async function launchBrave(options: BraveLaunchOptions = {}): Promise<void> {
  const {
    homePillar = 'QUEST',
    pillars: filterPillars,
    dryRun = false,
    waitForServers = false,
    waitTimeout = 15000,
  } = options;

  // Filter and order playgrounds: home pillar first, then the rest
  let entries = filterPillars
    ? PLAYGROUNDS.filter((p) => filterPillars.includes(p.pillar))
    : [...PLAYGROUNDS];

  // Move home pillar to front
  const homeIndex = entries.findIndex((p) => p.pillar === homePillar.toUpperCase());
  if (homeIndex > 0) {
    const [home] = entries.splice(homeIndex, 1);
    entries.unshift(home);
  }

  // Wait for servers if requested
  if (waitForServers) {
    console.log('  Waiting for dev servers...');
    const results = await Promise.all(
      entries.map(async (entry) => {
        const ready = await waitForPort(entry.port, waitTimeout);
        const status = ready ? '✓' : '✗';
        console.log(`    ${status} ${entry.emoji} ${entry.pillar} :${entry.port}`);
        return { ...entry, ready };
      })
    );
    // Only open tabs for servers that responded
    entries = results.filter((r) => r.ready);
    if (entries.length === 0) {
      console.error('  No dev servers responded. Run `bun run td` first.');
      return;
    }
  }

  // Try refreshing existing tabs before opening new ones
  if (!dryRun) {
    const running = await isBraveRunning();
    if (running) {
      const refreshed = await tryRefreshExistingTabs(entries);
      if (refreshed > 0) {
        console.log(`  Refreshed ${refreshed} existing browser tab${refreshed > 1 ? 's' : ''}`);
        return;
      }
    }
  }

  const urls = entries.map((e) => `http://localhost:${e.port}`);
  const script = buildAppleScript(urls);

  if (dryRun) {
    console.log('\nGenerated AppleScript:\n');
    console.log('─'.repeat(60));
    console.log(script);
    console.log('─'.repeat(60));
    console.log('\nTabs:');
    entries.forEach((e, i) => {
      const marker = i === 0 ? ' (HOME)' : '';
      console.log(`  ${i + 1}. ${e.emoji} ${e.pillar} → http://localhost:${e.port}${marker}`);
    });
    return;
  }

  // Launch
  if (!(await isBraveRunning())) {
    console.log('  Starting Brave Browser...');
    await $`open -a "Brave Browser"`.quiet();
    await Bun.sleep(1500); // Give Brave time to initialize
  }

  console.log('  Opening playground tabs:');
  entries.forEach((e, i) => {
    const marker = i === 0 ? ' ← active' : '';
    console.log(`    ${e.emoji} ${e.pillar.padEnd(13)} :${e.port}${marker}`);
  });

  await $`osascript -e ${script}`;
}

// ── CLI Entry Point ─────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const wait = args.includes('--wait');
  const homePillar = args.find((a) => !a.startsWith('--'))?.toUpperCase();

  console.log('\n🌐 Dendrovia Brave Launcher\n');

  await launchBrave({
    homePillar: homePillar || 'QUEST',
    dryRun,
    waitForServers: wait,
  });

  if (!dryRun) {
    console.log('\n✅ Browser ready\n');
  }
}
