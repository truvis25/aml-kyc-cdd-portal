import { Suspense } from 'react';
import Link from 'next/link';
import { hasPermission } from '@/modules/auth/rbac';
import { getPageAuth } from '@/lib/auth/page-auth';
import { AuditFilters } from '@/components/audit/audit-filters';
import * as audit from '@/modules/audit/audit.service';
import type { AuditEventType, AuditEntityType } from '@/lib/constants/events';

const PAGE_SIZE = 50;

const EVENT_COLORS: Record<string, string> = {
  'kyc.initiated':          'text-blue-600',
  'kyb.initiated':          'text-blue-600',
  'case.created':           'text-purple-600',
  'case.decision_recorded': 'text-green-600',
  'case.escalated':         'text-orange-600',
  'case.sar_flagged':       'text-red-600',
  'document.uploaded':      'text-teal-600',
  'document.accepted':      'text-green-600',
  'document.rejected':      'text-red-600',
  'screening.hit_resolved': 'text-yellow-600',
  'user.invited':           'text-indigo-600',
  'user.role_assigned':     'text-indigo-600',
  'user.signed_in':         'text-gray-500',
};

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    event_type?: string;
    entity_type?: string;
    page?: string;
  }>;
}

export default async function AuditPage({ searchParams }: PageProps) {
  const { role, tenantId: tenant_id } = await getPageAuth();

  if (!hasPermission(role, 'audit:read')) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm font-medium text-red-900">Access denied</p>
        <p className="text-sm text-red-700 mt-1">You do not have permission to view the audit trail.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10));
  const offset = (currentPage - 1) * PAGE_SIZE;

  const entries = await audit.query({
    tenant_id,
    from_date: sp.from,
    to_date: sp.to ? `${sp.to}T23:59:59Z` : undefined,
    event_type: sp.event_type as AuditEventType | undefined,
    entity_type: sp.entity_type as AuditEntityType | undefined,
    limit: PAGE_SIZE + 1, // fetch one extra to detect if there's a next page
    offset,
  });

  const hasNextPage = entries.length > PAGE_SIZE;
  const pageEntries = hasNextPage ? entries.slice(0, PAGE_SIZE) : entries;

  const canExport = hasPermission(role, 'audit:export');

  function buildPageUrl(p: number) {
    const params = new URLSearchParams({
      ...(sp.from ? { from: sp.from } : {}),
      ...(sp.to ? { to: sp.to } : {}),
      ...(sp.event_type ? { event_type: sp.event_type } : {}),
      ...(sp.entity_type ? { entity_type: sp.entity_type } : {}),
      page: String(p),
    });
    return `/audit?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-1">Immutable record of all platform activity</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-white border border-gray-200 shadow-sm p-4">
        <Suspense>
          <AuditFilters canExport={canExport} />
        </Suspense>
      </div>

      {pageEntries.length === 0 ? (
        <div className="rounded-lg bg-white border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No audit events match your filters.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg bg-white border border-gray-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {pageEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                      {new Date(e.event_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                      <span className={EVENT_COLORS[e.event_type] ?? 'text-gray-700'}>
                        {e.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 capitalize">
                      {(e.actor_role ?? 'system').replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      <span className="text-gray-400">{e.entity_type} </span>
                      <span className="font-mono">{(e.entity_id ?? '').slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">
                      {e.ip_address ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {offset + 1}–{offset + pageEntries.length}
              {!hasNextPage && currentPage === 1 ? '' : ''}
            </span>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={buildPageUrl(currentPage - 1)}
                  className="rounded px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {hasNextPage && (
                <Link
                  href={buildPageUrl(currentPage + 1)}
                  className="rounded px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
