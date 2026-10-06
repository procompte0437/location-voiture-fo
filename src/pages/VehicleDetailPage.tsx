import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PublicHeader } from '../components/layout/Header'
import { ContentLoader } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useCatalog } from '../context/CatalogContext'
import api, { formatXaf } from '../lib/api'
import type { Vehicle } from '../types'

export function VehicleDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fuelLabel, transmissionLabel } = useCatalog()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [guest, setGuest] = useState({ name: '', email: '', phone: '' })
  const [method, setMethod] = useState('airtel_money')

  const pickupAt = searchParams.get('pickup_at') || ''
  const returnAt = searchParams.get('return_at') || ''
  const driverAge = Number(searchParams.get('driver_age') || 25)
  const locationId = searchParams.get('location_id')

  useEffect(() => {
    void api
      .get(`/vehicles/${id}`)
      .then(({ data }) => setVehicle(data.data))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user) return
    setGuest((current) => ({
      name: current.name || user.name || '',
      email: current.email || user.email || '',
      phone: current.phone || user.phone || '',
    }))
  }, [user])

  async function onBook(e: FormEvent) {
    e.preventDefault()
    if (!vehicle) return
    if (!pickupAt || !returnAt) {
      setError('Relancez une recherche avec des dates pour réserver.')
      return
    }
    setPaying(true)
    setError('')
    try {
      const { data: bookingRes } = await api.post('/bookings', {
        vehicle_id: vehicle.id,
        pickup_at: pickupAt,
        return_at: returnAt,
        driver_age: driverAge,
        pickup_location_id: locationId ? Number(locationId) : undefined,
        guest_name: guest.name || undefined,
        guest_email: guest.email || undefined,
        guest_phone: guest.phone || undefined,
      })
      const bookingId = bookingRes.data.id
      const { data: payRes } = await api.post(`/bookings/${bookingId}/pay`, { method })
      navigate(`/confirmation/${payRes.data.booking.id}`, {
        state: { booking: payRes.data.booking, payment: payRes.data.payment },
      })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
          ?.response?.data
      setError(
        msg?.message ||
          Object.values(msg?.errors || {})[0]?.[0] ||
          'Réservation impossible. Vérifiez les dates et votre âge.',
      )
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50">
        <PublicHeader />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-2xl border border-sand-200 bg-white">
            <ContentLoader />
          </div>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-sand-50">
        <PublicHeader />
        <p className="p-8">Véhicule introuvable.</p>
      </div>
    )
  }

  const days =
    pickupAt && returnAt
      ? Math.max(1, Math.ceil((new Date(returnAt).getTime() - new Date(pickupAt).getTime()) / 86400000))
      : null
  const total = days ? days * vehicle.price_per_day : null

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.4fr_1fr] md:px-6">
        <div>
          <div className="overflow-hidden rounded-2xl bg-sand-100">
            <img
              src={vehicle.cover_url || ''}
              alt={vehicle.display_name}
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
          <div className="mt-6 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-forest-600">
              {vehicle.category_label || vehicle.category}
            </p>
            <h1 className="font-display text-4xl font-bold text-forest-950">{vehicle.display_name}</h1>
            <p className="text-ink-700">
              {vehicle.partner.name} · ★ {vehicle.partner.average_rating.toFixed(1)} ({vehicle.partner.reviews_count} avis)
              · {vehicle.partner.city}
            </p>
            <p className="text-ink-700">{vehicle.description}</p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-white px-3 py-1.5 border border-sand-200">{vehicle.seats} places</span>
              <span className="rounded-full bg-white px-3 py-1.5 border border-sand-200">{transmissionLabel(vehicle.transmission)}</span>
              <span className="rounded-full bg-white px-3 py-1.5 border border-sand-200">{fuelLabel(vehicle.fuel)}</span>
              <span className="rounded-full bg-white px-3 py-1.5 border border-sand-200">
                Caution {formatXaf(vehicle.deposit_amount)}
              </span>
              <span className="rounded-full bg-white px-3 py-1.5 border border-sand-200">
                Âge min. {vehicle.min_driver_age} ans
              </span>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
          <p className="font-display text-3xl font-bold text-forest-800">
            {formatXaf(vehicle.price_per_day)}
            <span className="text-base font-normal text-ink-500"> / jour</span>
          </p>
          {total != null && (
            <p className="mt-1 text-sm text-ink-700">
              Total estimé ({days} j) : <strong>{formatXaf(total)}</strong>
            </p>
          )}
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            <li>✓ Prix final en FCFA, sans frais cachés</li>
            <li>✓ Politique : {vehicle.cancellation_policy}</li>
            <li>✓ Mode : {vehicle.booking_mode === 'instant' ? 'Réservation instantanée' : 'Sur demande'}</li>
          </ul>

          <form onSubmit={onBook} className="mt-6 space-y-3">
            {!pickupAt && (
              <p className="rounded-lg bg-gold-400/20 px-3 py-2 text-sm">
                <Link to="/" className="font-semibold underline">Choisissez des dates</Link> pour réserver.
              </p>
            )}
            <input
              placeholder="Nom complet"
              value={guest.name}
              onChange={(e) => setGuest((g) => ({ ...g, name: e.target.value }))}
              className="w-full rounded-xl border border-sand-200 px-3 py-2.5"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={guest.email}
              onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))}
              className="w-full rounded-xl border border-sand-200 px-3 py-2.5"
              required
            />
            <input
              placeholder="Téléphone"
              value={guest.phone}
              onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))}
              className="w-full rounded-xl border border-sand-200 px-3 py-2.5"
              required
            />
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-xl border border-sand-200 px-3 py-2.5"
            >
              <option value="airtel_money">Airtel Money</option>
              <option value="moov_money">Moov Money</option>
              <option value="card">Carte bancaire</option>
              <option value="agency_cash">Acompte + paiement agence</option>
            </select>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={paying || !pickupAt}
              className="w-full rounded-xl bg-forest-800 py-3 font-bold text-white hover:bg-forest-700 disabled:opacity-50"
            >
              {paying ? 'Paiement…' : 'Réserver et payer'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  )
}
