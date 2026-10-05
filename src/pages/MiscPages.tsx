import { PublicHeader } from '../components/layout/Header'
// Misc pages live under src/pages

export function VehiclesListPage() {
  return null // redirected via SearchPage without dates
}

export function FaqPage() {
  const items = [
    {
      q: 'Comment réserver ?',
      a: 'Choisissez un lieu, des dates et l’âge du conducteur, comparez les offres, puis payez en Mobile Money ou carte.',
    },
    {
      q: 'Qui peut devenir partenaire ?',
      a: 'Toute agence, entreprise ou particulier. Le dossier est étudié par le super admin avant publication.',
    },
    {
      q: 'Quels moyens de paiement ?',
      a: 'Airtel Money, Moov Money, carte bancaire, et paiement à l’agence avec acompte si le partenaire l’autorise.',
    },
  ]

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-3xl font-bold text-forest-950">FAQ</h1>
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div key={item.q} className="rounded-2xl border border-sand-200 bg-white p-5">
              <h2 className="font-semibold text-ink-900">{item.q}</h2>
              <p className="mt-2 text-ink-700">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
