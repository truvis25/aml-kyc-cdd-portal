import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'screening:read');

    const customerId = request.nextUrl.searchParams.get('customer_id');
    if (!customerId) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: hits, error } = await supabase
      .from('screening_hits')
      .select('id, hit_type, match_name, match_score, status, created_at, raw_data')
      .eq('customer_id', customerId)
      .eq('tenant_id', auth.user.tenant_id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ hits: hits ?? [] });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
