type Props = {
  /** Classes Tailwind pour la taille (ex. h-9 w-9). */
  className?: string
  /** Variante d’affichage selon le fond. */
  variante?: 'defaut' | 'clair'
}

const SRC = '/logo/doto-logo.png'

/**
 * Logo marque DOTO (cercle route / soleil).
 */
export function LogoDoto({ className = 'h-9 w-9', variante = 'defaut' }: Props) {
  return (
    <img
      src={SRC}
      alt="DOTO"
      width={128}
      height={128}
      decoding="async"
      className={[
        'shrink-0 object-contain',
        variante === 'clair' ? 'drop-shadow-sm' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
