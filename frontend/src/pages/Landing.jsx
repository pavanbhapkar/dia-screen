import Header from '../components/Header'
import AssayPlate from '../components/AssayPlate'

const STEPS = [
  {
    title: 'Enter a structure',
    text: 'Paste a SMILES string, or pick one of the example drugs.',
  },
  {
    title: 'Descriptors are calculated',
    text: 'RDKit computes the 20 molecular descriptors the model was trained on, such as surface-area and charge distributions.',
  },
  {
    title: 'Read the result',
    text: 'You get a risk score against the decision threshold, the descriptors that drove it, and the five most similar drugs with known outcomes.',
  },
]

// Held-out test set results, tuned XGBoost at threshold 0.48
const RESULTS = [
  { label: 'Ranking quality (ROC-AUC)', value: '0.88', note: 'How often a risky drug scores higher than a safe one' },
  { label: 'Accuracy', value: '83%', note: '100 of 120 test drugs classified correctly' },
  { label: 'Risky drugs caught', value: '15 of 30', note: 'Recall of 0.50 at the 0.48 threshold' },
  { label: 'False alarms', value: '5 of 90', note: 'Safe drugs wrongly flagged as risky' },
]

export default function Landing({ onStart }) {
  return (
    <div className="min-h-screen">
      <Header onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })} onStart={onStart} />

      {/* ---------- Hero ---------- */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-14 lg:grid-cols-[1fr_auto] lg:pt-20">
        <div className="max-w-xl">
          <h1 className="text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            Flag autoimmunity risk in a drug candidate from its structure alone.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted">
            Drug-induced autoimmunity is a rare side effect that often surfaces only
            after a drug reaches patients. DIA Screen estimates the risk from a
            molecule&rsquo;s structure, shows which structural features drove the
            score, and lists the most similar drugs with known outcomes.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              onClick={onStart}
              className="rounded-full bg-pos px-7 py-3.5 text-base font-medium text-white transition-colors hover:bg-ink"
            >
              Check a molecule
            </button>
            <span className="text-sm text-muted">No sign-up. Results in about a second.</span>
          </div>
        </div>

        <AssayPlate />
      </section>

      {/* ---------- How a check works ---------- */}
      <section className="border-t border-line bg-surface/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">How a check works</h2>
          <ol className="mt-8 grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink text-sm font-semibold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Results ---------- */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              How it performed on drugs it never saw
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              Tuned XGBoost on 20 selected descriptors, scored on the 120-drug held-out
              test set after all training and tuning was finished.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left">
              <tbody>
                {RESULTS.map((r) => (
                  <tr key={r.label} className="border-t border-line last:border-b">
                    <th scope="row" className="py-4 pr-6 font-medium">{r.label}</th>
                    <td className="py-4 pr-6 text-2xl font-semibold tracking-tight">{r.value}</td>
                    <td className="py-4 text-sm text-muted">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------- Limits ---------- */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-[minmax(0,22rem)_1fr]">
          <h2 className="text-2xl font-semibold tracking-tight">Limits to keep in mind</h2>
          <ul className="space-y-3 leading-relaxed text-muted">
            <li>The model learned from 597 drugs, so molecules unlike any of them get a reliability warning.</li>
            <li>At the current threshold it catches about half of risky drugs. Treat a low score as &ldquo;no signal found&rdquo;, not as proof of safety.</li>
            <li>This is a research prototype for early screening, not a substitute for clinical safety testing.</li>
          </ul>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted sm:flex-row sm:justify-between">
          <span>Data: UCI Machine Learning Repository, drug-induced autoimmunity dataset</span>
          <span>TE7483 Applications and Use Cases of Machine Learning, SIT Pune</span>
        </div>
      </footer>
    </div>
  )
}
