/** Trois arguments de confiance sous le hero (modèle comparateur). */
export function BandeauConfiance() {
  const items = [
    {
      titre: 'Annulation gratuite',
      texte: 'Jusqu’à 48 heures avant le retrait',
      icone: (
        <svg viewBox="0 0 48 48" className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M24 6l14 5v11c0 9.5-6.2 16.8-14 20-7.8-3.2-14-10.5-14-20V11l14-5z" />
          <path d="M24 18v8M24 30h.01" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      titre: 'Comparez les prix, aucun frais caché',
      texte: 'Partenaires vérifiés dans les neuf provinces',
      icone: (
        <svg viewBox="0 0 48 48" className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="8" y="14" width="28" height="20" rx="2" />
          <path d="M12 20h20M12 26h12" strokeLinecap="round" />
          <path d="M30 22l8 4-8 4V22z" />
        </svg>
      ),
    },
    {
      titre: 'Service client réactif',
      texte: 'Toujours à votre disposition pour vous aider',
      icone: (
        <svg viewBox="0 0 48 48" className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="24" cy="24" r="14" />
          <path d="M24 14v6l4 2" strokeLinecap="round" />
          <path d="M18 34h12" strokeLinecap="round" />
        </svg>
      ),
    },
  ]

  return (
    <section className="border-b border-neutral-100 bg-white px-4 py-12 md:px-6 md:py-14">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3 sm:gap-6">
        {items.map((item) => (
          <div key={item.titre} className="text-center">
            {item.icone}
            <p className="mt-4 text-base font-bold text-neutral-900">{item.titre}</p>
            <p className="mt-1 text-sm text-neutral-500">{item.texte}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
