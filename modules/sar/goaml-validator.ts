/**
 * goAML 4.x conformance validator.
 *
 * Two orthogonal entry points:
 *
 *   validateForGoaml({ report, institution, subject, mode })
 *      Validates the in-memory SAR record against the goAML XSD's structural
 *      rules BEFORE we render XML. This is what the export route uses to
 *      produce rich, field-level 422s without ever generating an invalid
 *      document.
 *
 *   validateGoamlXml(xml)
 *      Parses an already-built XML string and re-checks the same structural
 *      rules. Used in tests and as a defence-in-depth check inside the
 *      service after rendering.
 *
 * Both return the same shape: `{ ok, errors[], warnings[] }`. Errors block
 * export/submit; warnings are surfaced for MLRO review but do not block.
 *
 * The rules implemented here reflect the UAE FIU goAML 4.x profile (cited in
 * `goaml-codes.ts`). When the regulator updates the XSD, update the codes
 * file and add corresponding rules here — keep the citations close to the
 * code they enforce.
 */

import {
  COUNTRY_CODE_REGEX,
  GOAML_ID_TYPES,
  GOAML_LOCAL_CURRENCY,
  GOAML_REASON_CODES,
  GOAML_REPORT_CODES,
  GOAML_TRANSMODE_CODES,
  GOAML_AMOUNT_MAX,
  ISO_DATE_REGEX,
  ISO_DATETIME_REGEX,
  NARRATIVE_MIN_LENGTH_FOR_DRAFT,
  NARRATIVE_MIN_LENGTH_FOR_SUBMIT,
  mapInstrumentToTransmodeCode,
  mapReasonToReportCode,
} from './goaml-codes';
import type {
  ReportingInstitution,
  SarReport,
  SarSubject,
  SarTransaction,
} from './types';

export type ValidationMode = 'draft' | 'export' | 'submit';

export interface GoamlValidationError {
  /** Stable machine code — usable as an i18n key or for analytics. */
  code: string;
  /** Dotted path into the input record. */
  field: string;
  /** Human-readable explanation. */
  message: string;
}

export interface GoamlValidationResult {
  ok: boolean;
  errors: GoamlValidationError[];
  warnings: GoamlValidationError[];
}

interface ValidateInput {
  report: SarReport;
  institution: ReportingInstitution;
  subject: SarSubject;
  mode: ValidationMode;
}

// ──────────────────────────────────────────────────────────────────────
// Input-level validation
// ──────────────────────────────────────────────────────────────────────

export function validateForGoaml(input: ValidateInput): GoamlValidationResult {
  const errors: GoamlValidationError[] = [];
  const warnings: GoamlValidationError[] = [];

  validateInstitution(input.institution, input.mode, errors, warnings);
  validateReportEnvelope(input.report, input.mode, errors);
  validateSubject(input.subject, errors);
  validateTransactions(input.report, errors);

  return { ok: errors.length === 0, errors, warnings };
}

function validateInstitution(
  institution: ReportingInstitution,
  mode: ValidationMode,
  errors: GoamlValidationError[],
  warnings: GoamlValidationError[],
): void {
  if (!institution.name?.trim()) {
    errors.push({
      code: 'institution_name_required',
      field: 'institution.name',
      message: 'Reporting institution name is required.',
    });
  }

  // rentity_id is a UAE FIU-issued identifier. Drafts can be saved without
  // it but submission MUST carry one — the FIU gateway rejects on receipt
  // otherwise. (UAE FIU goAML Reporting User Guide §3.1.)
  if (!institution.reporting_entity_id?.trim()) {
    if (mode === 'submit' || mode === 'export') {
      errors.push({
        code: 'rentity_id_required',
        field: 'institution.reporting_entity_id',
        message:
          'Set GOAML_REPORTING_ENTITY_ID in the deployment env before exporting; the FIU rejects reports without it.',
      });
    } else {
      warnings.push({
        code: 'rentity_id_missing',
        field: 'institution.reporting_entity_id',
        message: 'Draft missing reporting entity ID. Required before submission.',
      });
    }
  }

  if (institution.contact_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(institution.contact_email)) {
    errors.push({
      code: 'contact_email_invalid',
      field: 'institution.contact_email',
      message: 'Reporting person email is not a valid address.',
    });
  }
}

