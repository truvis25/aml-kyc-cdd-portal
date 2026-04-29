import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPageAuth } from '@/lib/auth/page-auth';
import { assertPermission } from '@/modules/auth/rbac';
import { getSarReport } from '@/modules/sar';
import { createClient } from '@/lib/supabase/server';
import { SarEditor } from '@/components/sar/sar-editor';

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-50 border-gray-200 text-gray-700',
  ready: 'bg-blue-50 border-blue-200 text-blue-700',
  submitted: 'bg-purple-50 border-purple-200 text-purple-700',
  acknowledged: 'bg-green-50 border-green-200 text-green-700',
  rejected: 'bg-red-50 border-red-200 text-red-700',
};

export default async function SarDetailPage({ params }: Props) {
  const { id } = await params;
  const { userId, role, tenantId } = await getPageAuth();
  assertPermission(role, 'cases:flag_sar');

  const report = await getSarReport({ tenantId, userId, role }, id);
  if (!report) notFound();

  const supabase = await createClient();
  const { data: customerRow } = await supabase
    .from('customer_data_versions')
    .select('full_name, nationality')
    .eq('customer_id', report.customer_id)
    .eq('tenant_id', tenantId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const customer = customerRow as
    | { full_name: string | null; nationality: string | null }
    | null;

  const statusStyle = STATUS_BADGE[report.status] ?? STATUS_BADGE.draft;
  const isLocked = report.status === 'submitted' || report.status === 'acknowledged';

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-gray-500 mb-1">
            <Link href="/sar" className="hover:text-gray-700">SAR Register</Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-700">{report.reference_number}</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {report.reference_number}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Linked to{' '}
            <Link
              href={`/cases/${report.case_id}`}
              className="text-blue-600 hover:underline font-mono"
            >
              case {report.case_id.slice(0, 8)}…
            </Link>
            {customer?.full_name && (
              <>
                {' for '}
                <span className="text-gray-700">{customer.full_name}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border capitalize ${statusStyle}`}
          >
            {report.status}
          </span>
          <a
            href={`/api/sar/${report.id}/export`}
            className="inline-flex items-center text-xs font-medium rounded-md border border-gray-200 bg-white px-3 py-2 hover:border-blue-300 hover:text-blue-700"
          >
            Download goAML XML
          </a>
        </div>
      </div>

      <SarEditor report={report} locked={isLocked} />

      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50/40 p-4 text-xs text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>Created</span>
          <span className="text-gray-800">
            {new Date(report.created_at).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Last updated</span>
          <span className="text-gray-800">
            {new Date(report.updated_at).toLocaleString()}
          </span>
        </div>
        {report.submitted_at && (
          <div className="flex justify-between">
            <span>Submitted</span>
            <span className="text-gray-800">
              {new Date(report.submitted_at).toLocaleString()}
            </span>
          </div>
        )}
        {report.goaml_xml_hash && (
          <div className="flex justify-between">
            <span>Last export hash</span>
            <span className="text-gray-800 font-mono">
              {report.goaml_xml_hash.slice(0, 12)}… (v{report.goaml_xml_version})
            </span>
          </div>
        )}
        {report.goaml_submission_id && (
          <div className="flex justify-between">
            <span>FIU submission ID</span>
            <span className="text-gray-800 font-mono">{report.goaml_submission_id}</span>
          </div>
        )}
      </div>
    </div>
  );
}
