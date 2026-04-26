import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Temporary diagnostic endpoint — remove after debugging is complete
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

    return NextResponse.json({
      has_user: !!user,
      user_id: user?.id ?? null,
      user_error: userError?.message ?? null,
      has_claims: !!claimsData?.claims,
      tenant_id: (claimsData?.claims as Record<string, unknown> | null)?.tenant_id ?? null,
      role: (claimsData?.claims as Record<string, unknown> | null)?.role ?? null,
      claims_error: claimsError?.message ?? null,
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
