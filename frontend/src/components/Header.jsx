function PlateMark() {
  // 3x3 mini plate, one positive well
  const dots = []
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      dots.push(
        <circle key={`${r}${c}`} cx={4 + c * 8} cy={4 + r * 8} r={2.8}
          fill={r === 1 && c === 2 ? 'var(--color-pos)' : 'none'}
          stroke={r === 1 && c === 2 ? 'var(--color-pos)' : 'var(--color-ink)'}
          strokeWidth="1.2" />
      )
  return <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">{dots}</svg>
}

export default function Header({ onHome, onStart, showCta = true }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <button onClick={onHome} className="flex items-center gap-2.5 rounded-md">
          <PlateMark />
          <span className="text-lg font-semibold tracking-tight">DIA Screen</span>
        </button>
        {showCta && (
          <button
            onClick={onStart}
            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-surface transition-colors hover:bg-pos"
          >
            Check a molecule
          </button>
        )}
      </div>
    </header>
  )
}
