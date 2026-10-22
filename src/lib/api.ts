import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('locagabon_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Laisse le navigateur poser le boundary multipart pour FormData.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

export default api

/** Télécharge un PDF ou un CSV produit par Laravel, avec le jeton de session. */
export async function telechargerFichier(url: string, nom: string) {
  const { data } = await api.get(url, { responseType: 'blob' })
  const lien = URL.createObjectURL(data)
  const ancre = document.createElement('a')
  ancre.href = lien
  ancre.download = nom
  ancre.click()
  URL.revokeObjectURL(lien)
}

export function formatXaf(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Libellés FR pour les clés Laravel renvoyées brutes (ex. validation.unique). */
const MESSAGES_VALIDATION: Record<string, string> = {
  'validation.unique': 'Cette valeur est déjà utilisée.',
  'validation.required': 'Ce champ est obligatoire.',
  'validation.email': 'L’adresse e-mail n’est pas valide.',
  'validation.confirmed': 'La confirmation ne correspond pas.',
  'validation.min.string': 'La valeur est trop courte.',
  'validation.max.string': 'La valeur est trop longue.',
}

const MESSAGES_CHAMP: Record<string, Partial<Record<string, string>>> = {
  email: {
    'validation.unique':
      'Cette adresse e-mail est déjà utilisée. Connectez-vous ou choisissez une autre adresse.',
    unique:
      'Cette adresse e-mail est déjà utilisée. Connectez-vous ou choisissez une autre adresse.',
  },
  phone: {
    'validation.unique': 'Ce numéro de téléphone est déjà associé à un compte.',
    unique: 'Ce numéro de téléphone est déjà associé à un compte.',
  },
  password: {
    'validation.confirmed': 'La confirmation du mot de passe ne correspond pas.',
    confirmed: 'La confirmation du mot de passe ne correspond pas.',
  },
}

function traduireErreurChamp(champ: string, cle: string): string {
  const explicite = MESSAGES_CHAMP[champ]?.[cle]
  if (explicite) return explicite
  if (MESSAGES_VALIDATION[cle]) return MESSAGES_VALIDATION[cle]
  // Déjà un message lisible (pas une clé Laravel).
  if (!cle.startsWith('validation.')) return cle
  return 'Vérifiez les informations saisies.'
}

/**
 * Extrait un message d’erreur explicite depuis une réponse API Axios / Laravel.
 */
export function messageErreurApi(err: unknown, repli = 'Une erreur est survenue.'): string {
  const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    ?.response?.data
  if (!data) return repli

  const erreurs = data.errors
  if (erreurs && typeof erreurs === 'object') {
    for (const [champ, messages] of Object.entries(erreurs)) {
      const premier = Array.isArray(messages) ? messages[0] : undefined
      if (premier) return traduireErreurChamp(champ, premier)
    }
  }

  if (data.message && !data.message.startsWith('validation.')) return data.message
  return repli
}
