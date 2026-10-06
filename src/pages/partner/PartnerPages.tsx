import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PublicHeader } from '../../components/layout/Header'
import { useAuth } from '../../context/AuthContext'
import { useCatalog } from '../../context/CatalogContext'
import api, { formatXaf } from '../../lib/api'

export function BecomePartnerPage() {
  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <h1 className="font-display text-4xl font-bold text-forest-950">Devenir partenaire</h1>
        <p className="mt-4 text-lg text-ink-700">
          Agences, entreprises ou particuliers : publiez vos véhicules sur LocaGabon après validation de votre dossier.
        </p>
        <ul className="mt-6 space-y-2 text-ink-700">
          <li>• Inscription ouverte à tous</li>
          <li>• Validation par le super admin sous 48 h ouvrées</li>
          <li>• Commission transparente, reversements après début de location</li>
          <li>• Paiement Mobile Money pour vos clients</li>
        </ul>
        <Link
          to="/partenaire/inscription"
          className="mt-8 inline-flex rounded-xl bg-gold-500 px-6 py-3 font-bold text-forest-950 hover:bg-gold-400"
        >
          Créer mon compte partenaire
        </Link>
      </div>
    </div>
  )
}

export function PartnerRegisterPage() {
  const { user, register, refresh } = useAuth()
  const [step, setStep] = useState(1)
  const [account, setAccount] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })
  const [partner, setPartner] = useState({
    type: 'agency',
    company_name: '',
    manager_name: '',
    address: '',
    city: '',
    phone: '',
    whatsapp: '',
    rccm: '',
    nif: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function createAccount(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (!user) {
        await register({ ...account, role: 'partner' })
      }
      setStep(2)
    } catch {
      setError('Impossible de créer le compte.')
    }
  }

  async function submitPartner(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/partners/register', partner)
      await refresh()
      setMessage(data.message)
      setStep(3)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Erreur lors de la soumission du dossier.')
    }
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-forest-950">Inscription partenaire</h1>
        <p className="mt-2 text-sm text-ink-500">Étape {step} / 3</p>

        {step === 1 && (
          <form onSubmit={createAccount} className="mt-6 space-y-3 rounded-2xl border border-sand-200 bg-white p-6">
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
                }).map(([key, label]) => (
                  <input
                    key={key}
                    type={key.includes('password') ? 'password' : key === 'email' ? 'email' : 'text'}
                    placeholder={label}
                    value={account[key as keyof typeof account]}
                    onChange={(e) => setAccount((a) => ({ ...a, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-sand-200 px-4 py-3"
                    required={key !== 'phone'}
                  />
                ))}
              </>
            )}
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button type="submit" className="w-full rounded-xl bg-forest-800 py-3 font-semibold text-white">
              Continuer
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitPartner} className="mt-6 space-y-3 rounded-2xl border border-sand-200 bg-white p-6">
            <select
              value={partner.type}
              onChange={(e) => setPartner((p) => ({ ...p, type: e.target.value }))}
              className="w-full rounded-xl border border-sand-200 px-4 py-3"
            >
              <option value="agency">Agence</option>
              <option value="company">Entreprise</option>
              <option value="individual">Particulier</option>
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
            ].map(([key, label]) => (
              <input
                key={key}
                placeholder={label}
                value={partner[key as keyof typeof partner]}
                onChange={(e) => setPartner((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full rounded-xl border border-sand-200 px-4 py-3"
                required={['manager_name', 'address', 'city', 'phone'].includes(key)}
              />
            ))}
            <p className="text-xs text-ink-500">
              En soumettant, vous acceptez les CGU partenaires et le contrat de commission.
            </p>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button type="submit" className="w-full rounded-xl bg-gold-500 py-3 font-bold text-forest-950">
              Soumettre mon dossier
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="mt-6 rounded-2xl border border-forest-600/20 bg-white p-6">
            <h2 className="font-display text-2xl font-bold text-forest-950">Dossier en attente</h2>
            <p className="mt-3 text-ink-700">{message}</p>
            <p className="mt-2 text-sm text-ink-500">
              Vous ne pouvez pas publier de véhicules tant que le super admin n’a pas validé votre dossier.
            </p>
            <Link to="/partenaire" className="mt-6 inline-block text-forest-700 underline">
              Accéder à mon espace
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export function PartnerDashboardPage() {
  const { user } = useAuth()
  const { labels } = useCatalog()
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null)
  const [vehicles, setVehicles] = useState<unknown[]>([])
  const [categories, setCategories] = useState<{ slug: string; label: string }[]>([])
  const [form, setForm] = useState({
    brand: '',
    model: '',
    category: '',
    plate_number: '',
    seats: 5,
    transmission: 'automatic',
    fuel: 'petrol',
    price_per_day: 40000,
    cover_url: '',
  })
  const [msg, setMsg] = useState('')

  async function load() {
    try {
      const [d, v, cats] = await Promise.all([
        api.get('/partners/me/dashboard'),
        api.get('/partners/me/vehicles'),
        api.get('/catalog/categories'),
      ])
      setDashboard(d.data.data)
      setVehicles(v.data.data || [])
      const list = cats.data.data || []
      setCategories(list)
      setForm((f) => ({ ...f, category: f.category || list[0]?.slug || '' }))
    } catch {
      setDashboard(null)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function addVehicle(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      await api.post('/partners/me/vehicles', form)
      setMsg('Véhicule créé (soumis à validation si nécessaire).')
      await load()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setMsg(message || 'Erreur')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-sand-50">
        <PublicHeader />
        <p className="p-8">
          <Link to="/connexion" className="underline">Connectez-vous</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <h1 className="font-display text-3xl font-bold text-forest-950">Espace partenaire</h1>
        {!dashboard ? (
          <p className="mt-4">
            Pas encore de dossier ? <Link to="/partenaire/inscription" className="underline">S’inscrire</Link>
          </p>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Statut', String(dashboard.status)],
                ['Réservations confirmées', String(dashboard.confirmed_bookings)],
                ['CA brut', formatXaf(Number(dashboard.gross_revenue || 0))],
                ['Note', String(dashboard.average_rating)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-sand-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-500">{label}</p>
                  <p className="mt-1 text-xl font-semibold capitalize">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="font-display text-xl font-bold">Ma flotte ({vehicles.length})</h2>
                <ul className="mt-4 space-y-2">
                  {vehicles.map((v) => {
                    const vehicle = v as { id: number; brand: string; model: string; status: string; price_per_day: number }
                    return (
                      <li key={vehicle.id} className="rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm">
                        {vehicle.brand} {vehicle.model} — {formatXaf(vehicle.price_per_day)}/j
                        <span className="ml-2 capitalize text-ink-500">({vehicle.status})</span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <form onSubmit={addVehicle} className="space-y-3 rounded-2xl border border-sand-200 bg-white p-5">
                <h2 className="font-display text-xl font-bold">Ajouter un véhicule</h2>
                <input className="w-full rounded-xl border px-3 py-2" placeholder="Marque" value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} required />
                <input className="w-full rounded-xl border px-3 py-2" placeholder="Modèle" value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} required />
                <input className="w-full rounded-xl border px-3 py-2" placeholder="Immatriculation" value={form.plate_number}
                  onChange={(e) => setForm((f) => ({ ...f, plate_number: e.target.value }))} required />
                <input type="number" className="w-full rounded-xl border px-3 py-2" placeholder="Prix / jour"
                  value={form.price_per_day}
                  onChange={(e) => setForm((f) => ({ ...f, price_per_day: Number(e.target.value) }))} required />
                <select className="w-full rounded-xl border px-3 py-2" value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required>
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.label || labels.categories[cat.slug] || cat.slug}
                    </option>
                  ))}
                </select>
                <select className="w-full rounded-xl border px-3 py-2" value={form.transmission}
                  onChange={(e) => setForm((f) => ({ ...f, transmission: e.target.value }))}>
                  {Object.entries(labels.transmission).map(([slug, label]) => (
                    <option key={slug} value={slug}>{label}</option>
                  ))}
                </select>
                <select className="w-full rounded-xl border px-3 py-2" value={form.fuel}
                  onChange={(e) => setForm((f) => ({ ...f, fuel: e.target.value }))}>
                  {Object.entries(labels.fuel).map(([slug, label]) => (
                    <option key={slug} value={slug}>{label}</option>
                  ))}
                </select>
                <input className="w-full rounded-xl border px-3 py-2" placeholder="URL photo"
                  value={form.cover_url}
                  onChange={(e) => setForm((f) => ({ ...f, cover_url: e.target.value }))} />
                {msg && <p className="text-sm text-forest-700">{msg}</p>}
                <button type="submit" className="w-full rounded-xl bg-forest-800 py-3 font-semibold text-white">
                  Enregistrer
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
