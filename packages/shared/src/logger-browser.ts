/**
 * Browser Logger — console-based implementation of the Logger interface.
 *
 * Same convention as the pino-based server logger:
 * - LOG_LEVEL controls verbosity (trace/debug/info/warn/error/fatal/silent)
 * - Child loggers carry `pillar` and optional `component` fields
 * - Supports both log.info('msg') and log.info({obj}, 'msg') signatures
 *
 * Used automatically in browser bundles via conditional exports.
 */

import type { Logger } from './logger-types';

export type { Logger } from './logger-types';

const LEVELS: Record<string, number> = {
  trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60, silent: 70,
};

function getLogLevel(): string {
  try {
    return (
      (typeof process !== 'undefined' && process.env?.LOG_LEVEL) ||
      (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' ? 'info' : 'debug')
    );
  } catch {
    return 'debug';
  }
}

function formatPrefix(bindings: Record<string, string>): string {
  const parts: string[] = [];
  if (bindings.pillar) parts.push(bindings.pillar);
  if (bindings.component) parts.push(bindings.component);
  return parts.length > 0 ? `[${parts.join('/')}]` : '';
}

function makeMethod(
  threshold: number,
  methodLevel: number,
  consoleFn: (...args: unknown[]) => void,
  prefix: string,
): (...args: unknown[]) => void {
  if (methodLevel < threshold) return () => {};
  return (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string') {
      consoleFn(prefix, first);
    } else if (first instanceof Error) {
      consoleFn(prefix, args[1] ?? first.message, first);
    } else if (typeof first === 'object' && first !== null) {
      consoleFn(prefix, args[1] ?? '', first);
    } else {
      consoleFn(prefix, ...args);
    }
  };
}

function createConsoleLogger(level: string, bindings: Record<string, string>): Logger {
  const threshold = LEVELS[level] ?? LEVELS.info;
  const prefix = formatPrefix(bindings);

  return {
    trace: makeMethod(threshold, LEVELS.trace, console.debug, prefix) as Logger['trace'],
    debug: makeMethod(threshold, LEVELS.debug, console.debug, prefix) as Logger['debug'],
    info: makeMethod(threshold, LEVELS.info, console.info, prefix) as Logger['info'],
    warn: makeMethod(threshold, LEVELS.warn, console.warn, prefix) as Logger['warn'],
    error: makeMethod(threshold, LEVELS.error, console.error, prefix) as Logger['error'],
    fatal: makeMethod(threshold, LEVELS.fatal, console.error, prefix) as Logger['fatal'],
    child(newBindings: Record<string, string>) {
      return createConsoleLogger(level, { ...bindings, ...newBindings });
    },
  };
}

const LOG_LEVEL = getLogLevel();

export function createLogger(pillar: string, component?: string): Logger {
  const bindings: Record<string, string> = { pillar };
  if (component) bindings.component = component;
  return createConsoleLogger(LOG_LEVEL, bindings);
}

// Pre-built pillar loggers for convenience
export const chronosLog = createLogger('CHRONOS');
export const imaginariumLog = createLogger('IMAGINARIUM');
export const operatusLog = createLogger('OPERATUS');
