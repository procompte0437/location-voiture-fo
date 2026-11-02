import { useEffect, useState, type ReactNode } from 'react'
import { Header } from '../components/layout/Header'
import { PiedDePage } from '../components/layout/PiedDePage'
import { BandeauReservation } from '../components/home/BandeauReservation'
import { MarquesConfiance } from '../components/home/MarquesConfiance'
import { TexteEditorial, TitreEditorial } from '../components/home/TitreEditorial'
import api from '../lib/api'
import type { Vehicle } from '../types'

const PHOTO_INTRO =
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1400&q=80'

const VALEURS: { titre: string; texte: string; icone: ReactNode }[] = [
  {
    titre: 'Clarté',
    texte: 'Le prix de la location est affiché avant de confirmer. Pas de frais ajouté au dernier moment.',
    icone: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="24" cy="24" r="14" />
        <path d="M24 16v10M24 32h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    titre: 'Confiance',
    texte: 'Les véhicules viennent d’agences partenaires vérifiées avant d’être publiés.',
    icone: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M24 8l12 4v10c0 8-5.2 14-12 16-6.8-2-12-8-12-16V12l12-4z" />
        <path d="M18 24l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    titre: 'Souplesse',
    texte: 'Retrait en agence ou livraison, et annulation possible tant que la demande est en cours de validation.',
    icone: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M8 30h6l4-12h14l4 8h4v4H8v-4z" />
        <circle cx="16" cy="34" r="3" />
        <circle cx="34" cy="34" r="3" />
      </svg>
    ),
  },
  {
    titre: 'Proximité',
    texte: 'La recherche couvre les provinces, et le support répond par téléphone ou par message.',
    icone: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M24 42s12-11 12-20a12 12 0 1 0-24 0c0 9 12 20 12 20z" />
        <circle cx="24" cy="22" r="4" />
      </svg>
    ),
  },
]

type Chiffres = {
  vehicules: number
  marques: number
  provinces: number
}

/**
 * Page À propos : présentation, valeurs et chiffres réels de la flotte.
 * Pas d’équipe ni de prix inventés : la plateforme n’a pas ces éléments à afficher.
 */
export function PageAPropos() {
  const [vehicules, setVehicules] = useState<Vehicle[]>([])
  const [chiffres, setChiffres] = useState<Chiffres | null>(null)

  useEffect(() => {
    const delai = window.setTimeout(() => {
      void Promise.all([
        api.get('/vehicles/search', { params: { per_page: 50, page: 1, sort: 'rating' } }),
        api.get('/catalog/provinces'),
      ])
        .then(([recherche, provinces]) => {
          const liste: Vehicle[] = recherche.data.data || []
          const marques = new Set(liste.map((v) => v.brand?.trim()).filter(Boolean))
          const couverture = provinces.data.data || []
          setVehicules(liste)
          setChiffres({
            vehicules: Number(recherche.data.meta?.total ?? liste.length),
            marques: marques.size,
            provinces: couverture.length || 9,
          })
        })
        .catch(() => {
          setVehicules([])
          setChiffres(null)
        })
    }, 0)
    return () => window.clearTimeout(delai)
  }, [])

  return (
    <div className="min-h-screen bg-white text-ink-900">
      <Header />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-2">
        <img
          src={PHOTO_INTRO}
          alt="Véhicule sur la route"
          className="h-72 w-full object-cover md:h-[420px]"
        />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Qui sommes-nous ?</h1>
          <p className="mt-5 text-base leading-relaxed text-ink-700">
            DOTO met en relation des conducteurs et des agences partenaires. On compare des
            locations déjà chiffrées, au lieu de chercher chaque loueur séparément.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink-700">
            Le lieu, les dates et le montant de la location sont connus avant la confirmation. Le
            partenaire publié reste celui qui remet le véhicule, en agence ou en livraison.
          </p>
        </div>
      </section>

      <section className="bg-sand-50 px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <TitreEditorial>Nos valeurs</TitreEditorial>
          <TexteEditorial>
            Quatre repères guident la plateforme : un prix lisible, des partenaires contrôlés, un
            retrait adaptable, et un support joignable.
          </TexteEditorial>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALEURS.map((valeur) => (
              <article
                key={valeur.titre}
                className="group border border-sand-200 bg-white p-6 text-ink-900 transition-colors hover:border-marque-500 hover:bg-marque-500"
              >
                <div className="text-marque-encre group-hover:text-ink-900">{valeur.icone}</div>
                <h2 className="mt-4 text-lg font-bold">{valeur.titre}</h2>
                <p className="mt-2 text-sm leading-relaxed">{valeur.texte}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {chiffres && (
        <section className="bg-marque-encre px-4 py-16 text-white md:px-6 md:py-20">
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="text-2xl font-extrabold uppercase tracking-wide md:text-3xl">Quelques chiffres clés</h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-white/85 md:text-base">
              Ces nombres viennent de la flotte publiée et des provinces couvertes par la carte des
              agences. Ils bougent quand un partenaire ajoute ou retire un véhicule.
            </p>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              <Chiffre valeur={chiffres.vehicules} libelle="Véhicules publiés" />
              <Chiffre valeur={chiffres.marques} libelle="Marques disponibles" />
              <Chiffre valeur={chiffres.provinces} libelle="Provinces sur la carte" />
            </div>
          </div>
        </section>
      )}

      <MarquesConfiance vehicules={vehicules} />
      <BandeauReservation />
      <PiedDePage />
    </div>
  )
}

function Chiffre({ valeur, libelle }: { valeur: number; libelle: string }) {
  return (
    <div>
      <p className="mx-auto grid h-28 w-28 place-items-center rounded-full border-2 border-white text-3xl font-extrabold">
        {valeur}
      </p>
      <p className="mt-4 text-sm font-semibold">{libelle}</p>
    </div>
  )
}
