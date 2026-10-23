import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ContentLoader } from '../../components/ui/Spinner'
import { FenetreModale } from '../../components/ui/FenetreModale'
import { TableauDonnees } from '../../components/ui/TableauDonnees'
import { useAuth } from '../../context/AuthContext'
import api, { formatXaf, messageErreurApi } from '../../lib/api'

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-ink-500">{subtitle}</p>}
    </div>
  )
}

function PillTabs({
  options,
  value,
  onChange,
}: {
  options: [string, string][]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {options.map(([v, label]) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            value === v
              ? 'bg-[#8c4205] text-white'
              : 'border border-black/10 bg-white text-ink-700 hover:bg-[#f4f5f4]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function AdminAccountsPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<
    {
      id: number
      name: string
      email: string
      phone?: string
      role: string
      status: string
      created_at: string
      owned_partner?: { id?: number; company_name?: string; status?: string } | null
    }[]
  >([])
  const [role, setRole] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [dossierAValider, setDossierAValider] = useState<{ id: number; nom: string } | null>(null)
  const [validationEnCours, setValidationEnCours] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/users', { params: role ? { role } : {} })
      setUsers(data.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'super_admin') {
      void load().catch(() => undefined)
    }
  }, [role, user?.role])

  async function setStatus(id: number, status: string) {
    await api.patch(`/admin/users/${id}/status`, { status })
    setMsg(status === 'active' ? 'Compte réactivé.' : 'Compte suspendu.')
    await load()
  }

  // Le dossier partenaire (pending) bloque la publication des véhicules tant qu’il n’est pas validé.
  async function confirmerValidation() {
    if (!dossierAValider) return
    setValidationEnCours(true)
    try {
      await api.post(`/admin/partners/${dossierAValider.id}/approve`)
      setMsg(`Dossier « ${dossierAValider.nom} » validé. Le partenaire peut publier ses véhicules.`)
      setDossierAValider(null)
      await load()
    } catch (err) {
      setMsg(messageErreurApi(err, 'Impossible de valider ce partenaire.'))
    } finally {
      setValidationEnCours(false)
    }
  }

  const libelleDossier = (statut?: string) => {
    const map: Record<string, string> = {
      pending: 'en attente',
      approved: 'validé',
      rejected: 'refusé',
      suspended: 'suspendu',
      info_requested: 'infos demandées',
    }
    return statut ? map[statut] || statut : '?'
  }

  if (user?.role !== 'super_admin') {
    return <Navigate to="/admin" replace />
  }

  const libelleRole = (r: string) => {
    const map: Record<string, string> = {
      customer: 'Réservateur',
      partner: 'Partenaire',
      partner_agent: 'Agent partenaire',
      admin: 'Admin',
      super_admin: 'Super admin',
    }
    return map[r] || r
  }

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader
        title="Comptes"
        subtitle="Réservé au super admin : gestion de tous les partenaires et des comptes réservateurs."
      />
      {msg && <p className="mb-4 text-sm text-ink-600">{msg}</p>}
      <PillTabs
        value={role}
        onChange={setRole}
        options={[
          ['', 'Tous'],
          ['customer', 'Réservateurs'],
          ['partner', 'Partenaires'],
          ['admin', 'Admins'],
          ['super_admin', 'Super admin'],
        ]}
      />
      <TableauDonnees
        colonnes={[
          { cle: 'name', libelle: 'Nom' },
          { cle: 'email', libelle: 'Email' },
          {
            cle: 'role',
            libelle: 'Rôle',
            rendu: (u) => libelleRole(u.role),
          },
          {
            cle: 'partner',
            libelle: 'Dossier partenaire',
            rendu: (u) =>
              u.owned_partner?.company_name
                ? `${u.owned_partner.company_name} (${libelleDossier(u.owned_partner.status)})`
                : '—',
          },
          {
            cle: 'status',
            libelle: 'Statut',
            rendu: (u) => <span className="capitalize">{u.status}</span>,
          },
        ]}
        donnees={users}
        cleLigne={(u) => u.id}
        champsRecherche={(u) =>
          `${u.name} ${u.email} ${u.role} ${u.status} ${u.owned_partner?.company_name || ''}`
        }
        surActualiser={load}
        chargement={loading}
        messageVide="Aucun compte."
        actions={(u) => {
          const dossier = u.owned_partner
          const peutValider =
            dossier?.id != null &&
            (dossier.status === 'pending' || dossier.status === 'info_requested' || dossier.status === 'rejected')
          return (
          <>
            {peutValider && (
              <button
                type="button"
                className="rounded-lg bg-[#8c4205] px-2 py-1 text-xs font-semibold text-white"
                onClick={() =>
                  setDossierAValider({
                    id: dossier.id as number,
                    nom: dossier.company_name || u.name,
                  })
                }
              >
                Valider
              </button>
            )}
            {u.status !== 'active' && (
              <button
                type="button"
                className="rounded-lg bg-[#8c4205] px-2 py-1 text-xs text-white"
                onClick={() => void setStatus(u.id, 'active')}
              >
                Activer
              </button>
            )}
            {u.status === 'active' && u.role !== 'super_admin' && (
              <button
                type="button"
                className="rounded-lg border border-black/12 px-2 py-1 text-xs text-ink-700"
                onClick={() => void setStatus(u.id, 'suspended')}
              >
                Suspendre
              </button>
            )}
          </>
          )
        }}
      />
      <FenetreModale
        ouvert={dossierAValider !== null}
        titre="Valider le compte partenaire"
        sousTitre={dossierAValider ? dossierAValider.nom : undefined}
        onFermer={() => {
          if (!validationEnCours) setDossierAValider(null)
        }}
      >
        <p className="text-sm text-ink-600">
          Une fois validé, ce partenaire pourra publier ses véhicules.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-ink-700"
            disabled={validationEnCours}
            onClick={() => setDossierAValider(null)}
          >
            Annuler
          </button>
          <button
            type="button"
            className="rounded-xl bg-[#8c4205] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={validationEnCours}
            onClick={() => void confirmerValidation()}
          >
            {validationEnCours ? 'Validation…' : 'Valider le compte'}
          </button>
        </div>
      </FenetreModale>
    </div>
  )
}

