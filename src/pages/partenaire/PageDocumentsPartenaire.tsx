import { useEffect, useMemo, useState } from 'react'
import api, { messageErreurApi, telechargerFichier } from '../../lib/api'

/**
 * Dossier du loueur : pièces de l’entreprise et de chaque véhicule.
 * Une assurance ou une visite technique expirée retire le véhicule de la recherche.
 */
export function PageDocumentsPartenaire() {
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [chargement, setChargement] = useState(true)
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null)
  const [vehiculeId, setVehiculeId] = useState<number | null>(null)
  const [envoi, setEnvoi] = useState<string | null>(null)

  async function charger() {
    try {
      const { data } = await api.get('/partenaires/moi/documents')
      setDossier(data.data)
      setVehiculeId((actuel) => actuel ?? data.data.vehicules[0]?.id ?? null)
    } catch (err) {
      setMessage({ texte: messageErreurApi(err), erreur: true })
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    void charger()
  }, [])

  async function deposer(url: string, cle: string, type: string, fichier: File, expiration: string) {
    setEnvoi(cle)
    setMessage(null)
    const corps = new FormData()
    corps.append('type', type)
    corps.append('fichier', fichier)
    if (expiration) corps.append('expires_at', expiration)
    try {
      const { data } = await api.post(url, corps)
      setMessage({ texte: data.message, erreur: false })
      await charger()
    } catch (err) {
      setMessage({ texte: messageErreurApi(err), erreur: true })
    } finally {
      setEnvoi(null)
    }
  }

  const vehicule = useMemo(() => dossier?.vehicules.find((v) => v.id === vehiculeId) ?? null, [dossier, vehiculeId])

  if (chargement) return <p className="text-sm text-ink-500">Chargement du dossier…</p>
  if (!dossier) return <p className="text-sm text-red-700">{message?.texte || 'Dossier indisponible.'}</p>

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Dossier</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink-900">Documents</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-500">
        Les pièces sont vérifiées par l’équipe DOTO et restent privées. PDF ou photo, 5 Mo au plus. Un nouvel envoi
        remplace la pièce du même type.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-600">Dossier :</span>
        <Pastille statut={dossier.statut_dossier} />
        {dossier.complet ? (
          <span className="text-forest-800">Toutes les pièces requises sont déposées.</span>
        ) : (
          <span className="text-ink-600">Des pièces requises manquent.</span>
        )}
      </div>
      {dossier.statut_dossier === 'info_requested' && dossier.motif_dossier && (
        <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Complément demandé : {dossier.motif_dossier}
        </p>
      )}

      {dossier.alertes.length > 0 && (
        <ul className="mt-4 space-y-1 rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-ink-700">
          {dossier.alertes.map((a) => (
            <li key={a}>• {a}</li>
          ))}
        </ul>
      )}

      {message && (
        <p className={`mt-4 text-sm ${message.erreur ? 'text-red-700' : 'text-forest-800'}`} role="status">
          {message.texte}
        </p>
      )}

      <h2 className="mt-8 mb-3 font-display text-xl font-bold text-ink-900">Pièces de l’entreprise</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {dossier.pieces.map((p) => (
          <CartePiece
            key={p.type}
            piece={p}
            envoiEnCours={envoi === `p-${p.type}`}
            surTelecharger={(d) => void telechargerFichier(`/partenaires/moi/documents/${d.id}/fichier`, `${p.type}`)}
            surDeposer={(f, e) => void deposer('/partenaires/moi/documents', `p-${p.type}`, p.type, f, e)}
          />
        ))}
      </div>

      <h2 className="mt-10 mb-3 font-display text-xl font-bold text-ink-900">Pièces des véhicules</h2>
      {dossier.vehicules.length === 0 ? (
        <p className="text-sm text-ink-500">Ajoutez d’abord un véhicule à votre flotte.</p>
      ) : (
        <>
          <select
            className="w-full max-w-md rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            value={vehiculeId ?? ''}
            onChange={(e) => setVehiculeId(Number(e.target.value))}
            aria-label="Véhicule"
          >
            {dossier.vehicules.map((v) => (
              <option key={v.id} value={v.id}>
                {v.libelle} · {v.plate_number}
                {v.masque ? ' — retiré de la recherche' : ''}
              </option>
            ))}
          </select>
          {vehicule && (
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {vehicule.pieces.map((p) => (
                <CartePiece
                  key={p.type}
                  piece={{ ...p, requise: true }}
                  envoiEnCours={envoi === `v-${vehicule.id}-${p.type}`}
                  surTelecharger={(d) =>
                    void telechargerFichier(`/partenaires/moi/documents-vehicules/${d.id}/fichier`, `${p.type}-${vehicule.plate_number}`)
                  }
                  surDeposer={(f, e) =>
                    void deposer(`/partenaires/moi/vehicules/${vehicule.id}/documents`, `v-${vehicule.id}-${p.type}`, p.type, f, e)
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CartePiece({
  piece,
  envoiEnCours,
  surDeposer,
  surTelecharger,
}: {
  piece: Piece
  envoiEnCours: boolean
  surDeposer: (fichier: File, expiration: string) => void
  surTelecharger: (document: DocumentDepose) => void
}) {
  const [fichier, setFichier] = useState<File | null>(null)
  const [expiration, setExpiration] = useState('')
  const d = piece.document
  const demain = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink-900">{piece.libelle}</p>
          <p className="text-xs text-ink-500">{piece.requise ? 'Requise' : 'Facultative'}</p>
        </div>
        <Pastille statut={d ? d.status : 'absent'} />
      </div>

      {d && (
        <div className="mt-2 space-y-1 text-xs text-ink-600">
          <p>
            Déposée le {d.depose_le}
            {d.expires_at && (
              <>
                {' · '}expire le {d.expires_at}
                {d.echeance === 'expiree' && <strong className="text-red-700"> (expirée)</strong>}
                {d.echeance === 'bientot' && <strong className="text-amber-700"> (bientôt)</strong>}
              </>
            )}
          </p>
          {d.rejection_reason && <p className="text-red-700">Motif du refus : {d.rejection_reason}</p>}
          <button type="button" className="text-forest-800 underline" onClick={() => surTelecharger(d)}>
            Voir le fichier{d.nom_original ? ` (${d.nom_original})` : ''}
          </button>
        </div>
      )}

      <form
        className="mt-3 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (fichier) surDeposer(fichier, expiration)
        }}
      >
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="max-w-full text-xs"
          onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
          aria-label={`Fichier : ${piece.libelle}`}
          required
        />
        {piece.avec_expiration && (
          <label className="flex items-center gap-1 text-xs text-ink-600">
            Expire le
            <input
              type="date"
              min={demain}
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              className="rounded-lg border border-black/10 px-2 py-1 text-xs"
            />
          </label>
        )}
        <button
          type="submit"
          disabled={!fichier || envoiEnCours}
          className="rounded-lg bg-forest-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {envoiEnCours ? 'Envoi…' : d ? 'Remplacer' : 'Envoyer'}
        </button>
      </form>
    </div>
  )
}

const LIBELLES: Record<string, string> = {
  absent: 'À déposer',
  pending: 'En vérification',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  approved: 'Validé',
  info_requested: 'Complément demandé',
  rejected_dossier: 'Refusé',
  suspended: 'Suspendu',
}

const COULEURS: Record<string, string> = {
  absent: 'border-amber-300 bg-amber-50 text-amber-900',
  rejected: 'border-red-200 bg-red-50 text-red-800',
  accepted: 'border-forest-100 bg-forest-50 text-forest-900',
  approved: 'border-forest-100 bg-forest-50 text-forest-900',
  info_requested: 'border-amber-300 bg-amber-50 text-amber-900',
}

function Pastille({ statut }: { statut: string }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
        COULEURS[statut] || 'border-black/10 bg-black/[0.03] text-ink-700'
      }`}
    >
      {LIBELLES[statut] || (statut === 'pending' ? 'En attente' : statut)}
    </span>
  )
}

type DocumentDepose = {
  id: number
  status: string
  rejection_reason?: string | null
  expires_at?: string | null
  echeance?: 'a_jour' | 'bientot' | 'expiree' | null
  nom_original?: string | null
  depose_le?: string | null
}

type Piece = {
  type: string
  libelle: string
  requise: boolean
  avec_expiration: boolean
  document: DocumentDepose | null
}

type Dossier = {
  statut_dossier: string
  motif_dossier?: string | null
  complet: boolean
  alertes: string[]
  pieces: Piece[]
  vehicules: {
    id: number
    libelle: string
    plate_number: string
    masque: boolean
    pieces: Omit<Piece, 'requise'>[]
  }[]
}
