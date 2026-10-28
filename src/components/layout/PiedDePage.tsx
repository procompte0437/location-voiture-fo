import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api, { messageErreurApi } from '../../lib/api'
import { LogoDoto } from './LogoDoto'

const COLONNES = [
  {
    titre: 'Entreprise',
    liens: [
      { vers: '/faq', libelle: 'Aide' },
      { vers: '/vehicules', libelle: 'Véhicules' },
      { vers: '/#agences', libelle: 'Agences' },
      { vers: '/inscription', libelle: 'Devenir partenaire' },
      { vers: '/contact', libelle: 'Contact' },
    ],
  },
  {
    titre: 'Services',
    liens: [
      { vers: '/vehicules', libelle: 'Comparer les offres' },
      { vers: '/#agences', libelle: 'Retrait en agence' },
      { vers: '/vehicules', libelle: 'Livraison' },
      { vers: '/#estimateur', libelle: 'Estimer un prix' },
      { vers: '/faq', libelle: 'Questions fréquentes' },
    ],
  },
  {
    titre: 'Support',
    liens: [
      { vers: '/contact', libelle: 'Nous contacter' },
      { vers: '/connexion', libelle: 'Espace client' },
      { vers: '/inscription', libelle: 'Créer un compte' },
      { vers: '/faq', libelle: 'Aide' },
    ],
  },
] as const

/** Pages juridiques, sous le filet, pour ne pas allonger la colonne Navigation. */
const LIENS_LEGAUX = [
  { vers: '/charte-de-confidentialite', libelle: 'Charte de confidentialité' },
  { vers: '/conditions-generales', libelle: 'Conditions générales' },
  { vers: '/plan-du-site', libelle: 'Plan du site' },
] as const

const EMAIL_SUPPORT = 'support@doto241.com'
const TELEPHONE_AFFICHE = '+241 01 12 34 56'
const TELEPHONE_LIEN = 'tel:+24101123456'

/**
 * Profils publics de DOTO. WhatsApp ouvre la conversation sur le numéro
 * communiqué pour la marque ; Facebook pointe vers la page indiquée.
 */
export const RESEAUX_SOCIAUX = [
  { nom: 'WhatsApp', href: 'https://wa.me/24104371973' },
  { nom: 'Facebook', href: 'https://www.facebook.com/doto241' },
  { nom: 'TikTok', href: 'https://www.tiktok.com/@doto241' },
  { nom: 'Instagram', href: 'https://www.instagram.com/doto241' },
  { nom: 'Twitter', href: 'https://x.com/doto241' },
] as const

type NomReseau = (typeof RESEAUX_SOCIAUX)[number]['nom']

/** Glyphes simples, en currentColor, pour rester lisibles sur le fond sombre. */
export function IconeReseau({ nom }: { nom: NomReseau }) {
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

function TitreColonne({ children }: { children: string }) {
  return (
    <p className="text-base font-extrabold text-white">
      {children}
      <span className="mt-2 block h-0.5 w-8 bg-marque-500" />
    </p>
  )
}

/**
 * Pied de page en colonnes, avec une inscription aux actualités.
 * Le message part par le formulaire de contact déjà en place.
 */
export function PiedDePage() {
  const annee = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [siteWeb, setSiteWeb] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')

  async function abonner(evenement: FormEvent) {
    evenement.preventDefault()
    setErreur('')
    setMessage('')
    setEnvoi(true)
    try {
      await api.post('/contact', {
        nom: 'Abonné DOTO',
        email: email.trim(),
        telephone: null,
        sujet: 'autre',
        message: 'Inscription aux actualités DOTO depuis le pied de page.',
        site_web: siteWeb,
      })
      setEmail('')
      setMessage('Votre adresse est enregistrée. Nous vous écrirons à cette adresse.')
    } catch (err) {
      setErreur(messageErreurApi(err, 'Inscription impossible. Réessayez dans un instant.'))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <footer className="bg-marque-sombre text-white">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr_minmax(0,1.15fr)] lg:gap-10">
          <Link to="/" className="inline-flex h-fit" aria-label="DOTO — accueil">
            <LogoDoto className="h-24 w-24" />
          </Link>

          {COLONNES.map((colonne) => (
            <nav key={colonne.titre} aria-label={colonne.titre}>
              <TitreColonne>{colonne.titre}</TitreColonne>
              <ul className="mt-4 space-y-2 text-sm text-white/75">
                {colonne.liens.map((lien) => (
                  <li key={`${colonne.titre}-${lien.libelle}`}>
                    <Link to={lien.vers} className="hover:text-white hover:underline">
                      {lien.libelle}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <TitreColonne>Restons connectés</TitreColonne>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Laissez votre adresse pour recevoir les actualités DOTO et les conseils de location.
            </p>
            <form onSubmit={abonner} className="mt-4 space-y-3">
              <label className="sr-only" htmlFor="newsletter-email">
                Votre adresse e-mail
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                placeholder="Votre adresse e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white px-3 py-2.5 text-sm text-ink-900 outline-none"
              />
              <input
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                value={siteWeb}
                onChange={(e) => setSiteWeb(e.target.value)}
                className="hidden"
              />
              <button
                type="submit"
                disabled={envoi}
                className="w-full bg-marque-500 py-2.5 text-sm font-bold text-ink-900 hover:bg-gold-400 disabled:opacity-60"
              >
                {envoi ? 'Envoi…' : "S'abonner"}
              </button>
              {message && <p className="text-sm text-marque-voile">{message}</p>}
              {erreur && (
                <p className="text-sm text-gold-400" role="alert">
                  {erreur}
                </p>
              )}
            </form>
            <p className="mt-4 text-sm text-white/70">
              <a href={TELEPHONE_LIEN} className="hover:underline">
                {TELEPHONE_AFFICHE}
              </a>
              <span className="mx-2 text-white/30">·</span>
              <a href={`mailto:${EMAIL_SUPPORT}`} className="hover:underline">
                {EMAIL_SUPPORT}
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/25 px-6 py-6 text-center">
        <p className="text-sm text-white/80">Copyright © DOTO {annee} | Tous droits réservés</p>
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          {RESEAUX_SOCIAUX.map((reseau) => (
            <li key={reseau.nom}>
              <a
                href={reseau.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-marque-500 hover:text-gold-400"
              >
                <IconeReseau nom={reseau.nom} />
                {reseau.nom}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-marque-500">
          {LIENS_LEGAUX.map((lien, index) => (
            <span key={lien.vers} className="inline-flex items-center gap-3">
              {index > 0 && <span aria-hidden className="text-white/30">|</span>}
              <Link to={lien.vers} className="hover:underline">
                {lien.libelle}
              </Link>
            </span>
          ))}
          <span aria-hidden className="text-white/30">|</span>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('locagabon:cookies'))
            }}
            className="hover:underline"
          >
            Paramétrage des cookies
          </button>
        </div>
      </div>
    </footer>
  )
}
