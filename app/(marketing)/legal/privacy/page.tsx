import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/marketing/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How TruVis handles personal data — controllers, processors, retention, your rights.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="29 April 2026">
      <p>
        This Privacy Policy explains how TruVis FZ-LLC (&quot;TruVis&quot;) handles personal data.
        It applies to data we hold about visitors to our website, prospects who contact us, and
        users invited into a TruVis tenant by a customer organisation.
      </p>

      <h2>1. Roles</h2>
      <p>
        For data submitted by customers&apos; end-users into a TruVis tenant (KYC information,
        identity documents, screening results), our customer is the data controller and TruVis is
        a processor. The Data Processing Agreement governs that relationship.
      </p>
      <p>
        For data we collect directly — visitors to our website and people who contact us — TruVis
        is the controller.
      </p>

      <h2>2. What we collect (as controller)</h2>
      <ul>
        <li>
          <strong>Marketing leads:</strong> name, work email, company, role, vertical and any
          message you send via our forms; the page you submitted from; UTM parameters if present.
        </li>
        <li>
          <strong>Authentication:</strong> for users invited into a TruVis tenant, we collect
          email, hashed password, MFA factors and session metadata via Supabase Auth.
        </li>
        <li>
          <strong>Operational logs:</strong> IP addresses (masked to /24 in audit logs), request
          timestamps, error rates. Application logs are run through a sanitiser that redacts known
          PII keys before storage.
        </li>
      </ul>
      <p>
        We do not use third-party advertising or behavioural-tracking cookies. Our website does
        not require cookies for the marketing surface.
      </p>

      <h2>3. Why we use it</h2>
      <ul>
        <li>To respond to demo requests and other contact you initiate</li>
        <li>To operate, secure and improve the TruVis platform</li>
        <li>To meet our own legal and regulatory obligations</li>
      </ul>

      <h2>4. Where it lives</h2>
      <p>
        All customer data and audit logs are stored in Supabase region <code>me1</code>{' '}
        (Bahrain), and the application is served from Vercel region <code>me1</code>. We do not
        replicate customer data outside the GCC without explicit instruction in your order form.
      </p>

      <h2>5. Sharing</h2>
      <p>
        We use sub-processors (listed at <Link href="/legal/sub-processors">/legal/sub-processors</Link>)
        to deliver the service. We do not sell personal data and we do not share it with marketing
        partners.
      </p>

      <h2>6. Retention</h2>
      <p>
        Marketing leads are retained for 24 months after the last meaningful interaction or until
        you ask us to delete them, whichever is sooner. Customer-tenant data is retained for the
        period set out in your order form, plus the regulatory minima you instruct us to apply.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Where applicable law gives you rights over your personal data — access, correction,
        deletion, objection, portability — you may exercise them by contacting{' '}
        <a href="mailto:privacy@truvis.ae">privacy@truvis.ae</a>. If you are a tenant end-user,
        please contact your tenant administrator first; they are the controller for that data.
      </p>

      <h2>8. Security</h2>
      <p>
        TruVis is engineered around tenant isolation (Row Level Security on every table), MFA for
        privileged roles, append-only audit logs, signed-URL-only document access and PII-aware
        logging. See <Link href="/security">/security</Link> for the technical detail.
      </p>

      <h2>9. Changes</h2>
      <p>
        We will update this policy from time to time. Material changes are communicated to active
        customers in advance.
      </p>

      <h2>10. Contact</h2>
      <p>
        Privacy questions: <a href="mailto:privacy@truvis.ae">privacy@truvis.ae</a>. Security
        issues: <a href="mailto:security@truvis.ae">security@truvis.ae</a>.
      </p>
    </LegalPage>
  );
}
