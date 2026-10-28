import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { IconeReseau, PiedDePage, RESEAUX_SOCIAUX } from '../components/layout/PiedDePage'
import { IconeInformation } from '../components/ui/IconeInformation'
import { ListeDeroulanteRecherche } from '../components/ui/ListeDeroulanteRecherche'
import { Spinner } from '../components/ui/Spinner'
import api, { messageErreurApi } from '../lib/api'
import type { Vehicle } from '../types'

const EMAIL_ASSISTANCE = 'support@doto241.com'
const TELEPHONE_AFFICHE = '+241 01 12 34 56'
const TELEPHONE_LIEN = 'tel:+24101123456'
const WHATSAPP_AFFICHE = '+241 04 37 19 73'
const WHATSAPP_LIEN = 'https://wa.me/24104371973'
const TAILLE_MAX_PIECE = 8 * 1024 * 1024

const SUJETS = [
  { valeur: 'reservation', libelle: 'Une réservation' },
  { valeur: 'partenaire', libelle: 'Devenir partenaire' },
  { valeur: 'compte', libelle: 'Mon compte' },
  { valeur: 'reclamation', libelle: 'Une réclamation' },
  { valeur: 'autre', libelle: 'Autre demande' },
]

const CIVILITES = [
  { valeur: 'Monsieur', libelle: 'Monsieur' },
  { valeur: 'Madame', libelle: 'Madame' },
]

/** Pays courants pour une location au Gabon. La recherche de la liste couvre le reste de la saisie. */
const PAYS = [
  'Gabon',
  'Afrique du Sud',
  'Allemagne',
  'Angola',
  'Belgique',
  'Bénin',
  'Burkina Faso',
  'Cameroun',
  'Canada',
  'Congo',
  'Côte d’Ivoire',
  'Espagne',
  'États-Unis',
  'France',
  'Guinée équatoriale',
  'Italie',
  'Mali',
  'Maroc',
  'Nigeria',
  'République démocratique du Congo',
  'Royaume-Uni',
  'Sénégal',
  'Suisse',
  'Tchad',
  'Togo',
].map((nom) => ({ valeur: nom, libelle: nom }))

type FormulaireContact = {
  prenom: string
  nom: string
  telephone: string
  email: string
  civilite: string
  pays: string
  entreprise: string
  sujet: string
  message: string
  site_web: string
}

const FORMULAIRE_VIDE: FormulaireContact = {
  prenom: '',
  nom: '',
  telephone: '',
  email: '',
  civilite: '',
  pays: '',
  entreprise: '',
  sujet: '',
  message: '',
  site_web: '',
}

const champ =
  'mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm outline-none focus:border-marque-encre'

function TitreBloc({ children }: { children: string }) {
  return (
    <h2 className="text-2xl font-extrabold text-ink-900 md:text-3xl">
      {children}
      <span className="mt-2 block h-1 w-14 rounded-full bg-marque-500" />
    </h2>
  )
}

function IconeLieu() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}

function IconeTelephone() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M7 3.5h3.2l1.3 3.2-2 1.2a12 12 0 0 0 5.6 5.6l1.2-2 3.2 1.3V16a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 5 7.7 2 2 0 0 1 7 3.5z" strokeLinejoin="round" />
    </svg>
  )
}

function IconeEnveloppe() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  )
}

function IconeHorloge() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 2" strokeLinecap="round" />
    </svg>
  )
}

/** Même photo de route que l’accueil : le voile vert garde le titre lisible. */
const PHOTO_BANDEAU =
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1800&q=80'

/** Bandeau d’ouverture : la photo passe derrière le titre, dans les verts de la marque. */
function BandeauContact() {
  return (
    <section className="relative overflow-hidden bg-marque-encre text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(0,80,56,0.78) 0%, rgba(0,80,56,0.55) 50%, rgba(2,25,16,0.72) 100%), url('${PHOTO_BANDEAU}')`,
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-52 max-w-6xl items-center px-4 py-12 md:min-h-64 md:px-6 md:py-16">
        <h1 className="font-affiche text-5xl uppercase leading-none tracking-wide md:ml-auto md:text-7xl">
          Contactez-nous
        </h1>
      </div>
      <div className="relative h-2 bg-marque-500" />
    </section>
  )
}

function CarteCourriel({
  titre,
  href,
  libelle,
  icone,
}: {
  titre: string
  href: string
  libelle: string
  icone: 'courriel' | 'telephone'
}) {
  return (
    <a href={href} className="flex min-h-40 flex-col overflow-hidden rounded-2xl bg-marque-encre text-white shadow-md hover:-translate-y-0.5">
      <span className="flex flex-1 flex-col items-center justify-center px-4 py-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15">
          {icone === 'courriel' ? <IconeEnveloppe /> : <IconeTelephone />}
        </span>
        <span className="mt-3 text-lg font-bold">{titre}</span>
      </span>
      <span className="bg-marque-sombre px-3 py-3 text-center text-sm font-semibold">{libelle}</span>
    </a>
  )
}

