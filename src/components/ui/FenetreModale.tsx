import { useEffect, type ReactNode } from 'react'

type PropsFenetreModale = {
  ouvert: boolean
  titre: string
  sousTitre?: string
  onFermer: () => void
  /** Classes du panneau, pour un formulaire large par exemple. */
  classePanneau?: string
  /** Contenu du modal — prop React standard. */
  children: ReactNode
}

/**
 * Fenêtre modale générique.
 * Les textes d’aide et les fiches (détail / modification) s’ouvrent ici
 * pour ne pas encombrer la page.
 */
export function FenetreModale({
  ouvert,
  titre,
  sousTitre,
  onFermer,
  classePanneau = 'max-h-[min(80vh,40rem)] w-full max-w-lg',
  children,
}: PropsFenetreModale) {
  useEffect(() => {
    if (!ouvert) return
    function surEchap(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') onFermer()
    }
    const debordement = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', surEchap)
    return () => {
      document.body.style.overflow = debordement
      document.removeEventListener('keydown', surEchap)
    }
  }, [ouvert, onFermer])

  if (!ouvert) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onFermer}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className={`overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ${classePanneau}`}
        onClick={(evenement) => evenement.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900">{titre}</h2>
            {sousTitre && <p className="mt-1 text-sm text-ink-500">{sousTitre}</p>}
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="grid h-8 w-8 place-items-center rounded-full text-lg text-ink-500 hover:bg-black/[0.04]"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
