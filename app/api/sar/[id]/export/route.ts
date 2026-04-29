import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { exportSarAsXml } from '@/modules/sar';
import { log } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'cases:flag_sar');

    const { id } = await ctx.params;
    const { xml, filename } = await exportSarAsXml(
      { tenantId: auth.user.tenant_id, userId: auth.user.id, role: auth.user.role },
      id,
    );

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof Error && err.message === 'SAR not found') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    log.error('GET /api/sar/[id]/export error', { code: 'sar_export_failed' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
