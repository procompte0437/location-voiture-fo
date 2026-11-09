import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/** Initiales affichées tant que le compte n’a pas de photo. */
export function initialesCompte(nom?: string) {
  if (!nom) return 'AD'
  return nom
    .split(/\s+/)
    .slice(0, 2)
    .map((partie) => partie[0]?.toUpperCase() || '')
    .join('')
}

export function AvatarCompte({
  nom,
  photo,
  className,
}: {
  nom?: string
  photo?: string | null
  className: string
}) {
  if (photo) {
    return <img src={photo} alt="" className={`${className} object-cover`} />
  }

  return (
    <span className={`grid place-items-center text-xs font-bold ${className}`}>
      {initialesCompte(nom)}
    </span>
  )
}

/**
 * Menu du compte dans l’en-tête admin : Profil et Paramètres, plus la déconnexion.
 * `compact` n’affiche que l’avatar, pour la barre mobile.
 */
export function MenuCompteAdmin({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [ouvert, setOuvert] = useState(false)
  const zone = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ouvert) return

    function fermerSiDehors(evenement: MouseEvent) {
      if (!zone.current?.contains(evenement.target as Node)) setOuvert(false)
    }

    function fermerEchap(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') setOuvert(false)
    }

    document.addEventListener('mousedown', fermerSiDehors)
    document.addEventListener('keydown', fermerEchap)
    return () => {
      document.removeEventListener('mousedown', fermerSiDehors)
      document.removeEventListener('keydown', fermerEchap)
    }
  }, [ouvert])

  async function seDeconnecter() {
    setOuvert(false)
    await logout()
    navigate('/', { replace: true })
  }

  function aller(chemin: string) {
    setOuvert(false)
    navigate(chemin)
  }

  return (
    <div ref={zone} className="relative">
      <button
        type="button"
        aria-expanded={ouvert}
        aria-haspopup="menu"
        aria-label={compact ? `Compte de ${user?.name || 'l’administrateur'}` : undefined}
        onClick={() => setOuvert((actuel) => !actuel)}
        className={`flex items-center gap-2.5 rounded-full border border-black/10 bg-white text-left shadow-sm transition hover:border-[#8c4205]/50 ${
          compact ? 'p-1' : 'py-1 pl-3 pr-2'
        }`}
      >
        {!compact && (
          <span className="text-right leading-tight">
            <span className="block text-sm font-semibold text-ink-900">{user?.name}</span>
            <span className="block text-[11px] text-ink-500">{user?.email}</span>
          </span>
        )}
        <AvatarCompte
          nom={user?.name}
          photo={user?.photo}
          className="h-9 w-9 overflow-hidden rounded-full bg-[#8c4205] text-white"
        />
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-ink-500 transition ${ouvert ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {ouvert && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => aller('/admin/profil')}
            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-ink-900 hover:bg-[#f4f5f4]"
          >
            Profil
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => aller('/admin/parametres')}
            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-ink-900 hover:bg-[#f4f5f4]"
          >
            Paramètres
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void seDeconnecter()}
            className="block w-full border-t border-black/8 px-4 py-2.5 text-left text-sm font-semibold text-ink-900 hover:bg-[#f4f5f4]"
          >
            Déconnexion
          </button>
        </div>
      )}
    </div>
  )
}
