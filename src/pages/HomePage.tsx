import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { SearchForm } from '../components/search/SearchForm'
import { VehicleCard } from '../components/vehicles/VehicleCard'
import api, { categoryLabel } from '../lib/api'
import type { Location, Vehicle } from '../types'

const CATEGORIES = ['city_car', 'sedan', 'suv', '4x4', 'minibus', 'luxury']

const REASSURANCE = [
  { title: 'Prix final garanti', text: 'Aucun frais caché à la prise en charge' },
  { title: 'Assurance incluse', text: 'Véhicules couverts pendant la location' },
  { title: 'Mobile Money', text: 'Airtel Money & Moov Money acceptés' },
  { title: 'Support WhatsApp', text: 'Assistance locale réactive' },
]

export function HomePage() {
  const [popular, setPopular] = useState<Location[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  useEffect(() => {
    void Promise.all([
      api.get('/locations/popular'),
      api.get('/vehicles/search', { params: { per_page: 6, sort: 'rating' } }),
    ]).then(([locs, vehs]) => {
      setPopular(locs.data.data)
      setVehicles(vehs.data.data)
    })
  }, [])

  return (
    <div className="min-h-screen bg-sand-50">
      <section className="relative min-h-[92vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(6,40,28,0.78) 0%, rgba(10,61,42,0.55) 45%, rgba(6,40,28,0.35) 100%), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1800&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(230,184,74,0.18),transparent_50%)]" />
        <Header />

        <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center gap-10 px-4 pb-16 pt-28 md:px-6">
          <div className="max-w-2xl animate-[fadeUp_0.7s_ease-out]">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">
              Marketplace de location au Gabon
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              LocaGabon
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/85 md:text-xl">
              Comparez, réservez et payez votre véhicule en moins de 3 minutes — partenaires locaux vérifiés.
            </p>
            <p className="mt-3 text-sm text-white/70">
              Véhicules récents · Assurance incluse · Livraison aéroport Léon-Mba / hôtel / domicile
            </p>
          </div>

          <div className="max-w-3xl animate-[fadeUp_0.9s_ease-out]">
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="border-b border-sand-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
          {REASSURANCE.map((item) => (
            <div key={item.title} className="space-y-1">
              <h2 className="font-semibold text-forest-800">{item.title}</h2>
              <p className="text-sm text-ink-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-forest-950">
            Agence de location de voiture au Gabon
          </h2>
          <p className="mt-3 text-ink-700">
            Destinations populaires pour démarrer votre recherche.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {popular.map((loc) => (
            <Link
              key={loc.id}
              to={`/recherche?location_id=${loc.id}&location_label=${encodeURIComponent(loc.name)}`}
              className="rounded-xl border border-sand-200 bg-white px-4 py-5 transition hover:border-forest-600 hover:shadow-md"
            >
              <p className="font-semibold text-ink-900">{loc.name}</p>
              <p className="text-sm capitalize text-ink-500">{loc.type}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-forest-950 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="font-display text-3xl font-bold">Catégories</h2>
          <p className="mt-2 text-white/70">De la citadine au 4x4 pour l’intérieur du pays.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/recherche?category=${cat}`}
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium transition hover:border-gold-400 hover:bg-white/10"
              >
                {categoryLabel(cat)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-forest-950">Véhicules vedettes</h2>
            <p className="mt-2 text-ink-700">Offres de partenaires validés par notre équipe.</p>
          </div>
          <Link to="/vehicules" className="text-sm font-semibold text-forest-700 hover:underline">
            Tout voir
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      </section>

      <footer className="border-t border-sand-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-ink-500 md:flex-row md:items-center md:justify-between md:px-6">
          <p className="font-display text-lg font-semibold text-forest-900">
            Loca<span className="text-gold-600">Gabon</span>
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/devenir-partenaire">Devenir partenaire</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/connexion">Connexion</Link>
          </div>
          <p>© {new Date().getFullYear()} LocaGabon — marketplace multi-partenaires</p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
