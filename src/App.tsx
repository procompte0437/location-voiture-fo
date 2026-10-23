import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CatalogProvider } from './context/CatalogContext'
import { HomePage } from './pages/HomePage'
import { SearchPage } from './pages/SearchPage'
import { VehicleDetailPage } from './pages/VehicleDetailPage'
import { LoginPage, PageMotDePasseOublie, PageReinitialiserMotDePasse, RegisterPage } from './pages/auth/AuthPages'
import {
  ConfirmationPage,
  MyBookingsPage,
  PageEspaceClient,
  PageNouvelleReservation,
} from './pages/client/BookingPages'
import { DispositionPartenaire } from './components/partenaire/CoquePartenaire'
import {
  PageAccueilPartenaire,
  PageAidePartenaire,
  PageDevenirPartenaire,
  PageInscriptionPartenaire,
  PageMesClients,
  PageMesReservations,
  PageMesVoitures,
  PageNouvelleVoiture,
  PageReferentielPartenaire,
} from './pages/partenaire/PagesPartenaire'
import {
  PageEntretiensPartenaire,
  PageEquipePartenaire,
  PageFinancesPartenaire,
} from './pages/partenaire/PagesCycleLoueur'
import {
  AdminAuditPage,
  AdminDashboardPage,
  AdminLayout,
  AdminValidationPage,
} from './pages/admin/AdminDashboardPage'
import {
  AdminAccountsPage,
  AdminBookingsPage,
  AdminFinancesPage,
  AdminLocationsPage,
} from './pages/admin/AdminManagePages'
import { AdminAgencesPage } from './pages/admin/AdminAgencesPage'
import { PageEvaluationPartenaires } from './pages/admin/PageEvaluationPartenaires'
import { AdminReferentielPage } from './pages/admin/AdminReferentielPage'
import {
  AdminVehicleCreatePage,
  AdminVehicleDetailPage,
  AdminVehicleEditPage,
  AdminVehiclesPage,
} from './pages/admin/AdminVehiclesPages'
import { FaqPage } from './pages/MiscPages'
import {
  PageCharteConfidentialite,
  PageConditionsGenerales,
  PageContact,
  PagePlanDuSite,
} from './pages/PagesInstitutionnelles'

/** Relance un fondu à chaque changement de page, pour que la navigation ne soit pas un saut. */
function PagesFluides() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="entree-page">
      <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/recherche" element={<SearchPage />} />
          <Route path="/vehicules" element={<SearchPage />} />
          <Route path="/vehicules/:id" element={<VehicleDetailPage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/mot-de-passe-oublie" element={<PageMotDePasseOublie />} />
          <Route path="/reinitialiser-mot-de-passe" element={<PageReinitialiserMotDePasse />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/mes-reservations" element={<MyBookingsPage />} />
          <Route path="/mes-reservations/nouvelle" element={<PageNouvelleReservation />} />
          <Route path="/mes-reservations/espace" element={<PageEspaceClient />} />
          <Route
            path="/reservation/trouver"
            element={<Navigate to="/connexion?redirect=%2Fmes-reservations" replace />}
          />
          <Route path="/confirmation/:id" element={<ConfirmationPage />} />
          <Route path="/devenir-partenaire" element={<PageDevenirPartenaire />} />
          <Route path="/partenaire/inscription" element={<PageInscriptionPartenaire />} />
          <Route path="/partenaire" element={<DispositionPartenaire />}>
            <Route index element={<PageAccueilPartenaire />} />
            <Route path="voitures" element={<PageMesVoitures />} />
            <Route path="voitures/nouvelle" element={<PageNouvelleVoiture />} />
            <Route path="referentiel" element={<PageReferentielPartenaire />} />
            <Route path="reservations" element={<PageMesReservations />} />
            <Route path="finances" element={<PageFinancesPartenaire />} />
            <Route path="entretiens" element={<PageEntretiensPartenaire />} />
            <Route path="equipe" element={<PageEquipePartenaire />} />
            <Route path="clients" element={<PageMesClients />} />
            <Route path="aide" element={<PageAidePartenaire />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="validation" element={<AdminValidationPage />} />
            <Route path="evaluation" element={<PageEvaluationPartenaires />} />
            <Route path="audit" element={<AdminAuditPage />} />
            <Route path="lieux" element={<AdminLocationsPage />} />
            <Route path="comptes" element={<AdminAccountsPage />} />
            <Route path="vehicules" element={<AdminVehiclesPage />} />
            <Route path="vehicules/nouveau" element={<AdminVehicleCreatePage />} />
            <Route path="vehicules/:id" element={<AdminVehicleDetailPage />} />
            <Route path="vehicules/:id/modifier" element={<AdminVehicleEditPage />} />
            <Route path="reservations" element={<AdminBookingsPage />} />
            <Route path="finances" element={<AdminFinancesPage />} />
            <Route path="referentiel" element={<AdminReferentielPage />} />
            <Route path="agences" element={<AdminAgencesPage />} />
          </Route>
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/charte-de-confidentialite" element={<PageCharteConfidentialite />} />
          <Route path="/conditions-generales" element={<PageConditionsGenerales />} />
          <Route path="/plan-du-site" element={<PagePlanDuSite />} />
          <Route path="/contact" element={<PageContact />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CatalogProvider>
      <BrowserRouter>
        <PagesFluides />
      </BrowserRouter>
      </CatalogProvider>
    </AuthProvider>
  )
}
