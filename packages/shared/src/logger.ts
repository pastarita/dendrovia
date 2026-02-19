/**
 * Structured Logger — pino-based centralized logging for all pillars (Node.js).
 *
 * - LOG_LEVEL env var controls verbosity (trace/debug/info/warn/error/fatal/silent)
 * - pino-pretty auto-detected via TTY check — JSON in CI, human-readable in terminal
 * - Child loggers carry `pillar` and optional `component` fields in every log line
 *
 * Browser bundles receive logger-browser.ts instead via conditional exports.
 */

import pino from 'pino';
import type { Logger } from './logger-types';

export type { Logger } from './logger-types';

const LOG_LEVEL = process.env.LOG_LEVEL
  ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const transport = process.stdout?.isTTY
  ? { target: 'pino-pretty', options: { colorize: true } }
  : undefined;

const root = pino({ level: LOG_LEVEL, transport });

export function createLogger(pillar: string, component?: string): Logger {
  const bindings: Record<string, string> = { pillar };
  if (component) bindings.component = component;
  return root.child(bindings) as unknown as Logger;
}

// Pre-built pillar loggers for convenience
export const chronosLog = createLogger('CHRONOS');
export const imaginariumLog = createLogger('IMAGINARIUM');
export const architectusLog = createLogger('ARCHITECTUS');
export const ludusLog = createLogger('LUDUS');
export const oculusLog = createLogger('OCULUS');
export const operatusLog = createLogger('OPERATUS');
