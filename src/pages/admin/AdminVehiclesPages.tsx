import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCatalog } from '../../context/CatalogContext'
import { BoutonActionCrud } from '../../components/ui/BoutonActionCrud'
import { BoutonToutDeplier, IconeChevron } from '../../components/ui/IconeDepliage'
import { FenetreModale } from '../../components/ui/FenetreModale'
import { IconeInformation } from '../../components/ui/IconeInformation'
import { ListeDeroulanteRecherche } from '../../components/ui/ListeDeroulanteRecherche'
import { SpinnerPourcentage } from '../../components/ui/Spinner'
import api, { formatXaf, telechargerFichier } from '../../lib/api'

type PartnerOption = {
  id: number
  company_name?: string
  manager_name?: string
  city?: string
  status: string
  vehicles?: VehicleRow[]
}

const LIBELLES_STATUT_VEHICULE: Record<string, string> = {
  published: 'Publié',
  pending_validation: 'À valider',
  draft: 'Brouillon',
  suspended: 'Suspendu',
  archived: 'Archivé',
}

type VehicleRow = {
  id: number
  brand: string
  model: string
  year?: number
  category: string
  category_info?: { label: string }
  plate_number: string
  color?: string
  seats: number
  doors?: number
  luggage?: number
  transmission: string
  fuel: string
  air_conditioning?: boolean
  included_km?: number
  deposit_amount?: number
  min_driver_age?: number
  booking_mode?: string
  cancellation_policy?: string
  with_driver_available?: boolean
  airport_delivery?: boolean
  free_cancellation?: boolean
  description?: string
  price_per_day: number
  status: string
  partner_id: number
  partner?: { id: number; company_name?: string; manager_name?: string; city?: string }
  agency?: { id: number; name: string; city?: string } | null
  media?: { id: number; url: string; is_cover: boolean }[]
}

type Filters = {
  q: string
  status: string
  category: string
  partner_id: string
  transmission: string
  fuel: string
  min_price: string
  max_price: string
}

const STATUS_OPTIONS = [
  ['', 'Tous'],
  ['pending_validation', 'À valider'],
  ['published', 'Publiés'],
  ['suspended', 'Suspendus'],
  ['draft', 'Brouillons'],
  ['archived', 'Archivés'],
] as const

function coverUrl(v: VehicleRow) {
  return v.media?.find((m) => m.is_cover)?.url || v.media?.[0]?.url || ''
}

function partnerName(p?: PartnerOption | VehicleRow['partner']) {
  return p?.company_name || p?.manager_name || '—'
}

const LIBELLES_STATUT_PARTENAIRE: Record<string, string> = {
  pending: 'En attente',
  info_requested: 'Infos demandées',
  approved: 'Approuvé',
  rejected: 'Refusé',
  suspended: 'Suspendu',
}

type ActionsFlotte = {
  onVoir: (vehicule: VehicleRow) => void
  onModifier: (vehicule: VehicleRow) => void
  onApprove: (id: number) => Promise<void>
  onUnpublish: (id: number) => Promise<void>
  onRemove: (id: number) => Promise<void>
}

/** Marque, puis modèle, puis immatriculations : trois niveaux pour suivre la flotte. */
function regrouperMarques(voitures: VehicleRow[]) {
  const marques = new Map<string, Map<string, VehicleRow[]>>()
  for (const vehicule of voitures) {
    const marque = vehicule.brand.trim() || 'Sans marque'
    const modele = vehicule.model.trim() || 'Sans modèle'
    const modeles = marques.get(marque) ?? new Map<string, VehicleRow[]>()
    const lignes = modeles.get(modele) ?? []
    lignes.push(vehicule)
    modeles.set(modele, lignes)
    marques.set(marque, modeles)
  }
  return [...marques.entries()].map(([marque, modeles]) => ({
    marque,
    modeles: [...modeles.entries()].map(([modele, lignes]) => ({ modele, lignes })),
    total: [...modeles.values()].reduce((nombre, lignes) => nombre + lignes.length, 0),
  }))
}

function ActionsLigneVehicule({
  vehicule,
  onVoir,
  onModifier,
  onApprove,
  onUnpublish,
  onRemove,
}: { vehicule: VehicleRow } & ActionsFlotte) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <BoutonActionCrud variante="voir" libelle="Voir le détail" onClick={() => onVoir(vehicule)} />
      <BoutonActionCrud variante="modifier" libelle="Modifier" onClick={() => onModifier(vehicule)} />
      {vehicule.status !== 'published' ? (
        <button
          type="button"
          onClick={() => void onApprove(vehicule.id)}
          className="rounded-lg bg-[#8c4205] px-2 py-1 text-xs font-semibold text-white"
        >
          Publier
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void onUnpublish(vehicule.id)}
          className="rounded-lg border border-black/10 px-2 py-1 text-xs font-medium text-ink-700"
        >
          Dépublier
        </button>
      )}
      <BoutonActionCrud variante="supprimer" libelle="Supprimer" onClick={() => void onRemove(vehicule.id)} />
    </div>
  )
}

