#!/usr/bin/env bun

/**
 * td — Turbo dev orchestrator with pillar-colored output and optional browser launch.
 *
 * Spawns turbo dev, pipes stdout/stderr through the colorizer, and optionally
 * opens Brave to the Quest hub (localhost:3010). If a matching tab already
 * exists in Brave, it refreshes it instead of opening a new one.
 *
 * Usage: bun run scripts/td.ts [--no-browser] [turbo args...]
 */

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { $ } from 'bun';
import { colorizeLine } from './turbo-colors';

// ── Args ────────────────────────────────────────────────────────

const NO_BROWSER_FLAG = '--no-browser';

const args = process.argv.slice(2);
const skipBrowser = args.includes(NO_BROWSER_FLAG);

// Remove our custom flag before passing to turbo
const turboArgs = ['dev', ...args.filter(a => a !== NO_BROWSER_FLAG)];

// ── Spawn turbo ─────────────────────────────────────────────────

const turboBin = resolve(dirname(import.meta.dirname!), 'node_modules', '.bin', 'turbo');

const child = spawn(turboBin, turboArgs, {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: {
    ...process.env,
    FORCE_COLOR: '1',  // Ensure turbo outputs color (we'll re-color)
  },
});

// ── Stream processing ───────────────────────────────────────────

function processStream(stream: NodeJS.ReadableStream, output: NodeJS.WritableStream) {
  let buffer = '';

  stream.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    // Keep the last incomplete line in the buffer
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      output.write(colorizeLine(line) + '\n');
    }
  });

  stream.on('end', () => {
    if (buffer) {
      output.write(colorizeLine(buffer) + '\n');
    }
  });
}

processStream(child.stdout!, process.stdout);
processStream(child.stderr!, process.stderr);

// ── Brave: open or refresh localhost:3010 ───────────────────────

const QUEST_URL = 'http://localhost:3010';

async function waitForServer(url: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(500) });
      return true;
    } catch {
      await Bun.sleep(300);
    }
  }
  return false;
}

async function openOrRefreshBrave(url: string): Promise<void> {
  // Try to refresh an existing tab first
  const refreshScript = `
tell application "Brave Browser"
  repeat with w in windows
    repeat with t in tabs of w
      if URL of t contains "localhost:3010" then
        tell t to reload
        return "refreshed"
      end if
    end repeat
  end repeat
  return "none"
end tell`.trim();

  try {
    const result = await $`osascript -e ${refreshScript}`.quiet();
    if (result.text().trim() === 'refreshed') {
      process.stdout.write('  Refreshed existing tab\n');
      return;
    }
  } catch {
    // Brave not running or AppleScript failed — fall through to open
  }

  // No existing tab found — open the URL in Brave
  await $`open -a "Brave Browser" ${url}`.quiet();
  process.stdout.write('  Opened new tab\n');
}

if (!skipBrowser) {
  setTimeout(async () => {
    try {
      process.stdout.write('\n🌐 Waiting for Quest hub...\n');
      const ready = await waitForServer(QUEST_URL, 60000);
      if (ready) {
        await openOrRefreshBrave(QUEST_URL);
      } else {
        process.stderr.write('  Quest hub did not respond on :3010\n');
      }
    } catch (err) {
      process.stderr.write(`⚠ Browser launch failed: ${err}\n`);
    }
  }, 5000);
}

// ── Lifecycle ───────────────────────────────────────────────────

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
