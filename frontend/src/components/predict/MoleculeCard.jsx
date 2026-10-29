import { useState } from 'react'
import Viewer3D from './Viewer3D'

export default function MoleculeCard({ result }) {
  const { svg, mol3d, properties: pr, canonical_smiles } = result
  const [view, setView] = useState(mol3d ? '3d' : '2d')

  const tab = (id, label) => (
    <button
      onClick={() => setView(id)}
      disabled={id === '3d' && !mol3d}
      aria-pressed={view === id}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        view === id ? 'bg-ink text-surface' : 'text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col rounded-[28px] border border-line bg-surface p-6">
      <div className="mx-auto flex rounded-full border border-line p-1">
        {tab('3d', '3D model')}
        {tab('2d', '2D structure')}
      </div>

      <div className="mt-4">
        {view === '3d' && mol3d ? (
          <Viewer3D molblock={mol3d} />
        ) : (
          <div
            className="mx-auto w-full max-w-[22rem] [&_svg]:h-auto [&_svg]:w-full"
            role="img"
            aria-label={`Structure of ${pr.formula}`}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
        {!mol3d && (
          <p className="mt-2 text-center text-xs text-muted">A 3D model could not be built for this molecule.</p>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm">
        <div><dt className="text-muted">Formula</dt><dd className="font-medium">{pr.formula}</dd></div>
        <div><dt className="text-muted">Molecular weight</dt><dd className="font-medium">{pr.mol_weight} g/mol</dd></div>
        <div><dt className="text-muted">Heavy atoms</dt><dd className="font-medium">{pr.heavy_atoms}</dd></div>
        <div><dt className="text-muted">Rings</dt><dd className="font-medium">{pr.rings}</dd></div>
      </dl>
      <p className="mt-4 break-all font-mono text-xs text-muted">{canonical_smiles}</p>
    </div>
  )
}
