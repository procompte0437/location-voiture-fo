import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { CRENEAUX_HORAIRE } from './SelecteurHoraire'

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

function debutJour(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function memeJour(a: Date | null, b: Date | null) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function versIso(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function depuisIso(iso: string) {
  if (!iso) return null
  const d = new Date(`${iso}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : debutJour(d)
}

function normaliser(a: Date, b: Date) {
  return b < a ? { debut: b, fin: a } : { debut: a, fin: b }
}

function joursDuMois(annee: number, mois: number) {
  const premier = new Date(annee, mois, 1)
  const offset = (premier.getDay() + 6) % 7
  const total = new Date(annee, mois + 1, 0).getDate()
  const cellules: (Date | null)[] = []
  for (let i = 0; i < offset; i++) cellules.push(null)
  for (let j = 1; j <= total; j++) cellules.push(new Date(annee, mois, j))
  while (cellules.length % 7 !== 0) cellules.push(null)
  return cellules
}

type Props = {
  dateDepart: string
  dateRetour: string
  heureDepart: string
  heureRetour: string
  onChoisirDates: (depart: string, retour: string) => void
  onChoisirHeures: (depart: string, retour: string) => void
  onFermer: () => void
}

/**
 * Deux mois côte à côte. Dès que la plage est complète (clic ou glisser),
 * elle est appliquée et le panneau se ferme — pas de bouton Valider.
 */
export function CalendrierPlage({
  dateDepart,
  dateRetour,
  heureDepart,
  heureRetour,
  onChoisirDates,
  onChoisirHeures,
  onFermer,
}: Props) {
  const debutGlisse = useRef<Date | null>(null)
  const survolRef = useRef<Date | null>(null)
  const aGlisse = useRef(false)
  /** Ignore le click fantôme qui suit un mousedown (début de plage ou fin de glisser). */
  const ignorerClic = useRef(false)
  const onChoisirDatesRef = useRef(onChoisirDates)
  const onFermerRef = useRef(onFermer)
  const [enGlisse, setEnGlisse] = useState(false)
  const [debutSel, setDebutSel] = useState<Date | null>(() => depuisIso(dateDepart))
  const [finSel, setFinSel] = useState<Date | null>(() => depuisIso(dateRetour))
  const [survol, setSurvol] = useState<Date | null>(null)
  const [moisGauche, setMoisGauche] = useState(() => {
    const base = depuisIso(dateDepart) || new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  useEffect(() => {
    onChoisirDatesRef.current = onChoisirDates
    onFermerRef.current = onFermer
  }, [onChoisirDates, onFermer])

  const moisDroit = useMemo(
    () => new Date(moisGauche.getFullYear(), moisGauche.getMonth() + 1, 1),
    [moisGauche],
  )

  function confirmerPlage(debut: Date, fin: Date) {
    const plage = normaliser(debutJour(debut), debutJour(fin))
    setDebutSel(plage.debut)
    setFinSel(plage.fin)
    setSurvol(null)
    onChoisirDatesRef.current(versIso(plage.debut), versIso(plage.fin))
    onFermerRef.current()
  }

  useEffect(() => {
    function finGlisse() {
      const debut = debutGlisse.current
      const fin = survolRef.current
      if (debut && fin) {
        const plage = normaliser(debutJour(debut), debutJour(fin))
        if (!memeJour(plage.debut, plage.fin)) {
          // Glisser terminé sur une vraie plage → applique tout de suite.
          aGlisse.current = true
          ignorerClic.current = true
          confirmerPlage(plage.debut, plage.fin)
        } else {
          // Simple pressé-relâché sur un jour : c’est le départ, on attend le retour.
          aGlisse.current = false
          ignorerClic.current = true
          setDebutSel(plage.debut)
          setFinSel(null)
        }
      }
      setEnGlisse(false)
      setSurvol(null)
      debutGlisse.current = null
      survolRef.current = null
    }
    if (!enGlisse) return
    document.addEventListener('mouseup', finGlisse)
    return () => document.removeEventListener('mouseup', finGlisse)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- confirmerPlage via refs
  }, [enGlisse])

  const finAffiche = finSel || (debutSel && survol ? normaliser(debutSel, survol).fin : null)
  const debutAffiche =
    debutSel && (finSel || survol) ? normaliser(debutSel, finSel || survol!).debut : debutSel

  function surClicJour(jour: Date) {
    if (ignorerClic.current) {
      ignorerClic.current = false
      return
    }
    if (aGlisse.current) {
      aGlisse.current = false
      return
    }
    const j = debutJour(jour)
    if (j < debutJour(new Date())) return
    // Nouveau départ (rien, ou plage déjà complète qu’on recommence).
    if (!debutSel || finSel) {
      setDebutSel(j)
      setFinSel(null)
      setSurvol(null)
      return
    }
    // 2ᵉ clic = date de retour → applique et ferme (même jour autorisé si heures différentes).
    confirmerPlage(debutSel, j)
  }

  function surPresse(jour: Date, e: MouseEvent) {
    e.preventDefault()
    const j = debutJour(jour)
    if (j < debutJour(new Date())) return
    aGlisse.current = false

    // Déjà un départ sans retour : le glisser part du départ existant (ne pas l’écraser).
    if (debutSel && !finSel) {
      debutGlisse.current = debutSel
      survolRef.current = j
      setEnGlisse(true)
      setSurvol(j)
      return
    }

    debutGlisse.current = j
    survolRef.current = j
    setEnGlisse(true)
    setDebutSel(j)
    setFinSel(null)
    setSurvol(j)
  }

  function surEntre(jour: Date) {
    const j = debutJour(jour)
    if (j < debutJour(new Date())) return
    if (enGlisse || (debutSel && !finSel)) {
      survolRef.current = j
      setSurvol(j)
    }
  }

  function renduMois(base: Date) {
    const cellules = joursDuMois(base.getFullYear(), base.getMonth())
    const aujourdhui = debutJour(new Date())
    return (
      <div className="min-w-[240px] flex-1 select-none">
        <p className="mb-3 text-center text-sm font-semibold text-neutral-900">
          {MOIS[base.getMonth()]} {base.getFullYear()}
        </p>
        <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-neutral-400">
          {JOURS.map((j) => (
            <span key={j}>{j}</span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cellules.map((jour, idx) => {
            if (!jour) return <span key={`v-${base.getMonth()}-${idx}`} className="h-9" />
            const j = debutJour(jour)
            const desactive = j < aujourdhui
            const estDebut = memeJour(j, debutAffiche)
            const estFin = memeJour(j, finAffiche)
            const dansPlage =
              !!debutAffiche && !!finAffiche && j > debutAffiche && j < finAffiche
            return (
              <button
                key={j.toISOString()}
                type="button"
                disabled={desactive}
                onClick={() => surClicJour(j)}
                onMouseDown={(e) => surPresse(j, e)}
                onMouseEnter={() => surEntre(j)}
                className={[
                  'h-9 text-sm',
                  desactive ? 'cursor-not-allowed text-neutral-300' : 'cursor-pointer',
                  dansPlage ? 'bg-forest-600/25 text-forest-950' : '',
                  estDebut || estFin ? 'rounded-sm bg-forest-600 font-semibold text-white' : '',
                  !dansPlage && !estDebut && !estFin && !desactive ? 'hover:bg-forest-600/10' : '',
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
    <div className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,640px)] rounded-md border border-neutral-200 bg-white p-4 text-neutral-900 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMoisGauche((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200"
          aria-label="Mois précédent"
        >
          ‹
        </button>
        <p className="px-2 text-center text-xs text-neutral-500">
          {debutSel && !finSel
            ? 'Passez la souris jusqu’à la date de retour'
            : 'Cliquez ou glissez pour choisir la plage'}
        </p>
        <button
          type="button"
          onClick={() => setMoisGauche((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200"
          aria-label="Mois suivant"
        >
          ›
        </button>
      </div>
      <div className="flex flex-col gap-6 md:flex-row">
        {renduMois(moisGauche)}
        <div className="hidden w-px bg-neutral-100 md:block" />
        {renduMois(moisDroit)}
      </div>
      <div className="mt-4 grid gap-3 border-t border-neutral-100 pt-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-neutral-500">
          Heure de départ
          <select
            value={heureDepart}
            onChange={(e) => onChoisirHeures(e.target.value, heureRetour)}
            className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-2 text-sm text-neutral-900"
          >
            {CRENEAUX_HORAIRE.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-neutral-500">
          Heure de retour
          <select
            value={heureRetour}
            onChange={(e) => onChoisirHeures(heureDepart, e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-2 text-sm text-neutral-900"
          >
            {CRENEAUX_HORAIRE.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
