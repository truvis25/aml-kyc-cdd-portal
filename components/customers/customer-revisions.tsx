'use client';

import { useState } from 'react';

export interface CustomerRevisionRow {
  version: number;
  created_at: string;
  submitted_by_name: string | null;
  /** Field names that changed compared to the previous version. */
  changed_fields: string[];
}

interface Props {
  rows: CustomerRevisionRow[];
}

/**
 * Read-only timeline of customer_data_versions for the customer detail page.
 * Renders only the field NAMES that changed in each version, not the values
 * — values are PII and would re-leak through the audit surface. Reviewers
 * can already inspect the latest values via the Identity / EDD panels.
 */
export function CustomerRevisions({ rows }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) {
    return null;
  }

  const visible = expanded ? rows : rows.slice(0, 3);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Data Revisions</h2>
        {rows.length > 3 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-blue-600 hover:underline"
          >
            {expanded ? 'Show less' : `Show all (${rows.length})`}
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {visible.map((r) => (
          <li key={r.version} className="text-xs">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-medium text-gray-900">Version {r.version}</p>
              <p className="text-gray-400">{new Date(r.created_at).toLocaleString()}</p>
            </div>
            <p className="text-gray-500 mt-0.5">
              {r.submitted_by_name ?? 'system'}
              {r.changed_fields.length > 0
                ? ` · changed ${r.changed_fields.length} field${
                    r.changed_fields.length === 1 ? '' : 's'
                  }`
                : ' · initial submission'}
            </p>
            {r.changed_fields.length > 0 && (
              <p className="text-gray-400 text-[11px] mt-0.5 font-mono">
                {r.changed_fields.join(', ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
