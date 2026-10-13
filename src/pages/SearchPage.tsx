import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PublicHeader } from '../components/layout/Header'
import { ContentLoader } from '../components/ui/Spinner'
import { VehicleCard } from '../components/vehicles/VehicleCard'
import { useCatalog } from '../context/CatalogContext'
import api from '../lib/api'
import type { Vehicle } from '../types'

type OptionTri = { slug: string; label: string }

const TRI_PAR_DEFAUT: OptionTri[] = [
  { slug: 'price', label: 'Prix croissant' },
  { slug: 'rating', label: 'Note partenaire' },
  { slug: 'popularity', label: 'Popularité' },
]

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const { labels } = useCatalog()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [meta, setMeta] = useState({
    total: 0,
    days: null as number | null,
    page: 1,
    per_page: 8,
    last_page: 1,
  })
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(params.get('category') || '')
  const [sort, setSort] = useState(params.get('sort') || 'price')
  const [page, setPage] = useState(Number(params.get('page') || 1))
  const [parPage, setParPage] = useState(Number(params.get('per_page') || 8))
  const [recherche, setRecherche] = useState(params.get('q') || '')
  const [rechercheDebounce, setRechercheDebounce] = useState(params.get('q') || '')
  const [categories, setCategories] = useState<{ slug: string; label: string }[]>([])
  const [optionsTri, setOptionsTri] = useState<OptionTri[]>(TRI_PAR_DEFAUT)

  useEffect(() => {
    void api.get('/catalog/categories').then(({ data }) => setCategories(data.data || []))
    void api
      .get('/catalog/references', { params: { type: 'vehicle_sort' } })
      .then(({ data }) => {
        const liste = (data.data || []) as OptionTri[]
        if (liste.length) {
          setOptionsTri(liste)
          // Si le tri actuel n’existe plus (désactivé), bascule sur le premier.
          setSort((actuel) =>
            liste.some((o) => o.slug === actuel) ? actuel : liste[0].slug,
          )
        }
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setRechercheDebounce(recherche.trim()), 300)
    return () => clearTimeout(t)
  }, [recherche])

  // Remet la page à 1 quand filtres / recherche / tri changent.
  useEffect(() => {
    setPage(1)
  }, [category, sort, rechercheDebounce, parPage])

  useEffect(() => {
    setLoading(true)
    const query: Record<string, string | number> = {
      sort,
      page,
      per_page: parPage,
    }
    ;['location_id', 'pickup_at', 'return_at', 'driver_age'].forEach((k) => {
      const v = params.get(k)
      if (v) query[k] = v
    })
    if (category) query.category = category
    if (rechercheDebounce) query.q = rechercheDebounce

    const next = new URLSearchParams(params)
    if (category) next.set('category', category)
    else next.delete('category')
    next.set('sort', sort)
    next.set('page', String(page))
    next.set('per_page', String(parPage))
    if (rechercheDebounce) next.set('q', rechercheDebounce)
    else next.delete('q')
    setParams(next, { replace: true })

    void api
      .get('/vehicles/search', { params: query })
      .then(({ data }) => {
        setVehicles(data.data || [])
        setMeta({
          total: data.meta?.total ?? 0,
          days: data.meta?.days ?? null,
          page: data.meta?.page ?? page,
          per_page: data.meta?.per_page ?? parPage,
          last_page: data.meta?.last_page ?? 1,
        })
      })
      .finally(() => setLoading(false))
    // params intentionnellement hors deps : on synchronise l’URL depuis l’état local.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, page, parPage, rechercheDebounce])

  const searchQuery = params.toString()
  const categoryOptions = [{ slug: '', label: 'Toutes' }, ...categories]
  const pageCourante = Math.min(meta.page, meta.last_page)

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />

      <div className="mx-auto max-w-6xl px-4 pt-8 md:px-6">
        <h1 className="font-display text-3xl font-bold text-forest-950 md:text-4xl">
          Nos véhicules
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Parcourez le catalogue par catégorie, puis réservez depuis la fiche du véhicule.
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[240px_1fr] md:px-6">
        <aside className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
              Catégorie
            </h2>
            <div className="space-y-1">
              {categoryOptions.map((c) => (
                <button
                  key={c.slug || 'all'}
                  type="button"
                  onClick={() => setCategory(c.slug)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                    category === c.slug ? 'bg-forest-800 text-white' : 'hover:bg-sand-100'
                  }`}
                >
                  {c.label || labels.categories[c.slug] || c.slug}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-forest-950">
                {loading ? 'Chargement…' : `${meta.total} véhicule${meta.total > 1 ? 's' : ''}`}
              </h2>
              {params.get('location_label') && (
                <p className="text-sm text-ink-500">
                  {params.get('location_label')}
                  {meta.days ? ` · ${meta.days} jour${meta.days > 1 ? 's' : ''}` : ''}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une marque, un modèle…"
                className="w-full min-w-[12rem] flex-1 rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm outline-none ring-forest-600 focus:ring-2 sm:max-w-xs"
                aria-label="Rechercher un véhicule"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm"
                aria-label="Trier les véhicules"
              >
                {optionsTri.map((o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={parPage}
                onChange={(e) => setParPage(Number(e.target.value))}
                className="rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm"
                aria-label="Véhicules par page"
              >
                {[4, 8, 12, 24].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-sand-200 bg-white">
              <ContentLoader label="Chargement des offres…" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sand-200 bg-white p-10 text-center">
              <p className="font-medium text-ink-900">Aucun véhicule pour ces critères</p>
              <button
                type="button"
                onClick={() => {
                  setRecherche('')
                  setCategory('')
                }}
                className="mt-3 inline-block text-forest-700 hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                {vehicles.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} searchQuery={searchQuery} />
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-sand-200 pt-4">
                <p className="text-sm text-ink-500">
                  Page {pageCourante} sur {meta.last_page}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pageCourante <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl border border-sand-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-sand-50 disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    disabled={pageCourante >= meta.last_page || loading}
                    onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                    className="rounded-xl border border-sand-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-sand-50 disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
