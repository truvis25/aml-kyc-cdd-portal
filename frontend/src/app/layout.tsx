import type { Metadata } from 'next';
import './globals.css';
import pkg from '../../package.json';

export const metadata: Metadata = {
  title: `AML/KYC/CDD Compliance Portal v${pkg.version}`,
  description: 'Corporate Service Provider Compliance Management Platform',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
