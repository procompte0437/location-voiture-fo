import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../../lib/api'
import { SAVOIR_LOCAL, SUGGESTIONS, repondreVisiteur, savoirDepuisFaq, type EntreeSavoir } from '../../lib/robotDiscussion'

const WHATSAPP = 'https://wa.me/24104371973'
const MESSENGER = 'https://m.me/doto241'

/** Les trois raccourcis visibles sur le modèle : chacun ouvre le canal correspondant. */
const RACCOURCIS = [
  {
    nom: 'Messenger',
    href: MESSENGER,
    externe: true,
    icone: 'messenger' as const,
  },
  {
    nom: 'WhatsApp',
    href: WHATSAPP,
    externe: true,
    icone: 'whatsapp' as const,
  },
  {
    nom: 'Assistance',
    href: '/contact',
    externe: false,
    icone: 'assistance' as const,
  },
]

function IconeMessenger() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M12 3C6.8 3 2.6 6.9 2.6 11.7c0 2.6 1.3 4.9 3.4 6.4V21l3.1-1.7c.9.2 1.8.4 2.9.4 5.2 0 9.4-3.9 9.4-8.7S17.2 3 12 3zm.6 11.7-2.4-2.5-4.6 2.5 5.1-5.4 2.4 2.5 4.6-2.5-5.1 5.4z" />
    </svg>
  )
}

function IconeWhatsapp() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm5.76 13.92c-.24.68-1.2 1.24-1.96 1.4-.52.11-1.2.2-3.48-.75-2.92-1.21-4.8-4.18-4.95-4.37-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.26-.29.57-.36.76-.36h.55c.17 0 .41-.07.64.49.24.58.82 2 .89 2.15.07.14.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.54.73 1.8.86.27.14.44.2.51.31.07.12.07.67-.17 1.35Z" />
    </svg>
  )
}

function IconeAssistance() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 13a8 8 0 0 1 16 0" strokeLinecap="round" />
      <path d="M4 13v3.5A2.5 2.5 0 0 0 6.5 19H8v-6H6.2A2.2 2.2 0 0 0 4 15.2V13zM20 13v2.2a2.2 2.2 0 0 1-2.2 2.2H16v-6h1.5A2.5 2.5 0 0 1 20 13.5V13z" />
      <path d="M16 19.2a3.2 3.2 0 0 1-3.2 2.3h-1.3" strokeLinecap="round" />
    </svg>
  )
}

function IconeDiscussion() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 16.5 3.5 20.5 8 18.2A8.5 8.5 0 1 0 5 16.5z" strokeLinejoin="round" />
    </svg>
  )
}

function IconeHaut() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M6 14l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function glyphe(nom: (typeof RACCOURCIS)[number]['icone']) {
  if (nom === 'messenger') return <IconeMessenger />
  if (nom === 'whatsapp') return <IconeWhatsapp />
  return <IconeAssistance />
}

