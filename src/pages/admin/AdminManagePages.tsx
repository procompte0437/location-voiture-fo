import { useEffect, useState, type FormEvent } from 'react'
import { ContentLoader } from '../../components/ui/Spinner'
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
  const [users, setUsers] = useState<
    {
      id: number
      name: string
      email: string
      phone?: string
      role: string
      status: string
      created_at: string
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
    void load().catch(() => undefined)
  }, [role])

  async function setStatus(id: number, status: string) {
    await api.patch(`/admin/users/${id}/status`, { status })
    setMsg(`Compte #${id} → ${status}`)
    await load()
  }

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader
        title="Comptes"
        subtitle="L’admin gère les comptes affichés et actifs sur la plateforme (clients, partenaires, admins)."
      />
      {msg && <p className="mb-4 text-sm text-ink-600">{msg}</p>}
      <PillTabs
        value={role}
        onChange={setRole}
        options={[
          ['', 'Tous'],
          ['customer', 'Clients'],
          ['partner', 'Partenaires'],
          ['admin', 'Admins'],
          ['super_admin', 'Super admin'],
        ]}
      />
      <div className="overflow-hidden rounded-xl border border-black/8 bg-white">
        {loading ? (
          <ContentLoader />
        ) : (
          <>
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f4f5f4] text-[11px] uppercase tracking-[0.12em] text-ink-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-black/6">
                <td className="px-4 py-3 font-medium text-ink-900">{u.name}</td>
                <td className="px-4 py-3 text-ink-500">{u.email}</td>
                <td className="px-4 py-3 capitalize text-ink-700">{u.role}</td>
                <td className="px-4 py-3 capitalize text-ink-700">{u.status}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.status !== 'active' && (
                      <button
                        type="button"
                        className="rounded-lg bg-[#0b3d2e] px-2 py-1 text-xs text-white"
                        onClick={() => void setStatus(u.id, 'active')}
                      >
                        Activer
                      </button>
                    )}
                    {u.status === 'active' && (
                      <button
                        type="button"
                        className="rounded-lg border border-black/12 px-2 py-1 text-xs text-ink-700"
                        onClick={() => void setStatus(u.id, 'suspended')}
                      >
                        Suspendre
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-6 text-ink-500">Aucun compte.</p>}
          </>
        )}
      </div>
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
        title="Réservations"
        subtitle="Toutes les réservations de la marketplace — suivi admin."
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
                  {b.reference} · {b.customer?.name || b.guest_name || 'Invité'}
                  {b.partner?.company_name ? ` · ${b.partner.company_name}` : ''}
                </p>
                <p className="text-xs text-ink-500">
                  {new Date(b.pickup_at).toLocaleString('fr-FR')} →{' '}
                  {new Date(b.return_at).toLocaleString('fr-FR')}
                  {b.pickup_location ? ` · ${b.pickup_location.name}` : ''}
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
            Aucune réservation pour le moment.
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

export function AdminLocationsPage() {
  const [locations, setLocations] = useState<
    {
      id: number
      name: string
      slug: string
      type: string
      city?: string
      is_popular: boolean
      is_active: boolean
    }[]
  >([])
  const [form, setForm] = useState({
    name: '',
    type: 'city',
    city: '',
    is_popular: true,
    is_active: true,
  })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(showSpinner = false) {
    if (showSpinner) setLoading(true)
    try {
      const { data } = await api.get('/admin/locations')
      setLocations(data.data || [])
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  useEffect(() => {
    void load(true).catch(() => undefined)
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    await api.post('/admin/locations', form)
    setMsg('Lieu ajouté — visible sur la recherche / accueil si actif & populaire.')
    setForm({ name: '', type: 'city', city: '', is_popular: true, is_active: true })
    await load()
  }

  async function toggle(id: number, patch: Record<string, boolean>) {
    await api.patch(`/admin/locations/${id}`, patch)
    await load()
  }

  async function remove(id: number) {
    if (!window.confirm('Supprimer ce lieu ?')) return
    await api.delete(`/admin/locations/${id}`)
    setMsg('Lieu supprimé')
    await load()
  }

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader
        title="Lieux & destinations"
        subtitle="Renseignés uniquement par l’admin : villes, aéroports et quartiers affichés sur le site public."
      />
      {msg && <p className="mb-4 text-sm text-ink-600">{msg}</p>}

      <form
        onSubmit={onCreate}
        className="mb-6 grid gap-3 rounded-xl border border-black/8 bg-white p-5 md:grid-cols-2 lg:grid-cols-5"
      >
        <input
          required
          placeholder="Nom (ex. Port-Gentil)"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="rounded-xl border border-black/10 px-3 py-2.5 lg:col-span-2"
        />
        <select
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          className="rounded-xl border border-black/10 px-3 py-2.5"
        >
          <option value="city">Ville</option>
          <option value="airport">Aéroport</option>
          <option value="district">Quartier</option>
          <option value="agency_point">Point agence</option>
        </select>
        <input
          placeholder="Ville liée"
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="rounded-xl border border-black/10 px-3 py-2.5"
        />
        <button
          type="submit"
          className="rounded-xl bg-[#0b3d2e] px-4 py-2.5 font-semibold text-white hover:bg-[#0a3427]"
        >
          Ajouter
        </button>
      </form>

      {loading ? (
        <div className="rounded-xl border border-black/8 bg-white">
          <ContentLoader />
        </div>
      ) : (
      <div className="space-y-2">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/8 bg-white px-4 py-3"
          >
            <div>
              <p className="font-semibold text-ink-900">{loc.name}</p>
              <p className="text-xs text-ink-500">
                {loc.type}
                {loc.city ? ` · ${loc.city}` : ''} · {loc.slug}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void toggle(loc.id, { is_popular: !loc.is_popular })}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  loc.is_popular
                    ? 'bg-[#0b3d2e]/10 text-[#0b3d2e]'
                    : 'bg-[#f0f1f0] text-ink-500'
                }`}
              >
                {loc.is_popular ? 'Populaire' : 'Standard'}
              </button>
              <button
                type="button"
                onClick={() => void toggle(loc.id, { is_active: !loc.is_active })}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  loc.is_active ? 'bg-[#0b3d2e] text-white' : 'bg-[#f0f1f0] text-ink-500'
                }`}
              >
                {loc.is_active ? 'Actif' : 'Inactif'}
              </button>
              <button
                type="button"
                onClick={() => void remove(loc.id)}
                className="rounded-full border border-black/12 px-2.5 py-1 text-xs text-ink-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
