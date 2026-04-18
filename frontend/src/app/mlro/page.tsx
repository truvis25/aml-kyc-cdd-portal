import Link from 'next/link';

// MLRO Module: SAR drafting, EDD checklist, compliance bundle export
export default function MLROPage() {
  const pendingCases = [
    { id: '1', name: 'Acme Holdings Ltd', type: 'LEGAL_ENTITY', riskScore: 72, reasons: ['SANCTIONS_HIT'], since: '2024-01-12' },
    { id: '2', name: 'Viktor Novak', type: 'INDIVIDUAL', riskScore: 68, reasons: ['PEP_HIT', 'ADVERSE_MEDIA'], since: '2024-01-13' },
    { id: '3', name: 'Phoenix Capital Ltd', type: 'LEGAL_ENTITY', riskScore: 65, reasons: ['MISSING_UBO'], since: '2024-01-14' },
  ];

  const eddChecklist = [
    { id: 'source_of_wealth', label: 'Source of Wealth documented', required: true, completed: true },
    { id: 'source_of_funds', label: 'Source of Funds verified', required: true, completed: true },
    { id: 'business_purpose', label: 'Business purpose confirmed', required: true, completed: false },
    { id: 'video_kyc', label: 'Video KYC completed', required: false, completed: false },
    { id: 'bank_statement', label: 'Bank statements reviewed (6+ months)', required: true, completed: true },
    { id: 'adverse_media', label: 'Adverse media check performed', required: true, completed: true },
    { id: 'ubo_verified', label: 'UBO identity verified independently', required: true, completed: false },
    { id: 'sanctions_clear', label: 'Sanctions screening clear', required: true, completed: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Nav */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700 dark:text-slate-400">
            ← Dashboard
          </Link>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <h1 className="font-semibold text-slate-900 dark:text-white">MLRO Module</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium">
            ⚖️ MLRO Access
          </span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Pending MLRO Cases */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Cases Awaiting MLRO Decision
          </h2>
          <div className="space-y-4">
            {pendingCases.map((c) => (
              <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/50 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">{c.name}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                        Risk Score: {c.riskScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {c.reasons.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                          ⚠️ {r.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Pending since {c.since}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/clients/${c.id}`}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-medium"
                    >
                      Review Case
                    </Link>
                    <button className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
                      Approve
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EDD Checklist */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-900 dark:text-white">Enhanced Due Diligence (EDD) Checklist</h2>
            <p className="text-xs text-slate-500 mt-0.5">For: Acme Holdings Ltd · SAR Case #2024-001</p>
          </div>
          <div className="p-6 space-y-3">
            {eddChecklist.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                  item.completed
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'border-2 border-slate-300 dark:border-slate-600'
                }`}>
                  {item.completed && (
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${item.completed ? 'text-slate-600 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                  {item.label}
                </span>
                {item.required && (
                  <span className="text-xs text-red-500 ml-auto">Required</span>
                )}
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {eddChecklist.filter(i => i.completed).length} / {eddChecklist.length} completed
              </span>
              <div className="flex gap-3">
                <button className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-medium">
                  Save Progress
                </button>
                <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                  Complete EDD Review
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SAR Drafting & Export */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SAR Draft */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">Draft SAR / STR</h2>
              <p className="text-xs text-slate-500 mt-0.5">Structured for manual goAML upload</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  SAR Reference
                </label>
                <input
                  type="text"
                  readOnly
                  value="SAR-2024-A1B2C3D4"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Brief description of suspicious activity"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Narrative
                </label>
                <textarea
                  rows={5}
                  placeholder="Detailed description of suspicious activity, patterns observed, and basis for report..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50">
                  Save Draft
                </button>
                <button className="flex-1 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700">
                  Submit SAR
                </button>
              </div>
            </div>
          </div>

          {/* Compliance Bundle Export */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">Export Compliance Bundle</h2>
              <p className="text-xs text-slate-500 mt-0.5">PDF + Evidence + Audit logs</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Generate a complete compliance bundle for regulatory submission or internal record keeping.
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Client KYC documents', count: '8 files' },
                  { label: 'Screening results', count: '3 checks' },
                  { label: 'Risk assessments', count: '2 versions' },
                  { label: 'Audit trail', count: '47 entries' },
                  { label: 'MLRO notes & EDD', count: 'Included' },
                  { label: 'SAR narrative', count: 'Included' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">✓ {item.label}</span>
                    <span className="text-slate-400 text-xs">{item.count}</span>
                  </div>
                ))}
              </div>
              <button className="w-full py-3 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Bundle (PDF)
              </button>
              <p className="text-xs text-slate-400 text-center">
                Export action will be logged in the immutable audit trail
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
