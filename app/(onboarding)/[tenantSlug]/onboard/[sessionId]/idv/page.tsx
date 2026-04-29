import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/modules/auth/auth.service';
import { getSessionState } from '@/modules/onboarding/onboarding.service';
import { IDVForm } from '@/components/onboarding/idv-form';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';

const INDIVIDUAL_STEPS = [
  { id: 'consent', title: 'Consent' },
  { id: 'identity', title: 'Identity' },
  { id: 'idv', title: 'Identity Verification' },
  { id: 'documents', title: 'Documents' },
];

interface Props {
  params: Promise<{ tenantSlug: string; sessionId: string }>;
}

export default async function IDVPage({ params }: Props) {
  const { tenantSlug, sessionId } = await params;

  let auth;
  try {
    auth = await requireAuth();
  } catch {
    redirect('/sign-in');
  }

  const { session } = await getSessionState(sessionId, auth.user.tenant_id);
  if (!session) notFound();

  // Guard: must have completed consent and identity before IDV
  if (!session.completed_steps.includes('consent')) {
    redirect(`/${tenantSlug}/onboard/${sessionId}/consent`);
  }

  if (!session.completed_steps.includes('identity')) {
    redirect(`/${tenantSlug}/onboard/${sessionId}/identity`);
  }

  if (session.status === 'submitted' || session.status === 'approved') {
    redirect(`/${tenantSlug}/onboard/${sessionId}/complete`);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">KYC Application</h1>
          <p className="text-sm text-gray-500 mt-1">Step 3 of 4</p>
        </div>

        <ProgressIndicator
          steps={INDIVIDUAL_STEPS}
          currentStep={session.current_step}
          completedSteps={session.completed_steps}
        />

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-1">Identity Verification</h2>
          <p className="text-sm text-gray-500 mb-6">
            Please complete identity verification by taking a selfie and scanning your document.
          </p>
          <IDVForm
            tenantSlug={tenantSlug}
            sessionId={sessionId}
            customerId={session.customer_id}
          />
        </div>
      </div>
    </div>
  );
}
