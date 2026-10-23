import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CoqueEspaceClient } from '../../components/client/CoqueEspaceClient'
import { CoqueSession } from '../../components/layout/CoqueSession'
import { PublicHeader } from '../../components/layout/Header'
import { SearchForm } from '../../components/search/SearchForm'
import { BoutonActionCrud } from '../../components/ui/BoutonActionCrud'
import { FenetreModale } from '../../components/ui/FenetreModale'
import { ContentLoader } from '../../components/ui/Spinner'
import { TableauDonnees } from '../../components/ui/TableauDonnees'
import { useAuth } from '../../context/AuthContext'
import { useCatalog } from '../../context/CatalogContext'
import api, { formatXaf, messageErreurApi, telechargerFichier } from '../../lib/api'
import type { Booking } from '../../types'

const LIBELLES_STATUT: Record<string, string> = {
  pending_payment: 'Paiement en attente',
  locked: 'En cours de validation',
  pending_partner: 'Demande en attente',
  confirmed: 'Confirmée',
  refused: 'Refusée',
  ongoing: 'En cours de location',
  completed: 'Clôturée',
  cancelled: 'Annulée',
  expired: 'Expirée',
  refunded: 'Remboursée',
  archived: 'Archivée',
}

function libelleStatut(statut: string) {
  return LIBELLES_STATUT[statut] || statut
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

/** Après la demande, le compte reste dans son espace, pas sur le site public. */
function lienApresReservation(role: string) {
  if (role === 'super_admin' || role === 'admin') return '/admin/reservations'
  if (role === 'partner' || role === 'partner_agent' || role === 'finance_manager') {
    return '/partenaire/reservations'
  }
  return '/mes-reservations'
}

export function ConfirmationPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { labels } = useCatalog()
  const location = useLocation()
  const state = location.state as
    | ({
        booking?: Booking
      } & IdentifiantsConfirm)
    | null

  const stockes = useMemo(() => lireIdentifiantsStockes(id), [id])
  const [booking, setBooking] = useState<Booking | null>(state?.booking || null)
  const [telechargementRecap, setTelechargementRecap] = useState(false)
  const [erreurRecap, setErreurRecap] = useState('')

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
    const message = <p className="p-8">Réservation introuvable. Connectez-vous pour la consulter.</p>
    return (
      <CoqueSession
        visiteur={
          <div className="min-h-screen bg-sand-50">
            <PublicHeader />
            {message}
          </div>
        }
      >
        {message}
      </CoqueSession>
    )
  }

  const reservation = booking
  const emailConnexion = loginEmail || (reservation as Booking & { guest_email?: string }).guest_email || ''
  const lienConnexion = user
    ? lienApresReservation(user.role)
    : `/connexion?redirect=${encodeURIComponent('/mes-reservations')}${
        emailConnexion ? `&email=${encodeURIComponent(emailConnexion)}` : ''
      }`

  async function telechargerRecapitulatif() {
    if (!id) return
    setTelechargementRecap(true)
    setErreurRecap('')
    try {
      await telechargerFichier(
        `/bookings/${id}/contrat`,
        `recapitulatif-${reservation.reference}.pdf`,
      )
    } catch {
      setErreurRecap('Impossible de télécharger le récapitulatif. Réessayez dans un instant.')
    } finally {
      setTelechargementRecap(false)
    }
  }

  const carte = (
      <div className="relative min-h-0 flex-1">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(6,40,28,0.45) 0%, rgba(6,40,28,0.28) 40%, rgba(6,40,28,0.5) 100%), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80')",
        }}
      />
      <div className="relative">
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <div className="rounded-2xl border border-white/40 bg-white/95 p-8 text-center shadow-xl backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-600">Confirmation</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-forest-950">
            Demande transmise
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-700">
            Le loueur doit accepter ou refuser cette demande. Le règlement est suivi par le loueur :
            aucun paiement en ligne n’est encaissé à cette étape. La caution reste distincte du prix de location.
          </p>
          <p className="mt-5 text-ink-700">
            Référence <strong className="text-forest-800">{booking.reference}</strong>
          </p>
          <p className="mt-2 text-sm text-ink-500">Statut : {libelleStatut(booking.status)}</p>
          {booking.payment_method && (
            <p className="mt-2 text-sm text-ink-700">
              Moyen de paiement :{' '}
              {labels.payment_method?.[booking.payment_method] || booking.payment_method}
            </p>
          )}
          <p className="mt-3 text-lg font-semibold text-forest-900">
            {formatXaf(booking.total_amount)}
          </p>
          <button
            type="button"
            disabled={telechargementRecap}
            className="mt-4 rounded-full border border-forest-800 px-4 py-2 text-sm font-medium text-forest-800 disabled:opacity-50"
            onClick={() => void telechargerRecapitulatif()}
          >
            {telechargementRecap ? 'Téléchargement…' : 'Télécharger le récapitulatif'}
          </button>
          {erreurRecap && <p className="mt-2 text-sm text-red-800">{erreurRecap}</p>}

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
            {!user && (
              <Link to="/" className="text-forest-700 hover:underline">
                Retour à l’accueil
              </Link>
            )}
          </div>
        </div>
      </div>
      </div>
      </div>
  )

  return (
    <CoqueSession
      visiteur={
        <div className="flex min-h-screen flex-col bg-sand-50">
          <PublicHeader />
          {carte}
        </div>
      }
    >
      {carte}
    </CoqueSession>
  )
}


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

