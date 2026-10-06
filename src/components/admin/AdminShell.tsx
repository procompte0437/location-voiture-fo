import { NavLink, Link, useLocation } from 'react-router-dom'
import { useState, type ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'

type NavItem = {
  to: string
  label: string
  end?: boolean
}

const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: 'Pilotage',
    items: [
      { to: '/admin', label: 'Tableau de bord', end: true },
      { to: '/admin/validation', label: 'Validation' },
      { to: '/admin/audit', label: 'Journal d’audit' },
    ],
  },
  {
    title: 'Catalogue public',
    items: [
      { to: '/admin/lieux', label: 'Lieux' },
      { to: '/admin/vehicules', label: 'Véhicules' },
    ],
  },
  {
    title: 'Opérations',
    items: [
      { to: '/admin/comptes', label: 'Comptes' },
      { to: '/admin/reservations', label: 'Réservations' },
      { to: '/admin/finances', label: 'Finances' },
    ],
  },
]

const ICONS: Record<string, ReactNode> = {
  '/admin': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Z" />
    </svg>
  ),
  '/admin/validation': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" />
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
}

const PAGE_HINTS: Record<string, string> = {
  '/admin': 'Vue d’ensemble marketplace',
  '/admin/validation': 'Dossiers partenaires à traiter',
  '/admin/audit': 'Piste d’audit immuable',
  '/admin/lieux': 'Destinations du catalogue public',
  '/admin/vehicules': 'CRUD catalogue — filtres, détail, publication',
  '/admin/vehicules/nouveau': 'Création d’une nouvelle offre véhicule',
  '/admin/comptes': 'Comptes clients, partenaires et admins',
  '/admin/reservations': 'Flux de réservations',
  '/admin/finances': 'GMV et commissions',
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
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const hint =
    PAGE_HINTS[location.pathname] ||
    (location.pathname.startsWith('/admin/vehicules/')
      ? 'Fiche véhicule — détail et édition'
      : 'Console super admin')

  return (
    <div className="admin-shell min-h-screen bg-[#f4f5f4] text-ink-900">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-black/8 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-[#0b3d2e] px-3 py-2 text-sm font-semibold text-white"
        >
          Menu
        </button>
        <Link to="/admin" className="text-lg font-semibold text-[#0b3d2e]">
          LocaGabon
        </Link>
        <span className="text-xs text-ink-500">Admin</span>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#0b3d2e] text-white transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col px-3 py-5">
          <div className="mb-7 flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold">
              LG
            </div>
            <div className="min-w-0">
              <Link to="/admin" className="block truncate text-base font-semibold" onClick={() => setOpen(false)}>
                LocaGabon
              </Link>
              <p className="text-[11px] text-white/50">Console super admin</p>
            </div>
            <button
              type="button"
              className="ml-auto rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto pb-4">
            {NAV.map((group) => (
              <div key={group.title}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                            isActive
                              ? 'bg-white/12 font-semibold text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-white'
                              : 'text-white/75 hover:bg-white/[0.06] hover:text-white'
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

          <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 px-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xs font-bold">
                {initials(user?.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-[11px] text-white/45">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 px-1">
              <Link
                to="/"
                className="rounded-lg border border-white/15 px-2 py-2 text-center text-xs font-medium text-white/85 transition hover:bg-white/10"
              >
                Site public
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg border border-white/15 px-2 py-2 text-xs font-medium text-white/85 transition hover:bg-white/10"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 hidden border-b border-black/8 bg-white lg:block">
          <div className="flex items-center justify-between gap-4 px-8 py-3">
            <p className="text-sm text-ink-500">{hint}</p>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-ink-900">{user?.name}</p>
                <p className="text-[11px] text-ink-500">{user?.email}</p>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#0b3d2e] text-xs font-bold text-white">
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
