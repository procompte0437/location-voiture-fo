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
} from './pages/client/BookingPages'
import {
  BecomePartnerPage,
  PartnerDashboardPage,
  PartnerRegisterPage,
} from './pages/partner/PartnerPages'
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
          <Route path="/reservation/trouver" element={<GuestBookingLookupPage />} />
          <Route path="/confirmation/:id" element={<ConfirmationPage />} />
          <Route path="/devenir-partenaire" element={<BecomePartnerPage />} />
          <Route path="/partenaire/inscription" element={<PartnerRegisterPage />} />
          <Route path="/partenaire" element={<PartnerDashboardPage />} />
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
          </Route>
          <Route path="/faq" element={<FaqPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </CatalogProvider>
    </AuthProvider>
  )
}
