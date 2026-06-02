/**
 * Production-safe logger utility.
 *
 * In development  → logs pass through to the browser console as normal.
 * In production   → all output is completely suppressed, so no internal
 *                   details, user data, or API responses leak to the
 *                   browser dev-tools.
 *
 * Usage:
 *   import logger from '@/lib/logger';
 *   logger.log('thing happened', payload);
 *   logger.warn('something unexpected');
 *   logger.error('critical failure', err);   // errors still thrown by caller
 */

const isDev = import.meta.env.DEV;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogArgs = any[];

const noop = (): void => undefined;

const logger = {
  log: isDev ? (...args: LogArgs): void => console.log(...args) : noop,
  info: isDev ? (...args: LogArgs): void => console.info(...args) : noop,
  warn: isDev ? (...args: LogArgs): void => console.warn(...args) : noop,
  error: isDev ? (...args: LogArgs): void => console.error(...args) : noop,
  debug: isDev ? (...args: LogArgs): void => console.debug(...args) : noop,
};

export default logger;
