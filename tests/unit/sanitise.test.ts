import { describe, it, expect } from 'vitest';
import { sanitise, sanitiseString, sanitiseToJson } from '@/lib/sanitise';

describe('sanitiseString', () => {
  it('masks email local part', () => {
    expect(sanitiseString('contact john@truvis.ae about it')).toBe(
      'contact [REDACTED_EMAIL]@truvis.ae about it',
    );
  });

  it('masks long digit runs', () => {
    expect(sanitiseString('IBAN AE12 0234 5678 9012 3456 78')).toMatch(/\[REDACTED_NUMBER\]/);
  });

  it('passes through clean strings', () => {
    expect(sanitiseString('case 123abc opened by analyst')).toBe('case 123abc opened by analyst');
  });
});

describe('sanitise (object)', () => {
  it('redacts denylisted keys', () => {
    const out = sanitise({
      tenant_id: 't1',
      full_name: 'Jane Doe',
      date_of_birth: '1990-01-01',
      occupation: 'Engineer',
    });
    expect(out).toEqual({
      tenant_id: 't1',
      full_name: '[REDACTED]',
      date_of_birth: '[REDACTED]',
      occupation: 'Engineer',
    });
  });

  it('recurses into nested objects', () => {
    const out = sanitise({ customer: { email: 'x@y.com', tenant_id: 't1' } });
    expect(out).toEqual({ customer: { email: '[REDACTED]', tenant_id: 't1' } });
  });

  it('walks arrays and respects element shape', () => {
    const out = sanitise([{ phone: '+1234' }, { case_id: 'c1' }]);
    expect(out).toEqual([{ phone: '[REDACTED]' }, { case_id: 'c1' }]);
  });

  it('preserves Error name + message but pattern-masks PII inside', () => {
    const e = new TypeError('account 1234 5678 9012 3456 belongs to a@b.com');
    const out = sanitise(e) as { name: string; message: string };
    expect(out.name).toBe('TypeError');
    expect(out.message).toContain('[REDACTED_NUMBER]');
    expect(out.message).toContain('[REDACTED_EMAIL]@b.com');
    expect(out.message).not.toContain('1234 5678');
    expect(out.message).not.toContain('a@b.com');
  });

  it('handles primitive scalars unchanged', () => {
    expect(sanitise(42)).toBe(42);
    expect(sanitise(true)).toBe(true);
    expect(sanitise(null)).toBe(null);
    expect(sanitise(undefined)).toBe(undefined);
  });

  it('caps deep recursion', () => {
    type Nested = { next: Nested } | { full_name: string };
    const root = {} as Record<string, unknown>;
    let cur = root;
    for (let i = 0; i < 20; i++) {
      const next: Record<string, unknown> = {};
      cur.next = next;
      cur = next;
    }
    cur.full_name = 'should redact';
    const out = sanitise(root) as Nested;
    expect(JSON.stringify(out)).toContain('[REDACTED]');
  });

  it('case-insensitive key matching', () => {
    expect(sanitise({ Email: 'a@b.com', PHONE: '+123', Authorization: 'Bearer x' })).toEqual({
      Email: '[REDACTED]',
      PHONE: '[REDACTED]',
      Authorization: '[REDACTED]',
    });
  });
});

describe('sanitiseToJson', () => {
  it('returns a JSON string with redactions applied', () => {
    const json = sanitiseToJson({ tenant_id: 't1', full_name: 'X', email: 'x@y.com' });
    const parsed = JSON.parse(json);
    expect(parsed.tenant_id).toBe('t1');
    expect(parsed.full_name).toBe('[REDACTED]');
    expect(parsed.email).toBe('[REDACTED]');
  });

  it('handles unserialisable values without throwing', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const out = sanitiseToJson(cyclic);
    // Either traversal hits MAX_DEPTH → '[REDACTED]' string in JSON, or
    // JSON.stringify throws and we return the fallback. Both are acceptable.
    expect(typeof out).toBe('string');
  });
});
