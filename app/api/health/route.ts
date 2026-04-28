import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Liveness + dependency probe used by external monitors and the on-call
 * runbook (see `docs/RUNBOOK.md` §2.1).
 *
 * Public, unauthenticated. Returns:
 *   - 200 { ok: true, db: "ok" }                 — app + DB reachable
 *   - 503 { ok: false, db: "unreachable", ... }  — DB query failed
 *
 * The DB check uses the anon-keyed server client and a trivial RLS-allowed
 * SELECT (`roles` is publicly readable per migration 0002). It does NOT
 * touch any tenant-scoped table, so there is no risk of leaking tenant data
 * via this endpoint.
 *
 * Response payload contains no PII and no environment details.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('roles').select('name', { head: true, count: 'exact' });
    if (error) {
      return NextResponse.json(
        { ok: false, db: 'unreachable', latency_ms: Date.now() - startedAt },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { ok: true, db: 'ok', latency_ms: Date.now() - startedAt },
      {
        status: 200,
        // Cache discouraged so monitors hit a fresh check every poll.
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch {
    return NextResponse.json(
      { ok: false, db: 'unreachable', latency_ms: Date.now() - startedAt },
      { status: 503 },
    );
  }
}
