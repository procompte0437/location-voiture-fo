import { useEffect, useId, useMemo, useRef, useState } from 'react'

export type OptionListeDeroulante = {
  valeur: string
  libelle: string
}

type PropsListeDeroulanteRecherche = {
  valeur: string
  onChange: (valeur: string) => void
  options: OptionListeDeroulante[]
  /** Texte du bouton quand aucune valeur n’est choisie. */
  placeholder?: string
  requis?: boolean
  libelle?: string
}

/**
 * Liste déroulante avec recherche intégrée au panneau.
 * La barre de recherche vit dans le menu, pas à côté du champ.
 */
export function ListeDeroulanteRecherche({
  valeur,
  onChange,
  options,
  placeholder = 'Choisir…',
  requis = false,
  libelle,
}: PropsListeDeroulanteRecherche) {
  const [ouvert, setOuvert] = useState(false)
  const [recherche, setRecherche] = useState('')
  const zone = useRef<HTMLDivElement>(null)
  const identifiant = useId()

  const libelleChoisi = options.find((option) => option.valeur === valeur)?.libelle

  const optionsFiltrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    if (!terme) return options
    return options.filter(
      (option) =>
        option.libelle.toLowerCase().includes(terme) ||
        option.valeur.toLowerCase().includes(terme),
    )
  }, [options, recherche])

  useEffect(() => {
    if (!ouvert) return
    function fermerSiExterieur(evenement: MouseEvent) {
      if (!zone.current?.contains(evenement.target as Node)) {
        setOuvert(false)
      }
    }
    document.addEventListener('mousedown', fermerSiExterieur)
    return () => document.removeEventListener('mousedown', fermerSiExterieur)
  }, [ouvert])

  function choisir(prochaine: string) {
    onChange(prochaine)
    setRecherche('')
    setOuvert(false)
  }

  return (
    <div ref={zone} className="relative">
      {/* Select natif hors écran : le navigateur bloque l’envoi si le choix est obligatoire. */}
      <select
        tabIndex={-1}
        aria-hidden
        required={requis}
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        className="absolute h-px w-px opacity-0"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.valeur} value={option.valeur}>
            {option.libelle}
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        aria-controls={identifiant}
        onClick={() => setOuvert((actuel) => !actuel)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-left text-sm"
      >
        <span className={libelleChoisi ? 'text-ink-900' : 'text-ink-500'}>
          {libelleChoisi || placeholder}
        </span>
        <span aria-hidden className="text-xs text-ink-400">
          ▾
        </span>
      </button>
      {ouvert && (
        <div
          id={identifiant}
          role="listbox"
          aria-label={libelle || placeholder}
          className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg"
        >
          <div className="border-b border-black/8 p-2">
            <input
              autoFocus
              value={recherche}
              onChange={(evenement) => setRecherche(evenement.target.value)}
              placeholder="Rechercher…"
              aria-label="Rechercher dans la liste"
              className="w-full rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-[#0b3d2e]/40"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {optionsFiltrees.length === 0 ? (
              <li className="px-3 py-2 text-sm text-ink-500">Aucun résultat.</li>
            ) : (
              optionsFiltrees.map((option) => (
                <li key={option.valeur}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.valeur === valeur}
                    onClick={() => choisir(option.valeur)}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-[#f4f5f4] ${
                      option.valeur === valeur ? 'bg-[#0b3d2e]/10 font-medium text-[#0b3d2e]' : 'text-ink-800'
                    }`}
                  >
                    {option.libelle}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
