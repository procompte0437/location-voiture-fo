import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PublicHeader } from '../components/layout/Header'
import {
  BarreEtapesReservation,
  indiceEtape,
  type EtapeReservation,
} from '../components/reservation/BarreEtapesReservation'
import { DateRangePicker } from '../components/search/DateRangePicker'
import { DisponibilitesVehicule } from '../components/vehicles/DisponibilitesVehicule'
import { ContentLoader } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useCatalog } from '../context/CatalogContext'
import api, { formatXaf } from '../lib/api'
import type { Vehicle } from '../types'

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const HORAIRES_AGENCE = [
  ['Lundi', '08:00 – 18:00'],
  ['Mardi', '08:00 – 18:00'],
  ['Mercredi', '08:00 – 18:00'],
  ['Jeudi', '08:00 – 18:00'],
  ['Vendredi', '08:00 – 18:00'],
  ['Samedi', '08:00 – 13:00'],
  ['Dimanche', '09:00 – 12:00'],
]

function libelleCarburant(slug: string) {
  if (slug === 'full_to_full') return 'Plein / Plein'
  if (slug === 'same_to_same') return 'Même niveau'
  return 'Selon le partenaire'
}

function formaterMoment(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { jour: '—', heure: '', indice: 0 }
  const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  return {
    jour: `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`,
    heure: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    indice: (d.getDay() + 6) % 7,
  }
}

function datesParDefaut() {
  const pickup = new Date()
  pickup.setDate(pickup.getDate() + 1)
  pickup.setHours(10, 0, 0, 0)
  const ret = new Date(pickup)
  ret.setDate(ret.getDate() + 3)
  return { pickup: toLocalInput(pickup), return: toLocalInput(ret) }
}

