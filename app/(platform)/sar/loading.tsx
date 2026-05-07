import { TableSkeleton } from '@/components/ui/skeleton';

export default function SarLoading() {
  return (
    <div className="p-6">
      <div className="mb-6 h-7 w-36 animate-pulse rounded-md bg-gray-200/70" />
      <TableSkeleton rows={6} cols={7} />
    </div>
  );
}
