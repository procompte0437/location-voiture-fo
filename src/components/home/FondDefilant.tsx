import { useEffect, useRef } from 'react'

/**
 * Photo du comparateur qui glisse plus lentement que la page.
 * Le décalage crée de la profondeur tant que le visiteur fait défiler l’accueil.
 */
export function FondDefilant({ image }: { image: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const noeud = ref.current
    if (!noeud) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ticket = 0
    const poser = () => {
      ticket = 0
      const decalage = Math.min(window.scrollY, 900) * 0.32
      noeud.style.transform = `translate3d(0, ${decalage}px, 0) scale(1.14)`
    }
    const surScroll = () => {
      if (ticket) return
      ticket = window.requestAnimationFrame(poser)
    }

    poser()
    window.addEventListener('scroll', surScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', surScroll)
      if (ticket) window.cancelAnimationFrame(ticket)
    }
  }, [])

  return (
    <div
      ref={ref}
      className="absolute -inset-x-0 -inset-y-28 bg-cover bg-center will-change-transform"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.45) 100%), url('${image}')`,
      }}
    />
  )
}
