import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { initiateUpload } from '@/modules/documents/documents.service';
import { UploadUrlRequestSchema } from '@/lib/validations/documents';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'onboarding:write');

    const body = await request.json();
    const parsed = UploadUrlRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await initiateUpload(parsed.data, auth.user.tenant_id, auth.user.id);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('POST /api/documents/upload-url error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
