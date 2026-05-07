'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface CustomerSearchClientProps {
  className?: string;
}

/**
 * Customer lookup search box for the Onboarding Agent dashboard.
 * On submit, navigates to /cases?search=<q>.
 * Client component — uses useRouter for navigation without page reload.
 */
export function CustomerSearchClient({ className }: CustomerSearchClientProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? '';
    if (!q) return;
    router.push(`/cases?search=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex items-center gap-2', className)}
      role="search"
      aria-label="Customer lookup"
    >
      <input
        ref={inputRef}
        type="search"
        name="q"
        placeholder="Search by case ID or reference…"
        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        autoComplete="off"
      />
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      >
        Search
      </button>
    </form>
  );
}
