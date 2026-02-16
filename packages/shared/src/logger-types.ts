/**
 * Logger Interface — shared contract for all logger implementations.
 *
 * Matches pino's calling convention:
 *   log.info('message')
 *   log.info({ key: 'value' }, 'message')
 *   log.error(err, 'message')
 */

export interface Logger {
  trace(msg: string): void;
  trace(obj: Record<string, unknown> | Error, msg?: string): void;
  debug(msg: string): void;
  debug(obj: Record<string, unknown> | Error, msg?: string): void;
  info(msg: string): void;
  info(obj: Record<string, unknown> | Error, msg?: string): void;
  warn(msg: string): void;
  warn(obj: Record<string, unknown> | Error, msg?: string): void;
  error(msg: string): void;
  error(obj: Record<string, unknown> | Error, msg?: string): void;
  fatal(msg: string): void;
  fatal(obj: Record<string, unknown> | Error, msg?: string): void;
  child(bindings: Record<string, string>): Logger;
}
