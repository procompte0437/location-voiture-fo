import { useEffect, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PublicHeader } from '../../components/layout/Header'
import { LogoDoto } from '../../components/layout/LogoDoto'
import { IconeReseau, PiedDePage, RESEAUX_SOCIAUX } from '../../components/layout/PiedDePage'
import { useAuth } from '../../context/AuthContext'
import api, { messageErreurApi } from '../../lib/api'

/** Mot de passe avec œil : le visiteur vérifie ce qu’il a saisi sans quitter le champ. */
function ChampMotDePasse({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="relative mt-1.5 block">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`${className.replace('mt-1.5', '').trim()} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((actuel) => !actuel)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-500 hover:text-marque-encre"
      >
        {visible ? <IconeOeilBarre /> : <IconeOeil />}
      </button>
    </span>
  )
}

function IconeOeil() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  )
}

function IconeOeilBarre() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 6.2A9 9 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.4 4" strokeLinecap="round" />
      <path d="M6.2 6.2C3.6 8.1 2 12 2 12s3.5 6 10 6c1.1 0 2.2-.2 3.2-.6" strokeLinecap="round" />
      <path d="M9.9 9.9a2.6 2.6 0 0 0 3.6 3.6" strokeLinecap="round" />
    </svg>
  )
}

/** Route et véhicule : le panneau d’accueil client reste lisible sous le vert DOTO. */
const PHOTO_ESPACE_CLIENT =
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1800&q=80'

export function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || ''
  const emailParam = searchParams.get('email') || ''
  const inscriptionDemandee = searchParams.get('inscription') === '1'

  const emailMemorise = window.localStorage.getItem('doto_email_memoire') || ''
  const [memoriser, setMemoriser] = useState(Boolean(emailMemorise))
  const [email, setEmail] = useState(emailParam || emailMemorise || 'client@doto241.com')
  const [password, setPassword] = useState(emailParam ? '' : 'password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [defi, setDefi] = useState<{ etape: string; jeton: string; secret?: string; uri?: string } | null>(null)
  const [creation, setCreation] = useState(inscriptionDemandee)
  const [profil, setProfil] = useState<'customer' | 'partner'>('customer')
  const [inscription, setInscription] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    company_name: '',
    city: '',
  })
  const [confirmationSignalee, setConfirmationSignalee] = useState(false)

  // « Nous rejoindre » ouvre le formulaire ici, sans quitter la page de connexion.
  useEffect(() => {
    setCreation(inscriptionDemandee)
  }, [inscriptionDemandee])

  function afficherCreation(ouvert: boolean) {
    setError('')
    setCreation(ouvert)
    const suivants = new URLSearchParams(searchParams)
    if (ouvert) suivants.set('inscription', '1')
    else suivants.delete('inscription')
    setSearchParams(suivants, { replace: true })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (memoriser) window.localStorage.setItem('doto_email_memoire', email.trim())
      else window.localStorage.removeItem('doto_email_memoire')
      const user = await login(email, password)
      const defiRecu = user as typeof user & { etape?: string; jeton?: string; secret?: string; uri?: string }
      if (defiRecu.etape && defiRecu.jeton) {
        setDefi({ etape: defiRecu.etape, jeton: defiRecu.jeton, secret: defiRecu.secret, uri: defiRecu.uri })
        return
      }
      // Admin / partenaire : toujours leur console (ignore un redirect client type /mes-reservations).
      if (user.role === 'super_admin' || user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (user.role === 'partner' || user.role === 'partner_agent' || user.role === 'finance_manager') {
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

  const motsDePasseDifferents = inscription.password !== inscription.password_confirmation
  const messageConfirmation =
    confirmationSignalee && motsDePasseDifferents
      ? 'La confirmation du mot de passe ne correspond pas.'
      : ''

  async function creerCompte(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (inscription.password !== inscription.password_confirmation) {
      setConfirmationSignalee(true)
      return
    }
    setLoading(true)
    try {
      const utilisateur = await register({ ...inscription, role: profil })
      navigate(utilisateur.role === 'partner' ? '/partenaire' : '/mes-reservations', { replace: true })
    } catch (err) {
      setError(messageErreurApi(err, 'Inscription impossible. Vérifiez les champs.'))
    } finally {
      setLoading(false)
    }
  }

  const champ = 'mt-1.5 w-full rounded-md border border-sand-200 px-3 py-3 outline-none focus:border-marque-encre'
  // Fond sable et ombre : les champs ne reprennent pas le trait des onglets Client / Partenaire.
  const champSaisie =
    'mt-1.5 w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(20,32,26,0.06)] outline-none focus:border-marque-encre'

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <PublicHeader />
      {/* Bandes sable : le bloc connexion ne se colle ni à la barre, ni au pied de page. */}
      <div className="mb-10 mt-10 grid flex-1 overflow-hidden bg-white shadow-[0_16px_36px_rgba(2,25,16,0.06)] md:mb-16 md:mt-16 lg:grid-cols-2 lg:rounded-[2rem]">
      <aside className="relative flex min-h-80 flex-col items-center justify-center overflow-hidden px-8 py-16 text-white lg:min-h-[34rem]">
        <img
          src={PHOTO_ESPACE_CLIENT}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(155deg, rgba(0,80,56,0.78) 0%, rgba(0,80,56,0.62) 48%, rgba(2,25,16,0.8) 100%)',
          }}
          aria-hidden
        />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 800 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <circle cx="150" cy="150" r="168" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="26" />
          <circle cx="118" cy="760" r="120" fill="rgba(255,255,255,0.1)" />
          <path
            d="M-60 40 C 240 10, 390 210, 470 480 C 540 720, 390 980, 80 980"
            fill="none"
            stroke="rgba(231,243,236,0.28)"
            strokeWidth="78"
          />
          <path
            d="M-90 260 C 160 140, 340 300, 410 560"
            fill="none"
            stroke="rgba(240,160,56,0.22)"
            strokeWidth="34"
          />
        </svg>
        {/* La courbe blanche reprend la séparation organique du modèle, sans changer le formulaire. */}
        <div
          className="pointer-events-none absolute top-1/2 left-full hidden aspect-square h-[185%] -translate-x-[16%] -translate-y-1/2 rounded-full bg-white lg:block"
          aria-hidden
        />
        <div className="relative z-10 flex max-w-sm flex-col items-center px-4 text-center lg:-translate-x-8">
          <span className="grid h-36 w-36 place-items-center rounded-full bg-white shadow-lg">
            <LogoDoto className="h-20 w-20" />
          </span>
          <p className="mt-8 font-affiche text-5xl uppercase leading-none tracking-wide md:text-6xl">Bienvenue</p>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/90">
            {creation && profil === 'partner' ? 'Dans votre espace partenaire' : 'Dans votre espace client'}
          </p>
          <Link
            to="/"
            className="mt-8 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-marque-encre shadow-sm hover:bg-sand-50"
          >
            Aller à l’accueil
          </Link>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className={`w-full ${creation ? 'max-w-xl' : 'max-w-md'}`}>
          {defi ? (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault()
                setLoading(true)
                setError('')
                try {
                  const { data } = await api.post('/auth/double-authentification', { jeton: defi.jeton, code })
                  localStorage.setItem('locagabon_token', data.token)
                  window.location.href = data.user?.role === 'admin' || data.user?.role === 'super_admin' ? '/admin' : '/partenaire'
                } catch {
                  setError('Code incorrect ou délai dépassé.')
                } finally {
                  setLoading(false)
                }
              }}
            >
              <h1 className="font-affiche text-4xl uppercase tracking-wide text-marque-encre">Vérification</h1>
              <p className="text-sm text-ink-600">
                {defi.etape === 'activer'
                  ? 'L’administration exige une double authentification. Ajoutez cette clé dans une application d’authentification, puis saisissez le code à 6 chiffres.'
                  : 'Saisissez le code à 6 chiffres de votre application d’authentification.'}
              </p>
              {defi.secret && <p className="break-all rounded-lg bg-sand-50 px-3 py-2 font-mono text-sm">{defi.secret}</p>}
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                className={champ}
                placeholder="Code à 6 chiffres"
                required
              />
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-marque-encre/70 py-3 font-bold text-white hover:bg-marque-encre">
                {loading ? 'Vérification…' : 'Valider le code'}
              </button>
            </form>
          ) : creation ? null : (
            <form onSubmit={onSubmit} className="space-y-4">
              <h1 className="font-affiche text-4xl uppercase tracking-wide text-marque-encre md:text-5xl">Se connecter</h1>
              {emailParam && (
                <p className="text-sm text-ink-600">
                  Connectez-vous avec l’email de votre réservation et le mot de passe affiché sur la confirmation.
                </p>
              )}
              <label className="block text-sm font-medium text-ink-800">
                ID Client / Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={champ}
                  required
                />
              </label>
              <label className="block text-sm font-medium text-ink-800">
                Mot de passe
                <ChampMotDePasse
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={champ}
                  required
                  autoComplete="current-password"
                  autoFocus={!!emailParam}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={memoriser}
                  onChange={(e) => setMemoriser(e.target.checked)}
                  className="h-4 w-4 accent-marque-encre"
                />
                Mémoriser mes informations
              </label>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-marque-encre/70 py-3.5 text-base font-bold text-white hover:bg-marque-encre disabled:opacity-60"
              >
                {loading ? 'Connexion…' : 'Connexion'}
              </button>
              <Link to="/mot-de-passe-oublie" className="inline-block text-sm text-marque-encre underline">
                Mot de passe oublié ?
              </Link>
              <p className="text-sm text-ink-600">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => afficherCreation(true)}
                  className="font-semibold text-marque-encre underline"
                >
                  S’inscrire
                </button>
              </p>
            </form>
          )}
          {creation && !defi && (
            <form onSubmit={creerCompte} className="space-y-4">
              <h1 className="font-affiche text-4xl uppercase tracking-wide text-marque-encre md:text-5xl">Créer un compte</h1>
              <p className="text-sm text-ink-600">
                {profil === 'partner'
                  ? 'Indiquez l’entreprise, le responsable, la ville et le téléphone. Le reste du dossier se complète ensuite dans l’espace partenaire.'
                  : 'Choisissez le type de compte, puis renseignez vos accès.'}
              </p>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">Type de compte</p>
                <div className="grid grid-cols-2 rounded-full bg-marque-voile p-1" role="group" aria-label="Type de compte">
                  <button
                    type="button"
                    onClick={() => setProfil('customer')}
                    className={`rounded-full px-3 py-2 text-sm font-semibold ${
                      profil === 'customer' ? 'bg-white text-marque-encre shadow-sm' : 'text-ink-700'
                    }`}
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfil('partner')}
                    className={`rounded-full px-3 py-2 text-sm font-semibold ${
                      profil === 'partner' ? 'bg-white text-marque-encre shadow-sm' : 'text-ink-700'
                    }`}
                  >
                    Partenaire
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-sand-50 p-4">
                {profil === 'partner' && (
                  <label className="block text-sm font-medium text-ink-800">
                    Nom de l’entreprise <span className="text-marque-encre">*</span>
                    <input
                      required
                      value={inscription.company_name}
                      onChange={(e) => setInscription((f) => ({ ...f, company_name: e.target.value }))}
                      className={champSaisie}
                    />
                  </label>
                )}
                <label className="block text-sm font-medium text-ink-800">
                  {profil === 'partner' ? 'Nom du responsable' : 'Nom'} <span className="text-marque-encre">*</span>
                  <input required value={inscription.name} onChange={(e) => setInscription((f) => ({ ...f, name: e.target.value }))} className={champSaisie} />
                </label>
                {profil === 'partner' && (
                  <label className="block text-sm font-medium text-ink-800">
                    Ville <span className="text-marque-encre">*</span>
                    <input
                      required
                      value={inscription.city}
                      onChange={(e) => setInscription((f) => ({ ...f, city: e.target.value }))}
                      className={champSaisie}
                    />
                  </label>
                )}
                <label className="block text-sm font-medium text-ink-800">
                  Email <span className="text-marque-encre">*</span>
                  <input required type="email" value={inscription.email} onChange={(e) => setInscription((f) => ({ ...f, email: e.target.value }))} className={champSaisie} />
                </label>
                <label className="block text-sm font-medium text-ink-800">
                  Téléphone {profil === 'partner' && <span className="text-marque-encre">*</span>}
                  <input
                    required={profil === 'partner'}
                    value={inscription.phone}
                    onChange={(e) => setInscription((f) => ({ ...f, phone: e.target.value }))}
                    className={champSaisie}
                  />
                </label>
                <label className="block text-sm font-medium text-ink-800">
                  Mot de passe
                  <ChampMotDePasse required autoComplete="new-password" value={inscription.password} onChange={(e) => setInscription((f) => ({ ...f, password: e.target.value }))} className={champSaisie} />
                </label>
                <label className="block text-sm font-medium text-ink-800">
                  Confirmation
                  <ChampMotDePasse
                    required
                    autoComplete="new-password"
                    value={inscription.password_confirmation}
                    onChange={(e) => setInscription((f) => ({ ...f, password_confirmation: e.target.value }))}
                    onBlur={() => setConfirmationSignalee(true)}
                    aria-invalid={messageConfirmation ? true : undefined}
                    className={`${champSaisie} ${messageConfirmation ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                </label>
              </div>
              {messageConfirmation && <p className="text-sm text-red-700">{messageConfirmation}</p>}
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-marque-encre/70 py-3.5 text-base font-bold text-white hover:bg-marque-encre disabled:opacity-60">
                {loading ? 'Création…' : 'S’inscrire'}
              </button>
              <p className="text-sm text-ink-600">
                Déjà un compte ?{' '}
                <button type="button" onClick={() => afficherCreation(false)} className="font-semibold text-marque-encre underline">
                  Connexion
                </button>
              </p>
            </form>
          )}
        </div>
      </main>
      </div>
      <PiedDePage />
    </div>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [profil, setProfil] = useState<'customer' | 'partner'>('customer')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    company_name: '',
    city: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationSignalee, setConfirmationSignalee] = useState(false)

  const motsDePasseDifferents = form.password !== form.password_confirmation
  const messageConfirmation =
    confirmationSignalee && motsDePasseDifferents
      ? 'La confirmation du mot de passe ne correspond pas.'
      : ''

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirmation) {
      setConfirmationSignalee(true)
      return
    }
    setLoading(true)
    try {
      const utilisateur = await register({ ...form, role: profil })
      navigate(utilisateur.role === 'partner' ? '/partenaire' : '/mes-reservations', { replace: true })
    } catch (err) {
      setError(messageErreurApi(err, 'Inscription impossible. Vérifiez les champs.'))
    } finally {
      setLoading(false)
    }
  }

  const champ =
    'mt-1.5 w-full rounded-lg border border-sand-200 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(20,32,26,0.06)] outline-none focus:border-marque-encre'

  return (
    <div className="min-h-screen bg-white text-ink-900">
      <PublicHeader />
      <section className="relative overflow-hidden bg-marque-encre text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(0,80,56,0.82) 0%, rgba(0,80,56,0.55) 48%, rgba(2,25,16,0.72) 100%), url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1800&q=80')",
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-52 max-w-6xl items-center px-4 py-12 md:min-h-64 md:px-6 md:py-16">
          <h1 className="font-affiche text-5xl uppercase leading-none tracking-wide md:ml-auto md:text-7xl">
            Créer un compte
          </h1>
        </div>
        <div className="relative h-2 bg-marque-500" />
      </section>

      <main className="mx-auto grid max-w-6xl items-start gap-12 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)]">
        <div className="space-y-8">
          <div className="grid items-center gap-4 overflow-hidden rounded-2xl bg-marque-encre text-white sm:grid-cols-[1fr_auto]">
            <div className="px-6 py-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">Inscription</p>
              <p className="mt-2 font-affiche text-4xl uppercase leading-none">
                {profil === 'partner' ? 'Partenaire' : 'Client'}
              </p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=640&q=80"
              alt=""
              className="h-40 w-full object-cover sm:h-full sm:w-52"
            />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold leading-snug md:text-3xl">
              Choisissez le type de compte, puis renseignez vos accès.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-700 md:text-base">
              {profil === 'partner'
                ? 'Indiquez l’entreprise, le responsable, la ville et le téléphone. Le RCCM, l’adresse et le reste du dossier se complètent ensuite dans l’espace partenaire.'
                : 'Le compte client sert à réserver, suivre une location et retrouver vos accès. Le prix est affiché avant la confirmation.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <a href="mailto:support@doto241.com" className="flex min-h-36 flex-col overflow-hidden rounded-2xl bg-marque-encre text-white">
              <span className="flex flex-1 flex-col items-center justify-center px-4 py-5 text-center font-bold">Assistance</span>
              <span className="bg-marque-sombre px-3 py-3 text-center text-sm font-semibold">support@doto241.com</span>
            </a>
            <a href="https://wa.me/24104371973" className="flex min-h-36 flex-col overflow-hidden rounded-2xl bg-marque-encre text-white">
              <span className="flex flex-1 flex-col items-center justify-center px-4 py-5 text-center font-bold">WhatsApp</span>
              <span className="bg-marque-sombre px-3 py-3 text-center text-sm font-semibold">+241 04 37 19 73</span>
            </a>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold">Nos réseaux sociaux</h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {RESEAUX_SOCIAUX.map((reseau) => (
                <li key={reseau.nom}>
                  <a
                    href={reseau.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={reseau.nom}
                    title={reseau.nom}
                    className="grid h-11 w-11 place-items-center rounded-full bg-marque-encre text-white hover:bg-marque-500 hover:text-ink-900"
                  >
                    <IconeReseau nom={reseau.nom} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-[0_16px_40px_rgba(20,32,26,0.08)] md:p-8">
          <h2 className="text-2xl font-extrabold">Créer un compte</h2>
          <p className="mt-2 text-sm text-ink-600">
            Choisissez le type de compte, puis renseignez vos accès.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">Type de compte</p>
              <div className="grid grid-cols-2 rounded-full bg-marque-voile p-1" role="group" aria-label="Type de compte">
                <button
                  type="button"
                  onClick={() => setProfil('customer')}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${
                    profil === 'customer' ? 'bg-white text-marque-encre shadow-sm' : 'text-ink-700'
                  }`}
                >
                  Client
                </button>
                <button
                  type="button"
                  onClick={() => setProfil('partner')}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${
                    profil === 'partner' ? 'bg-white text-marque-encre shadow-sm' : 'text-ink-700'
                  }`}
                >
                  Partenaire
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-sand-50 p-4">
              {profil === 'partner' && (
                <label className="block text-sm font-medium">
                  Nom de l’entreprise <span className="text-marque-encre">*</span>
                  <input required placeholder="Nom de l’entreprise" value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} className={champ} />
                </label>
              )}
              <label className="block text-sm font-medium">
                {profil === 'partner' ? 'Nom du responsable' : 'Nom'} <span className="text-marque-encre">*</span>
                <input required placeholder={profil === 'partner' ? 'Nom du responsable' : 'Nom'} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={champ} />
              </label>
              {profil === 'partner' && (
                <label className="block text-sm font-medium">
                  Ville <span className="text-marque-encre">*</span>
                  <input required placeholder="Ville" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={champ} />
                </label>
              )}
              <label className="block text-sm font-medium">
                Email <span className="text-marque-encre">*</span>
                <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={champ} />
              </label>
              <label className="block text-sm font-medium">
                Téléphone {profil === 'partner' && <span className="text-marque-encre">*</span>}
                <input required={profil === 'partner'} placeholder="Téléphone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={champ} />
              </label>
              <label className="block text-sm font-medium">
                Mot de passe <span className="text-marque-encre">*</span>
                <input required type="password" placeholder="Mot de passe" autoComplete="new-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={champ} />
              </label>
              <label className="block text-sm font-medium">
                Confirmation <span className="text-marque-encre">*</span>
                <input
                  required
                  type="password"
                  placeholder="Confirmation"
                  autoComplete="new-password"
                  value={form.password_confirmation}
                  onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                  onBlur={() => setConfirmationSignalee(true)}
                  aria-invalid={messageConfirmation ? true : undefined}
                  className={`${champ} ${messageConfirmation ? 'border-red-500 focus:border-red-500' : ''}`}
                />
              </label>
            </div>
            {messageConfirmation && (
              <p className="text-sm text-red-700" role="alert">
                {messageConfirmation}
              </p>
            )}
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-marque-500 py-3 font-bold text-ink-900 hover:bg-gold-400 disabled:opacity-60"
            >
              {loading ? 'Création…' : 'S’inscrire'}
            </button>
            <Link
              to="/"
              className="block w-full rounded-xl border border-sand-200 bg-sand-50 py-3 text-center text-sm font-semibold text-marque-encre hover:bg-sand-100"
            >
              Retour à l’accueil
            </Link>
          </form>
          <p className="mt-4 text-sm text-ink-500">
            Déjà un compte ?{' '}
            <Link to="/connexion" className="font-semibold text-marque-encre">
              Connexion
            </Link>
          </p>
        </section>
      </main>
      <PiedDePage />
    </div>
  )
}

