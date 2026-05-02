import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { createClient } from '@/lib/supabase/server';
import { getLatestTenantConfig } from '@/modules/admin-config/admin-config.service';
import { initiateAuthentication, readUaePassConfig, UaePassError } from '@/modules/auth/uae-pass';

const StartSchema = z.object({
  onboardingSessionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();

    const body = await req.json().catch(() => ({}));
    const { onboardingSessionId } = StartSchema.parse(body);

    const envStatus = readUaePassConfig();
    if (!envStatus.configured) {
      return NextResponse.json(
        { error: 'UAE Pass is not configured for this deployment.', reason: envStatus.reason },
        { status: 503 },
      );
    }

    const config = await getLatestTenantConfig(auth.user.tenant_id);
    if (!config.config.uae_pass.enabled) {
      return NextResponse.json(
        { error: 'UAE Pass is not enabled for this tenant.' },
        { status: 403 },
      );
    }

    // Confirm the session belongs to the caller's tenant before issuing state.
    const db = await createClient();
    const { data: sessionRow, error: sessionErr } = await db
      .from('onboarding_sessions')
      .select('id, tenant_id, status')
      .eq('id', onboardingSessionId)
      .eq('tenant_id', auth.user.tenant_id)
      .maybeSingle();
    if (sessionErr) {
      return NextResponse.json({ error: 'Failed to load onboarding session' }, { status: 500 });
    }
    if (!sessionRow) {
      return NextResponse.json({ error: 'Onboarding session not found' }, { status: 404 });
    }
    const session = sessionRow as { id: string; tenant_id: string; status: string };
    if (session.status === 'submitted' || session.status === 'approved') {
      return NextResponse.json(
        { error: 'Onboarding session is already complete' },
        { status: 409 },
      );
    }

    const result = await initiateAuthentication({
      tenantId: auth.user.tenant_id,
      onboardingSessionId,
      requiredAssuranceLevel: config.config.uae_pass.required_assurance_level,
      actorId: auth.user.id,
    });

    return NextResponse.json(
      {
        authorizationUrl: result.authorizationUrl,
        authenticationId: result.authenticationId,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: err.issues },
        { status: 400 },
      );
    }
    if (err instanceof UaePassError) {
      const status = err.code === 'not_configured' ? 503 : 500;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
