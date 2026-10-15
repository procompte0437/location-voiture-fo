import { useEffect, useRef, useState } from 'react'

/** Créneaux toutes les 30 minutes, de 07:00 à 20:00 (comme CarJet). */
export const CRENEAUX_HORAIRE = Array.from({ length: (20 - 7) * 2 + 1 }, (_, i) => {
  const total = 7 * 60 + i * 30
  const h = String(Math.floor(total / 60)).padStart(2, '0')
  const m = String(total % 60).padStart(2, '0')
  return `${h}:${m}`
})

type Props = {
  valeur: string
  onChange: (heure: string) => void
  libelle: string
  className?: string
}

/**
 * Choix d’horaire : case blanche, icône horloge, liste déroulante scrollable.
 */
export function SelecteurHoraire({ valeur, onChange, libelle, className = '' }: Props) {
  const racine = useRef<HTMLDivElement>(null)
  const listeRef = useRef<HTMLUListElement>(null)
  const [ouvert, setOuvert] = useState(false)

  useEffect(() => {
    if (!ouvert) return
    function horsClic(e: MouseEvent) {
      if (racine.current && !racine.current.contains(e.target as Node)) {
        setOuvert(false)
      }
    }
    document.addEventListener('mousedown', horsClic)
    return () => document.removeEventListener('mousedown', horsClic)
  }, [ouvert])

  useEffect(() => {
    if (!ouvert || !listeRef.current) return
    const actif = listeRef.current.querySelector<HTMLElement>('[data-actif="true"]')
    actif?.scrollIntoView({ block: 'nearest' })
  }, [ouvert, valeur])

  return (
    <div ref={racine} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={libelle}
        aria-expanded={ouvert}
        aria-haspopup="listbox"
        onClick={() => setOuvert((o) => !o)}
        className="flex h-12 w-full items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-left text-sm font-medium text-neutral-900 shadow-sm outline-none ring-forest-600 focus:ring-2"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-neutral-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" strokeLinecap="round" />
        </svg>
        <span className="flex-1 tabular-nums">{valeur}</span>
        <span className="text-[10px] text-neutral-400" aria-hidden>
          {ouvert ? '▴' : '▾'}
        </span>
      </button>

      {ouvert && (
        <ul
          ref={listeRef}
          role="listbox"
          aria-label={libelle}
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-xl"
        >
          {CRENEAUX_HORAIRE.map((creneau) => {
            const actif = creneau === valeur
            return (
              <li key={creneau} role="option" aria-selected={actif}>
                <button
                  type="button"
                  data-actif={actif ? 'true' : undefined}
                  onClick={() => {
                    onChange(creneau)
                    setOuvert(false)
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm tabular-nums ${
                    actif
                      ? 'bg-neutral-100 font-semibold text-neutral-950'
                      : 'text-neutral-800 hover:bg-neutral-50'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8v4l3 2" strokeLinecap="round" />
                  </svg>
                  {creneau}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
