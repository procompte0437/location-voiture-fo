/**
 * Chevron de bloc partenaire : pointe vers le bas fermé, vers le haut ouvert.
 * Le libellé reste dans l’infobulle, pas dans le bouton.
 */
export function IconeChevron({ ouvert = false }: { ouvert?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 transition-transform ${ouvert ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconeChevrons({ sens }: { sens: 'ouvrir' | 'fermer' }) {
  const trace = sens === 'ouvrir' ? 'M7 7l5 5 5-5M7 13l5 5 5-5' : 'M7 17l5-5 5 5M7 11l5-5 5 5'
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={trace} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BoutonToutDeplier({
  sens,
  onClick,
  desactive = false,
}: {
  sens: 'ouvrir' | 'fermer'
  onClick: () => void
  desactive?: boolean
}) {
  const libelle = sens === 'ouvrir' ? 'Tout déplier' : 'Tout plier'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactive}
      title={libelle}
      aria-label={libelle}
      className="grid h-9 w-9 place-items-center rounded-xl border border-black/10 bg-white text-[#8c4205] transition hover:bg-[#8c4205]/10 disabled:opacity-40"
    >
      <IconeChevrons sens={sens} />
    </button>
  )
}