const LIBELLES_STATUT_RESERVATION: Record<string, string> = {
  pending_payment: 'Paiement en attente',
  locked: 'Verrouillée',
  pending_partner: 'En attente de validation',
  confirmed: 'Confirmée',
  ongoing: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  expired: 'Expirée',
  refunded: 'Remboursée',
  archived: 'Archivée',
}

const STATUTS_VALIDABLES = new Set(['pending_partner', 'pending_payment', 'locked'])
const STATUTS_ANNULABLES = new Set([
  'pending_payment',
  'locked',
  'pending_partner',
  'confirmed',
  'ongoing',
])
const STATUTS_TERMINABLES = new Set(['confirmed', 'ongoing'])

type LigneReservationAdmin = {
  id: number
  reference: string
  status: string
  total_amount: number
  commission_amount: number
  days_count?: number
  pickup_at: string
  return_at: string
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  cancellation_reason?: string | null
  customer?: { name: string; email: string; phone?: string }
  vehicle?: { brand: string; model: string }
  partner?: { company_name?: string }
  pickup_location?: { name: string; city?: string }
  return_location?: { name: string; city?: string }
}

function nomClientReservation(b: LigneReservationAdmin) {
  return b.customer?.name || b.guest_name || b.guest_email || 'Client inconnu'
}

/** Identifie un client pour filtrer son historique, même sans compte. */
function cleClientReservation(b: LigneReservationAdmin) {
  return (b.customer?.email || b.guest_email || b.guest_name || '').toLowerCase()
}

