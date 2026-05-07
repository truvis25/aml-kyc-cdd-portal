'use client';

/**
 * Sparkline — a pure-SVG inline trend line.
 * No external chart library; renders server-safe by using 'use client' only
 * for the window-resize guard (not strictly needed here but conventional).
 *
 * Props:
 *   data    — ordered array of numbers (oldest first)
 *   width   — SVG viewport width  (default 80)
 *   height  — SVG viewport height (default 28)
 *   color   — stroke colour       (default #3b82f6)
 *   filled  — fill area below line (default false)
 */
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  filled?: boolean;
  label?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 28,
  color = '#3b82f6',
  filled = false,
  label,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        aria-label={label ?? 'No trend data'}
        className="text-gray-200"
      >
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeWidth={1} strokeDasharray="2 2" />
      </svg>
    );
  }

  const pad = 2;
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (width - pad * 2));
  const ys = data.map((v) => height - pad - ((v - minVal) / range) * (height - pad * 2));

  const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');

  const fillPath = filled
    ? `${linePath} L${xs[xs.length - 1].toFixed(1)},${(height - pad).toFixed(1)} L${xs[0].toFixed(1)},${(height - pad).toFixed(1)} Z`
    : null;

  return (
    <svg
      width={width}
      height={height}
      aria-label={label ?? 'Trend sparkline'}
      role="img"
      className="overflow-visible"
    >
      {fillPath && (
        <path d={fillPath} fill={color} fillOpacity={0.12} stroke="none" />
      )}
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* dot on last point */}
      <circle
        cx={xs[xs.length - 1].toFixed(1)}
        cy={ys[ys.length - 1].toFixed(1)}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}
