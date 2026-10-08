import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ContentLoader } from './Spinner'

/** Définition d’une colonne du tableau. */
export type ColonneTableau<T> = {
  cle: string
  libelle: string
  /** Classes Tailwind pour la cellule / en-tête (ex. largeur). */
  classe?: string
  /** Rendu personnalisé ; sinon affiche la valeur brute de la clé. */
  rendu?: (ligne: T) => ReactNode
}

type PropsTableauDonnees<T> = {
  colonnes: ColonneTableau<T>[]
  donnees: T[]
  /** Clé unique de chaque ligne. */
  cleLigne: (ligne: T) => string | number
  /** Texte de recherche (filtre client sur les champs indiqués). */
  champsRecherche?: (ligne: T) => string
  /** Filtres additionnels à gauche du champ recherche. */
  filtresSupplementaires?: ReactNode
  /** Callback bouton actualiser (obligatoire pour le pattern DataTable). */
  surActualiser: () => void | Promise<void>
  chargement?: boolean
  messageVide?: string
  /** Taille de page par défaut. */
  taillePage?: number
  /** Actions par ligne (boutons à droite). */
  actions?: (ligne: T) => ReactNode
}

/**
 * Tableau de données standard LocaGabon.
 * Toujours : barre de filtres, icône d’actualisation, pagination.
 */
export function TableauDonnees<T>({
  colonnes,
  donnees,
  cleLigne,
  champsRecherche,
  filtresSupplementaires,
  surActualiser,
  chargement = false,
  messageVide = 'Aucun résultat.',
  taillePage = 10,
  actions,
}: PropsTableauDonnees<T>) {
  const [recherche, setRecherche] = useState('')
  const [page, setPage] = useState(1)
  const [parPage, setParPage] = useState(taillePage)
  const [actualisation, setActualisation] = useState(false)

  // Remet la page à 1 quand le jeu de données ou les filtres changent.
  useEffect(() => {
    setPage(1)
  }, [donnees, recherche, parPage])

  const filtrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    if (!terme || !champsRecherche) return donnees
    return donnees.filter((ligne) => champsRecherche(ligne).toLowerCase().includes(terme))
  }, [donnees, recherche, champsRecherche])

  const totalPages = Math.max(1, Math.ceil(filtrees.length / parPage))
  const pageCourante = Math.min(page, totalPages)
  const debut = (pageCourante - 1) * parPage
  const pageDonnees = filtrees.slice(debut, debut + parPage)

  async function actualiser() {
    setActualisation(true)
    try {
      await surActualiser()
    } finally {
      setActualisation(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
      {/* Barre filtres + actualisation (toujours présente) */}
      <div className="flex flex-col gap-3 border-b border-black/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {champsRecherche && (
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Filtrer…"
              className="w-full max-w-xs rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-ink-500"
            />
          )}
          {filtresSupplementaires}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={parPage}
            onChange={(e) => setParPage(Number(e.target.value))}
            className="rounded-xl border border-black/10 bg-white px-2.5 py-2 text-sm"
            aria-label="Lignes par page"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void actualiser()}
            disabled={actualisation || chargement}
            title="Actualiser"
            aria-label="Actualiser"
            className="grid h-9 w-9 place-items-center rounded-xl border border-black/10 text-ink-700 transition hover:bg-black/[0.03] disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 ${actualisation || chargement ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 12a8 8 0 0 1 14.2-5.2M20 12a8 8 0 0 1-14.2 5.2" strokeLinecap="round" />
              <path d="M18 2v5h-5M6 22v-5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {chargement ? (
        <ContentLoader />
      ) : filtrees.length === 0 ? (
        <p className="px-5 py-14 text-center text-sm text-ink-500">{messageVide}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/8 bg-black/[0.02] text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  {colonnes.map((col) => (
                    <th key={col.cle} className={`px-4 py-3 font-semibold ${col.classe || ''}`}>
                      {col.libelle}
                    </th>
                  ))}
                  {actions && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {pageDonnees.map((ligne) => (
                  <tr key={cleLigne(ligne)} className="hover:bg-black/[0.015]">
                    {colonnes.map((col) => (
                      <td key={col.cle} className={`px-4 py-3 text-ink-800 ${col.classe || ''}`}>
                        {col.rendu
                          ? col.rendu(ligne)
                          : (() => {
                              const valeur = (ligne as unknown as Record<string, unknown>)[col.cle]
                              return valeur == null || valeur === '' ? '—' : String(valeur)
                            })()}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">{actions(ligne)}</div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (toujours visible) */}
          <div className="flex flex-col gap-2 border-t border-black/8 px-4 py-3 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {filtrees.length} résultat{filtrees.length > 1 ? 's' : ''}
              {' · '}
              page {pageCourante} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pageCourante <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={pageCourante >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
