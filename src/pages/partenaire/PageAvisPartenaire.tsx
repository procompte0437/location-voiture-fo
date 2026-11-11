import { useEffect, useState } from 'react'
import { CRITERES_AVIS, Etoiles, type AvisPublic } from '../../components/avis/Avis'
import api, { messageErreurApi } from '../../lib/api'

type AvisLoueur = AvisPublic & {
  statut: string
  reference?: string | null
  immatriculation?: string | null
  repondu_le?: string | null
}

/** Avis reçus par le loueur : il répond publiquement, une seule réponse modifiable. */
export function PageAvisPartenaire() {
  const [donnees, setDonnees] = useState<{ moyenne: number; nombre: number; avis: AvisLoueur[] } | null>(null)
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null)
  const [brouillons, setBrouillons] = useState<Record<number, string>>({})
  const [edition, setEdition] = useState<number | null>(null)

  async function charger() {
    try {
      const { data } = await api.get('/partenaires/moi/avis')
      setDonnees(data.data)
    } catch (err) {
      setMessage({ texte: messageErreurApi(err), erreur: true })
    }
  }

  useEffect(() => {
    void charger()
  }, [])

  async function repondre(id: number) {
    setMessage(null)
    try {
      const { data } = await api.post(`/partenaires/moi/avis/${id}/repondre`, { reponse: brouillons[id] || '' })
      setMessage({ texte: data.message, erreur: false })
      setEdition(null)
      await charger()
    } catch (err) {
      setMessage({ texte: messageErreurApi(err), erreur: true })
    }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Clients</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink-900">Avis</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-500">
        Les clients notent après le retour du véhicule. Votre réponse est publique et s’affiche sous l’avis.
      </p>

      {donnees && (
        <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-5 py-4">
          <span className="font-display text-3xl font-bold text-ink-900">{Number(donnees.moyenne).toFixed(1)}</span>
          <div>
            <Etoiles note={Number(donnees.moyenne)} />
            <p className="text-xs text-ink-500">
              {donnees.nombre} avis publié{donnees.nombre > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {message && (
        <p className={`mt-4 text-sm ${message.erreur ? 'text-red-700' : 'text-forest-800'}`} role="status">
          {message.texte}
        </p>
      )}

      {!donnees ? (
        <p className="mt-6 text-sm text-ink-500">Chargement…</p>
      ) : donnees.avis.length === 0 ? (
        <p className="mt-6 text-sm text-ink-500">Aucun avis pour l’instant. Ils arrivent après les premières locations terminées.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {donnees.avis.map((a) => (
            <li key={a.id} className="rounded-2xl border border-black/8 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-900">{a.auteur}</p>
                  <p className="text-xs text-ink-500">
                    {a.vehicule} {a.immatriculation && `· ${a.immatriculation}`} · {a.reference} · {a.publie_le}
                  </p>
                </div>
                <div className="text-right">
                  <Etoiles note={a.note} />
                  {a.statut === 'hidden' && <p className="text-[11px] text-red-700">Masqué par la modération</p>}
                </div>
              </div>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
                {CRITERES_AVIS.map((c) => (
                  <span key={c.champ}>
                    {c.libelle} : {a.notes?.[c.champ] ?? '—'}/5
                  </span>
                ))}
              </p>
              {a.commentaire && <p className="mt-3 text-sm text-ink-800">{a.commentaire}</p>}

              {a.reponse && edition !== a.id ? (
                <div className="mt-3 border-l-2 border-forest-100 pl-3 text-sm text-ink-600">
                  <p className="text-xs font-semibold text-ink-500">Votre réponse · {a.repondu_le}</p>
                  <p>{a.reponse}</p>
                  <button
                    type="button"
                    className="mt-1 text-xs text-forest-800 underline"
                    onClick={() => {
                      setEdition(a.id)
                      setBrouillons((b) => ({ ...b, [a.id]: a.reponse || '' }))
                    }}
                  >
                    Modifier
                  </button>
                </div>
              ) : (
                <form
                  className="mt-3 flex flex-col gap-2 sm:flex-row"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void repondre(a.id)
                  }}
                >
                  <textarea
                    className="min-h-[2.5rem] flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
                    rows={2}
                    maxLength={2000}
                    placeholder="Remerciez le client ou apportez une précision…"
                    value={brouillons[a.id] || ''}
                    onChange={(e) => setBrouillons((b) => ({ ...b, [a.id]: e.target.value }))}
                    required
                  />
                  <button type="submit" className="h-fit rounded-xl bg-forest-900 px-4 py-2 text-sm font-semibold text-white">
                    Répondre
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
