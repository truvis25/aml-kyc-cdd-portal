import { describe, expect, it } from 'vitest';
import {
  countryNameToIso2,
  normaliseDob,
  normalisePhone,
  userInfoToPrefill,
} from '@/modules/auth/uae-pass/claims';
import type { UaePassUserInfo } from '@/modules/auth/uae-pass/types';

describe('normaliseDob', () => {
  it('passes ISO YYYY-MM-DD through unchanged', () => {
    expect(normaliseDob('1990-12-31')).toBe('1990-12-31');
  });

  it('rewrites DD/MM/YYYY into YYYY-MM-DD', () => {
    expect(normaliseDob('31/12/1990')).toBe('1990-12-31');
  });

  it('rewrites DD-MM-YYYY into YYYY-MM-DD', () => {
    expect(normaliseDob('31-12-1990')).toBe('1990-12-31');
  });

  it('returns null for empty / null / unparseable input', () => {
    expect(normaliseDob(null)).toBeNull();
    expect(normaliseDob('')).toBeNull();
    expect(normaliseDob('not a date')).toBeNull();
    expect(normaliseDob('1990')).toBeNull();
  });
});

describe('countryNameToIso2', () => {
  it('maps United Arab Emirates to AE', () => {
    expect(countryNameToIso2('United Arab Emirates')).toBe('AE');
  });

  it('is case-insensitive', () => {
    expect(countryNameToIso2('UNITED ARAB EMIRATES')).toBe('AE');
    expect(countryNameToIso2('uae')).toBe('AE');
  });

  it('passes a 2-letter ISO code through (uppercased)', () => {
    expect(countryNameToIso2('ae')).toBe('AE');
    expect(countryNameToIso2('IN')).toBe('IN');
  });

  it('returns null for unknown countries', () => {
    expect(countryNameToIso2('Wakanda')).toBeNull();
    expect(countryNameToIso2(null)).toBeNull();
    expect(countryNameToIso2('')).toBeNull();
  });
});

describe('normalisePhone', () => {
  it('keeps an E.164 number unchanged', () => {
    expect(normalisePhone('+971501234567')).toBe('+971501234567');
  });

  it('prepends + to a 971-prefixed number', () => {
    expect(normalisePhone('971501234567')).toBe('+971501234567');
  });

  it('expands a local 0XXXXXXXXX to +971XXXXXXXXX', () => {
    expect(normalisePhone('0501234567')).toBe('+971501234567');
  });

  it('returns null for empty input', () => {
    expect(normalisePhone(null)).toBeNull();
    expect(normalisePhone('')).toBeNull();
  });

  it('strips inner whitespace from a leading-+ value', () => {
    expect(normalisePhone('+971 50 123 4567')).toBe('+971501234567');
  });
});

describe('userInfoToPrefill', () => {
  const sopUser: UaePassUserInfo = {
    sub: 'da8de12a-12e2-432f-9e2c-a1f0b1a2d3c4',
    fullnameEN: 'Ahmed bin Mohammed',
    firstnameEN: 'Ahmed',
    lastnameEN: 'bin Mohammed',
    nationalityEN: 'United Arab Emirates',
    idn: '784199012345676',
    userType: 'SOP3',
    mobile: '971501234567',
    email: 'ahmed@example.com',
    dob: '01/01/1990',
  };

  it('extracts the full identity from a typical SOP3 payload', () => {
    expect(userInfoToPrefill(sopUser)).toEqual({
      full_name: 'Ahmed bin Mohammed',
      date_of_birth: '1990-01-01',
      nationality: 'AE',
      emirates_id_number: '784-1990-1234567-6',
      email: 'ahmed@example.com',
      phone: '+971501234567',
    });
  });

  it('falls back to firstnameEN+lastnameEN when fullnameEN is absent', () => {
    const out = userInfoToPrefill({ ...sopUser, fullnameEN: undefined });
    expect(out.full_name).toBe('Ahmed bin Mohammed');
  });

  it('returns null full_name when no English name fields are present', () => {
    const out = userInfoToPrefill({
      sub: 'x',
      userType: 'SOP3',
      fullnameAR: 'أحمد',
    } as UaePassUserInfo);
    expect(out.full_name).toBeNull();
  });

  it('returns null emirates_id_number when idn is malformed', () => {
    const out = userInfoToPrefill({ ...sopUser, idn: '12345' });
    expect(out.emirates_id_number).toBeNull();
  });

  it('returns null nationality for an unknown country name', () => {
    const out = userInfoToPrefill({ ...sopUser, nationalityEN: 'Wakanda' });
    expect(out.nationality).toBeNull();
  });
});
