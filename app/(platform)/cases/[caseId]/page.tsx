import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AnalystActions } from '@/components/cases/analyst-actions';
import { RiskScoreDisplay } from '@/components/cases/risk-score-display';
import { ScreeningHitsPanel } from '@/components/cases/screening-hits-panel';
import { DocumentVerifyPanel } from '@/components/cases/document-verify-panel';
import { SarFlagToggle } from '@/components/cases/sar-flag-toggle';
import { CaseAssignPanel } from '@/components/cases/case-assign-panel';
import { CaseRealtime } from '@/components/cases/case-realtime';
import { hasPermission } from '@/modules/auth/rbac';
import { getPageAuth } from '@/lib/auth/page-auth';
import type { RiskBand } from '@/modules/risk/risk.types';
import type { CaseEvent } from '@/modules/cases/cases.types';

interface Props {
  params: Promise<{ caseId: string }>;
}

interface CaseDetailRow {
  id: string;
  tenant_id: string;
  customer_id: string;
  session_id: string | null;
  risk_assessment_id: string | null;
  queue: string;
  status: string;
  assigned_to: string | null;
  sar_flagged: boolean;
}

interface DocumentRow {
  id: string;
  document_type: string;
  file_name: string;
  status: string;
  uploaded_at: string;
}

interface RiskRow {
  id: string;
  composite_score: number;
  risk_band: RiskBand;
  customer_score: number | null;
  geographic_score: number | null;
  product_score: number | null;
}

interface ScreeningHitRow {
  id: string;
  hit_type: string;
  match_name: string;
  match_score: number | null;
  status: string;
  created_at: string;
}

interface OfficerRow {
  id: string;
  display_name: string | null;
  role: string;
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

export default async function CaseDetailPage({ params }: Props) {
  const { caseId } = await params;
  const { userId, role, tenantId: tenant_id } = await getPageAuth();
  const supabase = await createClient();


  // Fetch case
  const { data: rawCase } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .eq('tenant_id', tenant_id)
    .maybeSingle();
  const case_ = (rawCase ?? null) as CaseDetailRow | null;

  if (!case_) notFound();

  // Access control: analysts/senior_reviewers only see their assigned cases; managers see all
  const isRestrictedRole = role === 'analyst' || role === 'senior_reviewer';
  if (isRestrictedRole && case_.assigned_to !== userId) notFound();

  // Fetch related data in parallel
  const [eventsResult, riskResult, documentsResult, customerDataResult, sessionResult, hitsResult, officersResult, businessDataResult] = await Promise.all([
    supabase
      .from('case_events')
      .select('*')
      .eq('case_id', caseId)
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: true }),
    case_.risk_assessment_id
      ? supabase.from('risk_assessments').select('*').eq('id', case_.risk_assessment_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('documents')
      .select('id, document_type, file_name, status, uploaded_at, storage_path')
      .eq('customer_id', case_.customer_id)
      .eq('tenant_id', tenant_id),
    supabase
      .from('customer_data_versions')
      .select('full_name, date_of_birth, nationality, country_of_residence, occupation, source_of_funds, pep_status, id_type, id_number')
      .eq('customer_id', case_.customer_id)
      .eq('tenant_id', tenant_id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
    case_.session_id
      ? supabase.from('onboarding_sessions').select('step_data').eq('id', case_.session_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('screening_hits')
      .select('id, hit_type, match_name, match_score, status, created_at')
      .eq('customer_id', case_.customer_id)
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false }),
    // Fetch users with compliance roles for assignment dropdown
    supabase
      .from('users')
      .select('id, display_name, user_roles!inner(roles!inner(name))')
      .eq('tenant_id', tenant_id)
      .eq('status', 'active'),
    // Fetch business data (for corporate KYB cases)
    supabase
      .from('businesses')
      .select('business_data_versions(company_name, trade_license_number, jurisdiction, activity_type, trade_license_issued_at, trade_license_expires_at, authorized_rep_name)')
      .eq('customer_id', case_.customer_id)
      .eq('tenant_id', tenant_id)
      .order('version', { referencedTable: 'business_data_versions', ascending: false })
      .limit(1, { referencedTable: 'business_data_versions' })
      .maybeSingle(),
  ]);

