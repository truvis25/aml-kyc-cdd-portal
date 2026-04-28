/**
 * PII sanitiser. Used by the safe logger (`lib/logger.ts`) and by anywhere
 * else that needs to emit potentially-sensitive data into a string sink (logs,
 * audit payload metadata, error responses).
 *
 * Conservative by default: any object whose keys match the denylist has
 * those values redacted; recurses into nested objects and arrays. Strings
 * matching well-known PII shapes (email, IBAN, long digit runs that look like
 * card numbers) are masked.
 *
 * NOT a substitute for proper authorization. Don't use this to "make a value
 * safe to return"; use it only at the log/observability boundary.
 */

const PII_KEY_DENYLIST: ReadonlySet<string> = new Set([
  'full_name',
  'first_name',
  'last_name',
  'middle_name',
  'name',
  'date_of_birth',
  'dob',
  'id_number',
  'national_id',
  'passport_number',
  'address',
  'address_line1',
  'address_line2',
  'address_line3',
  'city',
  'postal_code',
  'phone',
  'phone_number',
  'mobile',
  'email',
  'email_address',
  'iban',
  'account_number',
  'card_number',
  'pan',
  'cvv',
  'ssn',
  'tax_id',
  'ip_address',
  'authorization',
  'cookie',
  'set-cookie',
  'api_key',
  'secret',
  'access_token',
  'refresh_token',
  'service_role_key',
]);

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 6;
const MAX_ARRAY = 100;

// Email shape: `local@domain.tld`. Mask local part, keep domain visible for
// observability ("we got something from gmail.com" is useful; the address
// itself is not).
const EMAIL_RE = /[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})/gi;

// 13–19 digit run with spaces or dashes — looks like a card / IBAN / account.
const LONG_DIGIT_RE = /\b(?:\d[\s-]?){13,19}\b/g;

function maskEmail(s: string): string {
  return s.replace(EMAIL_RE, (_match, domain: string) => `[REDACTED_EMAIL]@${domain}`);
}

function maskLongDigits(s: string): string {
  return s.replace(LONG_DIGIT_RE, '[REDACTED_NUMBER]');
}

export function sanitiseString(s: string): string {
  return maskLongDigits(maskEmail(s));
}

function isPiiKey(key: string): boolean {
  return PII_KEY_DENYLIST.has(key.toLowerCase().replace(/-/g, '_'));
}

/**
 * Walks the value, returning a copy with PII-shaped fields redacted.
 * - Strings: pattern-masked via sanitiseString.
 * - Objects: keys matching the denylist have their values replaced with REDACTED.
 * - Arrays: each element is recursively sanitised; capped at MAX_ARRAY entries.
 * - Other primitives: returned unchanged.
 *
 * Bounded to MAX_DEPTH to defend against pathological cycles.
 */
export function sanitise(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return REDACTED;
  if (value == null) return value;

  if (typeof value === 'string') return sanitiseString(value);
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY).map((v) => sanitise(v, depth + 1));
  }

  if (value instanceof Error) {
    // Preserve the message for ops debugging but pattern-mask it so any
    // literal PII inside (email, IBAN, long digit run) is redacted.
    // Stack traces are dropped — they're long and rarely useful in our
    // structured logs.
    return { name: value.name, message: sanitiseString(value.message) };
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = isPiiKey(k) ? REDACTED : sanitise(v, depth + 1);
    }
    return out;
  }

  return REDACTED;
}

/** Convenience: sanitise + JSON.stringify for one-line log output. */
export function sanitiseToJson(value: unknown): string {
  try {
    return JSON.stringify(sanitise(value));
  } catch {
    return '"[UNSERIALISABLE]"';
  }
}
