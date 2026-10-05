import { Link } from 'react-router-dom'
import { categoryLabel, formatXaf, fuelLabel, transmissionLabel } from '../../lib/api'
import type { Vehicle } from '../../types'

export function VehicleCard({ vehicle, searchQuery }: { vehicle: Vehicle; searchQuery?: string }) {
  const href = searchQuery ? `/vehicules/${vehicle.id}?${searchQuery}` : `/vehicules/${vehicle.id}`

  return (
    <article className="group overflow-hidden rounded-2xl border border-sand-200 bg-white transition hover:border-forest-600/30 hover:shadow-lg">
      <Link to={href} className="block">
        <div className="aspect-[16/10] overflow-hidden bg-sand-100">
          {vehicle.cover_url ? (
            <img
              src={vehicle.cover_url}
              alt={vehicle.display_name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-500">Pas de photo</div>
          )}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-forest-600">
                {categoryLabel(vehicle.category)}
              </p>
              <h3 className="font-display text-xl font-semibold text-ink-900">{vehicle.display_name}</h3>
              <p className="text-sm text-ink-500">
                {vehicle.partner.name} · ★ {vehicle.partner.average_rating.toFixed(1)}
                {vehicle.partner.trust_level !== 'new' && (
                  <span className="ml-2 rounded-full bg-forest-100 px-2 py-0.5 text-xs text-forest-800">
                    Vérifié
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold text-forest-800">
                {formatXaf(vehicle.price_per_day)}
              </p>
              <p className="text-xs text-ink-500">/ jour</p>
              {vehicle.total_price != null && (
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  Total {formatXaf(vehicle.total_price)}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-ink-700">
            <span className="rounded-full bg-sand-100 px-2.5 py-1">{vehicle.seats} places</span>
            <span className="rounded-full bg-sand-100 px-2.5 py-1">{transmissionLabel(vehicle.transmission)}</span>
            <span className="rounded-full bg-sand-100 px-2.5 py-1">{fuelLabel(vehicle.fuel)}</span>
            {vehicle.air_conditioning && (
              <span className="rounded-full bg-sand-100 px-2.5 py-1">Clim</span>
            )}
            {vehicle.airport_delivery && (
              <span className="rounded-full bg-gold-400/20 px-2.5 py-1 text-forest-900">Aéroport</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
