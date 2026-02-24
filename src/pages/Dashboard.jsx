const stats = [
  { label: 'Total Customers', value: '12,847', change: '+3.2%', color: 'blue' },
  { label: 'Pending KYC', value: '284', change: '+12 today', color: 'yellow' },
  { label: 'High Risk Alerts', value: '47', change: '8 new', color: 'red' },
  { label: 'Cases Under Review', value: '136', change: '-5 resolved', color: 'purple' },
]

const recentActivity = [
  { id: 'C-10041', name: 'James Harrington', action: 'KYC Submitted', time: '5 min ago', risk: 'High' },
  { id: 'C-10039', name: 'Sofia Ramirez', action: 'Document Verified', time: '23 min ago', risk: 'Low' },
  { id: 'C-10037', name: 'Liang Wei', action: 'AML Flag Raised', time: '1 hr ago', risk: 'High' },
  { id: 'C-10035', name: 'Amara Okonkwo', action: 'CDD Case Opened', time: '2 hr ago', risk: 'Medium' },
  { id: 'C-10032', name: 'Marcus Brennan', action: 'Account Approved', time: '3 hr ago', risk: 'Low' },
  { id: 'C-10028', name: 'Elena Volkov', action: 'Suspicious Activity', time: '5 hr ago', risk: 'High' },
]

const riskBadge = (risk) => {
  const styles = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[risk]}`}>{risk}</span>
  )
}

const colorMap = {
  blue: 'border-blue-500 text-blue-600',
  yellow: 'border-yellow-500 text-yellow-600',
  red: 'border-red-500 text-red-600',
  purple: 'border-purple-500 text-purple-600',
}

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 mt-1">Overview of compliance activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${colorMap[s.color]}`}>
            <p className="text-sm text-gray-500 font-medium">{s.label}</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{s.value}</p>
            <p className={`text-sm mt-1 ${colorMap[s.color].split(' ')[1]}`}>{s.change}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Recent Customer Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">Customer ID</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentActivity.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-blue-600">{row.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{row.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{row.action}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{row.time}</td>
                  <td className="px-6 py-4">{riskBadge(row.risk)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
