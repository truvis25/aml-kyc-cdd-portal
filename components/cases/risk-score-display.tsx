import type { RiskBand } from '@/modules/risk/risk.types';

interface RiskScoreDisplayProps {
  score: number;
  band: RiskBand;
  compact?: boolean;
}

const BAND_STYLES: Record<RiskBand, { bg: string; border: string; text: string; label: string }> = {
  low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'Low' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: 'Medium' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: 'High' },
  unacceptable: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Unacceptable' },
};

export function RiskScoreDisplay({ score, band, compact = false }: RiskScoreDisplayProps) {
  const styles = BAND_STYLES[band];

  if (compact) {
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${styles.bg} ${styles.border} ${styles.text}`}>
        {styles.label} ({score})
      </span>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${styles.bg} ${styles.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-semibold ${styles.text}`}>{styles.label} Risk</p>
          <p className={`text-2xl font-bold ${styles.text} mt-1`}>{score}<span className="text-sm font-normal">/100</span></p>
        </div>
        <div className="h-12 w-12 rounded-full border-4 flex items-center justify-center" style={{ borderColor: 'currentColor' }}>
          <span className={`text-xs font-bold ${styles.text}`}>{score}</span>
        </div>
      </div>
      <div className="mt-3">
        <div className="h-2 w-full rounded-full bg-white/50">
          <div
            className={`h-2 rounded-full ${band === 'low' ? 'bg-green-500' : band === 'medium' ? 'bg-yellow-500' : band === 'high' ? 'bg-orange-500' : 'bg-red-500'}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
