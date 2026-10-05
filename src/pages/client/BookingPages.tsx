import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { PublicHeader } from '../../components/layout/Header'
import api, { formatXaf } from '../../lib/api'
import type { Booking } from '../../types'

export function ConfirmationPage() {
  const { id } = useParams()
  const location = useLocation()
  const stateBooking = (location.state as { booking?: Booking } | null)?.booking
  const [booking, setBooking] = useState<Booking | null>(stateBooking || null)

  useEffect(() => {
    if (!stateBooking && id) {
      void api.get(`/bookings/${id}`).then(({ data }) => setBooking(data.data)).catch(() => undefined)
    }
  }, [id, stateBooking])

  if (!booking) {
    return (
      <div className="min-h-screen bg-sand-50">
        <PublicHeader />
        <p className="p-8">Réservation introuvable. Connectez-vous pour la consulter.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-2xl border border-forest-600/20 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-600">Confirmation</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-forest-950">Réservation confirmée</h1>
          <p className="mt-4 text-ink-700">
            Référence <strong className="text-forest-800">{booking.reference}</strong>
          </p>
          <p className="mt-2 text-ink-700">Statut : {booking.status}</p>
          <p className="mt-2 text-lg font-semibold">{formatXaf(booking.total_amount)}</p>
          <div className="mt-8 flex flex-col gap-3">
            <Link to="/mes-reservations" className="rounded-xl bg-forest-800 py-3 font-semibold text-white">
              Mes réservations
            </Link>
            <Link to="/" className="text-forest-700 hover:underline">
              Retour à l’accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    void api
      .get('/bookings')
      .then(({ data }) => setBookings(data.data || data))
      .catch(() => setError('Connectez-vous pour voir vos réservations.'))
  }, [])

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <h1 className="font-display text-3xl font-bold text-forest-950">Mes réservations</h1>
        {error && (
          <p className="mt-4">
            {error} <Link to="/connexion" className="underline">Connexion</Link>
          </p>
        )}
        <div className="mt-8 space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-2xl border border-sand-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-900">
                    {b.vehicle
                      ? `${b.vehicle.brand} ${b.vehicle.model}`
                      : b.reference}
                  </p>
                  <p className="text-sm text-ink-500">Réf. {b.reference}</p>
                  <p className="text-sm text-ink-500">
                    {new Date(b.pickup_at).toLocaleString('fr-FR')} → {new Date(b.return_at).toLocaleString('fr-FR')}
                  </p>
                  <p className="mt-1 text-sm capitalize text-forest-700">{b.status}</p>
                </div>
                <p className="font-bold">{formatXaf(b.total_amount)}</p>
              </div>
            </div>
          ))}
          {!error && bookings.length === 0 && (
            <p className="text-ink-500">Aucune réservation pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function GuestBookingLookupPage() {
  const [reference, setReference] = useState('')
  const [email, setEmail] = useState('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/bookings/guest-lookup', { reference, email })
      setBooking(data.data)
    } catch {
      setError('Réservation introuvable.')
      setBooking(null)
    }
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl font-bold text-forest-950">Voir ma réservation</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-sand-200 bg-white p-6">
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="N° de réservation"
            className="w-full rounded-xl border border-sand-200 px-4 py-3"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-sand-200 px-4 py-3"
            required
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-forest-800 py-3 font-semibold text-white">
            Rechercher
          </button>
        </form>
        {booking && (
          <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-5">
            <p className="font-semibold">{booking.reference}</p>
            <p className="text-sm capitalize">{booking.status}</p>
            <p className="mt-2 font-bold">{formatXaf(booking.total_amount)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
