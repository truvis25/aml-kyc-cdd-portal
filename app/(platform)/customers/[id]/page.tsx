import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPageAuth } from '@/lib/auth/page-auth';
import { hasPermission } from '@/modules/auth/rbac';
import { RiskScoreDisplay } from '@/components/cases/risk-score-display';
import {
  CustomerRevisions,
  type CustomerRevisionRow,
} from '@/components/customers/customer-revisions';
import { CustomerAuditTrail } from '@/components/customers/customer-audit-trail';
import * as audit from '@/modules/audit/audit.service';
import { AuditEntityType } from '@/lib/constants/events';
import type { RiskBand } from '@/modules/risk/risk.types';

/**
 * Fields tracked across customer_data_versions. Order matters: drives the
 * field-changed comparison below. Keep in sync with the columns selected in
 * the revision query.
 */
const REVISION_FIELDS = [
  'full_name',
  'date_of_birth',
  'nationality',
  'country_of_residence',
  'id_type',
  'id_number',
  'id_expiry',
  'id_issuing_country',
  'emirates_id_number',
  'email',
  'phone',
  'address_line1',
  'city',
  'postal_code',
  'country',
  'occupation',
  'employer',
  'pep_status',
  'source_of_funds',
  'purpose_of_relationship',
] as const;
type RevisionRecord = Record<(typeof REVISION_FIELDS)[number], unknown> & {
  version: number;
  created_at: string;
  submitted_by: string | null;
};

interface Props {
  params: Promise<{ id: string }>;
}

interface CustomerRow {
  id: string;
  customer_type: string;
  status: string;
  created_at: string;
  tenant_id: string;
}

interface DataVersionRow {
  full_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  country_of_residence: string | null;
  occupation: string | null;
  source_of_funds: string | null;
  purpose_of_relationship: string | null;
  pep_status: boolean | null;
  id_type: string | null;
  id_number: string | null;
  emirates_id_number: string | null;
  version: number;
}

interface BusinessDataRow {
  company_name: string | null;
  trade_license_number: string | null;
  jurisdiction: string | null;
  activity_type: string | null;
  trade_license_issued_at: string | null;
  trade_license_expires_at: string | null;
  authorized_rep_name: string | null;
}

interface DocumentRow {
  id: string;
  document_type: string;
  file_name: string;
  status: string;
  uploaded_at: string;
}

interface CaseRow {
  id: string;
  status: string;
  queue: string;
  opened_at: string;
  assigned_to: string | null;
  risk_assessment_id: string | null;
}

interface ScreeningHitRow {
  id: string;
  hit_type: string;
  match_name: string;
  match_score: number | null;
  status: string;
}

interface RiskRow {
  id: string;
  composite_score: number;
  risk_band: RiskBand;
}

interface OfficerRow {
  id: string;
  display_name: string | null;
}

const CASE_STATUS_BADGE: Record<string, string> = {
  open:         'bg-blue-50 border-blue-200 text-blue-700',
  in_review:    'bg-purple-50 border-purple-200 text-purple-700',
  pending_info: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  escalated:    'bg-orange-50 border-orange-200 text-orange-700',
  approved:     'bg-green-50 border-green-200 text-green-700',
  rejected:     'bg-red-50 border-red-200 text-red-700',
  closed:       'bg-gray-50 border-gray-200 text-gray-600',
};

