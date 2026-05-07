import { TableSkeleton } from '@/components/ui/skeleton';

export default function CasesLoading() {
  return (
    <div className="p-6">
      <div className="mb-6 h-7 w-32 animate-pulse rounded-md bg-gray-200/70" />
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
