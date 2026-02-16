/**
 * Structured Logger — pino-based centralized logging for all pillars.
 *
 * - LOG_LEVEL env var controls verbosity (trace/debug/info/warn/error/fatal/silent)
 * - pino-pretty auto-detected via TTY check — JSON in CI, human-readable in terminal
 * - Child loggers carry `pillar` and optional `component` fields in every log line
 */

import pino from 'pino';

const LOG_LEVEL = process.env.LOG_LEVEL
  ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const transport = process.stdout?.isTTY
  ? { target: 'pino-pretty', options: { colorize: true } }
  : undefined;

const root = pino({ level: LOG_LEVEL, transport });

export function createLogger(pillar: string, component?: string): pino.Logger {
  const bindings: Record<string, string> = { pillar };
  if (component) bindings.component = component;
  return root.child(bindings);
}

// Pre-built pillar loggers for convenience
export const chronosLog = createLogger('CHRONOS');
export const imaginariumLog = createLogger('IMAGINARIUM');
export const operatusLog = createLogger('OPERATUS');
