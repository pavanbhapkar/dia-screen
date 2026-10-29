import { useEffect, useState } from 'react'
import Landing from './pages/Landing'
import Predict from './pages/Predict'

export default function App() {
  const [page, setPage] = useState('landing')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  return page === 'landing'
    ? <Landing onStart={() => setPage('predict')} />
    : <Predict onHome={() => setPage('landing')} />
}