/** Demandes pas encore acceptées : le client peut encore les annuler. */
const STATUTS_ANNULABLES = new Set(['locked', 'pending_payment', 'pending_partner'])

function peutAnnuler(statut: string) {
  return STATUTS_ANNULABLES.has(statut)
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

function nomLieuReservation(b: Booking) {
  const lieu = b.pickup_location
  if (!lieu?.name) return ''
  return lieu.city ? `${lieu.name} — ${lieu.city}` : lieu.name
}

/** Jour calendaire local, pour comparer un filtre date à la période de location. */
function jourReservation(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const mois = String(date.getMonth() + 1).padStart(2, '0')
  const jour = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mois}-${jour}`
}

function valeursUniques(valeurs: string[]) {
  return [...new Set(valeurs.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'))
}

type TriReservations =
  | 'recent'
  | 'depart_asc'
  | 'depart_desc'
  | 'duree_asc'
  | 'duree_desc'
  | 'montant_asc'
  | 'montant_desc'
type FiltreDureeMin = '' | '1' | '3' | '5' | '7'
type FiltreMontantMin = '' | '50000' | '100000' | '200000' | '500000'

export function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [params, setParams] = useSearchParams()
  const [creationOuverte, setCreationOuverte] = useState(() => params.get('nouvelle') === '1')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState('')
  const [chargement, setChargement] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('')
  const [filtreVehicule, setFiltreVehicule] = useState('')
  const [filtreLieu, setFiltreLieu] = useState('')
  const [departDes, setDepartDes] = useState('')
  const [retourJusqua, setRetourJusqua] = useState('')
  const [tri, setTri] = useState<TriReservations>('recent')
  const [dureeMin, setDureeMin] = useState<FiltreDureeMin>('')
  const [montantMin, setMontantMin] = useState<FiltreMontantMin>('')
  const [aAnnuler, setAAnnuler] = useState<Booking | null>(null)
  const [aSupprimer, setASupprimer] = useState<Booking | null>(null)
  const [annulation, setAnnulation] = useState(false)
  const [suppression, setSuppression] = useState(false)

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

  // L’ancienne adresse /mes-reservations/nouvelle arrive avec ?nouvelle=1.
  useEffect(() => {
    if (params.get('nouvelle') === '1') setCreationOuverte(true)
  }, [params])

  function ouvrirCreation() {
    setCreationOuverte(true)
  }

  function fermerCreation() {
    setCreationOuverte(false)
    if (params.get('nouvelle') !== '1') return
    const suivants = new URLSearchParams(params)
    suivants.delete('nouvelle')
    setParams(suivants, { replace: true })
  }

  async function confirmerAnnulation() {
    if (!aAnnuler) return
    setAnnulation(true)
    setError('')
    try {
      await api.post(`/bookings/${aAnnuler.id}/annuler`)
      setAAnnuler(null)
      await charger()
    } catch (err) {
      setError(messageErreurApi(err, 'Annulation impossible.'))
      setAAnnuler(null)
    } finally {
      setAnnulation(false)
    }
  }

  async function confirmerSuppression() {
    if (!aSupprimer) return
    setSuppression(true)
    setError('')
    try {
      await api.delete(`/bookings/${aSupprimer.id}`)
      setASupprimer(null)
      await charger()
    } catch (err) {
      setError(messageErreurApi(err, 'Suppression impossible.'))
      setASupprimer(null)
    } finally {
      setSuppression(false)
    }
  }

  const vehicules = useMemo(
    () => valeursUniques(bookings.map(nomVehiculeReservation)),
    [bookings],
  )
  const lieux = useMemo(() => valeursUniques(bookings.map(nomLieuReservation)), [bookings])

  const filtrées = useMemo(() => {
    let liste = bookings.filter((b) => {
      if (filtreStatut && b.status !== filtreStatut) return false
      if (filtreVehicule && nomVehiculeReservation(b) !== filtreVehicule) return false
      if (filtreLieu && nomLieuReservation(b) !== filtreLieu) return false
      if (departDes && jourReservation(b.pickup_at) < departDes) return false
      if (retourJusqua && jourReservation(b.return_at) > retourJusqua) return false
      if (dureeMin && dureeJours(b) < Number(dureeMin)) return false
      if (montantMin && b.total_amount < Number(montantMin)) return false
      return true
    })

    if (tri === 'depart_asc') {
      liste = [...liste].sort(
        (a, b) => new Date(a.pickup_at).getTime() - new Date(b.pickup_at).getTime(),
      )
    } else if (tri === 'depart_desc') {
      liste = [...liste].sort(
        (a, b) => new Date(b.pickup_at).getTime() - new Date(a.pickup_at).getTime(),
      )
    } else if (tri === 'duree_desc') {
      liste = [...liste].sort((a, b) => dureeJours(b) - dureeJours(a))
    } else if (tri === 'duree_asc') {
      liste = [...liste].sort((a, b) => dureeJours(a) - dureeJours(b))
    } else if (tri === 'montant_desc') {
      liste = [...liste].sort((a, b) => b.total_amount - a.total_amount)
    } else if (tri === 'montant_asc') {
      liste = [...liste].sort((a, b) => a.total_amount - b.total_amount)
    }

    return liste
  }, [
    bookings,
    filtreStatut,
    filtreVehicule,
    filtreLieu,
    departDes,
    retourJusqua,
    tri,
    dureeMin,
    montantMin,
  ])

  const filtreActif =
    filtreStatut !== '' ||
    filtreVehicule !== '' ||
    filtreLieu !== '' ||
    departDes !== '' ||
    retourJusqua !== '' ||
    dureeMin !== '' ||
    montantMin !== '' ||
    tri !== 'recent'

  function reinitialiserFiltres() {
    setFiltreStatut('')
    setFiltreVehicule('')
    setFiltreLieu('')
    setDepartDes('')
    setRetourJusqua('')
    setDureeMin('')
    setMontantMin('')
    setTri('recent')
  }

  if (!authLoading && !user) {
    const retour = params.get('nouvelle') === '1' ? '/mes-reservations?nouvelle=1' : '/mes-reservations'
    return (
      <Navigate
        to={`/connexion?redirect=${encodeURIComponent(retour)}`}
        replace
      />
    )
  }

  const enChargement = authLoading || chargement

  return (
    <CoqueEspaceClient>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Espace client
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-forest-950 md:text-4xl">
              Mes réservations
            </h1>
            <p className="mt-1.5 text-sm text-ink-500">
              Les annulations restent dans votre historique. Seule la suppression les retire définitivement.
            </p>
          </div>
          <button
            type="button"
            onClick={ouvrirCreation}
            className="inline-flex items-center gap-2 rounded-xl bg-forest-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Nouvelle réservation
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

        {!enChargement && bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/12 bg-white px-6 py-14 text-center">
            <p className="font-medium text-ink-800">Aucune réservation pour le moment</p>
            <p className="mt-1 text-sm text-ink-500">
              Vos prochaines réservations apparaîtront ici.
            </p>
            <button
              type="button"
              onClick={ouvrirCreation}
              className="mt-5 inline-flex rounded-xl bg-forest-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Réserver une voiture
            </button>
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
                nomLieuReservation(b),
                libelleStatut(b.status),
                b.status,
                libelleDuree(dureeJours(b)),
                String(b.total_amount ?? ''),
              ]
                .filter(Boolean)
                .join(' ')
            }
            filtreActif={filtreActif}
            filtresSupplementaires={
              <>
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Statut
                  </span>
                  <select
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    aria-label="Filtrer par statut"
                  >
                    <option value="">Tous les statuts</option>
                    {Object.entries(LIBELLES_STATUT).map(([cle, libelle]) => (
                      <option key={cle} value={cle}>
                        {libelle}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Véhicule
                  </span>
                  <select
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    value={filtreVehicule}
                    onChange={(e) => setFiltreVehicule(e.target.value)}
                    aria-label="Filtrer par véhicule"
                  >
                    <option value="">Tous les véhicules</option>
                    {vehicules.map((nom) => (
                      <option key={nom} value={nom}>
                        {nom}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Lieu de prise en charge
                  </span>
                  <select
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    value={filtreLieu}
                    onChange={(e) => setFiltreLieu(e.target.value)}
                    aria-label="Filtrer par lieu de prise en charge"
                  >
                    <option value="">Tous les lieux</option>
                    {lieux.map((nom) => (
                      <option key={nom} value={nom}>
                        {nom}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Départ à partir du
                  </span>
                  <input
                    type="date"
                    value={departDes}
                    onChange={(e) => setDepartDes(e.target.value)}
                    aria-label="Départ à partir du"
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Retour jusqu’au
                  </span>
                  <input
                    type="date"
                    value={retourJusqua}
                    onChange={(e) => setRetourJusqua(e.target.value)}
                    aria-label="Retour jusqu’au"
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Durée
                  </span>
                  <select
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    value={dureeMin}
                    onChange={(e) => setDureeMin(e.target.value as FiltreDureeMin)}
                    aria-label="Filtrer par durée minimale"
                  >
                    <option value="">Toutes les durées</option>
                    <option value="1">1 jour et plus</option>
                    <option value="3">3 jours et plus</option>
                    <option value="5">5 jours et plus</option>
                    <option value="7">7 jours et plus</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Montant
                  </span>
                  <select
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    value={montantMin}
                    onChange={(e) => setMontantMin(e.target.value as FiltreMontantMin)}
                    aria-label="Filtrer par montant minimal"
                  >
                    <option value="">Tous les montants</option>
                    <option value="50000">50 000 FCFA et plus</option>
                    <option value="100000">100 000 FCFA et plus</option>
                    <option value="200000">200 000 FCFA et plus</option>
                    <option value="500000">500 000 FCFA et plus</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Tri
                  </span>
                  <select
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    value={tri}
                    onChange={(e) => setTri(e.target.value as TriReservations)}
                    aria-label="Trier les réservations"
                  >
                    <option value="recent">Plus récentes</option>
                    <option value="depart_asc">Départ le plus proche</option>
                    <option value="depart_desc">Départ le plus lointain</option>
                    <option value="duree_desc">Plus longues d’abord</option>
                    <option value="duree_asc">Plus courtes d’abord</option>
                    <option value="montant_desc">Montant décroissant</option>
                    <option value="montant_asc">Montant croissant</option>
                  </select>
                </label>
                {filtreActif && (
                  <button
                    type="button"
                    onClick={reinitialiserFiltres}
                    className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-black/[0.03]"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </>
            }
            surActualiser={charger}
            chargement={enChargement}
            messageVide="Aucune réservation ne correspond à ces filtres."
            titreDetail={() => 'Détail de la réservation'}
            sousTitreDetail={(b) => b.reference || undefined}
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
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                        Montant
                      </p>
                      <p className="text-lg font-bold text-forest-900">
                        {formatXaf(b.total_amount)}
                      </p>
                    </div>
                    {b.cancellation_reason && (
                      <div className="sm:col-span-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                          Motif d’annulation
                        </p>
                        <p className="text-sm text-ink-800">{b.cancellation_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            }}
            actions={(b) =>
              peutAnnuler(b.status) ? (
                <BoutonActionCrud
                  variante="supprimer"
                  libelle="Annuler la réservation"
                  onClick={() => setAAnnuler(b)}
                />
              ) : b.status === 'cancelled' ? (
                <BoutonActionCrud
                  variante="supprimer"
                  libelle="Supprimer définitivement"
                  onClick={() => setASupprimer(b)}
                />
              ) : null
            }
          />
        )}
        <FenetreModale
          ouvert={aAnnuler !== null}
          titre="Annuler la réservation"
          sousTitre={aAnnuler?.reference}
          onFermer={() => {
            if (!annulation) setAAnnuler(null)
          }}
        >
          <p className="text-sm text-ink-700">
            Cette demande est encore en cours de validation. L’annulation libère le véhicule sur
            ces dates.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={annulation}
              onClick={() => setAAnnuler(null)}
              className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold"
            >
              Garder
            </button>
            <button
              type="button"
              disabled={annulation}
              onClick={() => void confirmerAnnulation()}
              className="rounded-xl bg-red-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {annulation ? 'Annulation…' : 'Annuler'}
            </button>
          </div>
        </FenetreModale>
        <FenetreModale
          ouvert={aSupprimer !== null}
          titre="Supprimer définitivement"
          sousTitre={aSupprimer?.reference}
          onFermer={() => {
            if (!suppression) setASupprimer(null)
          }}
        >
          <p className="text-sm text-ink-700">
            Cette réservation annulée disparaîtra de votre historique. La suppression est
            irréversible.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={suppression}
              onClick={() => setASupprimer(null)}
              className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold"
            >
              Garder
            </button>
            <button
              type="button"
              disabled={suppression}
              onClick={() => void confirmerSuppression()}
              className="rounded-xl bg-red-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {suppression ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </FenetreModale>
        {creationOuverte && (
          <FenetreModale
            ouvert
            titre="Nouvelle réservation"
            sousTitre="Choisissez vos dates et un véhicule disponible, puis continuez vers la confirmation."
            onFermer={fermerCreation}
            classePanneau="max-h-[90vh] w-full max-w-4xl"
          >
            {authLoading ? (
              <ContentLoader label="Chargement du formulaire…" />
            ) : (
              <SearchForm espaceClient />
            )}
          </FenetreModale>
        )}
    </CoqueEspaceClient>
  )
}

/**
 * Profil du réservateur : identité et déconnexion.
 */
export function PageEspaceClient() {
  const { user, loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()

  async function seDeconnecter() {
    await logout()
    navigate('/', { replace: true })
  }

  if (!authLoading && !user) {
    return (
      <Navigate
        to={`/connexion?redirect=${encodeURIComponent('/mes-reservations/espace')}`}
        replace
      />
    )
  }

  return (
    <CoqueEspaceClient>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Espace client
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-forest-950 md:text-4xl">
            Mon Profil
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Vos informations de connexion.
          </p>
        </div>

        <section className="mb-6 rounded-2xl border border-black/8 bg-white p-5 md:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Identité</h2>
          {authLoading || !user ? (
            <ContentLoader label="Chargement du profil…" className="justify-start py-6" />
          ) : (
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
          )}
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
    </CoqueEspaceClient>
  )
}

/** L’ancienne page ouvre le même formulaire, dans le modal de Mes réservations. */
export function PageNouvelleReservation() {
  return <Navigate to="/mes-reservations?nouvelle=1" replace />
}

