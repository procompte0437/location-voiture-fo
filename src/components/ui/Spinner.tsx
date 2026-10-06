export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={`inline-block animate-spin rounded-full border-2 border-[#0b3d2e]/25 border-t-[#0b3d2e] ${className}`}
    />
  )
}

export function ContentLoader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-500">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}
