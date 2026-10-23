import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BoutonActionCrud } from './BoutonActionCrud'
import { FenetreModale } from './FenetreModale'
import { SpinnerPourcentage } from './Spinner'

/** Définition d’une colonne du tableau. */
export type ColonneTableau<T> = {
  cle: string
  libelle: string
  /** Classes Tailwind pour la cellule / en-tête (ex. largeur). */
  classe?: string
  /** Rendu personnalisé ; sinon affiche la valeur brute de la clé. */
  rendu?: (ligne: T) => ReactNode
}

/** Tailles proposées : l’utilisateur choisit combien de lignes voir. */
const TAILLES_PAGE = [3, 5, 10, 20, 50]

type PropsTableauDonnees<T> = {
  colonnes: ColonneTableau<T>[]
  donnees: T[]
  /** Clé unique de chaque ligne. */
  cleLigne: (ligne: T) => string | number
  /** Texte de recherche (filtre client sur les champs indiqués). */
  champsRecherche?: (ligne: T) => string
  /** Filtres métiers, affichés dans le même menu que la recherche. */
  filtresSupplementaires?: ReactNode
  /** Pastille sur le menu quand un filtre métier est actif. */
  filtreActif?: boolean
  /** Callback bouton actualiser (obligatoire pour le pattern DataTable). */
  surActualiser: () => void | Promise<void>
  chargement?: boolean
  messageVide?: string
  /** Taille de page par défaut. */
  taillePage?: number
  /** Actions par ligne (icônes à droite). */
  actions?: (ligne: T) => ReactNode
  /** Fiche ouverte dans un modal par l’œil « voir le détail ». */
  renduDetail?: (ligne: T) => ReactNode
  /** Titre du modal de détail. */
  titreDetail?: (ligne: T) => string
  sousTitreDetail?: (ligne: T) => string | undefined
}

/**
 * Tableau de données standard DOTO.
 * Recherche dans un menu déroulant, actualisation, pagination, spinner avec pourcentage.
 */
