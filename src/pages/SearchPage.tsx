import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PublicHeader } from '../components/layout/Header'
import { SearchForm } from '../components/search/SearchForm'
import { VehicleCard } from '../components/vehicles/VehicleCard'
import api, { categoryLabel } from '../lib/api'
import type { Vehicle } from '../types'

const CATEGORIES = ['', 'city_car', 'sedan', 'suv', '4x4', 'pickup', 'minibus', 'utility', 'luxury']

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [meta, setMeta] = useState<{ total: number; days: number | null }>({ total: 0, days: null })
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(params.get('category') || '')
  const [sort, setSort] = useState(params.get('sort') || 'price')

  useEffect(() => {
    setLoading(true)
    const query: Record<string, string> = {}
    ;['location_id', 'pickup_at', 'return_at', 'driver_age', 'category'].forEach((k) => {
      const v = params.get(k)
      if (v) query[k] = v
    })
    if (category) query.category = category
    query.sort = sort

    void api
      .get('/vehicles/search', { params: query })
      .then(({ data }) => {
        setVehicles(data.data)
        setMeta({ total: data.meta.total, days: data.meta.days })
      })
      .finally(() => setLoading(false))
  }, [params, category, sort])

  const searchQuery = params.toString()

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="border-b border-sand-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
          <SearchForm compact />
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[240px_1fr] md:px-6">
        <aside className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Catégorie</h2>
            <div className="space-y-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c || 'all'}
                  type="button"
                  onClick={() => {
                    setCategory(c)
                    const next = new URLSearchParams(params)
                    if (c) next.set('category', c)
                    else next.delete('category')
                    setParams(next)
                  }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                    category === c ? 'bg-forest-800 text-white' : 'hover:bg-sand-100'
                  }`}
                >
                  {c ? categoryLabel(c) : 'Toutes'}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-forest-950">
                {loading ? 'Recherche…' : `${meta.total} véhicule${meta.total > 1 ? 's' : ''}`}
              </h1>
              {params.get('location_label') && (
                <p className="text-sm text-ink-500">
                  {params.get('location_label')}
                  {meta.days ? ` · ${meta.days} jour${meta.days > 1 ? 's' : ''}` : ''}
                </p>
              )}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm"
            >
              <option value="price">Prix croissant</option>
              <option value="rating">Note partenaire</option>
              <option value="popularity">Popularité</option>
            </select>
          </div>

          {loading ? (
            <p className="text-ink-500">Chargement des offres…</p>
          ) : vehicles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sand-200 bg-white p-10 text-center">
              <p className="font-medium text-ink-900">Aucun véhicule pour ces critères</p>
              <Link to="/" className="mt-3 inline-block text-forest-700 hover:underline">
                Modifier la recherche
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} searchQuery={searchQuery} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
