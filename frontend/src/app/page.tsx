import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-8 px-4 max-w-2xl">
        {/* Logo / Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            AML/KYC/CDD Compliance Portal
          </h1>
          <p className="text-blue-200 text-lg">
            Corporate Service Provider · UAE Regulatory Framework
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
            <span>CBUAE</span>
            <span>·</span>
            <span>ADGM</span>
            <span>·</span>
            <span>DFSA</span>
            <span>·</span>
            <span>goAML Compatible</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Staff Login
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/20"
          >
            Client Onboarding
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
          {[
            { label: 'KYC / CDD / EDD', icon: '🔍' },
            { label: 'Sanctions Screening', icon: '🛡️' },
            { label: 'Risk Scoring', icon: '📊' },
            { label: 'MLRO Module', icon: '⚖️' },
            { label: 'Audit Logs', icon: '📋' },
            { label: 'goAML Export', icon: '📤' },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10"
            >
              <span>{f.icon}</span>
              <span className="text-slate-300 text-sm font-medium">{f.label}</span>
            </div>
          ))}
        </div>

        <p className="text-slate-500 text-xs">
          Compliant with UAE PDPL · AES-256 Encryption · MFA Required for Staff
        </p>
      </div>
    </main>
  );
}
