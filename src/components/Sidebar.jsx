import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/kyc', label: 'KYC', icon: '🪪' },
  { path: '/aml', label: 'AML', icon: '🔍' },
  { path: '/cdd', label: 'CDD', icon: '📋' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">ComplianceHub</h1>
        <p className="text-xs text-gray-400 mt-1">AML / KYC / CDD Portal</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
            CA
          </div>
          <div>
            <p className="text-sm font-medium text-white">Compliance Admin</p>
            <p className="text-xs text-gray-400">admin@compliancehub.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
