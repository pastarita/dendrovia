#!/usr/bin/env bun

/**
 * PIPELINE FACTORY
 *
 * Launches all six pillars in parallel with a beautiful TUI.
 * This is the "6-terminal orchestration" from the architecture plan.
 */

import { spawn } from 'bun';

const PILLARS = [
  {
    name: 'CHRONOS',
    emoji: '📜',
    color: '\x1b[36m', // Cyan
    cwd: 'packages/chronos',
    cmd: ['bun', 'run', 'dev'],
  },
  {
    name: 'IMAGINARIUM',
    emoji: '🎨',
    color: '\x1b[35m', // Magenta
    cwd: 'packages/imaginarium',
    cmd: ['bun', 'run', 'dev'],
  },
  {
    name: 'ARCHITECTUS',
    emoji: '🏛️',
    color: '\x1b[34m', // Blue
    cwd: 'packages/architectus',
    cmd: ['bun', 'run', 'dev'],
  },
  {
    name: 'LUDUS',
    emoji: '🎮',
    color: '\x1b[32m', // Green
    cwd: 'packages/ludus',
    cmd: ['bun', 'run', 'dev'],
  },
  {
    name: 'OCULUS',
    emoji: '👁️',
    color: '\x1b[33m', // Yellow
    cwd: 'packages/oculus',
    cmd: ['bun', 'run', 'dev'],
  },
  {
    name: 'OPERATUS',
    emoji: '💾',
    color: '\x1b[31m', // Red
    cwd: 'packages/operatus',
    cmd: ['bun', 'run', 'dev'],
  },
] as const;

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

console.clear();
console.log(`${BOLD}🌳 DENDROVIA PIPELINE FACTORY${RESET}\n`);
console.log(`${DIM}Launching all six pillars in parallel...${RESET}\n`);

// Launch each pillar
const processes = PILLARS.map((pillar) => {
  console.log(`${pillar.color}${pillar.emoji} ${pillar.name}${RESET} ${DIM}→ ${pillar.cwd}${RESET}`);

  const proc = spawn(pillar.cmd, {
    cwd: pillar.cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  // Stream stdout with colored prefix
  const reader = proc.stdout.getReader();
  (async () => {
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      process.stdout.write(`${pillar.color}[${pillar.name}]${RESET} ${text}`);
    }
  })();

  // Stream stderr with colored prefix
  const errorReader = proc.stderr.getReader();
  (async () => {
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await errorReader.read();
      if (done) break;
      const text = decoder.decode(value);
      process.stderr.write(`${pillar.color}[${pillar.name}]${RESET} ${BOLD}ERROR:${RESET} ${text}`);
    }
  })();

  return proc;
});

console.log(`\n${BOLD}All pillars launched!${RESET}`);
console.log(`${DIM}Press Ctrl+C to stop all processes${RESET}\n`);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(`\n${BOLD}Shutting down all pillars...${RESET}`);

  for (const proc of processes) {
    proc.kill();
  }

  console.log(`${DIM}All processes terminated.${RESET}`);
  process.exit(0);
});

// Wait for all processes (they'll run indefinitely)
await Promise.all(processes.map((p) => p.exited));
