import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ContentLoader } from '../../components/ui/Spinner'
import { TableauDonnees } from '../../components/ui/TableauDonnees'
import { useAuth } from '../../context/AuthContext'
import api, { formatXaf } from '../../lib/api'

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
              ? 'bg-[#0b3d2e] text-white'
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
      owned_partner?: { company_name?: string; status?: string } | null
    }[]
  >([])
  const [role, setRole] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

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
    setMsg(`Compte #${id} ? ${status}`)
    await load()
  }

  if (user?.role !== 'super_admin') {
    return <Navigate to="/admin" replace />
  }

  const libelleRole = (r: string) => {
    const map: Record<string, string> = {
      customer: 'R�servateur',
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
        subtitle="R�serv� au super admin : gestion de tous les partenaires et des comptes r�servateurs."
      />
      {msg && <p className="mb-4 text-sm text-ink-600">{msg}</p>}
      <PillTabs
        value={role}
        onChange={setRole}
        options={[
          ['', 'Tous'],
          ['customer', 'R�servateurs'],
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
            libelle: 'R�le',
            rendu: (u) => libelleRole(u.role),
          },
          {
            cle: 'partner',
            libelle: 'Dossier partenaire',
            rendu: (u) =>
              u.owned_partner?.company_name
                ? `${u.owned_partner.company_name} (${u.owned_partner.status || '?'})`
                : '?',
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
        actions={(u) => (
          <>
            {u.status !== 'active' && (
              <button
                type="button"
                className="rounded-lg bg-[#0b3d2e] px-2 py-1 text-xs text-white"
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
        )}
      />
    </div>
  )
}

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<
    {
      id: number
      reference: string
      status: string
      total_amount: number
      commission_amount: number
      pickup_at: string
      return_at: string
      guest_name?: string
      customer?: { name: string; email: string }
      vehicle?: { brand: string; model: string }
      partner?: { company_name?: string }
      pickup_location?: { name: string }
    }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void api
      .get('/admin/bookings')
      .then(({ data }) => setBookings(data.data || []))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader
        title="R�servations"
        subtitle="Toutes les r�servations de la marketplace ? suivi admin."
      />
      {loading ? (
        <div className="rounded-xl border border-black/8 bg-white">
          <ContentLoader />
        </div>
      ) : (
        <div className="space-y-2">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-xl border border-black/8 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink-900">
                  {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : b.reference}
                </p>
                <p className="text-sm text-ink-500">
                  {b.reference} � {b.customer?.name || b.guest_name || 'Invit�'}
                  {b.partner?.company_name ? ` � ${b.partner.company_name}` : ''}
                </p>
                <p className="text-xs text-ink-500">
                  {new Date(b.pickup_at).toLocaleString('fr-FR')} ?{' '}
                  {new Date(b.return_at).toLocaleString('fr-FR')}
                  {b.pickup_location ? ` � ${b.pickup_location.name}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-ink-900">{formatXaf(b.total_amount)}</p>
                <p className="text-xs capitalize text-ink-500">{b.status}</p>
                <p className="text-xs text-ink-400">Com. {formatXaf(b.commission_amount)}</p>
              </div>
            </div>
          </div>
        ))}
        {bookings.length === 0 && (
          <div className="rounded-xl border border-dashed border-black/12 bg-white p-8 text-center text-ink-500">
            Aucune r�servation pour le moment.
          </div>
        )}
      </div>
      )}
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
        subtitle="GMV et commissions pr�lev�es (0 % au lancement, configurable ensuite)."
      />
      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['GMV (volume affaires)', formatXaf(stats.gmv)],
            ['Commissions plateforme', formatXaf(stats.commissions)],
            ['R�servations pay�es / confirm�es', stats.bookings_count],
            ['Partenaires valid�s', stats.partners_approved],
            ['V�hicules publi�s', stats.vehicles_published],
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
