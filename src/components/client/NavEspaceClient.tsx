import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const LIENS = [
  { to: '/mes-reservations', libelle: 'Mes réservations', end: true },
  { to: '/mes-reservations/nouvelle', libelle: 'Nouvelle réservation' },
]

/**
 * Navigation interne de l’espace réservateur (hors navbar site).
 */
export function NavEspaceClient() {
  const { user } = useAuth()
  if (!user || user.role !== 'customer') return null

  return (
    <nav className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-black/8 bg-white p-2">
      {LIENS.map((lien) => (
        <NavLink
          key={lien.to}
          to={lien.to}
          end={lien.end}
          className={({ isActive }) =>
            `rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-forest-900 text-white'
                : 'text-ink-600 hover:bg-black/[0.03] hover:text-ink-900'
            }`
          }
        >
          {lien.libelle}
        </NavLink>
      ))}
    </nav>
  )
}