export function TableauDonnees<T>({
  colonnes,
  donnees,
  cleLigne,
  champsRecherche,
  filtresSupplementaires,
  filtreActif = false,
  surActualiser,
  chargement = false,
  messageVide = 'Aucun résultat.',
  taillePage = 10,
  actions,
  renduDetail,
  titreDetail,
  sousTitreDetail,
}: PropsTableauDonnees<T>) {
  const [recherche, setRecherche] = useState('')
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [page, setPage] = useState(1)
  const [parPage, setParPage] = useState(taillePage)
  const [actualisation, setActualisation] = useState(false)
  const [ligneOuverte, setLigneOuverte] = useState<string | number | null>(null)
  const zoneMenu = useRef<HTMLDivElement>(null)

  const montreActions = Boolean(actions || renduDetail)
  const montreMenu = Boolean(champsRecherche || filtresSupplementaires)
  const tailles = TAILLES_PAGE.includes(taillePage)
    ? TAILLES_PAGE
    : [...TAILLES_PAGE, taillePage].sort((a, b) => a - b)

  function basculerDetail(id: string | number) {
    setLigneOuverte((actuel) => (actuel === id ? null : id))
  }

  const fermerDetail = useCallback(() => setLigneOuverte(null), [])

  // Remet la page à 1 quand le jeu de données ou les filtres changent.
  useEffect(() => {
    setPage(1)
  }, [donnees, recherche, parPage])

  useEffect(() => {
    if (!menuOuvert) return
    function fermerSiExterieur(evenement: MouseEvent) {
      if (!zoneMenu.current?.contains(evenement.target as Node)) {
        setMenuOuvert(false)
      }
    }
    document.addEventListener('mousedown', fermerSiExterieur)
    return () => document.removeEventListener('mousedown', fermerSiExterieur)
  }, [menuOuvert])

  const filtrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    if (!terme || !champsRecherche) return donnees
    return donnees.filter((ligne) => champsRecherche(ligne).toLowerCase().includes(terme))
  }, [donnees, recherche, champsRecherche])

  const totalPages = Math.max(1, Math.ceil(filtrees.length / parPage))
  const pageCourante = Math.min(page, totalPages)
  const debut = (pageCourante - 1) * parPage
  const pageDonnees = filtrees.slice(debut, debut + parPage)
  const rechercheActive = recherche.trim().length > 0
  const ligneDetail =
    ligneOuverte == null ? null : filtrees.find((ligne) => cleLigne(ligne) === ligneOuverte) ?? null

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
      <div className="flex flex-col gap-3 border-b border-black/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {montreMenu && (
            <div ref={zoneMenu} className="relative">
              <button
                type="button"
                aria-expanded={menuOuvert}
                onClick={() => setMenuOuvert((actuel) => !actuel)}
                className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink-700"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="6" />
                  <path d="M16 16l4 4" strokeLinecap="round" />
                </svg>
                Recherche
                {(rechercheActive || filtreActif) && (
                  <span className="h-2 w-2 rounded-full bg-[#8c4205]" aria-hidden />
                )}
              </button>
              {menuOuvert && (
                <div className="absolute left-0 z-20 mt-2 max-h-[min(70vh,32rem)] w-80 space-y-2 overflow-y-auto rounded-xl border border-black/10 bg-white p-3 shadow-lg [&_select]:w-full">
                  {champsRecherche && (
                    <input
                      autoFocus
                      value={recherche}
                      onChange={(evenement) => setRecherche(evenement.target.value)}
                      placeholder="Rechercher…"
                      aria-label="Rechercher dans le tableau"
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-ink-500"
                    />
                  )}
                  {filtresSupplementaires}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={parPage}
            onChange={(evenement) => setParPage(Number(evenement.target.value))}
            className="rounded-xl border border-black/10 bg-white px-2.5 py-2 text-sm"
            aria-label="Lignes par page"
          >
            {tailles.map((n) => (
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

      {!(chargement || actualisation) && filtrees.length === 0 ? (
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
                  {montreActions && (
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {chargement || actualisation ? (
                  <tr>
                    <td colSpan={colonnes.length + (montreActions ? 1 : 0)} className="p-0">
                      <SpinnerPourcentage className="py-10" />
                    </td>
                  </tr>
                ) : (
                  pageDonnees.map((ligne) => {
                  const id = cleLigne(ligne)
                  return (
                    <tr key={id} className="hover:bg-black/[0.015]">
                      {colonnes.map((col) => (
                        <td
                          key={col.cle}
                          className={`px-4 py-3 text-ink-800 ${col.classe || ''}`}
                        >
                          {col.rendu
                            ? col.rendu(ligne)
                            : (() => {
                                const valeur = (ligne as unknown as Record<string, unknown>)[
                                  col.cle
                                ]
                                return valeur == null || valeur === '' ? '—' : String(valeur)
                              })()}
                        </td>
                      ))}
                      {montreActions && (
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {renduDetail && (
                              <BoutonActionCrud
                                variante="voir"
                                libelle="Voir le détail"
                                onClick={() => basculerDetail(id)}
                              />
                            )}
                            {actions?.(ligne)}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
                )}
              </tbody>
            </table>
          </div>

          {!(chargement || actualisation) && (
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
          )}
        </>
      )}
      <FenetreModale
        ouvert={ligneDetail != null && Boolean(renduDetail)}
        titre={ligneDetail ? (titreDetail?.(ligneDetail) ?? 'Détail') : 'Détail'}
        sousTitre={ligneDetail ? sousTitreDetail?.(ligneDetail) : undefined}
        onFermer={fermerDetail}
        classePanneau="max-h-[min(85vh,44rem)] w-full max-w-2xl"
      >
        {ligneDetail && renduDetail ? renduDetail(ligneDetail) : null}
      </FenetreModale>
    </div>
  )
}
