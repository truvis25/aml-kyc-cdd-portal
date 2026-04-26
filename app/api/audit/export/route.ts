import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import * as audit from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'audit:export');

    const sp = request.nextUrl.searchParams;
    const from_date = sp.get('from') ?? undefined;
    const to_date = sp.get('to') ?? undefined;
    const event_type = sp.get('event_type') as AuditEventType | undefined ?? undefined;
    const entity_type = sp.get('entity_type') as AuditEntityType | undefined ?? undefined;

    const jsonl = await audit.exportAsJsonL({
      tenant_id: auth.user.tenant_id,
      from_date,
      to_date,
      event_type,
      entity_type,
      limit: 10000,
    });

    const filename = `audit-export-${new Date().toISOString().slice(0, 10)}.jsonl`;

    return new NextResponse(jsonl, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
