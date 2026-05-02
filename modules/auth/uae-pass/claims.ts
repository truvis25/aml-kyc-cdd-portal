/**
 * Translate a UAE Pass userinfo payload into a partial KYC identity record
 * the onboarding identity form can pre-fill from. Three things to be careful
 * about:
 *
 *   1. UAE Pass returns `nationalityEN` as a country name ("United Arab
 *      Emirates", "India") — we need ISO-2 for our schema. We keep the
 *      mapping deliberately small (countries customers are most likely to
 *      come from); anything unknown maps to null and the customer types it
 *      manually.
 *
 *   2. `dob` historically arrives as DD/MM/YYYY. Some accounts have it as
 *      YYYY-MM-DD already. Normalise to ISO YYYY-MM-DD.
 *
 *   3. `idn` is an Emirates ID, but with separators stripped or partially
 *      present. We delegate normalisation to the existing parser to keep
 *      one source of truth for the canonical 784-YYYY-NNNNNNN-N format.
 */

import { normaliseEmiratesId } from '@/modules/emirates-id/parser';
import type { UaePassUserInfo } from './types';

export interface PrefillIdentity {
  full_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  emirates_id_number: string | null;
  email: string | null;
  phone: string | null;
}

export function userInfoToPrefill(claims: UaePassUserInfo): PrefillIdentity {
  return {
    full_name: chooseFullName(claims),
    date_of_birth: normaliseDob(claims.dob ?? null),
    nationality: countryNameToIso2(claims.nationalityEN ?? null),
    emirates_id_number: claims.idn ? normaliseEmiratesId(claims.idn) : null,
    email: claims.email?.trim() || null,
    phone: normalisePhone(claims.mobile ?? null),
  };
}

function chooseFullName(claims: UaePassUserInfo): string | null {
  const direct = claims.fullnameEN?.trim();
  if (direct) return direct;
  const composed = [claims.firstnameEN, claims.lastnameEN]
    .filter((p): p is string => Boolean(p?.trim()))
    .map((p) => p.trim())
    .join(' ');
  return composed || null;
}

/**
 * Accept "DD/MM/YYYY", "YYYY-MM-DD", or "DD-MM-YYYY". Return ISO format or
 * null when the input cannot be confidently re-formatted.
 */
export function normaliseDob(input: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const dmy = trimmed.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (dmy) {
    const [, dd, mm, yyyy] = dmy;
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

/**
 * Best-effort ISO-2 lookup. UAE Pass returns common-language country names;
 * we keep this list short and predictable. Unknown countries return null —
 * the customer can fill it in manually.
 */
const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
  'united arab emirates': 'AE',
  'uae': 'AE',
  'saudi arabia': 'SA',
  'kingdom of saudi arabia': 'SA',
  'qatar': 'QA',
  'kuwait': 'KW',
  'bahrain': 'BH',
  'oman': 'OM',
  'india': 'IN',
  'pakistan': 'PK',
  'bangladesh': 'BD',
  'philippines': 'PH',
  'egypt': 'EG',
  'jordan': 'JO',
  'lebanon': 'LB',
  'sudan': 'SD',
  'syria': 'SY',
  'syrian arab republic': 'SY',
  'iraq': 'IQ',
  'yemen': 'YE',
  'iran': 'IR',
  'iran, islamic republic of': 'IR',
  'turkey': 'TR',
  'türkiye': 'TR',
  'united kingdom': 'GB',
  'great britain': 'GB',
  'united states': 'US',
  'united states of america': 'US',
  'usa': 'US',
  'canada': 'CA',
  'australia': 'AU',
  'china': 'CN',
  'sri lanka': 'LK',
  'nepal': 'NP',
  'south africa': 'ZA',
  'germany': 'DE',
  'france': 'FR',
  'italy': 'IT',
  'spain': 'ES',
};

export function countryNameToIso2(name: string | null): string | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (!key) return null;
  // Already ISO-2 like "AE"
  if (/^[a-z]{2}$/.test(key)) return key.toUpperCase();
  return COUNTRY_NAME_TO_ISO2[key] ?? null;
}

/**
 * UAE Pass returns mobile numbers in a few shapes: "971501234567",
 * "+971501234567", or sometimes a local "0501234567". Normalise to E.164
 * with a leading "+" when we can confidently identify the country code,
 * otherwise return the trimmed input untouched.
 */
export function normalisePhone(input: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('+')) return trimmed.replace(/\s+/g, '');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('971')) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+971${digits.slice(1)}`;
  return trimmed;
}
