import { cn } from '@/lib/utils';

export interface Pillar {
  numeral: string;
  title: string;
  tagline: string;
  bullets: string[];
}

export function PillarCard({ pillar, className }: { pillar: Pillar; className?: string }) {
  return (
    <article
      className={cn(
        'flex flex-col rounded-2xl border border-line bg-paper p-7 transition-colors hover:border-[#D5C9B0]',
        className,
      )}
    >
      <div className="flex items-baseline gap-3 text-[12px] uppercase tracking-[0.18em] text-mute">
        <span className="font-display text-copper text-[20px]">{pillar.numeral}</span>
        <span>{pillar.title}</span>
      </div>
      <h3 className="font-display mt-5 text-[28px] leading-[1.15] text-ink">
        {pillar.tagline}
      </h3>
      <ul className="mt-6 space-y-2.5 text-[14.5px] leading-relaxed text-ink-soft">
        {pillar.bullets.map((b) => (
          <li key={b} className="flex items-start gap-3">
            <span
              className="mt-[9px] inline-block h-px w-2.5 shrink-0 bg-copper"
              aria-hidden="true"
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
