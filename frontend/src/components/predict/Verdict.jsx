import { useEffect, useState } from 'react'

const DOMAIN = {
  in_domain: { label: 'Similar to the training drugs', text: 'The model has learned from structurally similar drugs, so this score is more trustworthy.', cls: 'border-neg/40 bg-neg/5 text-neg' },
  borderline: { label: 'Partly similar to the training drugs', text: 'The model has seen only loosely related drugs. Treat this score with some caution.', cls: 'border-warn/50 bg-warn/5 text-warn' },
  out_of_domain: { label: 'Unlike the training drugs', text: 'Nothing in the training data resembles this molecule, so this score may be unreliable.', cls: 'border-pos/40 bg-pos/5 text-pos' },
}

export default function Verdict({ result }) {
  const { probability: p, threshold: t, is_positive: positive, domain, in_training_set, neighbours } = result
  const [marker, setMarker] = useState(0)
  const [shown, setShown] = useState(0)

  // Slide the marker and count the score up from 0, together (1 s, ease-out)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMarker(p)
      setShown(p)
      return
    }
    let raf
    let start
    const step = (ts) => {
      if (start === undefined) start = ts
      const k = Math.min((ts - start) / 1000, 1)
      setShown(p * (1 - Math.pow(1 - k, 3)))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    const id = setTimeout(() => {
      setMarker(p)
      raf = requestAnimationFrame(step)
    }, 60)
    return () => {
      clearTimeout(id)
      cancelAnimationFrame(raf)
    }
  }, [p])

  const d = DOMAIN[domain.status]
  const exact = in_training_set ? neighbours.find((n) => n.similarity >= 1) : null

  return (
    <div className="rounded-[28px] border border-line bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className={`text-3xl font-semibold tracking-tight ${positive ? 'text-pos' : 'text-neg'}`}>
            {positive ? 'Risk signal found' : 'No risk signal found'}
          </h2>
          <p className="mt-2 max-w-md leading-relaxed text-muted">
            {positive
              ? `The score is above the ${t} threshold, so the model flags this molecule as likely to cause drug-induced autoimmunity.`
              : `The score is below the ${t} threshold. The model catches about half of risky drugs, so treat this as no signal found, not as proof of safety.`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-semibold tracking-tight" aria-hidden="true">{shown.toFixed(2)}</div>
          <span className="sr-only">Risk score {p.toFixed(2)}</span>
          <div className="text-sm text-muted">Risk score</div>
        </div>
      </div>

      {/* Score strip */}
      <div className="relative mt-8 h-12" aria-hidden="true">
        <div className="absolute inset-x-0 top-6 h-2 rounded-full bg-line/70" />
        <div className="absolute top-6 h-2 rounded-r-full bg-pos/25" style={{ left: `${t * 100}%`, right: 0 }} />
        <div className="absolute top-3 h-8 w-px bg-ink" style={{ left: `${t * 100}%` }} />
        <span
          className="absolute -top-1 -translate-x-1/2 whitespace-nowrap text-xs text-muted"
          style={{ left: `${t * 100}%` }}
        >
          Threshold {t}
        </span>
        <div
          className="absolute top-[18px] h-5 w-5 -translate-x-1/2 rounded-full border-2 border-surface shadow-[0_0_0_1px_var(--color-line)] transition-[left] duration-1000 ease-out"
          style={{ left: `${marker * 100}%`, background: positive ? 'var(--color-pos)' : 'var(--color-neg)' }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>0 lower risk</span><span>higher risk 1</span>
      </div>

      {/* Reliability */}
      <div className={`mt-7 rounded-2xl border p-4 ${d.cls}`}>
        <p className="font-medium">{d.label}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink/80">{d.text}</p>
        <p className="mt-2 text-xs text-muted">
          Closest training drug similarity {domain.max_similarity.toFixed(2)}
          {domain.out_of_range.length > 0 &&
            `. ${domain.out_of_range.length} descriptor${domain.out_of_range.length > 1 ? 's' : ''} outside the training range`}
        </p>
      </div>

      {exact && (
        <p className="mt-4 rounded-2xl border border-line p-4 text-sm leading-relaxed">
          This exact molecule is in the training data, labelled <strong>{exact.label_text}</strong>.
          The score reflects what the model learned from it rather than a fresh prediction.
        </p>
      )}
    </div>
  )
}
