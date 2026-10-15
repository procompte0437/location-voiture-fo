type Calendrier = {
  occupied: { starts_at: string; ends_at: string }[]
  free: { starts_at: string; ends_at: string }[]
}

function formaterPlage(debut: string, fin: string) {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }
  const a = new Date(debut).toLocaleString('fr-FR', options)
  const b = new Date(fin).toLocaleString('fr-FR', options)
  return `${a} → ${b}`
}

export function DisponibilitesVehicule({
  calendrier,
  disponible,
}: {
  calendrier?: Calendrier | null
  disponible?: boolean | null
}) {
  if (!calendrier) return null

  const prises = calendrier.occupied
  const libres = calendrier.free

  return (
    <div className="rounded-xl border border-sand-200 bg-sand-50 px-3 py-3 text-sm">
      <p className="font-semibold text-forest-950">Dates selon les réservations</p>
      {disponible === false && (
        <p className="mt-1 text-red-700">Indisponible sur ces dates.</p>
      )}
      {disponible === true && (
        <p className="mt-1 text-forest-800">Libre sur les dates choisies.</p>
      )}
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Disponible</p>
      {libres.length === 0 ? (
        <p className="mt-1 text-ink-700">Aucun créneau libre sur les 90 prochains jours.</p>
      ) : (
        <ul className="mt-1 space-y-1 text-forest-900">
          {libres.map((plage) => (
            <li key={`${plage.starts_at}-${plage.ends_at}`}>{formaterPlage(plage.starts_at, plage.ends_at)}</li>
          ))}
        </ul>
      )}
      {prises.length > 0 && (
        <>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Déjà réservé</p>
          <ul className="mt-1 space-y-1 text-red-800">
            {prises.map((plage) => (
              <li key={`${plage.starts_at}-${plage.ends_at}`}>{formaterPlage(plage.starts_at, plage.ends_at)}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
