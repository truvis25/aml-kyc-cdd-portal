const transactions = [
  {
    id: 'TXN-88421', customer: 'Elena Volkov', amount: '$87,500.00', type: 'Wire Transfer',
    date: '2024-06-10', riskScore: 92, status: 'Open', flag: 'Large Cash Transaction',
  },
  {
    id: 'TXN-88390', customer: 'James Harrington', amount: '$45,000.00', type: 'International Transfer',
    date: '2024-06-10', riskScore: 78, status: 'Under Review', flag: 'Structuring Detected',
  },
  {
    id: 'TXN-88345', customer: 'Liang Wei', amount: '$12,300.00', type: 'Cash Deposit',
    date: '2024-06-09', riskScore: 65, status: 'Under Review', flag: 'Unusual Pattern',
  },
  {
    id: 'TXN-88210', customer: 'Dmitri Sokov', amount: '$250,000.00', type: 'Wire Transfer',
    date: '2024-06-08', riskScore: 95, status: 'Open', flag: 'Sanctioned Country',
  },
  {
    id: 'TXN-88102', customer: 'Maria Santos', amount: '$9,800.00', type: 'Cash Deposit',
    date: '2024-06-07', riskScore: 55, status: 'Resolved', flag: 'Just Under Threshold',
  },
  {
    id: 'TXN-87990', customer: 'Amara Okonkwo', amount: '$33,000.00', type: 'Crypto Exchange',
    date: '2024-06-06', riskScore: 80, status: 'Open', flag: 'Crypto Layering',
  },
  {
    id: 'TXN-87845', customer: 'Tom Fitzgerald', amount: '$5,400.00', type: 'International Transfer',
    date: '2024-06-05', riskScore: 42, status: 'Resolved', flag: 'Velocity Check',
  },
]

const statusStyle = {
  Open: 'bg-red-100 text-red-700',
  Resolved: 'bg-green-100 text-green-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
}

const riskColor = (score) => {
  if (score >= 80) return 'text-red-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-green-600'
}

const riskBarColor = (score) => {
  if (score >= 80) return 'bg-red-500'
  if (score >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

export default function AML() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">AML — Anti-Money Laundering</h2>
        <p className="text-gray-500 mt-1">Transaction monitoring and suspicious activity alerts</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{transactions.filter(t => t.status === 'Open').length}</p>
          <p className="text-sm text-red-500 mt-1">Open Alerts</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{transactions.filter(t => t.status === 'Under Review').length}</p>
          <p className="text-sm text-yellow-500 mt-1">Under Review</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{transactions.filter(t => t.status === 'Resolved').length}</p>
          <p className="text-sm text-green-500 mt-1">Resolved</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Flagged Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">Transaction ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Flag Reason</th>
                <th className="px-6 py-3">Risk Score</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-blue-600">{t.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{t.customer}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700">{t.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{t.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.flag}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${riskBarColor(t.riskScore)}`}
                          style={{ width: `${t.riskScore}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${riskColor(t.riskScore)}`}>{t.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle[t.status]}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
