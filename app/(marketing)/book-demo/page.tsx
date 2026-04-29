import type { Metadata } from 'next';
import { LeadForm } from '@/components/marketing/LeadForm';

export const metadata: Metadata = {
  title: 'Book a demo',
  description: 'Book a 20-minute TruVis demo. We will walk through onboarding, screening, risk and audit.',
};

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;

export default function BookDemoPage() {
  return (
    <>
      <header className="border-b border-gray-200 bg-gradient-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Book a demo
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            20 minutes. Your data. The full flow.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-700">
            Bring an anonymised customer file. We will walk through onboarding, screening, risk
            scoring, the case workbench and the audit trail. You leave with a sandbox tenant.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="text-xl font-semibold text-gray-900">Pick a time</h2>
            <p className="mt-2 text-sm text-gray-700">
              Choose a slot that works for your team. We confirm by email and send a Google
              Calendar invite with the dial-in.
            </p>
            <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {CALENDLY_URL ? (
                <iframe
                  src={CALENDLY_URL}
                  className="h-[680px] w-full"
                  title="Schedule a TruVis demo"
                />
              ) : (
                <div className="flex h-[320px] flex-col items-start justify-center gap-3 p-6">
                  <p className="text-sm font-semibold text-gray-900">
                    Booking calendar will appear here.
                  </p>
                  <p className="max-w-md text-sm text-gray-600">
                    The team is confirming the production Calendly link. In the meantime, fill in
                    the form on the right and we will reply with two or three slot options within
                    one business day.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                Or tell us a little about you
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                If you&apos;d rather we reach out, drop a few details and a TruVis team member
                will reply within one business day.
              </p>
              <div className="mt-6">
                <LeadForm sourcePath="/book-demo" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
