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
} from '@/modules/dashboards/queries';

interface Props {
  userId: string;
}

export async function AnalystDashboard({ userId }: Props) {
  const supabase = await createClient();

  const [open, pendingInfo, docsToVerify, hitsToResolve] = await Promise.all([
    countCasesAssignedTo(supabase, userId, { openOnly: true }),
    countCasesAssignedToWithStatus(supabase, userId, ['pending_info']),
    countPendingDocsForUser(supabase, userId),
    countUnresolvedHitsForUser(supabase, userId),
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

      <div className="mt-6">
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
