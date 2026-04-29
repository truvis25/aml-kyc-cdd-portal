'use client';

interface ComparisonRow {
  feature: string;
  truvis: string | React.ReactNode;
  competitor: string | React.ReactNode;
}

export function ComparisonTable({
  competitor,
  rows,
}: {
  competitor: string;
  rows: ComparisonRow[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th className="bg-paper px-6 py-4 text-left text-[14px] font-semibold text-ink">
              Feature
            </th>
            <th className="bg-cream px-6 py-4 text-left text-[14px] font-semibold text-ink">
              TruVis
            </th>
            <th className="bg-paper px-6 py-4 text-left text-[14px] font-semibold text-ink">
              {competitor}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-line-soft">
              <td className="bg-paper px-6 py-5 text-[14px] font-medium text-ink">
                {row.feature}
              </td>
              <td className="bg-cream px-6 py-5 text-[14px] text-ink-soft">
                <CheckOrText value={row.truvis} />
              </td>
              <td className="bg-paper px-6 py-5 text-[14px] text-ink-soft">
                <CheckOrText value={row.competitor} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CheckOrText({ value }: { value: string | React.ReactNode }) {
  if (typeof value === 'string' && value === '✓') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-copper/10 text-copper">
        ✓
      </span>
    );
  }
  if (typeof value === 'string' && value === '—') {
    return <span className="text-mute">—</span>;
  }
  return <>{value}</>;
}
