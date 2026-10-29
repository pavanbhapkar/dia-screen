export default function Neighbours({ neighbours }) {
  const positives = neighbours.filter((n) => n.label === 1).length
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight">Most similar training drugs</h2>
      <p className="mt-2 max-w-2xl leading-relaxed text-muted">
        The five training drugs closest in structure, measured by Tanimoto similarity on
        Morgan fingerprints (1 means identical). {positives} of {neighbours.length} are
        known to cause drug-induced autoimmunity.
      </p>

      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {neighbours.map((n, i) => (
          <li key={`${n.smiles}-${i}`} className="flex flex-col rounded-2xl border border-line bg-surface p-3">
            <div
              className="[&_svg]:h-auto [&_svg]:w-full"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: n.svg }}
            />
            <div className="mt-2 flex items-center gap-2 text-sm font-medium">
              <span
                className={`h-2.5 w-2.5 rounded-full ${n.label === 1 ? 'bg-pos' : 'border border-neg bg-surface'}`}
                aria-hidden="true"
              />
              {n.label_text}
            </div>
            <div className="mt-0.5 text-xs text-muted">Similarity {n.similarity.toFixed(2)}</div>
            <div className="mt-1 truncate font-mono text-[11px] text-muted" title={n.smiles}>{n.smiles}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}
