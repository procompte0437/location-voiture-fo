import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogoDoto } from './LogoDoto'

type Langue = 'fr' | 'en'

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

const TEXTES: Record<
  Langue,
  {
    compte: string
    rejoindre: string
    contacter: string
    reserver: string
    deconnexion: string
    langue: string
    liens: { vers: string; libelle: string }[]
  }
> = {
  fr: {
    compte: 'Espace client',
    rejoindre: 'Nous rejoindre',
    contacter: 'Nous contacter',
    reserver: 'Réserver',
    deconnexion: 'Déconnexion',
    langue: 'Français',
    liens: [
      { vers: '/', libelle: 'Accueil' },
      { vers: '/vehicules', libelle: 'Véhicules' },
      { vers: '/#agences', libelle: 'Agences' },
      { vers: '/faq', libelle: 'Aide' },
    ],
  },
  en: {
    compte: 'Client area',
    rejoindre: 'Join us',
    contacter: 'Contact us',
    reserver: 'Book',
    deconnexion: 'Log out',
    langue: 'English',
    liens: [
      { vers: '/', libelle: 'Home' },
      { vers: '/vehicules', libelle: 'Vehicles' },
      { vers: '/#agences', libelle: 'Agencies' },
      { vers: '/faq', libelle: 'Help' },
    ],
  },
}

function lienActif(vers: string, chemin: string, hash: string) {
  if (vers === '/') return chemin === '/' && !hash
  if (vers.startsWith('/#')) return chemin === '/' && hash === vers.slice(1)
  return chemin === vers || chemin.startsWith(`${vers}/`)
}

function IconeCompte() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19.2c1.4-3 3.8-4.5 7-4.5s5.6 1.5 7 4.5" strokeLinecap="round" />
    </svg>
  )
}

function IconeRejoindre() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M14 3.5V8h4M8.5 12h7M8.5 16h5" strokeLinecap="round" />
    </svg>
  )
}

function IconeTelephone() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M8 4.5h2.2l1.2 3-1.6 1a12 12 0 0 0 5.7 5.7l1-1.6 3 1.2V16a2 2 0 0 1-2.2 2A14.5 14.5 0 0 1 6 6.7 2 2 0 0 1 8 4.5z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DrapeauFrancais() {
  return (
    <svg viewBox="0 0 18 12" className="h-3.5 w-5 shrink-0 rounded-[2px] shadow-sm" aria-hidden>
      <rect width="6" height="12" fill="#0055A4" />
      <rect x="6" width="6" height="12" fill="#fff" />
      <rect x="12" width="6" height="12" fill="#EF4135" />
    </svg>
  )
}

function DrapeauAnglais() {
  return (
    <svg viewBox="0 0 18 12" className="h-3.5 w-5 shrink-0 rounded-[2px] shadow-sm" aria-hidden>
      <rect width="18" height="12" fill="#012169" />
      <path d="M0 0l18 12M18 0L0 12" stroke="#fff" strokeWidth="2.4" />
      <path d="M0 0l18 12M18 0L0 12" stroke="#C8102E" strokeWidth="1.2" />
      <path d="M9 0v12M0 6h18" stroke="#fff" strokeWidth="3.6" />
      <path d="M9 0v12M0 6h18" stroke="#C8102E" strokeWidth="2" />
    </svg>
  )
}

/**
 * Barre en deux temps : un onglet coupé en biais pour les accès rapides,
 * puis le logo, le menu, le bouton et la langue.
 */