const DOC_STATUS_BADGE: Record<string, string> = {
  uploaded: 'bg-blue-50 border-blue-200 text-blue-700',
  verified: 'bg-green-50 border-green-200 text-green-700',
  rejected: 'bg-red-50 border-red-200 text-red-700',
};

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const { userId, role, tenantId: tenant_id } = await getPageAuth();
  const supabase = await createClient();

  const { data: rawCustomer } = await supabase
    .from('customers')
    .select('id, customer_type, status, created_at, tenant_id')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  const customer = rawCustomer as CustomerRow | null;
  if (!customer) notFound();

  // Access control: users without read_all can only see customers they have assigned cases for
  const canReadAll = hasPermission(role, 'customers:read_all');
  if (!canReadAll) {
    const { data: assignedCase } = await supabase
      .from('cases')
      .select('id')
      .eq('customer_id', id)
      .eq('tenant_id', tenant_id)
      .eq('assigned_to', userId)
      .limit(1)
      .maybeSingle();
    if (!assignedCase) notFound();
  }

  const isCorporate = customer.customer_type === 'corporate';
  const canReadEdd = hasPermission(role, 'customers:read_edd_data');

  const [dataResult, businessResult, docsResult, casesResult, hitsResult] = await Promise.all([
    supabase
      .from('customer_data_versions')
      .select('full_name, date_of_birth, nationality, country_of_residence, occupation, source_of_funds, purpose_of_relationship, pep_status, id_type, id_number, emirates_id_number, version')
      .eq('customer_id', id)
      .eq('tenant_id', tenant_id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
    isCorporate
      ? supabase
          .from('businesses')
          .select('business_data_versions(company_name, trade_license_number, jurisdiction, activity_type, trade_license_issued_at, trade_license_expires_at, authorized_rep_name)')
          .eq('customer_id', id)
          .eq('tenant_id', tenant_id)
          .order('version', { referencedTable: 'business_data_versions', ascending: false })
          .limit(1, { referencedTable: 'business_data_versions' })
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('documents')
      .select('id, document_type, file_name, status, uploaded_at')
      .eq('customer_id', id)
      .eq('tenant_id', tenant_id)
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('cases')
      .select('id, status, queue, opened_at, assigned_to, risk_assessment_id')
      .eq('customer_id', id)
      .eq('tenant_id', tenant_id)
      .order('opened_at', { ascending: false }),
    supabase
      .from('screening_hits')
      .select('id, hit_type, match_name, match_score, status')
      .eq('customer_id', id)
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const latestData = dataResult.data as DataVersionRow | null;
  const businessRaw = businessResult.data as { business_data_versions: BusinessDataRow[] } | null;
  const businessData: BusinessDataRow | null = businessRaw?.business_data_versions?.[0] ?? null;
  const documents = (docsResult.data ?? []) as unknown as DocumentRow[];
  const cases = (casesResult.data ?? []) as unknown as CaseRow[];
  const screeningHits = (hitsResult.data ?? []) as ScreeningHitRow[];

  // Revision history — fetch every version's tracked fields + author so we
  // can compute which fields changed between adjacent versions. Values are
  // PII so we surface only the field NAMES that changed; reviewers see the
  // current values via the Identity / EDD panels.
  const { data: revisionRowsRaw } = await supabase
    .from('customer_data_versions')
    .select(
      [
        'version',
        'created_at',
        'submitted_by',
        ...REVISION_FIELDS,
      ].join(', '),
    )
    .eq('customer_id', id)
    .eq('tenant_id', tenant_id)
    .order('version', { ascending: false })
    .limit(50);
  const revisionRows = (revisionRowsRaw ?? []) as unknown as RevisionRecord[];

  const revisionAuthorIds = [
    ...new Set(
      revisionRows.map((r) => r.submitted_by).filter((x): x is string => Boolean(x)),
    ),
  ];
  const revisionAuthors = new Map<string, string>();
  if (revisionAuthorIds.length > 0) {
    const { data: authorRows } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', revisionAuthorIds);
    for (const u of (authorRows ?? []) as Array<{ id: string; display_name: string | null }>) {
      revisionAuthors.set(u.id, u.display_name ?? `${u.id.slice(0, 8)}…`);
    }
  }

  // Build the timeline: rows are already DESC by version. Compare each to
  // its predecessor (i + 1 in the array) to compute changed fields.
  // Compliance activity feed for this customer entity. Fetch the latest
  // events and resolve actor display names so the panel reads naturally.
  const auditEventsRaw = await audit.query({
    tenant_id,
    entity_type: AuditEntityType.CUSTOMER,
    entity_id: id,
    limit: 25,
  });
  const auditActorIds = [
    ...new Set(
      auditEventsRaw.map((e) => e.actor_id).filter((x): x is string => Boolean(x)),
    ),
  ];
  const auditActorNames = new Map<string, string>();
  if (auditActorIds.length > 0) {
    const { data: actorRows } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', auditActorIds);
    for (const u of (actorRows ?? []) as Array<{ id: string; display_name: string | null }>) {
      auditActorNames.set(u.id, u.display_name ?? `${u.id.slice(0, 8)}…`);
    }
  }
  const auditTrailRows = auditEventsRaw.map((e) => ({
    id: e.id,
    event_time: e.event_time,
    event_type: e.event_type as string,
    entity_type: e.entity_type as string,
    actor_role: e.actor_role ?? null,
    actor_name: e.actor_id ? auditActorNames.get(e.actor_id) ?? null : null,
  }));

  const revisionPanelRows: CustomerRevisionRow[] = revisionRows.map((row, idx) => {
    const prev = revisionRows[idx + 1];
    const changed: string[] = prev
      ? REVISION_FIELDS.filter((f) => row[f] !== prev[f])
      : [];
    return {
      version: row.version,
      created_at: row.created_at,
      submitted_by_name: row.submitted_by ? revisionAuthors.get(row.submitted_by) ?? null : null,
      changed_fields: changed,
    };
  });

  // Fetch risk assessments and officer names for cases
  const riskIds = [...new Set(cases.map((c) => c.risk_assessment_id).filter(Boolean))] as string[];
  const officerIds = [...new Set(cases.map((c) => c.assigned_to).filter(Boolean))] as string[];

  const [risksResult, officersResult] = await Promise.all([
    riskIds.length > 0
      ? supabase.from('risk_assessments').select('id, composite_score, risk_band').in('id', riskIds)
      : Promise.resolve({ data: [] }),
    officerIds.length > 0
      ? supabase.from('users').select('id, display_name').in('id', officerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const riskById = new Map<string, RiskRow>();
  for (const r of (risksResult.data ?? []) as unknown as RiskRow[]) {
    riskById.set(r.id, r);
  }
  const officerById = new Map<string, string>();
  for (const u of (officersResult.data ?? []) as unknown as OfficerRow[]) {
    officerById.set(u.id, u.display_name ?? u.id.slice(0, 8));
  }

  const customerStatusBadge: Record<string, string> = {
    pending:     'bg-yellow-50 border-yellow-200 text-yellow-700',
    in_progress: 'bg-blue-50 border-blue-200 text-blue-700',
    submitted:   'bg-purple-50 border-purple-200 text-purple-700',
    approved:    'bg-green-50 border-green-200 text-green-700',
    rejected:    'bg-red-50 border-red-200 text-red-700',
    suspended:   'bg-gray-50 border-gray-200 text-gray-600',
  };
  const statusStyle = customerStatusBadge[customer.status] ?? 'bg-gray-50 border-gray-200 text-gray-600';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <nav aria-label="Breadcrumb" className="mb-1">
          <ol className="flex items-center text-sm text-gray-500">
            <li><Link href="/customers" className="text-blue-600 hover:underline">Customers</Link></li>
            <li className="mx-1" aria-hidden="true">/</li>
            <li className="font-mono">{id.slice(0, 8)}…</li>
          </ol>
        </nav>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-gray-900">
            {latestData?.full_name ?? businessData?.company_name ?? (
              <span className="text-gray-400 font-normal">Unnamed Customer</span>
            )}
          </h1>
          <span className={`text-xs font-medium rounded-full px-3 py-1 capitalize border ${statusStyle}`}>
            {customer.status.replace(/_/g, ' ')}
          </span>
          <span className="text-xs font-medium rounded-full px-3 py-1 capitalize border border-gray-200 bg-gray-50 text-gray-600">
            {customer.customer_type.replace(/_/g, ' ')}
          </span>
        </div>
        <p className="text-xs text-gray-400 font-mono mt-1">ID: {id}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6">
          {/* Corporate identity */}
          {isCorporate && businessData && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Business Identity</h2>
              <dl className="space-y-2 text-xs">
                {([
                  ['Company Name', businessData.company_name],
                  ['Trade License No.', businessData.trade_license_number],
                  ['Jurisdiction', businessData.jurisdiction],
                  ['Activity Type', businessData.activity_type],
                  ['License Issued', businessData.trade_license_issued_at],
                  ['License Expires', businessData.trade_license_expires_at],
                  ['Authorised Rep.', businessData.authorized_rep_name],
                ] as [string, string | null][]).filter(([, v]) => v != null).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <dt className="text-gray-400 shrink-0">{label}</dt>
                    <dd className="font-medium text-gray-900 text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Individual identity */}
          {!isCorporate && latestData && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Identity</h2>
              <dl className="space-y-2 text-xs">
                {([
                  ['Full Name', latestData.full_name],
                  ['Date of Birth', latestData.date_of_birth],
                  ['Nationality', latestData.nationality],
                  ['Country of Residence', latestData.country_of_residence],
                ] as [string, string | null][]).filter(([, v]) => v != null).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <dt className="text-gray-400 shrink-0">{label}</dt>
                    <dd className="font-medium text-gray-900 text-right">{value}</dd>
                  </div>
                ))}
                {latestData.pep_status && (
                  <div className="pt-1">
                    <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">PEP</span>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Enhanced Due Diligence (gated). Surfaces high-sensitivity
              fields aggregated from customer_data_versions. Visible to
              senior_reviewer / mlro / tenant_admin only via the
              customers:read_edd_data permission. Analysts and onboarding
              agents do not see this panel. */}
          {!isCorporate && latestData && canReadEdd && (
            <div className="bg-white rounded-lg border border-amber-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">Enhanced Due Diligence</h2>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                  Restricted
                </span>
              </div>
              <dl className="space-y-2 text-xs">
                {([
                  ['Occupation', latestData.occupation],
                  ['Source of Funds', latestData.source_of_funds],
                  ['Purpose of Relationship', latestData.purpose_of_relationship],
                  ['ID Type', latestData.id_type],
                  ['ID Number', latestData.id_number ? '••••' + latestData.id_number.slice(-4) : null],
                  ['Emirates ID', latestData.emirates_id_number],
                  ['PEP Status', latestData.pep_status ? 'Politically exposed' : 'Not flagged'],
                ] as [string, string | null][]).filter(([, v]) => v != null).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <dt className="text-gray-400 shrink-0">{label}</dt>
                    <dd className="font-medium text-gray-900 text-right break-words">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-[11px] text-gray-400 mt-3">
                Visible to MLRO, Senior Reviewer, and Tenant Admin only.
              </p>
            </div>
          )}

          {/* Data revisions timeline */}
          <CustomerRevisions rows={revisionPanelRows} />

          {/* Compliance activity timeline (audit_log derived) */}
          <CustomerAuditTrail events={auditTrailRows} />

          {/* Screening hits */}
          {screeningHits.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Screening Hits</h2>
              <ul className="space-y-2">
                {screeningHits.map((hit) => (
                  <li key={hit.id} className="text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-800">{hit.match_name}</p>
                        <p className="text-gray-400 capitalize">{hit.hit_type.replace(/_/g, ' ')}</p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                        hit.status === 'confirmed' ? 'bg-red-50 border-red-200 text-red-700' :
                        hit.status === 'false_positive' ? 'bg-green-50 border-green-200 text-green-700' :
                        'bg-yellow-50 border-yellow-200 text-yellow-700'
                      }`}>
                        {hit.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {hit.match_score != null && (
                      <p className="text-gray-400 mt-0.5">Score: {Math.round(hit.match_score)}%</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Documents */}
          {documents.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Documents</h2>
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-start justify-between gap-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 capitalize truncate">
                        {doc.document_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-gray-400 truncate">{doc.file_name}</p>
                      <p className="text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                      DOC_STATUS_BADGE[doc.status] ?? 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}>
                      {doc.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column — cases */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Cases</h2>
            {cases.length === 0 ? (
              <p className="text-sm text-gray-400">No cases yet.</p>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-2 text-left text-xs font-medium text-gray-500">Case ID</th>
                      <th className="pb-2 text-left text-xs font-medium text-gray-500">Queue</th>
                      <th className="pb-2 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="pb-2 text-left text-xs font-medium text-gray-500">Risk</th>
                      <th className="pb-2 text-left text-xs font-medium text-gray-500">Assigned</th>
                      <th className="pb-2 text-left text-xs font-medium text-gray-500">Opened</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cases.map((c) => {
                      const riskData = c.risk_assessment_id ? riskById.get(c.risk_assessment_id) : undefined;
                      const officerName = c.assigned_to ? officerById.get(c.assigned_to) : null;
                      const statusStyle = CASE_STATUS_BADGE[c.status] ?? CASE_STATUS_BADGE.open;
                      return (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="py-2 pr-3 font-mono text-xs text-gray-600">{c.id.slice(0, 8)}…</td>
                          <td className="py-2 pr-3 capitalize text-gray-700 text-xs">{c.queue}</td>
                          <td className="py-2 pr-3">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusStyle}`}>
                              {c.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2 pr-3">
                            {riskData ? (
                              <RiskScoreDisplay
                                score={Math.round(riskData.composite_score)}
                                band={riskData.risk_band as RiskBand}
                                compact
                              />
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-xs text-gray-500">
                            {officerName ?? <span className="text-gray-300 italic">Unassigned</span>}
                          </td>
                          <td className="py-2 pr-3 text-xs text-gray-400">
                            {new Date(c.opened_at).toLocaleDateString()}
                          </td>
                          <td className="py-2">
                            <Link href={`/cases/${c.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                              Review →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Documents', value: documents.length, sub: `${documents.filter((d) => d.status === 'verified').length} verified` },
              { label: 'Cases', value: cases.length, sub: `${cases.filter((c) => c.status === 'open').length} open` },
              { label: 'Screening Hits', value: screeningHits.length, sub: `${screeningHits.filter((h) => h.status === 'pending').length} pending` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
