import { useEffect, type ReactNode } from 'react'

type PropsFenetreModale = {
  ouvert: boolean
  titre: string
  onFermer: () => void
  /** Contenu du modal — prop React standard. */
  children: ReactNode
}

/**
 * Fenêtre modale générique.
 * Les textes d’aide et les fiches (détail / modification) s’ouvrent ici
 * pour ne pas encombrer la page.
 */
export function FenetreModale({ ouvert, titre, onFermer, children }: PropsFenetreModale) {
  useEffect(() => {
    if (!ouvert) return
    function surEchap(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') onFermer()
    }
    document.addEventListener('keydown', surEchap)
    return () => document.removeEventListener('keydown', surEchap)
  }, [ouvert, onFermer])

  if (!ouvert) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onFermer}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className="max-h-[min(80vh,40rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(evenement) => evenement.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink-900">{titre}</h2>
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
