import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BoutonToutDeplier, IconeChevron } from '../../components/ui/IconeDepliage'
import { SpinnerPourcentage } from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import api, { formatXaf } from '../../lib/api'

type VoitureEvaluee = {
  id: number
  nom: string
  immatriculation?: string | null
  reservations_count: number
}

type PartenaireEvalue = {
  id: number
  nom: string
  ville?: string | null
  statut: string
  vehicules_count: number
  reservations_count: number
  montant_total: number
  vehicules: VoitureEvaluee[]
}

const LIBELLES_STATUT: Record<string, string> = {
  pending: 'En attente',
  info_requested: 'Infos demandées',
  approved: 'Validé',
  rejected: 'Refusé',
  suspended: 'Suspendu',
}

function libelleCompte(nombre: number, singulier: string, pluriel: string) {
  return `${nombre} ${nombre > 1 ? pluriel : singulier}`
}

/**
 * Chaque prestataire se plie et se déplie.
 * Déplié, le tableau liste toutes ses voitures et leurs réservations.
 */
export function PageEvaluationPartenaires() {
  const { user, loading: authLoading } = useAuth()
  const [lignes, setLignes] = useState<PartenaireEvalue[]>([])
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [ouverts, setOuverts] = useState<Set<number>>(new Set())

  const charger = useCallback(async () => {
    setChargement(true)
    try {
      const { data } = await api.get('/admin/evaluation-partenaires')
      const recus = (data.data || []) as PartenaireEvalue[]
      setLignes(recus)
      setOuverts(new Set(recus[0] ? [recus[0].id] : []))
    } catch {
      setLignes([])
      setOuverts(new Set())
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || user?.role !== 'super_admin') return
    void charger()
  }, [authLoading, user, charger])

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    if (!terme) return lignes
    return lignes.filter((p) => {
      const texte = [p.nom, p.ville, ...p.vehicules.map((v) => `${v.nom} ${v.immatriculation || ''}`)]
        .join(' ')
        .toLowerCase()
      return texte.includes(terme)
    })
  }, [lignes, recherche])

  function basculer(id: number) {
    setOuverts((actuel) => {
      const suivant = new Set(actuel)
      if (suivant.has(id)) suivant.delete(id)
      else suivant.add(id)
      return suivant
    })
  }

  function toutDeplier() {
    setOuverts(new Set(visibles.map((p) => p.id)))
  }

  function toutPlier() {
    setOuverts(new Set())
  }

  if (!authLoading && user?.role !== 'super_admin') {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Évaluation des partenaires
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          Le nom de chaque prestataire, puis la liste de toutes ses voitures. Dépliez un bloc pour
          lire le tableau.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un prestataire ou une voiture"
          className="min-w-[16rem] flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
          aria-label="Rechercher un prestataire ou une voiture"
        />
        <BoutonToutDeplier sens="ouvrir" onClick={toutDeplier} desactive={chargement || visibles.length === 0} />
        <BoutonToutDeplier sens="fermer" onClick={toutPlier} desactive={chargement || visibles.length === 0} />
        <button
          type="button"
          onClick={() => void charger()}
          disabled={chargement}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink-800 disabled:opacity-40"
          aria-label="Actualiser"
        >
          Actualiser
        </button>
      </div>

      {chargement ? (
        <div className="rounded-2xl border border-black/8 bg-white">
          <SpinnerPourcentage />
        </div>
      ) : visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/12 bg-white p-8 text-center text-sm text-ink-500">
          Aucun prestataire pour cette recherche.
        </div>
      ) : (
        <div className="space-y-3">
          {visibles.map((p, index) => {
            const ouvert = ouverts.has(p.id)
            return (
              <section key={p.id} className="overflow-hidden rounded-2xl border border-black/8 bg-white">
                <button
                  type="button"
                  onClick={() => basculer(p.id)}
                  aria-expanded={ouvert}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-black/[0.02]"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#8c4205]/10 text-sm font-bold text-[#8c4205]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold text-ink-900">{p.nom}</span>
                    <span className="mt-0.5 block text-sm text-ink-500">
                      {p.ville ? `${p.ville} · ` : ''}
                      {LIBELLES_STATUT[p.statut] || p.statut}
                      {' · '}
                      {libelleCompte(p.vehicules_count, 'voiture', 'voitures')}
                      {' · '}
                      {libelleCompte(p.reservations_count, 'réservation', 'réservations')}
                      {' · '}
                      {formatXaf(p.montant_total)}
                    </span>
                  </span>
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-black/10 text-[#8c4205]"
                    title={ouvert ? 'Plier' : 'Déplier'}
                  >
                    <IconeChevron ouvert={ouvert} />
                  </span>
                </button>
                {ouvert && (
                  <div className="border-t border-black/8">
                    {p.vehicules.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-ink-500">Aucune voiture rattachée.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[32rem] text-left text-sm">
                          <thead className="bg-[#f4f5f4] text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                            <tr>
                              <th className="px-4 py-3">Voiture</th>
                              <th className="px-4 py-3">Immatriculation</th>
                              <th className="px-4 py-3 text-right">Réservations</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.vehicules.map((v) => (
                              <tr key={v.id} className="border-t border-black/6">
                                <td className="px-4 py-3 font-medium text-ink-900">{v.nom || 'Véhicule'}</td>
                                <td className="px-4 py-3 text-ink-600">{v.immatriculation || '—'}</td>
                                <td className="px-4 py-3 text-right font-semibold text-[#8c4205]">
                                  {v.reservations_count}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
