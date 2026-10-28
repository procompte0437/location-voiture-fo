import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ContentLoader } from '../ui/Spinner'
import { formatXaf } from '../../lib/api'
import type { Vehicle } from '../../types'

type Scenario = {
  mode: 'agence' | 'livraison'
  jours: number
  duree: string
  phrase: (modele: string, ville: string) => string
}

/** Quelques durées types : le visiteur voit un prix réel, pas une grille abstraite. */
const SCENARIOS: Scenario[] = [
  {
    mode: 'agence',
    jours: 1,
    duree: '1 jour',
    phrase: (modele, ville) =>
      `${modele} pour la journée, à ${ville}. Le prix affiché est celui de la location.`,
  },
  {
    mode: 'livraison',
    jours: 3,
    duree: 'week-end',
    phrase: (modele) =>
      `${modele} pour le week-end. Le montant est connu avant de confirmer.`,
  },
  {
    mode: 'agence',
    jours: 7,
    duree: '1 semaine',
    phrase: (modele, ville) =>
      `${modele} pour une semaine à ${ville}. Le tarif suit le nombre de jours.`,
  },
  {
    mode: 'livraison',
    jours: 2,
    duree: '2 jours',
    phrase: (modele, ville) =>
      `${modele} livré à ${ville}. Le montant affiché couvre la location.`,
  },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function lienExemple(v: Vehicle, jours: number) {
  const iso = (decalage: number) => {
    const d = new Date()
    d.setDate(d.getDate() + decalage)
    d.setHours(10, 0, 0, 0)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`
  }
  const qs = new URLSearchParams()
  qs.set('pickup_at', iso(1))
  qs.set('return_at', iso(1 + jours))
  qs.set('driver_age', String(v.min_driver_age || 25))
  return `/vehicules/${v.id}?${qs.toString()}`
}

export function CarrouselExemples({
  vehicules,
  chargement,
}: {
  vehicules: Vehicle[]
  chargement: boolean
}) {
  const piste = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const exemples = useMemo(() => vehicules.slice(0, 6), [vehicules])

  useEffect(() => {
    setIndex(0)
    piste.current?.scrollTo({ left: 0 })
  }, [exemples])

  useEffect(() => {
    if (exemples.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = piste.current
    if (!el) return

    let enPause = false
    const pauser = () => {
      enPause = true
    }
    const reprendre = () => {
      enPause = false
    }
    el.addEventListener('pointerenter', pauser)
    el.addEventListener('pointerleave', reprendre)
    el.addEventListener('focusin', pauser)
    el.addEventListener('focusout', reprendre)

    const minuteur = window.setInterval(() => {
      if (enPause || document.hidden) return
      const largeur = el.clientWidth
      if (!largeur) return
      const courant = Math.round(el.scrollLeft / largeur)
      const suivant = (courant + 1) % exemples.length
      el.scrollTo({ left: suivant * largeur, behavior: 'smooth' })
    }, 5500)

    return () => {
      window.clearInterval(minuteur)
      el.removeEventListener('pointerenter', pauser)
      el.removeEventListener('pointerleave', reprendre)
      el.removeEventListener('focusin', pauser)
      el.removeEventListener('focusout', reprendre)
    }
  }, [exemples.length])

  function lireIndex() {
    const el = piste.current
    if (!el || !el.clientWidth) return
    setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  function aller(cible: number) {
    const el = piste.current
    if (!el) return
    const borne = ((cible % exemples.length) + exemples.length) % exemples.length
    el.scrollTo({ left: borne * el.clientWidth, behavior: 'smooth' })
  }

  if (chargement) {
    return (
      <div className="mt-12 flex min-h-72 items-center bg-white">
        <ContentLoader label="Chargement des exemples…" />
      </div>
    )
  }

  if (exemples.length === 0) {
    return (
      <p className="mt-12 text-center text-sm text-ink-700">
        Les exemples s’afficheront dès que des véhicules seront publiés.
      </p>
    )
  }

  return (
    <div className="mt-12" role="region" aria-roledescription="carrousel" aria-label="Exemples de locations">
      <div
        ref={piste}
        onScroll={lireIndex}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {exemples.map((v, i) => {
          const scenario = SCENARIOS[i % SCENARIOS.length]
          const ville = v.agency?.city || v.partner.city || 'Libreville'
          const modele = v.category_label || v.display_name
          const livraison = scenario.mode === 'livraison'
          return (
            <article key={v.id} className="w-full shrink-0 snap-center px-0.5">
              <div className="grid overflow-hidden bg-white shadow-[0_20px_50px_rgba(20,32,26,0.08)] md:min-h-[380px] md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
                <div className="relative min-h-56 bg-marque-voile md:min-h-full">
                  {v.cover_url ? (
                    <img
                      src={v.cover_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#f0a038_0%,transparent_42%),linear-gradient(160deg,#e7f3ec,#c5ddd0)]" />
                  )}
                  <span className="absolute left-4 top-4 bg-marque-encre px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                    {livraison ? 'livraison' : 'location en agence'}
                  </span>
                </div>

                <div className="flex flex-col justify-between gap-8 p-6 sm:p-8 md:p-10">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-marque-500">
                      Exemple {String(i + 1).padStart(2, '0')}
                    </p>
                    <p className="mt-4 font-display text-[1.45rem] font-semibold leading-snug text-ink-900 md:text-[1.7rem]">
                      « {scenario.phrase(modele, ville)} »
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                      {v.display_name} · {scenario.duree} · {ville}
                    </p>
                    <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                      <p className="border-l-4 border-marque-500 pl-3 font-affiche text-4xl leading-none tracking-wide text-ink-900 md:text-5xl">
                        {formatXaf(v.price_per_day * scenario.jours)}
                      </p>
                      <Link
                        to={lienExemple(v, scenario.jours)}
                        className="inline-flex items-center gap-2 bg-marque-encre px-5 py-3 text-sm font-semibold text-white hover:bg-ink-900"
                      >
                        En savoir plus
                        <span aria-hidden>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {exemples.length > 1 && (
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2" role="tablist" aria-label="Choisir un exemple">
            {exemples.map((v, i) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Exemple ${i + 1} : ${v.display_name}`}
                onClick={() => aller(i)}
                className={`h-2.5 rounded-full transition-[width,background-color] duration-300 ${
                  i === index ? 'w-8 bg-marque-encre' : 'w-2.5 bg-ink-900/25 hover:bg-ink-900/50'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Exemple précédent"
              onClick={() => aller(index - 1)}
              className="grid h-11 w-11 place-items-center border border-ink-900/20 bg-white text-lg text-ink-900 hover:border-marque-encre hover:text-marque-encre"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Exemple suivant"
              onClick={() => aller(index + 1)}
              className="grid h-11 w-11 place-items-center border border-ink-900/20 bg-white text-lg text-ink-900 hover:border-marque-encre hover:text-marque-encre"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
