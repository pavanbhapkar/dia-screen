/*
 * The dataset drawn as a screening plate: one well per drug.
 * Rows A–T hold the 477 training drugs, rows U–Y the 120 held-out test drugs.
 * Positions are illustrative; the class counts are exact (118 + 30 DIA-positive).
 */
const COLS = 24
const TRAIN_ROWS = 20 // A–T  (480 wells, 477 used)
const TEST_ROWS = 5   // U–Y  (120 wells)
const TRAIN_N = 477, TRAIN_POS = 118
const TEST_N = 120, TEST_POS = 30

const CELL = 17
const R = 6
const LEFT = 22   // room for row letters
const TOP = 20    // room for column numbers
const GAP = 16    // space between training and test blocks

// Small seeded random generator so the plate looks the same on every load
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickPositives(n, k, rand) {
  const idx = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return new Set(idx.slice(0, k))
}

function buildWells() {
  const rand = rng(42)
  const trainPos = pickPositives(TRAIN_N, TRAIN_POS, rand)
  const testPos = pickPositives(TEST_N, TEST_POS, rand)
  const wells = []

  const add = (i, rowOffset, yOffset, positive) => {
    const row = rowOffset + Math.floor(i / COLS)
    const col = i % COLS
    wells.push({
      key: `${row}-${col}`,
      cx: LEFT + col * CELL + CELL / 2,
      cy: TOP + yOffset + (row - rowOffset) * CELL + CELL / 2,
      positive,
      delay: row * 0.035 + col * 0.006,           // plate-reader scan
      hitDelay: 1.15 + rand() * 0.7,              // positives light up after the scan
    })
  }

  for (let i = 0; i < TRAIN_N; i++) add(i, 0, 0, trainPos.has(i))
  const testY = TRAIN_ROWS * CELL + GAP
  for (let i = 0; i < TEST_N; i++) add(i, TRAIN_ROWS, testY, testPos.has(i))
  return wells
}

const WELLS = buildWells()
const ROWS = 'ABCDEFGHIJKLMNOPQRSTUVWXY'.split('')
const WIDTH = LEFT + COLS * CELL + 4
const HEIGHT = TOP + (TRAIN_ROWS + TEST_ROWS) * CELL + GAP + 4

export default function AssayPlate() {
  return (
    <figure className="w-full max-w-[460px]">
      <div className="rounded-[28px] border border-line bg-surface/70 p-4 shadow-[inset_0_1px_0_white]">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label="All 597 drugs in the dataset drawn as wells on a screening plate. 148 are DIA-positive."
        >
          {/* column numbers */}
          {Array.from({ length: COLS }, (_, c) => (
            <text key={c} x={LEFT + c * CELL + CELL / 2} y={12}
              textAnchor="middle" fontSize="7" fill="var(--color-muted)">
              {c + 1}
            </text>
          ))}

          {/* row letters */}
          {ROWS.map((r, i) => {
            const y = TOP + i * CELL + CELL / 2 + (i >= TRAIN_ROWS ? GAP : 0)
            return (
              <text key={r} x={9} y={y + 2.5} textAnchor="middle"
                fontSize="7" fill="var(--color-muted)">
                {r}
              </text>
            )
          })}

          {/* divider between training and test blocks */}
          <line
            x1={LEFT} x2={WIDTH - 4}
            y1={TOP + TRAIN_ROWS * CELL + GAP / 2}
            y2={TOP + TRAIN_ROWS * CELL + GAP / 2}
            stroke="var(--color-line)" strokeDasharray="3 3"
          />

          {/* wells */}
          {WELLS.map((w) => (
            <circle
              key={w.key}
              cx={w.cx}
              cy={w.cy}
              r={R}
              className={w.positive ? 'well well-pos' : 'well'}
              fill={w.positive ? 'var(--color-pos)' : 'var(--color-surface)'}
              stroke={w.positive ? 'var(--color-pos)' : 'var(--color-line)'}
              strokeWidth="1"
              style={{
                animationDelay: w.positive
                  ? `${w.delay}s, ${w.hitDelay}s`
                  : `${w.delay}s`,
              }}
            />
          ))}
        </svg>
      </div>

      <figcaption className="mt-4 space-y-2 text-sm text-muted">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-pos" /> DIA-positive (148)
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-line bg-surface" /> DIA-negative (449)
          </span>
        </div>
        <p>
          Each well is one drug. Rows A to T are the 477 training drugs, rows U to Y
          the 120 test drugs the model never saw during training.
        </p>
      </figcaption>
    </figure>
  )
}
