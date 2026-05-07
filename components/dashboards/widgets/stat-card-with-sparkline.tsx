import Link from 'next/link';
import { Sparkline } from './sparkline';

interface StatCardWithSparklineProps {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  urgent?: boolean;
  /** 30-point daily series, oldest-first, for the sparkline trend. */
  trend?: number[];
  trendColor?: string;
  /** Fill the area below the sparkline. */
  filled?: boolean;
}

/**
 * StatCard variant that embeds a sparkline trend line alongside the value.
 * Use for volume metrics where a directional signal matters (e.g. sessions/day).
 */
export function StatCardWithSparkline({
  label,
  value,
  hint,
  href,
  urgent,
  trend,
  trendColor,
  filled = false,
}: StatCardWithSparklineProps) {
  const inner = (
    <div
      className={`rounded-lg bg-white border p-5 shadow-sm transition-colors h-full flex flex-col justify-between gap-3 ${
        href ? 'hover:border-blue-300 hover:shadow-md cursor-pointer' : ''
      } ${urgent ? 'border-orange-200' : 'border-gray-200'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-500 leading-tight">{label}</p>
        {trend && trend.length >= 2 && (
          <Sparkline
            data={trend}
            width={64}
            height={24}
            color={trendColor ?? (urgent ? '#f97316' : '#3b82f6')}
            filled={filled}
            label={`${label} trend`}
          />
        )}
      </div>
      <div>
        <p
          className={`text-3xl font-semibold tabular-nums ${
            urgent && Number(value) > 0 ? 'text-orange-600' : 'text-gray-900'
          }`}
        >
          {value}
        </p>
        {hint && (
          <p
            className={`mt-1 text-xs ${
              urgent && Number(value) > 0 ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            {hint}
          </p>
        )}
        {href && <p className="mt-2 text-xs text-blue-600">View →</p>}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
