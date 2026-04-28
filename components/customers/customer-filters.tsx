'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
];

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'individual', label: 'Individual' },
  { value: 'corporate', label: 'Corporate' },
];

export function CustomerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');

  // Push search updates with a small debounce so we don't refetch on every
  // keystroke. URL stays the source of truth — paging / filters survive.
  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search.trim()) {
        params.set('q', search.trim());
      } else {
        params.delete('q');
      }
      // Clear page when search changes so we don't show "page 4" of the new
      // result set.
      params.delete('page');
      router.push(`/customers?${params.toString()}`);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/customers?${params.toString()}`);
  }

  return (
    <div className="flex gap-3 flex-wrap items-center">
      <input
        type="search"
        placeholder="Search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-9 w-56 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <select
        value={searchParams.get('type') ?? ''}
        onChange={(e) => update('type', e.target.value)}
        className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
