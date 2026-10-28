import { useId, useState, type ReactNode } from 'react'

type PropsIconeInformation = {
  titre: string
  /** Texte d’aide révélé sous le titre, sans fenêtre par-dessus la page. */
  children: ReactNode
}

/**
 * Point d’aide « i ».
 * Le texte se déplie dans la page : il ne couvre pas le reste de l’écran.
 */
export function IconeInformation({ titre, children }: PropsIconeInformation) {
  const [ouvert, setOuvert] = useState(false)
  const identifiant = useId()

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert((actuel) => !actuel)}
        aria-expanded={ouvert}
        aria-controls={identifiant}
        aria-label={titre}
        title={titre}
        className="inline-grid h-5 w-5 shrink-0 place-items-center rounded-full border border-ink-400 text-[11px] font-semibold italic leading-none text-ink-600 hover:border-[#8c4205] hover:text-[#8c4205]"
      >
        i
      </button>
      {ouvert && (
        <div
          id={identifiant}
          className="basis-full w-full rounded-xl bg-marque-voile px-3 py-2 text-left text-sm font-normal normal-case leading-relaxed tracking-normal text-ink-700"
        >
          <p className="font-semibold text-ink-900">{titre}</p>
          <div className="mt-1 space-y-2">{children}</div>
        </div>
      )}
    </>
  )
}
