import { describe, expect, it } from 'vitest';
import {
  validateForGoaml,
  validateGoamlXml,
} from '@/modules/sar/goaml-validator';
import { buildSarXml } from '@/modules/sar/goaml-builder';
import {
  mapInstrumentToTransmodeCode,
  mapReasonToReportCode,
} from '@/modules/sar/goaml-codes';
import type {
  SarReport,
  ReportingInstitution,
  SarSubject,
  SarTransaction,
} from '@/modules/sar/types';

const FIXED_DATE = new Date('2026-04-29T10:30:00.000Z');

function makeReport(overrides: Partial<SarReport> = {}): SarReport {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    tenant_id: '00000000-0000-0000-0000-0000000000aa',
    case_id: '00000000-0000-0000-0000-0000000000bb',
    customer_id: '00000000-0000-0000-0000-0000000000cc',
    reference_number: 'SAR-2026-0001',
    status: 'draft',
    reason_codes: ['STR'],
    narrative:
      'Customer made unusual cash deposits that do not match the declared source of funds. ' +
      'Pattern suggests structured transactions designed to evade reporting thresholds.',
    activity_start: '2026-04-01T00:00:00.000Z',
    activity_end: '2026-04-28T00:00:00.000Z',
    total_amount_aed: 0,
    transactions: [],
    goaml_xml_hash: null,
    goaml_xml_version: 0,
    goaml_submission_id: null,
    regulator_acknowledgment: null,
    created_by: '00000000-0000-0000-0000-0000000000dd',
    created_at: '2026-04-29T00:00:00.000Z',
    updated_at: '2026-04-29T00:00:00.000Z',
    submitted_by: null,
    submitted_at: null,
    ...overrides,
  };
}

const INSTITUTION: ReportingInstitution = {
  name: 'Acme Compliance',
  reporting_entity_id: 'AE-RENT-12345',
  contact_email: 'mlro@acme.ae',
  contact_phone: '+971-4-123-4567',
};

const SUBJECT: SarSubject = {
  full_name: 'John Doe',
  date_of_birth: '1985-06-15',
  nationality: 'AE',
  id_number: '784-1985-1234567-1',
  id_type: 'EMIRATES_ID',
  address: '123 Marina Walk, Dubai',
};

