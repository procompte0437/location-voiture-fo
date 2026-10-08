import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '../ui/Spinner'
import api, { formatXaf } from '../../lib/api'
import type { Location, SearchParams } from '../../types'
import { DateRangePicker } from './DateRangePicker'

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

type RefOption = { slug: string; label: string }

type OptionVehicule = {
  id: number
  brand: string
  model: string
  display_name: string
  category?: string
  category_label?: string
  price_per_day: number
  cover_url?: string | null
  partner_city?: string | null
  pickup_location_id?: number | null
  pickup_location_name?: string | null
  agency_name?: string | null
  available?: boolean
}

function appliquerLieuVehicule(
  v: OptionVehicule,
): { location_id: string | number; location_label: string } {
  return {
    location_id: v.pickup_location_id || '',
    location_label: v.pickup_location_name || v.partner_city || 'Lieu à confirmer avec le partenaire',
  }
}

export function SearchForm({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const selecteurVehicule = useRef<HTMLDivElement>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [differentReturn, setDifferentReturn] = useState(false)
  const [agesConducteur, setAgesConducteur] = useState<RefOption[]>([])
  const [vehicules, setVehicules] = useState<OptionVehicule[]>([])
  const [chargementVehicules, setChargementVehicules] = useState(false)
  const [rechercheVehicule, setRechercheVehicule] = useState('')
  const [listeVehiculesOuverte, setListeVehiculesOuverte] = useState(false)
  const [vehiculeChoisi, setVehiculeChoisi] = useState<OptionVehicule | null>(null)

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
      setLocations(data.data || [])
    })
    void api
      .get('/catalog/references', { params: { type: 'driver_age' } })
      .then(({ data }) => {
        const liste = (data.data || []) as RefOption[]
        if (liste.length) {
          setAgesConducteur(liste)
          setForm((f) => ({
            ...f,
            driver_age: Number(
              liste.find((a) => a.slug === String(f.driver_age))?.slug || liste[0].slug,
            ),
          }))
        } else {
          setAgesConducteur([
            { slug: '21', label: '18-24 ans' },
            { slug: '25', label: '25-69 ans' },
            { slug: '70', label: '70 ans et plus' },
          ])
        }
      })
      .catch(() => {
        setAgesConducteur([
          { slug: '21', label: '18-24 ans' },
          { slug: '25', label: '25-69 ans' },
          { slug: '70', label: '70 ans et plus' },
        ])
      })
  }, [])

  // Recharge les véhicules libres dès que les dates (ou la recherche) changent.
  useEffect(() => {
    if (!form.pickup_at || !form.return_at) return
    if (new Date(form.return_at) <= new Date(form.pickup_at)) return

    const t = setTimeout(() => {
      setChargementVehicules(true)
      void api
        .get('/catalog/vehicles', {
          params: {
            pickup_at: form.pickup_at,
            return_at: form.return_at,
            available_only: 1,
            ...(rechercheVehicule.trim() ? { q: rechercheVehicule.trim() } : {}),
          },
        })
        .then(({ data }) => {
          const liste = (data.data || []) as OptionVehicule[]
          setVehicules(liste)
          setVehiculeChoisi((actuel) => {
            if (!actuel) return null
            const encoreLibre = liste.find((v) => v.id === actuel.id)
            if (!encoreLibre) {
              setForm((f) => ({ ...f, location_id: '', location_label: '' }))
              return null
            }
            return encoreLibre
          })
        })
        .catch(() => setVehicules([]))
        .finally(() => setChargementVehicules(false))
    }, 250)

    return () => clearTimeout(t)
  }, [form.pickup_at, form.return_at, rechercheVehicule])

  useEffect(() => {
    if (!listeVehiculesOuverte) return
    function horsClic(e: MouseEvent) {
      if (selecteurVehicule.current && !selecteurVehicule.current.contains(e.target as Node)) {
        setListeVehiculesOuverte(false)
      }
    }
    document.addEventListener('mousedown', horsClic)
    return () => document.removeEventListener('mousedown', horsClic)
  }, [listeVehiculesOuverte])

  function choisirVehicule(v: OptionVehicule) {
    if (v.available === false) return
    const lieu = appliquerLieuVehicule(v)
    setVehiculeChoisi(v)
    setListeVehiculesOuverte(false)
    setRechercheVehicule('')
    setForm((f) => ({
      ...f,
      ...lieu,
      return_location_id: differentReturn ? f.return_location_id : lieu.location_id,
    }))
  }

  const durationDays = useMemo(() => {
    const a = new Date(form.pickup_at).getTime()
    const b = new Date(form.return_at).getTime()
    if (!a || !b || b <= a) return 0
    return Math.max(1, Math.ceil((b - a) / (1000 * 60 * 60 * 24)))
  }, [form.pickup_at, form.return_at])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!vehiculeChoisi) {
      setListeVehiculesOuverte(true)
      return
    }

    const qs = new URLSearchParams()
    qs.set('pickup_at', form.pickup_at)
    qs.set('return_at', form.return_at)
    qs.set('driver_age', String(form.driver_age))
    if (form.location_id) qs.set('location_id', String(form.location_id))
    if (form.location_label) qs.set('location_label', form.location_label)
    if (differentReturn && form.return_location_id) {
      qs.set('return_location_id', String(form.return_location_id))
      qs.set('different_return', '1')
    } else if (form.location_id) {
      qs.set('return_location_id', String(form.location_id))
    }

    navigate(`/vehicules/${vehiculeChoisi.id}?${qs.toString()}`)
  }

  function rechercherSansVehicule() {
    const params: SearchParams = {
      location_id: Number(form.location_id) || undefined,
      location_label: form.location_label,
      different_return: differentReturn,
      return_location_id: differentReturn
        ? Number(form.return_location_id) || undefined
        : Number(form.location_id) || undefined,
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
        {/* 1. Dates d’abord — filtrent la disponibilité */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
            1 · Dates et horaires
          </span>
          <DateRangePicker
            pickupAt={form.pickup_at}
            returnAt={form.return_at}
            compact={compact}
            onChange={(pickup_at, return_at) => setForm((f) => ({ ...f, pickup_at, return_at }))}
          />
          <p className="mt-2 text-xs text-ink-500">
            {chargementVehicules ? (
              'Vérification des disponibilités…'
            ) : durationDays > 0 ? (
              <>
                {vehicules.length} véhicule{vehicules.length !== 1 ? 's' : ''} disponible
                {vehicules.length !== 1 ? 's' : ''} sur cette période
                {durationDays > 0 ? (
                  <>
                    {' '}
                    · durée {durationDays} jour{durationDays > 1 ? 's' : ''}
                  </>
                ) : null}
              </>
            ) : (
              'Choisissez une plage de dates pour voir les voitures libres.'
            )}
          </p>
        </div>

        {/* 2. Voitures libres uniquement */}
        <div ref={selecteurVehicule} className="relative">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
            2 · Choisir une voiture disponible
          </span>
          <button
            type="button"
            onClick={() => !chargementVehicules && setListeVehiculesOuverte((o) => !o)}
            disabled={chargementVehicules}
            className="flex w-full items-center gap-3 rounded-xl border border-sand-200 bg-sand-50 px-3 py-3 text-left outline-none ring-forest-600 focus:ring-2 disabled:cursor-wait"
          >
            {chargementVehicules ? (
              <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-white shadow-sm">
                <Spinner className="h-5 w-5" />
              </span>
            ) : vehiculeChoisi?.cover_url ? (
              <img
                src={vehiculeChoisi.cover_url}
                alt=""
                className="h-10 w-14 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-white text-forest-800 shadow-sm">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5" strokeLinecap="round" />
                  <path d="M3 13h18v4a1 1 0 0 1-1 1h-1" />
                  <circle cx="7" cy="17" r="1.5" />
                  <circle cx="17" cy="17" r="1.5" />
                </svg>
              </span>
            )}
            <span className="min-w-0 flex-1">
              {chargementVehicules ? (
                <span className="text-ink-500">Recherche des véhicules disponibles…</span>
              ) : vehiculeChoisi ? (
                <>
                  <span className="block truncate font-semibold text-ink-900">
                    {vehiculeChoisi.display_name}
                  </span>
                  <span className="block truncate text-xs text-ink-500">
                    <span className="text-forest-700">Disponible</span>
                    {vehiculeChoisi.pickup_location_name
                      ? ` · ${vehiculeChoisi.pickup_location_name}`
                      : ''}
                    {' · '}
                    {formatXaf(vehiculeChoisi.price_per_day)} / jour
                  </span>
                </>
              ) : (
                <span className="text-ink-500">
                  {vehicules.length === 0
                    ? 'Aucun véhicule libre sur ces dates'
                    : 'Sélectionnez un véhicule disponible…'}
                </span>
              )}
            </span>
            {!chargementVehicules && (
              <span className="text-ink-400">{listeVehiculesOuverte ? '▴' : '▾'}</span>
            )}
          </button>

          {listeVehiculesOuverte && (
            <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-xl shadow-forest-950/15">
              <div className="border-b border-sand-100 p-3">
                <input
                  autoFocus
                  value={rechercheVehicule}
                  onChange={(e) => setRechercheVehicule(e.target.value)}
                  placeholder="Rechercher une marque, un modèle…"
                  className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-forest-600 focus:ring-2"
                />
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
                  Uniquement les véhicules libres sur vos dates
                </p>
              </div>
              <ul className="max-h-64 overflow-auto">
                {chargementVehicules ? (
                  <li className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-ink-500">
                    <Spinner className="h-5 w-5" />
                    Vérification des disponibilités…
                  </li>
                ) : vehicules.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-ink-500">
                    Aucun véhicule disponible pour ces dates. Modifiez la plage horaire.
                  </li>
                ) : (
                  vehicules.map((v) => (
                    <li key={v.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sand-50"
                        onClick={() => choisirVehicule(v)}
                      >
                        {v.cover_url ? (
                          <img src={v.cover_url} alt="" className="h-11 w-16 rounded-lg object-cover" />
                        ) : (
                          <span className="flex h-11 w-16 items-center justify-center rounded-lg bg-sand-100 text-ink-400">
                            —
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-ink-900">{v.display_name}</span>
                          <span className="block truncate text-xs text-ink-500">
                            <span className="font-medium text-forest-700">Disponible</span>
                            {v.category_label || v.category
                              ? ` · ${v.category_label || v.category}`
                              : ''}
                            {v.pickup_location_name ? ` · ${v.pickup_location_name}` : ''}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-sm font-bold text-forest-900">
                            {formatXaf(v.price_per_day)}
                          </span>
                          <span className="block text-[11px] font-medium text-ink-500">/ jour</span>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <div className="border-t border-sand-100 p-2">
                <button
                  type="button"
                  onClick={() => {
                    setVehiculeChoisi(null)
                    setForm((f) => ({ ...f, location_id: '', location_label: '' }))
                    setListeVehiculesOuverte(false)
                    rechercherSansVehicule()
                  }}
                  className="w-full rounded-xl px-3 py-2 text-sm font-medium text-forest-800 hover:bg-sand-50"
                >
                  Voir les résultats de recherche
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lieu compact */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <p className="min-w-0 flex-1 text-ink-600">
            <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Retrait
            </span>
            {vehiculeChoisi && form.location_label ? (
              <>
                <span className="font-medium text-ink-900">{form.location_label}</span>
                {!differentReturn && (
                  <span className="text-ink-400"> · même lieu au retour</span>
                )}
              </>
            ) : (
              <span className="text-ink-400">— après choix du véhicule</span>
            )}
          </p>
          <label className="inline-flex items-center gap-2 text-ink-700">
            <input
              type="checkbox"
              checked={differentReturn}
              onChange={(e) => {
                const coche = e.target.checked
                setDifferentReturn(coche)
                if (!coche) {
                  setForm((f) => ({ ...f, return_location_id: f.location_id }))
                }
              }}
              className="size-4 rounded border-sand-200 text-forest-700"
              disabled={!vehiculeChoisi}
            />
            Autre lieu de restitution
          </label>
        </div>

        {differentReturn && (
          <select
            required
            value={form.return_location_id}
            onChange={(e) => setForm((f) => ({ ...f, return_location_id: e.target.value }))}
            className="w-full rounded-xl border border-sand-200 bg-sand-50 px-4 py-2.5 text-sm outline-none ring-forest-600 focus:ring-2"
          >
            <option value="">Lieu de restitution…</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        )}

        <label className="block max-w-xs">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
            Âge du conducteur
          </span>
          <select
            value={form.driver_age}
            onChange={(e) => setForm((f) => ({ ...f, driver_age: Number(e.target.value) }))}
            className="w-full rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 outline-none ring-forest-600 focus:ring-2"
          >
            {agesConducteur.map((a) => (
              <option key={a.slug} value={Number(a.slug)}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          <button
            type="submit"
            disabled={!vehiculeChoisi}
            className="rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-forest-950 shadow-md transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      </div>
    </form>
  )
}
