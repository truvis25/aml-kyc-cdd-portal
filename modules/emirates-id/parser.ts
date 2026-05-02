/**
 * Emirates ID parser, normalizer, and validator.
 *
 * Emirates ID format (UAE FAIC, Federal Authority for Identity, Citizenship,
 * Customs & Port Security):
 *
 *   784-YYYY-NNNNNNN-N    (15 digits total, with three '-' separators)
 *
 *   - 784         UAE country code (always)
 *   - YYYY        birth year (4 digits)
 *   - NNNNNNN     7-digit sequential number assigned by FAIC
 *   - N           1-digit Luhn check digit over the preceding 14 digits
 *
 * The check digit uses the standard Luhn (mod-10) algorithm — the same as
 * credit cards. This is the documented behaviour of the EID system.
 *
 * Public surface:
 *   normaliseEmiratesId(input)  → canonical 18-char string with dashes,
 *                                  or null if the input cannot be cleaned to
 *                                  exactly 15 digits starting with 784
 *   isEmiratesIdFormat(input)   → boolean (cheap; format-only)
 *   isEmiratesIdChecksumValid   → boolean (assumes format already valid)
 *   parseEmiratesId(input)      → { normalised, formatted, formatValid,
 *                                   checksumValid, birthYear } or
 *                                   null on uncleanable input
 *
 * Be lenient on input: accept "784-1990-1234567-8", "784199012345678",
 * "784 1990 1234567 8", and similar.
 */

const EID_DIGIT_RE = /^\d{15}$/;
const EID_CANONICAL_RE = /^784-\d{4}-\d{7}-\d$/;

export interface EmiratesIdParseResult {
  /** 15 digits, no separators. e.g. "784199012345678". */
  normalised: string;
  /** Canonical "784-YYYY-NNNNNNN-N". Suitable for storage + display. */
  formatted: string;
  /** True when the cleaned input is 15 digits starting with 784. */
  formatValid: boolean;
  /** True when the Luhn check digit matches. Always false if formatValid is false. */
  checksumValid: boolean;
  /** Birth year extracted from positions 3-7 of the normalised string. */
  birthYear: number;
}

/**
 * Strip separators / whitespace and normalise to the canonical 18-char form
 * with dashes. Returns null if the cleaned input is not exactly 15 digits
 * starting with 784.
 */
export function normaliseEmiratesId(input: string | null | undefined): string | null {
  if (typeof input !== 'string') return null;
  const digits = input.replace(/[\s-]/g, '');
  if (!EID_DIGIT_RE.test(digits)) return null;
  if (!digits.startsWith('784')) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 14)}-${digits.slice(14, 15)}`;
}

/** Cheap check: is this a syntactically valid EID? Doesn't validate the checksum. */
export function isEmiratesIdFormat(input: string | null | undefined): boolean {
  return normaliseEmiratesId(input) !== null;
}

/**
 * Luhn (mod-10) checksum over the 15 digits. Returns false if the input
 * isn't already syntactically valid.
 */
export function isEmiratesIdChecksumValid(input: string | null | undefined): boolean {
  const normalised = normaliseEmiratesId(input);
  if (normalised === null) return false;
  const digits = normalised.replace(/-/g, '');
  return luhnCheck(digits);
}

/**
 * Full parse. Returns null if the input cannot be cleaned to a 15-digit
 * 784-prefixed string. Otherwise returns the breakdown — caller should
 * check both formatValid and checksumValid before trusting the data.
 */
export function parseEmiratesId(input: string | null | undefined): EmiratesIdParseResult | null {
  const normalised = normaliseEmiratesId(input);
  if (normalised === null) return null;
  const digits = normalised.replace(/-/g, '');
  return {
    normalised: digits,
    formatted: normalised,
    formatValid: EID_CANONICAL_RE.test(normalised),
    checksumValid: luhnCheck(digits),
    birthYear: parseInt(digits.slice(3, 7), 10),
  };
}

/**
 * Standard Luhn algorithm. Walks digits right-to-left; doubles every second
 * digit (starting from the second-from-right); subtracts 9 from any doubled
 * value > 9; sums; checks `total % 10 === 0`.
 */
function luhnCheck(digits: string): boolean {
  let sum = 0;
  let doubleNext = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48; // '0' = 48
    if (d < 0 || d > 9) return false;
    if (doubleNext) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    doubleNext = !doubleNext;
  }
  return sum % 10 === 0;
}
