import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded bg-gray-100', className)} />
  );
}

/**
 * Skeleton layout for a 4-stat-card + 2-panel grid.
 * Shown by the `loading.tsx` file next to `dashboard/page.tsx`.
 */
export function DashboardSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <Skeleton className="mb-8 h-7 w-28 rounded-full" />

      {/* Stat cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Lower panels */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <Skeleton className="mb-3 h-4 w-40" />
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="mt-3 h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Minimal single-card skeleton — for wrapping individual async widgets
 * in React Suspense fallbacks.
 */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <Skeleton className="mb-3 h-4 w-40" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="mt-3 h-4 w-full" />
      ))}
    </div>
  );
}
