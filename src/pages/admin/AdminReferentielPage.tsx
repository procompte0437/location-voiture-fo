import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ContentLoader } from '../../components/ui/Spinner'
import api from '../../lib/api'

type RefItem = {
  id: number
  type: string
  slug: string
  label: string
  parent_slug?: string | null
  sort_order: number
  is_active: boolean
}

type Lieu = {
  id: number
  name: string
  slug: string
  type: string
  city?: string
  is_popular: boolean
  is_active: boolean
}

type Categorie = {
  id: number
  slug: string
  label: string
  description?: string
  sort_order: number
  is_active: boolean
  show_on_home: boolean
}

const TYPE_LABELS: Record<string, string> = {
  lieux: 'Lieux',
  categories: 'Catégories véhicules',
  partner_type: 'Types de partenaires',
  fuel: 'Carburants',
  transmission: 'Transmissions',
  marque: 'Marques',
  modele: 'Modèles',
  location_type: 'Types de lieux',
  driver_age: 'Âges conducteur',
  booking_mode: 'Modes de réservation',
  cancellation_policy: 'Politiques d’annulation',
  payment_method: 'Moyens de paiement',
}

const REF_TYPES = [
  'partner_type',
  'fuel',
  'transmission',
  'marque',
  'modele',
  'location_type',
  'driver_age',
  'booking_mode',
  'cancellation_policy',
  'payment_method',
]

const TABS = ['lieux', 'categories', ...REF_TYPES] as const
type Tab = (typeof TABS)[number]

