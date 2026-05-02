/**
 * SAR service — the only entry point for creating, updating, and exporting
 * Suspicious Activity Reports. All API routes delegate here.
 *
 * Permission gating is at the API layer (`assertPermission(role, 'cases:flag_sar')`)
 * and the row-level security policies on `sar_reports`. This service trusts
 * its caller has cleared both gates.
 */

import { createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { emit } from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import type { Role } from '@/lib/constants/roles';
import { buildSarXml } from './goaml-builder';
import {
  validateForGoaml,
  validateGoamlXml,
  type GoamlValidationError,
  type GoamlValidationResult,
  type ValidationMode,
} from './goaml-validator';
import type {
  CreateSarDraftInput,
  UpdateSarDraftInput,
  SarReport,
  ReportingInstitution,
  SarSubject,
  SarTransaction,
} from './types';

/**
 * Thrown by `exportSarAsXml` and `submitSarReport` when the SAR fails goAML
 * structural validation. Routes catch this and return 422 with the error
 * list so the MLRO UI can render field-level annotations.
 */
export class GoamlValidationFailedError extends Error {
  readonly result: GoamlValidationResult;
  readonly mode: ValidationMode;

  constructor(result: GoamlValidationResult, mode: ValidationMode) {
    const summary = result.errors
      .slice(0, 3)
      .map((e: GoamlValidationError) => `${e.field}: ${e.message}`)
      .join('; ');
    super(`goAML validation failed (${mode}): ${summary}`);
    this.name = 'GoamlValidationFailedError';
    this.result = result;
    this.mode = mode;
  }
}

interface ServiceContext {
  tenantId: string;
  userId: string;
  role: Role;
}

interface CaseLookupRow {
  id: string;
  tenant_id: string;
  customer_id: string;
}

interface CustomerLookupRow {
  full_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  national_id: string | null;
  address: string | null;
}

interface SarRowDb {
  id: string;
  tenant_id: string;
  case_id: string;
  customer_id: string;
  reference_number: string;
  status: SarReport['status'];
  reason_codes: string[];
  narrative: string;
  activity_start: string | null;
  activity_end: string | null;
  total_amount_aed: string | number;
  transactions: unknown;
  goaml_xml_hash: string | null;
  goaml_xml_version: number;
  goaml_submission_id: string | null;
  regulator_acknowledgment: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  submitted_by: string | null;
  submitted_at: string | null;
}

function dbRowToReport(row: SarRowDb): SarReport {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    case_id: row.case_id,
    customer_id: row.customer_id,
    reference_number: row.reference_number,
    status: row.status,
    reason_codes: row.reason_codes as SarReport['reason_codes'],
    narrative: row.narrative,
    activity_start: row.activity_start,
    activity_end: row.activity_end,
    total_amount_aed: typeof row.total_amount_aed === 'string'
      ? Number(row.total_amount_aed)
      : row.total_amount_aed,
    transactions: Array.isArray(row.transactions)
      ? (row.transactions as SarTransaction[])
      : [],
    goaml_xml_hash: row.goaml_xml_hash,
    goaml_xml_version: row.goaml_xml_version,
    goaml_submission_id: row.goaml_submission_id,
    regulator_acknowledgment: row.regulator_acknowledgment,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    submitted_by: row.submitted_by,
    submitted_at: row.submitted_at,
  };
}

function sumTotal(transactions: SarTransaction[]): number {
  return transactions.reduce((sum, t) => sum + Number(t.amount_aed ?? 0), 0);
}

