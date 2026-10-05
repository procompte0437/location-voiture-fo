import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PublicHeader } from '../../components/layout/Header'
import { useAuth } from '../../context/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('client@locagabon.ga')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(email, password)
      if (user.role === 'super_admin' || user.role === 'admin') navigate('/admin')
      else if (user.role === 'partner') navigate('/partenaire')
      else navigate('/mes-reservations')
    } catch {
      setError('Identifiants incorrects.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl font-bold text-forest-950">Connexion</h1>
        <p className="mt-2 text-sm text-ink-500">
          Démo : client@locagabon.ga / partenaire@locagabon.ga / admin@locagabon.ga — mot de passe : password
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-sand-200 bg-white p-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-sand-200 px-4 py-3"
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-sand-200 px-4 py-3"
            placeholder="Mot de passe"
            required
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-forest-800 py-3 font-semibold text-white hover:bg-forest-700"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="mt-4 text-sm text-ink-500">
          Pas encore de compte ? <Link to="/inscription" className="text-forest-700 underline">S’inscrire</Link>
        </p>
      </div>
    </div>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register({ ...form, role: 'customer' })
      navigate('/mes-reservations')
    } catch {
      setError('Impossible de créer le compte. Vérifiez les informations.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl font-bold text-forest-950">Créer un compte</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-sand-200 bg-white p-6">
          {(['name', 'email', 'phone', 'password', 'password_confirmation'] as const).map((field) => (
            <input
              key={field}
              type={field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              className="w-full rounded-xl border border-sand-200 px-4 py-3"
              placeholder={
                field === 'name'
                  ? 'Nom complet'
                  : field === 'email'
                    ? 'Email'
                    : field === 'phone'
                      ? 'Téléphone'
                      : field === 'password'
                        ? 'Mot de passe'
                        : 'Confirmer le mot de passe'
              }
              required={field !== 'phone'}
            />
          ))}
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-forest-800 py-3 font-semibold text-white">
            {loading ? 'Création…' : 'S’inscrire'}
          </button>
        </form>
        <p className="mt-4 text-sm text-ink-500">
          Déjà un compte ? <Link to="/connexion" className="text-forest-700 underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
