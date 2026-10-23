import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BandeauConfiance } from '../components/home/BandeauConfiance'
import { CarteProvincesGabon } from '../components/home/CarteProvincesGabon'
import { EstimateurPrix } from '../components/home/EstimateurPrix'
import { FormulaireVitrine } from '../components/home/FormulaireVitrine'
import { BarreEtapesReservation } from '../components/reservation/BarreEtapesReservation'
import { Header } from '../components/layout/Header'
import { PiedDePage } from '../components/layout/PiedDePage'
import { Apparition } from '../components/ui/Apparition'
import api, { formatXaf } from '../lib/api'
import type { Vehicle } from '../types'

type HomeCatalog = {
  contents: Record<string, string>
  reassurance: { id: number; title: string; text: string }[]
  categories: { id: number; slug: string; label: string; description?: string }[]
}

/** SUV sur route — fond du comparateur (écrasé si le catalogue fournit home.hero_image_url). */
const PHOTO_HERO_DEFAUT =
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=2200&q=80'

function TitreSection({ ligne1, ligne2 }: { ligne1: string; ligne2?: string }) {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-extrabold tracking-tight text-neutral-950 md:text-5xl">
        {ligne1}
        {ligne2 && <span className="mt-1 block text-[0.62em] font-bold">{ligne2}</span>}
      </h2>
      <span className="mx-auto mt-4 block h-[3px] w-14 bg-neutral-950" />
    </div>
  )
}

function lienExemple(v: Vehicle, jours: number) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = (decalage: number) => {
    const d = new Date()
    d.setDate(d.getDate() + decalage)
    d.setHours(10, 0, 0, 0)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`
  }
  const qs = new URLSearchParams()
  qs.set('pickup_at', iso(1))
  qs.set('return_at', iso(1 + jours))
  qs.set('driver_age', '25')
  return `/vehicules/${v.id}?${qs.toString()}`
}

export function HomePage() {
  const location = useLocation()
  const [catalog, setCatalog] = useState<HomeCatalog | null>(null)
  const [vehicules, setVehicules] = useState<Vehicle[]>([])
  const [chargementVedettes, setChargementVedettes] = useState(true)

  useEffect(() => {
    // Le serveur local ne traite qu’une requête à la fois : on laisse d’abord
    // partir le décompte de disponibilité du formulaire.
    const delai = window.setTimeout(() => {
      void api
        .get('/catalog/home')
        .then(({ data }) => setCatalog(data.data))
        .catch(() => undefined)
    }, 0)
    return () => window.clearTimeout(delai)
  }, [])

  useEffect(() => {
    const delai = window.setTimeout(() => {
      setChargementVedettes(true)
      void api
        .get('/vehicles/search', { params: { per_page: 24, page: 1, sort: 'rating' } })
        .then(({ data }) => setVehicules(data.data || []))
        .catch(() => setVehicules([]))
        .finally(() => setChargementVedettes(false))
    }, 0)
    return () => window.clearTimeout(delai)
  }, [])

  useEffect(() => {
    if (!location.hash) return
    const cible = document.querySelector(location.hash)
    if (cible) cible.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location])

  const c = catalog?.contents || {}
  /** Retire la locution « au Gabon » des textes éditoriaux affichés. */
  const texteSansAuGabon = (valeur?: string) =>
    (valeur || '').replace(/\s*au Gabon\b/gi, '').replace(/\s{2,}/g, ' ').trim()
  const photoHero = c['home.hero_image_url'] || PHOTO_HERO_DEFAUT
  const categories = catalog?.categories || []
  const exemples = vehicules.slice(0, 2)

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Header />

      <section id="recherche" className="relative z-30 scroll-mt-24">
        {/* Le fond animé déborde : on le coupe ici, pas la section, pour que
            les listes du formulaire passent par-dessus le bandeau de confiance. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="fond-vivant absolute -inset-8 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.45) 100%), url('${photoHero}')`,
            }}
          />
        </div>
        <div className="entree-page relative z-10 mx-auto max-w-7xl space-y-4 px-4 py-10 md:px-6 md:py-16 lg:min-h-[420px] lg:py-20">
          <BarreEtapesReservation etape="recherche" />
          <FormulaireVitrine />
        </div>
      </section>

      <BandeauConfiance />

      <Apparition>
        <EstimateurPrix
          vehicules={vehicules}
          chargement={chargementVedettes}
          categories={categories}
        />
      </Apparition>

      <Apparition>
      <section id="agences" className="scroll-mt-24 bg-neutral-50 px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-7xl">
          <TitreSection
            ligne1={texteSansAuGabon(c['home.destinations_title']) || 'nos agences'}
          />
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-neutral-600">
            {texteSansAuGabon(c['home.destinations_subtitle']) ||
              'Touchez une province pour voir les agences et démarrer une recherche.'}
          </p>
          <div className="mt-10">
            <CarteProvincesGabon />
          </div>
        </div>
      </section>
      </Apparition>

      <Apparition>
      <section className="bg-neutral-100 px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-2 flex justify-center text-neutral-400">
            <svg viewBox="0 0 48 32" className="h-8 w-12" fill="currentColor" aria-hidden>
              <path d="M8 4h12v8H14l-4 6V4zm20 0h12v8H34l-4 6V4z" />
            </svg>
          </div>
          <TitreSection ligne1="exemples de locations" />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {exemples.map((v, index) => {
              const jours = index === 0 ? 1 : 3
              const ville = v.agency?.city || v.partner.city || 'Gabon'
              const modele = v.category_label || v.display_name
              const phrase =
                index === 0
                  ? `${modele} pour la journée, à ${ville}. Le prix affiché est celui de la location.`
                  : `${modele} pour le week-end. Le montant est connu avant de confirmer.`
              return (
                <article key={v.id} className="carte-fluide bg-white p-6 shadow-sm md:p-8">
                  <p className="text-sm text-neutral-500">
                    {index === 0 ? 'location en agence' : 'livraison'}
                  </p>
                  <p className="mt-6 text-lg leading-relaxed text-neutral-800">« {phrase} »</p>
                  <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {v.display_name} · {jours === 1 ? '1 jour' : 'week-end'} · {ville}
                  </p>
                  <div className="mt-6 flex items-end justify-between gap-4">
                    <p className="border-l-4 border-accent-500 pl-3 text-3xl font-bold text-neutral-950">
                      {formatXaf(v.price_per_day * jours)}
                    </p>
                    <Link
                      to={lienExemple(v, jours)}
                      className="border-b border-neutral-950 text-sm font-semibold"
                    >
                      En savoir plus
                    </Link>
                  </div>
                </article>
              )
            })}
            {!chargementVedettes && exemples.length === 0 && (
              <p className="text-sm text-neutral-600">
                Les exemples s’afficheront dès que des véhicules seront publiés.
              </p>
            )}
          </div>
        </div>
      </section>
      </Apparition>

      <Apparition>
      <section className="border-t border-neutral-100 bg-white px-4 py-12 text-center md:px-6">
        <p className="text-lg text-neutral-800 md:text-xl">
          Vous voulez réserver par téléphone ? Appelez-nous au :{' '}
          <a href="tel:+24101123456" className="font-bold text-forest-700 hover:underline">
            +241 01 12 34 56
          </a>
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Ouverts du lundi au vendredi de 8h à 20h, et le week-end de 9h à 18h.
        </p>
      </section>
      </Apparition>

      <PiedDePage />
    </div>
  )
}