export async function createSarDraft(
  ctx: ServiceContext,
  input: CreateSarDraftInput,
): Promise<SarReport> {
  const supabase = await createClient();

  // Verify the case belongs to the calling tenant.
  const { data: caseRow, error: caseErr } = await supabase
    .from('cases')
    .select('id, tenant_id, customer_id')
    .eq('id', input.case_id)
    .eq('tenant_id', ctx.tenantId)
    .single();

  if (caseErr || !caseRow) {
    throw new Error('Case not found in this tenant');
  }
  const c = caseRow as CaseLookupRow;

  // Generate human reference via the SECURITY DEFINER function. The RPC is
  // not in the generated database types yet (added in migration 0036), so we
  // call through `unknown` to keep the call site type-clean.
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: string | null; error: { message: string } | null }>;
  const { data: refRow, error: refErr } = await rpc('generate_sar_reference', {
    p_tenant_id: ctx.tenantId,
  });
  if (refErr) {
    throw new Error(`Failed to allocate SAR reference: ${refErr.message}`);
  }
  const reference_number = (refRow ?? '') as string;

  const total = sumTotal(input.transactions);

  const { data: inserted, error: insertErr } = await supabase
    .from('sar_reports')
    .insert({
      tenant_id: ctx.tenantId,
      case_id: c.id,
      customer_id: c.customer_id,
      reference_number,
      status: 'draft',
      reason_codes: input.reason_codes,
      narrative: input.narrative,
      activity_start: input.activity_start ?? null,
      activity_end: input.activity_end ?? null,
      transactions: input.transactions,
      total_amount_aed: total,
      created_by: ctx.userId,
    })
    .select('*')
    .single();

  if (insertErr || !inserted) {
    throw new Error(`Failed to create SAR draft: ${insertErr?.message ?? 'unknown'}`);
  }

  const report = dbRowToReport(inserted as SarRowDb);

  await emit({
    tenant_id: ctx.tenantId,
    event_type: AuditEventType.SAR_DRAFTED,
    entity_type: AuditEntityType.SAR_REPORT,
    entity_id: report.id,
    actor_id: ctx.userId,
    actor_role: ctx.role,
    payload: {
      case_id: report.case_id,
      reference_number: report.reference_number,
      reason_codes: report.reason_codes,
    },
  });

  return report;
}

export async function listSarReports(
  ctx: ServiceContext,
  opts: { status?: SarReport['status']; limit?: number; offset?: number } = {},
): Promise<{ reports: SarReport[]; total: number }> {
  const supabase = await createClient();
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  let query = supabase
    .from('sar_reports')
    .select('*', { count: 'exact' })
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts.status) {
    query = query.eq('status', opts.status);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(`Failed to list SARs: ${error.message}`);
  }
  const reports = ((data ?? []) as SarRowDb[]).map(dbRowToReport);
  return { reports, total: count ?? reports.length };
}

export async function getSarReport(
  ctx: ServiceContext,
  id: string,
): Promise<SarReport | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sar_reports')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .single();

  if (error || !data) return null;
  return dbRowToReport(data as SarRowDb);
}

