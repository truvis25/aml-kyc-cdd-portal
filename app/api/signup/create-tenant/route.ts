import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createTrialPaymentLink } from '@/modules/nomod';
import { emit } from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';

const SignupRequestSchema = z.object({
  email: z.string().email(),
  companyName: z.string().min(2),
  fullName: z.string().min(2),
  role: z.enum(['mlro', 'compliance_officer', 'other']),
  vertical: z.enum(['dnfbp', 'fintech', 'other']).optional(),
  plan: z.enum(['starter', 'growth']).default('starter'),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, companyName, plan, successUrl, cancelUrl } =
      SignupRequestSchema.parse(body);

    const db = await createClient();

    // Create tenant
    const { data: tenantData, error: tenantError } = await db
      .from('tenants')
      .insert({
        name: companyName,
        slug: generateTenantSlug(companyName),
      })
      .select('id')
      .single();

    if (tenantError || !tenantData) {
      throw new Error(`Failed to create tenant: ${tenantError?.message}`);
    }

    const tenantId = tenantData.id;

    // Create tenant billing record (starts in 'trialing' state)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

    const { error: billingError } = await db
      .from('tenant_billing')
      .insert({
        tenant_id: tenantId,
        plan,
        status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
      });

    if (billingError) {
      throw new Error(`Failed to create billing record: ${billingError.message}`);
    }

    // Get pricing for plan (in AED)
    const planPricing: Record<string, number> = {
      starter: 1500, // AED 1,500/month
      growth: 5000, // AED 5,000/month
    };

    const amountAED = planPricing[plan];

    // Create payment link via Nomod
    const { linkId, linkUrl } = await createTrialPaymentLink({
      tenantId,
      companyName,
      email,
      plan: plan as 'starter' | 'growth',
      amountAED,
      successUrl,
      cancelUrl,
    });

    // Create auth user (invite via Supabase)
    // TODO: Use Supabase Admin API to send invite email
    // For now, just store the intent; user will sign up via /auth/sign-up with email verification

    // Log signup event
    await emit({
      tenant_id: tenantId,
      event_type: AuditEventType.WEBHOOK_RECEIVED,
      entity_type: AuditEntityType.TENANT,
      entity_id: tenantId,
      payload: {
        action: 'signup_initiated',
        email,
        companyName,
        plan,
        linkId,
      },
    });

    return NextResponse.json(
      {
        tenantId,
        paymentLinkId: linkId,
        paymentLinkUrl: linkUrl,
        trialEndsAt: trialEndsAt.toISOString(),
        message: 'Signup initiated. Proceed to payment.',
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

    // Specific error messages
    if (message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Email or company already registered' },
        { status: 409 }
      );
    }

    if (message.includes('Nomod')) {
      return NextResponse.json(
        { error: 'Payment service unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * Generate a URL-safe tenant slug from company name
 */
function generateTenantSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}
