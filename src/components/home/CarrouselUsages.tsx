import type { ReactNode } from 'react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { TexteEditorial, TitreEditorial } from './TitreEditorial'

type Usage = {
  id: string
  titre: string
  vers: string
  icone: ReactNode
}

const commun = {
  viewBox: '0 0 48 48',
  className: 'h-14 w-14',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
} as const

const USAGES: Usage[] = [
  {
    id: 'journee',
    titre: 'Journée',
    vers: '/vehicules',
    icone: (
      <svg {...commun}>
        <circle cx="24" cy="24" r="8" />
        <path d="M24 6v4M24 38v4M6 24h4M38 24h4M11 11l3 3M34 34l3 3M37 11l-3 3M14 34l-3 3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'weekend',
    titre: 'Week-end',
    vers: '/vehicules',
    icone: (
      <svg {...commun}>
        <rect x="8" y="12" width="32" height="26" rx="2" />
        <path d="M8 20h32M16 8v8M32 8v8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'livraison',
    titre: 'Livraison',
    vers: '/vehicules',
    icone: (
      <svg {...commun}>
        <path d="M8 30h6l4-12h14l4 8h4v4H8v-4z" />
        <circle cx="16" cy="34" r="3" />
        <circle cx="34" cy="34" r="3" />
      </svg>
    ),
  },
  {
    id: 'semaine',
    titre: 'Semaine',
    vers: '/vehicules',
    icone: (
      <svg {...commun}>
        <path d="M10 34V16l14-6 14 6v18" />
        <path d="M20 34V24h8v10" />
      </svg>
    ),
  },
  {
    id: 'agence',
    titre: 'En agence',
    vers: '/#agences',
    icone: (
      <svg {...commun}>
        <path d="M8 20l16-10 16 10" />
        <path d="M12 20v16h24V20" />
        <path d="M21 36V26h6v10" />
      </svg>
    ),
  },
]

/** Usages de location défilants : le visiteur choisit une situation, pas un catalogue brut. */
export function CarrouselUsages() {
  const piste = useRef<HTMLDivElement>(null)

  function defiler(sens: number) {
    const el = piste.current
    if (!el) return
    el.scrollBy({ left: sens * 240, behavior: 'smooth' })
  }

  return (
    <section className="bg-[linear-gradient(180deg,#e7f3ec_0%,#f4faf7_100%)] px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <TitreEditorial>Des locations adaptées à votre usage</TitreEditorial>
        <TexteEditorial>
          Journée en ville, week-end, semaine ou remise du véhicule : chaque parcours ouvre les
          offres publiées, avec le montant de la location visible tout de suite.
        </TexteEditorial>

        <div className="relative mt-10">
          <button
            type="button"
            aria-label="Usages précédents"
            onClick={() => defiler(-1)}
            className="absolute left-0 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center bg-white text-lg text-ink-900 shadow-md hover:text-marque-encre"
          >
            ‹
          </button>
          <div
            ref={piste}
            className="flex gap-4 overflow-x-auto scroll-smooth px-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {USAGES.map((usage) => (
              <Link
                key={usage.id}
                to={usage.vers}
                className="carte-fluide flex h-48 w-[210px] shrink-0 flex-col items-center justify-center gap-4 bg-marque-encre px-4 text-white"
              >
                {usage.icone}
                <span className="text-base font-semibold">{usage.titre}</span>
              </Link>
            ))}
          </div>
          <button
            type="button"
            aria-label="Usages suivants"
            onClick={() => defiler(1)}
            className="absolute right-0 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center bg-white text-lg text-ink-900 shadow-md hover:text-marque-encre"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  )
}
