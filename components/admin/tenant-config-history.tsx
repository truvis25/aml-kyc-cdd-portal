'use client';

import { useState } from 'react';
import type { TenantConfigRow } from '@/modules/admin-config/types';

interface Props {
  versions: TenantConfigRow[];
  authorById: Record<string, string>;
}

/**
 * Read-only chronological view of `tenant_config` versions. Click a row to
 * expand the JSON snapshot. Future enhancement: side-by-side diff between
 * adjacent versions.
 */
export function TenantConfigHistory({ versions, authorById }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (versions.length === 0) {
    return (
      <div className="rounded-lg bg-white border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-medium text-gray-900">Configuration history</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500">
            No persisted versions yet. Saving via the form above creates the first
            tenant_config row.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-medium text-gray-900">Configuration history</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Most recent {versions.length} versions. Click any row to inspect the saved JSON.
        </p>
      </div>
      <ul className="divide-y divide-gray-100">
        {versions.map((v) => {
          const author = v.created_by ? (authorById[v.created_by] ?? v.created_by.slice(0, 8)) : 'system';
          const open = openId === v.config_id;
          return (
            <li key={v.config_id}>
              <button
                onClick={() => setOpenId(open ? null : v.config_id)}
                className="w-full flex items-start justify-between gap-4 px-6 py-3 text-left hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">Version {v.version}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(v.created_at).toLocaleString()} · {author}
                    {v.notes ? ` · ${v.notes}` : ''}
                  </p>
                </div>
                <span className="text-xs text-blue-600 shrink-0">{open ? 'Hide JSON' : 'View JSON'}</span>
              </button>
              {open && (
                <pre className="mx-6 mb-3 overflow-x-auto rounded bg-gray-50 border border-gray-200 p-3 text-[11px] text-gray-700">
                  {JSON.stringify(v.config, null, 2)}
                </pre>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
