import { useEffect, useState } from 'react'
import { FenetreModale } from '../ui/FenetreModale'
import api, { messageErreurApi } from '../../lib/api'

/** Critères notés par le client (cahier des charges F-CLI-04). */
export const CRITERES_AVIS = [
  { champ: 'rating_cleanliness', libelle: 'Propreté' },
  { champ: 'rating_condition', libelle: 'État du véhicule' },
  { champ: 'rating_welcome', libelle: 'Accueil' },
  { champ: 'rating_value', libelle: 'Rapport qualité/prix' },
] as const

export type AvisPublic = {
  id: number
  auteur: string
  note: number
  notes?: Record<string, number | null>
  commentaire?: string | null
  vehicule?: string | null
  reponse?: string | null
  publie_le?: string | null
}

export function Etoiles({ note, taille = 'text-sm' }: { note: number; taille?: string }) {
  const arrondi = Math.round(note)
  return (
    <span className={`${taille} tracking-tight text-gold-600`} aria-label={`${note} sur 5`}>
      {'★'.repeat(arrondi)}
      <span className="text-black/15">{'★'.repeat(5 - arrondi)}</span>
    </span>
  )
}

function SaisieEtoiles({
  libelle,
  valeur,
  surChoix,
}: {
  libelle: string
  valeur: number
  surChoix: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink-700">{libelle}</span>
      <div role="radiogroup" aria-label={libelle} className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valeur === n}
            aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
            onClick={() => surChoix(n)}
            className={`px-0.5 text-2xl leading-none transition ${n <= valeur ? 'text-gold-600' : 'text-black/15 hover:text-gold-500'}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

/** Fenêtre de notation d’une location terminée. */
export function FormulaireAvis({
  reservation,
  onFermer,
  surEnvoye,
}: {
  reservation: { id: number; reference: string } | null
  onFermer: () => void
  surEnvoye: (message: string) => void
}) {
  const [notes, setNotes] = useState<Record<string, number>>({})
  const [commentaire, setCommentaire] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    setNotes({})
    setCommentaire('')
    setErreur('')
  }, [reservation?.id])

  const complet = CRITERES_AVIS.every((c) => notes[c.champ])

  async function envoyer() {
    if (!reservation) return
    setEnvoi(true)
    setErreur('')
    try {
      const { data } = await api.post(`/bookings/${reservation.id}/avis`, { ...notes, comment: commentaire || undefined })
      surEnvoye(data.message)
    } catch (err) {
      setErreur(messageErreurApi(err, 'Votre avis n’a pas pu être envoyé.'))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <FenetreModale ouvert={reservation !== null} titre="Donner mon avis" sousTitre={reservation?.reference} onFermer={onFermer}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void envoyer()
        }}
      >
        <div className="space-y-2">
          {CRITERES_AVIS.map((c) => (
            <SaisieEtoiles
              key={c.champ}
              libelle={c.libelle}
              valeur={notes[c.champ] || 0}
              surChoix={(n) => setNotes((a) => ({ ...a, [c.champ]: n }))}
            />
          ))}
        </div>
        <label className="block text-sm text-ink-700">
          Commentaire (facultatif)
          <textarea
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            rows={3}
            maxLength={2000}
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Ce qui vous a plu, ce qui pourrait être amélioré…"
          />
        </label>
        <p className="text-xs text-ink-500">Votre prénom et l’initiale de votre nom s’affichent avec l’avis.</p>
        {erreur && <p className="text-sm text-red-700">{erreur}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onFermer} className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold">
            Plus tard
          </button>
          <button
            type="submit"
            disabled={!complet || envoi}
            className="rounded-xl bg-forest-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {envoi ? 'Envoi…' : 'Publier mon avis'}
          </button>
        </div>
      </form>
    </FenetreModale>
  )
}

/** Avis sur le loueur du véhicule, sans le nommer. */
export function BlocAvisVehicule({ vehiculeId }: { vehiculeId: string | number | undefined }) {
  const [donnees, setDonnees] = useState<{
    moyenne: number
    nombre: number
    criteres: { libelle: string; moyenne: number }[]
    avis: AvisPublic[]
  } | null>(null)
  const [tout, setTout] = useState(false)

  useEffect(() => {
    if (!vehiculeId) return
    api
      .get(`/vehicles/${vehiculeId}/avis`)
      .then((r) => setDonnees(r.data.data))
      .catch(() => setDonnees(null))
  }, [vehiculeId])

  if (!donnees) return null

  return (
    <div className="mt-4 border-t border-sand-200 pt-3 text-sm">
      <p className="font-semibold">Avis clients</p>
      {donnees.nombre === 0 ? (
        <p className="mt-1 text-xs text-ink-500">Pas encore d’avis pour ce loueur.</p>
      ) : (
        <>
          <p className="mt-1 flex items-center gap-2">
            <Etoiles note={donnees.moyenne} />
            <span className="font-semibold">{donnees.moyenne.toFixed(1)}</span>
            <span className="text-xs text-ink-500">({donnees.nombre} avis)</span>
          </p>
          <ul className="mt-2 space-y-0.5 text-xs text-ink-600">
            {donnees.criteres.map((c) => (
              <li key={c.libelle} className="flex justify-between">
                <span>{c.libelle}</span>
                <span>{c.moyenne.toFixed(1)}</span>
              </li>
            ))}
          </ul>
          <ul className="mt-3 space-y-3">
            {(tout ? donnees.avis : donnees.avis.slice(0, 3)).map((a) => (
              <li key={a.id} className="rounded-lg bg-sand-50 p-2.5">
                <p className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-ink-800">{a.auteur}</span>
                  <Etoiles note={a.note} taille="text-xs" />
                </p>
                {a.commentaire && <p className="mt-1 text-xs text-ink-700">{a.commentaire}</p>}
                {a.reponse && <p className="mt-1 border-l-2 border-forest-100 pl-2 text-xs text-ink-500">Réponse du loueur : {a.reponse}</p>}
              </li>
            ))}
          </ul>
          {donnees.avis.length > 3 && (
            <button type="button" className="mt-2 text-xs text-forest-800 underline" onClick={() => setTout((v) => !v)}>
              {tout ? 'Voir moins' : `Voir les ${donnees.avis.length} avis`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
