import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Vehicle } from '../../types'
import { TexteEditorial, TitreEditorial } from './TitreEditorial'

/**
 * Marques réellement publiées, pour montrer la flotte sans inventer de logos clients.
 */
export function MarquesConfiance({ vehicules }: { vehicules: Vehicle[] }) {
  const marques = useMemo(() => {
    const compte = new Map<string, number>()
    for (const vehicule of vehicules) {
      const nom = vehicule.brand?.trim()
      if (!nom) continue
      compte.set(nom, (compte.get(nom) || 0) + 1)
    }
    return [...compte.entries()].sort((a, b) => b[1] - a[1])
  }, [vehicules])

  return (
    <section className="bg-white px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <TitreEditorial>Ils roulent avec nos partenaires</TitreEditorial>
        <TexteEditorial>
          Les marques ci-dessous correspondent aux véhicules actuellement publiés par les agences
          partenaires. Chaque fiche indique le prix de la location avant la confirmation.
        </TexteEditorial>

        {marques.length > 0 && (
          <div className="mt-10 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {marques.map(([nom, nombre]) => (
              <Link
                key={nom}
                to={`/vehicules?q=${encodeURIComponent(nom)}`}
                className="carte-fluide flex h-28 min-w-[180px] flex-1 flex-col items-center justify-center bg-white px-4 shadow-[0_10px_30px_rgba(20,32,26,0.08)]"
              >
                <span className="font-affiche text-2xl uppercase tracking-wide text-ink-900">{nom}</span>
                <span className="mt-1 text-xs text-ink-500">
                  {nombre} véhicule{nombre > 1 ? 's' : ''}
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/vehicules"
            className="inline-flex bg-marque-500 px-8 py-3 text-sm font-bold text-ink-900 hover:bg-gold-400"
          >
            Voir plus de véhicules
          </Link>
        </div>
      </div>
    </section>
  )
}
