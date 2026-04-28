import type { RaiVars } from '../types';

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderRaiEmail(vars: RaiVars): RenderedEmail {
  const { tenantName, customerName, infoRequested, documentsRequired, statusUrl } = vars;

  const docsList = documentsRequired?.length
    ? `\n\nDocuments requested:\n${documentsRequired.map((d) => `  • ${d}`).join('\n')}`
    : '';

  const docsHtml = documentsRequired?.length
    ? `<p style="margin:12px 0 0">Documents requested:</p>
       <ul style="padding-left:20px;margin:8px 0 0">
         ${documentsRequired.map((d) => `<li>${escape(d)}</li>`).join('')}
       </ul>`
    : '';

  const subject = `${tenantName}: additional information required for your application`;

  const text = `Dear ${customerName},

${tenantName} has reviewed your application and requires additional information before we can proceed.

Information requested:
${infoRequested}${docsList}

To provide the requested information, please visit your secure application portal:
${statusUrl}

If you have any questions, please reply to this email.

Compliance Team
${tenantName}`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1f2937;line-height:1.5">
  <div style="max-width:560px;margin:24px auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
    <h1 style="font-size:18px;margin:0 0 16px">Additional information required</h1>
    <p>Dear ${escape(customerName)},</p>
    <p>${escape(tenantName)} has reviewed your application and requires additional information before we can proceed.</p>
    <p style="margin:12px 0 0;font-weight:600">Information requested</p>
    <p style="margin:8px 0 0;white-space:pre-wrap">${escape(infoRequested)}</p>
    ${docsHtml}
    <p style="margin-top:24px">
      <a href="${escape(statusUrl)}"
         style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:500">
        Complete your application
      </a>
    </p>
    <p style="font-size:12px;color:#6b7280;margin-top:24px">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <span style="word-break:break-all">${escape(statusUrl)}</span>
    </p>
    <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <p style="font-size:12px;color:#6b7280;margin:0">Compliance Team · ${escape(tenantName)}</p>
  </div>
</body></html>`;

  return { subject, text, html };
}
