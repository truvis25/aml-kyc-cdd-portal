'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CustomerSearchClientProps {
  className?: string;
  placeholder?: string;
}

/**
 * Client component: customer search box.
 * On submit navigates to /cases?search=<q>.
 * Only the search query (not PII) is passed through the URL.
 */
export function CustomerSearchClient({
  className,
  placeholder = 'Search by case ID or reference…',
}: CustomerSearchClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/cases?search=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex items-center gap-2', className)}
      role="search"
      aria-label="Customer search"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search query"
        className={cn(
          'flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm',
          'placeholder:text-gray-400 text-gray-900',
          'focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100',
        )}
      />
      <button
        type="submit"
        className={cn(
          'rounded-lg border border-blue-500 bg-blue-500 px-4 py-2 text-sm font-medium text-white',
          'hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300',
          'disabled:opacity-50',
        )}
        disabled={!query.trim()}
      >
        Search
      </button>
    </form>
  );
}
