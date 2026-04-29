import { htmlEscape as escape } from './escape';
import type { RenderedEmail } from './rai';

export interface LeadNotificationVars {
  name: string;
  email: string;
  company?: string;
  role?: string;
  vertical?: string;
  message?: string;
  sourcePath?: string;
}

export function renderLeadNotificationEmail(vars: LeadNotificationVars): RenderedEmail {
  const subject = `New TruVis lead: ${vars.name}${vars.company ? ` (${vars.company})` : ''}`;

  const lines = [
    `Name:    ${vars.name}`,
    `Email:   ${vars.email}`,
    vars.company ? `Company: ${vars.company}` : null,
    vars.role ? `Role:    ${vars.role}` : null,
    vars.vertical ? `Vertical: ${vars.vertical}` : null,
    vars.sourcePath ? `Source:  ${vars.sourcePath}` : null,
    vars.message ? `\nMessage:\n${vars.message}` : null,
  ].filter(Boolean);

  const text = lines.join('\n');

  const rows: string[] = [
    row('Name', vars.name),
    row('Email', vars.email),
  ];
  if (vars.company) rows.push(row('Company', vars.company));
  if (vars.role) rows.push(row('Role', vars.role));
  if (vars.vertical) rows.push(row('Vertical', vars.vertical));
  if (vars.sourcePath) rows.push(row('Source', vars.sourcePath));

  const messageBlock = vars.message
    ? `<p style="margin:16px 0 0;font-weight:600">Message</p>
       <p style="margin:8px 0 0;white-space:pre-wrap">${escape(vars.message)}</p>`
    : '';

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1f2937;line-height:1.5">
  <div style="max-width:560px;margin:24px auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
    <h1 style="font-size:18px;margin:0 0 16px">New TruVis lead</h1>
    <table style="border-collapse:collapse;width:100%">${rows.join('')}</table>
    ${messageBlock}
    <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <p style="font-size:12px;color:#6b7280;margin:0">Captured from the public marketing site.</p>
  </div>
</body></html>`;

  return { subject, text, html };
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px;vertical-align:top">${escape(label)}</td>
    <td style="padding:4px 0;font-size:14px;vertical-align:top">${escape(value)}</td>
  </tr>`;
}
