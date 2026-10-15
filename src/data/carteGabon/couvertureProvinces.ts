/**
 * Indicateur de densité d’offre (jours d’autonomie visuelle).
 * Valeurs alignées sur PROVINCES_STRATEGIC_DATA (OPN) pour la couche stocks.
 */
export type CouvertureProvince = {
  code: string
  jours: number
}

export const COUVERTURE_PROVINCES: CouvertureProvince[] = [
  { code: 'G1', jours: 92 },
  { code: 'G2', jours: 74 },
  { code: 'G3', jours: 65 },
  { code: 'G4', jours: 56 },
  { code: 'G5', jours: 52 },
  { code: 'G6', jours: 48 },
  { code: 'G7', jours: 50 },
  { code: 'G8', jours: 78 },
  { code: 'G9', jours: 62 },
]

export function couleurCoucheStocks(jours: number): 'bleu' | 'ambre' | 'rose' {
  if (jours > 60) return 'bleu'
  if (jours >= 45) return 'ambre'
  return 'rose'
}
