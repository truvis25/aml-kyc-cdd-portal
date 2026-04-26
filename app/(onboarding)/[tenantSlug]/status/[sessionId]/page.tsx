import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

interface Props {
  params: Promise<{ tenantSlug: string; sessionId: string }>;
}

type DocumentStatus = 'uploaded' | 'verified' | 'rejected' | string;
type CaseStatus = 'open' | 'in_review' | 'pending_info' | 'escalated' | 'approved' | 'rejected' | 'closed' | string;

interface DocumentRow {
  id: string;
  document_type: string;
  status: DocumentStatus;
  file_name: string;
  uploaded_at: string;
}

interface CaseRow {
  id: string;
  status: CaseStatus;
  opened_at: string;
}

interface StatusData {
  tenant: { name: string };
  session: {
    id: string;
    status: string;
    step_data: unknown;
    created_at: string;
    updated_at: string | null;
  };
  documents: DocumentRow[];
  latestCase: CaseRow | null;
}

const SESSION_STATUS_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  in_progress:  { label: 'In Progress', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: '⏳' },
  submitted:    { label: 'Under Review', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: '🔍' },
  approved:     { label: 'Approved', color: 'text-green-700 bg-green-50 border-green-200', icon: '✅' },
  rejected:     { label: 'Not Approved', color: 'text-red-700 bg-red-50 border-red-200', icon: '❌' },
  pending_info: { label: 'Additional Information Required', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: '📋' },
};

const DOC_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  uploaded: { label: 'Received', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  verified: { label: 'Verified', color: 'text-green-600 bg-green-50 border-green-200' },
  rejected: { label: 'Not Accepted', color: 'text-red-600 bg-red-50 border-red-200' },
};

function formatDocType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

async function fetchStatusData(sessionId: string, tenantSlug: string): Promise<StatusData | null> {
  const hdrs = await headers();
  const host = hdrs.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
  const url = `${proto}://${host}/api/status/${sessionId}?tenantSlug=${encodeURIComponent(tenantSlug)}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<StatusData>;
}

export default async function CustomerStatusPage({ params }: Props) {
  const { tenantSlug, sessionId } = await params;
  const data = await fetchStatusData(sessionId, tenantSlug);
  if (!data) notFound();

  const { tenant, session, documents, latestCase } = data;
  const customerType = (session.step_data as { customer_type?: string } | null)?.customer_type ?? 'individual';
  const isCorporate = customerType === 'corporate';

  const overallStatus: string = (() => {
    if (latestCase?.status === 'approved') return 'approved';
    if (latestCase?.status === 'rejected') return 'rejected';
    if (latestCase?.status === 'pending_info') return 'pending_info';
    return session.status;
  })();

  const statusInfo = SESSION_STATUS_LABEL[overallStatus] ?? SESSION_STATUS_LABEL['submitted'];
  const isDecided = overallStatus === 'approved' || overallStatus === 'rejected';
  const submittedAt = session.updated_at ?? session.created_at;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-gray-500 mb-1">{tenant.name}</p>
          <h1 className="text-2xl font-semibold text-gray-900">Application Status</h1>
          <p className="text-xs text-gray-400 mt-1 font-mono">Ref: {sessionId}</p>
        </div>

        {/* Status card */}
        <div className={`rounded-xl border-2 p-6 mb-6 text-center ${statusInfo.color}`}>
          <div className="text-4xl mb-3">{statusInfo.icon}</div>
          <h2 className="text-xl font-semibold">{statusInfo.label}</h2>
          <p className="text-sm mt-2 opacity-80">
            {overallStatus === 'approved' && (
              isCorporate
                ? 'Your business verification has been completed successfully. You are approved to proceed.'
                : 'Your identity verification is complete. Your application has been approved.'
            )}
            {overallStatus === 'rejected' && (
              'Unfortunately your application could not be approved at this time. Please contact us for more information.'
            )}
            {overallStatus === 'pending_info' && (
              'We need additional information to complete your review. Please contact us or check your email for details.'
            )}
            {overallStatus === 'submitted' && (
              isCorporate
                ? 'Your KYB application is under review. Our compliance team is verifying your business information and documents.'
                : 'Your KYC application is under review. Our compliance team is verifying your identity and documents.'
            )}
            {overallStatus === 'in_progress' && (
              'Your application is being prepared. Please complete all required steps.'
            )}
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Application Timeline</h3>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs text-green-700">✓</span>
              <div>
                <p className="text-sm font-medium text-gray-800">Application Started</p>
                <p className="text-xs text-gray-400">{new Date(session.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </li>

            {session.status !== 'in_progress' && (
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs text-green-700">✓</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Application Submitted</p>
                  <p className="text-xs text-gray-400">{new Date(submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </li>
            )}

            {latestCase && (
              <li className="flex items-start gap-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${isDecided ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {isDecided ? '✓' : '…'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Under Compliance Review</p>
                  <p className="text-xs text-gray-400">{new Date(latestCase.opened_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </li>
            )}

            {isDecided && (
              <li className="flex items-start gap-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${overallStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {overallStatus === 'approved' ? '✓' : '✗'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {overallStatus === 'approved' ? 'Application Approved' : 'Application Not Approved'}
                  </p>
                </div>
              </li>
            )}

            {!isDecided && (
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">○</span>
                <div>
                  <p className="text-sm text-gray-400">Final Decision</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
              </li>
            )}
          </ol>
        </div>

        {/* Documents */}
        {documents.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Submitted Documents</h3>
            <ul className="space-y-2">
              {documents.map((doc) => {
                const docStatus = DOC_STATUS_LABEL[doc.status] ?? DOC_STATUS_LABEL['uploaded'];
                return (
                  <li key={doc.id} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{formatDocType(doc.document_type)}</p>
                      <p className="text-xs text-gray-400 truncate">{doc.file_name}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${docStatus.color}`}>
                      {docStatus.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Help */}
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500">
            Questions about your application? Contact <strong>{tenant.name}</strong> with your reference number.
          </p>
          <p className="text-xs font-mono text-gray-400 mt-1">{sessionId}</p>
        </div>
      </div>
    </div>
  );
}
