import { FALSE_NEGATIVE, KNOWN_DRUGS } from '../../data/descriptors'

function LabelDot({ positive }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${positive ? 'bg-pos' : 'border border-neg bg-surface'}`}
      aria-hidden="true"
    />
  )
}

export default function MoleculeInput({
  smiles, setSmiles, onCheck, onPick, loading, error, examples, backendDown,
}) {
  const negatives = examples.filter((ex) => ex.Label === 0)
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Check a molecule</h1>
      <p className="mt-2 leading-relaxed text-muted">
        Paste a SMILES string, the one-line text notation chemists use to write a structure.
      </p>

      <form
        className="mt-6"
        onSubmit={(e) => { e.preventDefault(); onCheck() }}
      >
        <label htmlFor="smiles" className="text-sm font-medium">SMILES</label>
        <textarea
          id="smiles"
          rows={3}
          value={smiles}
          spellCheck={false}
          autoComplete="off"
          placeholder="CC(=O)Nc1ccc(O)cc1"
          onChange={(e) => setSmiles(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onCheck() }
          }}
          className="mt-2 w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 font-mono text-sm leading-relaxed outline-none transition-colors placeholder:text-muted/60 focus:border-ink"
        />
        {error && <p role="alert" className="mt-2 text-sm text-pos">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-full bg-pos px-6 py-3 font-medium text-white transition-colors hover:bg-ink disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? 'Checking…' : 'Check molecule'}
        </button>
      </form>

      {backendDown && (
        <p className="mt-4 rounded-xl border border-pos/30 bg-pos/5 p-3 text-sm text-pos">
          The backend isn&rsquo;t running. Start it from the backend folder with
          <code className="mt-1 block font-mono text-xs">python -m uvicorn main:app --reload</code>
        </p>
      )}

      <div className="mt-10">
        <h2 className="text-sm font-semibold">Well-known drugs</h2>
        <ul className="mt-3 space-y-1">
          {KNOWN_DRUGS.map((d) => (
            <li key={d.name}>
              <button
                onClick={() => onPick(d.smiles)}
                className="w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface"
              >
                <span className="block text-sm font-medium">{d.name}</span>
                <span className="block text-xs text-muted">{d.note}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {negatives.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold">Test-set drugs with known outcomes</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            The model never saw these during training, so you can compare its call with the real label.
          </p>
          <ul className="mt-3 space-y-1">
            <li>
              <button
                onClick={() => onPick(FALSE_NEGATIVE.smiles)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface"
              >
                <LabelDot positive />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{FALSE_NEGATIVE.name}</span>
                  <span className="block text-xs text-muted">{FALSE_NEGATIVE.note}</span>
                </span>
              </button>
            </li>
            {negatives.map((ex) => (
              <li key={ex.SMILES}>
                <button
                  onClick={() => onPick(ex.SMILES)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface"
                >
                  <LabelDot positive={ex.Label === 1} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs">{ex.SMILES}</span>
                    <span className="block text-xs text-muted">
                      Known {ex.Label === 1 ? 'DIA-positive' : 'DIA-negative'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}