function makeTransaction(overrides: Partial<SarTransaction> = {}): SarTransaction {
  return {
    date: '2026-04-15T12:00:00.000Z',
    amount_aed: 50000,
    instrument_type: 'cash',
    counterparty: 'Walk-in deposit',
    description: 'Bulk-cash deposit at branch counter',
    reference: 'TX-001',
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Code mappings (locked-in by tests; FIU profile changes here are easy to spot)
// ──────────────────────────────────────────────────────────────────────

describe('mapReasonToReportCode', () => {
  it('returns CTR when CTR is present (highest priority)', () => {
    expect(mapReasonToReportCode(['STR', 'CTR'])).toBe('CTR');
  });

  it('returns TFS-STR when TFS is present and CTR is not', () => {
    expect(mapReasonToReportCode(['STR', 'TFS'])).toBe('TFS-STR');
  });

  it('defaults to STR for unrecognised or empty input', () => {
    expect(mapReasonToReportCode(['STR'])).toBe('STR');
    expect(mapReasonToReportCode([])).toBe('STR');
    expect(mapReasonToReportCode(['UNK'])).toBe('STR');
  });
});

describe('mapInstrumentToTransmodeCode', () => {
  it('maps the SAR instrument enum to the goAML transmode codes', () => {
    expect(mapInstrumentToTransmodeCode('cash')).toBe('CASH');
    expect(mapInstrumentToTransmodeCode('wire')).toBe('WIRE');
    expect(mapInstrumentToTransmodeCode('cheque')).toBe('CHEQUE');
    expect(mapInstrumentToTransmodeCode('card')).toBe('CARD');
    expect(mapInstrumentToTransmodeCode('crypto')).toBe('CRYPTO');
    expect(mapInstrumentToTransmodeCode('other')).toBe('OTHER');
  });

  it('falls back to OTHER for unknown instruments', () => {
    expect(mapInstrumentToTransmodeCode('unknown' as never)).toBe('OTHER');
    expect(mapInstrumentToTransmodeCode(null)).toBe('OTHER');
  });
});

// ──────────────────────────────────────────────────────────────────────
// Input-level validation
// ──────────────────────────────────────────────────────────────────────

describe('validateForGoaml — happy path', () => {
  it('accepts a complete export-grade report', () => {
    const result = validateForGoaml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: SUBJECT,
      mode: 'export',
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('warns about missing rentity_id on draft but does not block', () => {
    const result = validateForGoaml({
      report: makeReport(),
      institution: { ...INSTITUTION, reporting_entity_id: undefined },
      subject: SUBJECT,
      mode: 'draft',
    });
    expect(result.ok).toBe(true);
    expect(result.warnings.map((w) => w.code)).toContain('rentity_id_missing');
  });
});

describe('validateForGoaml — institution rules', () => {
  it('rejects export when reporting_entity_id is missing', () => {
    const result = validateForGoaml({
      report: makeReport(),
      institution: { ...INSTITUTION, reporting_entity_id: undefined },
      subject: SUBJECT,
      mode: 'export',
    });
    expect(result.ok).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain('rentity_id_required');
  });

  it('rejects an institution name that is empty', () => {
    const result = validateForGoaml({
      report: makeReport(),
      institution: { ...INSTITUTION, name: '   ' },
      subject: SUBJECT,
      mode: 'export',
    });
    expect(result.ok).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain('institution_name_required');
  });

  it('rejects a malformed contact_email', () => {
    const result = validateForGoaml({
      report: makeReport(),
      institution: { ...INSTITUTION, contact_email: 'not-an-email' },
      subject: SUBJECT,
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('contact_email_invalid');
  });
});

describe('validateForGoaml — report envelope', () => {
  it('rejects an empty reason_codes array', () => {
    const result = validateForGoaml({
      report: makeReport({ reason_codes: [] }),
      institution: INSTITUTION,
      subject: SUBJECT,
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('reason_codes_required');
  });

  it('rejects an unknown reason code', () => {
    const result = validateForGoaml({
      report: makeReport({ reason_codes: ['XYZ' as never] }),
      institution: INSTITUTION,
      subject: SUBJECT,
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('reason_code_invalid');
  });

  it('rejects a too-short narrative for export but accepts it for draft', () => {
    const short = 'short narrative';
    expect(
      validateForGoaml({
        report: makeReport({ narrative: short }),
        institution: INSTITUTION,
        subject: SUBJECT,
        mode: 'export',
      }).errors.map((e) => e.code),
    ).toContain('narrative_too_short');
    expect(
      validateForGoaml({
        report: makeReport({ narrative: 'A draft narrative that is long enough.' }),
        institution: INSTITUTION,
        subject: SUBJECT,
        mode: 'draft',
      }).ok,
    ).toBe(true);
  });

  it('rejects a non-ISO activity_start', () => {
    const result = validateForGoaml({
      report: makeReport({ activity_start: '01/04/2026' }),
      institution: INSTITUTION,
      subject: SUBJECT,
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('activity_start_invalid');
  });

  it('rejects an inverted activity window', () => {
    const result = validateForGoaml({
      report: makeReport({
        activity_start: '2026-05-01T00:00:00.000Z',
        activity_end: '2026-04-01T00:00:00.000Z',
      }),
      institution: INSTITUTION,
      subject: SUBJECT,
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('activity_window_inverted');
  });
});

describe('validateForGoaml — subject rules', () => {
  it('rejects a subject without a name', () => {
    const result = validateForGoaml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: { ...SUBJECT, full_name: '' },
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('subject_name_required');
  });

  it('rejects a non-ISO date_of_birth', () => {
    const result = validateForGoaml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: { ...SUBJECT, date_of_birth: '15/06/1985' },
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('subject_dob_invalid');
  });

  it('rejects a future date_of_birth', () => {
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const result = validateForGoaml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: { ...SUBJECT, date_of_birth: future },
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('subject_dob_future');
  });

  it('rejects a non-ISO-3166 nationality', () => {
    const result = validateForGoaml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: { ...SUBJECT, nationality: 'United Arab Emirates' },
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('subject_nationality_invalid');
  });

  it('rejects an id_number without an id_type', () => {
    const result = validateForGoaml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: { ...SUBJECT, id_type: null },
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('subject_id_type_missing');
  });

  it('rejects an unknown id_type value', () => {
    const result = validateForGoaml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: { ...SUBJECT, id_type: 'WHATEVER' },
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('subject_id_type_invalid');
  });
});

describe('validateForGoaml — transactions', () => {
  it('accepts a valid transaction list with matching total', () => {
    const tx1 = makeTransaction({ amount_aed: 10000, reference: 'T1' });
    const tx2 = makeTransaction({ amount_aed: 25000, reference: 'T2' });
    const result = validateForGoaml({
      report: makeReport({ transactions: [tx1, tx2], total_amount_aed: 35000 }),
      institution: INSTITUTION,
      subject: SUBJECT,
      mode: 'export',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a negative amount', () => {
    const result = validateForGoaml({
      report: makeReport({
        transactions: [makeTransaction({ amount_aed: -100 })],
        total_amount_aed: -100,
      }),
      institution: INSTITUTION,
      subject: SUBJECT,
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('tx_amount_negative');
  });

  it('rejects a future-dated transaction', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const result = validateForGoaml({
      report: makeReport({
        transactions: [makeTransaction({ date: future })],
        total_amount_aed: 50000,
      }),
      institution: INSTITUTION,
      subject: SUBJECT,
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('tx_date_future');
  });

  it('rejects when total_amount_aed disagrees with the transaction sum', () => {
    const result = validateForGoaml({
      report: makeReport({
        transactions: [makeTransaction({ amount_aed: 10000 })],
        total_amount_aed: 99999,
      }),
      institution: INSTITUTION,
      subject: SUBJECT,
      mode: 'export',
    });
    expect(result.errors.map((e) => e.code)).toContain('total_amount_mismatch');
  });

  it('reports the failing transaction index in the field path', () => {
    const result = validateForGoaml({
      report: makeReport({
        transactions: [
          makeTransaction({ amount_aed: 100, reference: 'ok' }),
          makeTransaction({ amount_aed: -5, reference: 'bad' }),
        ],
        total_amount_aed: 95,
      }),
      institution: INSTITUTION,
      subject: SUBJECT,
      mode: 'export',
    });
    expect(result.errors.find((e) => e.code === 'tx_amount_negative')?.field).toBe(
      'report.transactions[1].amount_aed',
    );
  });
});

// ──────────────────────────────────────────────────────────────────────
// XML-level validation (parses the produced XML)
// ──────────────────────────────────────────────────────────────────────

describe('validateGoamlXml — round-trip with the builder', () => {
  it('accepts the XML produced by buildSarXml for a valid SAR', () => {
    const xml = buildSarXml({
      report: makeReport({
        transactions: [makeTransaction()],
        total_amount_aed: 50000,
      }),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    const result = validateGoamlXml(xml);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('flags missing required <report> children when the XML is hand-mangled', () => {
    const xml = buildSarXml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    const stripped = xml.replace(/<rentity_id>[^<]*<\/rentity_id>\s*/, '');
    const result = validateGoamlXml(stripped);
    expect(result.ok).toBe(false);
    expect(result.errors.find((e) => e.code === 'xml_missing_required_child')?.field).toBe(
      'report.rentity_id',
    );
  });

  it('flags an invalid currency_code_local', () => {
    const xml = buildSarXml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    }).replace('<currency_code_local>AED</currency_code_local>', '<currency_code_local>USD</currency_code_local>');
    const result = validateGoamlXml(xml);
    expect(result.errors.map((e) => e.code)).toContain('xml_currency_invalid');
  });

  it('flags an unknown report_code', () => {
    const xml = buildSarXml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    }).replace('<report_code>STR</report_code>', '<report_code>FOO</report_code>');
    const result = validateGoamlXml(xml);
    expect(result.errors.map((e) => e.code)).toContain('xml_report_code_invalid');
  });

  it('flags missing namespace declaration', () => {
    const xml = buildSarXml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    }).replace(' xmlns="http://www.goaml.org/schemas/v4"', '');
    const result = validateGoamlXml(xml);
    expect(result.errors.map((e) => e.code)).toContain('xml_namespace_invalid');
  });

  it('flags malformed XML (unbalanced tags)', () => {
    const result = validateGoamlXml(
      '<?xml version="1.0" encoding="UTF-8"?>\n<report xmlns="http://www.goaml.org/schemas/v4"><rentity_id>X</rentity_id>',
    );
    expect(result.ok).toBe(false);
  });

  it('rejects a transaction missing date_transaction', () => {
    const xml = buildSarXml({
      report: makeReport({
        transactions: [makeTransaction()],
        total_amount_aed: 50000,
      }),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    }).replace(/<date_transaction>[^<]*<\/date_transaction>\s*/, '');
    const result = validateGoamlXml(xml);
    expect(result.errors.find((e) => e.code === 'xml_missing_required_tx_child')?.field).toBe(
      'report.transaction.date_transaction',
    );
  });

  it('rejects an XML string with no prolog', () => {
    const result = validateGoamlXml('<report xmlns="http://www.goaml.org/schemas/v4"></report>');
    expect(result.errors.map((e) => e.code)).toContain('xml_missing_prolog');
  });
});
