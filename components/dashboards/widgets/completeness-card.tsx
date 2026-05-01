import Link from 'next/link';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Signal {
  label: string;
  done: boolean;
  href: string;
}

interface CompletenessCardProps {
  title: string;
  percent: number;
  completed: number;
  total: number;
  signals: Signal[];
}

export function CompletenessCard({ title, percent, completed, total, signals }: CompletenessCardProps) {
  const allDone = completed === total;
  const barColor = allDone
    ? 'bg-green-500'
    : percent >= 50
      ? 'bg-blue-500'
      : 'bg-amber-500';

  return (
    <div className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <span
          className={cn(
            'tabular-nums text-sm font-semibold',
            allDone ? 'text-green-600' : 'text-gray-900',
          )}
        >
          {completed}/{total}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${percent}%` }}
          aria-hidden="true"
        />
      </div>

      <ul className="mt-4 space-y-2">
        {signals.map((s) => (
          <li key={s.label} className="text-sm">
            <Link
              href={s.href}
              className="flex items-center justify-between gap-2 rounded -mx-1 px-1 py-1 hover:bg-gray-50"
            >
              <span className="flex items-center gap-2">
                {s.done ? (
                  <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                )}
                <span className={s.done ? 'text-gray-500 line-through' : 'text-gray-800'}>
                  {s.label}
                </span>
              </span>
              {!s.done ? (
                <span aria-hidden="true" className="text-mute text-xs">
                  Set up →
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
