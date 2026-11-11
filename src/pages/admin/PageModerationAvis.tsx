import { useEffect, useState } from 'react'
import { Etoiles, type AvisPublic } from '../../components/avis/Avis'
import { TableauDonnees } from '../../components/ui/TableauDonnees'
import api, { messageErreurApi } from '../../lib/api'

type AvisAdmin = AvisPublic & {
  statut: string
  reference?: string | null
  immatriculation?: string | null
  client_email?: string | null
  partenaire?: string | null
}

/** Modération : masquer retire l’avis du site et de la note du loueur ; le motif va au journal d’audit. */
export function PageModerationAvis() {
  const [avis, setAvis] = useState<AvisAdmin[]>([])
  const [filtre, setFiltre] = useState('')
  const [chargement, setChargement] = useState(true)
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/admin/avis', { params: filtre ? { statut: filtre } : {} })
      setAvis(data.data || [])
    } catch (err) {
      setMessage({ texte: messageErreurApi(err), erreur: true })
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    void charger()
  }, [filtre])

  async function moderer(a: AvisAdmin, statut: 'published' | 'hidden') {
    let motif: string | null = null
    if (statut === 'hidden') {
      motif = window.prompt('Motif du masquage (journal d’audit)')
      if (!motif) return
    }
    setMessage(null)
    try {
      const { data } = await api.post(`/admin/avis/${a.id}/moderer`, { statut, motif })
      setMessage({ texte: data.message, erreur: false })
      await charger()
    } catch (err) {
      setMessage({ texte: messageErreurApi(err), erreur: true })
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">Avis clients</h1>
        <p className="mt-1.5 max-w-xl text-sm text-ink-500">
          Les avis sont publiés dès leur dépôt. Masquez un avis injurieux ou hors sujet : il sort du site et de la note du loueur.
        </p>
      </div>
      {message && (
        <p className={`mb-4 text-sm ${message.erreur ? 'text-red-700' : 'text-forest-800'}`} role="status">
          {message.texte}
        </p>
      )}
      <div className="mb-4 flex gap-2">
        {[
          ['', 'Tous'],
          ['published', 'Publiés'],
          ['hidden', 'Masqués'],
        ].map(([cle, libelle]) => (
          <button
            key={cle}
            type="button"
            onClick={() => setFiltre(cle)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              filtre === cle ? 'bg-[#8c4205] text-white' : 'border border-black/10 bg-white text-ink-700'
            }`}
          >
            {libelle}
          </button>
        ))}
      </div>
      <TableauDonnees
        colonnes={[
          {
            cle: 'note',
            libelle: 'Note',
            rendu: (a) => (
              <div>
                <Etoiles note={a.note} />
                <p className="text-xs text-ink-500">{a.publie_le}</p>
              </div>
            ),
          },
          {
            cle: 'commentaire',
            libelle: 'Avis',
            rendu: (a) => (
              <div className="max-w-md">
                <p className="text-sm text-ink-800">{a.commentaire || <span className="text-ink-500">Sans commentaire</span>}</p>
                {a.reponse && <p className="mt-1 text-xs text-ink-500">Réponse : {a.reponse}</p>}
              </div>
            ),
          },
          {
            cle: 'partenaire',
            libelle: 'Loueur / véhicule',
            rendu: (a) => (
              <div>
                <p>{a.partenaire}</p>
                <p className="text-xs text-ink-500">
                  {a.vehicule} · {a.immatriculation}
                </p>
              </div>
            ),
          },
          {
            cle: 'client',
            libelle: 'Client',
            rendu: (a) => (
              <div>
                <p>{a.auteur}</p>
                <p className="text-xs text-ink-500">{a.client_email}</p>
              </div>
            ),
          },
          {
            cle: 'statut',
            libelle: 'Statut',
            rendu: (a) => (a.statut === 'hidden' ? 'Masqué' : 'Publié'),
          },
        ]}
        donnees={avis}
        cleLigne={(a) => a.id}
        champsRecherche={(a) => `${a.commentaire} ${a.partenaire} ${a.auteur} ${a.client_email} ${a.reference} ${a.immatriculation}`}
        surActualiser={charger}
        chargement={chargement}
        messageVide="Aucun avis."
        actions={(a) =>
          a.statut === 'hidden' ? (
            <button type="button" className="rounded-lg border border-black/10 px-3 py-1.5 text-xs" onClick={() => void moderer(a, 'published')}>
              Republier
            </button>
          ) : (
            <button type="button" className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-red-800" onClick={() => void moderer(a, 'hidden')}>
              Masquer
            </button>
          )
        }
      />
    </div>
  )
}
