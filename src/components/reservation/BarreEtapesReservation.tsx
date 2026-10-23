export const ETAPES_RESERVATION = [
  { id: 'recherche', label: 'Recherche' },
  { id: 'conducteur', label: 'Conducteur' },
  { id: 'reservation', label: 'Réservation' },
  { id: 'protection', label: 'Protection' },
  { id: 'paiement', label: 'Demande' },
] as const

export type EtapeReservation = (typeof ETAPES_RESERVATION)[number]['id']

export function indiceEtape(id: EtapeReservation) {
  return ETAPES_RESERVATION.findIndex((etape) => etape.id === id)
}

type Props = {
  etape: EtapeReservation
  /** Retour vers une étape déjà atteinte. Les suivantes restent fermées. */
  onChoisir?: (id: EtapeReservation) => void
}

/**
 * Même barre pour le comparateur, la liste d’offres et la fiche de réservation.
 */
export function BarreEtapesReservation({ etape, onChoisir }: Props) {
  const nombre = ETAPES_RESERVATION.length
  const courant = indiceEtape(etape)
  const marge = 50 / nombre
  const portee = 100 - 100 / nombre

  return (
    <nav
      aria-label="Étapes de la réservation"
      className="rounded-xl border border-sand-200 bg-white px-3 py-5 shadow-sm sm:px-6"
    >
      <div className="relative">
        <div
          className="absolute top-4 h-1 rounded-full bg-sand-200"
          style={{ left: `${marge}%`, right: `${marge}%` }}
        />
        <div
          className="absolute top-4 h-1 rounded-full bg-forest-700 transition-all"
          style={{
            left: `${marge}%`,
            width: `${(courant / (nombre - 1)) * portee}%`,
          }}
        />
        <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${nombre}, minmax(0, 1fr))` }}>
          {ETAPES_RESERVATION.map((item, index) => {
            const atteinte = index <= courant
            const courante = item.id === etape
            return (
              <li key={item.id} className="flex flex-col items-center gap-2 text-center">
                <button
                  type="button"
                  disabled={!atteinte || (!onChoisir && !courante)}
                  onClick={() => onChoisir?.(item.id)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                    courante
                      ? 'bg-forest-700 text-white ring-4 ring-forest-100'
                      : atteinte
                        ? 'bg-forest-700 text-white'
                        : 'bg-sand-200 text-ink-500'
                  } disabled:cursor-default`}
                  aria-current={courante ? 'step' : undefined}
                >
                  {index + 1}
                </button>
                <span
                  className={`text-[11px] font-semibold leading-tight sm:text-sm ${
                    courante ? 'text-forest-900' : atteinte ? 'text-forest-700' : 'text-ink-500'
                  }`}
                >
                  {item.label}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
