import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { createApplicant } from '@/modules/sumsub';
import { createClient } from '@/lib/supabase/server';

const StartIDVSchema = z.object({
  onboardingSessionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const auth = await requireAuth();
    if (!auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body = await req.json();
    const { onboardingSessionId } = StartIDVSchema.parse(body);

    // Load session and validate ownership
    const db = await createClient();
    const { data: sessionData, error: sessionError } = await db
      .from('onboarding_sessions')
      .select('id, customer_id, tenant_id')
      .eq('id', onboardingSessionId)
      .eq('tenant_id', auth.user.tenant_id)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionData as { id: string; customer_id: string; tenant_id: string };

    // Load customer for name/email
    const { data: customerData, error: customerError } = await db
      .from('customers')
      .select('id, individual_kyc')
      .eq('id', session.customer_id)
      .single();

    if (customerError || !customerData) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = customerData as { id: string; individual_kyc: { first_name?: string; last_name?: string; email?: string } | null };

    // Extract name and email from individual_kyc
    const kyc = customer.individual_kyc;
    if (!kyc?.first_name || !kyc?.last_name || !kyc?.email) {
      return NextResponse.json(
        { error: 'Customer identity data incomplete; please complete identity form first' },
        { status: 400 }
      );
    }

    // Create Sumsub applicant
    const result = await createApplicant({
      onboardingSessionId,
      firstName: kyc.first_name,
      lastName: kyc.last_name,
      email: kyc.email,
      tenantId: auth.user.tenant_id,
      customerId: customer.id,
    });

    return NextResponse.json(
      {
        applicantId: result.applicantId,
        accessToken: result.accessToken,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Return 400 for validation errors, 500 for others
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    if (message.includes('Sumsub')) {
      return NextResponse.json(
        { error: 'IDV service unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
