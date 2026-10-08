import {
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { PublicHeader } from '../../components/layout/Header'
import { useAuth } from '../../context/AuthContext'
import { useCatalog } from '../../context/CatalogContext'
import type { ContexteSortiePartenaire } from '../../components/partenaire/CoquePartenaire'
import { ContentLoader } from '../../components/ui/Spinner'
import { TableauDonnees } from '../../components/ui/TableauDonnees'
import api, { formatXaf } from '../../lib/api'

/** Ligne véhicule renvoyée par l’API partenaire. */
type LigneVehicule = {
  id: number
  brand: string
  model: string
  status: string
  price_per_day: number
  plate_number?: string
  category?: string
  cover_url?: string
  media?: { url: string; is_cover?: boolean }[]
}

/** Ligne réservation avec relations véhicule / client. */
type LigneReservation = {
  id: number
  status: string
  pickup_at?: string
  return_at?: string
  total_amount?: number
  vehicle?: { brand?: string; model?: string }
  customer?: { name?: string; email?: string; phone?: string }
}

/** Traduit un code statut technique en libellé français. */
function libelleStatut(code: string) {
  const correspondances: Record<string, string> = {
    pending: 'En attente',
    pending_validation: 'En validation',
    approved: 'Approuvé',
    published: 'Publié',
    rejected: 'Refusé',
    suspended: 'Suspendu',
    draft: 'Brouillon',
    confirmed: 'Confirmée',
    ongoing: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
    new: 'Nouveau',
    info_requested: 'Infos demandées',
  }
  return correspondances[code] || code
}

/** Pastille neutre pour les statuts (peu de couleur dans le contenu). */
function PastilleStatut({ statut }: { statut: string }) {
  return (
    <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-0.5 text-[11px] font-medium text-ink-700">
      {libelleStatut(statut)}
    </span>
  )
}

/** Bouton d’action principal — une seule teinte sobre pour tout le contenu. */
function BoutonPrincipal({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-forest-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-forest-800 disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  )
}

/** En-tête de page homogène (eyebrow + titre + action). */
function HeroPage({
  surtitre,
  titre,
  sousTitre,
  action,
}: {
  surtitre: string
  titre: string
  sousTitre?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">{surtitre}</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          {titre}
        </h1>
        {sousTitre && <p className="mt-2 max-w-xl text-sm text-ink-500">{sousTitre}</p>}
      </div>
      {action}
    </div>
  )
}

/** Carte indicateur du tableau de bord — fond clair uniquement. */
function TuileStat({
  libelle,
  valeur,
  hint,
}: {
  libelle: string
  valeur: string
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">{libelle}</p>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">{valeur}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  )
}

/** Landing marketing « Devenir partenaire ». */
export function PageDevenirPartenaire() {
  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Espace pro</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink-900 md:text-5xl">
            Devenir partenaire
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Agences, entreprises ou particuliers : publiez vos véhicules sur LocaGabon après validation de
            votre dossier.
          </p>
          <ul className="mt-8 space-y-3 text-ink-700">
            {[
              'Inscription ouverte à tous',
              'Validation sous 48 h ouvrées',
              'Commission transparente',
              'Paiement Mobile Money pour vos clients',
            ].map((element) => (
              <li key={element} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-500" />
                {element}
              </li>
            ))}
          </ul>
          <Link
            to="/partenaire/inscription"
            className="mt-10 inline-flex rounded-xl bg-forest-900 px-6 py-3.5 font-semibold text-white transition hover:bg-forest-800"
          >
            Créer mon compte partenaire
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Parcours d’inscription en 3 étapes (compte → dossier → attente). */
export function PageInscriptionPartenaire() {
  const { user, register, refresh } = useAuth()
  const [etape, setEtape] = useState(1)
  const [compte, setCompte] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })
  const [dossier, setDossier] = useState({
    type: '',
    company_name: '',
    manager_name: '',
    address: '',
    city: '',
    phone: '',
    whatsapp: '',
    rccm: '',
    nif: '',
  })
  const [typesPartenaire, setTypesPartenaire] = useState<{ slug: string; label: string }[]>([])
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    void api
      .get('/catalog/references', { params: { type: 'partner_type' } })
      .then(({ data }) => {
        const lignes = (data.data || []) as { slug: string; label: string }[]
        setTypesPartenaire(lignes)
        if (lignes[0] && !dossier.type) {
          setDossier((actuel) => ({ ...actuel, type: lignes[0].slug }))
        }
      })
      .catch(() => {
        const repli = [
          { slug: 'agency', label: 'Agence' },
          { slug: 'company', label: 'Entreprise' },
          { slug: 'individual', label: 'Particulier' },
        ]
        setTypesPartenaire(repli)
        setDossier((actuel) => ({ ...actuel, type: actuel.type || 'agency' }))
      })
  }, [])

  async function creerCompte(e: FormEvent) {
    e.preventDefault()
    setErreur('')
    try {
      if (!user) {
        await register({ ...compte, role: 'partner' })
      }
      setEtape(2)
    } catch {
      setErreur('Impossible de créer le compte.')
    }
  }

  async function soumettreDossier(e: FormEvent) {
    e.preventDefault()
    setErreur('')
    try {
      const { data } = await api.post('/partenaires/inscription', dossier)
      await refresh()
      setMessage(data.message)
      setEtape(3)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErreur(msg || 'Erreur lors de la soumission du dossier.')
    }
  }

  const libellesEtapes = ['Compte', 'Dossier', 'Validation']
  const progression = Math.round((etape / 3) * 100)

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="mb-4 flex items-center gap-3">
          {etape > 1 && etape < 3 ? (
            <button
              type="button"
              onClick={() => {
                setErreur('')
                setEtape((e) => Math.max(1, e - 1))
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand-200 bg-white text-forest-900 transition hover:bg-sand-50"
              aria-label="Étape précédente"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <Link
              to={etape === 3 ? '/partenaire' : '/'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand-200 bg-white text-forest-900 transition hover:bg-sand-50"
              aria-label="Retour"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-bold text-forest-950">Inscription partenaire</h1>
            <p className="mt-1 text-sm text-ink-500">
              Étape {etape} / 3 — {libellesEtapes[etape - 1]}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="h-2 overflow-hidden rounded-full bg-sand-200">
            <div
              className="h-full rounded-full bg-forest-900 transition-all duration-500 ease-out"
              style={{ width: `${progression}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-medium uppercase tracking-wide text-ink-400">
            {libellesEtapes.map((libelle, index) => (
              <span
                key={libelle}
                className={index + 1 <= etape ? 'text-forest-800' : undefined}
              >
                {libelle}
              </span>
            ))}
          </div>
        </div>

        {etape === 1 && (
          <form onSubmit={creerCompte} className="space-y-3 rounded-2xl border border-sand-200 bg-white p-6">
            {user ? (
              <p className="text-sm text-forest-700">Connecté en tant que {user.email}</p>
            ) : (
              <>
                {Object.entries({
                  name: 'Nom',
                  email: 'Email',
                  phone: 'Téléphone',
                  password: 'Mot de passe',
                  password_confirmation: 'Confirmation',
                }).map(([cle, libelle]) => (
                  <input
                    key={cle}
                    type={cle.includes('password') ? 'password' : cle === 'email' ? 'email' : 'text'}
                    placeholder={libelle}
                    value={compte[cle as keyof typeof compte]}
                    onChange={(e) => setCompte((actuel) => ({ ...actuel, [cle]: e.target.value }))}
                    className="w-full rounded-xl border border-sand-200 px-4 py-3"
                    required={cle !== 'phone'}
                  />
                ))}
              </>
            )}
            {erreur && <p className="text-sm text-red-700">{erreur}</p>}
            <button type="submit" className="w-full rounded-xl bg-forest-900 py-3 font-semibold text-white hover:bg-forest-800">
              Continuer
            </button>
          </form>
        )}

        {etape === 2 && (
          <form onSubmit={soumettreDossier} className="space-y-3 rounded-2xl border border-sand-200 bg-white p-6">
            <select
              value={dossier.type}
              onChange={(e) => setDossier((actuel) => ({ ...actuel, type: e.target.value }))}
              className="w-full rounded-xl border border-sand-200 px-4 py-3"
              required
            >
              {typesPartenaire.length === 0 && <option value="">Chargement…</option>}
              {typesPartenaire.map((type) => (
                <option key={type.slug} value={type.slug}>
                  {type.label}
                </option>
              ))}
            </select>
            {[
              ['company_name', 'Raison sociale'],
              ['manager_name', 'Nom du gérant'],
              ['address', 'Adresse'],
              ['city', 'Ville'],
              ['phone', 'Téléphone'],
              ['whatsapp', 'WhatsApp'],
              ['rccm', 'RCCM'],
              ['nif', 'NIF'],
            ].map(([cle, libelle]) => (
              <input
                key={cle}
                placeholder={libelle}
                value={dossier[cle as keyof typeof dossier]}
                onChange={(e) => setDossier((actuel) => ({ ...actuel, [cle]: e.target.value }))}
                className="w-full rounded-xl border border-sand-200 px-4 py-3"
                required={['manager_name', 'address', 'city', 'phone'].includes(cle)}
              />
            ))}
            <p className="text-xs text-ink-500">
              En soumettant, vous acceptez les CGU partenaires et le contrat de commission.
            </p>
            {erreur && <p className="text-sm text-red-700">{erreur}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setErreur('')
                  setEtape(1)
                }}
                className="rounded-xl border border-sand-200 px-4 py-3 text-sm font-semibold text-ink-700 hover:bg-sand-50"
              >
                Retour
              </button>
              <button type="submit" className="flex-1 rounded-xl bg-forest-900 py-3 font-semibold text-white hover:bg-forest-800">
                Soumettre mon dossier
              </button>
            </div>
          </form>
        )}

        {etape === 3 && (
          <div className="rounded-2xl border border-sand-200 bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Dossier</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink-900">En attente de validation</h2>
            <p className="mt-3 text-ink-700">{message || 'Dossier soumis. Statut : en attente de validation.'}</p>
            <p className="mt-2 text-sm text-ink-500">
              Vous ne pouvez pas publier de véhicules tant que le super admin n’a pas validé votre dossier.
            </p>
            <Link
              to="/partenaire"
              className="mt-6 inline-flex rounded-xl bg-forest-900 px-5 py-3 text-sm font-semibold text-white hover:bg-forest-800"
            >
              Accéder à mon espace
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

/** Tableau de bord : KPI + aperçus flotte / réservations. */
export function PageAccueilPartenaire() {
  const { tableauDeBord, nomPartenaire, chargementDonnees } =
    useOutletContext<ContexteSortiePartenaire>()
  const [vehicules, setVehicules] = useState<LigneVehicule[]>([])
  const [reservations, setReservations] = useState<LigneReservation[]>([])
  const [chargementListes, setChargementListes] = useState(true)

  useEffect(() => {
    void Promise.all([
      api.get('/partenaires/moi/vehicules').then((r) => setVehicules(r.data.data || [])),
      api.get('/partenaires/moi/reservations').then((r) => setReservations(r.data.data || [])),
    ])
      .catch(() => undefined)
      .finally(() => setChargementListes(false))
  }, [])

  const enAttente = String(tableauDeBord?.status) === 'pending'

  return (
    <div>
      <HeroPage
        surtitre="Tableau de bord"
        titre={nomPartenaire ? `Bonjour, ${nomPartenaire}` : 'Votre activité'}
        sousTitre="Pilotez flotte, réservations et clients depuis un seul espace chic et clair."
        action={
          <Link
            to="/partenaire/voitures/nouvelle"
            className="rounded-xl bg-forest-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-forest-800"
          >
            + Ajouter un véhicule
          </Link>
        }
      />

      {enAttente && (
        <div className="mb-8 rounded-2xl border border-black/10 bg-white px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">Dossier en attente de validation</p>
              <p className="text-sm text-ink-500">
                La publication de véhicules sera débloquée après approbation.
              </p>
            </div>
            <Link to="/partenaire/aide" className="text-sm font-medium text-ink-700 underline">
              Besoin d’aide ?
            </Link>
          </div>
        </div>
      )}

      {/* KPI : spinner uniquement dans cette grille */}
      {chargementDonnees || !tableauDeBord ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-black/8 bg-white p-5">
              <ContentLoader label="…" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <TuileStat libelle="Statut" valeur={libelleStatut(String(tableauDeBord.status))} />
          <TuileStat
            libelle="Réservations confirmées"
            valeur={String(tableauDeBord.confirmed_bookings ?? 0)}
            hint={`${tableauDeBord.today_bookings ?? 0} aujourd’hui`}
          />
          <TuileStat libelle="CA brut" valeur={formatXaf(Number(tableauDeBord.gross_revenue || 0))} />
          <TuileStat
            libelle="Flotte"
            valeur={`${tableauDeBord.published_vehicles ?? 0} / ${tableauDeBord.vehicles_count ?? 0}`}
            hint="Publiés / total"
          />
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-black/8 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink-900">Dernières voitures</h2>
            <Link to="/partenaire/voitures" className="text-sm font-medium text-ink-600 underline">
              Tout voir
            </Link>
          </div>
          {chargementListes ? (
            <ContentLoader label="Chargement flotte…" />
          ) : vehicules.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-500">Aucune voiture pour le moment.</p>
          ) : (
            <ul className="divide-y divide-black/5">
              {vehicules.slice(0, 5).map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {v.brand} {v.model}
                    </p>
                    <p className="text-ink-500">{formatXaf(v.price_per_day)} / jour</p>
                  </div>
                  <PastilleStatut statut={v.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-black/8 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink-900">Réservations récentes</h2>
            <Link to="/partenaire/reservations" className="text-sm font-medium text-ink-600 underline">
              Tout voir
            </Link>
          </div>
          {chargementListes ? (
            <ContentLoader label="Chargement réservations…" />
          ) : reservations.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-500">Pas encore de réservation.</p>
          ) : (
            <ul className="divide-y divide-black/5">
              {reservations.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {r.vehicle?.brand} {r.vehicle?.model}
                    </p>
                    <p className="text-ink-500">{r.customer?.name || 'Client'}</p>
                  </div>
                  <PastilleStatut statut={r.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { vers: '/partenaire/clients', libelle: 'Mes clients', desc: 'Annuaire locataires' },
          { vers: '/partenaire/reservations', libelle: 'Mes réservations', desc: 'Suivi des locations' },
          { vers: '/partenaire/aide', libelle: 'Aide', desc: 'FAQ & contact' },
        ].map((element) => (
          <Link
            key={element.vers}
            to={element.vers}
            className="rounded-2xl border border-black/8 bg-white px-5 py-4 transition hover:border-black/15"
          >
            <p className="font-display text-lg font-bold text-ink-900">{element.libelle}</p>
            <p className="mt-1 text-xs text-ink-500">{element.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

/** Grille de la flotte partenaire. */
export function PageMesVoitures() {
  const { labels } = useCatalog()
  const [vehicules, setVehicules] = useState<LigneVehicule[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    void api
      .get('/partenaires/moi/vehicules')
      .then((r) => setVehicules(r.data.data || []))
      .catch(() => setVehicules([]))
      .finally(() => setChargement(false))
  }, [])

  return (
    <div>
      <HeroPage
        surtitre="Flotte"
        titre="Mes voitures"
        sousTitre="Suivez le statut de chaque véhicule et préparez de nouvelles offres."
        action={
          <Link
            to="/partenaire/voitures/nouvelle"
            className="rounded-xl bg-forest-900 px-5 py-3 text-sm font-semibold text-white hover:bg-forest-800"
          >
            + Nouvelle voiture
          </Link>
        }
      />

      {chargement ? (
        <ContentLoader />
      ) : vehicules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white px-6 py-16 text-center">
          <p className="font-display text-xl font-bold text-ink-900">Votre flotte est vide</p>
          <p className="mt-2 text-sm text-ink-500">Ajoutez votre premier véhicule pour démarrer.</p>
          <Link
            to="/partenaire/voitures/nouvelle"
            className="mt-6 inline-flex rounded-xl bg-forest-900 px-5 py-3 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Publier une offre
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vehicules.map((v) => {
            const couverture =
              v.media?.find((m) => m.is_cover)?.url || v.media?.[0]?.url || v.cover_url || ''
            return (
              <article
                key={v.id}
                className="overflow-hidden rounded-2xl border border-black/8 bg-white"
              >
                <div className="relative aspect-[16/10] bg-black/[0.03]">
                  {couverture ? (
                    <img src={couverture} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-ink-500">Sans photo</div>
                  )}
                  <div className="absolute left-3 top-3">
                    <PastilleStatut statut={v.status} />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-bold text-ink-900">
                    {v.brand} {v.model}
                  </h3>
                  <p className="mt-1 text-sm text-ink-500">
                    {v.plate_number}
                    {v.category ? ` · ${labels.categories[v.category] || v.category}` : ''}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-ink-900">
                    {formatXaf(v.price_per_day)}
                    <span className="font-normal text-ink-500"> / jour</span>
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Formulaire de création d’un véhicule. */
export function PageNouvelleVoiture() {
  const { labels } = useCatalog()
  const naviguer = useNavigate()
  const { tableauDeBord } = useOutletContext<ContexteSortiePartenaire>()
  const [categories, setCategories] = useState<{ slug: string; label: string }[]>([])
  const [marques, setMarques] = useState<{ slug: string; label: string }[]>([])
  const [modeles, setModeles] = useState<{ slug: string; label: string }[]>([])
  const [slugMarque, setSlugMarque] = useState('')
  const [message, setMessage] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  const [formulaire, setFormulaire] = useState({
    brand: '',
    model: '',
    category: '',
    plate_number: '',
    seats: 5,
    transmission: 'automatic',
    fuel: 'petrol',
    price_per_day: 40000,
  })
  const [fichierCouverture, setFichierCouverture] = useState<File | null>(null)
  const [apercuCouverture, setApercuCouverture] = useState<string | null>(null)

  useEffect(() => {
    void Promise.all([
      api.get('/catalog/categories'),
      api.get('/catalog/references', { params: { type: 'marque' } }),
    ]).then(([cats, refs]) => {
      const liste = cats.data.data || []
      setCategories(liste)
      const listeMarques = (refs.data.data || []) as { slug: string; label: string }[]
      setMarques(listeMarques)
      setFormulaire((actuel) => ({
        ...actuel,
        category: actuel.category || liste[0]?.slug || '',
        brand: actuel.brand || listeMarques[0]?.label || '',
      }))
      if (listeMarques[0]) {
        setSlugMarque(listeMarques[0].slug)
      }
    })
  }, [])

  // Charge les modèles de la marque sélectionnée.
  useEffect(() => {
    if (!slugMarque) {
      setModeles([])
      return
    }
    void api
      .get('/catalog/references', { params: { type: 'modele', parent_slug: slugMarque } })
      .then(({ data }) => {
        const liste = (data.data || []) as { slug: string; label: string }[]
        setModeles(liste)
        setFormulaire((actuel) => ({
          ...actuel,
          model: liste.some((m) => m.label === actuel.model) ? actuel.model : liste[0]?.label || '',
        }))
      })
      .catch(() => setModeles([]))
  }, [slugMarque])

  const estApprouve = String(tableauDeBord?.status) === 'approved'

  async function ajouterVehicule(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    setEnregistrement(true)
    try {
      // FormData pour permettre l’upload de fichier image.
      const chargeUtile = new FormData()
      Object.entries(formulaire).forEach(([cle, valeur]) => {
        chargeUtile.append(cle, String(valeur))
      })
      if (fichierCouverture) {
        chargeUtile.append('cover', fichierCouverture)
      }
      await api.post('/partenaires/moi/vehicules', chargeUtile)
      setMessage('Véhicule créé avec succès.')
      setTimeout(() => naviguer('/partenaire/voitures'), 600)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setMessage(msg || 'Erreur lors de l’enregistrement.')
    } finally {
      setEnregistrement(false)
    }
  }

  function choisirPhoto(fichier: File | null) {
    if (apercuCouverture) URL.revokeObjectURL(apercuCouverture)
    setFichierCouverture(fichier)
    setApercuCouverture(fichier ? URL.createObjectURL(fichier) : null)
  }

  return (
    <div>
      <HeroPage
        surtitre="Flotte"
        titre="Ajouter un véhicule"
        sousTitre="Renseignez les informations essentielles pour publier une offre attractive."
      />

      {!estApprouve && (
        <div className="mb-6 rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-ink-700">
          Votre dossier n’est pas encore validé. L’enregistrement pourra être refusé jusqu’à approbation.
        </div>
      )}

      <form
        onSubmit={ajouterVehicule}
        className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-black/8 bg-white p-6 md:p-8"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="rounded-xl border border-sand-200 px-4 py-3"
            value={slugMarque}
            onChange={(e) => {
              const slug = e.target.value
              const marque = marques.find((m) => m.slug === slug)
              setSlugMarque(slug)
              setFormulaire((actuel) => ({ ...actuel, brand: marque?.label || '', model: '' }))
            }}
            required
          >
            <option value="">Marque</option>
            {marques.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-sand-200 px-4 py-3"
            value={formulaire.model}
            onChange={(e) => setFormulaire((actuel) => ({ ...actuel, model: e.target.value }))}
            required
            disabled={!slugMarque || modeles.length === 0}
          >
            <option value="">
              {!slugMarque ? 'Choisir une marque' : modeles.length === 0 ? 'Aucun modèle' : 'Modèle'}
            </option>
            {modeles.map((m) => (
              <option key={m.slug} value={m.label}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        {(marques.length === 0 || (slugMarque && modeles.length === 0)) && (
          <p className="text-sm text-ink-500">
            Aucune entrée ?{' '}
            <Link to="/partenaire/referentiel" className="underline">
              Configurez le référentiel
            </Link>
            .
          </p>
        )}
        <input
          className="w-full rounded-xl border border-sand-200 px-4 py-3"
          placeholder="Immatriculation"
          value={formulaire.plate_number}
          onChange={(e) => setFormulaire((actuel) => ({ ...actuel, plate_number: e.target.value }))}
          required
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="number"
            className="rounded-xl border border-sand-200 px-4 py-3"
            placeholder="Prix / jour"
            value={formulaire.price_per_day}
            onChange={(e) => setFormulaire((actuel) => ({ ...actuel, price_per_day: Number(e.target.value) }))}
            required
          />
          <input
            type="number"
            className="rounded-xl border border-sand-200 px-4 py-3"
            placeholder="Places"
            value={formulaire.seats}
            onChange={(e) => setFormulaire((actuel) => ({ ...actuel, seats: Number(e.target.value) }))}
            required
          />
        </div>
        <select
          className="w-full rounded-xl border border-sand-200 px-4 py-3"
          value={formulaire.category}
          onChange={(e) => setFormulaire((actuel) => ({ ...actuel, category: e.target.value }))}
          required
        >
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.label || labels.categories[cat.slug] || cat.slug}
            </option>
          ))}
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="rounded-xl border border-sand-200 px-4 py-3"
            value={formulaire.transmission}
            onChange={(e) => setFormulaire((actuel) => ({ ...actuel, transmission: e.target.value }))}
          >
            {Object.entries(labels.transmission).map(([slug, label]) => (
              <option key={slug} value={slug}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-sand-200 px-4 py-3"
            value={formulaire.fuel}
            onChange={(e) => setFormulaire((actuel) => ({ ...actuel, fuel: e.target.value }))}
          >
            {Object.entries(labels.fuel).map(([slug, label]) => (
              <option key={slug} value={slug}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3 rounded-xl border border-dashed border-black/15 bg-black/[0.015] p-4">
          <p className="text-sm font-medium text-ink-800">Photo de couverture</p>
          <p className="text-xs text-ink-500">JPG, PNG ou WebP — 5 Mo max.</p>
          {apercuCouverture && (
            <div className="overflow-hidden rounded-xl border border-black/8">
              <img src={apercuCouverture} alt="Aperçu" className="max-h-48 w-full object-cover" />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-ink-800 hover:bg-black/[0.02]">
              {fichierCouverture ? 'Changer l’image' : 'Choisir une image'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => choisirPhoto(e.target.files?.[0] || null)}
              />
            </label>
            {fichierCouverture && (
              <button
                type="button"
                onClick={() => choisirPhoto(null)}
                className="text-sm text-ink-500 underline"
              >
                Retirer
              </button>
            )}
            {fichierCouverture && (
              <span className="text-xs text-ink-500">{fichierCouverture.name}</span>
            )}
          </div>
        </div>
        {message && <p className="text-sm text-ink-700">{message}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <BoutonPrincipal type="submit" disabled={enregistrement} className="flex-1">
            {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
          </BoutonPrincipal>
          <Link
            to="/partenaire/voitures"
            className="rounded-xl border border-black/10 px-5 py-3 text-center text-sm font-medium text-ink-700"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}

/**
 * Marques / modèles partagés : tout partenaire peut ajouter, tout le monde voit.
 */
export function PageReferentielPartenaire() {
  type ElementRef = {
    id: number
    type: string
    slug: string
    label: string
    parent_slug?: string | null
    sort_order: number
    is_active: boolean
  }

  const [onglet, setOnglet] = useState<'marque' | 'modele'>('marque')
  const [elements, setElements] = useState<ElementRef[]>([])
  const [marques, setMarques] = useState<ElementRef[]>([])
  const [filtreMarque, setFiltreMarque] = useState('')
  const [chargement, setChargement] = useState(true)
  const [message, setMessage] = useState('')
  const [formulaire, setFormulaire] = useState({ label: '', parent_slug: '' })

  async function charger() {
    setChargement(true)
    try {
      const [refs, listeMarques] = await Promise.all([
        api.get('/partenaires/moi/referentiel', { params: { type: onglet } }),
        api.get('/partenaires/moi/referentiel', { params: { type: 'marque' } }),
      ])
      setElements(refs.data.data || [])
      setMarques(listeMarques.data.data || [])
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    void charger().catch(() => undefined)
  }, [onglet])

  const libelleMarque = (slug?: string | null) =>
    marques.find((m) => m.slug === slug)?.label || slug || '—'

  const elementsAffiches =
    onglet === 'modele' && filtreMarque
      ? elements.filter((el) => el.parent_slug === filtreMarque)
      : elements

  async function ajouter(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    try {
      await api.post('/partenaires/moi/referentiel', {
        type: onglet,
        label: formulaire.label.trim(),
        parent_slug: onglet === 'modele' ? formulaire.parent_slug || undefined : undefined,
      })
      setFormulaire({ label: '', parent_slug: formulaire.parent_slug })
      setMessage(
        onglet === 'marque'
          ? 'Marque ajoutée — visible pour tous les partenaires.'
          : 'Modèle ajouté — visible pour tous les partenaires.',
      )
      await charger()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setMessage(msg || 'Ajout impossible.')
    }
  }

  return (
    <div>
      <HeroPage
        surtitre="Configuration"
        titre="Référentiel"
        sousTitre="Marques et modèles partagés : tout ajout est visible chez tous les partenaires."
      />

      <div className="mb-5 rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-ink-600">
        Si une marque ou un modèle manque dans la liste, ajoutez-le ici. Il devient immédiatement
        disponible pour tous les partenaires et dans la console admin.
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ['marque', 'Marques'],
            ['modele', 'Modèles'],
          ] as const
        ).map(([cle, libelle]) => (
          <button
            key={cle}
            type="button"
            onClick={() => {
              setOnglet(cle)
              setFiltreMarque('')
              setMessage('')
            }}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              onglet === cle
                ? 'bg-forest-900 text-white'
                : 'border border-black/10 bg-white text-ink-700 hover:bg-black/[0.02]'
            }`}
          >
            {libelle}
          </button>
        ))}
      </div>

      {message && <p className="mb-4 text-sm text-ink-600">{message}</p>}

      <form
        onSubmit={ajouter}
        className="mb-6 grid gap-3 rounded-2xl border border-black/8 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {onglet === 'modele' && (
          <select
            required
            value={formulaire.parent_slug}
            onChange={(e) => setFormulaire((f) => ({ ...f, parent_slug: e.target.value }))}
            className="rounded-xl border border-black/10 px-3 py-2.5 text-sm"
          >
            <option value="">Marque parente *</option>
            {marques.map((m) => (
              <option key={m.id} value={m.slug}>
                {m.label}
              </option>
            ))}
          </select>
        )}
        <input
          required
          value={formulaire.label}
          onChange={(e) => setFormulaire((f) => ({ ...f, label: e.target.value }))}
          placeholder={onglet === 'marque' ? 'Ex. Nissan' : 'Ex. Qashqai'}
          className={`rounded-xl border border-black/10 px-3 py-2.5 text-sm ${onglet === 'marque' ? 'sm:col-span-2 lg:col-span-3' : 'lg:col-span-2'}`}
        />
        <button
          type="submit"
          className="rounded-xl bg-forest-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
        >
          Ajouter
        </button>
      </form>

      <TableauDonnees
        colonnes={
          onglet === 'marque'
            ? [
                { cle: 'label', libelle: 'Marque' },
                { cle: 'slug', libelle: 'Slug', classe: 'text-ink-500' },
                {
                  cle: 'is_active',
                  libelle: 'Statut',
                  rendu: (el) => (el.is_active ? 'Actif' : 'Inactif'),
                },
              ]
            : [
                { cle: 'label', libelle: 'Modèle' },
                {
                  cle: 'parent_slug',
                  libelle: 'Marque',
                  rendu: (el) => libelleMarque(el.parent_slug),
                },
                { cle: 'slug', libelle: 'Slug', classe: 'text-ink-500' },
                {
                  cle: 'is_active',
                  libelle: 'Statut',
                  rendu: (el) => (el.is_active ? 'Actif' : 'Inactif'),
                },
              ]
        }
        donnees={elementsAffiches}
        cleLigne={(el) => el.id}
        champsRecherche={(el) =>
          `${el.label} ${el.slug} ${el.parent_slug || ''} ${el.is_active ? 'actif' : 'inactif'} ${libelleMarque(el.parent_slug)}`
        }
        filtresSupplementaires={
          onglet === 'modele' ? (
            <select
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              value={filtreMarque}
              onChange={(e) => setFiltreMarque(e.target.value)}
            >
              <option value="">Toutes les marques</option>
              {marques.map((m) => (
                <option key={m.id} value={m.slug}>
                  {m.label}
                </option>
              ))}
            </select>
          ) : undefined
        }
        surActualiser={charger}
        chargement={chargement}
        messageVide={onglet === 'marque' ? 'Aucune marque.' : 'Aucun modèle.'}
      />
    </div>
  )
}

