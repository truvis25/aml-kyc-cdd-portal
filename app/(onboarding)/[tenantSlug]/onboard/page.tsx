import { redirect } from 'next/navigation';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { CustomerTypeSelector } from '@/components/onboarding/customer-type-selector';

interface Props {
  params: Promise<{ tenantSlug: string }>;
}

export default async function OnboardingStartPage({ params }: Props) {
  const { tenantSlug } = await params;

  let auth;
  try {
    auth = await requireAuth();
  } catch {
    redirect('/sign-in');
  }

  try {
    assertPermission(auth.user.role, 'onboarding:create');
  } catch {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Start Your Application</h1>
          <p className="text-sm text-gray-500 mt-1">Select your application type to begin.</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <CustomerTypeSelector tenantSlug={tenantSlug} />
        </div>
      </div>
    </div>
  );
}
