import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Décalage en millisecondes, pour enchaîner plusieurs blocs. */
  delai?: number
  className?: string
}

/**
 * Fait monter le bloc en fondu dès qu’il entre dans l’écran.
 * Une seule fois : le contenu reste en place ensuite.
 */
export function Apparition({ children, delai = 0, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (!entree.isIntersecting) return
        setVisible(true)
        observateur.disconnect()
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    observateur.observe(element)
    return () => observateur.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`apparition ${visible ? 'apparition-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delai}ms` }}
    >
      {children}
    </div>
  )
}
