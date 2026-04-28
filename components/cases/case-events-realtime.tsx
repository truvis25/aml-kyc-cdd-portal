'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  caseId: string;
  tenantId: string;
}

/**
 * Subscribes to inserts on `case_events` for a single case so the timeline,
 * status badge, and screening-hit panel re-render when a peer reviewer adds
 * a note, escalates, requests info, or resolves a hit. case_events is
 * append-only so we only listen for INSERT.
 *
 * Pairs with `<CaseRealtime />` on the same page (which listens to the
 * `cases` row itself for status/queue/assignment changes).
 */
export function CaseEventsRealtime({ caseId, tenantId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`case_events:${caseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_events',
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // tenantId not used in the filter (case_id is unique enough), but kept in
    // deps so a tenant-switch (theoretical) cleanly re-subscribes.
  }, [caseId, tenantId, router]);

  return null;
}
