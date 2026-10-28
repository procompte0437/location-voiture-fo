import type { ReactNode } from 'react'
import { Apparition } from '../ui/Apparition'
import { TexteEditorial, TitreEditorial } from './TitreEditorial'

function Losange({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto grid h-36 w-36 place-items-center">
      <span className="absolute inset-2 rotate-45 rounded-[1.6rem] bg-white shadow-[0_16px_40px_rgba(0,80,56,0.12)]" />
      <span className="relative text-marque-encre">{children}</span>
    </div>
  )
}

const AIDES = [
  {
    titre: 'Comparer les offres',
    texte: 'Le prix de la location est affiché avant de confirmer, sans frais caché.',
    icone: (
      <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="8" y="12" width="22" height="24" rx="2" />
        <path d="M13 20h12M13 26h8" strokeLinecap="round" />
        <path d="M28 22h12v14H28" />
      </svg>
    ),
  },
  {
    titre: 'Agence ou livraison',
    texte: 'Retrait au comptoir ou remise du véhicule à l’adresse choisie.',
    icone: (
      <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M8 30h32M12 30l3-10h18l3 10" />
        <circle cx="16" cy="33" r="2.5" />
        <circle cx="32" cy="33" r="2.5" />
        <path d="M18 20l3-6h8l2 6" />
      </svg>
    ),
  },
  {
    titre: 'Annulation et assistance',
    texte: 'Annulation possible avant le retrait, et un support joignable pour vous aider.',
    icone: (
      <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M24 8l12 4v10c0 8-5.2 14-12 16-6.8-2-12-8-12-16V12l12-4z" />
        <path d="M18 24l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

/** Trois services en losanges, juste sous le comparateur. */
export function BandeauConfiance() {
  return (
    <section className="relative z-0 bg-[linear-gradient(180deg,#f4faf7_0%,#e7f3ec_55%,#f7fbf9_100%)] px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <TitreEditorial>Comment pouvons-nous vous aider ?</TitreEditorial>
        <TexteEditorial>
          DOTO met en relation des conducteurs et des partenaires vérifiés. Vous choisissez le
          véhicule, les dates et le lieu, puis vous comparez des offres déjà chiffrées.
        </TexteEditorial>
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {AIDES.map((item, index) => (
            <Apparition key={item.titre} delai={index * 90} className="text-center">
              <Losange>{item.icone}</Losange>
              <p className="mt-5 text-base font-bold text-ink-900">{item.titre}</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-700">{item.texte}</p>
            </Apparition>
          ))}
        </div>
      </div>
    </section>
  )
}
