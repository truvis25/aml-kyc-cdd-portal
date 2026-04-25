import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/modules/auth/auth.service';
import { getSessionState } from '@/modules/onboarding/onboarding.service';
import { BusinessForm } from '@/components/onboarding/business-form';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';

const STEPS = [
  { id: 'consent', title: 'Consent' },
  { id: 'business-info', title: 'Business Info' },
  { id: 'documents', title: 'Documents' },
];

interface Props {
  params: Promise<{ tenantSlug: string; sessionId: string }>;
}

export default async function BusinessPage({ params }: Props) {
  const { tenantSlug, sessionId } = await params;

  let auth;
  try {
    auth = await requireAuth();
  } catch {
    redirect('/sign-in');
  }

  const { session } = await getSessionState(sessionId, auth.user.tenant_id);
  if (!session) notFound();

  // Guard: consent must be completed first
  if (!session.completed_steps.includes('consent')) {
    redirect(`/${tenantSlug}/onboard/${sessionId}/consent`);
  }

  // Guard: this page is only for corporate sessions
  const customerType = (session.step_data as { customer_type?: string })?.customer_type;
  if (customerType !== 'corporate') {
    redirect(`/${tenantSlug}/onboard/${sessionId}/identity`);
  }

  // Guard: already submitted
  if (session.status === 'submitted' || session.status === 'approved') {
    redirect(`/${tenantSlug}/onboard/${sessionId}/complete`);
  }

  const businessIdRaw = (session.step_data as { business_id?: string })?.business_id;
  if (!businessIdRaw) {
    redirect(`/${tenantSlug}/onboard/${sessionId}/consent`);
  }
  const businessId = businessIdRaw as string;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">KYB Application</h1>
          <p className="text-sm text-gray-500 mt-1">Step 2 of 3</p>
        </div>

        <ProgressIndicator
          steps={STEPS}
          currentStep={session.current_step}
          completedSteps={session.completed_steps}
        />

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-1">Business Information</h2>
          <p className="text-sm text-gray-500 mb-6">
            Provide your company details as they appear on the trade license.
          </p>
          <BusinessForm
            tenantSlug={tenantSlug}
            sessionId={sessionId}
            businessId={businessId}
          />
        </div>
      </div>
    </div>
  );
}
