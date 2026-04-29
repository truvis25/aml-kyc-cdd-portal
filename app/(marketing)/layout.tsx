import type { Metadata } from 'next';
import { Instrument_Serif, Inter } from 'next/font/google';
import { Nav } from '@/components/marketing/Nav';
import { Footer } from '@/components/marketing/Footer';

const display = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TruVis — The MLRO’s compliance workbench. Built for UAE.',
    template: '%s | TruVis',
  },
  description:
    'TruVis is the case-centric AML/KYC/CDD platform for UAE compliance teams. Onboard, screen, score and decide with hash-chained audit on every action.',
  openGraph: {
    title: 'TruVis — The MLRO’s compliance workbench',
    description:
      'Case-centric AML/KYC/CDD for UAE-regulated entities. Bahrain-resident, RLS-enforced, audit-chained.',
    type: 'website',
    locale: 'en_AE',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${display.variable} ${sans.variable} marketing-surface flex min-h-screen flex-col`}
    >
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
