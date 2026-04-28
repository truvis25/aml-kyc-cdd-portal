'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  initialLogoUrl: string | null;
  canEdit: boolean;
}

const MAX_BYTES = 512 * 1024;
const ACCEPTED = 'image/png,image/jpeg,image/webp,image/svg+xml';

export function BrandingUploader({ initialLogoUrl, canEdit }: Props) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [busy, setBusy] = useState<'idle' | 'uploading' | 'removing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onUpload(ev: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = ev.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError('Logo must be 512KB or smaller.');
      ev.target.value = '';
      return;
    }
    setBusy('uploading');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/branding', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Upload failed');
      }
      const data = (await res.json()) as { logo_url: string };
      setLogoUrl(data.logo_url);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy('idle');
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onRemove() {
    setError(null);
    setBusy('removing');
    try {
      const res = await fetch('/api/admin/branding', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Remove failed');
      }
      setLogoUrl(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Remove failed');
    } finally {
      setBusy('idle');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 overflow-hidden">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Tenant logo"
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-xs text-gray-400">No logo</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          {canEdit ? (
            <>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED}
                  onChange={onUpload}
                  disabled={busy !== 'idle'}
                  className="hidden"
                />
                <span className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                  {busy === 'uploading'
                    ? 'Uploading…'
                    : logoUrl
                      ? 'Replace logo'
                      : 'Upload logo'}
                </span>
              </label>
              {logoUrl && (
                <button
                  onClick={onRemove}
                  disabled={busy !== 'idle'}
                  className="ml-2 rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  {busy === 'removing' ? 'Removing…' : 'Remove'}
                </button>
              )}
              <p className="text-xs text-gray-500">
                PNG, JPEG, WebP, or SVG · max 512KB · square images render best.
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-500">Read-only — only Tenant Admin can change branding.</p>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
