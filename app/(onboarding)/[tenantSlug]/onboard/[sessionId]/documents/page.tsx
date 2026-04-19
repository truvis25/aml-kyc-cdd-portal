import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/modules/auth/auth.service';
import { getSessionState } from '@/modules/onboarding/onboarding.service';
import { DocumentUpload } from '@/components/onboarding/document-upload';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';

const STEPS = [
  { id: 'consent', title: 'Consent' },
  { id: 'identity', title: 'Identity' },
  { id: 'documents', title: 'Documents' },
];

const DEFAULT_REQUIREMENTS = [
  {
    type: 'passport',
    label: 'Passport or National ID',
    required: true,
    alternatives: ['national_id', 'residence_permit'],
  },
  {
    type: 'proof_of_address',
    label: 'Proof of Address',
    required: false,
  },
];

interface Props {
  params: Promise<{ tenantSlug: string; sessionId: string }>;
}

export default async function DocumentsPage({ params }: Props) {
  const { tenantSlug, sessionId } = await params;

  let auth;
  try {
    auth = await requireAuth();
  } catch {
    redirect('/sign-in');
  }
  if (!auth) redirect('/sign-in');

  const { session } = await getSessionState(sessionId, auth.user.tenant_id);
  if (!session) notFound();

  if (!session.completed_steps.includes('identity')) {
    redirect(`/${tenantSlug}/onboard/${sessionId}/identity`);
  }

  if (session.status === 'submitted' || session.status === 'approved') {
    redirect(`/${tenantSlug}/onboard/${sessionId}/complete`);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">KYC Application</h1>
          <p className="text-sm text-gray-500 mt-1">Step 3 of 3</p>
        </div>

        <ProgressIndicator
          steps={STEPS}
          currentStep={session.current_step}
          completedSteps={session.completed_steps}
        />

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-1">Identity Documents</h2>
          <p className="text-sm text-gray-500 mb-6">
            Upload clear, legible copies of the required documents below.
          </p>
          <DocumentUpload
            tenantSlug={tenantSlug}
            sessionId={sessionId}
            customerId={session.customer_id}
            requirements={DEFAULT_REQUIREMENTS}
          />
        </div>
      </div>
    </div>
  );
}
