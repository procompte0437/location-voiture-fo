import { useEffect, useState } from 'react'
import { FenetreModale } from '../../components/ui/FenetreModale'
import api, { messageErreurApi, telechargerFichier } from '../../lib/api'

/**
 * Revue du dossier d’un partenaire : chaque pièce s’ouvre, s’accepte ou se refuse avec un motif.
 * « Demander un complément » renvoie le dossier au partenaire avec un message.
 */
export function DossierDocumentsAdmin({
  partenaireId,
  onFermer,
  surChangement,
}: {
  partenaireId: number | null
  onFermer: () => void
  surChangement: () => void
}) {
  const [dossier, setDossier] = useState<DossierAdmin | null>(null)
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null)
  const [refus, setRefus] = useState<{ genre: string; id: number; motif: string } | null>(null)
  const [complement, setComplement] = useState('')

  async function charger(id: number) {
    try {
      const { data } = await api.get(`/admin/partners/${id}/dossier`)
      setDossier(data.data)
    } catch (err) {
      setMessage({ texte: messageErreurApi(err), erreur: true })
    }
  }

  useEffect(() => {
    setDossier(null)
    setMessage(null)
    setRefus(null)
    setComplement('')
    if (partenaireId) void charger(partenaireId)
  }, [partenaireId])

  async function agir(url: string, corps?: object, succes?: string) {
    if (!partenaireId) return
    setMessage(null)
    try {
      const { data } = await api.post(url, corps)
      setMessage({ texte: succes || data.message || 'Enregistré.', erreur: false })
      setRefus(null)
      await charger(partenaireId)
      surChangement()
    } catch (err) {
      setMessage({ texte: messageErreurApi(err), erreur: true })
    }
  }

  const lignes = (genre: 'partenaire' | 'vehicule', pieces: PieceAdmin[]) =>
    pieces.map((p) => {
      const d = p.document
      return (
        <li key={`${genre}-${p.type}-${d?.id ?? 'x'}`} className="rounded-xl border border-black/8 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-ink-900">
              {p.libelle}
              {p.requise === false && <span className="ml-1 text-xs font-normal text-ink-500">(facultative)</span>}
            </p>
            <span className="text-xs text-ink-600">{d ? LIBELLES[d.status] || d.status : 'Non déposée'}</span>
          </div>
          {d && (
            <>
              <p className="mt-1 text-xs text-ink-500">
                Déposée le {d.depose_le}
                {d.expires_at && ` · expire le ${d.expires_at}${d.echeance === 'expiree' ? ' (expirée)' : ''}`}
              </p>
              {d.rejection_reason && <p className="mt-1 text-xs text-red-700">Motif : {d.rejection_reason}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-black/10 px-2.5 py-1 text-xs"
                  onClick={() => void telechargerFichier(`/admin/documents/${genre}/${d.id}/fichier`, `${p.type}`)}
                >
                  Ouvrir
                </button>
                {d.status !== 'accepted' && (
                  <button
                    type="button"
                    className="rounded-lg bg-[#8c4205] px-2.5 py-1 text-xs font-semibold text-white"
                    onClick={() => void agir(`/admin/documents/${genre}/${d.id}/accepter`)}
                  >
                    Accepter
                  </button>
                )}
                {d.status !== 'rejected' && (
                  <button
                    type="button"
                    className="rounded-lg border border-black/10 px-2.5 py-1 text-xs"
                    onClick={() => setRefus({ genre, id: d.id, motif: '' })}
                  >
                    Refuser
                  </button>
                )}
              </div>
              {refus?.genre === genre && refus.id === d.id && (
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void agir(`/admin/documents/${genre}/${d.id}/refuser`, { motif: refus.motif })
                  }}
                >
                  <input
                    autoFocus
                    className="min-w-0 flex-1 rounded-lg border border-black/10 px-2.5 py-1 text-xs"
                    placeholder="Motif visible par le partenaire"
                    value={refus.motif}
                    onChange={(e) => setRefus({ ...refus, motif: e.target.value })}
                    required
                  />
                  <button type="submit" className="rounded-lg bg-red-700 px-2.5 py-1 text-xs font-semibold text-white">
                    Confirmer
                  </button>
                </form>
              )}
            </>
          )}
        </li>
      )
    })

  return (
    <FenetreModale
      ouvert={partenaireId !== null}
      titre="Dossier du partenaire"
      sousTitre={dossier ? `${dossier.nom} · ${dossier.responsable?.email ?? ''}` : undefined}
      onFermer={onFermer}
      classePanneau="max-h-[min(85vh,48rem)] w-full max-w-2xl"
    >
      {!dossier ? (
        <p className="text-sm text-ink-500">{message?.texte || 'Chargement…'}</p>
      ) : (
        <div className="space-y-5 text-sm">
          {message && <p className={message.erreur ? 'text-red-700' : 'text-forest-800'}>{message.texte}</p>}
          {dossier.motif && <p className="text-xs text-ink-600">Dernier message au partenaire : {dossier.motif}</p>}

          <section>
            <h3 className="mb-2 font-semibold text-ink-900">Pièces de l’entreprise</h3>
            <ul className="space-y-2">{lignes('partenaire', dossier.pieces)}</ul>
          </section>

          {dossier.vehicules.length > 0 && (
            <section>
              <h3 className="mb-2 font-semibold text-ink-900">Pièces des véhicules</h3>
              {dossier.vehicules.map((v) => (
                <div key={v.id} className="mb-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">{v.libelle}</p>
                  <ul className="space-y-2">{lignes('vehicule', v.pieces)}</ul>
                </div>
              ))}
            </section>
          )}

          {dossier.statut !== 'approved' && (
            <form
              className="space-y-2 border-t border-black/8 pt-4"
              onSubmit={(e) => {
                e.preventDefault()
                void agir(
                  `/admin/partners/${dossier.id}/request-info`,
                  { message: complement },
                  'Complément demandé : le dossier repart chez le partenaire.',
                )
                setComplement('')
              }}
            >
              <label className="block text-xs font-semibold text-ink-700" htmlFor="complement">
                Demander un complément
              </label>
              <textarea
                id="complement"
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                rows={2}
                placeholder="Ex. : le RCCM fourni est illisible, merci d’envoyer une copie nette."
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                required
              />
              <button type="submit" className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold">
                Envoyer la demande
              </button>
            </form>
          )}
        </div>
      )}
    </FenetreModale>
  )
}

const LIBELLES: Record<string, string> = {
  pending: 'À vérifier',
  accepted: 'Acceptée',
  rejected: 'Refusée',
}

type DocumentAdmin = {
  id: number
  status: string
  rejection_reason?: string | null
  expires_at?: string | null
  echeance?: string | null
  depose_le?: string | null
}

type PieceAdmin = { type: string; libelle: string; requise?: boolean; document: DocumentAdmin | null }

type DossierAdmin = {
  id: number
  nom: string
  statut: string
  motif?: string | null
  responsable?: { email: string; name: string } | null
  pieces: PieceAdmin[]
  vehicules: { id: number; libelle: string; pieces: PieceAdmin[] }[]
}
