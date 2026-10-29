import { DESCRIPTORS } from '../../data/descriptors'

export default function DescriptorTable({ descriptors }) {
  return (
    <details className="group rounded-[28px] border border-line bg-surface">
      <summary className="cursor-pointer list-none px-6 py-5 font-semibold">
        <span className="mr-2 inline-block transition-transform group-open:rotate-90" aria-hidden="true">›</span>
        All 20 descriptor values for this molecule
      </summary>
      <div className="overflow-x-auto px-6 pb-6">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th className="pb-2 pr-4 font-medium">Descriptor</th>
              <th className="pb-2 pr-4 text-right font-medium">Value</th>
              <th className="pb-2 font-medium">Position among training drugs</th>
            </tr>
          </thead>
          <tbody>
            {descriptors.map((d) => (
              <tr key={d.name} className="border-t border-line">
                <td className="py-2.5 pr-4">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted">{DESCRIPTORS[d.name]}</div>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  {d.value === null ? 'n/a' : d.value.toFixed(2)}
                </td>
                <td className="py-2.5">
                  {d.percentile === null ? (
                    <span className="text-muted">n/a</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="relative h-1.5 flex-1 rounded-full bg-line/70">
                        <div
                          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
                          style={{ left: `${d.percentile}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs text-muted">
                        {Math.round(d.percentile)}%
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
