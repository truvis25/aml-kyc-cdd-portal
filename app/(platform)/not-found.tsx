import Link from 'next/link';

export default function PlatformNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-5xl font-bold text-gray-200 mb-4">404</p>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h1>
      <p className="text-sm text-gray-500 mb-6">
        The page you are looking for does not exist or you do not have access to it.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
