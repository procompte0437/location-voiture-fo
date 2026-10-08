import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { PublicHeader } from '../../components/layout/Header'
import { ContentLoader } from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import api, { formatXaf } from '../../lib/api'
import type { Booking } from '../../types'

function libelleStatut(statut: string) {
  const map: Record<string, string> = {
    pending_payment: 'Paiement en attente',
    locked: 'En cours de validation',
    pending_partner: 'En cours — commercial contacté',
    confirmed: 'Confirmée',
    ongoing: 'En cours de location',
    completed: 'Terminée',
    cancelled: 'Annulée',
    expired: 'Expirée',
    refunded: 'Remboursée',
  }
  return map[statut] || statut
}

type IdentifiantsConfirm = {
  showCredentials?: boolean
  temporaryPassword?: string | null
  loginEmail?: string
  accountCreated?: boolean
}

function lireIdentifiantsStockes(bookingId?: string): IdentifiantsConfirm | null {
  if (!bookingId) return null
  try {
    const raw = sessionStorage.getItem(`locagabon_confirm_${bookingId}`)
    return raw ? (JSON.parse(raw) as IdentifiantsConfirm) : null
  } catch {
    return null
  }
}

export function ConfirmationPage() {
  const { id } = useParams()
  const location = useLocation()
  const state = location.state as
    | ({
        booking?: Booking
      } & IdentifiantsConfirm)
    | null

  const stockes = useMemo(() => lireIdentifiantsStockes(id), [id])
  const [booking, setBooking] = useState<Booking | null>(state?.booking || null)

  const loginEmail = state?.loginEmail || stockes?.loginEmail || ''
  const temporaryPassword = state?.temporaryPassword || stockes?.temporaryPassword || null
  const showCredentials =
    !!(state?.showCredentials ?? stockes?.showCredentials) || !!temporaryPassword
  const accountCreated = !!(state?.accountCreated ?? stockes?.accountCreated)

  useEffect(() => {
    if (!state?.booking && id) {
      void api
        .get(`/bookings/${id}`)
        .then(({ data }) => setBooking(data.data))
        .catch(() => undefined)
    }
  }, [id, state?.booking])

  if (!booking) {
    return (
      <div className="min-h-screen bg-sand-50">
        <PublicHeader />
        <p className="p-8">Réservation introuvable. Connectez-vous pour la consulter.</p>
      </div>
    )
  }

  const emailConnexion = loginEmail || (booking as Booking & { guest_email?: string }).guest_email || ''
  const lienConnexion = `/connexion?redirect=${encodeURIComponent('/mes-reservations')}${
    emailConnexion ? `&email=${encodeURIComponent(emailConnexion)}` : ''
  }`

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-2xl border border-forest-600/20 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-600">Confirmation</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-forest-950">
            Réservation en cours
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-700">
            Votre réservation est en cours de traitement. Un commercial vous répondra dans
            quelques minutes pour confirmer les détails.
          </p>
          <p className="mt-5 text-ink-700">
            Référence <strong className="text-forest-800">{booking.reference}</strong>
          </p>
          <p className="mt-2 text-sm text-ink-500">Statut : {libelleStatut(booking.status)}</p>
          <p className="mt-3 text-lg font-semibold text-forest-900">
            {formatXaf(booking.total_amount)}
          </p>

          {showCredentials && temporaryPassword && (
            <div className="mt-6 rounded-xl border border-forest-600/15 bg-forest-50/60 px-4 py-3 text-left text-sm text-ink-700">
              <p className="font-semibold text-forest-900">
                {accountCreated ? 'Compte créé automatiquement' : 'Identifiants de connexion'}
              </p>
              {emailConnexion && (
                <p className="mt-1">
                  Email : <strong>{emailConnexion}</strong>
                </p>
              )}
              <p className="mt-1">
                Mot de passe générique :{' '}
                <strong className="font-mono tracking-wide">{temporaryPassword}</strong>
              </p>
              <p className="mt-2 text-xs text-ink-500">
                Utilisez ces identifiants pour vous connecter. Vous pourrez modifier le mot de
                passe ensuite dans votre espace.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <Link
              to={lienConnexion}
              className="rounded-xl bg-forest-800 py-3 font-semibold text-white"
            >
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

type OngletReservations = 'toutes' | 'en_cours' | 'confirmees' | 'terminees' | 'annulees'

const ONGLETS: { cle: OngletReservations; libelle: string; statuts?: string[] }[] = [
  { cle: 'toutes', libelle: 'Toutes' },
  {
    cle: 'en_cours',
    libelle: 'En cours',
    statuts: ['pending_payment', 'locked', 'pending_partner', 'ongoing'],
  },
  { cle: 'confirmees', libelle: 'Confirmées', statuts: ['confirmed'] },
  { cle: 'terminees', libelle: 'Terminées', statuts: ['completed'] },
  {
    cle: 'annulees',
    libelle: 'Annulées',
    statuts: ['cancelled', 'expired', 'refunded'],
  },
]

function formaterDateCourte(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function badgeStatut(statut: string) {
  const base = 'inline-flex rounded-full px-2.5 py-1 text-xs font-medium'
  if (['pending_partner', 'locked', 'pending_payment', 'ongoing'].includes(statut)) {
    return `${base} bg-amber-100 text-amber-900`
  }
  if (statut === 'confirmed') return `${base} bg-forest-900/10 text-forest-900`
  if (statut === 'completed') return `${base} bg-ink-100 text-ink-700`
  return `${base} bg-red-50 text-red-800`
}

export function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState('')
  const [chargement, setChargement] = useState(true)
  const [onglet, setOnglet] = useState<OngletReservations>('toutes')

  async function charger() {
    setChargement(true)
    setError('')
    try {
      const { data } = await api.get('/bookings')
      setBookings(data.data || data || [])
    } catch {
      setError('Impossible de charger vos réservations.')
      setBookings([])
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    if (authLoading || !user) return
    void charger()
  }, [user, authLoading])

  const comptes = useMemo(() => {
    const c: Record<OngletReservations, number> = {
      toutes: bookings.length,
      en_cours: 0,
      confirmees: 0,
      terminees: 0,
      annulees: 0,
    }
    for (const b of bookings) {
      for (const o of ONGLETS) {
        if (o.statuts?.includes(b.status)) c[o.cle] += 1
      }
    }
    return c
  }, [bookings])

  const filtrées = useMemo(() => {
    const def = ONGLETS.find((o) => o.cle === onglet)
    if (!def?.statuts) return bookings
    return bookings.filter((b) => def.statuts!.includes(b.status))
  }, [bookings, onglet])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-sand-50">
        <PublicHeader />
        <div className="mx-auto max-w-4xl px-4 py-10">
          <ContentLoader label="Chargement de votre espace…" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to={`/connexion?redirect=${encodeURIComponent('/mes-reservations')}`}
        replace
      />
    )
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Espace client
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-forest-950 md:text-4xl">
              Mes réservations
            </h1>
            <p className="mt-1.5 text-sm text-ink-500">
              Suivez vos demandes, confirmations et locations passées.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void charger()}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-black/[0.02]"
            aria-label="Actualiser"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 4v6h6M20 20v-6h-6" strokeLinecap="round" />
              <path d="M20 9A8 8 0 0 0 6.3 6.3L4 10M4 15a8 8 0 0 0 13.7 2.7L20 14" strokeLinecap="round" />
            </svg>
            Actualiser
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-black/8 pb-1">
          {ONGLETS.map((o) => {
            const actif = onglet === o.cle
            const n = comptes[o.cle]
            return (
              <button
                key={o.cle}
                type="button"
                onClick={() => setOnglet(o.cle)}
                className={`relative -mb-px rounded-t-lg px-3.5 py-2.5 text-sm font-medium transition ${
                  actif
                    ? 'border-b-2 border-forest-900 text-forest-950'
                    : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                {o.libelle}
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] ${
                    actif ? 'bg-forest-900 text-white' : 'bg-black/6 text-ink-500'
                  }`}
                >
                  {n}
                </span>
              </button>
            )
          })}
        </div>

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <div className="mt-6">
          {chargement ? (
            <div className="rounded-2xl border border-sand-200 bg-white">
              <ContentLoader label="Chargement des réservations…" />
            </div>
          ) : filtrées.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/12 bg-white px-6 py-14 text-center">
              <p className="font-medium text-ink-800">Aucune réservation dans cet onglet</p>
              <p className="mt-1 text-sm text-ink-500">
                {onglet === 'toutes'
                  ? 'Vos prochaines réservations apparaîtront ici.'
                  : 'Changez d’onglet ou lancez une nouvelle recherche.'}
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex rounded-xl bg-forest-900 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Réserver une voiture
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtrées.map((b) => {
                const cover = b.vehicle?.cover_url || b.vehicle?.media?.[0]?.url
                const nom =
                  b.vehicle?.display_name ||
                  [b.vehicle?.brand, b.vehicle?.model].filter(Boolean).join(' ') ||
                  b.reference
                return (
                  <li
                    key={b.id}
                    className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="h-36 w-full shrink-0 bg-sand-100 sm:h-auto sm:w-40">
                        {cover ? (
                          <img src={cover} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full min-h-[8rem] items-center justify-center text-ink-300">
                            —
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink-900">{nom}</p>
                            <p className="mt-0.5 text-xs text-ink-500">Réf. {b.reference}</p>
                          </div>
                          <span className={badgeStatut(b.status)}>{libelleStatut(b.status)}</span>
                        </div>
                        <div className="grid gap-1 text-sm text-ink-600 sm:grid-cols-2">
                          <p>
                            <span className="text-ink-400">Départ · </span>
                            {formaterDateCourte(b.pickup_at)}
                          </p>
                          <p>
                            <span className="text-ink-400">Retour · </span>
                            {formaterDateCourte(b.return_at)}
                          </p>
                          {b.days_count != null && (
                            <p className="sm:col-span-2">
                              <span className="text-ink-400">Durée · </span>
                              {b.days_count} jour{b.days_count > 1 ? 's' : ''}
                              {b.partner?.company_name || b.partner?.manager_name
                                ? ` · ${b.partner.company_name || b.partner.manager_name}`
                                : ''}
                            </p>
                          )}
                        </div>
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-sand-100 pt-3">
                          <p className="text-lg font-bold text-forest-900">
                            {formatXaf(b.total_amount)}
                          </p>
                          <Link
                            to={`/confirmation/${b.id}`}
                            state={{ booking: b }}
                            className="text-sm font-medium text-forest-800 hover:underline"
                          >
                            Voir le détail
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export function GuestBookingLookupPage() {
  const [form, setForm] = useState({ reference: '', email: '' })
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBooking(null)
    try {
      const { data } = await api.post('/bookings/guest-lookup', form)
      setBooking(data.data)
    } catch {
      setError('Réservation introuvable. Vérifiez la référence et l’email.')
    }
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-forest-950">Retrouver ma réservation</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-2xl border border-sand-200 bg-white p-6">
          <input
            required
            placeholder="Référence (ex. LG-XXXX)"
            value={form.reference}
            onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
            className="w-full rounded-xl border border-sand-200 px-4 py-3"
          />
          <input
            required
            type="email"
            placeholder="Email utilisé à la réservation"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-xl border border-sand-200 px-4 py-3"
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-forest-900 py-3 font-semibold text-white">
            Rechercher
          </button>
        </form>
        {booking && (
          <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-6">
            <p className="font-semibold">{booking.reference}</p>
            <p className="text-sm text-ink-500">{libelleStatut(booking.status)}</p>
            <p className="mt-2 font-semibold">{formatXaf(booking.total_amount)}</p>
            <Link
              to={`/confirmation/${booking.id}`}
              state={{ booking }}
              className="mt-4 inline-block text-forest-700 underline"
            >
              Voir la confirmation
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
