export type UserRole = 'customer' | 'partner' | 'partner_agent' | 'admin' | 'super_admin'

export interface User {
  id: number
  name: string
  email: string
  phone?: string | null
  role: UserRole
  status: string
  locale: string
  customer_profile?: CustomerProfile | null
  owned_partner?: Partner | null
}

export interface CustomerProfile {
  id: number
  first_name?: string
  last_name?: string
  city?: string
}

export interface Partner {
  id: number
  type: string
  company_name?: string
  manager_name?: string
  city?: string
  status: string
  trust_level: string
  average_rating: number
  reviews_count: number
  commission_rate: number
  status_reason?: string | null
}

export interface Location {
  id: number
  name: string
  slug: string
  type: string
  city?: string
  is_popular?: boolean
}

export interface Vehicle {
  id: number
  brand: string
  model: string
  display_name: string
  year?: number
  category: string
  seats: number
  doors: number
  luggage: number
  transmission: string
  fuel: string
  air_conditioning: boolean
  included_km?: number | null
  deposit_amount: number
  min_driver_age: number
  booking_mode: string
  cancellation_policy: string
  with_driver_available: boolean
  airport_delivery: boolean
  free_cancellation: boolean
  fuel_policy: string
  features?: string[]
  description?: string
  price_per_day: number
  total_price?: number | null
  days?: number | null
  currency: string
  cover_url?: string | null
  media?: { id: number; url: string; is_cover: boolean }[]
  partner: {
    id: number
    name?: string
    average_rating: number
    reviews_count: number
    trust_level: string
    city?: string
  }
  agency?: { id: number; name: string; city: string } | null
}

export interface SearchParams {
  location_id?: number
  location_label?: string
  return_location_id?: number
  different_return?: boolean
  pickup_at: string
  return_at: string
  driver_age: number
}

export interface Booking {
  id: number
  reference: string
  status: string
  pickup_at: string
  return_at: string
  days_count: number
  total_amount: number
  commission_amount: number
  vehicle?: Vehicle
  partner?: Partner
}
