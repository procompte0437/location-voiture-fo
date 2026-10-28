export type EntreeSavoir = {
  mots: string[]
  reponse: string
}

/** Réponses stables, alignées sur le fonctionnement public de DOTO. */
export const SAVOIR_LOCAL: EntreeSavoir[] = [
  {
    mots: ['bonjour', 'salut', 'hello', 'bonsoir', 'coucou'],
    reponse: 'Bonjour. Je peux vous renseigner sur une réservation, un paiement, les horaires ou les agences.',
  },
  {
    mots: ['merci', 'thanks'],
    reponse: 'Avec plaisir. Une autre question ?',
  },
  {
    mots: ['reserver', 'reservation', 'louer', 'location', 'comment reserver', 'vehicule', 'voiture'],
    reponse:
      'Pour réserver, choisissez un lieu, des dates et l’âge du conducteur, comparez les offres, puis payez. Le prix s’affiche avant la confirmation.',
  },
  {
    mots: ['paiement', 'payer', 'airtel', 'moov', 'carte', 'mobile money', 'moyen'],
    reponse:
      'Vous pouvez payer avec Airtel Money, Moov Money ou une carte bancaire. Certaines agences acceptent aussi un paiement sur place avec acompte.',
  },
  {
    mots: ['prix', 'tarif', 'cout', 'cher', 'frais'],
    reponse:
      'Le prix de la location est indiqué avant la confirmation. Il n’y a pas de frais cachés à la prise en charge.',
  },
  {
    mots: ['assurance', 'assure', 'couvert'],
    reponse: 'Les véhicules sont couverts par une assurance pendant la location.',
  },
  {
    mots: ['partenaire', 'devenir', 'publier', 'dossier'],
    reponse:
      'Une agence, une entreprise ou un particulier peut proposer ses véhicules. Le dossier est examiné avant la publication. L’inscription se fait depuis « Rejoindre ».',
  },
  {
    mots: ['horaire', 'ouvert', 'heure', 'ferme', 'disponibilite'],
    reponse: 'Le standard est ouvert du lundi au vendredi de 8h à 20h, et le week-end de 9h à 18h.',
  },
  {
    mots: ['contact', 'telephone', 'email', 'mail', 'whatsapp', 'joindre', 'appeler', 'numero'],
    reponse:
      'Vous pouvez appeler le +241 01 12 34 56, écrire à support@doto241.com, ou utiliser WhatsApp au +241 04 37 19 73. La page Contact est aussi disponible.',
  },
  {
    mots: ['agence', 'libreville', 'province', 'retrait', 'adresse'],
    reponse:
      'Le standard est à Libreville. Le retrait du véhicule se fait dans l’agence partenaire choisie. Le menu Agences liste les provinces.',
  },
  {
    mots: ['compte', 'inscription', 'inscrire', 'connexion', 'mot de passe', 'connecter'],
    reponse:
      'Créez un compte depuis « Rejoindre », ou connectez-vous avec « Espace client ». Un mot de passe oublié se réinitialise depuis la page de connexion.',
  },
  {
    mots: ['annuler', 'annulation', 'rembours'],
    reponse:
      'L’annulation dépend de la réservation. Ouvrez Mes réservations une fois connecté, ou écrivez-nous depuis la page Contact si le paiement est déjà passé.',
  },
]

export const SUGGESTIONS = ['Comment réserver ?', 'Quels paiements ?', 'Quels horaires ?']

const REPLI =
  'Je n’ai pas la réponse exacte. Reformulez la question, ou passez par la page Contact pour qu’une personne vous réponde.'

function normaliser(texte: string) {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const POLITESSES = new Set(['bonjour', 'salut', 'hello', 'bonsoir', 'coucou', 'merci', 'thanks'])

function scoreEntree(saisie: string, entree: EntreeSavoir) {
  let score = 0
  for (const mot of entree.mots) {
    const cle = normaliser(mot)
    if (!cle || POLITESSES.has(cle)) continue
    if (saisie.includes(cle)) score += cle.includes(' ') ? 3 : 1
  }
  return score
}

/** Choisit la réponse dont les mots collent le mieux à la question. */
export function repondreVisiteur(question: string, savoir: EntreeSavoir[]) {
  const saisie = normaliser(question)
  if (!saisie) return REPLI

  let meilleure = ''
  let scoreMax = 0
  for (const entree of savoir) {
    const score = scoreEntree(saisie, entree)
    if (score > scoreMax) {
      scoreMax = score
      meilleure = entree.reponse
    }
  }
  if (scoreMax > 0) return meilleure

  const politesse = savoir.find((entree) => entree.mots.some((mot) => saisie === normaliser(mot) || saisie.startsWith(`${normaliser(mot)} `)))
  return politesse?.reponse ?? REPLI
}

/** Transforme une question de la FAQ en entrée que le robot peut reconnaître. */
export function savoirDepuisFaq(question: string, reponse: string): EntreeSavoir {
  const mots = normaliser(question)
    .split(' ')
    .filter((mot) => mot.length > 3)
  return { mots: [normaliser(question), ...mots], reponse }
}
