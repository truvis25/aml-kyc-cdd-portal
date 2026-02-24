import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import KYC from './pages/KYC'
import AML from './pages/AML'
import CDD from './pages/CDD'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/kyc" element={<KYC />} />
            <Route path="/aml" element={<AML />} />
            <Route path="/cdd" element={<CDD />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
