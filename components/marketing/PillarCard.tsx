import { cn } from '@/lib/utils';

export interface Pillar {
  title: string;
  tagline: string;
  bullets: string[];
}

export function PillarCard({ pillar, className }: { pillar: Pillar; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
        {pillar.title}
      </div>
      <h3 className="mt-2 text-xl font-semibold text-gray-900">{pillar.tagline}</h3>
      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {pillar.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
