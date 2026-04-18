import { redirect } from 'next/navigation';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { initiateSession } from '@/modules/onboarding/onboarding.service';

interface Props {
  params: Promise<{ tenantSlug: string }>;
}

// Initiates a new onboarding session and redirects to the first step (consent).
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

  const { session } = await initiateSession(auth.user.tenant_id, auth.user.id);

  redirect(`/${tenantSlug}/onboard/${session.id}/consent`);
}
