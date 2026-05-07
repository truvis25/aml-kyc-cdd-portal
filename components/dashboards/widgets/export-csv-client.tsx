'use client';

import { cn } from '@/lib/utils';

/**
 * A single row in the CSV export. Keys become column headers.
 * Values must be primitive — no PII should be passed; use aggregate counts only.
 */
export type CsvRow = Record<string, string | number | boolean | null | undefined>;

interface ExportCsvClientProps {
  /** Aggregate data rows to serialise. Must contain NO PII. */
  rows: CsvRow[];
  /** File name without extension. */
  filename?: string;
  className?: string;
  label?: string;
}

function toCsv(rows: CsvRow[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number | boolean | null | undefined): string => {
    const s = v == null ? '' : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ];
  return lines.join('\r\n');
}

/**
 * Client component: "Export CSV" button.
 * On click, serialises `rows` to CSV and triggers a browser download.
 * This component only handles aggregate/non-PII data — callers must not pass
 * personally identifiable fields.
 */
export function ExportCsvClient({
  rows,
  filename = 'dashboard-export',
  className,
  label = 'Export CSV',
}: ExportCsvClientProps) {
  function handleExport() {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600',
        'hover:border-gray-300 hover:bg-gray-50 transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M4 2a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 0-.44-1.06L9.94 2.439A1.5 1.5 0 0 0 8.878 2H4Zm4 9.5a.75.75 0 0 1-.75-.75V8.56l-.72.72a.75.75 0 1 1-1.06-1.06l2-2a.75.75 0 0 1 1.06 0l2 2a.75.75 0 1 1-1.06 1.06l-.72-.72v2.19a.75.75 0 0 1-.75.75Z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </button>
  );
}
