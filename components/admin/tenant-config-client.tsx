'use client';

import { useState } from 'react';

interface Props {
  tenantId: string;
  initialName: string;
  slug: string;
  onboardingUrl: string;
  canEdit: boolean;
}

export function TenantConfigClient({ initialName, slug, onboardingUrl, canEdit }: Props) {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSave() {
    if (editValue.trim().length < 2) {
      setSaveError('Name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editValue.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save');
      }
      setName(editValue.trim());
      setEditing(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Error saving name');
    } finally {
      setSaving(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(onboardingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Tenant Name */}
      <div className="rounded-lg bg-white border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">Tenant Details</h2>
          {canEdit && !editing && (
            <button
              onClick={() => { setEditing(true); setEditValue(name); setSaveError(null); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Edit name
            </button>
          )}
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</p>
            {editing ? (
              <div className="mt-1 space-y-1.5">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full max-w-xs rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {saveError && <p className="text-xs text-red-600">{saveError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded px-3 py-1 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="rounded px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-900">{name}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</p>
            <p className="mt-1 text-sm font-mono text-gray-900">{slug}</p>
          </div>
        </div>
      </div>

      {/* Onboarding Link */}
      <div className="rounded-lg bg-white border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-medium text-gray-900">Customer Onboarding Link</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500 mb-3">
            Share this link with customers to start their KYC/KYB onboarding process.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-mono text-gray-700 truncate">
              {onboardingUrl}
            </code>
            <button
              onClick={handleCopy}
              className={`shrink-0 rounded px-3 py-2 text-xs font-medium border transition-colors ${
                copied
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
