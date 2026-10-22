import { useEffect, useState, type FormEvent } from 'react'
import { TableauDonnees } from '../../components/ui/TableauDonnees'
import { BoutonActionCrud } from '../../components/ui/BoutonActionCrud'
import api, { formatXaf, messageErreurApi, telechargerFichier } from '../../lib/api'

/**
 * Finances du loueur : chiffre d’affaires hors caution, encaissements et opérations de dépôt.
 */
export function PageFinancesPartenaire() {
  const [indicateurs, setIndicateurs] = useState<Record<string, number>>({})
  const [factures, setFactures] = useState<FactureLigne[]>([])
  const [cautions, setCautions] = useState<CautionLigne[]>([])
  const [chargement, setChargement] = useState(true)
  const [message, setMessage] = useState('')
  const [caution, setCaution] = useState({
    reservation_id: '',
    type: 'encaissement',
    montant: '',
    motif: '',
  })
  const [depense, setDepense] = useState({ libelle: '', montant: '', date_depense: '' })

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/partenaires/moi/finances')
      setIndicateurs(data.data.indicateurs || {})
      setFactures(data.data.factures || [])
      setCautions(data.data.cautions || [])
    } catch (err) {
      setMessage(messageErreurApi(err))
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    void charger()
  }, [])

  async function enregistrerCaution(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    try {
      await api.post(`/partenaires/moi/reservations/${caution.reservation_id}/cautions`, {
        type: caution.type,
        montant: Number(caution.montant),
        motif: caution.motif || undefined,
      })
      setCaution({ reservation_id: '', type: 'encaissement', montant: '', motif: '' })
      await charger()
    } catch (err) {
      setMessage(messageErreurApi(err))
    }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Gestion</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink-900">Finances</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-500">
        Montants en francs CFA, sans décimales. La caution est suivie à part du chiffre d’affaires.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tuile libelle="CA facturé" valeur={formatXaf(indicateurs.chiffre_affaires_facture || 0)} />
        <Tuile libelle="Encaissements nets" valeur={formatXaf(indicateurs.encaissements_nets || 0)} />
        <Tuile libelle="Cautions détenues" valeur={formatXaf(indicateurs.cautions_detenues || 0)} />
        <Tuile libelle="Solde clients" valeur={formatXaf(indicateurs.solde_clients || 0)} />
        <Tuile libelle="Dépenses" valeur={formatXaf(indicateurs.depenses || 0)} />
        <Tuile libelle="Marge indicative" valeur={formatXaf(indicateurs.marge_indicative || 0)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(['reservations', 'mouvements', 'finances', 'entretiens'] as const).map((type) => (
          <button
            key={type}
            type="button"
            className="rounded-full border border-black/10 px-3 py-1.5 text-sm"
            onClick={() => void telechargerFichier(`/partenaires/moi/exports/${type}`, `${type}-doto.csv`)}
          >
            Exporter {type}
          </button>
        ))}
      </div>

      {message && <p className="mt-4 text-sm text-red-700">{message}</p>}

      <form
        className="mt-6 grid gap-3 rounded-2xl border border-black/8 bg-white p-5 md:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setMessage('')
          try {
            await api.post('/partenaires/moi/depenses', {
              libelle: depense.libelle,
              montant: Number(depense.montant),
              date_depense: depense.date_depense,
              categorie: 'exploitation',
            })
            setDepense({ libelle: '', montant: '', date_depense: '' })
            await charger()
          } catch (err) {
            setMessage(messageErreurApi(err))
          }
        }}
      >
        <input className="rounded-xl border border-black/10 px-3 py-2 text-sm" placeholder="Dépense" value={depense.libelle} onChange={(e) => setDepense((a) => ({ ...a, libelle: e.target.value }))} required />
        <input className="rounded-xl border border-black/10 px-3 py-2 text-sm" placeholder="Montant XAF" inputMode="numeric" value={depense.montant} onChange={(e) => setDepense((a) => ({ ...a, montant: e.target.value }))} required />
        <input className="rounded-xl border border-black/10 px-3 py-2 text-sm" type="date" value={depense.date_depense} onChange={(e) => setDepense((a) => ({ ...a, date_depense: e.target.value }))} required />
        <button className="rounded-xl bg-forest-800 px-4 py-2 text-sm font-semibold text-white">Enregistrer la dépense</button>
      </form>

      <form onSubmit={enregistrerCaution} className="mt-8 grid gap-3 rounded-2xl border border-black/8 bg-white p-5 md:grid-cols-4">
        <input
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
          placeholder="N° réservation"
          value={caution.reservation_id}
          onChange={(e) => setCaution((a) => ({ ...a, reservation_id: e.target.value }))}
          required
        />
        <select
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
          value={caution.type}
          onChange={(e) => setCaution((a) => ({ ...a, type: e.target.value }))}
        >
          <option value="encaissement">Encaisser la caution</option>
          <option value="restitution">Restituer</option>
          <option value="affectation">Affecter à des frais</option>
        </select>
        <input
          type="number"
          min={1}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
          placeholder="Montant XAF"
          value={caution.montant}
          onChange={(e) => setCaution((a) => ({ ...a, montant: e.target.value }))}
          required
        />
        <button className="rounded-xl bg-forest-900 px-4 py-2 text-sm font-semibold text-white">
          Enregistrer
        </button>
        <input
          className="rounded-xl border border-black/10 px-3 py-2 text-sm md:col-span-4"
          placeholder="Motif (obligatoire pour expliquer une restitution ou une affectation)"
          value={caution.motif}
          onChange={(e) => setCaution((a) => ({ ...a, motif: e.target.value }))}
        />
      </form>

      <div className="mt-8">
        <TableauDonnees
          colonnes={[
            { cle: 'numero', libelle: 'Numéro' },
            { cle: 'type', libelle: 'Type' },
            {
              cle: 'montant_ttc',
              libelle: 'Montant TTC',
              rendu: (f) => formatXaf(f.montant_ttc),
            },
            { cle: 'emise_le', libelle: 'Émise le' },
            { cle: 'reservation_id', libelle: 'Réservation' },
          ]}
          donnees={factures}
          cleLigne={(f) => f.id}
          champsRecherche={(f) => `${f.numero} ${f.type} ${f.reservation_id}`}
          surActualiser={charger}
          chargement={chargement}
          messageVide="Aucune facture validée."
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold">Cautions</h2>
        <TableauDonnees
          colonnes={[
            { cle: 'type', libelle: 'Opération' },
            { cle: 'montant', libelle: 'Montant', rendu: (c) => formatXaf(c.montant) },
            { cle: 'reservation_id', libelle: 'Réservation' },
            { cle: 'motif', libelle: 'Motif' },
          ]}
          donnees={cautions}
          cleLigne={(c) => c.id}
          champsRecherche={(c) => `${c.type} ${c.motif} ${c.reservation_id}`}
          surActualiser={charger}
          chargement={chargement}
          messageVide="Aucune opération de caution."
        />
      </div>
    </div>
  )
}

