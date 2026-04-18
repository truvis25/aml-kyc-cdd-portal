'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const QUEUES = [
  { value: '', label: 'All Queues' },
  { value: 'standard', label: 'Standard' },
  { value: 'edd', label: 'EDD' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'senior', label: 'Senior' },
];

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In Review' },
  { value: 'pending_info', label: 'Pending Info' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export function CaseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/cases?${params.toString()}`);
  }

  return (
    <div className="flex gap-3 flex-wrap">
      <select
        value={searchParams.get('queue') ?? ''}
        onChange={(e) => update('queue', e.target.value)}
        className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {QUEUES.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
      </select>
      <select
        value={searchParams.get('status') ?? ''}
        onChange={(e) => update('status', e.target.value)}
        className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </div>
  );
}
