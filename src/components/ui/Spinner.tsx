import { useEffect, useState } from 'react'

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={`inline-block animate-spin rounded-full border-2 border-[#0b3d2e]/25 border-t-[#0b3d2e] ${className}`}
    />
  )
}

export function ContentLoader({
  label = 'Chargement…',
  className = 'py-10',
}: {
  label?: string
  className?: string
}) {
  return (
    <div className={`flex items-center justify-center gap-2 text-sm text-ink-500 ${className}`}>
      <Spinner />
      <span>{label}</span>
    </div>
  )
}

/**
 * Anneau qui tourne avec un pourcentage, réservé aux tableaux de données.
 * L’API ne fournit pas de progression réelle : on avance jusqu’à 92 %
 * pendant l’attente, pour montrer que le chargement est en cours.
 */
export function SpinnerPourcentage({ className = 'py-16' }: { className?: string }) {
  const [pourcentage, setPourcentage] = useState(6)

  useEffect(() => {
    const identifiant = window.setInterval(() => {
      setPourcentage((actuel) => {
        if (actuel >= 92) return actuel
        const pas = Math.max(1, Math.round((100 - actuel) * 0.08))
        return Math.min(92, actuel + pas)
      })
    }, 160)
    return () => window.clearInterval(identifiant)
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Chargement ${pourcentage} pour cent`}
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className="relative grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-[#0b3d2e]/20 border-t-[#0b3d2e]" />
        <span className="text-sm font-semibold tabular-nums text-[#0b3d2e]">{pourcentage}%</span>
      </div>
      <span className="text-sm text-ink-500">Chargement des données…</span>
    </div>
  )
}
