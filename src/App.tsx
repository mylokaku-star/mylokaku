import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import ProtectedRoute from './components/ProtectedRoute'
import RefreshButton from './components/RefreshButton'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import LupaPasswordPage from './pages/LupaPasswordPage'
import DashboardPage from './pages/DashboardPage'
import BuatTokoPage from './pages/BuatTokoPage'
import CariTokoPage from './pages/CariTokoPage'
import TambahProdukPage from './pages/TambahProdukPage'
import DetailTokoPage from './pages/DetailTokoPage'
import PetaPage from './pages/PetaPage'
import EditTokoPage from './pages/EditTokoPage'
import ProdukPage from './pages/ProdukPage'
import ProfilPage from './pages/ProfilPage'
import ChatPage from './pages/ChatPage'
import VerifikasiPage from './pages/VerifikasiPage'
import AdminPage from './pages/AdminPage'
import PusatBantuan from './pages/PusatBantuan'
import VerifikasiWA from './pages/VerifikasiWA'
import BuatPromoPage from './pages/BuatPromoPage'
import DetailPromoPage from './pages/DetailPromoPage'
import KeranjangPage from './pages/KeranjangPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <ScrollToTop />
      <RefreshButton />
      <Routes>
        {/* Bebas diakses */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lupa-password" element={<LupaPasswordPage />} />
        <Route path="/register" element={<Navigate to="/login?tab=daftar" replace />} />
        <Route path="/cari" element={<CariTokoPage />} />
        <Route path="/peta" element={<PetaPage />} />
        <Route path="/toko/:id" element={<DetailTokoPage />} />
        <Route path="/promo/:id" element={<DetailPromoPage />} />
        <Route path="/verifikasi-wa" element={<VerifikasiWA />} />
        <Route path="/preloved" element={<Navigate to="/cari?kategori=preloved" replace />} />

        {/* Redirect route lama ke route baru yang konsisten */}
        <Route path="/edit-toko/:id" element={<Navigate to="/edit-toko" replace />} />
        <Route path="/kelola-produk/:id" element={<Navigate to="/produk" replace />} />
        <Route path="/buat-promo/:id" element={<Navigate to="/buat-promo" replace />} />
        <Route path="/chat-list-penjual/:id" element={<Navigate to="/dashboard" replace />} />

        {/* Perlu login */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/buat-toko" element={<ProtectedRoute><BuatTokoPage /></ProtectedRoute>} />
        <Route path="/buat-promo" element={<ProtectedRoute><BuatPromoPage /></ProtectedRoute>} />
        <Route path="/tambah-produk" element={<ProtectedRoute><TambahProdukPage /></ProtectedRoute>} />
        <Route path="/edit-toko" element={<ProtectedRoute><EditTokoPage /></ProtectedRoute>} />
        <Route path="/produk" element={<ProtectedRoute><ProdukPage /></ProtectedRoute>} />
        <Route path="/profil" element={<ProtectedRoute><ProfilPage /></ProtectedRoute>} />
        <Route path="/chat/:tokoId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/verifikasi" element={<ProtectedRoute><VerifikasiPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/pusat-bantuan" element={<ProtectedRoute><PusatBantuan /></ProtectedRoute>} />
        <Route path="/keranjang" element={<ProtectedRoute><KeranjangPage /></ProtectedRoute>} />
      </Routes>
    </>
  )
}

export default App
