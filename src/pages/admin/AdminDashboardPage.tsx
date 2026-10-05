import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicHeader } from '../../components/layout/Header'
import { useAuth } from '../../context/AuthContext'
import api, { formatXaf } from '../../lib/api'

interface PartnerRow {
  id: number
  company_name?: string
  manager_name?: string
  city?: string
  status: string
  type: string
  owner?: { email: string; name: string }
}

export function AdminDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [logs, setLogs] = useState<{
    id: number
    action: string
    created_at: string
    actor_name?: string | null
    actor_email?: string | null
    actor_role?: string | null
    ip_address?: string | null
    browser?: string | null
    browser_version?: string | null
    platform?: string | null
    device_type?: string | null
    url?: string | null
    http_method?: string | null
    actor?: { name: string }
  }[]>([])
  const [message, setMessage] = useState('')

  async function load() {
    const [d, p, a] = await Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/partners', { params: { status: 'pending' } }),
      api.get('/admin/audit-logs'),
    ])
    setStats(d.data.data)
    setPartners(p.data.data || [])
    setLogs(a.data.data || [])
  }

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      void load().catch(() => undefined)
    }
  }, [user])

  async function approve(id: number) {
    await api.post(`/admin/partners/${id}/approve`)
    setMessage(`Partenaire #${id} validé`)
    await load()
  }

  async function reject(id: number) {
    const reason = window.prompt('Motif du refus ?') || 'Dossier incomplet'
    await api.post(`/admin/partners/${id}/reject`, { reason })
    setMessage(`Partenaire #${id} refusé`)
    await load()
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-sand-50">
        <PublicHeader />
        <p className="p-8">
          Accès réservé. <Link to="/connexion" className="underline">Connexion admin</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h1 className="font-display text-3xl font-bold text-forest-950">Back-office Super Admin</h1>
        {message && <p className="mt-3 text-sm text-forest-700">{message}</p>}

        {stats && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Partenaires en attente', stats.partners_pending],
              ['Partenaires validés', stats.partners_approved],
              ['Véhicules publiés', stats.vehicles_published],
              ['GMV', formatXaf(stats.gmv)],
              ['Commissions', formatXaf(stats.commissions)],
              ['Réservations', stats.bookings_count],
              ['Utilisateurs', stats.users_count],
              ['Véhicules à valider', stats.vehicles_pending],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-sand-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-ink-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        )}

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">File de validation partenaires</h2>
          <div className="mt-4 space-y-3">
            {partners.length === 0 && (
              <p className="text-ink-500">Aucune demande en attente.</p>
            )}
            {partners.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sand-200 bg-white p-4">
                <div>
                  <p className="font-semibold">{p.company_name || p.manager_name}</p>
                  <p className="text-sm text-ink-500">
                    {p.type} · {p.city} · {p.owner?.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void approve(p.id)}
                    className="rounded-lg bg-forest-800 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Valider
                  </button>
                  <button
                    type="button"
                    onClick={() => void reject(p.id)}
                    className="rounded-lg border border-sand-200 px-3 py-2 text-sm"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Journal d’audit</h2>
          <p className="mt-1 text-sm text-ink-500">
            Qui · quoi · quand · IP · navigateur / OS · URL — journal immuable
          </p>
          <ul className="mt-4 max-h-96 space-y-2 overflow-auto text-sm">
            {logs.map((log) => (
              <li key={log.id} className="rounded-lg border border-sand-200 bg-white px-3 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-forest-900">{log.action}</span>
                  <span className="text-xs text-ink-500">
                    {new Date(log.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                <p className="mt-1 text-ink-700">
                  {log.actor_name || log.actor?.name || 'Anonyme'}
                  {log.actor_email ? ` · ${log.actor_email}` : ''}
                  {log.actor_role ? ` · ${log.actor_role}` : ''}
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  {[
                    log.ip_address && `IP ${log.ip_address}`,
                    [log.browser, log.browser_version].filter(Boolean).join(' '),
                    log.platform,
                    log.device_type,
                    log.http_method,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {log.url && (
                  <p className="mt-1 truncate text-xs text-ink-500" title={log.url}>
                    {log.url}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
