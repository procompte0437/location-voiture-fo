import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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

/**
 * En-tête type comparateur : barre verte + sous-barre noire (agences).
 */
function BarreNavigation() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const espacePro = user && !estReservateur(user) ? lienEspacePro(user) : null
  const lienCompte = user
    ? estReservateur(user)
      ? '/mes-reservations'
      : espacePro?.to || '/connexion'
    : '/connexion'

  useEffect(() => {
    setMenuOuvert(false)
  }, [pathname])

  return (
    <header id="haut" className="sticky top-0 z-50">
      <div className="bg-forest-700 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link to="/" className="text-2xl font-extrabold tracking-tight md:text-[1.7rem]">
            LV241
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to={lienCompte}
              className="inline-flex items-center gap-2 rounded-md border border-white/70 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5 19.2c1.4-3 3.8-4.5 7-4.5s5.6 1.5 7 4.5" strokeLinecap="round" />
              </svg>
              Mon compte
            </Link>
            <button
              type="button"
              className="rounded-md border border-white/70 px-3 py-1.5 text-sm font-semibold md:hidden"
              aria-expanded={menuOuvert}
              onClick={() => setMenuOuvert((o) => !o)}
            >
              {menuOuvert ? 'Fermer' : 'Menu'}
            </button>
          </div>
        </div>

        {menuOuvert && (
          <div className="border-t border-white/20 px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-2 text-sm font-semibold">
              <Link to="/vehicules" onClick={() => setMenuOuvert(false)}>
                Véhicules
              </Link>
              <Link to="/#agences" onClick={() => setMenuOuvert(false)}>
                Agences
              </Link>
              <Link to="/faq" onClick={() => setMenuOuvert(false)}>
                Aide
              </Link>
              <Link to="/reservation/trouver" onClick={() => setMenuOuvert(false)}>
                Voir la réservation
              </Link>
              {espacePro && (
                <Link to={espacePro.to} onClick={() => setMenuOuvert(false)}>
                  {espacePro.label}
                </Link>
              )}
              {user && (
                <button type="button" onClick={() => void logout()} className="text-left">
                  Déconnexion
                </button>
              )}
            </nav>
          </div>
        )}
      </div>

      <div className="bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-2 md:px-6">
          <Link
            to="/#agences"
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-gold-400"
          >
            Agences de location de voitures
            <span aria-hidden className="text-[10px]">
              ▾
            </span>
          </Link>
          <nav className="ml-auto hidden items-center gap-5 text-sm md:flex">
            <Link to="/vehicules" className="hover:text-gold-400">
              Véhicules
            </Link>
            <Link to="/devenir-partenaire" className="hover:text-gold-400">
              Professionnels
            </Link>
            <Link to="/faq" className="hover:text-gold-400">
              Aide
            </Link>
            {user && (
              <button type="button" onClick={() => void logout()} className="hover:text-gold-400">
                Déconnexion
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export function Header() {
  return <BarreNavigation />
}

export function PublicHeader() {
  return <BarreNavigation />
}