function validateReportEnvelope(
  report: SarReport,
  mode: ValidationMode,
  errors: GoamlValidationError[],
): void {
  if (!report.reference_number?.trim()) {
    errors.push({
      code: 'reference_number_required',
      field: 'report.reference_number',
      message: 'Report reference number is required.',
    });
  }

  if (!Array.isArray(report.reason_codes) || report.reason_codes.length === 0) {
    errors.push({
      code: 'reason_codes_required',
      field: 'report.reason_codes',
      message: 'At least one goAML reason code is required.',
    });
  } else {
    for (const code of report.reason_codes) {
      if (!(GOAML_REASON_CODES as readonly string[]).includes(code)) {
        errors.push({
          code: 'reason_code_invalid',
          field: 'report.reason_codes',
          message: `Reason code "${code}" is not in the UAE FIU goAML profile.`,
        });
      }
    }
  }

  // The builder derives report_code from reasons; verify the result is in the
  // accepted set. This catches future mapping bugs early.
  const derived = mapReasonToReportCode(report.reason_codes ?? []);
  if (!(GOAML_REPORT_CODES as readonly string[]).includes(derived)) {
    errors.push({
      code: 'report_code_invalid',
      field: 'report.reason_codes',
      message: `Reason codes derive report_code="${derived}" which is not accepted by UAE FIU.`,
    });
  }

  const minLen = mode === 'submit' || mode === 'export'
    ? NARRATIVE_MIN_LENGTH_FOR_SUBMIT
    : NARRATIVE_MIN_LENGTH_FOR_DRAFT;
  if (typeof report.narrative !== 'string' || report.narrative.trim().length < minLen) {
    errors.push({
      code: 'narrative_too_short',
      field: 'report.narrative',
      message: `Narrative must be at least ${minLen} characters for a ${mode} report.`,
    });
  }
  if (typeof report.narrative === 'string' && report.narrative.length > 50000) {
    errors.push({
      code: 'narrative_too_long',
      field: 'report.narrative',
      message: 'Narrative exceeds the goAML 50,000-character limit.',
    });
  }

  if (report.activity_start && !ISO_DATETIME_REGEX.test(report.activity_start)) {
    errors.push({
      code: 'activity_start_invalid',
      field: 'report.activity_start',
      message: 'activity_start must be ISO 8601 dateTime (e.g. 2026-04-01T00:00:00.000Z).',
    });
  }
  if (report.activity_end && !ISO_DATETIME_REGEX.test(report.activity_end)) {
    errors.push({
      code: 'activity_end_invalid',
      field: 'report.activity_end',
      message: 'activity_end must be ISO 8601 dateTime.',
    });
  }
  if (
    report.activity_start &&
    report.activity_end &&
    Date.parse(report.activity_end) < Date.parse(report.activity_start)
  ) {
    errors.push({
      code: 'activity_window_inverted',
      field: 'report.activity_end',
      message: 'activity_end must be at or after activity_start.',
    });
  }
}

function validateSubject(subject: SarSubject, errors: GoamlValidationError[]): void {
  if (!subject.full_name?.trim()) {
    errors.push({
      code: 'subject_name_required',
      field: 'subject.full_name',
      message: 'Subject full name is required for goAML <person_my_client>.',
    });
  }

  if (subject.date_of_birth && !ISO_DATE_REGEX.test(subject.date_of_birth)) {
    errors.push({
      code: 'subject_dob_invalid',
      field: 'subject.date_of_birth',
      message: 'Subject date of birth must be ISO date (YYYY-MM-DD).',
    });
  }
  if (subject.date_of_birth && Date.parse(subject.date_of_birth) > Date.now()) {
    errors.push({
      code: 'subject_dob_future',
      field: 'subject.date_of_birth',
      message: 'Subject date of birth cannot be in the future.',
    });
  }

  if (subject.nationality && !COUNTRY_CODE_REGEX.test(subject.nationality)) {
    errors.push({
      code: 'subject_nationality_invalid',
      field: 'subject.nationality',
      message: 'Subject nationality must be ISO 3166-1 alpha-2 (e.g. AE, IN).',
    });
  }

  // goAML requires id_type when id_number is present and vice-versa.
  if (subject.id_number && !subject.id_type) {
    errors.push({
      code: 'subject_id_type_missing',
      field: 'subject.id_type',
      message: 'subject.id_type is required when id_number is set.',
    });
  }
  if (subject.id_type && !subject.id_number) {
    errors.push({
      code: 'subject_id_number_missing',
      field: 'subject.id_number',
      message: 'subject.id_number is required when id_type is set.',
    });
  }
  if (subject.id_type && !(GOAML_ID_TYPES as readonly string[]).includes(subject.id_type)) {
    errors.push({
      code: 'subject_id_type_invalid',
      field: 'subject.id_type',
      message: `subject.id_type "${subject.id_type}" is not in the goAML identifier list.`,
    });
  }
}

