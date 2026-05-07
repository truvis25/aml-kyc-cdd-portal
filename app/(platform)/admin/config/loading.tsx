import { TableSkeleton } from '@/components/ui/skeleton';
import { StatCardSkeleton } from '@/components/ui/skeleton';

export default function AdminConfigLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-7 w-36 animate-pulse rounded-md bg-gray-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <StatCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={5} cols={4} />
    </div>
  );
}
