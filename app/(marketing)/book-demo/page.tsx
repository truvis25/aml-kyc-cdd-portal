import type { Metadata } from 'next';
import { LeadForm } from '@/components/marketing/LeadForm';

export const metadata: Metadata = {
  title: 'Book a Demo | TruVis',
  description:
    'Reserve a 30-minute TruVis demo. No pitch deck — your compliance workflow, our platform. Gulf-based team, Arabic-speaking, GST time zone.',
};

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;

const WHAT_WE_COVER = [
  'KYC individual and KYB corporate onboarding flows',
  'Real-time AML sanctions and PEP screening',
  'Three-dimension risk scoring with per-tenant thresholds',
  'MLRO case workbench — assign, review, four-eyes approve',
  'Hash-chained audit trail and goAML XML export',
  'SAR register and regulator-ready reporting',
];

export default function BookDemoPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 lg:pb-20 lg:pt-28 lg:px-10">
          <p className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
            <span className="copper-rule" aria-hidden="true" />
            <span>30 minutes. No slides.</span>
          </p>
          <h1 className="font-display mt-6 max-w-[22ch] text-[40px] leading-[1.08] text-ink sm:text-[56px]">
            See TruVis handling your exact compliance workflow.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft">
            Your questions, your workflow, our platform. Gulf-based compliance team &middot;
            Arabic-speaking &middot; GST/AST time zone &middot; Reply within 2 business hours.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="font-display text-[24px] text-ink">Reserve your slot</h2>
              <p className="mt-3 text-[15px] text-ink-soft">
                Choose a time that works for your team. We confirm by email and send a calendar
                invite with dial-in details.
              </p>

              <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-cream">
                {CALENDLY_URL ? (
                  <iframe
                    src={CALENDLY_URL}
                    className="h-[680px] w-full"
                    title="Schedule a TruVis demo"
                  />
                ) : (
                  <div className="flex h-[280px] flex-col justify-center gap-4 p-8">
                    <p className="text-[15px] font-medium text-ink">
                      Booking calendar coming soon.
                    </p>
                    <p className="max-w-md text-[14px] text-ink-soft">
                      Fill in the form and our Gulf-based compliance team will reply with two or
                      three slot options within 2 business hours.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-10">
                <p className="text-[12px] uppercase tracking-[0.18em] text-mute">
                  What we cover
                </p>
                <ul className="mt-4 space-y-3">
                  {WHAT_WE_COVER.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[15px] text-ink-soft">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-line bg-cream p-8">
                <h2 className="font-display text-[22px] text-ink">
                  Tell us about your compliance need
                </h2>
                <p className="mt-3 text-[14px] text-ink-soft">
                  Drop a few details and our team will reply within 2 business hours with slot
                  options and any pre-reading relevant to your workflow.
                </p>
                <div className="mt-6">
                  <LeadForm sourcePath="/book-demo" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