/** Plans et interventions : une immobilisation bloque le créneau, une réalisation recalcule l’échéance. */
export function PageEntretiensPartenaire() {
  const [plans, setPlans] = useState<PlanLigne[]>([])
  const [interventions, setInterventions] = useState<InterventionLigne[]>([])
  const [vehicules, setVehicules] = useState<{ id: number; brand: string; model: string }[]>([])
  const [chargement, setChargement] = useState(true)
  const [message, setMessage] = useState('')
  const [plan, setPlan] = useState({
    vehicule_id: '',
    libelle: 'Vidange',
    periodicite_jours: '180',
    periodicite_km: '5000',
  })

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/partenaires/moi/entretiens')
      setPlans(data.data.plans || [])
      setInterventions(data.data.interventions || [])
      setVehicules(data.data.vehicules || [])
    } catch (err) {
      setMessage(messageErreurApi(err))
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    void charger()
  }, [])

  async function creerPlan(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    try {
      await api.post('/partenaires/moi/entretiens/plans', {
        vehicule_id: Number(plan.vehicule_id),
        libelle: plan.libelle,
        periodicite_jours: Number(plan.periodicite_jours) || undefined,
        periodicite_km: Number(plan.periodicite_km) || undefined,
        prochaine_echeance_le: new Date().toISOString().slice(0, 10),
      })
      await charger()
    } catch (err) {
      setMessage(messageErreurApi(err))
    }
  }

  async function realiser(id: number) {
    const compteur = window.prompt('Kilométrage au moment de l’intervention')
    if (!compteur) return
    try {
      await api.post(`/partenaires/moi/entretiens/interventions/${id}/realiser`, {
        compteur: Number(compteur),
        realisee_le: new Date().toISOString().slice(0, 10),
      })
      await charger()
    } catch (err) {
      setMessage(messageErreurApi(err))
    }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Flotte</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink-900">Entretiens</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-500">
        Le premier seuil atteint (date ou kilométrage) déclenche l’échéance. Une immobilisation empêche la réservation.
      </p>
      {message && <p className="mt-4 text-sm text-red-700">{message}</p>}

      <form onSubmit={creerPlan} className="mt-6 grid gap-3 rounded-2xl border border-black/8 bg-white p-5 md:grid-cols-4">
        <select
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
          value={plan.vehicule_id}
          onChange={(e) => setPlan((a) => ({ ...a, vehicule_id: e.target.value }))}
          required
        >
          <option value="">Véhicule</option>
          {vehicules.map((v) => (
            <option key={v.id} value={v.id}>
              {v.brand} {v.model}
            </option>
          ))}
        </select>
        <input
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
          value={plan.libelle}
          onChange={(e) => setPlan((a) => ({ ...a, libelle: e.target.value }))}
          required
        />
        <input
          type="number"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
          placeholder="Période (jours)"
          value={plan.periodicite_jours}
          onChange={(e) => setPlan((a) => ({ ...a, periodicite_jours: e.target.value }))}
        />
        <button className="rounded-xl bg-forest-900 px-4 py-2 text-sm font-semibold text-white">Créer le plan</button>
      </form>

      <div className="mt-8">
        <TableauDonnees
          colonnes={[
            { cle: 'libelle', libelle: 'Opération' },
            {
              cle: 'vehicule',
              libelle: 'Véhicule',
              rendu: (p) => `${p.vehicule?.brand || ''} ${p.vehicule?.model || ''}`,
            },
            { cle: 'prochaine_echeance_le', libelle: 'Prochaine date' },
            { cle: 'prochain_kilometrage', libelle: 'Prochain km' },
          ]}
          donnees={plans}
          cleLigne={(p) => p.id}
          champsRecherche={(p) => `${p.libelle} ${p.vehicule?.brand} ${p.vehicule?.model}`}
          surActualiser={charger}
          chargement={chargement}
          messageVide="Aucun plan d’entretien."
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold">Interventions</h2>
        <TableauDonnees
          colonnes={[
            { cle: 'statut', libelle: 'Statut' },
            { cle: 'description', libelle: 'Description' },
            { cle: 'prevue_le', libelle: 'Prévue' },
            { cle: 'realisee_le', libelle: 'Réalisée' },
          ]}
          donnees={interventions}
          cleLigne={(i) => i.id}
          champsRecherche={(i) => `${i.statut} ${i.description}`}
          surActualiser={charger}
          chargement={chargement}
          messageVide="Aucune intervention."
          actions={(i) =>
            i.statut === 'prevue' ? (
              <BoutonActionCrud variante="modifier" libelle="Marquer réalisée" onClick={() => void realiser(i.id)} />
            ) : null
          }
        />
      </div>
    </div>
  )
}

