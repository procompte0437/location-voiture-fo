import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import { ContentLoader } from '../ui/Spinner'
import { formatXaf } from '../../lib/api'
import type { Vehicle } from '../../types'
import { TitreEditorial } from './TitreEditorial'

type Categorie = { slug: string; label: string }

const DUREES = [
  { jours: 1, libelle: '1 jour' },
  { jours: 3, libelle: '3 jours' },
  { jours: 7, libelle: '1 semaine' },
  { jours: 30, libelle: '1 mois' },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function isoDans(jours: number, heure = 10) {
  const d = new Date()
  d.setDate(d.getDate() + jours)
  d.setHours(heure, 0, 0, 0)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`
}

function lienModele(v: Vehicle, jours: number) {
  const qs = new URLSearchParams()
  qs.set('pickup_at', isoDans(1))
  qs.set('return_at', isoDans(1 + jours))
  qs.set('driver_age', String(v.min_driver_age || 25))
  return `/vehicules/${v.id}?${qs.toString()}`
}

/** Panneau + carrousel : le visiteur règle durée, taille et motorisation avant d’ouvrir une fiche. */
export function EstimateurPrix({
  vehicules,
  chargement,
  categories,
}: {
  vehicules: Vehicle[]
  chargement: boolean
  categories: Categorie[]
}) {
  const { labels } = useCatalog()
  const piste = useRef<HTMLDivElement>(null)
  const [jours, setJours] = useState(1)
  const [taille, setTaille] = useState('')
  const [motorisation, setMotorisation] = useState('')
  const [progression, setProgression] = useState(0.18)

  const carburants = Object.entries(labels.fuel || {})
  const duree = DUREES.find((d) => d.jours === jours) || DUREES[0]

  const filtres = useMemo(() => {
    return vehicules.filter((v) => {
      if (taille && v.category !== taille) return false
      if (motorisation && v.fuel !== motorisation) return false
      return true
    })
  }, [vehicules, taille, motorisation])

  function defiler(sens: number) {
    const el = piste.current
    if (!el) return
    el.scrollBy({ left: sens * Math.max(280, el.clientWidth * 0.72), behavior: 'smooth' })
  }

  function majProgression() {
    const el = piste.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgression(max <= 0 ? 1 : Math.max(0.18, el.scrollLeft / max))
  }

  return (
    <section id="estimateur" className="scroll-mt-24 bg-white px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-7xl">
        <TitreEditorial>Estimez rapidement le prix de votre location</TitreEditorial>

        <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="bg-accent-500 p-6 text-white">
            <h3 className="text-3xl font-extrabold leading-tight">Configurez votre location</h3>
            <div className="mt-6 space-y-3">
              <details className="group bg-white text-neutral-950">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                  <span>
                    Durée de location
                    <span className="mt-0.5 block text-xs font-medium text-neutral-500">
                      {duree.libelle}
                    </span>
                  </span>
                  <span className="text-neutral-500 transition group-open:rotate-180">▾</span>
                </summary>
                <div className="border-t border-neutral-100">
                  {DUREES.map((d) => (
                    <button
                      key={d.jours}
                      type="button"
                      onClick={() => setJours(d.jours)}
                      className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 ${
                        jours === d.jours ? 'font-semibold text-accent-600' : ''
                      }`}
                    >
                      {d.libelle}
                    </button>
                  ))}
                </div>
              </details>

              <details className="group bg-white text-neutral-950">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                  <span>
                    Taille du véhicule
                    <span className="mt-0.5 block text-xs font-medium text-neutral-500">
                      {categories.find((c) => c.slug === taille)?.label || 'Toutes'}
                    </span>
                  </span>
                  <span className="text-neutral-500 transition group-open:rotate-180">▾</span>
                </summary>
                <div className="border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setTaille('')}
                    className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 ${
                      taille === '' ? 'font-semibold text-accent-600' : ''
                    }`}
                  >
                    Toutes
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => setTaille(c.slug)}
                      className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 ${
                        taille === c.slug ? 'font-semibold text-accent-600' : ''
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </details>

              <details className="group bg-white text-neutral-950">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                  <span>
                    Motorisation
                    <span className="mt-0.5 block text-xs font-medium text-neutral-500">
                      {carburants.find(([slug]) => slug === motorisation)?.[1] || 'Toutes'}
                    </span>
                  </span>
                  <span className="text-neutral-500 transition group-open:rotate-180">▾</span>
                </summary>
                <div className="border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setMotorisation('')}
                    className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 ${
                      motorisation === '' ? 'font-semibold text-accent-600' : ''
                    }`}
                  >
                    Toutes
                  </button>
                  {carburants.map(([slug, libelle]) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setMotorisation(slug)}
                      className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 ${
                        motorisation === slug ? 'font-semibold text-accent-600' : ''
                      }`}
                    >
                      {libelle}
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </aside>

          <div className="min-w-0">
            {chargement ? (
              <div className="flex h-full min-h-72 items-center bg-neutral-100">
                <ContentLoader label="Chargement des tarifs…" />
              </div>
            ) : filtres.length === 0 ? (
              <div className="flex h-full min-h-72 items-center justify-center bg-neutral-100 px-6 text-center text-sm text-neutral-600">
                Aucun véhicule ne correspond à ces critères.
              </div>
            ) : (
              <div
                ref={piste}
                onScroll={majProgression}
                className="flex gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {filtres.map((v) => (
                  <article
                    key={v.id}
                    className="carte-fluide flex w-[min(100%,420px)] shrink-0 flex-col bg-neutral-100 p-6 sm:w-[calc(50%-0.5rem)]"
                  >
                    <p className="text-sm text-neutral-500">{v.category_label || v.category}</p>
                    <div className="flex flex-1 items-center justify-center py-4">
                      {v.cover_url ? (
                        <img
                          src={v.cover_url}
                          alt={v.display_name}
                          className="h-44 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-44 items-center text-sm text-neutral-400">Pas de photo</div>
                      )}
                    </div>
                    <p className="text-sm font-extrabold uppercase tracking-wide text-neutral-950">
                      {v.display_name}
                    </p>
                    <p className="mt-1 text-sm text-neutral-800">
                      À partir de {formatXaf(v.price_per_day)} / jour
                    </p>
                    <p className="text-xs text-neutral-500">
                      soit {formatXaf(v.price_per_day * duree.jours)} pour {duree.libelle}
                    </p>
                    <Link
                      to={lienModele(v, duree.jours)}
                      className="mt-5 inline-flex w-fit bg-accent-500 px-5 py-3 text-sm font-bold text-white hover:bg-accent-600"
                    >
                      Voir ce modèle
                    </Link>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <div className="h-1 flex-1 bg-neutral-200">
                <div
                  className="h-full bg-neutral-950 transition-[width]"
                  style={{ width: `${Math.round(progression * 100)}%` }}
                />
              </div>
              <button
                type="button"
                aria-label="Modèles précédents"
                onClick={() => defiler(-1)}
                className="px-2 text-2xl leading-none text-neutral-800 hover:text-accent-600"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Modèles suivants"
                onClick={() => defiler(1)}
                className="px-2 text-2xl leading-none text-neutral-800 hover:text-accent-600"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
