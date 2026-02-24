import { useState } from 'react'

const cases = [
  {
    id: 'CDD-2024-0198', customer: 'Elena Volkov', risk: 'High', analyst: 'Sarah Mitchell',
    status: 'In Progress', opened: '2024-06-01', lastUpdate: '2024-06-10',
    notes: 'Customer has multiple high-value international transfers to sanctioned regions. Escalated to senior review.',
    checks: { pepScreening: 'Failed', sanctionsCheck: 'Failed', adverseMedia: 'Hit', sourceOfFunds: 'Pending' },
  },
  {
    id: 'CDD-2024-0195', customer: 'James Harrington', risk: 'High', analyst: 'David Okafor',
    status: 'Escalated', opened: '2024-06-05', lastUpdate: '2024-06-10',
    notes: 'Structuring pattern identified. Multiple deposits just below reporting threshold over 30 days.',
    checks: { pepScreening: 'Cleared', sanctionsCheck: 'Cleared', adverseMedia: 'Clear', sourceOfFunds: 'Unverified' },
  },
  {
    id: 'CDD-2024-0187', customer: 'Amara Okonkwo', risk: 'Medium', analyst: 'Li Xiang',
    status: 'In Progress', opened: '2024-05-28', lastUpdate: '2024-06-09',
    notes: 'Cryptocurrency transactions flagged for layering. Source of funds documentation requested.',
    checks: { pepScreening: 'Cleared', sanctionsCheck: 'Cleared', adverseMedia: 'Clear', sourceOfFunds: 'Pending' },
  },
  {
    id: 'CDD-2024-0181', customer: 'Liang Wei', risk: 'High', analyst: 'Sarah Mitchell',
    status: 'Pending Docs', opened: '2024-05-20', lastUpdate: '2024-06-07',
    notes: 'Bank statement failed verification. Customer requested to provide additional documentation.',
    checks: { pepScreening: 'Cleared', sanctionsCheck: 'Cleared', adverseMedia: 'Clear', sourceOfFunds: 'Pending' },
  },
  {
    id: 'CDD-2024-0172', customer: 'Marcus Brennan', risk: 'Low', analyst: 'Tom Davies',
    status: 'Closed', opened: '2024-05-10', lastUpdate: '2024-06-01',
    notes: 'All documentation verified. No adverse findings. Case closed.',
    checks: { pepScreening: 'Cleared', sanctionsCheck: 'Cleared', adverseMedia: 'Clear', sourceOfFunds: 'Verified' },
  },
]

const statusStyle = {
  'In Progress': 'bg-blue-100 text-blue-700',
  Escalated: 'bg-red-100 text-red-700',
  'Pending Docs': 'bg-yellow-100 text-yellow-700',
  Closed: 'bg-green-100 text-green-700',
}

const riskStyle = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-green-100 text-green-700',
}

const checkStyle = {
  Cleared: 'text-green-600',
  Clear: 'text-green-600',
  Verified: 'text-green-600',
  Failed: 'text-red-600',
  Hit: 'text-red-600',
  Pending: 'text-yellow-600',
  Unverified: 'text-red-500',
}

export default function CDD() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">CDD — Customer Due Diligence</h2>
        <p className="text-gray-500 mt-1">Manage customer due diligence cases</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Active Cases</h3>
          </div>
          <ul className="divide-y divide-gray-50 max-h-[calc(100vh-280px)] overflow-auto">
            {cases.map((c) => (
              <li
                key={c.id}
                onClick={() => setSelected(c)}
                className={`px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selected?.id === c.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-mono text-blue-600">{c.id}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyle[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800">{c.customer}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${riskStyle[c.risk]}`}>
                    {c.risk}
                  </span>
                  <span className="text-xs text-gray-400">Analyst: {c.analyst}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-mono text-blue-600 mb-1">{selected.id}</p>
                  <h3 className="text-xl font-bold text-gray-800">{selected.customer}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyle[selected.status]}`}>
                  {selected.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 uppercase font-medium mb-1">Risk Level</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${riskStyle[selected.risk]}`}>
                    {selected.risk}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 uppercase font-medium mb-1">Assigned Analyst</p>
                  <p className="font-semibold text-gray-700">{selected.analyst}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 uppercase font-medium mb-1">Opened</p>
                  <p className="font-semibold text-gray-700">{selected.opened}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 uppercase font-medium mb-1">Last Updated</p>
                  <p className="font-semibold text-gray-700">{selected.lastUpdate}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                  Compliance Checks
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'PEP Screening', key: 'pepScreening' },
                    { label: 'Sanctions Check', key: 'sanctionsCheck' },
                    { label: 'Adverse Media', key: 'adverseMedia' },
                    { label: 'Source of Funds', key: 'sourceOfFunds' },
                  ].map(({ label, key }) => (
                    <div key={key} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className={`text-sm font-semibold ${checkStyle[selected.checks[key]]}`}>
                        {selected.checks[key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Case Notes
                </h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4 leading-relaxed">
                  {selected.notes}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
              <p className="text-4xl mb-4">📋</p>
              <p className="text-lg font-medium">Select a case to view CDD details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
