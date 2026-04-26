'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

const EVENT_TYPE_GROUPS = [
  { label: 'Session', values: ['session.initiated', 'session.completed', 'session.abandoned'] },
  { label: 'Customer', values: ['customer.created', 'customer.field_changed'] },
  { label: 'Document', values: ['document.uploaded', 'document.accepted', 'document.rejected'] },
  { label: 'KYC/KYB', values: ['kyc.initiated', 'kyc.passed', 'kyc.failed', 'kyb.initiated'] },
  { label: 'Screening', values: ['screening.initiated', 'screening.completed', 'screening.hit_resolved'] },
  { label: 'Risk', values: ['risk.score_computed'] },
  { label: 'Case', values: ['case.created', 'case.assigned', 'case.note_added', 'case.escalated', 'case.decision_recorded', 'case.sar_flagged', 'case.sar_unflagged'] },
  { label: 'Approval', values: ['approval.granted', 'approval.rejected'] },
  { label: 'User', values: ['user.invited', 'user.signed_in', 'user.signed_out', 'user.role_assigned'] },
  { label: 'Admin', values: ['admin.config_changed', 'admin.workflow_activated'] },
];

const ENTITY_TYPES = [
  'documents', 'customers', 'cases', 'onboarding_sessions',
  'screening_hits', 'risk_assessments', 'approvals', 'users',
];

interface Props {
  canExport: boolean;
}

export function AuditFilters({ canExport }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const eventType = searchParams.get('event_type') ?? '';
  const entityType = searchParams.get('entity_type') ?? '';
  const page = searchParams.get('page') ?? '1';

  const buildParams = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(eventType ? { event_type: eventType } : {}),
        ...(entityType ? { entity_type: entityType } : {}),
        page,
        ...overrides,
      });
      // Remove empty keys
      for (const [k, v] of Array.from(params.entries())) {
        if (!v) params.delete(k);
      }
      return params.toString();
    },
    [from, to, eventType, entityType, page]
  );

  function handleChange(key: string, value: string) {
    router.push(`${pathname}?${buildParams({ [key]: value, page: '1' })}`);
  }

  function handleClear() {
    router.push(pathname);
  }

  const hasFilters = from || to || eventType || entityType;

  const exportUrl = `/api/audit/export?${new URLSearchParams({
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(eventType ? { event_type: eventType } : {}),
    ...(entityType ? { entity_type: entityType } : {}),
  }).toString()}`;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => handleChange('from', e.target.value)}
          className="rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => handleChange('to', e.target.value)}
          className="rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Event type</label>
        <select
          value={eventType}
          onChange={(e) => handleChange('event_type', e.target.value)}
          className="rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="">All events</option>
          {EVENT_TYPE_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.values.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Entity type</label>
        <select
          value={entityType}
          onChange={(e) => handleChange('entity_type', e.target.value)}
          className="rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="">All entities</option>
          {ENTITY_TYPES.map((et) => (
            <option key={et} value={et}>{et}</option>
          ))}
        </select>
      </div>
      {hasFilters && (
        <button
          onClick={handleClear}
          className="rounded px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          Clear
        </button>
      )}
      {canExport && (
        <a
          href={exportUrl}
          download
          className="ml-auto rounded px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
        >
          Export JSON-L
        </a>
      )}
    </div>
  );
}
