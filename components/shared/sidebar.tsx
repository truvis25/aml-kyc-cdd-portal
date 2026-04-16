'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  FileText,
  Settings,
  GitBranch,
  UserCog,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Role } from '@/lib/constants/roles';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[]; // Roles that can see this item; empty = all roles
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [], // All roles
  },
  {
    href: '/cases',
    label: 'Cases',
    icon: FolderOpen,
    roles: [Role.MLRO, Role.SENIOR_REVIEWER, Role.ANALYST, Role.TENANT_ADMIN],
  },
  {
    href: '/customers',
    label: 'Customers',
    icon: Users,
    roles: [Role.MLRO, Role.SENIOR_REVIEWER, Role.ANALYST, Role.TENANT_ADMIN],
  },
  {
    href: '/audit',
    label: 'Audit Trail',
    icon: ShieldCheck,
    roles: [Role.MLRO, Role.TENANT_ADMIN],
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: UserCog,
    roles: [Role.TENANT_ADMIN, Role.PLATFORM_SUPER_ADMIN],
  },
  {
    href: '/admin/config',
    label: 'Configuration',
    icon: Settings,
    roles: [Role.TENANT_ADMIN, Role.PLATFORM_SUPER_ADMIN],
  },
  {
    href: '/admin/workflows',
    label: 'Workflows',
    icon: GitBranch,
    roles: [Role.TENANT_ADMIN, Role.MLRO],
  },
];

interface SidebarProps {
  role: Role;
  displayName: string | null;
  email: string;
  onSignOut: () => void;
}

export function Sidebar({ role, displayName, email, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles.length === 0 || item.roles.includes(role)
  );

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Brand */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-700">
        <FileText className="h-6 w-6 text-blue-400" />
        <div>
          <span className="text-base font-semibold">TruVis</span>
          <p className="text-xs text-gray-400">AML Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + Sign out */}
      <div className="border-t border-gray-700 px-4 py-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-white truncate">
            {displayName ?? email}
          </p>
          <p className="text-xs text-gray-400 capitalize">
            {role.replace(/_/g, ' ')}
          </p>
        </div>
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
