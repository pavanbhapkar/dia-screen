// A small 96-well plate that scans column by column while a molecule is being checked
export default function ScanPlate({ className = 'h-16 w-24' }) {
  const wells = []
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 12; c++)
      wells.push(
        <circle
          key={`${r}-${c}`}
          cx={5 + c * 9}
          cy={5 + r * 9}
          r={3.4}
          className="scan-well"
          stroke="var(--color-line)"
          strokeWidth="1"
          style={{ animationDelay: `${c * 0.07}s` }}
        />
      )
  return (
    <svg viewBox="0 0 108 72" className={className} aria-hidden="true">
      {wells}
    </svg>
  )
}
