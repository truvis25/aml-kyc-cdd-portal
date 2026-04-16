'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/shared/sidebar';
import type { Role } from '@/lib/constants/roles';

interface PlatformShellProps {
  userId: string;
  email: string;
  role: Role;
  tenantId: string;
  children: React.ReactNode;
}

export function PlatformShell({ email, role, children }: PlatformShellProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/sign-in');
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        role={role}
        displayName={null}
        email={email}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
