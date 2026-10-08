import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import api from '../lib/api'

type Labels = {
  categories: Record<string, string>
  fuel: Record<string, string>
  transmission: Record<string, string>
  partner_type?: Record<string, string>
  driver_age?: Record<string, string>
  booking_mode?: Record<string, string>
  cancellation_policy?: Record<string, string>
  payment_method?: Record<string, string>
  location_type?: Record<string, string>
}

type CatalogContextValue = {
  labels: Labels
  loading: boolean
  categoryLabel: (slug: string) => string
  fuelLabel: (slug: string) => string
  transmissionLabel: (slug: string) => string
}

const empty: Labels = { categories: {}, fuel: {}, transmission: {} }

const CatalogContext = createContext<CatalogContextValue | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Labels>(empty)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void api
      .get('/catalog/labels')
      .then(({ data }) => setLabels(data.data))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo<CatalogContextValue>(
    () => ({
      labels,
      loading,
      categoryLabel: (slug) => labels.categories[slug] || slug,
      fuelLabel: (slug) => labels.fuel[slug] || slug,
      transmissionLabel: (slug) => labels.transmission[slug] || slug,
    }),
    [labels, loading],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider')
  return ctx
}
