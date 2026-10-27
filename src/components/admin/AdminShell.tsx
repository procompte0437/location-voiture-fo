import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, type ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import { LogoDoto } from '../layout/LogoDoto'

type NavItem = {
  to: string
  label: string
  end?: boolean
}

const NAV: { title: string; items: NavItem[]; superAdminSeul?: boolean }[] = [
  {
    title: 'Pilotage',
    items: [
      { to: '/admin', label: 'Tableau de bord', end: true },
      { to: '/admin/audit', label: 'Journal d’audit' },
    ],
  },
  {
    title: 'Catalogue public',
    items: [
      { to: '/admin/vehicules', label: 'Véhicules' },
    ],
  },
  {
    title: 'Référentiel',
    items: [
      { to: '/admin/referentiel', label: 'Référentiel' },
      { to: '/admin/agences', label: 'Agences provinces' },
    ],
  },
  {
    title: 'Opérations',
    items: [
      { to: '/admin/comptes', label: 'Comptes' },
      { to: '/admin/validation', label: 'Validation partenaires' },
      { to: '/admin/evaluation', label: 'Évaluation partenaires' },
      { to: '/admin/reservations', label: 'Réservations' },
      { to: '/admin/finances', label: 'Finances' },
    ],
  },
]

/** Entrées réservées au super admin (comptes + agences). */
const ROUTES_SUPER_ADMIN = new Set([
  '/admin/comptes',
  '/admin/agences',
  '/admin/validation',
  '/admin/evaluation',
])

const ICONS: Record<string, ReactNode> = {
  '/admin': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Z" />
    </svg>
  ),
  '/admin/audit': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" />
    </svg>
  ),
  '/admin/lieux': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  '/admin/comptes': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M21 19c0-2.2-1.5-3.8-4-4.2" strokeLinecap="round" />
    </svg>
  ),
  '/admin/validation': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  '/admin/evaluation': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V5M4 19h16" strokeLinecap="round" />
      <path d="M8 15v-3M12 15V8M16 15v-5" strokeLinecap="round" />
    </svg>
  ),
  '/admin/vehicules': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5" strokeLinecap="round" />
      <path d="M3 13h18v4a1 1 0 0 1-1 1h-1" />
      <circle cx="7" cy="17" r="1.5" />
      <circle cx="17" cy="17" r="1.5" />
    </svg>
  ),
  '/admin/reservations': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  ),
  '/admin/finances': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v18M7 8h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8" strokeLinecap="round" />
    </svg>
  ),
  '/admin/referentiel': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  ),
}

const PAGE_HINTS: Record<string, string> = {
  '/admin': 'Vue d’ensemble marketplace',
  '/admin/audit': 'Piste d’audit immuable',
  '/admin/vehicules': 'CRUD catalogue — filtres, détail, publication',
  '/admin/vehicules/nouveau': 'Création d’une nouvelle offre véhicule',
  '/admin/comptes': 'Comptes clients, partenaires et admins',
  '/admin/validation': 'Validation des dossiers partenaires',
  '/admin/evaluation': 'Prestataires à déplier, avec le tableau de toutes leurs voitures',
  '/admin/reservations': 'Flux de réservations',
  '/admin/finances': 'GMV et commissions',
  '/admin/referentiel': 'Lieux, marques, modèles et listes déroulantes',
  '/admin/agences': 'Agences rattachées aux 9 provinces (carte accueil)',
}

