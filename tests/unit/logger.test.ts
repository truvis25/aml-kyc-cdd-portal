import { afterEach, describe, expect, it, vi } from 'vitest';
import { log } from '@/lib/logger';

const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

afterEach(() => {
  consoleLogSpy.mockClear();
  consoleWarnSpy.mockClear();
  consoleErrorSpy.mockClear();
});

describe('log.info', () => {
  it('emits to console.log with sanitised context', () => {
    log.info('case opened', { case_id: 'c1', full_name: 'Jane Doe' });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const flat = JSON.stringify(consoleLogSpy.mock.calls[0]);
    expect(flat).toContain('case opened');
    expect(flat).toContain('c1');
    expect(flat).not.toContain('Jane');
    expect(flat).toContain('[REDACTED]');
  });
});

describe('log.error', () => {
  it('keeps Error class + message but masks PII patterns inside the message', () => {
    log.error('boom', new TypeError('user a@b.com hit issue'), { case_id: 'c1' });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const flat = JSON.stringify(consoleErrorSpy.mock.calls[0]);
    expect(flat).toContain('boom');
    expect(flat).toContain('TypeError');
    expect(flat).toContain('[REDACTED_EMAIL]@b.com');
    expect(flat).not.toContain('a@b.com');
  });

  it('handles undefined err and undefined context', () => {
    log.error('boom');
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});

describe('log.warn', () => {
  it('emits to console.warn', () => {
    log.warn('slow query', { duration_ms: 1234 });
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });
});
