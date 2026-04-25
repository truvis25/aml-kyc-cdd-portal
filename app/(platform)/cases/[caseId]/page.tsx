import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AnalystActions } from '@/components/cases/analyst-actions';
import { RiskScoreDisplay } from '@/components/cases/risk-score-display';
import { hasPermission } from '@/modules/auth/rbac';
import type { Role } from '@/lib/constants/roles';
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

export default async function CaseDetailPage({ params }: Props) {
  const { caseId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as { user_role?: Role; tenant_id?: string } | undefined;
  const role = claims?.user_role;
  const tenant_id = claims?.tenant_id;
  if (!role || !tenant_id) redirect('/sign-in?error=session_invalid');


  // Fetch case
  const { data: rawCase } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .eq('tenant_id', tenant_id)
    .maybeSingle();
  const case_ = (rawCase ?? null) as CaseDetailRow | null;

  if (!case_) notFound();

  // Access control: analysts only see assigned cases
  const isAnalystOnly = role === 'analyst' || role === 'senior_reviewer';
  if (isAnalystOnly && case_.assigned_to !== user.id) notFound();

  // Fetch related data in parallel
  const [eventsResult, riskResult, documentsResult] = await Promise.all([
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
      .select('id, document_type, file_name, status, uploaded_at')
      .eq('customer_id', case_.customer_id)
      .eq('tenant_id', tenant_id),
  ]);

  const events = (eventsResult.data ?? []) as unknown as CaseEvent[];
  const riskAssessment = (riskResult.data ?? null) as RiskRow | null;
  const documents = (documentsResult.data ?? []) as unknown as DocumentRow[];

  const canViewSar = role === 'mlro' || role === 'platform_super_admin';
  const canApprove = hasPermission(role, 'cases:approve_standard');
  const canReject = hasPermission(role, 'cases:reject');
  const isClosed = case_.status === 'approved' || case_.status === 'rejected' || case_.status === 'closed';

  return (
    <div className="max-w-5xl mx-auto">
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
            {canViewSar && case_.sar_flagged && (
              <span className="text-xs font-medium rounded-full px-3 py-1 bg-red-100 border border-red-300 text-red-800">
                SAR Flagged
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — risk + actions */}
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

          {/* Documents */}
          {documents.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Documents</h2>
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 capitalize">{doc.document_type.replace(/_/g, ' ')}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      doc.status === 'verified' ? 'bg-green-50 text-green-700' :
                      doc.status === 'rejected' ? 'bg-red-50 text-red-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>{doc.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          {!isClosed && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Actions</h2>
              <AnalystActions caseId={caseId} canApprove={canApprove} canReject={canReject} />
            </div>
          )}
        </div>

        {/* Right column — case timeline */}
        <div className="lg:col-span-2">
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
