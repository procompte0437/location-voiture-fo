import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { NavEspaceClient } from '../../components/client/NavEspaceClient'
import { PublicHeader } from '../../components/layout/Header'
import { SearchForm } from '../../components/search/SearchForm'
import { ContentLoader } from '../../components/ui/Spinner'
import { TableauDonnees } from '../../components/ui/TableauDonnees'
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
    archived: 'Archivée',
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
    <div className="relative min-h-screen">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(6,40,28,0.45) 0%, rgba(6,40,28,0.28) 40%, rgba(6,40,28,0.5) 100%), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80')",
        }}
      />
      <div className="relative">
      <PublicHeader />
      <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
        <NavEspaceClient />
        <div className="rounded-2xl border border-white/40 bg-white/95 p-8 text-center shadow-xl backdrop-blur-sm">
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
    </div>
  )
}

type FiltreStatutClient = 'toutes' | 'en_cours' | 'confirmees' | 'terminees' | 'annulees'

const FILTRES_STATUT: { cle: FiltreStatutClient; libelle: string; statuts?: string[] }[] = [
  { cle: 'toutes', libelle: 'Tous les statuts' },
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
    statuts: ['cancelled', 'expired', 'refunded', 'archived'],
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

function nomVehiculeReservation(b: Booking) {
  return (
    b.vehicle?.display_name ||
    [b.vehicle?.brand, b.vehicle?.model].filter(Boolean).join(' ') ||
    b.reference
  )
}

/** Durée en jours (API ou calcul depuis les dates). */
function dureeJours(b: Booking) {
  if (b.days_count != null && b.days_count > 0) return b.days_count
  if (!b.pickup_at || !b.return_at) return 0
  const a = new Date(b.pickup_at).getTime()
  const c = new Date(b.return_at).getTime()
  if (!a || !c || c <= a) return 0
  return Math.max(1, Math.ceil((c - a) / (1000 * 60 * 60 * 24)))
}

function libelleDuree(jours: number) {
  if (jours <= 0) return '—'
  return `${jours} jour${jours > 1 ? 's' : ''}`
}

type TriReservations = 'recent' | 'duree_desc' | 'duree_asc'
type FiltreDureeMin = '' | '3' | '5' | '7'

export function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState('')
  const [chargement, setChargement] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatutClient>('toutes')
  const [tri, setTri] = useState<TriReservations>('recent')
  const [dureeMin, setDureeMin] = useState<FiltreDureeMin>('')

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

  const filtrées = useMemo(() => {
    const def = FILTRES_STATUT.find((o) => o.cle === filtreStatut)
    let liste = def?.statuts
      ? bookings.filter((b) => def.statuts!.includes(b.status))
      : [...bookings]

    const min = dureeMin ? Number(dureeMin) : 0
    if (min > 0) {
      liste = liste.filter((b) => dureeJours(b) >= min)
    }

    if (tri === 'duree_desc') {
      liste = [...liste].sort((a, b) => dureeJours(b) - dureeJours(a))
    } else if (tri === 'duree_asc') {
      liste = [...liste].sort((a, b) => dureeJours(a) - dureeJours(b))
    }

    return liste
  }, [bookings, filtreStatut, tri, dureeMin])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-sand-50">
        <PublicHeader />
        <div className="mx-auto max-w-5xl px-4 py-10">
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
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <NavEspaceClient />
        <div className="mb-6">
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

        {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

        {!chargement && bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/12 bg-white px-6 py-14 text-center">
            <p className="font-medium text-ink-800">Aucune réservation pour le moment</p>
            <p className="mt-1 text-sm text-ink-500">
              Vos prochaines réservations apparaîtront ici.
            </p>
            <Link
              to="/mes-reservations/nouvelle"
              className="mt-5 inline-flex rounded-xl bg-forest-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Réserver une voiture
            </Link>
          </div>
        ) : (
          <TableauDonnees
            colonnes={[
              {
                cle: 'reference',
                libelle: 'Référence',
                classe: 'whitespace-nowrap',
                rendu: (b) => (
                  <span className="inline-flex rounded-lg bg-forest-900/5 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-forest-900">
                    {b.reference || '—'}
                  </span>
                ),
              },
              {
                cle: 'vehicule',
                libelle: 'Véhicule',
                rendu: (b) => {
                  const cover = b.vehicle?.cover_url || b.vehicle?.media?.[0]?.url
                  return (
                    <div className="flex items-center gap-3">
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          className="h-10 w-14 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="grid h-10 w-14 shrink-0 place-items-center rounded-lg bg-sand-100 text-ink-300">
                          —
                        </span>
                      )}
                      <p className="truncate font-medium text-ink-900">{nomVehiculeReservation(b)}</p>
                    </div>
                  )
                },
              },
              {
                cle: 'periode',
                libelle: 'Période',
                rendu: (b) => (
                  <div className="text-sm">
                    <p>{formaterDateCourte(b.pickup_at)}</p>
                    <p className="text-ink-500">→ {formaterDateCourte(b.return_at)}</p>
                  </div>
                ),
              },
              {
                cle: 'duree',
                libelle: 'Durée',
                classe: 'whitespace-nowrap',
                rendu: (b) => {
                  const j = dureeJours(b)
                  return (
                    <span
                      className={`inline-flex rounded-lg px-2 py-1 text-sm font-semibold ${
                        j >= 7
                          ? 'bg-gold-400/25 text-forest-950'
                          : j >= 3
                            ? 'bg-forest-900/8 text-forest-900'
                            : 'text-ink-800'
                      }`}
                    >
                      {libelleDuree(j)}
                    </span>
                  )
                },
              },
              {
                cle: 'partenaire',
                libelle: 'Partenaire',
                rendu: (b) =>
                  b.partner?.company_name || b.partner?.manager_name || '—',
              },
              {
                cle: 'montant',
                libelle: 'Montant',
                rendu: (b) => (
                  <span className="font-semibold text-forest-900">{formatXaf(b.total_amount)}</span>
                ),
              },
              {
                cle: 'status',
                libelle: 'Statut',
                rendu: (b) => (
                  <span className={badgeStatut(b.status)}>{libelleStatut(b.status)}</span>
                ),
              },
            ]}
            donnees={filtrées}
            cleLigne={(b) => b.id}
            champsRecherche={(b) =>
              [
                b.reference,
                nomVehiculeReservation(b),
                b.vehicle?.brand,
                b.vehicle?.model,
                b.partner?.company_name,
                b.partner?.manager_name,
                libelleStatut(b.status),
                b.status,
                libelleDuree(dureeJours(b)),
              ]
                .filter(Boolean)
                .join(' ')
            }
            filtresSupplementaires={
              <>
                <select
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                  value={filtreStatut}
                  onChange={(e) => setFiltreStatut(e.target.value as FiltreStatutClient)}
                  aria-label="Filtrer par statut"
                >
                  {FILTRES_STATUT.map((f) => (
                    <option key={f.cle} value={f.cle}>
                      {f.libelle}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                  value={dureeMin}
                  onChange={(e) => setDureeMin(e.target.value as FiltreDureeMin)}
                  aria-label="Filtrer par durée minimale"
                >
                  <option value="">Toutes les durées</option>
                  <option value="3">3 jours et plus</option>
                  <option value="5">5 jours et plus</option>
                  <option value="7">7 jours et plus (plus longues)</option>
                </select>
                <select
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                  value={tri}
                  onChange={(e) => setTri(e.target.value as TriReservations)}
                  aria-label="Trier les réservations"
                >
                  <option value="recent">Tri : récentes</option>
                  <option value="duree_desc">Tri : plus longues d’abord</option>
                  <option value="duree_asc">Tri : plus courtes d’abord</option>
                </select>
              </>
            }
            surActualiser={charger}
            chargement={chargement}
            messageVide="Aucune réservation ne correspond à ces filtres."
            renduDetail={(b) => {
              const cover = b.vehicle?.cover_url || b.vehicle?.media?.[0]?.url
              return (
                <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      className="h-28 w-40 rounded-xl object-cover sm:h-32 sm:w-44"
                    />
                  ) : (
                    <div className="grid h-28 w-40 place-items-center rounded-xl bg-sand-100 text-ink-300 sm:h-32 sm:w-44">
                      —
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                        Référence réservation
                      </p>
                      <p className="mt-0.5 font-mono text-base font-bold tracking-wide text-forest-900">
                        {b.reference || '—'}
                      </p>
                      <p className="mt-1 text-xs text-ink-500">
                        Utilisez cette référence pour identifier précisément cette réservation.
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                        Véhicule
                      </p>
                      <p className="font-medium text-ink-900">{nomVehiculeReservation(b)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                        Statut
                      </p>
                      <span className={badgeStatut(b.status)}>{libelleStatut(b.status)}</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                        Départ
                      </p>
                      <p className="text-sm text-ink-800">{formaterDateCourte(b.pickup_at)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                        Retour
                      </p>
                      <p className="text-sm text-ink-800">{formaterDateCourte(b.return_at)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                        Durée
                      </p>
                      <p className="text-sm font-semibold text-forest-900">
                        {libelleDuree(dureeJours(b))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                        Partenaire
                      </p>
                      <p className="text-sm text-ink-800">
                        {b.partner?.company_name || b.partner?.manager_name || '—'}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                        Montant
                      </p>
                      <p className="text-lg font-bold text-forest-900">
                        {formatXaf(b.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            }}
          />
        )}
      </div>
    </div>
  )
}

const LIENS_ESPACE_CLIENT = [
  {
    to: '/#agences',
    libelle: 'Agences de location',
    description: 'Carte des provinces et points de retrait au Gabon.',
  },
  {
    to: '/vehicules',
    libelle: 'Véhicules',
    description: 'Parcourir le catalogue et comparer les offres.',
  },
  {
    to: '/devenir-partenaire',
    libelle: 'Professionnels',
    description: 'Devenir partenaire et publier vos véhicules.',
  },
  {
    to: '/faq',
    libelle: 'Aide',
    description: 'Questions fréquentes et assistance.',
  },
]

/**
 * Hub compte client : liens retirés de la navbar une fois connecté.
 */
export function PageEspaceClient() {
  const { user, loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()

  async function seDeconnecter() {
    await logout()
    navigate('/', { replace: true })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-sand-50">
        <PublicHeader />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <ContentLoader label="Chargement…" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to={`/connexion?redirect=${encodeURIComponent('/mes-reservations/espace')}`}
        replace
      />
    )
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <NavEspaceClient />
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Espace client
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-forest-950 md:text-4xl">
            Mon compte
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Accédez au site, à l’aide et à vos informations de connexion.
          </p>
        </div>

        <section className="mb-6 rounded-2xl border border-black/8 bg-white p-5 md:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Identité</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-500">Nom</dt>
              <dd className="font-medium text-ink-900">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Email</dt>
              <dd className="font-medium text-ink-900">{user.email}</dd>
            </div>
            {user.phone && (
              <div>
                <dt className="text-xs text-ink-500">Téléphone</dt>
                <dd className="font-medium text-ink-900">{user.phone}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-2xl border border-black/8 bg-white p-2">
          <ul className="divide-y divide-black/6">
            {LIENS_ESPACE_CLIENT.map((lien) => (
              <li key={lien.to}>
                <Link
                  to={lien.to}
                  className="flex items-start justify-between gap-4 rounded-xl px-4 py-3.5 transition hover:bg-black/[0.03]"
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink-900">{lien.libelle}</span>
                    <span className="mt-0.5 block text-sm text-ink-500">{lien.description}</span>
                  </span>
                  <span aria-hidden className="mt-0.5 text-ink-300">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => void seDeconnecter()}
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-800"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  )
}

/** Formulaire de nouvelle réservation dans l’espace client (hors hero du site). */
export function PageNouvelleReservation() {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-sand-50">
        <PublicHeader />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <ContentLoader label="Chargement…" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to={`/connexion?redirect=${encodeURIComponent('/mes-reservations/nouvelle')}`}
        replace
      />
    )
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <NavEspaceClient />
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Espace client
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-forest-950 md:text-4xl">
            Nouvelle réservation
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Choisissez vos dates et un véhicule disponible, puis continuez vers la confirmation.
          </p>
        </div>
        <SearchForm espaceClient />
      </div>
    </div>
  )
}

