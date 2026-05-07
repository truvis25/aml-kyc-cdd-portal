'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type ReadOnlyRange = '30d' | '90d' | 'ytd';

const RANGES: { value: ReadOnlyRange; label: string }[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'ytd', label: 'YTD' },
];

interface RangeSelectorClientProps {
  activeRange: ReadOnlyRange;
  className?: string;
}

/**
 * Client component: time range selector for the Read-Only reporting dashboard.
 * Writes the selected range into the URL search param "range".
 * Triggers a server re-render via Next.js navigation.
 */
export function RangeSelectorClient({ activeRange, className }: RangeSelectorClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(value: ReadOnlyRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-100 p-0.5',
        className,
      )}
      role="group"
      aria-label="Reporting time range"
    >
      {RANGES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={activeRange === value}
          onClick={() => navigate(value)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            activeRange === value
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
