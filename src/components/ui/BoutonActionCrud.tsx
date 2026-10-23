type VarianteAction = 'voir' | 'modifier' | 'supprimer'

type PropsBoutonActionCrud = {
  variante: VarianteAction
  /** Libellé lu par le lecteur d’écran et affiché en infobulle, pas dans le bouton. */
  libelle: string
  onClick: () => void
  desactive?: boolean
}

const LIBELLES: Record<VarianteAction, string> = {
  voir: 'Voir le détail',
  modifier: 'Modifier',
  supprimer: 'Supprimer',
}

/**
 * Action de ligne (voir, modifier, supprimer) rendue par une icône.
 * Le libellé reste accessible, sans texte visible dans le tableau.
 */
export function BoutonActionCrud({
  variante,
  libelle,
  onClick,
  desactive = false,
}: PropsBoutonActionCrud) {
  const titre = libelle || LIBELLES[variante]
  const teinte =
    variante === 'supprimer'
      ? 'text-red-700 hover:bg-red-50'
      : variante === 'modifier'
        ? 'text-[#8c4205] hover:bg-[#8c4205]/10'
        : 'text-ink-700 hover:bg-black/[0.04]'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactive}
      title={titre}
      aria-label={titre}
      className={`grid h-8 w-8 place-items-center rounded-lg border border-black/10 bg-white transition disabled:opacity-40 ${teinte}`}
    >
      {variante === 'voir' && <IconeOeil />}
      {variante === 'modifier' && <IconeCrayon />}
      {variante === 'supprimer' && <IconeCorbeille />}
    </button>
  )
}

function IconeOeil() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

function IconeCrayon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" strokeLinejoin="round" />
    </svg>
  )
}

function IconeCorbeille() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
