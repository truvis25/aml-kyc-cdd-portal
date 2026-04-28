import type { DecisionVars } from '../types';
import type { RenderedEmail } from './rai';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderRejectionEmail(vars: DecisionVars): RenderedEmail {
  const { tenantName, customerName, statusUrl } = vars;

  const subject = `${tenantName}: update on your application`;

  // Tone: factual, neutral, no specific reasons (rationale stays internal for
  // tipping-off and SAR considerations).
  const text = `Dear ${customerName},

We have completed our review of your application with ${tenantName}.

Unfortunately, we are unable to approve your application at this time. If you would like further information, please contact our compliance team via the contact details on our website.

You can view your application status here:
${statusUrl}

Compliance Team
${tenantName}`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1f2937;line-height:1.5">
  <div style="max-width:560px;margin:24px auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
    <h1 style="font-size:18px;margin:0 0 16px">Application update</h1>
    <p>Dear ${escape(customerName)},</p>
    <p>We have completed our review of your application with ${escape(tenantName)}.</p>
    <p>Unfortunately, we are unable to approve your application at this time. If you would like further information, please contact our compliance team via the contact details on our website.</p>
    <p style="margin-top:24px">
      <a href="${escape(statusUrl)}"
         style="display:inline-block;padding:10px 16px;background:#374151;color:#fff;text-decoration:none;border-radius:6px;font-weight:500">
        View application status
      </a>
    </p>
    <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <p style="font-size:12px;color:#6b7280;margin:0">Compliance Team · ${escape(tenantName)}</p>
  </div>
</body></html>`;

  return { subject, text, html };
}