/** Liste des réservations du partenaire. */
export function PageMesReservations() {
  const [reservations, setReservations] = useState<LigneReservation[]>([])
  const [chargement, setChargement] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('')

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/partenaires/moi/reservations')
      setReservations(data.data || [])
    } catch {
      setReservations([])
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    void charger()
  }, [])

  const affichees = filtreStatut
    ? reservations.filter((r) => r.status === filtreStatut)
    : reservations

  return (
    <div>
      <HeroPage
        surtitre="Locations"
        titre="Mes réservations"
        sousTitre="Suivez chaque demande, du paiement à la restitution."
      />

      <TableauDonnees
        colonnes={[
          {
            cle: 'vehicule',
            libelle: 'Véhicule',
            rendu: (r) => (
              <div>
                <p className="font-medium">
                  {r.vehicle?.brand} {r.vehicle?.model}
                </p>
                <p className="text-xs text-ink-500">#{r.id}</p>
              </div>
            ),
          },
          {
            cle: 'client',
            libelle: 'Client',
            rendu: (r) => (
              <div>
                <p>{r.customer?.name || '—'}</p>
                <p className="text-xs text-ink-500">{r.customer?.email}</p>
              </div>
            ),
          },
          {
            cle: 'periode',
            libelle: 'Période',
            rendu: (r) => (
              <>
                {r.pickup_at ? new Date(r.pickup_at).toLocaleDateString('fr-FR') : '—'}
                {' → '}
                {r.return_at ? new Date(r.return_at).toLocaleDateString('fr-FR') : '—'}
              </>
            ),
          },
          {
            cle: 'montant',
            libelle: 'Montant',
            rendu: (r) => <span className="font-semibold">{formatXaf(Number(r.total_amount || 0))}</span>,
          },
          {
            cle: 'status',
            libelle: 'Statut',
            rendu: (r) => <PastilleStatut statut={r.status} />,
          },
        ]}
        donnees={affichees}
        cleLigne={(r) => r.id}
        champsRecherche={(r) =>
          `${r.id} ${r.vehicle?.brand} ${r.vehicle?.model} ${r.customer?.name} ${r.customer?.email} ${r.status}`
        }
        filtresSupplementaires={
          <select
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'].map((s) => (
              <option key={s} value={s}>
                {libelleStatut(s)}
              </option>
            ))}
          </select>
        }
        surActualiser={charger}
        chargement={chargement}
        messageVide="Aucune réservation."
      />
    </div>
  )
}

