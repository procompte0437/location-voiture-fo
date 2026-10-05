import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('locagabon_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

export function formatXaf(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    city_car: 'Citadine',
    sedan: 'Berline',
    suv: 'SUV',
    '4x4': '4x4',
    pickup: 'Pick-up',
    minibus: 'Minibus',
    utility: 'Utilitaire',
    luxury: 'Luxe',
  }
  return labels[category] ?? category
}

export function transmissionLabel(value: string): string {
  return value === 'automatic' ? 'Automatique' : 'Manuelle'
}

export function fuelLabel(value: string): string {
  const labels: Record<string, string> = {
    petrol: 'Essence',
    diesel: 'Diesel',
    hybrid: 'Hybride',
    electric: 'Électrique',
  }
  return labels[value] ?? value
}
