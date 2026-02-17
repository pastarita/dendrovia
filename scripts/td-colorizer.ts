#!/usr/bin/env bun

/**
 * td-colorizer — Wraps turbo dev output with pillar-branded ANSI colors.
 *
 * Intercepts stdout/stderr from turbo dev and recolors the package prefix
 * to match each pillar's heraldic tincture.
 *
 * Usage: bun run scripts/td-colorizer.ts [turbo dev args...]
 */

import { spawn } from 'node:child_process';
import { launchBrave } from './workspace-launcher/brave-launcher';

// ── Pillar Color Registry ────────────────────────────────────────
// Maps package name fragments to 24-bit ANSI color codes

interface PillarColor {
  hex: string;
  r: number;
  g: number;
  b: number;
  emoji: string;
  tincture: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

const PILLAR_COLORS: Record<string, PillarColor> = {
  architectus: { hex: '#3B82F6', ...hexToRgb('#3B82F6'), emoji: '🏛️', tincture: 'Azure' },
  chronos: { hex: '#c77b3f', ...hexToRgb('#c77b3f'), emoji: '📜', tincture: 'Amber' },
  imaginarium: { hex: '#A855F7', ...hexToRgb('#A855F7'), emoji: '🎨', tincture: 'Purpure' },
  ludus: { hex: '#EF4444', ...hexToRgb('#EF4444'), emoji: '🎮', tincture: 'Gules' },
  oculus: { hex: '#22C55E', ...hexToRgb('#22C55E'), emoji: '👁️', tincture: 'Vert' },
  operatus: { hex: '#6B7280', ...hexToRgb('#6B7280'), emoji: '💾', tincture: 'Sable' },
};

// Supporting packages get dimmer/neutral colors
const SUPPORT_COLORS: Record<string, PillarColor> = {
  shared: { hex: '#FFD700', ...hexToRgb('#FFD700'), emoji: '🔗', tincture: 'Or' },
  engine: { hex: '#3B82F6', ...hexToRgb('#3B82F6'), emoji: '⚙️', tincture: 'Azure' },
  'proof-of-concept': { hex: '#CD853F', ...hexToRgb('#CD853F'), emoji: '🧪', tincture: 'Tenné' },
  ui: { hex: '#E5E7EB', ...hexToRgb('#E5E7EB'), emoji: '🎨', tincture: 'Argent' },
  quest: { hex: '#E5E7EB', ...hexToRgb('#E5E7EB'), emoji: '🌳', tincture: 'Argent' },
};

// ── ANSI Helpers ─────────────────────────────────────────────────

function fg24(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

function bold(): string {
  return '\x1b[1m';
}

function reset(): string {
  return '\x1b[0m';
}

// ── Line Coloring ────────────────────────────────────────────────

// Match turbo output prefixes like:
//   @dendrovia/playground-architectus:dev: ...
//   @dendrovia/chronos:dev: ...
//   dendrovia-quest:dev: ...
const PREFIX_REGEX = /^((?:@dendrovia\/(?:playground-)?|dendrovia-)(\w[\w-]*)):(\w+):(.*)/;

function colorizeLine(line: string): string {
  const match = line.match(PREFIX_REGEX);
  if (!match) return line;

  const [, fullPackage, pkgName, taskName, rest] = match;

  // Look up color: check pillar names first, then support packages
  const color = PILLAR_COLORS[pkgName] ?? SUPPORT_COLORS[pkgName];

  if (!color) return line;

  const coloredPrefix = `${bold()}${fg24(color.r, color.g, color.b)}${fullPackage}:${taskName}:${reset()}`;
  return `${coloredPrefix}${rest}`;
}

// ── Browser Launch ──────────────────────────────────────────────

const NO_BROWSER_FLAG = '--no-browser';

// ── Main ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const skipBrowser = args.includes(NO_BROWSER_FLAG);

// Remove our custom flag before passing to turbo
const turboArgs = ['dev', ...args.filter((a) => a !== NO_BROWSER_FLAG)];

const child = spawn('turbo', turboArgs, {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: {
    ...process.env,
    FORCE_COLOR: '1', // Ensure turbo outputs color (we'll re-color)
  },
});

function processStream(stream: NodeJS.ReadableStream, output: NodeJS.WritableStream) {
  let buffer = '';

  stream.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    // Keep the last incomplete line in the buffer
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      output.write(`${colorizeLine(line)}\n`);
    }
  });

  stream.on('end', () => {
    if (buffer) {
      output.write(`${colorizeLine(buffer)}\n`);
    }
  });
}

processStream(child.stdout!, process.stdout);
processStream(child.stderr!, process.stderr);

// ── Auto-launch Brave once servers are ready ────────────────────

if (!skipBrowser) {
  // Give turbo a moment to start spawning dev servers, then
  // wait for them to respond before opening tabs
  setTimeout(async () => {
    try {
      process.stdout.write('\n🌐 Opening Brave Browser...\n');
      await launchBrave({ waitForServers: true, waitTimeout: 20000 });
      process.stdout.write('✅ Browser ready\n\n');
    } catch (err) {
      process.stderr.write(`⚠ Browser launch failed: ${err}\n`);
    }
  }, 2000);
}

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

// Forward signals
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
