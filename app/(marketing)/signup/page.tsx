import Link from 'next/link';
import { SignupForm } from '@/components/marketing/signup-form';

export const metadata = {
  title: 'Start Your 14-Day Free Trial | TruVis',
  description:
    'Start a 14-day free trial of TruVis. Full Compliance Suite access. No credit card required. UAE data residency. Cancel anytime.',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-[40px] leading-[1.1] text-ink">
            Start your 14-day free trial.
          </h1>
          <p className="mt-3 text-[16px] text-ink-soft">
            No credit card required. Full Compliance Suite access. Cancel anytime.
          </p>
          <p className="mt-2 text-[13px] text-mute">
            UAE data residency &middot; SOC 2 Type II &middot; Cancel anytime
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-paper p-8">
          <SignupForm />
        </div>

        <p className="mt-6 text-center text-[13px] text-mute">
          By signing up, you agree to our{' '}
          <Link href="/legal/terms" className="underline hover:text-ink-soft">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="underline hover:text-ink-soft">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
