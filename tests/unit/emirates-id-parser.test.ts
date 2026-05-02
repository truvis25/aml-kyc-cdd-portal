import { describe, expect, it } from 'vitest';
import {
  isEmiratesIdChecksumValid,
  isEmiratesIdFormat,
  normaliseEmiratesId,
  parseEmiratesId,
} from '@/modules/emirates-id/parser';

/**
 * Two Emirates IDs whose Luhn check digit was computed by hand and
 * verified against the formula. If you change one of these you'll need
 * to re-derive the check digit by walking the algorithm.
 */
const VALID_EID_1 = '784-1990-1234567-6';
const VALID_EID_2 = '784-1985-9876543-0';

describe('normaliseEmiratesId', () => {
  it('returns canonical dashed form for already-dashed input', () => {
    expect(normaliseEmiratesId(VALID_EID_1)).toBe(VALID_EID_1);
  });

  it('inserts dashes for digit-only input', () => {
    expect(normaliseEmiratesId('784199012345676')).toBe(VALID_EID_1);
  });

  it('strips arbitrary whitespace and re-inserts dashes', () => {
    expect(normaliseEmiratesId(' 784  1990 1234567 6 ')).toBe(VALID_EID_1);
  });

  it('returns null for inputs that are not 15 digits', () => {
    expect(normaliseEmiratesId('784-1990-123456')).toBeNull();
    expect(normaliseEmiratesId('7841990123456789')).toBeNull();
  });

  it('returns null when the country prefix is not 784', () => {
    expect(normaliseEmiratesId('123-1990-1234567-6')).toBeNull();
  });

  it('returns null for empty / non-string input', () => {
    expect(normaliseEmiratesId('')).toBeNull();
    expect(normaliseEmiratesId(null)).toBeNull();
    expect(normaliseEmiratesId(undefined)).toBeNull();
  });

  it('returns null when input contains letters', () => {
    expect(normaliseEmiratesId('784-19A0-1234567-6')).toBeNull();
  });
});

describe('isEmiratesIdFormat', () => {
  it('accepts both VALID_EID samples', () => {
    expect(isEmiratesIdFormat(VALID_EID_1)).toBe(true);
    expect(isEmiratesIdFormat(VALID_EID_2)).toBe(true);
  });

  it('accepts an EID with a wrong checksum (format-only)', () => {
    // Same prefix as VALID_EID_1 but the last digit is bumped — still formatted
    // correctly even though the Luhn fails.
    expect(isEmiratesIdFormat('784-1990-1234567-9')).toBe(true);
  });

  it('rejects malformed input', () => {
    expect(isEmiratesIdFormat('784-1990-12345')).toBe(false);
    expect(isEmiratesIdFormat('foo')).toBe(false);
    expect(isEmiratesIdFormat(null)).toBe(false);
  });
});

describe('isEmiratesIdChecksumValid', () => {
  it('accepts the two known-valid samples', () => {
    expect(isEmiratesIdChecksumValid(VALID_EID_1)).toBe(true);
    expect(isEmiratesIdChecksumValid(VALID_EID_2)).toBe(true);
  });

  it('rejects checksum-bumped variants of the same EID', () => {
    expect(isEmiratesIdChecksumValid('784-1990-1234567-9')).toBe(false);
    expect(isEmiratesIdChecksumValid('784-1990-1234567-0')).toBe(false);
    expect(isEmiratesIdChecksumValid('784-1985-9876543-1')).toBe(false);
  });

  it('rejects malformed inputs without crashing', () => {
    expect(isEmiratesIdChecksumValid(null)).toBe(false);
    expect(isEmiratesIdChecksumValid('')).toBe(false);
    expect(isEmiratesIdChecksumValid('not a number')).toBe(false);
  });
});

describe('parseEmiratesId', () => {
  it('returns the full breakdown for a valid EID', () => {
    expect(parseEmiratesId(VALID_EID_1)).toEqual({
      normalised: '784199012345676',
      formatted: '784-1990-1234567-6',
      formatValid: true,
      checksumValid: true,
      birthYear: 1990,
    });
  });

  it('returns formatValid=true / checksumValid=false for a wrong-check-digit EID', () => {
    const out = parseEmiratesId('784-1990-1234567-9');
    expect(out).not.toBeNull();
    expect(out?.formatValid).toBe(true);
    expect(out?.checksumValid).toBe(false);
    expect(out?.birthYear).toBe(1990);
  });

  it('extracts the birth year from positions 4-7', () => {
    expect(parseEmiratesId(VALID_EID_2)?.birthYear).toBe(1985);
  });

  it('returns null on uncleanable input', () => {
    expect(parseEmiratesId('total garbage')).toBeNull();
    expect(parseEmiratesId('')).toBeNull();
    expect(parseEmiratesId(null)).toBeNull();
  });
});
