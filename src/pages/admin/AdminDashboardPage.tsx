import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useOutletContext } from 'react-router-dom'
import { AdminShell } from '../../components/admin/AdminShell'
import { PublicHeader } from '../../components/layout/Header'
import { ContentLoader } from '../../components/ui/Spinner'
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

type AuditLog = {
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
}

type AdminContext = {
  stats: Record<string, number> | null
  partners: PartnerRow[]
  logs: AuditLog[]
  message: string
  approve: (id: number) => Promise<void>
  reject: (id: number) => Promise<void>
  reload: () => Promise<void>
}

export function useAdminData() {
  return useOutletContext<AdminContext>()
}

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-xl text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function AdminLayout() {
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [message, setMessage] = useState('')

  async function reload() {
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
      void reload().catch(() => undefined)
    }
  }, [user])

  async function approve(id: number) {
    await api.post(`/admin/partners/${id}/approve`)
    setMessage(`Partenaire #${id} validé`)
    await reload()
  }

  async function reject(id: number) {
    const reason = window.prompt('Motif du refus ?') || 'Dossier incomplet'
    await api.post(`/admin/partners/${id}/reject`, { reason })
    setMessage(`Partenaire #${id} refusé`)
    await reload()
  }

  if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
    return (
      <div className="min-h-screen bg-[#f4f5f4]">
        <PublicHeader />
        <p className="p-8">
          Accès réservé.{' '}
          <Link to="/connexion" className="underline">
            Connexion admin
          </Link>
        </p>
      </div>
    )
  }

  return (
    <AdminShell>
      {loading ? (
        <ContentLoader />
      ) : (
        <Outlet
          context={
            {
              stats,
              partners,
              logs,
              message,
              approve,
              reject,
              reload,
            } satisfies AdminContext
          }
        />
      )}
    </AdminShell>
  )
}

export function AdminDashboardPage() {
  const { stats, partners, message } = useAdminData()

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue temps réel de la marketplace LocaGabon."
        action={
          <Link
            to="/admin/validation"
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 transition hover:bg-[#f4f5f4]"
          >
            File de validation
            {stats?.partners_pending ? (
              <span className="ml-2 rounded-md bg-[#0b3d2e] px-1.5 py-0.5 text-xs font-bold text-white">
                {stats.partners_pending}
              </span>
            ) : null}
          </Link>
        }
      />

      {message && (
        <div className="mb-6 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-700">
          {message}
        </div>
      )}

      {!stats ? (
        <div className="rounded-xl border border-black/8 bg-white">
          <ContentLoader />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Partenaires en attente', value: stats.partners_pending },
            { label: 'Partenaires validés', value: stats.partners_approved },
            { label: 'Véhicules publiés', value: stats.vehicles_published },
            { label: 'GMV', value: formatXaf(stats.gmv) },
            { label: 'Commissions', value: formatXaf(stats.commissions) },
            { label: 'Réservations', value: stats.bookings_count },
            { label: 'Utilisateurs', value: stats.users_count },
            { label: 'Véhicules à valider', value: stats.vehicles_pending },
          ].map((card) => (
            <article key={card.label} className="rounded-xl border border-black/8 bg-white p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-400">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-bold text-ink-900">{card.value}</p>
            </article>
          ))}
        </div>
      )}

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-black/8 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-900">À traiter</h2>
            <Link to="/admin/validation" className="text-sm font-medium text-[#0b3d2e] hover:underline">
              Tout voir
            </Link>
          </div>
          {!stats ? (
            <ContentLoader />
          ) : (
          <div className="space-y-2">
            {partners.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-black/6 bg-[#f8f9f8] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink-900">{p.company_name || p.manager_name}</p>
                  <p className="text-xs text-ink-500">
                    {p.city} · {p.owner?.email}
                  </p>
                </div>
                <span className="rounded-full bg-[#0b3d2e]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0b3d2e]">
                  En attente
                </span>
              </div>
            ))}
            {partners.length === 0 && (
              <p className="text-sm text-ink-500">Aucune demande en attente.</p>
            )}
          </div>
          )}
        </div>

        <div className="rounded-xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink-900">Pulse marketplace</h2>
          <p className="mt-1.5 text-sm text-ink-500">
            Commission démarrage à 0 % — activez le prélèvement quand vous êtes prêts.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs text-ink-500">
                <span>Partenaires validés</span>
                <span>{stats?.partners_approved ?? 0}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-[#0b3d2e] transition-all duration-700"
                  style={{
                    width: `${Math.min(100, ((stats?.partners_approved ?? 0) / Math.max(1, (stats?.partners_approved ?? 0) + (stats?.partners_pending ?? 0))) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-ink-500">
                <span>Flotte publiée</span>
                <span>{stats?.vehicles_published ?? 0}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-[#0b3d2e]/70 transition-all duration-700"
                  style={{ width: `${Math.min(100, (stats?.vehicles_published ?? 0) * 12)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes adminIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export function AdminValidationPage() {
  const { stats, partners, message, approve, reject } = useAdminData()

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader
        title="File de validation"
        subtitle="Étudiez les dossiers partenaires avant toute publication d’offre."
      />
      {message && (
        <div className="mb-6 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-700">
          {message}
        </div>
      )}
      {!stats ? (
        <div className="rounded-xl border border-black/8 bg-white">
          <ContentLoader />
        </div>
      ) : partners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/12 bg-white p-10 text-center text-ink-500">
            Aucune demande en attente.
          </div>
      ) : (
      <div className="space-y-3">
        {partners.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-black/8 bg-white p-5"
          >
            <div>
              <p className="text-xl font-semibold text-ink-900">{p.company_name || p.manager_name}</p>
              <p className="mt-1 text-sm text-ink-500">
                {p.type} · {p.city} · {p.owner?.email}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void approve(p.id)}
                className="rounded-xl bg-[#0b3d2e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3427]"
              >
                Valider
              </button>
              <button
                type="button"
                onClick={() => void reject(p.id)}
                className="rounded-xl border border-black/12 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-[#f4f5f4]"
              >
                Refuser
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}

export function AdminAuditPage() {
  const { stats, logs } = useAdminData()

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader
        title="Journal d’audit"
        subtitle="Qui · quoi · quand · IP · navigateur / OS · URL — journal immuable"
      />
      {!stats ? (
        <div className="rounded-xl border border-black/8 bg-white">
          <ContentLoader />
        </div>
      ) : (
      <ul className="space-y-2">
        {logs.map((log) => (
          <li key={log.id} className="rounded-xl border border-black/8 bg-white px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="rounded-md bg-[#0b3d2e] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {log.action}
              </span>
              <span className="text-xs text-ink-500">
                {new Date(log.created_at).toLocaleString('fr-FR')}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-ink-900">
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
              <p className="mt-2 truncate text-xs text-ink-500" title={log.url}>
                {log.url}
              </p>
            )}
          </li>
        ))}
        {logs.length === 0 && (
          <li className="rounded-xl border border-dashed border-black/12 bg-white p-10 text-center text-ink-500">
            Aucun événement pour le moment.
          </li>
        )}
      </ul>
      )}
    </div>
  )
}

export function AdminPlaceholderPage({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-xl border border-black/8 bg-white p-10 text-center">
        <p className="text-2xl font-bold text-ink-900">Section en préparation</p>
        <p className="mt-2 text-sm text-ink-500">
          Les écrans détaillés arriveront avec la suite du MVP.
        </p>
        <Link to="/admin" className="mt-6 inline-block text-sm font-semibold text-[#0b3d2e] underline">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}

export function AdminRedirect() {
  return <Navigate to="/admin" replace />
}
