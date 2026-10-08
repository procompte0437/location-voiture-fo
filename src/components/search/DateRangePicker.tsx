import { useEffect, useMemo, useRef, useState } from 'react'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

const CRENEAUX = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

function debutJour(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function memeJour(a: Date | null, b: Date | null) {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formaterDateCourte(d: Date) {
  const joursCourts = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const moisCourts = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Juin',
    'Juil',
    'Aoû',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
  ]
  return `${joursCourts[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${moisCourts[d.getMonth()]}`
}

function joursDuMois(annee: number, mois: number) {
  const premier = new Date(annee, mois, 1)
  // Lundi = 0 … Dimanche = 6
  const offset = (premier.getDay() + 6) % 7
  const total = new Date(annee, mois + 1, 0).getDate()
  const cellules: (Date | null)[] = []
  for (let i = 0; i < offset; i++) cellules.push(null)
  for (let j = 1; j <= total; j++) cellules.push(new Date(annee, mois, j))
  while (cellules.length % 7 !== 0) cellules.push(null)
  return cellules
}

function extraireHeure(isoLocal: string) {
  const m = isoLocal.match(/T(\d{2}:\d{2})/)
  return m?.[1] || '10:00'
}

function combiner(date: Date, heure: string) {
  const [h, m] = heure.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h || 0, m || 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type Props = {
  pickupAt: string
  returnAt: string
  onChange: (pickupAt: string, returnAt: string) => void
  compact?: boolean
}

export function DateRangePicker({ pickupAt, returnAt, onChange, compact = false }: Props) {
  const racine = useRef<HTMLDivElement>(null)
  const [ouvert, setOuvert] = useState(false)
  const pickupDate = useMemo(() => (pickupAt ? new Date(pickupAt) : null), [pickupAt])
  const returnDate = useMemo(() => (returnAt ? new Date(returnAt) : null), [returnAt])
  const [heureDepart, setHeureDepart] = useState(() => extraireHeure(pickupAt))
  const [heureRetour, setHeureRetour] = useState(() => extraireHeure(returnAt))
  const [selectionTemp, setSelectionTemp] = useState<Date | null>(null)
  const [moisGauche, setMoisGauche] = useState(() => {
    const base = pickupDate || new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  useEffect(() => {
    setHeureDepart(extraireHeure(pickupAt))
    setHeureRetour(extraireHeure(returnAt))
  }, [pickupAt, returnAt])

  useEffect(() => {
    if (!ouvert) return
    function horsClic(e: MouseEvent) {
      if (racine.current && !racine.current.contains(e.target as Node)) {
        setOuvert(false)
        setSelectionTemp(null)
      }
    }
    document.addEventListener('mousedown', horsClic)
    return () => document.removeEventListener('mousedown', horsClic)
  }, [ouvert])

  const moisDroit = useMemo(
    () => new Date(moisGauche.getFullYear(), moisGauche.getMonth() + 1, 1),
    [moisGauche],
  )

  const debutPlage = selectionTemp || pickupDate
  const finPlage = selectionTemp ? null : returnDate

  function choisirJour(jour: Date) {
    const j = debutJour(jour)
    const aujourdhui = debutJour(new Date())
    if (j < aujourdhui) return

    if (!selectionTemp) {
      setSelectionTemp(j)
      return
    }

    let debut = selectionTemp
    let fin = j
    if (fin < debut) {
      ;[debut, fin] = [fin, debut]
    }
    onChange(combiner(debut, heureDepart), combiner(fin, heureRetour))
    setSelectionTemp(null)
    setOuvert(false)
  }

  function changerHeureDepart(h: string) {
    setHeureDepart(h)
    if (pickupDate) onChange(combiner(pickupDate, h), returnAt)
  }

  function changerHeureRetour(h: string) {
    setHeureRetour(h)
    if (returnDate) onChange(pickupAt, combiner(returnDate, h))
  }

  function renduMois(base: Date) {
    const cellules = joursDuMois(base.getFullYear(), base.getMonth())
    const aujourdhui = debutJour(new Date())

    return (
      <div className="min-w-[240px] flex-1">
        <p className="mb-3 text-center text-sm font-semibold text-ink-900">
          {MOIS[base.getMonth()]} {base.getFullYear()}
        </p>
        <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-ink-400">
          {JOURS.map((j) => (
            <span key={j} className={j === 'Sam' || j === 'Dim' ? 'text-red-400/80' : undefined}>
              {j}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cellules.map((jour, idx) => {
            if (!jour) return <span key={`v-${idx}`} className="h-9" />
            const j = debutJour(jour)
            const desactive = j < aujourdhui
            const estDebut = memeJour(j, debutPlage)
            const estFin = memeJour(j, finPlage)
            const dansPlage =
              !!debutPlage &&
              !!finPlage &&
              j > debutJour(debutPlage) &&
              j < debutJour(finPlage)
            const weekend = j.getDay() === 0 || j.getDay() === 6

            return (
              <button
                key={j.toISOString()}
                type="button"
                disabled={desactive}
                onClick={() => choisirJour(j)}
                className={[
                  'relative h-9 text-sm transition',
                  desactive ? 'cursor-not-allowed text-ink-300' : 'hover:bg-forest-900/8',
                  weekend && !estDebut && !estFin && !dansPlage ? 'text-red-500/80' : '',
                  dansPlage ? 'bg-forest-900/10 text-forest-950' : '',
                  estDebut || estFin
                    ? 'rounded-full bg-forest-900 font-semibold text-white hover:bg-forest-800'
                    : 'rounded-full',
                  dansPlage && !estDebut && !estFin ? 'rounded-none' : '',
                ].join(' ')}
              >
                {j.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div ref={racine} className="relative">
      <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2'}`}>
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          className="flex items-center gap-3 rounded-xl border border-sand-200 bg-sand-50 px-3 py-3 text-left outline-none ring-forest-600 focus:ring-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-forest-800 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-ink-400">
              Départ
            </span>
            <span className="block truncate text-sm font-semibold text-ink-900">
              {pickupDate ? formaterDateCourte(pickupDate) : 'Choisir'}
            </span>
          </span>
          <select
            value={heureDepart}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => changerHeureDepart(e.target.value)}
            className="rounded-lg border border-sand-200 bg-white px-2 py-1.5 text-sm font-medium text-ink-800"
            aria-label="Heure de départ"
          >
            {CRENEAUX.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </button>

        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          className="flex items-center gap-3 rounded-xl border border-sand-200 bg-sand-50 px-3 py-3 text-left outline-none ring-forest-600 focus:ring-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-forest-800 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-ink-400">
              Retour
            </span>
            <span className="block truncate text-sm font-semibold text-ink-900">
              {returnDate ? formaterDateCourte(returnDate) : 'Choisir'}
            </span>
          </span>
          <select
            value={heureRetour}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => changerHeureRetour(e.target.value)}
            className="rounded-lg border border-sand-200 bg-white px-2 py-1.5 text-sm font-medium text-ink-800"
            aria-label="Heure de retour"
          >
            {CRENEAUX.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </button>
      </div>

      {ouvert && (
        <div className="absolute left-0 right-0 z-30 mt-2 rounded-2xl border border-sand-200 bg-white p-4 shadow-xl shadow-forest-950/15 md:min-w-[540px]">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setMoisGauche((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
              }
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sand-200 text-ink-700 hover:bg-sand-50"
              aria-label="Mois précédent"
            >
              ‹
            </button>
            <p className="text-xs text-ink-500">
              {selectionTemp
                ? 'Choisissez la date de retour'
                : 'Sélectionnez une plage de dates'}
            </p>
            <button
              type="button"
              onClick={() =>
                setMoisGauche((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
              }
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sand-200 text-ink-700 hover:bg-sand-50"
              aria-label="Mois suivant"
            >
              ›
            </button>
          </div>
          <div className="flex flex-col gap-6 md:flex-row">
            {renduMois(moisGauche)}
            <div className="hidden w-px bg-sand-100 md:block" />
            {renduMois(moisDroit)}
          </div>
        </div>
      )}
    </div>
  )
}
