import { Link } from 'react-router-dom'

const PHOTO =
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1600&q=80'

/** Appel à réserver : le texte à gauche, la photo de route à droite. */
export function BandeauReservation() {
  return (
    <section className="relative overflow-hidden bg-marque-encre text-white">
      <div className="absolute inset-y-0 right-0 hidden w-[48%] md:block" aria-hidden>
        <img src={PHOTO} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-marque-encre via-marque-encre/75 to-marque-encre/20" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="max-w-xl">
          <h2 className="font-affiche text-4xl uppercase leading-none tracking-wide md:text-5xl">
            Vous voulez réserver ?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/85">
            Expliquez votre besoin ou appelez-nous. Le lieu, les dates et le prix de la location
            sont confirmés avant le paiement.
          </p>
          <p className="mt-3 text-sm text-white/75">
            <a href="tel:+24101123456" className="font-semibold text-white hover:underline">
              +241 01 12 34 56
            </a>
            {' · '}
            lundi au vendredi 8h–20h, week-end 9h–18h
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex bg-marque-500 px-6 py-3 text-sm font-bold text-ink-900 hover:bg-gold-400"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    </section>
  )
}
