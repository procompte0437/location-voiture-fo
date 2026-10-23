import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogoDoto } from '../layout/LogoDoto'

/** Entrées du menu latéral de l’espace réservateur. La nouvelle demande s’ouvre en modal depuis la liste. */
const LIENS = [
  { to: '/mes-reservations', libelle: 'Mes réservations' },
  { to: '/mes-reservations/espace', libelle: 'Mon Profil' },
] as const

/** Icônes du menu, en currentColor pour suivre l’état actif. */
const ICONES: Record<(typeof LIENS)[number]['to'], ReactNode> = {
  '/mes-reservations': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  ),
  '/mes-reservations/espace': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19.2c1.4-3 3.8-4.5 7-4.5s5.6 1.5 7 4.5" strokeLinecap="round" />
    </svg>
  ),
}

/** Le parcours (recherche, fiche, confirmation) prolonge « Mes réservations ». */
function parcoursReservation(chemin: string) {
  return (
    chemin === '/recherche' ||
    chemin === '/vehicules' ||
    chemin.startsWith('/vehicules/') ||
    chemin.startsWith('/confirmation/')
  )
}

function lienActif(vers: string, chemin: string) {
  if (vers === '/mes-reservations') {
    return chemin === '/mes-reservations' || parcoursReservation(chemin)
  }
  return chemin === vers || chemin.startsWith(`${vers}/`)
}

function initiales(nom?: string) {
  if (!nom) return 'CL'
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((partie) => partie[0]?.toUpperCase() || '')
    .join('')
}

/**
 * Coque de l’espace client : menu latéral fixe et zone de contenu.
 * Le menu remplace les onglets du haut, pour garder la navigation visible
 * pendant que les pages (réservations, profil) défilent.
 */
export function CoqueEspaceClient({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const emplacement = useLocation()
  const [menuOuvert, setMenuOuvert] = useState(false)

  useEffect(() => {
    setMenuOuvert(false)
  }, [emplacement.pathname])

  async function seDeconnecter() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-sand-50 text-ink-900">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-black/8 bg-sand-50/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOuvert(true)}
          className="rounded-lg bg-marque-sombre px-3 py-2 text-sm font-semibold text-white"
        >
          Menu
        </button>
        <Link to="/mes-reservations" className="font-display text-lg font-bold text-ink-900">
          Espace client
        </Link>
        <span className="w-14" aria-hidden />
      </div>

      {menuOuvert && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
          onClick={() => setMenuOuvert(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col overflow-hidden text-white transition-transform duration-300 lg:translate-x-0 ${
          menuOuvert ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute inset-0 bg-marque-sombre" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(240,160,56,0.16),transparent_52%)]" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold-500/40 to-transparent" />

        <div className="relative flex h-full flex-col px-3 py-5">
          <div className="mb-8 px-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400/90">
              Espace client
            </p>
            <Link
              to="/mes-reservations"
              className="mt-2 inline-flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight"
            >
              <LogoDoto className="h-12 w-12" />
              DOTO
            </Link>
          </div>

          <nav className="flex-1" aria-label="Espace client">
            <ul className="space-y-0.5">
              {LIENS.map((lien) => {
                const actif = lienActif(lien.to, emplacement.pathname)
                return (
                  <li key={lien.to}>
                    <Link
                      to={lien.to}
                      aria-current={actif ? 'page' : undefined}
                      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                        actif
                          ? 'bg-white/10 font-semibold text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-gold-400'
                          : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <span className="opacity-90">{ICONES[lien.to]}</span>
                      <span>{lien.libelle}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 px-2">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-500/20 text-xs font-bold text-gold-400">
                {initiales(user?.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name || 'Client'}</p>
                <p className="truncate text-[11px] text-white/45">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 px-1">
              <Link
                to="/"
                className="rounded-lg border border-white/15 px-2 py-2 text-center text-xs font-medium text-white/85 hover:bg-white/10"
              >
                Accueil
              </Link>
              <button
                type="button"
                onClick={() => void seDeconnecter()}
                className="rounded-lg border border-white/15 px-2 py-2 text-xs font-medium text-white/85 hover:bg-white/10"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[270px]">
        <main className="min-h-screen px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  )
}