export function PageMotDePasseOublie() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [lien, setLien] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const { data } = await api.post('/auth/mot-de-passe-oublie', { email })
    setMessage(data.message)
    setLien(data.lien || '')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Mot de passe oublié</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border px-4 py-3" />
        <button className="w-full rounded-xl bg-forest-800 py-3 font-semibold text-white">Envoyer le lien</button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
      {lien && (
        <p className="mt-2 text-sm">
          Environnement local : <Link className="text-forest-700 underline" to={lien.replace(/^https?:\/\/[^/]+/, '')}>ouvrir le lien</Link>
        </p>
      )}
    </div>
  )
}

export function PageReinitialiserMotDePasse() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErreur('')
    try {
      await api.post('/auth/reinitialiser-mot-de-passe', {
        email: params.get('email'),
        token: params.get('token'),
        password,
        password_confirmation: confirmation,
      })
      navigate('/connexion')
    } catch (err) {
      setErreur(messageErreurApi(err))
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Nouveau mot de passe</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nouveau mot de passe" className="w-full rounded-xl border px-4 py-3" />
        <input type="password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Confirmation" className="w-full rounded-xl border px-4 py-3" />
        {erreur && <p className="text-sm text-red-700">{erreur}</p>}
        <button className="w-full rounded-xl bg-forest-800 py-3 font-semibold text-white">Enregistrer</button>
      </form>
    </div>
  )
}
