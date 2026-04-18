'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface DocumentRequirement {
  type: string;
  label: string;
  required: boolean;
  alternatives?: string[];
}

interface DocumentUploadProps {
  tenantSlug: string;
  sessionId: string;
  customerId: string;
  requirements: DocumentRequirement[];
}

interface UploadState {
  file: File | null;
  documentId: string | null;
  status: 'idle' | 'uploading' | 'done' | 'error';
  error: string | null;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
const MAX_SIZE = 20 * 1024 * 1024;

export function DocumentUpload({ tenantSlug, sessionId, customerId, requirements }: DocumentUploadProps) {
  const router = useRouter();
  const [uploads, setUploads] = useState<Record<string, UploadState>>(() =>
    Object.fromEntries(requirements.map((r) => [r.type, { file: null, documentId: null, status: 'idle', error: null }]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function setUpload(type: string, patch: Partial<UploadState>) {
    setUploads((prev) => ({ ...prev, [type]: { ...prev[type]!, ...patch } }));
  }

  async function handleFileSelect(req: DocumentRequirement, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type as typeof ACCEPTED_TYPES[number])) {
      setUpload(req.type, { error: 'Unsupported file type. Use JPEG, PNG, WebP, or PDF.', status: 'idle' });
      return;
    }
    if (file.size > MAX_SIZE) {
      setUpload(req.type, { error: 'File too large. Maximum size is 20 MB.', status: 'idle' });
      return;
    }

    setUpload(req.type, { file, status: 'uploading', error: null });

    try {
      // Get signed upload URL
      const urlRes = await fetch('/api/documents/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          document_type: req.type,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        }),
      });
      if (!urlRes.ok) throw new Error('Failed to get upload URL');
      const { document_id, upload_url } = await urlRes.json();

      // Upload directly to Supabase Storage
      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error('Upload failed');

      // Confirm upload
      const confirmRes = await fetch(`/api/documents/${document_id}`, { method: 'POST' });
      if (!confirmRes.ok) throw new Error('Failed to confirm upload');

      setUpload(req.type, { documentId: document_id, status: 'done' });
    } catch (err) {
      setUpload(req.type, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed' });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missingRequired = requirements
      .filter((r) => r.required)
      .some((r) => uploads[r.type]?.status !== 'done');
    if (missingRequired) return;

    setSubmitting(true);
    setApiError(null);
    try {
      const stepRes = await fetch(`/api/sessions/${sessionId}/steps/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: {} }),
      });
      if (!stepRes.ok) throw new Error('Failed to advance session');
      router.push(`/${tenantSlug}/onboard/${sessionId}/complete`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  const allRequiredDone = requirements
    .filter((r) => r.required)
    .every((r) => uploads[r.type]?.status === 'done');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {requirements.map((req) => {
        const upload = uploads[req.type]!;
        return (
          <div key={req.type} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {req.label}
                  {req.required && <span className="text-red-500 ml-1">*</span>}
                </p>
                {req.alternatives && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Also accepted: {req.alternatives.join(', ')}
                  </p>
                )}
              </div>
              {upload.status === 'done' && (
                <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  Uploaded
                </span>
              )}
            </div>

            {upload.status !== 'done' ? (
              <div
                className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => inputRefs.current[req.type]?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file && inputRefs.current[req.type]) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    inputRefs.current[req.type]!.files = dt.files;
                    inputRefs.current[req.type]!.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }}
              >
                <input
                  ref={(el) => { inputRefs.current[req.type] = el; }}
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  className="hidden"
                  onChange={(e) => handleFileSelect(req, e)}
                />
                {upload.status === 'uploading' ? (
                  <p className="text-sm text-gray-500">Uploading…</p>
                ) : (
                  <>
                    <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, PDF · Max 20 MB</p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="h-4 w-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {upload.file?.name}
                <button
                  type="button"
                  className="ml-auto text-xs text-gray-400 hover:text-gray-600"
                  onClick={() => setUpload(req.type, { file: null, documentId: null, status: 'idle', error: null })}
                >
                  Replace
                </button>
              </div>
            )}

            {upload.error && (
              <p className="mt-2 text-xs text-red-600">{upload.error}</p>
            )}
          </div>
        );
      })}

      {apiError && (
        <p className="text-sm text-red-600 rounded-md bg-red-50 border border-red-200 px-3 py-2">{apiError}</p>
      )}

      <button
        type="submit"
        disabled={!allRequiredDone || submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  );
}
