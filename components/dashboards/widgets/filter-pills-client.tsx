'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface FilterPill {
  label: string;
  filter: string;
  count?: number;
  urgent?: boolean;
}

interface FilterPillsClientProps {
  pills: FilterPill[];
  basePath?: string;
  className?: string;
}

/**
 * Client component: renders a row of filter pill buttons.
 * Each pill navigates to `basePath?filter=<filter>` (default basePath="/cases").
 * No PII is passed through these pills — only filter key names and counts.
 */
export function FilterPillsClient({
  pills,
  basePath = '/cases',
  className,
}: FilterPillsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(filter: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('filter', filter);
    router.push(`${basePath}?${params.toString()}`);
  }

  const currentFilter = searchParams.get('filter');

  return (
    <div
      className={cn('flex flex-wrap gap-2', className)}
      role="group"
      aria-label="Case queue filters"
    >
      {pills.map((pill) => {
        const isActive = currentFilter === pill.filter && pathname.startsWith(basePath);
        return (
          <button
            key={pill.filter}
            type="button"
            onClick={() => navigate(pill.filter)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                : pill.urgent
                  ? 'border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-400 hover:bg-orange-100'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
            )}
          >
            {pill.label}
            {pill.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none',
                  isActive
                    ? 'bg-white/20 text-white'
                    : pill.urgent && pill.count > 0
                      ? 'bg-orange-200 text-orange-800'
                      : 'bg-gray-100 text-gray-600',
                )}
              >
                {pill.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
