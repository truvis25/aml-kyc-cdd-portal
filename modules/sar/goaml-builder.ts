/**
 * goAML XML builder.
 *
 * Produces a goAML 4.x conformant <report> element from a SarReport plus
 * institution and subject metadata. This is a minimal but valid envelope
 * — UAE FIU's onboarding workflow accepts this as a STR/CTR submission.
 *
 * Caveats:
 *   * Each tenant should still validate the produced XML against their own
 *     copy of the goAML XSD before submission. The schema evolves and the
 *     FIU occasionally adds required fields per regulator guidance.
 *   * `reporting_entity_id` is required for production submission. Drafts
 *     without it will still build XML — useful for review — but the FIU
 *     gateway will reject them on receipt.
 *   * No XSD validation is performed here. We escape every text node and
 *     emit a deterministic element order so output is diff-able.
 */

import type {
  SarReport,
  ReportingInstitution,
  SarSubject,
  SarTransaction,
} from './types';

/** XML 1.0 well-formed escaping. Never `eval` or interpolate raw values. */
export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface BuildSarXmlInput {
  report: SarReport;
  institution: ReportingInstitution;
  subject: SarSubject;
  /** Override submission_date for deterministic test output. */
  submissionDate?: Date;
}

export function buildSarXml(input: BuildSarXmlInput): string {
  const { report, institution, subject } = input;
  const submissionDate = (input.submissionDate ?? new Date()).toISOString();

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<report xmlns="http://www.goaml.org/schemas/v4">');

  // Header
  if (institution.reporting_entity_id) {
    lines.push(`  <rentity_id>${xmlEscape(institution.reporting_entity_id)}</rentity_id>`);
  }
  lines.push('  <submission_code>E</submission_code>');
  lines.push(`  <report_code>${xmlEscape(mapReasonToReportCode(report.reason_codes))}</report_code>`);
  lines.push(`  <entity_reference>${xmlEscape(report.reference_number)}</entity_reference>`);
  lines.push(`  <submission_date>${xmlEscape(submissionDate)}</submission_date>`);
  lines.push('  <currency_code_local>AED</currency_code_local>');

  // Reporting person — institution staff who is the FIU contact (the MLRO).
  lines.push('  <reporting_person>');
  lines.push(`    <first_name>${xmlEscape(institution.name.split(' ')[0] ?? institution.name)}</first_name>`);
  lines.push(`    <last_name>${xmlEscape(institution.name.split(' ').slice(1).join(' ') || '-')}</last_name>`);
  if (institution.contact_email) {
    lines.push(`    <email>${xmlEscape(institution.contact_email)}</email>`);
  }
  if (institution.contact_phone) {
    lines.push('    <phones>');
    lines.push('      <phone>');
    lines.push('        <tph_contact_type>1</tph_contact_type>');
    lines.push(`        <tph_number>${xmlEscape(institution.contact_phone)}</tph_number>`);
    lines.push('      </phone>');
    lines.push('    </phones>');
  }
  lines.push('  </reporting_person>');

  // Reason — combine multiple codes, comma-separated. The FIU accepts a
  // narrative under <reason> for STR.
  lines.push(`  <reason>${xmlEscape(report.reason_codes.join(','))}</reason>`);

  // Action / activity narrative — the body of the SAR.
  lines.push(`  <action>${xmlEscape(report.narrative)}</action>`);

  // Transactions
  for (const tx of report.transactions) {
    lines.push(...renderTransaction(tx, report.reference_number));
  }

  // Activity / subject — the customer being reported on.
  lines.push('  <activity>');
  lines.push('    <signed_in_user>');
  lines.push('      <party>');
  lines.push('        <person_my_client>');
  lines.push(`          <first_name>${xmlEscape(subject.full_name.split(' ')[0] ?? subject.full_name)}</first_name>`);
  lines.push(`          <last_name>${xmlEscape(subject.full_name.split(' ').slice(1).join(' ') || '-')}</last_name>`);
  if (subject.date_of_birth) {
    lines.push(`          <birthdate>${xmlEscape(subject.date_of_birth)}</birthdate>`);
  }
  if (subject.nationality) {
    lines.push(`          <nationality1>${xmlEscape(subject.nationality)}</nationality1>`);
  }
  if (subject.id_number && subject.id_type) {
    lines.push('          <identification>');
    lines.push(`            <type>${xmlEscape(subject.id_type)}</type>`);
    lines.push(`            <number>${xmlEscape(subject.id_number)}</number>`);
    lines.push('          </identification>');
  }
  if (subject.address) {
    lines.push('          <addresses>');
    lines.push('            <address>');
    lines.push(`              <address>${xmlEscape(subject.address)}</address>`);
    lines.push('              <country_code>AE</country_code>');
    lines.push('            </address>');
    lines.push('          </addresses>');
  }
  lines.push('        </person_my_client>');
  lines.push('      </party>');
  lines.push('    </signed_in_user>');
  lines.push('  </activity>');

  // Reporting indicators — derived from reason codes.
  lines.push('  <report_indicators>');
  for (const code of report.reason_codes) {
    lines.push(`    <indicator>${xmlEscape(code)}</indicator>`);
  }
  lines.push('  </report_indicators>');

  lines.push('</report>');
  return lines.join('\n');
}

/**
 * goAML report_code mapping. UAE FIU uses STR (Suspicious Transaction
 * Report) for most submissions; CTR (Cash Threshold Report) when the
 * primary reason is a cash threshold breach.
 */
function mapReasonToReportCode(reasons: string[]): string {
  if (reasons.includes('CTR')) return 'CTR';
  if (reasons.includes('TFS')) return 'TFS-STR';
  return 'STR';
}

function renderTransaction(tx: SarTransaction, parentRef: string): string[] {
  const out: string[] = [];
  out.push('  <transaction>');
  out.push(`    <transactionnumber>${xmlEscape(tx.reference ?? `${parentRef}-tx`)}</transactionnumber>`);
  out.push(`    <transaction_location>AE</transaction_location>`);
  out.push(`    <date_transaction>${xmlEscape(tx.date)}</date_transaction>`);
  out.push(`    <transmode_code>${xmlEscape(mapInstrumentToCode(tx.instrument_type))}</transmode_code>`);
  out.push(`    <amount_local>${tx.amount_aed.toFixed(2)}</amount_local>`);
  if (tx.description) {
    out.push(`    <comments>${xmlEscape(tx.description)}</comments>`);
  }
  if (tx.counterparty) {
    out.push('    <involved_parties>');
    out.push('      <party>');
    out.push(`        <name>${xmlEscape(tx.counterparty)}</name>`);
    out.push('      </party>');
    out.push('    </involved_parties>');
  }
  out.push('  </transaction>');
  return out;
}

function mapInstrumentToCode(instrument: SarTransaction['instrument_type']): string {
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
