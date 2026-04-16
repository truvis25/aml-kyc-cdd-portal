import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | TruVis AML Platform',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
