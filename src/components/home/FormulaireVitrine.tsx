import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendrierPlage } from '../search/CalendrierPlage'
import { EcranTransitionRecherche } from './EcranTransitionRecherche'
import api from '../../lib/api'
import type { Location } from '../../types'

type ResumeDisponibilite = {
  disponibles: number
  categories: { slug: string; libelle: string; disponibles: number }[]
}

/** Évite un second appel au tout premier affichage (React rappelle le rendu). */
let cleDisponibiliteLancee = ''

function lancerDisponibilite(
  cle: string,
  params: { pickup_at: string; return_at: string; location_id?: string | number; driver_age?: number },
  signal: AbortSignal,
) {
  if (cleDisponibiliteLancee === cle) return null
  cleDisponibiliteLancee = cle
  return api.get('/vehicules/disponibilite', { signal, params })
}

/** Total et détail par catégorie, affichés dès que la plage horaire est connue. */
function ResumePlage({
  chargement,
  resume,
}: {
  chargement: boolean
  resume: ResumeDisponibilite | null
}) {
  if (chargement && !resume) {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm text-white/80">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        Calcul des véhicules disponibles…
      </p>
    )
  }

  if (!resume) return null

  const aucun = resume.disponibles === 0

  return (
    <div className="mt-3 rounded-md bg-black/25 px-3 py-2.5 text-sm">
      <p className={aucun ? 'font-semibold text-red-200' : 'font-semibold text-white'}>
        {aucun
          ? 'Aucun véhicule disponible sur cette plage.'
          : `${resume.disponibles} véhicule${resume.disponibles > 1 ? 's' : ''} disponible${resume.disponibles > 1 ? 's' : ''} sur cette plage.`}
      </p>
      {resume.categories.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {resume.categories.map((categorie) => (
            <li
              key={categorie.slug}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                categorie.disponibles === 0
                  ? 'bg-white/10 text-white/50'
                  : 'bg-white text-neutral-900'
              }`}
            >
              {categorie.libelle} · {categorie.disponibles}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function datePlus(jours: number) {
  const d = new Date()
  d.setDate(d.getDate() + jours)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function combiner(date: string, heure: string) {
  return `${date}T${heure}`
}

function formaterDateCourte(isoDate: string) {
  if (!isoDate) return 'Date'
  const d = new Date(`${isoDate}T12:00:00`)
  const jours = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.']
  const mois = [
    'Jan.',
    'Fév.',
    'Mar.',
    'Avr.',
    'Mai',
    'Juin',
    'Juil.',
    'Aoû.',
    'Sep.',
    'Oct.',
    'Nov.',
    'Déc.',
  ]
  return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]}`
}

/**
 * Formulaire de comparaison type easyCar : barre sombre, champs blancs, CTA vert.
 */
export function FormulaireVitrine() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const blocLieu = useRef<HTMLDivElement>(null)
  const [lieux, setLieux] = useState<Location[]>([])
  const [texteLieu, setTexteLieu] = useState('')
  const [locationId, setLocationId] = useState<string | number>('')
  const [memeLieu, setMemeLieu] = useState(true)
  const [retourId, setRetourId] = useState<string | number>('')
  const [dateDepart, setDateDepart] = useState(() => datePlus(1))
  const [heureDepart, setHeureDepart] = useState('10:30')
  const [dateRetour, setDateRetour] = useState(() => datePlus(4))
  const [heureRetour, setHeureRetour] = useState('10:30')
  const [ageStandard, setAgeStandard] = useState(true)
  const [ageSaisi, setAgeSaisi] = useState('21')
  const [listeOuverte, setListeOuverte] = useState(false)
  const [calendrierOuvert, setCalendrierOuvert] = useState(false)
  const [enTransition, setEnTransition] = useState(false)
  const [erreur, setErreur] = useState('')
  const [resumeDispo, setResumeDispo] = useState<ResumeDisponibilite | null>(null)
  const [chargementDispo, setChargementDispo] = useState(true)
  const blocDates = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const delai = window.setTimeout(() => {
      void api.get('/locations/popular').then(({ data }) => setLieux(data.data || []))
    }, 0)
    return () => window.clearTimeout(delai)
  }, [])

  useEffect(() => {
    if (!listeOuverte && !calendrierOuvert) return
    function horsClic(e: MouseEvent) {
      const cible = e.target as Node
      if (listeOuverte && blocLieu.current && !blocLieu.current.contains(cible)) {
        setListeOuverte(false)
      }
      // Clic hors calendrier : on ferme ; la plage a déjà été appliquée dès qu’elle est complète.
      if (calendrierOuvert && blocDates.current && !blocDates.current.contains(cible)) {
        setCalendrierOuvert(false)
      }
    }
    document.addEventListener('mousedown', horsClic)
    return () => document.removeEventListener('mousedown', horsClic)
  }, [listeOuverte, calendrierOuvert])

  const ageConducteur = ageStandard ? 25 : Number(ageSaisi)
  const parametresDispo = {
    pickup_at: combiner(dateDepart, heureDepart),
    return_at: combiner(dateRetour, heureRetour),
    location_id: locationId || undefined,
    driver_age: Number.isFinite(ageConducteur) ? ageConducteur : undefined,
  }
  const cleDispo = `${parametresDispo.pickup_at}|${parametresDispo.return_at}|${parametresDispo.location_id ?? ''}|${parametresDispo.driver_age ?? ''}`
  const plageValide = (() => {
    const depart = new Date(parametresDispo.pickup_at)
    const retour = new Date(parametresDispo.return_at)
    return Boolean(dateDepart && dateRetour) && !Number.isNaN(depart.getTime()) && retour > depart
  })()

  // Avant les useEffect du reste de la page : le serveur PHP local ne traite qu’une requête à la fois.
  if (plageValide && cleDisponibiliteLancee === '') {
    const controleInitial = new AbortController()
    const promesse = lancerDisponibilite(cleDispo, parametresDispo, controleInitial.signal)
    void promesse
      ?.then(({ data }) => setResumeDispo(data.data))
      .catch((err: { code?: string }) => {
        if (err?.code === 'ERR_CANCELED') return
        setResumeDispo(null)
      })
      .finally(() => setChargementDispo(false))
  }

  // Dès que la plage change, on recalcule sans relancer le premier appel déjà parti.
  useEffect(() => {
    if (!plageValide) {
      setResumeDispo(null)
      setChargementDispo(false)
      return
    }
    if (cleDisponibiliteLancee === cleDispo) return

    const controle = new AbortController()
    const delai = window.setTimeout(() => {
      setChargementDispo(true)
      const promesse = lancerDisponibilite(cleDispo, parametresDispo, controle.signal)
      void promesse
        ?.then(({ data }) => setResumeDispo(data.data))
        .catch((err: { code?: string }) => {
          if (controle.signal.aborted || err?.code === 'ERR_CANCELED') return
          setResumeDispo(null)
        })
        .finally(() => {
          if (!controle.signal.aborted) setChargementDispo(false)
        })
    }, 120)

    return () => {
      window.clearTimeout(delai)
      controle.abort()
    }
  }, [cleDispo, plageValide, parametresDispo.pickup_at, parametresDispo.return_at, parametresDispo.location_id, parametresDispo.driver_age])

  const dureeJours = useMemo(() => {
    const depart = new Date(combiner(dateDepart, heureDepart))
    const retour = new Date(combiner(dateRetour, heureRetour))
    if (Number.isNaN(depart.getTime()) || retour <= depart) return 0
    return Math.max(1, Math.ceil((retour.getTime() - depart.getTime()) / 86400000))
  }, [dateDepart, heureDepart, dateRetour, heureRetour])

  const suggestions = useMemo(() => {
    const terme = texteLieu.trim().toLowerCase()
    if (!terme) return lieux
    return lieux.filter((l) => `${l.name} ${l.city || ''}`.toLowerCase().includes(terme))
  }, [lieux, texteLieu])

  function choisirLieu(lieu: Location) {
    setLocationId(lieu.id)
    setTexteLieu(lieu.city ? `${lieu.name} — ${lieu.city}` : lieu.name)
    setListeOuverte(false)
    setErreur('')
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const depart = new Date(combiner(dateDepart, heureDepart))
    const retour = new Date(combiner(dateRetour, heureRetour))
    if (!dateDepart || !dateRetour || Number.isNaN(depart.getTime()) || retour <= depart) {
      setErreur('La date de retour doit être après le départ.')
      return
    }
    if (resumeDispo && resumeDispo.disponibles === 0) {
      setErreur('Aucun véhicule n’est libre sur cette plage. Choisissez d’autres dates ou un autre lieu.')
      return
    }
    const age = ageStandard ? 25 : Number(ageSaisi)
    if (!ageStandard && (!Number.isFinite(age) || age < 18 || age > 99)) {
      setErreur('Indiquez l’âge du conducteur (18 ans ou plus).')
      return
    }

    const qs = new URLSearchParams()
    qs.set('pickup_at', combiner(dateDepart, heureDepart))
    qs.set('return_at', combiner(dateRetour, heureRetour))
    qs.set('driver_age', String(age))
    if (locationId) qs.set('location_id', String(locationId))
    if (texteLieu) qs.set('location_label', texteLieu)
    if (!memeLieu && retourId) {
      qs.set('return_location_id', String(retourId))
      qs.set('different_return', '1')
    } else if (locationId) {
      qs.set('return_location_id', String(locationId))
    }
    if (params.get('retrait') === 'livraison') qs.set('retrait', 'livraison')
    setCalendrierOuvert(false)
    setEnTransition(true)
    window.setTimeout(() => navigate(`/recherche?${qs.toString()}`), 1800)
  }

  function ouvrirCalendrier() {
    setListeOuverte(false)
    setCalendrierOuvert(true)
  }

  function caseDateHeure(dateIso: string, heure: string, libelle: string) {
    return (
      <button
        type="button"
        onClick={ouvrirCalendrier}
        aria-label={libelle}
        className="flex h-12 w-full items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-left text-sm font-medium text-neutral-900 shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
        <span className="min-w-0 flex-1 truncate">{formaterDateCourte(dateIso)}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" strokeLinecap="round" />
        </svg>
        <span className="tabular-nums">{heure}</span>
      </button>
    )
  }

  const champ =
    'h-12 w-full rounded-md border-0 bg-white px-3 text-sm text-neutral-900 outline-none ring-2 ring-transparent focus:ring-forest-600'

  return (
    <form
      onSubmit={onSubmit}
      className="w-full rounded-xl bg-neutral-900/80 p-4 text-white shadow-2xl backdrop-blur-sm md:p-5"
    >
      <h1 className="text-xl font-bold md:text-2xl">Comparer les offres de location de voitures</h1>

      <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_auto]">
        <div ref={blocLieu} className="relative">
          <label htmlFor="lieu-prise" className="sr-only">
            Lieu de prise en charge
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              id="lieu-prise"
              value={texteLieu}
              autoComplete="off"
              placeholder="Le lieu de prise en charge"
              onChange={(e) => {
                setTexteLieu(e.target.value)
                setLocationId('')
                setListeOuverte(true)
              }}
              onFocus={() => setListeOuverte(true)}
              className={`${champ} pl-9`}
            />
          </div>
          {listeOuverte && (
            <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-auto rounded-md bg-white text-neutral-900 shadow-xl">
              {suggestions.length === 0 ? (
                <li className="px-3 py-3 text-sm text-neutral-500">Aucun lieu ne correspond.</li>
              ) : (
                suggestions.map((lieu) => (
                  <li key={lieu.id}>
                    <button
                      type="button"
                      onClick={() => choisirLieu(lieu)}
                      className="block w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50"
                    >
                      <span className="font-medium">{lieu.name}</span>
                      {lieu.city && <span className="text-neutral-500"> · {lieu.city}</span>}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        <div ref={blocDates} className="relative grid gap-2 sm:grid-cols-2 lg:col-span-2">
          {caseDateHeure(dateDepart, heureDepart, 'Date et heure de départ')}
          {caseDateHeure(dateRetour, heureRetour, 'Date et heure de retour')}
          {calendrierOuvert && (
            <CalendrierPlage
              dateDepart={dateDepart}
              dateRetour={dateRetour}
              heureDepart={heureDepart}
              heureRetour={heureRetour}
              onChoisirDates={(depart, retour) => {
                // Toujours deux dates distinctes dans les champs départ / retour.
                setDateDepart(depart)
                setDateRetour(retour)
                setErreur('')
              }}
              onChoisirHeures={(depart, retour) => {
                setHeureDepart(depart)
                setHeureRetour(retour)
              }}
              onFermer={() => setCalendrierOuvert(false)}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={resumeDispo?.disponibles === 0 || (chargementDispo && !resumeDispo)}
          className="h-12 rounded-md bg-forest-600 px-6 text-sm font-bold text-white transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:bg-neutral-500 lg:min-w-[8.5rem]"
        >
          {resumeDispo?.disponibles === 0 ? 'Aucun véhicule' : 'Recherchez'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/90">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={memeLieu}
            onChange={(e) => setMemeLieu(e.target.checked)}
            className="size-4 rounded border-white/40 accent-forest-600"
          />
          Restitution au même endroit
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={ageStandard}
            onChange={(e) => setAgeStandard(e.target.checked)}
            className="size-4 rounded border-white/40 accent-forest-600"
          />
          Le conducteur a-t-il entre 25 et 70 ans ?
        </label>
        {!ageStandard && (
          <label className="inline-flex items-center gap-2 text-neutral-900">
            <span className="text-white/90">Âge du conducteur :</span>
            <input
              type="number"
              min={18}
              max={99}
              required
              value={ageSaisi}
              onChange={(e) => setAgeSaisi(e.target.value)}
              className="h-9 w-20 rounded-md bg-white px-2 text-sm"
              aria-label="Âge du conducteur"
            />
          </label>
        )}
        {dureeJours > 0 && (
          <span className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 shadow-sm">
            Durée de la location : {dureeJours} jour{dureeJours > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <ResumePlage chargement={chargementDispo} resume={resumeDispo} />

      {!memeLieu && (
        <select
          aria-label="Lieu de restitution"
          value={retourId}
          onChange={(e) => setRetourId(e.target.value)}
          className="mt-3 h-11 w-full max-w-md rounded-md bg-white px-3 text-sm text-neutral-900"
        >
          <option value="">Lieu de restitution…</option>
          {lieux.map((lieu) => (
            <option key={lieu.id} value={lieu.id}>
              {lieu.name}
            </option>
          ))}
        </select>
      )}

      {erreur && <p className="mt-2 text-sm font-medium text-red-300">{erreur}</p>}
      {enTransition && <EcranTransitionRecherche />}
    </form>
  )
}
