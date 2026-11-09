import { useSearchParams } from 'react-router-dom'
import { AdminAccountsPage } from './AdminManagePages'
import { AdminValidationPage } from './AdminDashboardPage'
import { PageEvaluationPartenaires } from './PageEvaluationPartenaires'

type OngletComptes = 'comptes' | 'validation' | 'evaluation'

const ONGLETS: { id: OngletComptes; titre: string; detail: string }[] = [
  {
    id: 'comptes',
    titre: 'Comptes',
    detail: 'Clients, partenaires et administrateurs',
  },
  {
    id: 'validation',
    titre: 'Validation partenaires',
    detail: 'Dossiers à accepter ou à refuser',
  },
  {
    id: 'evaluation',
    titre: 'Évaluation partenaires',
    detail: 'Voitures, réservations et montants',
  },
]

function lireOnglet(valeur: string | null): OngletComptes {
  if (valeur === 'validation' || valeur === 'evaluation') return valeur
  return 'comptes'
}

/**
 * Les trois suivis (accès, dossier, activité) vivent sur la même page.
 * L’onglet reste dans l’adresse pour que le tableau de bord ouvre le bon volet.
 */
export function PageAtelierComptes() {
  const [params, setParams] = useSearchParams()
  const onglet = lireOnglet(params.get('onglet'))

  function choisir(suivant: OngletComptes) {
    const copie = new URLSearchParams(params)
    if (suivant === 'comptes') copie.delete('onglet')
    else copie.set('onglet', suivant)
    setParams(copie, { replace: true })
  }

  return (
    <div className="animate-[adminIn_0.45s_ease-out]">
      <section className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-affiche text-sm uppercase tracking-[0.28em] text-[#8c4205]">Opérations</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 md:text-5xl">
              Suivi des comptes
            </h1>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink-500">
            Trois regards sur les mêmes personnes : l’accès, le dossier, puis l’activité.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3" role="tablist" aria-label="Volets du suivi des comptes">
          {ONGLETS.map((item) => {
            const actif = item.id === onglet
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={actif}
                onClick={() => choisir(item.id)}
                className={`rounded-2xl border px-5 py-4 text-left transition duration-300 ${
                  actif
                    ? 'border-[#8c4205] bg-white shadow-[0_12px_28px_-18px_rgba(140,66,5,0.55)]'
                    : 'border-black/10 bg-white/40 hover:border-[#8c4205]/35 hover:bg-white'
                }`}
              >
                <span
                  className={`mb-3 block h-1 w-8 rounded-full ${actif ? 'bg-[#8c4205]' : 'bg-black/10'}`}
                  aria-hidden
                />
                <span className={`block text-base font-semibold ${actif ? 'text-[#8c4205]' : 'text-ink-800'}`}>
                  {item.titre}
                </span>
                <span className="mt-1 block text-sm text-ink-500">{item.detail}</span>
              </button>
            )
          })}
        </div>
      </section>

      <div key={onglet} className="animate-[adminIn_0.35s_ease-out]">
        {onglet === 'comptes' && <AdminAccountsPage sansEntete />}
        {onglet === 'validation' && <AdminValidationPage sansEntete />}
        {onglet === 'evaluation' && <PageEvaluationPartenaires sansEntete />}
      </div>
    </div>
  )
}
