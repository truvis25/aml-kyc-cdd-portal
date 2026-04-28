import Link from 'next/link';

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  urgent?: boolean;
}

export function StatCard({ label, value, hint, href, urgent }: StatCardProps) {
  const inner = (
    <div
      className={`rounded-lg bg-white border p-5 shadow-sm transition-colors h-full ${
        href ? 'hover:border-blue-300 hover:shadow-md cursor-pointer' : ''
      } ${urgent ? 'border-orange-200' : 'border-gray-200'}`}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p
        className={`mt-1 text-3xl font-semibold ${
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
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