export function VehicleDetailPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fuelLabel, transmissionLabel, labels } = useCatalog()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [disponible, setDisponible] = useState<boolean | null>(null)
  const [guest, setGuest] = useState({
    civilite: 'M.',
    prenom: '',
    nom: '',
    email: '',
    phone: '',
  })
  const [etape, setEtape] = useState<EtapeReservation>('conducteur')
  const [erreurConducteur, setErreurConducteur] = useState('')
  const [protegeFranchise, setProtegeFranchise] = useState(false)
  const [rappelAssurance, setRappelAssurance] = useState(false)
  const [horairesOuverts, setHorairesOuverts] = useState<'depart' | 'retour' | null>(null)
  const [method, setMethod] = useState('airtel_money')
  const [moyensPaiement, setMoyensPaiement] = useState<{ slug: string; label: string }[]>([])
  const [agesConducteur, setAgesConducteur] = useState<{ slug: string; label: string }[]>([])

  const defauts = useMemo(() => datesParDefaut(), [])
  const pickupAt = searchParams.get('pickup_at') || defauts.pickup
  const returnAt = searchParams.get('return_at') || defauts.return
  const driverAge = Number(searchParams.get('driver_age') || 25)
  const locationId = searchParams.get('location_id')
  const lieuLabel = searchParams.get('location_label') || ''

  function majParametre(cle: string, valeur: string) {
    const next = new URLSearchParams(searchParams)
    next.set(cle, valeur)
    setSearchParams(next, { replace: true })
  }

  function majDates(pickup: string, retour: string) {
    const next = new URLSearchParams(searchParams)
    next.set('pickup_at', pickup)
    next.set('return_at', retour)
    setSearchParams(next, { replace: true })
  }

  // Initialise les dates dans l’URL si absentes (arrivée depuis le catalogue).
  useEffect(() => {
    if (searchParams.get('pickup_at') && searchParams.get('return_at')) return
    const next = new URLSearchParams(searchParams)
    next.set('pickup_at', defauts.pickup)
    next.set('return_at', defauts.return)
    if (!next.get('driver_age')) next.set('driver_age', '25')
    setSearchParams(next, { replace: true })
    // Une seule fois à l’arrivée sur la fiche.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void api
      .get('/catalog/references', { params: { type: 'driver_age' } })
      .then(({ data }) => {
        const liste = (data.data || []) as { slug: string; label: string }[]
        setAgesConducteur(
          liste.length
            ? liste
            : [
                { slug: '21', label: '18-24 ans' },
                { slug: '25', label: '25-69 ans' },
                { slug: '70', label: '70 ans et plus' },
              ],
        )
      })
      .catch(() => {
        setAgesConducteur([
          { slug: '21', label: '18-24 ans' },
          { slug: '25', label: '25-69 ans' },
          { slug: '70', label: '70 ans et plus' },
        ])
      })
  }, [])

  useEffect(() => {
    void api
      .get(`/vehicles/${id}`)
      .then(({ data }) => setVehicle(data.data))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || !pickupAt || !returnAt) {
      setDisponible(null)
      return
    }
    void api
      .get(`/vehicles/${id}/availability`, {
        params: { pickup_at: pickupAt, return_at: returnAt },
      })
      .then(({ data }) => {
        setDisponible(!!data.available)
        if (data.calendar) {
          setVehicle((actuel) =>
            actuel ? { ...actuel, calendar: data.calendar, available: !!data.available } : actuel,
          )
        }
        if (!data.available) {
          setError('Ce véhicule n’est pas libre sur ces dates.')
        } else {
          setError('')
        }
      })
      .catch(() => setDisponible(null))
  }, [id, pickupAt, returnAt])

  useEffect(() => {
    void api
      .get('/catalog/references', { params: { type: 'payment_method' } })
      .then(({ data }) => {
        const liste = (data.data || []) as { slug: string; label: string }[]
        if (liste.length) {
          setMoyensPaiement(liste)
          setMethod((m) => (liste.some((x) => x.slug === m) ? m : liste[0].slug))
        } else {
          const fallback = Object.entries(labels.payment_method || {}).map(([slug, label]) => ({
            slug,
            label,
          }))
          setMoyensPaiement(
            fallback.length
              ? fallback
              : [
                  { slug: 'airtel_money', label: 'Airtel Money' },
                  { slug: 'moov_money', label: 'Moov Money' },
                  { slug: 'card', label: 'Carte bancaire' },
                  { slug: 'agency_cash', label: 'Acompte + paiement agence' },
                ],
          )
        }
      })
      .catch(() => {
        setMoyensPaiement([
          { slug: 'airtel_money', label: 'Airtel Money' },
          { slug: 'moov_money', label: 'Moov Money' },
          { slug: 'card', label: 'Carte bancaire' },
          { slug: 'agency_cash', label: 'Acompte + paiement agence' },
        ])
      })
  }, [labels.payment_method])

  useEffect(() => {
    if (!user) return
    setGuest((current) => ({
      ...current,
      prenom: current.prenom || user.name?.split(' ')[0] || '',
      nom: current.nom || user.name?.split(' ').slice(1).join(' ') || '',
      email: current.email || user.email || '',
      phone: current.phone || user.phone || '',
    }))
  }, [user])

  async function payerMaintenant() {
    if (!vehicle) return
    setRappelAssurance(false)
    setPaying(true)
    setError('')
    try {
      const { data: bookingRes } = await api.post('/bookings', {
        vehicle_id: vehicle.id,
        pickup_at: pickupAt,
        return_at: returnAt,
        driver_age: driverAge,
        pickup_location_id: locationId ? Number(locationId) : undefined,
        guest_name: `${guest.civilite} ${guest.prenom} ${guest.nom}`.trim() || undefined,
        guest_email: guest.email || undefined,
        guest_phone: guest.phone || undefined,
      })
      const meta = bookingRes.meta as
        | {
            account_created?: boolean
            show_credentials?: boolean
            temporary_password?: string | null
            login_email?: string
          }
        | undefined

      const bookingId = bookingRes.data.id
      const confirmationState = {
        booking: bookingRes.data,
        accountCreated: !!meta?.account_created,
        showCredentials: !!meta?.show_credentials,
        temporaryPassword: meta?.temporary_password || null,
        loginEmail: meta?.login_email || guest.email,
      }
      try {
        sessionStorage.setItem(
          `locagabon_confirm_${bookingId}`,
          JSON.stringify({
            showCredentials: confirmationState.showCredentials,
            temporaryPassword: confirmationState.temporaryPassword,
            loginEmail: confirmationState.loginEmail,
            accountCreated: confirmationState.accountCreated,
          }),
        )
      } catch {
        // ignore
      }
      navigate(`/confirmation/${bookingId}`, { state: confirmationState })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
          ?.response?.data
      setError(
        msg?.message ||
          Object.values(msg?.errors || {})[0]?.[0] ||
          'Réservation impossible. Vérifiez les dates et votre âge.',
      )
    } finally {
      setPaying(false)
    }
  }

  function continuerConducteur() {
    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())
    if (!guest.prenom.trim() || !guest.nom.trim() || !emailValide || !guest.phone.trim()) {
      setErreurConducteur('Renseignez le prénom, le nom, un e-mail valide et le téléphone.')
      return
    }
    setErreurConducteur('')
    setEtape('reservation')
  }

  function allerEtape(id: EtapeReservation) {
    if (indiceEtape(id) > indiceEtape(etape)) return
    if (id === 'recherche') {
      const qs = new URLSearchParams()
      if (pickupAt) qs.set('pickup_at', pickupAt)
      if (returnAt) qs.set('return_at', returnAt)
      qs.set('driver_age', String(driverAge))
      if (locationId) qs.set('location_id', String(locationId))
      if (lieuLabel) qs.set('location_label', lieuLabel)
      navigate(`/recherche?${qs.toString()}`)
      return
    }
    setEtape(id)
  }

  function onBook(e: FormEvent) {
    e.preventDefault()
    if (etape === 'conducteur') {
      continuerConducteur()
      return
    }
    if (etape !== 'paiement') return
    if (!vehicle) return
    if (!pickupAt || !returnAt) {
      setError('Choisissez une plage de dates pour réserver.')
      return
    }
    if (!protegeFranchise) {
      setRappelAssurance(true)
      return
    }
    void payerMaintenant()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50">
        <PublicHeader />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-2xl border border-sand-200 bg-white">
            <ContentLoader />
          </div>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-sand-50">
        <PublicHeader />
        <p className="p-8">Véhicule introuvable.</p>
      </div>
    )
  }

  const days =
    pickupAt && returnAt
      ? Math.max(1, Math.ceil((new Date(returnAt).getTime() - new Date(pickupAt).getTime()) / 86400000))
      : null
  const total = days ? days * vehicle.price_per_day : null
  const depart = formaterMoment(pickupAt)
  const retour = formaterMoment(returnAt)
  const lieu = lieuLabel || vehicle.agency?.name || vehicle.partner.city || 'Agence partenaire'
  const champ = 'w-full rounded-md border border-sand-200 px-3 py-2.5 text-sm'

  function blocHoraires(cle: 'depart' | 'retour', indice: number) {
    const ligne = HORAIRES_AGENCE[indice]
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setHorairesOuverts((actuel) => (actuel === cle ? null : cle))}
          className="text-left text-sm text-forest-800 underline-offset-2 hover:underline"
        >
          Horaires d’agence
          {ligne ? ` · ${ligne[0]} ${ligne[1]}` : ''}
        </button>
        {horairesOuverts === cle && (
          <div className="absolute z-20 mt-2 w-64 rounded-md border border-sand-200 bg-white p-3 text-sm shadow-lg">
            <p className="mb-2 text-xs text-ink-500">Horaires indicatifs des agences partenaires.</p>
            <table className="w-full">
              <tbody>
                {HORAIRES_AGENCE.map(([jour, plage], index) => (
                  <tr key={jour} className={index === indice ? 'font-bold' : undefined}>
                    <td className="py-0.5">{jour}</td>
                    <td className="py-0.5 text-right">{plage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr] md:px-6">
        <aside className="h-fit rounded-xl border border-sand-200 bg-white p-4">
          <img
            src={vehicle.cover_url || ''}
            alt={vehicle.display_name}
            className="aspect-[16/10] w-full rounded-md object-cover"
          />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-forest-700">
            {vehicle.partner.name}
          </p>
          <h1 className="font-display text-2xl font-bold text-forest-950">{vehicle.display_name}</h1>
          <p className="text-sm text-ink-500">ou véhicule similaire · {vehicle.category_label || vehicle.category}</p>
          <p className="mt-3 flex flex-wrap gap-2 text-xs text-ink-700">
            <span>{vehicle.seats} places</span>
            <span>{vehicle.doors} portes</span>
            <span>{transmissionLabel(vehicle.transmission)}</span>
          </p>
          <p className="mt-2 text-sm text-forest-800">
            Politique carburant : {libelleCarburant(vehicle.fuel_policy)}
          </p>
          {etape !== 'conducteur' && (
            <>
              <div className="mt-4 border-t border-sand-200 pt-3 text-sm">
                <p className="font-semibold">Destination</p>
                <p className="mt-1">{lieu}</p>
                <p className="mt-2">
                  {depart.jour} {depart.heure}
                </p>
                <p className="font-semibold text-forest-800">{days ? `${days} jour${days > 1 ? 's' : ''}` : ''}</p>
                <p>
                  {retour.jour} {retour.heure}
                </p>
              </div>
              {total != null && (
                <>
                  <p className="mt-4 text-sm">
                    Location <span className="float-right font-bold">{formatXaf(total)}</span>
                  </p>
                  <p className="mt-1 text-sm">
                    Caution <span className="float-right">{formatXaf(vehicle.deposit_amount)}</span>
                  </p>
                  <p className="mt-2 text-xs text-ink-500">
                    Journée = tranche de 24 h commencée. La caution n’est pas comprise dans le prix.
                  </p>
                </>
              )}
            </>
          )}
        </aside>

        <form onSubmit={onBook} className="space-y-4">
          <BarreEtapesReservation etape={etape} onChoisir={allerEtape} />

          {etape === 'conducteur' && (
          <section className="rounded-xl border border-sand-200 bg-white p-5">
            <h2 className="font-semibold">Conducteur principal</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Civilité
                <select
                  value={guest.civilite}
                  onChange={(e) => setGuest((g) => ({ ...g, civilite: e.target.value }))}
                  className={`mt-1 ${champ}`}
                >
                  <option>M.</option>
                  <option>Mme</option>
                </select>
              </label>
              <label className="text-sm">
                Âge
                <select
                  value={driverAge}
                  onChange={(e) => majParametre('driver_age', e.target.value)}
                  className={`mt-1 ${champ}`}
                >
                  {agesConducteur.map((a) => (
                    <option key={a.slug} value={Number(a.slug)}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Prénom
                <input
                  required
                  value={guest.prenom}
                  onChange={(e) => setGuest((g) => ({ ...g, prenom: e.target.value }))}
                  className={`mt-1 ${champ}`}
                />
              </label>
              <label className="text-sm">
                Nom
                <input
                  required
                  value={guest.nom}
                  onChange={(e) => setGuest((g) => ({ ...g, nom: e.target.value }))}
                  className={`mt-1 ${champ}`}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                E-mail
                <input
                  required
                  type="email"
                  value={guest.email}
                  onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))}
                  className={`mt-1 ${champ}`}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Téléphone
                <input
                  required
                  value={guest.phone}
                  onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))}
                  placeholder="+241 …"
                  className={`mt-1 ${champ}`}
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-ink-500">
              Si le partenaire doit vous joindre pour la remise du véhicule.
            </p>
            {erreurConducteur && <p className="mt-3 text-sm text-red-700">{erreurConducteur}</p>}
            <button
              type="button"
              onClick={continuerConducteur}
              className="mt-4 rounded-md bg-forest-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Continuer
            </button>
          </section>
          )}

          {etape === 'reservation' && (
          <>
          <section className="rounded-xl border border-sand-200 bg-white p-5">
            <h2 className="font-semibold text-forest-950">Données de réservation</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Récupérer la voiture</p>
                <p className="mt-1 font-medium">{depart.jour}</p>
                <p>{depart.heure}</p>
                <p className="mt-1 text-sm text-ink-700">{lieu}</p>
                {blocHoraires('depart', depart.indice)}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Rendre la voiture</p>
                <p className="mt-1 font-medium">
                  {retour.jour}
                  {days ? ` (${days} jours)` : ''}
                </p>
                <p>{retour.heure}</p>
                <p className="mt-1 text-sm text-ink-700">{lieu}</p>
                {blocHoraires('retour', retour.indice)}
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-sand-100 pt-3 text-sm">
              <span>Location de voiture</span>
              <span className="font-semibold">{total != null ? formatXaf(total) : '—'}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span>Caution (franchise)</span>
              <span>{formatXaf(vehicle.deposit_amount)}</span>
            </div>
            <div className="mt-3">
              <DisponibilitesVehicule calendrier={vehicle.calendar} disponible={disponible} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEtape('conducteur')}
                className="rounded-md border border-sand-200 px-4 py-2.5 text-sm font-semibold"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => setEtape('protection')}
                disabled={disponible === false}
                className="rounded-md bg-forest-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </section>

          <details className="group rounded-xl border border-sand-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-forest-950 [&::-webkit-details-marker]:hidden">
              Inclus dans le prix et conseils
              <span className="text-sm text-ink-500 group-open:hidden" aria-hidden>
                Déplier
              </span>
              <span className="hidden text-sm text-ink-500 group-open:inline" aria-hidden>
                Plier
              </span>
            </summary>
            <div className="space-y-5 border-t border-sand-100 px-5 py-4">
              <div>
                <h2 className="font-semibold">Inclus dans le prix</h2>
                <ul className="mt-3 grid gap-2 text-sm text-ink-800 sm:grid-cols-2">
                  <li>✓ Prix annoncé en FCFA, sans frais cachés</li>
                  <li>✓ {vehicle.free_cancellation ? 'Annulation gratuite' : 'Annulation selon le partenaire'}</li>
                  <li>✓ Carburant : {libelleCarburant(vehicle.fuel_policy)}</li>
                  <li>✓ {fuelLabel(vehicle.fuel)} · {transmissionLabel(vehicle.transmission)}</li>
                  {vehicle.air_conditioning && <li>✓ Climatisation</li>}
                  <li>✓ {vehicle.airport_delivery ? 'Livraison aéroport possible' : 'Retrait en agence'}</li>
                  <li>✓ Paiement Airtel Money, Moov Money ou carte</li>
                </ul>
              </div>
              <div className="text-sm text-ink-800">
                <h2 className="font-semibold text-neutral-950">Conseils avant de partir</h2>
                <ul className="mt-3 space-y-2">
                  <li>✓ Le lieu de retrait est indiqué avant la confirmation.</li>
                  <li>✓ Âge minimum du conducteur : {vehicle.min_driver_age} ans, permis en cours de validité.</li>
                  <li>
                    ✓ {vehicle.booking_mode === 'instant'
                      ? 'Réservation instantanée chez ce partenaire.'
                      : 'Le partenaire confirme la demande avant le départ.'}
                  </li>
                </ul>
              </div>
            </div>
          </details>
          </>
          )}

          {etape === 'protection' && (
          <section className="rounded-xl border border-sand-200 bg-white p-5">
            <h2 className="font-semibold">Protection de la franchise</h2>
            <p className="mt-2 text-sm text-ink-700">
              Sans protection, vous restez responsable des dommages à hauteur de la caution de{' '}
              {formatXaf(vehicle.deposit_amount)}, généralement bloquée à la remise des clés.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setProtegeFranchise(false)}
                className={`rounded-lg border p-4 text-left text-sm ${
                  !protegeFranchise ? 'border-forest-700 ring-2 ring-forest-700' : 'border-sand-200'
                }`}
              >
                <p className="font-semibold">Sans protection</p>
                <p className="mt-2 text-ink-600">Vous assumez la caution en cas de dommage.</p>
                <p className="mt-3 font-bold">{total != null ? formatXaf(total) : ''}</p>
                <p className="text-xs text-ink-500">Prix de la location, hors caution</p>
              </button>
              <button
                type="button"
                onClick={() => setProtegeFranchise(true)}
                className={`rounded-lg border p-4 text-left text-sm ${
                  protegeFranchise ? 'border-forest-700 ring-2 ring-forest-700' : 'border-sand-200'
                }`}
              >
                <p className="font-semibold">Protéger la franchise</p>
                <p className="mt-2 text-ink-600">
                  À demander au partenaire à la prise du véhicule. Le paiement en ligne reste celui de la location.
                </p>
                <p className="mt-3 font-bold">Caution {formatXaf(vehicle.deposit_amount)}</p>
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEtape('reservation')}
                className="rounded-md border border-sand-200 px-4 py-2.5 text-sm font-semibold"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => setEtape('paiement')}
                className="rounded-md bg-forest-700 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Continuer
              </button>
            </div>
          </section>
          )}

          {etape === 'paiement' && (
          <section className="rounded-xl border border-sand-200 bg-white p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-semibold">Demande de réservation</h2>
              <p className="text-sm text-ink-600">
                Le loueur accepte ou refuse. Le règlement sera suivi par lui, pas encaissé ici.
              </p>
            </div>
            <label className="mt-4 block text-sm">
              Moyen de paiement
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className={`mt-1 ${champ}`}
              >
                {moyensPaiement.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-sm text-ink-600">
              Indiquez comment vous réglerez le loueur. Ce choix ne déclenche aucun débit.
            </p>
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-medium text-forest-800">Modifier les dates</summary>
              <div className="mt-3">
                <DateRangePicker pickupAt={pickupAt} returnAt={returnAt} compact onChange={majDates} />
              </div>
            </details>
            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
            {vehicle.description && <p className="mt-4 text-sm text-ink-600">{vehicle.description}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setEtape('protection')}
                className="rounded-md border border-sand-200 px-4 py-2.5 text-sm font-semibold"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={paying || !pickupAt || disponible === false}
                className="flex flex-1 items-center justify-between bg-forest-700 px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                <span>{paying ? 'Envoi…' : 'Transmettre la demande'}</span>
                <span>{total != null ? formatXaf(total) : ''}</span>
              </button>
            </div>
          </section>
          )}
        </form>
      </div>

      {rappelAssurance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Attendez</h2>
            <p className="mt-2 text-sm text-ink-700">
              Le prix de la location est déjà affiché. Sans protection, la caution de{' '}
              {formatXaf(vehicle.deposit_amount)} reste à votre charge en cas de dommage.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setProtegeFranchise(true)
                  setRappelAssurance(false)
                }}
                className="rounded-md bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Je veux protéger la franchise
              </button>
              <button
                type="button"
                onClick={() => void payerMaintenant()}
                className="rounded-md border border-sand-200 px-4 py-2.5 text-sm font-semibold"
              >
                Sans protection, je prends le risque
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