function validateTransactions(report: SarReport, errors: GoamlValidationError[]): void {
  for (let i = 0; i < report.transactions.length; i++) {
    const tx = report.transactions[i];
    const path = (suffix: string) => `report.transactions[${i}].${suffix}`;

    if (!tx.date || !ISO_DATETIME_REGEX.test(tx.date)) {
      errors.push({
        code: 'tx_date_invalid',
        field: path('date'),
        message: 'Transaction date must be ISO 8601 dateTime.',
      });
    } else if (Date.parse(tx.date) > Date.now() + 60_000) {
      // Allow 60s clock skew; a wallclock-future tx is almost certainly bogus.
      errors.push({
        code: 'tx_date_future',
        field: path('date'),
        message: 'Transaction date cannot be in the future.',
      });
    }

    if (typeof tx.amount_aed !== 'number' || Number.isNaN(tx.amount_aed)) {
      errors.push({
        code: 'tx_amount_invalid',
        field: path('amount_aed'),
        message: 'Transaction amount must be a finite number in AED.',
      });
    } else if (tx.amount_aed < 0) {
      errors.push({
        code: 'tx_amount_negative',
        field: path('amount_aed'),
        message: 'Transaction amount must be non-negative.',
      });
    } else if (tx.amount_aed > GOAML_AMOUNT_MAX) {
      errors.push({
        code: 'tx_amount_overflow',
        field: path('amount_aed'),
        message: 'Transaction amount exceeds goAML decimal field facets.',
      });
    }

    const code = mapInstrumentToTransmodeCode(tx.instrument_type);
    if (!(GOAML_TRANSMODE_CODES as readonly string[]).includes(code)) {
      errors.push({
        code: 'tx_transmode_invalid',
        field: path('instrument_type'),
        message: `Instrument type "${tx.instrument_type}" maps to an unknown transmode_code.`,
      });
    }
  }

  // Total must equal the sum of transactions to single decimal precision.
  // The DB trigger keeps these in sync but we double-check here in case the
  // caller hand-built a SarReport.
  const sum = report.transactions.reduce(
    (s: number, t: SarTransaction) => s + (Number(t.amount_aed) || 0),
    0,
  );
  if (Math.abs(sum - report.total_amount_aed) > 0.01) {
    errors.push({
      code: 'total_amount_mismatch',
      field: 'report.total_amount_aed',
      message: `total_amount_aed=${report.total_amount_aed} does not match sum of transactions=${sum.toFixed(2)}.`,
    });
  }
}

// ──────────────────────────────────────────────────────────────────────
// XML-level validation (parses the produced XML)
// ──────────────────────────────────────────────────────────────────────

/**
 * Required descendants of <report> per goAML 4.x XSD. Each string is a
 * single-element name (we only check for presence; cardinality is "≥1").
 */
const REPORT_REQUIRED_CHILDREN = [
  'rentity_id',
  'submission_code',
  'report_code',
  'entity_reference',
  'submission_date',
  'currency_code_local',
  'reporting_person',
  'reason',
  'action',
  'report_indicators',
] as const;

const TRANSACTION_REQUIRED_CHILDREN = [
  'transactionnumber',
  'transaction_location',
  'date_transaction',
  'transmode_code',
  'amount_local',
] as const;

