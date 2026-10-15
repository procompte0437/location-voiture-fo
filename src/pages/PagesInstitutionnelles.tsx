import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PublicHeader } from '../components/layout/Header'
import { PiedDePage } from '../components/layout/PiedDePage'
import { IconeInformation } from '../components/ui/IconeInformation'
import { ListeDeroulanteRecherche } from '../components/ui/ListeDeroulanteRecherche'
import { Spinner } from '../components/ui/Spinner'
import api, { messageErreurApi } from '../lib/api'

const DATE_MISE_A_JOUR = '15 octobre 2026'
const EMAIL_SUPPORT = 'support@locagabon.ga'

const SUJETS_CONTACT = [
  { valeur: 'reservation', libelle: 'Une réservation' },
  { valeur: 'partenaire', libelle: 'Devenir partenaire' },
  { valeur: 'compte', libelle: 'Mon compte' },
  { valeur: 'reclamation', libelle: 'Une réclamation' },
  { valeur: 'autre', libelle: 'Autre demande' },
]

function CoqueInstitutionnelle({
  titre,
  aide,
  miseAJour = false,
  children,
}: {
  titre: string
  aide?: { titre: string; texte: string }
  miseAJour?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 md:px-6 md:py-16">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold text-forest-950 md:text-4xl">{titre}</h1>
          {aide && (
            <IconeInformation titre={aide.titre}>
              <p>{aide.texte}</p>
            </IconeInformation>
          )}
        </div>
        {miseAJour && (
          <p className="mt-3 text-sm text-ink-500">Dernière mise à jour : {DATE_MISE_A_JOUR}</p>
        )}
        <div className="mt-8 space-y-4">{children}</div>
      </main>
      <PiedDePage />
    </div>
  )
}

function Article({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-sand-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink-900">{titre}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-700">{children}</div>
    </section>
  )
}

export function PageCharteConfidentialite() {
  return (
    <CoqueInstitutionnelle
      titre="Charte de confidentialité"
      aide={{
        titre: 'À quoi sert cette charte',
        texte:
          'Elle décrit les données que LV241 collecte pour faire fonctionner la marketplace, et comment les faire rectifier ou supprimer.',
      }}
      miseAJour
    >
      <Article titre="Responsable">
        <p>
          LV241 est une marketplace de location de voitures entre clients et partenaires vérifiés. La
          plateforme est responsable des données traitées pour le compte, la recherche, la réservation
          et le support.
        </p>
      </Article>
      <Article titre="Données collectées">
        <p>Selon l’usage du site, LV241 peut enregistrer :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>identité et contact : nom, adresse e-mail, téléphone ;</li>
          <li>compte : mot de passe stocké sous forme chiffrée, rôle, statut ;</li>
          <li>réservation : lieu, dates, âge du conducteur, véhicule choisi, statut ;</li>
          <li>
            paiement : moyen (Mobile Money ou carte), montant, devise, référence et statut. Le numéro
            complet de carte n’est pas conservé par LV241 ;
          </li>
          <li>dossier partenaire : société, RCCM, NIF, documents transmis pour la validation ;</li>
          <li>
            traces techniques : adresse IP, navigateur, date et action, afin de garder une piste d’audit.
          </li>
        </ul>
      </Article>
      <Article titre="Pourquoi ces données">
        <p>
          Elles servent à créer le compte, afficher les véhicules disponibles, conclure et suivre une
          réservation, calculer la commission convenue avec le partenaire, répondre aux messages, et
          sécuriser la plateforme.
        </p>
        <p>
          Une réservation est transmise au partenaire concerné : il reçoit les informations utiles pour
          remettre le véhicule (identité, contact, dates). Les autres partenaires n’y ont pas accès.
        </p>
      </Article>
      <Article titre="Durée et destinataires">
        <p>
          Les données de compte et de réservation sont conservées pendant la relation, puis le temps
          nécessaire aux obligations comptables et à la résolution d’un éventuel litige. Les journaux
          d’audit ne sont pas modifiés après écriture.
        </p>
        <p>
          LV241 ne vend pas ces données. Elles peuvent être confiées aux prestataires techniques
          strictement nécessaires (hébergement, paiement) et aux autorités lorsque la loi l’exige.
        </p>
      </Article>
      <Article titre="Cookies et session">
        <p>
          La connexion repose sur un jeton conservé dans le navigateur. Des cookies techniques peuvent
          maintenir la session. Le bouton « Paramétrage des cookies », en bas de page, permet d’y
          revenir. Aucun traceur publicitaire n’est déposé pour afficher des annonces de tiers.
        </p>
      </Article>
      <Article titre="Vos droits">
        <p>
          Vous pouvez demander l’accès, la rectification ou la suppression de vos données, ou vous
          opposer à un traitement qui ne serait pas nécessaire à la réservation. Écrivez à{' '}
          <a href={`mailto:${EMAIL_SUPPORT}`} className="font-medium text-forest-800 underline">
            {EMAIL_SUPPORT}
          </a>{' '}
          ou utilisez la page{' '}
          <Link to="/contact" className="font-medium text-forest-800 underline">
            Contactez-nous
          </Link>
          .
        </p>
      </Article>
    </CoqueInstitutionnelle>
  )
}

