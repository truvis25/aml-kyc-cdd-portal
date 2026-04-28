import type { ReactNode } from 'react';
import type { Role } from '@/lib/constants/roles';

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  role: Role;
  children: ReactNode;
}

export function DashboardShell({ title, subtitle, role, children }: DashboardShellProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-sm text-blue-700 mb-8">
        <span className="capitalize">{role.replace(/_/g, ' ')}</span>
      </div>
      {children}
    </div>
  );
}
