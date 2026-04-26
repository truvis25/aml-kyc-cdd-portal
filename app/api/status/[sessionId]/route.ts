import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { searchParams } = request.nextUrl;
  const tenantSlug = searchParams.get('tenantSlug');

  if (!tenantSlug) {
    return NextResponse.json({ error: 'tenantSlug required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', tenantSlug)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: rawSession } = await supabase
    .from('onboarding_sessions')
    .select('id, status, customer_id, step_data, created_at, updated_at')
    .eq('id', sessionId)
    .eq('tenant_id', (tenant as { id: string }).id)
    .maybeSingle();

  if (!rawSession) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const session = rawSession as {
    id: string;
    status: string;
    customer_id: string;
    step_data: unknown;
    created_at: string;
    updated_at: string | null;
  };

  const tenantData = tenant as { id: string; name: string };

  const [docsResult, casesResult] = await Promise.all([
    supabase
      .from('documents')
      .select('id, document_type, status, file_name, uploaded_at')
      .eq('customer_id', session.customer_id)
      .eq('tenant_id', tenantData.id)
      .order('uploaded_at', { ascending: true }),
    supabase
      .from('cases')
      .select('id, status, opened_at')
      .eq('customer_id', session.customer_id)
      .eq('tenant_id', tenantData.id)
      .order('opened_at', { ascending: false })
      .limit(1),
  ]);

  return NextResponse.json({
    tenant: { name: tenantData.name },
    session: {
      id: session.id,
      status: session.status,
      step_data: session.step_data,
      created_at: session.created_at,
      updated_at: session.updated_at,
    },
    documents: (docsResult.data ?? []).map((d) => ({
      id: (d as { id: string }).id,
      document_type: (d as { document_type: string }).document_type,
      status: (d as { status: string }).status,
      file_name: (d as { file_name: string }).file_name,
      uploaded_at: (d as { uploaded_at: string }).uploaded_at,
    })),
    latestCase: (casesResult.data?.[0] ?? null) as {
      id: string;
      status: string;
      opened_at: string;
    } | null,
  });
}
