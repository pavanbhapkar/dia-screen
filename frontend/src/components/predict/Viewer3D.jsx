import { useEffect, useRef, useState } from 'react'

// Rotatable ball-and-stick model rendered with 3Dmol.js
export default function Viewer3D({ molblock }) {
  const ref = useRef(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const el = ref.current
    let viewer = null
    let observer = null
    let cancelled = false
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setStatus('loading')

    import('3dmol')
      .then((mod) => {
        if (cancelled || !el) return
        const lib = mod.createViewer ? mod : mod.default
        viewer = lib.createViewer(el, { backgroundColor: '#F6F8F9', antialias: true })
        viewer.addModel(molblock, 'sdf')
        viewer.setStyle({}, {
          stick: { radius: 0.13, colorscheme: 'Jmol' },
          sphere: { scale: 0.23, colorscheme: 'Jmol' },
        })
        viewer.resize()        // measure the real card size before fitting
        viewer.zoomTo()
        viewer.zoom(1.3)       // fill the card; safe while spinning
        viewer.render()

        // Keep the model fitted if the card changes size (window resize, layout shift)
        observer = new ResizeObserver(() => {
          viewer.resize()
          viewer.render()
        })
        observer.observe(el)
        if (!reduce) viewer.spin('y', 0.5)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))

    return () => {
      cancelled = true
      observer?.disconnect()
      try {
        viewer?.spin(false)
        viewer?.clear()
      } catch {
        /* viewer already gone */
      }
      if (el) el.innerHTML = ''
    }
  }, [molblock])

  return (
    <div>
      <div className="relative h-64 w-full overflow-hidden rounded-2xl">
        <div
          ref={ref}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          role="img"
          aria-label="Rotatable 3D model of the molecule"
        />
        {status === 'loading' && (
          <p className="absolute inset-0 grid place-items-center text-sm text-muted">Building 3D model…</p>
        )}
        {status === 'error' && (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted">
            The 3D viewer could not load. Switch to 2D to see the structure.
          </p>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-muted">Drag to rotate. Scroll to zoom.</p>
    </div>
  )
}