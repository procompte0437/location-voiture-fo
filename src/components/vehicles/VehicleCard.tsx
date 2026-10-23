import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import { formatXaf } from '../../lib/api'
import type { Vehicle } from '../../types'
import { DisponibilitesVehicule } from './DisponibilitesVehicule'

export function VehicleCard({ vehicle, searchQuery }: { vehicle: Vehicle; searchQuery?: string }) {
  const { fuelLabel, transmissionLabel } = useCatalog()
  const href = searchQuery ? `/vehicules/${vehicle.id}?${searchQuery}` : `/vehicules/${vehicle.id}`

  return (
    <article className="group overflow-hidden rounded-[28px] border border-sand-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gold-400/50 hover:shadow-xl">
      <Link to={href} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-sand-100">
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
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-forest-900 shadow-sm">
            {vehicle.category_label || vehicle.category}
          </span>
        </div>
      </Link>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={href} className="block">
              <h3 className="font-display text-xl font-semibold text-ink-900 hover:text-forest-800">
                {vehicle.display_name}
              </h3>
            </Link>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500">
              <span className="text-gold-600">★ {vehicle.partner.average_rating.toFixed(1)}</span>
              {vehicle.partner.trust_level !== 'new' && (
                <span className="rounded-full bg-forest-100 px-2 py-0.5 text-xs font-medium text-forest-800">
                  Vérifié
                </span>
              )}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-xl font-bold text-forest-900">
              {formatXaf(vehicle.price_per_day)}
            </p>
            <p className="text-xs text-ink-500">/ jour</p>
            {vehicle.total_price != null && (
              <p className="mt-1 text-sm font-semibold text-ink-900">
                Total {formatXaf(vehicle.total_price)}
              </p>
            )}
            <p className="mt-1 text-xs text-ink-500">Caution {formatXaf(vehicle.deposit_amount)}</p>
          </div>
        </div>
        <DisponibilitesVehicule calendrier={vehicle.calendar} disponible={vehicle.available} />
        <div className="flex flex-wrap gap-2 text-xs text-ink-700">
          <span className="rounded-full bg-sand-100 px-2.5 py-1">{vehicle.seats} places</span>
          <span className="rounded-full bg-sand-100 px-2.5 py-1">
            {transmissionLabel(vehicle.transmission)}
          </span>
          <span className="rounded-full bg-sand-100 px-2.5 py-1">{fuelLabel(vehicle.fuel)}</span>
          {vehicle.air_conditioning && (
            <span className="rounded-full bg-sand-100 px-2.5 py-1">Clim</span>
          )}
          {vehicle.airport_delivery && (
            <span className="rounded-full bg-gold-400/20 px-2.5 py-1 text-forest-900">Aéroport</span>
          )}
        </div>
        <Link
          to={href}
          className="inline-flex w-full items-center justify-center rounded-full bg-forest-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-700"
        >
          {vehicle.available === false ? 'Voir les dates libres' : 'Réserver'}
        </Link>
      </div>
    </article>
  )
}
