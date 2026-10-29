import { useState } from 'react'
import { DESCRIPTORS } from '../../data/descriptors'

export default function ShapChart({ explanation }) {
  const [showAll, setShowAll] = useState(false)
  const all = explanation.contributions
  const items = showAll ? all : all.slice(0, 8)
  const max = Math.max(...all.map((c) => Math.abs(c.contribution)), 0.001)

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight">What drove this score</h2>
      <p className="mt-2 max-w-2xl leading-relaxed text-muted">
        Each bar shows how far a descriptor pushed this molecule&rsquo;s score toward risk
        or away from it. Values are SHAP contributions in log-odds, computed for this
        molecule specifically.
      </p>

      <div className="mt-6 flex justify-between text-xs text-muted sm:pl-[12rem] sm:pr-[4.5rem]">
        <span className="text-neg">Lowers risk</span>
        <span className="text-pos">Raises risk</span>
      </div>

      <ul className="mt-2 space-y-2">
        {items.map((c, i) => {
          const up = c.contribution > 0
          const w = (Math.abs(c.contribution) / max) * 50
          return (
            <li
              key={c.name}
              className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-x-4 gap-y-1 text-sm sm:grid-cols-[11rem_minmax(0,1fr)_3.5rem]"
            >
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <div className="truncate font-medium">{c.name}</div>
                <div className="truncate text-xs text-muted" title={DESCRIPTORS[c.name]}>
                  {DESCRIPTORS[c.name]}
                </div>
              </div>
              <div className="relative h-6">
                <div className="absolute inset-y-0 left-1/2 w-px bg-ink/30" />
                <div
                  className={`bar-grow absolute inset-y-1 rounded-sm ${up ? 'origin-left bg-pos' : 'origin-right bg-neg'}`}
                  style={{
                    ...(up ? { left: '50%' } : { right: '50%' }),
                    width: `${w}%`,
                    animationDelay: `${0.25 + i * 0.06}s`,
                  }}
                />
              </div>
              <span className={`text-right font-medium ${up ? 'text-pos' : 'text-neg'}`}>
                {up ? '+' : '−'}{Math.abs(c.contribution).toFixed(2)}
              </span>
            </li>
          )
        })}
      </ul>

      <button
        onClick={() => setShowAll((s) => !s)}
        className="mt-4 rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-ink"
      >
        {showAll ? 'Show top 8' : `Show all ${all.length} descriptors`}
      </button>
    </section>
  )
}
