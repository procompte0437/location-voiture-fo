import { NavLink, Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ContentLoader } from '../ui/Spinner'
import api from '../../lib/api'

/** Entrée de navigation de la barre latérale partenaire. */
type ElementNav = { vers: string; libelle: string; exact?: boolean }

/** Groupes du menu (pilotage, flotte, support). */
const MENU: { titre: string; elements: ElementNav[] }[] = [
  {
    titre: 'Pilotage',
    elements: [
      { vers: '/partenaire', libelle: 'Tableau de bord', exact: true },
      { vers: '/partenaire/reservations', libelle: 'Mes réservations' },
      { vers: '/partenaire/clients', libelle: 'Mes clients' },
    ],
  },
  {
    titre: 'Flotte',
    elements: [
      { vers: '/partenaire/voitures', libelle: 'Mes voitures' },
      { vers: '/partenaire/voitures/nouvelle', libelle: 'Ajouter un véhicule' },
      { vers: '/partenaire/referentiel', libelle: 'Référentiel' },
    ],
  },
  {
    titre: 'Support',
    elements: [{ vers: '/partenaire/aide', libelle: 'Aide' }],
  },
]

/** Icônes SVG associées aux routes du menu. */
const ICONES: Record<string, ReactNode> = {
  '/partenaire': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Z" />
    </svg>
  ),
  '/partenaire/reservations': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  ),
  '/partenaire/clients': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M21 19c0-2.2-1.5-3.8-4-4.2" strokeLinecap="round" />
    </svg>
  ),
  '/partenaire/voitures': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5" strokeLinecap="round" />
      <path d="M3 13h18v4a1 1 0 0 1-1 1h-1" />
      <circle cx="7" cy="17" r="1.5" />
      <circle cx="17" cy="17" r="1.5" />
    </svg>
  ),
  '/partenaire/voitures/nouvelle': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  ),
  '/partenaire/referentiel': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  ),
  '/partenaire/aide': (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.7 2.2c-.7.4-1.2.9-1.2 1.8V14" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" />
    </svg>
  ),
}

/** Calcule les initiales affichées dans l’avatar. */
function initiales(nom?: string) {
  if (!nom) return 'PR'
  return nom
    .split(/\s+/)
    .slice(0, 2)
    .map((partie) => partie[0]?.toUpperCase() || '')
    .join('')
}

/**
 * Coque visuelle de l’espace partenaire : sidebar chic + zone de contenu.
 */
