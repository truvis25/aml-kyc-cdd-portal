import Link from 'next/link';

// Risk level badge component
function RiskBadge({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const colors = {
    LOW: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[level]}`}>
      {level}
    </span>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    ACTIVE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    PENDING_MLRO: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    PENDING_RM_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    IN_PROGRESS: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
  };
  const label = status.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {label}
    </span>
  );
}

// Metric card
function MetricCard({
  title, value, subtitle, color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${color ?? 'text-slate-900 dark:text-white'}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  // In production: fetch real data from API
  const stats = {
    totalClients: 248,
    pendingReview: 12,
    highRisk: 7,
    pendingMLRO: 3,
    approved: 201,
    rejected: 25,
  };

  const recentClients = [
    { id: '1', name: 'Acme Holdings Ltd', type: 'LEGAL_ENTITY', status: 'PENDING_MLRO', risk: 'HIGH', rm: 'Sarah Ali' },
    { id: '2', name: 'Mohammed Al-Rashidi', type: 'INDIVIDUAL', status: 'PENDING_RM_REVIEW', risk: 'MEDIUM', rm: 'James Chen' },
    { id: '3', name: 'Gulf Trade LLC', type: 'LEGAL_ENTITY', status: 'RISK_ASSESSED', risk: 'LOW', rm: 'Sarah Ali' },
    { id: '4', name: 'Priya Sharma', type: 'INDIVIDUAL', status: 'DOCUMENTS_UPLOADED', risk: undefined, rm: 'James Chen' },
    { id: '5', name: 'Emirates Ventures', type: 'LEGAL_ENTITY', status: 'APPROVED', risk: 'LOW', rm: 'Ahmad Hassan' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">AML/KYC Portal</span>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/clients" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600">Clients</Link>
              <Link href="/mlro" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600">MLRO</Link>
              <Link href="/audit" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600">Audit</Link>
              <Link href="/admin" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600">Admin</Link>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Compliance Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Overview of onboarding cases and compliance status
          </p>
        </div>

        {/* Alert: Pending MLRO Approvals */}
        {stats.pendingMLRO > 0 && (
          <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-orange-800 dark:text-orange-300 font-medium text-sm">
                {stats.pendingMLRO} cases require MLRO approval
              </p>
            </div>
            <Link href="/mlro" className="text-orange-600 dark:text-orange-400 text-sm font-medium hover:underline">
              Review →
            </Link>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <MetricCard title="Total Clients" value={stats.totalClients} />
          <MetricCard title="Pending Review" value={stats.pendingReview} color="text-blue-600" />
          <MetricCard title="High Risk" value={stats.highRisk} color="text-red-600" />
          <MetricCard title="Pending MLRO" value={stats.pendingMLRO} color="text-orange-600" />
          <MetricCard title="Approved" value={stats.approved} color="text-green-600" />
          <MetricCard title="Rejected" value={stats.rejected} color="text-slate-500" />
        </div>

        {/* Recent Cases Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent Onboarding Cases</h2>
            <Link href="/clients" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  {['Client', 'Type', 'Status', 'Risk', 'RM', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {recentClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white text-sm">
                        {client.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {client.type === 'LEGAL_ENTITY' ? '🏢 Entity' : '👤 Individual'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={client.status} />
                    </td>
                    <td className="px-6 py-4">
                      {client.risk ? (
                        <RiskBadge level={client.risk as 'LOW' | 'MEDIUM' | 'HIGH'} />
                      ) : (
                        <span className="text-xs text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{client.rm}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
