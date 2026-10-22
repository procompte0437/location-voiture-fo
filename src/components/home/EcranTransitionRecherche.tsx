import { useEffect, useState } from 'react'
import { LogoDoto } from '../layout/LogoDoto'

const POINTS = [
  'Prix annoncé en FCFA avant le départ',
  'Partenaires vérifiés par DOTO',
  'Paiement Mobile Money ou carte',
]

/**
 * Écran d’attente entre le clic Recherchez et la liste des offres.
 */
export function EcranTransitionRecherche() {
  const [progression, setProgression] = useState(8)

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgression((p) => (p >= 92 ? 92 : p + 7))
    }, 160)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-white">
      <div className="bg-forest-700 py-4 text-center">
        <div className="inline-flex items-center gap-2">
          <LogoDoto className="h-14 w-14" />
          <p className="font-display text-2xl font-bold text-white">DOTO</p>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-6 pt-16 text-center">
        <p className="text-lg font-semibold text-neutral-950">Recherche</p>
        <p className="mt-2 text-sm text-neutral-700">
          parmi les agences partenaires
          <br />
          pour trouver le meilleur prix pour vous…
        </p>
        <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full bg-forest-600 transition-all duration-150"
            style={{ width: `${progression}%` }}
          />
        </div>
        <ul className="mt-8 space-y-2 text-left text-sm text-forest-800">
          {POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2">
              <span aria-hidden>✓</span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
