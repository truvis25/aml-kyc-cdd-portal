'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FilterPill {
  label: string;
  href: string;
  count?: number;
}

interface FilterPillsClientProps {
  pills: FilterPill[];
  className?: string;
}

/**
 * Quick-filter pill navigation for the MLRO dashboard queue.
 * Each pill navigates to /cases?filter=<type> using Next.js Link.
 * Client component to allow active-state highlighting based on URL in future.
 */
export function FilterPillsClient({ pills, className }: FilterPillsClientProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="navigation" aria-label="Queue filters">
      {pills.map((pill) => (
        <Link
          key={pill.label}
          href={pill.href}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          {pill.label}
          {pill.count !== undefined && (
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs tabular-nums text-gray-600">
              {pill.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