/**
 * Annuaire clients dérivé des réservations (pas d’endpoint dédié pour l’instant).
 */
export function PageMesClients() {
  type ClientLigne = {
    name: string
    email: string
    phone: string
    bookings: number
    spent: number
  }

  const [reservations, setReservations] = useState<LigneReservation[]>([])
  const [chargement, setChargement] = useState(true)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/partenaires/moi/reservations')
      setReservations(data.data || [])
    } catch {
      setReservations([])
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    void charger()
  }, [])

  const clients = useMemo(() => {
    const carte = new Map<string, ClientLigne>()
    for (const r of reservations) {
      const email = r.customer?.email || `invite-${r.id}`
      const precedent = carte.get(email) || {
        name: r.customer?.name || 'Client',
        email: r.customer?.email || '—',
        phone: r.customer?.phone || '—',
        bookings: 0,
        spent: 0,
      }
      precedent.bookings += 1
      precedent.spent += Number(r.total_amount || 0)
      carte.set(email, precedent)
    }
    return Array.from(carte.values())
  }, [reservations])

  return (
    <div>
      <HeroPage
        surtitre="Relation client"
        titre="Mes clients"
        sousTitre="Retrouvez les locataires issus de vos réservations."
      />

      <TableauDonnees
        colonnes={[
          {
            cle: 'name',
            libelle: 'Client',
            rendu: (c) => (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 bg-black/[0.03] text-xs font-bold text-ink-700">
                  {(c.name || 'C')
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() || '')
                    .join('')}
                </div>
                <span className="font-medium">{c.name}</span>
              </div>
            ),
          },
          { cle: 'email', libelle: 'Email' },
          { cle: 'phone', libelle: 'Téléphone' },
          {
            cle: 'bookings',
            libelle: 'Réservations',
            rendu: (c) => `${c.bookings}`,
          },
          {
            cle: 'spent',
            libelle: 'Total',
            rendu: (c) => <span className="font-semibold">{formatXaf(c.spent)}</span>,
          },
        ]}
        donnees={clients}
        cleLigne={(c) => c.email}
        champsRecherche={(c) => `${c.name} ${c.email} ${c.phone}`}
        surActualiser={charger}
        chargement={chargement}
        messageVide="Aucun client pour l’instant."
      />
    </div>
  )
}

