import type { DecisionVars } from '../types';
import type { RenderedEmail } from './rai';
import { htmlEscape as escape } from './escape';

export function renderApprovalEmail(vars: DecisionVars): RenderedEmail {
  const { tenantName, customerName, statusUrl } = vars;

  const subject = `${tenantName}: your application has been approved`;

  const text = `Dear ${customerName},

We are pleased to inform you that ${tenantName} has approved your application.

You can view your application status here:
${statusUrl}

Welcome aboard.

Compliance Team
${tenantName}`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1f2937;line-height:1.5">
  <div style="max-width:560px;margin:24px auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
    <h1 style="font-size:18px;margin:0 0 16px;color:#16a34a">Application approved</h1>
    <p>Dear ${escape(customerName)},</p>
    <p>We are pleased to inform you that ${escape(tenantName)} has approved your application.</p>
    <p style="margin-top:24px">
      <a href="${escape(statusUrl)}"
         style="display:inline-block;padding:10px 16px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-weight:500">
        View application status
      </a>
    </p>
    <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <p style="font-size:12px;color:#6b7280;margin:0">Compliance Team · ${escape(tenantName)}</p>
  </div>
</body></html>`;

  return { subject, text, html };
}
