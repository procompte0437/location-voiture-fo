import { useEffect, useState, type FormEvent } from 'react'
import { BoutonActionCrud } from '../../components/ui/BoutonActionCrud'
import { TableauDonnees } from '../../components/ui/TableauDonnees'
import { ContentLoader } from '../../components/ui/Spinner'
import { PROVINCES_GABON } from '../../data/provincesGabon'
import api from '../../lib/api'

type PartenaireOption = { id: number; company_name?: string; manager_name?: string }
type LieuOption = { id: number; name: string }

type AgenceLigne = {
  id: number
  name: string
  address: string
  city: string
  province_slug: string | null
  is_active: boolean
  partner_id: number
  location_id?: number | null
  partner?: PartenaireOption
  location?: LieuOption | null
}

type FormulaireAgence = {
  partner_id: string
  location_id: string
  name: string
  address: string
  city: string
  province_slug: string
  is_active: boolean
}

const FORMULAIRE_VIDE: FormulaireAgence = {
  partner_id: '',
  location_id: '',
  name: '',
  address: '',
  city: '',
  province_slug: 'estuaire',
  is_active: true,
}

/**
 * Super admin — créer et rattacher les agences aux provinces (carte d’accueil).
 */
export function AdminAgencesPage() {
  const [agences, setAgences] = useState<AgenceLigne[]>([])
  const [partenaires, setPartenaires] = useState<PartenaireOption[]>([])
  const [lieux, setLieux] = useState<LieuOption[]>([])
  const [chargement, setChargement] = useState(true)
  const [msg, setMsg] = useState('')
  const [editionId, setEditionId] = useState<number | null>(null)
  const [filtreProvince, setFiltreProvince] = useState('')
  const [form, setForm] = useState<FormulaireAgence>(FORMULAIRE_VIDE)

  async function charger() {
    setChargement(true)
    try {
      const [a, p, l] = await Promise.all([
        api.get('/admin/agences'),
        api.get('/admin/partners', { params: { per_page: 100, status: 'approved' } }),
        api.get('/admin/locations'),
      ])
      setAgences(a.data.data || [])
      setPartenaires(p.data.data || [])
      setLieux(l.data.data || [])
    } catch {
      setAgences([])
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    void charger()
  }, [])

  function demarrerEdition(a: AgenceLigne) {
    setEditionId(a.id)
    setForm({
      partner_id: String(a.partner_id),
      location_id: a.location_id ? String(a.location_id) : '',
      name: a.name,
      address: a.address,
      city: a.city,
      province_slug: a.province_slug || 'estuaire',
      is_active: a.is_active,
    })
    setMsg('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function annulerEdition() {
    setEditionId(null)
    setForm(FORMULAIRE_VIDE)
  }

  async function onSoumettre(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    const payload = {
      partner_id: Number(form.partner_id),
      location_id: form.location_id ? Number(form.location_id) : null,
      name: form.name,
      address: form.address,
      city: form.city,
      province_slug: form.province_slug,
      is_active: form.is_active,
    }
    try {
      if (editionId) {
        await api.patch(`/admin/agences/${editionId}`, payload)
        setMsg('Agence mise à jour (province incluse).')
      } else {
        await api.post('/admin/agences', payload)
        setMsg('Agence créée et rattachée à la province.')
      }
      annulerEdition()
      await charger()
    } catch {
      setMsg(
        editionId
          ? 'Modification impossible. Vérifiez les champs (super admin requis).'
          : 'Création impossible. Vérifiez les champs (super admin requis).',
      )
    }
  }

  async function basculerActif(a: AgenceLigne) {
    await api.patch(`/admin/agences/${a.id}`, { is_active: !a.is_active })
    await charger()
  }

  async function supprimer(a: AgenceLigne) {
    if (!confirm(`Supprimer l’agence « ${a.name} » ?`)) return
    await api.delete(`/admin/agences/${a.id}`)
    if (editionId === a.id) annulerEdition()
    await charger()
  }

  function libelleProvince(slug: string | null) {
    return PROVINCES_GABON.find((p) => p.id === slug)?.nom || slug || '—'
  }

  const agencesFiltrees = filtreProvince
    ? agences.filter((a) => a.province_slug === filtreProvince)
    : agences

  if (chargement && agences.length === 0) {
    return <ContentLoader label="Chargement des agences…" />
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Agences par province
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          Rattachez chaque agence à une province : elle apparaît alors sur la carte d’accueil.
          Les provinces sans agence restent grisées.
        </p>
      </div>

      {msg && <p className="mb-4 text-sm text-forest-800">{msg}</p>}

      <form
        onSubmit={onSoumettre}
        className="mb-6 grid gap-3 rounded-xl border border-black/8 bg-white p-5 md:grid-cols-2 lg:grid-cols-3"
      >
        <div className="md:col-span-2 lg:col-span-3">
          <p className="text-sm font-semibold text-ink-900">
            {editionId ? `Modifier l’agence #${editionId}` : 'Nouvelle agence'}
          </p>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Partenaire *
          </span>
          <select
            required
            value={form.partner_id}
            onChange={(e) => setForm((f) => ({ ...f, partner_id: e.target.value }))}
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
          >
            <option value="">Choisir…</option>
            {partenaires.map((p) => (
              <option key={p.id} value={p.id}>
                {p.company_name || p.manager_name || `#${p.id}`}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Province *
          </span>
          <select
            required
            value={form.province_slug}
            onChange={(e) => setForm((f) => ({ ...f, province_slug: e.target.value }))}
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
          >
            {PROVINCES_GABON.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom} ({p.chefLieu})
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-400">Lieu lié</span>
          <select
            value={form.location_id}
            onChange={(e) => setForm((f) => ({ ...f, location_id: e.target.value }))}
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
          >
            <option value="">Aucun</option>
            {lieux.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-400">Nom *</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
            placeholder="Agence centre-ville"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-400">Ville *</span>
          <input
            required
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
            placeholder="Libreville"
          />
        </label>
        <label className="block space-y-1.5 md:col-span-2 lg:col-span-1">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Adresse *
          </span>
          <input
            required
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
            placeholder="Avenue de la Marina"
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="size-4 rounded border-sand-200"
          />
          Agence active (visible sur la carte)
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <button
            type="submit"
            className="rounded-xl bg-forest-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {editionId ? 'Enregistrer' : 'Ajouter l’agence'}
          </button>
          {editionId && (
            <button
              type="button"
              onClick={annulerEdition}
              className="rounded-xl border border-sand-200 px-4 py-2.5 text-sm font-medium text-ink-700"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      <TableauDonnees
        colonnes={[
          { cle: 'name', libelle: 'Agence', rendu: (a) => <span className="font-medium">{a.name}</span> },
          {
            cle: 'province',
            libelle: 'Province',
            rendu: (a) => libelleProvince(a.province_slug),
          },
          { cle: 'city', libelle: 'Ville' },
          {
            cle: 'partner',
            libelle: 'Partenaire',
            rendu: (a) => a.partner?.company_name || a.partner?.manager_name || '—',
          },
          {
            cle: 'status',
            libelle: 'Statut',
            rendu: (a) => (
              <button
                type="button"
                onClick={() => void basculerActif(a)}
                title={a.is_active ? 'Désactiver' : 'Activer'}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  a.is_active ? 'bg-[#0b3d2e]/10 text-[#0b3d2e]' : 'bg-[#f0f1f0] text-ink-500'
                }`}
              >
                {a.is_active ? 'Active' : 'Inactive'}
              </button>
            ),
          },
        ]}
        donnees={agencesFiltrees}
        cleLigne={(a) => a.id}
        champsRecherche={(a) =>
          `${a.name} ${a.city} ${a.province_slug} ${a.partner?.company_name} ${a.address}`
        }
        filtresSupplementaires={
          <select
            value={filtreProvince}
            onChange={(e) => setFiltreProvince(e.target.value)}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            aria-label="Filtrer par province"
          >
            <option value="">Toutes les provinces</option>
            {PROVINCES_GABON.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        }
        surActualiser={charger}
        chargement={chargement}
        messageVide="Aucune agence. Ajoutez-en ci-dessus pour colorer la carte."
        actions={(a) => (
          <>
            <BoutonActionCrud variante="modifier" libelle="Modifier" onClick={() => demarrerEdition(a)} />
            <BoutonActionCrud variante="supprimer" libelle="Supprimer" onClick={() => void supprimer(a)} />
          </>
        )}
      />
    </div>
  )
}
