import { getSumsubClient } from './client';
import { createClient } from '@/lib/supabase/server';
import { emit } from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import type { CreateApplicantRequest } from './types';

/**
 * Create a new Sumsub applicant and store reference in database
 */
export async function createApplicant(input: {
  onboardingSessionId: string;
  firstName: string;
  lastName: string;
  email: string;
  tenantId: string;
  customerId: string;
}) {
  const sumsub = getSumsubClient();
  const db = await createClient();

  try {
    // Create applicant in Sumsub
    const applicantReq: CreateApplicantRequest = {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      externalUserId: input.onboardingSessionId, // Link back to our session
    };

    const applicant = await sumsub.createApplicant(applicantReq);

    // Generate access token for Web SDK
    const tokenRes = await sumsub.createAccessToken(applicant.id);

    // Store in database
    const { data, error } = await db
      .from('sumsub_applicants')
      .insert({
        onboarding_session_id: input.onboardingSessionId,
        sumsub_applicant_id: applicant.id,
        sumsub_access_token: tokenRes.token,
        verification_status: 'pending',
      })
      .select('id')
      .single();

    if (error) throw error;

    // Emit audit event
    await emit({
      tenant_id: input.tenantId,
      event_type: AuditEventType.KYC_INITIATED,
      entity_type: AuditEntityType.SESSION,
      entity_id: input.onboardingSessionId,
      payload: {
        applicantId: applicant.id,
      },
    });

    return {
      applicantId: applicant.id,
      accessToken: tokenRes.token,
      recordId: data.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Emit failed audit event
    await emit({
      tenant_id: input.tenantId,
      event_type: AuditEventType.KYC_FAILED,
      entity_type: AuditEntityType.SESSION,
      entity_id: input.onboardingSessionId,
      payload: { error: message },
    });

    throw error;
  }
}

/**
 * Get applicant verification status
 */
export async function getApplicantStatus(input: {
  onboardingSessionId: string;
  sumsubApplicantId: string;
}) {
  const sumsub = getSumsubClient();

  const status = await sumsub.getApplicantStatus(input.sumsubApplicantId);

  return {
    status: status.status,
    reviewStatus: status.reviewStatus,
    reviewResult: status.reviewResult,
    isApproved: status.reviewStatus === 'approved',
    isRejected: status.reviewStatus === 'rejected',
  };
}

/**
 * Handle applicantReviewed webhook event
 */
export async function handleApplicantReviewedWebhook(input: {
  sumsubApplicantId: string;
  externalUserId: string; // onboarding_session_id
  reviewResult: {
    reviewAnswer: 'GREEN' | 'YELLOW' | 'RED';
    reasons?: string[];
    reviewRejectType?: 'RETRY' | 'DECLINE';
  };
}) {
  const db = await createClient();

  try {
    // Map Sumsub review answer to our status
    const statusMap = {
      GREEN: 'approved',
      YELLOW: 'review',
      RED: 'rejected',
    };

    const verificationStatus = statusMap[input.reviewResult.reviewAnswer];

    // Update applicant record
    const { error } = await db
      .from('sumsub_applicants')
      .update({
        verification_status: verificationStatus,
        review_result: input.reviewResult,
        updated_at: new Date().toISOString(),
      })
      .eq('sumsub_applicant_id', input.sumsubApplicantId);

    if (error) throw error;

    // Update onboarding session if approved
    if (verificationStatus === 'approved') {
      await db
        .from('onboarding_sessions')
        .update({
          idv_completed_at: new Date().toISOString(),
        })
        .eq('id', input.externalUserId);
    }

    // Get tenant ID from session (needed for audit)
    const { data: session } = await db
      .from('onboarding_sessions')
      .select('tenant_id')
      .eq('id', input.externalUserId)
      .single();

    if (session) {
      const typedSession = session as { tenant_id: string };
      await emit({
        tenant_id: typedSession.tenant_id,
        event_type: AuditEventType.KYC_RESULT_RECEIVED,
        entity_type: AuditEntityType.SESSION,
        entity_id: input.externalUserId,
        payload: {
          applicantId: input.sumsubApplicantId,
          reviewAnswer: input.reviewResult.reviewAnswer,
          status: verificationStatus,
        },
      });
    }

    return { success: true, status: verificationStatus };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Log the webhook failure (best effort - don't fail if audit fails)
    try {
      const { data: session } = await db
        .from('onboarding_sessions')
        .select('tenant_id')
        .eq('id', input.externalUserId)
        .single();

      if (session) {
        const typedSession = session as { tenant_id: string };
        await emit({
          tenant_id: typedSession.tenant_id,
          event_type: AuditEventType.WEBHOOK_FAILED,
          entity_type: AuditEntityType.SESSION,
          entity_id: input.externalUserId,
          payload: { error: message },
        });
      }
    } catch {
      // Ignore audit logging failures for webhooks
    }

    throw error;
  }
}
