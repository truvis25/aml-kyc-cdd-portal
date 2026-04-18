import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { getDocumentWithUrl, confirmUpload } from '@/modules/documents/documents.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'documents:read');

    const { id } = await params;
    const result = await getDocumentWithUrl(id, auth.user.tenant_id, auth.user.id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg === 'Document not found') return NextResponse.json({ error: msg }, { status: 404 });
    console.error('GET /api/documents/[id] error:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Called after the client finishes the Storage upload
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'onboarding:write');

    const { id } = await params;
    const document = await confirmUpload(id, auth.user.tenant_id, auth.user.id);
    return NextResponse.json({ document });
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg === 'Document not found') return NextResponse.json({ error: msg }, { status: 404 });
    console.error('POST /api/documents/[id] error:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
