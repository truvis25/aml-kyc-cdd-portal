/**
 * Safe logger. Routes log lines through `sanitise()` so PII keys and
 * common PII patterns are redacted before they hit stdout / the platform's
 * log drain.
 *
 * Usage:
 *   import { log } from '@/lib/logger';
 *   log.info('case opened', { case_id, tenant_id });
 *   log.error('approval failed', err, { case_id });
 *
 * Always prefer this over raw `console.*` in app code; the CI scan
 * `npm run check:pii` flags new raw `console.*` callsites that pass
 * runtime values through.
 *
 * Server-only: avoid importing in client components.
 */

import { sanitise } from './sanitise';

type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const LEVEL_PREFIX: Record<Level, string> = {
  debug: '[debug]',
  info: '[info]',
  warn: '[warn]',
  error: '[error]',
};

function emit(level: Level, message: string, context?: LogContext, err?: unknown): void {
  const ts = new Date().toISOString();
  const safeContext = context ? sanitise(context) : undefined;
  const safeErr = err ? sanitise(err) : undefined;

  const prefix = `${ts} ${LEVEL_PREFIX[level]}`;
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (safeErr !== undefined && safeContext !== undefined) {
    sink(prefix, message, safeErr, safeContext);
  } else if (safeErr !== undefined) {
    sink(prefix, message, safeErr);
  } else if (safeContext !== undefined) {
    sink(prefix, message, safeContext);
  } else {
    sink(prefix, message);
  }
}

export const log = {
  debug(message: string, context?: LogContext): void {
    emit('debug', message, context);
  },
  info(message: string, context?: LogContext): void {
    emit('info', message, context);
  },
  warn(message: string, context?: LogContext): void {
    emit('warn', message, context);
  },
  /**
   * Error log. The `err` argument is sanitised — Error instances are reduced
   * to their class name, never the message or stack (CodeQL pattern).
   */
  error(message: string, err?: unknown, context?: LogContext): void {
    emit('error', message, context, err);
  },
};
