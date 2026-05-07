'use client';

import { cn } from '@/lib/utils';

interface ExportCsvClientProps {
  /** Label for the button, defaults to "Export CSV". */
  label?: string;
  /** Filename without extension, defaults to "export". */
  filename?: string;
  /**
   * The data rows to serialise. Must be an array of flat objects whose
   * values are strings or numbers — no PII is expected here (aggregate only).
   */
  rows: Record<string, string | number>[];
  className?: string;
}

/**
 * Export-to-CSV button for the Read-Only dashboard.
 * Serialises the supplied rows prop to CSV and triggers a browser download.
 * Client component — uses DOM APIs (document.createElement, URL.createObjectURL).
 */
export function ExportCsvClient({ label = 'Export CSV', filename = 'export', rows, className }: ExportCsvClientProps) {
  function handleExport() {
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = String(row[h] ?? '');
            // Quote values that contain commas, quotes, or newlines
            return /[",\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
          })
          .join(','),
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    >
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {label}
    </button>
  );
}