export function PageConditionsGenerales() {
  return (
    <CoqueInstitutionnelle
      titre="Conditions générales"
      aide={{
        titre: 'Portée des conditions',
        texte:
          'Elles régissent l’usage de LV241. Le contrat de location lui-même est conclu avec le partenaire qui met le véhicule à disposition.',
      }}
      miseAJour
    >
      <Article titre="Objet">
        <p>
          LV241 met en relation des clients et des partenaires (agences, entreprises ou particuliers)
          dont le dossier a été validé. La plateforme publie les offres, enregistre la réservation et
          encaisse le paiement indiqué. Elle n’est pas le loueur du véhicule.
        </p>
      </Article>
      <Article titre="Comptes">
        <p>
          L’inscription demande des informations exactes. Le client gère ses réservations depuis son
          espace. Le partenaire ne publie un véhicule qu’après validation de son dossier par
          l’équipe LV241. Tout compte peut être suspendu en cas d’informations fausses ou d’usage
          abusif.
        </p>
      </Article>
      <Article titre="Réservation et prix">
        <p>
          Le prix affiché dépend du véhicule, des dates et des conditions indiquées sur la fiche. La
          réservation est confirmée selon le statut communiqué après le paiement (Mobile Money ou
          carte). LV241 peut prélever une commission sur la location, au taux convenu avec le
          partenaire. Ce taux ne s’ajoute pas en sus du prix montré au client.
        </p>
      </Article>
      <Article titre="Annulation">
        <p>
          Chaque véhicule indique une politique d’annulation : flexible, modérée ou stricte. Cette
          politique, visible avant la réservation, s’applique à la demande du client. LV241 ou le
          partenaire peut aussi annuler une réservation qui ne peut pas être honorée ; le client en
          est informé et le remboursement suit alors le statut du paiement.
        </p>
      </Article>
      <Article titre="Conducteur et véhicule">
        <p>
          Le conducteur doit avoir l’âge déclaré lors de la recherche et un permis en cours de
          validité. Le partenaire remet un véhicule conforme à l’offre publiée. L’état des lieux, le
          carburant, les franchises et les assurances éventuelles sont ceux précisés par le partenaire
          au moment de la prise en charge.
        </p>
      </Article>
      <Article titre="Responsabilité">
        <p>
          LV241 veille à la validation des partenaires et au bon fonctionnement du service. Le
          partenaire reste responsable de la mise à disposition du véhicule et des obligations du
          loueur. Le client reste responsable de l’usage du véhicule pendant la location.
        </p>
        <p>
          Un litige se signale d’abord via{' '}
          <Link to="/contact" className="font-medium text-forest-800 underline">
            Contactez-nous
          </Link>
          . À défaut d’accord, les tribunaux du Gabon sont compétents, et le droit gabonais s’applique.
        </p>
      </Article>
    </CoqueInstitutionnelle>
  )
}

const RUBRIQUES_PLAN = [
  {
    titre: 'Découvrir',
    liens: [
      { vers: '/', libelle: 'Accueil' },
      { vers: '/vehicules', libelle: 'Location de voitures' },
      { vers: '/faq', libelle: 'Aide' },
    ],
  },
  {
    titre: 'Informations',
    liens: [
      { vers: '/charte-de-confidentialite', libelle: 'Charte de confidentialité' },
      { vers: '/conditions-generales', libelle: 'Conditions générales' },
      { vers: '/contact', libelle: 'Contactez-nous' },
      { vers: '/plan-du-site', libelle: 'Plan du site' },
    ],
  },
  {
    titre: 'Espace client',
    liens: [
      { vers: '/connexion', libelle: 'Connexion' },
      { vers: '/inscription', libelle: 'Créer un compte' },
      { vers: '/mes-reservations', libelle: 'Mes réservations' },
    ],
  },
  {
    titre: 'Partenaires',
    liens: [
      { vers: '/devenir-partenaire', libelle: 'Devenir partenaire' },
      { vers: '/partenaire/inscription', libelle: 'Inscription partenaire' },
      { vers: '/partenaire', libelle: 'Espace partenaire' },
    ],
  },
]

