import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/modules/auth/auth.service';
import { getSessionState } from '@/modules/onboarding/onboarding.service';

interface Props {
  params: Promise<{ tenantSlug: string; sessionId: string }>;
}

export default async function CompletePage({ params }: Props) {
  const { sessionId } = await params;

  let auth;
  try {
    auth = await requireAuth();
  } catch {
    redirect('/sign-in');
  }

  const { session } = await getSessionState(sessionId, auth.user.tenant_id);
  if (!session) notFound();

  const isSubmitted = session.status === 'submitted' || session.status === 'approved';
  const customerType = (session.step_data as { customer_type?: string })?.customer_type ?? 'individual';
  const isCorporate = customerType === 'corporate';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          {isSubmitted ? 'Application Submitted' : 'Thank You'}
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          {isSubmitted
            ? isCorporate
              ? 'Your KYB application has been submitted successfully. Our compliance team will review your business information and documents. You will be notified once the review is complete.'
              : 'Your KYC application has been submitted successfully. Our compliance team will review your information and documents. You will be notified once the review is complete.'
            : 'Your application is being processed. Please check back later for updates.'}
        </p>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-left">
          <p className="text-sm font-medium text-blue-900">What happens next?</p>
          <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
            {isCorporate ? (
              <>
                <li>Trade license and business documents will be verified</li>
                <li>Authorized representative identity will be confirmed</li>
                <li>AML/sanctions screening will be performed</li>
                <li>You will be notified of the decision</li>
              </>
            ) : (
              <>
                <li>Identity documents will be verified</li>
                <li>AML/sanctions screening will be performed</li>
                <li>A risk assessment will be conducted</li>
                <li>You will be notified of the decision</li>
              </>
            )}
          </ul>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Reference: {session.id}
        </p>
      </div>
    </div>
  );
}
