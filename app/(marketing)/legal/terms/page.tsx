import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'TruVis Terms of Service. Plain-language summary for transparency.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="29 April 2026">
      <p>
        These Terms of Service govern your use of TruVis, a software-as-a-service compliance
        platform operated by TruVis Technologies LLC (&quot;TruVis&quot;, &quot;we&quot;). By
        creating an account or accessing the service, you accept these terms on behalf of your
        organisation.
      </p>

      <h2>1. The service</h2>
      <p>
        TruVis provides AML, KYC and CDD workflow tooling: customer onboarding portals, identity
        verification (via integrated providers), sanctions and PEP screening, risk scoring, case
        management and audit logging. The exact features available to your organisation depend on
        the subscription tier in your order form.
      </p>

      <h2>2. Your account and data</h2>
      <p>
        You are responsible for the accuracy of data you submit and for the actions of users you
        invite into your tenant. You retain all rights to your customer data; we hold it as a
        processor under our Data Processing Agreement. You may export your data in machine-readable
        form at any time.
      </p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use TruVis to process data unrelated to AML/KYC/CDD obligations</li>
        <li>Reverse-engineer, scrape or attempt to bypass tenant isolation</li>
        <li>Use TruVis to violate any applicable law or sanctions regime</li>
        <li>Resell access to the service without our written consent</li>
      </ul>

      <h2>4. Fees and billing</h2>
      <p>
        Fees, billing cycle and verification caps are set out in your order form. Fees are exclusive
        of VAT. Annual prepayment qualifies for a fifteen percent discount on Foundations and
        Compliance Suite tiers. Overage rates apply when your tier&apos;s monthly verification cap
        is exceeded.
      </p>

      <h2>5. Service levels</h2>
      <p>
        We target 99.5% monthly availability on Foundations, 99.9% on Compliance Suite, and
        contractual SLAs are available on Enterprise. Planned maintenance windows are communicated
        at least 48 hours in advance.
      </p>

      <h2>6. Suspension and termination</h2>
      <p>
        Either party may terminate for material breach unremedied within thirty days of notice. We
        may suspend access without notice for security incidents, non-payment beyond fourteen days,
        or use of the service that places third parties at risk. On termination, we provide a
        sixty-day data export window before deletion.
      </p>

      <h2>7. Confidentiality</h2>
      <p>
        Each party will keep the other&apos;s non-public information confidential and use it only
        to perform under this agreement. This obligation survives termination for three years.
      </p>

      <h2>8. Liability</h2>
      <p>
        Our aggregate liability under these terms is capped at the fees paid in the twelve months
        preceding the event giving rise to liability. We exclude liability for indirect, incidental
        or consequential loss, save where excluded by law.
      </p>

      <h2>9. Governing law</h2>
      <p>
        These terms are governed by the laws of the UAE (Federal Decree-Law No. 10 of 2025 and
        associated regulations) and, for customers operating in financial free zones, the laws of
        the Dubai International Financial Centre (DIFC). Disputes are submitted to the DIFC Courts
        unless otherwise agreed in your order form.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these terms may be sent to{' '}
        <a href="mailto:legal@truvis.ae">legal@truvis.ae</a>.
      </p>
    </LegalPage>
  );
}