export function AdminReferentielPage() {
  const [params, setParams] = useSearchParams()
  const ongletParam = params.get('onglet') || 'lieux'
  const activeType: Tab = (TABS as readonly string[]).includes(ongletParam)
    ? (ongletParam as Tab)
    : 'lieux'

  const [items, setItems] = useState<RefItem[]>([])
  const [lieux, setLieux] = useState<Lieu[]>([])
  const [categories, setCategories] = useState<Categorie[]>([])
  const [typesLieu, setTypesLieu] = useState<RefItem[]>([])
  const [marques, setMarques] = useState<RefItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    label: '',
    slug: '',
    sort_order: '0',
    parent_slug: '',
    is_active: true,
  })
  const [formLieu, setFormLieu] = useState({
    name: '',
    type: 'city',
    city: '',
    is_popular: true,
    is_active: true,
  })
  const [formCat, setFormCat] = useState({
    label: '',
    slug: '',
    description: '',
    sort_order: '0',
    show_on_home: true,
    is_active: true,
  })

  function setOnglet(tab: Tab) {
    setParams(tab === 'lieux' ? {} : { onglet: tab })
    setMsg('')
  }

  async function load() {
    setLoading(true)
    try {
      if (activeType === 'lieux') {
        const [locRes, typeRes] = await Promise.all([
          api.get('/admin/locations'),
          api.get('/admin/references', { params: { type: 'location_type' } }),
        ])
        setLieux(locRes.data.data || [])
        const types = (typeRes.data.data || []) as RefItem[]
        setTypesLieu(types)
        if (types[0] && !types.some((t) => t.slug === formLieu.type)) {
          setFormLieu((f) => ({ ...f, type: types[0].slug }))
        }
      } else if (activeType === 'categories') {
        const { data } = await api.get('/admin/vehicle-categories')
        setCategories(data.data || [])
      } else {
        const requests = [
          api.get('/admin/references', { params: { type: activeType } }),
        ]
        if (activeType === 'modele') {
          requests.push(api.get('/admin/references', { params: { type: 'marque' } }))
        }
        const results = await Promise.all(requests)
        setItems(results[0].data.data || [])
        if (activeType === 'modele') {
          setMarques(results[1]?.data.data || [])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load().catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType])

  const filtered = useMemo(
    () => items.filter((i) => i.type === activeType),
    [items, activeType],
  )

  async function onCreateRef(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      await api.post('/admin/references', {
        type: activeType,
        label: form.label.trim(),
        slug: form.slug.trim() || undefined,
        parent_slug: activeType === 'modele' ? form.parent_slug || undefined : undefined,
        sort_order: Number(form.sort_order || 0),
        is_active: form.is_active,
      })
      setForm({
        label: '',
        slug: '',
        sort_order: String((filtered.length + 1) * 10),
        parent_slug: form.parent_slug,
        is_active: true,
      })
      setMsg('Élément ajouté')
      await load()
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } }
      }
      setMsg(
        axiosErr.response?.data?.message ||
          Object.values(axiosErr.response?.data?.errors || {})[0]?.[0] ||
          'Création impossible',
      )
    }
  }

  async function onCreateLieu(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      await api.post('/admin/locations', formLieu)
      setFormLieu({ name: '', type: formLieu.type || 'city', city: '', is_popular: true, is_active: true })
      setMsg('Lieu ajouté — visible sur la recherche / accueil si actif.')
      await load()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setMsg(axiosErr.response?.data?.message || 'Création du lieu impossible')
    }
  }

  async function onCreateCat(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      await api.post('/admin/vehicle-categories', {
        label: formCat.label.trim(),
        slug: formCat.slug.trim() || undefined,
        description: formCat.description || undefined,
        sort_order: Number(formCat.sort_order || 0),
        show_on_home: formCat.show_on_home,
        is_active: formCat.is_active,
      })
      setFormCat({
        label: '',
        slug: '',
        description: '',
        sort_order: String((categories.length + 1) * 10),
        show_on_home: true,
        is_active: true,
      })
      setMsg('Catégorie ajoutée')
      await load()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setMsg(axiosErr.response?.data?.message || 'Création impossible')
    }
  }

  async function toggleActive(item: RefItem) {
    await api.patch(`/admin/references/${item.id}`, { is_active: !item.is_active })
    await load()
  }

  async function remove(item: RefItem) {
    if (!window.confirm(`Supprimer « ${item.label} » ?`)) return
    await api.delete(`/admin/references/${item.id}`)
    setMsg(`« ${item.label} » supprimé`)
    await load()
  }

  async function toggleLieu(id: number, patch: Record<string, boolean>) {
    await api.patch(`/admin/locations/${id}`, patch)
    await load()
  }

  async function removeLieu(id: number) {
    if (!window.confirm('Supprimer ce lieu ?')) return
    await api.delete(`/admin/locations/${id}`)
    setMsg('Lieu supprimé')
    await load()
  }

  async function toggleCat(cat: Categorie, patch: Partial<Categorie>) {
    await api.patch(`/admin/vehicle-categories/${cat.id}`, patch)
    await load()
  }

  async function removeCat(cat: Categorie) {
    if (!window.confirm(`Supprimer « ${cat.label} » ?`)) return
    await api.delete(`/admin/vehicle-categories/${cat.id}`)
    setMsg(`« ${cat.label} » supprimée`)
    await load()
  }

  const libelleMarque = (slug?: string | null) =>
    marques.find((m) => m.slug === slug)?.label || slug || '—'

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">Référentiel</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          Toutes les listes déroulantes de la plateforme : lieux, catégories, marques, modèles,
          carburants, âges conducteur, paiements…
        </p>
      </div>

      {msg && <p className="mb-4 text-sm text-ink-600">{msg}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setOnglet(type)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              activeType === type
                ? 'bg-[#0b3d2e] text-white'
                : 'border border-black/10 bg-white text-ink-700 hover:bg-[#f4f5f4]'
            }`}
          >
            {TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>

      {activeType === 'lieux' && (
        <>
          <form
            onSubmit={onCreateLieu}
            className="mb-6 grid gap-3 rounded-xl border border-black/8 bg-white p-5 md:grid-cols-2 lg:grid-cols-5"
          >
            <input
              required
              placeholder="Nom (ex. Port-Gentil)"
              value={formLieu.name}
              onChange={(e) => setFormLieu((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl border border-black/10 px-3 py-2.5 lg:col-span-2"
            />
            <select
              value={formLieu.type}
              onChange={(e) => setFormLieu((f) => ({ ...f, type: e.target.value }))}
              className="rounded-xl border border-black/10 px-3 py-2.5"
            >
              {(typesLieu.length
                ? typesLieu
                : [
                    { slug: 'city', label: 'Ville' },
                    { slug: 'airport', label: 'Aéroport' },
                    { slug: 'district', label: 'Quartier' },
                    { slug: 'agency_point', label: 'Point agence' },
                  ]
              ).map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              placeholder="Ville liée"
              value={formLieu.city}
              onChange={(e) => setFormLieu((f) => ({ ...f, city: e.target.value }))}
              className="rounded-xl border border-black/10 px-3 py-2.5"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#0b3d2e] px-4 py-2.5 font-semibold text-white hover:bg-[#0a3427]"
            >
              Ajouter
            </button>
          </form>

          {loading ? (
            <div className="rounded-xl border border-black/8 bg-white">
              <ContentLoader />
            </div>
          ) : (
            <div className="space-y-2">
              {lieux.map((loc) => (
                <div
                  key={loc.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/8 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-ink-900">{loc.name}</p>
                    <p className="text-xs text-ink-500">
                      {typesLieu.find((t) => t.slug === loc.type)?.label || loc.type}
                      {loc.city ? ` · ${loc.city}` : ''} · {loc.slug}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleLieu(loc.id, { is_popular: !loc.is_popular })}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        loc.is_popular
                          ? 'bg-[#0b3d2e]/10 text-[#0b3d2e]'
                          : 'bg-[#f0f1f0] text-ink-500'
                      }`}
                    >
                      {loc.is_popular ? 'Populaire' : 'Standard'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleLieu(loc.id, { is_active: !loc.is_active })}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        loc.is_active
                          ? 'bg-[#0b3d2e]/10 text-[#0b3d2e]'
                          : 'bg-[#f0f1f0] text-ink-500'
                      }`}
                    >
                      {loc.is_active ? 'Actif' : 'Inactif'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeLieu(loc.id)}
                      className="rounded-lg border border-black/12 px-2.5 py-1 text-xs font-medium text-ink-500"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
              {lieux.length === 0 && (
                <div className="rounded-xl border border-dashed border-black/12 bg-white p-8 text-center text-ink-500">
                  Aucun lieu. Ajoutez les destinations affichées sur le site public.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeType === 'categories' && (
        <>
          <form
            onSubmit={onCreateCat}
            className="mb-6 grid gap-3 rounded-xl border border-black/8 bg-white p-5 md:grid-cols-2 lg:grid-cols-5"
          >
            <input
              required
              placeholder="Libellé (ex. SUV)"
              value={formCat.label}
              onChange={(e) => setFormCat((f) => ({ ...f, label: e.target.value }))}
              className="rounded-xl border border-black/10 px-3 py-2.5 lg:col-span-2"
            />
            <input
              placeholder="Code (slug)"
              value={formCat.slug}
              onChange={(e) => setFormCat((f) => ({ ...f, slug: e.target.value }))}
              className="rounded-xl border border-black/10 px-3 py-2.5"
            />
            <input
              type="number"
              min={0}
              placeholder="Ordre"
              value={formCat.sort_order}
              onChange={(e) => setFormCat((f) => ({ ...f, sort_order: e.target.value }))}
              className="rounded-xl border border-black/10 px-3 py-2.5"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#0b3d2e] px-4 py-2.5 font-semibold text-white"
            >
              Ajouter
            </button>
          </form>

          {loading ? (
            <div className="rounded-xl border border-black/8 bg-white">
              <ContentLoader />
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/12 bg-white p-8 text-center text-ink-500">
              Aucune catégorie véhicule.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-black/8 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f4f5f4] text-[11px] uppercase tracking-[0.12em] text-ink-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ordre</th>
                    <th className="px-4 py-3 font-medium">Libellé</th>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Accueil</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-t border-black/6">
                      <td className="px-4 py-3 text-ink-500">{cat.sort_order}</td>
                      <td className="px-4 py-3 font-medium text-ink-900">{cat.label}</td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-500">{cat.slug}</td>
                      <td className="px-4 py-3">{cat.show_on_home ? 'Oui' : 'Non'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            cat.is_active
                              ? 'bg-[#0b3d2e]/10 text-[#0b3d2e]'
                              : 'bg-[#f0f1f0] text-ink-500'
                          }`}
                        >
                          {cat.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              void toggleCat(cat, { is_active: !cat.is_active })
                            }
                            className="rounded-lg border border-black/12 px-2.5 py-1 text-xs font-medium"
                          >
                            {cat.is_active ? 'Désactiver' : 'Activer'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void toggleCat(cat, { show_on_home: !cat.show_on_home })
                            }
                            className="rounded-lg border border-black/12 px-2.5 py-1 text-xs font-medium"
                          >
                            Accueil
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeCat(cat)}
                            className="rounded-lg border border-black/12 px-2.5 py-1 text-xs font-medium text-ink-500"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeType !== 'lieux' && activeType !== 'categories' && (
        <>
          <form
            onSubmit={onCreateRef}
            className="mb-6 grid gap-3 rounded-xl border border-black/8 bg-white p-5 md:grid-cols-2 lg:grid-cols-6"
          >
            {activeType === 'modele' && (
              <label className="block space-y-1.5 lg:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  Marque *
                </span>
                <select
                  required
                  value={form.parent_slug}
                  onChange={(e) => setForm((f) => ({ ...f, parent_slug: e.target.value }))}
                  className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
                >
                  <option value="">Choisir…</option>
                  {marques.map((m) => (
                    <option key={m.id} value={m.slug}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block space-y-1.5 lg:col-span-2">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Libellé *
              </span>
              <input
                required
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder={
                  activeType === 'driver_age'
                    ? 'Ex. 25-69 ans'
                    : activeType === 'payment_method'
                      ? 'Ex. Airtel Money'
                      : 'Ex. Nouveau libellé'
                }
                className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Code (slug)
              </span>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder={activeType === 'driver_age' ? '25' : 'auto'}
                className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-400">Ordre</span>
              <input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#0b3d2e] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Ajouter
              </button>
            </div>
          </form>

          {loading ? (
            <div className="rounded-xl border border-black/8 bg-white">
              <ContentLoader />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/12 bg-white p-8 text-center text-ink-500">
              Aucun élément pour « {TYPE_LABELS[activeType] || activeType} ».
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-black/8 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f4f5f4] text-[11px] uppercase tracking-[0.12em] text-ink-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ordre</th>
                    <th className="px-4 py-3 font-medium">Libellé</th>
                    {activeType === 'modele' && (
                      <th className="px-4 py-3 font-medium">Marque</th>
                    )}
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-t border-black/6">
                      <td className="px-4 py-3 text-ink-500">{item.sort_order}</td>
                      <td className="px-4 py-3 font-medium text-ink-900">{item.label}</td>
                      {activeType === 'modele' && (
                        <td className="px-4 py-3 text-ink-600">
                          {libelleMarque(item.parent_slug)}
                        </td>
                      )}
                      <td className="px-4 py-3 font-mono text-xs text-ink-500">{item.slug}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.is_active
                              ? 'bg-[#0b3d2e]/10 text-[#0b3d2e]'
                              : 'bg-[#f0f1f0] text-ink-500'
                          }`}
                        >
                          {item.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => void toggleActive(item)}
                            className="rounded-lg border border-black/12 px-2.5 py-1 text-xs font-medium"
                          >
                            {item.is_active ? 'Désactiver' : 'Activer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(item)}
                            className="rounded-lg border border-black/12 px-2.5 py-1 text-xs font-medium text-ink-500"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
