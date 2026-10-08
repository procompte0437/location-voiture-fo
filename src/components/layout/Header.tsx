import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function estReservateur(user: { role: string; owned_partner?: unknown }) {
  return user.role === 'customer'
}

function lienEspacePro(user: { role: string; owned_partner?: unknown }) {
  if (user.role === 'admin' || user.role === 'super_admin') {
    return { to: '/admin', label: 'Console admin' }
  }
  if (user.role === 'partner' || user.role === 'partner_agent' || user.owned_partner) {
    return { to: '/partenaire', label: 'Espace partenaire' }
  }
  return null
}

/** Navbar hero (accueil) — liens publics uniquement si déconnecté. */
export function Header() {
  const { user, logout } = useAuth()
  const espacePro = user && !estReservateur(user) ? lienEspacePro(user) : null

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-6">
        <Link
          to={user && estReservateur(user) ? '/mes-reservations' : espacePro?.to || '/'}
          className="font-display text-2xl font-bold tracking-tight text-white drop-shadow-sm md:text-3xl"
        >
          Loca<span className="text-gold-400">Gabon</span>
        </Link>

        {!user && (
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/90 md:flex">
            <NavLink to="/vehicules" className="transition hover:text-gold-400">
              Nos véhicules
            </NavLink>
            <NavLink to="/devenir-partenaire" className="transition hover:text-gold-400">
              Devenir partenaire
            </NavLink>
            <NavLink to="/reservation/trouver" className="transition hover:text-gold-400">
              Ma réservation
            </NavLink>
          </nav>
        )}

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              {/* Réservateur : uniquement Déconnexion. Admin / partenaire : lien espace. */}
              {espacePro && (
                <Link
                  to={espacePro.to}
                  className="rounded-full bg-white/15 px-3 py-1.5 text-white backdrop-blur hover:bg-white/25"
                >
                  {espacePro.label}
                </Link>
              )}
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full bg-forest-800 px-3 py-1.5 font-medium text-white hover:bg-forest-700"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              to="/connexion"
              className="rounded-full bg-white px-4 py-2 font-semibold text-forest-900 shadow-sm transition hover:bg-sand-100"
            >
              Identifiez-vous
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

/** Navbar pages internes — réservateur connecté : Déconnexion seul. */
export function PublicHeader() {
  const { user, logout } = useAuth()
  const espacePro = user && !estReservateur(user) ? lienEspacePro(user) : null

  return (
    <header className="border-b border-sand-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link
          to={user && estReservateur(user) ? '/mes-reservations' : espacePro?.to || '/'}
          className="font-display text-2xl font-bold text-forest-900"
        >
          Loca<span className="text-gold-600">Gabon</span>
        </Link>

        {user ? (
          <nav className="flex items-center gap-3 text-sm font-medium">
            {espacePro && (
              <Link to={espacePro.to} className="text-ink-700 hover:text-forest-700">
                {espacePro.label}
              </Link>
            )}
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full bg-forest-800 px-4 py-2 text-white hover:bg-forest-700"
            >
              Déconnexion
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-4 text-sm font-medium text-ink-700">
            <Link to="/vehicules" className="hover:text-forest-700">
              Véhicules
            </Link>
            <Link
              to="/connexion"
              className="rounded-full bg-forest-800 px-4 py-2 text-white hover:bg-forest-700"
            >
              Connexion
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
