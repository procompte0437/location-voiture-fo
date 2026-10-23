import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CARTE_VIEWBOX, CHEMINS_PROVINCES } from '../../data/carteGabon/cheminsProvinces'
import { COORDONNEES_CHEFS_LIEUX } from '../../data/carteGabon/coordonneesChefsLieux'
import api from '../../lib/api'
import { ContentLoader } from '../ui/Spinner'

type AgenceProvince = {
  id: number
  name: string
  address: string
  city: string
  partner_name?: string | null
  location_name?: string | null
}

type CategorieProvince = {
  id: number
  slug: string
  label: string
  description?: string
}

type DetailProvince = {
  province: { slug: string; nom: string; chef_lieu: string }
  agences: AgenceProvince[]
  categories: CategorieProvince[]
}

type CouvertureProvince = {
  slug: string
  agences_count: number
  has_agences: boolean
}

/**
 * Carte SVG interactive des 9 provinces.
 * Les provinces sans agence (admin) sont grisées ; les jours ne sont plus affichés.
 */
export function CarteProvincesGabon() {
  const [codeActif, setCodeActif] = useState('G1')
  const [survol, setSurvol] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailProvince | null>(null)
  const [couverture, setCouverture] = useState<Record<string, CouvertureProvince>>({})
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  const provinceActive = CHEMINS_PROVINCES.find((p) => p.code === codeActif)!
  const slugActif = provinceActive.slug

  useEffect(() => {
    const delai = window.setTimeout(() => {
      void api
        .get('/catalog/provinces')
        .then(({ data }) => {
          const map: Record<string, CouvertureProvince> = {}
          for (const p of data.data || []) {
            map[p.slug] = {
              slug: p.slug,
              agences_count: Number(p.agences_count || 0),
              has_agences: Boolean(p.has_agences),
            }
          }
          setCouverture(map)
        })
        .catch(() => setCouverture({}))
    }, 0)
    return () => window.clearTimeout(delai)
  }, [])

  useEffect(() => {
    const delai = window.setTimeout(() => {
      setChargement(true)
      setErreur('')
      void api
        .get(`/catalog/provinces/${slugActif}`)
        .then(({ data }) => {
          setDetail(data.data)
          const count = (data.data?.agences || []).length
          setCouverture((actuel) => ({
            ...actuel,
            [slugActif]: {
              slug: slugActif,
              agences_count: count,
              has_agences: count > 0,
            },
          }))
        })
        .catch(() => {
          setDetail(null)
          setErreur('Impossible de charger les agences de cette province.')
        })
        .finally(() => setChargement(false))
    }, 0)
    return () => window.clearTimeout(delai)
  }, [slugActif])

  function aDesAgences(code: string) {
    const slug = CHEMINS_PROVINCES.find((p) => p.code === code)?.slug
    if (!slug) return false
    return Boolean(couverture[slug]?.has_agences)
  }

  function fillProvince(code: string) {
    if (code === codeActif) return 'url(#grad-selected)'
    if (code === survol) return 'url(#grad-hover)'
    if (!aDesAgences(code)) return 'url(#grad-vide)'
    return 'url(#grad-default)'
  }

  const nbAgences = detail?.agences.length ?? 0
  const nbCategories = detail?.categories.length ?? 0
  const nbProvincesAvecAgence = useMemo(
    () => Object.values(couverture).filter((p) => p.has_agences).length,
    [couverture],
  )

  return (
    <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]">
      <div className="flex flex-col rounded-2xl border border-sand-200 bg-white p-5 shadow-sm md:p-6 lg:order-2">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[#b85c00] px-2.5 py-1 text-xs font-semibold text-white">
            Province {codeActif} — {provinceActive.nom}
          </span>
          {!chargement && !aDesAgences(codeActif) && (
            <span className="rounded-md bg-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-600">
              Aucune agence
            </span>
          )}
        </div>

        <h3 className="font-display text-xl font-bold text-forest-950 md:text-2xl">
          Agences de {provinceActive.chefLieu}
        </h3>
        <p className="mt-1 text-sm text-ink-500">
          Offre de location dans la province {provinceActive.nom}.
        </p>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex flex-col gap-0.5 border-b border-sand-100 pb-2 sm:flex-row sm:justify-between">
            <dt className="text-ink-500">Chef-lieu</dt>
            <dd className="font-semibold text-ink-900">{provinceActive.chefLieu}</dd>
          </div>
          <div className="flex flex-col gap-0.5 border-b border-sand-100 pb-2 sm:flex-row sm:justify-between">
            <dt className="text-ink-500">Agences recensées</dt>
            <dd className="font-semibold text-ink-900">
              {chargement ? '…' : `${nbAgences} agence${nbAgences > 1 ? 's' : ''}`}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="text-ink-500">Catégories disponibles</dt>
            <dd className="font-semibold text-ink-900">
              {chargement ? '…' : `${nbCategories} catégorie${nbCategories > 1 ? 's' : ''}`}
            </dd>
          </div>
        </dl>

        <div className="mt-5 min-h-[8rem] flex-1">
          {chargement ? (
            <ContentLoader label="Chargement…" />
          ) : erreur ? (
            <p className="text-sm text-red-700">{erreur}</p>
          ) : (
            <>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                Agences
              </p>
              {(detail?.agences.length || 0) === 0 ? (
                <p className="rounded-xl border border-dashed border-sand-200 px-3 py-3 text-sm text-ink-500">
                  Aucune agence renseignée. Le super admin les ajoute dans Admin → Agences
                  provinces.
                </p>
              ) : (
                <ul className="mb-4 max-h-36 space-y-2 overflow-y-auto">
                  {detail!.agences.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-xl border border-sand-200 bg-sand-50/80 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-ink-900">{a.name}</p>
                      <p className="text-xs text-ink-500">{a.city}</p>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                Catégories
              </p>
              {(detail?.categories.length || 0) === 0 ? (
                <p className="text-sm text-ink-500">Aucune catégorie publiée.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {detail!.categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/recherche?category=${cat.slug}&province=${slugActif}`}
                      className="rounded-full bg-forest-900 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-forest-800"
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 border-t border-sand-100 pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            Choisir une province :
          </p>
          <div className="grid grid-cols-3 gap-2">
            {CHEMINS_PROVINCES.map((p) => {
              const actif = p.code === codeActif
              const avecAgence = aDesAgences(p.code)
              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => setCodeActif(p.code)}
                  className={`rounded-lg border px-2 py-2 text-left text-xs transition ${
                    actif
                      ? 'border-[#b85c00] bg-[#b85c00] text-white'
                      : avecAgence
                        ? 'border-sand-200 bg-white text-ink-700 hover:border-[#b85c00]/40'
                        : 'border-neutral-200 bg-neutral-100 text-neutral-400'
                  }`}
                >
                  <span className="block font-bold">{p.code}</span>
                  <span
                    className={`block truncate ${
                      actif ? 'text-white/90' : avecAgence ? 'text-ink-500' : 'text-neutral-400'
                    }`}
                  >
                    {p.chefLieu}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-2xl border border-sand-200 bg-gradient-to-b from-[#e8f1f8] to-[#f4f7fa] p-4 shadow-sm md:p-5 lg:order-1">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#b85c00] text-white">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5z" />
              </svg>
            </span>
            <h3 className="font-display text-lg font-bold text-forest-950">
              Cartographie officielle interactive
            </h3>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#b85c00] shadow-sm ring-1 ring-[#b85c00]/20">
            {nbProvincesAvecAgence}/9 avec agences
          </span>
        </div>

        <svg
          id="map-gabon-opn"
          viewBox={CARTE_VIEWBOX}
          className="mx-auto h-auto w-full max-w-xl flex-1 drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Carte interactive des 9 provinces"
        >
          <defs>
            <linearGradient id="grad-selected" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F0A038" />
              <stop offset="100%" stopColor="#C56A08" />
            </linearGradient>
            <linearGradient id="grad-hover" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E09220" />
              <stop offset="100%" stopColor="#C56A08" />
            </linearGradient>
            <linearGradient id="grad-default" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F6C56A" />
              <stop offset="100%" stopColor="#E8A04A" />
            </linearGradient>
            <linearGradient id="grad-vide" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D1D5DB" />
              <stop offset="100%" stopColor="#9CA3AF" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g id="provinces-layer">
            {CHEMINS_PROVINCES.map((p) => {
              const actif = p.code === codeActif
              const hover = p.code === survol
              const avecAgence = aDesAgences(p.code)
              return (
                <path
                  key={p.code}
                  id={p.code.toLowerCase()}
                  d={p.path}
                  fill={fillProvince(p.code)}
                  stroke={actif ? '#FFDE16' : '#FFFFFF'}
                  strokeWidth={actif ? 2.8 : hover ? 2 : 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={actif ? 'url(#glow)' : undefined}
                  role="button"
                  tabIndex={0}
                  aria-label={`Province ${p.code} ${p.nom}${avecAgence ? '' : ' — sans agence'}`}
                  aria-pressed={actif}
                  className="cursor-pointer transition-all duration-200 outline-none"
                  onMouseEnter={() => setSurvol(p.code)}
                  onMouseLeave={() => setSurvol(null)}
                  onClick={() => setCodeActif(p.code)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setCodeActif(p.code)
                    }
                  }}
                >
                  <title>{`${p.nom} (${p.chefLieu})${avecAgence ? '' : ' — aucune agence'}`}</title>
                </path>
              )
            })}
          </g>

          <g id="antennes-markers">
            {COORDONNEES_CHEFS_LIEUX.map((c) => {
              const actif = c.code === codeActif
              const hover = c.code === survol
              const avecAgence = aDesAgences(c.code)
              const libelle = c.chefLieu
              const largeur = libelle.length * 6.4 + 9

              return (
                <g
                  key={`balise-${c.code}`}
                  className="cursor-pointer"
                  onClick={() => setCodeActif(c.code)}
                  onMouseEnter={() => setSurvol(c.code)}
                  onMouseLeave={() => setSurvol(null)}
                >
                  {actif && avecAgence && (
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={19}
                      fill="#FFDE16"
                      opacity={0.4}
                      className="animate-ping"
                    />
                  )}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={actif ? 8 : hover ? 7 : 5.5}
                    fill={actif ? '#FFDE16' : avecAgence ? '#FFFFFF' : '#E5E7EB'}
                    stroke={actif ? '#005038' : avecAgence ? '#8c4205' : '#9CA3AF'}
                    strokeWidth={2.2}
                    className="transition-all duration-200"
                  />
                  <g transform={`translate(${c.x + 9}, ${c.y + 4})`}>
                    <rect
                      x={-2}
                      y={-11}
                      width={largeur}
                      height={14}
                      rx={3}
                      fill={actif ? '#3d1c02' : 'rgba(255,255,255,0.95)'}
                      stroke={actif ? '#FFDE16' : avecAgence ? '#94A3B8' : '#D1D5DB'}
                      strokeWidth={0.9}
                    />
                    <text
                      x={2}
                      y={-1}
                      fill={actif ? '#FFDE16' : avecAgence ? '#0F172A' : '#9CA3AF'}
                      fontSize={9}
                      fontWeight={actif ? 800 : 700}
                      fontFamily="DM Sans, sans-serif"
                      className="select-none pointer-events-none"
                    >
                      {libelle}
                    </text>
                  </g>
                </g>
              )
            })}
          </g>
        </svg>

        <div className="mt-3 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-2.5 text-[10.5px] text-slate-600">
          <span className="flex items-center gap-1 font-medium">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#b85c00]" /> Avec agences
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#9CA3AF]" /> Sans agence
          </span>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-500">
          Cliquez sur une province pour voir ses agences. Les zones grises n’ont pas encore
          d’agence (à créer côté admin).
        </p>
      </div>
    </div>
  )
}