function BarreNavigation() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const emplacement = useLocation()
  const langueRef = useRef<HTMLDivElement>(null)
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [langueOuverte, setLangueOuverte] = useState(false)
  const [defile, setDefile] = useState(false)
  const [langue, setLangue] = useState<Langue>(() =>
    window.sessionStorage.getItem('doto_langue') === 'en' ? 'en' : 'fr',
  )
  const textes = TEXTES[langue]
  const connecte = !!user
  const espacePro = user && !estReservateur(user) ? lienEspacePro(user) : null
  const lienCompte = espacePro ?? {
    to: connecte ? '/mes-reservations' : '/connexion',
    label: textes.compte,
  }

  useEffect(() => {
    setMenuOuvert(false)
    setLangueOuverte(false)
  }, [emplacement.pathname, emplacement.hash])

  useEffect(() => {
    let actif = window.scrollY > 12
    setDefile(actif)
    let ticket = 0
    const surScroll = () => {
      if (ticket) return
      ticket = window.requestAnimationFrame(() => {
        ticket = 0
        const suivant = window.scrollY > 12
        if (suivant === actif) return
        actif = suivant
        setDefile(suivant)
      })
    }
    window.addEventListener('scroll', surScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', surScroll)
      if (ticket) window.cancelAnimationFrame(ticket)
    }
  }, [])

  useEffect(() => {
    if (!langueOuverte) return
    const fermer = (evenement: MouseEvent) => {
      if (!langueRef.current?.contains(evenement.target as Node)) setLangueOuverte(false)
    }
    document.addEventListener('mousedown', fermer)
    return () => document.removeEventListener('mousedown', fermer)
  }, [langueOuverte])

  function choisirLangue(suivante: Langue) {
    setLangue(suivante)
    window.sessionStorage.setItem('doto_langue', suivante)
    setLangueOuverte(false)
  }

  async function seDeconnecter() {
    await logout()
    navigate('/', { replace: true })
  }

  const lienOutil = 'inline-flex items-center gap-1.5 whitespace-nowrap px-3 text-[13px] font-semibold text-marque-encre hover:underline'

  return (
    <header
      id="haut"
      className={`sticky top-0 z-40 shrink-0 bg-[#e7eee9] text-ink-900 transition-shadow duration-300 ${
        defile ? 'shadow-md' : ''
      }`}
    >
      {/* Le logo occupe le coin entouré, au-dessus de la ligne du menu. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden lg:block">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <Link
            to="/"
            className="pointer-events-auto inline-flex -translate-x-3 items-center gap-2 pt-1 text-marque-encre"
            aria-label="DOTO — accueil"
          >
            <LogoDoto className={defile ? 'h-14 w-14' : 'h-16 w-16'} />
            <span className="text-2xl font-extrabold tracking-tight">DOTO</span>
          </Link>
        </div>
      </div>
      <div className="flex justify-end">
        <div
          className="hidden bg-white shadow-[0_8px_20px_rgba(20,32,26,0.06)] lg:block"
          style={{ clipPath: 'polygon(28px 0, 100% 0, 100% 100%, 0 100%)' }}
        >
          <div className="flex items-center py-2 pl-10 pr-6 md:pr-10">
            <Link to={lienCompte.to} className={lienOutil}>
              <IconeCompte />
              {lienCompte.label}
            </Link>
            <span className="h-4 w-px bg-ink-900/15" aria-hidden />
            {connecte ? (
              <button type="button" onClick={() => void seDeconnecter()} className={lienOutil}>
                {textes.deconnexion}
              </button>
            ) : (
              <Link to="/inscription" className={lienOutil}>
                <IconeRejoindre />
                {textes.rejoindre}
              </Link>
            )}
            <span className="h-4 w-px bg-ink-900/15" aria-hidden />
            <Link to="/contact" className={lienOutil}>
              <IconeTelephone />
              {textes.contacter}
            </Link>
          </div>
        </div>
      </div>

      <div className={`mx-auto flex max-w-7xl items-center gap-4 px-4 md:px-6 ${defile ? 'py-2' : 'py-3.5'}`}>
        <Link to="/" className="inline-flex shrink-0 items-center gap-2 text-marque-encre lg:hidden" aria-label="DOTO — accueil">
          <LogoDoto className={defile ? 'h-14 w-14' : 'h-16 w-16'} />
          <span className="text-2xl font-extrabold tracking-tight">DOTO</span>
        </Link>
        <div className="invisible hidden shrink-0 items-center gap-2 lg:inline-flex" aria-hidden>
          <span className={defile ? 'block h-14 w-14' : 'block h-16 w-16'} />
          <span className="text-2xl font-extrabold tracking-tight">DOTO</span>
        </div>

        <nav className="ml-6 hidden items-center gap-7 text-[15px] font-bold lg:flex" aria-label="Navigation principale">
          {textes.liens.map((lien) => {
            const actif = lienActif(lien.vers, emplacement.pathname, emplacement.hash)
            return (
              <Link
                key={lien.vers}
                to={lien.vers}
                aria-current={actif ? 'page' : undefined}
                className={`whitespace-nowrap border-b-2 pb-0.5 ${
                  actif ? 'border-marque-500 text-marque-encre' : 'border-transparent text-ink-900 hover:text-marque-encre'
                }`}
              >
                {lien.libelle}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <Link
            to="/#recherche"
            className="rounded-md bg-marque-500 px-5 py-2.5 text-sm font-bold text-ink-900 shadow-sm hover:bg-gold-400"
          >
            {textes.reserver}
          </Link>
          <div ref={langueRef} className="relative">
            <button
              type="button"
              aria-expanded={langueOuverte}
              aria-haspopup="listbox"
              onClick={() => setLangueOuverte((ouvert) => !ouvert)}
              className="inline-flex items-center gap-2 rounded-md border border-ink-900/10 bg-white px-3 py-2 text-sm font-semibold text-ink-900 shadow-sm hover:border-marque-encre/30"
            >
              {langue === 'fr' ? <DrapeauFrancais /> : <DrapeauAnglais />}
              {textes.langue}
              <span className={`text-xs text-ink-500 transition ${langueOuverte ? 'rotate-180' : ''}`} aria-hidden>
                ▾
              </span>
            </button>
            {langueOuverte && (
              <ul
                role="listbox"
                aria-label={textes.langue}
                className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-md border border-ink-900/10 bg-white py-1 shadow-lg"
              >
                {(['fr', 'en'] as const).map((code) => (
                  <li key={code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={langue === code}
                      onClick={() => choisirLangue(code)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold ${
                        langue === code ? 'bg-marque-voile text-marque-encre' : 'text-ink-900 hover:bg-sand-50'
                      }`}
                    >
                      {code === 'fr' ? <DrapeauFrancais /> : <DrapeauAnglais />}
                      {TEXTES[code].langue}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <button
          type="button"
          className="ml-auto grid h-10 w-10 place-items-center rounded-md border border-ink-900/15 bg-white text-ink-900 lg:hidden"
          aria-expanded={menuOuvert}
          aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setMenuOuvert((ouvert) => !ouvert)}
        >
          {menuOuvert ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {menuOuvert && (
        <nav className="border-t border-ink-900/10 bg-white px-4 py-3 lg:hidden" aria-label="Navigation principale">
          <div className="flex flex-col gap-1 text-sm font-semibold">
            {textes.liens.map((lien) => {
              const actif = lienActif(lien.vers, emplacement.pathname, emplacement.hash)
              return (
                <Link
                  key={lien.vers}
                  to={lien.vers}
                  className={`rounded-md px-3 py-2.5 ${actif ? 'bg-marque-voile text-marque-encre' : 'hover:bg-sand-50'}`}
                >
                  {lien.libelle}
                </Link>
              )
            })}
            <Link to={lienCompte.to} className="inline-flex items-center gap-2 rounded-md px-3 py-2.5 hover:bg-sand-50">
              <IconeCompte />
              {lienCompte.label}
            </Link>
            {connecte ? (
              <button
                type="button"
                onClick={() => void seDeconnecter()}
                className="rounded-md px-3 py-2.5 text-left hover:bg-sand-50"
              >
                {textes.deconnexion}
              </button>
            ) : (
              <Link to="/inscription" className="inline-flex items-center gap-2 rounded-md px-3 py-2.5 hover:bg-sand-50">
                <IconeRejoindre />
                {textes.rejoindre}
              </Link>
            )}
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-md px-3 py-2.5 hover:bg-sand-50">
              <IconeTelephone />
              {textes.contacter}
            </Link>
            <div className="mt-2 flex gap-2">
              {(['fr', 'en'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => choisirLangue(code)}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 ${
                    langue === code ? 'border-marque-encre bg-marque-voile text-marque-encre' : 'border-ink-900/10'
                  }`}
                >
                  {code === 'fr' ? <DrapeauFrancais /> : <DrapeauAnglais />}
                  {TEXTES[code].langue}
                </button>
              ))}
            </div>
            <Link to="/#recherche" className="mt-1 rounded-md bg-marque-500 px-3 py-2.5 text-center font-bold text-ink-900">
              {textes.reserver}
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}

export function Header() {
  return <BarreNavigation />
}

export function PublicHeader() {
  return <BarreNavigation />
}
