import { cn } from '@/lib/utils';

export interface ComparisonRow {
  feature: string;
  truvis: string;
  competitor: string;
  truvisHighlight?: boolean;
}

export function ComparisonTable({
  competitorName,
  rows,
}: {
  competitorName: string;
  rows: ComparisonRow[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
          <tr>
            <th className="px-5 py-3 font-medium">Capability</th>
            <th className="px-5 py-3 font-medium text-blue-700">TruVis</th>
            <th className="px-5 py-3 font-medium">{competitorName}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.feature}>
              <td className="px-5 py-4 align-top font-medium text-gray-900">{r.feature}</td>
              <td
                className={cn(
                  'px-5 py-4 align-top text-gray-700',
                  r.truvisHighlight && 'bg-blue-50/60 font-medium text-blue-900',
                )}
              >
                {r.truvis}
              </td>
              <td className="px-5 py-4 align-top text-gray-700">{r.competitor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