/** Plaques d’un même modèle, paginées pour ne pas dérouler des dizaines de lignes d’un coup. */
function ListeImmatriculations({
  lignes,
  actions,
}: {
  lignes: VehicleRow[]
  actions: ActionsFlotte
}) {
  const [page, setPage] = useState(1)
  const taille = 8
  const totalPages = Math.max(1, Math.ceil(lignes.length / taille))
  const pageCourante = Math.min(page, totalPages)
  const visibles = lignes.slice((pageCourante - 1) * taille, pageCourante * taille)

  return (
    <div>
      <ul className="divide-y divide-black/6">
        {visibles.map((vehicule) => (
          <li key={vehicule.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
            <button type="button" onClick={() => actions.onVoir(vehicule)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <span className="h-9 w-12 shrink-0 overflow-hidden rounded-md bg-[#f0f1f0]">
                {coverUrl(vehicule) ? (
                  <img src={coverUrl(vehicule)} alt="" className="h-full w-full object-cover" />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink-900">{vehicule.plate_number || 'Sans plaque'}</span>
                <span className="block text-xs text-ink-500">{formatXaf(vehicule.price_per_day)} / jour</span>
              </span>
            </button>
            <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">
              {LIBELLES_STATUT_VEHICULE[vehicule.status] || vehicule.status}
            </span>
            <ActionsLigneVehicule vehicule={vehicule} {...actions} />
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-black/6 px-3 py-2 text-xs text-ink-500">
          <span>
            {lignes.length} immatriculations · page {pageCourante} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pageCourante <= 1}
              onClick={() => setPage(pageCourante - 1)}
              className="rounded-lg border border-black/10 px-2 py-1 disabled:opacity-40"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={pageCourante >= totalPages}
              onClick={() => setPage(pageCourante + 1)}
              className="rounded-lg border border-black/10 px-2 py-1 disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Flotte d’un prestataire : marque, puis modèle, puis véhicules en retrait.
 * Chaque niveau se plie pour que la hiérarchie reste lisible.
 */
function FlottePartenaire({
  publiees,
  nonPubliees,
  montrerPubliees,
  montrerNonPubliees,
  categoryLabel,
  actions,
}: {
  publiees: VehicleRow[]
  nonPubliees: VehicleRow[]
  montrerPubliees: boolean
  montrerNonPubliees: boolean
  categoryLabel: (categorie: string) => string
  actions: ActionsFlotte
}) {
  const deuxListes = montrerPubliees && montrerNonPubliees
  const [onglet, setOnglet] = useState<'publiees' | 'attente'>('publiees')
  const [recherche, setRecherche] = useState('')
  const [marquesOuvertes, setMarquesOuvertes] = useState<Set<string>>(new Set())
  const [modelesOuverts, setModelesOuverts] = useState<Set<string>>(new Set())
  const ongletAffiche: 'publiees' | 'attente' = !montrerPubliees
    ? 'attente'
    : !montrerNonPubliees
      ? 'publiees'
      : onglet
  const liste = (ongletAffiche === 'publiees' ? publiees : nonPubliees).filter((vehicule) => {
    const terme = recherche.trim().toLowerCase()
    if (!terme) return true
    return `${vehicule.brand} ${vehicule.model} ${vehicule.plate_number ?? ''}`.toLowerCase().includes(terme)
  })
  const marques = regrouperMarques(liste)
  const rechercheActive = recherche.trim() !== ''

  function basculer(ensemble: Set<string>, cle: string, definir: (suivant: Set<string>) => void) {
    const suivant = new Set(ensemble)
    if (suivant.has(cle)) suivant.delete(cle)
    else suivant.add(cle)
    definir(suivant)
  }

  return (
    <div className="border-t border-black/8 bg-[#f6f7f6] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {deuxListes && (
          <div className="flex rounded-full bg-white p-1" role="group" aria-label="Statut de la flotte">
            <button
              type="button"
              onClick={() => setOnglet('publiees')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                ongletAffiche === 'publiees' ? 'bg-[#8c4205] text-white' : 'text-ink-700'
              }`}
            >
              Publiées ({publiees.length})
            </button>
            <button
              type="button"
              onClick={() => setOnglet('attente')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                ongletAffiche === 'attente' ? 'bg-[#8c4205] text-white' : 'text-ink-700'
              }`}
            >
              Pas encore publiées ({nonPubliees.length})
            </button>
          </div>
        )}
        <input
          type="search"
          value={recherche}
          onChange={(evenement) => setRecherche(evenement.target.value)}
          placeholder="Marque, modèle ou plaque de ce prestataire"
          aria-label="Filtrer la flotte de ce prestataire"
          className="min-w-[14rem] flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
        />
      </div>

      {marques.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/12 bg-white px-4 py-6 text-center text-sm text-ink-500">
          Aucune voiture dans cette liste.
        </p>
      ) : (
        <div className="space-y-2">
          {marques.map((groupeMarque) => {
            const marqueOuverte = rechercheActive || marquesOuvertes.has(groupeMarque.marque)
            return (
              <section key={groupeMarque.marque} className="overflow-hidden rounded-xl border border-black/8 bg-white">
                <button
                  type="button"
                  onClick={() => basculer(marquesOuvertes, groupeMarque.marque, setMarquesOuvertes)}
                  aria-expanded={marqueOuverte}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-black/[0.02]"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-black/10 text-[#8c4205]">
                    <IconeChevron ouvert={marqueOuverte} />
                  </span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#8c4205]/10 text-xs font-bold text-[#8c4205]">
                    {groupeMarque.marque.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">Marque</span>
                    <span className="block truncate text-base font-semibold text-ink-900">{groupeMarque.marque}</span>
                  </span>
                  <span className="text-xs text-ink-500">
                    {groupeMarque.modeles.length} modèle{groupeMarque.modeles.length > 1 ? 's' : ''} · {groupeMarque.total} véhicule{groupeMarque.total > 1 ? 's' : ''}
                  </span>
                </button>
                {marqueOuverte && (
                  <div className="border-t border-black/6">
                    {groupeMarque.modeles.map((groupeModele) => {
                      const cleModele = `${groupeMarque.marque}|||${groupeModele.modele}`
                      const modeleOuvert = rechercheActive || modelesOuverts.has(cleModele)
                      const premiere = groupeModele.lignes[0]
                      return (
                        <div key={cleModele} className="ml-6 border-l-2 border-[#8c4205]/25">
                          <button
                            type="button"
                            onClick={() => basculer(modelesOuverts, cleModele, setModelesOuverts)}
                            aria-expanded={modeleOuvert}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-black/[0.02]"
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-black/10 text-[#8c4205]">
                              <IconeChevron ouvert={modeleOuvert} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">Modèle</span>
                              <span className="block truncate font-semibold text-ink-900">{groupeModele.modele}</span>
                              <span className="block text-xs text-ink-500">
                                {premiere.category_info?.label || categoryLabel(premiere.category)} · {formatXaf(premiere.price_per_day)} / jour · {groupeModele.lignes.length} véhicule{groupeModele.lignes.length > 1 ? 's' : ''}
                              </span>
                            </span>
                          </button>
                          {modeleOuvert && (
                            <div className="ml-6 border-l border-black/10 bg-[#fafafa]">
                              <ListeImmatriculations lignes={groupeModele.lignes} actions={actions} />
                            </div>
                          )}
                        </div>
                      )
                    })}
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

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-[#8c4205]/40'

type FormState = {
  partner_id: string
  brand: string
  model: string
  year: string
  category: string
  plate_number: string
  color: string
  seats: string
  doors: string
  luggage: string
  transmission: string
  fuel: string
  price_per_day: string
  deposit_amount: string
  included_km: string
  min_driver_age: string
  booking_mode: string
  cancellation_policy: string
  status: string
  description: string
  cover_url: string
  air_conditioning: boolean
  airport_delivery: boolean
  free_cancellation: boolean
  with_driver_available: boolean
}

const emptyForm = (): FormState => ({
  partner_id: '',
  brand: '',
  model: '',
  year: '2022',
  category: 'city_car',
  plate_number: '',
  color: '',
  seats: '5',
  doors: '4',
  luggage: '2',
  transmission: 'manual',
  fuel: 'petrol',
  price_per_day: '',
  deposit_amount: '0',
  included_km: '200',
  min_driver_age: '21',
  booking_mode: 'instant',
  cancellation_policy: 'moderate',
  status: 'published',
  description: '',
  cover_url: '',
  air_conditioning: true,
  airport_delivery: false,
  free_cancellation: true,
  with_driver_available: false,
})

function vehicleToForm(v: VehicleRow): FormState {
  return {
    partner_id: String(v.partner_id),
    brand: v.brand,
    model: v.model,
    year: String(v.year || ''),
    category: v.category,
    plate_number: v.plate_number,
    color: v.color || '',
    seats: String(v.seats),
    doors: String(v.doors || 4),
    luggage: String(v.luggage || 2),
    transmission: v.transmission,
    fuel: v.fuel,
    price_per_day: String(v.price_per_day),
    deposit_amount: String(v.deposit_amount ?? 0),
    included_km: String(v.included_km ?? ''),
    min_driver_age: String(v.min_driver_age ?? 21),
    booking_mode: v.booking_mode || 'instant',
    cancellation_policy: v.cancellation_policy || 'moderate',
    status: v.status,
    description: v.description || '',
    cover_url: coverUrl(v),
    air_conditioning: !!v.air_conditioning,
    airport_delivery: !!v.airport_delivery,
    free_cancellation: !!v.free_cancellation,
    with_driver_available: !!v.with_driver_available,
  }
}

function formToPayload(form: FormState) {
  return {
    partner_id: Number(form.partner_id),
    brand: form.brand.trim(),
    model: form.model.trim(),
    year: form.year ? Number(form.year) : null,
    category: form.category,
    plate_number: form.plate_number.trim(),
    color: form.color || null,
    seats: Number(form.seats),
    doors: Number(form.doors || 4),
    luggage: Number(form.luggage || 2),
    transmission: form.transmission,
    fuel: form.fuel,
    price_per_day: Number(form.price_per_day),
    deposit_amount: Number(form.deposit_amount || 0),
    included_km: form.included_km ? Number(form.included_km) : null,
    min_driver_age: Number(form.min_driver_age || 21),
    booking_mode: form.booking_mode,
    cancellation_policy: form.cancellation_policy,
    status: form.status,
    description: form.description || null,
    cover_url: form.cover_url || null,
    air_conditioning: form.air_conditioning,
    airport_delivery: form.airport_delivery,
    free_cancellation: form.free_cancellation,
    with_driver_available: form.with_driver_available,
  }
}

export function AdminVehiclesPage() {
  const { user } = useAuth()
  const estSuperAdmin = user?.role === 'super_admin'
  const { categoryLabel, fuelLabel, transmissionLabel, labels } = useCatalog()
  const [searchParams, setSearchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])
  const [flotte, setFlotte] = useState<PartnerOption[]>([])
  const [partners, setPartners] = useState<PartnerOption[]>([])
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: 12 })
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [creationOuverte, setCreationOuverte] = useState(() => searchParams.get('nouveau') === '1')
  const [importOuvert, setImportOuvert] = useState(false)
  const [partenaireImport, setPartenaireImport] = useState('')
  const [importEnCours, setImportEnCours] = useState(false)
  const [erreursImport, setErreursImport] = useState<{ ligne: number; message: string }[]>([])
  const fichierVehicules = useRef<HTMLInputElement>(null)
  const [partenairesOuverts, setPartenairesOuverts] = useState<Set<number> | null>(null)
  const [filtresOuverts, setFiltresOuverts] = useState(true)
  const [fiche, setFiche] = useState<VehicleRow | null>(null)
  const [modeFiche, setModeFiche] = useState<'voir' | 'modifier'>('voir')

  const filters: Filters = useMemo(
    () => ({
      q: searchParams.get('q') || '',
      status: searchParams.get('status') || '',
      category: searchParams.get('category') || '',
      partner_id: searchParams.get('partner_id') || '',
      transmission: searchParams.get('transmission') || '',
      fuel: searchParams.get('fuel') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
    }),
    [searchParams],
  )
  const page = Number(searchParams.get('page') || 1)

  function patchParams(next: Partial<Filters & { page: string }>) {
    const params = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key)
      else params.set(key, value)
    })
    if (!('page' in next)) params.set('page', '1')
    setSearchParams(params)
  }

  async function load() {
    setLoading(true)
    try {
      if (estSuperAdmin) {
        const { data } = await api.get('/admin/vehicles', { params: { par_partenaire: 1 } })
        const liste = (data.data || []) as PartnerOption[]
        const orphelins = (data.sans_partenaire || []) as VehicleRow[]
        if (orphelins.length > 0) {
          liste.push({
            id: -1,
            manager_name: 'Sans partenaire',
            status: '',
            vehicles: orphelins,
          })
        }
        setFlotte(liste)
        setPartners(liste.filter((p) => p.id > 0))
        return
      }

      const { data } = await api.get('/admin/vehicles', {
        params: {
          page,
          per_page: 12,
          q: filters.q || undefined,
          status: filters.status || undefined,
          category: filters.category || undefined,
          partner_id: filters.partner_id || undefined,
          transmission: filters.transmission || undefined,
          fuel: filters.fuel || undefined,
          min_price: filters.min_price || undefined,
          max_price: filters.max_price || undefined,
        },
      })
      setVehicles(data.data || [])
      setMeta({
        total: data.total ?? 0,
        current_page: data.current_page ?? 1,
        last_page: data.last_page ?? 1,
        per_page: data.per_page ?? 12,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (estSuperAdmin) return
    void api
      .get('/admin/partners', { params: { per_page: 100 } })
      .then(({ data }) => setPartners(data.data || []))
      .catch(() => undefined)
  }, [estSuperAdmin])

  useEffect(() => {
    if (!user) return
    void load().catch(() => undefined)
  }, [user?.role, estSuperAdmin ? '' : searchParams.toString()])

  useEffect(() => {
    if (searchParams.get('nouveau') === '1') setCreationOuverte(true)
  }, [searchParams])

  function fermerCreation() {
    setCreationOuverte(false)
    if (searchParams.get('nouveau') !== '1') return
    const next = new URLSearchParams(searchParams)
    next.delete('nouveau')
    setSearchParams(next, { replace: true })
  }

  function ouvrirFiche(vehicule: VehicleRow, mode: 'voir' | 'modifier' = 'voir') {
    setFiche(vehicule)
    setModeFiche(mode)
  }

  async function approve(id: number) {
    await api.post(`/admin/vehicles/${id}/approve`)
    setMsg(`Véhicule #${id} publié`)
    setFiche((actuelle) => (actuelle && actuelle.id === id ? { ...actuelle, status: 'published' } : actuelle))
    await load()
  }

  async function unpublish(id: number) {
    await api.post(`/admin/vehicles/${id}/unpublish`)
    setMsg(`Véhicule #${id} dépublié`)
    setFiche((actuelle) => (actuelle && actuelle.id === id ? { ...actuelle, status: 'suspended' } : actuelle))
    await load()
  }

  async function remove(id: number) {
    if (!window.confirm('Supprimer définitivement ce véhicule ?')) return
    await api.delete(`/admin/vehicles/${id}`)
    setMsg(`Véhicule #${id} supprimé`)
    setFiche((actuelle) => (actuelle && actuelle.id === id ? null : actuelle))
    await load()
  }

  function correspondVehicule(v: VehicleRow, ignorerRecherche = false) {
    if (filters.status && v.status !== filters.status) return false
    if (filters.category && v.category !== filters.category) return false
    if (filters.transmission && v.transmission !== filters.transmission) return false
    if (filters.fuel && v.fuel !== filters.fuel) return false
    if (filters.min_price && v.price_per_day < Number(filters.min_price)) return false
    if (filters.max_price && v.price_per_day > Number(filters.max_price)) return false
    if (!ignorerRecherche && filters.q) {
      const terme = filters.q.toLowerCase()
      const texte = `${v.brand} ${v.model} ${v.plate_number ?? ''}`.toLowerCase()
      if (!texte.includes(terme)) return false
    }
    return true
  }

  const groupesPartenaires = flotte
    .filter((p) => !filters.partner_id || String(p.id) === filters.partner_id)
    .map((p) => {
      const nomCorrespond = Boolean(filters.q) && partnerName(p).toLowerCase().includes(filters.q.toLowerCase())
      const voitures = (p.vehicles || []).filter((v) => correspondVehicule(v, nomCorrespond))
      return {
        partenaire: p,
        publiees: voitures.filter((v) => v.status === 'published'),
        nonPubliees: voitures.filter((v) => v.status !== 'published'),
        total: voitures.length,
      }
    })
    .filter((g) => {
      const filtreMetier = Boolean(
        filters.status || filters.category || filters.transmission || filters.fuel || filters.min_price || filters.max_price || filters.q,
      )
      if (!filtreMetier) return true
      const nomCorrespond = Boolean(filters.q) && partnerName(g.partenaire).toLowerCase().includes(filters.q.toLowerCase())
      return g.total > 0 || nomCorrespond
    })

  const partenairesVisibles = partenairesOuverts ?? new Set(groupesPartenaires[0] ? [groupesPartenaires[0].partenaire.id] : [])

  function basculerPartenaire(id: number) {
    setPartenairesOuverts(() => {
      const suivant = new Set(partenairesVisibles)
      if (suivant.has(id)) suivant.delete(id)
      else suivant.add(id)
      return suivant
    })
  }

  function toutDeplierPartenaires() {
    setPartenairesOuverts(new Set(groupesPartenaires.map((g) => g.partenaire.id)))
  }

  function toutPlierPartenaires() {
    setPartenairesOuverts(new Set())
  }

  async function telechargerModeleVehicules() {
    setMsg('')
    try {
      await telechargerFichier('/admin/vehicules/modele', 'modele-vehicules-doto.xlsx')
    } catch {
      setMsg('Téléchargement du modèle impossible.')
    }
  }

  async function importerVehicules(evenement: ChangeEvent<HTMLInputElement>) {
    const fichier = evenement.target.files?.[0]
    evenement.target.value = ''
    if (!fichier) return
    setImportEnCours(true)
    setMsg('')
    setErreursImport([])
    try {
      const donnees = new FormData()
      donnees.append('fichier', fichier)
      if (partenaireImport) donnees.append('partenaire_id', partenaireImport)
      const { data } = await api.post('/admin/vehicules/import', donnees)
      const resume = data.data as {
        crees: number
        mis_a_jour: number
        partenaire: string
        erreurs: { ligne: number; message: string }[]
      }
      const erreurs = resume.erreurs || []
      setErreursImport(erreurs)
      const ajouts = resume.crees > 1 ? `${resume.crees} véhicules ajoutés` : `${resume.crees} véhicule ajouté`
      const misesAJour = resume.mis_a_jour > 1 ? `${resume.mis_a_jour} mis à jour` : `${resume.mis_a_jour} mis à jour`
      setMsg(`${ajouts}, ${misesAJour} pour ${resume.partenaire}${erreurs.length ? `, ${erreurs.length} ligne(s) ignorée(s)` : ''}.`)
      if (erreurs.length === 0) setImportOuvert(false)
      await load()
    } catch (erreur: unknown) {
      const axiosErr = erreur as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } }
      }
      setMsg(
        axiosErr.response?.data?.errors?.partenaire_id?.[0] ||
          axiosErr.response?.data?.message ||
          'Import de la base véhicules impossible.',
      )
    } finally {
      setImportEnCours(false)
    }
  }

  const categories = Object.entries(labels.categories)
  const nbFiltresActifs = [
    filters.q,
    filters.status,
    filters.category,
    filters.partner_id,
    filters.transmission,
    filters.fuel,
    filters.min_price,
    filters.max_price,
  ].filter(Boolean).length
  const actionsFlotte: ActionsFlotte = {
    onVoir: (vehicule) => ouvrirFiche(vehicule, 'voir'),
    onModifier: (vehicule) => ouvrirFiche(vehicule, 'modifier'),
    onApprove: approve,
    onUnpublish: unpublish,
    onRemove: remove,
  }

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader
        title="Véhicules"
        subtitle={
          estSuperAdmin
            ? 'Chaque partenaire, avec ses voitures déjà publiées et celles créées mais pas encore en ligne.'
            : 'Créez, consultez, modifiez ou dépubliez les offres visibles sur le site.'
        }
        action={
          <div className="flex flex-wrap gap-2">
            {estSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  setErreursImport([])
                  setPartenaireImport(filters.partner_id)
                  setImportOuvert(true)
                }}
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-[#f4f5f4]"
              >
                Charger une base
              </button>
            )}
            <button
              type="button"
              onClick={() => setCreationOuverte(true)}
              className="rounded-xl bg-[#8c4205] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#733806]"
            >
              Ajouter un véhicule
            </button>
          </div>
        }
      />

      {msg && <p className="mb-4 text-sm text-ink-600">{msg}</p>}

      <div className="mb-5 overflow-hidden rounded-xl border border-black/8 bg-white">
        <button
          type="button"
          onClick={() => setFiltresOuverts((ouvert) => !ouvert)}
          aria-expanded={filtresOuverts}
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-black/10 text-[#8c4205]">
            <IconeChevron ouvert={filtresOuverts} />
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-sm font-semibold text-ink-900">Filtres</span>
            {nbFiltresActifs > 0 && (
              <span className="rounded-full bg-[#8c4205] px-2 py-0.5 text-xs font-semibold text-white">
                {nbFiltresActifs}
              </span>
            )}
            {!filtresOuverts && (
              <span className="truncate text-sm text-ink-500">Recherche, catégories, statuts</span>
            )}
          </span>
        </button>
        {filtresOuverts && (
        <div className="border-t border-black/8 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Recherche">
            <input
              className={inputClass}
              placeholder="Marque, modèle, plaque…"
              value={filters.q}
              onChange={(e) => patchParams({ q: e.target.value })}
            />
          </Field>
          <Field label="Catégorie">
            <select
              className={inputClass}
              value={filters.category}
              onChange={(e) => patchParams({ category: e.target.value })}
            >
              <option value="">Toutes</option>
              {categories.map(([slug, label]) => (
                <option key={slug} value={slug}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Partenaire">
            <select
              className={inputClass}
              value={filters.partner_id}
              onChange={(e) => patchParams({ partner_id: e.target.value })}
            >
              <option value="">Tous</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {partnerName(p)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Transmission">
            <select
              className={inputClass}
              value={filters.transmission}
              onChange={(e) => patchParams({ transmission: e.target.value })}
            >
              <option value="">Toutes</option>
              <option value="manual">Manuelle</option>
              <option value="automatic">Automatique</option>
            </select>
          </Field>
          <Field label="Carburant">
            <select
              className={inputClass}
              value={filters.fuel}
              onChange={(e) => patchParams({ fuel: e.target.value })}
            >
              <option value="">Tous</option>
              <option value="petrol">Essence</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybride</option>
              <option value="electric">Électrique</option>
            </select>
          </Field>
          <Field label="Prix min (FCFA)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={filters.min_price}
              onChange={(e) => patchParams({ min_price: e.target.value })}
            />
          </Field>
          <Field label="Prix max (FCFA)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={filters.max_price}
              onChange={(e) => patchParams({ max_price: e.target.value })}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setSearchParams(new URLSearchParams())}
              className="w-full rounded-xl border border-black/12 px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-[#f4f5f4]"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => patchParams({ status: value })}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                filters.status === value
                  ? 'bg-[#8c4205] text-white'
                  : 'border border-black/10 bg-white text-ink-700 hover:bg-[#f4f5f4]'
              }`}
            >
              {label}
            </button>
            ))}
        </div>
        </div>
        )}
      </div>

      {estSuperAdmin ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-500">
            {groupesPartenaires.length} partenaire{groupesPartenaires.length > 1 ? 's' : ''}
            {' · '}
            {groupesPartenaires.reduce((n, g) => n + g.publiees.length, 0)} publiée
            {groupesPartenaires.reduce((n, g) => n + g.publiees.length, 0) > 1 ? 's' : ''}
            {' · '}
            {groupesPartenaires.reduce((n, g) => n + g.nonPubliees.length, 0)} pas encore publiée
            {groupesPartenaires.reduce((n, g) => n + g.nonPubliees.length, 0) > 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <BoutonToutDeplier
              sens="ouvrir"
              onClick={toutDeplierPartenaires}
              desactive={loading || groupesPartenaires.length === 0}
            />
            <BoutonToutDeplier
              sens="fermer"
              onClick={toutPlierPartenaires}
              desactive={loading || groupesPartenaires.length === 0}
            />
          </div>
        </div>
      ) : (
      <div className="mb-3 flex items-center justify-between text-sm text-ink-500">
        <p>
          {meta.total} véhicule{meta.total > 1 ? 's' : ''}
        </p>
        <p>
          Page {meta.current_page} / {meta.last_page}
        </p>
      </div>
      )}

      {estSuperAdmin ? (
        loading ? (
          <div className="rounded-xl border border-black/8 bg-white">
            <SpinnerPourcentage className="py-8" />
          </div>
        ) : groupesPartenaires.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/12 bg-white p-8 text-center text-ink-500">
            Aucun partenaire pour ces filtres.
          </div>
        ) : (
          <div className="space-y-3">
            {groupesPartenaires.map((g, index) => {
              const montrerPubliees = !filters.status || filters.status === 'published'
              const montrerNonPubliees = !filters.status || filters.status !== 'published'
              const ouvert = partenairesVisibles.has(g.partenaire.id)
              return (
                <section key={g.partenaire.id} className="overflow-hidden rounded-2xl border border-black/8 bg-white">
                  <button
                    type="button"
                    onClick={() => basculerPartenaire(g.partenaire.id)}
                    aria-expanded={ouvert}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-black/[0.02]"
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-black/10 text-[#8c4205]"
                      title={ouvert ? 'Plier' : 'Déplier'}
                    >
                      <IconeChevron ouvert={ouvert} />
                    </span>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#8c4205]/10 text-sm font-bold text-[#8c4205]">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold text-ink-900">
                        {partnerName(g.partenaire)}
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-500">
                        {g.partenaire.city ? `${g.partenaire.city} · ` : ''}
                        {g.partenaire.status
                          ? `${LIBELLES_STATUT_PARTENAIRE[g.partenaire.status] || g.partenaire.status} · `
                          : ''}
                        {g.publiees.length} publiée{g.publiees.length > 1 ? 's' : ''}
                        {' · '}
                        {g.nonPubliees.length} pas encore publiée{g.nonPubliees.length > 1 ? 's' : ''}
                      </span>
                    </span>
                  </button>
                  {ouvert && (
                    <FlottePartenaire
                      publiees={g.publiees}
                      nonPubliees={g.nonPubliees}
                      montrerPubliees={montrerPubliees}
                      montrerNonPubliees={montrerNonPubliees}
                      categoryLabel={categoryLabel}
                      actions={actionsFlotte}
                    />
                  )}
                </section>
              )
            })}
          </div>
        )
      ) : loading ? (
        <div className="rounded-xl border border-black/8 bg-white">
          <SpinnerPourcentage className="py-8" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/12 bg-white p-8 text-center text-ink-500">
          Aucun véhicule pour ces filtres.
        </div>
      ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((v) => {
          const image = coverUrl(v)
          return (
            <article key={v.id} className="overflow-hidden rounded-xl border border-black/8 bg-white">
              <button type="button" onClick={() => ouvrirFiche(v)} className="block aspect-[16/10] w-full bg-[#f0f1f0]">
                {image ? (
                  <img
                    src={image}
                    alt={`${v.brand} ${v.model}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-ink-500">Pas de photo</div>
                )}
              </button>
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                    {v.category_info?.label || categoryLabel(v.category)}
                  </p>
                  <button
                    type="button"
                    onClick={() => ouvrirFiche(v)}
                    className="text-left text-xl font-semibold text-ink-900 hover:underline"
                  >
                    {v.brand} {v.model}
                  </button>
                  <p className="mt-1 text-sm text-ink-500">
                    {v.plate_number} · {partnerName(v.partner)}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {transmissionLabel(v.transmission)} · {fuelLabel(v.fuel)} · {v.seats} places
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-ink-900">
                      {formatXaf(v.price_per_day)}
                      <span className="text-xs font-normal text-ink-500"> / jour</span>
                    </p>
                    <p className="text-xs capitalize text-ink-500">{v.status}</p>
                  </div>
                  <ActionsLigneVehicule
                    vehicule={v}
                    onVoir={(vehicule) => ouvrirFiche(vehicule)}
                    onModifier={(vehicule) => ouvrirFiche(vehicule, 'modifier')}
                    onApprove={approve}
                    onUnpublish={unpublish}
                    onRemove={remove}
                  />
                </div>
              </div>
            </article>
          )
        })}
      </div>
      )}

      {!estSuperAdmin && meta.last_page > 1 && !loading && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={meta.current_page <= 1}
            onClick={() => patchParams({ page: String(meta.current_page - 1) })}
            className="rounded-xl border border-black/12 px-3 py-2 text-sm font-medium disabled:opacity-40"
          >
            Précédent
          </button>
          {Array.from({ length: meta.last_page }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === meta.last_page ||
                Math.abs(p - meta.current_page) <= 1,
            )
            .map((p, idx, arr) => (
              <span key={p} className="contents">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="px-1 text-ink-400">…</span>
                )}
                <button
                  type="button"
                  onClick={() => patchParams({ page: String(p) })}
                  className={`min-w-10 rounded-xl px-3 py-2 text-sm font-medium ${
                    p === meta.current_page
                      ? 'bg-[#8c4205] text-white'
                      : 'border border-black/12 text-ink-700'
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            type="button"
            disabled={meta.current_page >= meta.last_page}
            onClick={() => patchParams({ page: String(meta.current_page + 1) })}
            className="rounded-xl border border-black/12 px-3 py-2 text-sm font-medium disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}

      <FenetreModale
        ouvert={fiche !== null}
        titre={
          fiche
            ? modeFiche === 'modifier'
              ? `Modifier ${fiche.brand} ${fiche.model}`
              : `${fiche.brand} ${fiche.model}`
            : 'Véhicule'
        }
        sousTitre={
          fiche ? `${fiche.plate_number || 'Sans plaque'} · ${partnerName(fiche.partner)}` : undefined
        }
        onFermer={() => setFiche(null)}
        classePanneau="max-h-[min(90vh,52rem)] w-full max-w-4xl"
      >
        {fiche && modeFiche === 'voir' && (
          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="overflow-hidden rounded-xl border border-black/8">
              <div className="aspect-[16/10] bg-[#f0f1f0]">
                {coverUrl(fiche) ? (
                  <img src={coverUrl(fiche)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-ink-500">Pas de photo</div>
                )}
              </div>
              {fiche.description && (
                <p className="whitespace-pre-wrap border-t border-black/6 p-4 text-sm text-ink-700">{fiche.description}</p>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-ink-900">
                  {formatXaf(fiche.price_per_day)}
                  <span className="text-sm font-normal text-ink-500"> / jour</span>
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  {LIBELLES_STATUT_VEHICULE[fiche.status] || fiche.status}
                  {' · '}
                  Caution {formatXaf(fiche.deposit_amount || 0)}
                  {fiche.included_km != null ? ` · ${fiche.included_km} km inclus` : ''}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  ['Catégorie', fiche.category_info?.label || categoryLabel(fiche.category)],
                  ['Transmission', transmissionLabel(fiche.transmission)],
                  ['Carburant', fuelLabel(fiche.fuel)],
                  ['Places', String(fiche.seats)],
                  ['Portes', String(fiche.doors ?? '—')],
                  ['Bagages', String(fiche.luggage ?? '—')],
                  ['Année', String(fiche.year ?? '—')],
                  ['Couleur', fiche.color || '—'],
                  ['Prestataire', partnerName(fiche.partner)],
                  ['Agence', fiche.agency?.name || '—'],
                ].map(([libelle, valeur]) => (
                  <div key={libelle}>
                    <dt className="text-ink-400">{libelle}</dt>
                    <dd className="font-medium text-ink-900">{valeur}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setModeFiche('modifier')}
                  className="rounded-xl bg-[#8c4205] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Modifier
                </button>
                {fiche.status !== 'published' ? (
                  <button
                    type="button"
                    onClick={() => void approve(fiche.id)}
                    className="rounded-xl border border-black/12 px-4 py-2.5 text-sm font-medium"
                  >
                    Publier
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void unpublish(fiche.id)}
                    className="rounded-xl border border-black/12 px-4 py-2.5 text-sm font-medium"
                  >
                    Dépublier
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void remove(fiche.id)}
                  className="rounded-xl border border-black/12 px-4 py-2.5 text-sm font-medium text-ink-500"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
        {fiche && modeFiche === 'modifier' && (
          <VehicleForm
            key={fiche.id}
            mode="edit"
            initial={vehicleToForm(fiche)}
            onAnnuler={() => setModeFiche('voir')}
            onSubmit={async (payload) => {
              const { data } = await api.put(`/admin/vehicles/${fiche.id}`, payload)
              setFiche({ ...fiche, ...data.data })
              setModeFiche('voir')
              setMsg('Véhicule mis à jour')
              await load()
            }}
          />
        )}
      </FenetreModale>

      <FenetreModale
        ouvert={creationOuverte}
        titre="Nouveau véhicule"
        sousTitre="Ajoutez une offre au catalogue — elle apparaîtra sur le site si le statut est « publié »."
        onFermer={fermerCreation}
        classePanneau="max-h-[90vh] w-full max-w-5xl"
      >
        <VehicleForm
          mode="create"
          onAnnuler={fermerCreation}
          onSubmit={async (payload) => {
            const { data } = await api.post('/admin/vehicles', payload)
            fermerCreation()
            ouvrirFiche(data.data as VehicleRow)
            await load()
          }}
        />
      </FenetreModale>

      {estSuperAdmin && (
        <FenetreModale
          ouvert={importOuvert}
          titre="Charger une base véhicules"
          sousTitre="Le modèle contient tous les véhicules en base et leur propriétaire. Modifiez-le, puis réimportez-le."
          onFermer={() => setImportOuvert(false)}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-ink-800">Partenaire</p>
              <IconeInformation titre="Comment le fichier est rattaché">
                <p>
                  Le fichier indique le propriétaire de chaque véhicule. S’il est vide, la ligne est rattachée
                  au partenaire choisi ici.
                </p>
                <p>
                  Une immatriculation déjà connue remplace le véhicule. Une immatriculation nouvelle le crée
                  pour le propriétaire indiqué.
                </p>
              </IconeInformation>
            </div>
              <ListeDeroulanteRecherche
              valeur={partenaireImport}
              onChange={setPartenaireImport}
              libelle="Partenaire propriétaire"
              placeholder="Choisir le partenaire…"
              options={partners.map((partenaire) => ({
                valeur: String(partenaire.id),
                libelle: partnerName(partenaire),
              }))}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void telechargerModeleVehicules()}
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-[#f4f5f4]"
              >
                Télécharger le modèle
              </button>
              <button
                type="button"
                disabled={importEnCours}
                onClick={() => fichierVehicules.current?.click()}
                className="rounded-xl bg-[#8c4205] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#733806] disabled:opacity-60"
              >
                {importEnCours ? 'Import…' : 'Importer le fichier'}
              </button>
              <input
                ref={fichierVehicules}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(evenement) => void importerVehicules(evenement)}
              />
            </div>
            {erreursImport.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
                {erreursImport.slice(0, 8).map((erreur) => (
                  <li key={`${erreur.ligne}-${erreur.message}`}>
                    Ligne {erreur.ligne} : {erreur.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </FenetreModale>
      )}
    </div>
  )
}

function VehicleForm({
  mode,
  initial,
  onSubmit,
  onAnnuler,
}: {
  mode: 'create' | 'edit'
  initial?: FormState
  onSubmit: (payload: ReturnType<typeof formToPayload>) => Promise<void>
  onAnnuler?: () => void
}) {
  const { labels } = useCatalog()
  const [form, setForm] = useState<FormState>(initial || emptyForm())
  const [partners, setPartners] = useState<PartnerOption[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [optsFuel, setOptsFuel] = useState<{ slug: string; label: string }[]>([])
  const [optsTransmission, setOptsTransmission] = useState<{ slug: string; label: string }[]>([])
  const [optsBooking, setOptsBooking] = useState<{ slug: string; label: string }[]>([])
  const [optsCancel, setOptsCancel] = useState<{ slug: string; label: string }[]>([])

  useEffect(() => {
    if (initial) setForm(initial)
  }, [initial])

  useEffect(() => {
    void api
      .get('/admin/partners', { params: { per_page: 100 } })
      .then(({ data }) => setPartners(data.data || []))
      .catch(() => undefined)

    void Promise.all([
      api.get('/catalog/references', { params: { type: 'fuel' } }),
      api.get('/catalog/references', { params: { type: 'transmission' } }),
      api.get('/catalog/references', { params: { type: 'booking_mode' } }),
      api.get('/catalog/references', { params: { type: 'cancellation_policy' } }),
    ]).then(([fuel, transm, booking, cancel]) => {
      setOptsFuel(fuel.data.data || [])
      setOptsTransmission(transm.data.data || [])
      setOptsBooking(booking.data.data || [])
      setOptsCancel(cancel.data.data || [])
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSubmit(formToPayload(form))
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const errors = axiosErr.response?.data?.errors
      if (errors) {
        setError(Object.values(errors).flat().join(' · '))
      } else {
        setError(axiosErr.response?.data?.message || 'Enregistrement impossible.')
      }
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-700">{error}</div>
      )}

      <div className="rounded-xl border border-black/8 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Identification</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Partenaire *">
            <select
              required
              className={inputClass}
              value={form.partner_id}
              onChange={(e) => set('partner_id', e.target.value)}
            >
              <option value="">Choisir…</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {partnerName(p)} ({p.status})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut">
            <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="draft">Brouillon</option>
              <option value="pending_validation">À valider</option>
              <option value="published">Publié</option>
              <option value="suspended">Suspendu</option>
              <option value="archived">Archivé</option>
            </select>
          </Field>
          <Field label="Marque *">
            <input required className={inputClass} value={form.brand} onChange={(e) => set('brand', e.target.value)} />
          </Field>
          <Field label="Modèle *">
            <input required className={inputClass} value={form.model} onChange={(e) => set('model', e.target.value)} />
          </Field>
          <Field label="Plaque *">
            <input
              required
              className={inputClass}
              value={form.plate_number}
              onChange={(e) => set('plate_number', e.target.value)}
            />
          </Field>
          <Field label="Catégorie *">
            <select
              required
              className={inputClass}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {(Object.keys(labels.categories).length
                ? Object.entries(labels.categories)
                : [
                    ['city_car', 'Citadine'],
                    ['sedan', 'Berline'],
                    ['suv', 'SUV'],
                    ['4x4', '4x4'],
                    ['pickup', 'Pick-up'],
                    ['minibus', 'Minibus'],
                    ['utility', 'Utilitaire'],
                    ['luxury', 'Luxe'],
                  ]
              ).map(([slug, label]) => (
                <option key={slug} value={slug}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Année">
            <input
              type="number"
              className={inputClass}
              value={form.year}
              onChange={(e) => set('year', e.target.value)}
            />
          </Field>
          <Field label="Couleur">
            <input className={inputClass} value={form.color} onChange={(e) => set('color', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-black/8 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Caractéristiques</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Places *">
            <input
              required
              type="number"
              min={2}
              className={inputClass}
              value={form.seats}
              onChange={(e) => set('seats', e.target.value)}
            />
          </Field>
          <Field label="Portes">
            <input
              type="number"
              min={2}
              className={inputClass}
              value={form.doors}
              onChange={(e) => set('doors', e.target.value)}
            />
          </Field>
          <Field label="Bagages">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.luggage}
              onChange={(e) => set('luggage', e.target.value)}
            />
          </Field>
          <Field label="Transmission *">
            <select
              className={inputClass}
              value={form.transmission}
              onChange={(e) => set('transmission', e.target.value)}
            >
              {(optsTransmission.length
                ? optsTransmission
                : Object.entries(labels.transmission).map(([slug, label]) => ({ slug, label }))
              ).map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Carburant *">
            <select className={inputClass} value={form.fuel} onChange={(e) => set('fuel', e.target.value)}>
              {(optsFuel.length
                ? optsFuel
                : Object.entries(labels.fuel).map(([slug, label]) => ({ slug, label }))
              ).map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Âge min. conducteur">
            <input
              type="number"
              min={18}
              className={inputClass}
              value={form.min_driver_age}
              onChange={(e) => set('min_driver_age', e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(
            [
              ['air_conditioning', 'Climatisation'],
              ['airport_delivery', 'Livraison aéroport'],
              ['free_cancellation', 'Annulation gratuite'],
              ['with_driver_available', 'Avec chauffeur'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="h-4 w-4 rounded border-black/20"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-black/8 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Tarif & publication</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Prix / jour (FCFA) *">
            <input
              required
              type="number"
              min={1000}
              className={inputClass}
              value={form.price_per_day}
              onChange={(e) => set('price_per_day', e.target.value)}
            />
          </Field>
          <Field label="Caution (FCFA)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.deposit_amount}
              onChange={(e) => set('deposit_amount', e.target.value)}
            />
          </Field>
          <Field label="Km inclus / jour">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.included_km}
              onChange={(e) => set('included_km', e.target.value)}
            />
          </Field>
          <Field label="Mode réservation">
            <select
              className={inputClass}
              value={form.booking_mode}
              onChange={(e) => set('booking_mode', e.target.value)}
            >
              {(optsBooking.length
                ? optsBooking
                : [
                    { slug: 'instant', label: 'Instantanée' },
                    { slug: 'on_request', label: 'Sur demande' },
                  ]
              ).map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Politique d’annulation">
            <select
              className={inputClass}
              value={form.cancellation_policy}
              onChange={(e) => set('cancellation_policy', e.target.value)}
            >
              {(optsCancel.length
                ? optsCancel
                : [
                    { slug: 'flexible', label: 'Flexible' },
                    { slug: 'moderate', label: 'Modérée' },
                    { slug: 'strict', label: 'Stricte' },
                  ]
              ).map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="URL photo de couverture" className="md:col-span-2 lg:col-span-3">
            <input
              type="url"
              placeholder="https://…"
              className={inputClass}
              value={form.cover_url}
              onChange={(e) => set('cover_url', e.target.value)}
            />
          </Field>
          <Field label="Description" className="md:col-span-2 lg:col-span-3">
            <textarea
              rows={4}
              className={inputClass}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
        </div>
        {form.cover_url && (
          <div className="mt-4 overflow-hidden rounded-xl border border-black/8">
            <img src={form.cover_url} alt="Aperçu" className="h-40 w-full object-cover" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#8c4205] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer le véhicule' : 'Enregistrer'}
        </button>
        {onAnnuler ? (
          <button
            type="button"
            onClick={onAnnuler}
            className="rounded-xl border border-black/12 px-5 py-2.5 text-sm font-medium text-ink-700"
          >
            Annuler
          </button>
        ) : (
          <Link
            to="/admin/vehicules"
            className="rounded-xl border border-black/12 px-5 py-2.5 text-sm font-medium text-ink-700"
          >
            Annuler
          </Link>
        )}
      </div>
    </form>
  )
}

export function AdminVehicleCreatePage() {
  return <Navigate to="/admin/vehicules?nouveau=1" replace />
}

export function AdminVehicleEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initial, setInitial] = useState<FormState | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void api
      .get(`/admin/vehicles/${id}`)
      .then(({ data }) => setInitial(vehicleToForm(data.data)))
      .catch(() => setError('Véhicule introuvable.'))
  }, [id])

  if (error) {
    return (
      <div className="rounded-xl border border-black/8 bg-white p-8 text-center text-ink-500">
        {error}{' '}
        <Link to="/admin/vehicules" className="underline">
          Retour
        </Link>
      </div>
    )
  }

  if (!initial) {
    return (
      <div>
        <PageHeader title="Modifier le véhicule" subtitle="La fiche s’affiche dès qu’elle est prête." />
        <div className="rounded-xl border border-black/8 bg-white">
          <SpinnerPourcentage className="py-8" />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader title="Modifier le véhicule" subtitle={`${initial.brand} ${initial.model}`} />
      <VehicleForm
        mode="edit"
        initial={initial}
        onSubmit={async (payload) => {
          await api.put(`/admin/vehicles/${id}`, payload)
          navigate(`/admin/vehicules/${id}`)
        }}
      />
    </div>
  )
}

export function AdminVehicleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categoryLabel, fuelLabel, transmissionLabel } = useCatalog()
  const [vehicle, setVehicle] = useState<VehicleRow | null>(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    const { data } = await api.get(`/admin/vehicles/${id}`)
    setVehicle(data.data)
  }

  useEffect(() => {
    void load().catch(() => setError('Véhicule introuvable.'))
  }, [id])

  if (error) {
    return (
      <div className="rounded-xl border border-black/8 bg-white p-8 text-center text-ink-500">
        {error}{' '}
        <Link to="/admin/vehicules" className="underline">
          Retour
        </Link>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="Fiche véhicule" subtitle="Les informations du véhicule arrivent dans ce bloc." />
        <div className="rounded-xl border border-black/8 bg-white">
          <SpinnerPourcentage className="py-8" />
        </div>
      </div>
    )
  }

  const image = coverUrl(vehicle)

  async function approve() {
    await api.post(`/admin/vehicles/${vehicle!.id}/approve`)
    setMsg('Véhicule publié')
    await load()
  }

  async function unpublish() {
    await api.post(`/admin/vehicles/${vehicle!.id}/unpublish`)
    setMsg('Véhicule dépublié')
    await load()
  }

  async function remove() {
    if (!window.confirm('Supprimer définitivement ce véhicule ?')) return
    await api.delete(`/admin/vehicles/${vehicle!.id}`)
    navigate('/admin/vehicules')
  }

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <PageHeader
        title={`${vehicle.brand} ${vehicle.model}`}
        subtitle={`${vehicle.plate_number} · ${partnerName(vehicle.partner)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/admin/vehicules/${vehicle.id}/modifier`}
              className="rounded-xl bg-[#8c4205] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Modifier
            </Link>
            {vehicle.status !== 'published' ? (
              <button
                type="button"
                onClick={() => void approve()}
                className="rounded-xl border border-black/12 px-4 py-2.5 text-sm font-medium"
              >
                Publier
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void unpublish()}
                className="rounded-xl border border-black/12 px-4 py-2.5 text-sm font-medium"
              >
                Dépublier
              </button>
            )}
            <button
              type="button"
              onClick={() => void remove()}
              className="rounded-xl border border-black/12 px-4 py-2.5 text-sm font-medium text-ink-500"
            >
              Supprimer
            </button>
            <Link
              to="/admin/vehicules"
              className="rounded-xl border border-black/12 px-4 py-2.5 text-sm font-medium"
            >
              Retour
            </Link>
          </div>
        }
      />

      {msg && <p className="mb-4 text-sm text-ink-600">{msg}</p>}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-xl border border-black/8 bg-white">
          <div className="aspect-[16/10] bg-[#f0f1f0]">
            {image ? (
              <img src={image} alt={`${vehicle.brand} ${vehicle.model}`} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-sm text-ink-500">Pas de photo</div>
            )}
          </div>
          {vehicle.description && (
            <div className="border-t border-black/6 p-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">Description</h2>
              <p className="whitespace-pre-wrap text-sm text-ink-700">{vehicle.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-black/8 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Tarif</p>
            <p className="mt-1 text-3xl font-bold text-ink-900">
              {formatXaf(vehicle.price_per_day)}
              <span className="text-sm font-normal text-ink-500"> / jour</span>
            </p>
            <p className="mt-2 text-sm capitalize text-ink-500">Statut : {vehicle.status}</p>
            <p className="text-sm text-ink-500">
              Caution : {formatXaf(vehicle.deposit_amount || 0)}
              {vehicle.included_km != null ? ` · ${vehicle.included_km} km inclus` : ''}
            </p>
          </div>

          <div className="rounded-xl border border-black/8 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Fiche technique</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                ['Catégorie', vehicle.category_info?.label || categoryLabel(vehicle.category)],
                ['Transmission', transmissionLabel(vehicle.transmission)],
                ['Carburant', fuelLabel(vehicle.fuel)],
                ['Places', String(vehicle.seats)],
                ['Portes', String(vehicle.doors ?? '—')],
                ['Bagages', String(vehicle.luggage ?? '—')],
                ['Année', String(vehicle.year ?? '—')],
                ['Couleur', vehicle.color || '—'],
                ['Âge min.', String(vehicle.min_driver_age ?? '—')],
                ['Réservation', vehicle.booking_mode || '—'],
                ['Annulation', vehicle.cancellation_policy || '—'],
                ['Clim.', vehicle.air_conditioning ? 'Oui' : 'Non'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-ink-400">{k}</dt>
                  <dd className="font-medium text-ink-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-xl border border-black/8 bg-white p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">Partenaire</h2>
            <p className="font-medium text-ink-900">{partnerName(vehicle.partner)}</p>
            {vehicle.partner?.city && <p className="text-sm text-ink-500">{vehicle.partner.city}</p>}
            {vehicle.agency && (
              <p className="mt-2 text-sm text-ink-500">
                Agence : {vehicle.agency.name}
                {vehicle.agency.city ? ` · ${vehicle.agency.city}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
