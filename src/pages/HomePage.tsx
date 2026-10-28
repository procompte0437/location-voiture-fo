import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BandeauConfiance } from '../components/home/BandeauConfiance'
import { BandeauReservation } from '../components/home/BandeauReservation'
import { CarrouselExemples } from '../components/home/CarrouselExemples'
import { CarrouselUsages } from '../components/home/CarrouselUsages'
import { CarteProvincesGabon } from '../components/home/CarteProvincesGabon'
import { CartesDecouvrir } from '../components/home/CartesDecouvrir'
import { EstimateurPrix } from '../components/home/EstimateurPrix'
import { FondDefilant } from '../components/home/FondDefilant'
import { FormulaireVitrine } from '../components/home/FormulaireVitrine'
import { MarquesConfiance } from '../components/home/MarquesConfiance'
import { TexteEditorial, TitreEditorial } from '../components/home/TitreEditorial'
import { BarreEtapesReservation } from '../components/reservation/BarreEtapesReservation'
import { Header } from '../components/layout/Header'
import { PiedDePage } from '../components/layout/PiedDePage'
import { Apparition } from '../components/ui/Apparition'
import api from '../lib/api'
import type { Vehicle } from '../types'

type HomeCatalog = {
  contents: Record<string, string>
  reassurance: { id: number; title: string; text: string }[]
  categories: { id: number; slug: string; label: string; description?: string }[]
}

/** SUV sur route — fond du comparateur (écrasé si le catalogue fournit home.hero_image_url). */
const PHOTO_HERO_DEFAUT =
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=2200&q=80'

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

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Header />

      <section id="recherche" className="relative z-30 scroll-mt-24">
        {/* Le fond animé déborde : on le coupe ici, pas la section, pour que
            les listes du formulaire passent par-dessus le bandeau de confiance. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <FondDefilant image={photoHero} />
        </div>
        <div className="entree-page relative z-10 mx-auto max-w-7xl space-y-4 px-4 py-10 md:px-6 md:py-16 lg:min-h-[420px] lg:py-20">
          <BarreEtapesReservation etape="recherche" />
          <FormulaireVitrine />
        </div>
      </section>

      <BandeauConfiance />
      <CartesDecouvrir vehicules={vehicules} />
      <MarquesConfiance vehicules={vehicules} />
      <CarrouselUsages />

      <Apparition>
        <EstimateurPrix
          vehicules={vehicules}
          chargement={chargementVedettes}
          categories={categories}
        />
      </Apparition>

      <Apparition>
      <section id="agences" className="scroll-mt-24 bg-white px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-7xl">
          <TitreEditorial>
            {texteSansAuGabon(c['home.destinations_title']) || 'Nos agences'}
          </TitreEditorial>
          <TexteEditorial>
            {texteSansAuGabon(c['home.destinations_subtitle']) ||
              'Touchez une province pour voir les agences et démarrer une recherche.'}
          </TexteEditorial>
          <div className="mt-10">
            <CarteProvincesGabon />
          </div>
        </div>
      </section>
      </Apparition>

      <Apparition>
      <section className="bg-[linear-gradient(180deg,#f4faf7_0%,#ffffff_100%)] px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <TitreEditorial>Exemples de locations</TitreEditorial>
          <TexteEditorial>
            Quelques locations déjà chiffrées : journée en agence, week-end en livraison, semaine.
          </TexteEditorial>
          <CarrouselExemples vehicules={vehicules} chargement={chargementVedettes} />
        </div>
      </section>
      </Apparition>

      <BandeauReservation />

      <PiedDePage />
    </div>
  )
}