  const events = (eventsResult.data ?? []) as unknown as CaseEvent[];
  const riskAssessment = (riskResult.data ?? null) as RiskRow | null;
  const documents = (documentsResult.data ?? []) as unknown as (DocumentRow & { storage_path: string })[];
  const customerData = customerDataResult.data as {
    full_name: string | null; date_of_birth: string | null; nationality: string | null;
    country_of_residence: string | null; occupation: string | null; source_of_funds: string | null;
    pep_status: boolean | null; id_type: string | null; id_number: string | null;
  } | null;
  const sessionStepData = (sessionResult.data as { step_data?: { customer_type?: string } } | null)?.step_data ?? null;
  const isCorporate = sessionStepData?.customer_type === 'corporate';
  const screeningHits = (hitsResult.data ?? []) as ScreeningHitRow[];

  // Extract latest business data version (for corporate cases)
  const businessRaw = businessDataResult.data as { business_data_versions: BusinessDataRow[] } | null;
  const businessData: BusinessDataRow | null = businessRaw?.business_data_versions?.[0] ?? null;

  // Build officer list for assignment dropdown — filter to compliance roles only
  const ASSIGNABLE_ROLES = ['analyst', 'senior_reviewer', 'mlro', 'tenant_admin'];
  const officers: OfficerRow[] = (officersResult.data ?? []).flatMap((u) => {
    const userRoles = (u as { id: string; display_name: string | null; user_roles: { roles: { name: string } }[] }).user_roles;
    const roleName = userRoles?.[0]?.roles?.name;
    if (!roleName || !ASSIGNABLE_ROLES.includes(roleName)) return [];
    return [{ id: (u as { id: string }).id, display_name: (u as { display_name: string | null }).display_name, role: roleName }];
  });

  const canFlagSar = hasPermission(role, 'cases:flag_sar');
  const canViewSar = hasPermission(role, 'cases:view_sar_status') || canFlagSar;
  const canVerifyDocs = hasPermission(role, 'documents:verify');
  const canResolveHits = hasPermission(role, 'screening:resolve_hit');
  const canApprove = hasPermission(role, 'cases:approve_standard');
  const canReject = hasPermission(role, 'cases:reject');
  const canAssign = hasPermission(role, 'cases:assign');
  const isClosed = case_.status === 'approved' || case_.status === 'rejected' || case_.status === 'closed';