export function PagePlanDuSite() {
  return (
    <CoqueInstitutionnelle
      titre="Plan du site"
      aide={{
        titre: 'Comment lire ce plan',
        texte:
          'Les liens ouvrent les pages publiques. L’espace client et l’espace partenaire demandent une connexion lorsque la page est réservée.',
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {RUBRIQUES_PLAN.map((rubrique) => (
          <section key={rubrique.titre} className="rounded-2xl border border-sand-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-ink-900">{rubrique.titre}</h2>
            <ul className="mt-3 space-y-2">
              {rubrique.liens.map((lien) => (
                <li key={lien.vers}>
                  <Link to={lien.vers} className="text-sm font-medium text-forest-800 underline">
                    {lien.libelle}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </CoqueInstitutionnelle>
  )
}

type FormulaireContact = {
  nom: string
  email: string
  telephone: string
  sujet: string
  message: string
  site_web: string
}

const FORMULAIRE_VIDE: FormulaireContact = {
  nom: '',
  email: '',
  telephone: '',
  sujet: '',
  message: '',
  site_web: '',
}

export function PageContact() {
  const [formulaire, setFormulaire] = useState<FormulaireContact>(FORMULAIRE_VIDE)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)

  function maj(champ: keyof FormulaireContact, valeur: string) {
    setFormulaire((actuel) => ({ ...actuel, [champ]: valeur }))
  }

  async function envoyer(evenement: FormEvent) {
    evenement.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      await api.post('/contact', {
        nom: formulaire.nom.trim(),
        email: formulaire.email.trim(),
        telephone: formulaire.telephone.trim() || null,
        sujet: formulaire.sujet,
        message: formulaire.message.trim(),
        site_web: formulaire.site_web,
      })
      setEnvoye(true)
    } catch (err) {
      setErreur(messageErreurApi(err, 'Envoi impossible. Réessayez dans un instant.'))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <CoqueInstitutionnelle
      titre="Contactez-nous"
      aide={{
        titre: 'Délai de réponse',
        texte: 'L’équipe LV241 répond à l’adresse indiquée, en général sous 24 heures ouvrées.',
      }}
    >
      <section className="rounded-2xl border border-sand-200 bg-white p-6">
        <p className="text-sm text-ink-700">
          Écrivez-nous à{' '}
          <a href={`mailto:${EMAIL_SUPPORT}`} className="font-medium text-forest-800 underline">
            {EMAIL_SUPPORT}
          </a>
          , ou laissez un message ci-dessous.
        </p>

        {envoye ? (
          <p className="mt-6 rounded-xl bg-forest-100 px-4 py-3 text-sm text-forest-900">
            Votre message a bien été envoyé. Nous vous répondrons à l’adresse indiquée.
          </p>
        ) : (
          <form onSubmit={(evenement) => void envoyer(evenement)} className="relative mt-6 space-y-4">
            <label className="block text-sm font-medium text-ink-900">
              Nom
              <input
                required
                value={formulaire.nom}
                onChange={(evenement) => maj('nom', evenement.target.value)}
                autoComplete="name"
                className="mt-1.5 w-full rounded-xl border border-sand-200 px-4 py-3 font-normal"
              />
            </label>
            <label className="block text-sm font-medium text-ink-900">
              E-mail
              <input
                required
                type="email"
                value={formulaire.email}
                onChange={(evenement) => maj('email', evenement.target.value)}
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-sand-200 px-4 py-3 font-normal"
              />
            </label>
            <label className="block text-sm font-medium text-ink-900">
              Téléphone <span className="font-normal text-ink-500">(facultatif)</span>
              <input
                value={formulaire.telephone}
                onChange={(evenement) => maj('telephone', evenement.target.value)}
                autoComplete="tel"
                className="mt-1.5 w-full rounded-xl border border-sand-200 px-4 py-3 font-normal"
              />
            </label>
            <div className="text-sm font-medium text-ink-900">
              <span className="mb-1.5 block">Sujet</span>
              <ListeDeroulanteRecherche
                valeur={formulaire.sujet}
                onChange={(valeur) => maj('sujet', valeur)}
                options={SUJETS_CONTACT}
                placeholder="Choisir un sujet"
                requis
                libelle="Sujet"
              />
            </div>
            <label className="block text-sm font-medium text-ink-900">
              Message
              <textarea
                required
                minLength={20}
                rows={6}
                value={formulaire.message}
                onChange={(evenement) => maj('message', evenement.target.value)}
                className="mt-1.5 w-full rounded-xl border border-sand-200 px-4 py-3 font-normal"
              />
            </label>
            <input
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              value={formulaire.site_web}
              onChange={(evenement) => maj('site_web', evenement.target.value)}
              className="absolute h-px w-px opacity-0"
            />
            {erreur && <p className="text-sm text-red-700">{erreur}</p>}
            <button
              type="submit"
              disabled={envoi}
              className="inline-flex items-center gap-2 rounded-xl bg-forest-800 px-5 py-3 font-semibold text-white disabled:opacity-70"
            >
              {envoi && <Spinner className="h-4 w-4 border-white/40 border-t-white" />}
              {envoi ? 'Envoi…' : 'Envoyer le message'}
            </button>
          </form>
        )}
      </section>
    </CoqueInstitutionnelle>
  )
}
