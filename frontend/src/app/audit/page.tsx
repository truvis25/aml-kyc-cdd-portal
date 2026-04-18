import Link from 'next/link';

// Audit log table page for Compliance Admin / Auditor / MLRO
export default function AuditPage() {
  // In production: fetch from /api/v1/audit
  const logs = [
    { id: '1', timestamp: '2024-01-15 09:32:11', user: 'Sarah Ali', role: 'KYC_ANALYST', action: 'DOCUMENT_UPLOAD', client: 'Acme Holdings Ltd', details: 'Passport uploaded' },
    { id: '2', timestamp: '2024-01-15 09:45:03', user: 'System', role: 'SYSTEM', action: 'SCREENING_RUN', client: 'Acme Holdings Ltd', details: 'Sanctions screening completed' },
    { id: '3', timestamp: '2024-01-15 10:12:44', user: 'James Chen', role: 'RELATIONSHIP_MANAGER', action: 'STATUS_CHANGE', client: 'Mohammed Al-Rashidi', details: 'IN_PROGRESS → DOCUMENTS_UPLOADED' },
    { id: '4', timestamp: '2024-01-15 10:55:22', user: 'Ahmad Hassan', role: 'MLRO', action: 'APPROVAL', client: 'Gulf Trade LLC', details: 'Case approved after EDD review' },
    { id: '5', timestamp: '2024-01-15 11:02:17', user: 'Sarah Ali', role: 'KYC_ANALYST', action: 'RISK_SCORE_CHANGE', client: 'Emirates Ventures', details: 'Risk score: 45 → MEDIUM' },
    { id: '6', timestamp: '2024-01-15 11:30:55', user: 'Ahmad Hassan', role: 'MLRO', action: 'SAR_CREATED', client: 'Acme Holdings Ltd', details: 'SAR-2024-A1B2C3D4 created' },
    { id: '7', timestamp: '2024-01-15 14:20:09', user: 'Ahmad Hassan', role: 'MLRO', action: 'EXPORT', client: 'Acme Holdings Ltd', details: 'Compliance bundle exported' },
    { id: '8', timestamp: '2024-01-15 14:35:41', user: 'James Chen', role: 'RELATIONSHIP_MANAGER', action: 'LOGIN', client: '-', details: 'Login from 185.220.x.x' },
  ];

  const actionColors: Record<string, string> = {
    LOGIN: 'bg-slate-100 text-slate-700',
    DOCUMENT_UPLOAD: 'bg-blue-100 text-blue-700',
    STATUS_CHANGE: 'bg-purple-100 text-purple-700',
    APPROVAL: 'bg-green-100 text-green-700',
    REJECTION: 'bg-red-100 text-red-700',
    RISK_SCORE_CHANGE: 'bg-amber-100 text-amber-700',
    SCREENING_RUN: 'bg-cyan-100 text-cyan-700',
    SAR_CREATED: 'bg-orange-100 text-orange-700',
    EXPORT: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Nav */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
            ← Dashboard
          </Link>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <h1 className="font-semibold text-slate-900 dark:text-white">Audit Log Viewer</h1>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Logs
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Search client..."
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Actions</option>
              <option>LOGIN</option>
              <option>DOCUMENT_UPLOAD</option>
              <option>STATUS_CHANGE</option>
              <option>APPROVAL</option>
              <option>REJECTION</option>
              <option>SAR_CREATED</option>
              <option>EXPORT</option>
            </select>
            <input type="date" className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none" />
            <input type="date" className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none" />
          </div>
        </div>

        {/* Immutable Audit Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Immutable Audit Trail</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Read-only · Retained 6 years · UAE PDPL compliant
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Immutable
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  {['Timestamp', 'User', 'Action', 'Client', 'Details'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sm text-slate-900 dark:text-white">{log.user}</div>
                      <div className="text-xs text-slate-400">{log.role.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {log.client}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Showing 8 of 1,247 entries</span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50">Previous</button>
              <button className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50">Next</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
