import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/modules/auth/auth.service';
import { getSessionState } from '@/modules/onboarding/onboarding.service';
import { ConsentForm } from '@/components/onboarding/consent-form';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';

const INDIVIDUAL_STEPS = [
  { id: 'consent', title: 'Consent' },
  { id: 'identity', title: 'Identity' },
  { id: 'documents', title: 'Documents' },
];

const CORPORATE_STEPS = [
  { id: 'consent', title: 'Consent' },
  { id: 'business-info', title: 'Business Info' },
  { id: 'documents', title: 'Documents' },
];

interface Props {
  params: Promise<{ tenantSlug: string; sessionId: string }>;
}

export default async function ConsentPage({ params }: Props) {
  const { tenantSlug, sessionId } = await params;

  let auth;
  try {
    auth = await requireAuth();
  } catch {
    redirect('/sign-in');
  }

  const { session } = await getSessionState(sessionId, auth.user.tenant_id);
  if (!session) notFound();

  if (session.status === 'submitted' || session.status === 'approved') {
    redirect(`/${tenantSlug}/onboard/${sessionId}/complete`);
  }

  const customerType = (session.step_data as { customer_type?: string })?.customer_type ?? 'individual';
  const isCorporate = customerType === 'corporate';
  const steps = isCorporate ? CORPORATE_STEPS : INDIVIDUAL_STEPS;
  const nextStepPath = isCorporate
    ? `/${tenantSlug}/onboard/${sessionId}/business`
    : `/${tenantSlug}/onboard/${sessionId}/identity`;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isCorporate ? 'KYB Application' : 'KYC Application'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Step 1 of 3</p>
        </div>

        <ProgressIndicator
          steps={steps}
          currentStep={session.current_step}
          completedSteps={session.completed_steps}
        />

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-1">Consent & Disclosures</h2>
          <p className="text-sm text-gray-500 mb-6">
            Please review and consent to the following before we proceed.
          </p>
          <ConsentForm
            sessionId={sessionId}
            customerId={session.customer_id}
            nextStepPath={nextStepPath}
          />
        </div>
      </div>
    </div>
  );
}
