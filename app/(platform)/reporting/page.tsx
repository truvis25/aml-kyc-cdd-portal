import { createClient } from '@/lib/supabase/server';
import { getPageAuth } from '@/lib/auth/page-auth';
import { assertPermission } from '@/modules/auth/rbac';
import {
  getApprovalRateByMonth,
  getAvgTimeToDecision,
  getDocumentRejectionByType,
  getMonthlyOnboardingVolume,
  getRiskBandDistribution,
  getScreeningHitRate,
} from '@/modules/reporting/queries';

const RISK_BANDS = ['low', 'medium', 'high', 'unacceptable'];

export default async function ReportingPage() {
  const { role, tenantId } = await getPageAuth();
  assertPermission(role, 'reporting:read_aggregate');

  const supabase = await createClient();
  const monthsBack = 6;

  const [volume, approval, avgTime, bandDist, docTypes, hitRate] = await Promise.all([
    getMonthlyOnboardingVolume(supabase, tenantId, monthsBack),
    getApprovalRateByMonth(supabase, tenantId, monthsBack),
    getAvgTimeToDecision(supabase, tenantId, monthsBack),
    getRiskBandDistribution(supabase, tenantId, monthsBack),
    getDocumentRejectionByType(supabase, tenantId, monthsBack),
    getScreeningHitRate(supabase, tenantId, monthsBack),
  ]);

  const totalReceived = volume.reduce((s, r) => s + r.received, 0);
  const totalCompleted = volume.reduce((s, r) => s + r.completed, 0);
  const totalAbandoned = volume.reduce((s, r) => s + r.abandoned, 0);
  const totalApproved = approval.reduce((s, r) => s + r.approved, 0);
  const totalRejected = approval.reduce((s, r) => s + r.rejected, 0);
  const totalDecisions = totalApproved + totalRejected;
  const approvalPct =
    totalDecisions > 0 ? Math.round((totalApproved / totalDecisions) * 100) : 0;

  const bandTotal = bandDist.reduce((s, r) => s + r.count, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Reporting</h1>
        <p className="text-sm text-gray-500 mt-1">
          Aggregate compliance metrics — last {monthsBack} months. No customer detail is shown.
        </p>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Received" value={totalReceived} />
        <Stat label="Completed" value={totalCompleted} />
        <Stat label="Abandoned" value={totalAbandoned} />
        <Stat label="Approval rate" value={`${approvalPct}%`} hint={`${totalDecisions} decisions`} />
        <Stat
          label="Screening hit rate"
          value={`${Math.round(hitRate.rate * 100)}%`}
          hint={`${hitRate.cases_with_hits} / ${hitRate.cases_total} cases`}
        />
      </div>

      {/* Monthly volume */}
      <Section title="Monthly onboarding volume">
        {volume.length === 0 ? (
          <Empty />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <Th>Month</Th>
                <Th align="right">Received</Th>
                <Th align="right">Completed</Th>
                <Th align="right">Abandoned</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {volume.map((row) => (
                <tr key={row.month}>
                  <Td>{row.month}</Td>
                  <Td align="right">{row.received}</Td>
                  <Td align="right">{row.completed}</Td>
                  <Td align="right">{row.abandoned}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Approval rate by month */}
      <Section title="Decisions by month">
        {approval.length === 0 ? (
          <Empty />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <Th>Month</Th>
                <Th align="right">Approved</Th>
                <Th align="right">Rejected</Th>
                <Th align="right">Pending</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {approval.map((row) => (
                <tr key={row.month}>
                  <Td>{row.month}</Td>
                  <Td align="right">{row.approved}</Td>
                  <Td align="right">{row.rejected}</Td>
                  <Td align="right">{row.pending}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Avg time-to-decision by risk band */}
        <Section title="Average time to decision (days)">
          {avgTime.length === 0 ? (
            <Empty />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <Th>Risk band</Th>
                  <Th align="right">Avg days</Th>
                  <Th align="right">Decisions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {avgTime.map((row) => (
                  <tr key={row.risk_band}>
                    <Td className="capitalize">{row.risk_band}</Td>
                    <Td align="right">{row.avg_days}</Td>
                    <Td align="right">{row.decisions}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Risk band distribution */}
        <Section title="Risk band distribution">
          {bandTotal === 0 ? (
            <Empty />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <Th>Band</Th>
                  <Th align="right">Count</Th>
                  <Th align="right">Share</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {RISK_BANDS.map((band) => {
                  const count = bandDist.find((r) => r.risk_band === band)?.count ?? 0;
                  const pct = bandTotal > 0 ? Math.round((count / bandTotal) * 100) : 0;
                  return (
                    <tr key={band}>
                      <Td className="capitalize">{band}</Td>
                      <Td align="right">{count}</Td>
                      <Td align="right">{pct}%</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Section>
      </div>

      {/* Document rejections */}
      <Section title="Rejected documents by type">
        {docTypes.length === 0 ? (
          <Empty />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <Th>Document type</Th>
                <Th align="right">Rejections</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docTypes.map((row) => (
                <tr key={row.document_type}>
                  <Td className="capitalize">{row.document_type.replace(/_/g, ' ')}</Td>
                  <Td align="right">{row.count}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <p className="mt-6 text-xs text-gray-400">
        Granular rejection reasons are recorded in the document event log; only document-type
        aggregates are surfaced here.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Empty() {
  return <div className="p-6 text-sm text-gray-400">No data in this window.</div>;
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={`px-4 py-2 font-medium text-gray-600 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-2 text-gray-700 ${
        align === 'right' ? 'text-right tabular-nums' : ''
      } ${className}`}
    >
      {children}
    </td>
  );
}
