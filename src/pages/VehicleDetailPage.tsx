import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CoqueSession } from '../components/layout/CoqueSession'
import { PublicHeader } from '../components/layout/Header'
import {
  BarreEtapesReservation,
  indiceEtape,
  type EtapeReservation,
} from '../components/reservation/BarreEtapesReservation'
import { DateRangePicker } from '../components/search/DateRangePicker'
import { DisponibilitesVehicule } from '../components/vehicles/DisponibilitesVehicule'
import { ContentLoader, Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useCatalog } from '../context/CatalogContext'
import api, { formatXaf } from '../lib/api'
import type { Vehicle } from '../types'

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Même visuel que la recherche : la photo reste derrière le contenu, la navbar garde son fond sable. */
const PHOTO_FOND =
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=2200&q=80'

function CoqueFicheVehicule({ children }: { children: ReactNode }) {
  const contenu = (
    <div className="relative min-h-[calc(100vh-5.5rem)]">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(247,244,239,0.62) 0%, rgba(247,244,239,0.78) 100%), url('${PHOTO_FOND}')`,
        }}
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  )

  return (
    <CoqueSession
      visiteur={
        <div className="min-h-screen bg-sand-50">
          <div className="sticky top-0 z-40 bg-marque-voile text-marque-encre">
            <PublicHeader />
          </div>
          {contenu}
        </div>
      }
    >
      {contenu}
    </CoqueSession>
  )
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

type Invite = {
  civilite: string
  prenom: string
  nom: string
  email: string
  phone: string
}

const INVITE_VIDE: Invite = { civilite: 'M.', prenom: '', nom: '', email: '', phone: '' }

/** Étapes tenues sur la fiche. Recherche est une autre page : on n’y renvoie pas au rechargement. */
const ETAPES_FICHE: EtapeReservation[] = ['conducteur', 'reservation', 'protection', 'paiement']

function etapeValide(valeur: string | null): EtapeReservation | null {
  if (valeur && ETAPES_FICHE.includes(valeur as EtapeReservation)) return valeur as EtapeReservation
  return null
}

function normaliserInvite(valeur: unknown): Invite {
  if (!valeur || typeof valeur !== 'object') return { ...INVITE_VIDE }
  const brut = valeur as Partial<Invite>
  return {
    civilite: typeof brut.civilite === 'string' && brut.civilite ? brut.civilite : 'M.',
    prenom: typeof brut.prenom === 'string' ? brut.prenom : '',
    nom: typeof brut.nom === 'string' ? brut.nom : '',
    email: typeof brut.email === 'string' ? brut.email : '',
    phone: typeof brut.phone === 'string' ? brut.phone : '',
  }
}

function cleParcours(vehiculeId: string) {
  return `locagabon_parcours_${vehiculeId}`
}

/** Conducteur, protection et moyen de paiement : repris après actualisation, avec l’étape dans l’URL. */
function lireBrouillon(vehiculeId: string | undefined) {
  if (!vehiculeId) return null
  try {
    const brut = sessionStorage.getItem(cleParcours(vehiculeId))
    if (!brut) return null
    const data = JSON.parse(brut) as {
      guest?: unknown
      protegeFranchise?: unknown
      method?: unknown
    }
    return {
      guest: normaliserInvite(data.guest),
      protegeFranchise: data.protegeFranchise === true,
      method: typeof data.method === 'string' ? data.method : '',
    }
  } catch {
    return null
  }
}

export function VehicleDetailPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fuelLabel, transmissionLabel } = useCatalog()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [chargementFiche, setChargementFiche] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [disponible, setDisponible] = useState<boolean | null>(null)
  const brouillonInitial = useState(() => lireBrouillon(id))[0]
  const [guest, setGuest] = useState<Invite>(brouillonInitial?.guest ?? { ...INVITE_VIDE })
  /** L’étape est dans l’URL : un rafraîchissement reste sur Réservation, Protection ou Demande. */
  const etape = etapeValide(searchParams.get('etape')) ?? 'conducteur'
  const [erreurConducteur, setErreurConducteur] = useState('')
  const [protegeFranchise, setProtegeFranchise] = useState(brouillonInitial?.protegeFranchise ?? false)
  const [rappelAssurance, setRappelAssurance] = useState(false)
  const [horairesOuverts, setHorairesOuverts] = useState<'depart' | 'retour' | null>(null)
  const [method, setMethod] = useState(brouillonInitial?.method || '')
  const vehiculeBrouillon = useRef(id)
  const [moyensPaiement, setMoyensPaiement] = useState<{ slug: string; label: string }[]>([])
  const [chargementMoyens, setChargementMoyens] = useState(true)
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

  function changerEtape(suivante: EtapeReservation) {
    const next = new URLSearchParams(searchParams)
    next.set('etape', suivante)
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
    if (!id || vehiculeBrouillon.current !== id) return
    try {
      sessionStorage.setItem(
        cleParcours(id),
        JSON.stringify({ guest, protegeFranchise, method }),
      )
    } catch {
      // Session pleine : l’étape affichée reste quand même dans l’URL.
    }
  }, [id, guest, protegeFranchise, method])

  useEffect(() => {
    if (vehiculeBrouillon.current === id) return
    vehiculeBrouillon.current = id
    const brouillon = lireBrouillon(id)
    setGuest(brouillon?.guest ?? { ...INVITE_VIDE })
    setProtegeFranchise(brouillon?.protegeFranchise ?? false)
    setMethod(brouillon?.method || '')
  }, [id])

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
      .finally(() => setChargementFiche(false))
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
    // Uniquement les moyens actifs du référentiel admin (pas de liste figée).
    let annule = false
    setChargementMoyens(true)
    void api
      .get('/catalog/references', { params: { type: 'payment_method' } })
      .then(({ data }) => {
        if (annule) return
        const liste = ((data.data || []) as { slug: string; label: string }[]).filter(
          (moyen) => moyen.slug && moyen.label,
        )
        setMoyensPaiement(liste)
        setMethod((actuel) => (liste.some((moyen) => moyen.slug === actuel) ? actuel : liste[0]?.slug || ''))
      })
      .catch(() => {
        if (annule) return
        setMoyensPaiement([])
        setMethod('')
      })
      .finally(() => {
        if (!annule) setChargementMoyens(false)
      })
    return () => {
      annule = true
    }
  }, [])

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
        payment_method: method,
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
      if (id) sessionStorage.removeItem(cleParcours(id))
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
    changerEtape('reservation')
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
    changerEtape(id)
  }

  function onBook(e: FormEvent) {
    e.preventDefault()
    if (etape === 'conducteur') {
      continuerConducteur()
      return
    }
    if (etape !== 'paiement') return
    if (!vehicle) return
    if (!method) {
      setError('Aucun moyen de paiement n’est disponible.')
      return
    }
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

  // Actualiser ne masque pas la page : le spinner reste dans les blocs
  // qui attendent la fiche (photo, tarif, conditions), pas sur l’ensemble.
  if (!chargementFiche && !vehicle) {
    return (
      <CoqueFicheVehicule>
        <p className="p-8">Véhicule introuvable.</p>
      </CoqueFicheVehicule>
    )
  }

  const days =
    pickupAt && returnAt
      ? Math.max(1, Math.ceil((new Date(returnAt).getTime() - new Date(pickupAt).getTime()) / 86400000))
      : null
  const total = vehicle && days ? days * vehicle.price_per_day : null
  const depart = formaterMoment(pickupAt)
  const retour = formaterMoment(returnAt)
  const lieu = lieuLabel || vehicle?.agency?.name || vehicle?.partner?.city || 'Agence partenaire'
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
    <CoqueFicheVehicule>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr] md:px-6">
        <aside className="h-fit rounded-xl border border-sand-200 bg-white p-4">
          {vehicle ? (
            <>
              <img
                src={vehicle.cover_url || ''}
                alt={vehicle.display_name}
                className="aspect-[16/10] w-full rounded-md object-cover"
              />
              <h1 className="mt-3 font-display text-2xl font-bold text-forest-950">{vehicle.display_name}</h1>
              <p className="text-sm text-ink-500">ou véhicule similaire · {vehicle.category_label || vehicle.category}</p>
              <p className="mt-3 flex flex-wrap gap-2 text-xs text-ink-700">
                <span>{vehicle.seats} places</span>
                <span>{vehicle.doors} portes</span>
                <span>{transmissionLabel(vehicle.transmission)}</span>
              </p>
              <p className="mt-2 text-sm text-forest-800">
                Politique carburant : {libelleCarburant(vehicle.fuel_policy)}
              </p>
            </>
          ) : (
            <ContentLoader label="Chargement du véhicule…" className="py-12" />
          )}
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
                    Caution{' '}
                    <span className="float-right">
                      {vehicle ? formatXaf(vehicle.deposit_amount) : <Spinner className="h-4 w-4" />}
                    </span>
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
                  {agesConducteur.length === 0 && <option value={driverAge}>Chargement…</option>}
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
              <span className="font-semibold">
                {!vehicle ? <Spinner className="h-4 w-4" /> : total != null ? formatXaf(total) : '—'}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span>Caution (franchise)</span>
              <span>{vehicle ? formatXaf(vehicle.deposit_amount) : <Spinner className="h-4 w-4" />}</span>
            </div>
            <div className="mt-3">
              {vehicle ? (
                <DisponibilitesVehicule calendrier={vehicle.calendar} disponible={disponible} />
              ) : (
                <ContentLoader label="Chargement des disponibilités…" className="py-4" />
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => changerEtape('conducteur')}
                className="rounded-md border border-sand-200 px-4 py-2.5 text-sm font-semibold"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => changerEtape('protection')}
                disabled={disponible === false || !vehicle}
                className="rounded-md bg-forest-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </section>

          <details className="group rounded-xl border border-sand-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-forest-950 [&::-webkit-details-marker]:hidden">
              Inclus dans le prix et conseils
              <span className="inline-flex text-ink-500" aria-hidden>
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="sr-only group-open:hidden">Déplier</span>
              <span className="sr-only hidden group-open:inline">Plier</span>
            </summary>
            <div className="space-y-5 border-t border-sand-100 px-5 py-4">
              <div>
                <h2 className="font-semibold">Inclus dans le prix</h2>
                <ul className="mt-3 grid gap-2 text-sm text-ink-800 sm:grid-cols-2">
                  <li>✓ Prix annoncé en FCFA, sans frais cachés</li>
                  {vehicle ? (
                    <>
                      <li>✓ {vehicle.free_cancellation ? 'Annulation gratuite' : 'Annulation selon le partenaire'}</li>
                      <li>✓ Carburant : {libelleCarburant(vehicle.fuel_policy)}</li>
                      <li>✓ {fuelLabel(vehicle.fuel)} · {transmissionLabel(vehicle.transmission)}</li>
                      {vehicle.air_conditioning && <li>✓ Climatisation</li>}
                      <li>✓ {vehicle.airport_delivery ? 'Livraison aéroport possible' : 'Retrait en agence'}</li>
                    </>
                  ) : (
                    <li className="sm:col-span-2">
                      <ContentLoader label="Chargement des conditions…" className="justify-start py-2" />
                    </li>
                  )}
                  {!chargementMoyens && moyensPaiement.length > 0 && (
                    <li>✓ Paiement : {moyensPaiement.map((moyen) => moyen.label).join(', ')}</li>
                  )}
                  {chargementMoyens && (
                    <li className="sm:col-span-2">
                      <ContentLoader label="Chargement des moyens de paiement…" className="justify-start py-2" />
                    </li>
                  )}
                </ul>
              </div>
              <div className="text-sm text-ink-800">
                <h2 className="font-semibold text-neutral-950">Conseils avant de partir</h2>
                <ul className="mt-3 space-y-2">
                  <li>✓ Le lieu de retrait est indiqué avant la confirmation.</li>
                  {vehicle ? (
                    <>
                      <li>✓ Âge minimum du conducteur : {vehicle.min_driver_age} ans, permis en cours de validité.</li>
                      <li>
                        ✓ {vehicle.booking_mode === 'instant'
                          ? 'Réservation instantanée chez ce partenaire.'
                          : 'Le partenaire confirme la demande avant le départ.'}
                      </li>
                    </>
                  ) : (
                    <li>
                      <ContentLoader label="Chargement des conseils…" className="justify-start py-2" />
                    </li>
                  )}
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
              {vehicle ? formatXaf(vehicle.deposit_amount) : <Spinner className="inline-block h-4 w-4 align-middle" />}, généralement bloquée à la remise des clés.
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
                <p className="mt-3 font-bold">
                  {!vehicle ? <Spinner className="h-4 w-4" /> : total != null ? formatXaf(total) : ''}
                </p>
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
                <p className="mt-3 font-bold">
                  Caution {vehicle ? formatXaf(vehicle.deposit_amount) : <Spinner className="inline-block h-4 w-4 align-middle" />}
                </p>
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => changerEtape('reservation')}
                className="rounded-md border border-sand-200 px-4 py-2.5 text-sm font-semibold"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => changerEtape('paiement')}
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
                disabled={chargementMoyens || moyensPaiement.length === 0}
                className={`mt-1 ${champ}`}
              >
                {chargementMoyens && <option value="">Chargement…</option>}
                {!chargementMoyens && moyensPaiement.length === 0 && (
                  <option value="">Aucun moyen configuré</option>
                )}
                {moyensPaiement.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            {!chargementMoyens && moyensPaiement.length === 0 && (
              <p className="mt-2 text-sm text-red-700">
                Aucun moyen de paiement n’est activé pour le moment.
              </p>
            )}
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
            {vehicle?.description ? (
              <p className="mt-4 text-sm text-ink-600">{vehicle.description}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => changerEtape('protection')}
                className="rounded-md border border-sand-200 px-4 py-2.5 text-sm font-semibold"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={paying || !pickupAt || disponible === false || !method}
                className="flex flex-1 items-center justify-between bg-forest-700 px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                <span>{paying ? 'Envoi…' : 'Transmettre la demande'}</span>
                <span>
                  {!vehicle ? <Spinner className="h-4 w-4" /> : total != null ? formatXaf(total) : ''}
                </span>
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
              {vehicle ? formatXaf(vehicle.deposit_amount) : '—'} reste à votre charge en cas de dommage.
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
    </CoqueFicheVehicule>
  )
}
