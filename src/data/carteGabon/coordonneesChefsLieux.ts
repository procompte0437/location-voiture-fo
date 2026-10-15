import gabonMapCoords from './gabonMapCoordinates.json'

export type CoordonneeChefLieu = {
  code: string
  slug: string
  x: number
  y: number
  hub?: boolean
  chefLieu: string
}

const SLUGS: Record<string, string> = {
  G1: 'estuaire',
  G2: 'haut-ogooue',
  G3: 'moyen-ogooue',
  G4: 'ngounie',
  G5: 'nyanga',
  G6: 'ogooue-ivindo',
  G7: 'ogooue-lolo',
  G8: 'ogooue-maritime',
  G9: 'woleu-ntem',
}

type CoordJson = {
  id: string
  name: string
  chefLieu: string
  center: { x: number; y: number }
  hub?: boolean
}

export const COORDONNEES_CHEFS_LIEUX: CoordonneeChefLieu[] = Object.values(
  gabonMapCoords as Record<string, CoordJson>,
).map((c) => ({
  code: c.id,
  slug: SLUGS[c.id],
  x: c.center.x,
  y: c.center.y,
  chefLieu: c.chefLieu,
  ...(c.hub ? { hub: true } : {}),
}))

export const HUB_NATIONAL = { x: 110, y: 175 }