function formaterPeriode(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function dureeJoursReservation(b: LigneReservationAdmin) {
  if (b.days_count != null && b.days_count > 0) return b.days_count
  if (!b.pickup_at || !b.return_at) return 0
  const a = new Date(b.pickup_at).getTime()
  const c = new Date(b.return_at).getTime()
  if (!a || !c || c <= a) return 0
  return Math.max(1, Math.ceil((c - a) / 86400000))
}

/**
 * Date d’échéance métier :
 * - avant / pendant attente → date de départ
 * - location en cours → date de restitution
 * - dossiers clos → date de restitution (historique)
 */
function dateEcheance(b: LigneReservationAdmin): Date | null {
  const cible =
    b.status === 'ongoing' ||
    b.status === 'completed' ||
    b.status === 'cancelled' ||
    b.status === 'expired' ||
    b.status === 'refunded'
      ? b.return_at
      : b.pickup_at
  if (!cible) return null
  const d = new Date(cible)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Jours restants jusqu’à l’échéance (négatif = déjà dépassé). */
function joursRestantsEcheance(b: LigneReservationAdmin): number | null {
  const echeance = dateEcheance(b)
  if (!echeance) return null
  const ms = echeance.getTime() - Date.now()
  return Math.ceil(ms / 86400000)
}

function libelleEcheance(jours: number | null): { texte: string; classe: string } {
  if (jours == null) return { texte: '—', classe: 'text-ink-400' }
  if (jours < 0) {
    const retard = Math.abs(jours)
    return {
      texte: `Dépassé · ${retard} j`,
      classe: 'bg-red-50 text-red-800 border-red-200',
    }
  }
  if (jours === 0) {
    return { texte: 'Aujourd’hui', classe: 'bg-amber-50 text-amber-900 border-amber-200' }
  }
  if (jours === 1) {
    return { texte: 'Dans 1 j', classe: 'bg-amber-50 text-amber-900 border-amber-200' }
  }
  if (jours <= 3) {
    return { texte: `Dans ${jours} j`, classe: 'bg-amber-50/80 text-amber-900 border-amber-100' }
  }
  return { texte: `Dans ${jours} j`, classe: 'bg-black/[0.03] text-ink-700 border-black/10' }
}

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<LigneReservationAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [enCoursId, setEnCoursId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [filtreClient, setFiltreClient] = useState('')
  const [filtrePartenaire, setFiltrePartenaire] = useState('')
  const [filtreLieu, setFiltreLieu] = useState('')
  const [filtreDureeMin, setFiltreDureeMin] = useState('')
  const [filtreMontantMin, setFiltreMontantMin] = useState('')
  /** '' | 'depasse' | '1' | '2' | '3' | '7' | 'custom' */
  const [filtreEcheance, setFiltreEcheance] = useState('')
  const [joursEcheancePerso, setJoursEcheancePerso] = useState('5')
  const [aSupprimer, setASupprimer] = useState<LigneReservationAdmin | null>(null)

  async function charger() {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/bookings')
      setBookings(data.data || [])
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void charger()
  }, [])

  const clients = useMemo(() => {
    const vus = new Map<string, string>()
    for (const b of bookings) {
      const cle = cleClientReservation(b)
      if (!cle || vus.has(cle)) continue
      vus.set(cle, nomClientReservation(b))
    }
    return [...vus.entries()].sort((a, b) => a[1].localeCompare(b[1], 'fr'))
  }, [bookings])

  const partenaires = useMemo(() => {
    const noms = new Set<string>()
    for (const b of bookings) {
      if (b.partner?.company_name) noms.add(b.partner.company_name)
    }
    return [...noms].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [bookings])

  const lieux = useMemo(() => {
    const noms = new Set<string>()
    for (const b of bookings) {
      if (b.pickup_location?.name) noms.add(b.pickup_location.name)
    }
    return [...noms].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [bookings])

  const filtrées = useMemo(() => {
    const seuilPerso = Math.max(1, Number(joursEcheancePerso) || 1)
    return bookings.filter((b) => {
      if (filtreStatut && b.status !== filtreStatut) return false
      if (filtreClient && cleClientReservation(b) !== filtreClient) return false
      if (filtrePartenaire && b.partner?.company_name !== filtrePartenaire) return false
      if (filtreLieu && b.pickup_location?.name !== filtreLieu) return false
      const duree = dureeJoursReservation(b)
      if (filtreDureeMin && duree < Number(filtreDureeMin)) return false
      if (filtreMontantMin && Number(b.total_amount) < Number(filtreMontantMin)) return false

      if (filtreEcheance) {
        const restants = joursRestantsEcheance(b)
        if (restants == null) return false
        if (filtreEcheance === 'depasse') {
          if (restants >= 0) return false
        } else {
          const seuil =
            filtreEcheance === 'custom' ? seuilPerso : Math.max(1, Number(filtreEcheance) || 1)
          // Inclut le dépassé et tout ce qui arrive dans moins de N jours.
          if (restants >= seuil) return false
        }
      }
      return true
    })
  }, [
    bookings,
    filtreStatut,
    filtreClient,
    filtrePartenaire,
    filtreLieu,
    filtreDureeMin,
    filtreMontantMin,
    filtreEcheance,
    joursEcheancePerso,
  ])

  async function executerAction(
    id: number,
    requete: () => Promise<unknown>,
    succes: string,
    echec: string,
  ) {
    setEnCoursId(id)
    setErreur('')
    setMessage('')
    try {
      await requete()
      setMessage(succes)
      await charger()
    } catch (err) {
      setErreur(messageErreurApi(err, echec))
    } finally {
      setEnCoursId(null)
    }
  }

  function valider(id: number) {
    return executerAction(
      id,
      () => api.post(`/admin/bookings/${id}/confirm`),
      'Réservation validée.',
      'Impossible de valider cette réservation.',
    )
  }

  function annuler(id: number) {
    if (!window.confirm('Annuler cette réservation ? Elle restera visible dans l’historique.')) {
      return Promise.resolve()
    }
    return executerAction(
      id,
      () => api.post(`/admin/bookings/${id}/cancel`, { reason: 'Annulée par l’administration.' }),
      'Réservation annulée.',
      'Impossible d’annuler cette réservation.',
    )
  }

  function terminer(id: number) {
    return executerAction(
      id,
      () => api.post(`/admin/bookings/${id}/complete`),
      'Réservation marquée comme terminée.',
      'Impossible de terminer cette réservation.',
    )
  }

  const selectFiltre =
    'rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-ink-500'

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader
        title="Réservations"
        subtitle="Historique complet, y compris les annulations. Filtrez par client. La suppression retire la réservation pour de bon."
      />
      {message && (
        <div className="mb-4 rounded-xl border border-forest-600/20 bg-forest-50 px-4 py-3 text-sm text-forest-900">
          {message}
        </div>
      )}
      {erreur && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {erreur}
        </div>
      )}

      <TableauDonnees
        colonnes={[
          {
            cle: 'reference',
            libelle: 'Référence',
            classe: 'whitespace-nowrap',
            rendu: (b) => (
              <span className="font-mono text-xs font-semibold tracking-wide text-forest-900">
                {b.reference}
              </span>
            ),
          },
          {
            cle: 'vehicule',
            libelle: 'Véhicule',
            rendu: (b) =>
              b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : '—',
          },
          {
            cle: 'client',
            libelle: 'Client',
            rendu: (b) => (
              <div>
                <p className="font-medium">{b.customer?.name || b.guest_name || 'Invité'}</p>
                <p className="text-xs text-ink-500">
                  {b.customer?.email || b.guest_email || '—'}
                </p>
              </div>
            ),
          },
          {
            cle: 'partenaire',
            libelle: 'Partenaire',
            rendu: (b) => b.partner?.company_name || '—',
          },
          {
            cle: 'periode',
            libelle: 'Période',
            rendu: (b) => (
              <div className="whitespace-nowrap text-xs">
                <p>{formaterPeriode(b.pickup_at)}</p>
                <p className="text-ink-400">→ {formaterPeriode(b.return_at)}</p>
              </div>
            ),
          },
          {
            cle: 'duree',
            libelle: 'Durée',
            rendu: (b) => {
              const j = dureeJoursReservation(b)
              return j > 0 ? `${j} j` : '—'
            },
          },
          {
            cle: 'echeance',
            libelle: 'Échéance',
            rendu: (b) => {
              const info = libelleEcheance(joursRestantsEcheance(b))
              return (
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${info.classe}`}
                >
                  {info.texte}
                </span>
              )
            },
          },
          {
            cle: 'lieu',
            libelle: 'Lieu',
            rendu: (b) => b.pickup_location?.name || '—',
          },
          {
            cle: 'montant',
            libelle: 'Montant',
            rendu: (b) => <span className="font-semibold">{formatXaf(b.total_amount)}</span>,
          },
          {
            cle: 'commission',
            libelle: 'Commission',
            rendu: (b) => formatXaf(b.commission_amount),
          },
          {
            cle: 'status',
            libelle: 'Statut',
            rendu: (b) => (
              <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-0.5 text-[11px] font-medium">
                {LIBELLES_STATUT_RESERVATION[b.status] || b.status}
              </span>
            ),
          },
        ]}
        donnees={filtrées}
        cleLigne={(b) => b.id}
        champsRecherche={(b) =>
          [
            b.reference,
            b.vehicle?.brand,
            b.vehicle?.model,
            b.customer?.name,
            b.customer?.email,
            b.guest_name,
            b.guest_email,
            b.partner?.company_name,
            b.pickup_location?.name,
            b.status,
            LIBELLES_STATUT_RESERVATION[b.status],
          ]
            .filter(Boolean)
            .join(' ')
        }
        filtresSupplementaires={
          <>
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              className={selectFiltre}
              aria-label="Filtrer par statut"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(LIBELLES_STATUT_RESERVATION).map(([cle, libelle]) => (
                <option key={cle} value={cle}>
                  {libelle}
                </option>
              ))}
            </select>
            <select
              value={filtreClient}
              onChange={(e) => setFiltreClient(e.target.value)}
              className={selectFiltre}
              aria-label="Filtrer par client"
            >
              <option value="">Tous les clients</option>
              {clients.map(([cle, nom]) => (
                <option key={cle} value={cle}>
                  {nom}
                </option>
              ))}
            </select>
            <select
              value={filtrePartenaire}
              onChange={(e) => setFiltrePartenaire(e.target.value)}
              className={selectFiltre}
              aria-label="Filtrer par partenaire"
            >
              <option value="">Tous les partenaires</option>
              {partenaires.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={filtreLieu}
              onChange={(e) => setFiltreLieu(e.target.value)}
              className={selectFiltre}
              aria-label="Filtrer par lieu"
            >
              <option value="">Tous les lieux</option>
              {lieux.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              value={filtreDureeMin}
              onChange={(e) => setFiltreDureeMin(e.target.value)}
              className={selectFiltre}
              aria-label="Durée minimale"
            >
              <option value="">Durée (toutes)</option>
              <option value="3">≥ 3 jours</option>
              <option value="5">≥ 5 jours</option>
              <option value="7">≥ 7 jours</option>
            </select>
            <select
              value={filtreMontantMin}
              onChange={(e) => setFiltreMontantMin(e.target.value)}
              className={selectFiltre}
              aria-label="Montant minimal"
            >
              <option value="">Montant (tous)</option>
              <option value="50000">≥ 50 000 FCFA</option>
              <option value="100000">≥ 100 000 FCFA</option>
              <option value="200000">≥ 200 000 FCFA</option>
            </select>
            <select
              value={filtreEcheance}
              onChange={(e) => setFiltreEcheance(e.target.value)}
              className={selectFiltre}
              aria-label="Filtrer par échéance"
            >
              <option value="">Échéance (toutes)</option>
              <option value="depasse">Déjà dépassé</option>
              <option value="1">Moins de 1 jour</option>
              <option value="2">Moins de 2 jours</option>
              <option value="3">Moins de 3 jours</option>
              <option value="7">Moins de 7 jours</option>
              <option value="custom">Personnalisé…</option>
            </select>
            {filtreEcheance === 'custom' && (
              <label className="inline-flex items-center gap-1.5 text-sm text-ink-600">
                <span className="whitespace-nowrap">Moins de</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={joursEcheancePerso}
                  onChange={(e) => setJoursEcheancePerso(e.target.value)}
                  className="w-16 rounded-xl border border-black/10 bg-white px-2 py-2 text-sm outline-none focus:border-ink-500"
                  aria-label="Nombre de jours avant échéance"
                />
                <span>j</span>
              </label>
            )}
          </>
        }
        surActualiser={charger}
        chargement={loading}
        messageVide="Aucune réservation pour ces filtres."
        renduDetail={(b) => (
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs text-ink-500">Client</dt>
              <dd className="font-medium">
                {b.customer?.name || b.guest_name || '—'}
                <br />
                <span className="text-ink-500">{b.customer?.email || b.guest_email || '—'}</span>
                {(b.customer?.phone || b.guest_phone) && (
                  <>
                    <br />
                    <span className="text-ink-500">{b.customer?.phone || b.guest_phone}</span>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Restitution</dt>
              <dd className="font-medium">
                {b.return_location?.name || b.pickup_location?.name || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Commission</dt>
              <dd className="font-medium">{formatXaf(b.commission_amount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Départ</dt>
              <dd className="font-medium">{formaterPeriode(b.pickup_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Retour</dt>
              <dd className="font-medium">{formaterPeriode(b.return_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Durée</dt>
              <dd className="font-medium">
                {dureeJoursReservation(b) || '—'} jour
                {dureeJoursReservation(b) > 1 ? 's' : ''}
              </dd>
            </div>
            {b.cancellation_reason && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-ink-500">Motif d’annulation</dt>
                <dd className="font-medium">{b.cancellation_reason}</dd>
              </div>
            )}
          </dl>
        )}
        actions={(b) => {
          const busy = enCoursId === b.id
          const delaiDepasse = (joursRestantsEcheance(b) ?? 0) < 0
          return (
            <>
              {STATUTS_VALIDABLES.has(b.status) && !delaiDepasse && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void valider(b.id)}
                  className="rounded-lg bg-[#8c4205] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {busy ? '…' : 'Valider'}
                </button>
              )}
              {STATUTS_TERMINABLES.has(b.status) && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void terminer(b.id)}
                  className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-black/[0.03] disabled:opacity-60"
                >
                  Terminer
                </button>
              )}
              {STATUTS_ANNULABLES.has(b.status) && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void annuler(b.id)}
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  Annuler
                </button>
              )}
              {b.status === 'cancelled' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setASupprimer(b)}
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  Supprimer
                </button>
              )}
            </>
          )
        }}
      />
      <FenetreModale
        ouvert={aSupprimer !== null}
        titre="Supprimer définitivement"
        sousTitre={aSupprimer ? `${nomClientReservation(aSupprimer)} · ${aSupprimer.reference}` : undefined}
        onFermer={() => {
          if (enCoursId == null) setASupprimer(null)
        }}
      >
        <p className="text-sm text-ink-700">
          Cette réservation annulée sera effacée de l’historique. La suppression est irréversible.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={enCoursId != null}
            onClick={() => setASupprimer(null)}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold"
          >
            Garder
          </button>
          <button
            type="button"
            disabled={enCoursId != null}
            onClick={() => {
              if (!aSupprimer) return
              const cible = aSupprimer
              setASupprimer(null)
              void executerAction(
                cible.id,
                () => api.delete(`/admin/bookings/${cible.id}`),
                'Réservation supprimée définitivement.',
                'Impossible de supprimer cette réservation.',
              )
            }}
            className="rounded-xl bg-red-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
      </FenetreModale>
    </div>
  )
}

export function AdminFinancesPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    void api
      .get('/admin/dashboard')
      .then(({ data }) => setStats(data.data))
      .catch(() => undefined)
  }, [])

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader
        title="Finances"
        subtitle="GMV et commissions prélevées (0 % au lancement, configurable ensuite)."
      />
      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['GMV (volume affaires)', formatXaf(stats.gmv)],
            ['Commissions plateforme', formatXaf(stats.commissions)],
            ['Réservations payées / confirmées', stats.bookings_count],
            ['Partenaires validés', stats.partners_approved],
            ['Véhicules publiés', stats.vehicles_published],
            ['Utilisateurs', stats.users_count],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-black/8 bg-white p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-400">{label}</p>
              <p className="mt-3 text-3xl font-bold text-ink-900">{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-black/8 bg-white">
          <ContentLoader />
        </div>
      )}
    </div>
  )
}

/** Redirige vers le referentiel unifie (onglet Lieux). */
export function AdminLocationsPage() {
  return <Navigate to="/admin/referentiel?onglet=lieux" replace />
}
