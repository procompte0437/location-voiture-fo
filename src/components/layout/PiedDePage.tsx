import { Link } from 'react-router-dom'
import { LogoDoto } from './LogoDoto'

/** Pages publiques de la colonne Navigation. */
const LIENS_NAVIGATION = [
  { vers: '/vehicules', libelle: 'Véhicules' },
  { vers: '/#agences', libelle: 'Agences' },
  { vers: '/devenir-partenaire', libelle: 'Professionnels' },
  { vers: '/faq', libelle: 'Aide' },
  { vers: '/contact', libelle: 'Contact' },
] as const

/** Pages juridiques, sous le filet, pour ne pas allonger la colonne Navigation. */
const LIENS_LEGAUX = [
  { vers: '/charte-de-confidentialite', libelle: 'Charte de confidentialité' },
  { vers: '/conditions-generales', libelle: 'Conditions générales' },
  { vers: '/plan-du-site', libelle: 'Plan du site' },
] as const

const EMAIL_SUPPORT = 'support@locagabon.ga'
const TELEPHONE_AFFICHE = '+241 01 12 34 56'
const TELEPHONE_LIEN = 'tel:+24101123456'

/**
 * Profils publics de DOTO. WhatsApp ouvre la conversation sur le numéro
 * communiqué pour la marque ; Facebook pointe vers la page indiquée.
 */
const RESEAUX_SOCIAUX = [
  { nom: 'WhatsApp', href: 'https://wa.me/24104371973' },
  { nom: 'Facebook', href: 'https://www.facebook.com/' },
  { nom: 'TikTok', href: 'https://www.tiktok.com/@locagabon' },
  { nom: 'Instagram', href: 'https://www.instagram.com/locagabon' },
  { nom: 'Twitter', href: 'https://x.com/locagabon' },
] as const

type NomReseau = (typeof RESEAUX_SOCIAUX)[number]['nom']

/** Glyphes simples, en currentColor, pour rester lisibles sur le fond sombre. */
function IconeReseau({ nom }: { nom: NomReseau }) {
  const commun = { viewBox: '0 0 24 24', className: 'h-[18px] w-[18px]', fill: 'currentColor', 'aria-hidden': true } as const
  if (nom === 'WhatsApp') {
    return (
      <svg {...commun}>
        <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm5.76 13.92c-.24.68-1.2 1.24-1.96 1.4-.52.11-1.2.2-3.48-.75-2.92-1.21-4.8-4.18-4.95-4.37-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.26-.29.57-.36.76-.36h.55c.17 0 .41-.07.64.49.24.58.82 2 .89 2.15.07.14.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.54.73 1.8.86.27.14.44.2.51.31.07.12.07.67-.17 1.35Z" />
      </svg>
    )
  }
  if (nom === 'Facebook') {
    return (
      <svg {...commun}>
        <path d="M14.5 8.5V6.8c0-.7.5-1.1 1.2-1.1h1.3V3h-2.2C12.2 3 11 4.4 11 6.6v1.9H9v2.8h2V21h3.5v-9.7h2.3l.4-2.8h-2.7Z" />
      </svg>
    )
  }
  if (nom === 'TikTok') {
    return (
      <svg {...commun}>
        <path d="M14.2 3c.4 2.5 1.8 4.1 4.3 4.4v2.5c-1.5 0-2.8-.5-4.1-1.3v6.7c0 3.4-2.6 5.9-6 5.9S2.4 18.7 2.4 15.3c0-3.3 2.5-5.8 5.8-5.9v2.7c-1.7.1-3 1.5-3 3.2 0 1.8 1.4 3.2 3.2 3.2s3.2-1.4 3.2-3.2V3h2.6Z" />
      </svg>
    )
  }
  if (nom === 'Instagram') {
    return (
      <svg {...commun}>
        <path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm8 2H8a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3Zm-4 2.2A4.8 4.8 0 1 1 7.2 12 4.8 4.8 0 0 1 12 7.2Zm0 2A2.8 2.8 0 1 0 14.8 12 2.8 2.8 0 0 0 12 9.2ZM17.4 6.2a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1Z" />
      </svg>
    )
  }
  return (
    <svg {...commun}>
      <path d="M17.6 3h2.9l-6.3 7.2L21.8 21h-5.4l-4.2-5.5L7.4 21H4.5l6.8-7.8L3.2 3h5.5l3.8 5.1L17.6 3Zm-1 16.2h1.6L7.5 4.7H5.8l10.8 14.5Z" />
    </svg>
  )
}

/**
 * Pied de page en trois colonnes sur fond sombre : marque et réseaux,
 * navigation, contact, puis le copyright. Les coordonnées reprennent le
 * téléphone de l’accueil et l’e-mail du support déjà utilisés sur les pages
 * institutionnelles.
 */
export function PiedDePage() {
  const annee = new Date().getFullYear()

  return (
    <footer className="bg-marque-sombre text-white">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.85fr)_minmax(0,1fr)] md:gap-10">
          <div>
            <Link to="/" className="inline-flex" aria-label="DOTO — accueil">
              <LogoDoto className="h-[4.5rem] w-[4.5rem]" />
            </Link>
            <p className="mt-6 text-lg font-bold tracking-tight">La location, simplement.</p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Réservation · Partenaires vérifiés · Agences · Support
            </p>
            <div className="mt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">Réseaux</p>
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {RESEAUX_SOCIAUX.map((reseau) => (
                  <li key={reseau.nom}>
                    <a
                      href={reseau.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={reseau.nom}
                      title={reseau.nom}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/85 transition-colors hover:border-white hover:bg-white/10 hover:text-white"
                    >
                      <IconeReseau nom={reseau.nom} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <nav aria-label="Navigation du pied de page">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">Navigation</p>
            <ul className="mt-5 space-y-2.5 text-[15px]">
              {LIENS_NAVIGATION.map((lien) => (
                <li key={lien.vers}>
                  <Link to={lien.vers} className="transition-colors hover:underline">
                    {lien.libelle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">Contact</p>
            <ul className="mt-5 space-y-2.5 text-[15px] leading-relaxed">
              <li>Libreville, Gabon</li>
              <li>
                <a href={TELEPHONE_LIEN} className="font-semibold transition-colors hover:underline">
                  {TELEPHONE_AFFICHE}
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL_SUPPORT}`} className="transition-colors hover:underline">
                  {EMAIL_SUPPORT}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/15 pt-5">
          <div className="flex flex-col gap-3 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
            <p>© {annee} DOTO. Tous droits réservés.</p>
            <p>Location entre partenaires vérifiés</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/55">
            {LIENS_LEGAUX.map((lien) => (
              <Link key={lien.vers} to={lien.vers} className="transition-colors hover:underline">
                {lien.libelle}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('locagabon:cookies'))
              }}
              className="transition-colors hover:underline"
            >
              Paramétrage des cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
