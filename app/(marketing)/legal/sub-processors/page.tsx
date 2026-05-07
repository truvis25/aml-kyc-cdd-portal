import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/LegalPage';

export const metadata: Metadata = {
  title: 'Sub-processors',
  description: 'Sub-processors that may process customer data on behalf of TruVis.',
};

interface SubProcessor {
  name: string;
  purpose: string;
  location: string;
  optional?: boolean;
}

const PROCESSORS: SubProcessor[] = [
  {
    name: 'Supabase, Inc.',
    purpose:
      'Postgres database, authentication, file storage and edge functions hosting customer-tenant data.',
    location: 'Bahrain (region me1)',
  },
  {
    name: 'Vercel Inc.',
    purpose: 'Application hosting (Next.js App Router) and CDN.',
    location: 'Bahrain (region me1)',
  },
  {
    name: 'Resend Inc.',
    purpose: 'Transactional email delivery for RAI, decisions and lead notifications.',
    location: 'United States (with regional delivery edges)',
  },
  {
    name: 'ComplyAdvantage',
    purpose: 'Sanctions and PEP screening data and webhook delivery.',
    location: 'United Kingdom',
    optional: true,
  },
  {
    name: 'Sumsub',
    purpose: 'Identity verification (liveness, OCR, face match).',
    location: 'European Union',
    optional: true,
  },
];

export default function SubProcessorsPage() {
  return (
    <LegalPage title="Sub-processors" lastUpdated="29 April 2026">
      <p>
        TruVis Technologies LLC uses the sub-processors below to deliver the service. We give
        customers at least 30 days&apos; notice of any new sub-processor; the most current list is
        always on this page. This disclosure is made in accordance with UAE Federal Decree-Law
        No. 45 of 2021 (UAE PDPL) and the EU General Data Protection Regulation (GDPR).
      </p>
      <p>
        Sub-processors marked <em>optional</em> are engaged only when the corresponding feature is
        enabled by the customer or required by their tier.
      </p>

      <h2>Current sub-processors</h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium">Provider</th>
              <th className="px-5 py-3 font-medium">Purpose</th>
              <th className="px-5 py-3 font-medium">Primary location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PROCESSORS.map((p) => (
              <tr key={p.name}>
                <td className="px-5 py-4 align-top font-medium text-gray-900">
                  {p.name}
                  {p.optional && (
                    <span className="ml-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gray-600">
                      Optional
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 align-top text-gray-700">{p.purpose}</td>
                <td className="px-5 py-4 align-top text-gray-700">{p.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>How to be notified of changes</h2>
      <p>
        Active customers receive at least 30 days&apos; notice by email before a new sub-processor
        is added. To object, reply to that email within the notice period.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about sub-processors:{' '}
        <a href="mailto:privacy@truvis.ae">privacy@truvis.ae</a>.
      </p>
    </LegalPage>
  );
}
