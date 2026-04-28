import { NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

export async function POST() {
  try {
    const auth = await requireAuth();
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('users')
      .update({ mfa_enabled: true })
      .eq('id', auth.user.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to finalize MFA setup.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    log.error('MFA completion route error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
