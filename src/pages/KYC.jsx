import { useState } from 'react'

const customers = [
  {
    id: 'C-10041', name: 'James Harrington', email: 'j.harrington@email.com',
    status: 'Pending', idVerified: false, risk: 'High',
    docs: { passport: 'Verified', utility: 'Pending', bank: 'Pending' },
    submitted: '2024-06-10',
  },
  {
    id: 'C-10039', name: 'Sofia Ramirez', email: 's.ramirez@email.com',
    status: 'Approved', idVerified: true, risk: 'Low',
    docs: { passport: 'Verified', utility: 'Verified', bank: 'Verified' },
    submitted: '2024-06-08',
  },
  {
    id: 'C-10037', name: 'Liang Wei', email: 'l.wei@email.com',
    status: 'Flagged', idVerified: true, risk: 'High',
    docs: { passport: 'Verified', utility: 'Verified', bank: 'Failed' },
    submitted: '2024-06-07',
  },
  {
    id: 'C-10035', name: 'Amara Okonkwo', email: 'a.okonkwo@email.com',
    status: 'Under Review', idVerified: false, risk: 'Medium',
    docs: { passport: 'Pending', utility: 'Verified', bank: 'Pending' },
    submitted: '2024-06-05',
  },
  {
    id: 'C-10032', name: 'Marcus Brennan', email: 'm.brennan@email.com',
    status: 'Approved', idVerified: true, risk: 'Low',
    docs: { passport: 'Verified', utility: 'Verified', bank: 'Verified' },
    submitted: '2024-06-03',
  },
  {
    id: 'C-10028', name: 'Elena Volkov', email: 'e.volkov@email.com',
    status: 'Flagged', idVerified: true, risk: 'High',
    docs: { passport: 'Verified', utility: 'Failed', bank: 'Verified' },
    submitted: '2024-06-01',
  },
]

const statusStyle = {
  Approved: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Flagged: 'bg-red-100 text-red-700',
  'Under Review': 'bg-blue-100 text-blue-700',
}

const docStyle = {
  Verified: 'text-green-600',
  Pending: 'text-yellow-600',
  Failed: 'text-red-600',
}

const riskStyle = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-green-100 text-green-700',
}

export default function KYC() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">KYC — Know Your Customer</h2>
        <p className="text-gray-500 mt-1">Manage customer identity verification</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <ul className="divide-y divide-gray-50 max-h-[calc(100vh-280px)] overflow-auto">
            {filtered.map((c) => (
              <li
                key={c.id}
                onClick={() => setSelected(c)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selected?.id === c.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.id}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusStyle[c.status]}`}>
                    {c.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selected.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{selected.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${riskStyle[selected.risk]}`}>
                  {selected.risk} Risk
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">Customer ID</p>
                  <p className="font-mono text-blue-600 font-semibold">{selected.id}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">Submitted</p>
                  <p className="font-semibold text-gray-700">{selected.submitted}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">Status</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusStyle[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">ID Verified</p>
                  <p className={`font-semibold ${selected.idVerified ? 'text-green-600' : 'text-red-500'}`}>
                    {selected.idVerified ? '✓ Verified' : '✗ Not Verified'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                  Document Status
                </h4>
                <div className="space-y-3">
                  {[
                    { label: 'Passport / National ID', key: 'passport' },
                    { label: 'Utility Bill', key: 'utility' },
                    { label: 'Bank Statement', key: 'bank' },
                  ].map(({ label, key }) => (
                    <div key={key} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                      <span className="text-sm text-gray-700">{label}</span>
                      <span className={`text-sm font-semibold ${docStyle[selected.docs[key]]}`}>
                        {selected.docs[key] === 'Verified' ? '✓' : selected.docs[key] === 'Failed' ? '✗' : '⏳'}{' '}
                        {selected.docs[key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
              <p className="text-4xl mb-4">🪪</p>
              <p className="text-lg font-medium">Select a customer to view KYC details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
