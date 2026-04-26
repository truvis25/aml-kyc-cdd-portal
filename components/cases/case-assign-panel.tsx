'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Officer {
  id: string;
  display_name: string | null;
  role: string;
}

interface Props {
  caseId: string;
  currentAssigneeId: string | null;
  officers: Officer[];
  canAssign: boolean;
}

export function CaseAssignPanel({ caseId, currentAssigneeId, officers, canAssign }: Props) {
  const router = useRouter();
  const [assigneeId, setAssigneeId] = useState<string | null>(currentAssigneeId);
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(currentAssigneeId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentOfficer = officers.find((o) => o.id === assigneeId);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: selectedId || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to assign');
      }
      setAssigneeId(selectedId || null);
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error assigning officer');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Assigned to:</span>
        {currentOfficer ? (
          <span className="text-xs font-medium text-gray-900">
            {currentOfficer.display_name ?? currentOfficer.id.slice(0, 8)}
            <span className="ml-1 text-gray-400 capitalize">
              ({currentOfficer.role.replace(/_/g, ' ')})
            </span>
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic">Unassigned</span>
        )}
        {canAssign && !editing && (
          <button
            onClick={() => { setEditing(true); setSelectedId(assigneeId ?? ''); setError(null); }}
            className="text-xs text-blue-600 hover:underline ml-1"
          >
            {currentOfficer ? 'Reassign' : 'Assign'}
          </button>
        )}
      </div>

      {editing && (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">— Unassigned —</option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.display_name ?? o.id.slice(0, 8)} ({o.role.replace(/_/g, ' ')})
              </option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded px-2 py-1 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Confirm'}
          </button>
          <button
            onClick={() => setEditing(false)}
            disabled={saving}
            className="rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            Cancel
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      )}
    </div>
  );
}
