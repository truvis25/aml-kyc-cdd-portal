import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/modules/auth/auth.service';
import { getApplicantStatus } from '@/modules/sumsub';
import { createClient } from '@/lib/supabase/server';

const StatusIDVSchema = z.object({
  onboardingSessionId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate
    const auth = await requireAuth();
    if (!auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const searchParams = req.nextUrl.searchParams;
    const onboardingSessionId = searchParams.get('sessionId');

    const { onboardingSessionId: validatedSessionId } = StatusIDVSchema.parse({
      onboardingSessionId: onboardingSessionId || '',
    });

    // Load applicant
    const db = await createClient();
    const { data: applicant, error: appError } = await db
      .from('sumsub_applicants')
      .select(
        `
        id,
        sumsub_applicant_id,
        verification_status,
        review_result,
        onboarding_session_id,
        onboarding_sessions!inner(tenant_id)
      `
      )
      .eq('onboarding_session_id', validatedSessionId)
      .eq('onboarding_sessions.tenant_id', auth.user.tenant_id)
      .single();

    if (appError || !applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    const typedApplicant = applicant as {
      id: string;
      sumsub_applicant_id: string;
      verification_status: string;
      review_result: Record<string, unknown> | null;
    };

    // Get fresh status from Sumsub if still pending
    if (typedApplicant.verification_status === 'pending') {
      const status = await getApplicantStatus({
        onboardingSessionId: validatedSessionId,
        sumsubApplicantId: typedApplicant.sumsub_applicant_id,
      });

      return NextResponse.json(
        {
          status: status.reviewStatus === 'approved' ? 'approved' : 'pending',
          verified: status.isApproved,
          reviewStatus: status.reviewStatus,
          reviewResult: status.reviewResult,
        },
        { status: 200 }
      );
    }

    // Return stored result
    return NextResponse.json(
      {
        status: typedApplicant.verification_status,
        verified: typedApplicant.verification_status === 'approved',
        reviewResult: typedApplicant.review_result,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