export async function updateSarDraft(
  ctx: ServiceContext,
  id: string,
  patch: UpdateSarDraftInput,
): Promise<SarReport> {
  const supabase = await createClient();

  // Compute new total_amount_aed if transactions change.
  const updateFields: Record<string, unknown> = {};
  if (patch.reason_codes !== undefined) updateFields.reason_codes = patch.reason_codes;
  if (patch.narrative !== undefined) updateFields.narrative = patch.narrative;
  if (patch.activity_start !== undefined) updateFields.activity_start = patch.activity_start;
  if (patch.activity_end !== undefined) updateFields.activity_end = patch.activity_end;
  if (patch.transactions !== undefined) {
    updateFields.transactions = patch.transactions;
    updateFields.total_amount_aed = sumTotal(patch.transactions);
  }
  if (patch.status !== undefined) updateFields.status = patch.status;

  const { data, error } = await supabase
    .from('sar_reports')
    .update(updateFields)
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update SAR: ${error?.message ?? 'unknown'}`);
  }
  const report = dbRowToReport(data as SarRowDb);

  await emit({
    tenant_id: ctx.tenantId,
    event_type: AuditEventType.SAR_UPDATED,
    entity_type: AuditEntityType.SAR_REPORT,
    entity_id: report.id,
    actor_id: ctx.userId,
    actor_role: ctx.role,
    payload: {
      reference_number: report.reference_number,
      changed_fields: Object.keys(updateFields),
      status: report.status,
    },
  });

  return report;
}

export async function exportSarAsXml(
  ctx: ServiceContext,
  id: string,
): Promise<{ xml: string; filename: string; report: SarReport }> {
  const supabase = await createClient();

  const report = await getSarReport(ctx, id);
  if (!report) throw new Error('SAR not found');

  // Pull customer + tenant identity for the goAML envelope.
  const [{ data: customerRow }, { data: tenantRow }] = await Promise.all([
    supabase
      .from('customer_data_versions')
      .select('full_name, date_of_birth, nationality, national_id, address')
      .eq('customer_id', report.customer_id)
      .eq('tenant_id', ctx.tenantId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('tenants')
      .select('name')
      .eq('id', ctx.tenantId)
      .single(),
  ]);

  const customer = (customerRow as CustomerLookupRow | null) ?? {
    full_name: null,
    date_of_birth: null,
    nationality: null,
    national_id: null,
    address: null,
  };

  const subject: SarSubject = {
    full_name: customer.full_name ?? 'Unknown',
    date_of_birth: customer.date_of_birth,
    nationality: customer.nationality,
    id_number: customer.national_id,
    id_type: customer.national_id ? 'NATIONAL_ID' : null,
    address: customer.address,
  };

  const institution: ReportingInstitution = {
    name: (tenantRow as { name: string } | null)?.name ?? 'Reporting Institution',
    reporting_entity_id: process.env.GOAML_REPORTING_ENTITY_ID,
    contact_email: process.env.GOAML_CONTACT_EMAIL,
    contact_phone: process.env.GOAML_CONTACT_PHONE,
  };

  // Refuse to render an invalid envelope. Returning a 422 here is cheaper
  // than catching the rejection at the FIU gateway and explaining to the
  // MLRO that their SAR was lost in transit.
  const inputValidation = validateForGoaml({ report, institution, subject, mode: 'export' });
  if (!inputValidation.ok) {
    throw new GoamlValidationFailedError(inputValidation, 'export');
  }

  const xml = buildSarXml({ report, institution, subject });

  // Defence in depth: parse the produced XML and re-check the same rules
  // against the wire-shape. If the builder ever drifts from the validator
  // this catches it before the file leaves our system.
  const xmlValidation = validateGoamlXml(xml);
  if (!xmlValidation.ok) {
    throw new GoamlValidationFailedError(xmlValidation, 'export');
  }

  const xmlHash = createHash('sha256').update(xml, 'utf8').digest('hex');

  // Persist hash + bump export version.
  await supabase
    .from('sar_reports')
    .update({
      goaml_xml_hash: xmlHash,
      goaml_xml_version: report.goaml_xml_version + 1,
    })
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId);

  await emit({
    tenant_id: ctx.tenantId,
    event_type: AuditEventType.SAR_EXPORTED,
    entity_type: AuditEntityType.SAR_REPORT,
    entity_id: report.id,
    actor_id: ctx.userId,
    actor_role: ctx.role,
    payload: {
      reference_number: report.reference_number,
      xml_hash: xmlHash,
      xml_version: report.goaml_xml_version + 1,
    },
  });

  const filename = `${report.reference_number}.xml`;
  return { xml, filename, report };
}

export async function submitSarReport(
  ctx: ServiceContext,
  id: string,
  submissionId?: string,
): Promise<SarReport> {
  const supabase = await createClient();

  // The MLRO must have rendered (and therefore validated) the goAML XML at
  // least once before submission. This is enforced by `goaml_xml_hash`
  // being non-null — `exportSarAsXml` only sets it after validation passes.
  const existing = await getSarReport(ctx, id);
  if (!existing) {
    throw new Error('SAR not found');
  }
  if (!existing.goaml_xml_hash) {
    throw new GoamlValidationFailedError(
      {
        ok: false,
        errors: [
          {
            code: 'export_required_before_submit',
            field: 'report.goaml_xml_hash',
            message:
              'Export the SAR as goAML XML at least once before submitting; the export pass-validates the envelope.',
          },
        ],
        warnings: [],
      },
      'submit',
    );
  }

  const { data, error } = await supabase
    .from('sar_reports')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      submitted_by: ctx.userId,
      goaml_submission_id: submissionId ?? null,
    })
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to submit SAR: ${error?.message ?? 'unknown'}`);
  }
  const report = dbRowToReport(data as SarRowDb);

  await emit({
    tenant_id: ctx.tenantId,
    event_type: AuditEventType.SAR_SUBMITTED,
    entity_type: AuditEntityType.SAR_REPORT,
    entity_id: report.id,
    actor_id: ctx.userId,
    actor_role: ctx.role,
    payload: {
      reference_number: report.reference_number,
      submission_id: submissionId ?? null,
    },
  });

  return report;
}