/** Centre d’aide partenaire (FAQ + contact). */
export function PageAidePartenaire() {
  const questions = [
    {
      q: 'Quand puis-je publier mes véhicules ?',
      a: 'Dès que le super admin valide votre dossier partenaire (statut approuvé).',
    },
    {
      q: 'Comment suivre une réservation ?',
      a: 'Ouvrez « Mes réservations » pour voir le statut, le client et les dates de chaque location.',
    },
    {
      q: 'Où retrouver mes clients ?',
      a: 'Dans « Mes clients », agrégés automatiquement à partir de vos réservations.',
    },
    {
      q: 'Qui contacter en cas de litige ?',
      a: 'Écrivez à support@locagabon.ga ou utilisez le canal WhatsApp indiqué dans vos CGU partenaires.',
    },
  ]

  return (
    <div>
      <HeroPage
        surtitre="Support"
        titre="Aide"
        sousTitre="Réponses rapides pour piloter sereinement votre activité LocaGabon."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          {questions.map((element) => (
            <details
              key={element.q}
              className="group rounded-2xl border border-black/8 bg-white"
            >
              <summary className="cursor-pointer list-none px-5 py-4 font-medium text-ink-900 marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {element.q}
                  <span className="text-ink-400 transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="border-t border-black/5 px-5 py-4 text-sm text-ink-700">{element.a}</p>
            </details>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-black/8 bg-white p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Contact</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink-900">Besoin d’un coup de main ?</h2>
          <p className="mt-3 text-sm text-ink-500">
            Notre équipe partenaire vous répond sous 24 h ouvrées.
          </p>
          <a
            href="mailto:support@locagabon.ga"
            className="mt-6 inline-flex rounded-xl bg-forest-900 px-5 py-3 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Écrire au support
          </a>
          <Link to="/faq" className="mt-4 block text-sm text-ink-600 underline">
            Voir la FAQ publique
          </Link>
        </aside>
      </div>
    </div>
  )
}
