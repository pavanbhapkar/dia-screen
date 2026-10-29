import { useEffect, useState } from 'react'
import Header from '../components/Header'
import MoleculeInput from '../components/predict/MoleculeInput'
import Verdict from '../components/predict/Verdict'
import MoleculeCard from '../components/predict/MoleculeCard'
import ShapChart from '../components/predict/ShapChart'
import Neighbours from '../components/predict/Neighbours'
import DescriptorTable from '../components/predict/DescriptorTable'
import ScanPlate from '../components/predict/ScanPlate'

const BACKEND_DOWN = 'Cannot reach the backend. Start it from the backend folder with: python -m uvicorn main:app --reload'

function EmptyState({ loading }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center rounded-[28px] border border-dashed border-line px-6 text-center">
      {loading ? (
        <ScanPlate className="h-20 w-32" />
      ) : (
        <svg viewBox="0 0 72 40" className="h-10 w-20" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={6 + (i % 6) * 12} cy={i < 6 ? 8 : 28} r={4.5}
              fill="none" stroke="var(--color-line)" strokeWidth="1.2" />
          ))}
        </svg>
      )}
      <p className="mt-5 max-w-sm leading-relaxed text-muted">
        {loading
          ? 'Calculating descriptors and scoring the molecule…'
          : 'Enter a SMILES string or pick a drug from the list to see its risk score, what drove it, and the most similar known drugs.'}
      </p>
    </div>
  )
}

export default function Predict({ onHome }) {
  const [smiles, setSmiles] = useState('')
  const [examples, setExamples] = useState([])
  const [backendDown, setBackendDown] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/examples')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setExamples)
      .catch(() => setBackendDown(true))
  }, [])

  async function check(value = smiles) {
    const s = value.trim()
    if (!s) {
      setError('Enter a SMILES string, or pick a drug from the list.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smiles: s }),
      })
      const data = await r.json().catch(() => null)
      if (!r.ok) {
        if (r.status === 422 && data && typeof data.detail === 'string') throw new Error(data.detail)
        if (r.status === 422) throw new Error('Could not read this SMILES string. Check it for typos.')
        throw new Error(BACKEND_DOWN)
      }
      setResult(data)
      setBackendDown(false)
    } catch (e) {
      setError(e.message === 'Failed to fetch' ? BACKEND_DOWN : e.message)
    } finally {
      setLoading(false)
    }
  }

  function pick(s) {
    setSmiles(s)
    check(s)
    if (window.innerWidth < 1024) {
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 150)
    }
  }

  return (
    <div className="min-h-screen">
      <Header onHome={onHome} showCta={false} />

      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[21rem_minmax(0,1fr)] lg:gap-14 lg:py-14">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <MoleculeInput
            smiles={smiles}
            setSmiles={setSmiles}
            onCheck={() => check()}
            onPick={pick}
            loading={loading}
            error={error}
            examples={examples}
            backendDown={backendDown}
          />
        </aside>

        <section id="results" aria-live="polite" className="min-w-0 scroll-mt-6">
          {!result ? (
            <EmptyState loading={loading} />
          ) : (
            <div className="relative">
            {loading && (
              <div className="sticky top-6 z-10 mx-auto mb-4 flex w-fit items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 text-sm text-muted shadow-sm">
                <ScanPlate className="h-6 w-9" />
                Scoring the molecule…
              </div>
            )}
            <div className={`space-y-14 transition-opacity ${loading ? 'opacity-40' : ''}`}>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
                <Verdict key={result.canonical_smiles} result={result} />
                <MoleculeCard result={result} />
              </div>
              <ShapChart key={`shap-${result.canonical_smiles}`} explanation={result.explanation} />
              <Neighbours neighbours={result.neighbours} />
              <DescriptorTable descriptors={result.descriptors} />
            </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
