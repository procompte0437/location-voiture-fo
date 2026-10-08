import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useOutletContext } from 'react-router-dom'
import { AdminShell } from '../../components/admin/AdminShell'
import { ContentLoader } from '../../components/ui/Spinner'
import { TableauDonnees } from '../../components/ui/TableauDonnees'
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
    const estSuperAdmin = user?.role === 'super_admin'
    const requetes = [
      api.get('/admin/dashboard'),
      api.get('/admin/audit-logs'),
      ...(estSuperAdmin
        ? [api.get('/admin/partners', { params: { per_page: 100 } })]
        : []),
    ]
    const resultats = await Promise.all(requetes)
    setStats(resultats[0].data.data)
    setLogs(resultats[1].data.data || [])
    if (estSuperAdmin && resultats[2]) {
      setPartners(resultats[2].data.data || [])
    } else {
      setPartners([])
    }
  }

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      void reload().catch(() => undefined)
    }
  }, [user])

  async function approve(id: number) {
    if (user?.role !== 'super_admin') return
    await api.post(`/admin/partners/${id}/approve`)
    setMessage(`Partenaire #${id} validé`)
    await reload()
  }

  async function reject(id: number) {
    if (user?.role !== 'super_admin') return
    const reason = window.prompt('Motif du refus ?') || 'Dossier incomplet'
    await api.post(`/admin/partners/${id}/reject`, { reason })
    setMessage(`Partenaire #${id} refusé`)
    await reload()
  }

  if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
    return <Navigate to="/" replace />
  }

  // Les partenaires n’ont jamais accès à la console admin.
  if (!loading && user && (user.role === 'partner' || user.role === 'partner_agent')) {
    return <Navigate to="/partenaire" replace />
  }

  // Coque admin toujours visible ; le spinner reste dans les pages / zones de données.
  return (
    <AdminShell>
      {loading ? (
        <div className="rounded-xl border border-black/8 bg-white">
          <ContentLoader label="Chargement du compte…" />
        </div>
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
  const { user } = useAuth()
  const { stats, partners, message } = useAdminData()
  const partenairesEnAttente = partners.filter((p) => p.status === 'pending')
  const estSuperAdmin = user?.role === 'super_admin'

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue temps réel de la marketplace LocaGabon."
        action={
          estSuperAdmin ? (
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
          ) : undefined
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
            {partenairesEnAttente.slice(0, 3).map((p) => (
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
            {partenairesEnAttente.length === 0 && (
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
  const { user } = useAuth()
  const { stats, partners, message, approve, reject, reload } = useAdminData()
  const [filtreStatut, setFiltreStatut] = useState('pending')

  if (user?.role !== 'super_admin') {
    return <Navigate to="/admin" replace />
  }

  const libelleStatut = (s: string) => {
    const map: Record<string, string> = {
      pending: 'En attente',
      approved: 'Validé',
      rejected: 'Refusé',
      suspended: 'Suspendu',
      info_requested: 'Infos demandées',
    }
    return map[s] || s
  }

  const partenairesFiltres =
    filtreStatut === 'all'
      ? partners
      : partners.filter((p) => p.status === filtreStatut)

  // Aperçu dashboard : uniquement les en attente.
  const enAttente = partners.filter((p) => p.status === 'pending')

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader
        title="File de validation"
        subtitle="Consultez les dossiers partenaires validés et non validés."
      />
      {message && (
        <div className="mb-6 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-700">
          {message}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['pending', `En attente (${enAttente.length})`],
            ['approved', `Validés (${partners.filter((p) => p.status === 'approved').length})`],
            ['rejected', `Refusés (${partners.filter((p) => p.status === 'rejected').length})`],
            ['all', `Tous (${partners.length})`],
          ] as const
        ).map(([cle, libelle]) => (
          <button
            key={cle}
            type="button"
            onClick={() => setFiltreStatut(cle)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filtreStatut === cle
                ? 'bg-[#0b3d2e] text-white'
                : 'border border-black/10 bg-white text-ink-700 hover:bg-[#f4f5f4]'
            }`}
          >
            {libelle}
          </button>
        ))}
      </div>

      {!stats ? (
        <div className="rounded-xl border border-black/8 bg-white">
          <ContentLoader />
        </div>
      ) : (
        <TableauDonnees
          colonnes={[
            {
              cle: 'company',
              libelle: 'Partenaire',
              rendu: (p) => (
                <div>
                  <p className="font-semibold text-ink-900">{p.company_name || p.manager_name}</p>
                  <p className="text-xs text-ink-500">#{p.id}</p>
                </div>
              ),
            },
            {
              cle: 'type',
              libelle: 'Type / Ville',
              rendu: (p) => (
                <span>
                  {p.type} · {p.city || '—'}
                </span>
              ),
            },
            {
              cle: 'owner',
              libelle: 'Compte',
              rendu: (p) => (
                <div>
                  <p>{p.owner?.name || '—'}</p>
                  <p className="text-xs text-ink-500">{p.owner?.email}</p>
                </div>
              ),
            },
            {
              cle: 'status',
              libelle: 'Statut',
              rendu: (p) => (
                <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-0.5 text-[11px] font-medium">
                  {libelleStatut(p.status)}
                </span>
              ),
            },
          ]}
          donnees={partenairesFiltres}
          cleLigne={(p) => p.id}
          champsRecherche={(p) =>
            `${p.company_name} ${p.manager_name} ${p.city} ${p.type} ${p.owner?.email} ${p.owner?.name} ${p.status}`
          }
          surActualiser={reload}
          messageVide="Aucun partenaire pour ce filtre."
          actions={(p) =>
            p.status === 'pending' || p.status === 'info_requested' ? (
              <>
                <button
                  type="button"
                  onClick={() => void approve(p.id)}
                  className="rounded-lg bg-[#0b3d2e] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Valider
                </button>
                <button
                  type="button"
                  onClick={() => void reject(p.id)}
                  className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-ink-700"
                >
                  Refuser
                </button>
              </>
            ) : (
              <span className="text-xs text-ink-400">—</span>
            )
          }
        />
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