/** Fermeture de la page : le visiteur passe à la réservation, comme le bandeau de devis du modèle. */
function BandeauReserver() {
  return (
    <section className="relative overflow-hidden bg-marque-encre text-white">
      <div className="absolute inset-y-0 right-0 hidden w-[46%] md:block" aria-hidden>
        <img
          src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="h-full w-full object-cover brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-marque-encre via-marque-encre/90 to-marque-sombre/55" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="max-w-xl">
          <h2 className="font-affiche text-4xl uppercase leading-none tracking-wide md:text-5xl">
            Vous voulez louer un véhicule ?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/85">
            Choisissez les dates et le lieu. Le prix de la location est affiché avant la confirmation.
          </p>
          <Link
            to="/vehicules"
            className="mt-6 inline-flex bg-marque-500 px-6 py-3 text-sm font-bold text-ink-900 hover:bg-gold-400"
          >
            Réserver
          </Link>
        </div>
      </div>
    </section>
  )
}

function MarquesPubliees() {
  const rail = useRef<HTMLDivElement>(null)
  const [marques, setMarques] = useState<string[] | null>(null)

  useEffect(() => {
    void api
      .get('/vehicles/search', { params: { per_page: 24, page: 1 } })
      .then(({ data }) => {
        const noms = new Set<string>()
        for (const vehicule of (data.data || []) as Vehicle[]) {
          const nom = vehicule.brand?.trim()
          if (nom) noms.add(nom)
        }
        setMarques([...noms])
      })
      .catch(() => setMarques([]))
  }, [])

  if (marques === null) {
    return (
      <div className="mt-8">
        <Spinner />
      </div>
    )
  }

  if (marques.length === 0) return null

  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        type="button"
        aria-label="Marques précédentes"
        onClick={() => rail.current?.scrollBy({ left: -220, behavior: 'smooth' })}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sand-200 text-ink-700 hover:bg-sand-50"
      >
        ‹
      </button>
      <div ref={rail} className="flex gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {marques.map((nom) => (
          <Link
            key={nom}
            to={`/vehicules?q=${encodeURIComponent(nom)}`}
            className="flex h-20 min-w-36 items-center justify-center rounded-2xl border border-sand-200 bg-white px-4 text-center font-affiche text-xl uppercase tracking-wide text-ink-900 shadow-sm"
          >
            {nom}
          </Link>
        ))}
      </div>
      <button
        type="button"
        aria-label="Marques suivantes"
        onClick={() => rail.current?.scrollBy({ left: 220, behavior: 'smooth' })}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sand-200 text-ink-700 hover:bg-sand-50"
      >
        ›
      </button>
    </div>
  )
}