function initials(name?: string) {
  if (!name) return 'AD'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [ouvertMobile, setOuvertMobile] = useState(false)
  // Sur grand écran la barre reste visible, et peut être repliée pour élargir le contenu.
  const [sidebarOuverte, setSidebarOuverte] = useState(true)
  const location = useLocation()

  function fermerSidebar() {
    setOuvertMobile(false)
    setSidebarOuverte(false)
  }

  function ouvrirSidebar() {
    setOuvertMobile(true)
    setSidebarOuverte(true)
  }

  async function seDeconnecter() {
    await logout()
    navigate('/', { replace: true })
  }
  const estSuperAdmin = user?.role === 'super_admin'
  const menu = NAV.map((groupe) => ({
    ...groupe,
    items: groupe.items.filter((item) => estSuperAdmin || !ROUTES_SUPER_ADMIN.has(item.to)),
  })).filter((groupe) => groupe.items.length > 0)

  const hint =
    PAGE_HINTS[location.pathname] ||
    (location.pathname.startsWith('/admin/vehicules/')
      ? 'Fiche véhicule — détail et édition'
      : 'Console admin')

  return (
    <div className="admin-shell min-h-screen bg-[#f4f5f4] text-ink-900">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-black/8 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={ouvrirSidebar}
          className="rounded-lg bg-[#8c4205] px-3 py-2 text-sm font-semibold text-white"
        >
          Menu
        </button>
        <Link to="/admin" className="inline-flex items-center gap-2 text-lg font-semibold text-[#8c4205]">
          <LogoDoto className="h-11 w-11" />
          DOTO
        </Link>
        <span className="text-xs text-ink-500">Admin</span>
      </div>

      {ouvertMobile && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOuvertMobile(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-marque-encre/10 bg-marque-voile text-marque-encre transition-transform duration-300 ease-out ${
          ouvertMobile ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarOuverte ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}
      >
        <div className="flex h-full flex-col px-3 py-5">
          <div className="mb-7 flex items-center gap-3 px-2">
            <LogoDoto className="h-12 w-12" />
            <div className="min-w-0">
              <Link to="/admin" className="block truncate text-base font-semibold" onClick={() => setOuvertMobile(false)}>
                DOTO
              </Link>
              <p className="text-[11px] text-ink-500">Console super admin</p>
            </div>
            <button
              type="button"
              aria-label="Fermer le menu"
              title="Fermer le menu"
              className="ml-auto rounded-lg p-2 text-ink-500 hover:bg-white/70"
              onClick={fermerSidebar}
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto pb-4">
            {menu.map((group) => (
              <div key={group.title}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={() => setOuvertMobile(false)}
                        className={({ isActive }) =>
                          `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                            isActive
                              ? 'bg-marque-voile-actif font-semibold text-marque-encre before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-marque-500'
                              : 'text-marque-encre/80 hover:bg-white/70 hover:text-marque-encre'
                          }`
                        }
                      >
                        <span className="opacity-90">{ICONS[item.to]}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-auto space-y-3 border-t border-marque-encre/10 pt-4">
            <div className="flex items-center gap-3 px-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-marque-500/20 text-xs font-bold text-marque-encre">
                {initials(user?.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-[11px] text-ink-500">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 px-1">
              <Link
                to="/"
                className="rounded-lg border border-marque-encre/15 bg-white/50 px-2 py-2 text-center text-xs font-medium text-marque-encre transition hover:bg-white"
              >
                Site public
              </Link>
              <button
                type="button"
                onClick={() => void seDeconnecter()}
                className="rounded-lg border border-marque-encre/15 bg-white/50 px-2 py-2 text-xs font-medium text-marque-encre transition hover:bg-white"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className={`transition-[padding] duration-300 ${sidebarOuverte ? 'lg:pl-[260px]' : 'lg:pl-0'}`}>
        <header className="sticky top-0 z-30 hidden border-b border-black/8 bg-white lg:block">
          <div className="flex items-center justify-between gap-4 px-8 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOuverte((ouverte) => !ouverte)}
                aria-label={sidebarOuverte ? 'Fermer le menu' : 'Ouvrir le menu'}
                title={sidebarOuverte ? 'Fermer le menu' : 'Ouvrir le menu'}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-black/10 text-ink-700 transition hover:bg-black/[0.04]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M9 4v16" />
                </svg>
              </button>
              <p className="truncate text-sm text-ink-500">{hint}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-ink-900">{user?.name}</p>
                <p className="text-[11px] text-ink-500">{user?.email}</p>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#8c4205] text-xs font-bold text-white">
                {initials(user?.name)}
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-screen px-4 py-6 md:px-8 md:py-7">{children}</main>
      </div>
    </div>
  )
}
