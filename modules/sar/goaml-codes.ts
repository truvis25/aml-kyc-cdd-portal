/**
 * goAML 4.x reference codes and lexical-format rules.
 *
 * Source: UNODC goAML Public XSD v4.x (https://goaml.unodc.org/) plus UAE FIU
 * goAML profile (https://www.uaefiu.gov.ae/en/goaml). This file is the single
 * place to update when the regulator publishes new codes — `goaml-validator.ts`
 * and `goaml-builder.ts` both consume from here.
 *
 * Citations are inline so a future MLRO / auditor can verify each rule against
 * the published schema without re-grepping the codebase.
 */

/**
 * `report_code` values accepted by UAE FIU. The XSD defines a longer list but
 * the UAE-specific profile narrows it. Submissions with codes outside this set
 * are rejected at the FIU gateway. See goAML XSD section ⟨ReportType⟩.
 */
export const GOAML_REPORT_CODES = [
  'STR',      // Suspicious Transaction Report (default)
  'CTR',      // Cash Threshold Report
  'TFS-STR',  // Targeted Financial Sanctions — STR variant
  'EFT',      // Electronic Funds Transfer report
  'AIF',      // Additional Information File (follow-up to a previous STR)
] as const;
export type GoamlReportCode = (typeof GOAML_REPORT_CODES)[number];

/**
 * `submission_code` per goAML XSD: 'E' = Electronic, 'P' = Paper. We always
 * submit electronically; the value is fixed in the builder for v1.
 */
export const GOAML_SUBMISSION_CODES = ['E', 'P'] as const;

/**
 * Reason codes (the SAR-side equivalent of report_code). Each maps to a
 * report_code in `mapReasonToReportCode`. UAE FIU may publish more in the
 * goAML XSD — extend here when they do.
 */
export const GOAML_REASON_CODES = ['UNK', 'STR', 'CTR', 'TFS', 'EFT', 'CASH'] as const;
export type GoamlReasonCode = (typeof GOAML_REASON_CODES)[number];

/**
 * `transmode_code` per goAML XSD ⟨tFromMyFundsCode⟩. The XSD enumerates ~20
 * values; we surface the ones our SAR UI captures and let the validator
 * reject anything outside this set.
 */
export const GOAML_TRANSMODE_CODES = ['CASH', 'WIRE', 'CHEQUE', 'CARD', 'CRYPTO', 'OTHER'] as const;
export type GoamlTransmodeCode = (typeof GOAML_TRANSMODE_CODES)[number];

/**
 * `identification.type` values. goAML XSD ⟨tIdentifierType⟩ uses a numeric
 * code list; UAE FIU's profile accepts either the numeric code or the named
 * string. We emit the named form.
 */
export const GOAML_ID_TYPES = [
  'PASSPORT',
  'NATIONAL_ID',
  'EMIRATES_ID',
  'DRIVING_LICENCE',
  'RESIDENCE_PERMIT',
  'OTHER',
] as const;
export type GoamlIdType = (typeof GOAML_ID_TYPES)[number];

/**
 * `currency_code_local` is fixed to AED for UAE-licensed reporting entities;
 * the validator rejects any other code.
 */
export const GOAML_LOCAL_CURRENCY = 'AED';

/**
 * Country codes used in the report envelope must be ISO 3166-1 alpha-2.
 * Validated lexically (`/^[A-Z]{2}$/`) — we don't ship the full ISO table
 * because a typo'd country (e.g. "UA" vs "AE") is caught downstream by the
 * FIU; the goal here is to refuse non-ISO shapes.
 */
export const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;

/**
 * Lexical-format rules straight from the goAML XSD's xs:dateTime / xs:date
 * facets. We're permissive on offsets (Z and +/-HH:MM both accepted).
 */
export const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:?\d{2})$/;
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Decimal field facets per goAML XSD: xs:decimal with totalDigits=18,
 * fractionDigits=2, minInclusive=0. Our DB column already enforces this;
 * the validator double-checks before XML emission.
 */
export const GOAML_AMOUNT_MAX = 9_999_999_999_999_999.99;

/**
 * UAE FIU requires the STR narrative to be ≥ 50 chars before submission so
 * boilerplate one-liners can't slip through. Drafts can carry shorter text.
 * (Source: UAE FIU goAML Reporting User Guide v3.2 §4.4.)
 */
export const NARRATIVE_MIN_LENGTH_FOR_SUBMIT = 50;
export const NARRATIVE_MIN_LENGTH_FOR_DRAFT = 20;

// ──────────────────────────────────────────────────────────────────────
// Reason → report_code and instrument → transmode_code mappings.
// These are shared by the builder, the validator, and the test suite —
// keeping them in one place prevents the mappings from drifting apart.
// ──────────────────────────────────────────────────────────────────────

/**
 * UAE FIU prioritises CTR over TFS over the default STR when multiple
 * reason codes are present on a single report. (Source: UAE FIU goAML
 * Reporting User Guide §4.2 — "Selecting the report type".)
 */
export function mapReasonToReportCode(reasons: readonly string[]): GoamlReportCode {
  if (reasons.includes('CTR')) return 'CTR';
  if (reasons.includes('TFS')) return 'TFS-STR';
  return 'STR';
}

/**
 * Map the SAR UI's `instrument_type` enum onto the goAML <transmode_code>
 * enumeration. Anything we don't recognise becomes 'OTHER' so the FIU
 * accepts the report; the validator separately surfaces a warning when an
 * unknown instrument falls into 'OTHER' so analysts can refine.
 */
export function mapInstrumentToTransmodeCode(
  instrument: string | null | undefined,
): GoamlTransmodeCode {
  switch (instrument) {
    case 'cash':
      return 'CASH';
    case 'wire':
      return 'WIRE';
    case 'cheque':
      return 'CHEQUE';
    case 'card':
      return 'CARD';
    case 'crypto':
      return 'CRYPTO';
    default:
      return 'OTHER';
  }
}
