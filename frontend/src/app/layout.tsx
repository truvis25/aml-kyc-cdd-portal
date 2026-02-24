import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AML/KYC/CDD Compliance Portal',
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
