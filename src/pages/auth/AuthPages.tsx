import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PublicHeader } from '../../components/layout/Header'
import { PiedDePage } from '../../components/layout/PiedDePage'
import { useAuth } from '../../context/AuthContext'
import { messageErreurApi } from '../../lib/api'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || ''
  const emailParam = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailParam || 'client@locagabon.ga')
  const [password, setPassword] = useState(emailParam ? '' : 'password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(email, password)
      // Admin / partenaire : toujours leur console (ignore un redirect client type /mes-reservations).
      if (user.role === 'super_admin' || user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (user.role === 'partner' || user.role === 'partner_agent') {
        navigate('/partenaire', { replace: true })
      } else if (redirect && redirect.startsWith('/')) {
        navigate(redirect, { replace: true })
      } else {
        navigate('/mes-reservations', { replace: true })
      }
    } catch {
      setError('Identifiants incorrects.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(6,40,28,0.45) 0%, rgba(6,40,28,0.28) 40%, rgba(6,40,28,0.5) 100%), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80')",
        }}
      />
      <div className="relative flex flex-1 flex-col">
      <PublicHeader />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="rounded-2xl border border-white/40 bg-white/95 p-6 text-center shadow-xl backdrop-blur-sm">
        <h1 className="font-display text-3xl font-bold text-forest-950">Connexion</h1>
        {emailParam ? (
          <p className="mt-2 text-left text-sm text-ink-600">
            Connectez-vous avec l’email de votre réservation et le mot de passe générique affiché
            sur la confirmation (modifiable ensuite).
          </p>
        ) : (
          <p className="mt-2 text-left text-sm text-ink-500">
            Démo : client@locagabon.ga / partenaire@locagabon.ga / admin@locagabon.ga — mot de passe
            : password
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-6 space-y-4 text-left">
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
            autoFocus={!!emailParam}
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-forest-800 py-3 font-semibold text-white hover:bg-forest-700"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
          <Link
            to="/"
            className="block w-full rounded-xl border border-sand-200 py-3 text-center text-sm font-medium text-forest-800 hover:bg-sand-50"
          >
            Retour à l’accueil
          </Link>
        </form>
        <p className="mt-4 text-sm text-ink-500">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="text-forest-700 underline">
            S’inscrire
          </Link>
        </p>
        </div>
      </div>
      <PiedDePage />
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
      await register(form)
      navigate('/mes-reservations')
    } catch (err) {
      setError(messageErreurApi(err, 'Inscription impossible. Vérifiez les champs.'))
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
              placeholder={
                field === 'name'
                  ? 'Nom'
                  : field === 'email'
                    ? 'Email'
                    : field === 'phone'
                      ? 'Téléphone'
                      : field === 'password'
                        ? 'Mot de passe'
                        : 'Confirmation'
              }
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              className="w-full rounded-xl border border-sand-200 px-4 py-3"
              required={field !== 'phone'}
            />
          ))}
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-forest-800 py-3 font-semibold text-white"
          >
            {loading ? 'Création…' : 'S’inscrire'}
          </button>
          <Link
            to="/"
            className="block w-full rounded-xl border border-sand-200 py-3 text-center text-sm font-medium text-forest-800 hover:bg-sand-50"
          >
            Retour à l’accueil
          </Link>
        </form>
        <p className="mt-4 text-sm text-ink-500">
          Déjà un compte ?{' '}
          <Link to="/connexion" className="text-forest-700 underline">
            Connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