/**
 * Parses the produced XML and re-checks the same goAML structural rules.
 * Defence-in-depth — if `validateForGoaml` ever drifts from the builder
 * output, this catches it.
 *
 * The implementation is intentionally conservative: we only handle the
 * exact dialect produced by `buildSarXml` (no CDATA, no comments, no
 * mixed content, no namespace prefixes besides the default). A real-world
 * regulator gateway will run a full XSD parse; this is a smoke test.
 */
export function validateGoamlXml(xml: string): GoamlValidationResult {
  const errors: GoamlValidationError[] = [];
  const warnings: GoamlValidationError[] = [];

  if (typeof xml !== 'string' || !xml.trim().startsWith('<?xml')) {
    errors.push({
      code: 'xml_missing_prolog',
      field: 'xml',
      message: 'XML must start with the standard <?xml ... ?> prolog.',
    });
  }
  if (!xml.includes('<report')) {
    errors.push({
      code: 'xml_missing_root',
      field: 'xml',
      message: 'XML must contain a <report> root element.',
    });
    return { ok: false, errors, warnings };
  }
  if (!xml.includes('xmlns="http://www.goaml.org/schemas/v4"')) {
    errors.push({
      code: 'xml_namespace_invalid',
      field: 'xml',
      message: 'XML <report> must declare xmlns="http://www.goaml.org/schemas/v4".',
    });
  }

  let tree: XmlNode;
  try {
    tree = parseXml(xml);
  } catch (err) {
    errors.push({
      code: 'xml_parse_failed',
      field: 'xml',
      message: err instanceof Error ? err.message : 'XML parsing failed.',
    });
    return { ok: false, errors, warnings };
  }

  const report = findChild(tree, 'report');
  if (!report) {
    errors.push({
      code: 'xml_missing_root',
      field: 'xml',
      message: '<report> element not found in parsed tree.',
    });
    return { ok: false, errors, warnings };
  }

  for (const name of REPORT_REQUIRED_CHILDREN) {
    if (!findChild(report, name)) {
      errors.push({
        code: 'xml_missing_required_child',
        field: `report.${name}`,
        message: `goAML <report> is missing required child <${name}>.`,
      });
    }
  }

  // submission_code must be E or P (XSD enum).
  const submissionCode = textOf(findChild(report, 'submission_code'));
  if (submissionCode && !['E', 'P'].includes(submissionCode)) {
    errors.push({
      code: 'xml_submission_code_invalid',
      field: 'report.submission_code',
      message: `<submission_code> must be 'E' or 'P', got '${submissionCode}'.`,
    });
  }

  // report_code must be in the UAE FIU profile set.
  const reportCode = textOf(findChild(report, 'report_code'));
  if (reportCode && !(GOAML_REPORT_CODES as readonly string[]).includes(reportCode)) {
    errors.push({
      code: 'xml_report_code_invalid',
      field: 'report.report_code',
      message: `<report_code>${reportCode}</report_code> is not accepted by UAE FIU.`,
    });
  }

  // submission_date must be ISO 8601 dateTime.
  const submissionDate = textOf(findChild(report, 'submission_date'));
  if (submissionDate && !ISO_DATETIME_REGEX.test(submissionDate)) {
    errors.push({
      code: 'xml_submission_date_invalid',
      field: 'report.submission_date',
      message: '<submission_date> must be ISO 8601 dateTime.',
    });
  }

  // currency_code_local must be AED for UAE.
  const currency = textOf(findChild(report, 'currency_code_local'));
  if (currency && currency !== GOAML_LOCAL_CURRENCY) {
    errors.push({
      code: 'xml_currency_invalid',
      field: 'report.currency_code_local',
      message: `<currency_code_local> must be ${GOAML_LOCAL_CURRENCY} for UAE FIU submissions, got '${currency}'.`,
    });
  }

  // Each transaction must carry the required children.
  for (const tx of findAllChildren(report, 'transaction')) {
    for (const name of TRANSACTION_REQUIRED_CHILDREN) {
      if (!findChild(tx, name)) {
        errors.push({
          code: 'xml_missing_required_tx_child',
          field: `report.transaction.${name}`,
          message: `goAML <transaction> is missing required child <${name}>.`,
        });
      }
    }
    const dt = textOf(findChild(tx, 'date_transaction'));
    if (dt && !ISO_DATETIME_REGEX.test(dt) && !ISO_DATE_REGEX.test(dt)) {
      errors.push({
        code: 'xml_tx_date_invalid',
        field: 'report.transaction.date_transaction',
        message: '<date_transaction> must be ISO date or dateTime.',
      });
    }
    const code = textOf(findChild(tx, 'transmode_code'));
    if (code && !(GOAML_TRANSMODE_CODES as readonly string[]).includes(code)) {
      errors.push({
        code: 'xml_tx_transmode_invalid',
        field: 'report.transaction.transmode_code',
        message: `<transmode_code>${code}</transmode_code> is not in the goAML enumeration.`,
      });
    }
    const amount = textOf(findChild(tx, 'amount_local'));
    if (amount && !/^\d{1,18}(\.\d{1,2})?$/.test(amount)) {
      errors.push({
        code: 'xml_tx_amount_invalid',
        field: 'report.transaction.amount_local',
        message: '<amount_local> must be a non-negative decimal with up to 2 fractional digits.',
      });
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

// ──────────────────────────────────────────────────────────────────────
// Helpers — a tiny XML reader for the dialect produced by buildSarXml.
// We deliberately do NOT take a dependency on a general parser; the input
// is from our own builder and the surface is small.
// ──────────────────────────────────────────────────────────────────────

interface XmlNode {
  name: string;
  text: string;
  children: XmlNode[];
}

function parseXml(input: string): XmlNode {
  // Strip prolog + comments. Our builder doesn't emit DOCTYPE or CDATA, so we
  // don't bother with those branches.
  //
  // The comment strip loops until stable: a single-pass replace can leave
  // a re-formed `<!--` behind (e.g. input `<!-<!--x-->-->` becomes `<!---->`
  // after one pass). Looping defeats that re-formation pattern. CodeQL JS
  // rule "incomplete-multi-character-sanitization".
  const withoutProlog = input.replace(/^<\?xml[^?]*\?>\s*/, '');
  let body = withoutProlog;
  for (;;) {
    const next = body.replace(/<!--[\s\S]*?-->/g, '');
    if (next === body) break;
    body = next;
  }

  const root: XmlNode = { name: '__root__', text: '', children: [] };
  const stack: XmlNode[] = [root];
  // Match either <name attr="..."> (open), </name> (close), or <name .../> (self-closing).
  const tagRe = /<\/?([a-zA-Z_][\w-]*)([^>]*)>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(body)) !== null) {
    const between = body.slice(lastIndex, match.index);
    if (between.trim().length > 0) {
      const top = stack[stack.length - 1];
      top.text = (top.text + decodeEntities(between)).trim();
    }
    const full = match[0];
    const name = match[1];
    const isClose = full.startsWith('</');
    const isSelfClose = full.endsWith('/>');
    if (isClose) {
      const popped = stack.pop();
      if (!popped || popped.name !== name) {
        throw new Error(`XML mismatched closing tag: </${name}>`);
      }
    } else {
      const node: XmlNode = { name, text: '', children: [] };
      const top = stack[stack.length - 1];
      top.children.push(node);
      if (!isSelfClose) stack.push(node);
    }
    lastIndex = tagRe.lastIndex;
  }
  if (stack.length !== 1) {
    throw new Error(`XML unbalanced — ${stack.length - 1} unclosed tag(s)`);
  }
  return root;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function findChild(node: XmlNode, name: string): XmlNode | null {
  for (const c of node.children) {
    if (c.name === name) return c;
  }
  return null;
}

function findAllChildren(node: XmlNode, name: string): XmlNode[] {
  return node.children.filter((c) => c.name === name);
}

function textOf(node: XmlNode | null): string | null {
  if (!node) return null;
  return node.text.trim() || null;
}

// SarTransaction is referenced via `report.transactions[i]` only;
// the shared mapping helpers live in goaml-codes.ts to avoid drift
// between the builder, the validator, and the test fixtures.
