import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogoDoto } from './LogoDoto'

function estReservateur(user: { role: string; owned_partner?: unknown }) {
  return user.role === 'customer'
}

function lienEspacePro(user: { role: string; owned_partner?: unknown }) {
  if (user.role === 'super_admin') {
    return { to: '/admin', label: 'Console super admin' }
  }
  if (user.role === 'admin') {
    return { to: '/admin', label: 'Console admin' }
  }
  if (user.role === 'partner' || user.role === 'partner_agent' || user.owned_partner) {
    return { to: '/partenaire', label: 'Espace partenaire' }
  }
  return null
}

/** Liens publics alignés sur la même ligne que « Mon compte ». */
const LIENS_PUBLICS = [
  { vers: '/vehicules', libelle: 'Véhicules' },
  { vers: '/devenir-partenaire', libelle: 'Professionnels' },
  { vers: '/faq', libelle: 'Aide' },
  { vers: '/#agences', libelle: 'Agences' },
] as const

/**
 * En-tête : logo à gauche, liens publics et compte sur une seule ligne à droite.
 * Connecté : les liens publics sont retirés — navigation via l’espace client.
 */
function BarreNavigation() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const connecte = !!user
  const espacePro = user && !estReservateur(user) ? lienEspacePro(user) : null

  async function seDeconnecter() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <header id="haut" className="sticky top-0 z-50">
      <div className="bg-forest-700 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link to="/" className="inline-flex shrink-0 items-center gap-2.5" aria-label="DOTO — accueil">
            <LogoDoto className="h-14 w-14 md:h-16 md:w-16" />
            <span className="text-2xl font-extrabold tracking-tight md:text-[1.7rem]">DOTO</span>
          </Link>

          <div className="flex min-w-0 items-center justify-end gap-3 sm:gap-5">
            {!connecte && (
              <nav className="flex items-center gap-3 text-sm font-semibold sm:gap-5" aria-label="Navigation principale">
                {LIENS_PUBLICS.map((lien) => (
                  <Link key={lien.vers} to={lien.vers} className="whitespace-nowrap hover:text-gold-400">
                    {lien.libelle}
                  </Link>
                ))}
              </nav>
            )}
            {!connecte && (
              <Link
                to="/connexion"
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md border border-white/70 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="3.2" />
                  <path d="M5 19.2c1.4-3 3.8-4.5 7-4.5s5.6 1.5 7 4.5" strokeLinecap="round" />
                </svg>
                Mon compte
              </Link>
            )}
            {espacePro && (
              <Link
                to={espacePro.to}
                className="inline-flex items-center gap-2 rounded-md border border-white/70 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
              >
                {espacePro.label}
              </Link>
            )}
            {connecte && (
              <button
                type="button"
                onClick={() => void seDeconnecter()}
                className="inline-flex shrink-0 whitespace-nowrap rounded-md border border-white/70 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
              >
                Déconnexion
              </button>
            )}
          </div>
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