  return (
    <div className="max-w-5xl mx-auto">
      <CaseRealtime tenantId={tenant_id} />
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <nav aria-label="Breadcrumb" className="mb-1">
              <ol className="flex items-center text-sm text-gray-500">
                <li>
                  <Link href="/cases" className="text-blue-600 hover:underline">Cases</Link>
                </li>
                <li className="mx-1" aria-hidden="true">/</li>
                <li className="font-mono">{caseId.slice(0, 8)}…</li>
              </ol>
            </nav>
            <h1 className="text-2xl font-semibold text-gray-900">Case Review</h1>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-3 py-1 capitalize">
              {case_.queue} queue
            </span>
            <span className={`text-xs font-medium rounded-full px-3 py-1 capitalize border ${
              case_.status === 'open' ? 'bg-blue-50 border-blue-200 text-blue-700' :
              case_.status === 'approved' ? 'bg-green-50 border-green-200 text-green-700' :
              case_.status === 'rejected' ? 'bg-red-50 border-red-200 text-red-700' :
              'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              {case_.status.replace(/_/g, ' ')}
            </span>
            {canFlagSar && (
              <SarFlagToggle caseId={caseId} initialFlagged={case_.sar_flagged} />
            )}
            {!canFlagSar && canViewSar && case_.sar_flagged && (
              <span className="text-xs font-medium rounded-full px-3 py-1 bg-red-100 border border-red-300 text-red-800">
                SAR Flagged
              </span>
            )}
          </div>
        </div>

        {/* Assignment row */}
        <div className="mt-3">
          <CaseAssignPanel
            caseId={caseId}
            currentAssigneeId={case_.assigned_to}
            officers={officers}
            canAssign={canAssign && !isClosed}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — risk + docs + screening + actions */}
        <div className="space-y-6">
          {riskAssessment && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Risk Assessment</h2>
              <RiskScoreDisplay
                score={Math.round(riskAssessment.composite_score)}
                band={riskAssessment.risk_band as RiskBand}
              />
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Customer</span>
                  <span className="font-medium text-gray-700">{Math.round(riskAssessment.customer_score ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Geographic</span>
                  <span className="font-medium text-gray-700">{Math.round(riskAssessment.geographic_score ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Product</span>
                  <span className="font-medium text-gray-700">{Math.round(riskAssessment.product_score ?? 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Documents with verify/reject actions */}
          <DocumentVerifyPanel documents={documents} canVerify={canVerifyDocs && !isClosed} />

          {/* Screening hits with resolve actions */}
          <ScreeningHitsPanel initialHits={screeningHits} canResolve={canResolveHits && !isClosed} />

          {/* Actions */}
          {!isClosed && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Actions</h2>
              <AnalystActions caseId={caseId} canApprove={canApprove} canReject={canReject} />
            </div>
          )}
        </div>

        {/* Right column — customer data + timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business identity (corporate KYB cases) */}
          {isCorporate && businessData && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Business Identity</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {[
                  ['Company Name', businessData.company_name],
                  ['Trade License No.', businessData.trade_license_number],
                  ['Jurisdiction', businessData.jurisdiction],
                  ['Activity Type', businessData.activity_type],
                  ['License Issued', businessData.trade_license_issued_at],
                  ['License Expires', businessData.trade_license_expires_at],
                  ['Authorised Rep.', businessData.authorized_rep_name],
                ].filter(([, v]) => v != null).map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-gray-400">{label}</dt>
                    <dd className="font-medium text-gray-900 mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Individual customer identity */}
          {customerData && !isCorporate && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Customer Identity</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {[
                  ['Full Name', customerData.full_name],
                  ['Date of Birth', customerData.date_of_birth],
                  ['Nationality', customerData.nationality],
                  ['Country of Residence', customerData.country_of_residence],
                  ['Occupation', customerData.occupation],
                  ['Source of Funds', customerData.source_of_funds],
                  ['ID Type', customerData.id_type],
                  ['ID Number', customerData.id_number ? '••••' + customerData.id_number.slice(-4) : null],
                ].filter(([, v]) => v != null).map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-gray-400">{label}</dt>
                    <dd className="font-medium text-gray-900 mt-0.5">{value}</dd>
                  </div>
                ))}
                {customerData.pep_status && (
                  <div className="col-span-2 mt-1">
                    <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                      PEP
                    </span>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Case Timeline</h2>
            {events.length === 0 ? (
              <p className="text-sm text-gray-400">No events yet.</p>
            ) : (
              <ol className="relative border-l border-gray-200 space-y-4 pl-4">
                {events.map((event) => (
                  <li key={event.id}>
                    <div className="absolute -left-1.5 h-3 w-3 rounded-full border border-white bg-gray-300" />
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900 capitalize">
                          {event.event_type.replace(/_/g, ' ')}
                        </p>
                        {typeof event.payload?.note === 'string' && (
                          <p className="mt-0.5 text-sm text-gray-600">{event.payload.note}</p>
                        )}
                        {typeof event.payload?.rationale === 'string' && (
                          <p className="mt-0.5 text-sm text-gray-600">{event.payload.rationale}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(event.created_at).toLocaleString()}
                          {event.actor_role && (
                            <span className="ml-2 capitalize text-gray-400">
                              · {event.actor_role.replace(/_/g, ' ')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
