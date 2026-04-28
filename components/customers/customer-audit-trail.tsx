interface AuditEvent {
  id: string;
  event_time: string;
  event_type: string;
  entity_type: string;
  actor_role: string | null;
  actor_name?: string | null;
}

interface Props {
  events: AuditEvent[];
}

const EVENT_LABEL: Record<string, string> = {
  'customer.created': 'Customer record created',
  'customer.field_changed': 'Identity data updated',
  'consent.captured': 'Consent captured',
  'consent.withdrawn': 'Consent withdrawn',
  'document.uploaded': 'Document uploaded',
  'document.accepted': 'Document accepted',
  'document.rejected': 'Document rejected',
  'document.hash_computed': 'Document hash computed',
  'kyc.initiated': 'KYC initiated',
  'kyc.passed': 'KYC passed',
  'kyc.failed': 'KYC failed',
  'screening.initiated': 'Screening initiated',
  'screening.completed': 'Screening completed',
  'screening.hit_generated': 'Screening hit generated',
  'screening.hit_resolved': 'Screening hit resolved',
  'risk.score_computed': 'Risk score computed',
  'case.created': 'Case opened',
  'case.assigned': 'Case assigned',
  'case.note_added': 'Note added',
  'case.rai_sent': 'RAI sent',
  'case.escalated': 'Case escalated',
  'case.sar_flagged': 'SAR flagged',
  'case.sar_unflagged': 'SAR cleared',
  'approval.granted': 'Approval granted',
  'approval.rejected': 'Application rejected',
};

const EVENT_DOT: Record<string, string> = {
  'case.sar_flagged':   'bg-red-500',
  'approval.rejected':  'bg-red-500',
  'document.rejected':  'bg-red-500',
  'kyc.failed':         'bg-red-500',
  'approval.granted':   'bg-green-500',
  'kyc.passed':         'bg-green-500',
  'document.accepted':  'bg-green-500',
  'case.escalated':     'bg-orange-500',
  'screening.hit_generated': 'bg-amber-500',
};

/**
 * Read-only audit trail for the customer detail page. Renders the most
 * recent compliance events for this customer. Event payloads are NOT
 * displayed — they can contain free-form text from RAI requests, approval
 * rationales, etc., which are PII; the audit_log export remains the
 * compliance-grade artefact.
 *
 * Server caller is responsible for filtering by tenant_id + customer_id
 * via audit.query() — RLS enforces tenant scoping at the DB layer too.
 */
export function CustomerAuditTrail({ events }: Props) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Compliance Activity</h2>
      <ol className="space-y-2.5 relative pl-5 border-l border-gray-100">
        {events.map((e) => {
          const label = EVENT_LABEL[e.event_type] ?? e.event_type;
          const dot = EVENT_DOT[e.event_type] ?? 'bg-blue-500';
          return (
            <li key={e.id} className="relative">
              <span
                className={`absolute -left-[1.45rem] top-1 h-2 w-2 rounded-full ring-2 ring-white ${dot}`}
                aria-hidden
              />
              <div className="text-xs text-gray-900 font-medium">{label}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {new Date(e.event_time).toLocaleString()}
                {e.actor_role ? ` · ${e.actor_role.replace(/_/g, ' ')}` : ''}
                {e.actor_name ? ` (${e.actor_name})` : ''}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[11px] text-gray-400">
        Event payloads are not shown here. Use the dedicated audit page or export for full detail.
      </p>
    </div>
  );
}
