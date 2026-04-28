import Link from 'next/link';

export default function OnboardingNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Onboarding session not found</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        The session link may have expired or be invalid. If you were partway through an
        application, please contact the team that sent you the link.
      </p>
      <Link
        href="/"
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Back to home
      </Link>
    </div>
  );
}
