import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Role } from '@/lib/constants/roles';
import { DashboardShell } from './dashboard-shell';
import { StatCard } from './widgets/stat-card';
import { QueueSummary } from './widgets/queue-summary';
import { EmptyState } from './widgets/empty-state';
import {
  countCasesAssignedTo,
  countCasesAssignedToWithStatus,
  countPendingDocsForUser,
  countUnresolvedHitsForUser,
  getPendingRaiCount,
  getRecentDocumentInbox,
  getAnalystSlaRate,
  type DocumentInboxRow,
} from '@/modules/dashboards/queries';

interface Props {
  userId: string;
}

function formatUploadedAt(iso: string): string {
  const minutesAgo = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60));
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  return `${Math.floor(hoursAgo / 24)}d ago`;
}

interface DocumentInboxListProps {
  docs: DocumentInboxRow[];
}

function DocumentInboxList({ docs }: DocumentInboxListProps) {
  if (docs.length === 0) {
    return <p className="text-sm text-gray-400">No new documents in the last 7 days.</p>;
  }
  return (
    <ul className="divide-y divide-gray-100">
      {docs.map((doc) => (
        <li key={doc.documentId}>
          <Link
            href={`/cases/${doc.caseId}/documents`}
            className="flex items-center justify-between py-2 text-sm hover:bg-gray-50 -mx-2 px-2 rounded"
          >
            <div>
              <p className="text-gray-900 font-mono text-xs">{doc.documentId.slice(0, 8)}…</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Case: {doc.caseId.slice(0, 8)}… · {formatUploadedAt(doc.uploadedAt)}
              </p>
            </div>
            <span className="text-xs font-medium text-blue-600">Verify →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

interface SlaGaugeProps {
  rate: number;
}

function SlaGauge({ rate }: SlaGaugeProps) {
  const color = rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500';
  const textColor =
    rate >= 80 ? 'text-green-700' : rate >= 60 ? 'text-amber-700' : 'text-red-700';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">SLA (48h)</span>
        <span className={`text-sm font-semibold tabular-nums ${textColor}`}>{rate}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${rate}%` }}
          aria-label={`SLA rate: ${rate}%`}
        />
      </div>
      <p className="mt-1 text-xs text-gray-400">
        % of closed cases resolved within 48h of assignment
      </p>
    </div>
  );
}

export async function AnalystDashboard({ userId }: Props) {
  const supabase = await createClient();

  const [open, pendingInfo, docsToVerify, hitsToResolve, pendingRai, docInbox, slaRate] =
    await Promise.all([
      countCasesAssignedTo(supabase, userId, { openOnly: true }),
      countCasesAssignedToWithStatus(supabase, userId, ['pending_info']),
      countPendingDocsForUser(supabase, userId),
      countUnresolvedHitsForUser(supabase, userId),
      getPendingRaiCount(supabase, userId),
      getRecentDocumentInbox(supabase, userId, 5),
      getAnalystSlaRate(supabase, userId),
    ]);

  return (
    <DashboardShell
      title="My Workload"
      subtitle="Cases, documents and screening hits assigned to you"
      role={Role.ANALYST}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Open Cases" value={open} href="/cases" />
        <StatCard
          label="Documents to Verify"
          value={docsToVerify}
          urgent={docsToVerify > 0}
          hint="Across my cases"
        />
        <StatCard
          label="Hits to Resolve"
          value={hitsToResolve}
          urgent={hitsToResolve > 0}
          hint="Pending screening hits"
        />
        <StatCard
          label="Pending Info"
          value={pendingInfo}
          hint="Waiting on the customer"
          href="/cases?status=pending_info"
        />
      </div>

      {/* Pending RAI responses */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending RAI Responses"
          value={pendingRai}
          hint="Customer responses awaited"
          urgent={pendingRai > 0}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Document inbox */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Document inbox (last 7 days)
          </h3>
          <DocumentInboxList docs={docInbox} />
        </div>

        {/* SLA gauge + quick actions */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Personal SLA</h3>
          <SlaGauge rate={slaRate} />
        </div>

        {open === 0 ? (
          <EmptyState
            title="Your queue is empty"
            body="No open cases are assigned to you. Check back after the next onboarding batch is processed."
          />
        ) : (
          <QueueSummary
            title="Quick actions"
            rows={[
              { label: 'Go to my queue', value: '→', href: '/cases' },
              { label: 'Customer lookup', value: '→', href: '/customers' },
            ]}
          />
        )}
      </div>
    </DashboardShell>
  );
}
