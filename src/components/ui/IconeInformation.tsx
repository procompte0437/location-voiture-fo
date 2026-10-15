import { useState, type ReactNode } from 'react'
import { FenetreModale } from './FenetreModale'

type PropsIconeInformation = {
  titre: string
  /** Texte d’aide affiché dans le modal — prop React standard. */
  children: ReactNode
}

/**
 * Point d’aide « i ».
 * Le texte explicatif reste hors de la page : il s’ouvre dans un modal.
 */
export function IconeInformation({ titre, children }: PropsIconeInformation) {
  const [ouvert, setOuvert] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label={titre}
        title={titre}
        className="inline-grid h-5 w-5 shrink-0 place-items-center rounded-full border border-ink-400 text-[11px] font-semibold italic leading-none text-ink-600 hover:border-[#0b3d2e] hover:text-[#0b3d2e]"
      >
        i
      </button>
      <FenetreModale ouvert={ouvert} titre={titre} onFermer={() => setOuvert(false)}>
        <div className="space-y-2 text-sm leading-relaxed text-ink-700">{children}</div>
      </FenetreModale>
    </>
  )
}
