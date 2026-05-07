import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/marketing/LegalPage';

export const metadata: Metadata = {
  title: 'Data Processing Agreement',
  description: 'TruVis DPA — controller/processor obligations, sub-processors, security, breach response.',
};

export default function DpaPage() {
  return (
    <LegalPage title="Data Processing Agreement" lastUpdated="29 April 2026">
      <p>
        This Data Processing Agreement (&quot;DPA&quot;) supplements the TruVis Technologies LLC
        customer agreement and governs the processing of personal data submitted by your end-users
        into a TruVis tenant. The customer is the data controller; TruVis Technologies LLC is the
        processor. This DPA covers obligations under UAE Federal Decree-Law No. 45 of 2021 (UAE PDPL)
        and, where applicable, the EU General Data Protection Regulation (GDPR).
      </p>

      <h2>1. Subject matter and duration</h2>
      <p>
        TruVis processes personal data on the customer&apos;s instructions to deliver the AML/KYC
        compliance services described in the customer agreement. Processing continues for the
        contract term plus any export window agreed at termination.
      </p>

      <h2>2. Categories of data and data subjects</h2>
      <ul>
        <li>
          <strong>Data subjects:</strong> the customer&apos;s prospects and customers undergoing
          onboarding, and the customer&apos;s own staff using TruVis.
        </li>
        <li>
          <strong>Data categories:</strong> identity data (name, DOB, ID numbers), contact data
          (address, email), document images, screening hits, risk scores and case notes generated
          by the customer&apos;s staff.
        </li>
      </ul>

      <h2>3. TruVis obligations as processor</h2>
      <ul>
        <li>Process personal data only on the customer&apos;s documented instructions</li>
        <li>Ensure personnel with access are bound by confidentiality</li>
        <li>Implement the security measures described in Schedule 1</li>
        <li>Use only the sub-processors listed at <Link href="/legal/sub-processors">/legal/sub-processors</Link></li>
        <li>Notify the customer without undue delay of any personal-data breach</li>
        <li>Assist the customer with data-subject-rights requests</li>
        <li>Return or delete personal data at termination, subject to retention obligations</li>
      </ul>

      <h2>4. Sub-processors</h2>
      <p>
        Our current sub-processor list is published and updated at{' '}
        <Link href="/legal/sub-processors">/legal/sub-processors</Link>. We will give you 30 days&apos;
        notice of any new sub-processor, and you may object on reasonable grounds.
      </p>

      <h2>5. Security (Schedule 1)</h2>
      <ul>
        <li>Data residency in Bahrain (Vercel and Supabase region me1)</li>
        <li>Tenant isolation by Row Level Security at the database</li>
        <li>Encryption in transit (TLS 1.2+) and at rest (Supabase-managed)</li>
        <li>MFA for MLRO, Compliance Officer and Tenant Admin roles</li>
        <li>Append-only, hash-chained audit log; UPDATE/DELETE blocked at the database</li>
        <li>Customer documents in private buckets accessed only through 15-minute signed URLs</li>
        <li>PII-aware application logger; no raw PII in stdout or platform logs</li>
        <li>Annual third-party penetration test (Enterprise tier)</li>
      </ul>

      <h2>6. International transfers</h2>
      <p>
        We do not transfer personal data outside the GCC for processing or storage without your
        written instruction. If a sub-processor must process data outside the GCC for a discrete
        function (for example, a specific notification provider), we will document the transfer
        mechanism and the safeguards applied.
      </p>

      <h2>7. Audit rights</h2>
      <p>
        On request and reasonable notice, we will provide a current security overview and
        independent test or audit reports we hold (e.g. penetration test, SOC 2 Type II report
        once available). On Enterprise tiers, on-site audits may be agreed subject to
        confidentiality.
      </p>

      <h2>8. Breach response</h2>
      <p>
        We notify customers of confirmed personal-data breaches within 72 hours of confirmation, in
        accordance with UAE PDPL (Federal Decree-Law No. 45 of 2021) and GDPR obligations. The
        notification will include a description of the breach, categories and approximate volume of
        records affected, likely consequences, and remedial steps taken or proposed.
      </p>

      <h2>9. Termination</h2>
      <p>
        On termination, we provide a 60-day export window. After the window we delete personal
        data, except where retention is required by law or where you instruct otherwise in
        writing.
      </p>

      <h2>10. Contact</h2>
      <p>
        DPA questions and DSR requests: <a href="mailto:privacy@truvis.ae">privacy@truvis.ae</a>.
        Security issues: <a href="mailto:security@truvis.ae">security@truvis.ae</a>.
      </p>
    </LegalPage>
  );
}
