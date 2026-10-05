import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-6">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight text-white drop-shadow-sm md:text-3xl">
          Loca<span className="text-gold-400">Gabon</span>
        </Link>

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

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <Link to="/admin" className="rounded-full bg-white/15 px-3 py-1.5 text-white backdrop-blur hover:bg-white/25">
                  Admin
                </Link>
              )}
              {(user.role === 'partner' || user.owned_partner) && (
                <Link to="/partenaire" className="rounded-full bg-white/15 px-3 py-1.5 text-white backdrop-blur hover:bg-white/25">
                  Espace partenaire
                </Link>
              )}
              <Link to="/mes-reservations" className="hidden text-white/90 sm:inline hover:text-gold-400">
                Mes réservations
              </Link>
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

export function PublicHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b border-sand-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link to="/" className="font-display text-2xl font-bold text-forest-900">
          Loca<span className="text-gold-600">Gabon</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-ink-700">
          <Link to="/vehicules" className="hover:text-forest-700">Véhicules</Link>
          {user ? (
            <>
              <Link to="/mes-reservations" className="hover:text-forest-700">Mes réservations</Link>
              <button type="button" onClick={() => void logout()} className="text-forest-700">
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/connexion" className="rounded-full bg-forest-800 px-4 py-2 text-white hover:bg-forest-700">
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
