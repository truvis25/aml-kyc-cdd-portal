import { describe, expect, it } from 'vitest';
import { buildSarXml, xmlEscape } from '@/modules/sar/goaml-builder';
import type { SarReport, ReportingInstitution, SarSubject } from '@/modules/sar/types';

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
    narrative: 'Customer made unusual cash deposits.',
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

describe('xmlEscape', () => {
  it('escapes the five XML special characters', () => {
    expect(xmlEscape('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&apos;');
  });

  it('escapes & first to avoid double-escaping', () => {
    expect(xmlEscape('a & <b>')).toBe('a &amp; &lt;b&gt;');
  });

  it('handles narrative with quotes and angle brackets', () => {
    const input = 'Said: "I work at <company>" & received funds';
    expect(xmlEscape(input)).toBe(
      'Said: &quot;I work at &lt;company&gt;&quot; &amp; received funds',
    );
  });
});

describe('buildSarXml', () => {
  it('produces a well-formed XML document', () => {
    const xml = buildSarXml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    expect(xml).toContain('<report xmlns="http://www.goaml.org/schemas/v4">');
    expect(xml).toContain('</report>');
  });

  it('includes the reporting institution and entity ID', () => {
    const xml = buildSarXml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    expect(xml).toContain('<rentity_id>AE-RENT-12345</rentity_id>');
    expect(xml).toContain('<email>mlro@acme.ae</email>');
    expect(xml).toContain('<tph_number>+971-4-123-4567</tph_number>');
  });

  it('omits rentity_id when entity ID not configured', () => {
    const xml = buildSarXml({
      report: makeReport(),
      institution: { name: 'No-ID Org' },
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    expect(xml).not.toContain('<rentity_id>');
  });

  it('uses STR by default and CTR when reason includes CTR', () => {
    const strXml = buildSarXml({
      report: makeReport({ reason_codes: ['STR'] }),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    expect(strXml).toContain('<report_code>STR</report_code>');

    const ctrXml = buildSarXml({
      report: makeReport({ reason_codes: ['CTR', 'CASH'] }),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    expect(ctrXml).toContain('<report_code>CTR</report_code>');
  });

  it('emits TFS-STR when terrorist-financing flag is present', () => {
    const xml = buildSarXml({
      report: makeReport({ reason_codes: ['TFS', 'STR'] }),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    expect(xml).toContain('<report_code>TFS-STR</report_code>');
  });

  it('escapes the narrative against injection', () => {
    const xml = buildSarXml({
      report: makeReport({
        narrative: '<script>alert(1)</script> & "evil"',
      }),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    expect(xml).not.toContain('<script>');
    expect(xml).toContain('&lt;script&gt;');
    expect(xml).toContain('&amp;');
    expect(xml).toContain('&quot;evil&quot;');
  });

  it('renders transactions with instrument-code mapping', () => {
    const xml = buildSarXml({
      report: makeReport({
        transactions: [
          {
            date: '2026-04-15T12:00:00.000Z',
            amount_aed: 50000,
            instrument_type: 'cash',
            counterparty: 'Acme Receiver Ltd',
            description: 'Suspicious cash deposit',
            reference: 'TX-001',
          },
          {
            date: '2026-04-20T15:30:00.000Z',
            amount_aed: 25000.5,
            instrument_type: 'wire',
          },
        ],
      }),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    expect(xml).toContain('<transaction>');
    expect(xml).toContain('<transactionnumber>TX-001</transactionnumber>');
    expect(xml).toContain('<transmode_code>CASH</transmode_code>');
    expect(xml).toContain('<transmode_code>WIRE</transmode_code>');
    expect(xml).toContain('<amount_local>50000.00</amount_local>');
    expect(xml).toContain('<amount_local>25000.50</amount_local>');
    expect(xml).toContain('<name>Acme Receiver Ltd</name>');
  });

  it('emits subject person_my_client with identification', () => {
    const xml = buildSarXml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    expect(xml).toContain('<first_name>John</first_name>');
    expect(xml).toContain('<last_name>Doe</last_name>');
    expect(xml).toContain('<birthdate>1985-06-15</birthdate>');
    expect(xml).toContain('<nationality1>AE</nationality1>');
    expect(xml).toContain('<type>EMIRATES_ID</type>');
    expect(xml).toContain('<number>784-1985-1234567-1</number>');
  });

  it('handles single-name subjects without crashing', () => {
    const xml = buildSarXml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: { full_name: 'Madonna' },
      submissionDate: FIXED_DATE,
    });
    expect(xml).toContain('<first_name>Madonna</first_name>');
    expect(xml).toContain('<last_name>-</last_name>');
  });

  it('emits indicator elements for every reason code', () => {
    const xml = buildSarXml({
      report: makeReport({ reason_codes: ['STR', 'CTR', 'TFS'] }),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    expect(xml).toContain('<indicator>STR</indicator>');
    expect(xml).toContain('<indicator>CTR</indicator>');
    expect(xml).toContain('<indicator>TFS</indicator>');
  });

  it('output is deterministic for the same input', () => {
    const a = buildSarXml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    const b = buildSarXml({
      report: makeReport(),
      institution: INSTITUTION,
      subject: SUBJECT,
      submissionDate: FIXED_DATE,
    });
    expect(a).toBe(b);
  });
});
