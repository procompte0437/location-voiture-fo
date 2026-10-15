import gabonMapPaths from './gabonMapPaths.json'

/** Métadonnées métier DOTO (slug API catalogue). */
const META: Record<string, { slug: string; nom: string; chefLieu: string }> = {
  G1: { slug: 'estuaire', nom: 'Estuaire', chefLieu: 'Libreville' },
  G2: { slug: 'haut-ogooue', nom: 'Haut-Ogooué', chefLieu: 'Franceville' },
  G3: { slug: 'moyen-ogooue', nom: 'Moyen-Ogooué', chefLieu: 'Lambaréné' },
  G4: { slug: 'ngounie', nom: 'Ngounié', chefLieu: 'Mouila' },
  G5: { slug: 'nyanga', nom: 'Nyanga', chefLieu: 'Tchibanga' },
  G6: { slug: 'ogooue-ivindo', nom: 'Ogooué-Ivindo', chefLieu: 'Makokou' },
  G7: { slug: 'ogooue-lolo', nom: 'Ogooué-Lolo', chefLieu: 'Koula-Moutou' },
  G8: { slug: 'ogooue-maritime', nom: 'Ogooué-Maritime', chefLieu: 'Port-Gentil' },
  G9: { slug: 'woleu-ntem', nom: 'Woleu-Ntem', chefLieu: 'Oyem' },
}

export type CheminProvince = {
  code: string
  slug: string
  nom: string
  chefLieu: string
  path: string
}

/** Canvas SVG officiel OPN. */
export const CARTE_VIEWBOX = '0 0 520 520'

export const CHEMINS_PROVINCES: CheminProvince[] = (
  Object.keys(META) as Array<keyof typeof META>
).map((code) => ({
  code,
  slug: META[code].slug,
  nom: META[code].nom,
  chefLieu: META[code].chefLieu,
  path: (gabonMapPaths as Record<string, string>)[code],
}))
