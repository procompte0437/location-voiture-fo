import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import type { Location, SearchParams } from '../../types'

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function SearchForm({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const [locations, setLocations] = useState<Location[]>([])
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Location[]>([])
  const [differentReturn, setDifferentReturn] = useState(false)

  const defaults = useMemo(() => {
    const pickup = new Date()
    pickup.setDate(pickup.getDate() + 1)
    pickup.setHours(10, 0, 0, 0)
    const ret = new Date(pickup)
    ret.setDate(ret.getDate() + 3)
    return { pickup: toLocalInput(pickup), return: toLocalInput(ret) }
  }, [])

  const [form, setForm] = useState({
    location_id: '' as string | number,
    location_label: '',
    return_location_id: '' as string | number,
    pickup_at: defaults.pickup,
    return_at: defaults.return,
    driver_age: 25,
  })

  useEffect(() => {
    void api.get('/locations/popular').then(({ data }) => {
      setLocations(data.data)
      const airport = data.data.find((l: Location) => l.type === 'airport')
      if (airport) {
        setForm((f) => ({
          ...f,
          location_id: airport.id,
          location_label: airport.name,
        }))
      }
    })
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }
    const t = setTimeout(() => {
      void api.get('/locations/autocomplete', { params: { q: query } }).then(({ data }) => {
        setSuggestions(data.data)
      })
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  const durationDays = useMemo(() => {
    const a = new Date(form.pickup_at).getTime()
    const b = new Date(form.return_at).getTime()
    if (!a || !b || b <= a) return 0
    return Math.max(1, Math.ceil((b - a) / (1000 * 60 * 60 * 24)))
  }, [form.pickup_at, form.return_at])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const params: SearchParams = {
      location_id: Number(form.location_id) || undefined,
      location_label: form.location_label,
      different_return: differentReturn,
      return_location_id: differentReturn ? Number(form.return_location_id) || undefined : Number(form.location_id) || undefined,
      pickup_at: form.pickup_at,
      return_at: form.return_at,
      driver_age: form.driver_age,
    }
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== false) qs.set(k, String(v))
    })
    navigate(`/recherche?${qs.toString()}`)
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`w-full rounded-2xl bg-white shadow-xl shadow-forest-950/20 ${compact ? 'p-4' : 'p-5 md:p-6'}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex rounded-full bg-forest-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Voiture
        </span>
        <button
          type="button"
          onClick={() => navigate('/reservation/trouver')}
          className="text-sm font-medium text-forest-700 hover:underline"
        >
          Voir / modifier ma réservation
        </button>
      </div>

      <div className="grid gap-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
            Retrait et retour
          </span>
          <div className="relative">
            <input
              value={query || form.location_label}
              onChange={(e) => {
                setQuery(e.target.value)
                setForm((f) => ({ ...f, location_label: e.target.value, location_id: '' }))
              }}
              placeholder="Ville, aéroport, quartier…"
              className="w-full rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 text-ink-900 outline-none ring-forest-600 focus:ring-2"
              required={!form.location_id}
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-sand-200 bg-white shadow-lg">
                {suggestions.map((loc) => (
                  <li key={loc.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-sand-50"
                      onClick={() => {
                        setForm((f) => ({
                          ...f,
                          location_id: loc.id,
                          location_label: loc.name,
                        }))
                        setQuery('')
                        setSuggestions([])
                      }}
                    >
                      <span className="font-medium">{loc.name}</span>
                      <span className="text-sm text-ink-500">{loc.type}{loc.city ? ` · ${loc.city}` : ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </label>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={differentReturn}
            onChange={(e) => setDifferentReturn(e.target.checked)}
            className="size-4 rounded border-sand-200 text-forest-700"
          />
          Restituer le véhicule dans un autre endroit
        </label>

        {differentReturn && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
              Lieu de restitution
            </span>
            <select
              value={form.return_location_id}
              onChange={(e) => setForm((f) => ({ ...f, return_location_id: e.target.value }))}
              className="w-full rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 outline-none ring-forest-600 focus:ring-2"
            >
              <option value="">Choisir un lieu</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
              Date de départ
            </span>
            <input
              type="datetime-local"
              value={form.pickup_at}
              onChange={(e) => setForm((f) => ({ ...f, pickup_at: e.target.value }))}
              className="w-full rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 outline-none ring-forest-600 focus:ring-2"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
              Date de retour
            </span>
            <input
              type="datetime-local"
              value={form.return_at}
              onChange={(e) => setForm((f) => ({ ...f, return_at: e.target.value }))}
              className="w-full rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 outline-none ring-forest-600 focus:ring-2"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
              Âge du conducteur
            </span>
            <select
              value={form.driver_age}
              onChange={(e) => setForm((f) => ({ ...f, driver_age: Number(e.target.value) }))}
              className="w-full rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 outline-none ring-forest-600 focus:ring-2"
            >
              <option value={21}>18-24 ans</option>
              <option value={25}>25-69 ans</option>
              <option value={70}>70 ans et plus</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-sm text-ink-500">
            {durationDays > 0 ? (
              <>Durée estimée : <strong className="text-ink-900">{durationDays} jour{durationDays > 1 ? 's' : ''}</strong></>
            ) : (
              'Choisissez vos dates'
            )}
          </p>
          <button
            type="submit"
            className="rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-forest-950 shadow-md transition hover:bg-gold-400"
          >
            Rechercher
          </button>
        </div>
      </div>
    </form>
  )
}
