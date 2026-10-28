/**
 * Titre centré avec le trait de soulignement de la vitrine.
 * Le trait orange reprend l’accent du logo, le texte reste encre.
 */
export function TitreEditorial({ children }: { children: string }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-extrabold uppercase tracking-wide text-ink-900 md:text-[1.85rem]">
        {children}
      </h2>
      <svg viewBox="0 0 160 18" className="mx-auto mt-2 h-3.5 w-32 text-marque-500" aria-hidden>
        <path
          d="M6 12c22-9 42-10 64-1 18 7 38 8 78-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export function TexteEditorial({ children }: { children: string }) {
  return (
    <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-relaxed text-ink-700 md:text-base">
      {children}
    </p>
  )
}
