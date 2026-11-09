import { useEffect, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { AvatarCompte } from '../../components/admin/MenuCompteAdmin'
import { IconeInformation } from '../../components/ui/IconeInformation'
import { useAuth } from '../../context/AuthContext'
import api, { messageErreurApi } from '../../lib/api'

const champ =
  'mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-[#8c4205]'

const libelle = 'block text-sm font-semibold text-ink-900'

function ChampMotDePasse({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="relative mt-1.5 block">
      <input {...props} type={visible ? 'text' : 'password'} className={`${className.replace(/mt-1(\.5)?/, '').trim()} pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((actuel) => !actuel)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-500 hover:text-[#8c4205]"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          {visible ? (
            <>
              <path d="M3 3l18 18" strokeLinecap="round" />
              <path d="M10.6 6.2A9 9 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.4 4" strokeLinecap="round" />
              <path d="M6.2 6.2C3.6 8.1 2 12 2 12s3.5 6 10 6c1.1 0 2.2-.2 3.2-.6" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
              <circle cx="12" cy="12" r="2.6" />
            </>
          )}
        </svg>
      </button>
    </span>
  )
}

function roleAffiche(role?: string) {
  if (role === 'super_admin') return 'Super admin'
  if (role === 'admin') return 'Admin'
  return role || '—'
}

export function PageProfilAdmin() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">Profil</h1>
          <p className="mt-1.5 text-sm text-ink-500">Identité du compte connecté à la console.</p>
        </div>
        <Link
          to="/admin/parametres"
          className="rounded-lg bg-[#8c4205] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6e3404]"
        >
          Modifier
        </Link>
      </div>

      <section className="rounded-2xl border border-black/8 bg-white p-6">
        <div className="flex items-center gap-4">
          <AvatarCompte
            nom={user?.name}
            photo={user?.photo}
            className="h-20 w-20 overflow-hidden rounded-full bg-[#8c4205] text-lg text-white"
          />
          <div className="min-w-0">
            <p className="truncate text-xl font-bold text-ink-900">{user?.name}</p>
            <p className="truncate text-sm text-ink-500">{roleAffiche(user?.role)}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">E-mail</dt>
            <dd className="mt-1 text-sm text-ink-900">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Téléphone</dt>
            <dd className="mt-1 text-sm text-ink-900">{user?.phone || 'Non renseigné'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Langue</dt>
            <dd className="mt-1 text-sm text-ink-900">{user?.locale === 'en' ? 'Anglais' : 'Français'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Statut</dt>
            <dd className="mt-1 text-sm text-ink-900">{user?.status === 'active' ? 'Actif' : user?.status}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

export function PageParametresAdmin() {
  const { user, refresh } = useAuth()
  const [identite, setIdentite] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    locale: user?.locale || 'fr',
  })
  const [motsDePasse, setMotsDePasse] = useState({
    mot_de_passe_actuel: '',
    password: '',
    password_confirmation: '',
  })
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState<'identite' | 'photo' | 'motdepasse' | null>(null)

  useEffect(() => {
    setIdentite({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      locale: user?.locale || 'fr',
    })
  }, [user?.name, user?.email, user?.phone, user?.locale])

  async function enregistrerIdentite(evenement: FormEvent) {
    evenement.preventDefault()
    setMessage('')
    setErreur('')
    setEnCours('identite')
    try {
      await api.patch('/auth/profil', {
        ...identite,
        phone: identite.phone.trim() || null,
      })
      await refresh()
      setMessage('Profil enregistré.')
    } catch (err) {
      setErreur(messageErreurApi(err, 'Le profil n’a pas pu être enregistré.'))
    } finally {
      setEnCours(null)
    }
  }

  async function envoyerPhoto(fichier?: File) {
    if (!fichier) return
    setMessage('')
    setErreur('')
    setEnCours('photo')
    try {
      const donnees = new FormData()
      donnees.append('photo', fichier)
      await api.post('/auth/photo', donnees)
      await refresh()
      setMessage('Photo de profil enregistrée.')
    } catch (err) {
      setErreur(messageErreurApi(err, 'La photo n’a pas pu être enregistrée.'))
    } finally {
      setEnCours(null)
    }
  }

  async function retirerPhoto() {
    setMessage('')
    setErreur('')
    setEnCours('photo')
    try {
      await api.delete('/auth/photo')
      await refresh()
      setMessage('Photo de profil retirée.')
    } catch (err) {
      setErreur(messageErreurApi(err, 'La photo n’a pas pu être retirée.'))
    } finally {
      setEnCours(null)
    }
  }

  async function enregistrerMotDePasse(evenement: FormEvent) {
    evenement.preventDefault()
    setMessage('')
    setErreur('')
    if (motsDePasse.password !== motsDePasse.password_confirmation) {
      setErreur('La confirmation du mot de passe ne correspond pas.')
      return
    }
    setEnCours('motdepasse')
    try {
      await api.post('/auth/mot-de-passe', motsDePasse)
      setMotsDePasse({ mot_de_passe_actuel: '', password: '', password_confirmation: '' })
      setMessage('Mot de passe modifié.')
    } catch (err) {
      setErreur(messageErreurApi(err, 'Le mot de passe n’a pas pu être modifié.'))
    } finally {
      setEnCours(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Paramètres</h1>
        <IconeInformation titre="Ce que vous pouvez modifier">
          <p>Le nom, l’e-mail, le téléphone et la langue servent à votre compte.</p>
          <p>La photo remplace les initiales dans la console. Le mot de passe demande l’actuel.</p>
        </IconeInformation>
        {message && <p className="rounded-lg bg-marque-voile px-3 py-1.5 text-sm font-medium text-marque-encre">{message}</p>}
        {erreur && <p className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">{erreur}</p>}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <form onSubmit={(e) => void enregistrerIdentite(e)} className="rounded-2xl border border-black/8 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <AvatarCompte
              nom={user?.name}
              photo={user?.photo}
              className="h-14 w-14 overflow-hidden rounded-full bg-[#8c4205] text-white"
            />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-ink-900">Photo de profil</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <label className="relative cursor-pointer rounded-lg border border-black/10 px-3 py-1.5 text-sm font-semibold text-ink-900 hover:bg-[#f4f5f4]">
                  {enCours === 'photo' ? 'Envoi…' : 'Choisir une photo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="absolute h-px w-px overflow-hidden opacity-0"
                    disabled={enCours !== null}
                    onChange={(e) => {
                      const fichier = e.target.files?.[0]
                      e.target.value = ''
                      void envoyerPhoto(fichier)
                    }}
                  />
                </label>
                {user?.photo && (
                  <button
                    type="button"
                    disabled={enCours !== null}
                    onClick={() => void retirerPhoto()}
                    className="rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-500 hover:text-red-700 disabled:opacity-60"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>
          </div>

          <h2 className="mt-4 text-base font-bold text-ink-900">Identité</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className={libelle}>
              Nom
              <input
                required
                value={identite.name}
                onChange={(e) => setIdentite((f) => ({ ...f, name: e.target.value }))}
                className={champ}
              />
            </label>
            <label className={libelle}>
              E-mail
              <input
                required
                type="email"
                value={identite.email}
                onChange={(e) => setIdentite((f) => ({ ...f, email: e.target.value }))}
                className={champ}
              />
            </label>
            <label className={libelle}>
              Téléphone
              <input
                value={identite.phone}
                onChange={(e) => setIdentite((f) => ({ ...f, phone: e.target.value }))}
                className={champ}
              />
            </label>
            <label className={libelle}>
              Langue
              <select
                value={identite.locale}
                onChange={(e) => setIdentite((f) => ({ ...f, locale: e.target.value }))}
                className={champ}
              >
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={enCours !== null}
            className="mt-3 rounded-lg bg-[#8c4205] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6e3404] disabled:opacity-60"
          >
            {enCours === 'identite' ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>

        <form onSubmit={(e) => void enregistrerMotDePasse(e)} className="rounded-2xl border border-black/8 bg-white p-4">
          <h2 className="text-base font-bold text-ink-900">Mot de passe</h2>
          <div className="mt-2 grid gap-3">
            <label className={libelle}>
              Mot de passe actuel
              <ChampMotDePasse
                required
                autoComplete="current-password"
                value={motsDePasse.mot_de_passe_actuel}
                onChange={(e) => setMotsDePasse((f) => ({ ...f, mot_de_passe_actuel: e.target.value }))}
                className={champ}
              />
            </label>
            <label className={libelle}>
              Nouveau mot de passe
              <ChampMotDePasse
                required
                autoComplete="new-password"
                value={motsDePasse.password}
                onChange={(e) => setMotsDePasse((f) => ({ ...f, password: e.target.value }))}
                className={champ}
              />
            </label>
            <label className={libelle}>
              Confirmation
              <ChampMotDePasse
                required
                autoComplete="new-password"
                value={motsDePasse.password_confirmation}
                onChange={(e) => setMotsDePasse((f) => ({ ...f, password_confirmation: e.target.value }))}
                className={champ}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={enCours !== null}
            className="mt-3 rounded-lg bg-[#8c4205] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6e3404] disabled:opacity-60"
          >
            {enCours === 'motdepasse' ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
