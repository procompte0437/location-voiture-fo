import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CatalogProvider } from './context/CatalogContext'
import { HomePage } from './pages/HomePage'
import { SearchPage } from './pages/SearchPage'
import { VehicleDetailPage } from './pages/VehicleDetailPage'
import { LoginPage, RegisterPage } from './pages/auth/AuthPages'
import {
  ConfirmationPage,
  GuestBookingLookupPage,
  MyBookingsPage,
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
import { AdminReferentielPage } from './pages/admin/AdminReferentielPage'
import {
  AdminVehicleCreatePage,
  AdminVehicleDetailPage,
  AdminVehicleEditPage,
  AdminVehiclesPage,
} from './pages/admin/AdminVehiclesPages'
import { FaqPage } from './pages/MiscPages'

export default function App() {
  return (
    <AuthProvider>
      <CatalogProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recherche" element={<SearchPage />} />
          <Route path="/vehicules" element={<SearchPage />} />
          <Route path="/vehicules/:id" element={<VehicleDetailPage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/mes-reservations" element={<MyBookingsPage />} />
          <Route path="/mes-reservations/nouvelle" element={<PageNouvelleReservation />} />
          <Route path="/reservation/trouver" element={<GuestBookingLookupPage />} />
          <Route path="/confirmation/:id" element={<ConfirmationPage />} />
          <Route path="/devenir-partenaire" element={<PageDevenirPartenaire />} />
          <Route path="/partenaire/inscription" element={<PageInscriptionPartenaire />} />
          <Route path="/partenaire" element={<DispositionPartenaire />}>
            <Route index element={<PageAccueilPartenaire />} />
            <Route path="voitures" element={<PageMesVoitures />} />
            <Route path="voitures/nouvelle" element={<PageNouvelleVoiture />} />
            <Route path="referentiel" element={<PageReferentielPartenaire />} />
            <Route path="reservations" element={<PageMesReservations />} />
            <Route path="clients" element={<PageMesClients />} />
            <Route path="aide" element={<PageAidePartenaire />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="validation" element={<AdminValidationPage />} />
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
          </Route>
          <Route path="/faq" element={<FaqPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </CatalogProvider>
    </AuthProvider>
  )
}