function FormulaireMessage() {
  const [formulaire, setFormulaire] = useState<FormulaireContact>(FORMULAIRE_VIDE)
  const [piece, setPiece] = useState<File | null>(null)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const choixFichier = useRef<HTMLInputElement>(null)

  function maj(champFormulaire: keyof FormulaireContact, valeur: string) {
    setFormulaire((actuel) => ({ ...actuel, [champFormulaire]: valeur }))
  }

  function choisirPiece(fichier: File | null) {
    setErreur('')
    if (!fichier) {
      setPiece(null)
      return
    }
    const estPdf = fichier.type === 'application/pdf' || fichier.name.toLowerCase().endsWith('.pdf')
    if (!estPdf) {
      setPiece(null)
      setErreur('La pièce jointe doit être un fichier PDF.')
      return
    }
    if (fichier.size > TAILLE_MAX_PIECE) {
      setPiece(null)
      setErreur('Le PDF ne doit pas dépasser 8 Mo.')
      return
    }
    setPiece(fichier)
  }

  async function envoyer(evenement: FormEvent) {
    evenement.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      const donnees = new FormData()
      donnees.append('prenom', formulaire.prenom.trim())
      donnees.append('nom', formulaire.nom.trim())
      donnees.append('civilite', formulaire.civilite)
      donnees.append('pays', formulaire.pays)
      donnees.append('entreprise', formulaire.entreprise.trim())
      donnees.append('email', formulaire.email.trim())
      donnees.append('telephone', formulaire.telephone.trim())
      donnees.append('sujet', formulaire.sujet)
      donnees.append('message', formulaire.message.trim())
      donnees.append('site_web', formulaire.site_web)
      if (piece) donnees.append('piece', piece)
      await api.post('/contact', donnees)
      setEnvoye(true)
    } catch (err) {
      setErreur(messageErreurApi(err, 'Envoi impossible. Réessayez dans un instant.'))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-[0_16px_40px_rgba(20,32,26,0.08)] md:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-extrabold text-ink-900">Envoyez-nous un message</h2>
        <IconeInformation titre="Champs obligatoires">
          <p>Les champs marqués d’un astérisque sont obligatoires. Le message compte au moins 20 caractères.</p>
          <p>L’équipe répond en général sous 24 heures ouvrées, à l’adresse indiquée.</p>
        </IconeInformation>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">
        Décrivez votre demande. Nous vous répondrons à l’adresse e-mail indiquée.
      </p>

      {envoye ? (
        <p className="mt-6 rounded-xl bg-marque-voile px-4 py-3 text-sm text-marque-encre" role="status">
          Votre message a bien été envoyé. Nous vous répondrons à l’adresse indiquée.
        </p>
      ) : (
        <form onSubmit={(evenement) => void envoyer(evenement)} className="relative mt-6 space-y-4">
          <label className="block text-sm font-medium text-ink-900">
            Prénom
            <input
              value={formulaire.prenom}
              onChange={(evenement) => maj('prenom', evenement.target.value)}
              autoComplete="given-name"
              placeholder="Prénom"
              className={champ}
            />
          </label>
          <label className="block text-sm font-medium text-ink-900">
            Nom <span className="text-marque-encre">*</span>
            <input
              required
              value={formulaire.nom}
              onChange={(evenement) => maj('nom', evenement.target.value)}
              autoComplete="family-name"
              placeholder="Nom"
              className={champ}
            />
          </label>
          <label className="block text-sm font-medium text-ink-900">
            Téléphone <span className="text-marque-encre">*</span>
            <input
              required
              value={formulaire.telephone}
              onChange={(evenement) => maj('telephone', evenement.target.value)}
              autoComplete="tel"
              placeholder="Téléphone"
              className={champ}
            />
          </label>
          <label className="block text-sm font-medium text-ink-900">
            E-mail <span className="text-marque-encre">*</span>
            <input
              required
              type="email"
              value={formulaire.email}
              onChange={(evenement) => maj('email', evenement.target.value)}
              autoComplete="email"
              placeholder="E-mail"
              className={champ}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="text-sm font-medium text-ink-900">
              <span className="mb-1.5 block">
                Civilité <span className="text-marque-encre">*</span>
              </span>
              <ListeDeroulanteRecherche
                valeur={formulaire.civilite}
                onChange={(valeur) => maj('civilite', valeur)}
                options={CIVILITES}
                placeholder="Civilité"
                requis
                libelle="Civilité"
              />
            </div>
            <div className="text-sm font-medium text-ink-900">
              <span className="mb-1.5 block">
                Pays <span className="text-marque-encre">*</span>
              </span>
              <ListeDeroulanteRecherche
                valeur={formulaire.pays}
                onChange={(valeur) => maj('pays', valeur)}
                options={PAYS}
                placeholder="Pays"
                requis
                libelle="Pays"
              />
            </div>
          </div>
          <label className="block text-sm font-medium text-ink-900">
            Entreprise ou organisation
            <input
              value={formulaire.entreprise}
              onChange={(evenement) => maj('entreprise', evenement.target.value)}
              autoComplete="organization"
              placeholder="Entreprise ou organisation"
              className={champ}
            />
          </label>
          <div className="text-sm font-medium text-ink-900">
            <span className="mb-1.5 block">
              Objet du message <span className="text-marque-encre">*</span>
            </span>
            <ListeDeroulanteRecherche
              valeur={formulaire.sujet}
              onChange={(valeur) => maj('sujet', valeur)}
              options={SUJETS}
              placeholder="Choisir un sujet"
              requis
              libelle="Objet du message"
            />
          </div>
          <label className="block text-sm font-medium text-ink-900">
            Message <span className="text-marque-encre">*</span>
            <textarea
              required
              minLength={20}
              rows={5}
              value={formulaire.message}
              onChange={(evenement) => maj('message', evenement.target.value)}
              placeholder="Votre message"
              className={champ}
            />
          </label>
          <div className="text-sm font-medium text-ink-900">
            <span className="mb-1.5 block">Joindre un fichier PDF</span>
            <input
              ref={choixFichier}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(evenement) => choisirPiece(evenement.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => choixFichier.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-marque-encre"
            >
              Choisir un fichier
            </button>
            <p className="mt-2 text-xs font-normal text-ink-500">
              {piece ? piece.name : 'Taille maximale : 8 Mo'}
            </p>
          </div>
          <input
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={formulaire.site_web}
            onChange={(evenement) => maj('site_web', evenement.target.value)}
            className="absolute h-px w-px opacity-0"
          />
          {erreur && (
            <p className="text-sm text-red-700" role="alert">
              {erreur}
            </p>
          )}
          <button
            type="submit"
            disabled={envoi}
            className="inline-flex items-center gap-2 rounded-xl bg-marque-500 px-6 py-3 font-bold text-ink-900 hover:bg-gold-400 disabled:opacity-70"
          >
            {envoi && <Spinner className="h-4 w-4" />}
            {envoi ? 'Envoi…' : 'Envoyer'}
          </button>
        </form>
      )}
    </section>
  )
}

export function PageContact() {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <Header />
      <BandeauContact />
      <main className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="order-2 space-y-12 lg:order-1">
            <section>
              <TitreBloc>Nos coordonnées</TitreBloc>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-700 md:text-base">
                Une question sur une réservation, une agence ou un partenariat : appelez le standard
                ou laissez un message. Les véhicules se retirent dans les agences partenaires.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3 rounded-2xl bg-sand-100 p-4">
                  <span className="text-marque-encre">
                    <IconeLieu />
                  </span>
                  <p className="text-sm leading-relaxed text-ink-800">
                    Libreville, Gabon
                    <span className="mt-1 block text-ink-600">Retrait dans les agences partenaires</span>
                  </p>
                </div>
                <div className="flex gap-3 rounded-2xl bg-sand-100 p-4">
                  <span className="text-marque-encre">
                    <IconeTelephone />
                  </span>
                  <p className="text-sm leading-relaxed">
                    <a href={TELEPHONE_LIEN} className="font-semibold text-ink-900 hover:underline">
                      {TELEPHONE_AFFICHE}
                    </a>
                    <a href={WHATSAPP_LIEN} className="mt-1 block font-semibold text-ink-900 hover:underline">
                      {WHATSAPP_AFFICHE}
                    </a>
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <CarteCourriel titre="Assistance" href={`mailto:${EMAIL_ASSISTANCE}`} libelle={EMAIL_ASSISTANCE} icone="courriel" />
                <CarteCourriel titre="WhatsApp" href={WHATSAPP_LIEN} libelle={WHATSAPP_AFFICHE} icone="telephone" />
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-extrabold text-ink-900">Nos horaires</h2>
              <p className="mt-4 flex items-start gap-3 text-sm text-ink-800 md:text-base">
                <span className="text-marque-500">
                  <IconeHorloge />
                </span>
                <span>
                  Lundi – vendredi : 8h–20h
                  <span className="mt-1 block">Week-end : 9h–18h</span>
                </span>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-extrabold text-ink-900">Nos réseaux sociaux</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-700">
                Les actualités de la flotte et des agences sont publiées sur ces comptes.
              </p>
              <ul className="mt-4 flex flex-wrap gap-3">
                {RESEAUX_SOCIAUX.map((reseau) => (
                  <li key={reseau.nom}>
                    <a
                      href={reseau.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={reseau.nom}
                      title={reseau.nom}
                      className="grid h-11 w-11 place-items-center rounded-full bg-marque-encre text-white hover:bg-marque-500 hover:text-ink-900"
                    >
                      <IconeReseau nom={reseau.nom} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-extrabold text-ink-900">Retrouvez-nous à Libreville</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">
                Le standard est à Libreville. Les départs se font aussi dans les autres provinces.{' '}
                <Link to="/#agences" className="font-semibold text-marque-encre underline">
                  Voir les agences
                </Link>
              </p>
            </section>

            <section>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-extrabold text-ink-900">Ils roulent avec nos partenaires</h2>
                <IconeInformation titre="D’où viennent ces marques">
                  <p>Ce sont les marques des véhicules actuellement publiés par les agences, pas une liste de clients.</p>
                </IconeInformation>
              </div>
              <MarquesPubliees />
            </section>
          </div>

          <div className="order-1 lg:order-2">
            <FormulaireMessage />
          </div>
        </div>

        <section className="mt-14 overflow-hidden rounded-2xl border border-sand-200">
          <iframe
            title="Carte de Libreville"
            src="https://www.openstreetmap.org/export/embed.html?bbox=9.35%2C0.35%2C9.55%2C0.48&layer=mapnik&marker=0.4162%2C9.4536"
            className="h-80 w-full md:h-[420px]"
            loading="lazy"
          />
        </section>
      </main>
      <BandeauReserver />
      <PiedDePage />
    </div>
  )
}
