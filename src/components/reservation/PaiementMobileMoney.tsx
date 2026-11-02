import { useEffect, useRef, useState } from 'react'
import api, { formatXaf, messageErreurApi } from '../../lib/api'

type Etat = 'saisie' | 'attente' | 'reussi' | 'echec'

const INTERVALLE_MS = 5000

/** Paiement Airtel Money ou Moov Money : le client valide la demande reçue sur son téléphone. */
export function PaiementMobileMoney({
  reservationId,
  reference,
  moyen,
  libelleMoyen,
  montant,
  telephone,
  onPaye,
}: {
  reservationId: number | string
  reference: string
  moyen: string
  libelleMoyen: string
  montant: number
  telephone?: string
  onPaye: () => void
}) {
  const [numero, setNumero] = useState(telephone || '')
  const [etat, setEtat] = useState<Etat>('saisie')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const minuteur = useRef<number | null>(null)

  function arreter() {
    if (minuteur.current !== null) window.clearInterval(minuteur.current)
    minuteur.current = null
  }

  useEffect(() => arreter, [])

  function appliquer(statut: string) {
    if (statut === 'paid') {
      arreter()
      setEtat('reussi')
      onPaye()
    } else if (statut === 'failed' || statut === 'abandoned') {
      arreter()
      setEtat('echec')
    } else {
      setEtat('attente')
    }
  }

  async function verifier() {
    try {
      const { data } = await api.get(`/bookings/${reservationId}/paiement`, { params: { reference } })
      appliquer(data.data.statut)
    } catch {
      // Une coupure réseau ne dit rien du paiement : la vérification suivante tranchera.
    }
  }

  async function payer() {
    setEnvoi(true)
    setErreur('')
    try {
      const { data } = await api.post(`/bookings/${reservationId}/paiement-mobile`, { reference, moyen, numero })
      appliquer(data.data.statut)
      if (data.data.statut === 'pending') {
        arreter()
        minuteur.current = window.setInterval(() => void verifier(), INTERVALLE_MS)
      }
    } catch (err) {
      setErreur(messageErreurApi(err, 'Le paiement n’a pas pu être lancé.'))
    } finally {
      setEnvoi(false)
    }
  }

  if (etat === 'reussi') {
    return (
      <div className="mt-6 rounded-xl border border-forest-600/15 bg-forest-50/60 px-4 py-3 text-left text-sm text-forest-900">
        Paiement reçu. Votre demande part chez le loueur pour confirmation.
      </div>
    )
  }

  if (etat === 'attente') {
    return (
      <div className="mt-6 rounded-xl border border-forest-600/15 bg-forest-50/60 px-4 py-3 text-left text-sm text-ink-700" role="status">
        <p className="font-semibold text-forest-900">Validez sur votre téléphone</p>
        <p className="mt-1">
          Entrez votre code {libelleMoyen} sur la demande reçue au {numero}. Cette page se met à jour seule.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-xl border border-forest-600/15 bg-forest-50/60 px-4 py-4 text-left text-sm text-ink-700">
      <p className="font-semibold text-forest-900">
        {etat === 'echec' ? 'Le paiement n’a pas abouti' : `Payer avec ${libelleMoyen}`}
      </p>
      {etat === 'echec' && <p className="mt-1">Rien n’a été confirmé. Vérifiez votre solde, puis réessayez.</p>}
      <label className="mt-3 block font-medium" htmlFor="numero-mobile-money">
        Numéro à débiter
      </label>
      <input
        id="numero-mobile-money"
        type="tel"
        value={numero}
        onChange={(e) => setNumero(e.target.value)}
        placeholder="074 11 11 11"
        className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-forest-700"
      />
      {erreur && <p className="mt-2 text-red-800">{erreur}</p>}
      <button
        type="button"
        disabled={envoi || !numero.trim()}
        onClick={() => void payer()}
        className="mt-3 w-full rounded-xl bg-forest-800 py-3 font-semibold text-white disabled:opacity-50"
      >
        {envoi ? 'Envoi…' : `Payer ${formatXaf(montant)}`}
      </button>
    </div>
  )
}