function BoutonRond({
  children,
  libelle,
  onClick,
  actif = false,
}: {
  children: ReactNode
  libelle: string
  onClick?: () => void
  actif?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={libelle}
      title={libelle}
      className={`grid h-12 w-12 place-items-center rounded-full shadow-lg ${
        actif ? 'bg-marque-500 text-ink-900' : 'bg-marque-encre text-white hover:bg-marque-sombre'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Raccourcis fixes en bas à droite : discussion, trois canaux, et retour en haut de page.
 * Le bouton rond déplie Messenger, WhatsApp et l’assistance ; chacun mène à son canal.
 */
export function RaccourcisFlottants() {
  const emplacement = useLocation()
  const [canauxOuverts, setCanauxOuverts] = useState(false)
  const [discussionOuverte, setDiscussionOuverte] = useState(false)
  const [assezBas, setAssezBas] = useState(false)
  const [saisie, setSaisie] = useState('')
  const [repond, setRepond] = useState(false)
  const [savoir, setSavoir] = useState<EntreeSavoir[]>(SAVOIR_LOCAL)
  const [echanges, setEchanges] = useState<{ auteur: 'robot' | 'visiteur'; texte: string }[]>([
    {
      auteur: 'robot',
      texte: 'Bonjour, je suis l’assistant DOTO. Posez une question, je vous réponds ici.',
    },
  ])
  const fil = useRef<HTMLDivElement>(null)

  const espacePrive =
    emplacement.pathname.startsWith('/admin') || emplacement.pathname.startsWith('/partenaire')

  useEffect(() => {
    setCanauxOuverts(false)
    setDiscussionOuverte(false)
  }, [emplacement.pathname])

  useEffect(() => {
    function mesurer() {
      setAssezBas(window.scrollY > 480)
    }
    mesurer()
    window.addEventListener('scroll', mesurer, { passive: true })
    return () => window.removeEventListener('scroll', mesurer)
  }, [])

  useEffect(() => {
    if (!discussionOuverte) return
    void api
      .get('/catalog/faq')
      .then(({ data }) => {
        const faq = (data.data || []) as { question: string; answer: string }[]
        setSavoir([...SAVOIR_LOCAL, ...faq.map((ligne) => savoirDepuisFaq(ligne.question, ligne.answer))])
      })
      .catch(() => undefined)
  }, [discussionOuverte])

  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight })
  }, [echanges, repond, discussionOuverte])

  if (espacePrive) return null

  function remonter() {
    const debut = window.scrollY
    const depart = performance.now()
    const duree = 280
    function etape(instant: number) {
      const progres = Math.min(1, (instant - depart) / duree)
      const ease = 1 - (1 - progres) * (1 - progres)
      window.scrollTo(0, debut * (1 - ease))
      if (progres < 1) requestAnimationFrame(etape)
    }
    requestAnimationFrame(etape)
  }

  function poser(texteBrut: string) {
    const texte = texteBrut.trim()
    if (!texte || repond) return
    setEchanges((actuel) => [...actuel, { auteur: 'visiteur', texte }])
    setSaisie('')
    setRepond(true)
    window.setTimeout(() => {
      const reponse = repondreVisiteur(texte, savoir)
      setEchanges((actuel) => [...actuel, { auteur: 'robot', texte: reponse }])
      setRepond(false)
    }, 450)
  }

  function envoyerDiscussion(evenement: FormEvent) {
    evenement.preventDefault()
    poser(saisie)
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-end gap-3">
      {assezBas && (
        <button
          type="button"
          onClick={remonter}
          aria-label="Remonter en haut de la page"
          title="Remonter"
          className="grid h-12 w-12 place-items-center rounded-full bg-marque-encre text-white shadow-lg hover:bg-marque-sombre"
        >
          <IconeHaut />
        </button>
      )}

      <div className="flex flex-col items-end gap-3">
        {canauxOuverts && (
          <ul className="flex flex-col items-end gap-2">
            {RACCOURCIS.map((raccourci) => {
              const pastille = (
                <>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-900 shadow">
                    {raccourci.nom}
                  </span>
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-marque-encre text-white shadow-lg">
                    {glyphe(raccourci.icone)}
                  </span>
                </>
              )
              return (
                <li key={raccourci.nom}>
                  {raccourci.externe ? (
                    <a
                      href={raccourci.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                      aria-label={raccourci.nom}
                    >
                      {pastille}
                    </a>
                  ) : (
                    <Link to={raccourci.href} className="flex items-center gap-2" aria-label={raccourci.nom}>
                      {pastille}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {discussionOuverte && (
          <form
            onSubmit={envoyerDiscussion}
            className="flex w-80 flex-col rounded-2xl border border-sand-200 bg-white p-3 text-ink-900 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 px-1">
              <p className="text-sm font-bold">Assistant DOTO</p>
              <button
                type="button"
                onClick={() => setDiscussionOuverte(false)}
                aria-label="Fermer la discussion"
                className="text-sm text-ink-500 hover:text-ink-900"
              >
                Fermer
              </button>
            </div>
            <div ref={fil} className="mt-2 flex max-h-64 flex-col gap-2 overflow-y-auto pr-1" aria-live="polite">
              {echanges.map((bulle, index) => (
                <p
                  key={`${bulle.auteur}-${index}`}
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    bulle.auteur === 'visiteur'
                      ? 'ml-auto bg-marque-encre text-white'
                      : 'bg-marque-voile text-ink-800'
                  }`}
                >
                  {bulle.texte}
                </p>
              ))}
              {repond && <p className="w-fit rounded-2xl bg-marque-voile px-3 py-2 text-sm text-ink-500">…</p>}
            </div>
            {echanges.length === 1 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => poser(suggestion)}
                    className="rounded-full border border-sand-200 px-2.5 py-1 text-xs font-semibold text-ink-800 hover:bg-sand-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Votre question</span>
                <input
                  value={saisie}
                  onChange={(evenement) => setSaisie(evenement.target.value)}
                  placeholder="Posez votre question"
                  className="w-full rounded-xl border border-sand-200 px-3 py-2 text-sm outline-none focus:border-marque-encre"
                />
              </label>
              <button
                type="submit"
                disabled={repond || !saisie.trim()}
                className="rounded-xl bg-marque-500 px-3 text-sm font-bold text-ink-900 hover:bg-gold-400 disabled:opacity-60"
              >
                Envoyer
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center gap-3">
          <BoutonRond
            libelle={canauxOuverts ? 'Fermer les raccourcis' : 'Ouvrir les raccourcis'}
            actif={canauxOuverts}
            onClick={() => setCanauxOuverts((ouvert) => !ouvert)}
          >
            {canauxOuverts ? (
              <span aria-hidden className="text-lg leading-none">
                ×
              </span>
            ) : (
              <IconeAssistance />
            )}
          </BoutonRond>
          <BoutonRond
            libelle={discussionOuverte ? 'Fermer la discussion' : 'Ouvrir la discussion'}
            actif={discussionOuverte}
            onClick={() => setDiscussionOuverte((ouverte) => !ouverte)}
          >
            <IconeDiscussion />
          </BoutonRond>
        </div>
      </div>
    </div>
  )
}
