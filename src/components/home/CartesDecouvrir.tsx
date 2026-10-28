import { Link } from 'react-router-dom'
import type { Vehicle } from '../../types'

const PHOTO_SECOURS = [
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80',
]

const ENTREES = [
  { vers: '/vehicules', libelle: 'Les véhicules', titre: 'Comparer les modèles publiés' },
  { vers: '/#agences', libelle: 'Les agences', titre: 'Trouver une agence par province' },
  { vers: '/inscription', libelle: 'Devenir partenaire', titre: 'Publier une flotte sur DOTO' },
] as const

/**
 * Trois visuels avec un bouton qui déborde, comme une rangée d’entrées.
 * Les photos viennent des véhicules publiés quand elles existent.
 */
export function CartesDecouvrir({ vehicules }: { vehicules: Vehicle[] }) {
  const photos = ENTREES.map((_, index) => vehicules[index]?.cover_url || PHOTO_SECOURS[index])

  return (
    <section className="bg-[linear-gradient(180deg,#f7fbf9_0%,#ffffff_72%)] px-4 pb-10 pt-2 md:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3 sm:gap-6">
        {ENTREES.map((entree, index) => (
          <article key={entree.vers} className="relative pb-5">
            <div className="relative h-52 overflow-hidden bg-marque-encre md:h-56">
              <img src={photos[index]} alt="" className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-marque-sombre/80 via-marque-sombre/15 to-transparent" />
              <p className="absolute bottom-8 left-4 right-4 text-sm font-semibold text-white">{entree.titre}</p>
            </div>
            <Link
              to={entree.vers}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-marque-500 px-8 py-2.5 text-sm font-bold text-ink-900 shadow-md hover:bg-gold-400"
            >
              Découvrir
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
