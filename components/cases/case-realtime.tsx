'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  tenantId: string;
  /**
   * If provided, only INSERT/UPDATE events on cases matching `assigned_to`
   * will trigger a refresh. Use this on analyst/senior_reviewer queues so
   * the page only reacts to relevant changes. Omit on MLRO / tenant_admin
   * queues that show all cases.
   */
  assignedTo?: string;
}

/**
 * Subscribes to Postgres changes on the `cases` table for the current tenant
 * and calls router.refresh() when a relevant change arrives. The server
 * component re-runs and returns the freshly queried HTML, replacing the list
 * without a full page reload.
 *
 * RLS still applies on the Realtime channel: the browser client uses the
 * authenticated session, so cross-tenant rows are never delivered.
 */
export function CaseRealtime({ tenantId, assignedTo }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`cases:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cases',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          // If we're scoped to a single user's queue, ignore changes that
          // don't touch their assignment.
          if (assignedTo) {
            type CaseRow = { assigned_to?: string | null };
            const newRow = (payload.new ?? {}) as CaseRow;
            const oldRow = (payload.old ?? {}) as CaseRow;
            if (newRow.assigned_to !== assignedTo && oldRow.assigned_to !== assignedTo) {
              return;
            }
          }
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, assignedTo, router]);

  return null;
}
