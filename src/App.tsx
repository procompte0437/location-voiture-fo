import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
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
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { FaqPage } from './pages/MiscPages'

export default function App() {
  return (
    <AuthProvider>
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
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
