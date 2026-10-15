import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const src = fs.readFileSync(path.join(root, 'src/data/provincesGabon.ts'), 'utf8')
const arr = eval(src.match(/PROVINCES_GABON[^=]*=\s*(\[[\s\S]*\])/)[1])

function centroid(pathD) {
  const nums = [...pathD.matchAll(/([ML])\s*([-\d.]+),([-\d.]+)/g)].map((x) => ({
    x: +x[2],
    y: +x[3],
  }))
  const step = Math.max(1, Math.floor(nums.length / 40))
  let sx = 0
  let sy = 0
  let n = 0
  for (let i = 0; i < nums.length; i += step) {
    sx += nums[i].x
    sy += nums[i].y
    n++
  }
  return { x: Math.round(sx / n), y: Math.round(sy / n) }
}

const meta = [
  { code: 'G1', slug: 'estuaire' },
  { code: 'G2', slug: 'haut-ogooue' },
  { code: 'G3', slug: 'moyen-ogooue' },
  { code: 'G4', slug: 'ngounie' },
  { code: 'G5', slug: 'nyanga' },
  { code: 'G6', slug: 'ogooue-ivindo' },
  { code: 'G7', slug: 'ogooue-lolo' },
  { code: 'G8', slug: 'ogooue-maritime' },
  { code: 'G9', slug: 'woleu-ntem' },
]

const chemins = meta.map((m) => {
  const pr = arr.find((x) => x.id === m.slug)
  return {
    code: m.code,
    slug: m.slug,
    nom: pr.nom,
    chefLieu: pr.chefLieu,
    path: pr.path,
  }
})

const coords = meta.map((m) => {
  const pr = arr.find((x) => x.id === m.slug)
  const c = centroid(pr.path)
  return {
    code: m.code,
    slug: m.slug,
    x: c.x,
    y: c.y,
    ...(m.code === 'G1' ? { hub: true } : {}),
  }
})
// Hub Owendo / Libreville — ancrage logistique national
coords[0].x = 95
coords[0].y = 185

const dir = path.join(root, 'src/data/carteGabon')
fs.mkdirSync(dir, { recursive: true })

fs.writeFileSync(
  path.join(dir, 'cheminsProvinces.ts'),
  `/** Tracés SVG des 9 provinces (GADM simplifié). */
export type CheminProvince = {
  code: string
  slug: string
  nom: string
  chefLieu: string
  path: string
}

export const CARTE_VIEWBOX = '0 0 520 560'

export const CHEMINS_PROVINCES: CheminProvince[] = ${JSON.stringify(chemins, null, 2)}
`,
)

fs.writeFileSync(
  path.join(dir, 'coordonneesChefsLieux.ts'),
  `/** Centres des chefs-lieux + hub national (Owendo / Estuaire). */
export type CoordonneeChefLieu = {
  code: string
  slug: string
  x: number
  y: number
  hub?: boolean
}

export const COORDONNEES_CHEFS_LIEUX: CoordonneeChefLieu[] = ${JSON.stringify(coords, null, 2)}
`,
)

console.log('OK', chemins.map((c) => c.code).join(', '))
console.log(JSON.stringify(coords, null, 2))
