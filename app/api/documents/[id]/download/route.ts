import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { getDocumentWithUrl } from '@/modules/documents/documents.service';

// Returns a redirect to the 15-min signed download URL.
// Used by the case detail page document links so analysts open the file directly.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'documents:read');

    const { id } = await params;
    const { download_url } = await getDocumentWithUrl(id, auth.user.tenant_id, auth.user.id);

    return NextResponse.redirect(download_url.download_url);
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg === 'Document not found') return NextResponse.json({ error: msg }, { status: 404 });
    console.error('GET /api/documents/[id]/download error:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
