import { DashboardSkeleton } from '@/components/dashboards/widgets/skeleton';

/**
 * Next.js streaming loading UI for the dashboard route.
 * Shown while `page.tsx` resolves its async data fetches.
 */
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
