'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type Period = 'today' | 'week' | 'month';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: '7 days' },
  { value: 'month', label: '30 days' },
];

interface PeriodToggleProps {
  /** The currently active period (controlled from URL search param `period`). */
  activePeriod: Period;
  /** URL search-param key — default "period". */
  paramKey?: string;
  className?: string;
}

/**
 * Period toggle — today / 7 days / 30 days.
 *
 * Writes the selected period into the URL search param `period` (or `paramKey`).
 * Parent server components re-fetch with the new param on navigation.
 */
export function PeriodToggle({ activePeriod, paramKey = 'period', className }: PeriodToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(value: Period) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramKey, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-100 p-0.5',
        className,
      )}
      role="group"
      aria-label="Time period"
    >
      {PERIODS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={activePeriod === value}
          onClick={() => navigate(value)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            activePeriod === value
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