/** Invitation des agents et du gestionnaire financier. Seul le responsable peut modifier les droits. */
export function PageEquipePartenaire() {
  const [membres, setMembres] = useState<MembreLigne[]>([])
  const [chargement, setChargement] = useState(true)
  const [message, setMessage] = useState('')
  const [formulaire, setFormulaire] = useState({ email: '', role: 'partner_agent' })

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/partenaires/moi/membres')
      setMembres(data.data || [])
    } catch (err) {
      setMessage(messageErreurApi(err))
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    void charger()
  }, [])

  async function inviter(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    try {
      await api.post('/partenaires/moi/membres', formulaire)
      setFormulaire({ email: '', role: 'partner_agent' })
      await charger()
    } catch (err) {
      setMessage(messageErreurApi(err, 'Invitation impossible.'))
    }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Comptes</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink-900">Équipe</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-500">
        Le responsable attribue les rôles. Un agent traite les mouvements ; un gestionnaire financier suit les règlements.
      </p>
      {message && <p className="mt-4 text-sm text-ink-700">{message}</p>}
      <form onSubmit={inviter} className="mt-6 grid gap-3 rounded-2xl border border-black/8 bg-white p-5 md:grid-cols-3">
        <input
          type="email"
          required
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
          placeholder="E-mail du collaborateur"
          value={formulaire.email}
          onChange={(e) => setFormulaire((a) => ({ ...a, email: e.target.value }))}
        />
        <select
          className="rounded-xl border border-black/10 px-3 py-2 text-sm"
          value={formulaire.role}
          onChange={(e) => setFormulaire((a) => ({ ...a, role: e.target.value }))}
        >
          <option value="partner_agent">Agent</option>
          <option value="finance_manager">Gestionnaire financier</option>
        </select>
        <button className="rounded-xl bg-forest-900 px-4 py-2 text-sm font-semibold text-white">Inviter</button>
      </form>
      <div className="mt-8">
        <TableauDonnees
          colonnes={[
            { cle: 'nom', libelle: 'Nom', rendu: (m) => m.utilisateur?.name || '—' },
            { cle: 'email', libelle: 'E-mail', rendu: (m) => m.utilisateur?.email || '—' },
            { cle: 'role', libelle: 'Rôle' },
          ]}
          donnees={membres}
          cleLigne={(m) => m.id}
          champsRecherche={(m) => `${m.utilisateur?.name} ${m.utilisateur?.email} ${m.role}`}
          surActualiser={charger}
          chargement={chargement}
          messageVide="Aucun collaborateur rattaché."
        />
      </div>
    </div>
  )
}

function Tuile({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-ink-500">{libelle}</p>
      <p className="mt-2 font-display text-2xl font-bold text-ink-900">{valeur}</p>
    </div>
  )
}

type FactureLigne = {
  id: number
  numero: string
  type: string
  montant_ttc: number
  emise_le?: string
  reservation_id?: number
}

type CautionLigne = { id: number; type: string; montant: number; reservation_id: number; motif?: string }

type PlanLigne = {
  id: number
  libelle: string
  prochaine_echeance_le?: string
  prochain_kilometrage?: number
  vehicule?: { brand?: string; model?: string }
}

type InterventionLigne = {
  id: number
  statut: string
  description?: string
  prevue_le?: string
  realisee_le?: string
}

type MembreLigne = {
  id: number
  role: string
  utilisateur?: { name?: string; email?: string }
}
