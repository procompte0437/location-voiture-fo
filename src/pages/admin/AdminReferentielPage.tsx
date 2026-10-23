import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BoutonActionCrud } from '../../components/ui/BoutonActionCrud'
import { FenetreModale } from '../../components/ui/FenetreModale'
import { IconeInformation } from '../../components/ui/IconeInformation'
import { ListeDeroulanteRecherche } from '../../components/ui/ListeDeroulanteRecherche'
import { TableauDonnees } from '../../components/ui/TableauDonnees'
import api from '../../lib/api'

/** Ligne du référentiel générique (marques, tris, carburants, etc.). */
type ElementReferentiel = {
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

type FiltreStatut = 'tous' | 'actif' | 'inactif'
type FiltreAccueil = 'tous' | 'oui' | 'non'

/** Fiche ouverte depuis une icône : consultation ou modification. */
type Fiche =
  | { genre: 'referentiel'; mode: 'voir' | 'modifier'; element: ElementReferentiel }
  | { genre: 'lieu'; mode: 'voir' | 'modifier'; element: Lieu }
  | { genre: 'categorie'; mode: 'voir' | 'modifier'; element: Categorie }

const LIBELLES_ONGLETS: Record<string, string> = {
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
  vehicle_sort: 'Tris catalogue',
}

const TYPES_REFERENTIEL = [
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
  'vehicle_sort',
]

const ONGLETS = ['lieux', 'categories', ...TYPES_REFERENTIEL] as const
type Onglet = (typeof ONGLETS)[number]

const CLASSE_CHAMP = 'w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm'
const CLASSE_FILTRE = 'w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm'

const TYPES_LIEU_SECOURS = [
  { slug: 'city', label: 'Ville' },
  { slug: 'airport', label: 'Aéroport' },
  { slug: 'district', label: 'Quartier' },
  { slug: 'agency_point', label: 'Point agence' },
]

/**
 * Référentiel admin : toutes les listes qui alimentent les menus du site.
 * Chaque onglet est un tableau (recherche, filtres, pagination, icônes).
 */
export function AdminReferentielPage() {
  const [params, setParams] = useSearchParams()
  const ongletParam = params.get('onglet') || 'lieux'
  const ongletActif: Onglet = (ONGLETS as readonly string[]).includes(ongletParam)
    ? (ongletParam as Onglet)
    : 'lieux'

  const [elements, setElements] = useState<ElementReferentiel[]>([])
  const [lieux, setLieux] = useState<Lieu[]>([])
  const [categories, setCategories] = useState<Categorie[]>([])
  const [typesLieu, setTypesLieu] = useState<ElementReferentiel[]>([])
  const [marques, setMarques] = useState<ElementReferentiel[]>([])
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('tous')
  const [filtreAccueil, setFiltreAccueil] = useState<FiltreAccueil>('tous')
  const [filtreTypeLieu, setFiltreTypeLieu] = useState('')
  const [fiche, setFiche] = useState<Fiche | null>(null)
  const [formulaire, setFormulaire] = useState({
    label: '',
    slug: '',
    sort_order: '0',
    parent_slug: '',
    is_active: true,
  })
  const [formulaireLieu, setFormulaireLieu] = useState({
    name: '',
    type: 'city',
    city: '',
    is_popular: true,
    is_active: true,
  })
  const [formulaireCategorie, setFormulaireCategorie] = useState({
    label: '',
    slug: '',
    description: '',
    sort_order: '0',
    show_on_home: true,
    is_active: true,
  })
  const [brouillonReferentiel, setBrouillonReferentiel] = useState(formulaire)
  const [brouillonLieu, setBrouillonLieu] = useState(formulaireLieu)
  const [brouillonCategorie, setBrouillonCategorie] = useState(formulaireCategorie)

  function changerOnglet(onglet: Onglet) {
    setParams(onglet === 'lieux' ? {} : { onglet })
    setMessage('')
    setFiltreStatut('tous')
    setFiltreAccueil('tous')
    setFiltreTypeLieu('')
    setFiche(null)
  }

  /** Recharge uniquement l’onglet affiché : les autres listes ne changent pas en même temps. */
  async function charger() {
    setChargement(true)
    try {
      if (ongletActif === 'lieux') {
        const [reponseLieux, reponseTypes] = await Promise.all([
          api.get('/admin/locations'),
          api.get('/admin/references', { params: { type: 'location_type' } }),
        ])
        setLieux(reponseLieux.data.data || [])
        const types = (reponseTypes.data.data || []) as ElementReferentiel[]
        setTypesLieu(types)
        setFormulaireLieu((actuel) => {
          if (types[0] && !types.some((type) => type.slug === actuel.type)) {
            return { ...actuel, type: types[0].slug }
          }
          return actuel
        })
      } else if (ongletActif === 'categories') {
        const { data } = await api.get('/admin/vehicle-categories')
        setCategories(data.data || [])
      } else {
        const requetes = [api.get('/admin/references', { params: { type: ongletActif } })]
        if (ongletActif === 'modele') {
          requetes.push(api.get('/admin/references', { params: { type: 'marque' } }))
        }
        const resultats = await Promise.all(requetes)
        setElements(resultats[0].data.data || [])
        if (ongletActif === 'modele') {
          setMarques(resultats[1]?.data.data || [])
        }
      }
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    void charger().catch(() => undefined)
    // Le rechargement suit l’onglet, pas chaque frappe du formulaire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ongletActif])

  const elementsFiltres = useMemo(
    () =>
      elements.filter(
        (element) => element.type === ongletActif && correspondStatut(element.is_active, filtreStatut),
      ),
    [elements, ongletActif, filtreStatut],
  )

  const lieuxFiltres = useMemo(
    () =>
      lieux.filter((lieu) => {
        if (!correspondStatut(lieu.is_active, filtreStatut)) return false
        if (filtreTypeLieu && lieu.type !== filtreTypeLieu) return false
        return true
      }),
    [lieux, filtreStatut, filtreTypeLieu],
  )

  const categoriesFiltrees = useMemo(
    () =>
      categories.filter((categorie) => {
        if (!correspondStatut(categorie.is_active, filtreStatut)) return false
        if (filtreAccueil === 'oui') return categorie.show_on_home
        if (filtreAccueil === 'non') return !categorie.show_on_home
        return true
      }),
    [categories, filtreStatut, filtreAccueil],
  )

  const optionsTypesLieu = (typesLieu.length ? typesLieu : TYPES_LIEU_SECOURS).map((type) => ({
    valeur: type.slug,
    libelle: type.label,
  }))

  function libelleMarque(slug?: string | null) {
    return marques.find((marque) => marque.slug === slug)?.label || slug || '—'
  }

  function libelleTypeLieu(slug: string) {
    return optionsTypesLieu.find((option) => option.valeur === slug)?.libelle || slug
  }

  function messageErreur(erreur: unknown, secours: string) {
    const axiosErr = erreur as {
      response?: { data?: { message?: string; errors?: Record<string, string[]> } }
    }
    return (
      axiosErr.response?.data?.message ||
      Object.values(axiosErr.response?.data?.errors || {})[0]?.[0] ||
      secours
    )
  }

  async function creerElement(evenement: FormEvent) {
    evenement.preventDefault()
    setMessage('')
    try {
      await api.post('/admin/references', {
        type: ongletActif,
        label: formulaire.label.trim(),
        slug: formulaire.slug.trim() || undefined,
        parent_slug: ongletActif === 'modele' ? formulaire.parent_slug || undefined : undefined,
        sort_order: Number(formulaire.sort_order || 0),
        is_active: formulaire.is_active,
      })
      setFormulaire({
        label: '',
        slug: '',
        sort_order: String((elementsFiltres.length + 1) * 10),
        parent_slug: formulaire.parent_slug,
        is_active: true,
      })
      setMessage('Élément ajouté')
      await charger()
    } catch (erreur: unknown) {
      setMessage(messageErreur(erreur, 'Création impossible'))
    }
  }

  async function creerLieu(evenement: FormEvent) {
    evenement.preventDefault()
    setMessage('')
    try {
      await api.post('/admin/locations', formulaireLieu)
      setFormulaireLieu({
        name: '',
        type: formulaireLieu.type || 'city',
        city: '',
        is_popular: true,
        is_active: true,
      })
      setMessage('Lieu ajouté — visible sur la recherche et l’accueil s’il est actif.')
      await charger()
    } catch (erreur: unknown) {
      setMessage(messageErreur(erreur, 'Création du lieu impossible'))
    }
  }

  async function creerCategorie(evenement: FormEvent) {
    evenement.preventDefault()
    setMessage('')
    try {
      await api.post('/admin/vehicle-categories', {
        label: formulaireCategorie.label.trim(),
        slug: formulaireCategorie.slug.trim() || undefined,
        description: formulaireCategorie.description || undefined,
        sort_order: Number(formulaireCategorie.sort_order || 0),
        show_on_home: formulaireCategorie.show_on_home,
        is_active: formulaireCategorie.is_active,
      })
      setFormulaireCategorie({
        label: '',
        slug: '',
        description: '',
        sort_order: String((categories.length + 1) * 10),
        show_on_home: true,
        is_active: true,
      })
      setMessage('Catégorie ajoutée')
      await charger()
    } catch (erreur: unknown) {
      setMessage(messageErreur(erreur, 'Création impossible'))
    }
  }

  function ouvrirFiche(prochaine: Fiche) {
    setFiche(prochaine)
    if (prochaine.mode !== 'modifier') return
    if (prochaine.genre === 'referentiel') {
      setBrouillonReferentiel({
        label: prochaine.element.label,
        slug: prochaine.element.slug,
        sort_order: String(prochaine.element.sort_order),
        parent_slug: prochaine.element.parent_slug || '',
        is_active: prochaine.element.is_active,
      })
    }
    if (prochaine.genre === 'lieu') {
      setBrouillonLieu({
        name: prochaine.element.name,
        type: prochaine.element.type,
        city: prochaine.element.city || '',
        is_popular: prochaine.element.is_popular,
        is_active: prochaine.element.is_active,
      })
    }
    if (prochaine.genre === 'categorie') {
      setBrouillonCategorie({
        label: prochaine.element.label,
        slug: prochaine.element.slug,
        description: prochaine.element.description || '',
        sort_order: String(prochaine.element.sort_order),
        show_on_home: prochaine.element.show_on_home,
        is_active: prochaine.element.is_active,
      })
    }
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    if (!fiche || fiche.mode !== 'modifier') return
    setEnregistrement(true)
    setMessage('')
    try {
      if (fiche.genre === 'referentiel') {
        await api.patch(`/admin/references/${fiche.element.id}`, {
          label: brouillonReferentiel.label.trim(),
          slug: brouillonReferentiel.slug.trim(),
          parent_slug:
            ongletActif === 'modele' ? brouillonReferentiel.parent_slug || null : fiche.element.parent_slug,
          sort_order: Number(brouillonReferentiel.sort_order || 0),
          is_active: brouillonReferentiel.is_active,
        })
      } else if (fiche.genre === 'lieu') {
        await api.patch(`/admin/locations/${fiche.element.id}`, brouillonLieu)
      } else {
        await api.patch(`/admin/vehicle-categories/${fiche.element.id}`, {
          label: brouillonCategorie.label.trim(),
          slug: brouillonCategorie.slug.trim(),
          description: brouillonCategorie.description || null,
          sort_order: Number(brouillonCategorie.sort_order || 0),
          show_on_home: brouillonCategorie.show_on_home,
          is_active: brouillonCategorie.is_active,
        })
      }
      setMessage('Modification enregistrée')
      setFiche(null)
      await charger()
    } catch (erreur: unknown) {
      setMessage(messageErreur(erreur, 'Modification impossible'))
    } finally {
      setEnregistrement(false)
    }
  }

  async function basculerActif(element: ElementReferentiel) {
    await api.patch(`/admin/references/${element.id}`, { is_active: !element.is_active })
    await charger()
  }

  async function supprimerElement(element: ElementReferentiel) {
    if (!window.confirm(`Supprimer « ${element.label} » ?`)) return
    await api.delete(`/admin/references/${element.id}`)
    setMessage(`« ${element.label} » supprimé`)
    setFiche(null)
    await charger()
  }

  async function basculerLieu(id: number, correctif: Record<string, boolean>) {
    await api.patch(`/admin/locations/${id}`, correctif)
    await charger()
  }

  async function supprimerLieu(lieu: Lieu) {
    if (!window.confirm(`Supprimer « ${lieu.name} » ?`)) return
    await api.delete(`/admin/locations/${lieu.id}`)
    setMessage('Lieu supprimé')
    setFiche(null)
    await charger()
  }

  async function basculerCategorie(categorie: Categorie, correctif: Partial<Categorie>) {
    await api.patch(`/admin/vehicle-categories/${categorie.id}`, correctif)
    await charger()
  }

  async function supprimerCategorie(categorie: Categorie) {
    if (!window.confirm(`Supprimer « ${categorie.label} » ?`)) return
    await api.delete(`/admin/vehicle-categories/${categorie.id}`)
    setMessage(`« ${categorie.label} » supprimée`)
    setFiche(null)
    await charger()
  }

  const filtreStatutSelect = (
    <select
      value={filtreStatut}
      onChange={(evenement) => setFiltreStatut(evenement.target.value as FiltreStatut)}
      className={CLASSE_FILTRE}
      aria-label="Filtrer par statut"
    >
      <option value="tous">Tous les statuts</option>
      <option value="actif">Actifs</option>
      <option value="inactif">Inactifs</option>
    </select>
  )

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <div className="mb-7">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">Référentiel</h1>
          <IconeInformation titre="À quoi sert le référentiel">
            <p>
              Toutes les listes déroulantes de la plateforme : lieux, catégories, marques, modèles,
              carburants, âges conducteur, paiements.
            </p>
            <p>Chaque liste se filtre, se pagine et s’actualise depuis son tableau.</p>
          </IconeInformation>
        </div>
      </div>

      {message && <p className="mb-4 text-sm text-ink-600">{message}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {ONGLETS.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => changerOnglet(type)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              ongletActif === type
                ? 'bg-[#8c4205] text-white'
                : 'border border-black/10 bg-white text-ink-700 hover:bg-[#f4f5f4]'
            }`}
          >
            {LIBELLES_ONGLETS[type] || type}
          </button>
        ))}
      </div>

      {ongletActif === 'lieux' && (
        <>
          <form
            onSubmit={creerLieu}
            className="mb-6 grid gap-3 rounded-xl border border-black/8 bg-white p-5 md:grid-cols-2 lg:grid-cols-5"
          >
            <input
              required
              placeholder="Nom (ex. Port-Gentil)"
              value={formulaireLieu.name}
              onChange={(evenement) =>
                setFormulaireLieu((actuel) => ({ ...actuel, name: evenement.target.value }))
              }
              className="rounded-xl border border-black/10 px-3 py-2.5 lg:col-span-2"
            />
            <ListeDeroulanteRecherche
              valeur={formulaireLieu.type}
              onChange={(valeur) => setFormulaireLieu((actuel) => ({ ...actuel, type: valeur }))}
              options={optionsTypesLieu}
              libelle="Type de lieu"
            />
            <input
              placeholder="Ville liée"
              value={formulaireLieu.city}
              onChange={(evenement) =>
                setFormulaireLieu((actuel) => ({ ...actuel, city: evenement.target.value }))
              }
              className="rounded-xl border border-black/10 px-3 py-2.5"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#8c4205] px-4 py-2.5 font-semibold text-white hover:bg-[#733806]"
            >
              Ajouter
            </button>
          </form>

          <TableauDonnees
            colonnes={[
              { cle: 'name', libelle: 'Nom', rendu: (lieu) => <span className="font-medium">{lieu.name}</span> },
              { cle: 'type', libelle: 'Type', rendu: (lieu) => libelleTypeLieu(lieu.type) },
              { cle: 'city', libelle: 'Ville' },
              { cle: 'slug', libelle: 'Code', classe: 'font-mono text-xs text-ink-500' },
              {
                cle: 'is_popular',
                libelle: 'Visibilité',
                rendu: (lieu) => (
                  <Pastille
                    actif={lieu.is_popular}
                    libelleActif="Populaire"
                    libelleInactif="Standard"
                    onClick={() => void basculerLieu(lieu.id, { is_popular: !lieu.is_popular })}
                  />
                ),
              },
              {
                cle: 'is_active',
                libelle: 'Statut',
                rendu: (lieu) => (
                  <Pastille
                    actif={lieu.is_active}
                    libelleActif="Actif"
                    libelleInactif="Inactif"
                    onClick={() => void basculerLieu(lieu.id, { is_active: !lieu.is_active })}
                  />
                ),
              },
            ]}
            donnees={lieuxFiltres}
            cleLigne={(lieu) => lieu.id}
            champsRecherche={(lieu) =>
              `${lieu.name} ${lieu.city || ''} ${lieu.slug} ${libelleTypeLieu(lieu.type)}`
            }
            filtresSupplementaires={
              <>
                {filtreStatutSelect}
                <select
                  value={filtreTypeLieu}
                  onChange={(evenement) => setFiltreTypeLieu(evenement.target.value)}
                  className={CLASSE_FILTRE}
                  aria-label="Filtrer par type de lieu"
                >
                  <option value="">Tous les types</option>
                  {optionsTypesLieu.map((option) => (
                    <option key={option.valeur} value={option.valeur}>
                      {option.libelle}
                    </option>
                  ))}
                </select>
              </>
            }
            filtreActif={filtreStatut !== 'tous' || filtreTypeLieu !== ''}
            surActualiser={charger}
            chargement={chargement}
            messageVide="Aucun lieu. Ajoutez les destinations affichées sur le site public."
            actions={(lieu) => (
              <>
                <BoutonActionCrud
                  variante="voir"
                  libelle="Voir le détail"
                  onClick={() => ouvrirFiche({ genre: 'lieu', mode: 'voir', element: lieu })}
                />
                <BoutonActionCrud
                  variante="modifier"
                  libelle="Modifier"
                  onClick={() => ouvrirFiche({ genre: 'lieu', mode: 'modifier', element: lieu })}
                />
                <BoutonActionCrud
                  variante="supprimer"
                  libelle="Supprimer"
                  onClick={() => void supprimerLieu(lieu)}
                />
              </>
            )}
          />
        </>
      )}

      {ongletActif === 'categories' && (
        <>
          <form
            onSubmit={creerCategorie}
            className="mb-6 grid gap-3 rounded-xl border border-black/8 bg-white p-5 md:grid-cols-2 lg:grid-cols-5"
          >
            <input
              required
              placeholder="Libellé (ex. SUV)"
              value={formulaireCategorie.label}
              onChange={(evenement) =>
                setFormulaireCategorie((actuel) => ({ ...actuel, label: evenement.target.value }))
              }
              className="rounded-xl border border-black/10 px-3 py-2.5 lg:col-span-2"
            />
            <input
              placeholder="Code (slug)"
              value={formulaireCategorie.slug}
              onChange={(evenement) =>
                setFormulaireCategorie((actuel) => ({ ...actuel, slug: evenement.target.value }))
              }
              className="rounded-xl border border-black/10 px-3 py-2.5"
            />
            <input
              type="number"
              min={0}
              placeholder="Ordre"
              value={formulaireCategorie.sort_order}
              onChange={(evenement) =>
                setFormulaireCategorie((actuel) => ({ ...actuel, sort_order: evenement.target.value }))
              }
              className="rounded-xl border border-black/10 px-3 py-2.5"
            />
            <button type="submit" className="rounded-xl bg-[#8c4205] px-4 py-2.5 font-semibold text-white">
              Ajouter
            </button>
          </form>

          <TableauDonnees
            colonnes={[
              { cle: 'sort_order', libelle: 'Ordre' },
              {
                cle: 'label',
                libelle: 'Libellé',
                rendu: (categorie) => <span className="font-medium">{categorie.label}</span>,
              },
              { cle: 'slug', libelle: 'Code', classe: 'font-mono text-xs text-ink-500' },
              {
                cle: 'show_on_home',
                libelle: 'Accueil',
                rendu: (categorie) => (
                  <Pastille
                    actif={categorie.show_on_home}
                    libelleActif="Oui"
                    libelleInactif="Non"
                    onClick={() =>
                      void basculerCategorie(categorie, { show_on_home: !categorie.show_on_home })
                    }
                  />
                ),
              },
              {
                cle: 'is_active',
                libelle: 'Statut',
                rendu: (categorie) => (
                  <Pastille
                    actif={categorie.is_active}
                    libelleActif="Actif"
                    libelleInactif="Inactif"
                    onClick={() => void basculerCategorie(categorie, { is_active: !categorie.is_active })}
                  />
                ),
              },
            ]}
            donnees={categoriesFiltrees}
            cleLigne={(categorie) => categorie.id}
            champsRecherche={(categorie) => `${categorie.label} ${categorie.slug} ${categorie.description || ''}`}
            filtresSupplementaires={
              <>
                {filtreStatutSelect}
                <select
                  value={filtreAccueil}
                  onChange={(evenement) => setFiltreAccueil(evenement.target.value as FiltreAccueil)}
                  className={CLASSE_FILTRE}
                  aria-label="Filtrer par affichage accueil"
                >
                  <option value="tous">Accueil : tous</option>
                  <option value="oui">Visibles à l’accueil</option>
                  <option value="non">Masqués à l’accueil</option>
                </select>
              </>
            }
            filtreActif={filtreStatut !== 'tous' || filtreAccueil !== 'tous'}
            surActualiser={charger}
            chargement={chargement}
            messageVide="Aucune catégorie véhicule."
            actions={(categorie) => (
              <>
                <BoutonActionCrud
                  variante="voir"
                  libelle="Voir le détail"
                  onClick={() => ouvrirFiche({ genre: 'categorie', mode: 'voir', element: categorie })}
                />
                <BoutonActionCrud
                  variante="modifier"
                  libelle="Modifier"
                  onClick={() => ouvrirFiche({ genre: 'categorie', mode: 'modifier', element: categorie })}
                />
                <BoutonActionCrud
                  variante="supprimer"
                  libelle="Supprimer"
                  onClick={() => void supprimerCategorie(categorie)}
                />
              </>
            )}
          />
        </>
      )}

      {ongletActif !== 'lieux' && ongletActif !== 'categories' && (
        <>
          <form
            onSubmit={creerElement}
            className="mb-6 grid gap-3 rounded-xl border border-black/8 bg-white p-5 md:grid-cols-2 lg:grid-cols-6"
          >
            {ongletActif === 'modele' && (
              <label className="block space-y-1.5 lg:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-400">Marque *</span>
                <ListeDeroulanteRecherche
                  requis
                  valeur={formulaire.parent_slug}
                  onChange={(valeur) => setFormulaire((actuel) => ({ ...actuel, parent_slug: valeur }))}
                  options={marques.map((marque) => ({ valeur: marque.slug, libelle: marque.label }))}
                  placeholder="Choisir…"
                  libelle="Marque"
                />
              </label>
            )}
            <label className="block space-y-1.5 lg:col-span-2">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-400">Libellé *</span>
              <input
                required
                value={formulaire.label}
                onChange={(evenement) =>
                  setFormulaire((actuel) => ({ ...actuel, label: evenement.target.value }))
                }
                placeholder={
                  ongletActif === 'driver_age'
                    ? 'Ex. 25-69 ans'
                    : ongletActif === 'payment_method'
                      ? 'Ex. Airtel Money'
                      : ongletActif === 'vehicle_sort'
                        ? 'Ex. Prix croissant'
                        : 'Ex. Nouveau libellé'
                }
                className={CLASSE_CHAMP}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-400">
                Code (slug)
                {ongletActif === 'vehicle_sort' && (
                  <IconeInformation titre="Codes autorisés pour le tri">
                    <p>
                      Le code (slug) doit rester <code>price</code>, <code>rating</code> ou{' '}
                      <code>popularity</code> pour que le tri catalogue fonctionne.
                    </p>
                    <p>Le libellé, l’ordre et l’activation de chaque option restent modifiables.</p>
                  </IconeInformation>
                )}
              </span>
              <input
                value={formulaire.slug}
                onChange={(evenement) =>
                  setFormulaire((actuel) => ({ ...actuel, slug: evenement.target.value }))
                }
                placeholder={
                  ongletActif === 'driver_age'
                    ? '25'
                    : ongletActif === 'vehicle_sort'
                      ? 'price | rating | popularity'
                      : 'auto'
                }
                className={CLASSE_CHAMP}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-400">Ordre</span>
              <input
                type="number"
                min={0}
                value={formulaire.sort_order}
                onChange={(evenement) =>
                  setFormulaire((actuel) => ({ ...actuel, sort_order: evenement.target.value }))
                }
                className={CLASSE_CHAMP}
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#8c4205] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Ajouter
              </button>
            </div>
          </form>

          <TableauDonnees
            colonnes={[
              { cle: 'sort_order', libelle: 'Ordre' },
              {
                cle: 'label',
                libelle: 'Libellé',
                rendu: (element) => <span className="font-medium">{element.label}</span>,
              },
              ...(ongletActif === 'modele'
                ? [
                    {
                      cle: 'parent_slug',
                      libelle: 'Marque',
                      rendu: (element: ElementReferentiel) => libelleMarque(element.parent_slug),
                    },
                  ]
                : []),
              { cle: 'slug', libelle: 'Code', classe: 'font-mono text-xs text-ink-500' },
              {
                cle: 'is_active',
                libelle: 'Statut',
                rendu: (element) => (
                  <Pastille
                    actif={element.is_active}
                    libelleActif="Actif"
                    libelleInactif="Inactif"
                    onClick={() => void basculerActif(element)}
                  />
                ),
              },
            ]}
            donnees={elementsFiltres}
            cleLigne={(element) => element.id}
            champsRecherche={(element) =>
              `${element.label} ${element.slug} ${libelleMarque(element.parent_slug)}`
            }
            filtresSupplementaires={filtreStatutSelect}
            filtreActif={filtreStatut !== 'tous'}
            surActualiser={charger}
            chargement={chargement}
            messageVide={`Aucun élément pour « ${LIBELLES_ONGLETS[ongletActif] || ongletActif} ».`}
            actions={(element) => (
              <>
                <BoutonActionCrud
                  variante="voir"
                  libelle="Voir le détail"
                  onClick={() => ouvrirFiche({ genre: 'referentiel', mode: 'voir', element })}
                />
                <BoutonActionCrud
                  variante="modifier"
                  libelle="Modifier"
                  onClick={() => ouvrirFiche({ genre: 'referentiel', mode: 'modifier', element })}
                />
                <BoutonActionCrud
                  variante="supprimer"
                  libelle="Supprimer"
                  onClick={() => void supprimerElement(element)}
                />
              </>
            )}
          />
        </>
      )}

      <FenetreModale
        ouvert={fiche !== null}
        titre={titreFiche(fiche, libelleMarque)}
        onFermer={() => setFiche(null)}
      >
        {fiche?.mode === 'voir' && (
          <dl className="space-y-3 text-sm">
            {fiche.genre === 'referentiel' && (
              <>
                <LigneDetail libelle="Libellé" valeur={fiche.element.label} />
                <LigneDetail libelle="Code" valeur={fiche.element.slug} />
                {ongletActif === 'modele' && (
                  <LigneDetail libelle="Marque" valeur={libelleMarque(fiche.element.parent_slug)} />
                )}
                <LigneDetail libelle="Ordre" valeur={String(fiche.element.sort_order)} />
                <LigneDetail libelle="Statut" valeur={fiche.element.is_active ? 'Actif' : 'Inactif'} />
              </>
            )}
            {fiche.genre === 'lieu' && (
              <>
                <LigneDetail libelle="Nom" valeur={fiche.element.name} />
                <LigneDetail libelle="Type" valeur={libelleTypeLieu(fiche.element.type)} />
                <LigneDetail libelle="Ville" valeur={fiche.element.city || '—'} />
                <LigneDetail libelle="Code" valeur={fiche.element.slug} />
                <LigneDetail libelle="Visibilité" valeur={fiche.element.is_popular ? 'Populaire' : 'Standard'} />
                <LigneDetail libelle="Statut" valeur={fiche.element.is_active ? 'Actif' : 'Inactif'} />
              </>
            )}
            {fiche.genre === 'categorie' && (
              <>
                <LigneDetail libelle="Libellé" valeur={fiche.element.label} />
                <LigneDetail libelle="Code" valeur={fiche.element.slug} />
                <LigneDetail libelle="Description" valeur={fiche.element.description || '—'} />
                <LigneDetail libelle="Ordre" valeur={String(fiche.element.sort_order)} />
                <LigneDetail libelle="Accueil" valeur={fiche.element.show_on_home ? 'Oui' : 'Non'} />
                <LigneDetail libelle="Statut" valeur={fiche.element.is_active ? 'Actif' : 'Inactif'} />
              </>
            )}
          </dl>
        )}

        {fiche?.mode === 'modifier' && (
          <form onSubmit={enregistrer} className="space-y-3">
            {fiche.genre === 'referentiel' && (
              <>
                {ongletActif === 'modele' && (
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-ink-400">Marque</span>
                    <ListeDeroulanteRecherche
                      requis
                      valeur={brouillonReferentiel.parent_slug}
                      onChange={(valeur) =>
                        setBrouillonReferentiel((actuel) => ({ ...actuel, parent_slug: valeur }))
                      }
                      options={marques.map((marque) => ({ valeur: marque.slug, libelle: marque.label }))}
                      libelle="Marque"
                    />
                  </label>
                )}
                <ChampTexte
                  libelle="Libellé"
                  valeur={brouillonReferentiel.label}
                  onChange={(valeur) => setBrouillonReferentiel((actuel) => ({ ...actuel, label: valeur }))}
                />
                <ChampTexte
                  libelle="Code (slug)"
                  valeur={brouillonReferentiel.slug}
                  onChange={(valeur) => setBrouillonReferentiel((actuel) => ({ ...actuel, slug: valeur }))}
                  aide={
                    ongletActif === 'vehicle_sort' ? (
                      <IconeInformation titre="Codes autorisés pour le tri">
                        <p>
                          Conservez <code>price</code>, <code>rating</code> ou <code>popularity</code>{' '}
                          pour que le catalogue sache quel tri appliquer.
                        </p>
                      </IconeInformation>
                    ) : null
                  }
                />
                <ChampTexte
                  libelle="Ordre"
                  type="number"
                  valeur={brouillonReferentiel.sort_order}
                  onChange={(valeur) =>
                    setBrouillonReferentiel((actuel) => ({ ...actuel, sort_order: valeur }))
                  }
                />
                <CaseCochee
                  libelle="Actif"
                  coche={brouillonReferentiel.is_active}
                  onChange={(coche) =>
                    setBrouillonReferentiel((actuel) => ({ ...actuel, is_active: coche }))
                  }
                />
              </>
            )}
            {fiche.genre === 'lieu' && (
              <>
                <ChampTexte
                  libelle="Nom"
                  valeur={brouillonLieu.name}
                  onChange={(valeur) => setBrouillonLieu((actuel) => ({ ...actuel, name: valeur }))}
                />
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-400">Type</span>
                  <ListeDeroulanteRecherche
                    valeur={brouillonLieu.type}
                    onChange={(valeur) => setBrouillonLieu((actuel) => ({ ...actuel, type: valeur }))}
                    options={optionsTypesLieu}
                    libelle="Type de lieu"
                  />
                </label>
                <ChampTexte
                  libelle="Ville"
                  valeur={brouillonLieu.city}
                  onChange={(valeur) => setBrouillonLieu((actuel) => ({ ...actuel, city: valeur }))}
                />
                <CaseCochee
                  libelle="Populaire"
                  coche={brouillonLieu.is_popular}
                  onChange={(coche) => setBrouillonLieu((actuel) => ({ ...actuel, is_popular: coche }))}
                />
                <CaseCochee
                  libelle="Actif"
                  coche={brouillonLieu.is_active}
                  onChange={(coche) => setBrouillonLieu((actuel) => ({ ...actuel, is_active: coche }))}
                />
              </>
            )}
            {fiche.genre === 'categorie' && (
              <>
                <ChampTexte
                  libelle="Libellé"
                  valeur={brouillonCategorie.label}
                  onChange={(valeur) => setBrouillonCategorie((actuel) => ({ ...actuel, label: valeur }))}
                />
                <ChampTexte
                  libelle="Code (slug)"
                  valeur={brouillonCategorie.slug}
                  onChange={(valeur) => setBrouillonCategorie((actuel) => ({ ...actuel, slug: valeur }))}
                />
                <ChampTexte
                  libelle="Description"
                  valeur={brouillonCategorie.description}
                  onChange={(valeur) =>
                    setBrouillonCategorie((actuel) => ({ ...actuel, description: valeur }))
                  }
                />
                <ChampTexte
                  libelle="Ordre"
                  type="number"
                  valeur={brouillonCategorie.sort_order}
                  onChange={(valeur) =>
                    setBrouillonCategorie((actuel) => ({ ...actuel, sort_order: valeur }))
                  }
                />
                <CaseCochee
                  libelle="Visible à l’accueil"
                  coche={brouillonCategorie.show_on_home}
                  onChange={(coche) =>
                    setBrouillonCategorie((actuel) => ({ ...actuel, show_on_home: coche }))
                  }
                />
                <CaseCochee
                  libelle="Active"
                  coche={brouillonCategorie.is_active}
                  onChange={(coche) => setBrouillonCategorie((actuel) => ({ ...actuel, is_active: coche }))}
                />
              </>
            )}
            <button
              type="submit"
              disabled={enregistrement}
              className="rounded-xl bg-[#8c4205] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        )}
      </FenetreModale>
    </div>
  )
}

function correspondStatut(actif: boolean, filtre: FiltreStatut) {
  if (filtre === 'actif') return actif
  if (filtre === 'inactif') return !actif
  return true
}

function titreFiche(fiche: Fiche | null, libelleMarque: (slug?: string | null) => string) {
  if (!fiche) return ''
  const action = fiche.mode === 'voir' ? 'Détail' : 'Modifier'
  if (fiche.genre === 'lieu') return `${action} — ${fiche.element.name}`
  if (fiche.genre === 'categorie') return `${action} — ${fiche.element.label}`
  const marque = fiche.element.parent_slug ? ` (${libelleMarque(fiche.element.parent_slug)})` : ''
  return `${action} — ${fiche.element.label}${marque}`
}

function LigneDetail({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-black/6 pb-2">
      <dt className="text-ink-500">{libelle}</dt>
      <dd className="text-right font-medium text-ink-900">{valeur}</dd>
    </div>
  )
}

function ChampTexte({
  libelle,
  valeur,
  onChange,
  type = 'text',
  aide,
}: {
  libelle: string
  valeur: string
  onChange: (valeur: string) => void
  type?: string
  aide?: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-400">
        {libelle}
        {aide}
      </span>
      <input
        required={libelle !== 'Description' && libelle !== 'Ville'}
        type={type}
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        className={CLASSE_CHAMP}
      />
    </label>
  )
}

function CaseCochee({
  libelle,
  coche,
  onChange,
}: {
  libelle: string
  coche: boolean
  onChange: (coche: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-800">
      <input
        type="checkbox"
        checked={coche}
        onChange={(evenement) => onChange(evenement.target.checked)}
        className="h-4 w-4 accent-[#8c4205]"
      />
      {libelle}
    </label>
  )
}

/** Pastille cliquable : le statut reste lisible, le basculement ne passe pas par un bouton texte. */
function Pastille({
  actif,
  libelleActif,
  libelleInactif,
  onClick,
}: {
  actif: boolean
  libelleActif: string
  libelleInactif: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={actif ? `Passer à « ${libelleInactif} »` : `Passer à « ${libelleActif} »`}
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        actif ? 'bg-[#8c4205]/10 text-[#8c4205]' : 'bg-[#f0f1f0] text-ink-500'
      }`}
    >
      {actif ? libelleActif : libelleInactif}
    </button>
  )
}
