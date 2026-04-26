'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PlatformError({ error, reset }: Props) {
  useEffect(() => {
    console.error('Platform error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        An unexpected error occurred. If this persists, contact your system administrator.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 font-mono mb-4">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