export function CoquePartenaire({
  children,
  nomPartenaire,
  statutPartenaire,
}: {
  children: ReactNode
  nomPartenaire?: string
  statutPartenaire?: string
}) {
  const { user, logout } = useAuth()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const emplacement = useLocation()

  const sousTitreEntete =
    emplacement.pathname.includes('/voitures/nouvelle')
      ? 'Publier une nouvelle offre'
      : emplacement.pathname.includes('/voitures')
        ? 'Gérez votre flotte'
        : emplacement.pathname.includes('/reservations')
          ? 'Suivi des locations'
          : emplacement.pathname.includes('/clients')
            ? 'Vos clients locataires'
            : emplacement.pathname.includes('/referentiel')
              ? 'Configuration marques et modèles'
              : emplacement.pathname.includes('/aide')
                ? 'Centre d’aide partenaire'
                : 'Vue d’ensemble de votre activité'

  return (
    <div className="min-h-screen bg-[#fafafa] text-ink-900">
      {/* Barre mobile */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-black/8 bg-[#fafafa]/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOuvert(true)}
          className="rounded-lg bg-[#14201a] px-3 py-2 text-sm font-semibold text-white"
        >
          Menu
        </button>
        <Link to="/partenaire" className="font-display text-lg font-bold text-ink-900">
          Espace partenaire
        </Link>
        <span className="text-xs text-ink-500">Pro</span>
      </div>

      {menuOuvert && (
        <button
          type="button"
          aria-label="Fermer"
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
          onClick={() => setMenuOuvert(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col overflow-hidden text-white transition-transform duration-300 lg:translate-x-0 ${
          menuOuvert ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute inset-0 bg-[#14201a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,160,23,0.18),transparent_50%)]" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold-500/40 to-transparent" />

        <div className="relative flex h-full flex-col px-3 py-5">
          <div className="mb-8 px-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400/90">
              Partenaire
            </p>
            <Link
              to="/partenaire"
              onClick={() => setMenuOuvert(false)}
              className="mt-1 block font-display text-2xl font-bold tracking-tight"
            >
              Loca<span className="text-gold-400">Gabon</span>
            </Link>
            <p className="mt-1 truncate text-xs text-white/50">
              {nomPartenaire || user?.name || 'Votre espace pro'}
            </p>
            {statutPartenaire && (
              <span className="mt-3 inline-flex rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-400">
                {statutPartenaire}
              </span>
            )}
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto pb-4">
            {MENU.map((groupe) => (
              <div key={groupe.titre}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  {groupe.titre}
                </p>
                <ul className="space-y-0.5">
                  {groupe.elements.map((element) => (
                    <li key={element.vers}>
                      <NavLink
                        to={element.vers}
                        end={element.exact}
                        onClick={() => setMenuOuvert(false)}
                        className={({ isActive }) =>
                          `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                            isActive
                              ? 'bg-white/10 font-semibold text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-gold-400'
                              : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                          }`
                        }
                      >
                        <span className="opacity-90">{ICONES[element.vers]}</span>
                        <span>{element.libelle}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 px-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gold-500/20 text-xs font-bold text-gold-400">
                {initiales(nomPartenaire || user?.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-[11px] text-white/45">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 px-1">
              <Link
                to="/"
                className="rounded-lg border border-white/15 px-2 py-2 text-center text-xs font-medium text-white/85 hover:bg-white/10"
              >
                Site public
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg border border-white/15 px-2 py-2 text-xs font-medium text-white/85 hover:bg-white/10"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-30 hidden border-b border-black/8 bg-[#fafafa]/90 backdrop-blur lg:block">
          <div className="flex items-center justify-between gap-4 px-8 py-3.5">
            <p className="text-sm text-ink-500">{sousTitreEntete}</p>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-[11px] text-ink-500">Compte partenaire</p>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white text-xs font-bold text-ink-700">
                {initiales(user?.name)}
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}

/** Contexte partagé aux pages enfants via React Router Outlet. */
export type ContexteSortiePartenaire = {
  tableauDeBord: Record<string, unknown> | null
  nomPartenaire?: string
  /** True tant que le tableau de bord / profil partenaire charge. */
  chargementDonnees: boolean
  recharger: () => Promise<void>
}

/**
 * Disposition authentifiée : affiche tout de suite la coque ;
 * le chargement se fait dans les zones de données des pages.
 */
export function DispositionPartenaire() {
  const { user, loading: authEnCours } = useAuth()
  const [tableauDeBord, setTableauDeBord] = useState<Record<string, unknown> | null>(null)
  const [nomPartenaire, setNomPartenaire] = useState<string>()
  const [chargementDonnees, setChargementDonnees] = useState(true)
  const [verificationFaite, setVerificationFaite] = useState(false)
  const [aUnPartenaire, setAUnPartenaire] = useState(true)

  async function recharger() {
    setChargementDonnees(true)
    try {
      const [reponseTableau, reponseMoi] = await Promise.all([
        api.get('/partenaires/moi/tableau-de-bord'),
        api.get('/partenaires/moi').catch(() => null),
      ])
      setTableauDeBord(reponseTableau.data.data)
      const profil = reponseMoi?.data?.data
      setNomPartenaire(profil?.company_name || profil?.manager_name || user?.name)
      setAUnPartenaire(true)
    } catch {
      setTableauDeBord(null)
      setAUnPartenaire(false)
    } finally {
      setChargementDonnees(false)
      setVerificationFaite(true)
    }
  }

  useEffect(() => {
    if (user) void recharger()
  }, [user])

  // Auth encore en cours : coque visible, spinner uniquement dans le contenu.
  if (authEnCours) {
    return (
      <CoquePartenaire>
        <div className="rounded-2xl border border-black/8 bg-white">
          <ContentLoader label="Chargement du compte…" />
        </div>
      </CoquePartenaire>
    )
  }

  if (!user) {
    return <Navigate to="/connexion" replace />
  }

  // Isolation : admins / clients n’entrent pas dans l’espace d’un partenaire.
  if (user.role === 'admin' || user.role === 'super_admin') {
    return <Navigate to="/admin" replace />
  }

  if (user.role !== 'partner' && user.role !== 'partner_agent') {
    return <Navigate to="/" replace />
  }

  // Vérification dossier terminée et aucun partenaire → inscription.
  if (verificationFaite && !aUnPartenaire) {
    return <Navigate to="/partenaire/inscription" replace />
  }

  return (
    <CoquePartenaire
      nomPartenaire={nomPartenaire || user.name}
      statutPartenaire={tableauDeBord?.status ? String(tableauDeBord.status) : undefined}
    >
      <Outlet
        context={
          {
            tableauDeBord,
            nomPartenaire: nomPartenaire || user.name,
            chargementDonnees,
            recharger,
          } satisfies ContexteSortiePartenaire
        }
      />
    </CoquePartenaire>
  )
}
