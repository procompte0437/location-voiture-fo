import { Link } from 'react-router-dom'

const LIENS_PIED = [
  { vers: '/mes-reservations', libelle: 'Mes réservations' },
  { vers: '/devenir-partenaire', libelle: 'À propos de nous' },
  { vers: '/faq', libelle: 'Aide' },
  { vers: '/charte-de-confidentialite', libelle: 'Charte de confidentialité' },
  { vers: '/conditions-generales', libelle: 'Conditions générales' },
  { vers: '/plan-du-site', libelle: 'Plan du site' },
  { vers: '/contact', libelle: 'Contactez-nous' },
  { vers: '/vehicules', libelle: 'Location de voitures' },
]

/** Pied de page vert : liens centrés, marque et copyright. */
export function PiedDePage() {
  return (
    <footer className="relative bg-forest-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 text-center md:px-6">
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          {LIENS_PIED.map((lien) => (
            <Link key={lien.libelle} to={lien.vers} className="hover:underline">
              {lien.libelle}
            </Link>
          ))}
        </nav>

        <p className="mt-8 text-3xl font-extrabold tracking-tight">DOTO</p>
        <p className="mt-3 text-xs text-white/80">
          © Copyright {new Date().getFullYear()} DOTO — Location entre partenaires vérifiés
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new CustomEvent('locagabon:cookies'))
        }}
        className="absolute bottom-0 left-0 rounded-tr-md bg-neutral-950 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white"
      >
        Paramétrage des cookies
      </button>
    </footer>
  )
}
